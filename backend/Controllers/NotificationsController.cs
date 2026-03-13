using System.Security.Claims;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service)
    {
        _service = service;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── Resident ────────────────────────────────────────────────────────────

    /// <summary>GET /api/Notifications/my-notifications</summary>
    [HttpGet("my-notifications")]
    public async Task<IActionResult> GetMy([FromQuery] bool unreadOnly = false)
    {
        var items = await _service.GetMyNotificationsAsync(GetUserId(), unreadOnly);
        return Ok(items);
    }

    /// <summary>GET /api/Notifications/unread-count</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _service.GetUnreadCountAsync(GetUserId());
        if (User.IsInRole("Admin") || User.IsInRole("QuanLy") || User.IsInRole("KeToan"))
        {
            count += await _service.GetAdminUnreadCountAsync();
        }
        return Ok(new { count });
    }

    /// <summary>POST /api/Notifications/{id}/read</summary>
    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var canManageAdmin = User.IsInRole("Admin") || User.IsInRole("QuanLy") || User.IsInRole("KeToan");
        await _service.MarkAsReadAsync(id, GetUserId(), canManageAdmin);
        return NoContent();
    }

    /// <summary>POST /api/Notifications/mark-all-read</summary>
    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var includeAdmin = User.IsInRole("Admin") || User.IsInRole("QuanLy") || User.IsInRole("KeToan");
        await _service.MarkAllAsReadAsync(GetUserId(), includeAdmin);
        return NoContent();
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    /// <summary>GET /api/Notifications/admin/all</summary>
    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<IActionResult> GetAllRecent([FromQuery] int limit = 200)
    {
        var items = await _service.GetAllRecentAsync(limit);
        return Ok(items);
    }

    /// <summary>POST /api/Notifications/send — send to a single user</summary>
    [HttpPost("send")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<IActionResult> Send([FromBody] CreateNotificationDto dto)
    {
        var result = await _service.CreateNotificationAsync(GetUserId(), dto);
        return Ok(result);
    }

    /// <summary>POST /api/Notifications/broadcast — send to all</summary>
    [HttpPost("broadcast")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<IActionResult> Broadcast([FromBody] BroadcastRequestDto dto)
    {
        await _service.BroadcastAsync(GetUserId(), dto.Title, dto.Content, dto.NotificationType);
        return NoContent();
    }
}

public class BroadcastRequestDto
{
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string NotificationType { get; set; } = "ANNOUNCEMENT";
}
