using System.Net.Http.Headers;
using System.Text;

namespace backend.Services;

public sealed record ChatAppProxyContext(int UserId, string Role, string BuildingCode);
public sealed record ChatAppProxyResponse(int StatusCode, string ContentType, byte[] Body);

public interface IChatAppProxyService
{
    Task<ChatAppProxyContext> ResolveContextAsync(
        int userId, string role, int ownerUserId,
        CancellationToken cancellationToken);
    Task<ChatAppProxyResponse> SendJsonAsync(
        HttpMethod method, string path, ChatAppProxyContext context,
        string? json, CancellationToken cancellationToken);
    Task<ChatAppProxyResponse> SendMultipartAsync(
        string path, ChatAppProxyContext context, IReadOnlyList<IFormFile> files,
        string buildingCode, string? category, string? title,
        CancellationToken cancellationToken);
}

public sealed class ChatAppProxyService : IChatAppProxyService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public ChatAppProxyService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public Task<ChatAppProxyContext> ResolveContextAsync(
        int userId, string role, int ownerUserId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        // Tenant scope lấy hoàn toàn từ JWT do Prop-Tech phát hành.
        // Không đọc hoặc thay đổi database Prop-Tech.
        return Task.FromResult(new ChatAppProxyContext(
            userId, role, $"owner-{ownerUserId}"));
    }

    public Task<ChatAppProxyResponse> SendJsonAsync(
        HttpMethod method, string path, ChatAppProxyContext context,
        string? json, CancellationToken cancellationToken)
    {
        var request = CreateRequest(method, path, context);
        if (json is not null)
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        return SendAsync(request, cancellationToken);
    }

    public async Task<ChatAppProxyResponse> SendMultipartAsync(
        string path, ChatAppProxyContext context, IReadOnlyList<IFormFile> files,
        string buildingCode, string? category, string? title,
        CancellationToken cancellationToken)
    {
        using var request = CreateRequest(HttpMethod.Post, path, context);
        using var multipart = new MultipartFormDataContent();
        multipart.Add(new StringContent(buildingCode), "building_code");
        if (!string.IsNullOrWhiteSpace(category))
            multipart.Add(new StringContent(category), "category");
        if (!string.IsNullOrWhiteSpace(title))
            multipart.Add(new StringContent(title), "title");

        var streams = new List<Stream>();
        try
        {
            foreach (var file in files)
            {
                var stream = file.OpenReadStream();
                streams.Add(stream);
                var content = new StreamContent(stream);
                content.Headers.ContentType = MediaTypeHeaderValue.Parse(
                    string.IsNullOrWhiteSpace(file.ContentType)
                        ? "application/octet-stream" : file.ContentType);
                multipart.Add(content, "files", Path.GetFileName(file.FileName));
            }
            request.Content = multipart;
            return await SendAsync(request, cancellationToken);
        }
        finally
        {
            foreach (var stream in streams)
                await stream.DisposeAsync();
        }
    }

    private HttpRequestMessage CreateRequest(
        HttpMethod method, string path, ChatAppProxyContext context)
    {
        var baseUrl = (_configuration["Chatbot:BaseUrl"] ?? "http://localhost:8000").TrimEnd('/');
        var key = _configuration["Chatbot:InternalApiKey"];
        if (string.IsNullOrWhiteSpace(key))
            throw new InvalidOperationException("Chatbot:InternalApiKey chưa được cấu hình.");
        var request = new HttpRequestMessage(method, $"{baseUrl}{path}");
        request.Headers.TryAddWithoutValidation("X-Internal-Api-Key", key);
        request.Headers.TryAddWithoutValidation("X-User-Id", context.UserId.ToString());
        request.Headers.TryAddWithoutValidation("X-User-Role", context.Role);
        request.Headers.TryAddWithoutValidation("X-Building-Code", context.BuildingCode);
        return request;
    }

    private async Task<ChatAppProxyResponse> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromMinutes(5);
        using (request)
        using (var response = await client.SendAsync(
            request, HttpCompletionOption.ResponseHeadersRead, cancellationToken))
        {
            var body = await response.Content.ReadAsByteArrayAsync(cancellationToken);
            return new ChatAppProxyResponse(
                (int)response.StatusCode,
                response.Content.Headers.ContentType?.ToString() ?? "application/json",
                body);
        }
    }
}
