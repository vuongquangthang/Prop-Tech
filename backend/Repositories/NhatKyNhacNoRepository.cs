using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class NhatKyNhacNoRepository : Repository<NhatKyNhacNo>, INhatKyNhacNoRepository
{
    public NhatKyNhacNoRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<NhatKyNhacNo>> GetByInvoiceIdAsync(int invoiceId)
    {
        return await _context.NhatKyNhacNos
            .Include(x => x.SentToUser)
            .Include(x => x.SentByUser)
            .Where(x => x.InvoiceId == invoiceId)
            .OrderByDescending(x => x.ReminderTime)
            .ToListAsync();
    }

    public async Task<List<NhatKyNhacNo>> GetByUserIdAsync(int userId)
    {
        return await _context.NhatKyNhacNos
            .Include(x => x.HoaDon)
            .Include(x => x.SentByUser)
            .Where(x => x.SentToUserId == userId)
            .OrderByDescending(x => x.ReminderTime)
            .ToListAsync();
    }

    public async Task<List<NhatKyNhacNo>> GetByStatusAsync(string status)
    {
        return await _context.NhatKyNhacNos
            .Include(x => x.SentToUser)
            .Include(x => x.SentByUser)
            .Include(x => x.HoaDon)
            .Where(x => x.SendStatus == status)
            .OrderByDescending(x => x.ReminderTime)
            .ToListAsync();
    }

    public async Task<NhatKyNhacNo?> GetByIdAsync(long id)
    {
        return await _context.NhatKyNhacNos
            .Include(x => x.SentToUser)
            .Include(x => x.SentByUser)
            .Include(x => x.HoaDon)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<int> GetReminderCountForInvoiceAsync(int invoiceId)
    {
        return await _context.NhatKyNhacNos
            .Where(x => x.InvoiceId == invoiceId)
            .MaxAsync(x => (int?)x.ReminderCount) ?? 0;
    }
}
