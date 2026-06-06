using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/internal/posts")]
[AllowAnonymous]
public class InternalPostStatsController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly IConfiguration _configuration;

    public InternalPostStatsController(IPostService postService, IConfiguration configuration)
    {
        _postService = postService;
        _configuration = configuration;
    }

    [HttpPost("{id:int}/views")]
    public async Task<ActionResult<PostDto>> RecordView(int id)
    {
        if (!IsValidInternalKey())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Invalid internal API key" });
        }

        try
        {
            return Ok(await _postService.RecordViewAsync(id));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/message-count")]
    public async Task<ActionResult<PostDto>> SyncMessageCount(int id, [FromBody] UpdatePostMessageCountDto dto)
    {
        if (!IsValidInternalKey())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Invalid internal API key" });
        }

        try
        {
            return Ok(await _postService.SyncMessageCountAsync(id, dto.Messages));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    private bool IsValidInternalKey()
    {
        var configured = _configuration["InternalApiKey"] ?? "dev-internal-key";
        return Request.Headers.TryGetValue("X-Internal-Api-Key", out var apiKey)
            && apiKey == configured;
    }
}
