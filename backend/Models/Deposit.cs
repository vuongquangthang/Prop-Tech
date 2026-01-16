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
    [Column("residency_id")]
    public long ResidencyId { get; set; }

    [Required]
    [Column("room_id")]
    public long RoomId { get; set; }

    [Required]
    [Column("resident_id")]
    public long ResidentId { get; set; }

    [Required]
    [Column("amount")]
    [Precision(15, 2)]
    public decimal Amount { get; set; }

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "UNPAID"; // UNPAID, PAID, REFUNDED, FORFEITED

    [Column("paid_date")]
    public DateTime? PaidDate { get; set; }

    [Column("refund_date")]
    public DateTime? RefundDate { get; set; }

    [Column("refund_amount")]
    [Precision(15, 2)]
    public decimal? RefundAmount { get; set; }

    [Column("refund_deduction")]
    [Precision(15, 2)]
    public decimal RefundDeduction { get; set; } = 0;

    [Column("refund_reason")]
    public string? RefundReason { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    [Column("updated_by")]
    public long? UpdatedBy { get; set; }

    // Navigation properties
    public Residency Residency { get; set; } = null!;
    public Room Room { get; set; } = null!;
    public Resident Resident { get; set; } = null!;
}
