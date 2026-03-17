using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class HopDongRepository : Repository<HopDong>, IHopDongRepository
{
    public HopDongRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<IEnumerable<HopDong>> GetAllAsync()
    {
        return await _dbSet
            .Include(hd => hd.Room)
            .Include(hd => hd.ChiTietOs)
                .ThenInclude(ct => ct.Resident)
                    .ThenInclude(r => r.Users)
            .OrderByDescending(hd => hd.StartDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<HopDong>> GetByRoomIdAsync(int roomId)
    {
        return await _dbSet
            .Include(hd => hd.Room)
            .Include(hd => hd.ChiTietOs)
                .ThenInclude(ct => ct.Resident)
                    .ThenInclude(r => r.Users)
            .Where(hd => hd.RoomId == roomId)
            .OrderByDescending(hd => hd.StartDate)
            .ToListAsync();
    }

    public async Task<HopDong?> GetActiveByRoomIdAsync(int roomId)
    {
        var today = DateTime.UtcNow;
        return await _dbSet
            .Include(hd => hd.Room)
            .Include(hd => hd.ChiTietOs)
                .ThenInclude(ct => ct.Resident)
                    .ThenInclude(r => r.Users)
            .Where(hd => hd.RoomId == roomId 
                && hd.StartDate <= today 
                && (hd.ExpectedEndDate == null || hd.ExpectedEndDate >= today))
            .FirstOrDefaultAsync();
    }

    public async Task<HopDong?> GetWithDetailsAsync(int id)
    {
        return await _dbSet
            .Include(hd => hd.Room)
                .ThenInclude(p => p.Floor)
                    .ThenInclude(f => f.Building)
            .Include(hd => hd.ChiTietOs)
                .ThenInclude(ct => ct.Resident)
                    .ThenInclude(r => r.Users)
            .Include(hd => hd.HoaDons)
            .Include(hd => hd.TatToan)
            .FirstOrDefaultAsync(hd => hd.Id == id);
    }

    public async Task<IEnumerable<HopDong>> GetActiveContractsAsync()
    {
        var today = DateTime.UtcNow;
        return await _dbSet
            .Include(hd => hd.Room)
            .Include(hd => hd.ChiTietOs)
                .ThenInclude(ct => ct.Resident)
                    .ThenInclude(r => r.Users)
            .Where(hd => hd.StartDate <= today 
                && (hd.ExpectedEndDate == null || hd.ExpectedEndDate >= today))
            .ToListAsync();
    }

    public async Task<IEnumerable<HopDong>> GetExpiringContractsAsync(DateTime fromDate, DateTime toDate)
    {
        return await _dbSet
            .Include(hd => hd.Room)
            .Include(hd => hd.ChiTietOs)
                .ThenInclude(ct => ct.Resident)
                    .ThenInclude(r => r.Users)
            .Where(hd => hd.ExpectedEndDate != null 
                && hd.ExpectedEndDate >= fromDate 
                && hd.ExpectedEndDate <= toDate)
            .OrderBy(hd => hd.ExpectedEndDate)
            .ToListAsync();
    }
}
