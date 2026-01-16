using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Phản hồi khiếu nại - Lịch sử phản hồi và xử lý
/// </summary>
[Table("complaint_responses")]
public class ComplaintResponse
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("complaint_id")]
    public long ComplaintId { get; set; }

    [Required]
    [Column("responded_by")]
    public long RespondedBy { get; set; }

    [Required]
    [Column("response_text", TypeName = "NVARCHAR(MAX)")]
    public string ResponseText { get; set; } = null!;

    [Column("responded_at")]
    public DateTime RespondedAt { get; set; } = DateTime.UtcNow;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ComplaintId")]
    public Complaint Complaint { get; set; } = null!;
}
