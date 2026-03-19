using backend.DTOs;
using backend.Models;
using backend.Repositories;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IServiceService
{
    Task<List<ServiceDto>> GetAllAsync();
    Task<List<ServiceDto>> GetActiveServicesAsync();
    Task<List<ServiceInContractDto>> GetServicesByContractAsync(int contractId);
    Task<List<ServiceInContractDto>> GetServicesByRoomAsync(int roomId, DateTime? fromDate = null, DateTime? toDate = null);
    Task<ServiceDto?> GetByIdAsync(int id);
    Task<ServiceDto> CreateAsync(CreateServiceDto dto);
    Task<ServiceDto> UpdateAsync(int id, UpdateServiceDto dto);
    Task DeleteAsync(int id);
    Task<List<ServicePriceHistoryDto>> GetPriceHistoryAsync(int serviceId);
}

public class ServiceService : IServiceService
{
    private readonly IServiceRepository _serviceRepository;
    private readonly ApplicationDbContext _context;

    public ServiceService(IServiceRepository serviceRepository, ApplicationDbContext context)
    {
        _serviceRepository = serviceRepository;
        _context = context;
    }

    private static string NormalizeServiceType(string? serviceType)
    {
        var value = (serviceType ?? string.Empty).Trim().ToLowerInvariant();
        if (value.Contains("biến") || value.Contains("bien") || value.Contains("variable"))
        {
            return "Biến đổi";
        }

        return "Cố định";
    }

    public async Task<List<ServiceDto>> GetAllAsync()
    {
        var services = await _serviceRepository.GetAllAsync();
        return services.Select(MapToDto).ToList();
    }

    public async Task<List<ServiceDto>> GetActiveServicesAsync()
    {
        var services = await _serviceRepository.FindAsync(s => s.IsActive);
        return services.Select(MapToDto).ToList();
    }

    public async Task<List<ServiceInContractDto>> GetServicesByContractAsync(int contractId)
    {
        var contract = await _context.HopDongs
            .AsNoTracking()
            .Include(h => h.ChiTietOs)
            .FirstOrDefaultAsync(h => h.Id == contractId);

        if (contract == null)
        {
            throw new InvalidOperationException("Hợp đồng không tồn tại");
        }

        var contractStart = contract.StartDate;
        var contractEnd = contract.ExpectedEndDate ?? DateTime.UtcNow;
        var residentIds = contract.ChiTietOs.Select(x => x.ResidentId).Distinct().ToList();

        var usagesQuery = _context.ChiTietSuDungDichVus
            .AsNoTracking()
            .Include(u => u.Service)
            .Include(u => u.Resident)
            .Where(u => u.RoomId == contract.RoomId
                && u.ApplyFrom <= contractEnd
                && (u.ApplyTo == null || u.ApplyTo >= contractStart)
                && u.Service.IsActive);

        if (residentIds.Count > 0)
        {
            usagesQuery = usagesQuery.Where(u => residentIds.Contains(u.ResidentId));
        }

        var usages = await usagesQuery.ToListAsync();
        return AggregateServices(usages);
    }

    public async Task<List<ServiceInContractDto>> GetServicesByRoomAsync(int roomId, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var from = fromDate ?? DateTime.MinValue;
        var to = toDate ?? DateTime.MaxValue;

        var usages = await _context.ChiTietSuDungDichVus
            .AsNoTracking()
            .Include(u => u.Service)
            .Include(u => u.Resident)
            .Where(u => u.RoomId == roomId
                && u.ApplyFrom <= to
                && (u.ApplyTo == null || u.ApplyTo >= from)
                && u.Service.IsActive)
            .ToListAsync();

        return AggregateServices(usages);
    }

    public async Task<ServiceDto?> GetByIdAsync(int id)
    {
        var service = await _serviceRepository.GetByIdAsync(id);
        return service == null ? null : MapToDto(service);
    }

    public async Task<ServiceDto> CreateAsync(CreateServiceDto dto)
    {
        // Check if service name already exists
        var existingService = await _serviceRepository.FirstOrDefaultAsync(s => s.Name == dto.Name);
        if (existingService != null)
        {
            throw new InvalidOperationException($"Dịch vụ '{dto.Name}' đã tồn tại");
        }

        var service = new Service
        {
            Name = dto.Name,
            ServiceType = NormalizeServiceType(dto.ServiceType),
            Unit = dto.Unit,
            CommonUnitPrice = dto.CommonUnitPrice,
            IsActive = true,
            EffectiveDate = dto.EffectiveDate ?? DateTime.UtcNow
        };

        await _serviceRepository.AddAsync(service);
        await _serviceRepository.SaveChangesAsync();

        return MapToDto(service);
    }

