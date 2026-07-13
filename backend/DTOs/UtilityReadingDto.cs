namespace backend.DTOs;

/// <summary>
/// DTO để chốt chỉ số điện/nước cho 1 phòng
/// </summary>
public class RecordUtilityReadingDto
{
    public int RoomId { get; set; }
    public byte Month { get; set; }
    public short Year { get; set; }
    public long? ElecUsageDetailId { get; set; }
    public long? WaterUsageDetailId { get; set; }
    public decimal? NewElecReading { get; set; }
    public decimal? NewWaterReading { get; set; }
}

/// <summary>
/// Kết quả chốt chỉ số hàng loạt
/// </summary>
public class BatchReadingResultDto
{
    public int Success { get; set; }
    public int Failed { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

/// <summary>
/// Thông tin chỉ số điện/nước của 1 phòng trong 1 tháng
/// </summary>
public class RoomUtilityReadingDto
{
    public int RoomId { get; set; }
    public string RoomCode { get; set; } = null!;
    public string? BuildingName { get; set; }
    public string? FloorName { get; set; }
    public string? ResidentName { get; set; }

    // Chỉ số điện
    public long? ElecUsageDetailId { get; set; }
    public decimal? OldElecReading { get; set; }
    public decimal? NewElecReading { get; set; }
    public bool ElecRecorded { get; set; }
    public bool ElecIsAnomaly { get; set; }
    public string? ElecAnomalyNote { get; set; }

    // Chỉ số nước
    public long? WaterUsageDetailId { get; set; }
    public decimal? OldWaterReading { get; set; }
    public decimal? NewWaterReading { get; set; }
    public bool WaterRecorded { get; set; }
    public bool WaterIsAnomaly { get; set; }
    public string? WaterAnomalyNote { get; set; }
}
