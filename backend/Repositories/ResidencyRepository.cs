using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IResidencyRepository : IRepository<Residency>
{
    Task<Residency?> GetByIdWithDetailsAsync(long id);
    Task<List<Residency>> GetByRoomAsync(long roomId);
    Task<List<Residency>> GetActiveByRoomAsync(long roomId, DateTime cutoffDate);
    Task<int> GetHeadcountForRoomAsync(long roomId, DateTime cutoffDate);
    Task<bool> HasActiveResidencyAsync(long roomId);
    Task<Residency?> GetPrimaryResidentAsync(long roomId);
    Task<List<Residency>> GetActiveResidentsByRoomsAsync(List<long> roomIds);
}

public class ResidencyRepository : Repository<Residency>, IResidencyRepository
{
    public ResidencyRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Residency?> GetByIdWithDetailsAsync(long id)
    {
        return await _context.Residencies
            .Include(r => r.Room)
            .Include(r => r.Resident)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<List<Residency>> GetByRoomAsync(long roomId)
    {
        return await _context.Residencies
            .Where(r => r.RoomId == roomId)
            .Include(r => r.Resident)
            .OrderByDescending(r => r.CheckInDate)
            .ToListAsync();
    }

    public async Task<List<Residency>> GetActiveByRoomAsync(long roomId, DateTime cutoffDate)
    {
        return await _context.Residencies
            .Where(r => r.RoomId == roomId &&
                        r.Status == "ACTIVE" &&
                        r.CheckInDate <= cutoffDate &&
                        (r.CheckOutDate == null || r.CheckOutDate > cutoffDate))
            .Include(r => r.Resident)
            .ToListAsync();
    }

    public async Task<int> GetHeadcountForRoomAsync(long roomId, DateTime cutoffDate)
    {
        return await _context.Residencies
            .CountAsync(r => r.RoomId == roomId &&
                            r.Status == "ACTIVE" &&
                            r.CheckInDate <= cutoffDate &&
                            (r.CheckOutDate == null || r.CheckOutDate > cutoffDate));
    }

    public async Task<bool> HasActiveResidencyAsync(long roomId)
    {
        return await _context.Residencies
            .AnyAsync(r => r.RoomId == roomId && r.Status == "ACTIVE");
    }

    public async Task<Residency?> GetPrimaryResidentAsync(long roomId)
    {
        return await _context.Residencies
            .FirstOrDefaultAsync(r => r.RoomId == roomId && 
                                      r.IsPrimaryResident && 
                                      r.Status == "ACTIVE");
    }

    public async Task<List<Residency>> GetActiveResidentsByRoomsAsync(List<long> roomIds)
    {
        return await _context.Residencies
            .Where(r => roomIds.Contains(r.RoomId) && r.Status == "ACTIVE")
            .Include(r => r.Resident)
            .ToListAsync();
    }
}
