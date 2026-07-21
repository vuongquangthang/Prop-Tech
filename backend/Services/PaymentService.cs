using backend.DTOs;
using backend.Data;
using backend.Models;
using backend.Repositories;
using backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;

namespace backend.Services;

public interface IPaymentService
{
    Task<InitiatePaymentResponseDto> InitiatePaymentAsync(InitTransactionDto dto, int userId);
    Task<PaymentCallbackResponseDto> ProcessPaymentCallbackAsync(PaymentCallbackDto dto);
    Task<ThanhToanDto?> GetPendingPaymentByInvoiceIdAsync(int invoiceId);
    Task CancelPaymentAsync(long transactionId, int userId);
}

public class PaymentService : IPaymentService
{
    private readonly IThanhToanRepository _thanhToanRepository;
    private readonly IHoaDonRepository _hoaDonRepository;
    private readonly IHopDongRepository _hopDongRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<PaymentService> _logger;
    private readonly IPayOSService _payOSService;
    private readonly IConfiguration _config;
    private readonly IVietQRService _vietQRService;
    private readonly ApplicationDbContext _context;

    public PaymentService(
        IThanhToanRepository thanhToanRepository,
        IHoaDonRepository hoaDonRepository,
        IHopDongRepository hopDongRepository,
        IRoomRepository roomRepository,
        IHubContext<NotificationHub> hubContext,
        ILogger<PaymentService> logger,
        IPayOSService payOSService,
        IConfiguration config,
        IVietQRService vietQRService,
        ApplicationDbContext context)
    {
        _thanhToanRepository = thanhToanRepository;
        _hoaDonRepository = hoaDonRepository;
        _hopDongRepository = hopDongRepository;
        _roomRepository = roomRepository;
        _hubContext = hubContext;
        _logger = logger;
        _payOSService = payOSService;
        _config = config;
        _vietQRService = vietQRService;
        _context = context;
    }

