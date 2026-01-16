using backend.DTOs;
using backend.Models;
using backend.Repositories;
using System.Text.Json;

namespace backend.Services;

public interface IAuditLogService
{
    Task<AuditLogDto> LogAsync(string entityType, long entityId, string action, long userId, object? oldValues = null, object? newValues = null, string? description = null);
    Task<List<AuditLogDto>> GetByEntityAsync(string entityType, long entityId);
    Task<List<AuditLogDto>> GetByUserAsync(long userId);
    Task<List<AuditLogDto>> FilterAsync(AuditLogFilterDto filter);
}

public class AuditLogService : IAuditLogService
{
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly IUserRepository _userRepository;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(
        IAuditLogRepository auditLogRepository,
        IUserRepository userRepository,
        ILogger<AuditLogService> logger)
    {
        _auditLogRepository = auditLogRepository;
        _userRepository = userRepository;
        _logger = logger;
    }

    public async Task<AuditLogDto> LogAsync(string entityType, long entityId, string action, long userId, object? oldValues = null, object? newValues = null, string? description = null)
    {
        try
        {
            var auditLog = new AuditLog
            {
                EntityType = entityType,
                EntityId = entityId,
                Action = action,
                UserId = userId,
                OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
                NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
                CreatedAt = DateTime.UtcNow
            };

            await _auditLogRepository.AddAsync(auditLog);
            await _auditLogRepository.SaveChangesAsync();

            return MapToDto(auditLog);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error logging audit entry for {entityType} {entityId}");
            throw;
        }
    }

    public async Task<List<AuditLogDto>> GetByEntityAsync(string entityType, long entityId)
    {
        var logs = await _auditLogRepository.GetByEntityAsync(entityType, entityId);
        return logs.Select(MapToDto).ToList();
    }

    public async Task<List<AuditLogDto>> GetByUserAsync(long userId)
    {
        var logs = await _auditLogRepository.GetByUserAsync(userId);
        return logs.Select(MapToDto).ToList();
    }

    public async Task<List<AuditLogDto>> FilterAsync(AuditLogFilterDto filter)
    {
        var logs = await _auditLogRepository.FilterAsync(
            filter.EntityType,
            filter.Action,
            filter.UserId,
            filter.EntityId,
            filter.StartDate,
            filter.EndDate
        );

        var dtos = logs.Select(MapToDto).ToList();

        // Apply pagination
        var skip = (filter.PageNumber - 1) * filter.PageSize;
        return dtos.Skip(skip).Take(filter.PageSize).ToList();
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
            UserFullName = "", // Load from user context if available
            OldValues = log.OldValues,
            NewValues = log.NewValues,
            IpAddress = log.IpAddress,
            CreatedAt = log.CreatedAt
        };
    }
}
