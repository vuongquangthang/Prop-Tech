using System.Security.Cryptography;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

/// <summary>
/// Sinh, gui, xac thuc OTP dat lai mat khau qua email (web chu nha).
/// Chi luu hash, co TTL, gioi han so lan thu, cooldown gui lai. Tuong tu OtpService cua TroUyTin.
/// </summary>
public interface IPasswordResetOtpService
{
    /// <summary>Phat OTP moi + gui email. Vo hieu OTP cu.</summary>
    Task IssueAsync(string email);

    /// <summary>Verify OTP. Nem InvalidOperationException neu sai/het han/qua so lan.</summary>
    Task VerifyAsync(string email, string code);
}

public class PasswordResetOtpService : IPasswordResetOtpService
{
    private const int OtpLength = 6;
    private const int TtlSeconds = 300;          // 5 phut
    private const int MaxAttempts = 5;
    private const int ResendCooldownSeconds = 60;

    private readonly ApplicationDbContext _db;
    private readonly IEmailService _emailService;
    private readonly ILogger<PasswordResetOtpService> _logger;

    public PasswordResetOtpService(
        ApplicationDbContext db,
        IEmailService emailService,
        ILogger<PasswordResetOtpService> logger)
    {
        _db = db;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task IssueAsync(string email)
    {
        email = email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;

        // Chong spam: chan gui lai neu vua gui trong khoang cooldown.
        var last = await _db.PasswordResetOtps
            .Where(o => o.Email == email)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();
        if (last != null && (now - last.CreatedAt).TotalSeconds < ResendCooldownSeconds)
        {
            var wait = ResendCooldownSeconds - (int)(now - last.CreatedAt).TotalSeconds;
            throw new InvalidOperationException($"Vui lòng chờ {wait} giây trước khi gửi lại mã.");
        }

        // Vo hieu OTP con hieu luc cu (1 email chi 1 OTP song tai 1 thoi diem).
        var actives = await _db.PasswordResetOtps
            .Where(o => o.Email == email && o.ConsumedAt == null && o.ExpiresAt > now)
            .ToListAsync();
        foreach (var a in actives) a.ConsumedAt = now;

        var code = GenerateCode();
        _db.PasswordResetOtps.Add(new PasswordResetOtp
        {
            Email = email,
            OtpHash = BCrypt.Net.BCrypt.HashPassword(code),
            ExpiresAt = now.AddSeconds(TtlSeconds),
            Attempts = 0,
            CreatedAt = now,
        });
        await _db.SaveChangesAsync();

        var minutes = Math.Max(1, TtlSeconds / 60);
        var subject = "Mã OTP đặt lại mật khẩu - LIVO Hub";
        var html = BuildBody(code, minutes);
        await _emailService.SendAsync(email, subject, html);
    }

    public async Task VerifyAsync(string email, string code)
    {
        email = email.Trim().ToLowerInvariant();
        var now = DateTime.UtcNow;

        var otp = await _db.PasswordResetOtps
            .Where(o => o.Email == email && o.ConsumedAt == null)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync()
            ?? throw new InvalidOperationException(
                "Mã OTP không tồn tại hoặc đã được sử dụng. Vui lòng yêu cầu mã mới.");

        if (otp.ExpiresAt < now)
            throw new InvalidOperationException("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");

        if (otp.Attempts >= MaxAttempts)
        {
            otp.ConsumedAt = now;
            await _db.SaveChangesAsync();
            throw new InvalidOperationException("Bạn đã nhập sai quá số lần cho phép. Vui lòng yêu cầu mã mới.");
        }

        if (!BCrypt.Net.BCrypt.Verify(code, otp.OtpHash))
        {
            otp.Attempts += 1;
            await _db.SaveChangesAsync();
            var remaining = Math.Max(0, MaxAttempts - otp.Attempts);
            throw new InvalidOperationException($"Mã OTP không đúng. Còn {remaining} lần thử.");
        }

        // Dung -> consume.
        otp.ConsumedAt = now;
        await _db.SaveChangesAsync();
    }

    private static string GenerateCode()
    {
        var sb = new System.Text.StringBuilder(OtpLength);
        for (var i = 0; i < OtpLength; i++)
            sb.Append(RandomNumberGenerator.GetInt32(10));
        return sb.ToString();
    }

    private static string BuildBody(string otp, int minutes) => $@"
        <div style=""font-family:Arial,sans-serif;max-width:480px;margin:auto"">
          <h2 style=""color:#1E4E8C"">LIVO Hub</h2>
          <p>Mã OTP để <b>đặt lại mật khẩu</b> của bạn là:</p>
          <p style=""font-size:32px;font-weight:bold;letter-spacing:6px;color:#0f2942"">{otp}</p>
          <p>Mã có hiệu lực trong <b>{minutes} phút</b>. Không chia sẻ mã này cho bất kỳ ai.</p>
          <p style=""color:#888;font-size:13px"">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        </div>";
}
