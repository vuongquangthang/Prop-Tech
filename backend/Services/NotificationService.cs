using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface INotificationService
{
    Task<NotificationDto?> GetByIdAsync(long id);
    Task<List<NotificationDto>> GetByRecipientAsync(long recipientId, bool? isRead = null);
    Task<int> GetUnreadCountAsync(long recipientId);
    Task<NotificationDto> CreateAsync(CreateNotificationDto dto, long createdBy);
    Task<int> BroadcastAsync(BroadcastNotificationDto dto, long createdBy);
    Task MarkAsReadAsync(long id, long userId);
    Task MarkAllAsReadAsync(long userId);
}

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly IResidencyRepository _residencyRepository;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository notificationRepository,
        IUserRepository userRepository,
        IRoomRepository roomRepository,
        IResidencyRepository residencyRepository,
        ILogger<NotificationService> logger)
    {
        _notificationRepository = notificationRepository;
        _userRepository = userRepository;
        _roomRepository = roomRepository;
        _residencyRepository = residencyRepository;
        _logger = logger;
    }

    public async Task<NotificationDto?> GetByIdAsync(long id)
    {
        var notification = await _notificationRepository.GetByIdAsync(id);
        return notification == null ? null : MapToDto(notification);
    }

    public async Task<List<NotificationDto>> GetByRecipientAsync(long recipientId, bool? isRead = null)
    {
        var notifications = await _notificationRepository.GetByRecipientAsync(recipientId, isRead);
        return notifications.Select(MapToDto).ToList();
    }

    public async Task<int> GetUnreadCountAsync(long recipientId)
    {
        return await _notificationRepository.GetUnreadCountAsync(recipientId);
    }

    public async Task<NotificationDto> CreateAsync(CreateNotificationDto dto, long createdBy)
    {
        var recipient = await _userRepository.GetByIdAsync(dto.RecipientId);
        if (recipient == null)
        {
            throw new InvalidOperationException("Không tìm thấy người nhận");
        }

        var notification = new Notification
        {
            RecipientId = dto.RecipientId,
            Title = dto.Title,
            Content = dto.Content,
            NotificationType = dto.Type,
            RelatedId = dto.RelatedEntityId,
            LinkUrl = dto.ActionUrl,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UserId = createdBy
        };

        await _notificationRepository.AddAsync(notification);
        await _notificationRepository.SaveChangesAsync();

        return MapToDto(notification);
    }

    public async Task<int> BroadcastAsync(BroadcastNotificationDto dto, long createdBy)
    {
        List<long> recipientIds = new();

        switch (dto.Scope.ToUpper())
        {
            case "ALL":
                var allUsers = await _userRepository.FindAsync(u => u.Status == "ACTIVE" && u.Role == "RESIDENT");
                recipientIds = allUsers.Select(u => u.Id).ToList();
                break;

            case "BUILDING":
                if (!dto.BuildingId.HasValue)
                {
                    throw new InvalidOperationException("BuildingId bắt buộc khi scope = BUILDING");
                }
                var buildingRooms = await _roomRepository.FindAsync(r => r.Floor!.BuildingId == dto.BuildingId.Value);
                var buildingResidencies = await _residencyRepository.GetActiveResidentsByRoomsAsync(buildingRooms.Select(r => r.Id).ToList());
                recipientIds = buildingResidencies.Select(r => r.Resident!.UserId).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
                break;

            case "FLOOR":
                if (!dto.FloorId.HasValue)
                {
                    throw new InvalidOperationException("FloorId bắt buộc khi scope = FLOOR");
                }
                var floorRooms = await _roomRepository.FindAsync(r => r.FloorId == dto.FloorId.Value);
                var floorResidencies = await _residencyRepository.GetActiveResidentsByRoomsAsync(floorRooms.Select(r => r.Id).ToList());
                recipientIds = floorResidencies.Select(r => r.Resident!.UserId).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
                break;

            case "ROOM":
                if (!dto.RoomId.HasValue)
                {
                    throw new InvalidOperationException("RoomId bắt buộc khi scope = ROOM");
                }
                var roomResidencies = await _residencyRepository.GetActiveByRoomAsync(dto.RoomId.Value, DateTime.UtcNow);
                recipientIds = roomResidencies.Select(r => r.Resident!.UserId).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
                break;

            default:
                throw new InvalidOperationException($"Scope không hợp lệ: {dto.Scope}");
        }

        var notifications = recipientIds.Select(recipientId => new Notification
        {
            RecipientId = recipientId,
            Title = dto.Title,
            Content = dto.Content,
            NotificationType = dto.Type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UserId = createdBy
        }).ToList();

        await _notificationRepository.AddRangeAsync(notifications);
        await _notificationRepository.SaveChangesAsync();

        return notifications.Count;
    }

    public async Task MarkAsReadAsync(long id, long userId)
    {
        var notification = await _notificationRepository.GetByIdAsync(id);
        if (notification == null)
        {
            throw new InvalidOperationException("Không tìm thấy thông báo");
        }

        if (notification.RecipientId != userId)
        {
            throw new InvalidOperationException("Bạn không có quyền đánh dấu thông báo này");
        }

        await _notificationRepository.MarkAsReadAsync(id);
    }

    public async Task MarkAllAsReadAsync(long userId)
    {
        await _notificationRepository.MarkAllAsReadAsync(userId);
    }

    private NotificationDto MapToDto(Notification notification)
    {
        return new NotificationDto
        {
            Id = notification.Id,
            RecipientId = notification.RecipientId ?? 0,
            RecipientName = "",
            Title = notification.Title,
            Content = notification.Content,
            Type = notification.NotificationType,
            RelatedEntityType = "",
            RelatedEntityId = notification.RelatedId,
            IsRead = notification.IsRead,
            ReadAt = notification.ReadAt,
            CreatedAt = notification.CreatedAt
        };
    }
}
