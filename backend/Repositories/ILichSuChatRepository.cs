using backend.Models;

namespace backend.Repositories;

public interface ILichSuChatRepository : IRepository<LichSuChat>
{
    Task<List<LichSuChat>> GetByUserIdAsync(int userId, int limit = 100);
    Task<List<LichSuChat>> GetRecentAsync(int limit = 50);
    Task<List<LichSuChat>> GetRecentAsync(int ownerUserId, int limit = 50);
    Task<LichSuChat?> GetByIdAsync(long id);
    Task<LichSuChat?> GetByIdAsync(long id, int ownerUserId);
    Task<int> DeleteConversationAsync(int userId, int ownerUserId);
    Task<List<LichSuChat>> GetByUserIdAsync(int userId, int ownerUserId, int limit = 500);
    Task<List<int>> GetConversationUserIdsPageAsync(int ownerUserId, int page, int pageSize);
    Task<int> CountConversationsAsync(int ownerUserId);
}
