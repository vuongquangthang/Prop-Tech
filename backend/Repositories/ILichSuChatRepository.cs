using backend.Models;

namespace backend.Repositories;

public interface ILichSuChatRepository : IRepository<LichSuChat>
{
    Task<List<LichSuChat>> GetByUserIdAsync(int userId, int limit = 100);
    Task<List<LichSuChat>> GetRecentAsync(int limit = 50);
    Task<List<LichSuChat>> GetRecentAsync(int ownerUserId, int limit = 50);
    Task<LichSuChat?> GetByIdAsync(long id);
    Task<LichSuChat?> GetByIdAsync(long id, int ownerUserId);
}
