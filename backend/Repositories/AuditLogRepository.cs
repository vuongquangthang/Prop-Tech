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
            .Include(x => x.User)
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<AuditLog>> GetByEntityAsync(string entityType, int? entityId = null, int limit = 100)
    {
        var query = _context.AuditLogs
            .Include(x => x.User)
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
            .Include(x => x.User)
            .Where(x => x.Action == action)
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<AuditLog>> GetRecentAsync(int limit = 100)
    {
        return await _context.AuditLogs
            .Include(x => x.User)
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }
}

public class NotificationRepository : Repository<Notification>, INotificationRepository
{
    public NotificationRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Notification>> GetByRecipientIdAsync(int recipientId, bool unreadOnly = false)
    {
        var query = _context.Notifications
            .Where(x => x.RecipientId == recipientId);

        if (unreadOnly)
        {
            query = query.Where(x => !x.IsRead);
        }

        return await query
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<Notification?> GetByIdAsync(int id)
    {
        return await _context.Notifications
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task MarkAsReadAsync(int id)
    {
        var notification = await GetByIdAsync(id);
        if (notification != null && !notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            Update(notification);
            await SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(int recipientId)
    {
        var unreadNotifications = await _context.Notifications
            .Where(x => x.RecipientId == recipientId && !x.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await SaveChangesAsync();
    }
}
