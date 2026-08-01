using System.Net;
using System.Net.Mail;

namespace backend.Services;

/// <summary>Gui email qua SMTP (Gmail). Cau hinh doc tu bien moi truong MAIL_* (.env).</summary>
public interface IEmailService
{
    /// <summary>Da cau hinh SMTP day du chua (co username/password).</summary>
    bool IsConfigured { get; }

    /// <summary>Gui 1 email HTML. Nem exception neu that bai (caller tu quyet co chan hay khong).</summary>
    Task SendAsync(string toEmail, string subject, string htmlBody);
}

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly string _host;
    private readonly int _port;
    private readonly string _username;
    private readonly string _password;
    private readonly string _fromAddress;
    private readonly string _fromName;
    private readonly bool _enableSsl;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _logger = logger;
        // Doc tu bien moi truong (.env nap thanh env var). Flat key, khong nested.
        _host = config["MAIL_HOST"] ?? "smtp.gmail.com";
        _port = int.TryParse(config["MAIL_PORT"], out var p) ? p : 587;
        _username = config["MAIL_USERNAME"] ?? "";
        _password = config["MAIL_PASSWORD"] ?? "";
        _fromAddress = config["MAIL_FROM_ADDRESS"] ?? _username;
        _fromName = config["MAIL_FROM_NAME"] ?? "Prop-Tech";
        // MAIL_ENCRYPTION=tls -> STARTTLS tren port 587.
        _enableSsl = true;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_username) && !string.IsNullOrWhiteSpace(_password);

    public async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("[EMAIL-MOCK] Chua cau hinh SMTP. Bo qua gui email toi {To} (subject: {Subject})",
                toEmail, subject);
            return;
        }

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
            EnableSsl = _enableSsl,
        };

        await client.SendMailAsync(message);
        _logger.LogInformation("Da gui email toi {To} (subject: {Subject})", toEmail, subject);
    }
}
