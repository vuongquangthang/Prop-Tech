using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BuildingsController : ControllerBase
{
    private readonly IBuildingService _buildingService;
    private readonly ILogger<BuildingsController> _logger;

    public BuildingsController(IBuildingService buildingService, ILogger<BuildingsController> logger)
    {
        _buildingService = buildingService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<BuildingDto>>> GetAll()
    {
        try
        {
            var buildings = await _buildingService.GetAllAsync();
            return Ok(buildings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all buildings");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách tòa nhà" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BuildingDto>> GetById(long id)
    {
        try
        {
            var building = await _buildingService.GetByIdAsync(id);
            
            if (building == null)
                return NotFound(new { message = "Không tìm thấy tòa nhà" });

            return Ok(building);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting building {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy thông tin tòa nhà" });
        }
    }

    [Authorize(Roles = "MANAGER")]
    [HttpPost]
    public async Task<ActionResult<BuildingDto>> Create([FromBody] CreateBuildingDto dto)
    {
        try
        {
            var building = await _buildingService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = building.Id }, building);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating building");
            return StatusCode(500, new { message = "Lỗi khi tạo tòa nhà" });
        }
    }

    [Authorize(Roles = "MANAGER")]
    [HttpPut("{id}")]
    public async Task<ActionResult<BuildingDto>> Update(long id, [FromBody] UpdateBuildingDto dto)
    {
        try
        {
            var building = await _buildingService.UpdateAsync(id, dto);
            return Ok(building);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating building {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi cập nhật tòa nhà" });
        }
    }

    [Authorize(Roles = "MANAGER")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        try
        {
            await _buildingService.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting building {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi xóa tòa nhà" });
        }
    }
}
