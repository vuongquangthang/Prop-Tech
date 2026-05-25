using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class RoomRepository : Repository<Room>, IRoomRepository
{
    public RoomRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Room?> GetByRoomCodeAsync(string maPhong)
    {
        return await _dbSet
            .Include(r => r.Floor)
                .ThenInclude(f => f.Building)
            .Include(r => r.ChiTietTaiSanPhongs)
                .ThenInclude(ct => ct.TaiSan)
            .FirstOrDefaultAsync(r => r.RoomCode == maPhong);
    }

    public async Task<IEnumerable<Room>> GetByFloorIdAsync(int floorId)
    {
        return await _dbSet
            .Include(r => r.Floor)
                .ThenInclude(f => f.Building)
            .Include(r => r.ChiTietTaiSanPhongs)
                .ThenInclude(ct => ct.TaiSan)
            .Where(r => r.FloorId == floorId)
            .OrderBy(r => r.RoomCode)
            .ToListAsync();
    }

    public async Task<IEnumerable<Room>> GetByStatusAsync(string status)
    {
        return await _dbSet
            .Include(r => r.Floor)
                .ThenInclude(f => f.Building)
            .Include(r => r.ChiTietTaiSanPhongs)
                .ThenInclude(ct => ct.TaiSan)
            .Where(r => r.Status == status)
            .ToListAsync();
    }

    public override async Task<IEnumerable<Room>> GetAllAsync()
    {
        return await _dbSet
            .Include(r => r.Floor)
                .ThenInclude(f => f.Building)
            .Include(r => r.ChiTietTaiSanPhongs)
                .ThenInclude(ct => ct.TaiSan)
            .OrderBy(r => r.RoomCode)
            .ToListAsync();
    }

    public async Task<Room?> GetWithDetailsAsync(int id)
    {
        return await _dbSet
            .Include(r => r.Floor)
                .ThenInclude(f => f.Building)
            .Include(r => r.HopDongs)
            .Include(r => r.ChiTietTaiSanPhongs)
                .ThenInclude(ct => ct.TaiSan)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<Room>> GetAvailableRoomsAsync()
    {
        return await _dbSet
            .Include(r => r.Floor)
                .ThenInclude(f => f.Building)
            .Where(r => r.Status == "Trống")
            .ToListAsync();
    }

    public async Task<bool> ExistsByCodeAsync(string maPhong)
    {
        return await _dbSet.AnyAsync(r => r.RoomCode == maPhong);
    }
}
