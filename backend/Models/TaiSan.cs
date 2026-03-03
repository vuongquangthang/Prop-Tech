using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Tài sản - Quản lý danh mục tài sản
/// </summary>
[Table("TAI_SAN")]
[Index(nameof(AssetCode), IsUnique = true)]
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

    // Navigation properties
    public ICollection<ChiTietTaiSanPhong> ChiTietTaiSanPhongs { get; set; } = new List<ChiTietTaiSanPhong>();
}
