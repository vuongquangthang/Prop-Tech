using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// User - Tài khoản người dùng
/// </summary>
[Table("USER")]
[Index(nameof(PhoneNumber), IsUnique = true)]
public class User
{
    [Key]
    [Column("USER_ID")]
    public int Id { get; set; }

    [Required]
    [StringLength(20)]
    [Column("SO_DIEN_THOAI")]
    public string PhoneNumber { get; set; } = null!;

    [Required]
    [StringLength(500)]
    [Column("MAT_KHAU_HASH")]
    public string PasswordHash { get; set; } = null!;

    [Required]
    [StringLength(50)]
    [Column("VAI_TRO")]
    public string Role { get; set; } = "CuDan"; // Admin, QuanLy, CuDan, KeToan

    [Column("CU_DAN_ID")]
    public int? ResidentId { get; set; }

    [Required]
    [Column("IS_LOCKED")]
    public bool IsLocked { get; set; } = false;

    [Required]
    [Column("MUST_CHANGE_PASSWORD")]
    public bool MustChangePassword { get; set; } = false;

    [Column("LAST_LOGIN_AT")]
    public DateTime? LastLoginAt { get; set; }

    [StringLength(500)]
    [Column("REFRESH_TOKEN")]
    public string? RefreshToken { get; set; }

    [Column("REFRESH_TOKEN_EXPIRY_TIME")]
    public DateTime? RefreshTokenExpiryTime { get; set; }

    [StringLength(200)]
    [Column("EMAIL")]
    public string? Email { get; set; }

    [StringLength(500)]
    [Column("ADDRESS")]
    public string? Address { get; set; }

    [Column("AVATAR_URL", TypeName = "nvarchar(max)")]
    public string? AvatarUrl { get; set; }

    // Navigation properties
    [ForeignKey("ResidentId")]
    public Resident? Resident { get; set; }

    public ICollection<YeuCauSuaChua> YeuCauSuaChuas { get; set; } = new List<YeuCauSuaChua>();
    public ICollection<LichSuChat> LichSuChats { get; set; } = new List<LichSuChat>();
    public ICollection<NhatKyNhacNo> NhatKyNhacNosSentTo { get; set; } = new List<NhatKyNhacNo>();
    public ICollection<NhatKyNhacNo> NhatKyNhacNosSentBy { get; set; } = new List<NhatKyNhacNo>();
}
