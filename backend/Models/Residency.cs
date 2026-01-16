using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Lịch sử thuê - Theo dõi lịch sử thuê căn hộ
/// </summary>
[Table("residencies")]
public class Residency
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("resident_id")]
    public long ResidentId { get; set; }

    [Required]
    [Column("room_id")]
    public long RoomId { get; set; }

    [Required]
    [Column("move_in_date")]
    public DateTime MoveInDate { get; set; }

    [Column("move_out_date")]
    public DateTime? MoveOutDate { get; set; }

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, ENDED

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ResidentId")]
    public Resident Resident { get; set; } = null!;

    [ForeignKey("RoomId")]
    public Room Room { get; set; } = null!;
}
