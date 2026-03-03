using backend.Models;

namespace backend.Repositories
{
    public interface IChiTietPhieuTatToanRepository
    {
        Task<IEnumerable<ChiTietPhieuTatToan>> GetBySettlementIdAsync(int settlementId);
        Task<ChiTietPhieuTatToan> CreateAsync(ChiTietPhieuTatToan detail);
        Task DeleteBySettlementIdAsync(int settlementId);
    }
}
