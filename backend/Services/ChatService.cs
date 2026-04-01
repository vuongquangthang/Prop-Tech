using System.Text;
using System.Text.Json;
using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace backend.Services;

public interface IChatService
{
    Task<List<ChatMessageDto>> GetChatHistoryAsync(int userId, int limit = 100);
    Task<List<ChatMessageDto>> GetAllUsersHistoryAsync(int limit = 1000);
    Task<List<UnansweredChatItemDto>> GetUnansweredChatsAsync(int limit = 200);
    Task<KnowledgeBaseDto> ResolveUnansweredAsync(long assistantMessageId, ResolveUnansweredChatDto dto, int resolverUserId);
    Task<ChatMessageDto> SendMessageAsync(int userId, SendChatMessageDto dto);
    Task<ChatConversationDto> GetConversationAsync(int userId);
}

internal sealed class ChatResponseResult
{
    public string Text { get; set; } = string.Empty;
    public bool IsKnowledgeGap { get; set; }
}

public class ChatService : IChatService
{
    private readonly ILichSuChatRepository _chatRepository;
    private readonly IKnowledgeBaseRepository _knowledgeBaseRepository;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ChatService> _logger;
    private readonly string _n8nWebhookUrl;

    private const string DefaultN8nWebhookUrl =
        "https://lhdpo.app.n8n.cloud/webhook/00d5ccca-9e10-4b8c-9796-0c20f6277750";

    public ChatService(
        ILichSuChatRepository chatRepository,
        IKnowledgeBaseRepository knowledgeBaseRepository,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<ChatService> logger)
    {
        _chatRepository = chatRepository;
        _knowledgeBaseRepository = knowledgeBaseRepository;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _n8nWebhookUrl = configuration["N8n:ChatWebhookUrl"] ?? DefaultN8nWebhookUrl;
    }

    public async Task<List<ChatMessageDto>> GetChatHistoryAsync(int userId, int limit = 100)
    {
        var chats = await _chatRepository.GetByUserIdAsync(userId, limit);
        return chats.OrderBy(x => x.CreatedAt).Select(MapToDto).ToList();
    }

    public async Task<List<ChatMessageDto>> GetAllUsersHistoryAsync(int limit = 1000)
    {
        var chats = await _chatRepository.GetRecentAsync(limit);
        return chats.OrderByDescending(x => x.CreatedAt).Select(MapToDto).ToList();
    }

    public async Task<List<UnansweredChatItemDto>> GetUnansweredChatsAsync(int limit = 200)
    {
        var chats = await _chatRepository.GetRecentAsync(Math.Max(limit * 4, 200));
        var ordered = chats.OrderBy(x => x.CreatedAt).ToList();

        var unresolved = ordered
            .Where(x => x.MessageRole == "assistant" && x.IsKnowledgeGap)
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .Select(assistant =>
            {
                var question = ordered
                    .Where(x =>
                        x.UserId == assistant.UserId &&
                        x.MessageRole == "user" &&
                        x.CreatedAt <= assistant.CreatedAt)
                    .OrderByDescending(x => x.CreatedAt)
                    .FirstOrDefault();

                return new UnansweredChatItemDto
                {
                    AssistantMessageId = assistant.Id,
                    UserId = assistant.UserId,
                    UserPhone = assistant.User?.PhoneNumber,
                    Question = question?.MessageText ?? "",
                    AiResponse = assistant.MessageText,
                    AskedAt = question?.CreatedAt ?? assistant.CreatedAt,
                    IsResolved = false
                };
            })
            .Where(x => !string.IsNullOrWhiteSpace(x.Question))
            .ToList();

        return unresolved;
    }

    public async Task<KnowledgeBaseDto> ResolveUnansweredAsync(long assistantMessageId, ResolveUnansweredChatDto dto, int resolverUserId)
    {
        var assistantMessage = await _chatRepository.GetByIdAsync(assistantMessageId);
        if (assistantMessage == null || assistantMessage.MessageRole != "assistant")
        {
            throw new InvalidOperationException("Không tìm thấy câu trả lời AI cần xử lý");
        }

        var recentChats = await _chatRepository.GetByUserIdAsync(assistantMessage.UserId, 500);
        var question = recentChats
            .Where(x => x.MessageRole == "user" && x.CreatedAt <= assistantMessage.CreatedAt)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefault();

        if (question == null || string.IsNullOrWhiteSpace(question.MessageText))
        {
            throw new InvalidOperationException("Không tìm thấy câu hỏi tương ứng");
        }

        var kb = new KnowledgeBase
        {
            Title = question.MessageText.Trim(),
            Content = dto.AnswerText.Trim(),
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "Khác" : dto.Category.Trim(),
            Tags = BuildTagsFromQuestion(question.MessageText),
            IsActive = dto.ActivateImmediately,
            UpdatedAt = DateTime.UtcNow,
            UpdatedBy = resolverUserId
        };

        await _knowledgeBaseRepository.AddAsync(kb);

        assistantMessage.IsKnowledgeGap = false;
        _chatRepository.Update(assistantMessage);

        await _chatRepository.SaveChangesAsync();

        return new KnowledgeBaseDto
        {
            Id = kb.Id,
            Title = kb.Title,
            Content = kb.Content,
            Category = kb.Category,
            Tags = kb.Tags,
            IsActive = kb.IsActive,
            UpdatedAt = kb.UpdatedAt,
            UpdatedBy = kb.UpdatedBy,
            UpdatedByName = null
        };
    }

