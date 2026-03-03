namespace backend.DTOs;

/// <summary>
/// DTO cho tòa nhà
/// </summary>
public class BuildingDto
{
    public int Id { get; set; }
    public string BuildingName { get; set; } = null!;
    public string Address { get; set; } = null!;
    public int NumberOfFloors { get; set; }
    public string? Description { get; set; }
    public int TotalRooms { get; set; }
}

/// <summary>
/// DTO để tạo tòa nhà mới
/// </summary>
public class CreateBuildingDto
{
    public string BuildingName { get; set; } = null!;
    public string Address { get; set; } = null!;
    public int NumberOfFloors { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// DTO để cập nhật tòa nhà
/// </summary>
public class UpdateBuildingDto
{
    public string? BuildingName { get; set; }
    public string? Address { get; set; }
    public int? NumberOfFloors { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// DTO chi tiết tòa nhà (bao gồm tầng và phòng)
/// </summary>
public class BuildingDetailDto : BuildingDto
{
    public List<FloorDto> Floors { get; set; } = new();
}
