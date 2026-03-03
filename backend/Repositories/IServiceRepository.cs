using backend.Models;

namespace backend.Repositories;

public interface IServiceRepository : IRepository<Service>
{
    Task<IEnumerable<Service>> GetActiveServicesAsync();
    Task<IEnumerable<Service>> GetByTypeAsync(string loai);
    Task<Service?> GetByNameAsync(string tenDichVu);
}
