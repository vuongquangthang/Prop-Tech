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
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    [Column("service_name")]
    public string ServiceName { get; set; } = null!; // ELECTRICITY, WATER, MANAGEMENT, INTERNET, PARKING

    [Required]
    [Column("unit_price")]
    [Precision(15, 2)]
    public decimal UnitPrice { get; set; }

    [Required]
    [StringLength(20)]
    [Column("unit")]
    public string Unit { get; set; } = null!; // VND/kWh, VND/m3, VND/month, VND/room

    [Column("effective_from")]
    public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;

    [Column("effective_to")]
    public DateTime? EffectiveTo { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public long? CreatedBy { get; set; }
}
