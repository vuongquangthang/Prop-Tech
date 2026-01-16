using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(INotificationService notificationService, ILogger<NotificationsController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<List<NotificationDto>>> GetMyNotifications([FromQuery] bool? isRead = null)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var notifications = await _notificationService.GetByRecipientAsync(userId, isRead);
            return Ok(notifications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách thông báo" });
        }
    }

    [HttpGet("my/unread-count")]
    [Authorize]
    public async Task<ActionResult<object>> GetUnreadCount()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var count = await _notificationService.GetUnreadCountAsync(userId);
            return Ok(new { count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count");
            return StatusCode(500, new { message = "Lỗi khi lấy số thông báo chưa đọc" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<NotificationDto>> Create([FromBody] CreateNotificationDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var notification = await _notificationService.CreateAsync(dto, userId);
            return Ok(notification);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification");
            return StatusCode(500, new { message = "Lỗi khi tạo thông báo" });
        }
    }

    [HttpPost("broadcast")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<object>> Broadcast([FromBody] BroadcastNotificationDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var count = await _notificationService.BroadcastAsync(dto, userId);
            return Ok(new { message = $"Đã gửi thông báo đến {count} người", count });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting notification");
            return StatusCode(500, new { message = "Lỗi khi phát thông báo" });
        }
    }

    [HttpPut("{id}/read")]
    [Authorize]
    public async Task<ActionResult> MarkAsRead(long id)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            await _notificationService.MarkAsReadAsync(id, userId);
            return Ok(new { message = "Đã đánh dấu đã đọc" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification as read");
            return StatusCode(500, new { message = "Lỗi khi đánh dấu đã đọc" });
        }
    }

    [HttpPut("read-all")]
    [Authorize]
    public async Task<ActionResult> MarkAllAsRead()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            await _notificationService.MarkAllAsReadAsync(userId);
            return Ok(new { message = "Đã đánh dấu tất cả đã đọc" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read");
            return StatusCode(500, new { message = "Lỗi khi đánh dấu tất cả đã đọc" });
        }
    }
}