    public async Task<InitiatePaymentResponseDto> InitiatePaymentAsync(InitTransactionDto dto, int userId)
    {
        var invoiceId = (int)dto.InvoiceId;
        
        // Validate invoice exists
        var invoice = await _hoaDonRepository.GetByIdAsync(invoiceId);
        if (invoice == null)
        {
            throw new InvalidOperationException("Hóa đơn không tồn tại");
        }

        await EnsureResidentCanPayInvoiceAsync(invoice, userId);

        // Check if already paid
        if (invoice.Status == "Đã thanh toán")
        {
            throw new InvalidOperationException("Hóa đơn đã được thanh toán");
        }

        // Get existing payments for this invoice
        var existingPayments = await _thanhToanRepository.GetByInvoiceIdAsync(invoiceId);
        var paidAmount = existingPayments
            .Where(p => p.Status == "SUCCESS")
            .Sum(p => p.Amount);

        var remainingAmount = invoice.TotalAmount - paidAmount;

        // Validate payment amount
        if (dto.Amount <= 0)
        {
            throw new InvalidOperationException("Số tiền thanh toán phải lớn hơn 0");
        }

        // Check if there's already a pending payment - cancel it to create a fresh PayOS link
        var pendingPayment = existingPayments.FirstOrDefault(p => p.Status == "PENDING");
        if (pendingPayment != null)
        {
            pendingPayment.Status = "CANCELLED";
            _thanhToanRepository.Update(pendingPayment);
            await _thanhToanRepository.SaveChangesAsync();
        }

        // Generate unique orderCode for PayOS (millisecond timestamp)
        var orderCode = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        // Tạo link PayOS — PayOSService tự xử lý test mode (amount 5k vs thật)
        // và trả về RealAmount để lưu đúng vào ThanhToan
        var returnUrl = _config["PayOS:ReturnUrl"] ?? "proptech://payment/success";
        var cancelUrl = _config["PayOS:CancelUrl"] ?? "proptech://payment/cancel";
        PayOSCreateResult payosResult;
        try
        {
            payosResult = await _payOSService.CreatePaymentLinkAsync(orderCode, invoiceId, returnUrl, cancelUrl);
        }
        catch (Exception ex) when (CanFallbackToMockGateway(ex))
        {
            _logger.LogWarning(
                ex,
                "PayOS is not configured. Falling back to mock payment gateway for invoice {InvoiceId}, orderCode {OrderCode}",
                invoiceId,
                orderCode);

            var fallbackAmount = invoice.TotalAmount > int.MaxValue
                ? int.MaxValue
                : (int)Math.Round(invoice.TotalAmount, MidpointRounding.AwayFromZero);

            payosResult = new PayOSCreateResult(
                $"/payment/gateway?txn={orderCode}",
                "",
                invoice.TotalAmount,
                fallbackAmount,
                "",
                "",
                "",
                $"Thanh toan HD #{invoiceId}"
            );
        }

        // Create new pending transaction - lưu số tiền THỰC (RealAmount) để đối soát
        var transactionCode = orderCode.ToString();
        var transaction = new ThanhToan
        {
            InvoiceId = invoiceId,
            Amount = payosResult.RealAmount,   // số tiền thực, không phải test amount
            PaymentType = dto.PaymentMethod ?? "QR",
            TransactionCode = transactionCode,
            TransferDescription = payosResult.Description,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow,
            PaidAt = null
        };

        await _thanhToanRepository.AddAsync(transaction);
        await _thanhToanRepository.SaveChangesAsync();

        // Get contract and room info for notification
        var contract = await _hopDongRepository.GetWithDetailsAsync(invoice.ContractId);
        var room = contract?.Room;
        var ownerUserId = room?.Floor?.Building?.OwnerUserId;

        // Send SignalR notification - Payment initiated
        try
        {
            if (ownerUserId.HasValue)
            {
                await _hubContext.Clients.Group(NotificationHub.OwnerGroup(ownerUserId.Value)).SendAsync("PaymentInitiated", new
                {
                    transactionId = transaction.Id,
                    transactionCode = transaction.TransactionCode,
                    invoiceId = invoice.Id,
                    month = invoice.Month,
                    year = invoice.Year,
                    roomCode = room?.RoomCode,
                    amount = transaction.Amount,
                    status = "PENDING"
                });
            }
            _logger.LogInformation("💰 PayOS payment initiated: {TransactionCode} for invoice {InvoiceId}", transactionCode, invoice.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("⚠️  Failed to send SignalR notification: {Error}", ex.Message);
        }

        // Gọi VietQR song song: lấy tên/logo ngân hàng + tạo ảnh QR đẹp
        var bankInfoTask = _vietQRService.GetBankInfoByBinAsync(payosResult.Bin);
        var vietQrTask   = _vietQRService.GenerateQRDataUrlAsync(
            payosResult.AccountNumber,
            payosResult.AccountName,
            payosResult.Bin,
            payosResult.PaymentAmount,
            payosResult.Description);

        await Task.WhenAll(bankInfoTask, vietQrTask);

        var bankInfo  = bankInfoTask.Result;
        var qrDataUrl = vietQrTask.Result;

        return new InitiatePaymentResponseDto
        {
            TransactionId       = transaction.Id,
            TransactionCode     = transactionCode,
            Status              = "PENDING",
            Amount              = payosResult.PaymentAmount,
            // Dùng ảnh QR từ VietQR (có logo ngân hàng), fallback về QrCode của PayOS
            QrCodeUrl           = !string.IsNullOrEmpty(qrDataUrl) ? qrDataUrl : payosResult.QrCode,
            PaymentUrl          = payosResult.CheckoutUrl,
            CheckoutUrl         = payosResult.CheckoutUrl,
            BankAccountNumber   = payosResult.AccountNumber,
            BankAccountName     = payosResult.AccountName,
            BankBin             = payosResult.Bin,
            TransferDescription = payosResult.Description,
            BankName            = bankInfo?.ShortName ?? "",
            BankLogoUrl         = bankInfo?.Logo ?? ""
        };
    }

    private bool CanFallbackToMockGateway(Exception ex)
    {
        if (!_config.GetValue<bool>("PayOS:IsTestMode"))
        {
            return false;
        }

        var message = ex.Message;
        return message.Contains("Key cannot be null or empty", StringComparison.OrdinalIgnoreCase)
            || message.Contains("Chưa cấu hình PayOS", StringComparison.OrdinalIgnoreCase)
            || message.Contains("ChecksumKey", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<PaymentCallbackResponseDto> ProcessPaymentCallbackAsync(PaymentCallbackDto dto)
    {
        // Find transaction by code
        var transaction = await _thanhToanRepository.FirstOrDefaultAsync(t => t.TransactionCode == dto.TransactionCode);
        if (transaction == null)
        {
            throw new InvalidOperationException("Giao dịch không tồn tại");
        }

        // Prevent reprocessing
        if (transaction.Status != "PENDING")
        {
            return new PaymentCallbackResponseDto
            {
                Success = true,
                Message = $"Giao dịch đã được xử lý trước đó với trạng thái {transaction.Status}",
                InvoiceStatus = null
            };
        }

        // Update transaction status
        transaction.Status = dto.Status;
        if (dto.Status == "SUCCESS")
        {
            if (dto.PaidAmount.HasValue && dto.PaidAmount.Value > 0)
            {
                transaction.Amount = dto.PaidAmount.Value;
            }
            transaction.PaidAt = dto.PaidAt ?? DateTime.UtcNow;
        }

        _thanhToanRepository.Update(transaction);

        // Update invoice status if payment successful
        string? invoiceStatus = null;
        if (dto.Status == "SUCCESS" && transaction.InvoiceId.HasValue)
        {
            var invoice = await _hoaDonRepository.GetByIdAsync(transaction.InvoiceId.Value);
            if (invoice != null)
            {
                // Calculate total paid amount
                var paidAmount = transaction.Amount;
                var totalPaidBeforeThisTransaction = await _context.ThanhToans
                    .Where(payment =>
                        payment.Id != transaction.Id
                        && payment.InvoiceId == invoice.Id
                        && payment.Status == "SUCCESS")
                    .SumAsync(payment => (decimal?)payment.Amount) ?? 0;

                var totalPaid = totalPaidBeforeThisTransaction + paidAmount;

                if (totalPaid >= invoice.TotalAmount)
                {
                    invoice.Status = "Đã thanh toán";
                    invoiceStatus = "Đã thanh toán";
                    var includesContractDeposit = await _context.ChiTietHoaDons
                        .AnyAsync(item =>
                            item.InvoiceId == invoice.Id &&
                            item.ItemType == "PhatSinh" &&
                            item.Description != null &&
                            item.Description.StartsWith("Tiền cọc hợp đồng"));
                    if (includesContractDeposit)
                    {
                        var contractWithDeposit = await _context.HopDongs.FindAsync(invoice.ContractId);
                        if (contractWithDeposit != null)
                        {
                            contractWithDeposit.DepositPaid = true;
                        }
                    }
                }
                else if (totalPaid > 0)
                {
                    invoice.Status = "Đã thanh toán một phần";
                    invoiceStatus = "Đã thanh toán một phần";
                }

                _hoaDonRepository.Update(invoice);
            }
        }

        await _thanhToanRepository.SaveChangesAsync();

        // Reload transaction to get navigation properties
        var updatedTransaction = await _thanhToanRepository.GetByIdAsync(transaction.Id);
        var invoice2 = updatedTransaction?.InvoiceId.HasValue == true 
            ? await _hoaDonRepository.GetByIdAsync(updatedTransaction.InvoiceId.Value) 
            : null;
        var contract = invoice2 != null ? await _hopDongRepository.GetWithDetailsAsync(invoice2.ContractId) : null;
        var room = contract?.Room;
        var ownerUserId = room?.Floor?.Building?.OwnerUserId;

        // Send SignalR notification based on payment result
        try
        {
            var eventName = dto.Status == "SUCCESS" ? "PaymentSuccess" : "PaymentFailed";
            if (ownerUserId.HasValue)
            {
                await _hubContext.Clients.Group(NotificationHub.OwnerGroup(ownerUserId.Value)).SendAsync(eventName, new
                {
                    transactionId = transaction.Id,
                    transactionCode = transaction.TransactionCode,
                    invoiceId = invoice2?.Id,
                    month = invoice2?.Month,
                    year = invoice2?.Year,
                    roomCode = room?.RoomCode,
                    amount = transaction.Amount,
                    status = dto.Status,
                    invoiceStatus = invoiceStatus,
                    paidAt = transaction.PaidAt,
                    gatewayResponse = dto.GatewayResponse
                });
            }
            _logger.LogInformation($"💳 Payment {dto.Status}: {dto.TransactionCode}");
        }
        catch (Exception ex)
        {
            _logger.LogWarning($"⚠️  Failed to send SignalR notification: {ex.Message}");
        }

        return new PaymentCallbackResponseDto
        {
            Success = true,
            Message = dto.Status == "SUCCESS" ? "Thanh toán thành công" : "Thanh toán thất bại",
            InvoiceStatus = invoiceStatus
        };
    }

    public async Task<ThanhToanDto?> GetPendingPaymentByInvoiceIdAsync(int invoiceId)
    {
        var payments = await _thanhToanRepository.GetByInvoiceIdAsync(invoiceId);
        var pending = payments.FirstOrDefault(p => p.Status == "PENDING");
        
        if (pending == null) return null;

        var invoice = await _hoaDonRepository.GetByIdAsync(invoiceId);
        return new ThanhToanDto
        {
            Id = pending.Id,
            InvoiceId = pending.InvoiceId,
            Amount = pending.Amount,
            PaymentType = pending.PaymentType,
            TransactionCode = pending.TransactionCode,
            TransferDescription = pending.TransferDescription,
            Status = pending.Status,
            CreatedAt = pending.CreatedAt,
            PaidAt = pending.PaidAt,
            InvoiceReference = invoice != null ? $"{invoice.Month:D2}/{invoice.Year}" : null
        };
    }

    public async Task CancelPaymentAsync(long transactionId, int userId)
    {
        var transaction = await _thanhToanRepository.GetByIdAsync(transactionId);
        if (transaction == null)
        {
            throw new InvalidOperationException("Giao dịch không tồn tại");
        }

        if (transaction.Status != "PENDING")
        {
            throw new InvalidOperationException("Chỉ có thể hủy giao dịch đang chờ");
        }

        if (transaction.InvoiceId.HasValue)
        {
            var invoice = await _hoaDonRepository.GetByIdAsync(transaction.InvoiceId.Value);
            if (invoice != null)
            {
                await EnsureResidentCanPayInvoiceAsync(invoice, userId);
            }
        }

        transaction.Status = "FAILED";
        _thanhToanRepository.Update(transaction);
        await _thanhToanRepository.SaveChangesAsync();

        _logger.LogInformation($"❌ Payment cancelled: {transaction.TransactionCode}");
    }

    private async Task EnsureResidentCanPayInvoiceAsync(HoaDon invoice, int userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new InvalidOperationException("Không xác định được tài khoản thanh toán");
        }

        if (!string.Equals(user.Role, "CuDan", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (!user.ResidentId.HasValue)
        {
            throw new InvalidOperationException("Tài khoản cư dân chưa được gắn với hồ sơ cư dân");
        }

        var now = DateTime.UtcNow;
        var residency = await _context.ChiTietOs
            .AsNoTracking()
            .Where(ct => ct.ContractId == invoice.ContractId
                && ct.ResidentId == user.ResidentId.Value
                && ct.FromDate <= now
                && (ct.ToDate == null || ct.ToDate >= now.Date))
            .OrderByDescending(ct => ct.ToDate == null)
            .FirstOrDefaultAsync();

        if (residency == null)
        {
            throw new InvalidOperationException("Bạn không thuộc hợp đồng của hóa đơn này");
        }

        if (!IsPrimaryResidentRole(residency.ResidencyRole))
        {
            throw new InvalidOperationException("Chỉ chủ hộ/người thuê chính được thanh toán hóa đơn. Thành viên cần được chủ hộ hoặc chủ nhà xử lý.");
        }
    }

    private static bool IsPrimaryResidentRole(string? role)
    {
        var normalized = RemoveDiacritics(role).ToLowerInvariant();
        return normalized.Contains("nguoi thue chinh")
            || normalized.Contains("chu ho")
            || normalized.Contains("chu phong")
            || normalized.Contains("primary")
            || normalized.Contains("owner");
    }

    private static string RemoveDiacritics(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    /// <summary>
}
