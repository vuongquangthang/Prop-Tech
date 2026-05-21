using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("BAI_DANG_TIM_PHONG")]
public class BaiDangTimPhong
{
    [Key]
    [Column("BAI_DANG_ID")]
    public int Id { get; set; }

    [Required]
    [Column("PHONG_ID")]
    public int RoomId { get; set; }

    [Required]
    [StringLength(50)]
    [Column("MA_PHONG")]
    public string RoomCode { get; set; } = null!;

    [Required]
    [StringLength(200)]
    [Column("TEN_TOA_NHA")]
    public string BuildingName { get; set; } = null!;

    [Column("SO_TANG")]
    public int FloorNumber { get; set; }

    [Column("DIEN_TICH")]
    [Precision(10, 2)]
    public decimal? Area { get; set; }

    [Column("SO_NGUOI_TOI_DA")]
    public int? MaxOccupants { get; set; }

    [Column("SO_NGUOI_DANG_O")]
    public int? CurrentOccupants { get; set; }

    [Required]
    [StringLength(300)]
    [Column("TIEU_DE")]
    public string Title { get; set; } = null!;

    [Column("GIA_THUE")]
    [Precision(18, 2)]
    public decimal BaseRentPrice { get; set; }

    [Column("NGAY_DANG")]
    public DateTime PostDate { get; set; }

    [Column("NGAY_TAO")]
    public DateTime CreatedAt { get; set; }

    [Column("LUOT_XEM")]
    public int Views { get; set; }

    [Column("TIN_NHAN")]
    public int Messages { get; set; }

    [Column("IS_LOCKED")]
    public bool IsLocked { get; set; }

    [Required]
    [StringLength(50)]
    [Column("TRANG_THAI_BAI_DANG")]
    public string Status { get; set; } = "active";

    [Required]
    [StringLength(50)]
    [Column("TRANG_THAI_PHONG")]
    public string RoomStatus { get; set; } = null!;

    [Required]
    [StringLength(20)]
    [Column("KIEU_VAO_O")]
    public string MoveInType { get; set; } = null!;

    [Column("NGAY_CO_THE_VAO_O")]
    public DateTime? MoveInDate { get; set; }

    [Column("CO_VUNG_NGAP_LUT")]
    public bool FloodProne { get; set; }

    [Column("YEU_CAU_CHU_NHA")]
    public string? LandlordRequirements { get; set; }

    [Required]
    [StringLength(20)]
    [Column("KIEU_LIEN_HE")]
    public string ContactType { get; set; } = null!;

    [Required]
    [StringLength(200)]
    [Column("TEN_LIEN_HE")]
    public string ContactName { get; set; } = null!;

    [Required]
    [StringLength(20)]
    [Column("SO_DIEN_THOAI")]
    public string ContactPhone { get; set; } = null!;

    [Required]
    [Column("DICH_VU_JSON")]
    public string ServicePricesJson { get; set; } = "[]";

    [Required]
    [Column("ANH_JSON")]
    public string ImageUrlsJson { get; set; } = "[]";

    [Column("TIEN_NGHI_JSON")]
    public string AmenitiesJson { get; set; } = "[]";

    [StringLength(1000)]
    [Column("ANH_BIA_URL")]
    public string? CoverImageUrl { get; set; }

    [Column("TAO_BOI_ID")]
    public int? CreatedByUserId { get; set; }

    [ForeignKey(nameof(RoomId))]
    public Room? Room { get; set; }

    [ForeignKey(nameof(CreatedByUserId))]
    public User? CreatedByUser { get; set; }
}
