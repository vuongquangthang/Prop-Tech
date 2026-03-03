namespace backend.DTOs;

/// <summary>
/// DTO for ChiSoNuoc display
/// </summary>
public class ChiSoNuocDto
{
    public int Id { get; set; }
    public long ServiceUsageDetailId { get; set; }
    public byte Month { get; set; }
    public short Year { get; set; }
    public decimal NewReading { get; set; }
    public decimal? PreviousReading { get; set; } // Calculated from previous month
    public decimal? Consumption { get; set; } // NewReading - PreviousReading
    public string? MeterImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    
    // Additional info from ServiceUsageDetail
    public int? RoomId { get; set; }
    public string? RoomNumber { get; set; }
}

/// <summary>
/// DTO for creating ChiSoNuoc
/// </summary>
public class CreateChiSoNuocDto
{
    public long ServiceUsageDetailId { get; set; }
    public byte Month { get; set; }
    public short Year { get; set; }
    public decimal NewReading { get; set; }
    public string? MeterImageUrl { get; set; }
}

/// <summary>
/// DTO for updating ChiSoNuoc
/// </summary>
public class UpdateChiSoNuocDto
{
    public decimal NewReading { get; set; }
    public string? MeterImageUrl { get; set; }
}
