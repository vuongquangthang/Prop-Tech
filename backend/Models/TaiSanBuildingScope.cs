using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("TAI_SAN_TOA_NHA")]
public class TaiSanBuildingScope
{
    [Column("TAI_SAN_ID")]
    public int AssetId { get; set; }

    [Column("TOA_NHA_ID")]
    public int BuildingId { get; set; }

    [ForeignKey(nameof(AssetId))]
    public TaiSan Asset { get; set; } = null!;

    [ForeignKey(nameof(BuildingId))]
    public Building Building { get; set; } = null!;
}
