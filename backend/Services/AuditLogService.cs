using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IAuditLogService
{
    Task<List<AuditLogDto>> GetByUserIdAsync(int userId, int limit = 100);
    Task<List<AuditLogDto>> GetByEntityAsync(string entityType, int? entityId = null, int limit = 100);
    Task<List<AuditLogDto>> GetByActionAsync(string action, int limit = 100);
    Task<List<AuditLogDto>> GetRecentAsync(int limit = 100);
    Task LogAsync(int? userId, string action, string entityType, int? entityId = null, string? details = null, string? ipAddress = null, string? userAgent = null);
}

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _repository;

    public AuditLogService(IAuditLogRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<AuditLogDto>> GetByUserIdAsync(int userId, int limit = 100)
    {
        var logs = await _repository.GetByUserIdAsync(userId, limit);
        return logs.Select(MapToDto).ToList();
    }

    public async Task<List<AuditLogDto>> GetByEntityAsync(string entityType, int? entityId = null, int limit = 100)
    {
        var logs = await _repository.GetByEntityAsync(entityType, entityId, limit);
        return logs.Select(MapToDto).ToList();
    }

    public async Task<List<AuditLogDto>> GetByActionAsync(string action, int limit = 100)
    {
        var logs = await _repository.GetByActionAsync(action, limit);
        return logs.Select(MapToDto).ToList();
    }

    public async Task<List<AuditLogDto>> GetRecentAsync(int limit = 100)
    {
        var logs = await _repository.GetRecentAsync(limit);
        return logs.Select(MapToDto).ToList();
    }

    public async Task LogAsync(int? userId, string action, string entityType, int? entityId = null, string? details = null, string? ipAddress = null, string? userAgent = null)
    {
        try
        {
            var log = new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                NewValues = details,
                IpAddress = ipAddress?.Length > 45 ? ipAddress[..45] : ipAddress,
                UserAgent = userAgent?.Length > 500 ? userAgent[..500] : userAgent,
                CreatedAt = DateTime.UtcNow
            };
            await _repository.AddAsync(log);
            await _repository.SaveChangesAsync();
        }
        catch
        {
            // Never let audit logging failures break the main operation
        }
    }

    private AuditLogDto MapToDto(AuditLog log)
    {
        var fullName = log.User?.Resident?.FullName ?? log.User?.PhoneNumber;
        return new AuditLogDto
        {
            Id = log.Id,
            EntityType = log.EntityType,
            EntityId = log.EntityId,
            Action = log.Action,
            UserId = log.UserId,
            Username = log.User?.PhoneNumber,
            FullName = fullName,
            UserFullName = fullName,
            UserRole = log.User?.Role,
            Details = log.NewValues,
            OldValues = log.OldValues,
            NewValues = log.NewValues,
            IpAddress = log.IpAddress,
            UserAgent = log.UserAgent,
            CreatedAt = log.CreatedAt
        };
    }
}

