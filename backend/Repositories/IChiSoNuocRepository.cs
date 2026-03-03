using backend.Models;

namespace backend.Repositories;

public interface IChiSoNuocRepository : IRepository<ChiSoNuoc>
{
    Task<IEnumerable<ChiSoNuoc>> GetByServiceUsageDetailIdAsync(long serviceUsageDetailId);
    Task<ChiSoNuoc?> GetByPeriodAsync(long serviceUsageDetailId, byte month, short year);
    Task<ChiSoNuoc?> GetPreviousReadingAsync(long serviceUsageDetailId, byte month, short year);
    Task<IEnumerable<ChiSoNuoc>> GetByPeriodRangeAsync(DateTime from, DateTime to);
}
