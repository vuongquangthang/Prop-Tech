using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Chi tiết hóa đơn - Chi tiết từng khoản trong hóa đơn
/// </summary>
[Table("CHI_TIET_HOA_DON")]
public class ChiTietHoaDon
{
    [Key]
    [Column("CHI_TIET_ID")]
    public long Id { get; set; }

    [Required]
    [Column("HOA_DON_ID")]
    public int InvoiceId { get; set; }

    [Column("CT_SDDV_ID")]
    public long? ServiceUsageDetailId { get; set; } // Nullable khi dòng này là tiền phòng hoặc khoản phát sinh/khấu trừ

    [Required]
    [StringLength(50)]
    [Column("LOAI_KHOAN")]
    public string ItemType { get; set; } = null!; // TienPhong, Dien, Nuoc, DichVu, PhatSinh, KhauTru

    [Column("DICH_VU_ID")]
    public int? ServiceId { get; set; }

    [Column("SO_LUONG")]
    [Precision(18, 2)]
    public decimal? Quantity { get; set; }

    [Column("DON_GIA")]
    [Precision(18, 2)]
    public decimal? UnitPrice { get; set; }

    [Column("MO_TA")]
    [StringLength(500)]
    public string? Description { get; set; }

    // Navigation properties
    [ForeignKey("InvoiceId")]
    public HoaDon HoaDon { get; set; } = null!;

    [ForeignKey("ServiceUsageDetailId")]
    public ChiTietSuDungDichVu? ServiceUsageDetail { get; set; }

    [ForeignKey("ServiceId")]
    public Service? Service { get; set; }
}
