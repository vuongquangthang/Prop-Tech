using backend.Models;

namespace backend.Repositories;

public interface IFloorRepository : IRepository<Floor>
{
    Task<IEnumerable<Floor>> GetByBuildingIdAsync(int buildingId);
    Task<Floor?> GetWithRoomsAsync(int id);
    Task<Floor?> GetByBuildingAndFloorNumberAsync(int buildingId, int floorNumber);
    Task<bool> ExistsAsync(int buildingId, int floorNumber);
}
