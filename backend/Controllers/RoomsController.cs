using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;
    private readonly ILogger<RoomsController> _logger;

    public RoomsController(IRoomService roomService, ILogger<RoomsController> logger)
    {
        _roomService = roomService;
        _logger = logger;
    }

    [HttpGet("floor/{floorId}")]
    public async Task<ActionResult<List<RoomDto>>> GetByFloorId(long floorId)
    {
        try
        {
            var rooms = await _roomService.GetByFloorIdAsync(floorId);
            return Ok(rooms);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rooms for floor {FloorId}", floorId);
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách phòng" });
        }
    }

    [HttpGet("building/{buildingId}")]
    public async Task<ActionResult<List<RoomDto>>> GetByBuildingId(long buildingId)
    {
        try
        {
            var rooms = await _roomService.GetByBuildingIdAsync(buildingId);
            return Ok(rooms);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting rooms for building {BuildingId}", buildingId);
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách phòng" });
        }
    }

    [HttpGet("available")]
    public async Task<ActionResult<List<RoomDto>>> GetAvailable([FromQuery] long? buildingId = null)
    {
        try
        {
            var rooms = await _roomService.GetAvailableRoomsAsync(buildingId);
            return Ok(rooms);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available rooms");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách phòng trống" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RoomDto>> GetById(long id)
    {
        try
        {
            var room = await _roomService.GetByIdAsync(id);
            
            if (room == null)
                return NotFound(new { message = "Không tìm thấy phòng" });

            return Ok(room);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting room {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy thông tin phòng" });
        }
    }

    [Authorize(Roles = "MANAGER")]
    [HttpPost]
    public async Task<ActionResult<RoomDto>> Create([FromBody] CreateRoomDto dto)
    {
        try
        {
            var room = await _roomService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = room.Id }, room);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating room");
            return StatusCode(500, new { message = "Lỗi khi tạo phòng" });
        }
    }

    [Authorize(Roles = "MANAGER")]
    [HttpPut("{id}")]
    public async Task<ActionResult<RoomDto>> Update(long id, [FromBody] UpdateRoomDto dto)
    {
        try
        {
            var room = await _roomService.UpdateAsync(id, dto);
            return Ok(room);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating room {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi cập nhật phòng" });
        }
    }

    [Authorize(Roles = "MANAGER")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        try
        {
            await _roomService.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting room {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi xóa phòng" });
        }
    }
}
