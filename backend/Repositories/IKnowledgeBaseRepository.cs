using backend.Models;

namespace backend.Repositories;

public interface IKnowledgeBaseRepository : IRepository<KnowledgeBase>
{
    Task<List<KnowledgeBase>> GetAllAsync(int ownerUserId);
    Task<List<KnowledgeBase>> GetAllActiveAsync(int ownerUserId);
    Task<List<KnowledgeBase>> GetByCategoryAsync(string category, int ownerUserId);
    Task<List<KnowledgeBase>> SearchAsync(string keyword, int ownerUserId);
    Task<KnowledgeBase?> GetByIdAsync(int id, int ownerUserId);
}
