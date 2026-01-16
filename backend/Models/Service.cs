using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Dịch vụ - Quản lý các dịch vụ (vệ sinh, bảo vệ, xe, v.v.)
/// </summary>
[Table("services")]
public class Service
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [StringLength(100)]
    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [Column("unit_price")]
    [Precision(18, 2)]
    public decimal UnitPrice { get; set; } = 0;

    [StringLength(50)]
    [Column("unit")]
    public string? Unit { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<ServiceUsage> ServiceUsages { get; set; } = new List<ServiceUsage>();
}
