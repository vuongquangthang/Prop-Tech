using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Khiếu nại - Quản lý khiếu nại của cư dân
/// </summary>
[Table("complaints")]
public class Complaint
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [StringLength(50)]
    [Column("complaint_code")]
    public string ComplaintCode { get; set; } = null!;

    [Required]
    [Column("room_id")]
    public long RoomId { get; set; }

    [Required]
    [Column("resident_id")]
    public long ResidentId { get; set; }

    [Required]
    [StringLength(50)]
    [Column("category")]
    public string Category { get; set; } = null!; // MAINTENANCE, BILLING, NOISE, SECURITY, OTHER

    [Required]
    [StringLength(200)]
    [Column("title")]
    public string Title { get; set; } = null!;

    [Required]
    [Column("description", TypeName = "NVARCHAR(MAX)")]
    public string Description { get; set; } = null!;

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "OPEN"; // OPEN, IN_PROGRESS, RESOLVED, CLOSED

    [Required]
    [StringLength(20)]
    [Column("priority")]
    public string Priority { get; set; } = "MEDIUM"; // LOW, MEDIUM, HIGH, URGENT

    [Column("submitted_at")]
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    [Column("resolved_at")]
    public DateTime? ResolvedAt { get; set; }

    [Column("assigned_to")]
    public long? AssignedTo { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("RoomId")]
    public Room Room { get; set; } = null!;

    public ICollection<ComplaintAttachment> Attachments { get; set; } = new List<ComplaintAttachment>();
    public ICollection<ComplaintResponse> Responses { get; set; } = new List<ComplaintResponse>();
}
