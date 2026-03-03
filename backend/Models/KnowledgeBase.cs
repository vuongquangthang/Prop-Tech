using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Knowledge Base - Quản lý kiến thức cho chatbot (gộp FAQ và Regulations)
/// </summary>
[Table("KNOWLEDGE_BASE")]
public class KnowledgeBase
{
    [Key]
    [Column("KB_ID")]
    public int Id { get; set; }

    [Required]
    [StringLength(500)]
    [Column("TIEU_DE")]
    public string Title { get; set; } = null!;

    [Required]
    [Column("NOI_DUNG")]
    public string Content { get; set; } = null!;

    [Column("THE_LOAI")]
    [StringLength(100)]
    public string? Category { get; set; }

    [Column("TAGS")]
    [StringLength(500)]
    public string? Tags { get; set; }

    [Required]
    [Column("IS_ACTIVE")]
    public bool IsActive { get; set; } = true;

    [Required]
    [Column("UPDATED_AT")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("UPDATED_BY")]
    public int? UpdatedBy { get; set; }

    // Navigation properties
    [ForeignKey("UpdatedBy")]
    public User? UpdatedByUser { get; set; }
}
