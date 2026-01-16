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

    [Required]
    [StringLength(100)]
    [Column("description")]
    public string Description { get; set; } = null!;

    [Required]
    [Column("quantity")]
    [Precision(10, 2)]
    public decimal Quantity { get; set; }

    [Required]
    [Column("unit_price")]
    [Precision(15, 2)]
    public decimal UnitPrice { get; set; }

    [Required]
    [Column("amount")]
    [Precision(15, 2)]
    public decimal Amount { get; set; }

    [StringLength(20)]
    [Column("unit")]
    public string? Unit { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("InvoiceId")]
    public Invoice Invoice { get; set; } = null!;
}
