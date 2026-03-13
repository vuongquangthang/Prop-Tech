using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using backend.Hubs;
using backend.Data;
using System.Globalization;
using System.Text;

namespace backend.Services;

public interface IHoaDonService
{
    Task<List<HoaDonDto>> GetAllAsync();
    Task<List<HoaDonDto>> GetByContractIdAsync(int contractId);
    Task<List<HoaDonDto>> GetUnpaidInvoicesAsync(int? userId = null);
    Task<List<HoaDonDto>> GetDraftInvoicesAsync();
    Task<HoaDonDto?> GetByIdAsync(int id);
    Task<HoaDonDto> CreateAsync(CreateHoaDonDto dto);
    Task<HoaDonDto> PayInvoiceAsync(int id, PayHoaDonDto dto);
    Task<CalculateInvoiceResultDto> CalculateDraftInvoicesAsync(short year, byte month);
    Task<HoaDonDto> EditDraftAsync(int id, EditDraftInvoiceDto dto);
    Task<HoaDonDto> ApproveAsync(int id, int approvedByUserId);
    Task<BatchReadingResultDto> BatchApproveAsync(List<int> invoiceIds, int approvedByUserId);
    Task<HoaDonDto> RejectAsync(int id, string reason);
    Task DeleteAsync(int id);
    Task<List<HoaDonDto>> GetByUserIdAsync(int userId);
}

public class HoaDonService : IHoaDonService
{
    private readonly IHoaDonRepository _hoaDonRepository;
    private readonly IHopDongRepository _hopDongRepository;
    private readonly IServiceRepository _serviceRepository;
    private readonly IThanhToanRepository _thanhToanRepository;
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly INotificationService _notificationService;

    public HoaDonService(
        IHoaDonRepository hoaDonRepository,
        IHopDongRepository hopDongRepository,
        IServiceRepository serviceRepository,
        IThanhToanRepository thanhToanRepository,
        ApplicationDbContext context,
        IHubContext<NotificationHub> hubContext,
        INotificationService notificationService)
    {
        _hoaDonRepository = hoaDonRepository;
        _hopDongRepository = hopDongRepository;
        _serviceRepository = serviceRepository;
        _thanhToanRepository = thanhToanRepository;
        _context = context;
        _hubContext = hubContext;
        _notificationService = notificationService;
    }

    public async Task<List<HoaDonDto>> GetAllAsync()
    {
        var invoices = await _hoaDonRepository.GetAllAsync();
        return invoices.Select(MapToDto).ToList();
    }

    public async Task<List<HoaDonDto>> GetByUserIdAsync(int userId)
    {
        var invoices = await _context.HoaDons
            .Include(hd => hd.HopDong).ThenInclude(hd => hd.Room)
            .Include(hd => hd.HopDong).ThenInclude(hd => hd.ChiTietOs).ThenInclude(ct => ct.Resident).ThenInclude(r => r.Users)
            .Include(hd => hd.ChiTietHoaDons).ThenInclude(ct => ct.Service)
            .Include(hd => hd.ThanhToans)
            .Where(hd =>
                hd.HopDong.ChiTietOs.Any(ct =>
                    ct.Resident.Users.Any(u => u.Id == userId)))
            .OrderByDescending(hd => hd.Year).ThenByDescending(hd => hd.Month)
            .ToListAsync();
        return invoices.Select(MapToDto).ToList();
    }

    public async Task<List<HoaDonDto>> GetByContractIdAsync(int contractId)
    {
        var invoices = await _hoaDonRepository.GetByContractIdAsync(contractId);
        return invoices.Select(MapToDto).ToList();
    }

