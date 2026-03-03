using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class HoaDonRepository : Repository<HoaDon>, IHoaDonRepository
{
    public HoaDonRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<HoaDon>> GetByContractIdAsync(int hopDongId)
    {
        return await _dbSet
            .Include(hd => hd.HopDong)
            .Include(hd => hd.ChiTietHoaDons)
            .Where(hd => hd.ContractId == hopDongId)
            .OrderByDescending(hd => hd.Year)
            .ThenByDescending(hd => hd.Month)
            .ToListAsync();
    }

    public async Task<HoaDon?> GetByPeriodAsync(int hopDongId, byte thang, short nam)
    {
        return await _dbSet
            .Include(hd => hd.ChiTietHoaDons)
            .FirstOrDefaultAsync(hd => hd.ContractId == hopDongId 
                && hd.Month == thang 
                && hd.Year == nam);
    }

    public async Task<HoaDon?> GetWithDetailsAsync(int id)
    {
        return await _dbSet
            .Include(hd => hd.HopDong)
                .ThenInclude(hd => hd.Room)
                    .ThenInclude(p => p.Floor)
                        .ThenInclude(f => f.Building)
            .Include(hd => hd.HopDong)
                .ThenInclude(hd => hd.ChiTietOs)
                    .ThenInclude(ct => ct.Resident)
            .Include(hd => hd.ChiTietHoaDons)
                .ThenInclude(ct => ct.Service)
            .Include(hd => hd.ThanhToans)
            .FirstOrDefaultAsync(hd => hd.Id == id);
    }

    public async Task<IEnumerable<HoaDon>> GetUnpaidInvoicesAsync()
    {
        return await _dbSet
            .Include(hd => hd.HopDong)
                .ThenInclude(hd => hd.Room)
            .Where(hd => hd.Status == "Chưa thanh toán")
            .OrderBy(hd => hd.DueDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<HoaDon>> GetOverdueInvoicesAsync()
    {
        var today = DateTime.UtcNow;
        return await _dbSet
            .Include(hd => hd.HopDong)
                .ThenInclude(hd => hd.Room)
            .Where(hd => hd.Status == "Chưa thanh toán" 
                && hd.DueDate != null 
                && hd.DueDate < today)
            .OrderBy(hd => hd.DueDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<HoaDon>> GetByStatusAsync(string status)
    {
        return await _dbSet
            .Include(hd => hd.HopDong)
                .ThenInclude(hd => hd.Room)
            .Where(hd => hd.Status == status)
            .ToListAsync();
    }
}
