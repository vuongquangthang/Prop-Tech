using System.Text;
using System.Text.Json;
using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IChatService
{
    Task<List<ChatMessageDto>> GetChatHistoryAsync(int userId, int limit = 100);
    Task<List<ChatMessageDto>> GetAllUsersHistoryAsync(int limit = 1000);
    Task<ChatMessageDto> SendMessageAsync(int userId, SendChatMessageDto dto);
    Task<ChatConversationDto> GetConversationAsync(int userId);
}

public class ChatService : IChatService
{
    private readonly ILichSuChatRepository _chatRepository;
    private readonly IKnowledgeBaseRepository _knowledgeBaseRepository;
    private readonly IHttpClientFactory _httpClientFactory;

    private const string N8nWebhookUrl =
        "https://lhdpo.app.n8n.cloud/webhook/4091fa09-fb9a-4039-9411-7104d213f601/chat";

    public ChatService(
        ILichSuChatRepository chatRepository,
        IKnowledgeBaseRepository knowledgeBaseRepository,
        IHttpClientFactory httpClientFactory)
    {
        _chatRepository = chatRepository;
        _knowledgeBaseRepository = knowledgeBaseRepository;
        _httpClientFactory = httpClientFactory;
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
            MessageText = response,
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

    private async Task<string> GenerateResponseAsync(string userMessage)
    {
        // Search knowledge base FIRST — admin-curated content takes priority

        // 1. Full-phrase search
        var knowledgeItems = await _knowledgeBaseRepository.SearchAsync(userMessage);

        // 2. If no full-phrase match, try each meaningful word individually
        if (!knowledgeItems.Any())
        {
            var words = userMessage
                .Split(new[] { ' ', '?', '.', ',', '!', '\t' }, StringSplitOptions.RemoveEmptyEntries)
                .Where(w => w.Length >= 3)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            foreach (var word in words)
            {
                var results = await _knowledgeBaseRepository.SearchAsync(word);
                if (results.Any())
                {
                    knowledgeItems = results;
                    break;
                }
            }
        }

        if (knowledgeItems.Any())
        {
            var bestMatch = knowledgeItems.First();
            return $"📚 {bestMatch.Title}\n\n{bestMatch.Content}";
        }

        // No KB match — try n8n AI webhook
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(15);
            var payload = JsonSerializer.Serialize(new { chatInput = userMessage });
            using var content = new StringContent(payload, Encoding.UTF8, "application/json");
            var res = await client.PostAsync(N8nWebhookUrl, content);
            if (res.IsSuccessStatusCode)
            {
                var json = await res.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("output", out var outputEl))
                {
                    var text = outputEl.GetString();
                    if (!string.IsNullOrWhiteSpace(text))
                        return text;
                }
            }
        }
        catch
        {
            // n8n unavailable — fall through to keyword-based fallback
        }

        // Keyword fallback
        var lowerMessage = userMessage.ToLower();

        if (lowerMessage.Contains("giá") || lowerMessage.Contains("tiền"))
            return "Để biết thông tin về giá phòng và chi phí, vui lòng liên hệ ban quản lý hoặc xem trong hợp đồng của bạn.";

        if (lowerMessage.Contains("hóa đơn") || lowerMessage.Contains("thanh toán"))
            return "Bạn có thể xem hóa đơn và thanh toán qua ứng dụng. Hóa đơn được phát hành vào đầu tháng và hạn thanh toán là ngày 10 hàng tháng.";

        if (lowerMessage.Contains("sửa chữa") || lowerMessage.Contains("hỏng"))
            return "Để yêu cầu sửa chữa, vui lòng tạo yêu cầu trong mục 'Bảo trì' của ứng dụng. Ban quản lý sẽ xử lý trong vòng 24-48 giờ.";

        if (lowerMessage.Contains("xe") || lowerMessage.Contains("parking"))
            return "Thông tin về đăng ký xe và chỗ đậu xe có thể xem trong mục 'Phương tiện' của ứng dụng.";

        return "Cảm ơn bạn đã liên hệ! Tôi chưa tìm thấy thông tin phù hợp. Vui lòng liên hệ ban quản lý để được hỗ trợ tốt hơn, hoặc tìm kiếm trong mục FAQ/Nội quy.";
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
            CreatedAt = chat.CreatedAt
        };
    }
}
