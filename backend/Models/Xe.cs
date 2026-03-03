using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Xe - Quản lý xe của cư dân
/// </summary>
[Table("XE")]
[Index(nameof(LicensePlate), IsUnique = true)]
public class Xe
{
    [Key]
    [Column("XE_ID")]
    public int Id { get; set; }

    [Required]
    [Column("CU_DAN_ID")]
    public int ResidentId { get; set; }

    [Required]
    [StringLength(20)]
    [Column("BIEN_SO")]
    public string LicensePlate { get; set; } = null!;

    [Required]
    [StringLength(50)]
    [Column("LOAI_XE")]
    public string VehicleType { get; set; } = null!; // Xe máy, Ô tô, Xe đạp, Khác

    [Required]
    [Column("NGAY_DANG_KY")]
    public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;

    [Column("NGAY_HUY")]
    public DateTime? CancellationDate { get; set; }

    // Navigation properties
    [ForeignKey("ResidentId")]
    public Resident Resident { get; set; } = null!;

    public ICollection<ChiTietSuDungDichVu> ChiTietSuDungDichVus { get; set; } = new List<ChiTietSuDungDichVu>();
}
