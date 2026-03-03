using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/chisodien")]
[Authorize]
public class ChiSoDienController : ControllerBase
{
    private readonly IChiSoDienService _chiSoDienService;

    public ChiSoDienController(IChiSoDienService chiSoDienService)
    {
        _chiSoDienService = chiSoDienService;
    }

    /// <summary>
    /// Get all electricity readings
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<List<ChiSoDienDto>>> GetAll()
    {
        var readings = await _chiSoDienService.GetAllAsync();
        return Ok(readings);
    }

    /// <summary>
    /// Get electricity readings by service usage detail ID
    /// </summary>
    [HttpGet("serviceusage/{serviceUsageDetailId}")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<List<ChiSoDienDto>>> GetByServiceUsageDetailId(long serviceUsageDetailId)
    {
        var readings = await _chiSoDienService.GetByServiceUsageDetailIdAsync(serviceUsageDetailId);
        return Ok(readings);
    }

    /// <summary>
    /// Get electricity reading by period
    /// </summary>
    [HttpGet("period")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<ChiSoDienDto>> GetByPeriod([FromQuery] long serviceUsageDetailId, [FromQuery] byte month, [FromQuery] short year)
    {
        var reading = await _chiSoDienService.GetByPeriodAsync(serviceUsageDetailId, month, year);
        if (reading == null)
            return NotFound("Chỉ số điện không tồn tại");
        
        return Ok(reading);
    }

    /// <summary>
    /// Get electricity readings by period range
    /// </summary>
    [HttpGet("range")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<List<ChiSoDienDto>>> GetByPeriodRange([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var readings = await _chiSoDienService.GetByPeriodRangeAsync(from, to);
        return Ok(readings);
    }

    /// <summary>
    /// Get electricity reading by ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<ChiSoDienDto>> GetById(int id)
    {
        var reading = await _chiSoDienService.GetByIdAsync(id);
        if (reading == null)
            return NotFound("Chỉ số điện không tồn tại");
        
        return Ok(reading);
    }

    /// <summary>
    /// Create new electricity reading
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<ChiSoDienDto>> Create([FromBody] CreateChiSoDienDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("Invalid user context");
            }

            var created = await _chiSoDienService.CreateAsync(userId, dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Update electricity reading
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<ChiSoDienDto>> Update(int id, [FromBody] UpdateChiSoDienDto dto)
    {
        try
        {
            var updated = await _chiSoDienService.UpdateAsync(id, dto);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Delete electricity reading
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            await _chiSoDienService.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
