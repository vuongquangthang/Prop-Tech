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

    /// <summary>Doi soat webhook SePay: khop (TK nhan -> Owner) + (ma HD trong noi dung) + so tien -> Paid.</summary>
    Task<PaymentCallbackResponseDto> ConfirmByWebhookAsync(SePayWebhookDto webhook);

    /// <summary>MOCK demo: danh dau hoa don da tra (khong can tien that). Van di qua doi soat Owner + so tien.</summary>
    Task<PaymentCallbackResponseDto> ConfirmMockAsync(int invoiceId);
}

public class PaymentService : IPaymentService
{
    private readonly IThanhToanRepository _thanhToanRepository;
    private readonly IHoaDonRepository _hoaDonRepository;
    private readonly IHopDongRepository _hopDongRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<PaymentService> _logger;
    private readonly IConfiguration _config;
    private readonly IVietQRService _vietQRService;
    private readonly IPaymentAccountRepository _paymentAccountRepository;
    private readonly ApplicationDbContext _context;

    // Tien to noi dung chuyen khoan de nhan dien hoa don: HD{maHoaDon}, vd HD1001.
    private const string TransferPrefix = "HD";

    public PaymentService(
        IThanhToanRepository thanhToanRepository,
        IHoaDonRepository hoaDonRepository,
        IHopDongRepository hopDongRepository,
        IRoomRepository roomRepository,
        IHubContext<NotificationHub> hubContext,
        ILogger<PaymentService> logger,
        IConfiguration config,
        IVietQRService vietQRService,
        IPaymentAccountRepository paymentAccountRepository,
        ApplicationDbContext context)
    {
        _thanhToanRepository = thanhToanRepository;
        _hoaDonRepository = hoaDonRepository;
        _hopDongRepository = hopDongRepository;
        _roomRepository = roomRepository;
        _hubContext = hubContext;
        _logger = logger;
        _config = config;
        _vietQRService = vietQRService;
        _paymentAccountRepository = paymentAccountRepository;
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

        // === MULTI-OWNER: xac dinh Owner so huu hoa don -> lay TK nhan tien cua Owner do ===
        var contract = await _hopDongRepository.GetWithDetailsAsync(invoice.ContractId);
        var room = contract?.Room;
        var ownerUserId = room?.Floor?.Building?.OwnerUserId;
        if (!ownerUserId.HasValue)
        {
            throw new InvalidOperationException("Không xác định được chủ nhà của hóa đơn này");
        }

        var paymentAccount = await _paymentAccountRepository.GetActiveByOwnerAsync(ownerUserId.Value);
        if (paymentAccount == null)
        {
            throw new InvalidOperationException(
                "Chủ nhà chưa cấu hình tài khoản nhận tiền. Vui lòng liên hệ chủ nhà/quản lý.");
        }

        // Noi dung CK duy nhat de doi soat: HD{maHoaDon}. Tien di THANG vao TK Owner.
        var transferDescription = $"{TransferPrefix}{invoiceId}";
        var transactionCode = transferDescription; // dung ma HD lam transaction code (duy nhat theo hoa don)

        // Create new pending transaction (so tien thuc te cua hoa don)
        var transaction = new ThanhToan
        {
            InvoiceId = invoiceId,
            Amount = invoice.TotalAmount,
            PaymentType = dto.PaymentMethod ?? "QR",
            TransactionCode = transactionCode,
            TransferDescription = transferDescription,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow,
            PaidAt = null
        };

        await _thanhToanRepository.AddAsync(transaction);
        await _thanhToanRepository.SaveChangesAsync();

        // Send SignalR notification - Payment initiated
        try
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
            _logger.LogInformation("💰 Payment initiated (owner {Owner}): {TransactionCode} for invoice {InvoiceId}",
                ownerUserId.Value, transactionCode, invoice.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("⚠️  Failed to send SignalR notification: {Error}", ex.Message);
        }

        // Sinh QR VietQR tro TK cua Owner + noi dung HD{id}. Chay song song lay logo ngan hang.
        var amountInt = (int)invoice.TotalAmount;
        var bankInfoTask = _vietQRService.GetBankInfoByBinAsync(paymentAccount.BankBin);
        var vietQrTask   = _vietQRService.GenerateQRDataUrlAsync(
            paymentAccount.BankAccountNo,
            paymentAccount.AccountHolder,
            paymentAccount.BankBin,
            amountInt,
            transferDescription);

        await Task.WhenAll(bankInfoTask, vietQrTask);

        var bankInfo  = bankInfoTask.Result;
        var qrDataUrl = vietQrTask.Result;

        return new InitiatePaymentResponseDto
        {
            TransactionId       = transaction.Id,
            TransactionCode     = transactionCode,
            Status              = "PENDING",
            Amount              = amountInt,
            QrCodeUrl           = qrDataUrl,
            PaymentUrl          = "",
            CheckoutUrl         = "",
            BankAccountNumber   = paymentAccount.BankAccountNo,
            BankAccountName     = paymentAccount.AccountHolder,
            BankBin             = paymentAccount.BankBin,
            TransferDescription = transferDescription,
            BankName            = bankInfo?.ShortName ?? paymentAccount.BankName ?? "",
            BankLogoUrl         = bankInfo?.Logo ?? ""
        };
    }

