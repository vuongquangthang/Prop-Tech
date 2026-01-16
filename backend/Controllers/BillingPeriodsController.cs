using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BillingPeriodsController : ControllerBase
{
    private readonly IBillingPeriodService _billingPeriodService;
    private readonly ILogger<BillingPeriodsController> _logger;

    public BillingPeriodsController(IBillingPeriodService billingPeriodService, ILogger<BillingPeriodsController> logger)
    {
        _billingPeriodService = billingPeriodService;
        _logger = logger;
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<BillingPeriodDto>> GetById(long id)
    {
        try
        {
            var period = await _billingPeriodService.GetByIdAsync(id);
            
            if (period == null)
                return NotFound(new { message = "Không tìm thấy kỳ tính phí" });

            return Ok(period);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting billing period {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy kỳ tính phí" });
        }
    }

    [HttpGet]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<BillingPeriodDto>>> GetAll()
    {
        try
        {
            var periods = await _billingPeriodService.GetAllAsync();
            return Ok(periods);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all billing periods");
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách kỳ tính phí" });
        }
    }

    [HttpGet("month/{year}/{month}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<BillingPeriodDto>> GetByMonth(int year, int month)
    {
        try
        {
            var periodMonth = new DateTime(year, month, 1);
            var period = await _billingPeriodService.GetByMonthAsync(periodMonth);
            
            if (period == null)
                return NotFound(new { message = "Không tìm thấy kỳ tính phí" });

            return Ok(period);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting billing period for {Year}/{Month}", year, month);
            return StatusCode(500, new { message = "Lỗi khi lấy kỳ tính phí" });
        }
    }

    [HttpPost]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<BillingPeriodDto>> Create([FromBody] CreateBillingPeriodDto dto)
    {
        try
        {
            var period = await _billingPeriodService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = period.Id }, period);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating billing period");
            return StatusCode(500, new { message = "Lỗi khi tạo kỳ tính phí" });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<BillingPeriodDto>> Update(long id, [FromBody] UpdateBillingPeriodDto dto)
    {
        try
        {
            var period = await _billingPeriodService.UpdateAsync(id, dto);
            return Ok(period);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating billing period {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi cập nhật kỳ tính phí" });
        }
    }
}
