using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;

namespace backend.Services;

public interface IUtilityReadingService
{
    Task<List<RoomUtilityReadingDto>> GetMonthReadingsAsync(short year, byte month, int ownerUserId);
    Task<BatchReadingResultDto> RecordBatchAsync(List<RecordUtilityReadingDto> readings, int recordedByUserId, int ownerUserId);
}

public class UtilityReadingService : IUtilityReadingService
{
    private readonly ApplicationDbContext _context;
    private const decimal AnomalyIncreaseFactor = 2m;
    private const decimal HighElectricityConsumptionThreshold = 1000m;
    private const decimal HighWaterConsumptionThreshold = 100m;

    public UtilityReadingService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách phòng kèm chỉ số điện/nước tháng đã chọn
    /// </summary>
    public async Task<List<RoomUtilityReadingDto>> GetMonthReadingsAsync(short year, byte month, int ownerUserId)
    {
        var periodStart = CreatePeriodStartUtc(year, month);
        var periodEnd = CreatePeriodEndUtc(year, month);

        // Lấy phòng có hợp đồng giao với kỳ đang chọn
        var rooms = await _context.Rooms
            .AsNoTracking()
            .Include(r => r.Floor).ThenInclude(f => f.Building)
            .Include(r => r.HopDongs).ThenInclude(hd => hd.ChiTietOs).ThenInclude(ct => ct.Resident)
            .Include(r => r.ChiTietSuDungDichVus).ThenInclude(ctsdv => ctsdv.Service)
            .Where(r => r.Floor.Building.OwnerUserId == ownerUserId
                && r.HopDongs.Any(hd =>
                hd.StartDate <= periodEnd &&
                (hd.ExpectedEndDate == null || hd.ExpectedEndDate >= periodStart) &&
                hd.ChiTietOs.Any(ct => ct.FromDate <= periodEnd && (ct.ToDate == null || ct.ToDate >= periodStart))))
            .ToListAsync();

        var result = new List<RoomUtilityReadingDto>();
        var activeContractByRoomId = rooms
            .Select(room => new
            {
                RoomId = room.Id,
                Contract = room.HopDongs
                    .Where(hd => hd.StartDate <= periodEnd && (hd.ExpectedEndDate == null || hd.ExpectedEndDate >= periodStart))
                    .OrderByDescending(hd => hd.StartDate)
                    .FirstOrDefault()
            })
            .Where(item => item.Contract != null)
            .ToDictionary(item => item.RoomId, item => item.Contract!);

        var activeContractIds = activeContractByRoomId.Values.Select(contract => contract.Id).Distinct().ToList();
        var sentInvoices = activeContractIds.Count == 0
            ? new List<HoaDon>()
            : await _context.HoaDons
                .AsNoTracking()
                .Where(invoice =>
                    activeContractIds.Contains(invoice.ContractId)
                    && invoice.Month == month
                    && invoice.Year == year
                    && invoice.Status != "Nháp"
                    && invoice.Status != "Bị từ chối")
                .ToListAsync();
        var sentInvoiceByContractId = sentInvoices
            .GroupBy(invoice => invoice.ContractId)
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(invoice => invoice.Id).First());

        var allElectricityCandidateIds = rooms
            .SelectMany(room => room.ChiTietSuDungDichVus)
            .Where(usage => usage.Service != null
                && usage.Service.IsActive
                && IsElectricityService(usage.Service)
                && usage.ApplyFrom <= periodEnd
                && (usage.ApplyTo == null || usage.ApplyTo >= periodStart))
            .Select(usage => usage.Id)
            .Distinct()
            .ToList();

        var allWaterCandidateIds = rooms
            .SelectMany(room => room.ChiTietSuDungDichVus)
            .Where(usage => usage.Service != null
                && usage.Service.IsActive
                && IsWaterService(usage.Service)
                && usage.ApplyFrom <= periodEnd
                && (usage.ApplyTo == null || usage.ApplyTo >= periodStart))
            .Select(usage => usage.Id)
            .Distinct()
            .ToList();

