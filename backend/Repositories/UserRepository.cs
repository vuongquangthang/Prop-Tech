using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<User?> GetByPhoneAsync(string phone)
    {
        return await _dbSet
            .Include(u => u.Resident)
            .FirstOrDefaultAsync(u => u.PhoneNumber == phone);
    }

    public async Task<User?> GetByPhoneNumberAsync(string phoneNumber)
    {
        return await _dbSet
            .Include(u => u.Resident)
            .FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);
    }

    public async Task<User?> GetByRefreshTokenAsync(string refreshToken)
    {
        return await _dbSet
            .Include(u => u.Resident)
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
    }

    public async Task<User?> GetWithResidentAsync(int id)
    {
        return await _dbSet
            .Include(u => u.Resident)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<bool> ExistsByPhoneAsync(string phone)
    {
        return await _dbSet.AnyAsync(u => u.PhoneNumber == phone);
    }

    public async Task<IEnumerable<User>> GetByRoleAsync(string role)
    {
        return await _dbSet
            .Include(u => u.Resident)
            .Where(u => u.Role == role)
            .ToListAsync();
    }

    public async Task<User?> AuthenticateAsync(string phone)
    {
        return await _dbSet
            .Include(u => u.Resident)
            .FirstOrDefaultAsync(u => u.PhoneNumber == phone && !u.IsLocked);
    }
}
