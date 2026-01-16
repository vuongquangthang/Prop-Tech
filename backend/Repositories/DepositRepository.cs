using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IDepositRepository : IRepository<Deposit>
{
    Task<Deposit?> GetByResidencyAsync(long residencyId);
    Task<List<Deposit>> GetByRoomAsync(long roomId);
    Task<List<Deposit>> GetByStatusAsync(string status);
}

public class DepositRepository : Repository<Deposit>, IDepositRepository
{
    public DepositRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Deposit?> GetByResidencyAsync(long residencyId)
    {
        return await _context.Deposits.FirstOrDefaultAsync(d => d.ResidencyId == residencyId);
    }

    public async Task<List<Deposit>> GetByRoomAsync(long roomId)
    {
        return await _context.Deposits
            .Where(d => d.RoomId == roomId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Deposit>> GetByStatusAsync(string status)
    {
        return await _context.Deposits
            .Where(d => d.Status == status)
            .ToListAsync();
    }
}
