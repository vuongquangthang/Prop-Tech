using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class FloorRepository : Repository<Floor>, IFloorRepository
{
    public FloorRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Floor>> GetByBuildingIdAsync(int buildingId)
    {
        return await _dbSet
            .Where(f => f.BuildingId == buildingId)
            .OrderBy(f => f.FloorNumber)
            .ToListAsync();
    }

    public async Task<Floor?> GetWithRoomsAsync(int id)
    {
        return await _dbSet
            .Include(f => f.Rooms)
            .Include(f => f.Building)
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<Floor?> GetByBuildingAndFloorNumberAsync(int buildingId, int floorNumber)
    {
        return await _dbSet
            .FirstOrDefaultAsync(f => f.BuildingId == buildingId && f.FloorNumber == floorNumber);
    }

    public async Task<bool> ExistsAsync(int buildingId, int floorNumber)
    {
        return await _dbSet
            .AnyAsync(f => f.BuildingId == buildingId && f.FloorNumber == floorNumber);
    }
}
