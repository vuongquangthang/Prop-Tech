using backend.DTOs;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace backend.Services;

public interface IPostMessageService
{
    Task<List<PostConversationDto>> GetConversationsAsync(int currentUserId, int ownerUserId);
    Task<PostConversationDetailDto> GetConversationDetailAsync(string conversationId, int currentUserId, int ownerUserId);
    Task<PostMessageDto> SendAsync(int currentUserId, int ownerUserId, SendPostMessageDto dto);
    Task MarkConversationReadAsync(string conversationId, int currentUserId, int ownerUserId);
}

public class PostMessageService : IPostMessageService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly IPostService _postService;

    public PostMessageService(IHttpClientFactory httpClientFactory, IConfiguration configuration, IPostService postService)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _postService = postService;
    }

    public async Task<List<PostConversationDto>> GetConversationsAsync(int currentUserId, int ownerUserId)
    {
        List<TrouytinConversationResponse> remoteItems;
        try
        {
            remoteItems = await GetRemoteConversationsAsync(currentUserId);
        }
        catch (HttpRequestException)
        {
            return new List<PostConversationDto>();
        }
        catch (TaskCanceledException)
        {
            return new List<PostConversationDto>();
        }

        var result = new List<PostConversationDto>();

        foreach (var item in remoteItems)
        {
            var postId = TryExtractPostId(item.RoomId);
            if (!postId.HasValue)
            {
                continue;
            }

            var post = await _postService.GetByIdAsync(postId.Value);
            if (post?.CreatedByUserId != currentUserId)
            {
                continue;
            }

            var unreadCount = item.Messages.Count(x =>
                string.Equals(x.From, "web", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(x.Status, "seen", StringComparison.OrdinalIgnoreCase));
            var latest = item.Messages.OrderByDescending(x => x.At).FirstOrDefault();
            if (latest == null)
            {
                continue;
            }

            result.Add(new PostConversationDto
            {
                ConversationId = item.Id,
                PostId = post.Id,
                PostTitle = post.Title,
                RoomCode = post.RoomCode,
                OtherUserId = item.OwnerUserId,
                OtherUserName = item.RequesterName,
                OtherUserPhone = item.RequesterPhone,
                OtherUserAvatarUrl = null,
                LastMessage = latest.Text,
                LastMessageAt = latest.At,
                LastSenderUserId = string.Equals(latest.From, "mobile", StringComparison.OrdinalIgnoreCase) ? currentUserId : 0,
                UnreadCount = unreadCount,
                IsUnread = unreadCount > 0,
            });
        }

        return result.OrderByDescending(x => x.LastMessageAt).ToList();
    }

    public async Task<PostConversationDetailDto> GetConversationDetailAsync(string conversationId, int currentUserId, int ownerUserId)
    {
        var remote = await FindRemoteConversationAsync(conversationId, currentUserId);
        var postId = TryExtractPostId(remote.RoomId) ?? throw new InvalidOperationException("Không xác định được bài đăng");
        var post = await _postService.GetByIdAsync(postId);
        if (post?.CreatedByUserId != currentUserId)
        {
            throw new InvalidOperationException("Bạn không có quyền xem hội thoại này");
        }

        await MarkConversationReadAsync(conversationId, currentUserId, ownerUserId);

        return new PostConversationDetailDto
        {
            ConversationId = remote.Id,
            PostId = post.Id,
            PostTitle = post.Title,
            RoomCode = post.RoomCode,
            Me = new PostMessageParticipantDto
            {
                UserId = currentUserId.ToString(),
                DisplayName = post.ContactName,
                PhoneNumber = post.ContactPhone,
                AvatarUrl = null,
            },
            OtherUser = new PostMessageParticipantDto
            {
                UserId = remote.OwnerUserId,
                DisplayName = remote.RequesterName,
                PhoneNumber = remote.RequesterPhone,
                AvatarUrl = null,
            },
            Messages = remote.Messages.Select(x => MapMessage(remote, post.Id, x)).ToList(),
        };
    }

    public async Task<PostMessageDto> SendAsync(int currentUserId, int ownerUserId, SendPostMessageDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            throw new InvalidOperationException("Vui lòng nhập nội dung tin nhắn");
        }

        var remote = await FindRemoteConversationAsync(dto.ConversationId, currentUserId);
        var postId = TryExtractPostId(remote.RoomId) ?? throw new InvalidOperationException("Không xác định được bài đăng");
        var post = await _postService.GetByIdAsync(postId);
        if (post?.CreatedByUserId != currentUserId)
        {
            throw new InvalidOperationException("Bạn không có quyền trả lời hội thoại này");
        }

        var client = CreateClient();
        var response = await client.PostAsJsonAsync(
            $"/api/proptech/conversations/{Uri.EscapeDataString(dto.ConversationId)}/messages?partnerUserId={currentUserId}",
            new TrouytinSendMessageRequest(dto.Content.Trim()));

        if (!response.IsSuccessStatusCode)
        {
            throw await CreateRemoteExceptionAsync(response, "Không thể gửi tin nhắn");
        }

        var created = await response.Content.ReadFromJsonAsync<TrouytinMessageResponse>()
            ?? throw new InvalidOperationException("Phản hồi tin nhắn không hợp lệ");

        return MapMessage(remote, post.Id, created);
    }

    public async Task MarkConversationReadAsync(string conversationId, int currentUserId, int ownerUserId)
    {
        var client = CreateClient();
        var response = await client.PatchAsync(
            $"/api/proptech/conversations/{Uri.EscapeDataString(conversationId)}/read?partnerUserId={currentUserId}",
            null);

        if (!response.IsSuccessStatusCode)
        {
            throw await CreateRemoteExceptionAsync(response, "Không thể cập nhật trạng thái đã đọc");
        }
    }

    private async Task<List<TrouytinConversationResponse>> GetRemoteConversationsAsync(int currentUserId)
    {
        var client = CreateClient();
        var response = await client.GetAsync($"/api/proptech/conversations?partnerUserId={currentUserId}");
        if (!response.IsSuccessStatusCode)
        {
            throw await CreateRemoteExceptionAsync(response, "Không thể tải danh sách hội thoại");
        }

        return await response.Content.ReadFromJsonAsync<List<TrouytinConversationResponse>>() ?? new();
    }

    private async Task<TrouytinConversationResponse> FindRemoteConversationAsync(string conversationId, int currentUserId)
    {
        var items = await GetRemoteConversationsAsync(currentUserId);
        return items.FirstOrDefault(x => string.Equals(x.Id, conversationId, StringComparison.Ordinal))
            ?? throw new InvalidOperationException("Không tìm thấy hội thoại");
    }

    private HttpClient CreateClient()
    {
        var baseUrl = _configuration["TroUyTinIntegration:BaseUrl"]?.Trim();
        var apiKey = _configuration["TroUyTinIntegration:InternalApiKey"]?.Trim();
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            throw new InvalidOperationException("Chưa cấu hình TroUyTinIntegration:BaseUrl");
        }

        var client = _httpClientFactory.CreateClient();
        client.BaseAddress = new Uri(baseUrl.TrimEnd('/'));
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            client.DefaultRequestHeaders.Remove("X-Internal-Api-Key");
            client.DefaultRequestHeaders.Add("X-Internal-Api-Key", apiKey);
        }
        return client;
    }

    private static PostMessageDto MapMessage(TrouytinConversationResponse conversation, int postId, TrouytinMessageResponse message)
    {
        return new PostMessageDto
        {
            Id = message.Id,
            ConversationId = conversation.Id,
            PostId = postId,
            Content = message.Text,
            CreatedAt = message.At,
            ReadAt = string.Equals(message.Status, "seen", StringComparison.OrdinalIgnoreCase) ? message.At : null,
            IsMine = string.Equals(message.From, "mobile", StringComparison.OrdinalIgnoreCase),
            Status = message.Status,
        };
    }

    private static int? TryExtractPostId(string? roomId)
    {
        if (string.IsNullOrWhiteSpace(roomId))
        {
            return null;
        }

        var value = roomId.Trim();
        if (!value.StartsWith("post-", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return int.TryParse(value["post-".Length..], out var postId) ? postId : null;
    }

    private static async Task<InvalidOperationException> CreateRemoteExceptionAsync(HttpResponseMessage response, string fallbackMessage)
    {
        try
        {
            var payload = await response.Content.ReadFromJsonAsync<RemoteErrorPayload>();
            if (!string.IsNullOrWhiteSpace(payload?.Message))
            {
                return new InvalidOperationException(payload.Message);
            }
        }
        catch
        {
        }

        return new InvalidOperationException(fallbackMessage);
    }

    private sealed class RemoteErrorPayload
    {
        [JsonPropertyName("message")]
        public string? Message { get; set; }
    }

    private sealed class TrouytinSendMessageRequest
    {
        public TrouytinSendMessageRequest(string text)
        {
            Text = text;
        }

        [JsonPropertyName("text")]
        public string Text { get; }
    }

    private sealed class TrouytinConversationResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = null!;

        [JsonPropertyName("ownerUserId")]
        public string OwnerUserId { get; set; } = null!;

        [JsonPropertyName("requesterName")]
        public string RequesterName { get; set; } = string.Empty;

        [JsonPropertyName("requesterPhone")]
        public string RequesterPhone { get; set; } = string.Empty;

        [JsonPropertyName("roomId")]
        public string RoomId { get; set; } = string.Empty;

        [JsonPropertyName("roomTitle")]
        public string RoomTitle { get; set; } = string.Empty;

        [JsonPropertyName("messages")]
        public List<TrouytinMessageResponse> Messages { get; set; } = new();
    }

    private sealed class TrouytinMessageResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = null!;

        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;

        [JsonPropertyName("from")]
        public string From { get; set; } = string.Empty;

        [JsonPropertyName("at")]
        public DateTime At { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }
}
