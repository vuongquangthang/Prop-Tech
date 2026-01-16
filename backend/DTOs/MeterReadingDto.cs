namespace backend.DTOs;

public class MeterReadingDto
{
    public long Id { get; set; }
    public long RoomId { get; set; }
    public DateTime ReadingMonth { get; set; }
    public decimal PreviousReading { get; set; }
    public decimal CurrentReading { get; set; }
    public decimal ConsumptionKwh { get; set; }
    public bool IsAnomaly { get; set; }
    public string? AnomalyNote { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WaterMeterReadingDto
{
    public long Id { get; set; }
    public long RoomId { get; set; }
    public DateTime ReadingMonth { get; set; }
    public decimal PreviousReading { get; set; }
    public decimal CurrentReading { get; set; }
    public decimal ConsumptionM3 { get; set; }
    public bool IsAnomaly { get; set; }
    public string? AnomalyNote { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateMeterReadingDto
{
    public long RoomId { get; set; }
    public DateTime ReadingMonth { get; set; }
    public decimal CurrentReading { get; set; }
}

public class CreateWaterMeterReadingDto
{
    public long RoomId { get; set; }
    public DateTime ReadingMonth { get; set; }
    public decimal CurrentReading { get; set; }
}
