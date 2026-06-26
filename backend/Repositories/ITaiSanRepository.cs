using backend.Models;

namespace backend.Repositories
{
    public interface ITaiSanRepository
    {
        Task<IEnumerable<TaiSan>> GetAllAsync(int ownerUserId);
        Task<TaiSan?> GetByIdAsync(int id, int ownerUserId);
        Task<TaiSan?> GetByCodeAsync(string assetCode, int ownerUserId);
        Task<TaiSan> CreateAsync(TaiSan taiSan);
        Task<TaiSan> UpdateAsync(TaiSan taiSan);
        Task<bool> DeleteAsync(int id, int ownerUserId);
        Task<bool> ExistsByCodeAsync(string assetCode, int ownerUserId, int? buildingId = null, int? excludeId = null);
    }
}
