using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// IP bị chặn - Quản lý blacklist IP
/// </summary>
[Table("blocked_ips")]
public class BlockedIp
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [StringLength(45)]
    [Column("ip_address")]
    public string IpAddress { get; set; } = null!;

    [Required]
    [StringLength(500)]
    [Column("reason")]
    public string Reason { get; set; } = null!;

    [Column("blocked_at")]
    public DateTime BlockedAt { get; set; } = DateTime.UtcNow;

    [Column("expires_at")]
    public DateTime? ExpiresAt { get; set; }

    [Column("blocked_by")]
    public long? BlockedBy { get; set; }

    [Required]
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
