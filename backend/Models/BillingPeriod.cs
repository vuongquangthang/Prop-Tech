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
    public int Id { get; set; }

    [Required]
    [Column("period_year")]
    public int PeriodYear { get; set; }

    [Required]
    [Column("period_month")]
    public int PeriodMonth { get; set; }

    [Required]
    [Column("start_date")]
    public DateTime StartDate { get; set; }

    [Required]
    [Column("end_date")]
    public DateTime EndDate { get; set; }

    [Required]
    [Column("due_date")]
    public DateTime DueDate { get; set; }

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "OPEN"; // OPEN, CLOSED

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
