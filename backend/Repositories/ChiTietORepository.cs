using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class ChiTietORepository : Repository<ChiTietO>, IChiTietORepository
{
    public ChiTietORepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<ChiTietO>> GetByContractIdAsync(int contractId)
    {
        return await _context.ChiTietOs
            .Include(x => x.Resident)
            .Where(x => x.ContractId == contractId)
            .OrderBy(x => x.FromDate)
            .ToListAsync();
    }

    public async Task<ChiTietO?> GetByContractAndResidentAsync(int contractId, int residentId)
    {
        return await _context.ChiTietOs
            .Include(x => x.Resident)
            .Include(x => x.HopDong)
            .FirstOrDefaultAsync(x => x.ContractId == contractId && x.ResidentId == residentId);
    }

    public async Task<List<ChiTietO>> GetActiveByResidentIdAsync(int residentId)
    {
        return await _context.ChiTietOs
            .Include(x => x.HopDong)
                .ThenInclude(h => h.Room)
            .Where(x => x.ResidentId == residentId && x.ToDate == null)
            .ToListAsync();
    }
}
