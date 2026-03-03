using backend.Models;

namespace backend.Repositories
{
    public interface ITaiSanRepository
    {
        Task<IEnumerable<TaiSan>> GetAllAsync();
        Task<TaiSan?> GetByIdAsync(int id);
        Task<TaiSan?> GetByCodeAsync(string assetCode);
        Task<TaiSan> CreateAsync(TaiSan taiSan);
        Task<TaiSan> UpdateAsync(TaiSan taiSan);
        Task<bool> DeleteAsync(int id);
        Task<bool> ExistsByCodeAsync(string assetCode);
    }
}
