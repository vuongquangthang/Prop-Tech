using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Thông báo - Gửi thông báo cho cư dân
/// </summary>
[Table("notifications")]
public class Notification
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("user_id")]
    public long UserId { get; set; }

    [Required]
    [StringLength(50)]
    [Column("type")]
    public string Type { get; set; } = null!; // INVOICE, PAYMENT, COMPLAINT, SYSTEM, ANNOUNCEMENT

    [Required]
    [StringLength(200)]
    [Column("title")]
    public string Title { get; set; } = null!;

    [Required]
    [Column("content", TypeName = "NVARCHAR(MAX)")]
    public string Content { get; set; } = null!;

    [Column("related_id")]
    public long? RelatedId { get; set; }

    [Required]
    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Column("read_at")]
    public DateTime? ReadAt { get; set; }

    [Column("sent_at")]
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
