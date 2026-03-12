using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.AspNetCore.SignalR;
using backend.Hubs;

namespace backend.Services;

public interface INotificationService
{
    Task<List<NotificationResponseDto>> GetMyNotificationsAsync(int userId, bool unreadOnly = false);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkAsReadAsync(int id, int userId);
    Task MarkAllAsReadAsync(int userId);
    Task<NotificationResponseDto> CreateNotificationAsync(int senderUserId, CreateNotificationDto dto);
    Task BroadcastAsync(int senderUserId, string title, string content, string type);
    Task<List<NotificationResponseDto>> GetAllRecentAsync(int limit = 200);
    /// <summary>Tạo thông báo DB + push SignalR cho cư dân cụ thể</summary>
    Task SendToUserAsync(int recipientUserId, string title, string content, string type);
    /// <summary>Tạo thông báo DB chỉ hiển thị trên trang quản lý (ScopeType=ADMIN)</summary>
    Task CreateAdminNotificationAsync(string title, string content, string type);
    /// <summary>Số thông báo ADMIN chưa đọc (dùng cho badge BQL)</summary>
    Task<int> GetAdminUnreadCountAsync();
}

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;
    private readonly IHubContext<NotificationHub> _hub;

    public NotificationService(
        INotificationRepository repo,
        IHubContext<NotificationHub> hub)
    {
        _repo = repo;
        _hub = hub;
    }

    public async Task<List<NotificationResponseDto>> GetMyNotificationsAsync(int userId, bool unreadOnly = false)
    {
        var items = await _repo.GetByRecipientIdAsync(userId, unreadOnly);
        return items.Select(MapToDto).ToList();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _repo.GetUnreadCountAsync(userId);
    }

    public async Task MarkAsReadAsync(int id, int userId)
    {
        // Verify the notification belongs to the user (or is a broadcast)
        var notification = await _repo.GetByIdWithUserAsync(id);
        if (notification == null) return;
        if (notification.RecipientId != userId && notification.ScopeType != "ALL") return;

        await _repo.MarkAsReadAsync(id);
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        await _repo.MarkAllAsReadAsync(userId);
    }

    public async Task<NotificationResponseDto> CreateNotificationAsync(int senderUserId, CreateNotificationDto dto)
    {
        var notification = new Notification
        {
            UserId = senderUserId,
            RecipientId = (int?)dto.RecipientId,
            ScopeType = "USER",
            NotificationType = dto.Type,
            Title = dto.Title,
            Content = dto.Content,
            Priority = "NORMAL",
            IsRead = false,
            SentAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
        };

        await _repo.AddAsync(notification);
        await _repo.SaveChangesAsync();

        // Push via SignalR
        var responseDto = MapToDto(notification);
        await _hub.Clients.Group($"user_{dto.RecipientId}")
            .SendAsync("ReceiveNotification", responseDto);

        return responseDto;
    }

    public async Task BroadcastAsync(int senderUserId, string title, string content, string type)
    {
        var notification = new Notification
        {
            UserId = senderUserId,
            ScopeType = "ALL",
            NotificationType = type,
            Title = title,
            Content = content,
            Priority = "NORMAL",
            IsRead = false,
            SentAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
        };

        await _repo.AddAsync(notification);
        await _repo.SaveChangesAsync();

        var responseDto = MapToDto(notification);
        await _hub.Clients.All.SendAsync("ReceiveNotification", responseDto);
    }

    public async Task<List<NotificationResponseDto>> GetAllRecentAsync(int limit = 200)
    {
        var items = await _repo.GetAllRecentAsync(limit);
        return items.Select(MapToDto).ToList();
    }

    public async Task SendToUserAsync(int recipientUserId, string title, string content, string type)
    {
        var notification = new Notification
        {
            RecipientId = recipientUserId,
            ScopeType = "USER",
            NotificationType = type,
            Title = title,
            Content = content,
            Priority = "NORMAL",
            IsRead = false,
            SentAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
        };
        await _repo.AddAsync(notification);
        await _repo.SaveChangesAsync();
        var dto = MapToDto(notification);
        await _hub.Clients.Group($"user_{recipientUserId}").SendAsync("ReceiveNotification", dto);
    }

    public async Task CreateAdminNotificationAsync(string title, string content, string type)
    {
        var notification = new Notification
        {
            ScopeType = "ADMIN",
            NotificationType = type,
            Title = title,
            Content = content,
            Priority = "NORMAL",
            IsRead = false,
            SentAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
        };
        await _repo.AddAsync(notification);
        await _repo.SaveChangesAsync();
    }

    public async Task<int> GetAdminUnreadCountAsync()
    {
        return await _repo.GetAdminUnreadCountAsync();
    }

    private static NotificationResponseDto MapToDto(Notification n) => new()
    {
        Id = n.Id,
        Title = n.Title,
        Content = n.Content,
        NotificationType = n.NotificationType,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt,
        SenderPhone = n.User?.PhoneNumber,
    };
}
