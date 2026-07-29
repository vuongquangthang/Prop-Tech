using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

/// <summary>
/// Chu nha (Owner) ket noi / xem tai khoan ngan hang nhan tien.
/// Frontend chi can: so tai khoan, ten chu tai khoan, ten ngan hang (+ chon BIN).
/// </summary>
[ApiController]
[Route("api/payment-account")]
[Authorize(Roles = "Admin,QuanLy")]
public class PaymentAccountController : ControllerBase
{
    private readonly IPaymentAccountService _service;
    private readonly ILogger<PaymentAccountController> _logger;

    public PaymentAccountController(IPaymentAccountService service, ILogger<PaymentAccountController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private int GetOwnerId() => User.GetOwnerUserId();

    /// <summary>Xem TK nhan tien hien tai cua chu nha (null neu chua ket noi).</summary>
    [HttpGet]
    public async Task<ActionResult<PaymentAccountDto?>> Get()
    {
        try
        {
            var acc = await _service.GetByOwnerAsync(GetOwnerId());
            return Ok(acc);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loi GET payment-account");
            return StatusCode(500, new { message = "Lỗi tải tài khoản nhận tiền", error = ex.Message });
        }
    }

    /// <summary>Ket noi / cap nhat TK nhan tien.</summary>
    [HttpPost]
    public async Task<ActionResult<PaymentAccountDto>> Connect([FromBody] ConnectPaymentAccountDto dto)
    {
        try
        {
            var result = await _service.ConnectAsync(GetOwnerId(), dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            // Log day du + tra chi tiet de chan doan 500.
            _logger.LogError(ex, "Loi POST payment-account");
            var detail = ex.InnerException?.Message ?? ex.Message;
            return StatusCode(500, new { message = "Lỗi lưu tài khoản nhận tiền", error = detail });
        }
    }
}
