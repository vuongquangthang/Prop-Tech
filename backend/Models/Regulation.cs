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
    public long Id { get; set; }

    [Required]
    [StringLength(50)]
    [Column("regulation_code")]
    public string RegulationCode { get; set; } = null!;

    [Required]
    [StringLength(50)]
    [Column("category")]
    public string Category { get; set; } = null!; // BUILDING, PARKING, NOISE, PET, GUEST, SAFETY, OTHER

    [Required]
    [StringLength(200)]
    [Column("title")]
    public string Title { get; set; } = null!;

    [Required]
    [Column("content", TypeName = "NVARCHAR(MAX)")]
    public string Content { get; set; } = null!;

    [Column("effective_date")]
    public DateTime? EffectiveDate { get; set; }

    [Column("expiry_date")]
    public DateTime? ExpiryDate { get; set; }

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
