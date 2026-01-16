using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Bậc thang điện - Định nghĩa giá điện theo bậc tiêu thụ
/// </summary>
[Table("electricity_tiers")]
public class ElectricityTier
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("tier_number")]
    public int TierNumber { get; set; }

    [Required]
    [Column("from_kwh")]
    [Precision(10, 2)]
    public decimal FromKwh { get; set; }

    [Column("to_kwh")]
    [Precision(10, 2)]
    public decimal? ToKwh { get; set; }

    [Required]
    [Column("price_per_kwh")]
    [Precision(15, 2)]
    public decimal PricePerKwh { get; set; }

    [Column("effective_from")]
    public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;

    [Column("effective_to")]
    public DateTime? EffectiveTo { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