        var recordedElectricityUsageIds = allElectricityCandidateIds.Count == 0
            ? new HashSet<long>()
            : (await _context.ChiSoDiens
                .AsNoTracking()
                .Where(reading => allElectricityCandidateIds.Contains(reading.ServiceUsageDetailId)
                    && reading.Month == month
                    && reading.Year == year)
                .Select(reading => reading.ServiceUsageDetailId)
                .ToListAsync())
                .ToHashSet();

        var recordedWaterUsageIds = allWaterCandidateIds.Count == 0
            ? new HashSet<long>()
            : (await _context.ChiSoNuocs
                .AsNoTracking()
                .Where(reading => allWaterCandidateIds.Contains(reading.ServiceUsageDetailId)
                    && reading.Month == month
                    && reading.Year == year)
                .Select(reading => reading.ServiceUsageDetailId)
                .ToListAsync())
                .ToHashSet();

        ChiTietSuDungDichVu? SelectUtilityUsage(
            IEnumerable<ChiTietSuDungDichVu> usages,
            Func<Service?, bool> serviceMatcher,
            HashSet<long> recordedUsageIds)
        {
            var candidates = usages
                .Where(usage => usage.Service != null
                    && usage.Service.IsActive
                    && serviceMatcher(usage.Service)
                    && usage.ApplyFrom <= periodEnd
                    && (usage.ApplyTo == null || usage.ApplyTo >= periodStart))
                .OrderByDescending(usage => usage.ApplyFrom)
                .ThenByDescending(usage => usage.Id)
                .ToList();

            return candidates.FirstOrDefault(usage => recordedUsageIds.Contains(usage.Id))
                ?? candidates.FirstOrDefault();
        }

        var selectedElectricityUsageByRoomId = rooms
            .Select(room => new
            {
                RoomId = room.Id,
                Usage = SelectUtilityUsage(room.ChiTietSuDungDichVus, IsElectricityService, recordedElectricityUsageIds)
            })
            .Where(item => item.Usage != null)
            .ToDictionary(item => item.RoomId, item => item.Usage!);

        var selectedWaterUsageByRoomId = rooms
            .Select(room => new
            {
                RoomId = room.Id,
                Usage = SelectUtilityUsage(room.ChiTietSuDungDichVus, IsWaterService, recordedWaterUsageIds)
            })
            .Where(item => item.Usage != null)
            .ToDictionary(item => item.RoomId, item => item.Usage!);

        var selectedElectricityUsageIds = selectedElectricityUsageByRoomId.Values.Select(usage => usage.Id).Distinct().ToList();
        var selectedWaterUsageIds = selectedWaterUsageByRoomId.Values.Select(usage => usage.Id).Distinct().ToList();

        var electricityReadingsByUsageId = selectedElectricityUsageIds.Count == 0
            ? new Dictionary<long, List<ChiSoDien>>()
            : (await _context.ChiSoDiens
                .AsNoTracking()
                .Where(reading => selectedElectricityUsageIds.Contains(reading.ServiceUsageDetailId)
                    && (reading.Year < year || (reading.Year == year && reading.Month <= month)))
                .OrderByDescending(reading => reading.Year)
                .ThenByDescending(reading => reading.Month)
                .ToListAsync())
                .GroupBy(reading => reading.ServiceUsageDetailId)
                .ToDictionary(group => group.Key, group => group.ToList());

        var waterReadingsByUsageId = selectedWaterUsageIds.Count == 0
            ? new Dictionary<long, List<ChiSoNuoc>>()
            : (await _context.ChiSoNuocs
                .AsNoTracking()
                .Where(reading => selectedWaterUsageIds.Contains(reading.ServiceUsageDetailId)
                    && (reading.Year < year || (reading.Year == year && reading.Month <= month)))
                .OrderByDescending(reading => reading.Year)
                .ThenByDescending(reading => reading.Month)
                .ToListAsync())
                .GroupBy(reading => reading.ServiceUsageDetailId)
                .ToDictionary(group => group.Key, group => group.ToList());

