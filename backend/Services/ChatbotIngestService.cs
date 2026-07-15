using System.Text;
using System.Text.Json;

namespace backend.Services;

public interface IChatbotIngestService
{
    Task<ChatbotIngestTriggerResult> RebuildAsync(int? buildingId = null, CancellationToken cancellationToken = default);
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
