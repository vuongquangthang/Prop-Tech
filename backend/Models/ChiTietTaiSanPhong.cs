using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Chi tiết tài sản phòng - Quản lý tài sản trong từng phòng
/// </summary>
[Table("CHI_TIET_TAI_SAN_PHONG")]
public class ChiTietTaiSanPhong
{
    [Required]
    [Column("PHONG_ID")]
    public int RoomId { get; set; }

    [Required]
    [Column("TAI_SAN_ID")]
    public int AssetId { get; set; }

    [Required]
    [Column("SO_LUONG")]
    public int Quantity { get; set; } = 1;

    [Column("TINH_TRANG")]
    [StringLength(50)]
    public string? Condition { get; set; } // Tốt, Hỏng, Bảo trì

    [Column("GHI_CHU")]
    [StringLength(500)]
    public string? Note { get; set; }

    // Navigation properties
    [ForeignKey("RoomId")]
    public Room Room { get; set; } = null!;

    [ForeignKey("AssetId")]
    public TaiSan TaiSan { get; set; } = null!;
}
