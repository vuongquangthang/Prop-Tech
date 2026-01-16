using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface ITransactionRepository : IRepository<Transaction>
{
    Task<Transaction?> GetByTransactionCodeAsync(string transactionCode);
    Task<Transaction?> GetWithDetailsAsync(long id);
    Task<List<Transaction>> GetByInvoiceAsync(long invoiceId);
    Task<List<Transaction>> GetByRoomAsync(long roomId);
    Task<List<Transaction>> GetSuccessfulByInvoiceAsync(long invoiceId);
    Task<bool> TransactionCodeExistsAsync(string transactionCode);
}

public class TransactionRepository : Repository<Transaction>, ITransactionRepository
{
    public TransactionRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Transaction?> GetByTransactionCodeAsync(string transactionCode)
    {
        return await _context.Transactions
            .Include(t => t.Invoice)
            .FirstOrDefaultAsync(t => t.TransactionCode == transactionCode);
    }

    public async Task<Transaction?> GetWithDetailsAsync(long id)
    {
        return await _context.Transactions
            .Include(t => t.Invoice)
                .ThenInclude(i => i.Room)
            .Include(t => t.Invoice)
                .ThenInclude(i => i.BillingPeriod)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<List<Transaction>> GetByInvoiceAsync(long invoiceId)
    {
        return await _context.Transactions
            .Where(t => t.InvoiceId == invoiceId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Transaction>> GetByRoomAsync(long roomId)
    {
        return await _context.Transactions
            .Where(t => t.Invoice!.RoomId == roomId)
            .Include(t => t.Invoice)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Transaction>> GetSuccessfulByInvoiceAsync(long invoiceId)
    {
        return await _context.Transactions
            .Where(t => t.InvoiceId == invoiceId && t.Status == "SUCCESS")
            .OrderBy(t => t.PaymentDate)
            .ToListAsync();
    }

    public async Task<bool> TransactionCodeExistsAsync(string transactionCode)
    {
        return await _context.Transactions
            .AnyAsync(t => t.TransactionCode == transactionCode);
    }
}
