using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("LICH_SU_CHINH_SUA_HOP_DONG")]
public class ContractEditHistory
{
    [Key]
    [Column("LICH_SU_ID")]
    public long Id { get; set; }

    [Column("HOP_DONG_ID")]
    public int ContractId { get; set; }

    [Column("PHIEN_BAN")]
    public int Version { get; set; }

    [Required]
    [StringLength(500)]
    [Column("TOM_TAT")]
    public string Summary { get; set; } = null!;

    [Required]
    [Column("DU_LIEU_JSON", TypeName = "nvarchar(max)")]
    public string SnapshotJson { get; set; } = null!;

    [Column("CAP_NHAT_BOI_ID")]
    public int? ChangedByUserId { get; set; }

    [StringLength(200)]
    [Column("TEN_NGUOI_CAP_NHAT")]
    public string? ChangedByName { get; set; }

    [Column("CAP_NHAT_LUC")]
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(ContractId))]
    public HopDong Contract { get; set; } = null!;
}
