using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Tầng - Thông tin tầng trong tòa nhà
/// </summary>
[Table("floors")]
public class Floor
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("building_id")]
    public long BuildingId { get; set; }

    [Column("floor_number")]
    public int FloorNumber { get; set; }

    [StringLength(50)]
    [Column("floor_name")]
    public string? FloorName { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("BuildingId")]
    public Building Building { get; set; } = null!;
    
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}
