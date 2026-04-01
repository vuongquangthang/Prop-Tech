namespace backend.DTOs;

public class ServicePriceChangeDto
{
    public int ServiceId { get; set; }
    public decimal NewPrice { get; set; }
}

public class SendContractChangeProposalDto
{
    public DateTime EffectiveDate { get; set; }
    public decimal? NewRentPrice { get; set; }
    public List<ServicePriceChangeDto> ServicePriceChanges { get; set; } = new();
    public List<int> AddedServiceIds { get; set; } = new();
    public string? Note { get; set; }
}

public class RespondContractChangeDto
{
    public string? Message { get; set; }
}

public class ContractChangeDetailDto
{
    public int NotificationId { get; set; }
    public string Status { get; set; } = "PENDING";
    public DateTime CreatedAt { get; set; }
    public DateTime EffectiveDate { get; set; }
    public int ContractId { get; set; }
    public string? ContractCode { get; set; }
    public int RoomId { get; set; }
    public string? RoomNumber { get; set; }
    public decimal CurrentRentPrice { get; set; }
    public decimal? ProposedRentPrice { get; set; }
    public string? Note { get; set; }
    public string? ResidentMessage { get; set; }
    public List<ServicePriceChangeDetailDto> ServicePriceChanges { get; set; } = new();
    public List<AddedServiceDetailDto> AddedServices { get; set; } = new();
}

public class ContractChangeTrackingItemDto
{
    public int NotificationId { get; set; }
    public int ContractId { get; set; }
    public string? ContractCode { get; set; }
    public int RoomId { get; set; }
    public string? RoomNumber { get; set; }
    public string Status { get; set; } = "PENDING";
    public DateTime CreatedAt { get; set; }
    public DateTime EffectiveDate { get; set; }
    public decimal CurrentRentPrice { get; set; }
    public decimal? ProposedRentPrice { get; set; }
    public string? Note { get; set; }
    public string? ResidentMessage { get; set; }
    public int ServicePriceChangeCount { get; set; }
    public int AddedServiceCount { get; set; }
}

public class ServicePriceChangeDetailDto
{
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public decimal CurrentPrice { get; set; }
    public decimal NewPrice { get; set; }
}

public class AddedServiceDetailDto
{
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public string? Unit { get; set; }
}
