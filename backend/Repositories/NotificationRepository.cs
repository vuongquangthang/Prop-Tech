using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class NotificationRepository : Repository<Notification>, INotificationRepository
{
    public NotificationRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Notification>> GetByRecipientIdAsync(int recipientId, bool unreadOnly = false, int limit = 100)
    {
        var query = _context.Notifications
            .Where(n => n.RecipientId == recipientId || n.ScopeType == "ALL");

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(int recipientId)
    {
        return await _context.Notifications
            .CountAsync(n => (n.RecipientId == recipientId || n.ScopeType == "ALL") && !n.IsRead);
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

    public async Task MarkAllAsReadAsync(int recipientId)
    {
        var unread = await _context.Notifications
            .Where(n => (n.RecipientId == recipientId || n.ScopeType == "ALL") && !n.IsRead)
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

}
