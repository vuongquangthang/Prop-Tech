using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MeterReadingsController : ControllerBase
{
    private readonly IMeterReadingService _meterReadingService;
    private readonly IWaterMeterReadingService _waterMeterReadingService;
    private readonly ILogger<MeterReadingsController> _logger;

    public MeterReadingsController(
        IMeterReadingService meterReadingService,
        IWaterMeterReadingService waterMeterReadingService,
        ILogger<MeterReadingsController> logger)
    {
        _meterReadingService = meterReadingService;
        _waterMeterReadingService = waterMeterReadingService;
        _logger = logger;
    }

    [HttpGet("electricity/{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<MeterReadingDto>> GetElectricityById(long id)
    {
        try
        {
            var reading = await _meterReadingService.GetByIdAsync(id);
            
            if (reading == null)
                return NotFound(new { message = "Không tìm thấy chỉ số điện" });

            return Ok(reading);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting meter reading {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy chỉ số điện" });
        }
    }

    [HttpGet("water/{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<WaterMeterReadingDto>> GetWaterById(long id)
    {
        try
        {
            var reading = await _waterMeterReadingService.GetByIdAsync(id);
            
            if (reading == null)
                return NotFound(new { message = "Không tìm thấy chỉ số nước" });

            return Ok(reading);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting water meter reading {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy chỉ số nước" });
        }
    }

    [HttpGet("electricity/room/{roomId}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<MeterReadingDto>>> GetElectricityByRoom(long roomId)
    {
        try
        {
            var readings = await _meterReadingService.GetByRoomAsync(roomId);
            return Ok(readings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting meter readings for room {RoomId}", roomId);
            return StatusCode(500, new { message = "Lỗi khi lấy chỉ số điện" });
        }
    }

    [HttpGet("water/room/{roomId}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<WaterMeterReadingDto>>> GetWaterByRoom(long roomId)
    {
        try
        {
            var readings = await _waterMeterReadingService.GetByRoomAsync(roomId);
            return Ok(readings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting water meter readings for room {RoomId}", roomId);
            return StatusCode(500, new { message = "Lỗi khi lấy chỉ số nước" });
        }
    }

    [HttpPost("electricity")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<MeterReadingDto>> CreateElectricity([FromBody] CreateMeterReadingDto dto)
    {
        try
        {
            var reading = await _meterReadingService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetElectricityById), new { id = reading.Id }, reading);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating meter reading");
            return StatusCode(500, new { message = "Lỗi khi nhập chỉ số điện" });
        }
    }

    [HttpPost("water")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<WaterMeterReadingDto>> CreateWater([FromBody] CreateWaterMeterReadingDto dto)
    {
        try
        {
            var reading = await _waterMeterReadingService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetWaterById), new { id = reading.Id }, reading);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating water meter reading");
            return StatusCode(500, new { message = "Lỗi khi nhập chỉ số nước" });
        }
    }
}
