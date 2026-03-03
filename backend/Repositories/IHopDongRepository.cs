using backend.Models;

namespace backend.Repositories;

public interface IHopDongRepository : IRepository<HopDong>
{
    Task<IEnumerable<HopDong>> GetByRoomIdAsync(int roomId);
    Task<HopDong?> GetActiveByRoomIdAsync(int roomId);
    Task<HopDong?> GetWithDetailsAsync(int id);
    Task<IEnumerable<HopDong>> GetActiveContractsAsync();
    Task<IEnumerable<HopDong>> GetExpiringContractsAsync(DateTime fromDate, DateTime toDate);
}
