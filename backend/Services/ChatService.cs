using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IChatService
{
    Task<List<ChatMessageDto>> GetChatHistoryAsync(int userId, int limit = 100);
    Task<ChatMessageDto> SendMessageAsync(int userId, SendChatMessageDto dto);
    Task<ChatConversationDto> GetConversationAsync(int userId);
}

public class ChatService : IChatService
{
    private readonly ILichSuChatRepository _chatRepository;
    private readonly IKnowledgeBaseRepository _knowledgeBaseRepository;

    public ChatService(
        ILichSuChatRepository chatRepository,
        IKnowledgeBaseRepository knowledgeBaseRepository)
    {
        _chatRepository = chatRepository;
        _knowledgeBaseRepository = knowledgeBaseRepository;
    }

    public async Task<List<ChatMessageDto>> GetChatHistoryAsync(int userId, int limit = 100)
    {
        var chats = await _chatRepository.GetByUserIdAsync(userId, limit);
        return chats.OrderBy(x => x.CreatedAt).Select(MapToDto).ToList();
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
        // Simple keyword search in knowledge base
        var lowerMessage = userMessage.ToLower();
        var knowledgeItems = await _knowledgeBaseRepository.SearchAsync(userMessage);

        if (knowledgeItems.Any())
        {
            var bestMatch = knowledgeItems.First();
            return $"📚 {bestMatch.Title}\n\n{bestMatch.Content}\n\n(Nguồn: Cơ sở kiến thức)";
        }

        // Default responses for common questions
        if (lowerMessage.Contains("giá") || lowerMessage.Contains("tiền"))
        {
            return "Để biết thông tin về giá phòng và chi phí, vui lòng liên hệ ban quản lý hoặc xem trong hợp đồng của bạn.";
        }

        if (lowerMessage.Contains("hóa đơn") || lowerMessage.Contains("thanh toán"))
        {
            return "Bạn có thể xem hóa đơn và thanh toán qua ứng dụng. Hóa đơn được phát hành vào đầu tháng và hạn thanh toán là ngày 10 hàng tháng.";
        }

        if (lowerMessage.Contains("sửa chữa") || lowerMessage.Contains("hỏng"))
        {
            return "Để yêu cầu sửa chữa, vui lòng tạo yêu cầu trong mục 'Bảo trì' của ứng dụng. Ban quản lý sẽ xử lý trong vòng 24-48 giờ.";
        }

        if (lowerMessage.Contains("xe") || lowerMessage.Contains("parking"))
        {
            return "Thông tin về đăng ký xe và chỗ đậu xe có thể xem trong mục 'Phương tiện' của ứng dụng.";
        }

        // Generic response
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
