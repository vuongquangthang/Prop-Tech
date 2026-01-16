using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Cư trú - Thông tin cư trú của cư dân tại căn hộ
/// </summary>
[Table("residencies")]
public class Residency
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("room_id")]
    public long RoomId { get; set; }

    [Required]
    [Column("resident_id")]
    public long ResidentId { get; set; }

    [Required]
    [StringLength(20)]
    [Column("ownership_type")]
    public string OwnershipType { get; set; } = "TENANT"; // OWNER, TENANT

    [Column("is_primary_resident")]
    public bool IsPrimaryResident { get; set; } = false;

    [Required]
    [Column("check_in_date")]
    public DateTime CheckInDate { get; set; }

    [Column("check_out_date")]
    public DateTime? CheckOutDate { get; set; }

    [Required]
    [StringLength(20)]
    [Column("status")]
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, ENDED

    [StringLength(50)]
    [Column("contract_number")]
    public string? ContractNumber { get; set; }

    [Column("contract_start_date")]
    public DateTime? ContractStartDate { get; set; }

    [Column("contract_end_date")]
    public DateTime? ContractEndDate { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("RoomId")]
    public Room Room { get; set; } = null!;

    [ForeignKey("ResidentId")]
    public Resident Resident { get; set; } = null!;

    public Deposit? Deposit { get; set; }
}
