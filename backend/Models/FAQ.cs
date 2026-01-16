using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Câu hỏi thường gặp - Hỗ trợ chatbot AI
/// </summary>
[Table("faqs")]
public class FAQ
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [StringLength(50)]
    [Column("category")]
    public string Category { get; set; } = null!; // BILLING, SERVICES, COMPLAINT, FACILITY, GENERAL, OTHER

    [Required]
    [StringLength(500)]
    [Column("question")]
    public string Question { get; set; } = null!;

    [Required]
    [Column("answer", TypeName = "NVARCHAR(MAX)")]
    public string Answer { get; set; } = null!;

    [StringLength(1000)]
    [Column("keywords")]
    public string? Keywords { get; set; }

    [Column("display_order")]
    public int DisplayOrder { get; set; } = 0;

    [Column("view_count")]
    public int ViewCount { get; set; } = 0;

    [Required]
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public long? CreatedBy { get; set; }
}
