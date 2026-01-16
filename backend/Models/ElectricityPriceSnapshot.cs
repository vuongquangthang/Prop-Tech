using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Snapshot giá điện - Lưu lịch sử giá điện tại thời điểm
/// </summary>
[Table("electricity_price_snapshots")]
public class ElectricityPriceSnapshot
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Column("price_config_id")]
    public long? PriceConfigId { get; set; }

    [ForeignKey(nameof(PriceConfigId))]
    public PriceConfig? PriceConfig { get; set; }

    [Required]
    [Column("effective_date")]
    public DateTime EffectiveDate { get; set; }

    [Required]
    [StringLength(20)]
    [Column("service_type")]
    public string ServiceType { get; set; } = null!;

    [Required]
    [StringLength(20)]
    [Column("pricing_method")]
    public string PricingMethod { get; set; } = null!;

    [Column("unit_price")]
    [Precision(15, 4)]
    public decimal? UnitPrice { get; set; }

    [Column("is_tiered")]
    public bool IsTiered { get; set; }

    [Required]
    [Column("snapshot_datetime")]
    public DateTime SnapshotDatetime { get; set; }

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    // Navigation property
    public ICollection<ElectricityTierSnapshot> TierSnapshots { get; set; } = new List<ElectricityTierSnapshot>();
}
