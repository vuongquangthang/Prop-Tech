using System.Security.Claims;
using System.Text.Json;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Authorize]
public sealed class ChatAppProxyController : ControllerBase
{
    private readonly IChatAppProxyService _proxy;
    public ChatAppProxyController(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
        => _proxy = new ChatAppProxyService(httpClientFactory, configuration);

    [HttpPost("/api/v1/chat")]
    public async Task<IActionResult> Chat([FromBody] JsonElement body, CancellationToken ct)
    {
        var context = await ResolveContext(ct);
        var question = body.TryGetProperty("question", out var questionElement)
            ? questionElement.GetString()?.Trim() : null;
        if (string.IsNullOrWhiteSpace(question))
            return BadRequest(new { message = "Câu hỏi không được để trống." });
        string? conversationId = body.TryGetProperty("conversation_id", out var conversation)
            && conversation.ValueKind == JsonValueKind.String
            ? conversation.GetString() : null;
        var json = JsonSerializer.Serialize(new
        {
            conversation_id = conversationId,
            building_code = context.BuildingCode,
            question
        });
        var result = await _proxy.SendJsonAsync(
            HttpMethod.Post, "/api/v1/chat", context, json, ct);
        return ProxyResult(result);
    }

    [HttpGet("/api/conversations")]
    public Task<IActionResult> Conversations(
        [FromQuery] int page = 1, [FromQuery] int page_size = 20,
        CancellationToken ct = default)
        => ForwardJson(HttpMethod.Get,
            $"/api/conversations?page={page}&page_size={page_size}", null, ct);

    [HttpGet("/api/conversations/{id}/messages")]
    public Task<IActionResult> Messages(
        string id, [FromQuery] int page = 1, [FromQuery] int page_size = 50,
        CancellationToken ct = default)
        => ForwardJson(HttpMethod.Get,
            $"/api/conversations/{Uri.EscapeDataString(id)}/messages?page={page}&page_size={page_size}",
            null, ct);

    [HttpDelete("/api/conversations/{id}")]
    public Task<IActionResult> DeleteConversation(string id, CancellationToken ct)
        => ForwardJson(HttpMethod.Delete,
            $"/api/conversations/{Uri.EscapeDataString(id)}", null, ct);

    [HttpPost("/api/documents")]
    [Authorize(Roles = "Admin,QuanLy,Manager")]
    [RequestSizeLimit(55 * 1024 * 1024)]
    public async Task<IActionResult> UploadDocuments(
        [FromForm] List<IFormFile> files,
        [FromForm] string? category,
        [FromForm] string? title,
        CancellationToken ct)
    {
        if (files.Count is < 1 or > 5)
            return BadRequest(new { message = "Chỉ được upload từ 1 đến 5 file." });
        var context = await ResolveContext(ct);
        var result = await _proxy.SendMultipartAsync(
            "/api/documents", context, files, context.BuildingCode, category, title, ct);
        return ProxyResult(result);
    }

    [HttpGet("/api/documents")]
    public async Task<IActionResult> Documents(
        [FromQuery] int page = 1, [FromQuery] int page_size = 20,
        CancellationToken ct = default)
    {
        var context = await ResolveContext(ct);
        var result = await _proxy.SendJsonAsync(
            HttpMethod.Get,
            $"/api/documents?page={page}&page_size={page_size}&building_code={context.BuildingCode}",
            context, null, ct);
        return ProxyResult(result);
    }

    [HttpGet("/api/documents/{id}")]
    public Task<IActionResult> Document(string id, CancellationToken ct)
        => ForwardJson(HttpMethod.Get, $"/api/documents/{Uri.EscapeDataString(id)}", null, ct);

    [HttpGet("/api/documents/{id}/file")]
    public async Task<IActionResult> DownloadDocumentFile(string id, CancellationToken ct)
    {
        var context = await ResolveContext(ct);
        var result = await _proxy.SendJsonAsync(
            HttpMethod.Get, $"/api/documents/{Uri.EscapeDataString(id)}/file", context, null, ct);
        if (result.StatusCode >= 400)
        {
            return StatusCode(result.StatusCode, System.Text.Encoding.UTF8.GetString(result.Body));
        }
        // File(), không phải ContentResult: giữ nguyên byte gốc (PDF/DOCX...),
        // tránh bị hỏng do ContentResult ép chuyển qua chuỗi UTF-8.
        return File(result.Body, result.ContentType);
    }

    [HttpPost("/api/documents/{id}/reindex")]
    [Authorize(Roles = "Admin,QuanLy,Manager")]
    public Task<IActionResult> Reindex(string id, CancellationToken ct)
        => ForwardJson(HttpMethod.Post,
            $"/api/documents/{Uri.EscapeDataString(id)}/reindex", "{}", ct);

    [HttpDelete("/api/documents/{id}")]
    [Authorize(Roles = "Admin,QuanLy,Manager")]
    public Task<IActionResult> DeleteDocument(string id, CancellationToken ct)
        => ForwardJson(HttpMethod.Delete, $"/api/documents/{Uri.EscapeDataString(id)}", null, ct);

    private async Task<IActionResult> ForwardJson(
        HttpMethod method, string path, string? json, CancellationToken ct)
    {
        try
        {
            var context = await ResolveContext(ct);
            var result = await _proxy.SendJsonAsync(method, path, context, json, ct);
            return ProxyResult(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private async Task<ChatAppProxyContext> ResolveContext(CancellationToken ct)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "CuDan";
        return await _proxy.ResolveContextAsync(
            User.GetAuthenticatedUserId(), role, User.GetOwnerUserId(), ct);
    }

    private static IActionResult ProxyResult(ChatAppProxyResponse result)
        => new ContentResult
        {
            StatusCode = result.StatusCode,
            ContentType = result.ContentType,
            Content = System.Text.Encoding.UTF8.GetString(result.Body)
        };
}
