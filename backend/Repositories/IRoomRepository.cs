using backend.Models;

namespace backend.Repositories;

public interface IRoomRepository : IRepository<Room>
{
    Task<Room?> GetByRoomCodeAsync(string maPhong);
    Task<IEnumerable<Room>> GetByFloorIdAsync(int floorId);
    Task<IEnumerable<Room>> GetByStatusAsync(string status);
    Task<Room?> GetWithDetailsAsync(int id);
    Task<IEnumerable<Room>> GetAvailableRoomsAsync();
    Task<bool> ExistsByCodeAsync(string maPhong);
}
