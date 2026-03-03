using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class LichSuChatRepository : Repository<LichSuChat>, ILichSuChatRepository
{
    public LichSuChatRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<LichSuChat>> GetByUserIdAsync(int userId, int limit = 100)
    {
        return await _context.LichSuChats
            .Include(x => x.User)
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<LichSuChat>> GetRecentAsync(int limit = 50)
    {
        return await _context.LichSuChats
            .Include(x => x.User)
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<LichSuChat?> GetByIdAsync(long id)
    {
        return await _context.LichSuChats
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Id == id);
    }
}
