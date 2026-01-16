using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Tòa nhà - Thông tin tòa nhà trong khu chung cư
/// </summary>
[Table("buildings")]
public class Building
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [StringLength(10)]
    [Column("building_code")]
    public string Code { get; set; } = null!;

    [Required]
    [StringLength(100)]
    [Column("building_name")]
    public string Name { get; set; } = null!;

    [StringLength(255)]
    [Column("address")]
    public string? Address { get; set; }

    [Column("total_floors")]
    public int TotalFloors { get; set; }

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, INACTIVE

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    [Column("updated_by")]
    public long? UpdatedBy { get; set; }

    // Navigation properties
    public ICollection<Floor> Floors { get; set; } = new List<Floor>();
}
