using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface ITransactionService
{
    Task<TransactionDto?> GetByIdAsync(long id);
    Task<TransactionDetailDto?> GetDetailAsync(long id);
    Task<TransactionDto?> GetByTransactionCodeAsync(string transactionCode);
    Task<List<TransactionDto>> GetByInvoiceAsync(long invoiceId);
    Task<List<TransactionDto>> GetByRoomAsync(long roomId);
    Task<TransactionDto> InitTransactionAsync(InitTransactionDto dto, long createdBy);
    Task<TransactionReceiptDto> ProcessCallbackAsync(PaymentCallbackDto dto);
    Task<TransactionReceiptDto> GetReceiptAsync(long transactionId);
}

public class TransactionService : ITransactionService
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly ILogger<TransactionService> _logger;

    public TransactionService(
        ITransactionRepository transactionRepository,
        IInvoiceRepository invoiceRepository,
        ILogger<TransactionService> logger)
    {
        _transactionRepository = transactionRepository;
        _invoiceRepository = invoiceRepository;
        _logger = logger;
    }

    public async Task<TransactionDto?> GetByIdAsync(long id)
    {
        var transaction = await _transactionRepository.GetByIdAsync(id);
        return transaction == null ? null : MapToDto(transaction);
    }

    public async Task<TransactionDetailDto?> GetDetailAsync(long id)
    {
        var transaction = await _transactionRepository.GetWithDetailsAsync(id);
        return transaction == null ? null : MapToDetailDto(transaction);
    }

    public async Task<TransactionDto?> GetByTransactionCodeAsync(string transactionCode)
    {
        var transaction = await _transactionRepository.GetByTransactionCodeAsync(transactionCode);
        return transaction == null ? null : MapToDto(transaction);
    }

    public async Task<List<TransactionDto>> GetByInvoiceAsync(long invoiceId)
    {
        var transactions = await _transactionRepository.GetByInvoiceAsync(invoiceId);
        return transactions.Select(MapToDto).ToList();
    }

    public async Task<List<TransactionDto>> GetByRoomAsync(long roomId)
    {
        var transactions = await _transactionRepository.GetByRoomAsync(roomId);
        return transactions.Select(MapToDto).ToList();
    }

    public async Task<TransactionDto> InitTransactionAsync(InitTransactionDto dto, long createdBy)
    {
        // Validate invoice exists
        var invoice = await _invoiceRepository.GetByIdAsync(dto.InvoiceId);
        if (invoice == null)
        {
            throw new InvalidOperationException("Không tìm thấy hóa đơn");
        }

        if (invoice.Status == "VOIDED")
        {
            throw new InvalidOperationException("Không thể thanh toán hóa đơn đã hủy");
        }

        if (dto.Amount <= 0)
        {
            throw new InvalidOperationException("Số tiền thanh toán phải lớn hơn 0");
        }

        var remainingBalance = invoice.TotalAmount - invoice.PaidAmount;
        if (dto.Amount > remainingBalance)
        {
            throw new InvalidOperationException($"Số tiền thanh toán vượt quá số còn lại ({remainingBalance:N0} VND)");
        }

        // Generate unique transaction code (idempotent check)
        string transactionCode;
        int attempt = 0;
        do
        {
            transactionCode = GenerateTransactionCode(invoice.InvoiceNumber);
            attempt++;
            if (attempt > 10)
            {
                throw new InvalidOperationException("Không thể tạo mã giao dịch duy nhất");
            }
        }
        while (await _transactionRepository.TransactionCodeExistsAsync(transactionCode));

        var transaction = new Transaction
        {
            TransactionCode = transactionCode,
            InvoiceId = dto.InvoiceId,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            PaymentDate = DateTime.UtcNow,
            Status = "PENDING",
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        await _transactionRepository.AddAsync(transaction);
        await _transactionRepository.SaveChangesAsync();

        return MapToDto(transaction);
    }

    public async Task<TransactionReceiptDto> ProcessCallbackAsync(PaymentCallbackDto dto)
    {
        var transaction = await _transactionRepository.GetByTransactionCodeAsync(dto.TransactionCode);
        if (transaction == null)
        {
            throw new InvalidOperationException("Không tìm thấy giao dịch");
        }

        if (transaction.Status != "PENDING")
        {
            throw new InvalidOperationException($"Giao dịch đã được xử lý với trạng thái: {transaction.Status}");
        }

        var invoice = await _invoiceRepository.GetWithDetailsAsync(transaction.InvoiceId);
        if (invoice == null)
        {
            throw new InvalidOperationException("Không tìm thấy hóa đơn");
        }

        // Update transaction status
        transaction.Status = dto.Status;
        transaction.GatewayReference = dto.GatewayTransactionId;
        transaction.GatewayResponse = dto.GatewayResponse;
        transaction.PaymentDate = dto.PaidAt ?? DateTime.UtcNow;

        if (dto.Status == "SUCCESS")
        {
            // Update invoice paid amount
            invoice.PaidAmount += transaction.Amount;

            // Update invoice status if fully paid
            if (invoice.PaidAmount >= invoice.TotalAmount)
            {
                invoice.Status = "PAID";
                invoice.PaidAt = transaction.PaymentDate;
            }
            else
            {
                invoice.Status = "PARTIAL";
            }

            _invoiceRepository.Update(invoice);
        }

        _transactionRepository.Update(transaction);
        await _transactionRepository.SaveChangesAsync();

        return await GetReceiptAsync(transaction.Id);
    }

    public async Task<TransactionReceiptDto> GetReceiptAsync(long transactionId)
    {
        var transaction = await _transactionRepository.GetWithDetailsAsync(transactionId);
        if (transaction == null)
        {
            throw new InvalidOperationException("Không tìm thấy giao dịch");
        }

        var invoice = await _invoiceRepository.GetWithDetailsAsync(transaction.InvoiceId);
        if (invoice == null)
        {
            throw new InvalidOperationException("Không tìm thấy hóa đơn");
        }

        var invoiceDto = new InvoiceDetailDto
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            BillingPeriodId = invoice.BillingPeriodId,
            RoomId = invoice.RoomId,
            RoomCode = invoice.Room?.RoomCode ?? "",
            Headcount = invoice.Headcount ?? 0,
            RoomCharge = invoice.RoomCharge ?? 0,
            WaterCharge = invoice.WaterCharge ?? 0,
            ElectricityCharge = invoice.ElectricityCharge ?? 0,
            ServiceCharge = invoice.ServiceCharge ?? 0,
            AdjustmentAmount = invoice.AdjustmentAmount ?? 0,
            AdjustmentNote = invoice.AdjustmentNote,
            LateFee = invoice.LateFee ?? 0,
            TotalAmount = invoice.TotalAmount,
            PaidAmount = invoice.PaidAmount,
            Status = invoice.Status,
            IssueDate = invoice.IssueDate,
            DueDate = invoice.DueDate,
            ConfirmedAt = invoice.ConfirmedAt,
            PaidAt = invoice.PaidAt,
            VoidReason = invoice.VoidReason,
            CreatedAt = invoice.CreatedAt,
            SnapshotRoomRent = invoice.SnapshotRoomRent,
            SnapshotWaterPrice = invoice.SnapshotWaterPrice,
            SnapshotElectricityPrice = invoice.SnapshotElectricityPrice,
            SnapshotServicePrice = invoice.SnapshotServicePrice,
            LineItems = invoice.LineItems?.Select(l => new InvoiceLineItemDto
            {
                Id = l.Id,
                ItemType = l.ItemType,
                Description = l.Description,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                Amount = l.Amount,
                TierInfo = l.TierInfo
            }).ToList() ?? new()
        };

        return new TransactionReceiptDto
        {
            Transaction = MapToDto(transaction),
            Invoice = invoiceDto,
            RemainingBalance = invoice.TotalAmount - invoice.PaidAmount
        };
    }

    private TransactionDto MapToDto(Transaction transaction)
    {
        return new TransactionDto
        {
            Id = transaction.Id,
            TransactionCode = transaction.TransactionCode,
            InvoiceId = transaction.InvoiceId,
            InvoiceNumber = transaction.Invoice?.InvoiceNumber ?? "",
            Amount = transaction.Amount,
            TransactionType = "PAYMENT",
            PaymentMethod = transaction.PaymentMethod,
            Status = transaction.Status,
            GatewayTransactionId = transaction.GatewayReference,
            PaidAt = transaction.PaymentDate,
            CreatedAt = transaction.CreatedAt
        };
    }

    private TransactionDetailDto MapToDetailDto(Transaction transaction)
    {
        var dto = new TransactionDetailDto
        {
            Id = transaction.Id,
            TransactionCode = transaction.TransactionCode,
            InvoiceId = transaction.InvoiceId,
            InvoiceNumber = transaction.Invoice?.InvoiceNumber ?? "",
            Amount = transaction.Amount,
            TransactionType = "PAYMENT",
            PaymentMethod = transaction.PaymentMethod,
            Status = transaction.Status,
            GatewayTransactionId = transaction.GatewayReference,
            PaidAt = transaction.PaymentDate,
            CreatedAt = transaction.CreatedAt,
            GatewayResponse = transaction.GatewayResponse,
            Notes = transaction.Notes
        };

        if (transaction.Invoice != null)
        {
            dto.Invoice = new InvoiceDto
            {
                Id = transaction.Invoice.Id,
                InvoiceNumber = transaction.Invoice.InvoiceNumber,
                BillingPeriodId = transaction.Invoice.BillingPeriodId,
                RoomId = transaction.Invoice.RoomId,
                RoomCode = transaction.Invoice.Room?.RoomCode ?? "",
                Headcount = transaction.Invoice.Headcount ?? 0,
                RoomCharge = transaction.Invoice.RoomCharge ?? 0,
                WaterCharge = transaction.Invoice.WaterCharge ?? 0,
                ElectricityCharge = transaction.Invoice.ElectricityCharge ?? 0,
                ServiceCharge = transaction.Invoice.ServiceCharge ?? 0,
                AdjustmentAmount = transaction.Invoice.AdjustmentAmount ?? 0,
                AdjustmentNote = transaction.Invoice.AdjustmentNote,
                LateFee = transaction.Invoice.LateFee ?? 0,
                TotalAmount = transaction.Invoice.TotalAmount,
                PaidAmount = transaction.Invoice.PaidAmount,
                Status = transaction.Invoice.Status,
                IssueDate = transaction.Invoice.IssueDate,
                DueDate = transaction.Invoice.DueDate,
                ConfirmedAt = transaction.Invoice.ConfirmedAt,
                PaidAt = transaction.Invoice.PaidAt,
                VoidReason = transaction.Invoice.VoidReason,
                CreatedAt = transaction.Invoice.CreatedAt
            };
        }

        return dto;
    }

    private string GenerateTransactionCode(string invoiceNumber)
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var random = new Random().Next(1000, 9999);
        return $"TXN-{invoiceNumber}-{timestamp}-{random}";
    }
}
