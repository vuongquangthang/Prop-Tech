namespace backend.DTOs;

public class PostMessageParticipantDto
{
    public string UserId { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
    public string PhoneNumber { get; set; } = null!;
    public string? AvatarUrl { get; set; }
}

public class PostMessageDto
{
    public string Id { get; set; } = null!;
    public string ConversationId { get; set; } = null!;
    public int PostId { get; set; }
    public string Content { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public bool IsMine { get; set; }
    public string Status { get; set; } = "sent";
}

public class PostConversationDto
{
    public string ConversationId { get; set; } = null!;
    public int PostId { get; set; }
    public string PostTitle { get; set; } = null!;
    public string RoomCode { get; set; } = null!;
    public string OtherUserId { get; set; } = null!;
    public string OtherUserName { get; set; } = null!;
    public string OtherUserPhone { get; set; } = null!;
    public string? OtherUserAvatarUrl { get; set; }
    public string LastMessage { get; set; } = null!;
    public DateTime LastMessageAt { get; set; }
    public int LastSenderUserId { get; set; }
    public int UnreadCount { get; set; }
    public bool IsUnread { get; set; }
}

public class PostConversationDetailDto
{
    public string ConversationId { get; set; } = null!;
    public int PostId { get; set; }
    public string PostTitle { get; set; } = null!;
    public string RoomCode { get; set; } = null!;
    public PostMessageParticipantDto Me { get; set; } = null!;
    public PostMessageParticipantDto OtherUser { get; set; } = null!;
    public List<PostMessageDto> Messages { get; set; } = new();
}

public class SendPostMessageDto
{
    public string ConversationId { get; set; } = null!;
    public string Content { get; set; } = null!;
}
