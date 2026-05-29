using backend.Models;

namespace backend.Repositories
{
    public interface ITatToanRepository
    {
        Task<IEnumerable<TatToan>> GetAllAsync(int ownerUserId);
        Task<TatToan?> GetByIdAsync(int id, int ownerUserId);
        Task<IEnumerable<TatToan>> GetByResidencyIdAsync(int residencyId, int ownerUserId);
        Task<IEnumerable<TatToan>> GetByStatusAsync(string status, int ownerUserId);
        Task<TatToan> CreateAsync(TatToan tatToan);
        Task<TatToan> UpdateAsync(TatToan tatToan);
        Task<bool> DeleteAsync(int id, int ownerUserId);
    }
}
