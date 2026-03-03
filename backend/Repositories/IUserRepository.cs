using backend.Models;

namespace backend.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByPhoneAsync(string phone);
    Task<User?> GetByPhoneNumberAsync(string phoneNumber);
    Task<User?> GetByRefreshTokenAsync(string refreshToken);
    Task<User?> GetWithResidentAsync(int id);
    Task<bool> ExistsByPhoneAsync(string phone);
    Task<IEnumerable<User>> GetByRoleAsync(string role);
    Task<User?> AuthenticateAsync(string phone);
}
