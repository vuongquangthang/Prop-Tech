using backend.DTOs;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IReportService
{
    Task<List<RoomStatusDto>> GetRoomStatusByBuildingAsync();
    Task<List<FloorStatusDto>> GetRoomStatusByFloorAsync(long buildingId);
    Task<List<ReceivablesDto>> GetReceivablesReportAsync(long? buildingId = null);
    Task<List<RevenueSummaryDto>> GetRevenueSummaryAsync(long? billingPeriodId = null);
    Task<List<ComplaintStatisticsDto>> GetComplaintStatisticsAsync();
    Task<DashboardSummaryDto> GetDashboardSummaryAsync();
}

public class ReportService : IReportService
{
    private readonly IBuildingRepository _buildingRepository;
    private readonly IFloorRepository _floorRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly IResidencyRepository _residencyRepository;
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IBillingPeriodRepository _billingPeriodRepository;
    private readonly IComplaintRepository _complaintRepository;
    private readonly ILogger<ReportService> _logger;

    public ReportService(
        IBuildingRepository buildingRepository,
        IFloorRepository floorRepository,
        IRoomRepository roomRepository,
        IResidencyRepository residencyRepository,
        IInvoiceRepository invoiceRepository,
        IBillingPeriodRepository billingPeriodRepository,
        IComplaintRepository complaintRepository,
        ILogger<ReportService> logger)
    {
        _buildingRepository = buildingRepository;
        _floorRepository = floorRepository;
        _roomRepository = roomRepository;
        _residencyRepository = residencyRepository;
        _invoiceRepository = invoiceRepository;
        _billingPeriodRepository = billingPeriodRepository;
        _complaintRepository = complaintRepository;
        _logger = logger;
    }

    public async Task<List<RoomStatusDto>> GetRoomStatusByBuildingAsync()
    {
        var buildings = (await _buildingRepository.FindAsync(b => true)).ToList();
        var result = new List<RoomStatusDto>();

        foreach (var building in buildings)
        {
            var rooms = (await _roomRepository.FindAsync(r => r.Floor!.BuildingId == building.Id)).ToList();
            var occupiedRooms = (await _residencyRepository.FindAsync(
                r => r.CheckOutDate == null && rooms.Select(rm => rm.Id).Contains(r.RoomId)
            )).ToList();

            result.Add(new RoomStatusDto
            {
                BuildingId = building.Id,
                BuildingCode = building.BuildingCode,
                OccupiedCount = occupiedRooms.Count,
                VacantCount = rooms.Count - occupiedRooms.Count,
                TotalCount = rooms.Count
            });
        }

        return result;
    }

    public async Task<List<FloorStatusDto>> GetRoomStatusByFloorAsync(long buildingId)
    {
        var floors = (await _floorRepository.FindAsync(f => f.BuildingId == buildingId)).ToList();
        var result = new List<FloorStatusDto>();

        foreach (var floor in floors)
        {
            var rooms = (await _roomRepository.FindAsync(r => r.FloorId == floor.Id)).ToList();
            var occupiedRooms = (await _residencyRepository.FindAsync(
                r => r.CheckOutDate == null && rooms.Select(rm => rm.Id).Contains(r.RoomId)
            )).ToList();

            result.Add(new FloorStatusDto
            {
                FloorId = floor.Id,
                FloorCode = floor.FloorName ?? $"Floor {floor.FloorNumber}",
                BuildingId = buildingId,
                OccupiedCount = occupiedRooms.Count,
                VacantCount = rooms.Count - occupiedRooms.Count,
                TotalCount = rooms.Count
            });
        }

        return result.OrderBy(x => x.FloorCode).ToList();
    }

    public async Task<List<ReceivablesDto>> GetReceivablesReportAsync(long? buildingId = null)
    {
        var invoices = (await _invoiceRepository.FindAsync(i =>
            i.Status != "PAID" && i.Status != "VOIDED"
        )).ToList();

        var result = new List<ReceivablesDto>();

        // Group by room and sum unpaid amounts
        var groupedByRoom = invoices
            .GroupBy(i => i.RoomId)
            .ToList();

        foreach (var roomGroup in groupedByRoom)
        {
            var room = await _roomRepository.GetByIdAsync(roomGroup.Key);
            if (room == null || (buildingId.HasValue && room.Floor!.BuildingId != buildingId.Value))
                continue;

            var totalAmount = roomGroup.Sum(i =>
            {
                var remainingBalance = (i.TotalAmount - i.PaidAmount);
                return remainingBalance > 0m ? remainingBalance : 0m;
            });

            if (totalAmount > 0)
            {
                result.Add(new ReceivablesDto
                {
                    RoomId = room.Id,
                    RoomCode = room.RoomCode,
                    BuildingId = room.Floor!.BuildingId,
                    BuildingCode = room.Floor.Building!.BuildingCode,
                    Amount = totalAmount,
                    InvoiceCount = roomGroup.Count(),
                    OldestInvoiceDate = roomGroup.Min(i => i.CreatedAt)
                });
            }
        }

        return result.OrderByDescending(r => r.Amount).ToList();
    }

