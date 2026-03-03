using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/chisonuoc")]
[Authorize]
public class ChiSoNuocController : ControllerBase
{
    private readonly IChiSoNuocService _chiSoNuocService;

    public ChiSoNuocController(IChiSoNuocService chiSoNuocService)
    {
        _chiSoNuocService = chiSoNuocService;
    }

    /// <summary>
    /// Get all water readings
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<List<ChiSoNuocDto>>> GetAll()
    {
        var readings = await _chiSoNuocService.GetAllAsync();
        return Ok(readings);
    }

    /// <summary>
    /// Get water readings by service usage detail ID
    /// </summary>
    [HttpGet("serviceusage/{serviceUsageDetailId}")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<List<ChiSoNuocDto>>> GetByServiceUsageDetailId(long serviceUsageDetailId)
    {
        var readings = await _chiSoNuocService.GetByServiceUsageDetailIdAsync(serviceUsageDetailId);
        return Ok(readings);
    }

    /// <summary>
    /// Get water reading by period
    /// </summary>
    [HttpGet("period")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<ChiSoNuocDto>> GetByPeriod([FromQuery] long serviceUsageDetailId, [FromQuery] byte month, [FromQuery] short year)
    {
        var reading = await _chiSoNuocService.GetByPeriodAsync(serviceUsageDetailId, month, year);
        if (reading == null)
            return NotFound("Chỉ số nước không tồn tại");
        
        return Ok(reading);
    }

    /// <summary>
    /// Get water readings by period range
    /// </summary>
    [HttpGet("range")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<List<ChiSoNuocDto>>> GetByPeriodRange([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var readings = await _chiSoNuocService.GetByPeriodRangeAsync(from, to);
        return Ok(readings);
    }

    /// <summary>
    /// Get water reading by ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<ChiSoNuocDto>> GetById(int id)
    {
        var reading = await _chiSoNuocService.GetByIdAsync(id);
        if (reading == null)
            return NotFound("Chỉ số nước không tồn tại");
        
        return Ok(reading);
    }

    /// <summary>
    /// Create new water reading
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<ChiSoNuocDto>> Create([FromBody] CreateChiSoNuocDto dto)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("Invalid user context");
            }

            var created = await _chiSoNuocService.CreateAsync(userId, dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Update water reading
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QuanLy")]
    public async Task<ActionResult<ChiSoNuocDto>> Update(int id, [FromBody] UpdateChiSoNuocDto dto)
    {
        try
        {
            var updated = await _chiSoNuocService.UpdateAsync(id, dto);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Delete water reading
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            await _chiSoNuocService.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
