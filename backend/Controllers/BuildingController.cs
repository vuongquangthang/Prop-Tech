using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize(Roles = "MANAGER")]
[ApiController]
[Route("")]
public class BuildingController : ControllerBase
{
    private readonly IBuildingService _buildingService;
    private readonly IFloorService _floorService;
    private readonly IRoomService _roomService;

    public BuildingController(
        IBuildingService buildingService,
        IFloorService floorService,
        IRoomService roomService)
    {
        _buildingService = buildingService;
        _floorService = floorService;
        _roomService = roomService;
    }

    // Building endpoints
    [HttpGet("buildings")]
    public async Task<IActionResult> GetBuildings()
    {
        var buildings = await _buildingService.GetAllAsync();
        return Ok(buildings);
    }

    [HttpGet("buildings/{id}")]
    public async Task<IActionResult> GetBuilding(int id)
    {
        var building = await _buildingService.GetByIdAsync(id);
        if (building == null)
        {
            return NotFound(new { message = "Building not found" });
        }

        return Ok(building);
    }

    [HttpPost("buildings")]
    public async Task<IActionResult> CreateBuilding([FromBody] CreateBuildingDto request)
    {
        var building = await _buildingService.CreateAsync(request);
        return CreatedAtAction(nameof(GetBuilding), new { id = building.Id }, building);
    }

    [HttpPut("buildings/{id}")]
    public async Task<IActionResult> UpdateBuilding(int id, [FromBody] UpdateBuildingDto request)
    {
        var building = await _buildingService.UpdateAsync(id, request);
        return Ok(building);
    }

    // Floor endpoints
    [HttpGet("buildings/{id}/floors")]
    public async Task<IActionResult> GetFloorsByBuilding(int id)
    {
        var floors = await _floorService.GetByBuildingIdAsync(id);
        return Ok(floors);
    }

    [HttpPost("floors")]
    public async Task<IActionResult> CreateFloor([FromBody] CreateFloorDto request)
    {
        var floor = await _floorService.CreateAsync(request);
        return CreatedAtAction(nameof(GetFloorsByBuilding), new { id = floor.BuildingId }, floor);
    }

    // Room endpoints
    [HttpGet("floors/{id}/rooms")]
    public async Task<IActionResult> GetRoomsByFloor(int id)
    {
        var rooms = await _roomService.GetByFloorIdAsync(id);
        return Ok(rooms);
    }

    [HttpPost("rooms")]
    public async Task<IActionResult> CreateRoom([FromBody] CreateRoomDto request)
    {
        try
        {
            var room = await _roomService.CreateAsync(request);
            return CreatedAtAction(nameof(GetRoom), new { id = room.Id }, room);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("rooms/{id}")]
    public async Task<IActionResult> GetRoom(int id)
    {
        var room = await _roomService.GetByIdAsync(id);
        if (room == null)
        {
            return NotFound(new { message = "Room not found" });
        }

        return Ok(room);
    }

    [HttpPatch("rooms/{id}")]
    public async Task<IActionResult> UpdateRoom(int id, [FromBody] UpdateRoomDto request)
    {
        try
        {
            var room = await _roomService.UpdateAsync(id, request);
            return Ok(room);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
