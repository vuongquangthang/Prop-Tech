namespace backend.DTOs;

/// <summary>
/// DTO cho tầng
/// </summary>
public class FloorDto
{
    public int Id { get; set; }
    public int BuildingId { get; set; }
    public string BuildingName { get; set; } = null!;
    public int FloorNumber { get; set; }
    public int TotalRooms { get; set; }
}

/// <summary>
/// DTO để tạo tầng mới
/// </summary>
public class CreateFloorDto
{
    public int BuildingId { get; set; }
    public int FloorNumber { get; set; }
}

public class UpdateFloorDto
{
    public int? FloorNumber { get; set; }
}

/// <summary>
/// DTO chi tiết tầng (bao gồm phòng)
/// </summary>
public class FloorDetailDto : FloorDto
{
    public List<RoomDto> Rooms { get; set; } = new();
}
