using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using backend.Hubs;
using backend.Data;
using System.Globalization;
using System.Text;
using System.Text.Json;

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
    Task<CalculateInvoiceResultDto> CalculateDraftInvoicesAsync(short year, byte month, int ownerUserId);
    Task<HoaDonDto> EditDraftAsync(int id, EditDraftInvoiceDto dto);
    Task<HoaDonDto> ApproveAsync(int id, int approvedByUserId);
    Task<BatchReadingResultDto> BatchApproveAsync(List<int> invoiceIds, int approvedByUserId);
    Task<HoaDonDto> RejectAsync(int id, string reason);
    Task<SendInvoiceReminderResultDto> ResendInvoiceNotificationAsync(int id);
    Task<SendInvoiceReminderResultDto> SendReminderAsync(int invoiceId, int sentByUserId, string? customContent = null);
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
    /// Tính toán hóa đơn nháp từ chỉ số điện/nước đã chốt và công thức tính hóa đơn của hợp đồng
    /// </summary>
    public async Task<CalculateInvoiceResultDto> CalculateDraftInvoicesAsync(short year, byte month, int ownerUserId)
    {
        var result = new CalculateInvoiceResultDto();

        // Lấy tất cả hợp đồng đang active (có cư dân)
        var periodStartUtc = CreatePeriodStartUtc(year, month);

        var contracts = await _context.HopDongs
            .Include(hd => hd.Room).ThenInclude(r => r.ChiTietSuDungDichVus).ThenInclude(u => u.Service)
            .Include(hd => hd.Room).ThenInclude(r => r.Floor).ThenInclude(f => f.Building)
            .Include(hd => hd.ChiTietOs).ThenInclude(ct => ct.Resident).ThenInclude(r => r.Users)
            .Where(hd =>
                hd.Room.Floor.Building.OwnerUserId == ownerUserId &&
                hd.ChiTietOs.Any(ct => ct.ToDate == null || ct.ToDate >= periodStartUtc))
            .ToListAsync();

        var serviceIds = contracts
            .SelectMany(contract => contract.Room?.ChiTietSuDungDichVus ?? Enumerable.Empty<ChiTietSuDungDichVu>())
            .Select(usage => usage.ServiceId)
            .Distinct()
            .ToList();
        var priceHistories = await _context.ServicePriceHistories
            .AsNoTracking()
            .Where(history => serviceIds.Contains(history.ServiceId))
            .OrderBy(history => history.EffectiveDate)
            .ToListAsync();
        var invoiceIssuedDate = GetVietnamToday();

        decimal ResolveMarketPrice(int serviceId, decimal fallbackPrice)
        {
            var histories = priceHistories
                .Where(history => history.ServiceId == serviceId)
                .ToList();
            var effectiveHistory = histories
                .Where(history => GetVietnamDate(history.EffectiveDate) <= invoiceIssuedDate)
                .OrderByDescending(history => history.EffectiveDate)
                .ThenByDescending(history => history.ChangedAt)
                .FirstOrDefault();
            if (effectiveHistory != null)
            {
                return effectiveHistory.NewPrice;
            }

            return histories.FirstOrDefault()?.OldPrice ?? fallbackPrice;
        }

        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            result.TotalContracts = contracts.Count;

            foreach (var contract in contracts)
            {
                // Kiểm tra hóa đơn đã tồn tại
                var existingInvoice = await _context.HoaDons
                    .Include(hd => hd.ChiTietHoaDons)
                    .FirstOrDefaultAsync(hd => hd.ContractId == contract.Id && hd.Month == month && hd.Year == year);

                if (existingInvoice != null)
                {
                    if (existingInvoice.Status != "Nháp" && existingInvoice.Status != "Bị từ chối")
                    {
                        result.Skipped++;
                        result.SkippedReasons.Add($"Phòng {contract.Room?.RoomCode}: Đã có hóa đơn tháng {month}/{year} (trạng thái: {existingInvoice.Status})");
                        continue;
                    }
                    _context.ChiTietHoaDons.RemoveRange(existingInvoice.ChiTietHoaDons);
                    _context.HoaDons.Remove(existingInvoice);
                    await _context.SaveChangesAsync();
                }

                var room = contract.Room;
                if (room == null)
                {
                    result.Errors.Add($"Hợp đồng {contract.Id}: Không có phòng để tính hóa đơn tháng {month}/{year}");
                    continue;
                }

                var activeUsages = GetActiveServiceUsagesForPeriod(room.ChiTietSuDungDichVus, year, month);

                var anomalyReasons = await GetUtilityReadingAnomalyReasonsAsync(activeUsages, year, month);
                if (anomalyReasons.Any())
                {
                    result.Skipped++;
                    result.SkippedReasons.Add($"Phòng {room.RoomCode}: {string.Join(" | ", anomalyReasons)}");
                    continue;
                }

                var lineItems = new List<ChiTietHoaDon>();
                decimal total = 0;
                var formulaItems = ParseBillingFormula(contract.BillingFormulaJson);
                var hasFormula = formulaItems.Count > 0;
                var missingReadingReasons = new List<string>();

                if (hasFormula)
                {
                    // LÀM THEO CÔNG THỨC (PHẢI CÓ ĐIỆN NƯỚC NẾU CÔNG THỨC CÓ n)
                    foreach (var item in formulaItems.OrderBy(i => i.SortOrder))
                    {
                        ChiTietHoaDon? lineItem = null;

                        if (IsRentFormulaItem(item))
                        {
                            lineItem = new ChiTietHoaDon
                            {
                                ItemType = "TienPhong",
                                Description = $"Tiền thuê phòng tháng {month}/{year}",
                                Quantity = 1,
                                UnitPrice = item.UnitPrice
                            };
                        }
                        else if (item.QuantityExpression == "n")
                        {
                            // Meter reading (Electricity or Water)
                            if (IsElectricityFormulaItem(item))
                            {
                                var elecUsage = await SelectElectricityUsageAsync(activeUsages, month, year);
                                if (elecUsage != null)
                                {
                                    var prev = await _context.ChiSoDiens
                                        .Where(c => c.ServiceUsageDetailId == elecUsage.Id && (c.Year < year || (c.Year == year && c.Month < month)))
                                        .OrderByDescending(c => c.Year).ThenByDescending(c => c.Month).FirstOrDefaultAsync();
                                    var curr = await _context.ChiSoDiens
                                        .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == elecUsage.Id && c.Month == month && c.Year == year);

                                    if (curr != null)
                                    {
                                        var oldReading = prev?.NewReading ?? 0;
                                        var consumption = curr.NewReading - oldReading;
                                        lineItem = new ChiTietHoaDon
                                        {
                                            ItemType = "Dien",
                                            ServiceId = elecUsage.ServiceId,
                                            ServiceUsageDetailId = elecUsage.Id,
                                            Description = $"Điện tháng {month}/{year}: {oldReading} → {curr.NewReading} = {consumption} kWh",
                                            Quantity = consumption,
                                            UnitPrice = ResolveMarketPrice(elecUsage.ServiceId, item.UnitPrice)
                                        };
                                    }
                                    else missingReadingReasons.Add($"Chưa chốt chỉ số điện tháng {month}/{year}");
                                }
                                else result.Warnings.Add($"Phòng {room.RoomCode}: Có công thức tính điện nhưng không tìm thấy dịch vụ điện đang hoạt động");
                            }
                            else if (IsWaterFormulaItem(item))
                            {
                                var waterUsage = await SelectWaterUsageAsync(activeUsages, month, year);
                                if (waterUsage != null)
                                {
                                    var prev = await _context.ChiSoNuocs
                                        .Where(c => c.ServiceUsageDetailId == waterUsage.Id && (c.Year < year || (c.Year == year && c.Month < month)))
                                        .OrderByDescending(c => c.Year).ThenByDescending(c => c.Month).FirstOrDefaultAsync();
                                    var curr = await _context.ChiSoNuocs
                                        .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == waterUsage.Id && c.Month == month && c.Year == year);

                                    if (curr != null)
                                    {
                                        var oldReading = prev?.NewReading ?? 0;
                                        var consumption = curr.NewReading - oldReading;
                                        lineItem = new ChiTietHoaDon
                                        {
                                            ItemType = "Nuoc",
                                            ServiceId = waterUsage.ServiceId,
                                            ServiceUsageDetailId = waterUsage.Id,
                                            Description = $"Nước tháng {month}/{year}: {oldReading} → {curr.NewReading} = {consumption} m³",
                                            Quantity = consumption,
                                            UnitPrice = ResolveMarketPrice(waterUsage.ServiceId, item.UnitPrice)
                                        };
                                    }
                                    else missingReadingReasons.Add($"Chưa chốt chỉ số nước tháng {month}/{year}");
                                }
                                else result.Warnings.Add($"Phòng {room.RoomCode}: Có công thức tính nước nhưng không tìm thấy dịch vụ nước đang hoạt động");
                            }
                        }
                        else
                        {
                            // Fixed quantity
                            var usage = item.ServiceId.HasValue ? activeUsages.FirstOrDefault(u => u.ServiceId == item.ServiceId) : null;
                            var unitPrice = item.UnitPrice;
                            if (usage?.Service != null
                                && (IsElectricityService(usage.Service) || IsWaterService(usage.Service)))
                            {
                                unitPrice = ResolveMarketPrice(usage.ServiceId, item.UnitPrice);
                            }
                            lineItem = new ChiTietHoaDon
                            {
                                ItemType = item.ItemType == "TienPhong" ? "TienPhong" : (item.ItemType == "Dien" || item.ItemType == "Nuoc" ? item.ItemType : "DichVu"),
                                ServiceId = item.ServiceId,
                                ServiceUsageDetailId = usage?.Id,
                                Description = item.ServiceName,
                                Quantity = item.Quantity ?? 1,
                                UnitPrice = unitPrice
                            };
                        }

                        if (lineItem != null)
                        {
                            lineItems.Add(lineItem);
                            total += (lineItem.Quantity ?? 0) * (lineItem.UnitPrice ?? 0);
                        }
                    }

                    // Kiểm tra xem có dịch vụ nào đang dùng mà không có trong công thức không
                    var formulaServiceIds = formulaItems.Where(i => i.ServiceId.HasValue).Select(i => i.ServiceId!.Value).ToHashSet();
                    var missingServices = activeUsages.Where(u => !formulaServiceIds.Contains(u.ServiceId)).ToList();
                    if (missingServices.Any())
                    {
                        var names = string.Join(", ", missingServices.Select(u => u.Service?.Name ?? "Dịch vụ"));
                        result.Warnings.Add($"Phòng {room.RoomCode}: Các dịch vụ đang dùng nhưng thiếu trong công thức: {names}");
                    }
                }
                else
                {
                    // FALLBACK: LÀM THEO CÁCH CŨ NẾU KHÔNG CÓ CÔNG THỨC
                    // 1. Tiền phòng
                    lineItems.Add(new ChiTietHoaDon { ItemType = "TienPhong", Description = $"Tiền thuê phòng tháng {month}/{year}", Quantity = 1, UnitPrice = contract.ActualRentPrice });
                    total += contract.ActualRentPrice;

                    // 2. Điện/Nước/Dịch vụ khác từ activeUsages
                    var selectedElectricityUsage = await SelectElectricityUsageAsync(activeUsages, month, year);
                    var selectedWaterUsage = await SelectWaterUsageAsync(activeUsages, month, year);
                    var billableUsages = activeUsages
                        .Where(usage =>
                            !IsElectricityService(usage.Service)
                            && !IsWaterService(usage.Service))
                        .ToList();
                    if (selectedElectricityUsage != null)
                    {
                        billableUsages.Insert(0, selectedElectricityUsage);
                    }
                    if (selectedWaterUsage != null)
                    {
                        var insertIndex = selectedElectricityUsage != null ? 1 : 0;
                        billableUsages.Insert(insertIndex, selectedWaterUsage);
                    }

                    foreach (var usage in billableUsages)
                    {
                        var configuredPrice = usage.OverrideUnitPrice ?? usage.Service.CommonUnitPrice ?? 0;
                        var unitPrice = IsElectricityService(usage.Service) || IsWaterService(usage.Service)
                            ? ResolveMarketPrice(usage.ServiceId, configuredPrice)
                            : configuredPrice;
                        if (IsElectricityService(usage.Service))
                        {
                            var prev = await _context.ChiSoDiens.Where(c => c.ServiceUsageDetailId == usage.Id && (c.Year < year || (c.Year == year && c.Month < month))).OrderByDescending(c => c.Year).ThenByDescending(c => c.Month).FirstOrDefaultAsync();
                            var curr = await _context.ChiSoDiens.FirstOrDefaultAsync(c => c.ServiceUsageDetailId == usage.Id && c.Month == month && c.Year == year);
                            if (curr != null) {
                                var cons = curr.NewReading - (prev?.NewReading ?? 0);
                                lineItems.Add(new ChiTietHoaDon { ItemType = "Dien", ServiceId = usage.ServiceId, ServiceUsageDetailId = usage.Id, Description = $"Điện tháng {month}/{year}: {prev?.NewReading ?? 0} → {curr.NewReading} = {cons} kWh", Quantity = cons, UnitPrice = unitPrice });
                                total += cons * unitPrice;
                            } else missingReadingReasons.Add($"Chưa chốt chỉ số điện tháng {month}/{year}");
                        }
                        else if (IsWaterService(usage.Service))
                        {
                            var prev = await _context.ChiSoNuocs.Where(c => c.ServiceUsageDetailId == usage.Id && (c.Year < year || (c.Year == year && c.Month < month))).OrderByDescending(c => c.Year).ThenByDescending(c => c.Month).FirstOrDefaultAsync();
                            var curr = await _context.ChiSoNuocs.FirstOrDefaultAsync(c => c.ServiceUsageDetailId == usage.Id && c.Month == month && c.Year == year);
                            if (curr != null) {
                                var cons = curr.NewReading - (prev?.NewReading ?? 0);
                                lineItems.Add(new ChiTietHoaDon { ItemType = "Nuoc", ServiceId = usage.ServiceId, ServiceUsageDetailId = usage.Id, Description = $"Nước tháng {month}/{year}: {prev?.NewReading ?? 0} → {curr.NewReading} = {cons} m³", Quantity = cons, UnitPrice = unitPrice });
                                total += cons * unitPrice;
                            } else missingReadingReasons.Add($"Chưa chốt chỉ số nước tháng {month}/{year}");
                        }
                        else {
                            var qty = usage.Quantity ?? 1;
                            lineItems.Add(new ChiTietHoaDon { ItemType = "DichVu", ServiceId = usage.ServiceId, ServiceUsageDetailId = usage.Id, Description = usage.Service.Name, Quantity = qty, UnitPrice = unitPrice });
                            total += qty * unitPrice;
                        }
                    }
                }

                if (missingReadingReasons.Any())
                {
                    result.Skipped++;
                    result.SkippedReasons.Add($"Phòng {room.RoomCode}: {string.Join("; ", missingReadingReasons)}");
                    continue;
                }

                // Tạo hóa đơn nháp
                var invoice = new HoaDon
                {
                    ContractId = contract.Id,
                    Month = month,
                    Year = year,
                    TotalAmount = total,
                    Status = "Nháp",
                    DueDate = BuildDueDate(year, month, contract.PaymentDayOfMonth)
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

        });

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

    public async Task<SendInvoiceReminderResultDto> ResendInvoiceNotificationAsync(int id)
    {
        var invoice = await _hoaDonRepository.GetWithDetailsAsync(id);
        if (invoice == null) throw new InvalidOperationException("Hóa đơn không tồn tại");
        if (invoice.Status == "Nháp" || invoice.Status == "Bị từ chối")
        {
            throw new InvalidOperationException("Chỉ có thể gửi lại hóa đơn đã phát hành");
        }

        var sentCount = await NotifyResidentAsync(invoice);
        if (sentCount == 0)
        {
            throw new InvalidOperationException("Không tìm thấy tài khoản cư dân để gửi hóa đơn");
        }

        return new SendInvoiceReminderResultDto
        {
            InvoiceId = invoice.Id,
            SentCount = sentCount,
            RecipientUserIds = new List<int>()
        };
    }

    private async Task<int> NotifyResidentAsync(HoaDon invoice)
    {
        try
        {
            // Lấy tất cả users của cư dân trong hợp đồng
            var contractId = invoice.ContractId;
            var residentUsers = await _context.ChiTietOs
                .Where(ct => ct.ContractId == contractId)
                .SelectMany(ct => ct.Resident.Users)
                .Where(user => user.Role == "CuDan")
                .Distinct()
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
                    "INVOICE",
                    invoice.Id,
                    $"invoice://detail?invoiceId={invoice.Id}");
            }

            return residentUsers.Count;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ SignalR notify failed: {ex.Message}");
            return 0;
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
            DueDate = NormalizeUtc(dto.DueDate),
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
        var currentPaidAmount = payments
            .Where(payment => payment.Status == "SUCCESS")
            .Sum(payment => payment.Amount);

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
            PaidAt = DateTime.UtcNow,
            Status = "SUCCESS"
        };

        await _thanhToanRepository.AddAsync(payment);

        // Update invoice status
        var newPaidAmount = currentPaidAmount + dto.Amount;
        if (newPaidAmount >= invoice.TotalAmount)
        {
            invoice.Status = "Đã thanh toán";
            var includesContractDeposit = await _context.ChiTietHoaDons
                .AnyAsync(item =>
                    item.InvoiceId == invoice.Id &&
                    item.ItemType == "PhatSinh" &&
                    item.Description != null &&
                    item.Description.StartsWith("Tiền cọc hợp đồng"));
            if (includesContractDeposit)
            {
                var contract = await _context.HopDongs.FindAsync(invoice.ContractId);
                if (contract != null)
                {
                    contract.DepositPaid = true;
                }
            }
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

    public async Task<SendInvoiceReminderResultDto> SendReminderAsync(int invoiceId, int sentByUserId, string? customContent = null)
    {
        var invoice = await _context.HoaDons
            .Include(hd => hd.HopDong)
                .ThenInclude(hd => hd.Room)
            .Include(hd => hd.HopDong)
                .ThenInclude(hd => hd.ChiTietOs)
                    .ThenInclude(ct => ct.Resident)
                        .ThenInclude(r => r.Users)
            .Include(hd => hd.ThanhToans)
            .FirstOrDefaultAsync(hd => hd.Id == invoiceId);

        if (invoice == null)
        {
            throw new InvalidOperationException("Hóa đơn không tồn tại");
        }

        var paidAmount = invoice.ThanhToans?.Where(t => t.Status == "SUCCESS").Sum(t => t.Amount) ?? 0;
        var remainingAmount = invoice.TotalAmount - paidAmount;
        if (remainingAmount <= 0)
        {
            throw new InvalidOperationException("Hóa đơn đã được thanh toán, không cần gửi nhắc nợ");
        }

        var now = DateTime.UtcNow;
        var residentUserIds = invoice.HopDong?.ChiTietOs
            .Where(ct => ct.ToDate == null || ct.ToDate > now)
            .SelectMany(ct => ct.Resident.Users)
            .Where(u => u.Role == "CuDan")
            .Select(u => u.Id)
            .Distinct()
            .ToList() ?? new List<int>();

        if (residentUserIds.Count == 0)
        {
            throw new InvalidOperationException("Không tìm thấy tài khoản cư dân để gửi nhắc nợ");
        }

        var due = invoice.DueDate;
        var daysLate = due.HasValue ? Math.Max(0, (now.Date - due.Value.Date).Days) : 0;
        var roomCode = invoice.HopDong?.Room?.RoomCode ?? "—";
        var title = $"Nhắc nợ hóa đơn phòng {roomCode}";
        var content = string.IsNullOrWhiteSpace(customContent)
            ? $"Hóa đơn tháng {invoice.Month}/{invoice.Year} còn nợ {remainingAmount:N0}đ{(daysLate > 0 ? $", quá hạn {daysLate} ngày" : "")}. Vui lòng thanh toán sớm."
            : customContent.Trim();

        foreach (var userId in residentUserIds)
        {
            await _notificationService.SendToUserAsync(userId, title, content, "PAYMENT_REMINDER");

            var reminderCount = await _context.NhatKyNhacNos
                .CountAsync(r => r.InvoiceId == invoiceId && r.SentToUserId == userId);

            _context.NhatKyNhacNos.Add(new NhatKyNhacNo
            {
                InvoiceId = invoiceId,
                SentToUserId = userId,
                SentByUserId = sentByUserId > 0 ? sentByUserId : null,
                ReminderCount = reminderCount + 1,
                ReminderTime = now,
                ReminderMethod = "App notification",
                Content = content,
                SendStatus = "Thành công"
            });
        }

        await _context.SaveChangesAsync();

        return new SendInvoiceReminderResultDto
        {
            InvoiceId = invoiceId,
            SentCount = residentUserIds.Count,
            RecipientUserIds = residentUserIds
        };
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
        var periodStart = CreatePeriodStartUtc(year, month);
        var periodEnd = CreatePeriodEndUtc(year, month);

        return usages
            .Where(u => u.Service != null
                && u.Service.IsActive
                && u.ApplyFrom <= periodEnd
                && (u.ApplyTo == null || u.ApplyTo >= periodStart))
            .ToList();
    }

    private async Task<ChiTietSuDungDichVu?> SelectElectricityUsageAsync(IEnumerable<ChiTietSuDungDichVu> activeUsages, byte month, short year)
    {
        var candidates = activeUsages
            .Where(usage => IsElectricityService(usage.Service))
            .OrderByDescending(usage => usage.ApplyFrom)
            .ThenByDescending(usage => usage.Id)
            .ToList();
        if (candidates.Count == 0)
        {
            return null;
        }

        var candidateIds = candidates.Select(usage => usage.Id).ToList();
        var recordedUsageIds = await _context.ChiSoDiens
            .Where(reading => candidateIds.Contains(reading.ServiceUsageDetailId)
                && reading.Month == month
                && reading.Year == year)
            .Select(reading => reading.ServiceUsageDetailId)
            .ToListAsync();

        return candidates.FirstOrDefault(usage => recordedUsageIds.Contains(usage.Id))
            ?? candidates.First();
    }

    private async Task<ChiTietSuDungDichVu?> SelectWaterUsageAsync(IEnumerable<ChiTietSuDungDichVu> activeUsages, byte month, short year)
    {
        var candidates = activeUsages
            .Where(usage => IsWaterService(usage.Service))
            .OrderByDescending(usage => usage.ApplyFrom)
            .ThenByDescending(usage => usage.Id)
            .ToList();
        if (candidates.Count == 0)
        {
            return null;
        }

        var candidateIds = candidates.Select(usage => usage.Id).ToList();
        var recordedUsageIds = await _context.ChiSoNuocs
            .Where(reading => candidateIds.Contains(reading.ServiceUsageDetailId)
                && reading.Month == month
                && reading.Year == year)
            .Select(reading => reading.ServiceUsageDetailId)
            .ToListAsync();

        return candidates.FirstOrDefault(usage => recordedUsageIds.Contains(usage.Id))
            ?? candidates.First();
    }

    private async Task<List<string>> GetUtilityReadingAnomalyReasonsAsync(IEnumerable<ChiTietSuDungDichVu> activeUsages, short year, byte month)
    {
        var reasons = new List<string>();

        foreach (var usage in activeUsages)
        {
            if (IsElectricityService(usage.Service))
            {
                var current = await _context.ChiSoDiens.FirstOrDefaultAsync(c => c.ServiceUsageDetailId == usage.Id && c.Month == month && c.Year == year);
                if (current != null)
                {
                    var previous = await _context.ChiSoDiens
                        .Where(c => c.ServiceUsageDetailId == usage.Id && (c.Year < year || (c.Year == year && c.Month < month)))
                        .OrderByDescending(c => c.Year)
                        .ThenByDescending(c => c.Month)
                        .FirstOrDefaultAsync();

                    var previousConsumption = await GetElectricityConsumptionAsync(usage.Id, previous?.Month, previous?.Year);
                    var currentConsumption = previous != null ? current.NewReading - previous.NewReading : current.NewReading;
                    if (previousConsumption.HasValue && previousConsumption.Value > 0 && currentConsumption > previousConsumption.Value * 2m)
                    {
                        reasons.Add($"Phòng có chỉ số điện tăng bất thường: {currentConsumption:N0} kWh so với tháng trước {previousConsumption.Value:N0} kWh");
                    }
                }
            }

            if (IsWaterService(usage.Service))
            {
                var current = await _context.ChiSoNuocs.FirstOrDefaultAsync(c => c.ServiceUsageDetailId == usage.Id && c.Month == month && c.Year == year);
                if (current != null)
                {
                    var previous = await _context.ChiSoNuocs
                        .Where(c => c.ServiceUsageDetailId == usage.Id && (c.Year < year || (c.Year == year && c.Month < month)))
                        .OrderByDescending(c => c.Year)
                        .ThenByDescending(c => c.Month)
                        .FirstOrDefaultAsync();

                    var previousConsumption = await GetWaterConsumptionAsync(usage.Id, previous?.Month, previous?.Year);
                    var currentConsumption = previous != null ? current.NewReading - previous.NewReading : current.NewReading;
                    if (previousConsumption.HasValue && previousConsumption.Value > 0 && currentConsumption > previousConsumption.Value * 2m)
                    {
                        reasons.Add($"Phòng có chỉ số nước tăng bất thường: {currentConsumption:N0} m³ so với tháng trước {previousConsumption.Value:N0} m³");
                    }
                }
            }
        }

        return reasons;
    }

    private async Task<decimal?> GetElectricityConsumptionAsync(long usageDetailId, byte? month, short? year)
    {
        if (!month.HasValue || !year.HasValue)
        {
            return null;
        }

        var previousReading = await _context.ChiSoDiens
            .Where(c => c.ServiceUsageDetailId == usageDetailId && (c.Year < year.Value || (c.Year == year.Value && c.Month < month.Value)))
            .OrderByDescending(c => c.Year)
            .ThenByDescending(c => c.Month)
            .FirstOrDefaultAsync();

        var monthReading = await _context.ChiSoDiens
            .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == usageDetailId && c.Month == month.Value && c.Year == year.Value);

        if (monthReading == null)
        {
            return null;
        }

        return monthReading.NewReading - (previousReading?.NewReading ?? 0);
    }

    private async Task<decimal?> GetWaterConsumptionAsync(long usageDetailId, byte? month, short? year)
    {
        if (!month.HasValue || !year.HasValue)
        {
            return null;
        }

        var previousReading = await _context.ChiSoNuocs
            .Where(c => c.ServiceUsageDetailId == usageDetailId && (c.Year < year.Value || (c.Year == year.Value && c.Month < month.Value)))
            .OrderByDescending(c => c.Year)
            .ThenByDescending(c => c.Month)
            .FirstOrDefaultAsync();

        var monthReading = await _context.ChiSoNuocs
            .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == usageDetailId && c.Month == month.Value && c.Year == year.Value);

        if (monthReading == null)
        {
            return null;
        }

        return monthReading.NewReading - (previousReading?.NewReading ?? 0);
    }

    private static bool IsElectricityService(Service? service)
    {
        if (service == null) return false;
        if (service.Id == 1) return true;

        var type = NormalizeKey(service.ServiceType);
        var name = NormalizeKey(service.Name);

        return type is "dien" or "electricity" or "electric"
            || name.Contains("dien")
            || name.Contains("electric");
    }

    private static bool IsWaterService(Service? service)
    {
        if (service == null) return false;
        if (service.Id == 2) return true;

        var type = NormalizeKey(service.ServiceType);
        var name = NormalizeKey(service.Name);

        return type is "nuoc" or "water"
            || name.Contains("nuoc")
            || name.Contains("water");
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

    private static DateTime BuildDueDate(short year, byte month, int? paymentDayOfMonth)
    {
        var day = paymentDayOfMonth.GetValueOrDefault(15);
        if (day < 1) day = 1;
        if (day > 28) day = 28;

        return DateTime.SpecifyKind(new DateTime(year, month, day).AddMonths(1), DateTimeKind.Utc);
    }

    private static DateTime? NormalizeUtc(DateTime? value)
    {
        if (!value.HasValue)
        {
            return null;
        }

        return value.Value.Kind switch
        {
            DateTimeKind.Utc => value.Value,
            DateTimeKind.Local => value.Value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)
        };
    }

    private static DateTime CreatePeriodStartUtc(short year, byte month)
    {
        return DateTime.SpecifyKind(new DateTime(year, month, 1), DateTimeKind.Utc);
    }

    private static DateTime CreatePeriodEndUtc(short year, byte month)
    {
        return CreatePeriodStartUtc(year, month).AddMonths(1).AddTicks(-1);
    }

    private static DateTime GetVietnamToday()
    {
        return DateTime.UtcNow.AddHours(7).Date;
    }

    private static DateTime GetVietnamDate(DateTime value)
    {
        var utcValue = value.Kind == DateTimeKind.Utc
            ? value
            : DateTime.SpecifyKind(value, DateTimeKind.Utc);
        return utcValue.AddHours(7).Date;
    }

    private static List<ContractBillingFormulaItem> ParseBillingFormula(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<ContractBillingFormulaItem>();
        }

        try
        {
            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var items = JsonSerializer.Deserialize<List<ContractBillingFormulaItem>>(json, options);
            return items ?? new List<ContractBillingFormulaItem>();
        }
        catch
        {
            return new List<ContractBillingFormulaItem>();
        }
    }

    private static bool IsRentFormulaItem(ContractBillingFormulaItem item)
    {
        var type = NormalizeKey(item.ItemType);
        var name = NormalizeKey(item.ServiceName);
        return type == "tienphong" || name == "tien phong";
    }

    private static bool IsElectricityFormulaItem(ContractBillingFormulaItem item)
    {
        var type = NormalizeKey(item.ItemType);
        var name = NormalizeKey(item.ServiceName);
        return type == "dien" || name.Contains("dien");
    }

    private static bool IsWaterFormulaItem(ContractBillingFormulaItem item)
    {
        var type = NormalizeKey(item.ItemType);
        var name = NormalizeKey(item.ServiceName);
        return type == "nuoc" || name.Contains("nuoc");
    }

    private static bool IsGeneralServiceFormulaItem(ContractBillingFormulaItem item)
    {
        return !IsRentFormulaItem(item)
            && !IsElectricityFormulaItem(item)
            && !IsWaterFormulaItem(item)
            && (item.ServiceId ?? 0) > 0;
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

internal class ContractBillingFormulaItem
{
    public int SortOrder { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public int? ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal? Quantity { get; set; }
    public string QuantityExpression { get; set; } = "1";
}
