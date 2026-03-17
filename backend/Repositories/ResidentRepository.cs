using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class ResidentRepository : Repository<Resident>, IResidentRepository
{
    public ResidentRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<IEnumerable<Resident>> GetAllAsync()
    {
        return await _dbSet
            .Include(r => r.Users)
            .Include(r => r.ChiTietOs)
                .ThenInclude(ct => ct.HopDong)
                    .ThenInclude(hd => hd.Room)
            .ToListAsync();
    }

    public override async Task<Resident?> GetByIdAsync(object id)
    {
        if (id is not int residentId)
        {
            return null;
        }

        return await _dbSet
            .Include(r => r.Users)
            .Include(r => r.ChiTietOs)
                .ThenInclude(ct => ct.HopDong)
                    .ThenInclude(hd => hd.Room)
            .Include(r => r.Xes)
            .FirstOrDefaultAsync(r => r.Id == residentId);
    }

    public async Task<Resident?> GetByPhoneAsync(string phone)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.PhoneNumber == phone);
    }

    public async Task<Resident?> GetByPhoneNumberAsync(string phoneNumber)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.PhoneNumber == phoneNumber);
    }

    public async Task<Resident?> GetByCccdAsync(string cccd)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.IdCardNumber == cccd);
    }

    public async Task<Resident?> GetByIdCardNumberAsync(string idCardNumber)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.IdCardNumber == idCardNumber);
    }

    public async Task<IEnumerable<Resident>> SearchByNameAsync(string name)
    {
        return await _dbSet
            .Include(r => r.Users)
            .Include(r => r.ChiTietOs)
                .ThenInclude(ct => ct.HopDong)
                    .ThenInclude(hd => hd.Room)
            .Where(r => r.FullName.Contains(name))
            .ToListAsync();
    }

    public async Task<Resident?> GetWithContractsAsync(int id)
    {
        return await _dbSet
            .Include(r => r.ChiTietOs)
                .ThenInclude(ct => ct.HopDong)
                    .ThenInclude(hd => hd.Room)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<Resident?> GetWithVehiclesAsync(int id)
    {
        return await _dbSet
            .Include(r => r.Xes.Where(x => x.CancellationDate == null))
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<bool> ExistsByCccdAsync(string cccd)
    {
        return await _dbSet.AnyAsync(r => r.IdCardNumber == cccd);
    }
}
