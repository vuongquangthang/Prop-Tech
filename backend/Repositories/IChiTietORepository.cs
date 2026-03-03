using backend.Models;

namespace backend.Repositories;

public interface IChiTietORepository : IRepository<ChiTietO>
{
    Task<List<ChiTietO>> GetByContractIdAsync(int contractId);
    Task<ChiTietO?> GetByContractAndResidentAsync(int contractId, int residentId);
    Task<List<ChiTietO>> GetActiveByResidentIdAsync(int residentId);
}
