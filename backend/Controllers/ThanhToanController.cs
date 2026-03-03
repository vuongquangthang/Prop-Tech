using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ThanhToanController : ControllerBase
{
    private readonly IThanhToanService _thanhToanService;

    public ThanhToanController(IThanhToanService thanhToanService)
    {
        _thanhToanService = thanhToanService;
    }

    /// <summary>
    /// Lấy danh sách tất cả thanh toán
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<List<ThanhToanDto>>> GetAll()
    {
        try
        {
            var payments = await _thanhToanService.GetAllAsync();
            return Ok(payments);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách thanh toán theo hóa đơn
    /// </summary>
    [HttpGet("invoice/{invoiceId}")]
    public async Task<ActionResult<List<ThanhToanDto>>> GetByInvoice(int invoiceId)
    {
        try
        {
            var payments = await _thanhToanService.GetByInvoiceIdAsync(invoiceId);
            return Ok(payments);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy chi tiết thanh toán theo ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ThanhToanDto>> GetById(long id)
    {
        try
        {
            var payment = await _thanhToanService.GetByIdAsync(id);
            if (payment == null)
            {
                return NotFound(new { message = "Thanh toán không tồn tại" });
            }
            return Ok(payment);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật thanh toán
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,QuanLy,KeToan")]
    public async Task<ActionResult<ThanhToanDto>> Update(long id, [FromBody] UpdateThanhToanDto dto)
    {
        try
        {
            var payment = await _thanhToanService.UpdateAsync(id, dto);
            return Ok(payment);
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
    /// Xóa thanh toán
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(long id)
    {
        try
        {
            await _thanhToanService.DeleteAsync(id);
            return Ok(new { message = "Xóa thanh toán thành công" });
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
