namespace backend.DTOs;

/// <summary>
/// DTO cho xe
/// </summary>
public class XeDto
{
    public int Id { get; set; }
    public int ResidentId { get; set; }
    public string? ResidentName { get; set; }
    public string? PhoneNumber { get; set; }
    public string LicensePlate { get; set; } = null!;
    public string VehicleType { get; set; } = null!; // Xe máy, Ô tô, Xe đạp, Khác
    public DateTime RegistrationDate { get; set; }
    public DateTime? CancellationDate { get; set; }
    public bool IsActive => CancellationDate == null;
}

/// <summary>
/// DTO để đăng ký xe mới
/// </summary>
public class CreateXeDto
{
    public int ResidentId { get; set; }
    public string LicensePlate { get; set; } = null!;
    public string VehicleType { get; set; } = null!; // Xe máy, Ô tô, Xe đạp, Khác
}

/// <summary>
/// DTO để cập nhật xe
/// </summary>
public class UpdateXeDto
{
    public string? LicensePlate { get; set; }
    public string? VehicleType { get; set; }
}

/// <summary>
/// DTO để hủy đăng ký xe
/// </summary>
public class CancelXeDto
{
    public DateTime CancellationDate { get; set; } = DateTime.UtcNow;
}
