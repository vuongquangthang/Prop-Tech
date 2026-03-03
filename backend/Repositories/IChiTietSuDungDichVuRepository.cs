using backend.Models;

namespace backend.Repositories;

public interface IChiTietSuDungDichVuRepository : IRepository<ChiTietSuDungDichVu>
{
    Task<IEnumerable<ChiTietSuDungDichVu>> GetByContractIdAsync(int hopDongId);
    Task<ChiTietSuDungDichVu?> GetByPeriodAsync(int hopDongId, int serviceId, byte kyThang, short kyNam);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetByPeriodRangeAsync(int hopDongId, DateTime from, DateTime to);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetByResidentIdAsync(int residentId);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetByRoomIdAsync(int roomId);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetByServiceIdAsync(int serviceId);
    Task<IEnumerable<ChiTietSuDungDichVu>> GetActiveUsagesAsync();
}

