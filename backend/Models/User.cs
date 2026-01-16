using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Tài khoản người dùng - Quản lý xác thực và phân quyền
/// </summary>
[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [StringLength(15)]
    [Column("phone_number")]
    public string PhoneNumber { get; set; } = null!;

    [Required]
    [StringLength(255)]
    [Column("password_hash")]
    public string PasswordHash { get; set; } = null!;

    [Required]
    [StringLength(20)]
    [Column("role")]
    public string Role { get; set; } = "RESIDENT"; // MANAGER, RESIDENT

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, LOCKED

    [StringLength(100)]
    [Column("full_name")]
    public string? FullName { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    [Column("updated_by")]
    public long? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<UserSession> UserSessions { get; set; } = new List<UserSession>();
    public ICollection<Resident> Residents { get; set; } = new List<Resident>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
