using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using PayOS.Models.Webhooks;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ThanhToanController : ControllerBase
{
    private readonly IThanhToanService _thanhToanService;
    private readonly ILogger<ThanhToanController> _logger;

    public ThanhToanController(IThanhToanService thanhToanService, ILogger<ThanhToanController> logger)
    {
        _thanhToanService = thanhToanService;
        _logger = logger;
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
            var payments = await _thanhToanService.GetAllAsync(GetCurrentOwnerUserId());
            return Ok(payments);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy lịch sử thanh toán của cư dân hiện tại
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "CuDan")]
    public async Task<ActionResult<List<ThanhToanDto>>> GetMy()
    {
        try
        {
            var userId = GetCurrentUserId();
            var payments = await _thanhToanService.GetByUserIdAsync(userId);
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
            var userId = GetCurrentOwnerUserId();
            var payments = User.IsInRole("CuDan")
                ? await _thanhToanService.GetByInvoiceIdAsync(invoiceId)
                : await _thanhToanService.GetByInvoiceIdAsync(invoiceId, userId);
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
            var userId = GetCurrentOwnerUserId();
            var payment = User.IsInRole("CuDan")
                ? await _thanhToanService.GetByIdAsync(id)
                : await _thanhToanService.GetByIdAsync(id, userId);
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
            var payment = await _thanhToanService.UpdateAsync(id, dto, GetCurrentOwnerUserId());
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
            await _thanhToanService.DeleteAsync(id, GetCurrentOwnerUserId());
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

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst("id") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return int.TryParse(claim?.Value, out var id) ? id : 0;
    }

    private int GetCurrentOwnerUserId()
    {
        var claim = User.FindFirst("OwnerUserId");
        return int.TryParse(claim?.Value, out var id) ? id : GetCurrentUserId();
    }

    /// <summary>
    /// Webhook nhận kết quả thanh toán từ PayOS (không cần xác thực JWT).
    /// Xác minh chữ ký, rồi đánh dấu hóa đơn gốc là "Đã thanh toán" theo orderCode.
    /// </summary>
    [HttpPost("payos-webhook")]
    [AllowAnonymous]
    public async Task<ActionResult> PayOSWebhook([FromBody] Webhook webhookBody)
    {
        try
        {
            var result = await _thanhToanService.ProcessPayOSWebhookAsync(webhookBody);
            _logger.LogInformation("✅ PayOS webhook processed: {Result}", result);
            return Ok(new { success = true, message = result });
        }
        catch (Exception ex)
        {
            // Trả 200 để PayOS không retry vô hạn, nhưng ghi log để debug
            _logger.LogError(ex, "❌ PayOS webhook error");
            return Ok(new { success = false, message = ex.Message });
        }
    }
}
