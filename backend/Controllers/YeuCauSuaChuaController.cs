using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class YeuCauSuaChuaController : ControllerBase
{
    private readonly IYeuCauSuaChuaService _yeuCauService;

    public YeuCauSuaChuaController(IYeuCauSuaChuaService yeuCauService)
    {
        _yeuCauService = yeuCauService;
    }

    /// <summary>
    /// Lấy danh sách tất cả yêu cầu
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<List<YeuCauSuaChuaDto>>> GetAll()
    {
        try
        {
            var requests = await _yeuCauService.GetAllAsync();
            return Ok(requests);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách yêu cầu theo trạng thái
    /// </summary>
    [HttpGet("status/{status}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<List<YeuCauSuaChuaDto>>> GetByStatus(string status)
    {
        try
        {
            var requests = await _yeuCauService.GetByStatusAsync(status);
            return Ok(requests);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách yêu cầu theo phòng
    /// </summary>
    [HttpGet("room/{roomId}")]
    public async Task<ActionResult<List<YeuCauSuaChuaDto>>> GetByRoom(int roomId)
    {
        try
        {
            var requests = await _yeuCauService.GetByRoomIdAsync(roomId);
            return Ok(requests);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách yêu cầu của tôi
    /// </summary>
    [HttpGet("my-requests")]
    public async Task<ActionResult<List<YeuCauSuaChuaDto>>> GetMyRequests()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Không thể xác định người dùng" });
            }

            var requests = await _yeuCauService.GetByUserIdAsync(userId);
            return Ok(requests);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết yêu cầu theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<YeuCauSuaChuaDto>> GetById(int id)
    {
        try
        {
            var request = await _yeuCauService.GetByIdAsync(id);
            if (request == null)
            {
                return NotFound(new { message = "Yêu cầu không tồn tại" });
            }
            return Ok(request);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Tạo yêu cầu sửa chữa mới
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<YeuCauSuaChuaDto>> Create([FromBody] CreateYeuCauSuaChuaDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized(new { message = "Không thể xác định người dùng" });
            }

            var request = await _yeuCauService.CreateAsync(userId, dto);
            return CreatedAtAction(nameof(GetById), new { id = request.Id }, request);
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
    /// Cập nhật yêu cầu
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QuanLy,CuDan")]
    public async Task<ActionResult<YeuCauSuaChuaDto>> Update(int id, [FromBody] UpdateYeuCauSuaChuaDto dto)
    {
        try
        {
            // Verify ownership for residents
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == "CuDan")
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var existingRequest = await _yeuCauService.GetByIdAsync(id);
                if (existingRequest == null || existingRequest.UserId != userId)
                {
                    return Forbid();
                }
            }
            
            var request = await _yeuCauService.UpdateAsync(id, dto);
            return Ok(request);
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
    /// Đóng yêu cầu
    /// </summary>
    [HttpPost("{id}/close")]
    [Authorize(Roles = "Admin,QuanLy,CuDan")]
    public async Task<ActionResult<YeuCauSuaChuaDto>> Close(int id, [FromBody] CloseYeuCauSuaChuaDto dto)
    {
        try
        {
            // Verify ownership for residents
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var normalizedStatus = (dto.Status ?? string.Empty).Trim().ToLowerInvariant();

            // Only resident can mark request as completed/satisfied.
            if ((normalizedStatus == "đã đóng" || normalizedStatus == "da dong" || normalizedStatus == "dadong" || normalizedStatus == "closed")
                && userRole != "CuDan")
            {
                return BadRequest(new { message = "Chỉ cư dân mới có thể xác nhận hài lòng để đóng sự cố." });
            }

            // Close endpoint only accepts resident feedback statuses.
            if (normalizedStatus != "đã đóng" && normalizedStatus != "da dong" && normalizedStatus != "dadong" && normalizedStatus != "closed"
                && normalizedStatus != "chờ xử lý" && normalizedStatus != "cho xu ly" && normalizedStatus != "choxuly" && normalizedStatus != "pending")
            {
                return BadRequest(new { message = "Phản hồi nghiệm thu chỉ chấp nhận trạng thái 'Đã đóng' hoặc 'Chờ xử lý'." });
            }

            if (userRole == "CuDan")
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                var existingRequest = await _yeuCauService.GetByIdAsync(id);
                if (existingRequest == null || existingRequest.UserId != userId)
                {
                    return Forbid();
                }
            }
            
            var request = await _yeuCauService.CloseAsync(id, dto);
            return Ok(request);
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
    /// Xóa yêu cầu
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _yeuCauService.DeleteAsync(id);
            return Ok(new { message = "Xóa yêu cầu thành công" });
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
}
