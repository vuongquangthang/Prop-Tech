namespace backend.DTOs;

/// <summary>
/// Simple response DTO used by both web and mobile clients.
/// </summary>
public class NotificationResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string NotificationType { get; set; } = null!;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? SenderPhone { get; set; }
}

public class NotificationDto
{
    public long Id { get; set; }
    public long RecipientId { get; set; }
    public string RecipientName { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string? RelatedEntityType { get; set; }
    public long? RelatedEntityId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class NotificationDetailDto : NotificationDto
{
    public string? ActionUrl { get; set; }
    public string? Metadata { get; set; }
}

public class CreateNotificationDto
{
    public long RecipientId { get; set; }
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string Type { get; set; } = null!; // INVOICE, PAYMENT, MAINTENANCE, ANNOUNCEMENT, COMPLAINT
    public string? RelatedEntityType { get; set; }
    public long? RelatedEntityId { get; set; }
    public string? ActionUrl { get; set; }
    public string? Metadata { get; set; }
}

public class BroadcastNotificationDto
{
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string Scope { get; set; } = null!; // ALL, BUILDING, FLOOR, ROOM
    public long? BuildingId { get; set; }
    public long? FloorId { get; set; }
    public long? RoomId { get; set; }
}
