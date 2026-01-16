namespace backend.DTOs;

public class ResidencyDto
{
    public long Id { get; set; }
    public long RoomId { get; set; }
    public long ResidentId { get; set; }
    public string OwnershipType { get; set; } = null!;
    public bool IsPrimaryResident { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime? CheckOutDate { get; set; }
    public string Status { get; set; } = null!;
    public string? ContractNumber { get; set; }
    public DateTime? ContractStartDate { get; set; }
    public DateTime? ContractEndDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CheckInResidencyDto
{
    public long RoomId { get; set; }
    public long ResidentId { get; set; }
    public string OwnershipType { get; set; } = "TENANT"; // OWNER, TENANT
    public bool IsPrimaryResident { get; set; }
    public DateTime CheckInDate { get; set; }
    public string? ContractNumber { get; set; }
    public DateTime? ContractStartDate { get; set; }
    public DateTime? ContractEndDate { get; set; }
    public string? Notes { get; set; }
}

public class CheckOutResidencyDto
{
    public DateTime CheckOutDate { get; set; }
}

public class UpdateResidencyDto
{
    public string OwnershipType { get; set; } = null!;
    public bool IsPrimaryResident { get; set; }
    public string? ContractNumber { get; set; }
    public DateTime? ContractStartDate { get; set; }
    public DateTime? ContractEndDate { get; set; }
    public string? Notes { get; set; }
}
