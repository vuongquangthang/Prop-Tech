using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IServiceService
{
    Task<List<ServiceDto>> GetAllAsync(int ownerUserId);
    Task<List<ServiceDto>> GetActiveServicesAsync(int ownerUserId);
    Task<List<ServiceInContractDto>> GetServicesByContractAsync(int contractId, int ownerUserId);
    Task<List<ServiceInContractDto>> GetServicesByRoomAsync(int roomId, int ownerUserId, DateTime? fromDate = null, DateTime? toDate = null);
    Task<ServiceDto?> GetByIdAsync(int id, int ownerUserId);
    Task<ServiceDto> CreateAsync(CreateServiceDto dto, int ownerUserId);
    Task<ServiceDto> UpdateAsync(int id, UpdateServiceDto dto, int ownerUserId);
    Task DeleteAsync(int id, int ownerUserId);
    Task<List<ServicePriceHistoryDto>> GetPriceHistoryAsync(int serviceId, int ownerUserId);
}

public class ServiceService : IServiceService
{
    private readonly ApplicationDbContext _context;

    public ServiceService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ServiceDto>> GetAllAsync(int ownerUserId)
    {
        var services = await _context.Services
            .AsNoTracking()
            .Where(service => service.OwnerUserId == ownerUserId)
            .OrderBy(service => service.Name)
            .ToListAsync();

        return services.Select(MapToDto).ToList();
    }

    public async Task<List<ServiceDto>> GetActiveServicesAsync(int ownerUserId)
    {
        var services = await _context.Services
            .AsNoTracking()
            .Where(service => service.OwnerUserId == ownerUserId && service.IsActive)
            .OrderBy(service => service.Name)
            .ToListAsync();

        return services.Select(MapToDto).ToList();
    }

    public async Task<List<ServiceInContractDto>> GetServicesByContractAsync(int contractId, int ownerUserId)
    {
        var contract = await _context.HopDongs
            .AsNoTracking()
            .Include(contract => contract.Room)
                .ThenInclude(room => room.Floor)
                    .ThenInclude(floor => floor.Building)
            .Include(contract => contract.ChiTietOs)
            .FirstOrDefaultAsync(contract => contract.Id == contractId);

        if (contract == null || contract.Room.Floor.Building.OwnerUserId != ownerUserId)
        {
            throw new InvalidOperationException("Hợp đồng không tồn tại");
        }

        var contractStart = contract.StartDate;
        var contractEnd = contract.ExpectedEndDate ?? DateTime.UtcNow;
        var residentIds = contract.ChiTietOs.Select(item => item.ResidentId).Distinct().ToList();

        var usagesQuery = _context.ChiTietSuDungDichVus
            .AsNoTracking()
            .Include(usage => usage.Service)
            .Include(usage => usage.Resident)
            .Where(usage => usage.RoomId == contract.RoomId
                && usage.ApplyFrom <= contractEnd
                && (usage.ApplyTo == null || usage.ApplyTo >= contractStart)
                && usage.Service.IsActive
                && usage.Service.OwnerUserId == ownerUserId);

        if (residentIds.Count > 0)
        {
            usagesQuery = usagesQuery.Where(usage => residentIds.Contains(usage.ResidentId));
        }

        var usages = await usagesQuery.ToListAsync();
        return AggregateServices(usages);
    }

    public async Task<List<ServiceInContractDto>> GetServicesByRoomAsync(int roomId, int ownerUserId, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var ownsRoom = await _context.Rooms
            .AsNoTracking()
            .AnyAsync(room => room.Id == roomId && room.Floor.Building.OwnerUserId == ownerUserId);
        if (!ownsRoom)
        {
            return new List<ServiceInContractDto>();
        }

        var from = fromDate ?? DateTime.MinValue;
        var to = toDate ?? DateTime.MaxValue;

        var usages = await _context.ChiTietSuDungDichVus
            .AsNoTracking()
            .Include(usage => usage.Service)
            .Include(usage => usage.Resident)
            .Where(usage => usage.RoomId == roomId
                && usage.ApplyFrom <= to
                && (usage.ApplyTo == null || usage.ApplyTo >= from)
                && usage.Service.IsActive
                && usage.Service.OwnerUserId == ownerUserId)
            .ToListAsync();

        return AggregateServices(usages);
    }

