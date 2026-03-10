using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Lịch sử thay đổi đơn giá dịch vụ
/// </summary>
[Table("LICH_SU_GIA_DICH_VU")]
public class ServicePriceHistory
{
    [Key]
    [Column("ID")]
    public int Id { get; set; }

    [Required]
    [Column("DICH_VU_ID")]
    public int ServiceId { get; set; }

    [Required]
    [Column("GIA_CU")]
    [Precision(18, 2)]
    public decimal OldPrice { get; set; }

    [Required]
    [Column("GIA_MOI")]
    [Precision(18, 2)]
    public decimal NewPrice { get; set; }

    [Required]
    [Column("NGAY_AP_DUNG")]
    public DateTime EffectiveDate { get; set; }

    [Column("LY_DO")]
    [StringLength(500)]
    public string? Reason { get; set; }

    [Required]
    [Column("NGAY_THAY_DOI")]
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey("ServiceId")]
    public Service? Service { get; set; }
}
