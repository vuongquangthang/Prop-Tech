using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Cư dân - Thông tin cư dân
/// </summary>
[Table("CU_DAN")]
[Index(nameof(IdCardNumber), IsUnique = true)]
public class Resident
{
    [Key]
    [Column("CU_DAN_ID")]
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    [Column("HO_TEN")]
    public string FullName { get; set; } = null!;

    [StringLength(20)]
    [Column("SO_DIEN_THOAI")]
    public string? PhoneNumber { get; set; }

    [StringLength(20)]
    [Column("SO_CCCD")]
    public string? IdCardNumber { get; set; }

    [StringLength(300)]
    [Column("QUE_QUAN")]
    public string? Hometown { get; set; }

    [StringLength(500)]
    [Column("CCCD_FRONT_URL")]
    public string? IdCardFrontUrl { get; set; }

    [StringLength(500)]
    [Column("CCCD_BACK_URL")]
    public string? IdCardBackUrl { get; set; }

    // Navigation properties
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<ChiTietO> ChiTietOs { get; set; } = new List<ChiTietO>();
    public ICollection<Xe> Xes { get; set; } = new List<Xe>();
    public ICollection<ChiTietSuDungDichVu> ChiTietSuDungDichVus { get; set; } = new List<ChiTietSuDungDichVu>();
}

