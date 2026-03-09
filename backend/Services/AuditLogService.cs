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

    private AuditLogDto MapToDto(AuditLog log)
    {
        return new AuditLogDto
        {
            Id = log.Id,
            EntityType = log.EntityType,
            EntityId = log.EntityId,
            Action = log.Action,
            UserId = log.UserId,
            Username = log.User?.PhoneNumber,
            UserFullName = log.User?.PhoneNumber,
            UserRole = log.User?.Role,
            OldValues = log.OldValues,
            NewValues = log.NewValues,
            IpAddress = log.IpAddress,
            UserAgent = log.UserAgent,
            CreatedAt = log.CreatedAt
        };
    }
}

public interface INotificationService
{
    Task<List<NotificationDto>> GetByRecipientIdAsync(int recipientId, bool unreadOnly = false);
    Task<NotificationDto?> GetByIdAsync(int id);
    Task MarkAsReadAsync(int id);
    Task MarkAllAsReadAsync(int recipientId);
}

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repository;

    public NotificationService(INotificationRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<NotificationDto>> GetByRecipientIdAsync(int recipientId, bool unreadOnly = false)
    {
        var notifications = await _repository.GetByRecipientIdAsync(recipientId, unreadOnly);
        return notifications.Select(MapToDto).ToList();
    }

    public async Task<NotificationDto?> GetByIdAsync(int id)
    {
        var notification = await _repository.GetByIdAsync(id);
        return notification == null ? null : MapToDto(notification);
    }

    public async Task MarkAsReadAsync(int id)
    {
        await _repository.MarkAsReadAsync(id);
    }

    public async Task MarkAllAsReadAsync(int recipientId)
    {
        await _repository.MarkAllAsReadAsync(recipientId);
    }

    private NotificationDto MapToDto(Notification notification)
    {
        return new NotificationDto
        {
            Id = notification.Id,
            RecipientId = notification.RecipientId ?? 0,
            RecipientName = notification.User?.PhoneNumber ?? "",
            Title = notification.Title,
            Content = notification.Content,
            Type = notification.NotificationType,
            RelatedEntityType = notification.ScopeType,
            RelatedEntityId = notification.ScopeId,
            IsRead = notification.IsRead,
            ReadAt = notification.ReadAt,
            CreatedAt = notification.CreatedAt
        };
    }
}
