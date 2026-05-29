using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;

    public RoomsController(IRoomService roomService)
    {
        _roomService = roomService;
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
    /// Lấy danh sách tất cả phòng
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<RoomDto>>> GetAll()
    {
        try
        {
            var rooms = await _roomService.GetAllAsync(GetUserId());
            return Ok(rooms);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách phòng theo tầng
    /// </summary>
    [HttpGet("floor/{floorId}")]
    public async Task<ActionResult<List<RoomDto>>> GetByFloor(int floorId)
    {
        try
        {
            var rooms = await _roomService.GetByFloorIdAsync(floorId, GetUserId());
            return Ok(rooms);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách phòng theo trạng thái
    /// </summary>
    [HttpGet("status/{status}")]
    public async Task<ActionResult<List<RoomDto>>> GetByStatus(string status)
    {
        try
        {
            var rooms = await _roomService.GetByStatusAsync(status, GetUserId());
            return Ok(rooms);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết phòng theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<RoomDetailDto>> GetById(int id)
    {
        try
        {
            var room = await _roomService.GetByIdAsync(id, GetUserId());
            if (room == null)
            {
                return NotFound(new { message = "Phòng không tồn tại" });
            }
            return Ok(room);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy thông tin phòng của cư dân hiện tại
    /// </summary>
    [HttpGet("my-room")]
    [Authorize(Roles = "CuDan")]
    public async Task<ActionResult<MyRoomDto>> GetMyRoom()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
            if (userId == 0)
            {
                return Unauthorized(new { message = "Không thể xác thực người dùng" });
            }

            var myRoom = await _roomService.GetMyRoomAsync(userId);
            if (myRoom == null)
            {
                return NotFound(new { message = "Không tìm thấy thông tin phòng" });
            }

            return Ok(myRoom);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Tạo phòng mới
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<RoomDto>> Create([FromBody] CreateRoomDto dto)
    {
        try
        {
            var room = await _roomService.CreateAsync(dto, GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = room.Id }, room);
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
    /// Cập nhật phòng
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<RoomDto>> Update(int id, [FromBody] UpdateRoomDto dto)
    {
        try
        {
            var room = await _roomService.UpdateAsync(id, dto, GetUserId());
            return Ok(room);
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
    /// Xóa phòng
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _roomService.DeleteAsync(id, GetUserId());
            return Ok(new { message = "Xóa phòng thành công" });
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
