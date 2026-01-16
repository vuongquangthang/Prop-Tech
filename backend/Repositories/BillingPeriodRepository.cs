using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IBillingPeriodRepository : IRepository<BillingPeriod>
{
    Task<BillingPeriod?> GetByMonthAsync(DateTime periodMonth);
    Task<List<BillingPeriod>> GetAllAsync();
    Task<BillingPeriod?> GetLatestAsync();
}

public class BillingPeriodRepository : Repository<BillingPeriod>, IBillingPeriodRepository
{
    public BillingPeriodRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<BillingPeriod?> GetByMonthAsync(DateTime periodMonth)
    {
        return await _context.BillingPeriods.FirstOrDefaultAsync(b => b.PeriodMonth == periodMonth);
    }

    public new async Task<List<BillingPeriod>> GetAllAsync()
    {
        return await _context.BillingPeriods.OrderByDescending(b => b.PeriodMonth).ToListAsync();
    }

    public async Task<BillingPeriod?> GetLatestAsync()
    {
        return await _context.BillingPeriods.OrderByDescending(b => b.PeriodMonth).FirstOrDefaultAsync();
    }
}
