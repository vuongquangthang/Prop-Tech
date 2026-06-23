namespace backend.DTOs;

/// <summary>
/// DTO cho phòng
/// </summary>
public class RoomDto
{
    public int Id { get; set; }
    public int FloorId { get; set; }
    public int BuildingId { get; set; }
    public string BuildingName { get; set; } = null!;
    public string BuildingAddress { get; set; } = "";
    public int FloorNumber { get; set; }
    public string RoomCode { get; set; } = null!;
    public decimal? Area { get; set; }
    public int? MaxOccupants { get; set; }
    public decimal? DefaultRentPrice { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = null!; // Trống, Đã thuê, Bảo trì, Khác
    public DateTime? ActiveContractEndDate { get; set; }
    public string RoomType { get; set; } = "single";
    public bool HasPrivateBathroom { get; set; }
    public int? LivingRoomCount { get; set; }
    public int? BedroomCount { get; set; }
    public int? KitchenCount { get; set; }
    public int? BathroomCount { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public List<string> Amenities { get; set; } = new();
    public List<int> ServiceIds { get; set; } = new();
    public List<RoomServicePriceDto> ServicePrices { get; set; } = new();
    public List<ServiceInfoDto> Services { get; set; } = new();
}

/// <summary>
/// DTO để tạo phòng mới
/// </summary>
public class CreateRoomDto
{
    public int FloorId { get; set; }
    public string RoomCode { get; set; } = null!;
    public decimal? Area { get; set; }
    public int? MaxOccupants { get; set; }
    public decimal? DefaultRentPrice { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "Trống";
    public string RoomType { get; set; } = "single";
    public bool HasPrivateBathroom { get; set; }
    public int? LivingRoomCount { get; set; }
    public int? BedroomCount { get; set; }
    public int? KitchenCount { get; set; }
    public int? BathroomCount { get; set; }
    public List<string>? ImageUrls { get; set; }
    public List<string>? Amenities { get; set; }
    public List<int>? ServiceIds { get; set; }
    public List<RoomServicePriceDto>? ServicePrices { get; set; }
}

/// <summary>
/// DTO để cập nhật phòng
/// </summary>
public class UpdateRoomDto
{
    public string? RoomCode { get; set; }
    public decimal? Area { get; set; }
    public int? MaxOccupants { get; set; }
    public decimal? DefaultRentPrice { get; set; }
    public string? Description { get; set; }
    public string? Status { get; set; }
    public string? RoomType { get; set; }
    public bool? HasPrivateBathroom { get; set; }
    public int? LivingRoomCount { get; set; }
    public int? BedroomCount { get; set; }
    public int? KitchenCount { get; set; }
    public int? BathroomCount { get; set; }
    public List<string>? ImageUrls { get; set; }
    public List<string>? Amenities { get; set; }
    public List<int>? ServiceIds { get; set; }
    public List<RoomServicePriceDto>? ServicePrices { get; set; }
}

public class RoomServicePriceDto
{
    public int ServiceId { get; set; }
    public decimal Price { get; set; }
}

/// <summary>
/// DTO chi tiết phòng (bao gồm hợp đồng và tài sản)
/// </summary>
public class RoomDetailDto : RoomDto
{
    public List<ContractSummaryDto>? ActiveContracts { get; set; }
    public List<AssetSummaryDto>? Assets { get; set; }
}

/// <summary>
/// DTO tóm tắt hợp đồng (dùng trong RoomDetail)
/// </summary>
public class ContractSummaryDto
{
    public int Id { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public decimal ActualRentPrice { get; set; }
    public List<string> ResidentNames { get; set; } = new();
}

/// <summary>
/// DTO tóm tắt tài sản (dùng trong RoomDetail)
/// </summary>
public class AssetSummaryDto
{
    public int AssetId { get; set; }
    public string AssetName { get; set; } = null!;
    public int Quantity { get; set; }
    public string? Condition { get; set; }
}

/// <summary>
/// DTO thông tin phòng của cư dân hiện tại (My Room)
/// </summary>
public class MyRoomDto
{
    public int RoomId { get; set; }
    public string RoomCode { get; set; } = null!;
    public decimal? Area { get; set; }
    public string Status { get; set; } = null!;
    
    // Building & Floor info
    public int BuildingId { get; set; }
    public string BuildingName { get; set; } = null!;
    public string BuildingAddress { get; set; } = null!;
    public int FloorId { get; set; }
    public int FloorNumber { get; set; }
    
    // Contract info
    public int ContractId { get; set; }
    public DateTime ContractStartDate { get; set; }
    public DateTime? ContractEndDate { get; set; }
    public decimal RentPrice { get; set; }
    public decimal Deposit { get; set; }
    public string? HouseholdHeadName { get; set; }
    
    // Services info
    public List<ServiceInfoDto> Services { get; set; } = new();
    
    // Pricing info
    public decimal? ElectricityBasePrice { get; set; }
    public List<ElectricityTierDto> ElectricityTiers { get; set; } = new();
    public decimal? WaterPricePerCubicMeter { get; set; }
}

/// <summary>
/// DTO thông tin dịch vụ
/// </summary>
public class ServiceInfoDto
{
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = null!;
    public decimal Price { get; set; }
    public string Unit { get; set; } = null!;
}

/// <summary>
/// DTO bậc thang giá điện
/// </summary>
public class ElectricityTierDto
{
    public int TierNumber { get; set; }
    public int FromKwh { get; set; }
    public int? ToKwh { get; set; }
    public decimal PricePerKwh { get; set; }
}
