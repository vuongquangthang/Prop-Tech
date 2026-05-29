using backend.Models;

namespace backend.Repositories
{
    public interface IChiTietTaiSanPhongRepository
    {
        Task<IEnumerable<ChiTietTaiSanPhong>> GetAllAsync(int ownerUserId);
        Task<ChiTietTaiSanPhong?> GetByRoomAndAssetAsync(int roomId, int assetId, int ownerUserId);
        Task<IEnumerable<ChiTietTaiSanPhong>> GetByRoomIdAsync(int roomId, int ownerUserId);
        Task<IEnumerable<ChiTietTaiSanPhong>> GetByAssetIdAsync(int assetId, int ownerUserId);
        Task<ChiTietTaiSanPhong> CreateAsync(ChiTietTaiSanPhong detail);
        Task<ChiTietTaiSanPhong> UpdateAsync(ChiTietTaiSanPhong detail);
        Task<bool> DeleteAsync(int roomId, int assetId, int ownerUserId);
    }
}
