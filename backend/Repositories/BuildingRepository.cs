using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class BuildingRepository : Repository<Building>, IBuildingRepository
{
    public BuildingRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Building?> GetByNameAsync(string name)
    {
        return await _dbSet
            .FirstOrDefaultAsync(b => b.BuildingName == name);
    }

    public async Task<IEnumerable<Building>> GetWithFloorsAsync()
    {
        return await _dbSet
            .Include(b => b.Floors)
            .ToListAsync();
    }

    public async Task<Building?> GetWithFloorsAndRoomsAsync(int id)
    {
        return await _dbSet
            .Include(b => b.Floors)
                .ThenInclude(f => f.Rooms)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<bool> ExistsByNameAsync(string name)
    {
        return await _dbSet.AnyAsync(b => b.BuildingName == name);
    }
}
