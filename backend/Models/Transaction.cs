using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Giao dịch thanh toán - Lịch sử thanh toán
/// </summary>
[Table("transactions")]
public class Transaction
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("invoice_id")]
    public long InvoiceId { get; set; }

    [ForeignKey(nameof(InvoiceId))]
    public Invoice Invoice { get; set; } = null!;

    [Required]
    [StringLength(50)]
    [Column("transaction_code")]
    public string TransactionCode { get; set; } = null!;

    [Required]
    [Column("payment_date")]
    public DateTime PaymentDate { get; set; }

    [Required]
    [Column("amount")]
    [Precision(15, 2)]
    public decimal Amount { get; set; }

    [Required]
    [StringLength(50)]
    [Column("payment_method")]
    public string PaymentMethod { get; set; } = null!; // BANK_TRANSFER, CASH, EWALLET, GATEWAY_MOCK

    [StringLength(100)]
    [Column("bank_reference")]
    public string? BankReference { get; set; }

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "INITIATED"; // INITIATED, PROCESSING, SUCCESS, FAILED, CANCELLED

    [Column("gateway_reference")]
    public string? GatewayReference { get; set; }

    [Column("gateway_response")]
    public string? GatewayResponse { get; set; }

    [StringLength(500)]
    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    // Navigation properties
    public ICollection<PaymentReconciliation> Reconciliations { get; set; } = new List<PaymentReconciliation>();
}
