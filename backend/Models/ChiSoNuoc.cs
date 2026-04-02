using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Chỉ số nước - Quản lý chỉ số công tơ nước
/// </summary>
[Table("CHI_SO_NUOC")]
[Index(nameof(ServiceUsageDetailId), nameof(Month), nameof(Year), IsUnique = true)]
public class ChiSoNuoc
{
    [Key]
    [Column("CHI_SO_NUOC_ID")]
    public int Id { get; set; }

    [Required]
    [Column("CT_SDDV_ID")]
    public long ServiceUsageDetailId { get; set; }

    [Required]
    [Column("KY_THANG")]
    [Range(1, 12)]
    public byte Month { get; set; }

    [Required]
    [Column("KY_NAM")]
    [Range(2000, 9999)]
    public short Year { get; set; }

    [Required]
    [Column("CHI_SO_MOI")]
    [Precision(18, 2)]
    public decimal NewReading { get; set; }

    [Required]
    [Column("IS_ANOMALY")]
    public bool IsAnomaly { get; set; }

    [Column("ANOMALY_NOTE")]
    [StringLength(500)]
    public string? AnomalyNote { get; set; }

    [Column("ANH_DONG_HO_URL")]
    [StringLength(500)]
    public string? MeterImageUrl { get; set; }

    [Required]
    [Column("CREATED_AT")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("CREATED_BY")]
    public int? CreatedBy { get; set; }

    // Navigation properties
    [ForeignKey("ServiceUsageDetailId")]
    public ChiTietSuDungDichVu ServiceUsageDetail { get; set; } = null!;

    [ForeignKey("CreatedBy")]
    public User? CreatedByUser { get; set; }
}
