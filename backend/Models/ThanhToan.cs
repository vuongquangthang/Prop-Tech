using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Thanh toán - Quản lý các giao dịch thanh toán
/// </summary>
[Table("THANH_TOAN")]
public class ThanhToan
{
    [Key]
    [Column("THANH_TOAN_ID")]
    public long Id { get; set; }

    [Required]
    [StringLength(50)]
    [Column("LOAI")]
    public string PaymentType { get; set; } = null!; // Tiền mặt, Chuyển khoản, Thẻ, Khác

    [Column("HOA_DON_ID")]
    public int? InvoiceId { get; set; } // Thanh toán hóa đơn

    [Column("TAT_TOAN_ID")]
    public int? SettlementId { get; set; } // Thanh toán tất toán

    [Required]
    [Column("SO_TIEN")]
    [Precision(18, 2)]
    public decimal Amount { get; set; }

    [Column("MA_GIAO_DICH")]
    [StringLength(100)]
    public string? TransactionCode { get; set; }

    [Column("PAID_AT")]
    public DateTime? PaidAt { get; set; }

    [Required]
    [StringLength(50)]
    [Column("STATUS")]
    public string Status { get; set; } = "PENDING"; // PENDING, SUCCESS, FAILED

    [Column("CREATED_AT")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("InvoiceId")]
    public HoaDon? HoaDon { get; set; }

    [ForeignKey("SettlementId")]
    public TatToan? TatToan { get; set; }
}
