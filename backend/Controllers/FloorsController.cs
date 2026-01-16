using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class FloorsController : ControllerBase
{
    private readonly IFloorService _floorService;
    private readonly ILogger<FloorsController> _logger;

    public FloorsController(IFloorService floorService, ILogger<FloorsController> logger)
    {
        _floorService = floorService;
        _logger = logger;
    }

    [HttpGet("building/{buildingId}")]
    public async Task<ActionResult<List<FloorDto>>> GetByBuildingId(long buildingId)
    {
        try
        {
            var floors = await _floorService.GetByBuildingIdAsync(buildingId);
            return Ok(floors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting floors for building {BuildingId}", buildingId);
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách tầng" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FloorDto>> GetById(long id)
    {
        try
        {
            var floor = await _floorService.GetByIdAsync(id);
            
            if (floor == null)
                return NotFound(new { message = "Không tìm thấy tầng" });

            return Ok(floor);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting floor {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy thông tin tầng" });
        }
    }

    [Authorize(Roles = "MANAGER")]
    [HttpPost]
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
            _logger.LogError(ex, "Error creating floor");
            return StatusCode(500, new { message = "Lỗi khi tạo tầng" });
        }
    }

    [Authorize(Roles = "MANAGER")]
    [HttpPut("{id}")]
    public async Task<ActionResult<FloorDto>> Update(long id, [FromBody] UpdateFloorDto dto)
    {
        try
        {
            var floor = await _floorService.UpdateAsync(id, dto);
            return Ok(floor);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating floor {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi cập nhật tầng" });
        }
    }

    [Authorize(Roles = "MANAGER")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        try
        {
            await _floorService.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting floor {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi xóa tầng" });
        }
    }
}
