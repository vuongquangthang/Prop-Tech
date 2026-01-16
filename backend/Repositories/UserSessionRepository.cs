using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Repositories;

public interface IUserSessionRepository : IRepository<UserSession>
{
    Task<UserSession?> GetByRefreshTokenAsync(string refreshToken);
    Task<UserSession?> GetActiveSessionAsync(long userId, string refreshToken);
    Task InvalidateUserSessionsAsync(long userId);
}

public class UserSessionRepository : Repository<UserSession>, IUserSessionRepository
{
    public UserSessionRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<UserSession?> GetByRefreshTokenAsync(string refreshToken)
    {
        return await _dbSet
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.RefreshToken == refreshToken && s.RevokedAt == null);
    }

    public async Task<UserSession?> GetActiveSessionAsync(long userId, string refreshToken)
    {
        return await _dbSet
            .FirstOrDefaultAsync(s => 
                s.UserId == userId && 
                s.RefreshToken == refreshToken && 
                s.RevokedAt == null &&
                s.ExpiresAt > DateTime.UtcNow);
    }

    public async Task InvalidateUserSessionsAsync(long userId)
    {
        var sessions = await _dbSet
            .Where(s => s.UserId == userId && s.RevokedAt == null)
            .ToListAsync();

        foreach (var session in sessions)
        {
            session.RevokedAt = DateTime.UtcNow;
        }

        await SaveChangesAsync();
    }
}