    public async Task<PaymentCallbackResponseDto> ProcessPaymentCallbackAsync(PaymentCallbackDto dto)
    {
        // Find transaction by code. Co the co NHIEU transaction cung ma (vd bam thanh toan
        // nhieu lan -> cai cu CANCELLED, cai moi PENDING). Uu tien PENDING de xu ly dung cai
        // dang cho, tranh bat nham cai da CANCELLED.
        var transaction = await _thanhToanRepository.FirstOrDefaultAsync(
                t => t.TransactionCode == dto.TransactionCode && t.Status == "PENDING")
            ?? await _thanhToanRepository.FirstOrDefaultAsync(t => t.TransactionCode == dto.TransactionCode);
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
                var allPayments = await _thanhToanRepository.GetByInvoiceIdAsync(invoice.Id);
                var totalPaid = allPayments
                    .Where(p => p.Status == "SUCCESS" || (p.Id == transaction.Id && dto.Status == "SUCCESS"))
                    .Sum(p => p.Amount);

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
            var payload = new
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
            };

            // 1) Bao cho CHU NHA (dashboard).
            if (ownerUserId.HasValue)
            {
                await _hubContext.Clients.Group(NotificationHub.OwnerGroup(ownerUserId.Value))
                    .SendAsync(eventName, payload);
            }

