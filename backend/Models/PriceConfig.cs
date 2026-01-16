using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Cấu hình giá - Quản lý giá dịch vụ theo thời gian
/// </summary>
[Table("price_configs")]
public class PriceConfig
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [StringLength(20)]
    [Column("service_type")]
    public string ServiceType { get; set; } = null!; // WATER, ELECTRICITY, SERVICE

    [Required]
    [StringLength(20)]
    [Column("pricing_method")]
    public string PricingMethod { get; set; } = null!; // PER_PERSON, PER_UNIT, FIXED, TIERED

    [Required]
    [Column("unit_price")]
    [Precision(15, 4)]
    public decimal UnitPrice { get; set; }

    [StringLength(20)]
    [Column("unit_type")]
    public string? UnitType { get; set; }

    [Required]
    [Column("effective_date")]
    public DateTime EffectiveDate { get; set; }

    [Column("is_tiered")]
    public bool IsTiered { get; set; } = false;

    [Column("description")]
    public string? Description { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public long? CreatedBy { get; set; }
}