        foreach (var room in rooms)
        {
            // Chỉ lấy hợp đồng giao với kỳ đang chọn
            if (!activeContractByRoomId.TryGetValue(room.Id, out var activeContract)) continue;

            var residentName = activeContract.ChiTietOs
                .Where(ct => ct.FromDate <= periodEnd && (ct.ToDate == null || ct.ToDate >= periodStart))
                .OrderBy(ct => ct.FromDate)
                .Select(ct => ct.Resident != null ? ct.Resident.FullName : null)
                .FirstOrDefault();

            sentInvoiceByContractId.TryGetValue(activeContract.Id, out var sentInvoice);
            var readingsLocked = sentInvoice != null;

            // Tìm usage detail cho điện có hiệu lực trong kỳ (ServiceId = 1)
            selectedElectricityUsageByRoomId.TryGetValue(room.Id, out var elecUsage);

            // Tìm usage detail cho nước có hiệu lực trong kỳ
            selectedWaterUsageByRoomId.TryGetValue(room.Id, out var waterUsage);

            // Lấy chỉ số cũ (tháng trước)
            decimal? oldElec = null;
            decimal? oldWater = null;
            decimal? newElec = null;
            decimal? newWater = null;
            bool elecRecorded = false;
            bool waterRecorded = false;
            bool elecIsAnomaly = false;
            string? elecAnomalyNote = null;
            bool waterIsAnomaly = false;
            string? waterAnomalyNote = null;

            if (elecUsage != null)
            {
                var elecReadings = electricityReadingsByUsageId.TryGetValue(elecUsage.Id, out var readings)
                    ? readings
                    : new List<ChiSoDien>();
                var prevElec = elecReadings.FirstOrDefault(c => c.Year < year || (c.Year == year && c.Month < month));
                oldElec = prevElec?.NewReading;

                var currentElec = elecReadings.FirstOrDefault(c => c.Month == month && c.Year == year);
                if (currentElec != null)
                {
                    newElec = currentElec.NewReading;
                    elecRecorded = true;
                    elecIsAnomaly = currentElec.IsAnomaly;
                    elecAnomalyNote = currentElec.AnomalyNote;
                }
            }

            if (waterUsage != null)
            {
                var waterReadings = waterReadingsByUsageId.TryGetValue(waterUsage.Id, out var readings)
                    ? readings
                    : new List<ChiSoNuoc>();
                var prevWater = waterReadings.FirstOrDefault(c => c.Year < year || (c.Year == year && c.Month < month));
                oldWater = prevWater?.NewReading;

                var currentWater = waterReadings.FirstOrDefault(c => c.Month == month && c.Year == year);
                if (currentWater != null)
                {
                    newWater = currentWater.NewReading;
                    waterRecorded = true;
                    waterIsAnomaly = currentWater.IsAnomaly;
                    waterAnomalyNote = currentWater.AnomalyNote;
                }
            }

            result.Add(new RoomUtilityReadingDto
            {
                RoomId = room.Id,
                RoomCode = room.RoomCode,
                BuildingName = room.Floor?.Building?.BuildingName,
                FloorName = room.Floor?.FloorNumber.ToString(),
                ResidentName = residentName,
                ElecUsageDetailId = elecUsage?.Id,
                OldElecReading = oldElec,
                NewElecReading = newElec,
                ElecRecorded = elecRecorded,
                ElecIsAnomaly = elecIsAnomaly,
                ElecAnomalyNote = elecAnomalyNote,
                WaterUsageDetailId = waterUsage?.Id,
                OldWaterReading = oldWater,
                NewWaterReading = newWater,
                WaterRecorded = waterRecorded,
                WaterIsAnomaly = waterIsAnomaly,
                WaterAnomalyNote = waterAnomalyNote,
                ReadingsLocked = readingsLocked,
                ReadingsLockReason = readingsLocked
                    ? $"Hóa đơn tháng {month}/{year} đã gửi cho cư dân (trạng thái: {sentInvoice!.Status})"
                    : null
            });
        }