            // 2) Bao cho CU DAN dang tra hoa don (app mobile tu cap nhat trang thai).
            //    Lay tat ca user gan voi cac cu dan trong hop dong.
            if (invoice2 != null)
            {
                var residentIds = await _context.ChiTietOs
                    .Where(ct => ct.ContractId == invoice2.ContractId)
                    .Select(ct => ct.ResidentId)
                    .Distinct()
                    .ToListAsync();
                if (residentIds.Count > 0)
                {
                    var residentUserIds = await _context.Users
                        .Where(u => u.ResidentId.HasValue && residentIds.Contains(u.ResidentId.Value))
                        .Select(u => u.Id)
                        .ToListAsync();
                    foreach (var uid in residentUserIds)
                    {
                        await _hubContext.Clients.Group(NotificationHub.UserGroup(uid))
                            .SendAsync(eventName, payload);
                    }
                }
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
            throw new InvalidOperationException("Chỉ cư dân đại diện/người thuê chính được thanh toán hóa đơn. Thành viên cần được cư dân đại diện hoặc chủ nhà xử lý.");
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

    // ===================== DOI SOAT MULTI-OWNER =====================

    public async Task<PaymentCallbackResponseDto> ConfirmByWebhookAsync(SePayWebhookDto webhook)
    {
        // 1) Chi xu ly tien VAO.
        if (!string.IsNullOrEmpty(webhook.TransferType) &&
            !webhook.TransferType.Equals("in", StringComparison.OrdinalIgnoreCase))
        {
            return new PaymentCallbackResponseDto { Success = false, Message = "Bỏ qua giao dịch không phải tiền vào" };
        }

        // 2) Tach ma hoa don tu noi dung CK: tim "HD{so}".
        var content = $"{webhook.Content} {webhook.Code} {webhook.Description}";
        var invoiceId = ExtractInvoiceId(content);
        if (invoiceId == null)
        {
            _logger.LogWarning("Webhook SePay: khong tim thay ma HD trong noi dung '{Content}'", content);
            return new PaymentCallbackResponseDto { Success = false, Message = "Không tìm thấy mã hóa đơn trong nội dung chuyển khoản" };
        }

        // 3) Xac dinh Owner tu TK nhan tien -> doi chieu voi Owner so huu hoa don.
        var invoice = await _hoaDonRepository.GetByIdAsync(invoiceId.Value);
        if (invoice == null)
        {
            return new PaymentCallbackResponseDto { Success = false, Message = $"Hóa đơn #{invoiceId} không tồn tại" };
        }

        var contract = await _hopDongRepository.GetWithDetailsAsync(invoice.ContractId);
        var ownerOfInvoice = contract?.Room?.Floor?.Building?.OwnerUserId;

        // Doi chieu TK nhan (neu tim thay trong DB). Voi BIDV dung VA (tai khoan ao),
        // so accountNumber webhook gui co the la so VA dong -> khong co trong DB.
        // Truong hop do KHONG chan (da co ma HD + so tien de doi soat), chi log.
        if (!string.IsNullOrWhiteSpace(webhook.AccountNumber))
        {
            var receivingAccount = await _paymentAccountRepository
                .GetByBankAccountAsync(string.Empty, webhook.AccountNumber);
            if (receivingAccount == null)
            {
                // TK/VA khong khop DB -> khong chan, dua vao ma HD + so tien.
                _logger.LogWarning("Webhook SePay: TK/VA nhan {Acc} khong co trong DB (co the la VA dong) - van xu ly theo ma HD",
                    webhook.AccountNumber);
            }
            else if (ownerOfInvoice.HasValue && receivingAccount.OwnerUserId != ownerOfInvoice.Value)
            {
                // Tim thay account nhung khac Owner so huu hoa don -> chan (chong tra nham).
                _logger.LogWarning("Webhook SePay: TK nhan thuoc Owner {A} nhung hoa don thuoc Owner {B}",
                    receivingAccount.OwnerUserId, ownerOfInvoice);
                return new PaymentCallbackResponseDto { Success = false, Message = "Tài khoản nhận không khớp chủ nhà của hóa đơn" };
            }
        }

        // 4) Doi chieu so tien (webhook >= so tien hoa don thi coi la du).
        if (webhook.TransferAmount.HasValue && webhook.TransferAmount.Value + 0.5m < invoice.TotalAmount)
        {
            _logger.LogWarning("Webhook SePay: so tien {Paid} < hoa don {Total}", webhook.TransferAmount, invoice.TotalAmount);
            // Van cho ProcessPaymentCallbackAsync xu ly (co the "thanh toan mot phan").
        }

        // 5) Da khop -> danh dau da tra qua luong callback co san.
        return await ProcessPaymentCallbackAsync(new PaymentCallbackDto
        {
            TransactionCode = $"{TransferPrefix}{invoiceId}",
            Status = "SUCCESS",
            PaidAt = DateTime.UtcNow,
            GatewayResponse = $"SePay ref={webhook.ReferenceCode}"
        });
    }

    public async Task<PaymentCallbackResponseDto> ConfirmMockAsync(int invoiceId)
    {
        var invoice = await _hoaDonRepository.GetByIdAsync(invoiceId);
        if (invoice == null)
        {
            return new PaymentCallbackResponseDto { Success = false, Message = $"Hóa đơn #{invoiceId} không tồn tại" };
        }
        _logger.LogInformation("🧪 MOCK payment cho hoa don {InvoiceId}", invoiceId);
        return await ProcessPaymentCallbackAsync(new PaymentCallbackDto
        {
            TransactionCode = $"{TransferPrefix}{invoiceId}",
            Status = "SUCCESS",
            PaidAt = DateTime.UtcNow,
            GatewayResponse = "MOCK payment (demo)"
        });
    }

    /// <summary>Tach ma hoa don tu chuoi noi dung CK: tim mau "HD" + so.</summary>
    private static int? ExtractInvoiceId(string? content)
    {
        if (string.IsNullOrWhiteSpace(content)) return null;
        var match = System.Text.RegularExpressions.Regex.Match(
            content, @"HD\s*0*(\d+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (match.Success && int.TryParse(match.Groups[1].Value, out var id)) return id;
        return null;
    }
}
