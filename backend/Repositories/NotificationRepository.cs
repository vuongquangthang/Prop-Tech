using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface INotificationRepository : IRepository<Notification>
{
    Task<List<Notification>> GetByRecipientAsync(long recipientId, bool? isRead = null);
    Task<List<Notification>> GetUnreadByRecipientAsync(long recipientId);
    Task<int> GetUnreadCountAsync(long recipientId);
    Task MarkAsReadAsync(long id);
    Task MarkAllAsReadAsync(long recipientId);
}

public class NotificationRepository : Repository<Notification>, INotificationRepository
{
    public NotificationRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Notification>> GetByRecipientAsync(long recipientId, bool? isRead = null)
    {
        var query = _context.Notifications
            .Where(n => n.RecipientId == recipientId);

        if (isRead.HasValue)
        {
            query = query.Where(n => n.IsRead == isRead.Value);
        }

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Notification>> GetUnreadByRecipientAsync(long recipientId)
    {
        return await _context.Notifications
            .Where(n => n.RecipientId == recipientId && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(long recipientId)
    {
        return await _context.Notifications
            .CountAsync(n => n.RecipientId == recipientId && !n.IsRead);
    }

    public async Task MarkAsReadAsync(long id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification != null && !notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(long recipientId)
    {
        var unreadNotifications = await _context.Notifications
            .Where(n => n.RecipientId == recipientId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}
