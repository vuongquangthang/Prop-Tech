using System.ComponentModel.DataAnnotations;
using backend.Validation;

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
    public int? OwnerUserId { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

/// <summary>
/// DTO để tạo tòa nhà mới
/// </summary>
public class CreateBuildingDto
{
    [Required(ErrorMessage = "Vui lòng nhập tên tòa nhà")]
    [StringLength(255)]
    [NoHtml]
    public string BuildingName { get; set; } = null!;

    [Required(ErrorMessage = "Vui lòng nhập địa chỉ")]
    [StringLength(500)]
    [NoHtml]
    public string Address { get; set; } = null!;

    public int NumberOfFloors { get; set; }

    [StringLength(2000)]
    [NoHtml]
    public string? Description { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

/// <summary>
/// DTO để cập nhật tòa nhà
/// </summary>
public class UpdateBuildingDto
{
    [StringLength(255)]
    [NoHtml]
    public string? BuildingName { get; set; }

    [StringLength(500)]
    [NoHtml]
    public string? Address { get; set; }

    public int? NumberOfFloors { get; set; }

    [StringLength(2000)]
    [NoHtml]
    public string? Description { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

/// <summary>
/// DTO chi tiết tòa nhà (bao gồm tầng và phòng)
/// </summary>
public class BuildingDetailDto : BuildingDto
{
    public List<FloorDto> Floors { get; set; } = new();
}
