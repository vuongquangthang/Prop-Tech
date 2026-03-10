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
            ServiceType = dto.ServiceType,
            Unit = dto.Unit,
            CommonUnitPrice = dto.CommonUnitPrice,
            IsActive = true
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
            service.ServiceType = dto.ServiceType;

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
}
