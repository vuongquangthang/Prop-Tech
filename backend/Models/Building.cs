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
    [StringLength(20)]
    [Column("building_code")]
    public string BuildingCode { get; set; } = null!;

    [Required]
    [StringLength(100)]
    [Column("building_name")]
    public string BuildingName { get; set; } = null!;

    [Column("address")]
    public string? Address { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Floor> Floors { get; set; } = new List<Floor>();
}
