using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Hóa đơn - Hóa đơn thanh toán hàng tháng
/// </summary>
[Table("invoices")]
public class Invoice
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [StringLength(50)]
    [Column("invoice_number")]
    public string InvoiceNumber { get; set; } = null!;

    [Required]
    [Column("room_id")]
    public long RoomId { get; set; }

    [Required]
    [Column("billing_period_id")]
    public int BillingPeriodId { get; set; }

    [Required]
    [Column("issue_date")]
    public DateTime IssueDate { get; set; }

    [Required]
    [Column("due_date")]
    public DateTime DueDate { get; set; }

    [Required]
    [Column("total_amount")]
    [Precision(15, 2)]
    public decimal TotalAmount { get; set; }

    [Column("paid_amount")]
    [Precision(15, 2)]
    public decimal PaidAmount { get; set; } = 0;

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "UNPAID"; // UNPAID, PARTIAL, PAID, OVERDUE

    [StringLength(500)]
    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    [Column("updated_by")]
    public long? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("RoomId")]
    public Room Room { get; set; } = null!;

    [ForeignKey("BillingPeriodId")]
    public BillingPeriod BillingPeriod { get; set; } = null!;

    public ICollection<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
