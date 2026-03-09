using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _service;

    public AuditLogsController(IAuditLogService service)
    {
        _service = service;
    }

    /// <summary>
    /// Lấy nhật ký hoạt động gần đây (Admin only)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<AuditLogDto>>> GetRecent([FromQuery] int limit = 500)
    {
        try
        {
            var logs = await _service.GetRecentAsync(limit);
            return Ok(logs);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy nhật ký theo người dùng (Admin/QuanLy or own user)
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<List<AuditLogDto>>> GetByUser(int userId, [FromQuery] int limit = 100)
    {
        try
        {
            // Check authorization - user can only view their own logs unless Admin/QuanLy
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (role != "Admin" && role != "QuanLy")
            {
                if (string.IsNullOrEmpty(userIdClaim) || 
                    !int.TryParse(userIdClaim, out int currentUserId) || 
                    currentUserId != userId)
                {
                    return Forbid();
                }
            }

            var logs = await _service.GetByUserIdAsync(userId, limit);
            return Ok(logs);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy nhật ký theo loại thực thể (Admin only)
    /// </summary>
    [HttpGet("entity/{entityType}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<AuditLogDto>>> GetByEntity(
        string entityType, 
        [FromQuery] int? entityId = null, 
        [FromQuery] int limit = 100)
    {
        try
        {
            var logs = await _service.GetByEntityAsync(entityType, entityId, limit);
            return Ok(logs);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy nhật ký theo hành động (Admin only)
    /// </summary>
    [HttpGet("action/{action}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<AuditLogDto>>> GetByAction(string action, [FromQuery] int limit = 100)
    {
        try
        {
            var logs = await _service.GetByActionAsync(action, limit);
            return Ok(logs);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }
}

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

    /// <summary>
    /// Lấy thông báo của người dùng hiện tại
    /// </summary>
    [HttpGet("my-notifications")]
    public async Task<ActionResult<List<NotificationDto>>> GetMyNotifications([FromQuery] bool unreadOnly = false)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Không xác định được người dùng" });
            }

            var notifications = await _service.GetByRecipientIdAsync(userId, unreadOnly);
            return Ok(notifications);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết thông báo
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<NotificationDto>> GetById(int id)
    {
        try
        {
            var notification = await _service.GetByIdAsync(id);
            if (notification == null)
            {
                return NotFound(new { message = "Không tìm thấy thông báo" });
            }

            // Check authorization - user can only view their own notifications
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (role != "Admin" && role != "QuanLy")
            {
                if (string.IsNullOrEmpty(userIdClaim) || 
                    !int.TryParse(userIdClaim, out int userId) || 
                    userId != notification.RecipientId)
                {
                    return Forbid();
                }
            }

            return Ok(notification);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Đánh dấu thông báo đã đọc
    /// </summary>
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        try
        {
            var notification = await _service.GetByIdAsync(id);
            if (notification == null)
            {
                return NotFound(new { message = "Không tìm thấy thông báo" });
            }

            // Check authorization
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || 
                !int.TryParse(userIdClaim, out int userId) || 
                userId != notification.RecipientId)
            {
                return Forbid();
            }

            await _service.MarkAsReadAsync(id);
            return Ok(new { message = "Đã đánh dấu thông báo đã đọc" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Đánh dấu tất cả thông báo đã đọc
    /// </summary>
    [HttpPut("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Không xác định được người dùng" });
            }

            await _service.MarkAllAsReadAsync(userId);
            return Ok(new { message = "Đã đánh dấu tất cả thông báo đã đọc" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }
}
