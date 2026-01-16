using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Đối soát thanh toán - Đối soát giao dịch ngân hàng
/// </summary>
[Table("payment_reconciliations")]
public class PaymentReconciliation
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("transaction_id")]
    public long TransactionId { get; set; }

    [ForeignKey(nameof(TransactionId))]
    public Transaction Transaction { get; set; } = null!;

    [Required]
    [StringLength(100)]
    [Column("bank_transaction_id")]
    public string BankTransactionId { get; set; } = null!;

    [Column("bank_statement_ref")]
    public string? BankStatementRef { get; set; }

    [Required]
    [Column("bank_amount")]
    [Precision(15, 2)]
    public decimal BankAmount { get; set; }

    [Required]
    [Column("bank_date")]
    public DateTime BankDate { get; set; }

    [Required]
    [StringLength(20)]
    [Column("reconciliation_status")]
    public string ReconciliationStatus { get; set; } = "PENDING"; // PENDING, MATCHED, UNMATCHED

    [StringLength(500)]
    [Column("notes")]
    public string? Notes { get; set; }

    [Column("matched_at")]
    public DateTime? MatchedAt { get; set; }

    [Column("matched_by")]
    public long? MatchedBy { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
