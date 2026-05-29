using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResidentsController : ControllerBase
{
    private readonly IResidentService _residentService;

    public ResidentsController(IResidentService residentService)
    {
        _residentService = residentService;
    }

    private int GetUserId()
    {
        var claim = User.GetOwnerUserId().ToString();
        if (!int.TryParse(claim, out var userId) || userId <= 0)
        {
            throw new InvalidOperationException("Không thể xác thực người dùng");
        }
        return userId;
    }

    /// <summary>
    /// Lấy danh sách tất cả cư dân
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ResidentDto>>> GetAll()
    {
        try
        {
            var residents = await _residentService.GetAllAsync(GetUserId());
            return Ok(residents);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Tìm kiếm cư dân theo tên
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<List<ResidentDto>>> SearchByName([FromQuery] string name)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new { message = "Tên tìm kiếm không được để trống" });
            }

            var residents = await _residentService.SearchByNameAsync(name, GetUserId());
            return Ok(residents);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết cư dân theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ResidentDetailDto>> GetById(int id)
    {
        try
        {
            var resident = await _residentService.GetByIdAsync(id, GetUserId());
            if (resident == null)
            {
                return NotFound(new { message = "Cư dân không tồn tại" });
            }
            return Ok(resident);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Tạo cư dân mới
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<ResidentDto>> Create([FromBody] CreateResidentDto dto)
    {
        try
        {
            var resident = await _residentService.CreateAsync(dto, GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = resident.Id }, resident);
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
    /// Cập nhật cư dân
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<ResidentDto>> Update(int id, [FromBody] UpdateResidentDto dto)
    {
        try
        {
            var resident = await _residentService.UpdateAsync(id, dto, GetUserId());
            return Ok(resident);
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
    /// Xóa cư dân
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _residentService.DeleteAsync(id, GetUserId());
            return Ok(new { message = "Xóa cư dân thành công" });
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
