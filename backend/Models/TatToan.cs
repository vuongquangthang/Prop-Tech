using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Tất toán - Quản lý tất toán hợp đồng
/// </summary>
[Table("TatToan")]
public class TatToan
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ResidencyId { get; set; }

    [Required]
    public DateTime SettlementDate { get; set; }

    [Precision(18, 2)]
    public decimal? DepositRefund { get; set; }

    [Precision(18, 2)]
    public decimal? OutstandingDebt { get; set; }

    [Precision(18, 2)]
    public decimal? Compensation { get; set; }

    [Precision(18, 2)]
    public decimal? Deductions { get; set; }

    [Precision(18, 2)]
    public decimal? TotalSettlement { get; set; }

    public string? ResidentSignature { get; set; }

    public string? ManagerSignature { get; set; }

    [StringLength(50)]
    public string? Status { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    [ForeignKey("ResidencyId")]
    public HopDong? Residency { get; set; }

    public ICollection<ChiTietPhieuTatToan> Details { get; set; } = new List<ChiTietPhieuTatToan>();
}
