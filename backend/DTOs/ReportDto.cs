namespace backend.DTOs;

public class RoomStatusDto
{
    public long BuildingId { get; set; }
    public string BuildingCode { get; set; } = null!;
    public int OccupiedCount { get; set; }
    public int VacantCount { get; set; }
    public int TotalCount { get; set; }
}

public class FloorStatusDto
{
    public long FloorId { get; set; }
    public string FloorCode { get; set; } = null!;
    public long BuildingId { get; set; }
    public int OccupiedCount { get; set; }
    public int VacantCount { get; set; }
    public int TotalCount { get; set; }
}

public class ReceivablesDto
{
    public long RoomId { get; set; }
    public string RoomCode { get; set; } = null!;
    public long BuildingId { get; set; }
    public string BuildingCode { get; set; } = null!;
    public decimal Amount { get; set; }
    public long InvoiceCount { get; set; }
    public DateTime OldestInvoiceDate { get; set; }
}

public class RevenueSummaryDto
{
    public long BillingPeriodId { get; set; }
    public string PeriodCode { get; set; } = null!;
    public decimal TotalRevenue { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal CollectionRate { get; set; }
    public long InvoiceCount { get; set; }
    public long PaidCount { get; set; }
}

public class ComplaintStatisticsDto
{
    public string Status { get; set; } = null!;
    public int Count { get; set; }
    public Dictionary<string, int> ByCategory { get; set; } = new();
    public Dictionary<string, int> ByPriority { get; set; } = new();
}

public class DashboardSummaryDto
{
    public int TotalBuildings { get; set; }
    public int TotalRooms { get; set; }
    public int OccupiedRooms { get; set; }
    public int VacantRooms { get; set; }
    public decimal OccupancyRate { get; set; }
    public decimal TotalReceivables { get; set; }
    public int TotalComplaints { get; set; }
    public int UnresolvedComplaints { get; set; }
    public decimal AverageComplaintResolutionDays { get; set; }
}
