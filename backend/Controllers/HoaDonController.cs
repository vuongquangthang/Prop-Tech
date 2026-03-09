using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HoaDonController : ControllerBase
{
    private readonly IHoaDonService _hoaDonService;

    public HoaDonController(IHoaDonService hoaDonService)
    {
        _hoaDonService = hoaDonService;
    }

    [HttpGet]
    public async Task<ActionResult<List<HoaDonDto>>> GetAll()
    {
        try { return Ok(await _hoaDonService.GetAllAsync()); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpGet("my")]
    [Authorize(Roles = "CuDan")]
    public async Task<ActionResult<List<HoaDonDto>>> GetMy()
    {
        try
        {
            var userId = GetCurrentUserId();
            return Ok(await _hoaDonService.GetByUserIdAsync(userId));
        }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpGet("unpaid")]
    public async Task<ActionResult<List<HoaDonDto>>> GetUnpaid()
    {
        try
        {
            var userId = GetCurrentUserId();
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            // CuDan only sees their own unpaid invoices; staff sees all
            int? filterUserId = (userRole == "CuDan") ? userId : null;
            return Ok(await _hoaDonService.GetUnpaidInvoicesAsync(filterUserId));
        }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpGet("drafts")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<List<HoaDonDto>>> GetDrafts()
    {
        try { return Ok(await _hoaDonService.GetDraftInvoicesAsync()); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpGet("contract/{contractId}")]
    public async Task<ActionResult<List<HoaDonDto>>> GetByContract(int contractId)
    {
        try { return Ok(await _hoaDonService.GetByContractIdAsync(contractId)); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HoaDonDto>> GetById(int id)
    {
        try
        {
            var invoice = await _hoaDonService.GetByIdAsync(id);
            if (invoice == null) return NotFound(new { message = "Hóa đơn không tồn tại" });
            return Ok(invoice);
        }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<HoaDonDto>> Create([FromBody] CreateHoaDonDto dto)
    {
        try
        {
            var invoice = await _hoaDonService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, invoice);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    /// <summary>
    /// Tính toán hóa đơn nháp từ chỉ số điện/nước đã chốt
    /// </summary>
    [HttpPost("calculate/{year}/{month}")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<CalculateInvoiceResultDto>> Calculate(short year, byte month)
    {
        try
        {
            var result = await _hoaDonService.CalculateDraftInvoicesAsync(year, month);
            return Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    /// <summary>
    /// Chỉnh sửa hóa đơn nháp
    /// </summary>
    [HttpPut("{id}/edit-draft")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<HoaDonDto>> EditDraft(int id, [FromBody] EditDraftInvoiceDto dto)
    {
        try
        {
            var invoice = await _hoaDonService.EditDraftAsync(id, dto);
            return Ok(invoice);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    /// <summary>
    /// Phê duyệt 1 hóa đơn
    /// </summary>
    [HttpPut("{id}/approve")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<HoaDonDto>> Approve(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var invoice = await _hoaDonService.ApproveAsync(id, userId);
            return Ok(invoice);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    /// <summary>
    /// Phê duyệt hàng loạt
    /// </summary>
    [HttpPost("approve-batch")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<BatchReadingResultDto>> ApproveBatch([FromBody] BatchApproveDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var result = await _hoaDonService.BatchApproveAsync(dto.InvoiceIds, userId);
            return Ok(result);
        }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    /// <summary>
    /// Từ chối hóa đơn
    /// </summary>
    [HttpPut("{id}/reject")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<HoaDonDto>> Reject(int id, [FromBody] RejectInvoiceDto dto)
    {
        try
        {
            var invoice = await _hoaDonService.RejectAsync(id, dto.Reason);
            return Ok(invoice);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpPost("{id}/pay")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<HoaDonDto>> Pay(int id, [FromBody] PayHoaDonDto dto)
    {
        try
        {
            var invoice = await _hoaDonService.PayInvoiceAsync(id, dto);
            return Ok(invoice);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _hoaDonService.DeleteAsync(id);
            return Ok(new { message = "Xóa hóa đơn thành công" });
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message }); }
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst("id") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return int.TryParse(claim?.Value, out var id) ? id : 0;
    }
}