    public async Task<List<HoaDonDto>> GetUnpaidInvoicesAsync(int? userId = null)
    {
        if (userId.HasValue && userId.Value > 0)
        {
            // Filter by current user's active contracts only
            var invoices = await _context.HoaDons
                .Include(hd => hd.HopDong).ThenInclude(hd => hd.Room)
                .Include(hd => hd.HopDong).ThenInclude(hd => hd.ChiTietOs).ThenInclude(ct => ct.Resident).ThenInclude(r => r.Users)
                .Include(hd => hd.ChiTietHoaDons).ThenInclude(ct => ct.Service)
                .Include(hd => hd.ThanhToans)
                .Where(hd =>
                    (hd.Status == "Chưa thanh toán" || hd.Status == "Đã thanh toán một phần") &&
                    hd.HopDong.ChiTietOs.Any(ct =>
                        ct.Resident.Users.Any(u => u.Id == userId.Value) &&
                        (ct.ToDate == null || ct.ToDate > DateTime.UtcNow)))
                .OrderByDescending(hd => hd.Year).ThenByDescending(hd => hd.Month)
                .ToListAsync();
            return invoices.Select(MapToDto).ToList();
        }

        var allInvoices = await _context.HoaDons
            .Include(hd => hd.HopDong).ThenInclude(hd => hd.Room)
            .Include(hd => hd.HopDong).ThenInclude(hd => hd.ChiTietOs).ThenInclude(ct => ct.Resident)
            .Include(hd => hd.ChiTietHoaDons).ThenInclude(ct => ct.Service)
            .Include(hd => hd.ThanhToans)
            .Where(i => i.Status == "Chưa thanh toán" || i.Status == "Đã thanh toán một phần")
            .OrderByDescending(hd => hd.DueDate)
            .ToListAsync();
        return allInvoices.Select(MapToDto).ToList();
    }

    public async Task<List<HoaDonDto>> GetDraftInvoicesAsync()
    {
        var invoices = await _context.HoaDons
            .Include(hd => hd.HopDong).ThenInclude(hd => hd.Room).ThenInclude(r => r.Floor).ThenInclude(f => f.Building)
            .Include(hd => hd.HopDong).ThenInclude(hd => hd.ChiTietOs).ThenInclude(ct => ct.Resident)
            .Include(hd => hd.ChiTietHoaDons).ThenInclude(ct => ct.Service)
            .Include(hd => hd.ThanhToans)
            .Where(hd => hd.Status == "Nháp")
            .OrderByDescending(hd => hd.Year).ThenByDescending(hd => hd.Month)
            .ToListAsync();
        return invoices.Select(MapToDto).ToList();
    }

