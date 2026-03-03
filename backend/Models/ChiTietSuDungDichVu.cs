using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Chi tiết sử dụng dịch vụ - Quản lý dịch vụ mà cư dân sử dụng
/// </summary>
[Table("CHI_TIET_SU_DUNG_DICH_VU")]
public class ChiTietSuDungDichVu
{
    [Key]
    [Column("CT_SDDV_ID")]
    public long Id { get; set; }

    [Required]
    [Column("DICH_VU_ID")]
    public int ServiceId { get; set; }

    [Required]
    [Column("CU_DAN_ID")]
    public int ResidentId { get; set; }

    [Required]
    [Column("PHONG_ID")]
    public int RoomId { get; set; }

    [Column("XE_ID")]
    public int? VehicleId { get; set; } // Chỉ dùng cho dịch vụ gửi xe

    [Required]
    [Column("AP_DUNG_TU")]
    public DateTime ApplyFrom { get; set; }

    [Column("AP_DUNG_DEN")]
    public DateTime? ApplyTo { get; set; }

    [Column("OVERRIDE_DON_GIA")]
    [Precision(18, 2)]
    public decimal? OverrideUnitPrice { get; set; }

    [Column("SO_LUONG")]
    [Precision(10, 2)]
    public decimal? Quantity { get; set; } = 1;

    [Column("GHI_CHU")]
    [StringLength(500)]
    public string? Note { get; set; }

    [Required]
    [Column("CREATED_AT")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ServiceId")]
    public Service Service { get; set; } = null!;

    [ForeignKey("ResidentId")]
    public Resident Resident { get; set; } = null!;

    [ForeignKey("RoomId")]
    public Room Room { get; set; } = null!;

    [ForeignKey("VehicleId")]
    public Xe? Vehicle { get; set; }

    public ICollection<ChiSoDien> ChiSoDiens { get; set; } = new List<ChiSoDien>();
    public ICollection<ChiSoNuoc> ChiSoNuocs { get; set; } = new List<ChiSoNuoc>();
    public ICollection<ChiTietHoaDon> ChiTietHoaDons { get; set; } = new List<ChiTietHoaDon>();
}
