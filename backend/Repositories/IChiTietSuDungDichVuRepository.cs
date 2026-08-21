using backend.Models;

namespace backend.Repositories;

public interface IChiTietSuDungDichVuRepository : IRepository<ChiTietSuDungDichVu>
{
    Task<IEnumerable<ChiTietSuDungDichVu>> GetByContractIdAsync(int hopDongId);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetAllAsync(int ownerUserId);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetActiveUsagesAsync(int ownerUserId);
    Task<ChiTietSuDungDichVu?> GetByPeriodAsync(int hopDongId, int serviceId, byte kyThang, short kyNam);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetByPeriodRangeAsync(int hopDongId, DateTime from, DateTime to);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetByResidentIdAsync(int residentId);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetByResidentIdAsync(int residentId, int ownerUserId);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetByRoomIdAsync(int roomId);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetByRoomIdAsync(int roomId, int ownerUserId);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetByServiceIdAsync(int serviceId);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetByServiceIdAsync(int serviceId, int ownerUserId);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetActiveUsagesAsync();
}

