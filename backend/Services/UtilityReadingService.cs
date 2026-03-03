using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IUtilityReadingService
{
    Task<List<RoomUtilityReadingDto>> GetMonthReadingsAsync(short year, byte month);
    Task<BatchReadingResultDto> RecordBatchAsync(List<RecordUtilityReadingDto> readings, int recordedByUserId);
}

public class UtilityReadingService : IUtilityReadingService
{
    private readonly ApplicationDbContext _context;

    public UtilityReadingService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách phòng kèm chỉ số điện/nước tháng đã chọn
    /// </summary>
    public async Task<List<RoomUtilityReadingDto>> GetMonthReadingsAsync(short year, byte month)
    {
        // Lấy tất cả phòng đang có hợp đồng active (chưa tất toán)
        var rooms = await _context.Rooms
            .Include(r => r.Floor).ThenInclude(f => f.Building)
            .Include(r => r.HopDongs).ThenInclude(hd => hd.ChiTietOs).ThenInclude(ct => ct.Resident)
            .Include(r => r.ChiTietSuDungDichVus).ThenInclude(ctsdv => ctsdv.Service)
            .Where(r => r.HopDongs.Any(hd => hd.ChiTietOs.Any()))
            .ToListAsync();

        var result = new List<RoomUtilityReadingDto>();

        foreach (var room in rooms)
        {
            // Lấy hợp đồng active: chưa tất toán
            var activeContract = room.HopDongs.FirstOrDefault();
            if (activeContract == null) continue;

            var residentName = activeContract.ChiTietOs.FirstOrDefault()?.Resident?.FullName;

            // Tìm usage detail cho điện (ServiceId = 1)
            var elecUsage = room.ChiTietSuDungDichVus
                .FirstOrDefault(u => u.ServiceId == 1 && u.ApplyTo == null);

            // Tìm usage detail cho nước (ServiceId = 2)
            var waterUsage = room.ChiTietSuDungDichVus
                .FirstOrDefault(u => u.ServiceId == 2 && u.ApplyTo == null);

            // Lấy chỉ số cũ (tháng trước)
            decimal? oldElec = null;
            decimal? oldWater = null;
            decimal? newElec = null;
            decimal? newWater = null;
            bool elecRecorded = false;
            bool waterRecorded = false;

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
                WaterUsageDetailId = waterUsage?.Id,
                OldWaterReading = oldWater,
                NewWaterReading = newWater,
                WaterRecorded = waterRecorded
            });
        }

        return result.OrderBy(r => r.BuildingName).ThenBy(r => r.RoomCode).ToList();
    }

    /// <summary>
    /// Chốt chỉ số điện/nước hàng loạt
    /// </summary>
    public async Task<BatchReadingResultDto> RecordBatchAsync(List<RecordUtilityReadingDto> readings, int recordedByUserId)
    {
        var result = new BatchReadingResultDto();

        foreach (var dto in readings)
        {
            try
            {
                var room = await _context.Rooms
                    .Include(r => r.ChiTietSuDungDichVus).ThenInclude(u => u.Service)
                    .FirstOrDefaultAsync(r => r.Id == dto.RoomId);

                if (room == null)
                {
                    result.Failed++;
                    result.Errors.Add($"Phòng ID {dto.RoomId} không tồn tại");
                    continue;
                }

                // Ghi chỉ số điện
                if (dto.NewElecReading.HasValue)
                {
                    var elecUsage = room.ChiTietSuDungDichVus
                        .FirstOrDefault(u => u.ServiceId == 1 && u.ApplyTo == null);

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
                                existing.CreatedAt = DateTime.UtcNow;
                                existing.CreatedBy = recordedByUserId;
                            }
                            else
                            {
                                _context.ChiSoDiens.Add(new ChiSoDien
                                {
                                    ServiceUsageDetailId = elecUsage.Id,
                                    Month = dto.Month,
                                    Year = dto.Year,
                                    NewReading = dto.NewElecReading.Value,
                                    CreatedAt = DateTime.UtcNow,
                                    CreatedBy = recordedByUserId
                                });
                            }
                        }
                    }
                }

                // Ghi chỉ số nước
                if (dto.NewWaterReading.HasValue)
                {
                    var waterUsage = room.ChiTietSuDungDichVus
                        .FirstOrDefault(u => u.ServiceId == 2 && u.ApplyTo == null);

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
                                existing.CreatedAt = DateTime.UtcNow;
                                existing.CreatedBy = recordedByUserId;
                            }
                            else
                            {
                                _context.ChiSoNuocs.Add(new ChiSoNuoc
                                {
                                    ServiceUsageDetailId = waterUsage.Id,
                                    Month = dto.Month,
                                    Year = dto.Year,
                                    NewReading = dto.NewWaterReading.Value,
                                    CreatedAt = DateTime.UtcNow,
                                    CreatedBy = recordedByUserId
                                });
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
}
