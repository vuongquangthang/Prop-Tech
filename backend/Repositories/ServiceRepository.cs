using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class ServiceRepository : Repository<Service>, IServiceRepository
{
    public ServiceRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Service>> GetActiveServicesAsync()
    {
        return await _dbSet
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .ToListAsync();
    }

    public async Task<IEnumerable<Service>> GetByTypeAsync(string loai)
    {
        return await _dbSet
            .Where(s => s.ServiceType == loai && s.IsActive)
            .ToListAsync();
    }

    public async Task<Service?> GetByNameAsync(string tenDichVu)
    {
        return await _dbSet
            .FirstOrDefaultAsync(s => s.Name == tenDichVu);
    }
}
