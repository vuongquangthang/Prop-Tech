using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class ChiSoNuocRepository : Repository<ChiSoNuoc>, IChiSoNuocRepository
{
    public ChiSoNuocRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ChiSoNuoc>> GetByServiceUsageDetailIdAsync(long serviceUsageDetailId)
    {
        return await _dbSet
            .Where(c => c.ServiceUsageDetailId == serviceUsageDetailId)
            .OrderBy(c => c.Year)
            .ThenBy(c => c.Month)
            .ToListAsync();
    }

    public async Task<ChiSoNuoc?> GetByPeriodAsync(long serviceUsageDetailId, byte month, short year)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == serviceUsageDetailId 
                                   && c.Month == month 
                                   && c.Year == year);
    }

    public async Task<ChiSoNuoc?> GetPreviousReadingAsync(long serviceUsageDetailId, byte month, short year)
    {
        // Get previous month reading
        var previousMonth = month == 1 ? (byte)12 : (byte)(month - 1);
        var previousYear = month == 1 ? (short)(year - 1) : year;

        return await _dbSet
            .FirstOrDefaultAsync(c => c.ServiceUsageDetailId == serviceUsageDetailId 
                                   && c.Month == previousMonth 
                                   && c.Year == previousYear);
    }

    public async Task<IEnumerable<ChiSoNuoc>> GetByPeriodRangeAsync(DateTime from, DateTime to)
    {
        return await _dbSet
            .Include(c => c.ServiceUsageDetail)
                .ThenInclude(s => s.Room)
            .Where(c => new DateTime(c.Year, c.Month, 1) >= new DateTime(from.Year, from.Month, 1)
                     && new DateTime(c.Year, c.Month, 1) <= new DateTime(to.Year, to.Month, 1))
            .OrderByDescending(c => c.Year)
            .ThenByDescending(c => c.Month)
            .ToListAsync();
    }
}
