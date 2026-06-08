namespace backend.DTOs;

public class PublicRoomServiceDto
{
    public string Name { get; set; } = null!;
    public decimal Price { get; set; }
    public string Unit { get; set; } = null!;
}

public class PublicRoomContactDto
{
    public string Name { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string Avatar { get; set; } = "";
    public string UserId { get; set; } = null!;
}

public class PublicRoomCoordsDto
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}

public class PublicSharedRoomDto
{
    public decimal OriginalPrice { get; set; }
    public decimal SharedPrice { get; set; }
    public int MaxOccupants { get; set; }
    public bool HasPrivateBathroom { get; set; }
    public List<PublicRoomServiceDto> Services { get; set; } = new();
    public List<string> ResidentRequirements { get; set; } = new();
    public PublicRoomContactDto Resident { get; set; } = null!;
}

public class PublicRoomDto
{
    public string Id { get; set; } = null!;
    public string Source { get; set; } = null!;
    public int RoomId { get; set; }
    public int? PostId { get; set; }
    public bool IsLocked { get; set; }
    public string Status { get; set; } = "active";
    public string RoomStatus { get; set; } = "";
    public string Type { get; set; } = null!;
    public string UnitType { get; set; } = null!;
    public string RoomType { get; set; } = null!;
    public string Title { get; set; } = null!;
    public List<string> Images { get; set; } = new();
    public string Location { get; set; } = null!;
    public string City { get; set; } = null!;
    public string District { get; set; } = null!;
    public string? Ward { get; set; }
    public decimal Price { get; set; }
    public decimal Size { get; set; }
    public int MaxOccupants { get; set; }
    public List<PublicRoomServiceDto> Services { get; set; } = new();
    public decimal ServiceFee { get; set; }
    public bool AvailableNow { get; set; }
    public DateTime? AvailableFrom { get; set; }
    public DateTime PostedAt { get; set; }
    public int? Views { get; set; }
    public int HygieneScore { get; set; }
    public int LivingRooms { get; set; }
    public int Bedrooms { get; set; }
    public bool FloodRisk { get; set; }
    public List<string> Amenities { get; set; } = new();
    public List<string> HostRequirements { get; set; } = new();
    public string Description { get; set; } = "";
    public PublicRoomContactDto Host { get; set; } = null!;
    public PublicSharedRoomDto? Shared { get; set; }
    public PublicRoomCoordsDto Coords { get; set; } = null!;
}

public class PublicRoomSearchQueryDto
{
    public string? Keyword { get; set; }
    public string? Location { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public decimal? MinArea { get; set; }
    public decimal? MaxArea { get; set; }
    public string? RoomType { get; set; }
    public bool? AvailableNow { get; set; }
    public int? MinHygiene { get; set; }
    public int? LivingRooms { get; set; }
    public int? Bedrooms { get; set; }
    public int? Limit { get; set; }
}

public class PublicRoomMatchBreakdownDto
{
    public double Location { get; set; }
    public double Price { get; set; }
    public double AvailableNow { get; set; }
    public double Hygiene { get; set; }
    public double LivingRooms { get; set; }
    public double Bedrooms { get; set; }
}

public class PublicRoomMatchDto
{
    public int Score { get; set; }
    public PublicRoomMatchBreakdownDto Breakdown { get; set; } = new();
}

public class PublicRoomSearchResultDto
{
    public PublicRoomDto Room { get; set; } = null!;
    public PublicRoomMatchDto Match { get; set; } = null!;
}
