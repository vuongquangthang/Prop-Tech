using backend.Models;

namespace backend.Repositories;

public interface IResidentRepository : IRepository<Resident>
{
    Task<Resident?> GetByPhoneAsync(string phone);
    Task<Resident?> GetByPhoneNumberAsync(string phoneNumber);
    Task<Resident?> GetByCccdAsync(string cccd);
    Task<Resident?> GetByIdCardNumberAsync(string idCardNumber);
    Task<IEnumerable<Resident>> SearchByNameAsync(string name);
    Task<Resident?> GetWithContractsAsync(int id);
    Task<Resident?> GetWithVehiclesAsync(int id);
    Task<bool> ExistsByCccdAsync(string cccd);
}
