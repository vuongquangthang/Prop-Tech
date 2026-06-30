namespace backend.DTOs;

/// <summary>
/// DTO cho dịch vụ
/// </summary>
public class ServiceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string ServiceType { get; set; } = null!;
    public string? Unit { get; set; }
    public decimal? CommonUnitPrice { get; set; }
    public bool IsActive { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? PriceUpdatedAt { get; set; }
    public int? OwnerUserId { get; set; }
    public int? BuildingId { get; set; }
    public string? BuildingName { get; set; }
    public List<int> BuildingIds { get; set; } = new();
    public List<string> BuildingNames { get; set; } = new();
}

/// <summary>
/// DTO để tạo dịch vụ mới
/// </summary>
public class CreateServiceDto
{
    public string Name { get; set; } = null!;
    public string ServiceType { get; set; } = null!; // Điện | Nước | Cần nhập số lượng | Theo tháng
    public string? Unit { get; set; }
    public decimal? CommonUnitPrice { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public int? BuildingId { get; set; }
    public List<int>? BuildingIds { get; set; }
}

/// <summary>
/// DTO để cập nhật dịch vụ
/// </summary>
public class UpdateServiceDto
{
    public string? Name { get; set; }
    public string? ServiceType { get; set; }
    public string? Unit { get; set; }
    public decimal? CommonUnitPrice { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public string? Reason { get; set; }
    public int? BuildingId { get; set; }
    public List<int>? BuildingIds { get; set; }
}

/// <summary>
/// DTO lịch sử thay đổi đơn giá dịch vụ
/// </summary>
public class ServicePriceHistoryDto
{
    public int Id { get; set; }
    public decimal OldPrice { get; set; }
    public decimal NewPrice { get; set; }
    public DateTime EffectiveDate { get; set; }
    public string? Reason { get; set; }
    public DateTime ChangedAt { get; set; }
}

/// <summary>
/// DTO dịch vụ áp dụng theo hợp đồng/phòng
/// </summary>
public class ServiceInContractDto
{
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = null!;
    public string ServiceType { get; set; } = null!;
    public string? Unit { get; set; }
    public decimal? UnitPrice { get; set; }
    public DateTime ApplyFrom { get; set; }
    public DateTime? ApplyTo { get; set; }
    public DateTime? PriceUpdatedAt { get; set; }
    public decimal TotalQuantity { get; set; }
    public int ResidentCount { get; set; }
    public List<string> ResidentNames { get; set; } = new();
    public bool IsActive { get; set; }
    public string? Note { get; set; }
}
