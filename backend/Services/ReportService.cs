using backend.DTOs;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IReportService
{
    Task<DashboardStatsDto> GetDashboardStatsAsync();
    Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int year);
    Task<RoomStatsDto> GetRoomStatsAsync();
    Task<RevenueStatsDto> GetRevenueStatsAsync();
    Task<DebtStatsDto> GetDebtStatsAsync();
}

public class ReportService : IReportService
{
    private readonly IRoomRepository _roomRepository;
    private readonly IHopDongRepository _hopDongRepository;
    private readonly IResidentRepository _residentRepository;
    private readonly IHoaDonRepository _hoaDonRepository;
    private readonly IThanhToanRepository _thanhToanRepository;
    private readonly IXeRepository _xeRepository;
    private readonly IYeuCauSuaChuaRepository _yeuCauRepository;

    public ReportService(
        IRoomRepository roomRepository,
        IHopDongRepository hopDongRepository,
        IResidentRepository residentRepository,
        IHoaDonRepository hoaDonRepository,
        IThanhToanRepository thanhToanRepository,
        IXeRepository xeRepository,
        IYeuCauSuaChuaRepository yeuCauRepository)
    {
        _roomRepository = roomRepository;
        _hopDongRepository = hopDongRepository;
        _residentRepository = residentRepository;
        _hoaDonRepository = hoaDonRepository;
        _thanhToanRepository = thanhToanRepository;
        _xeRepository = xeRepository;
        _yeuCauRepository = yeuCauRepository;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        return new DashboardStatsDto
        {
            RoomStats = await GetRoomStatsAsync(),
            RevenueStats = await GetRevenueStatsAsync(),
            DebtStats = await GetDebtStatsAsync(),
            ResidentStats = await GetResidentStatsAsync(),
            VehicleStats = await GetVehicleStatsAsync(),
            MaintenanceStats = await GetMaintenanceStatsAsync()
        };
    }

    public async Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int year)
    {
        var invoices = await _hoaDonRepository.GetAllAsync();
        var payments = await _thanhToanRepository.GetAllAsync();

        var monthlyRevenue = new List<MonthlyRevenueDto>();

        for (int month = 1; month <= 12; month++)
        {
            var monthInvoices = invoices.Where(i => i.Year == year && i.Month == month).ToList();
            var monthPayments = payments
                .Where(p => p.PaidAt.HasValue && p.PaidAt.Value.Year == year && p.PaidAt.Value.Month == month && p.InvoiceId != null)
                .ToList();

            monthlyRevenue.Add(new MonthlyRevenueDto
            {
                Month = month,
                Year = year,
                TotalRevenue = monthPayments.Sum(p => p.Amount),
                RoomRentRevenue = 0, // Could be calculated from line items
                ServiceRevenue = 0,
                OtherRevenue = 0
            });
        }

        return monthlyRevenue;
    }

    public async Task<RoomStatsDto> GetRoomStatsAsync()
    {
        var rooms = await _roomRepository.GetAllAsync();
        var totalRooms = rooms.Count();
        var occupiedRooms = rooms.Count(r => r.Status == "Đã thuê");
        var availableRooms = rooms.Count(r => r.Status == "Trống");
        var maintenanceRooms = rooms.Count(r => r.Status == "Bảo trì");

        return new RoomStatsDto
        {
            TotalRooms = totalRooms,
            OccupiedRooms = occupiedRooms,
            AvailableRooms = availableRooms,
            MaintenanceRooms = maintenanceRooms,
            OccupancyRate = totalRooms > 0 ? (decimal)occupiedRooms / totalRooms * 100 : 0
        };
    }

    public async Task<RevenueStatsDto> GetRevenueStatsAsync()
    {
        var payments = await _thanhToanRepository.GetAllAsync();
        var now = DateTime.UtcNow;

        var currentMonthPayments = payments
            .Where(p => p.PaidAt.HasValue && p.PaidAt.Value.Year == now.Year && p.PaidAt.Value.Month == now.Month && p.InvoiceId != null)
            .Sum(p => p.Amount);

        var lastMonth = now.AddMonths(-1);
        var lastMonthPayments = payments
            .Where(p => p.PaidAt.HasValue && p.PaidAt.Value.Year == lastMonth.Year && p.PaidAt.Value.Month == lastMonth.Month && p.InvoiceId != null)
            .Sum(p => p.Amount);

        var yearToDatePayments = payments
            .Where(p => p.PaidAt.HasValue && p.PaidAt.Value.Year == now.Year && p.InvoiceId != null)
            .Sum(p => p.Amount);

        var growthRate = lastMonthPayments > 0 
            ? ((currentMonthPayments - lastMonthPayments) / lastMonthPayments) * 100 
            : 0;

        return new RevenueStatsDto
        {
            CurrentMonthRevenue = currentMonthPayments,
            LastMonthRevenue = lastMonthPayments,
            YearToDateRevenue = yearToDatePayments,
            AverageMonthlyRevenue = now.Month > 0 ? yearToDatePayments / now.Month : 0,
            GrowthRate = growthRate
        };
    }

    public async Task<DebtStatsDto> GetDebtStatsAsync()
    {
        var invoices = await _hoaDonRepository.GetAllAsync();
        var now = DateTime.UtcNow;

        var unpaidInvoices = invoices.Where(i => 
            i.Status == "Chưa thanh toán" || i.Status == "Đã thanh toán một phần").ToList();

        var overdueInvoices = unpaidInvoices.Where(i => 
            i.DueDate.HasValue && i.DueDate.Value < now).ToList();

        return new DebtStatsDto
        {
            TotalOutstanding = unpaidInvoices.Sum(i => i.TotalAmount),
            OverdueInvoicesCount = overdueInvoices.Count,
            OverdueAmount = overdueInvoices.Sum(i => i.TotalAmount),
            UnpaidInvoicesCount = unpaidInvoices.Count
        };
    }

    private async Task<ResidentStatsDto> GetResidentStatsAsync()
    {
        var residents = await _residentRepository.GetAllAsync();
        var contracts = await _hopDongRepository.GetActiveContractsAsync();

        return new ResidentStatsDto
        {
            TotalResidents = residents.Count(),
            ActiveContracts = contracts.Count(),
            NewResidentsThisMonth = 0 // Resident model doesn't have CreatedAt
        };
    }

    private async Task<VehicleStatsDto> GetVehicleStatsAsync()
    {
        var vehicles = await _xeRepository.GetAllAsync();

        return new VehicleStatsDto
        {
            TotalVehicles = vehicles.Count(),
            Cars = vehicles.Count(v => v.VehicleType == "Ô tô"),
            Motorcycles = vehicles.Count(v => v.VehicleType == "Xe máy"),
            Bicycles = vehicles.Count(v => v.VehicleType == "Xe đạp")
        };
    }

    private async Task<MaintenanceStatsDto> GetMaintenanceStatsAsync()
    {
        var requests = await _yeuCauRepository.GetAllAsync();

        return new MaintenanceStatsDto
        {
            TotalRequests = requests.Count(),
            PendingRequests = requests.Count(r => r.Status == "Chờ xử lý"),
            InProgressRequests = requests.Count(r => r.Status == "Đang xử lý"),
            CompletedRequests = requests.Count(r => r.Status == "Hoàn thành"),
            RejectedRequests = requests.Count(r => r.Status == "Từ chối")
        };
    }
}
