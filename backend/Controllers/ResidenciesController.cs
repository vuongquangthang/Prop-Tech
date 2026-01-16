using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ResidenciesController : ControllerBase
{
    private readonly IResidencyService _residencyService;
    private readonly ILogger<ResidenciesController> _logger;

    public ResidenciesController(IResidencyService residencyService, ILogger<ResidenciesController> logger)
    {
        _residencyService = residencyService;
        _logger = logger;
    }

    [HttpGet("room/{roomId}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<ResidencyDto>>> GetByRoom(long roomId)
    {
        try
        {
            var residencies = await _residencyService.GetByRoomAsync(roomId);
            return Ok(residencies);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting residencies for room {RoomId}", roomId);
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách cư trú" });
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<ResidencyDto>> GetById(long id)
    {
        try
        {
            var residency = await _residencyService.GetByIdAsync(id);
            
            if (residency == null)
                return NotFound(new { message = "Không tìm thấy cư trú" });

            return Ok(residency);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting residency {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy thông tin cư trú" });
        }
    }

    [HttpPost("check-in")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<ResidencyDto>> CheckIn([FromBody] CheckInResidencyDto dto)
    {
        try
        {
            var residency = await _residencyService.CheckInAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = residency.Id }, residency);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking in resident");
            return StatusCode(500, new { message = "Lỗi khi check-in cư dân" });
        }
    }

    [HttpPost("{id}/check-out")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<ResidencyDto>> CheckOut(long id, [FromBody] CheckOutResidencyDto dto)
    {
        try
        {
            var residency = await _residencyService.CheckOutAsync(id, dto);
            return Ok(residency);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking out resident {ResidencyId}", id);
            return StatusCode(500, new { message = "Lỗi khi check-out cư dân" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<ResidencyDto>> Update(long id, [FromBody] UpdateResidencyDto dto)
    {
        try
        {
            var residency = await _residencyService.UpdateAsync(id, dto);
            return Ok(residency);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating residency {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi cập nhật cư trú" });
        }
    }

    [HttpGet("room/{roomId}/headcount")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<int>> GetHeadcount(long roomId, [FromQuery] DateTime cutoffDate)
    {
        try
        {
            if (cutoffDate == DateTime.MinValue)
            {
                cutoffDate = DateTime.UtcNow;
            }

            var headcount = await _residencyService.GetHeadcountForRoomAsync(roomId, cutoffDate);
            return Ok(new { headcount });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting headcount for room {RoomId}", roomId);
            return StatusCode(500, new { message = "Lỗi khi tính đầu người" });
        }
    }
}
