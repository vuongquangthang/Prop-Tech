using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IPaymentAccountRepository : IRepository<PaymentAccount>
{
    /// <summary>TK nhan tien dang active cua 1 Owner (moi Owner 1 TK active).</summary>
    Task<PaymentAccount?> GetActiveByOwnerAsync(int ownerUserId);

    /// <summary>Tra TK theo so TK + BIN (dung khi doi soat webhook -> ra Owner).</summary>
    Task<PaymentAccount?> GetByBankAccountAsync(string bankBin, string bankAccountNo);
}

public class PaymentAccountRepository : Repository<PaymentAccount>, IPaymentAccountRepository
{
    public PaymentAccountRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<PaymentAccount?> GetActiveByOwnerAsync(int ownerUserId)
    {
        return await _context.PaymentAccounts
            .FirstOrDefaultAsync(p => p.OwnerUserId == ownerUserId && p.IsActive);
    }

    public async Task<PaymentAccount?> GetByBankAccountAsync(string bankBin, string bankAccountNo)
    {
        var bin = (bankBin ?? string.Empty).Trim();
        var acc = (bankAccountNo ?? string.Empty).Trim();
        return await _context.PaymentAccounts
            .FirstOrDefaultAsync(p => p.IsActive
                && p.BankAccountNo == acc
                && (bin == string.Empty || p.BankBin == bin));
    }
}
