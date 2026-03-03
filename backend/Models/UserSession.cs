using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Phiên đăng nhập - Quản lý refresh token
/// </summary>
[Table("user_sessions")]
public class UserSession
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [StringLength(500)]
    [Column("refresh_token")]
    public string RefreshToken { get; set; } = null!;

    [StringLength(255)]
    [Column("device_info")]
    public string? DeviceInfo { get; set; }

    [StringLength(45)]
    [Column("ip_address")]
    public string? IpAddress { get; set; }

    [Required]
    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("revoked_at")]
    public DateTime? RevokedAt { get; set; }

    // Navigation properties
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
