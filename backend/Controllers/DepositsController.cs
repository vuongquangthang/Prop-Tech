using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DepositsController : ControllerBase
{
    private readonly IDepositService _depositService;
    private readonly ILogger<DepositsController> _logger;

    public DepositsController(IDepositService depositService, ILogger<DepositsController> logger)
    {
        _depositService = depositService;
        _logger = logger;
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<DepositDto>> GetById(long id)
    {
        try
        {
            var deposit = await _depositService.GetByIdAsync(id);
            
            if (deposit == null)
                return NotFound(new { message = "Không tìm thấy tiền cọc" });

            return Ok(deposit);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting deposit {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy thông tin tiền cọc" });
        }
    }

    [HttpGet("residency/{residencyId}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<DepositDto>> GetByResidency(long residencyId)
    {
        try
        {
            var deposit = await _depositService.GetByResidencyAsync(residencyId);
            
            if (deposit == null)
                return NotFound(new { message = "Không tìm thấy tiền cọc cho cư trú này" });

            return Ok(deposit);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting deposit for residency {ResidencyId}", residencyId);
            return StatusCode(500, new { message = "Lỗi khi lấy thông tin tiền cọc" });
        }
    }

    [HttpGet("room/{roomId}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<DepositDto>>> GetByRoom(long roomId)
    {
        try
        {
            var deposits = await _depositService.GetByRoomAsync(roomId);
            return Ok(deposits);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting deposits for room {RoomId}", roomId);
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách tiền cọc" });
        }
    }

    [HttpGet("status/{status}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<DepositDto>>> GetByStatus(string status)
    {
        try
        {
            var deposits = await _depositService.GetByStatusAsync(status);
            return Ok(deposits);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting deposits by status {Status}", status);
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách tiền cọc" });
        }
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<DepositDto>> UpdateStatus(long id, [FromBody] UpdateDepositStatusDto dto)
    {
        try
        {
            var deposit = await _depositService.UpdateStatusAsync(id, dto);
            return Ok(deposit);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating deposit {Id} status", id);
            return StatusCode(500, new { message = "Lỗi khi cập nhật trạng thái tiền cọc" });
        }
    }

    [HttpPost("{id}/refund")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<DepositDto>> Refund(long id, [FromBody] RefundDepositDto dto)
    {
        try
        {
            var deposit = await _depositService.RefundAsync(id, dto);
            return Ok(deposit);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refunding deposit {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi hoàn lại tiền cọc" });
        }
    }
}
