using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FloorsController : ControllerBase
{
    private readonly IFloorService _floorService;

    public FloorsController(IFloorService floorService)
    {
        _floorService = floorService;
    }

    /// <summary>
    /// Lấy danh sách tất cả tầng
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<FloorDto>>> GetAll()
    {
        try
        {
            var floors = await _floorService.GetAllAsync();
            return Ok(floors);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách tầng theo tòa nhà
    /// </summary>
    [HttpGet("building/{buildingId}")]
    public async Task<ActionResult<List<FloorDto>>> GetByBuilding(int buildingId)
    {
        try
        {
            var floors = await _floorService.GetByBuildingIdAsync(buildingId);
            return Ok(floors);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết tầng theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<FloorDetailDto>> GetById(int id)
    {
        try
        {
            var floor = await _floorService.GetByIdAsync(id);
            if (floor == null)
            {
                return NotFound(new { message = "Tầng không tồn tại" });
            }
            return Ok(floor);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Tạo tầng mới
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<FloorDto>> Create([FromBody] CreateFloorDto dto)
    {
        try
        {
            var floor = await _floorService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = floor.Id }, floor);
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
    /// Xóa tầng
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _floorService.DeleteAsync(id);
            return Ok(new { message = "Xóa tầng thành công" });
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
