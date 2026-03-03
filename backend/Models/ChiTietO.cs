using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Chi tiết ở - Thông tin cư dân ở trong hợp đồng
/// </summary>
[Table("CHI_TIET_O")]
public class ChiTietO
{
    [Required]
    [Column("HOP_DONG_ID")]
    public int ContractId { get; set; }

    [Required]
    [Column("CU_DAN_ID")]
    public int ResidentId { get; set; }

    [Required]
    [StringLength(50)]
    [Column("VAI_TRO_O")]
    public string ResidencyRole { get; set; } = "Người thuê"; // Người thuê chính, Người ở cùng, Khác

    [Required]
    [Column("TU_NGAY")]
    public DateTime FromDate { get; set; }

    [Column("DEN_NGAY")]
    public DateTime? ToDate { get; set; }

    // Navigation properties
    [ForeignKey("ContractId")]
    public HopDong HopDong { get; set; } = null!;

    [ForeignKey("ResidentId")]
    public Resident Resident { get; set; } = null!;
}