        return result.OrderBy(r => r.BuildingName).ThenBy(r => r.RoomCode).ToList();
    }

    /// <summary>
    /// Chốt chỉ số điện/nước hàng loạt
    /// </summary>
    public async Task<BatchReadingResultDto> RecordBatchAsync(List<RecordUtilityReadingDto> readings, int recordedByUserId, int ownerUserId)
    {
        var result = new BatchReadingResultDto();

        foreach (var dto in readings)
        {
            try
            {
                var room = await _context.Rooms
                    .Include(r => r.Floor).ThenInclude(f => f.Building)
                    .Include(r => r.ChiTietSuDungDichVus).ThenInclude(u => u.Service)
                    .FirstOrDefaultAsync(r => r.Id == dto.RoomId && r.Floor.Building.OwnerUserId == ownerUserId);

                if (room == null)
                {
                    result.Failed++;
                    result.Errors.Add($"Phòng ID {dto.RoomId} không tồn tại");
                    continue;
                }

                var periodStart = CreatePeriodStartUtc(dto.Year, dto.Month);
                var periodEnd = CreatePeriodEndUtc(dto.Year, dto.Month);
                var activeContract = await _context.HopDongs
                    .Where(hd => hd.RoomId == dto.RoomId
                                 && hd.StartDate <= periodEnd
                                 && (hd.ExpectedEndDate == null || hd.ExpectedEndDate >= periodStart))
                    .OrderByDescending(hd => hd.StartDate)
                    .FirstOrDefaultAsync();
                var sentInvoice = activeContract == null
                    ? null
                    : await GetSentInvoiceAsync(activeContract.Id, dto.Month, dto.Year);
                if (sentInvoice != null)
                {
                    result.Failed++;
                    result.Errors.Add($"Phòng {room.RoomCode}: Không thể sửa chỉ số vì hóa đơn tháng {dto.Month}/{dto.Year} đã gửi cho cư dân (trạng thái: {sentInvoice.Status})");
                    continue;
                }

                var futureSentInvoice = activeContract == null
                    ? null
                    : await GetFutureSentInvoiceAsync(activeContract.Id, dto.Month, dto.Year);
                if (futureSentInvoice != null)
                {
                    result.Failed++;
                    result.Errors.Add($"Phòng {room.RoomCode}: Không thể nhập/sửa chỉ số tháng {dto.Month}/{dto.Year} vì đã gửi hóa đơn kỳ sau ({futureSentInvoice.Month}/{futureSentInvoice.Year}, trạng thái: {futureSentInvoice.Status})");
                    continue;
                }

                // Ghi chỉ số điện
                if (dto.NewElecReading.HasValue)
                {
                    // Use the same logic as invoice calculation: get service active during the period
                    var elecUsage = SelectSubmittedUtilityUsage(
                        room.ChiTietSuDungDichVus,
                        dto.ElecUsageDetailId,
                        periodStart,
                        periodEnd,
                        IsElectricityService)
                        ?? room.ChiTietSuDungDichVus
                        .Where(u => u.Service != null
                                    && u.Service.IsActive
                                    && IsElectricityService(u.Service)
                                    && u.ApplyFrom <= periodEnd 
                                    && (u.ApplyTo == null || u.ApplyTo >= periodStart))
                        .OrderByDescending(u => u.ApplyFrom)
                        .FirstOrDefault();
                    if (elecUsage == null)
                    {
                        result.Warnings.Add($"Phòng {room.RoomCode}: Không áp dụng dịch vụ điện, bỏ qua chỉ số điện");
                    }
                    else
                    {
                        // Validate: new >= old
                        var prevElec = await _context.ChiSoDiens
                            .Where(c => c.ServiceUsageDetailId == elecUsage.Id
                                        && (c.Year < dto.Year || (c.Year == dto.Year && c.Month < dto.Month)))
                            .OrderByDescending(c => c.Year).ThenByDescending(c => c.Month)
                            .FirstOrDefaultAsync();

                        if (prevElec != null && dto.NewElecReading < prevElec.NewReading)
                        {
                            result.Errors.Add($"Phòng {room.RoomCode}: Chỉ số điện mới ({dto.NewElecReading}) < cũ ({prevElec.NewReading})");
                        }
                        else
                        {
                            var existing = await _context.ChiSoDiens
                                .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == elecUsage.Id
                                                          && c.Month == dto.Month && c.Year == dto.Year);
                            if (existing != null)
                            {
                                existing.NewReading = dto.NewElecReading.Value;
                                var anomaly = await EvaluateElectricityAnomalyAsync(elecUsage.Id, dto.Month, dto.Year, dto.NewElecReading.Value);
                                existing.IsAnomaly = anomaly.IsAnomaly;
                                existing.AnomalyNote = anomaly.Note;
                                existing.CreatedAt = DateTime.UtcNow;
                                existing.CreatedBy = recordedByUserId;

                                if (existing.IsAnomaly)
                                {
                                    result.Warnings.Add($"Phòng {room.RoomCode}: {existing.AnomalyNote}");
                                }
                            }
                            else
                            {
                                var anomaly = await EvaluateElectricityAnomalyAsync(elecUsage.Id, dto.Month, dto.Year, dto.NewElecReading.Value);
                                _context.ChiSoDiens.Add(new ChiSoDien
                                {
                                    ServiceUsageDetailId = elecUsage.Id,
                                    Month = dto.Month,
                                    Year = dto.Year,
                                    NewReading = dto.NewElecReading.Value,
                                    IsAnomaly = anomaly.IsAnomaly,
                                    AnomalyNote = anomaly.Note,
                                    CreatedAt = DateTime.UtcNow,
                                    CreatedBy = recordedByUserId
                                });

                                if (anomaly.IsAnomaly)
                                {
                                    result.Warnings.Add($"Phòng {room.RoomCode}: {anomaly.Note}");
                                }
                            }
                        }
                    }
                }

                // Ghi chỉ số nước
                if (dto.NewWaterReading.HasValue)
                {
                    // Use the same logic as invoice calculation: get service active during the period
                    var waterUsage = SelectSubmittedUtilityUsage(
                        room.ChiTietSuDungDichVus,
                        dto.WaterUsageDetailId,
                        periodStart,
                        periodEnd,
                        IsWaterService)
                        ?? room.ChiTietSuDungDichVus
                        .Where(u => u.Service != null
                                    && u.Service.IsActive
                                    && IsWaterService(u.Service)
                                    && u.ApplyFrom <= periodEnd 
                                    && (u.ApplyTo == null || u.ApplyTo >= periodStart))
                        .OrderByDescending(u => u.ApplyFrom)
                        .FirstOrDefault();
                    if (waterUsage == null)
                    {
                        result.Warnings.Add($"Phòng {room.RoomCode}: Không áp dụng dịch vụ nước, bỏ qua chỉ số nước");
                    }
                    else
                    {
                        var prevWater = await _context.ChiSoNuocs
                            .Where(c => c.ServiceUsageDetailId == waterUsage.Id
                                        && (c.Year < dto.Year || (c.Year == dto.Year && c.Month < dto.Month)))
                            .OrderByDescending(c => c.Year).ThenByDescending(c => c.Month)
                            .FirstOrDefaultAsync();

                        if (prevWater != null && dto.NewWaterReading < prevWater.NewReading)
                        {
                            result.Errors.Add($"Phòng {room.RoomCode}: Chỉ số nước mới ({dto.NewWaterReading}) < cũ ({prevWater.NewReading})");
                        }
                        else
                        {
                            var existing = await _context.ChiSoNuocs
                                .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == waterUsage.Id
                                                          && c.Month == dto.Month && c.Year == dto.Year);
                            if (existing != null)
                            {
                                existing.NewReading = dto.NewWaterReading.Value;
                                var anomaly = await EvaluateWaterAnomalyAsync(waterUsage.Id, dto.Month, dto.Year, dto.NewWaterReading.Value);
                                existing.IsAnomaly = anomaly.IsAnomaly;
                                existing.AnomalyNote = anomaly.Note;
                                existing.CreatedAt = DateTime.UtcNow;
                                existing.CreatedBy = recordedByUserId;

                                if (existing.IsAnomaly)
                                {
                                    result.Warnings.Add($"Phòng {room.RoomCode}: {existing.AnomalyNote}");
                                }
                            }
                            else
                            {
                                var anomaly = await EvaluateWaterAnomalyAsync(waterUsage.Id, dto.Month, dto.Year, dto.NewWaterReading.Value);
                                _context.ChiSoNuocs.Add(new ChiSoNuoc
                                {
                                    ServiceUsageDetailId = waterUsage.Id,
                                    Month = dto.Month,
                                    Year = dto.Year,
                                    NewReading = dto.NewWaterReading.Value,
                                    IsAnomaly = anomaly.IsAnomaly,
                                    AnomalyNote = anomaly.Note,
                                    CreatedAt = DateTime.UtcNow,
                                    CreatedBy = recordedByUserId
                                });

                                if (anomaly.IsAnomaly)
                                {
                                    result.Warnings.Add($"Phòng {room.RoomCode}: {anomaly.Note}");
                                }
                            }
                        }
                    }
                }

                result.Success++;
            }
            catch (Exception ex)
            {
                result.Failed++;
                result.Errors.Add($"Phòng ID {dto.RoomId}: {ex.Message}");
            }
        }

        await _context.SaveChangesAsync();
        return result;
    }

    private async Task<(bool IsAnomaly, string? Note)> EvaluateElectricityAnomalyAsync(long usageDetailId, byte month, short year, decimal currentReading)
    {
        var previousReading = await _context.ChiSoDiens
            .Where(c => c.ServiceUsageDetailId == usageDetailId && (c.Year < year || (c.Year == year && c.Month < month)))
            .OrderByDescending(c => c.Year)
            .ThenByDescending(c => c.Month)
            .FirstOrDefaultAsync();

        var previousConsumption = await GetElectricityConsumptionAsync(usageDetailId, previousReading?.Month, previousReading?.Year);
        var currentConsumption = previousReading != null ? currentReading - previousReading.NewReading : currentReading;

        if (previousConsumption.HasValue && previousConsumption.Value > 0 && currentConsumption > previousConsumption.Value * AnomalyIncreaseFactor)
        {
            return (true, $"Chỉ số điện tăng bất thường: kỳ này {currentConsumption:N0} kWh, tháng trước {previousConsumption.Value:N0} kWh");
        }

        if (currentConsumption > HighElectricityConsumptionThreshold)
        {
            return (true, $"Chỉ số điện cao bất thường: kỳ này {currentConsumption:N0} kWh, vượt ngưỡng kiểm tra {HighElectricityConsumptionThreshold:N0} kWh");
        }

        return (false, null);
    }

    private async Task<HoaDon?> GetSentInvoiceAsync(int contractId, byte month, short year)
    {
        return await _context.HoaDons
            .AsNoTracking()
            .FirstOrDefaultAsync(invoice =>
                invoice.ContractId == contractId
                && invoice.Month == month
                && invoice.Year == year
                && invoice.Status != "Nháp"
                && invoice.Status != "Bị từ chối");
    }

    private async Task<HoaDon?> GetFutureSentInvoiceAsync(int contractId, byte month, short year)
    {
        return await _context.HoaDons
            .AsNoTracking()
            .Where(invoice =>
                invoice.ContractId == contractId
                && (invoice.Year > year || (invoice.Year == year && invoice.Month > month))
                && invoice.Status != "Nháp"
                && invoice.Status != "Bị từ chối")
            .OrderBy(invoice => invoice.Year)
            .ThenBy(invoice => invoice.Month)
            .FirstOrDefaultAsync();
    }

    private async Task<(bool IsAnomaly, string? Note)> EvaluateWaterAnomalyAsync(long usageDetailId, byte month, short year, decimal currentReading)
    {
        var previousReading = await _context.ChiSoNuocs
            .Where(c => c.ServiceUsageDetailId == usageDetailId && (c.Year < year || (c.Year == year && c.Month < month)))
            .OrderByDescending(c => c.Year)
            .ThenByDescending(c => c.Month)
            .FirstOrDefaultAsync();

        var previousConsumption = await GetWaterConsumptionAsync(usageDetailId, previousReading?.Month, previousReading?.Year);
        var currentConsumption = previousReading != null ? currentReading - previousReading.NewReading : currentReading;

        if (previousConsumption.HasValue && previousConsumption.Value > 0 && currentConsumption > previousConsumption.Value * AnomalyIncreaseFactor)
        {
            return (true, $"Chỉ số nước tăng bất thường: kỳ này {currentConsumption:N0} m³, tháng trước {previousConsumption.Value:N0} m³");
        }

        if (currentConsumption > HighWaterConsumptionThreshold)
        {
            return (true, $"Chỉ số nước cao bất thường: kỳ này {currentConsumption:N0} m³, vượt ngưỡng kiểm tra {HighWaterConsumptionThreshold:N0} m³");
        }

        return (false, null);
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

    private async Task<ChiTietSuDungDichVu?> EnsureUtilityUsageAsync(
        Room room,
        HopDong? activeContract,
        DateTime periodStart,
        DateTime periodEnd,
        int ownerUserId,
        Func<Service?, bool> serviceMatcher)
    {
        periodStart = EnsureUtc(periodStart);
        periodEnd = EnsureUtc(periodEnd);

        var contract = activeContract ?? await _context.HopDongs
            .Include(hd => hd.ChiTietOs)
            .Where(hd => hd.RoomId == room.Id
                && hd.StartDate <= periodEnd
                && (hd.ExpectedEndDate == null || hd.ExpectedEndDate >= periodStart))
            .OrderByDescending(hd => hd.StartDate)
            .FirstOrDefaultAsync();

        if (contract == null)
        {
            return null;
        }

        var primaryResidentId = contract.ChiTietOs
            .Where(ct => ct.FromDate <= periodEnd && (ct.ToDate == null || ct.ToDate >= periodStart))
            .OrderBy(ct => ct.ResidencyRole == "Người thuê chính" ? 0 : 1)
            .ThenBy(ct => ct.FromDate)
            .Select(ct => ct.ResidentId)
            .FirstOrDefault();

        if (primaryResidentId <= 0)
        {
            return null;
        }

        var roomBuildingId = room.Floor?.BuildingId;
        var service = await _context.Services
            .AsNoTracking()
            .Include(item => item.BuildingScopes)
            .Where(item => item.OwnerUserId == ownerUserId
                && item.IsActive
                && (item.BuildingScopes.Count == 0 || item.BuildingScopes.Any(scope => scope.BuildingId == roomBuildingId)))
            .OrderByDescending(item => item.BuildingScopes.Any(scope => scope.BuildingId == roomBuildingId))
            .ThenBy(item => item.Id)
            .ToListAsync();

        var matchedService = service.FirstOrDefault(serviceMatcher);
        if (matchedService == null)
        {
            return null;
        }

        var existingUsage = await _context.ChiTietSuDungDichVus
            .Include(item => item.Service)
            .FirstOrDefaultAsync(item => item.RoomId == room.Id
                && item.ServiceId == matchedService.Id
                && item.ApplyFrom <= periodEnd
                && (item.ApplyTo == null || item.ApplyTo >= periodStart));
        if (existingUsage != null)
        {
            return existingUsage;
        }

        var usage = new ChiTietSuDungDichVu
        {
            ServiceId = matchedService.Id,
            ResidentId = primaryResidentId,
            RoomId = room.Id,
            ApplyFrom = EnsureUtc(contract.StartDate > periodStart ? contract.StartDate : periodStart),
            ApplyTo = EnsureUtcOrNull(contract.ExpectedEndDate),
            Quantity = 1,
            CreatedAt = DateTime.UtcNow,
            Note = "Tự tạo khi chốt chỉ số điện/nước"
        };

        _context.ChiTietSuDungDichVus.Add(usage);
        await _context.SaveChangesAsync();
        usage.Service = matchedService;
        room.ChiTietSuDungDichVus.Add(usage);

        return usage;
    }

    private static DateTime EnsureUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    private static DateTime? EnsureUtcOrNull(DateTime? value)
    {
        return value.HasValue ? EnsureUtc(value.Value) : null;
    }

    private static bool IsElectricityService(Service? service)
    {
        if (service == null) return false;

        var type = NormalizeKey(service.ServiceType);
        var name = NormalizeKey(service.Name);

        return type is "dien" or "electricity" or "electric"
            || name.Contains("dien")
            || name.Contains("electric");
    }

    private static bool IsWaterService(Service? service)
    {
        if (service == null) return false;

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

    private static ChiTietSuDungDichVu? SelectSubmittedUtilityUsage(
        IEnumerable<ChiTietSuDungDichVu> usages,
        long? usageDetailId,
        DateTime periodStart,
        DateTime periodEnd,
        Func<Service?, bool> serviceMatcher)
    {
        if (!usageDetailId.HasValue)
        {
            return null;
        }

        return usages.FirstOrDefault(u => u.Id == usageDetailId.Value
            && u.Service != null
            && u.Service.IsActive
            && serviceMatcher(u.Service)
            && u.ApplyFrom <= periodEnd
            && (u.ApplyTo == null || u.ApplyTo >= periodStart));
    }

    private async Task<ChiTietSuDungDichVu?> SelectElectricityUsageAsync(
        IEnumerable<ChiTietSuDungDichVu> usages,
        DateTime periodStart,
        DateTime periodEnd,
        byte month,
        short year)
    {
        var candidates = usages
            .Where(u => u.Service != null
                && u.Service.IsActive
                && IsElectricityService(u.Service)
                && u.ApplyFrom <= periodEnd
                && (u.ApplyTo == null || u.ApplyTo >= periodStart))
            .OrderByDescending(u => u.ApplyFrom)
            .ThenByDescending(u => u.Id)
            .ToList();
        if (candidates.Count == 0)
        {
            return null;
        }

        var candidateIds = candidates.Select(u => u.Id).ToList();
        var recordedUsageIds = await _context.ChiSoDiens
            .Where(reading => candidateIds.Contains(reading.ServiceUsageDetailId)
                && reading.Month == month
                && reading.Year == year)
            .Select(reading => reading.ServiceUsageDetailId)
            .ToListAsync();

        return candidates.FirstOrDefault(usage => recordedUsageIds.Contains(usage.Id))
            ?? candidates.First();
    }

    private async Task<ChiTietSuDungDichVu?> SelectWaterUsageAsync(
        IEnumerable<ChiTietSuDungDichVu> usages,
        DateTime periodStart,
        DateTime periodEnd,
        byte month,
        short year)
    {
        var candidates = usages
            .Where(u => u.Service != null
                && u.Service.IsActive
                && IsWaterService(u.Service)
                && u.ApplyFrom <= periodEnd
                && (u.ApplyTo == null || u.ApplyTo >= periodStart))
            .OrderByDescending(u => u.ApplyFrom)
            .ThenByDescending(u => u.Id)
            .ToList();
        if (candidates.Count == 0)
        {
            return null;
        }

        var candidateIds = candidates.Select(u => u.Id).ToList();
        var recordedUsageIds = await _context.ChiSoNuocs
            .Where(reading => candidateIds.Contains(reading.ServiceUsageDetailId)
                && reading.Month == month
                && reading.Year == year)
            .Select(reading => reading.ServiceUsageDetailId)
            .ToListAsync();

        return candidates.FirstOrDefault(usage => recordedUsageIds.Contains(usage.Id))
            ?? candidates.First();
    }

    private static DateTime CreatePeriodStartUtc(short year, byte month)
    {
        return DateTime.SpecifyKind(new DateTime(year, month, 1), DateTimeKind.Utc);
    }

    private static DateTime CreatePeriodEndUtc(short year, byte month)
    {
        return CreatePeriodStartUtc(year, month).AddMonths(1).AddTicks(-1);
    }
}
