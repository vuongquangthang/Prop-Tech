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
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IPayOSService _payOSService;
    private readonly ILogger<PaymentController> _logger;

    public PaymentController(IPaymentService paymentService, IPayOSService payOSService, ILogger<PaymentController> logger)
    {
        _paymentService = paymentService;
        _payOSService = payOSService;
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

    /// <summary>
    /// Webhook nhận kết quả thanh toán từ PayOS (không cần xác thực)
    /// </summary>
    [HttpPost("payos-webhook")]
    [AllowAnonymous]
    public async Task<ActionResult> PayOSWebhook([FromBody] Webhook webhookBody)
    {
        try
        {
            var webhookData = await _payOSService.VerifyWebhookAsync(webhookBody);
            _logger.LogInformation("PayOS webhook received: orderCode={OrderCode}, code={Code}", webhookData.OrderCode, webhookData.Code);

            if (webhookData.Code == "00")
            {
                await _paymentService.ProcessPaymentCallbackAsync(new PaymentCallbackDto
                {
                    TransactionCode = webhookData.OrderCode.ToString(),
                    Status = "SUCCESS",
                    PaidAt = DateTime.UtcNow
                });
            }

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PayOS webhook processing error");
            // Always return 200 to prevent PayOS from retrying indefinitely
            return Ok(new { success = false, message = ex.Message });
        }
    }
}
