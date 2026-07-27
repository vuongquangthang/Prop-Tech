using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

/// <summary>
/// Webhook thanh toan SePay (multi-owner) + endpoint MOCK de demo.
/// - /api/PaymentGateway/sepay-webhook: SePay goi khi co tien vao TK Owner. Xac thuc API key.
/// - /api/PaymentGateway/mock-pay: gia lap tien vao (demo, khong can SePay that).
/// </summary>
[ApiController]
[Route("api/PaymentGateway")]
public class SePayWebhookController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IConfiguration _config;
    private readonly ILogger<SePayWebhookController> _logger;

    public SePayWebhookController(
        IPaymentService paymentService,
        IConfiguration config,
        ILogger<SePayWebhookController> logger)
    {
        _paymentService = paymentService;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Webhook SePay. Xac thuc bang header Authorization: Apikey {SEPAY_WEBHOOK_API_KEY}.
    /// Luon tra 200 de SePay khong retry vo han (loi ghi log).
    /// </summary>
    [HttpPost("sepay-webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> SePayWebhook([FromBody] SePayWebhookDto webhook)
    {
        // Xac thuc API key (chong gia mao webhook).
        var expectedKey = _config["SEPAY_WEBHOOK_API_KEY"] ?? _config["Sepay:WebhookApiKey"];
        if (!string.IsNullOrWhiteSpace(expectedKey))
        {
            var auth = Request.Headers["Authorization"].FirstOrDefault() ?? "";
            // SePay gui dang "Apikey {key}".
            var provided = auth.Replace("Apikey", "", StringComparison.OrdinalIgnoreCase).Trim();
            if (!string.Equals(provided, expectedKey, StringComparison.Ordinal))
            {
                _logger.LogWarning("Webhook SePay: API key khong hop le");
                return Unauthorized(new { success = false, message = "Invalid API key" });
            }
        }

        try
        {
            var result = await _paymentService.ConfirmByWebhookAsync(webhook);
            _logger.LogInformation("Webhook SePay xu ly: success={Success}, msg={Msg}", result.Success, result.Message);
            return Ok(new { success = result.Success, message = result.Message, invoiceStatus = result.InvoiceStatus });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loi xu ly webhook SePay");
            // Van tra 200 de SePay khong retry.
            return Ok(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// MOCK: gia lap tien vao cho 1 hoa don (demo). Danh dau hoa don da tra.
    /// Yeu cau dang nhap (cu dan/admin) de tranh lam dung.
    /// </summary>
    [HttpPost("mock-pay")]
    [Authorize(Roles = "Admin,QuanLy,KeToan,CuDan")]
    public async Task<IActionResult> MockPay([FromBody] MockPaymentDto dto)
    {
        try
        {
            var result = await _paymentService.ConfirmMockAsync(dto.InvoiceId);
            return Ok(new { success = result.Success, message = result.Message, invoiceStatus = result.InvoiceStatus });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}
