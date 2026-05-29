using backend.Models;

namespace backend.Repositories;

public interface IAuditLogRepository : IRepository<AuditLog>
{
    Task<List<AuditLog>> GetByUserIdAsync(int userId, int limit = 100);
    Task<List<AuditLog>> GetByUserIdAsync(int userId, int ownerUserId, int limit = 100);
    Task<List<AuditLog>> GetByEntityAsync(string entityType, int? entityId = null, int limit = 100);
    Task<List<AuditLog>> GetByEntityAsync(string entityType, int ownerUserId, int? entityId = null, int limit = 100);
    Task<List<AuditLog>> GetByActionAsync(string action, int limit = 100);
    Task<List<AuditLog>> GetByActionAsync(string action, int ownerUserId, int limit = 100);
    Task<List<AuditLog>> GetRecentAsync(int limit = 100);
    Task<List<AuditLog>> GetRecentAsync(int ownerUserId, int limit = 100);
}
