using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChiTietSuDungDichVuController : ControllerBase
{
    private readonly IChiTietSuDungDichVuService _chiTietService;

    public ChiTietSuDungDichVuController(IChiTietSuDungDichVuService chiTietService)
    {
        _chiTietService = chiTietService;
    }

    /// <summary>
    /// Lấy danh sách tất cả chi tiết sử dụng dịch vụ
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<List<ChiTietSuDungDichVuDto>>> GetAll()
    {
        try
        {
            var usages = await _chiTietService.GetAllAsync(User.GetOwnerUserId());
            return Ok(usages);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách chi tiết sử dụng dịch vụ đang hoạt động
    /// </summary>
    [HttpGet("active")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<List<ChiTietSuDungDichVuDto>>> GetActive()
    {
        try
        {
            var usages = await _chiTietService.GetActiveUsagesAsync(User.GetOwnerUserId());
            return Ok(usages);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách chi tiết theo cư dân
    /// </summary>
    [HttpGet("resident/{residentId}")]
    public async Task<ActionResult<List<ChiTietSuDungDichVuDto>>> GetByResident(int residentId)
    {
        try
        {
            var usages = User.IsInRole("CuDan")
                ? await _chiTietService.GetByResidentIdAsync(residentId)
                : await _chiTietService.GetByResidentIdAsync(residentId, User.GetOwnerUserId());
            return Ok(usages);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách chi tiết theo phòng
    /// </summary>
    [HttpGet("room/{roomId}")]
    public async Task<ActionResult<List<ChiTietSuDungDichVuDto>>> GetByRoom(int roomId)
    {
        try
        {
            var usages = User.IsInRole("CuDan")
                ? await _chiTietService.GetByRoomIdAsync(roomId)
                : await _chiTietService.GetByRoomIdAsync(roomId, User.GetOwnerUserId());
            return Ok(usages);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách chi tiết theo dịch vụ
    /// </summary>
    [HttpGet("service/{serviceId}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<List<ChiTietSuDungDichVuDto>>> GetByService(int serviceId)
    {
        try
        {
            var usages = await _chiTietService.GetByServiceIdAsync(serviceId, User.GetOwnerUserId());
            return Ok(usages);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ChiTietSuDungDichVuDto>> GetById(long id)
    {
        try
        {
            var usage = User.IsInRole("CuDan")
                ? await _chiTietService.GetByIdAsync(id)
                : await _chiTietService.GetByIdAsync(id, User.GetOwnerUserId());
            if (usage == null)
            {
                return NotFound(new { message = "Chi tiết sử dụng dịch vụ không tồn tại" });
            }
            return Ok(usage);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Tạo chi tiết sử dụng dịch vụ mới
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<ChiTietSuDungDichVuDto>> Create([FromBody] CreateChiTietSuDungDichVuDto dto)
    {
        try
        {
            var usage = await _chiTietService.CreateAsync(dto, User.GetOwnerUserId());
            return CreatedAtAction(nameof(GetById), new { id = usage.Id }, usage);
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
    /// Cập nhật chi tiết sử dụng dịch vụ
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<ChiTietSuDungDichVuDto>> Update(long id, [FromBody] UpdateChiTietSuDungDichVuDto dto)
    {
        try
        {
            var usage = await _chiTietService.UpdateAsync(id, dto, User.GetOwnerUserId());
            return Ok(usage);
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
    /// Kết thúc sử dụng dịch vụ
    /// </summary>
    [HttpPost("{id}/end")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<IActionResult> End(long id, [FromBody] EndChiTietSuDungDichVuDto dto)
    {
        try
        {
            await _chiTietService.EndUsageAsync(id, dto, User.GetOwnerUserId());
            return Ok(new { message = "Kết thúc sử dụng dịch vụ thành công" });
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
    /// Xóa chi tiết sử dụng dịch vụ
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(long id)
    {
        try
        {
            await _chiTietService.DeleteAsync(id, User.GetOwnerUserId());
            return Ok(new { message = "Xóa chi tiết sử dụng dịch vụ thành công" });
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
