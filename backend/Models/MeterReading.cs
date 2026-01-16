using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Chỉ số điện - Ghi nhận chỉ số đồng hồ điện
/// </summary>
[Table("meter_readings")]
public class MeterReading
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("room_id")]
    public long RoomId { get; set; }

    [ForeignKey(nameof(RoomId))]
    public Room Room { get; set; } = null!;

    [Required]
    [Column("reading_month")]
    public DateTime ReadingMonth { get; set; }

    [Required]
    [Column("previous_reading")]
    [Precision(10, 2)]
    public decimal PreviousReading { get; set; }

    [Required]
    [Column("current_reading")]
    [Precision(10, 2)]
    public decimal CurrentReading { get; set; }

    [Column("consumption")]
    [Precision(10, 2)]
    public decimal Consumption { get; set; }

    [Column("is_anomaly")]
    public bool IsAnomaly { get; set; } = false;

    [Column("anomaly_note")]
    public string? AnomalyNote { get; set; }

    [StringLength(500)]
    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("recorded_by")]
    public long? RecordedBy { get; set; }
}
