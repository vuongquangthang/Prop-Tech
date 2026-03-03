using backend.Models;

namespace backend.Repositories;

public interface INhatKyNhacNoRepository : IRepository<NhatKyNhacNo>
{
    Task<List<NhatKyNhacNo>> GetByInvoiceIdAsync(int invoiceId);
    Task<List<NhatKyNhacNo>> GetByUserIdAsync(int userId);
    Task<List<NhatKyNhacNo>> GetByStatusAsync(string status);
    Task<NhatKyNhacNo?> GetByIdAsync(long id);
    Task<int> GetReminderCountForInvoiceAsync(int invoiceId);
}
