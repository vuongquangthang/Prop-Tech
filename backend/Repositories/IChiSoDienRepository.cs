using backend.Models;

namespace backend.Repositories;

public interface IChiSoDienRepository : IRepository<ChiSoDien>
{
    Task<IEnumerable<ChiSoDien>> GetByServiceUsageDetailIdAsync(long serviceUsageDetailId);
    Task<ChiSoDien?> GetByPeriodAsync(long serviceUsageDetailId, byte month, short year);
    Task<ChiSoDien?> GetPreviousReadingAsync(long serviceUsageDetailId, byte month, short year);
    Task<IEnumerable<ChiSoDien>> GetByPeriodRangeAsync(DateTime from, DateTime to);
}
