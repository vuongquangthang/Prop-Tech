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

        public async Task<IEnumerable<TaiSan>> GetAllAsync()
        {
            return await _context.TaiSans
                .Include(t => t.ChiTietTaiSanPhongs)
                .OrderBy(t => t.AssetName)
                .ToListAsync();
        }

        public async Task<TaiSan?> GetByIdAsync(int id)
        {
            return await _context.TaiSans
                .Include(t => t.ChiTietTaiSanPhongs)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<TaiSan?> GetByCodeAsync(string assetCode)
        {
            return await _context.TaiSans
                .Include(t => t.ChiTietTaiSanPhongs)
                .FirstOrDefaultAsync(t => t.AssetCode == assetCode);
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

        public async Task<bool> DeleteAsync(int id)
        {
            var taiSan = await _context.TaiSans.FindAsync(id);
            if (taiSan == null) return false;

            _context.TaiSans.Remove(taiSan);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ExistsByCodeAsync(string assetCode)
        {
            return await _context.TaiSans.AnyAsync(t => t.AssetCode == assetCode);
        }
    }
}
