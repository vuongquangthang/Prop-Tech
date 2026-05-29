using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class ChiTietTaiSanPhongRepository : IChiTietTaiSanPhongRepository
    {
        private readonly ApplicationDbContext _context;

        public ChiTietTaiSanPhongRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ChiTietTaiSanPhong>> GetAllAsync(int ownerUserId)
        {
            return await _context.ChiTietTaiSanPhongs
                .Include(c => c.Room)
                    .ThenInclude(r => r.Floor)
                        .ThenInclude(f => f.Building)
                .Include(c => c.TaiSan)
                .Where(c => c.Room.Floor.Building.OwnerUserId == ownerUserId && c.TaiSan.OwnerUserId == ownerUserId)
                .OrderBy(c => c.RoomId)
                .ThenBy(c => c.AssetId)
                .ToListAsync();
        }

        public async Task<ChiTietTaiSanPhong?> GetByRoomAndAssetAsync(int roomId, int assetId, int ownerUserId)
        {
            return await _context.ChiTietTaiSanPhongs
                .Include(c => c.Room)
                    .ThenInclude(r => r.Floor)
                        .ThenInclude(f => f.Building)
                .Include(c => c.TaiSan)
                .FirstOrDefaultAsync(c =>
                    c.RoomId == roomId &&
                    c.AssetId == assetId &&
                    c.Room.Floor.Building.OwnerUserId == ownerUserId &&
                    c.TaiSan.OwnerUserId == ownerUserId);
        }

        public async Task<IEnumerable<ChiTietTaiSanPhong>> GetByRoomIdAsync(int roomId, int ownerUserId)
        {
            return await _context.ChiTietTaiSanPhongs
                .Include(c => c.Room)
                    .ThenInclude(r => r.Floor)
                        .ThenInclude(f => f.Building)
                .Include(c => c.TaiSan)
                .Where(c => c.RoomId == roomId && c.Room.Floor.Building.OwnerUserId == ownerUserId && c.TaiSan.OwnerUserId == ownerUserId)
                .OrderBy(c => c.AssetId)
                .ToListAsync();
        }

        public async Task<IEnumerable<ChiTietTaiSanPhong>> GetByAssetIdAsync(int assetId, int ownerUserId)
        {
            return await _context.ChiTietTaiSanPhongs
                .Include(c => c.Room)
                    .ThenInclude(r => r.Floor)
                        .ThenInclude(f => f.Building)
                .Include(c => c.TaiSan)
                .Where(c => c.AssetId == assetId && c.Room.Floor.Building.OwnerUserId == ownerUserId && c.TaiSan.OwnerUserId == ownerUserId)
                .OrderBy(c => c.RoomId)
                .ToListAsync();
        }

        public async Task<ChiTietTaiSanPhong> CreateAsync(ChiTietTaiSanPhong detail)
        {
            _context.ChiTietTaiSanPhongs.Add(detail);
            await _context.SaveChangesAsync();
            return detail;
        }

        public async Task<ChiTietTaiSanPhong> UpdateAsync(ChiTietTaiSanPhong detail)
        {
            _context.ChiTietTaiSanPhongs.Update(detail);
            await _context.SaveChangesAsync();
            return detail;
        }

        public async Task<bool> DeleteAsync(int roomId, int assetId, int ownerUserId)
        {
            var detail = await _context.ChiTietTaiSanPhongs
                .Include(c => c.Room)
                    .ThenInclude(r => r.Floor)
                        .ThenInclude(f => f.Building)
                .Include(c => c.TaiSan)
                .FirstOrDefaultAsync(c =>
                    c.RoomId == roomId &&
                    c.AssetId == assetId &&
                    c.Room.Floor.Building.OwnerUserId == ownerUserId &&
                    c.TaiSan.OwnerUserId == ownerUserId);
            
            if (detail == null) return false;

            _context.ChiTietTaiSanPhongs.Remove(detail);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
