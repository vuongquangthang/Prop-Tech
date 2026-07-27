namespace backend.DTOs;

/// <summary>
/// DTO for chat message display
/// </summary>
public class ChatMessageDto
{
    public long Id { get; set; }
    public int UserId { get; set; }
    public string? UserPhone { get; set; }
    public string MessageRole { get; set; } = null!; // user, assistant, system
    public string MessageText { get; set; } = null!;
    public bool IsKnowledgeGap { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ChatRoomNavigationDto> Rooms { get; set; } = new();
}

/// <summary>
/// Structured room data returned with a chatbot answer so clients can navigate
/// without parsing room names from the natural-language message.
/// </summary>
public class ChatRoomNavigationDto
{
    public int RoomId { get; set; }
    public string RoomName { get; set; } = null!;
    public string DetailUrl { get; set; } = null!;
}

/// <summary>
/// DTO to send a chat message
/// </summary>
public class SendChatMessageDto
{
    public string? MessageText { get; set; }
    public string? Message { get; set; }
    public string? SessionId { get; set; }
}

/// <summary>
/// DTO for chat conversation (grouped messages)
/// </summary>
public class ChatConversationDto
{
    public int UserId { get; set; }
    public string? UserPhone { get; set; }
    public List<ChatMessageDto> Messages { get; set; } = new();
    public DateTime? LastMessageAt { get; set; }
}

public class UnansweredChatItemDto
{
    public long AssistantMessageId { get; set; }
    public int UserId { get; set; }
    public string? UserPhone { get; set; }
    public string Question { get; set; } = string.Empty;
    public string AiResponse { get; set; } = string.Empty;
    public DateTime AskedAt { get; set; }
    public bool IsResolved { get; set; }
}

public class ResolveUnansweredChatDto
{
    public string AnswerText { get; set; } = string.Empty;
    public string? Category { get; set; }
    public bool ActivateImmediately { get; set; } = true;
}
