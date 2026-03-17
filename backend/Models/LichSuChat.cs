using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Lịch sử chat - Quản lý lịch sử chat với chatbot
/// </summary>
[Table("LICH_SU_CHAT")]
public class LichSuChat
{
    [Key]
    [Column("CHAT_ID")]
    public long Id { get; set; }

    [Required]
    [Column("USER_ID")]
    public int UserId { get; set; }

    [Required]
    [StringLength(20)]
    [Column("MESSAGE_ROLE")]
    public string MessageRole { get; set; } = null!; // user, assistant, system

    [Required]
    [Column("MESSAGE_TEXT")]
    public string MessageText { get; set; } = null!;

    [Required]
    [Column("IS_KNOWLEDGE_GAP")]
    public bool IsKnowledgeGap { get; set; }

    [Required]
    [Column("CREATED_AT")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
