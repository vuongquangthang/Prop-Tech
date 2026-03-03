using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Tầng - Thông tin tầng trong tòa nhà
/// </summary>
[Table("TANG")]
[Index(nameof(BuildingId), nameof(FloorNumber), IsUnique = true)]
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

    // Navigation properties
    [ForeignKey("BuildingId")]
    public Building Building { get; set; } = null!;
    
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}
