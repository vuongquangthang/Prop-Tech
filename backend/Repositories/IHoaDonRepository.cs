using backend.Models;

namespace backend.Repositories;

public interface IHoaDonRepository : IRepository<HoaDon>
{
    Task<IEnumerable<HoaDon>> GetByContractIdAsync(int hopDongId);
    Task<HoaDon?> GetByPeriodAsync(int hopDongId, byte thang, short nam);
    Task<HoaDon?> GetWithDetailsAsync(int id);
    Task<IEnumerable<HoaDon>> GetUnpaidInvoicesAsync();
    Task<IEnumerable<HoaDon>> GetOverdueInvoicesAsync();
    Task<IEnumerable<HoaDon>> GetByStatusAsync(string status);
}
