using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IReportService
{
    Task<DashboardStatsDto> GetDashboardStatsAsync(int ownerUserId);
    Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int year, int ownerUserId);
    Task<RoomStatsDto> GetRoomStatsAsync(int ownerUserId);
    Task<RevenueStatsDto> GetRevenueStatsAsync(int ownerUserId);
    Task<DebtStatsDto> GetDebtStatsAsync(int ownerUserId);
}

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;

    public ReportService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync(int ownerUserId)
    {
        return new DashboardStatsDto
        {
            RoomStats = await GetRoomStatsAsync(ownerUserId),
            RevenueStats = await GetRevenueStatsAsync(ownerUserId),
            DebtStats = await GetDebtStatsAsync(ownerUserId),
            ResidentStats = await GetResidentStatsAsync(ownerUserId),
            VehicleStats = await GetVehicleStatsAsync(ownerUserId),
            MaintenanceStats = await GetMaintenanceStatsAsync(ownerUserId)
        };
    }

    public async Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int year, int ownerUserId)
    {
        var invoices = await InvoicesForOwner(ownerUserId)
            .AsNoTracking()
            .Include(invoice => invoice.ChiTietHoaDons)
            .ToListAsync();
        var payments = await PaymentsForOwner(ownerUserId)
            .AsNoTracking()
            .ToListAsync();

        var monthlyRevenue = new List<MonthlyRevenueDto>();

        for (var month = 1; month <= 12; month++)
        {
            var monthInvoices = invoices.Where(invoice => invoice.Year == year && invoice.Month == month).ToList();
            var monthPayments = payments
                .Where(payment => payment.PaidAt.HasValue
                    && payment.PaidAt.Value.Year == year
                    && payment.PaidAt.Value.Month == month
                    && payment.InvoiceId != null)
                .ToList();

            var lineItems = monthInvoices.SelectMany(invoice => invoice.ChiTietHoaDons).ToList();

            var roomRent = lineItems
                .Where(item => item.ItemType == "TienPhong")
                .Sum(item => (item.Quantity ?? 1m) * (item.UnitPrice ?? 0m));

            var serviceFee = lineItems
                .Where(item => item.ItemType == "Dien" || item.ItemType == "Nuoc" || item.ItemType == "DichVu")
                .Sum(item => (item.Quantity ?? 1m) * (item.UnitPrice ?? 0m));

            var other = lineItems
                .Where(item => item.ItemType == "PhatSinh" || item.ItemType == "KhauTru")
                .Sum(item => (item.Quantity ?? 1m) * (item.UnitPrice ?? 0m));

            monthlyRevenue.Add(new MonthlyRevenueDto
            {
                Month = month,
                Year = year,
                TotalRevenue = roomRent + serviceFee + other,
                RoomRentRevenue = roomRent,
                ServiceRevenue = serviceFee,
                OtherRevenue = other
            });
        }

        return monthlyRevenue;
    }

    public async Task<RoomStatsDto> GetRoomStatsAsync(int ownerUserId)
    {
        var rooms = await RoomsForOwner(ownerUserId).AsNoTracking().ToListAsync();
        var totalRooms = rooms.Count;
        var occupiedRooms = rooms.Count(room => room.Status == "Đã thuê" || room.Status == "ÄÃ£ thuÃª");
        var availableRooms = rooms.Count(room => room.Status == "Trống" || room.Status == "Trá»‘ng");
        var maintenanceRooms = rooms.Count(room => room.Status == "Bảo trì" || room.Status == "Báº£o trÃ¬");

        return new RoomStatsDto
        {
            TotalRooms = totalRooms,
            OccupiedRooms = occupiedRooms,
            AvailableRooms = availableRooms,
            MaintenanceRooms = maintenanceRooms,
            OccupancyRate = totalRooms > 0 ? (decimal)occupiedRooms / totalRooms * 100 : 0
        };
    }

    public async Task<RevenueStatsDto> GetRevenueStatsAsync(int ownerUserId)
    {
        var payments = await PaymentsForOwner(ownerUserId).AsNoTracking().ToListAsync();
        var now = DateTime.UtcNow;

        var currentMonthPayments = payments
            .Where(payment => payment.PaidAt.HasValue
                && payment.PaidAt.Value.Year == now.Year
                && payment.PaidAt.Value.Month == now.Month
                && payment.InvoiceId != null)
            .Sum(payment => payment.Amount);

        var lastMonth = now.AddMonths(-1);
        var lastMonthPayments = payments
            .Where(payment => payment.PaidAt.HasValue
                && payment.PaidAt.Value.Year == lastMonth.Year
                && payment.PaidAt.Value.Month == lastMonth.Month
                && payment.InvoiceId != null)
            .Sum(payment => payment.Amount);

        var yearToDatePayments = payments
            .Where(payment => payment.PaidAt.HasValue && payment.PaidAt.Value.Year == now.Year && payment.InvoiceId != null)
            .Sum(payment => payment.Amount);

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

    public async Task<DebtStatsDto> GetDebtStatsAsync(int ownerUserId)
    {
        var invoices = await InvoicesForOwner(ownerUserId).AsNoTracking().ToListAsync();
        var now = DateTime.UtcNow;

        var unpaidInvoices = invoices.Where(invoice =>
            invoice.Status == "Chưa thanh toán"
            || invoice.Status == "ChÆ°a thanh toÃ¡n"
            || invoice.Status == "Đã thanh toán một phần"
            || invoice.Status == "ÄÃ£ thanh toÃ¡n má»™t pháº§n").ToList();

        var overdueInvoices = unpaidInvoices.Where(invoice =>
            invoice.DueDate.HasValue && invoice.DueDate.Value < now).ToList();

        return new DebtStatsDto
        {
            TotalOutstanding = unpaidInvoices.Sum(invoice => invoice.TotalAmount),
            OverdueInvoicesCount = overdueInvoices.Count,
            OverdueAmount = overdueInvoices.Sum(invoice => invoice.TotalAmount),
            UnpaidInvoicesCount = unpaidInvoices.Count
        };
    }

    private async Task<ResidentStatsDto> GetResidentStatsAsync(int ownerUserId)
    {
        var activeResidencies = await _context.ChiTietOs
            .AsNoTracking()
            .Where(residency => residency.HopDong.Room.Floor.Building.OwnerUserId == ownerUserId
                && (residency.ToDate == null || residency.ToDate > DateTime.UtcNow))
            .ToListAsync();

        return new ResidentStatsDto
        {
            TotalResidents = activeResidencies.Select(residency => residency.ResidentId).Distinct().Count(),
            ActiveContracts = activeResidencies.Select(residency => residency.ContractId).Distinct().Count(),
            NewResidentsThisMonth = 0
        };
    }

    private async Task<VehicleStatsDto> GetVehicleStatsAsync(int ownerUserId)
    {
        var vehicles = await _context.Xes
            .AsNoTracking()
            .Where(vehicle => vehicle.Resident.ChiTietOs.Any(residency =>
                residency.HopDong.Room.Floor.Building.OwnerUserId == ownerUserId
                && (residency.ToDate == null || residency.ToDate > DateTime.UtcNow)))
            .ToListAsync();

        return new VehicleStatsDto
        {
            TotalVehicles = vehicles.Count,
            Cars = vehicles.Count(vehicle => vehicle.VehicleType == "Ô tô" || vehicle.VehicleType == "Ã” tÃ´"),
            Motorcycles = vehicles.Count(vehicle => vehicle.VehicleType == "Xe máy" || vehicle.VehicleType == "Xe mÃ¡y"),
            Bicycles = vehicles.Count(vehicle => vehicle.VehicleType == "Xe đạp" || vehicle.VehicleType == "Xe Ä‘áº¡p")
        };
    }

    private async Task<MaintenanceStatsDto> GetMaintenanceStatsAsync(int ownerUserId)
    {
        var requests = await _context.YeuCauSuaChuas
            .AsNoTracking()
            .Where(request => request.Room.Floor.Building.OwnerUserId == ownerUserId)
            .ToListAsync();

        return new MaintenanceStatsDto
        {
            TotalRequests = requests.Count,
            PendingRequests = requests.Count(request => request.Status == "Chờ xử lý" || request.Status == "Chá» xá»­ lÃ½"),
            InProgressRequests = requests.Count(request => request.Status == "Đang xử lý" || request.Status == "Äang xá»­ lÃ½"),
            CompletedRequests = requests.Count(request => request.Status == "Hoàn thành" || request.Status == "HoÃ n thÃ nh"),
            RejectedRequests = requests.Count(request => request.Status == "Từ chối" || request.Status == "Tá»« chá»‘i")
        };
    }

    private IQueryable<Room> RoomsForOwner(int ownerUserId)
    {
        return _context.Rooms.Where(room => room.Floor.Building.OwnerUserId == ownerUserId);
    }

    private IQueryable<HoaDon> InvoicesForOwner(int ownerUserId)
    {
        return _context.HoaDons.Where(invoice => invoice.HopDong.Room.Floor.Building.OwnerUserId == ownerUserId);
    }

    private IQueryable<ThanhToan> PaymentsForOwner(int ownerUserId)
    {
        return _context.ThanhToans.Where(payment =>
            payment.InvoiceId != null
            && payment.HoaDon != null
            && payment.HoaDon.HopDong.Room.Floor.Building.OwnerUserId == ownerUserId);
    }
}
