namespace backend.DTOs;

// Building DTOs
public class BuildingDto
{
    public long Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Address { get; set; }
    public int TotalFloors { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTime CreatedAt { get; set; }
}

public class CreateBuildingDto
{
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Address { get; set; }
    public int TotalFloors { get; set; }
}

public class UpdateBuildingDto
{
    public string Name { get; set; } = null!;
    public string? Address { get; set; }
    public int TotalFloors { get; set; }
    public string Status { get; set; } = "ACTIVE";
}

// Floor DTOs
public class FloorDto
{
    public long Id { get; set; }
    public long BuildingId { get; set; }
    public string BuildingName { get; set; } = null!;
    public int FloorNumber { get; set; }
    public int TotalRooms { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateFloorDto
{
    public long BuildingId { get; set; }
    public int FloorNumber { get; set; }
    public int TotalRooms { get; set; }
}

public class UpdateFloorDto
{
    public int FloorNumber { get; set; }
    public int TotalRooms { get; set; }
}

// Room DTOs
public class RoomDto
{
    public long Id { get; set; }
    public long FloorId { get; set; }
    public long BuildingId { get; set; }
    public string BuildingName { get; set; } = null!;
    public int FloorNumber { get; set; }
    public string RoomNumber { get; set; } = null!;
    public string RoomType { get; set; } = null!;
    public decimal Area { get; set; }
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public string Status { get; set; } = "AVAILABLE";
    public DateTime CreatedAt { get; set; }
}

public class CreateRoomDto
{
    public long FloorId { get; set; }
    public string RoomNumber { get; set; } = null!;
    public string RoomType { get; set; } = null!;
    public decimal Area { get; set; }
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
}

public class UpdateRoomDto
{
    public string RoomNumber { get; set; } = null!;
    public string RoomType { get; set; } = null!;
    public decimal Area { get; set; }
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public string Status { get; set; } = "AVAILABLE";
}

