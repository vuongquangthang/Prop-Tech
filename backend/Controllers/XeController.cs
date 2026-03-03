using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class XeController : ControllerBase
{
    private readonly IXeService _xeService;

    public XeController(IXeService xeService)
    {
        _xeService = xeService;
    }

    /// <summary>
    /// Lấy danh sách tất cả xe
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<List<XeDto>>> GetAll()
    {
        try
        {
            var vehicles = await _xeService.GetAllAsync();
            return Ok(vehicles);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách xe đang hoạt động
    /// </summary>
    [HttpGet("active")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<List<XeDto>>> GetActive()
    {
        try
        {
            var vehicles = await _xeService.GetActiveVehiclesAsync();
            return Ok(vehicles);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách xe theo cư dân
    /// </summary>
    [HttpGet("resident/{residentId}")]
    public async Task<ActionResult<List<XeDto>>> GetByResident(int residentId)
    {
        try
        {
            var vehicles = await _xeService.GetByResidentIdAsync(residentId);
            return Ok(vehicles);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết xe theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<XeDto>> GetById(int id)
    {
        try
        {
            var vehicle = await _xeService.GetByIdAsync(id);
            if (vehicle == null)
            {
                return NotFound(new { message = "Xe không tồn tại" });
            }
            return Ok(vehicle);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Đăng ký xe mới
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<XeDto>> Create([FromBody] CreateXeDto dto)
    {
        try
        {
            var vehicle = await _xeService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = vehicle.Id }, vehicle);
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
    /// Cập nhật xe
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<XeDto>> Update(int id, [FromBody] UpdateXeDto dto)
    {
        try
        {
            var vehicle = await _xeService.UpdateAsync(id, dto);
            return Ok(vehicle);
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
    /// Hủy đăng ký xe
    /// </summary>
    [HttpPost("{id}/cancel")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<IActionResult> Cancel(int id, [FromBody] CancelXeDto dto)
    {
        try
        {
            await _xeService.CancelAsync(id, dto);
            return Ok(new { message = "Hủy đăng ký xe thành công" });
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
    /// Xóa xe
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _xeService.DeleteAsync(id);
            return Ok(new { message = "Xóa xe thành công" });
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
