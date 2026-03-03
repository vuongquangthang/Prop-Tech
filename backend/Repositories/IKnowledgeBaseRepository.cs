using backend.Models;

namespace backend.Repositories;

public interface IKnowledgeBaseRepository : IRepository<KnowledgeBase>
{
    Task<List<KnowledgeBase>> GetAllActiveAsync();
    Task<List<KnowledgeBase>> GetByCategoryAsync(string category);
    Task<List<KnowledgeBase>> SearchAsync(string keyword);
    Task<KnowledgeBase?> GetByIdAsync(int id);
}
