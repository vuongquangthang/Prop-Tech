using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class ChiTietPhieuTatToanRepository : IChiTietPhieuTatToanRepository
    {
        private readonly ApplicationDbContext _context;

        public ChiTietPhieuTatToanRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ChiTietPhieuTatToan>> GetBySettlementIdAsync(int settlementId)
        {
            return await _context.ChiTietPhieuTatToans
                .Where(d => d.SettlementId == settlementId)
                .OrderBy(d => d.Id)
                .ToListAsync();
        }

        public async Task<ChiTietPhieuTatToan> CreateAsync(ChiTietPhieuTatToan detail)
        {
            _context.ChiTietPhieuTatToans.Add(detail);
            await _context.SaveChangesAsync();
            return detail;
        }

        public async Task DeleteBySettlementIdAsync(int settlementId)
        {
            var details = await _context.ChiTietPhieuTatToans
                .Where(d => d.SettlementId == settlementId)
                .ToListAsync();
            
            _context.ChiTietPhieuTatToans.RemoveRange(details);
            await _context.SaveChangesAsync();
        }
    }
}
