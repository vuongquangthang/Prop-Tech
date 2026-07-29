using backend.DTOs;
using backend.Data;
using backend.Models;
using backend.Repositories;
using Microsoft.AspNetCore.SignalR;
using backend.Hubs;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface INotificationService
{
    Task<List<NotificationResponseDto>> GetMyNotificationsAsync(int userId, int ownerUserId, bool unreadOnly = false);
    Task<int> GetUnreadCountAsync(int userId, int ownerUserId);
    Task MarkAsReadAsync(int id, int userId, int ownerUserId, bool canManageAdmin = false);
    Task MarkAllAsReadAsync(int userId, int ownerUserId, bool includeAdmin = false);
    Task<NotificationResponseDto> CreateNotificationAsync(int senderUserId, CreateNotificationDto dto, int? ownerUserId = null);
    Task BroadcastAsync(int senderUserId, string title, string content, string type);
    Task<List<NotificationResponseDto>> GetAllRecentAsync(int ownerUserId, int limit = 200);
    Task<List<NotificationRecipientDto>> GetResidentRecipientsAsync(int ownerUserId);
    /// <summary>Tạo thông báo DB + push SignalR cho cư dân cụ thể</summary>
    Task SendToUserAsync(int recipientUserId, string title, string content, string type, int? relatedId = null, string? linkUrl = null);
    /// <summary>Tạo thông báo DB chỉ hiển thị trên trang quản lý (ScopeType=ADMIN)</summary>
    Task CreateAdminNotificationAsync(string title, string content, string type, int ownerUserId);
    /// <summary>Thông báo admin xóa bài: gửi cho cư dân đăng bài (USER) + chủ nhà/BQL quản lý (ADMIN scope)</summary>
    Task SendPostDeleteNoticeAsync(int creatorUserId, string title, string content, string type);
    /// <summary>Số thông báo ADMIN chưa đọc (dùng cho badge BQL)</summary>
    Task<int> GetAdminUnreadCountAsync(int ownerUserId);
}

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;
    private readonly IHubContext<NotificationHub> _hub;
    private readonly ApplicationDbContext _context;

    public NotificationService(
        INotificationRepository repo,
        IHubContext<NotificationHub> hub,
        ApplicationDbContext context)
    {
        _repo = repo;
        _hub = hub;
        _context = context;
    }

    public async Task<List<NotificationResponseDto>> GetMyNotificationsAsync(int userId, int ownerUserId, bool unreadOnly = false)
    {
        var items = await _repo.GetByRecipientIdAsync(userId, ownerUserId, unreadOnly);
        return items.Select(MapToDto).ToList();
    }

    public async Task<int> GetUnreadCountAsync(int userId, int ownerUserId)
    {
        return await _repo.GetUnreadCountAsync(userId, ownerUserId);
    }

    public async Task MarkAsReadAsync(int id, int userId, int ownerUserId, bool canManageAdmin = false)
    {
        // Verify the notification belongs to the user (or is a broadcast)
        var notification = await _repo.GetByIdWithUserAsync(id);
        if (notification == null) return;
        var ownerMatches = notification.OwnerUserId == ownerUserId;
        var canReadOwnOrBroadcast = ownerMatches && (notification.RecipientId == userId || notification.ScopeType == "ALL");
        var canReadAdmin = canManageAdmin && ownerMatches && notification.ScopeType == "ADMIN";
        if (!canReadOwnOrBroadcast && !canReadAdmin) return;

        await _repo.MarkAsReadAsync(id);
    }

    public async Task MarkAllAsReadAsync(int userId, int ownerUserId, bool includeAdmin = false)
    {
        await _repo.MarkAllAsReadAsync(userId, ownerUserId, includeAdmin);
    }

    public async Task<NotificationResponseDto> CreateNotificationAsync(int senderUserId, CreateNotificationDto dto, int? ownerUserId = null)
    {
        var recipientOwnerUserId = await ResolveOwnerUserIdForUserAsync((int)dto.RecipientId)
            ?? await ResolveOwnerUserIdForUserAsync(senderUserId);
        if (ownerUserId.HasValue && recipientOwnerUserId != ownerUserId.Value)
        {
            throw new InvalidOperationException("Người nhận không thuộc phạm vi quản lý");
        }

        var notification = new Notification
        {
            UserId = senderUserId,
            RecipientId = (int?)dto.RecipientId,
            OwnerUserId = recipientOwnerUserId,
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
        var ownerUserId = await ResolveOwnerUserIdForUserAsync(senderUserId) ?? senderUserId;

        var notification = new Notification
        {
            UserId = senderUserId,
            OwnerUserId = ownerUserId,
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
        await _hub.Clients.Group(NotificationHub.OwnerGroup(ownerUserId))
            .SendAsync("ReceiveNotification", responseDto);
    }

    public async Task<List<NotificationResponseDto>> GetAllRecentAsync(int ownerUserId, int limit = 200)
    {
        var items = await _repo.GetAllRecentAsync(ownerUserId, limit);
        return items.Select(MapToDto).ToList();
    }

    public async Task<List<NotificationRecipientDto>> GetResidentRecipientsAsync(int ownerUserId)
    {
        var now = DateTime.UtcNow;
        var users = await _context.Users
            .AsNoTracking()
            .Include(user => user.Resident)
                .ThenInclude(resident => resident!.ChiTietOs)
                    .ThenInclude(residency => residency.HopDong)
                        .ThenInclude(contract => contract.Room)
                            .ThenInclude(room => room.Floor)
                                .ThenInclude(floor => floor.Building)
            .Where(user =>
                user.Role == "CuDan"
                && !user.IsLocked
                && user.ResidentId.HasValue
                && user.Resident != null
                && (user.OwnerUserId == ownerUserId
                    || user.Resident.ChiTietOs.Any(residency =>
                        residency.HopDong.Room.Floor.Building.OwnerUserId == ownerUserId)))
            .OrderBy(user => user.Resident!.FullName)
            .ThenBy(user => user.PhoneNumber)
            .ToListAsync();

        return users.Select(user =>
        {
            var activeResidency = user.Resident!.ChiTietOs
                .Where(residency => residency.FromDate <= now && (residency.ToDate == null || residency.ToDate > now))
                .OrderByDescending(residency => residency.FromDate)
                .FirstOrDefault();

            return new NotificationRecipientDto
            {
                UserId = user.Id,
                ResidentId = user.ResidentId,
                DisplayName = user.DisplayName ?? user.Resident.FullName,
                PhoneNumber = user.PhoneNumber,
                RoomCode = activeResidency?.HopDong?.Room?.RoomCode,
                BuildingName = activeResidency?.HopDong?.Room?.Floor?.Building?.BuildingName
            };
        }).ToList();
    }

    public async Task SendToUserAsync(int recipientUserId, string title, string content, string type, int? relatedId = null, string? linkUrl = null)
    {
        var ownerUserId = await ResolveOwnerUserIdForUserAsync(recipientUserId);

        var notification = new Notification
        {
            RecipientId = recipientUserId,
            OwnerUserId = ownerUserId,
            ScopeType = "USER",
            NotificationType = type,
            Title = title,
            Content = content,
            RelatedId = relatedId,
            LinkUrl = linkUrl,
            Priority = "NORMAL",
            IsRead = false,
            SentAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
        };
        await _repo.AddAsync(notification);
        await _repo.SaveChangesAsync();
        var dto = MapToDto(notification);
        await _hub.Clients.Group(NotificationHub.UserGroup(recipientUserId)).SendAsync("ReceiveNotification", dto);
    }

    public async Task CreateAdminNotificationAsync(string title, string content, string type, int ownerUserId)
    {
        var notification = new Notification
        {
            OwnerUserId = ownerUserId,
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

        var responseDto = MapToDto(notification);
        await _hub.Clients.Group(NotificationHub.OwnerGroup(ownerUserId))
            .SendAsync("ReceiveAdminNotification", responseDto);
    }

    public async Task<int> GetAdminUnreadCountAsync(int ownerUserId)
    {
        return await _repo.GetAdminUnreadCountAsync(ownerUserId);
    }

    public async Task SendPostDeleteNoticeAsync(int creatorUserId, string title, string content, string type)
    {
        // 1) Cu dan dang bai -> thong bao ca nhan (USER scope): hien o thong bao ca nhan/mobile + chuong cua chinh ho.
        await SendToUserAsync(creatorUserId, title, content, type);

        // 2) Chu nha/BQL quan ly cu dan do -> thong bao ADMIN scope: hien o panel "Thong bao Admin" + chuong BQL.
        var ownerUserId = await ResolveOwnerUserIdForUserAsync(creatorUserId) ?? creatorUserId;
        await CreateAdminNotificationAsync(title, content, type, ownerUserId);
    }

    private static NotificationResponseDto MapToDto(Notification n) => new()
    {
        Id = n.Id,
        OwnerUserId = n.OwnerUserId,
        Title = string.IsNullOrWhiteSpace(n.Title) ? "Thong bao" : n.Title,
        Content = n.Content ?? string.Empty,
        NotificationType = string.IsNullOrWhiteSpace(n.NotificationType) ? "SYSTEM" : n.NotificationType,
        RelatedId = n.RelatedId,
        LinkUrl = n.LinkUrl,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt == default ? DateTime.UtcNow : n.CreatedAt,
        SenderPhone = n.User?.PhoneNumber,
    };

    private async Task<int?> ResolveOwnerUserIdForUserAsync(int userId)
    {
        return await _context.Users
            .Where(user => user.Id == userId)
            .Select(user => (int?)(user.OwnerUserId ?? user.Id))
            .FirstOrDefaultAsync();
    }
}