    /// <summary>
    /// Tính toán hóa đơn nháp từ chỉ số điện/nước đã chốt
    /// </summary>
    public async Task<CalculateInvoiceResultDto> CalculateDraftInvoicesAsync(short year, byte month)
    {
        var result = new CalculateInvoiceResultDto();

        // Lấy tất cả hợp đồng đang active (có cư dân)
        var contracts = await _context.HopDongs
            .Include(hd => hd.Room).ThenInclude(r => r.ChiTietSuDungDichVus).ThenInclude(u => u.Service)
            .Include(hd => hd.ChiTietOs).ThenInclude(ct => ct.Resident).ThenInclude(r => r.Users)
            .Where(hd => hd.ChiTietOs.Any())
            .ToListAsync();

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            result.TotalContracts = contracts.Count;

            foreach (var contract in contracts)
            {
                // Kiểm tra hóa đơn đã tồn tại (bao gồm cả "Bị từ chối" để tránh vi phạm unique index)
                var existingInvoice = await _context.HoaDons
                    .Include(hd => hd.ChiTietHoaDons)
                    .FirstOrDefaultAsync(hd => hd.ContractId == contract.Id && hd.Month == month && hd.Year == year);

                if (existingInvoice != null)
                {
                    // Nếu đã approved/paid/unpaid → bỏ qua hoàn toàn
                    if (existingInvoice.Status != "Nháp" && existingInvoice.Status != "Bị từ chối")
                    {
                        result.Skipped++;
                        result.SkippedReasons.Add($"Phòng {contract.Room?.RoomCode}: Đã có hóa đơn tháng {month}/{year} (trạng thái: {existingInvoice.Status})");
                        continue;
                    }
                    // Nếu là Nháp hoặc Bị từ chối → xóa để tạo lại với dữ liệu mới
                    _context.ChiTietHoaDons.RemoveRange(existingInvoice.ChiTietHoaDons);
                    _context.HoaDons.Remove(existingInvoice);
                    await _context.SaveChangesAsync();
                    result.SkippedReasons.Add($"Phòng {contract.Room?.RoomCode}: Tính lại hóa đơn tháng {month}/{year} (trạng thái cũ: {existingInvoice.Status})");
                }

                var room = contract.Room;
                if (room == null)
                {
                    result.Errors.Add($"Hợp đồng {contract.Id}: Không có phòng để tính hóa đơn tháng {month}/{year}");
                    continue;
                }

                var activeUsages = GetActiveServiceUsagesForPeriod(room.ChiTietSuDungDichVus, year, month);
                var lineItems = new List<ChiTietHoaDon>();
                decimal total = 0;

                // 1. Tiền phòng
                var rentItem = new ChiTietHoaDon
                {
                    ItemType = "TienPhong",
                    Description = $"Tiền thuê phòng tháng {month}/{year}",
                    Quantity = 1,
                    UnitPrice = contract.ActualRentPrice
                };
                total += contract.ActualRentPrice;
                lineItems.Add(rentItem);

                // 2. Tiền điện
                var elecUsage = activeUsages
                    .FirstOrDefault(u => IsElectricityService(u.Service));
                if (elecUsage != null)
                {
                    var prevElec = await _context.ChiSoDiens
                        .Where(c => c.ServiceUsageDetailId == elecUsage.Id
                                    && (c.Year < year || (c.Year == year && c.Month < month)))
                        .OrderByDescending(c => c.Year).ThenByDescending(c => c.Month)
                        .FirstOrDefaultAsync();

                    var currElec = await _context.ChiSoDiens
                        .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == elecUsage.Id
                                                  && c.Month == month && c.Year == year);

                    if (currElec != null)
                    {
                        var oldReading = prevElec?.NewReading ?? 0;
                        var consumption = currElec.NewReading - oldReading;
                        var unitPrice = elecUsage.OverrideUnitPrice ?? elecUsage.Service.CommonUnitPrice ?? 0;

                        var elecItem = new ChiTietHoaDon
                        {
                            ItemType = "Dien",
                            ServiceId = elecUsage.ServiceId,
                            ServiceUsageDetailId = elecUsage.Id,
                            Description = $"Điện tháng {month}/{year}: {oldReading} → {currElec.NewReading} = {consumption} kWh",
                            Quantity = consumption,
                            UnitPrice = unitPrice
                        };
                        total += consumption * unitPrice;
                        lineItems.Add(elecItem);
                    }
                    else
                    {
                        result.Errors.Add($"Phòng {room.RoomCode}: Chưa chốt chỉ số điện tháng {month}/{year}");
                    }
                }

                // 3. Tiền nước
                var waterUsage = activeUsages
                    .FirstOrDefault(u => IsWaterService(u.Service));
                if (waterUsage != null)
                {
                    var prevWater = await _context.ChiSoNuocs
                        .Where(c => c.ServiceUsageDetailId == waterUsage.Id
                                    && (c.Year < year || (c.Year == year && c.Month < month)))
                        .OrderByDescending(c => c.Year).ThenByDescending(c => c.Month)
                        .FirstOrDefaultAsync();

                    var currWater = await _context.ChiSoNuocs
                        .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == waterUsage.Id
                                                  && c.Month == month && c.Year == year);

                    if (currWater != null)
                    {
                        var oldReading = prevWater?.NewReading ?? 0;
                        var consumption = currWater.NewReading - oldReading;
                        var unitPrice = waterUsage.OverrideUnitPrice ?? waterUsage.Service.CommonUnitPrice ?? 0;

                        var waterItem = new ChiTietHoaDon
                        {
                            ItemType = "Nuoc",
                            ServiceId = waterUsage.ServiceId,
                            ServiceUsageDetailId = waterUsage.Id,
                            Description = $"Nước tháng {month}/{year}: {oldReading} → {currWater.NewReading} = {consumption} m³",
                            Quantity = consumption,
                            UnitPrice = unitPrice
                        };
                        total += consumption * unitPrice;
                        lineItems.Add(waterItem);
                    }
                    else
                    {
                        result.Errors.Add($"Phòng {room.RoomCode}: Chưa chốt chỉ số nước tháng {month}/{year}");
                    }
                }

