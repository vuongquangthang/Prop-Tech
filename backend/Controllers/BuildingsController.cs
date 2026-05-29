using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BuildingsController : ControllerBase
{
    private readonly IBuildingService _buildingService;

    public BuildingsController(IBuildingService buildingService)
    {
        _buildingService = buildingService;
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
    /// Lấy danh sách tất cả tòa nhà
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<BuildingDto>>> GetAll()
    {
        try
        {
            var buildings = await _buildingService.GetAllAsync(GetUserId());
            return Ok(buildings);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết tòa nhà theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<BuildingDetailDto>> GetById(int id)
    {
        try
        {
            var building = await _buildingService.GetByIdAsync(id, GetUserId());
            if (building == null)
            {
                return NotFound(new { message = "Tòa nhà không tồn tại" });
            }
            return Ok(building);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Tạo tòa nhà mới
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<BuildingDto>> Create([FromBody] CreateBuildingDto dto)
    {
        try
        {
            var building = await _buildingService.CreateAsync(dto, GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = building.Id }, building);
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
    /// Cập nhật tòa nhà
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<BuildingDto>> Update(int id, [FromBody] UpdateBuildingDto dto)
    {
        try
        {
            var building = await _buildingService.UpdateAsync(id, dto, GetUserId());
            return Ok(building);
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
    /// Xóa tòa nhà
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _buildingService.DeleteAsync(id, GetUserId());
            return Ok(new { message = "Xóa tòa nhà thành công" });
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
