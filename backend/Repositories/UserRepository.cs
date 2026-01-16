using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByPhoneNumberAsync(string phoneNumber);
    Task<bool> PhoneNumberExistsAsync(string phoneNumber);
}

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<User?> GetByPhoneNumberAsync(string phoneNumber)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);
    }

    public async Task<bool> PhoneNumberExistsAsync(string phoneNumber)
    {
        return await _dbSet.AnyAsync(u => u.PhoneNumber == phoneNumber);
    }
}
