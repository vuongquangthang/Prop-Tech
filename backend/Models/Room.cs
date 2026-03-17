using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Phòng - Thông tin phòng
/// </summary>
[Table("PHONG")]
[Index(nameof(RoomCode), IsUnique = true)]
public class Room
{
    [Key]
    [Column("PHONG_ID")]
    public int Id { get; set; }

    [Required]
    [Column("TANG_ID")]
    public int FloorId { get; set; }

    [Required]
    [StringLength(50)]
    [Column("MA_PHONG")]
    public string RoomCode { get; set; } = null!;

    [Column("DIEN_TICH")]
    [Precision(10, 2)]
    public decimal? Area { get; set; }

    [Column("SO_NGUOI_TOI_DA")]
    public int? MaxOccupants { get; set; }

    [Column("DON_GIA_THUE_MAC_DINH")]
    [Precision(18, 2)]
    public decimal? DefaultRentPrice { get; set; }

    [Required]
    [StringLength(50)]
    [Column("TRANG_THAI")]
    public string Status { get; set; } = "Trống"; // Trống, Đã thuê, Bảo trì, Khác

    // Navigation properties
    [ForeignKey("FloorId")]
    public Floor Floor { get; set; } = null!;
    
    public ICollection<HopDong> HopDongs { get; set; } = new List<HopDong>();
    public ICollection<ChiTietSuDungDichVu> ChiTietSuDungDichVus { get; set; } = new List<ChiTietSuDungDichVu>();
    public ICollection<ChiTietTaiSanPhong> ChiTietTaiSanPhongs { get; set; } = new List<ChiTietTaiSanPhong>();
    public ICollection<YeuCauSuaChua> YeuCauSuaChuas { get; set; } = new List<YeuCauSuaChua>();
}
