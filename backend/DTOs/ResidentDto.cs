namespace backend.DTOs;

/// <summary>
/// DTO cho cư dân
/// </summary>
public class ResidentDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? RoomCode { get; set; }
    public bool IsLocked { get; set; }
    public string? IdCardNumber { get; set; }
    public string? Hometown { get; set; }
    public string? IdCardFrontUrl { get; set; }
    public string? IdCardBackUrl { get; set; }
    public int? OwnerUserId { get; set; }
}

/// <summary>
/// DTO để tạo cư dân mới
/// </summary>
public class CreateResidentDto
{
    public string FullName { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? IdCardNumber { get; set; }
    public string? Hometown { get; set; }
    public string? IdCardFrontUrl { get; set; }
    public string? IdCardBackUrl { get; set; }
}

/// <summary>
/// DTO để cập nhật cư dân
/// </summary>
public class UpdateResidentDto
{
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? IdCardNumber { get; set; }
    public string? Hometown { get; set; }
    public string? IdCardFrontUrl { get; set; }
    public string? IdCardBackUrl { get; set; }
}

/// <summary>
/// DTO chi tiết cư dân (bao gồm hợp đồng và xe)
/// </summary>
public class ResidentDetailDto : ResidentDto
{
    public List<ContractSummaryDto>? Contracts { get; set; }
    public List<VehicleSummaryDto>? Vehicles { get; set; }
}

/// <summary>
/// DTO tóm tắt xe (dùng trong ResidentDetail)
/// </summary>
public class VehicleSummaryDto
{
    public int Id { get; set; }
    public string LicensePlate { get; set; } = null!;
    public string VehicleType { get; set; } = null!;
    public DateTime RegistrationDate { get; set; }
    public bool IsActive { get; set; }
}
