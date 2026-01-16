using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories;

public interface IRoomRepository : IRepository<Room>
{
    Task<List<Room>> GetByFloorIdAsync(long floorId);
    Task<List<Room>> GetByBuildingIdAsync(long buildingId);
    Task<Room?> GetWithDetailsAsync(long id);
    Task<bool> RoomNumberExistsAsync(long floorId, string roomNumber);
    Task<List<Room>> GetAvailableRoomsAsync(long? buildingId = null);
}

public class RoomRepository : Repository<Room>, IRoomRepository
{
    public RoomRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<Room>> GetByFloorIdAsync(long floorId)
    {
        return await _dbSet
            .Include(r => r.Floor)
                .ThenInclude(f => f.Building)
            .Where(r => r.FloorId == floorId)
            .OrderBy(r => r.RoomNumber)
            .ToListAsync();
    }

    public async Task<List<Room>> GetByBuildingIdAsync(long buildingId)
    {
        return await _dbSet
            .Include(r => r.Floor)
                .ThenInclude(f => f.Building)
            .Where(r => r.Floor.BuildingId == buildingId)
            .OrderBy(r => r.Floor.FloorNumber)
                .ThenBy(r => r.RoomNumber)
            .ToListAsync();
    }

    public async Task<Room?> GetWithDetailsAsync(long id)
    {
        return await _dbSet
            .Include(r => r.Floor)
                .ThenInclude(f => f.Building)
            .Include(r => r.Residencies)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<bool> RoomNumberExistsAsync(long floorId, string roomNumber)
    {
        return await _dbSet.AnyAsync(r => r.FloorId == floorId && r.RoomNumber == roomNumber);
    }

    public async Task<List<Room>> GetAvailableRoomsAsync(long? buildingId = null)
    {
        var query = _dbSet
            .Include(r => r.Floor)
                .ThenInclude(f => f.Building)
            .Where(r => r.Status.ToUpper() == "AVAILABLE");

        if (buildingId.HasValue)
        {
            query = query.Where(r => r.Floor.BuildingId == buildingId.Value);
        }

        return await query
            .OrderBy(r => r.Floor.Building.BuildingCode)
            .ThenBy(r => r.Floor.FloorNumber)
            .ThenBy(r => r.RoomNumber)
            .ToListAsync();
    }
}
