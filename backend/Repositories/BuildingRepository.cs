using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories;

public interface IBuildingRepository : IRepository<Building>
{
    Task<Building?> GetByCodeAsync(string code);
    Task<bool> CodeExistsAsync(string code);
    Task<List<Building>> GetAllWithDetailsAsync();
}

public class BuildingRepository : Repository<Building>, IBuildingRepository
{
    public BuildingRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Building?> GetByCodeAsync(string code)
    {
        return await _dbSet
            .Include(b => b.Floors)
            .FirstOrDefaultAsync(b => b.BuildingCode == code);
    }

    public async Task<bool> CodeExistsAsync(string code)
    {
        return await _dbSet.AnyAsync(b => b.BuildingCode == code);
    }

    public async Task<List<Building>> GetAllWithDetailsAsync()
    {
        return await _dbSet
            .Include(b => b.Floors)
            .OrderBy(b => b.BuildingCode)
            .ToListAsync();
    }
}
