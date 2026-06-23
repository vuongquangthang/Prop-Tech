namespace backend.DTOs;

public class PostServiceLineItemDto
{
    public string Key { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Unit { get; set; } = null!;
    public decimal Price { get; set; }
}

public class PostDto
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public string RoomCode { get; set; } = null!;
    public string BuildingName { get; set; } = null!;
    public int FloorNumber { get; set; }
    public decimal? Area { get; set; }
    public int? MaxOccupants { get; set; }
    public int? CurrentOccupants { get; set; }
    public string Title { get; set; } = null!;
    public decimal BaseRentPrice { get; set; }
    public DateTime PostDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public int Views { get; set; }
    public int Messages { get; set; }
    public bool IsLocked { get; set; }
    public string Status { get; set; } = null!;
    public string RoomStatus { get; set; } = null!;
    public string MoveInType { get; set; } = null!;
    public DateTime? MoveInDate { get; set; }
    public bool FloodProne { get; set; }
    public string? LandlordRequirements { get; set; }
    public string ContactType { get; set; } = null!;
    public string ContactName { get; set; } = null!;
    public string ContactPhone { get; set; } = null!;
    public List<PostServiceLineItemDto> ServicePrices { get; set; } = new();
    public List<string> ImageUrls { get; set; } = new();
    public List<string> Amenities { get; set; } = new();
    public string? CoverImageUrl { get; set; }
    public int? CreatedByUserId { get; set; }
    public string? CreatedByUserRole { get; set; }
}

public class CreatePostDto
{
    public int RoomId { get; set; }
    public string Title { get; set; } = null!;
    public decimal BaseRentPrice { get; set; }
    public string MoveInType { get; set; } = "immediate";
    public DateTime? MoveInDate { get; set; }
    public bool FloodProne { get; set; }
    public string? LandlordRequirements { get; set; }
    public string ContactType { get; set; } = "current";
    public string ContactName { get; set; } = null!;
    public string ContactPhone { get; set; } = null!;
    public List<PostServiceLineItemDto> ServicePrices { get; set; } = new();
    public List<string> ImageUrls { get; set; } = new();
    public List<string> Amenities { get; set; } = new();
}

public class UpdatePostLockDto
{
    public bool IsLocked { get; set; }
}

public class UpdatePostMessageCountDto
{
    public int Messages { get; set; }
}

// TroUyTin bao Prop-Tech gui thong bao cho chu bai khi admin xoa bai dang.
public class ModerationDeleteNoticeDto
{
    public string Reason { get; set; } = string.Empty;
    public string? ListingTitle { get; set; }
    public DateTime? DeletedAt { get; set; }
}

public class UpdatePostDto
{
    public string? Title { get; set; }
    public decimal? BaseRentPrice { get; set; }
    public int? MaxOccupants { get; set; }
    public int? CurrentOccupants { get; set; }
    public string? MoveInType { get; set; }
    public DateTime? MoveInDate { get; set; }
    public bool? FloodProne { get; set; }
    public string? LandlordRequirements { get; set; }
    public string? ContactType { get; set; }
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public List<PostServiceLineItemDto>? ServicePrices { get; set; }
    public List<string>? ImageUrls { get; set; }
    public List<string>? Amenities { get; set; }
}

public class PostEditHistoryDto
{
    public long Id { get; set; }
    public string Version { get; set; } = null!;
    public string Summary { get; set; } = null!;
    public string? ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
    public bool IsCurrent { get; set; }
    public List<string> Changes { get; set; } = new();
}
