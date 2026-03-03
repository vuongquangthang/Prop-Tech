using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Hợp đồng - Quản lý hợp đồng thuê phòng
/// </summary>
[Table("HOP_DONG")]
public class HopDong
{
    [Key]
    [Column("HOP_DONG_ID")]
    public int Id { get; set; }

    [Required]
    [Column("PHONG_ID")]
    public int RoomId { get; set; }

    [Required]
    [Column("NGAY_BAT_DAU")]
    public DateTime StartDate { get; set; }

    [Column("NGAY_KET_THUC_DU_KIEN")]
    public DateTime? ExpectedEndDate { get; set; }

    [Required]
    [Column("GIA_THUE_THUC_TE")]
    [Precision(18, 2)]
    public decimal ActualRentPrice { get; set; }

    [Column("TIEN_COC")]
    [Precision(18, 2)]
    public decimal? DepositAmount { get; set; }

    // Navigation properties
    [ForeignKey("RoomId")]
    public Room Room { get; set; } = null!;

    public ICollection<ChiTietO> ChiTietOs { get; set; } = new List<ChiTietO>();
    public ICollection<HoaDon> HoaDons { get; set; } = new List<HoaDon>();
    public TatToan? TatToan { get; set; }
}
