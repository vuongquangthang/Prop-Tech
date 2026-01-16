using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Nội quy - Quản lý nội quy chung cư
/// </summary>
[Table("regulations")]
public class Regulation
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    [Column("category")]
    public string Category { get; set; } = null!; // BUILDING, PARKING, NOISE, PET, GUEST, OTHER

    [Required]
    [StringLength(200)]
    [Column("title")]
    public string Title { get; set; } = null!;

    [Required]
    [Column("content", TypeName = "NVARCHAR(MAX)")]
    public string Content { get; set; } = null!;

    [Column("effective_from")]
    public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;

    [Column("effective_to")]
    public DateTime? EffectiveTo { get; set; }

    [Required]
    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("created_by")]
    public long? CreatedBy { get; set; }
}
