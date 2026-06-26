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

    public UtilityReadingService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách phòng kèm chỉ số điện/nước tháng đã chọn
    /// </summary>
    public async Task<List<RoomUtilityReadingDto>> GetMonthReadingsAsync(short year, byte month, int ownerUserId)
    {
        var periodStart = new DateTime(year, month, 1);
        var periodEnd = periodStart.AddMonths(1).AddTicks(-1);

        // Lấy phòng có hợp đồng giao với kỳ đang chọn
        var rooms = await _context.Rooms
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

        foreach (var room in rooms)
        {
            // Chỉ lấy hợp đồng giao với kỳ đang chọn
            var activeContract = room.HopDongs
                .Where(hd => hd.StartDate <= periodEnd && (hd.ExpectedEndDate == null || hd.ExpectedEndDate >= periodStart))
                .OrderByDescending(hd => hd.StartDate)
                .FirstOrDefault();
            if (activeContract == null) continue;

            var residentName = activeContract.ChiTietOs
                .Where(ct => ct.FromDate <= periodEnd && (ct.ToDate == null || ct.ToDate >= periodStart))
                .OrderBy(ct => ct.FromDate)
                .Select(ct => ct.Resident.FullName)
                .FirstOrDefault();

            // Tìm usage detail cho điện có hiệu lực trong kỳ (ServiceId = 1)
            var elecUsage = room.ChiTietSuDungDichVus
                .Where(u => u.Service.IsActive
                            && IsElectricityService(u.Service)
                            && u.ApplyFrom <= periodEnd
                            && (u.ApplyTo == null || u.ApplyTo >= periodStart))
                .OrderByDescending(u => u.ApplyFrom)
                .FirstOrDefault();
            elecUsage ??= await EnsureUtilityUsageAsync(room, activeContract, periodStart, periodEnd, ownerUserId, IsElectricityService);

            // Tìm usage detail cho nước có hiệu lực trong kỳ
            var waterUsage = room.ChiTietSuDungDichVus
                .Where(u => u.Service.IsActive
                            && IsWaterService(u.Service)
                            && u.ApplyFrom <= periodEnd
                            && (u.ApplyTo == null || u.ApplyTo >= periodStart))
                .OrderByDescending(u => u.ApplyFrom)
                .FirstOrDefault();
            waterUsage ??= await EnsureUtilityUsageAsync(room, activeContract, periodStart, periodEnd, ownerUserId, IsWaterService);

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
                var prevElec = await _context.ChiSoDiens
                    .Where(c => c.ServiceUsageDetailId == elecUsage.Id
                                && (c.Year < year || (c.Year == year && c.Month < month)))
                    .OrderByDescending(c => c.Year).ThenByDescending(c => c.Month)
                    .FirstOrDefaultAsync();
                oldElec = prevElec?.NewReading;

                var currentElec = await _context.ChiSoDiens
                    .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == elecUsage.Id
                                              && c.Month == month && c.Year == year);
                if (currentElec != null)
                {
                    newElec = currentElec.NewReading;
                    elecRecorded = true;
                    var anomaly = await EvaluateElectricityAnomalyAsync(elecUsage.Id, month, year, currentElec.NewReading);
                    elecIsAnomaly = anomaly.IsAnomaly;
                    elecAnomalyNote = anomaly.Note;
                }
            }

            if (waterUsage != null)
            {
                var prevWater = await _context.ChiSoNuocs
                    .Where(c => c.ServiceUsageDetailId == waterUsage.Id
                                && (c.Year < year || (c.Year == year && c.Month < month)))
                    .OrderByDescending(c => c.Year).ThenByDescending(c => c.Month)
                    .FirstOrDefaultAsync();
                oldWater = prevWater?.NewReading;

                var currentWater = await _context.ChiSoNuocs
                    .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == waterUsage.Id
                                              && c.Month == month && c.Year == year);
                if (currentWater != null)
                {
                    newWater = currentWater.NewReading;
                    waterRecorded = true;
                    var anomaly = await EvaluateWaterAnomalyAsync(waterUsage.Id, month, year, currentWater.NewReading);
                    waterIsAnomaly = anomaly.IsAnomaly;
                    waterAnomalyNote = anomaly.Note;
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
                WaterAnomalyNote = waterAnomalyNote
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

                // Ghi chỉ số điện
                if (dto.NewElecReading.HasValue)
                {
                    // Use the same logic as invoice calculation: get service active during the period
                    var periodStart = new DateTime(dto.Year, dto.Month, 1);
                    var periodEnd = periodStart.AddMonths(1).AddTicks(-1);
                    var elecUsage = room.ChiTietSuDungDichVus
                        .Where(u => u.Service.IsActive
                                    && IsElectricityService(u.Service)
                                    && u.ApplyFrom <= periodEnd 
                                    && (u.ApplyTo == null || u.ApplyTo >= periodStart))
                        .OrderByDescending(u => u.ApplyFrom)
                        .FirstOrDefault();
                    elecUsage ??= await EnsureUtilityUsageAsync(room, null, periodStart, periodEnd, ownerUserId, IsElectricityService);

                    if (elecUsage == null)
                    {
                        result.Errors.Add($"Phòng {room.RoomCode}: Không có dịch vụ điện");
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
                    var periodStart = new DateTime(dto.Year, dto.Month, 1);
                    var periodEnd = periodStart.AddMonths(1).AddTicks(-1);
                    var waterUsage = room.ChiTietSuDungDichVus
                        .Where(u => u.Service.IsActive
                                    && IsWaterService(u.Service)
                                    && u.ApplyFrom <= periodEnd 
                                    && (u.ApplyTo == null || u.ApplyTo >= periodStart))
                        .OrderByDescending(u => u.ApplyFrom)
                        .FirstOrDefault();
                    waterUsage ??= await EnsureUtilityUsageAsync(room, null, periodStart, periodEnd, ownerUserId, IsWaterService);

                    if (waterUsage == null)
                    {
                        result.Errors.Add($"Phòng {room.RoomCode}: Không có dịch vụ nước");
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

        return (false, null);
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
            ApplyFrom = contract.StartDate > periodStart ? contract.StartDate : periodStart,
            ApplyTo = contract.ExpectedEndDate,
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
}
