using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class TaiSanRepository : ITaiSanRepository
    {
        private readonly ApplicationDbContext _context;

        public TaiSanRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TaiSan>> GetAllAsync(int ownerUserId)
        {
            return await _context.TaiSans
                .Include(t => t.ChiTietTaiSanPhongs)
                .Where(t => t.OwnerUserId == ownerUserId)
                .OrderBy(t => t.AssetName)
                .ToListAsync();
        }

        public async Task<TaiSan?> GetByIdAsync(int id, int ownerUserId)
        {
            return await _context.TaiSans
                .Include(t => t.ChiTietTaiSanPhongs)
                .FirstOrDefaultAsync(t => t.Id == id && t.OwnerUserId == ownerUserId);
        }

        public async Task<TaiSan?> GetByCodeAsync(string assetCode, int ownerUserId)
        {
            return await _context.TaiSans
                .Include(t => t.ChiTietTaiSanPhongs)
                .FirstOrDefaultAsync(t => t.AssetCode == assetCode && t.OwnerUserId == ownerUserId);
        }

        public async Task<TaiSan> CreateAsync(TaiSan taiSan)
        {
            _context.TaiSans.Add(taiSan);
            await _context.SaveChangesAsync();
            return taiSan;
        }

        public async Task<TaiSan> UpdateAsync(TaiSan taiSan)
        {
            _context.TaiSans.Update(taiSan);
            await _context.SaveChangesAsync();
            return taiSan;
        }

        public async Task<bool> DeleteAsync(int id, int ownerUserId)
        {
            var taiSan = await _context.TaiSans
                .FirstOrDefaultAsync(t => t.Id == id && t.OwnerUserId == ownerUserId);
            if (taiSan == null) return false;

            _context.TaiSans.Remove(taiSan);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsByCodeAsync(string assetCode, int ownerUserId)
        {
            return await _context.TaiSans.AnyAsync(t => t.AssetCode == assetCode && t.OwnerUserId == ownerUserId);
        }
    }
}
