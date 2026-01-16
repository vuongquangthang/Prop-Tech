using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Nhật ký kiểm toán - Theo dõi hành động quan trọng
/// </summary>
[Table("audit_logs")]
public class AuditLog
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Column("user_id")]
    public long? UserId { get; set; }

    [Required]
    [StringLength(50)]
    [Column("action")]
    public string Action { get; set; } = null!; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT

    [Required]
    [StringLength(100)]
    [Column("entity_type")]
    public string EntityType { get; set; } = null!;

    [Column("entity_id")]
    public long? EntityId { get; set; }

    [Column("old_values", TypeName = "NVARCHAR(MAX)")]
    public string? OldValues { get; set; }

    [Column("new_values", TypeName = "NVARCHAR(MAX)")]
    public string? NewValues { get; set; }

    [StringLength(45)]
    [Column("ip_address")]
    public string? IpAddress { get; set; }

    [StringLength(500)]
    [Column("user_agent")]
    public string? UserAgent { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public User? User { get; set; }
}
