using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IInvoiceRepository : IRepository<Invoice>
{
    Task<Invoice?> GetByNumberAsync(string invoiceNumber);
    Task<Invoice?> GetWithDetailsAsync(long id);
    Task<List<Invoice>> GetByBillingPeriodAsync(long billingPeriodId);
    Task<List<Invoice>> GetByRoomAsync(long roomId);
    Task<List<Invoice>> GetByBuildingAsync(long buildingId);
    Task<List<Invoice>> GetUnpaidByRoomAsync(long roomId);
}

public class InvoiceRepository : Repository<Invoice>, IInvoiceRepository
{
    public InvoiceRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Invoice?> GetByNumberAsync(string invoiceNumber)
    {
        return await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceNumber == invoiceNumber);
    }

    public async Task<Invoice?> GetWithDetailsAsync(long id)
    {
        return await _context.Invoices
            .Include(i => i.Room)
            .Include(i => i.BillingPeriod)
            .Include(i => i.LineItems)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<List<Invoice>> GetByBillingPeriodAsync(long billingPeriodId)
    {
        return await _context.Invoices
            .Where(i => i.BillingPeriodId == billingPeriodId && i.Status != "VOIDED")
            .Include(i => i.Room)
            .OrderBy(i => i.Room!.RoomCode)
            .ToListAsync();
    }

    public async Task<List<Invoice>> GetByRoomAsync(long roomId)
    {
        return await _context.Invoices
            .Where(i => i.RoomId == roomId && i.Status != "VOIDED")
            .Include(i => i.BillingPeriod)
            .OrderByDescending(i => i.BillingPeriod!.PeriodMonth)
            .ToListAsync();
    }

    public async Task<List<Invoice>> GetByBuildingAsync(long buildingId)
    {
        return await _context.Invoices
            .Where(i => i.Room!.Floor!.BuildingId == buildingId && i.Status != "VOIDED")
            .Include(i => i.Room)
            .Include(i => i.BillingPeriod)
            .OrderByDescending(i => i.BillingPeriod!.PeriodMonth)
            .ToListAsync();
    }

    public async Task<List<Invoice>> GetUnpaidByRoomAsync(long roomId)
    {
        return await _context.Invoices
            .Where(i => i.RoomId == roomId && 
                       (i.Status == "UNPAID" || i.Status == "PARTIAL") &&
                       i.PaidAmount < i.TotalAmount)
            .OrderBy(i => i.DueDate)
            .ToListAsync();
    }
}

public interface IInvoiceLineItemRepository : IRepository<InvoiceLineItem>
{
    Task<List<InvoiceLineItem>> GetByInvoiceAsync(long invoiceId);
}

public class InvoiceLineItemRepository : Repository<InvoiceLineItem>, IInvoiceLineItemRepository
{
    public InvoiceLineItemRepository(Data.ApplicationDbContext context) : base(context)
    {
    }

    public async Task<List<InvoiceLineItem>> GetByInvoiceAsync(long invoiceId)
    {
        return await _context.InvoiceLineItems
            .Where(l => l.InvoiceId == invoiceId)
            .OrderBy(l => l.ItemType)
            .ToListAsync();
    }
}
