using System.Text;
using System.Text.Json;

namespace backend.Services;

public interface IChatbotIngestService
{
    Task<ChatbotIngestTriggerResult> RebuildAsync(int? buildingId = null, CancellationToken cancellationToken = default);
    Task<ChatbotIngestTriggerResult> IngestDocumentAsync(
        IFormFile file, int ownerUserId, int uploadedBy, string? category,
        CancellationToken cancellationToken = default);
}

public sealed class ChatbotIngestTriggerResult
{
    public bool Triggered { get; init; }
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public int? Documents { get; init; }
    public int? Chunks { get; init; }
}

public class ChatbotIngestService : IChatbotIngestService
{
    private const string DefaultChatbotBaseUrl = "http://localhost:8000";
    private const string DefaultInternalApiKey = "dev-internal-key";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ChatbotIngestService> _logger;

    public ChatbotIngestService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<ChatbotIngestService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<ChatbotIngestTriggerResult> RebuildAsync(
        int? buildingId = null,
        CancellationToken cancellationToken = default)
    {
        var enabled = _configuration.GetValue("Chatbot:AutoIngestOnKnowledgeUpload", true);
        if (!enabled)
        {
            return new ChatbotIngestTriggerResult
            {
                Triggered = false,
                Success = false,
                Message = "Auto ingest is disabled."
            };
        }

        var baseUrl = (_configuration["Chatbot:BaseUrl"] ?? DefaultChatbotBaseUrl).TrimEnd('/');
        var internalApiKey = _configuration["Chatbot:InternalApiKey"]
            ?? _configuration["InternalApiKey"]
            ?? DefaultInternalApiKey;

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromMinutes(5);

            var payload = JsonSerializer.Serialize(new
            {
                rebuild = true,
                building_id = buildingId
            });

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/api/internal/ingest/rebuild");
            request.Headers.TryAddWithoutValidation("X-Internal-Api-Key", internalApiKey);
            request.Content = new StringContent(payload, Encoding.UTF8, "application/json");

            using var response = await client.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Chatbot ingest returned non-success status. status={StatusCode}, body={Body}",
                    (int)response.StatusCode,
                    body);

                return new ChatbotIngestTriggerResult
                {
                    Triggered = true,
                    Success = false,
                    Message = $"Chatbot ingest failed with status {(int)response.StatusCode}."
                };
            }

            return new ChatbotIngestTriggerResult
            {
                Triggered = true,
                Success = true,
                Message = "Chatbot ingest completed.",
                Documents = TryReadDocumentsCount(body)
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Chatbot ingest call failed. url={Url}", baseUrl);

            return new ChatbotIngestTriggerResult
            {
                Triggered = true,
                Success = false,
                Message = ex.Message
            };
        }
    }

    public async Task<ChatbotIngestTriggerResult> IngestDocumentAsync(
        IFormFile file,
        int ownerUserId,
        int uploadedBy,
        string? category,
        CancellationToken cancellationToken = default)
    {
        var enabled = _configuration.GetValue("Chatbot:AutoIngestOnKnowledgeUpload", true);
        if (!enabled)
        {
            return new ChatbotIngestTriggerResult
            {
                Triggered = false,
                Success = false,
                Message = "Auto ingest is disabled."
            };
        }

        var baseUrl = (_configuration["Chatbot:BaseUrl"] ?? DefaultChatbotBaseUrl).TrimEnd('/');
        var internalApiKey = _configuration["Chatbot:InternalApiKey"]
            ?? _configuration["InternalApiKey"]
            ?? DefaultInternalApiKey;

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromMinutes(5);

            using var request = new HttpRequestMessage(
                HttpMethod.Post, $"{baseUrl}/api/internal/ingest/document");
            request.Headers.TryAddWithoutValidation("X-Internal-Api-Key", internalApiKey);

            await using var stream = file.OpenReadStream();
            using var multipart = new MultipartFormDataContent();
            using var fileContent = new StreamContent(stream);
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(
                string.IsNullOrWhiteSpace(file.ContentType)
                    ? "application/octet-stream"
                    : file.ContentType);
            multipart.Add(fileContent, "file", Path.GetFileName(file.FileName));
            multipart.Add(new StringContent(ownerUserId.ToString()), "owner_user_id");
            multipart.Add(new StringContent(uploadedBy.ToString()), "uploaded_by");
            if (!string.IsNullOrWhiteSpace(category))
                multipart.Add(new StringContent(category), "category");
            multipart.Add(
                new StringContent(Path.GetFileNameWithoutExtension(file.FileName)),
                "title");
            request.Content = multipart;

            using var response = await client.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Document ingest returned non-success status. status={StatusCode}, body={Body}",
                    (int)response.StatusCode, body);
                return new ChatbotIngestTriggerResult
                {
                    Triggered = true,
                    Success = false,
                    Message = $"Chatbot document ingest failed with status {(int)response.StatusCode}."
                };
            }

            return new ChatbotIngestTriggerResult
            {
                Triggered = true,
                Success = TryReadSuccess(body),
                Message = TryReadSuccess(body)
                    ? "Document was converted to vectors and stored in ChromaDB."
                    : "Document was only partially ingested.",
                Documents = TryReadDocumentsCount(body),
                Chunks = TryReadResultCount(body, "chunks")
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Chatbot document ingest call failed. url={Url}", baseUrl);
            return new ChatbotIngestTriggerResult
            {
                Triggered = true,
                Success = false,
                Message = ex.Message
            };
        }
    }

    private static int? TryReadDocumentsCount(string body)
        => TryReadResultCount(body, "documents");

    private static int? TryReadResultCount(string body, string propertyName)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("result", out var result)
                && result.TryGetProperty(propertyName, out var count)
                && count.TryGetInt32(out var value))
            {
                return value;
            }
        }
        catch
        {
            return null;
        }

        return null;
    }

    private static bool TryReadSuccess(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            return doc.RootElement.TryGetProperty("success", out var success)
                && success.ValueKind == JsonValueKind.True;
        }
        catch
        {
            return false;
        }
    }
}
