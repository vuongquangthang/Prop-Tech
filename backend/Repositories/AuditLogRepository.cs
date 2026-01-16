using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IAuditLogRepository : IRepository<AuditLog>
{
    Task<List<AuditLog>> GetByEntityAsync(string entityType, long entityId);
    Task<List<AuditLog>> GetByUserAsync(long userId);
    Task<List<AuditLog>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<List<AuditLog>> FilterAsync(string? entityType, string? action, long? userId, long? entityId, DateTime? startDate, DateTime? endDate);
}

public class AuditLogRepository : Repository<AuditLog>, IAuditLogRepository
{
    public AuditLogRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<AuditLog>> GetByEntityAsync(string entityType, long entityId)
    {
        return await _context.AuditLogs
            .Where(a => a.EntityType == entityType && a.EntityId == entityId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<AuditLog>> GetByUserAsync(long userId)
    {
        return await _context.AuditLogs
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<AuditLog>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _context.AuditLogs
            .Where(a => a.CreatedAt >= startDate && a.CreatedAt <= endDate)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<AuditLog>> FilterAsync(string? entityType, string? action, long? userId, long? entityId, DateTime? startDate, DateTime? endDate)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (!string.IsNullOrEmpty(entityType))
            query = query.Where(a => a.EntityType == entityType);

        if (!string.IsNullOrEmpty(action))
            query = query.Where(a => a.Action == action);

        if (userId.HasValue)
            query = query.Where(a => a.UserId == userId.Value);

        if (entityId.HasValue)
            query = query.Where(a => a.EntityId == entityId.Value);

        if (startDate.HasValue)
            query = query.Where(a => a.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(a => a.CreatedAt <= endDate.Value);

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }
}
