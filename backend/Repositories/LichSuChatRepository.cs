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

    public async Task<List<LichSuChat>> GetRecentAsync(int ownerUserId, int limit = 50)
    {
        return await _context.LichSuChats
            .Include(x => x.User)
            .Where(x => x.User.OwnerUserId == ownerUserId && x.User.Role == "CuDan")
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

    public async Task<LichSuChat?> GetByIdAsync(long id, int ownerUserId)
    {
        return await _context.LichSuChats
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Id == id && x.User.OwnerUserId == ownerUserId);
    }

    public async Task<int> DeleteConversationAsync(int userId, int ownerUserId)
    {
        var rows = await _context.LichSuChats
            .Where(x => x.UserId == userId && x.User.OwnerUserId == ownerUserId)
            .ToListAsync();

        if (rows.Count == 0)
        {
            return 0;
        }

        RemoveRange(rows);
        await SaveChangesAsync();
        return rows.Count;
    }

    public async Task<List<LichSuChat>> GetByUserIdAsync(int userId, int ownerUserId, int limit = 500)
    {
        return await _context.LichSuChats
            .Include(x => x.User)
            .Where(x => x.UserId == userId && x.User.OwnerUserId == ownerUserId)
            .OrderBy(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    private IQueryable<int> ConversationUserIdsQuery(int ownerUserId)
    {
        return _context.LichSuChats
            .Where(x => x.User.OwnerUserId == ownerUserId && x.User.Role == "CuDan")
            .GroupBy(x => x.UserId)
            .Select(g => g.Key);
    }

    public async Task<int> CountConversationsAsync(int ownerUserId)
    {
        return await ConversationUserIdsQuery(ownerUserId).CountAsync();
    }

    public async Task<List<int>> GetConversationUserIdsPageAsync(int ownerUserId, int page, int pageSize)
    {
        return await _context.LichSuChats
            .Where(x => x.User.OwnerUserId == ownerUserId && x.User.Role == "CuDan")
            .GroupBy(x => x.UserId)
            .Select(g => new { UserId = g.Key, LastUpdated = g.Max(m => m.CreatedAt) })
            .OrderByDescending(x => x.LastUpdated)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => x.UserId)
            .ToListAsync();
    }
}
