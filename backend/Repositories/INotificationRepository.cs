using backend.Models;

namespace backend.Repositories;

public interface INotificationRepository : IRepository<Notification>
{
    Task<List<Notification>> GetByRecipientIdAsync(int recipientId, int ownerUserId, bool unreadOnly = false, int limit = 100);
    Task<int> GetUnreadCountAsync(int recipientId, int ownerUserId);
    Task<Notification?> GetByIdWithUserAsync(int id);
    Task MarkAsReadAsync(int id);
    Task MarkAllAsReadAsync(int recipientId, int ownerUserId, bool includeAdmin = false);
    Task<List<Notification>> GetAllRecentAsync(int limit = 200);
    Task<List<Notification>> GetAllRecentAsync(int ownerUserId, int limit = 200);
    Task<int> GetAdminUnreadCountAsync(int ownerUserId);
}
