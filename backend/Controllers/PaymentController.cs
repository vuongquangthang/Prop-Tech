using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(IPaymentService paymentService, ILogger<PaymentController> logger)
    {
        _paymentService = paymentService;
        _logger = logger;
    }

    /// <summary>
    /// Khởi tạo giao dịch thanh toán (tạo transaction PENDING)
    /// </summary>
    [HttpPost("initiate")]
    [Authorize(Roles = "Admin,QuanLy,KeToan,CuDan")]
    public async Task<ActionResult<InitiatePaymentResponseDto>> InitiatePayment([FromBody] InitTransactionDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var response = await _paymentService.InitiatePaymentAsync(dto, userId);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initiating payment for invoice {InvoiceId}", dto.InvoiceId);
            return StatusCode(500, new { message = "Đã xảy ra lỗi khi khởi tạo thanh toán", error = ex.Message });
        }
    }

    /// <summary>
    /// Callback xử lý kết quả thanh toán từ gateway (MOCK)
    /// </summary>
    [HttpPost("callback")]
    [AllowAnonymous] // Gateway callbacks don't have auth token
    public async Task<ActionResult<PaymentCallbackResponseDto>> PaymentCallback([FromBody] PaymentCallbackDto dto)
    {
        try
        {
            var response = await _paymentService.ProcessPaymentCallbackAsync(dto);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment callback for transaction {TransactionCode}", dto.TransactionCode);
            return StatusCode(500, new { message = "Đã xảy ra lỗi khi xử lý callback", error = ex.Message });
        }
    }

    /// <summary>
    /// Lấy giao dịch đang chờ của hóa đơn
    /// </summary>
    [HttpGet("pending/{invoiceId}")]
    [Authorize(Roles = "Admin,QuanLy,KeToan,CuDan")]
    public async Task<ActionResult<ThanhToanDto?>> GetPendingPayment(int invoiceId)
    {
        try
        {
            var payment = await _paymentService.GetPendingPaymentByInvoiceIdAsync(invoiceId);
            return Ok(payment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending payment for invoice {InvoiceId}", invoiceId);
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }

    /// <summary>
    /// Hủy giao dịch đang chờ
    /// </summary>
    [HttpPost("cancel/{transactionId}")]
    [Authorize(Roles = "Admin,QuanLy,KeToan,CuDan")]
    public async Task<ActionResult> CancelPayment(long transactionId)
    {
        try
        {
            await _paymentService.CancelPaymentAsync(transactionId);
            return Ok(new { message = "Đã hủy giao dịch" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error canceling payment {TransactionId}", transactionId);
            return StatusCode(500, new { message = "Đã xảy ra lỗi", error = ex.Message });
        }
    }
}
