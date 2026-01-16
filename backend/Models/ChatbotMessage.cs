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

    [ForeignKey(nameof(ConversationId))]
    public ChatbotConversation Conversation { get; set; } = null!;

    [Required]
    [StringLength(20)]
    [Column("sender_type")]
    public string SenderType { get; set; } = null!; // USER, BOT

    [Required]
    [Column("message_content", TypeName = "NVARCHAR(MAX)")]
    public string MessageContent { get; set; } = null!;

    [StringLength(50)]
    [Column("intent")]
    public string? Intent { get; set; }

    [Column("matched_faq_id")]
    public long? MatchedFaqId { get; set; }

    [ForeignKey(nameof(MatchedFaqId))]
    public FAQ? MatchedFaq { get; set; }

    [Column("matched_regulation_id")]
    public long? MatchedRegulationId { get; set; }

    [ForeignKey(nameof(MatchedRegulationId))]
    public Regulation? MatchedRegulation { get; set; }

    [Column("sent_at")]
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
