using backend.Models;

namespace backend.Repositories;

public interface IYeuCauSuaChuaRepository : IRepository<YeuCauSuaChua>
{
    Task<IEnumerable<YeuCauSuaChua>> GetByRoomIdAsync(int roomId);
    Task<IEnumerable<YeuCauSuaChua>> GetByResidentIdAsync(int residentId);
    Task<IEnumerable<YeuCauSuaChua>> GetByStatusAsync(string status);
    Task<IEnumerable<YeuCauSuaChua>> GetPendingRequestsAsync();
}