                // 4. Các dịch vụ khác (không phải điện/nước)
                var otherServices = activeUsages
                    .Where(u => !IsElectricityService(u.Service) && !IsWaterService(u.Service))
                    .ToList();
                foreach (var svc in otherServices)
                {
                    var unitPrice = svc.OverrideUnitPrice ?? svc.Service.CommonUnitPrice ?? 0;
                    var qty = svc.Quantity ?? 1;
                    var svcItem = new ChiTietHoaDon
                    {
                        ItemType = "DichVu",
                        ServiceId = svc.ServiceId,
                        ServiceUsageDetailId = svc.Id,
                        Description = svc.Service.Name,
                        Quantity = qty,
                        UnitPrice = unitPrice
                    };
                    total += qty * unitPrice;
                    lineItems.Add(svcItem);
                }

                // Tạo hóa đơn nháp
                var invoice = new HoaDon
                {
                    ContractId = contract.Id,
                    Month = month,
                    Year = year,
                    TotalAmount = total,
                    Status = "Nháp",
                    DueDate = new DateTime(year, month, 15).AddMonths(1)
                };
                _context.HoaDons.Add(invoice);
                await _context.SaveChangesAsync();

                foreach (var item in lineItems)
                {
                    item.InvoiceId = invoice.Id;
                    _context.ChiTietHoaDons.Add(item);
                }
                await _context.SaveChangesAsync();

