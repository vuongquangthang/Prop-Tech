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

/// <summary>
/// DTO for comprehensive dashboard statistics
/// </summary>
public class DashboardStatsDto
{
    public RoomStatsDto RoomStats { get; set; } = new();
    public RevenueStatsDto RevenueStats { get; set; } = new();
    public DebtStatsDto DebtStats { get; set; } = new();
    public ResidentStatsDto ResidentStats { get; set; } = new();
    public VehicleStatsDto VehicleStats { get; set; } = new();
    public MaintenanceStatsDto MaintenanceStats { get; set; } = new();
}

public class RoomStatsDto
{
    public int TotalRooms { get; set; }
    public int OccupiedRooms { get; set; }
    public int AvailableRooms { get; set; }
    public int MaintenanceRooms { get; set; }
    public decimal OccupancyRate { get; set; }
}

public class RevenueStatsDto
{
    public decimal CurrentMonthRevenue { get; set; }
    public decimal LastMonthRevenue { get; set; }
    public decimal YearToDateRevenue { get; set; }
    public decimal AverageMonthlyRevenue { get; set; }
    public decimal GrowthRate { get; set; }
}

public class DebtStatsDto
{
    public decimal TotalOutstanding { get; set; }
    public int OverdueInvoicesCount { get; set; }
    public decimal OverdueAmount { get; set; }
    public int UnpaidInvoicesCount { get; set; }
}

public class ResidentStatsDto
{
    public int TotalResidents { get; set; }
    public int ActiveContracts { get; set; }
    public int NewResidentsThisMonth { get; set; }
}

public class VehicleStatsDto
{
    public int TotalVehicles { get; set; }
    public int Cars { get; set; }
    public int Motorcycles { get; set; }
    public int Bicycles { get; set; }
}

public class MaintenanceStatsDto
{
    public int TotalRequests { get; set; }
    public int PendingRequests { get; set; }
    public int InProgressRequests { get; set; }
    public int CompletedRequests { get; set; }
    public int RejectedRequests { get; set; }
}

/// <summary>
/// DTO for monthly revenue report
/// </summary>
public class MonthlyRevenueDto
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal CollectedRevenue { get; set; }
    public decimal OutstandingRevenue { get; set; }
    public decimal RoomRentRevenue { get; set; }
    public decimal ServiceRevenue { get; set; }
    public decimal OtherRevenue { get; set; }
}

/// <summary>
/// DTO for occupancy trend
/// </summary>
public class OccupancyTrendDto
{
    public DateTime Date { get; set; }
    public int OccupiedRooms { get; set; }
    public int TotalRooms { get; set; }
    public decimal OccupancyRate { get; set; }
}
