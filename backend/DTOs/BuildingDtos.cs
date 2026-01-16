namespace backend.DTOs;

// Building DTOs
public class BuildingDto
{
    public long Id { get; set; }
    public string BuildingCode { get; set; } = null!;
    public string BuildingName { get; set; } = null!;
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBuildingDto
{
    public string BuildingCode { get; set; } = null!;
    public string BuildingName { get; set; } = null!;
    public string? Address { get; set; }
}

public class UpdateBuildingDto
{
    public string BuildingName { get; set; } = null!;
    public string? Address { get; set; }
}

// Floor DTOs
public class FloorDto
{
    public long Id { get; set; }
    public long BuildingId { get; set; }
    public string BuildingName { get; set; } = null!;
    public int FloorNumber { get; set; }
    public string? FloorName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateFloorDto
{
    public long BuildingId { get; set; }
    public int FloorNumber { get; set; }
    public string? FloorName { get; set; }
}

public class UpdateFloorDto
{
    public int FloorNumber { get; set; }
    public string? FloorName { get; set; }
}

// Room DTOs
public class RoomDto
{
    public long Id { get; set; }
    public long FloorId { get; set; }
    public long BuildingId { get; set; }
    public string BuildingName { get; set; } = null!;
    public int FloorNumber { get; set; }
    public string RoomCode { get; set; } = null!;
    public string RoomNumber { get; set; } = null!;
    public string RoomType { get; set; } = null!; // FOR_RENT, FOR_SALE, SOLD
    public decimal? AreaSqm { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal SalePrice { get; set; }
    public string Status { get; set; } = "VACANT"; // VACANT, OCCUPIED, INACTIVE
    public DateTime CreatedAt { get; set; }
}

public class CreateRoomDto
{
    public long FloorId { get; set; }
    public string RoomCode { get; set; } = null!;
    public string RoomNumber { get; set; } = null!;
    public string RoomType { get; set; } = "FOR_RENT";
    public decimal? AreaSqm { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal SalePrice { get; set; }
}

public class UpdateRoomDto
{
    public string RoomNumber { get; set; } = null!;
    public string RoomType { get; set; } = "FOR_RENT";
    public decimal? AreaSqm { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal SalePrice { get; set; }
    public string Status { get; set; } = "VACANT";
}

