using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Sử dụng dịch vụ - Theo dõi sử dụng dịch vụ của cư dân
/// </summary>
[Table("service_usages")]
public class ServiceUsage
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("residency_id")]
    public long ResidencyId { get; set; }

    [Required]
    [Column("service_id")]
    public long ServiceId { get; set; }

    [Column("resident_id")]
    public long? ResidentId { get; set; }

    [Required]
    [Column("quantity")]
    [Precision(10, 2)]
    public decimal Quantity { get; set; } = 1.00m;

    [Required]
    [Column("unit_price")]
    [Precision(18, 2)]
    public decimal UnitPrice { get; set; }

    [Column("usage_datetime")]
    public DateTime UsageDatetime { get; set; } = DateTime.UtcNow;

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("is_charged")]
    public bool IsCharged { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Residency Residency { get; set; } = null!;
    public Service Service { get; set; } = null!;
    public Resident? Resident { get; set; }
}
