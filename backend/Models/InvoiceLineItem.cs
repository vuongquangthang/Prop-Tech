using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

/// <summary>
/// Chi tiết hóa đơn - Các khoản phí trong hóa đơn
/// </summary>
[Table("invoice_line_items")]
public class InvoiceLineItem
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
    [Column("item_type")]
    public string ItemType { get; set; } = null!; // ROOM, WATER, ELECTRICITY, ELECTRICITY_TIER, SERVICE, ADJUSTMENT, LATE_FEE

    [Required]
    [StringLength(255)]
    [Column("description")]
    public string Description { get; set; } = null!;

    [Required]
    [Column("quantity")]
    [Precision(10, 2)]
    public decimal Quantity { get; set; }

    [Required]
    [Column("unit_price")]
    [Precision(15, 4)]
    public decimal UnitPrice { get; set; }

    [Required]
    [Column("amount")]
    [Precision(15, 2)]
    public decimal Amount { get; set; }

    [StringLength(20)]
    [Column("unit")]
    public string? Unit { get; set; }

    [Column("tier_info")]
    public string? TierInfo { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
