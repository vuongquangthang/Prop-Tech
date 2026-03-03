using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class YeuCauSuaChuaRepository : Repository<YeuCauSuaChua>, IYeuCauSuaChuaRepository
{
    public YeuCauSuaChuaRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<YeuCauSuaChua>> GetByRoomIdAsync(int roomId)
    {
        return await _dbSet
            .Include(y => y.Room)
            .Include(y => y.User)
            .Where(y => y.RoomId == roomId)
            .OrderByDescending(y => y.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<YeuCauSuaChua>> GetByResidentIdAsync(int residentId)
    {
        return await _dbSet
            .Include(y => y.Room)
            .Include(y => y.User)
            .Where(y => y.UserId == residentId)
            .OrderByDescending(y => y.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<YeuCauSuaChua>> GetByStatusAsync(string status)
    {
        return await _dbSet
            .Include(y => y.Room)
            .Include(y => y.User)
            .Where(y => y.Status == status)
            .OrderByDescending(y => y.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<YeuCauSuaChua>> GetPendingRequestsAsync()
    {
        return await _dbSet
            .Include(y => y.Room)
            .Include(y => y.User)
            .Where(y => y.Status == "Chờ xử lý")
            .OrderBy(y => y.CreatedAt)
            .ToListAsync();
    }
}
