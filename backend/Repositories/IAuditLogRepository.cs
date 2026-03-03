using backend.Models;

namespace backend.Repositories;

public interface IAuditLogRepository : IRepository<AuditLog>
{
    Task<List<AuditLog>> GetByUserIdAsync(int userId, int limit = 100);
    Task<List<AuditLog>> GetByEntityAsync(string entityType, int? entityId = null, int limit = 100);
    Task<List<AuditLog>> GetByActionAsync(string action, int limit = 100);
    Task<List<AuditLog>> GetRecentAsync(int limit = 100);
}

public interface INotificationRepository : IRepository<Notification>
{
    Task<List<Notification>> GetByRecipientIdAsync(int recipientId, bool unreadOnly = false);
    Task<Notification?> GetByIdAsync(int id);
    Task MarkAsReadAsync(int id);
    Task MarkAllAsReadAsync(int recipientId);
}