                result.TotalInvoices++;
                result.TotalAmount += total;
            }

            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            throw new InvalidOperationException($"Lỗi khi tính toán hóa đơn: {ex.Message}", ex);
        }

        return result;
    }

    /// <summary>
    /// Chỉnh sửa hóa đơn nháp
    /// </summary>
    public async Task<HoaDonDto> EditDraftAsync(int id, EditDraftInvoiceDto dto)
    {
        var invoice = await _hoaDonRepository.GetWithDetailsAsync(id);
        if (invoice == null) throw new InvalidOperationException("Hóa đơn không tồn tại");
        if (invoice.Status != "Nháp") throw new InvalidOperationException("Chỉ có thể chỉnh sửa hóa đơn ở trạng thái Nháp");

        // Xóa line items cũ
        _context.ChiTietHoaDons.RemoveRange(invoice.ChiTietHoaDons);

        // Thêm line items mới
        decimal newTotal = 0;
        foreach (var item in dto.LineItems)
        {
            var lineItem = new ChiTietHoaDon
            {
                InvoiceId = id,
                ItemType = item.ItemType,
                ServiceId = item.ServiceId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Description = item.Description
            };
            newTotal += (item.Quantity ?? 0) * (item.UnitPrice ?? 0);
            _context.ChiTietHoaDons.Add(lineItem);
        }

        invoice.TotalAmount = newTotal;
        _hoaDonRepository.Update(invoice);
        await _hoaDonRepository.SaveChangesAsync();

        var updated = await _hoaDonRepository.GetWithDetailsAsync(id);
        return MapToDto(updated!);
    }

    /// <summary>
    /// Phê duyệt 1 hóa đơn và thông báo qua SignalR
    /// </summary>
    public async Task<HoaDonDto> ApproveAsync(int id, int approvedByUserId)
    {
        var invoice = await _hoaDonRepository.GetWithDetailsAsync(id);
        if (invoice == null) throw new InvalidOperationException("Hóa đơn không tồn tại");
        if (invoice.Status != "Nháp") throw new InvalidOperationException("Chỉ có thể phê duyệt hóa đơn ở trạng thái Nháp");

        invoice.Status = "Chưa thanh toán";
        invoice.ApprovedBy = approvedByUserId;
        invoice.ApprovedAt = DateTime.UtcNow;
        _hoaDonRepository.Update(invoice);
        await _hoaDonRepository.SaveChangesAsync();

        // Gửi SignalR notification cho cư dân
        await NotifyResidentAsync(invoice);

        var updated = await _hoaDonRepository.GetWithDetailsAsync(id);
        return MapToDto(updated!);
    }

    /// <summary>
    /// Phê duyệt hàng loạt
    /// </summary>
    public async Task<BatchReadingResultDto> BatchApproveAsync(List<int> invoiceIds, int approvedByUserId)
    {
        var result = new BatchReadingResultDto();

        foreach (var id in invoiceIds)
        {
            try
            {
                await ApproveAsync(id, approvedByUserId);
                result.Success++;
            }
            catch (Exception ex)
            {
                result.Failed++;
                result.Errors.Add($"Hóa đơn #{id}: {ex.Message}");
            }
        }

        return result;
    }

    /// <summary>
    /// Từ chối hóa đơn
    /// </summary>
    public async Task<HoaDonDto> RejectAsync(int id, string reason)
    {
        var invoice = await _hoaDonRepository.GetByIdAsync(id);
        if (invoice == null) throw new InvalidOperationException("Hóa đơn không tồn tại");
        if (invoice.Status != "Nháp") throw new InvalidOperationException("Chỉ có thể từ chối hóa đơn ở trạng thái Nháp");

        invoice.Status = "Bị từ chối";
        invoice.RejectedReason = reason;
        _hoaDonRepository.Update(invoice);
        await _hoaDonRepository.SaveChangesAsync();

        var updated = await _hoaDonRepository.GetWithDetailsAsync(id);
        return MapToDto(updated!);
    }

    private async Task NotifyResidentAsync(HoaDon invoice)
    {
        try
        {
            // Lấy tất cả users của cư dân trong hợp đồng
            var contractId = invoice.ContractId;
            var residentUsers = await _context.ChiTietOs
                .Where(ct => ct.ContractId == contractId)
                .SelectMany(ct => ct.Resident.Users)
                .ToListAsync();

            foreach (var user in residentUsers)
            {
                // SignalR push để app cập nhật real-time
                await NotificationHub.Notifications.SendNotificationToUser(
                    _hubContext,
                    user.Id.ToString(),
                    new
                    {
                        type = "INVOICE",
                        message = $"Hóa đơn tháng {invoice.Month}/{invoice.Year} đã được phát hành. Vui lòng thanh toán.",
                        invoiceId = invoice.Id,
                        month = invoice.Month,
                        year = invoice.Year,
                        totalAmount = invoice.TotalAmount
                    });

                // Lưu thông báo vào DB để hiện trong mục Thông báo của cư dân
                await _notificationService.SendToUserAsync(
                    user.Id,
                    $"Hóa đơn tháng {invoice.Month}/{invoice.Year}",
                    $"Hóa đơn tháng {invoice.Month}/{invoice.Year} đã được phát hành. Tổng tiền: {invoice.TotalAmount:N0}đ. Vui lòng thanh toán trước hạn.",
                    "INVOICE");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ SignalR notify failed: {ex.Message}");
        }
    }

    public async Task<HoaDonDto?> GetByIdAsync(int id)
    {
        var invoice = await _hoaDonRepository.GetWithDetailsAsync(id);
        return invoice == null ? null : MapToDto(invoice);
    }

    public async Task<HoaDonDto> CreateAsync(CreateHoaDonDto dto)
    {
        // Validate contract exists and is active
        var contract = await _hopDongRepository.GetByIdAsync(dto.ContractId);
        if (contract == null)
        {
            throw new InvalidOperationException("Hợp đồng không tồn tại");
        }

        // Check for duplicate invoice (same contract, month, year)
        var existingInvoice = await _hoaDonRepository.FirstOrDefaultAsync(i => 
            i.ContractId == dto.ContractId && i.Month == dto.Month && i.Year == dto.Year);
        if (existingInvoice != null)
        {
            throw new InvalidOperationException($"Hóa đơn tháng {dto.Month}/{dto.Year} cho hợp đồng này đã tồn tại");
        }

        // Validate all services exist
        var serviceIds = dto.LineItems.Where(li => li.ServiceId.HasValue).Select(li => li.ServiceId!.Value).Distinct();
        foreach (var serviceId in serviceIds)
        {
            var service = await _serviceRepository.GetByIdAsync(serviceId);
            if (service == null)
            {
                throw new InvalidOperationException($"Dịch vụ ID {serviceId} không tồn tại");
            }
        }

        // Create invoice
        var invoice = new HoaDon
        {
            ContractId = dto.ContractId,
            Month = dto.Month,
            Year = dto.Year,
            DueDate = dto.DueDate,
            TotalAmount = 0,
            Status = "Chưa thanh toán"
        };

        await _hoaDonRepository.AddAsync(invoice);
        await _hoaDonRepository.SaveChangesAsync();

        // Create line items and calculate total
        decimal totalAmount = 0;
        foreach (var lineDto in dto.LineItems)
        {
            var lineItem = new ChiTietHoaDon
            {
                InvoiceId = invoice.Id,
                ItemType = lineDto.ItemType,
                ServiceId = lineDto.ServiceId,
                Quantity = lineDto.Quantity,
                UnitPrice = lineDto.UnitPrice,
                Description = lineDto.Description
            };

            totalAmount += (lineDto.Quantity ?? 0) * (lineDto.UnitPrice ?? 0);
            invoice.ChiTietHoaDons.Add(lineItem);
        }

        invoice.TotalAmount = totalAmount;
        _hoaDonRepository.Update(invoice);
        await _hoaDonRepository.SaveChangesAsync();

        // Reload to get navigation properties
        var createdInvoice = await _hoaDonRepository.GetWithDetailsAsync(invoice.Id);
        return MapToDto(createdInvoice!);
    }

    public async Task<HoaDonDto> PayInvoiceAsync(int id, PayHoaDonDto dto)
    {
        var invoice = await _hoaDonRepository.GetByIdAsync(id);
        if (invoice == null)
        {
            throw new InvalidOperationException("Hóa đơn không tồn tại");
        }

        // Get current paid amount
        var payments = await _thanhToanRepository.GetByInvoiceIdAsync(id);
        var currentPaidAmount = payments.Sum(p => p.Amount);

        // Validate payment amount
        var remainingAmount = invoice.TotalAmount - currentPaidAmount;
        if (dto.Amount > remainingAmount)
        {
            throw new InvalidOperationException($"Số tiền thanh toán vượt quá số tiền còn lại ({remainingAmount:N0} VNĐ)");
        }

        if (dto.Amount <= 0)
        {
            throw new InvalidOperationException("Số tiền thanh toán phải lớn hơn 0");
        }

        // Create payment record
        var payment = new ThanhToan
        {
            InvoiceId = id,
            Amount = dto.Amount,
            PaymentType = dto.PaymentType,
            TransactionCode = dto.TransactionCode,
            PaidAt = DateTime.UtcNow
        };

        await _thanhToanRepository.AddAsync(payment);

        // Update invoice status
        var newPaidAmount = currentPaidAmount + dto.Amount;
        if (newPaidAmount >= invoice.TotalAmount)
        {
            invoice.Status = "Đã thanh toán";
        }
        else if (newPaidAmount > 0)
        {
            invoice.Status = "Đã thanh toán một phần";
        }

        _hoaDonRepository.Update(invoice);
        await _hoaDonRepository.SaveChangesAsync();

        // Reload to get updated data
        var updatedInvoice = await _hoaDonRepository.GetWithDetailsAsync(id);
        return MapToDto(updatedInvoice!);
    }

    public async Task DeleteAsync(int id)
    {
        var invoice = await _hoaDonRepository.GetByIdAsync(id);
        if (invoice == null)
        {
            throw new InvalidOperationException("Hóa đơn không tồn tại");
        }

        // Check if invoice has payments
        var payments = await _thanhToanRepository.GetByInvoiceIdAsync(id);
        if (payments.Any())
        {
            throw new InvalidOperationException("Không thể xóa hóa đơn đã có thanh toán");
        }

        _hoaDonRepository.Remove(invoice);
        await _hoaDonRepository.SaveChangesAsync();
    }

    private async Task<List<CreateChiTietHoaDonDto>> BuildInvoiceLineItemsFromUsageAsync(int contractId, byte month, short year)
    {
        var contract = await _context.HopDongs
            .Include(hd => hd.Room)
                .ThenInclude(r => r.ChiTietSuDungDichVus)
                    .ThenInclude(u => u.Service)
            .FirstOrDefaultAsync(hd => hd.Id == contractId);

        if (contract?.Room == null)
        {
            return new List<CreateChiTietHoaDonDto>();
        }

        var room = contract.Room;
        var lineItems = new List<CreateChiTietHoaDonDto>
        {
            new()
            {
                ItemType = "TienPhong",
                Quantity = 1,
                UnitPrice = contract.ActualRentPrice,
                Description = $"Tiền thuê phòng tháng {month}/{year}"
            }
        };

        var activeUsages = GetActiveServiceUsagesForPeriod(room.ChiTietSuDungDichVus, year, month);

        var elecUsage = activeUsages.FirstOrDefault(u => IsElectricityService(u.Service));
        if (elecUsage != null)
        {
            var prevElec = await _context.ChiSoDiens
                .Where(c => c.ServiceUsageDetailId == elecUsage.Id
                            && (c.Year < year || (c.Year == year && c.Month < month)))
                .OrderByDescending(c => c.Year).ThenByDescending(c => c.Month)
                .FirstOrDefaultAsync();

            var currElec = await _context.ChiSoDiens
                .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == elecUsage.Id
                                          && c.Month == month && c.Year == year);

            if (currElec != null)
            {
                var oldReading = prevElec?.NewReading ?? 0;
                var consumption = currElec.NewReading - oldReading;
                lineItems.Add(new CreateChiTietHoaDonDto
                {
                    ItemType = "Dien",
                    ServiceId = elecUsage.ServiceId,
                    Quantity = consumption,
                    UnitPrice = elecUsage.OverrideUnitPrice ?? elecUsage.Service.CommonUnitPrice ?? 0,
                    Description = $"Điện tháng {month}/{year}: {oldReading} → {currElec.NewReading} = {consumption} kWh"
                });
            }
        }

        var waterUsage = activeUsages.FirstOrDefault(u => IsWaterService(u.Service));
        if (waterUsage != null)
        {
            var prevWater = await _context.ChiSoNuocs
                .Where(c => c.ServiceUsageDetailId == waterUsage.Id
                            && (c.Year < year || (c.Year == year && c.Month < month)))
                .OrderByDescending(c => c.Year).ThenByDescending(c => c.Month)
                .FirstOrDefaultAsync();

            var currWater = await _context.ChiSoNuocs
                .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == waterUsage.Id
                                          && c.Month == month && c.Year == year);

            if (currWater != null)
            {
                var oldReading = prevWater?.NewReading ?? 0;
                var consumption = currWater.NewReading - oldReading;
                lineItems.Add(new CreateChiTietHoaDonDto
                {
                    ItemType = "Nuoc",
                    ServiceId = waterUsage.ServiceId,
                    Quantity = consumption,
                    UnitPrice = waterUsage.OverrideUnitPrice ?? waterUsage.Service.CommonUnitPrice ?? 0,
                    Description = $"Nước tháng {month}/{year}: {oldReading} → {currWater.NewReading} = {consumption} m³"
                });
            }
        }

        foreach (var usage in activeUsages.Where(u => !IsElectricityService(u.Service) && !IsWaterService(u.Service)))
        {
            lineItems.Add(new CreateChiTietHoaDonDto
            {
                ItemType = "DichVu",
                ServiceId = usage.ServiceId,
                Quantity = usage.Quantity ?? 1,
                UnitPrice = usage.OverrideUnitPrice ?? usage.Service.CommonUnitPrice ?? 0,
                Description = usage.Service.Name
            });
        }

        return lineItems;
    }

    private static List<ChiTietSuDungDichVu> GetActiveServiceUsagesForPeriod(IEnumerable<ChiTietSuDungDichVu> usages, short year, byte month)
    {
        var periodStart = new DateTime(year, month, 1);
        var periodEnd = periodStart.AddMonths(1).AddTicks(-1);

        return usages
            .Where(u => u.ApplyFrom <= periodEnd && (u.ApplyTo == null || u.ApplyTo >= periodStart))
            .ToList();
    }

    private static bool IsElectricityService(Service? service)
    {
        if (service == null) return false;
        if (service.Id == 1) return true;

        var normalized = NormalizeKey(service.ServiceType);
        return normalized == "dien" || normalized == "electricity" || normalized == "electric";
    }

    private static bool IsWaterService(Service? service)
    {
        if (service == null) return false;
        if (service.Id == 2) return true;

        var normalized = NormalizeKey(service.ServiceType);
        return normalized == "nuoc" || normalized == "water";
    }

    private static string NormalizeKey(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(c == 'đ' ? 'd' : c);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private HoaDonDto MapToDto(HoaDon invoice)
    {
        // Calculate paid amount from SUCCESS ThanhToan only (exclude PENDING)
        var successPayments = invoice.ThanhToans?.Where(t => t.Status == "SUCCESS").ToList();
        var paidAmount = successPayments?.Sum(t => t.Amount) ?? 0;
        var paidDate = successPayments?.Where(t => t.PaidAt.HasValue).OrderByDescending(t => t.PaidAt).FirstOrDefault()?.PaidAt;

        return new HoaDonDto
        {
            Id = invoice.Id,
            ContractId = invoice.ContractId,
            RoomId = invoice.HopDong?.RoomId,
            RoomNumber = invoice.HopDong?.Room?.RoomCode,
            ResidentName = invoice.HopDong?.ChiTietOs?.FirstOrDefault()?.Resident?.FullName,
            Month = invoice.Month,
            Year = invoice.Year,
            TotalAmount = invoice.TotalAmount,
            PaidAmount = paidAmount,
            PaidDate = paidDate,
            Status = invoice.Status,
            DueDate = invoice.DueDate,
            QrCodeUrl = invoice.QrCodeUrl,
            ApprovedBy = invoice.ApprovedBy,
            ApprovedAt = invoice.ApprovedAt,
            RejectedReason = invoice.RejectedReason,
            LineItems = invoice.ChiTietHoaDons?.Select(ct => new ChiTietHoaDonDto
            {
                Id = ct.Id,
                ItemType = ct.ItemType,
                ServiceId = ct.ServiceId,
                ServiceName = ct.Service?.Name,
                Unit = ct.Service?.Unit,
                Quantity = ct.Quantity,
                UnitPrice = ct.UnitPrice,
                Description = ct.Description
            }).ToList() ?? new List<ChiTietHoaDonDto>()
        };
    }
}
