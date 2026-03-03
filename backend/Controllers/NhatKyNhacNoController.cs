using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NhatKyNhacNoController : ControllerBase
{
    private readonly INhatKyNhacNoService _service;

    public NhatKyNhacNoController(INhatKyNhacNoService service)
    {
        _service = service;
    }

    /// <summary>
    /// Lấy lịch sử nhắc nợ theo hóa đơn (Admin/QuanLy/KeToan)
    /// </summary>
    [HttpGet("invoice/{invoiceId}")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<List<NhatKyNhacNoDto>>> GetByInvoice(int invoiceId)
    {
        try
        {
            var reminders = await _service.GetByInvoiceIdAsync(invoiceId);
            return Ok(reminders);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy lịch sử nhắc nợ của người dùng hiện tại
    /// </summary>
    [HttpGet("my-reminders")]
    public async Task<ActionResult<List<NhatKyNhacNoDto>>> GetMyReminders()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Không xác định được người dùng" });
            }

            var reminders = await _service.GetByUserIdAsync(userId);
            return Ok(reminders);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy lịch sử nhắc nợ theo trạng thái (Admin/QuanLy only)
    /// </summary>
    [HttpGet("status/{status}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<List<NhatKyNhacNoDto>>> GetByStatus(string status)
    {
        try
        {
            var reminders = await _service.GetByStatusAsync(status);
            return Ok(reminders);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết nhật ký nhắc nợ
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<NhatKyNhacNoDto>> GetById(long id)
    {
        try
        {
            var reminder = await _service.GetByIdAsync(id);
            if (reminder == null)
            {
                return NotFound(new { message = "Không tìm thấy nhật ký nhắc nợ" });
            }

            // Check authorization - user can only view their own reminders
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            
            if (role != "Admin" && role != "QuanLy" && role != "KeToan")
            {
                if (string.IsNullOrEmpty(userIdClaim) || 
                    !int.TryParse(userIdClaim, out int userId) || 
                    userId != reminder.SentToUserId)
                {
                    return Forbid();
                }
            }

            return Ok(reminder);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Tạo nhật ký nhắc nợ mới (Admin/QuanLy only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<NhatKyNhacNoDto>> Create([FromBody] CreateNhatKyNhacNoDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? sentByUserId = null;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
            {
                sentByUserId = userId;
            }

            var reminder = await _service.CreateReminderAsync(dto, sentByUserId);
            return CreatedAtAction(nameof(GetById), new { id = reminder.Id }, reminder);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật trạng thái gửi nhắc nợ (Admin/QuanLy only)
    /// </summary>
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<NhatKyNhacNoDto>> UpdateStatus(long id, [FromBody] UpdateNhatKyNhacNoStatusDto dto)
    {
        try
        {
            var reminder = await _service.UpdateStatusAsync(id, dto);
            return Ok(reminder);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }
}
