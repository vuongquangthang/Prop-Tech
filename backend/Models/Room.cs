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
    [StringLength(20)]
    [Column("room_code")]
    public string RoomCode { get; set; } = null!;

    [Required]
    [StringLength(20)]
    [Column("room_number")]
    public string RoomNumber { get; set; } = null!;

    [Required]
    [StringLength(20)]
    [Column("room_type")]
    public string RoomType { get; set; } = "FOR_RENT"; // FOR_RENT, FOR_SALE, SOLD

    [Column("monthly_rent")]
    [Precision(15, 2)]
    public decimal MonthlyRent { get; set; } = 0;

    [Column("sale_price")]
    [Precision(15, 2)]
    public decimal SalePrice { get; set; } = 0;

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "VACANT"; // VACANT, OCCUPIED, INACTIVE

    [Column("area_sqm")]
    [Precision(10, 2)]
    public decimal? AreaSqm { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

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
