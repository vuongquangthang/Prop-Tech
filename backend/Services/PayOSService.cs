using PayOS;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;
using backend.Repositories;

namespace backend.Services;

/// <summary>Kết quả tạo link thanh toán PayOS</summary>
public record PayOSCreateResult(string CheckoutUrl, string QrCode, decimal RealAmount);

public interface IPayOSService
{
    /// <summary>
    /// Tạo link PayOS cho hóa đơn. Nếu IsTestMode=true thì gửi PayOS 5.000đ,
    /// nhưng trả về RealAmount (số tiền thực) để caller lưu vào ThanhToan.
    /// </summary>
    Task<PayOSCreateResult> CreatePaymentLinkAsync(long orderCode, int hoaDonId, string returnUrl, string cancelUrl);
    Task<WebhookData> VerifyWebhookAsync(Webhook webhookBody);
}

public class PayOSService : IPayOSService
{
    private readonly PayOSClient _client;
    private readonly IHoaDonRepository _hoaDonRepository;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PayOSService> _logger;

    public PayOSService(
        PayOSClient client,
        IHoaDonRepository hoaDonRepository,
        IConfiguration configuration,
        ILogger<PayOSService> logger)
    {
        _client = client;
        _hoaDonRepository = hoaDonRepository;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<PayOSCreateResult> CreatePaymentLinkAsync(long orderCode, int hoaDonId, string returnUrl, string cancelUrl)
    {
        // Lấy số tiền thực tế từ hóa đơn
        var invoice = await _hoaDonRepository.GetByIdAsync(hoaDonId)
            ?? throw new InvalidOperationException($"Hóa đơn #{hoaDonId} không tồn tại");

        var realAmount = invoice.TotalAmount;

        // IsTestMode: gửi PayOS 5.000đ thay vì số tiền thực để test QR
        var isTestMode = _configuration.GetValue<bool>("PayOS:IsTestMode");
        var payosAmount = isTestMode ? 5000 : (int)realAmount;

        // description: ASCII-only, tối đa 25 ký tự
        var description = $"Thanh toan HD #{hoaDonId}";

        _logger.LogInformation(
            "PayOS CreateLink: orderCode={OrderCode}, hoaDonId={HoaDonId}, realAmount={RealAmount}đ, payosAmount={PayOSAmount}đ, testMode={IsTestMode}",
            orderCode, hoaDonId, realAmount, payosAmount, isTestMode);

        var request = new CreatePaymentLinkRequest
        {
            OrderCode = orderCode,
            Amount = payosAmount,
            Description = description,
            ReturnUrl = returnUrl,
            CancelUrl = cancelUrl
        };

        var result = await _client.PaymentRequests.CreateAsync(request);
        _logger.LogInformation("PayOS link created: {CheckoutUrl}", result.CheckoutUrl);

        // Trả về RealAmount để caller (PaymentService) lưu đúng vào ThanhToan
        return new PayOSCreateResult(result.CheckoutUrl, result.QrCode ?? "", realAmount);
    }

    public async Task<WebhookData> VerifyWebhookAsync(Webhook webhookBody)
    {
        return await _client.Webhooks.VerifyAsync(webhookBody);
    }
}
