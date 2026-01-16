using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Snapshot bậc thang điện - Lưu chi tiết bậc thang tại thời điểm
/// </summary>
[Table("electricity_tier_snapshots")]
public class ElectricityTierSnapshot
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("snapshot_id")]
    public long SnapshotId { get; set; }

    [ForeignKey(nameof(SnapshotId))]
    public ElectricityPriceSnapshot Snapshot { get; set; } = null!;

    [Required]
    [Column("tier_level")]
    public int TierLevel { get; set; }

    [Required]
    [Column("from_kwh")]
    [Precision(10, 2)]
    public decimal FromKwh { get; set; }

    [Column("to_kwh")]
    [Precision(10, 2)]
    public decimal? ToKwh { get; set; }

    [Required]
    [Column("unit_price")]
    [Precision(15, 4)]
    public decimal UnitPrice { get; set; }
}
