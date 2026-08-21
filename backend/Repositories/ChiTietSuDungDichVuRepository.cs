using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class ChiTietSuDungDichVuRepository : Repository<ChiTietSuDungDichVu>, IChiTietSuDungDichVuRepository
{
    public ChiTietSuDungDichVuRepository(ApplicationDbContext context) : base(context)
    {
    }

    private IQueryable<ChiTietSuDungDichVu> WithDetails()
        => _dbSet
            .Include(ct => ct.Service)
            .Include(ct => ct.Resident)
            .Include(ct => ct.Vehicle)
            .Include(ct => ct.Room)
                .ThenInclude(room => room.Floor)
                    .ThenInclude(floor => floor.Building);

    private IQueryable<ChiTietSuDungDichVu> ForOwner(int ownerUserId)
        => WithDetails().Where(ct => ct.Room.Floor.Building.OwnerUserId == ownerUserId);

    public async Task<IEnumerable<ChiTietSuDungDichVu>> GetAllAsync(int ownerUserId)
    {
        return await ForOwner(ownerUserId)
            .OrderByDescending(ct => ct.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ChiTietSuDungDichVu>> GetByContractIdAsync(int hopDongId)
    {
        // ChiTietSuDungDichVu không lưu ContractId trực tiếp, cần join qua Room
        return await _dbSet
            .Include(ct => ct.Service)
            .Include(ct => ct.Resident)
            .Include(ct => ct.Vehicle)
            .Include(ct => ct.Room)
                .ThenInclude(r => r.HopDongs)
            .Where(ct => ct.Room.HopDongs.Any(hd => hd.Id == hopDongId))
            .OrderByDescending(ct => ct.CreatedAt)
            .ToListAsync();
    }

    public async Task<ChiTietSuDungDichVu?> GetByPeriodAsync(int hopDongId, int serviceId, byte kyThang, short kyNam)
    {
        // Tìm service usage trong khoảng thời gian
        var periodStart = new DateTime(kyNam, kyThang, 1);
        var periodEnd = periodStart.AddMonths(1).AddDays(-1);
        
        return await _dbSet
            .Include(ct => ct.Service)
            .Include(ct => ct.Resident)
            .Include(ct => ct.Vehicle)
            .Include(ct => ct.Room)
                .ThenInclude(r => r.HopDongs)
            .FirstOrDefaultAsync(ct => ct.Room.HopDongs.Any(hd => hd.Id == hopDongId)
                && ct.ServiceId == serviceId
                && ct.ApplyFrom <= periodEnd
                && (ct.ApplyTo == null || ct.ApplyTo >= periodStart));
    }

    public async Task<IEnumerable<ChiTietSuDungDichVu>> GetByPeriodRangeAsync(int hopDongId, DateTime from, DateTime to)
    {
        return await _dbSet
            .Include(ct => ct.Service)
            .Include(ct => ct.Resident)
            .Include(ct => ct.Vehicle)
            .Include(ct => ct.Room)
                .ThenInclude(r => r.HopDongs)
            .Where(ct => ct.Room.HopDongs.Any(hd => hd.Id == hopDongId)
                && ct.ApplyFrom <= to
                && (ct.ApplyTo == null || ct.ApplyTo >= from))
            .OrderBy(ct => ct.ApplyFrom)
            .ToListAsync();
    }

    public async Task<IEnumerable<ChiTietSuDungDichVu>> GetByResidentIdAsync(int residentId)
    {
        return await WithDetails()
            .Where(ct => ct.ResidentId == residentId)
            .OrderByDescending(ct => ct.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ChiTietSuDungDichVu>> GetByResidentIdAsync(int residentId, int ownerUserId)
    {
        return await ForOwner(ownerUserId)
            .Where(ct => ct.ResidentId == residentId)
            .OrderByDescending(ct => ct.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ChiTietSuDungDichVu>> GetByRoomIdAsync(int roomId)
    {
        return await WithDetails()
            .Where(ct => ct.RoomId == roomId)
            .OrderByDescending(ct => ct.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ChiTietSuDungDichVu>> GetByRoomIdAsync(int roomId, int ownerUserId)
    {
        return await ForOwner(ownerUserId)
            .Where(ct => ct.RoomId == roomId)
            .OrderByDescending(ct => ct.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ChiTietSuDungDichVu>> GetByServiceIdAsync(int serviceId)
    {
        return await WithDetails()
            .Where(ct => ct.ServiceId == serviceId)
            .OrderByDescending(ct => ct.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ChiTietSuDungDichVu>> GetByServiceIdAsync(int serviceId, int ownerUserId)
    {
        return await ForOwner(ownerUserId)
            .Where(ct => ct.ServiceId == serviceId)
            .OrderByDescending(ct => ct.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ChiTietSuDungDichVu>> GetActiveUsagesAsync()
    {
        var now = DateTime.UtcNow;
        return await WithDetails()
            .Where(ct => ct.ApplyTo == null || ct.ApplyTo >= now)
            .OrderByDescending(ct => ct.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ChiTietSuDungDichVu>> GetActiveUsagesAsync(int ownerUserId)
    {
        var now = DateTime.UtcNow;
        return await ForOwner(ownerUserId)
            .Where(ct => ct.ApplyTo == null || ct.ApplyTo >= now)
            .OrderByDescending(ct => ct.CreatedAt)
            .ToListAsync();
    }
}
