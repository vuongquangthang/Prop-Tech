using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class AuditLogRepository : Repository<AuditLog>, IAuditLogRepository
{
    public AuditLogRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<AuditLog>> GetByUserIdAsync(int userId, int limit = 100)
    {
        return await _context.AuditLogs
            .Include(x => x.User).ThenInclude(u => u!.Resident)
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<AuditLog>> GetByEntityAsync(string entityType, int? entityId = null, int limit = 100)
    {
        var query = _context.AuditLogs
            .Include(x => x.User).ThenInclude(u => u!.Resident)
            .Where(x => x.EntityType == entityType);

        if (entityId.HasValue)
        {
            query = query.Where(x => x.EntityId == entityId.Value);
        }

        return await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<AuditLog>> GetByActionAsync(string action, int limit = 100)
    {
        return await _context.AuditLogs
            .Include(x => x.User).ThenInclude(u => u!.Resident)
            .Where(x => x.Action == action)
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<AuditLog>> GetRecentAsync(int limit = 100)
    {
        return await _context.AuditLogs
            .Include(x => x.User).ThenInclude(u => u!.Resident)
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }
}

