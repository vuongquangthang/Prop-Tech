using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    private static string NormalizePhone(string value)
    {
        return value.Trim()
            .Replace(" ", string.Empty)
            .Replace("-", string.Empty)
            .Replace(".", string.Empty);
    }

    public async Task<User?> GetByPhoneAsync(string phone)
    {
        var normalizedPhone = NormalizePhone(phone);
        return await _dbSet
            .Include(u => u.Resident)
            .FirstOrDefaultAsync(u => u.PhoneNumber != null
                && u.PhoneNumber.Replace(" ", string.Empty).Replace("-", string.Empty).Replace(".", string.Empty) == normalizedPhone);
    }

    public async Task<User?> GetByPhoneNumberAsync(string phoneNumber)
    {
        var normalizedPhone = NormalizePhone(phoneNumber);
        return await _dbSet
            .Include(u => u.Resident)
            .FirstOrDefaultAsync(u => u.PhoneNumber != null
                && u.PhoneNumber.Replace(" ", string.Empty).Replace("-", string.Empty).Replace(".", string.Empty) == normalizedPhone);
    }

    public async Task<User?> GetByPhoneOrEmailAsync(string identity)
    {
        var normalized = identity.Trim().ToLower();
        var normalizedPhone = NormalizePhone(identity);
        return await _dbSet
            .Include(u => u.Resident)
            .FirstOrDefaultAsync(u =>
                (u.PhoneNumber != null
                    && u.PhoneNumber.Replace(" ", string.Empty).Replace("-", string.Empty).Replace(".", string.Empty) == normalizedPhone) ||
                (u.Email != null && u.Email.ToLower() == normalized));
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
        var normalizedPhone = NormalizePhone(phone);
        return await _dbSet.AnyAsync(u => u.PhoneNumber != null
            && u.PhoneNumber.Replace(" ", string.Empty).Replace("-", string.Empty).Replace(".", string.Empty) == normalizedPhone);
    }

    public override async Task<IEnumerable<User>> GetAllAsync()
    {
        return await _dbSet
            .Include(u => u.Resident)
            .ToListAsync();
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
        var normalizedPhone = NormalizePhone(phone);
        return await _dbSet
            .Include(u => u.Resident)
            .FirstOrDefaultAsync(u => u.PhoneNumber != null
                && u.PhoneNumber.Replace(" ", string.Empty).Replace("-", string.Empty).Replace(".", string.Empty) == normalizedPhone
                && !u.IsLocked);
    }
}
