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

    [Column("user_id")]
    public long? UserId { get; set; }

    [StringLength(100)]
    [Column("session_id")]
    public string? SessionId { get; set; }

    [Column("started_at")]
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    [Column("ended_at")]
    public DateTime? EndedAt { get; set; }

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, ENDED

    // Navigation properties
    [ForeignKey("UserId")]
    public User? User { get; set; }

    public ICollection<ChatbotMessage> Messages { get; set; } = new List<ChatbotMessage>();
}
