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
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<List<AuditLogDto>>> GetRecent([FromQuery] int limit = 500)
    {
        try
        {
            var logs = await _service.GetRecentAsync(User.GetOwnerUserId(), limit);
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

            var logs = await _service.GetByUserIdAsync(userId, User.GetOwnerUserId(), limit);
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
            var logs = await _service.GetByEntityAsync(entityType, User.GetOwnerUserId(), entityId, limit);
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
    [HttpGet("action/{actionName}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<AuditLogDto>>> GetByAction(string actionName, [FromQuery] int limit = 100)
    {
        try
        {
            var logs = await _service.GetByActionAsync(actionName, User.GetOwnerUserId(), limit);
            return Ok(logs);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }
}
