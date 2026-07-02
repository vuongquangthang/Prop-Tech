using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Tầng - Thông tin tầng trong tòa nhà
/// </summary>
[Table("TANG")]
public class Floor
{
    [Key]
    [Column("TANG_ID")]
    public int Id { get; set; }

    [Required]
    [Column("TOA_NHA_ID")]
    public int BuildingId { get; set; }

    [Required]
    [Column("SO_TANG")]
    public int FloorNumber { get; set; }

    [Column("IS_DELETED")]
    public bool IsDeleted { get; set; }

    // Navigation properties
    [ForeignKey("BuildingId")]
    public Building Building { get; set; } = null!;
    
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}
