using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Dịch vụ - Quản lý các dịch vụ
/// </summary>
[Table("DICH_VU")]
[Index(nameof(OwnerUserId), nameof(Name), IsUnique = true)]
public class Service
{
    [Key]
    [Column("DICH_VU_ID")]
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    [Column("TEN_DICH_VU")]
    public string Name { get; set; } = null!;

    [Required]
    [StringLength(50)]
    [Column("LOAI")]
    public string ServiceType { get; set; } = null!; // Điện, Nước, Gửi xe, Internet, Vệ sinh, Bảo vệ, Khác

    [StringLength(50)]
    [Column("DON_VI")]
    public string? Unit { get; set; }

    [Column("DON_GIA_CHUNG")]
    [Precision(18, 2)]
    public decimal? CommonUnitPrice { get; set; }

    [Column("NGAY_AP_DUNG")]
    public DateTime? EffectiveDate { get; set; }

    [Required]
    [Column("IS_ACTIVE")]
    public bool IsActive { get; set; } = true;

    [Column("OWNER_USER_ID")]
    public int? OwnerUserId { get; set; }

    // Navigation properties
    [ForeignKey("OwnerUserId")]
    public User? OwnerUser { get; set; }

    public ICollection<ChiTietSuDungDichVu> ChiTietSuDungDichVus { get; set; } = new List<ChiTietSuDungDichVu>();
    public ICollection<ChiTietHoaDon> ChiTietHoaDons { get; set; } = new List<ChiTietHoaDon>();
    public ICollection<ServicePriceHistory> PriceHistories { get; set; } = new List<ServicePriceHistory>();
}
