using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Cuộc hội thoại chatbot - Lưu lịch sử hội thoại
/// </summary>
[Table("chatbot_conversations")]
public class ChatbotConversation
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [StringLength(100)]
    [Column("conversation_id")]
    public string ConversationId { get; set; } = null!;

    [Column("user_id")]
    public long? UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Column("session_start")]
    public DateTime SessionStart { get; set; } = DateTime.UtcNow;

    [Column("session_end")]
    public DateTime? SessionEnd { get; set; }

    [Column("total_messages")]
    public int TotalMessages { get; set; } = 0;

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, ENDED

    // Navigation properties
    public ICollection<ChatbotMessage> Messages { get; set; } = new List<ChatbotMessage>();
}
