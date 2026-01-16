using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly ILogger<InvoicesController> _logger;

    public InvoicesController(IInvoiceService invoiceService, ILogger<InvoicesController> logger)
    {
        _invoiceService = invoiceService;
        _logger = logger;
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<InvoiceDto>> GetById(long id)
    {
        try
        {
            var invoice = await _invoiceService.GetByIdAsync(id);
            
            if (invoice == null)
                return NotFound(new { message = "Không tìm thấy hóa đơn" });

            return Ok(invoice);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting invoice {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy hóa đơn" });
        }
    }

    [HttpGet("{id}/detail")]
    [Authorize]
    public async Task<ActionResult<InvoiceDetailDto>> GetDetail(long id)
    {
        try
        {
            var invoice = await _invoiceService.GetDetailAsync(id);
            
            if (invoice == null)
                return NotFound(new { message = "Không tìm thấy hóa đơn" });

            // Check ownership for residents
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == "RESIDENT")
            {
                // Residents can only view invoices for their rooms
                // TODO: Check if resident owns this room
                return Forbid();
            }

            return Ok(invoice);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting invoice detail {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi lấy chi tiết hóa đơn" });
        }
    }

    [HttpGet("period/{billingPeriodId}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<InvoiceDto>>> GetByBillingPeriod(long billingPeriodId)
    {
        try
        {
            var invoices = await _invoiceService.GetByBillingPeriodAsync(billingPeriodId);
            return Ok(invoices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting invoices for period {PeriodId}", billingPeriodId);
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách hóa đơn" });
        }
    }

    [HttpGet("room/{roomId}")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<List<InvoiceDto>>> GetByRoom(long roomId)
    {
        try
        {
            var invoices = await _invoiceService.GetByRoomAsync(roomId);
            return Ok(invoices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting invoices for room {RoomId}", roomId);
            return StatusCode(500, new { message = "Lỗi khi lấy danh sách hóa đơn" });
        }
    }

    [HttpPost("period/{billingPeriodId}/generate")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<object>> GenerateDraftInvoices(long billingPeriodId)
    {
        try
        {
            var count = await _invoiceService.GenerateDraftInvoicesAsync(billingPeriodId);
            return Ok(new { message = $"Tạo {count} hóa đơn nháp thành công", count });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating invoices for period {PeriodId}", billingPeriodId);
            return StatusCode(500, new { message = "Lỗi khi tạo hóa đơn" });
        }
    }

    [HttpPut("{id}/adjust")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<InvoiceDto>> Adjust(long id, [FromBody] AdjustInvoiceDto dto)
    {
        try
        {
            var invoice = await _invoiceService.AdjustAsync(id, dto);
            return Ok(invoice);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adjusting invoice {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi điều chỉnh hóa đơn" });
        }
    }

    [HttpPost("{id}/confirm")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<InvoiceDto>> Confirm(long id, [FromBody] ConfirmInvoiceDto dto)
    {
        try
        {
            var invoice = await _invoiceService.ConfirmAsync(id, dto);
            return Ok(invoice);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error confirming invoice {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi chốt hóa đơn" });
        }
    }

    [HttpPost("{id}/void")]
    [Authorize(Roles = "MANAGER")]
    public async Task<ActionResult<InvoiceDto>> Void(long id, [FromBody] VoidInvoiceDto dto)
    {
        try
        {
            var invoice = await _invoiceService.VoidAsync(id, dto);
            return Ok(invoice);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error voiding invoice {Id}", id);
            return StatusCode(500, new { message = "Lỗi khi hủy hóa đơn" });
        }
    }
}
