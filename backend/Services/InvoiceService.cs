using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IInvoiceService
{
    Task<InvoiceDto?> GetByIdAsync(long id);
    Task<InvoiceDetailDto?> GetDetailAsync(long id);
    Task<List<InvoiceDto>> GetByBillingPeriodAsync(long billingPeriodId);
    Task<List<InvoiceDto>> GetByRoomAsync(long roomId);
    Task<List<InvoiceDto>> GetUnpaidByRoomAsync(long roomId);
    Task<int> GenerateDraftInvoicesAsync(long billingPeriodId);
    Task<InvoiceDto> AdjustAsync(long id, AdjustInvoiceDto dto);
    Task<InvoiceDto> ConfirmAsync(long id, ConfirmInvoiceDto dto);
    Task<InvoiceDto> VoidAsync(long id, VoidInvoiceDto dto);
}

public class InvoiceService : IInvoiceService
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IInvoiceLineItemRepository _lineItemRepository;
    private readonly IBillingPeriodRepository _billingPeriodRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly IResidencyService _residencyService;
    private readonly IResidencyRepository _residencyRepository;
    private readonly IDepositRepository _depositRepository;
    private readonly IMeterReadingRepository _meterReadingRepository;
    private readonly IWaterMeterReadingRepository _waterMeterReadingRepository;
    private readonly IPriceConfigService _priceConfigService;
    private readonly ILogger<InvoiceService> _logger;

    public InvoiceService(
        IInvoiceRepository invoiceRepository,
        IInvoiceLineItemRepository lineItemRepository,
        IBillingPeriodRepository billingPeriodRepository,
        IRoomRepository roomRepository,
        IResidencyService residencyService,
        IResidencyRepository residencyRepository,
        IDepositRepository depositRepository,
        IMeterReadingRepository meterReadingRepository,
        IWaterMeterReadingRepository waterMeterReadingRepository,
        IPriceConfigService priceConfigService,
        ILogger<InvoiceService> logger)
    {
        _invoiceRepository = invoiceRepository;
        _lineItemRepository = lineItemRepository;
        _billingPeriodRepository = billingPeriodRepository;
        _roomRepository = roomRepository;
        _residencyService = residencyService;
        _residencyRepository = residencyRepository;
        _depositRepository = depositRepository;
        _meterReadingRepository = meterReadingRepository;
        _waterMeterReadingRepository = waterMeterReadingRepository;
        _priceConfigService = priceConfigService;
        _logger = logger;
    }

    public async Task<InvoiceDto?> GetByIdAsync(long id)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(id);
        return invoice == null ? null : MapToDto(invoice);
    }

    public async Task<InvoiceDetailDto?> GetDetailAsync(long id)
    {
        var invoice = await _invoiceRepository.GetWithDetailsAsync(id);
        return invoice == null ? null : MapToDetailDto(invoice);
    }

    public async Task<List<InvoiceDto>> GetByBillingPeriodAsync(long billingPeriodId)
    {
        var invoices = await _invoiceRepository.GetByBillingPeriodAsync(billingPeriodId);
        return invoices.Select(MapToDto).ToList();
    }

    public async Task<List<InvoiceDto>> GetByRoomAsync(long roomId)
    {
        var invoices = await _invoiceRepository.GetByRoomAsync(roomId);
        return invoices.Select(MapToDto).ToList();
    }

    public async Task<List<InvoiceDto>> GetUnpaidByRoomAsync(long roomId)
    {
        var invoices = await _invoiceRepository.GetUnpaidByRoomAsync(roomId);
        return invoices.Select(MapToDto).ToList();
    }

    public async Task<int> GenerateDraftInvoicesAsync(long billingPeriodId)
    {
        var period = await _billingPeriodRepository.GetByIdAsync(billingPeriodId);
        if (period == null)
        {
            throw new InvalidOperationException("Không tìm thấy kỳ tính phí");
        }

        // Get all non-inactive rooms
        var rooms = await _roomRepository.FindAsync(r => r.Status != "INACTIVE");

        int invoiceCount = 0;

        foreach (var room in rooms)
        {
            // Check if invoice already exists
            var existingInvoice = (await _invoiceRepository.GetByBillingPeriodAsync(billingPeriodId))
                .FirstOrDefault(i => i.RoomId == room.Id);

            if (existingInvoice != null)
            {
                continue;
            }

            // Get headcount at cutoff date
            int headcount = await _residencyService.GetHeadcountForRoomAsync(room.Id, period.CutoffDate);

            // Room charge = room.MonthlyRent
            decimal roomCharge = room.MonthlyRent;

            // Water charge = headcount * water price
            var waterPrice = await _priceConfigService.GetLatestByServiceTypeAsync("WATER", period.CutoffDate);
            decimal waterCharge = headcount * (waterPrice?.UnitPrice ?? 0);

            // Electricity charge = consumption * price (or per kWh)
            var elecReading = await _meterReadingRepository.GetByRoomAndMonthAsync(room.Id, period.PeriodMonth);
            decimal elecConsumption = elecReading?.Consumption ?? 0;
            var elecPrice = await _priceConfigService.GetLatestByServiceTypeAsync("ELECTRICITY", period.CutoffDate);
            decimal elecCharge = elecConsumption * (elecPrice?.UnitPrice ?? 0);

            // Service charge = headcount * service price
            var servicePrice = await _priceConfigService.GetLatestByServiceTypeAsync("SERVICE", period.CutoffDate);
            decimal serviceCharge = headcount * (servicePrice?.UnitPrice ?? 0);

            // Check if this is the first invoice for any active residency in this room
            var activeResidencies = await _residencyRepository.GetActiveByRoomAsync(room.Id, period.CutoffDate);
            decimal depositAmount = 0;
            long? depositIdToInclude = null;

            if (activeResidencies.Any())
            {
                // Get all invoices for this room to check if this is the first one
                var allInvoices = await _invoiceRepository.GetByRoomAsync(room.Id);
                
                // Only include deposit on the first invoice
                if (!allInvoices.Any())
                {
                    // Get the earliest residency (primary resident)
                    var earliestResidency = activeResidencies.OrderBy(r => r.CheckInDate).FirstOrDefault();
                    if (earliestResidency != null)
                    {
                        var deposit = await _depositRepository.GetByResidencyAsync(earliestResidency.Id);
                        if (deposit != null && deposit.Status == "UNPAID")
                        {
                            depositAmount = deposit.Amount;
                            depositIdToInclude = deposit.Id;
                        }
                    }
                }
            }

            decimal totalAmount = roomCharge + waterCharge + elecCharge + serviceCharge + depositAmount;

            // Create invoice
            var invoice = new Invoice
            {
                InvoiceNumber = GenerateInvoiceNumber(room.Id, period.PeriodMonth),
                BillingPeriodId = billingPeriodId,
                RoomId = room.Id,
                IssueDate = DateTime.UtcNow,
                DueDate = period.DueDate,
                Headcount = headcount,
                RoomCharge = roomCharge,
                WaterCharge = waterCharge,
                ElectricityCharge = elecCharge,
                ServiceCharge = serviceCharge,
                AdjustmentAmount = 0,
                LateFee = 0,
                TotalAmount = totalAmount,
                PaidAmount = 0,
                Status = "DRAFT",
                CreatedAt = DateTime.UtcNow
            };

            await _invoiceRepository.AddAsync(invoice);
            await _invoiceRepository.SaveChangesAsync();

            // Create line items
            var lineItems = new List<InvoiceLineItem>
            {
                new() { InvoiceId = invoice.Id, ItemType = "ROOM", Description = $"Tiền phòng", Quantity = 1, UnitPrice = roomCharge, Amount = roomCharge, CreatedAt = DateTime.UtcNow },
                new() { InvoiceId = invoice.Id, ItemType = "WATER", Description = $"Tiền nước ({headcount} người × {waterPrice?.UnitPrice ?? 0}/người)", Quantity = headcount, UnitPrice = waterPrice?.UnitPrice ?? 0, Amount = waterCharge, CreatedAt = DateTime.UtcNow },
                new() { InvoiceId = invoice.Id, ItemType = "ELECTRICITY", Description = $"Tiền điện ({elecConsumption:F2} kWh × {elecPrice?.UnitPrice ?? 0}/kWh)", Quantity = elecConsumption, UnitPrice = elecPrice?.UnitPrice ?? 0, Amount = elecCharge, CreatedAt = DateTime.UtcNow },
                new() { InvoiceId = invoice.Id, ItemType = "SERVICE", Description = $"Tiền dịch vụ ({headcount} người × {servicePrice?.UnitPrice ?? 0}/người)", Quantity = headcount, UnitPrice = servicePrice?.UnitPrice ?? 0, Amount = serviceCharge, CreatedAt = DateTime.UtcNow }
            };

            // Add deposit line item if applicable
            if (depositAmount > 0)
            {
                lineItems.Add(new() { InvoiceId = invoice.Id, ItemType = "DEPOSIT", Description = $"Tiền cọc", Quantity = 1, UnitPrice = depositAmount, Amount = depositAmount, CreatedAt = DateTime.UtcNow });
            }

            await _lineItemRepository.AddRangeAsync(lineItems);
            await _lineItemRepository.SaveChangesAsync();

            invoiceCount++;
        }

        return invoiceCount;
    }

    public async Task<InvoiceDto> AdjustAsync(long id, AdjustInvoiceDto dto)
    {
        var invoice = await _invoiceRepository.GetWithDetailsAsync(id);
        
        if (invoice == null)
        {
            throw new InvalidOperationException("Không tìm thấy hóa đơn");
        }

        if (invoice.Status != "DRAFT")
        {
            throw new InvalidOperationException("Chỉ có thể điều chỉnh hóa đơn ở trạng thái NHÁP");
        }

        if (dto.AdjustmentAmount != 0 && string.IsNullOrEmpty(dto.AdjustmentNote))
        {
            throw new InvalidOperationException("Bắt buộc nhập ghi chú khi có số tiền điều chỉnh");
        }

        invoice.AdjustmentAmount = dto.AdjustmentAmount;
        invoice.AdjustmentNote = dto.AdjustmentNote;
        invoice.TotalAmount = (invoice.RoomCharge ?? 0) + (invoice.WaterCharge ?? 0) + (invoice.ElectricityCharge ?? 0) + 
                             (invoice.ServiceCharge ?? 0) + dto.AdjustmentAmount;

        _invoiceRepository.Update(invoice);
        await _invoiceRepository.SaveChangesAsync();

        return MapToDto(invoice);
    }

    public async Task<InvoiceDto> ConfirmAsync(long id, ConfirmInvoiceDto dto)
    {
        var invoice = await _invoiceRepository.GetWithDetailsAsync(id);
        
        if (invoice == null)
        {
            throw new InvalidOperationException("Không tìm thấy hóa đơn");
        }

        if (invoice.Status != "DRAFT")
        {
            throw new InvalidOperationException("Chỉ có thể chốt hóa đơn ở trạng thái NHÁP");
        }

        // Snapshot prices
        var waterPrice = await _priceConfigService.GetLatestByServiceTypeAsync("WATER", invoice.IssueDate);
        var elecPrice = await _priceConfigService.GetLatestByServiceTypeAsync("ELECTRICITY", invoice.IssueDate);
        var servicePrice = await _priceConfigService.GetLatestByServiceTypeAsync("SERVICE", invoice.IssueDate);

        invoice.Status = "UNPAID"; // Invoice is confirmed but not yet paid
        invoice.ConfirmedAt = DateTime.UtcNow;
        invoice.SnapshotRoomRent = invoice.RoomCharge;
        invoice.SnapshotWaterPrice = waterPrice?.UnitPrice;
        invoice.SnapshotElectricityPrice = elecPrice?.UnitPrice;
        invoice.SnapshotServicePrice = servicePrice?.UnitPrice;
        invoice.Notes = dto.Notes;

        _invoiceRepository.Update(invoice);
        await _invoiceRepository.SaveChangesAsync();

        return MapToDto(invoice);
    }

    public async Task<InvoiceDto> VoidAsync(long id, VoidInvoiceDto dto)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(id);
        
        if (invoice == null)
        {
            throw new InvalidOperationException("Không tìm thấy hóa đơn");
        }

        if (invoice.Status == "PAID")
        {
            throw new InvalidOperationException("Không thể hủy hóa đơn đã thanh toán");
        }

        invoice.Status = "VOIDED";
        invoice.VoidReason = dto.VoidReason;
        invoice.VoidedAt = DateTime.UtcNow;

        _invoiceRepository.Update(invoice);
        await _invoiceRepository.SaveChangesAsync();

        return MapToDto(invoice);
    }

    private InvoiceDto MapToDto(Invoice invoice)
    {
        return new InvoiceDto
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
            CreatedAt = invoice.CreatedAt
        };
    }

    private InvoiceDetailDto MapToDetailDto(Invoice invoice)
    {
        var dto = new InvoiceDetailDto
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

        return dto;
    }

    private string GenerateInvoiceNumber(long roomId, DateTime periodMonth)
    {
        return $"INV-{roomId:D4}-{periodMonth:yyyyMM}";
    }
}
