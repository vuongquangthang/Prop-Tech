using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// OTP đặt lại mật khẩu gửi qua email (web chủ nhà).
/// Chỉ lưu hash, có TTL, giới hạn số lần thử. Tương tự email_otps của TroUyTin.
/// </summary>
[Table("PASSWORD_RESET_OTP")]
public class PasswordResetOtp
{
    [Key]
    [Column("OTP_ID")]
    public int Id { get; set; }

    [Required]
    [StringLength(255)]
    [Column("EMAIL")]
    public string Email { get; set; } = null!;

    [Required]
    [StringLength(255)]
    [Column("OTP_HASH")]
    public string OtpHash { get; set; } = null!;

    [Column("EXPIRES_AT")]
    public DateTime ExpiresAt { get; set; }

    [Column("ATTEMPTS")]
    public int Attempts { get; set; }

    [Column("CONSUMED_AT")]
    public DateTime? ConsumedAt { get; set; }

    [Column("CREATED_AT")]
    public DateTime CreatedAt { get; set; }
}
