using backend.Models;

namespace backend.Repositories
{
    public interface IChiTietTaiSanPhongRepository
    {
        Task<IEnumerable<ChiTietTaiSanPhong>> GetAllAsync();
        Task<ChiTietTaiSanPhong?> GetByRoomAndAssetAsync(int roomId, int assetId);
        Task<IEnumerable<ChiTietTaiSanPhong>> GetByRoomIdAsync(int roomId);
        Task<IEnumerable<ChiTietTaiSanPhong>> GetByAssetIdAsync(int assetId);
        Task<ChiTietTaiSanPhong> CreateAsync(ChiTietTaiSanPhong detail);
        Task<ChiTietTaiSanPhong> UpdateAsync(ChiTietTaiSanPhong detail);
        Task<bool> DeleteAsync(int roomId, int assetId);
    }
}
