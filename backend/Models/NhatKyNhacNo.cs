using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Nhật ký nhắc nợ - Quản lý lịch sử nhắc nợ tự động
/// </summary>
[Table("NHAT_KY_NHAC_NO")]
public class NhatKyNhacNo
{
    [Key]
    [Column("NHAC_NO_ID")]
    public long Id { get; set; }

    [Required]
    [Column("HOA_DON_ID")]
    public int InvoiceId { get; set; }

    [Required]
    [Column("SENT_TO_USER_ID")]
    public int SentToUserId { get; set; }

    [Column("SENT_BY_USER_ID")]
    public int? SentByUserId { get; set; }

    [Required]
    [Column("LAN_NHAC")]
    public int ReminderCount { get; set; } = 1;

    [Required]
    [Column("NHAC_LUC")]
    public DateTime ReminderTime { get; set; } = DateTime.UtcNow;

    [Required]
    [StringLength(50)]
    [Column("HINH_THUC")]
    public string ReminderMethod { get; set; } = null!; // SMS, Email, Zalo, App notification

    [Column("NOI_DUNG")]
    [StringLength(1000)]
    public string? Content { get; set; }

    [Required]
    [StringLength(50)]
    [Column("TRANG_THAI_GUI")]
    public string SendStatus { get; set; } = "Đang gửi"; // Đang gửi, Thành công, Thất bại

    [Column("ERROR_MESSAGE")]
    [StringLength(500)]
    public string? ErrorMessage { get; set; }

    // Navigation properties
    [ForeignKey("InvoiceId")]
    public HoaDon HoaDon { get; set; } = null!;

    [ForeignKey("SentToUserId")]
    public User SentToUser { get; set; } = null!;

    [ForeignKey("SentByUserId")]
    public User? SentByUser { get; set; }
}
