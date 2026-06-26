using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Tài sản - Quản lý danh mục tài sản
/// </summary>
[Table("TAI_SAN")]
public class TaiSan
{
    [Key]
    [Column("TAI_SAN_ID")]
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    [Column("TEN_TAI_SAN")]
    public string AssetName { get; set; } = null!;

    [Required]
    [StringLength(50)]
    [Column("MA_TAI_SAN")]
    public string AssetCode { get; set; } = null!;

    [Column("OWNER_USER_ID")]
    public int? OwnerUserId { get; set; }

    [Column("BUILDING_ID")]
    public int? BuildingId { get; set; }

    // Navigation properties
    [ForeignKey(nameof(OwnerUserId))]
    public User? OwnerUser { get; set; }

    [ForeignKey(nameof(BuildingId))]
    public Building? Building { get; set; }

    public ICollection<ChiTietTaiSanPhong> ChiTietTaiSanPhongs { get; set; } = new List<ChiTietTaiSanPhong>();
    public ICollection<TaiSanBuildingScope> BuildingScopes { get; set; } = new List<TaiSanBuildingScope>();
}
