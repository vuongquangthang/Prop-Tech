using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class TatToanRepository : ITatToanRepository
    {
        private readonly ApplicationDbContext _context;

        public TatToanRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TatToan>> GetAllAsync()
        {
            return await _context.TatToans
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.Room)
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.ChiTietOs)
                        .ThenInclude(c => c.Resident)
                .Include(t => t.Details)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<TatToan?> GetByIdAsync(int id)
        {
            return await _context.TatToans
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.Room)
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.ChiTietOs)
                        .ThenInclude(c => c.Resident)
                .Include(t => t.Details)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<IEnumerable<TatToan>> GetByResidencyIdAsync(int residencyId)
        {
            return await _context.TatToans
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.Room)
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.ChiTietOs)
                        .ThenInclude(c => c.Resident)
                .Include(t => t.Details)
                .Where(t => t.ResidencyId == residencyId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TatToan>> GetByStatusAsync(string status)
        {
            return await _context.TatToans
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.Room)
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.ChiTietOs)
                        .ThenInclude(c => c.Resident)
                .Include(t => t.Details)
                .Where(t => t.Status == status)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<TatToan> CreateAsync(TatToan tatToan)
        {
            _context.TatToans.Add(tatToan);
            await _context.SaveChangesAsync();
            return tatToan;
        }

        public async Task<TatToan> UpdateAsync(TatToan tatToan)
        {
            tatToan.UpdatedAt = DateTime.UtcNow;
            _context.TatToans.Update(tatToan);
            await _context.SaveChangesAsync();
            return tatToan;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var tatToan = await _context.TatToans.FindAsync(id);
            if (tatToan == null) return false;

            _context.TatToans.Remove(tatToan);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
