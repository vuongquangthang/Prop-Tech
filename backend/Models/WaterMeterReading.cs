using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Chỉ số nước - Ghi nhận chỉ số đồng hồ nước
/// </summary>
[Table("water_meter_readings")]
public class WaterMeterReading
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("room_id")]
    public long RoomId { get; set; }

    [Required]
    [Column("reading_date")]
    public DateTime ReadingDate { get; set; }

    [Required]
    [Column("previous_reading")]
    [Precision(10, 2)]
    public decimal PreviousReading { get; set; }

    [Required]
    [Column("current_reading")]
    [Precision(10, 2)]
    public decimal CurrentReading { get; set; }

    [StringLength(500)]
    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("recorded_by")]
    public long? RecordedBy { get; set; }

    // Navigation properties
    [ForeignKey("RoomId")]
    public Room Room { get; set; } = null!;
}
