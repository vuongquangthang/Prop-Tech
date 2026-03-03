using backend.Models;

namespace backend.Repositories;

public interface IXeRepository : IRepository<Xe>
{
    Task<Xe?> GetByLicensePlateAsync(string bienSo);
    Task<IEnumerable<Xe>> GetByResidentIdAsync(int cuDanId);
    Task<IEnumerable<Xe>> GetActiveVehiclesAsync(int cuDanId);
    Task<bool> ExistsByLicensePlateAsync(string bienSo);
}
