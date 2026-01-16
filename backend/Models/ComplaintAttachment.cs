using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// File đính kèm khiếu nại - Hình ảnh, tài liệu đính kèm
/// </summary>
[Table("complaint_attachments")]
public class ComplaintAttachment
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("complaint_id")]
    public long ComplaintId { get; set; }

    [Required]
    [StringLength(255)]
    [Column("file_name")]
    public string FileName { get; set; } = null!;

    [Required]
    [StringLength(500)]
    [Column("file_path")]
    public string FilePath { get; set; } = null!;

    [Required]
    [StringLength(50)]
    [Column("file_type")]
    public string FileType { get; set; } = null!;

    [Column("file_size")]
    public long FileSize { get; set; }

    [Column("uploaded_at")]
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ComplaintId")]
    public Complaint Complaint { get; set; } = null!;
}
