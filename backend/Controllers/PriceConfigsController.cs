using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PriceConfigsController : ControllerBase
{
    private readonly IPriceConfigService _priceConfigService;
    private readonly ILogger<PriceConfigsController> _logger;

    public PriceConfigsController(IPriceConfigService priceConfigService, ILogger<PriceConfigsController> logger)
    {
        _priceConfigService = priceConfigService;
        _logger = logger;
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<PriceConfigDto>> GetById(long id)
    {
        try
        {
            var priceConfig = await _priceConfigService.GetByIdAsync(id);
            
            if (priceConfig == null)
                return NotFound(new { message = "Không tìm thấy cấu hình giá" });

            return Ok(priceConfig);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting price config {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy cấu hình giá" });
        }
    }

    [HttpGet("service/{serviceType}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<PriceConfigDto>>> GetByServiceType(string serviceType)
    {
        try
        {
            var priceConfigs = await _priceConfigService.GetByServiceTypeAsync(serviceType);
            return Ok(priceConfigs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting price configs for service {ServiceType}", serviceType);
            return StatusCode(500, new { message = "Lỗi khi lấy cấu hình giá" });
        }
    }

    [HttpGet("service/{serviceType}/latest")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<PriceConfigDto>> GetLatestByServiceType(string serviceType, [FromQuery] DateTime? effectiveDate = null)
    {
        try
        {
            var priceConfig = await _priceConfigService.GetLatestByServiceTypeAsync(serviceType, effectiveDate);
            
            if (priceConfig == null)
                return NotFound(new { message = "Không tìm thấy cấu hình giá" });

            return Ok(priceConfig);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting latest price config for service {ServiceType}", serviceType);
            return StatusCode(500, new { message = "Lỗi khi lấy cấu hình giá" });
        }
    }

    [HttpGet("service/{serviceType}/history")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<PriceConfigDto>>> GetHistory(string serviceType)
    {
        try
        {
            var priceConfigs = await _priceConfigService.GetHistoryByServiceTypeAsync(serviceType);
            return Ok(priceConfigs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting price config history for service {ServiceType}", serviceType);
            return StatusCode(500, new { message = "Lỗi khi lấy lịch sử cấu hình giá" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<PriceConfigDto>> Create([FromBody] CreatePriceConfigDto dto)
    {
        try
        {
            var priceConfig = await _priceConfigService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = priceConfig.Id }, priceConfig);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating price config");
            return StatusCode(500, new { message = "Lỗi khi tạo cấu hình giá" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<PriceConfigDto>> Update(long id, [FromBody] UpdatePriceConfigDto dto)
    {
        try
        {
            var priceConfig = await _priceConfigService.UpdateAsync(id, dto);
            return Ok(priceConfig);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating price config {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi cập nhật cấu hình giá" });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<IActionResult> Delete(long id)
    {
        try
        {
            await _priceConfigService.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting price config {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi xóa cấu hình giá" });
        }
    }
}
