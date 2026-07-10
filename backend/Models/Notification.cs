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
    public int Id { get; set; }

    [Column("user_id")]
    public int? UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Column("owner_user_id")]
    public int? OwnerUserId { get; set; }

    [ForeignKey(nameof(OwnerUserId))]
    public User? OwnerUser { get; set; }

    [Column("recipient_id")]
    public int? RecipientId { get; set; }

    [StringLength(20)]
    [Column("scope_type")]
    public string? ScopeType { get; set; } // USER, ROOM, FLOOR, BUILDING, ALL

    [Column("scope_id")]
    public int? ScopeId { get; set; }

    [Required]
    [StringLength(50)]
    [Column("notification_type")]
    public string NotificationType { get; set; } = null!; // INVOICE, PAYMENT, COMPLAINT, SYSTEM, ANNOUNCEMENT

    [Required]
    [StringLength(200)]
    [Column("title")]
    public string Title { get; set; } = null!;

    [Required]
    [Column("content")]
    public string Content { get; set; } = null!;

    [StringLength(20)]
    [Column("priority")]
    public string Priority { get; set; } = "NORMAL"; // NORMAL, URGENT

    [Column("link_url")]
    public string? LinkUrl { get; set; }

    [Column("related_id")]
    public int? RelatedId { get; set; }

    [Required]
    [Column("is_read")]
    public bool IsRead { get; set; } = false;

    [Column("read_at")]
    public DateTime? ReadAt { get; set; }

    [Column("sent_at")]
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