    public async Task<ServiceDto?> GetByIdAsync(int id, int ownerUserId)
    {
        var service = await _context.Services
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == ownerUserId);
        return service == null ? null : MapToDto(service);
    }

    public async Task<ServiceDto> CreateAsync(CreateServiceDto dto, int ownerUserId)
    {
        var serviceName = dto.Name.Trim();
        var existingService = await _context.Services
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.OwnerUserId == ownerUserId && item.Name == serviceName);
        if (existingService != null)
        {
            throw new InvalidOperationException($"Dịch vụ '{serviceName}' đã tồn tại");
        }

        var service = new Service
        {
            Name = serviceName,
            ServiceType = NormalizeServiceType(dto.ServiceType),
            Unit = string.IsNullOrWhiteSpace(dto.Unit) ? null : dto.Unit.Trim(),
            CommonUnitPrice = dto.CommonUnitPrice,
            IsActive = true,
            EffectiveDate = dto.EffectiveDate ?? DateTime.UtcNow,
            OwnerUserId = ownerUserId
        };

        await _context.Services.AddAsync(service);
        await _context.SaveChangesAsync();

        return MapToDto(service);
    }

    public async Task<ServiceDto> UpdateAsync(int id, UpdateServiceDto dto, int ownerUserId)
    {
        var service = await _context.Services
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == ownerUserId);
        if (service == null)
        {
            throw new InvalidOperationException("Dịch vụ không tồn tại");
        }

        var nextName = string.IsNullOrWhiteSpace(dto.Name) ? null : dto.Name.Trim();
        if (nextName != null && nextName != service.Name)
        {
            var existingService = await _context.Services
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.OwnerUserId == ownerUserId && item.Name == nextName);
            if (existingService != null)
            {
                throw new InvalidOperationException($"Dịch vụ '{nextName}' đã tồn tại");
            }

            service.Name = nextName;
        }

        if (!string.IsNullOrWhiteSpace(dto.ServiceType))
        {
            service.ServiceType = NormalizeServiceType(dto.ServiceType);
        }

        if (dto.Unit != null)
        {
            service.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? null : dto.Unit.Trim();
        }

        if (dto.CommonUnitPrice.HasValue && dto.CommonUnitPrice.Value != (service.CommonUnitPrice ?? 0))
        {
            var effectiveDate = dto.EffectiveDate ?? DateTime.UtcNow;
            _context.ServicePriceHistories.Add(new ServicePriceHistory
            {
                ServiceId = id,
                OldPrice = service.CommonUnitPrice ?? 0,
                NewPrice = dto.CommonUnitPrice.Value,
                EffectiveDate = effectiveDate,
                Reason = dto.Reason,
                ChangedAt = DateTime.UtcNow
            });

            service.CommonUnitPrice = dto.CommonUnitPrice.Value;
            service.EffectiveDate = effectiveDate;
        }
        else if (dto.CommonUnitPrice.HasValue)
        {
            service.CommonUnitPrice = dto.CommonUnitPrice.Value;
        }

        if (dto.IsActive.HasValue)
        {
            service.IsActive = dto.IsActive.Value;
        }

        await _context.SaveChangesAsync();
        return MapToDto(service);
    }

    public async Task DeleteAsync(int id, int ownerUserId)
    {
        var service = await _context.Services
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == ownerUserId);
        if (service == null)
        {
            throw new InvalidOperationException("Dịch vụ không tồn tại");
        }

        service.IsActive = false;
        await _context.SaveChangesAsync();
    }

    public async Task<List<ServicePriceHistoryDto>> GetPriceHistoryAsync(int serviceId, int ownerUserId)
    {
        var ownsService = await _context.Services
            .AsNoTracking()
            .AnyAsync(item => item.Id == serviceId && item.OwnerUserId == ownerUserId);
        if (!ownsService)
        {
            return new List<ServicePriceHistoryDto>();
        }

        return await _context.ServicePriceHistories
            .AsNoTracking()
            .Where(history => history.ServiceId == serviceId)
            .OrderByDescending(history => history.EffectiveDate)
            .Select(history => new ServicePriceHistoryDto
            {
                Id = history.Id,
                OldPrice = history.OldPrice,
                NewPrice = history.NewPrice,
                EffectiveDate = history.EffectiveDate,
                Reason = history.Reason,
                ChangedAt = history.ChangedAt
            })
            .ToListAsync();
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
            EffectiveDate = service.EffectiveDate,
            OwnerUserId = service.OwnerUserId
        };
    }

    private static List<ServiceInContractDto> AggregateServices(List<ChiTietSuDungDichVu> usages)
    {
        var now = DateTime.UtcNow;

        return usages
            .GroupBy(usage => usage.ServiceId)
            .Select(group =>
            {
                var latest = group.OrderByDescending(item => item.ApplyFrom).First();
                var latestWithOverride = group
                    .Where(item => item.OverrideUnitPrice.HasValue)
                    .OrderByDescending(item => item.ApplyFrom)
                    .FirstOrDefault();

                var applyToValues = group
                    .Where(item => item.ApplyTo.HasValue)
                    .Select(item => item.ApplyTo!.Value)
                    .ToList();

                return new ServiceInContractDto
                {
                    ServiceId = group.Key,
                    ServiceName = latest.Service?.Name ?? string.Empty,
                    ServiceType = latest.Service?.ServiceType ?? string.Empty,
                    Unit = latest.Service?.Unit,
                    UnitPrice = latestWithOverride?.OverrideUnitPrice ?? latest.Service?.CommonUnitPrice,
                    ApplyFrom = group.Min(item => item.ApplyFrom),
                    ApplyTo = applyToValues.Count > 0 ? applyToValues.Max() : null,
                    TotalQuantity = group.Sum(item => item.Quantity ?? 1),
                    ResidentCount = group.Select(item => item.ResidentId).Distinct().Count(),
                    ResidentNames = group
                        .Select(item => item.Resident?.FullName)
                        .Where(name => !string.IsNullOrWhiteSpace(name))
                        .Distinct()
                        .ToList()!,
                    IsActive = group.Any(item => item.ApplyFrom <= now && (item.ApplyTo == null || item.ApplyTo >= now)),
                    Note = group
                        .OrderByDescending(item => item.ApplyFrom)
                        .Select(item => item.Note)
                        .FirstOrDefault(note => !string.IsNullOrWhiteSpace(note))
                };
            })
            .OrderBy(item => item.ServiceName)
            .ToList();
    }
}
