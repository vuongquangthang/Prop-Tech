using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace backend.Services;

public interface IChatbotIngestService
{
    Task<ChatbotIngestTriggerResult> RebuildAsync(int? buildingId = null, CancellationToken cancellationToken = default);
    Task<ChatbotIngestTriggerResult> IngestDocumentAsync(
        IFormFile file,
        int ownerUserId,
        int uploadedByUserId,
        string? category = null,
        string? title = null,
        CancellationToken cancellationToken = default);
}

public sealed class ChatbotIngestTriggerResult
{
    public bool Triggered { get; init; }
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
    public int? Documents { get; init; }
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
        int uploadedByUserId,
        string? category = null,
        string? title = null,
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

            await using var stream = file.OpenReadStream();
            using var fileContent = new StreamContent(stream);
            if (!string.IsNullOrWhiteSpace(file.ContentType))
            {
                fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
            }

            using var form = new MultipartFormDataContent
            {
                { fileContent, "file", file.FileName },
                { new StringContent(ownerUserId.ToString()), "owner_user_id" },
                { new StringContent(uploadedByUserId.ToString()), "uploaded_by" }
            };

            if (!string.IsNullOrWhiteSpace(category))
            {
                form.Add(new StringContent(category), "category");
            }

            if (!string.IsNullOrWhiteSpace(title))
            {
                form.Add(new StringContent(title), "title");
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/api/internal/ingest/document");
            request.Headers.TryAddWithoutValidation("X-Internal-Api-Key", internalApiKey);
            request.Content = form;

            using var response = await client.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Chatbot document ingest returned non-success status. status={StatusCode}, body={Body}",
                    (int)response.StatusCode,
                    body);

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
                Success = true,
                Message = "Chatbot document ingest completed.",
                Documents = TryReadDocumentsCount(body)
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
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("result", out var result)
                && result.TryGetProperty("documents", out var documents)
                && documents.TryGetInt32(out var value))
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
}
