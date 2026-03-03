namespace backend.DTOs;

/// <summary>
/// DTO cho chi tiết sử dụng dịch vụ
/// </summary>
public class ChiTietSuDungDichVuDto
{
    public long Id { get; set; }
    public int ServiceId { get; set; }
    public string? ServiceName { get; set; }
    public string? ServiceType { get; set; }
    public int ResidentId { get; set; }
    public string? ResidentName { get; set; }
    public int RoomId { get; set; }
    public string? RoomNumber { get; set; }
    public int? VehicleId { get; set; }
    public string? LicensePlate { get; set; }
    public DateTime ApplyFrom { get; set; }
    public DateTime? ApplyTo { get; set; }
    public decimal? OverrideUnitPrice { get; set; }
    public decimal? Quantity { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive => ApplyTo == null || ApplyTo >= DateTime.UtcNow;
}

/// <summary>
/// DTO để tạo chi tiết sử dụng dịch vụ
/// </summary>
public class CreateChiTietSuDungDichVuDto
{
    public int ServiceId { get; set; }
    public int ResidentId { get; set; }
    public int RoomId { get; set; }
    public int? VehicleId { get; set; } // Required for parking services
    public DateTime ApplyFrom { get; set; }
    public DateTime? ApplyTo { get; set; }
    public decimal? OverrideUnitPrice { get; set; }
    public decimal? Quantity { get; set; } = 1;
    public string? Note { get; set; }
}

/// <summary>
/// DTO để cập nhật chi tiết sử dụng dịch vụ
/// </summary>
public class UpdateChiTietSuDungDichVuDto
{
    public DateTime? ApplyTo { get; set; }
    public decimal? OverrideUnitPrice { get; set; }
    public decimal? Quantity { get; set; }
    public string? Note { get; set; }
}

/// <summary>
/// DTO để kết thúc sử dụng dịch vụ
/// </summary>
public class EndChiTietSuDungDichVuDto
{
    public DateTime ApplyTo { get; set; } = DateTime.UtcNow;
}
