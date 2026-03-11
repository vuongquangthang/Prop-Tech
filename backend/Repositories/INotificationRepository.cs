using backend.Models;

namespace backend.Repositories;

public interface INotificationRepository : IRepository<Notification>
{
    Task<List<Notification>> GetByRecipientIdAsync(int recipientId, bool unreadOnly = false, int limit = 100);
    Task<int> GetUnreadCountAsync(int recipientId);
    Task<Notification?> GetByIdWithUserAsync(int id);
    Task MarkAsReadAsync(int id);
    Task MarkAllAsReadAsync(int recipientId);
    Task<List<Notification>> GetAllRecentAsync(int limit = 200);
}
