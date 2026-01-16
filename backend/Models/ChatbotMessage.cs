using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Tin nhắn chatbot - Chi tiết tin nhắn trong cuộc hội thoại
/// </summary>
[Table("chatbot_messages")]
public class ChatbotMessage
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("conversation_id")]
    public long ConversationId { get; set; }

    [Required]
    [StringLength(20)]
    [Column("sender")]
    public string Sender { get; set; } = null!; // USER, BOT

    [Required]
    [Column("message_text", TypeName = "NVARCHAR(MAX)")]
    public string MessageText { get; set; } = null!;

    [StringLength(50)]
    [Column("intent")]
    public string? Intent { get; set; }

    [Column("faq_id")]
    public int? FaqId { get; set; }

    [Column("regulation_id")]
    public int? RegulationId { get; set; }

    [Column("sent_at")]
    public DateTime SentAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ConversationId")]
    public ChatbotConversation Conversation { get; set; } = null!;

    [ForeignKey("FaqId")]
    public FAQ? FAQ { get; set; }

    [ForeignKey("RegulationId")]
    public Regulation? Regulation { get; set; }
}
