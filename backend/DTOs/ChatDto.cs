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
}

/// <summary>
/// DTO to send a chat message
/// </summary>
public class SendChatMessageDto
{
    public string MessageText { get; set; } = null!;
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
