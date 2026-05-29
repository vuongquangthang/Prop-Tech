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

        public async Task<IEnumerable<TatToan>> GetAllAsync(int ownerUserId)
        {
            return await _context.TatToans
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.Room)
                        .ThenInclude(room => room.Floor)
                            .ThenInclude(floor => floor.Building)
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.ChiTietOs)
                        .ThenInclude(c => c.Resident)
                .Include(t => t.Details)
                .Where(t => t.Residency != null && t.Residency.Room.Floor.Building.OwnerUserId == ownerUserId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<TatToan?> GetByIdAsync(int id, int ownerUserId)
        {
            return await _context.TatToans
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.Room)
                        .ThenInclude(room => room.Floor)
                            .ThenInclude(floor => floor.Building)
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.ChiTietOs)
                        .ThenInclude(c => c.Resident)
                .Include(t => t.Details)
                .FirstOrDefaultAsync(t =>
                    t.Id == id &&
                    t.Residency != null &&
                    t.Residency.Room.Floor.Building.OwnerUserId == ownerUserId);
        }

        public async Task<IEnumerable<TatToan>> GetByResidencyIdAsync(int residencyId, int ownerUserId)
        {
            return await _context.TatToans
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.Room)
                        .ThenInclude(room => room.Floor)
                            .ThenInclude(floor => floor.Building)
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.ChiTietOs)
                        .ThenInclude(c => c.Resident)
                .Include(t => t.Details)
                .Where(t =>
                    t.ResidencyId == residencyId &&
                    t.Residency != null &&
                    t.Residency.Room.Floor.Building.OwnerUserId == ownerUserId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TatToan>> GetByStatusAsync(string status, int ownerUserId)
        {
            return await _context.TatToans
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.Room)
                        .ThenInclude(room => room.Floor)
                            .ThenInclude(floor => floor.Building)
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.ChiTietOs)
                        .ThenInclude(c => c.Resident)
                .Include(t => t.Details)
                .Where(t =>
                    t.Status == status &&
                    t.Residency != null &&
                    t.Residency.Room.Floor.Building.OwnerUserId == ownerUserId)
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

        public async Task<bool> DeleteAsync(int id, int ownerUserId)
        {
            var tatToan = await _context.TatToans
                .Include(t => t.Residency)
                    .ThenInclude(r => r!.Room)
                        .ThenInclude(room => room.Floor)
                            .ThenInclude(floor => floor.Building)
                .FirstOrDefaultAsync(t =>
                    t.Id == id &&
                    t.Residency != null &&
                    t.Residency.Room.Floor.Building.OwnerUserId == ownerUserId);
            if (tatToan == null) return false;

            _context.TatToans.Remove(tatToan);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
