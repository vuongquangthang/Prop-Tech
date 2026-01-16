using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ComplaintsController : ControllerBase
{
    private readonly IComplaintService _complaintService;
    private readonly ILogger<ComplaintsController> _logger;

    public ComplaintsController(IComplaintService complaintService, ILogger<ComplaintsController> logger)
    {
        _complaintService = complaintService;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<ComplaintDto>>> GetAll([FromQuery] string? status = null)
    {
        try
        {
            var complaints = status != null
                ? await _complaintService.GetByStatusAsync(status)
                : await _complaintService.GetAllAsync();
            return Ok(complaints);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting complaints");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách khiếu nại" });
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<ComplaintDetailDto>> GetById(long id)
    {
        try
        {
            var complaint = await _complaintService.GetDetailAsync(id);
            if (complaint == null)
                return NotFound(new { message = "Không tìm thấy khiếu nại" });

            return Ok(complaint);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting complaint {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy khiếu nại" });
        }
    }

    [HttpGet("room/{roomId}")]
    [Authorize]
    public async Task<ActionResult<List<ComplaintDto>>> GetByRoom(long roomId)
    {
        try
        {
            var complaints = await _complaintService.GetByRoomAsync(roomId);
            return Ok(complaints);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting complaints for room {RoomId}", roomId);
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách khiếu nại" });
        }
    }

    [HttpGet("assigned-to-me")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<ComplaintDto>>> GetAssignedToMe()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var complaints = await _complaintService.GetByAssignedToAsync(userId);
            return Ok(complaints);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting assigned complaints");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách khiếu nại" });
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ComplaintDto>> Create([FromBody] CreateComplaintDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var complaint = await _complaintService.CreateAsync(dto, userId);
            return Ok(complaint);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating complaint");
            return StatusCode(500, new { message = "Lỗi khi tạo khiếu nại" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<ComplaintDto>> Update(long id, [FromBody] UpdateComplaintDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var complaint = await _complaintService.UpdateAsync(id, dto, userId);
            return Ok(complaint);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating complaint {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi cập nhật khiếu nại" });
        }
    }

    [HttpPost("{id}/responses")]
    [Authorize]
    public async Task<ActionResult<ComplaintDetailDto>> AddResponse(long id, [FromBody] AddComplaintResponseDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var complaint = await _complaintService.AddResponseAsync(id, dto, userId);
            return Ok(complaint);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding response to complaint {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi thêm phản hồi" });
        }
    }
}
