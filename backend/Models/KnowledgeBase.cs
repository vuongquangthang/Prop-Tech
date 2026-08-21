using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Knowledge Base - stores uploaded document metadata.
/// </summary>
[Table("KNOWLEDGE_BASE")]
public class KnowledgeBase
{
    [Key]
    [Column("KB_ID")]
    public int Id { get; set; }

    [Required]
    [StringLength(500)]
    [Column("TEN_FILE")]
    public string FileName { get; set; } = null!;

    [Required]
    [StringLength(2048)]
    [Column("FILE_URL")]
    public string FileUrl { get; set; } = null!;

    [Column("OWNER_USER_ID")]
    public int? OwnerUserId { get; set; }

    [Required]
    [Column("CREATED_AT")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(OwnerUserId))]
    public User? OwnerUser { get; set; }
}
