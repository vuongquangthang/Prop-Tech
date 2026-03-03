using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class XeRepository : Repository<Xe>, IXeRepository
{
    public XeRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Xe?> GetByLicensePlateAsync(string bienSo)
    {
        return await _dbSet
            .Include(x => x.Resident)
            .FirstOrDefaultAsync(x => x.LicensePlate == bienSo);
    }

    public async Task<IEnumerable<Xe>> GetByResidentIdAsync(int cuDanId)
    {
        return await _dbSet
            .Where(x => x.ResidentId == cuDanId)
            .OrderByDescending(x => x.RegistrationDate)
            .ToListAsync();
    }

    public async Task<IEnumerable<Xe>> GetActiveVehiclesAsync(int cuDanId)
    {
        return await _dbSet
            .Where(x => x.ResidentId == cuDanId && x.CancellationDate == null)
            .ToListAsync();
    }

    public async Task<bool> ExistsByLicensePlateAsync(string bienSo)
    {
        return await _dbSet.AnyAsync(x => x.LicensePlate == bienSo && x.CancellationDate == null);
    }
}
