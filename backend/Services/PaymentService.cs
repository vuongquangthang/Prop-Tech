using backend.DTOs;
using backend.Models;
using backend.Repositories;
using backend.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;

namespace backend.Services;

public interface IPaymentService
{
    Task<InitiatePaymentResponseDto> InitiatePaymentAsync(InitTransactionDto dto, int userId);
    Task<PaymentCallbackResponseDto> ProcessPaymentCallbackAsync(PaymentCallbackDto dto);
    Task<ThanhToanDto?> GetPendingPaymentByInvoiceIdAsync(int invoiceId);
    Task CancelPaymentAsync(long transactionId);
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

    public PaymentService(
        IThanhToanRepository thanhToanRepository,
        IHoaDonRepository hoaDonRepository,
        IHopDongRepository hopDongRepository,
        IRoomRepository roomRepository,
        IHubContext<NotificationHub> hubContext,
        ILogger<PaymentService> logger,
        IPayOSService payOSService,
        IConfiguration config)
    {
        _thanhToanRepository = thanhToanRepository;
        _hoaDonRepository = hoaDonRepository;
        _hopDongRepository = hopDongRepository;
        _roomRepository = roomRepository;
        _hubContext = hubContext;
        _logger = logger;
        _payOSService = payOSService;
        _config = config;
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
        var payosResult = await _payOSService.CreatePaymentLinkAsync(orderCode, invoiceId, returnUrl, cancelUrl);

        // Create new pending transaction - lưu số tiền THỰC (RealAmount) để đối soát
        var transactionCode = orderCode.ToString();
        var transaction = new ThanhToan
        {
            InvoiceId = invoiceId,
            Amount = payosResult.RealAmount,   // số tiền thực, không phải test amount
            PaymentType = dto.PaymentMethod ?? "QR",
            TransactionCode = transactionCode,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow,
            PaidAt = null
        };

        await _thanhToanRepository.AddAsync(transaction);
        await _thanhToanRepository.SaveChangesAsync();

        // Get contract and room info for notification
        var contract = await _hopDongRepository.GetByIdAsync(invoice.ContractId);
        var room = contract != null ? await _roomRepository.GetByIdAsync(contract.RoomId) : null;

        // Send SignalR notification - Payment initiated
        try
        {
            await _hubContext.Clients.All.SendAsync("PaymentInitiated", new
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
            _logger.LogInformation("💰 PayOS payment initiated: {TransactionCode} for invoice {InvoiceId}", transactionCode, invoice.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("⚠️  Failed to send SignalR notification: {Error}", ex.Message);
        }

        return new InitiatePaymentResponseDto
        {
            TransactionId = transaction.Id,
            TransactionCode = transactionCode,
            Status = "PENDING",
            Amount = payosResult.RealAmount,   // hiển thị số tiền thực cho app
            QrCodeUrl = payosResult.QrCode,
            PaymentUrl = payosResult.CheckoutUrl,
            CheckoutUrl = payosResult.CheckoutUrl
        };
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
        var contract = invoice2 != null ? await _hopDongRepository.GetByIdAsync(invoice2.ContractId) : null;
        var room = contract != null ? await _roomRepository.GetByIdAsync(contract.RoomId) : null;

        // Send SignalR notification based on payment result
        try
        {
            var eventName = dto.Status == "SUCCESS" ? "PaymentSuccess" : "PaymentFailed";
            await _hubContext.Clients.All.SendAsync(eventName, new
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
            Status = pending.Status,
            CreatedAt = pending.CreatedAt,
            PaidAt = pending.PaidAt,
            InvoiceReference = invoice != null ? $"{invoice.Month:D2}/{invoice.Year}" : null
        };
    }

    public async Task CancelPaymentAsync(long transactionId)
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

        transaction.Status = "FAILED";
        _thanhToanRepository.Update(transaction);
        await _thanhToanRepository.SaveChangesAsync();

        _logger.LogInformation($"❌ Payment cancelled: {transaction.TransactionCode}");
    }

    /// <summary>
}
