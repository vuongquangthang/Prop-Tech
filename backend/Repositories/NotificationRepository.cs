using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class NotificationRepository : Repository<Notification>, INotificationRepository
{
    public NotificationRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Notification>> GetByRecipientIdAsync(int recipientId, int ownerUserId, bool unreadOnly = false, int limit = 100)
    {
        var query = _context.Notifications
            .Where(n => n.OwnerUserId == ownerUserId && (n.RecipientId == recipientId || n.ScopeType == "ALL"));

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(int recipientId, int ownerUserId)
    {
        return await _context.Notifications
            .CountAsync(n => n.OwnerUserId == ownerUserId && (n.RecipientId == recipientId || n.ScopeType == "ALL") && !n.IsRead);
    }

    public async Task<Notification?> GetByIdWithUserAsync(int id)
    {
        return await _context.Notifications
            .Include(n => n.User)
            .FirstOrDefaultAsync(n => n.Id == id);
    }

    public async Task MarkAsReadAsync(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification != null && !notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(int recipientId, int ownerUserId, bool includeAdmin = false)
    {
        var unread = await _context.Notifications
            .Where(n => n.OwnerUserId == ownerUserId
                && ((n.RecipientId == recipientId || n.ScopeType == "ALL") || (includeAdmin && n.ScopeType == "ADMIN"))
                && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread)
        {
            n.IsRead = true;
            n.ReadAt = DateTime.UtcNow;
        }

        if (unread.Any())
            await _context.SaveChangesAsync();
    }

    public async Task<List<Notification>> GetAllRecentAsync(int limit = 200)
    {
        return await _context.Notifications
            .Include(n => n.User)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<Notification>> GetAllRecentAsync(int ownerUserId, int limit = 200)
    {
        return await _context.Notifications
            .Include(n => n.User)
            .Where(n => n.OwnerUserId == ownerUserId && n.ScopeType == "ADMIN")
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> GetAdminUnreadCountAsync(int ownerUserId)
    {
        return await _context.Notifications
            .CountAsync(n => n.OwnerUserId == ownerUserId && n.ScopeType == "ADMIN" && !n.IsRead);
    }

}
