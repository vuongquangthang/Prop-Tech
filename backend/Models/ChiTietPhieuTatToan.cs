using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Chi tiết phiếu tất toán - Chi tiết từng khoản trong phiếu tất toán
/// </summary>
[Table("ChiTietPhieuTatToan")]
public class ChiTietPhieuTatToan
{
    [Key]
    public long Id { get; set; }

    [Required]
    public int SettlementId { get; set; }

    [StringLength(255)]
    public string? Description { get; set; }

    [Precision(18, 2)]
    public decimal? Amount { get; set; }

    [StringLength(50)]
    public string? Type { get; set; } // DepositRefund, Debt, Deduction, Compensation

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    // Navigation properties
    [ForeignKey("SettlementId")]
    public TatToan? TatToan { get; set; }
}
