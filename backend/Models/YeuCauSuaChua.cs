using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Yêu cầu sửa chữa - Quản lý yêu cầu sửa chữa từ cư dân
/// </summary>
[Table("YEU_CAU_SUA_CHUA")]
public class YeuCauSuaChua
{
    [Key]
    [Column("YEU_CAU_ID")]
    public int Id { get; set; }

    [Required]
    [Column("PHONG_ID")]
    public int RoomId { get; set; }

    [Required]
    [Column("USER_ID")]
    public int UserId { get; set; }

    [Required]
    [StringLength(100)]
    [Column("LOAI_SU_CO")]
    public string IssueType { get; set; } = null!;

    [Column("MO_TA")]
    [StringLength(1000)]
    public string? Description { get; set; }

    [Column("MEDIA_URL")]
    [StringLength(500)]
    public string? MediaUrl { get; set; }

    [Required]
    [StringLength(50)]
    [Column("TRANG_THAI")]
    public string Status { get; set; } = "Chờ xử lý"; // Chờ xử lý, Đang xử lý, Hoàn thành, Từ chối

    [Column("GHI_CHU_ADMIN")]
    [StringLength(1000)]
    public string? AdminNote { get; set; }

    [Column("COMPLETION_IMAGE_URL")]
    [StringLength(500)]
    public string? CompletionImageUrl { get; set; }

    [Required]
    [Column("CREATED_AT")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("CLOSED_AT")]
    public DateTime? ClosedAt { get; set; }

    // Navigation properties
    [ForeignKey("RoomId")]
    public Room Room { get; set; } = null!;

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
