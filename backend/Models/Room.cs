using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Phòng - Thông tin phòng
/// </summary>
[Table("PHONG")]
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

    [Column("MO_TA")]
    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    [StringLength(50)]
    [Column("TRANG_THAI")]
    public string Status { get; set; } = "Trống"; // Trống, Đã thuê, Bảo trì, Khác

    [Required]
    [StringLength(20)]
    [Column("LOAI_PHONG")]
    public string RoomType { get; set; } = "single"; // single, apartment

    [Column("CO_VE_SINH_KHEP_KIN")]
    public bool HasPrivateBathroom { get; set; }

    [Column("SO_PHONG_KHACH")]
    public int? LivingRoomCount { get; set; }

    [Column("SO_PHONG_NGU")]
    public int? BedroomCount { get; set; }

    [Column("SO_PHONG_BEP")]
    public int? KitchenCount { get; set; }

    [Column("SO_PHONG_VE_SINH")]
    public int? BathroomCount { get; set; }

    [Column("ANH_PHONG_JSON", TypeName = "nvarchar(max)")]
    public string ImageUrlsJson { get; set; } = "[]";

    [Column("TIEN_NGHI_JSON", TypeName = "nvarchar(max)")]
    public string AmenitiesJson { get; set; } = "[]";

    [Column("DICH_VU_JSON", TypeName = "nvarchar(max)")]
    public string ServiceIdsJson { get; set; } = "[]";

    [Column("GIA_DICH_VU_JSON", TypeName = "nvarchar(max)")]
    public string ServicePricesJson { get; set; } = "[]";

    [StringLength(500)]
    [Column("DIA_CHI_PHONG")]
    public string? Address { get; set; }

    [Column("VI_DO")]
    public double? Latitude { get; set; }

    [Column("KINH_DO")]
    public double? Longitude { get; set; }

    [StringLength(500)]
    [Column("DIA_CHI_CHUAN_HOA")]
    public string? NormalizedAddress { get; set; }

    [StringLength(255)]
    [Column("GOONG_PLACE_ID")]
    public string? GoongPlaceId { get; set; }

    [StringLength(50)]
    [Column("NGUON_VI_TRI")]
    public string? LocationSource { get; set; }

    [StringLength(50)]
    [Column("DO_CHINH_XAC_VI_TRI")]
    public string? LocationAccuracy { get; set; }

    [Column("XAC_NHAN_VI_TRI_LUC")]
    public DateTime? LocationVerifiedAt { get; set; }

    [Column("BAN_KINH_QUET_VI_TRI_M")]
    public int? ManualScanRadiusMeters { get; set; }

    // Navigation properties
    [ForeignKey("FloorId")]
    public Floor Floor { get; set; } = null!;
    
    public ICollection<HopDong> HopDongs { get; set; } = new List<HopDong>();
    public ICollection<ChiTietSuDungDichVu> ChiTietSuDungDichVus { get; set; } = new List<ChiTietSuDungDichVu>();
    public ICollection<ChiTietTaiSanPhong> ChiTietTaiSanPhongs { get; set; } = new List<ChiTietTaiSanPhong>();
    public ICollection<YeuCauSuaChua> YeuCauSuaChuas { get; set; } = new List<YeuCauSuaChua>();
}
