using backend.Models;

namespace backend.Repositories
{
    public interface ITatToanRepository
    {
        Task<IEnumerable<TatToan>> GetAllAsync();
        Task<TatToan?> GetByIdAsync(int id);
        Task<IEnumerable<TatToan>> GetByResidencyIdAsync(int residencyId);
        Task<IEnumerable<TatToan>> GetByStatusAsync(string status);
        Task<TatToan> CreateAsync(TatToan tatToan);
        Task<TatToan> UpdateAsync(TatToan tatToan);
        Task<bool> DeleteAsync(int id);
    }
}
