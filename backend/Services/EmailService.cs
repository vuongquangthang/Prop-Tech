using System.Net;
using System.Net.Http.Headers;
using System.Net.Mail;
using System.Text;
using System.Text.Json;

namespace backend.Services;

/// <summary>
/// Gui email. Uu tien Gmail API (HTTPS) neu co GMAIL_REFRESH_TOKEN -> tranh Render chan SMTP.
/// Fallback SMTP (SmtpClient) khi moi truong khong chan cong (vd local).
/// Cau hinh doc tu bien moi truong (.env / Render env).
/// </summary>
public interface IEmailService
{
    /// <summary>Da cau hinh gui email chua (Gmail API hoac SMTP).</summary>
    bool IsConfigured { get; }

    /// <summary>Gui 1 email HTML. Nem exception neu that bai (caller tu quyet co chan hay khong).</summary>
    Task SendAsync(string toEmail, string subject, string htmlBody);
}

public class EmailService : IEmailService
{
    private const string GoogleTokenUrl = "https://oauth2.googleapis.com/token";
    private const string GmailSendUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

    private readonly ILogger<EmailService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    // SMTP
    private readonly string _host;
    private readonly int _port;
    private readonly string _username;
    private readonly string _password;
    private readonly string _fromAddress;
    private readonly string _fromName;

    // Gmail API OAuth2
    private readonly string _gmailClientId;
    private readonly string _gmailClientSecret;
    private readonly string _gmailRefreshToken;
    private readonly string _gmailSender;

    public EmailService(IConfiguration config, ILogger<EmailService> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;

        _host = config["MAIL_HOST"] ?? "smtp.gmail.com";
        _port = int.TryParse(config["MAIL_PORT"], out var p) ? p : 587;
        _username = config["MAIL_USERNAME"] ?? "";
        _password = config["MAIL_PASSWORD"] ?? "";
        _fromAddress = config["MAIL_FROM_ADDRESS"] ?? _username;
        _fromName = config["MAIL_FROM_NAME"] ?? "LIVO Hub";

        _gmailClientId = config["GMAIL_CLIENT_ID"] ?? "";
        _gmailClientSecret = config["GMAIL_CLIENT_SECRET"] ?? "";
        _gmailRefreshToken = config["GMAIL_REFRESH_TOKEN"] ?? "";
        _gmailSender = config["GMAIL_SENDER"] ?? _username;
    }

    private bool GmailApiConfigured =>
        !string.IsNullOrWhiteSpace(_gmailClientId)
        && !string.IsNullOrWhiteSpace(_gmailClientSecret)
        && !string.IsNullOrWhiteSpace(_gmailRefreshToken);

    private bool SmtpConfigured =>
        !string.IsNullOrWhiteSpace(_username) && !string.IsNullOrWhiteSpace(_password);

    public bool IsConfigured => GmailApiConfigured || SmtpConfigured;

    public async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        // 1. Gmail API (HTTPS) - Render khong chan HTTPS.
        if (GmailApiConfigured)
        {
            await SendViaGmailApiAsync(toEmail, subject, htmlBody);
            return;
        }

        // 2. SMTP (local / moi truong khong chan cong).
        if (SmtpConfigured)
        {
            await SendViaSmtpAsync(toEmail, subject, htmlBody);
            return;
        }

        // 3. Mock.
        _logger.LogWarning("[EMAIL-MOCK] Chua cau hinh Gmail API/SMTP. Bo qua gui email toi {To} (subject: {Subject})",
            toEmail, subject);
    }

    private async Task SendViaGmailApiAsync(string toEmail, string subject, string htmlBody)
    {
        var http = _httpClientFactory.CreateClient();
        http.Timeout = TimeSpan.FromSeconds(15);

        // Doi refresh token -> access token.
        var tokenForm = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = _gmailClientId,
            ["client_secret"] = _gmailClientSecret,
            ["refresh_token"] = _gmailRefreshToken,
            ["grant_type"] = "refresh_token",
        });
        var tokenRes = await http.PostAsync(GoogleTokenUrl, tokenForm);
        tokenRes.EnsureSuccessStatusCode();
        var tokenJson = await tokenRes.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(tokenJson);
        var accessToken = doc.RootElement.GetProperty("access_token").GetString();

        // Dung MIME message roi encode base64url theo yeu cau Gmail API.
        var sender = string.IsNullOrWhiteSpace(_gmailSender) ? _fromAddress : _gmailSender;
        var rawMime =
            $"From: {_fromName} <{sender}>\r\n" +
            $"To: {toEmail}\r\n" +
            $"Subject: =?UTF-8?B?{Convert.ToBase64String(Encoding.UTF8.GetBytes(subject))}?=\r\n" +
            "MIME-Version: 1.0\r\n" +
            "Content-Type: text/html; charset=UTF-8\r\n\r\n" +
            htmlBody;
        var raw = Base64UrlEncode(Encoding.UTF8.GetBytes(rawMime));

        using var sendReq = new HttpRequestMessage(HttpMethod.Post, GmailSendUrl);
        sendReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        sendReq.Content = new StringContent(
            JsonSerializer.Serialize(new { raw }), Encoding.UTF8, "application/json");
        var sendRes = await http.SendAsync(sendReq);
        sendRes.EnsureSuccessStatusCode();

        _logger.LogInformation("Da gui email toi {To} qua Gmail API (subject: {Subject})", toEmail, subject);
    }

    private async Task SendViaSmtpAsync(string toEmail, string subject, string htmlBody)
    {
        using var message = new MailMessage
        {
            From = new MailAddress(_fromAddress, _fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(toEmail);

        using var client = new SmtpClient(_host, _port)
        {
            Credentials = new NetworkCredential(_username, _password),
            EnableSsl = true,
            Timeout = 15000,
        };

        await client.SendMailAsync(message);
        _logger.LogInformation("Da gui email toi {To} qua SMTP (subject: {Subject})", toEmail, subject);
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
}
