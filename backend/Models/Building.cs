using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Tòa nhà - Thông tin tòa nhà trong khu chung cư
/// </summary>
[Table("TOA_NHA")]
[Index(nameof(OwnerUserId), nameof(BuildingName), IsUnique = true)]
public class Building
{
    [Key]
    [Column("TOA_NHA_ID")]
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    [Column("TEN_TOA_NHA")]
    public string BuildingName { get; set; } = null!;

    [Required]
    [StringLength(500)]
    [Column("DIA_CHI")]
    public string Address { get; set; } = null!;

    [Required]
    [Column("SO_TANG")]
    public int NumberOfFloors { get; set; }

    [Column("MO_TA")]
    [StringLength(1000)]
    public string? Description { get; set; }

    [Column("OWNER_USER_ID")]
    public int? OwnerUserId { get; set; }

    // Toa do dia chi toa nha (geocode + keo ghim luc tao/sua). Dung cho ban do public.
    [Column("VI_DO")]
    public double? Latitude { get; set; }

    [Column("KINH_DO")]
    public double? Longitude { get; set; }

    // Navigation properties
    [ForeignKey("OwnerUserId")]
    public User? OwnerUser { get; set; }

    public ICollection<Floor> Floors { get; set; } = new List<Floor>();
}
