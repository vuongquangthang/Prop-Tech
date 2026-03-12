using System.Net.Http.Json;
using Microsoft.Extensions.Caching.Memory;

namespace backend.Services;

public record VietQRBankInfo(string Bin, string ShortName, string Name, string Logo);

public interface IVietQRService
{
    /// <summary>Lấy thông tin ngân hàng từ mã BIN (có cache 24h)</summary>
    Task<VietQRBankInfo?> GetBankInfoByBinAsync(string bin);

    /// <summary>Tạo ảnh QR base64 chuẩn VietQR (EMV, có logo ngân hàng)</summary>
    Task<string> GenerateQRDataUrlAsync(string accountNo, string accountName, string bin, int amount, string addInfo);
}

public class VietQRService : IVietQRService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _cache;
    private readonly ILogger<VietQRService> _logger;

    private const string BankListCacheKey = "vietqr:banks";
    private const string BanksUrl         = "https://api.vietqr.io/v2/banks";
    private const string GenerateUrl      = "https://api.vietqr.io/v2/generate";

    public VietQRService(IHttpClientFactory httpClientFactory, IMemoryCache cache, ILogger<VietQRService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _cache = cache;
        _logger = logger;
    }

    public async Task<VietQRBankInfo?> GetBankInfoByBinAsync(string bin)
    {
        if (string.IsNullOrEmpty(bin)) return null;
        var banks = await GetBankListAsync();
        return banks.FirstOrDefault(b => b.Bin == bin);
    }

    private async Task<List<VietQRBankInfo>> GetBankListAsync()
    {
        if (_cache.TryGetValue(BankListCacheKey, out List<VietQRBankInfo>? cached))
            return cached!;

        try
        {
            var client   = _httpClientFactory.CreateClient();
            var response = await client.GetFromJsonAsync<VietQRBankListResponse>(BanksUrl);

            var banks = (response?.Data ?? [])
                .Where(d => !string.IsNullOrEmpty(d.Bin))
                .Select(d => new VietQRBankInfo(d.Bin, d.ShortName, d.Name, d.Logo))
                .ToList();

            _cache.Set(BankListCacheKey, banks, TimeSpan.FromHours(24));
            _logger.LogInformation("VietQR: cached {Count} banks", banks.Count);
            return banks;
        }
        catch (Exception ex)
        {
            _logger.LogWarning("VietQR bank list fetch failed: {Error}", ex.Message);
            return [];
        }
    }

    public async Task<string> GenerateQRDataUrlAsync(string accountNo, string accountName, string bin, int amount, string addInfo)
    {
        if (string.IsNullOrEmpty(accountNo) || string.IsNullOrEmpty(bin)) return "";

        try
        {
            var client = _httpClientFactory.CreateClient();
            var body   = new
            {
                accountNo,
                accountName,
                acqId    = bin,
                amount,
                addInfo,
                format   = "text",
                template = "compact"
            };

            var resp = await client.PostAsJsonAsync(GenerateUrl, body);
            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogWarning("VietQR generate returned {Status}", resp.StatusCode);
                return "";
            }

            var result = await resp.Content.ReadFromJsonAsync<VietQRGenerateResponse>();
            return result?.Data?.QrDataURL ?? "";
        }
        catch (Exception ex)
        {
            _logger.LogWarning("VietQR generate QR failed: {Error}", ex.Message);
            return "";
        }
    }

    // ─── Internal JSON DTOs ──────────────────────────────────────────────────

    private class VietQRBankListResponse
    {
        public List<VietQRBankData> Data { get; set; } = [];
    }

    private class VietQRBankData
    {
        public string Bin       { get; set; } = "";
        public string ShortName { get; set; } = "";
        public string Name      { get; set; } = "";
        public string Logo      { get; set; } = "";
    }

    private class VietQRGenerateResponse
    {
        public VietQRGenerateData? Data { get; set; }
    }

    private class VietQRGenerateData
    {
        public string QrDataURL { get; set; } = "";
    }
}
