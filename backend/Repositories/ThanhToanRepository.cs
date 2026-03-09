using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IThanhToanRepository : IRepository<ThanhToan>
{
    Task<List<ThanhToan>> GetByInvoiceIdAsync(int invoiceId);
}

public class ThanhToanRepository : Repository<ThanhToan>, IThanhToanRepository
{
    public ThanhToanRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<IEnumerable<ThanhToan>> GetAllAsync()
    {
        return await _context.ThanhToans
            .Include(t => t.HoaDon)
                .ThenInclude(hd => hd!.HopDong)
                    .ThenInclude(c => c.Room)
            .OrderByDescending(t => t.PaidAt ?? t.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<ThanhToan>> GetByInvoiceIdAsync(int invoiceId)
    {
        return await _context.ThanhToans
            .Where(x => x.InvoiceId == invoiceId)
            .OrderByDescending(x => x.PaidAt)
            .ToListAsync();
    }
}
