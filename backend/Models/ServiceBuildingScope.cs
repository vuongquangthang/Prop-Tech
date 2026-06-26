using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("DICH_VU_TOA_NHA")]
public class ServiceBuildingScope
{
    [Column("DICH_VU_ID")]
    public int ServiceId { get; set; }

    [Column("TOA_NHA_ID")]
    public int BuildingId { get; set; }

    [ForeignKey(nameof(ServiceId))]
    public Service Service { get; set; } = null!;

    [ForeignKey(nameof(BuildingId))]
    public Building Building { get; set; } = null!;
}
