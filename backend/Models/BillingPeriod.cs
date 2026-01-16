using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Kỳ thanh toán - Định nghĩa kỳ thanh toán hàng tháng
/// </summary>
[Table("billing_periods")]
public class BillingPeriod
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("period_month")]
    public DateTime PeriodMonth { get; set; }

    [Required]
    [Column("cutoff_date")]
    public DateTime CutoffDate { get; set; }

    [Required]
    [Column("due_date")]
    public DateTime DueDate { get; set; }

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "DRAFT"; // DRAFT, CONFIRMED, CLOSED

    [Column("late_fee_enabled")]
    public bool LateFeeEnabled { get; set; } = false;

    [Column("late_fee_percent")]
    public decimal? LateFeePercent { get; set; }

    [Column("late_fee_fixed")]
    public decimal? LateFeeFixed { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    // Navigation properties
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