    public async Task<List<RevenueSummaryDto>> GetRevenueSummaryAsync(long? billingPeriodId = null)
    {
        var periods = billingPeriodId.HasValue
            ? (await _billingPeriodRepository.FindAsync(p => p.Id == billingPeriodId.Value)).ToList()
            : (await _billingPeriodRepository.GetAllAsync()).ToList();

        var result = new List<RevenueSummaryDto>();

        foreach (var period in periods)
        {
            var periodInvoices = (await _invoiceRepository.FindAsync(i => i.BillingPeriodId == period.Id)).ToList();

            var totalRevenue = periodInvoices.Sum(i => i.TotalAmount);
            var totalCollected = periodInvoices.Sum(i => i.PaidAmount);
            var collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;

            result.Add(new RevenueSummaryDto
            {
                BillingPeriodId = period.Id,
                PeriodCode = period.PeriodMonth.ToString("yyyy-MM"),
                TotalRevenue = totalRevenue,
                TotalCollected = totalCollected,
                CollectionRate = (decimal)collectionRate,
                InvoiceCount = periodInvoices.Count,
                PaidCount = periodInvoices.Count(i => i.Status == "PAID")
            });
        }

        return result.OrderByDescending(r => r.BillingPeriodId).ToList();
    }

    public async Task<List<ComplaintStatisticsDto>> GetComplaintStatisticsAsync()
    {
        var complaints = (await _complaintRepository.FindAsync(c => true)).ToList();

        var statuses = new[] { "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED" };
        var result = new List<ComplaintStatisticsDto>();

        foreach (var status in statuses)
        {
            var statusComplaints = complaints.Where(c => c.Status == status).ToList();
            if (statusComplaints.Count == 0) continue;

            var byCategory = statusComplaints
                .GroupBy(c => c.Category)
                .ToDictionary(g => g.Key, g => g.Count());

            var byPriority = statusComplaints
                .GroupBy(c => c.Priority)
                .ToDictionary(g => g.Key, g => g.Count());

            result.Add(new ComplaintStatisticsDto
            {
                Status = status,
                Count = statusComplaints.Count,
                ByCategory = byCategory,
                ByPriority = byPriority
            });
        }

        return result;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync()
    {
        var buildings = (await _buildingRepository.FindAsync(b => true)).ToList();
        var rooms = (await _roomRepository.FindAsync(r => true)).ToList();
        var occupiedRooms = (await _residencyRepository.FindAsync(r => r.CheckOutDate == null)).ToList();

        var invoices = (await _invoiceRepository.FindAsync(i => i.Status != "PAID" && i.Status != "VOID")).ToList();
        var totalReceivables = invoices.Sum(i => i.TotalAmount - i.PaidAmount);

        var complaints = (await _complaintRepository.FindAsync(c => true)).ToList();
        var unresolvedComplaints = complaints.Count(c => c.Status == "OPEN" || c.Status == "IN_PROGRESS");

        var resolvedComplaints = complaints
            .Where(c => c.Status == "RESOLVED" || c.Status == "CLOSED")
            .ToList();

        var avgResolutionDays = 0.0;
        if (resolvedComplaints.Count > 0)
        {
            avgResolutionDays = resolvedComplaints.Average(c =>
                ((c.ResolvedAt ?? DateTime.UtcNow) - c.CreatedAt).TotalDays
            );
        }

        var occupancyRate = rooms.Count > 0 ? (occupiedRooms.Count * 100.0m) / rooms.Count : 0;

        return new DashboardSummaryDto
        {
            TotalBuildings = buildings.Count,
            TotalRooms = rooms.Count,
            OccupiedRooms = occupiedRooms.Count,
            VacantRooms = rooms.Count - occupiedRooms.Count,
            OccupancyRate = occupancyRate,
            TotalReceivables = totalReceivables,
            TotalComplaints = complaints.Count,
            UnresolvedComplaints = unresolvedComplaints,
            AverageComplaintResolutionDays = (decimal)avgResolutionDays
        };
    }
}