    public async Task<ChatMessageDto> SendMessageAsync(int userId, SendChatMessageDto dto)
    {
        // Save user message
        var userMessage = new LichSuChat
        {
            UserId = userId,
            MessageRole = "user",
            MessageText = dto.MessageText,
            CreatedAt = DateTime.UtcNow
        };

        await _chatRepository.AddAsync(userMessage);
        await _chatRepository.SaveChangesAsync();

        // Generate simple AI response (search knowledge base)
        var response = await GenerateResponseAsync(dto.MessageText);

        // Save assistant message
        var assistantMessage = new LichSuChat
        {
            UserId = userId,
            MessageRole = "assistant",
            MessageText = response.Text,
            IsKnowledgeGap = response.IsKnowledgeGap,
            CreatedAt = DateTime.UtcNow
        };

        await _chatRepository.AddAsync(assistantMessage);
        await _chatRepository.SaveChangesAsync();

        var created = await _chatRepository.GetByIdAsync(assistantMessage.Id);
        return MapToDto(created!);
    }

    public async Task<ChatConversationDto> GetConversationAsync(int userId)
    {
        var messages = await GetChatHistoryAsync(userId);
        
        return new ChatConversationDto
        {
            UserId = userId,
            UserPhone = messages.FirstOrDefault()?.UserPhone,
            Messages = messages,
            LastMessageAt = messages.LastOrDefault()?.CreatedAt
        };
    }

    private async Task<ChatResponseResult> GenerateResponseAsync(string userMessage)
    {
        // Always use n8n AI webhook for answer generation.
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(60);
            var payload = JsonSerializer.Serialize(new
            {
                chatInput = userMessage,
                message = userMessage,
                userMessage
            });
            using var content = new StringContent(payload, Encoding.UTF8, "application/json");
            var res = await client.PostAsync(_n8nWebhookUrl, content);
            var json = await res.Content.ReadAsStringAsync();
            
            _logger.LogInformation("n8n webhook response: status={StatusCode}, body={Body}", (int)res.StatusCode, json);
            
            if (res.IsSuccessStatusCode)
            {
                var text = ExtractN8nText(json);
                _logger.LogInformation("Extracted text from n8n: '{Text}'", text);
                
                if (!string.IsNullOrWhiteSpace(text))
                {
                    return new ChatResponseResult
                    {
                        Text = text,
                        IsKnowledgeGap = false
                    };
                }

                _logger.LogWarning("n8n responded OK but no parsable text. url={Url}, body={Body}", _n8nWebhookUrl, json);
            }
            else
            {
                _logger.LogWarning("n8n webhook returned non-success status. url={Url}, status={StatusCode}, body={Body}", _n8nWebhookUrl, (int)res.StatusCode, json);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "n8n webhook call failed. url={Url}", _n8nWebhookUrl);
        }

        return new ChatResponseResult
        {
            Text = "Tôi chưa tìm thấy thông tin đủ chính xác để trả lời. Câu hỏi của bạn đã được ghi nhận để ban quản lý bổ sung vào kho tri thức.",
            IsKnowledgeGap = true
        };
    }

    private static string? ExtractN8nText(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
        {
            root = root[0];
        }

        var candidates = new[] { "output", "answer", "response", "message", "text" };
        foreach (var key in candidates)
        {
            if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String)
            {
                var text = value.GetString();
                if (!string.IsNullOrWhiteSpace(text))
                {
                    return text;
                }
            }
        }

        if (root.ValueKind == JsonValueKind.String)
        {
            var text = root.GetString();
            if (!string.IsNullOrWhiteSpace(text))
            {
                return text;
            }
        }

        return null;
    }

    private static string BuildTagsFromQuestion(string question)
    {
        var tags = question
            .ToLowerInvariant()
            .Split(new[] { ' ', '\t', '\r', '\n', '?', '.', ',', '!', ':', ';', '"', '\'' }, StringSplitOptions.RemoveEmptyEntries)
            .Where(x => x.Length >= 3)
            .Distinct()
            .Take(8);

        return string.Join(",", tags);
    }

    private ChatMessageDto MapToDto(LichSuChat chat)
    {
        return new ChatMessageDto
        {
            Id = chat.Id,
            UserId = chat.UserId,
            UserPhone = chat.User?.PhoneNumber,
            MessageRole = chat.MessageRole,
            MessageText = chat.MessageText,
            IsKnowledgeGap = chat.IsKnowledgeGap,
            CreatedAt = chat.CreatedAt
        };
    }
}
