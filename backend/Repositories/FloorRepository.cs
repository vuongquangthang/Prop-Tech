using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories;

public interface IFloorRepository : IRepository<Floor>
{
    Task<List<Floor>> GetByBuildingIdAsync(long buildingId);
    Task<Floor?> GetWithRoomsAsync(long id);
    Task<bool> FloorNumberExistsAsync(long buildingId, int floorNumber);
}

public class FloorRepository : Repository<Floor>, IFloorRepository
{
    public FloorRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Floor>> GetByBuildingIdAsync(long buildingId)
    {
        return await _dbSet
            .Include(f => f.Building)
            .Where(f => f.BuildingId == buildingId)
            .OrderBy(f => f.FloorNumber)
            .ToListAsync();
    }

    public async Task<Floor?> GetWithRoomsAsync(long id)
    {
        return await _dbSet
            .Include(f => f.Building)
            .Include(f => f.Rooms)
            .FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<bool> FloorNumberExistsAsync(long buildingId, int floorNumber)
    {
        return await _dbSet.AnyAsync(f => f.BuildingId == buildingId && f.FloorNumber == floorNumber);
    }
}
