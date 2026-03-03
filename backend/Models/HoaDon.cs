using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Hóa đơn - Quản lý hóa đơn hàng tháng
/// </summary>
[Table("HOA_DON")]
[Index(nameof(ContractId), nameof(Month), nameof(Year), IsUnique = true)]
public class HoaDon
{
    [Key]
    [Column("HOA_DON_ID")]
    public int Id { get; set; }

    [Required]
    [Column("HOP_DONG_ID")]
    public int ContractId { get; set; }

    [Required]
    [Column("THANG")]
    [Range(1, 12)]
    public byte Month { get; set; }

    [Required]
    [Column("NAM")]
    [Range(2000, 9999)]
    public short Year { get; set; }

    [Required]
    [Column("TONG_TIEN")]
    [Precision(18, 2)]
    public decimal TotalAmount { get; set; } = 0;

    [Required]
    [StringLength(50)]
    [Column("TRANG_THAI")]
    public string Status { get; set; } = "Chưa thanh toán"; // Nháp, Đã phê duyệt, Chưa thanh toán, Đã thanh toán một phần, Đã thanh toán, Quá hạn, Bị từ chối

    [Column("QR_CODE_URL")]
    [StringLength(500)]
    public string? QrCodeUrl { get; set; }

    [Column("DUE_DATE")]
    public DateTime? DueDate { get; set; }

    [Column("APPROVED_BY")]
    public int? ApprovedBy { get; set; }

    [Column("APPROVED_AT")]
    public DateTime? ApprovedAt { get; set; }

    [Column("REJECTED_REASON")]
    [StringLength(500)]
    public string? RejectedReason { get; set; }

    // Navigation properties
    [ForeignKey("ContractId")]
    public HopDong HopDong { get; set; } = null!;

    [ForeignKey("ApprovedBy")]
    public User? ApprovedByUser { get; set; }

    public ICollection<ChiTietHoaDon> ChiTietHoaDons { get; set; } = new List<ChiTietHoaDon>();
    public ICollection<ThanhToan> ThanhToans { get; set; } = new List<ThanhToan>();
    public ICollection<NhatKyNhacNo> NhatKyNhacNos { get; set; } = new List<NhatKyNhacNo>();
}
