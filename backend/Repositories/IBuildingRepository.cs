using backend.Models;

namespace backend.Repositories;

public interface IBuildingRepository : IRepository<Building>
{
    Task<Building?> GetByNameAsync(string name);
    Task<IEnumerable<Building>> GetWithFloorsAsync();
    Task<Building?> GetWithFloorsAndRoomsAsync(int id);
    Task<bool> ExistsByNameAsync(string name);
}
