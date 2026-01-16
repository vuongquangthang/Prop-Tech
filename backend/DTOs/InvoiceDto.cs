namespace backend.DTOs;

public class InvoiceDto
{
    public long Id { get; set; }
    public string InvoiceNumber { get; set; } = null!;
    public long BillingPeriodId { get; set; }
    public long RoomId { get; set; }
    public string RoomCode { get; set; } = null!;
    public int Headcount { get; set; }
    public decimal RoomCharge { get; set; }
    public decimal WaterCharge { get; set; }
    public decimal ElectricityCharge { get; set; }
    public decimal ServiceCharge { get; set; }
    public decimal AdjustmentAmount { get; set; }
    public string? AdjustmentNote { get; set; }
    public decimal LateFee { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string Status { get; set; } = null!;
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? VoidReason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class InvoiceDetailDto : InvoiceDto
{
    public List<InvoiceLineItemDto> LineItems { get; set; } = new();
    public decimal? SnapshotRoomRent { get; set; }
    public decimal? SnapshotWaterPrice { get; set; }
    public decimal? SnapshotElectricityPrice { get; set; }
    public decimal? SnapshotServicePrice { get; set; }
}

public class InvoiceLineItemDto
{
    public long Id { get; set; }
    public string ItemType { get; set; } = null!;
    public string Description { get; set; } = null!;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
    public string? TierInfo { get; set; }
}

public class CreateInvoiceDto
{
    public long BillingPeriodId { get; set; }
    public long RoomId { get; set; }
}

public class AdjustInvoiceDto
{
    public decimal AdjustmentAmount { get; set; }
    public string AdjustmentNote { get; set; } = null!;
}

public class ConfirmInvoiceDto
{
    public string? Notes { get; set; }
}

public class VoidInvoiceDto
{
    public string VoidReason { get; set; } = null!;
}
