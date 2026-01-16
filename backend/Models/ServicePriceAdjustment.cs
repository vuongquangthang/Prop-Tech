using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Điều chỉnh giá dịch vụ - Theo dõi lịch sử thay đổi giá
/// </summary>
[Table("service_price_adjustments")]
public class ServicePriceAdjustment
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("service_id")]
    public long ServiceId { get; set; }

    [ForeignKey(nameof(ServiceId))]
    public Service Service { get; set; } = null!;

    [Required]
    [Column("old_price")]
    [Precision(18, 2)]
    public decimal OldPrice { get; set; }

    [Required]
    [Column("new_price")]
    [Precision(18, 2)]
    public decimal NewPrice { get; set; }

    [StringLength(255)]
    [Column("adjustment_reason")]
    public string? AdjustmentReason { get; set; }

    [StringLength(100)]
    [Column("adjusted_by")]
    public string? AdjustedBy { get; set; }

    [Column("adjusted_at")]
    public DateTime AdjustedAt { get; set; } = DateTime.UtcNow;
}
