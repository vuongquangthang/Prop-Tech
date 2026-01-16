using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize]
public class AuditLogController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AuditLogController> _logger;

    public AuditLogController(
        IAuditLogService auditLogService,
        ILogger<AuditLogController> logger)
    {
        _auditLogService = auditLogService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy nhật ký kiểm toán của một thực thể
    /// </summary>
    [HttpGet("entity/{entityType}/{entityId:long}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<AuditLogDto>>> GetByEntity(
        [FromRoute] string entityType,
        [FromRoute] long entityId)
    {
        try
        {
            var logs = await _auditLogService.GetByEntityAsync(entityType, entityId);
            return Ok(logs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit logs for entity");
            return StatusCode(500, new { message = "Lỗi khi xử lý yêu cầu" });
        }
    }

    /// <summary>
    /// Lấy nhật ký kiểm toán của một người dùng
    /// </summary>
    [HttpGet("user/{userId:long}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<AuditLogDto>>> GetByUser(
        [FromRoute] long userId)
    {
        try
        {
            var logs = await _auditLogService.GetByUserAsync(userId);
            return Ok(logs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit logs for user");
            return StatusCode(500, new { message = "Lỗi khi xử lý yêu cầu" });
        }
    }

    /// <summary>
    /// Lọc nhật ký kiểm toán
    /// </summary>
    [HttpPost("filter")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<AuditLogDto>>> Filter([FromBody] AuditLogFilterDto filter)
    {
        try
        {
            var logs = await _auditLogService.FilterAsync(filter);
            return Ok(logs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error filtering audit logs");
            return StatusCode(500, new { message = "Lỗi khi xử lý yêu cầu" });
        }
    }
}
