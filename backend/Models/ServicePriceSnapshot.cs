using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Snapshot giá dịch vụ - Lưu giá tại thời điểm snapshot
/// </summary>
[Table("service_price_snapshots")]
public class ServicePriceSnapshot
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("service_id")]
    public long ServiceId { get; set; }

    [ForeignKey(nameof(ServiceId))]
    public Service Service { get; set; } = null!;

    [Required]
    [Column("previous_price")]
    [Precision(18, 2)]
    public decimal PreviousPrice { get; set; }

    [Column("snapshot_datetime")]
    public DateTime SnapshotDatetime { get; set; } = DateTime.UtcNow;

    [Column("notes")]
    public string? Notes { get; set; }
}
