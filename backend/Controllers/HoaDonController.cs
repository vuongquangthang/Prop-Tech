using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;

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

    /// <summary>
    /// Lấy danh sách tất cả hóa đơn
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<HoaDonDto>>> GetAll()
    {
        try
        {
            var invoices = await _hoaDonService.GetAllAsync();
            return Ok(invoices);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách hóa đơn chưa thanh toán đủ
    /// </summary>
    [HttpGet("unpaid")]
    public async Task<ActionResult<List<HoaDonDto>>> GetUnpaid()
    {
        try
        {
            var invoices = await _hoaDonService.GetUnpaidInvoicesAsync();
            return Ok(invoices);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách hóa đơn theo hợp đồng
    /// </summary>
    [HttpGet("contract/{contractId}")]
    public async Task<ActionResult<List<HoaDonDto>>> GetByContract(int contractId)
    {
        try
        {
            var invoices = await _hoaDonService.GetByContractIdAsync(contractId);
            return Ok(invoices);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết hóa đơn theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<HoaDonDto>> GetById(int id)
    {
        try
        {
            var invoice = await _hoaDonService.GetByIdAsync(id);
            if (invoice == null)
            {
                return NotFound(new { message = "Hóa đơn không tồn tại" });
            }
            return Ok(invoice);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Tạo hóa đơn mới
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<HoaDonDto>> Create([FromBody] CreateHoaDonDto dto)
    {
        try
        {
            var invoice = await _hoaDonService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, invoice);
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
    /// Thanh toán hóa đơn
    /// </summary>
    [HttpPost("{id}/pay")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<HoaDonDto>> Pay(int id, [FromBody] PayHoaDonDto dto)
    {
        try
        {
            var invoice = await _hoaDonService.PayInvoiceAsync(id, dto);
            return Ok(invoice);
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
    /// Xóa hóa đơn
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _hoaDonService.DeleteAsync(id);
            return Ok(new { message = "Xóa hóa đơn thành công" });
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
