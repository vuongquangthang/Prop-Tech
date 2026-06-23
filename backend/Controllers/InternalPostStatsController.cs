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
    private readonly INotificationService _notificationService;
    private readonly IConfiguration _configuration;

    public InternalPostStatsController(
        IPostService postService,
        INotificationService notificationService,
        IConfiguration configuration)
    {
        _postService = postService;
        _notificationService = notificationService;
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

    [HttpPost("{id:int}/publish")]
    public async Task<ActionResult<PostDto>> Publish(int id)
    {
        if (!IsValidInternalKey())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Invalid internal API key" });
        }

        try
        {
            return Ok(await _postService.PublishAsync(id));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // Admin TroUyTin xoa bai -> gui thong bao cho chu bai (nguoi tao post tren Prop-Tech).
    [HttpPost("{id:int}/moderation-delete-notice")]
    public async Task<IActionResult> SendModerationDeleteNotice(int id, [FromBody] ModerationDeleteNoticeDto dto)
    {
        if (!IsValidInternalKey())
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Invalid internal API key" });
        }

        var reason = (dto?.Reason ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(reason))
        {
            return BadRequest(new { message = "Thiếu lý do xóa" });
        }

        var post = await _postService.GetByIdAsync(id);
        if (post == null)
        {
            return NotFound(new { message = "Bài đăng không tồn tại" });
        }
        if (post.CreatedByUserId == null)
        {
            // Bai khong gan nguoi tao (vd nhap lieu cu) -> khong the gui, bao ro cho TroUyTin.
            return Conflict(new { message = "Bài đăng không có người tạo để gửi thông báo" });
        }

        var title = string.IsNullOrWhiteSpace(dto?.ListingTitle) ? "Bài đăng của bạn" : dto!.ListingTitle!.Trim();
        var content = $"Bài đăng \"{title}\" đã bị admin TroUyTin xóa. Lý do: {reason}. Bạn hãy chỉnh sửa lại bài đăng để gửi duyệt lại nhé.";
        // Gui cho ca cu dan dang bai (USER) lan chu nha/BQL quan ly (ADMIN scope).
        await _notificationService.SendPostDeleteNoticeAsync(post.CreatedByUserId.Value, "Bài đăng của bạn đã bị xóa", content, "SYSTEM");

        return Ok(new { message = "Đã gửi thông báo", recipientUserId = post.CreatedByUserId.Value });
    }

    private bool IsValidInternalKey()
    {
        var configured = _configuration["InternalApiKey"] ?? "dev-internal-key";
        return Request.Headers.TryGetValue("X-Internal-Api-Key", out var apiKey)
            && apiKey == configured;
    }
}
