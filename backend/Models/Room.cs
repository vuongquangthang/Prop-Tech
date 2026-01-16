using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Căn hộ - Thông tin căn hộ
/// </summary>
[Table("rooms")]
public class Room
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("floor_id")]
    public long FloorId { get; set; }

    [Required]
    [StringLength(10)]
    [Column("room_number")]
    public string RoomNumber { get; set; } = null!;

    [Required]
    [StringLength(50)]
    [Column("room_type")]
    public string RoomType { get; set; } = "STANDARD"; // STUDIO, STANDARD, DELUXE, PENTHOUSE

    [Column("area_m2")]
    [Precision(10, 2)]
    public decimal Area { get; set; }

    [Column("bedrooms")]
    public int Bedrooms { get; set; } = 1;

    [Column("bathrooms")]
    public int Bathrooms { get; set; } = 1;

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "AVAILABLE"; // AVAILABLE, OCCUPIED, MAINTENANCE

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    [Column("updated_by")]
    public long? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("FloorId")]
    public Floor Floor { get; set; } = null!;
    
    public ICollection<Residency> Residencies { get; set; } = new List<Residency>();
    public ICollection<Deposit> Deposits { get; set; } = new List<Deposit>();
    public ICollection<WaterMeterReading> WaterMeterReadings { get; set; } = new List<WaterMeterReading>();
    public ICollection<MeterReading> MeterReadings { get; set; } = new List<MeterReading>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<Complaint> Complaints { get; set; } = new List<Complaint>();
}
