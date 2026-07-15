using System.Text;
using System.Text.Json;
using System.Globalization;
using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IChatService
{
    Task<List<ChatMessageDto>> GetChatHistoryAsync(int userId, int limit = 100);
    Task<List<ChatMessageDto>> GetAllUsersHistoryAsync(int ownerUserId, int limit = 1000);
    Task<List<UnansweredChatItemDto>> GetUnansweredChatsAsync(int ownerUserId, int limit = 200);
    Task<KnowledgeBaseDto> ResolveUnansweredAsync(long assistantMessageId, ResolveUnansweredChatDto dto, int resolverUserId, int ownerUserId);
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
    private readonly ApplicationDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ChatService> _logger;
    private readonly string _chatbotBaseUrl;

    private const string DefaultChatbotBaseUrl = "http://localhost:8000";

    public ChatService(
        ILichSuChatRepository chatRepository,
        IKnowledgeBaseRepository knowledgeBaseRepository,
        ApplicationDbContext context,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<ChatService> logger)
    {
        _chatRepository = chatRepository;
        _knowledgeBaseRepository = knowledgeBaseRepository;
        _context = context;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _chatbotBaseUrl = (configuration["Chatbot:BaseUrl"] ?? DefaultChatbotBaseUrl).TrimEnd('/');
    }

    public async Task<List<ChatMessageDto>> GetChatHistoryAsync(int userId, int limit = 100)
    {
        var chats = await _chatRepository.GetByUserIdAsync(userId, limit);
        return chats.OrderBy(x => x.CreatedAt).Select(MapToDto).ToList();
    }

    public async Task<List<ChatMessageDto>> GetAllUsersHistoryAsync(int ownerUserId, int limit = 1000)
    {
        var chats = await _chatRepository.GetRecentAsync(ownerUserId, limit);
        return chats.OrderByDescending(x => x.CreatedAt).Select(MapToDto).ToList();
    }

    public async Task<List<UnansweredChatItemDto>> GetUnansweredChatsAsync(int ownerUserId, int limit = 200)
    {
        var chats = await _chatRepository.GetRecentAsync(ownerUserId, Math.Max(limit * 4, 200));
        var ordered = chats.OrderBy(x => x.CreatedAt).ToList();

        return ordered
            .Where(x => x.MessageRole == "assistant" && x.IsKnowledgeGap)
            .OrderByDescending(x => x.CreatedAt)
            .Take(limit)
            .Select(assistant =>
            {
                var question = ordered
                    .Where(x =>
                        x.UserId == assistant.UserId
                        && x.MessageRole == "user"
                        && x.CreatedAt <= assistant.CreatedAt)
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
    }

    public async Task<KnowledgeBaseDto> ResolveUnansweredAsync(long assistantMessageId, ResolveUnansweredChatDto dto, int resolverUserId, int ownerUserId)
    {
        var assistantMessage = await _chatRepository.GetByIdAsync(assistantMessageId, ownerUserId);
        if (assistantMessage == null || assistantMessage.MessageRole != "assistant")
        {
            throw new InvalidOperationException("Khong tim thay cau tra loi AI can xu ly");
        }

        var recentChats = await _chatRepository.GetByUserIdAsync(assistantMessage.UserId, 500);
        var question = recentChats
            .Where(x => x.MessageRole == "user" && x.CreatedAt <= assistantMessage.CreatedAt)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefault();

        if (question == null || string.IsNullOrWhiteSpace(question.MessageText))
        {
            throw new InvalidOperationException("Khong tim thay cau hoi tuong ung");
        }

        var kb = new KnowledgeBase
        {
            Title = question.MessageText.Trim(),
            Content = dto.AnswerText.Trim(),
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "Khac" : dto.Category.Trim(),
            Tags = BuildTagsFromQuestion(question.MessageText),
            IsActive = dto.ActivateImmediately,
            UpdatedAt = DateTime.UtcNow,
            UpdatedBy = resolverUserId,
            OwnerUserId = ownerUserId
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
            UpdatedByName = null,
            OwnerUserId = kb.OwnerUserId
        };
    }

    public async Task<ChatMessageDto> SendMessageAsync(int userId, SendChatMessageDto dto)
    {
        var effectiveMessage = dto.MessageText ?? dto.Message ?? string.Empty;

        var userMessage = new LichSuChat
        {
            UserId = userId,
            MessageRole = "user",
            MessageText = effectiveMessage,
            CreatedAt = DateTime.UtcNow
        };

        await _chatRepository.AddAsync(userMessage);
        await _chatRepository.SaveChangesAsync();

        var buildingCode = await ResolveBuildingCodeAsync(userId);
        var response = await GenerateResponseAsync(effectiveMessage, userId, dto.SessionId, buildingCode);

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

    private async Task<ChatResponseResult> GenerateResponseAsync(string userMessage, int userId, string? sessionId, string? buildingCode)
    {
        if (string.IsNullOrWhiteSpace(buildingCode))
        {
            return KnowledgeGapResponse("Tôi chưa xác định được tòa nhà của tài khoản này. Vui lòng liên hệ ban quản lý để cập nhật phòng hoặc hợp đồng trước khi dùng chatbot.");
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(90);
            var payload = JsonSerializer.Serialize(new
            {
                building_code = buildingCode,
                question = userMessage,
                sessionId = string.IsNullOrWhiteSpace(sessionId) ? userId.ToString() : sessionId
            });
            using var content = new StringContent(payload, Encoding.UTF8, "application/json");
            var res = await client.PostAsync($"{_chatbotBaseUrl}/api/v1/chat", content);
            var json = await res.Content.ReadAsStringAsync();

            _logger.LogInformation("Chatbot response: status={StatusCode}, buildingCode={BuildingCode}", (int)res.StatusCode, buildingCode);

            if (res.IsSuccessStatusCode)
            {
                var text = ExtractResponseText(json);

                if (!string.IsNullOrWhiteSpace(text))
                {
                    return new ChatResponseResult
                    {
                        Text = text,
                        IsKnowledgeGap = LooksLikeKnowledgeGap(text)
                    };
                }

                _logger.LogWarning("Chatbot responded OK but no parsable text. url={Url}, body={Body}", _chatbotBaseUrl, json);
            }
            else
            {
                _logger.LogWarning("Chatbot returned non-success status. url={Url}, status={StatusCode}, body={Body}", _chatbotBaseUrl, (int)res.StatusCode, json);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Chatbot call failed. url={Url}", _chatbotBaseUrl);
        }

        return KnowledgeGapResponse("Tôi chưa tìm thấy thông tin đủ chính xác để trả lời. Câu hỏi của bạn đã được ghi nhận để ban quản lý bổ sung vào kho tri thức.");
    }

    private async Task<string?> ResolveBuildingCodeAsync(int userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == userId);

        if (user == null)
        {
            return null;
        }

        if (user.ResidentId.HasValue)
        {
            var now = DateTime.UtcNow;
            var currentResidency = await _context.ChiTietOs
                .AsNoTracking()
                .Include(item => item.HopDong)
                    .ThenInclude(contract => contract.Room)
                        .ThenInclude(room => room.Floor)
                .Where(item =>
                    item.ResidentId == user.ResidentId.Value
                    && item.FromDate <= now
                    && (!item.ToDate.HasValue || item.ToDate.Value >= now))
                .OrderByDescending(item => item.FromDate)
                .FirstOrDefaultAsync();

            if (currentResidency?.HopDong?.Room?.Floor != null)
            {
                return currentResidency.HopDong.Room.Floor.BuildingId.ToString();
            }

            var latestResidency = await _context.ChiTietOs
                .AsNoTracking()
                .Include(item => item.HopDong)
                    .ThenInclude(contract => contract.Room)
                        .ThenInclude(room => room.Floor)
                .Where(item => item.ResidentId == user.ResidentId.Value)
                .OrderByDescending(item => item.FromDate)
                .FirstOrDefaultAsync();

            if (latestResidency?.HopDong?.Room?.Floor != null)
            {
                return latestResidency.HopDong.Room.Floor.BuildingId.ToString();
            }
        }

        if (user.OwnerUserId.HasValue)
        {
            var buildingId = await _context.Buildings
                .AsNoTracking()
                .Where(item => item.OwnerUserId == user.OwnerUserId.Value && !item.IsDeleted)
                .OrderBy(item => item.Id)
                .Select(item => (int?)item.Id)
                .FirstOrDefaultAsync();

            if (buildingId.HasValue)
            {
                return buildingId.Value.ToString();
            }
        }

        return null;
    }

    private static ChatResponseResult KnowledgeGapResponse(string text)
        => new()
        {
            Text = text,
            IsKnowledgeGap = true
        };

    private static string? ExtractResponseText(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return null;
        }

        var trimmed = body.Trim();

        if (!(trimmed.StartsWith("{") || trimmed.StartsWith("[")))
        {
            return trimmed;
        }

        try
        {
            using var doc = JsonDocument.Parse(trimmed);
            var extracted = TryExtractTextFromElement(doc.RootElement, 0);
            if (!string.IsNullOrWhiteSpace(extracted))
            {
                return extracted;
            }
        }
        catch
        {
            return trimmed;
        }

        return null;
    }

    private static string? TryExtractTextFromElement(JsonElement element, int depth)
    {
        if (depth > 6)
        {
            return null;
        }

        switch (element.ValueKind)
        {
            case JsonValueKind.String:
            {
                var text = element.GetString();
                return string.IsNullOrWhiteSpace(text) ? null : text;
            }
            case JsonValueKind.Array:
            {
                foreach (var item in element.EnumerateArray())
                {
                    var fromItem = TryExtractTextFromElement(item, depth + 1);
                    if (!string.IsNullOrWhiteSpace(fromItem))
                    {
                        return fromItem;
                    }
                }

                return null;
            }
            case JsonValueKind.Object:
            {
                var preferredKeys = new[]
                {
                    "answer", "reply", "output", "response", "message", "text", "content", "result", "data"
                };

                foreach (var key in preferredKeys)
                {
                    if (!element.TryGetProperty(key, out var value))
                    {
                        continue;
                    }

                    var fromPreferred = TryExtractTextFromElement(value, depth + 1);
                    if (!string.IsNullOrWhiteSpace(fromPreferred))
                    {
                        return fromPreferred;
                    }
                }

                foreach (var property in element.EnumerateObject())
                {
                    var fromAny = TryExtractTextFromElement(property.Value, depth + 1);
                    if (!string.IsNullOrWhiteSpace(fromAny))
                    {
                        return fromAny;
                    }
                }

                return null;
            }
            default:
                return null;
        }
    }

    private static bool LooksLikeKnowledgeGap(string text)
    {
        var normalized = RemoveDiacritics(text).ToLowerInvariant();
        return normalized.Contains("khong tim thay")
            || normalized.Contains("khong co trong he thong")
            || normalized.Contains("chua tim thay")
            || normalized.Contains("chua du du lieu")
            || normalized.Contains("khong du thong tin")
            || normalized.Contains("bo sung vao kho tri thuc")
            || normalized.Contains("không tìm thấy")
            || normalized.Contains("không có trong hệ thống")
            || normalized.Contains("chưa tìm thấy")
            || normalized.Contains("chưa đủ dữ liệu")
            || normalized.Contains("không đủ thông tin");
    }

    private static string RemoveDiacritics(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            builder.Append(c == 'đ' ? 'd' : c == 'Đ' ? 'D' : c);
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
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
