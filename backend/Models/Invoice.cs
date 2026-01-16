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

    [ForeignKey(nameof(RoomId))]
    public Room Room { get; set; } = null!;

    [Required]
    [Column("billing_period_id")]
    public long BillingPeriodId { get; set; }

    [ForeignKey(nameof(BillingPeriodId))]
    public BillingPeriod BillingPeriod { get; set; } = null!;

    [Required]
    [Column("issue_date")]
    public DateTime IssueDate { get; set; }

    [Required]
    [Column("due_date")]
    public DateTime DueDate { get; set; }

    [Column("headcount")]
    public int? Headcount { get; set; }

    [Column("room_charge")]
    [Precision(15, 2)]
    public decimal? RoomCharge { get; set; }

    [Column("water_charge")]
    [Precision(15, 2)]
    public decimal? WaterCharge { get; set; }

    [Column("electricity_charge")]
    [Precision(15, 2)]
    public decimal? ElectricityCharge { get; set; }

    [Column("service_charge")]
    [Precision(15, 2)]
    public decimal? ServiceCharge { get; set; }

    [Required]
    [Column("total_amount")]
    [Precision(15, 2)]
    public decimal TotalAmount { get; set; }

    [Column("adjustment_amount")]
    [Precision(15, 2)]
    public decimal? AdjustmentAmount { get; set; }

    [Column("adjustment_note")]
    public string? AdjustmentNote { get; set; }

    [Column("late_fee")]
    [Precision(15, 2)]
    public decimal? LateFee { get; set; }

    [Column("paid_amount")]
    [Precision(15, 2)]
    public decimal PaidAmount { get; set; } = 0;

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "UNPAID"; // UNPAID, PARTIAL, PAID, OVERDUE, VOIDED

    [Column("snapshot_water_price")]
    [Precision(15, 4)]
    public decimal? SnapshotWaterPrice { get; set; }

    [Column("snapshot_electricity_price")]
    [Precision(15, 4)]
    public decimal? SnapshotElectricityPrice { get; set; }

    [Column("snapshot_service_price")]
    [Precision(15, 4)]
    public decimal? SnapshotServicePrice { get; set; }

    [Column("snapshot_room_rent")]
    [Precision(15, 2)]
    public decimal? SnapshotRoomRent { get; set; }

    [Column("confirmed_at")]
    public DateTime? ConfirmedAt { get; set; }

    [Column("confirmed_by")]
    public long? ConfirmedBy { get; set; }

    [Column("paid_at")]
    public DateTime? PaidAt { get; set; }

    [Column("voided_at")]
    public DateTime? VoidedAt { get; set; }

    [Column("voided_by")]
    public long? VoidedBy { get; set; }

    [Column("void_reason")]
    public string? VoidReason { get; set; }

    [StringLength(500)]
    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public long? CreatedBy { get; set; }

    // Navigation properties
    public ICollection<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
