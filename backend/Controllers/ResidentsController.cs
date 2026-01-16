using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ResidentsController : ControllerBase
{
    private readonly IResidentService _residentService;
    private readonly ILogger<ResidentsController> _logger;

    public ResidentsController(IResidentService residentService, ILogger<ResidentsController> logger)
    {
        _residentService = residentService;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<ResidentDto>>> GetAll()
    {
        try
        {
            var residents = await _residentService.GetAllAsync();
            return Ok(residents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all residents");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách cư dân" });
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<ResidentDto>> GetById(long id)
    {
        try
        {
            var resident = await _residentService.GetByIdAsync(id);
            
            if (resident == null)
                return NotFound(new { message = "Không tìm thấy cư dân" });

            return Ok(resident);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting resident {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy thông tin cư dân" });
        }
    }

    [HttpGet("room/{roomId}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<ResidentDto>>> GetByRoom(long roomId)
    {
        try
        {
            var residents = await _residentService.GetByRoomAsync(roomId);
            return Ok(residents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting residents for room {RoomId}", roomId);
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách cư dân" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<ResidentDto>> Create([FromBody] CreateResidentDto dto)
    {
        try
        {
            var resident = await _residentService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = resident.Id }, resident);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating resident");
            return StatusCode(500, new { message = "Lỗi khi tạo cư dân" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<ResidentDto>> Update(long id, [FromBody] UpdateResidentDto dto)
    {
        try
        {
            var resident = await _residentService.UpdateAsync(id, dto);
            return Ok(resident);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating resident {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi cập nhật cư dân" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<IActionResult> Delete(long id)
    {
        try
        {
            await _residentService.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting resident {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi xóa cư dân" });
        }
    }
}
