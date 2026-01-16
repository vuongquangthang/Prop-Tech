using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Cư dân - Thông tin cư dân
/// </summary>
[Table("residents")]
public class Resident
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Column("user_id")]
    public long? UserId { get; set; }

    [Required]
    [StringLength(100)]
    [Column("full_name")]
    public string FullName { get; set; } = null!;

    [StringLength(20)]
    [Column("id_card_number")]
    public string? IdCardNumber { get; set; }

    [StringLength(15)]
    [Column("phone_number")]
    public string? PhoneNumber { get; set; }

    [StringLength(100)]
    [Column("email")]
    public string? Email { get; set; }

    [Column("date_of_birth")]
    public DateTime? DateOfBirth { get; set; }

    [StringLength(10)]
    [Column("gender")]
    public string? Gender { get; set; } // MALE, FEMALE, OTHER

    [Column("permanent_address")]
    public string? PermanentAddress { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public User? User { get; set; }
    
    public ICollection<Residency> Residencies { get; set; } = new List<Residency>();
}
