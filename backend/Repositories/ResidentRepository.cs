using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IResidentRepository : IRepository<Resident>
{
    Task<Resident?> GetByIdCardAsync(string idCard);
    Task<Resident?> GetByPhoneAsync(string phone);
    Task<bool> IdCardExistsAsync(string idCard);
    Task<bool> PhoneExistsAsync(string phone);
    Task<List<Resident>> GetByRoomAsync(long roomId);
    Task<Resident?> GetWithResidenciesAsync(long id);
}

public class ResidentRepository : Repository<Resident>, IResidentRepository
{
    public ResidentRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Resident?> GetByIdCardAsync(string idCard)
    {
        return await _context.Residents.FirstOrDefaultAsync(r => r.IdCardNumber == idCard);
    }

    public async Task<Resident?> GetByPhoneAsync(string phone)
    {
        return await _context.Residents.FirstOrDefaultAsync(r => r.PhoneNumber == phone);
    }

    public async Task<bool> IdCardExistsAsync(string idCard)
    {
        return await _context.Residents.AnyAsync(r => r.IdCardNumber == idCard);
    }

    public async Task<bool> PhoneExistsAsync(string phone)
    {
        return await _context.Residents.AnyAsync(r => r.PhoneNumber == phone);
    }

    public async Task<List<Resident>> GetByRoomAsync(long roomId)
    {
        return await _context.Residents
            .Where(r => r.Residencies.Any(res => res.RoomId == roomId && res.Status == "ACTIVE"))
            .ToListAsync();
    }

    public async Task<Resident?> GetWithResidenciesAsync(long id)
    {
        return await _context.Residents
            .Include(r => r.Residencies)
            .FirstOrDefaultAsync(r => r.Id == id);
    }
}
