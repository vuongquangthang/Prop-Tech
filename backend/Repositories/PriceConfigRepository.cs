using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IPriceConfigRepository : IRepository<PriceConfig>
{
    Task<List<PriceConfig>> GetByServiceTypeAsync(string serviceType);
    Task<PriceConfig?> GetLatestByServiceTypeAsync(string serviceType, DateTime? effectiveDate = null);
    Task<List<PriceConfig>> GetHistoryByServiceTypeAsync(string serviceType);
}

public class PriceConfigRepository : Repository<PriceConfig>, IPriceConfigRepository
{
    public PriceConfigRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<PriceConfig>> GetByServiceTypeAsync(string serviceType)
    {
        return await _context.PriceConfigs
            .Where(p => p.ServiceType == serviceType)
            .OrderByDescending(p => p.EffectiveDate)
            .ToListAsync();
    }

    public async Task<PriceConfig?> GetLatestByServiceTypeAsync(string serviceType, DateTime? effectiveDate = null)
    {
        var query = _context.PriceConfigs
            .Where(p => p.ServiceType == serviceType);

        if (effectiveDate.HasValue)
        {
            query = query.Where(p => p.EffectiveDate <= effectiveDate);
        }

        return await query.OrderByDescending(p => p.EffectiveDate).FirstOrDefaultAsync();
    }

    public async Task<List<PriceConfig>> GetHistoryByServiceTypeAsync(string serviceType)
    {
        return await _context.PriceConfigs
            .Where(p => p.ServiceType == serviceType)
            .OrderByDescending(p => p.EffectiveDate)
            .ToListAsync();
    }
}