    public async Task<ServiceDto> UpdateAsync(int id, UpdateServiceDto dto)
    {
        var service = await _serviceRepository.GetByIdAsync(id);
        if (service == null)
        {
            throw new InvalidOperationException("Dịch vụ không tồn tại");
        }

        // Check unique name if name is being updated
        if (!string.IsNullOrWhiteSpace(dto.Name) && dto.Name != service.Name)
        {
            var existingService = await _serviceRepository.FirstOrDefaultAsync(s => s.Name == dto.Name);
            if (existingService != null)
            {
                throw new InvalidOperationException($"Dịch vụ '{dto.Name}' đã tồn tại");
            }
            service.Name = dto.Name;
        }

        if (!string.IsNullOrWhiteSpace(dto.ServiceType))
            service.ServiceType = NormalizeServiceType(dto.ServiceType);

        if (dto.Unit != null)
            service.Unit = dto.Unit;

        // If price is being changed, record history
        if (dto.CommonUnitPrice.HasValue && dto.CommonUnitPrice.Value != (service.CommonUnitPrice ?? 0))
        {
            var effectiveDate = dto.EffectiveDate ?? DateTime.UtcNow;
            var history = new ServicePriceHistory
            {
                ServiceId = id,
                OldPrice = service.CommonUnitPrice ?? 0,
                NewPrice = dto.CommonUnitPrice.Value,
                EffectiveDate = effectiveDate,
                Reason = dto.Reason,
                ChangedAt = DateTime.UtcNow
            };
            _context.ServicePriceHistories.Add(history);

            service.CommonUnitPrice = dto.CommonUnitPrice.Value;
            service.EffectiveDate = effectiveDate;
        }
        else if (dto.CommonUnitPrice.HasValue)
        {
            service.CommonUnitPrice = dto.CommonUnitPrice.Value;
        }

        if (dto.IsActive.HasValue)
            service.IsActive = dto.IsActive.Value;

        _serviceRepository.Update(service);
        await _serviceRepository.SaveChangesAsync();
        await _context.SaveChangesAsync();

        return MapToDto(service);
    }

    public async Task<List<ServicePriceHistoryDto>> GetPriceHistoryAsync(int serviceId)
    {
        return await _context.ServicePriceHistories
            .Where(h => h.ServiceId == serviceId)
            .OrderByDescending(h => h.EffectiveDate)
            .Select(h => new ServicePriceHistoryDto
            {
                Id = h.Id,
                OldPrice = h.OldPrice,
                NewPrice = h.NewPrice,
                EffectiveDate = h.EffectiveDate,
                Reason = h.Reason,
                ChangedAt = h.ChangedAt
            })
            .ToListAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var service = await _serviceRepository.GetByIdAsync(id);
        if (service == null)
        {
            throw new InvalidOperationException("Dịch vụ không tồn tại");
        }

        // Soft delete - just mark as inactive
        service.IsActive = false;
        _serviceRepository.Update(service);
        await _serviceRepository.SaveChangesAsync();
    }

    private static ServiceDto MapToDto(Service service)
    {
        return new ServiceDto
        {
            Id = service.Id,
            Name = service.Name,
            ServiceType = service.ServiceType,
            Unit = service.Unit,
            CommonUnitPrice = service.CommonUnitPrice,
            IsActive = service.IsActive,
            EffectiveDate = service.EffectiveDate
        };
    }

    private static List<ServiceInContractDto> AggregateServices(List<ChiTietSuDungDichVu> usages)
    {
        var now = DateTime.UtcNow;

        return usages
            .GroupBy(u => u.ServiceId)
            .Select(group =>
            {
                var latest = group.OrderByDescending(x => x.ApplyFrom).First();
                var latestWithOverride = group
                    .Where(x => x.OverrideUnitPrice.HasValue)
                    .OrderByDescending(x => x.ApplyFrom)
                    .FirstOrDefault();

                var applyToValues = group
                    .Where(x => x.ApplyTo.HasValue)
                    .Select(x => x.ApplyTo!.Value)
                    .ToList();

                return new ServiceInContractDto
                {
                    ServiceId = group.Key,
                    ServiceName = latest.Service?.Name ?? string.Empty,
                    ServiceType = latest.Service?.ServiceType ?? string.Empty,
                    Unit = latest.Service?.Unit,
                    UnitPrice = latestWithOverride?.OverrideUnitPrice ?? latest.Service?.CommonUnitPrice,
                    ApplyFrom = group.Min(x => x.ApplyFrom),
                    ApplyTo = applyToValues.Count > 0 ? applyToValues.Max() : null,
                    TotalQuantity = group.Sum(x => x.Quantity ?? 1),
                    ResidentCount = group.Select(x => x.ResidentId).Distinct().Count(),
                    ResidentNames = group
                        .Select(x => x.Resident?.FullName)
                        .Where(name => !string.IsNullOrWhiteSpace(name))
                        .Distinct()
                        .ToList()!,
                    IsActive = group.Any(x => x.ApplyFrom <= now && (x.ApplyTo == null || x.ApplyTo >= now)),
                    Note = group
                        .OrderByDescending(x => x.ApplyFrom)
                        .Select(x => x.Note)
                        .FirstOrDefault(note => !string.IsNullOrWhiteSpace(note))
                };
            })
            .OrderBy(x => x.ServiceName)
            .ToList();
    }
}
