using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Tiền cọc - Quản lý tiền cọc căn hộ
/// </summary>
[Table("deposits")]
public class Deposit
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("room_id")]
    public long RoomId { get; set; }

    [Required]
    [Column("amount")]
    [Precision(15, 2)]
    public decimal Amount { get; set; }

    [Column("paid_date")]
    public DateTime PaidDate { get; set; } = DateTime.UtcNow;

    [Column("refund_date")]
    public DateTime? RefundDate { get; set; }

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "HELD"; // HELD, REFUNDED, FORFEITED

    [StringLength(500)]
    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("RoomId")]
    public Room Room { get; set; } = null!;
}
