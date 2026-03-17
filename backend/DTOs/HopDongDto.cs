namespace backend.DTOs;

/// <summary>
/// DTO cho hợp đồng với danh sách cư dân
/// </summary>
public class HopDongDto
{
    public int Id { get; set; }
    public string? ContractCode { get; set; }
    public int RoomId { get; set; }
    public string? RoomNumber { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public decimal ActualRentPrice { get; set; }
    public decimal? DepositAmount { get; set; }
    public List<ResidentInContractDto> Residents { get; set; } = new();
}

/// <summary>
/// DTO để tạo hợp đồng mới
/// </summary>
public class CreateHopDongDto
{
    public int RoomId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? ExpectedEndDate { get; set; }
    public decimal ActualRentPrice { get; set; }
    public decimal? DepositAmount { get; set; }
    public List<CreateChiTietODto> Residents { get; set; } = new();
}

/// <summary>
/// DTO để cập nhật hợp đồng
/// </summary>
public class UpdateHopDongDto
{
    public DateTime? ExpectedEndDate { get; set; }
    public decimal? ActualRentPrice { get; set; }
    public decimal? DepositAmount { get; set; }
}

/// <summary>
/// DTO để gán cư dân vào hợp đồng
/// </summary>
public class CreateChiTietODto
{
    public int ResidentId { get; set; }
    public string ResidencyRole { get; set; } = "Người thuê"; // Người thuê chính, Người ở cùng, Khác
    public DateTime FromDate { get; set; }
}

/// <summary>
/// DTO hiển thị cư dân trong hợp đồng
/// </summary>
public class ResidentInContractDto
{
    public int ResidentId { get; set; }
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? IdCardNumber { get; set; }
    public string? Hometown { get; set; }
    public string ResidencyRole { get; set; } = null!;
    public DateTime FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
