using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text.Json;

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
            .Include(service => service.PriceHistories)
            .Include(service => service.Building)
            .Include(service => service.BuildingScopes)
                .ThenInclude(scope => scope.Building)
            .Where(service => service.OwnerUserId == ownerUserId && service.IsActive)
            .OrderBy(service => service.Name)
            .ToListAsync();

        return services.Select(MapToDto).ToList();
    }

    public async Task<List<ServiceDto>> GetActiveServicesAsync(int ownerUserId)
    {
        var services = await _context.Services
            .AsNoTracking()
            .Include(service => service.PriceHistories)
            .Include(service => service.Building)
            .Include(service => service.BuildingScopes)
                .ThenInclude(scope => scope.Building)
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
                .ThenInclude(service => service!.PriceHistories)
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
                .ThenInclude(service => service!.PriceHistories)
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
            .Include(item => item.PriceHistories)
            .Include(item => item.Building)
            .Include(item => item.BuildingScopes)
                .ThenInclude(scope => scope.Building)
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == ownerUserId);
        return service == null ? null : MapToDto(service);
    }

    public async Task<ServiceDto> CreateAsync(CreateServiceDto dto, int ownerUserId)
    {
        var serviceName = dto.Name.Trim();
        var buildingIds = NormalizeBuildingIds(dto.BuildingIds, dto.BuildingId);
        await EnsureOwnsBuildingsAsync(buildingIds, ownerUserId);

        var existingServices = await _context.Services
            .Include(service => service.PriceHistories)
            .Include(service => service.Building)
            .Include(service => service.BuildingScopes)
                .ThenInclude(scope => scope.Building)
            .Where(item => item.OwnerUserId == ownerUserId
                && item.Name == serviceName)
            .ToListAsync();
        var conflictingActiveService = existingServices
            .FirstOrDefault(item => item.IsActive && ServiceScopesConflict(GetServiceBuildingIds(item), buildingIds));
        if (conflictingActiveService != null)
        {
            throw new InvalidOperationException($"Dịch vụ '{serviceName}' đã tồn tại trong phạm vi này");
        }

        var existingService = existingServices
            .FirstOrDefault(item => !item.IsActive && ServiceScopesEqual(GetServiceBuildingIds(item), buildingIds));
        if (existingService != null)
        {
            var effectiveDate = dto.EffectiveDate ?? DateTime.UtcNow;
            var newPrice = dto.CommonUnitPrice ?? existingService.CommonUnitPrice;
            if (newPrice.HasValue && newPrice.Value != (existingService.CommonUnitPrice ?? 0))
            {
                _context.ServicePriceHistories.Add(new ServicePriceHistory
                {
                    ServiceId = existingService.Id,
                    OldPrice = existingService.CommonUnitPrice ?? 0,
                    NewPrice = newPrice.Value,
                    EffectiveDate = effectiveDate,
                    Reason = "Khôi phục dịch vụ đã xóa",
                    ChangedAt = DateTime.UtcNow
                });
            }

            existingService.ServiceType = NormalizeServiceType(dto.ServiceType, serviceName);
            existingService.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? null : dto.Unit.Trim();
            existingService.CommonUnitPrice = newPrice;
            existingService.EffectiveDate = effectiveDate;
            existingService.IsActive = true;
            await SyncServiceBuildingScopesAsync(existingService, buildingIds);

            await _context.SaveChangesAsync();
            return MapToDto(existingService);
        }

        var service = new Service
        {
            Name = serviceName,
            ServiceType = NormalizeServiceType(dto.ServiceType, serviceName),
            Unit = string.IsNullOrWhiteSpace(dto.Unit) ? null : dto.Unit.Trim(),
            CommonUnitPrice = dto.CommonUnitPrice,
            IsActive = true,
            EffectiveDate = dto.EffectiveDate ?? DateTime.UtcNow,
            OwnerUserId = ownerUserId,
            BuildingId = null
        };

        await _context.Services.AddAsync(service);
        await SyncServiceBuildingScopesAsync(service, buildingIds);
        await _context.SaveChangesAsync();

        return MapToDto(service);
    }

    public async Task<ServiceDto> UpdateAsync(int id, UpdateServiceDto dto, int ownerUserId)
    {
        var service = await _context.Services
            .Include(item => item.PriceHistories)
            .Include(item => item.BuildingScopes)
                .ThenInclude(scope => scope.Building)
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == ownerUserId);
        if (service == null)
        {
            throw new InvalidOperationException("Dịch vụ không tồn tại");
        }

        var nextName = string.IsNullOrWhiteSpace(dto.Name) ? null : dto.Name.Trim();
        var hasScopeUpdate = dto.BuildingIds != null || dto.BuildingId.HasValue;
        var nextBuildingIds = hasScopeUpdate
            ? NormalizeBuildingIds(dto.BuildingIds, dto.BuildingId)
            : GetServiceBuildingIds(service);
        if (hasScopeUpdate)
        {
            await EnsureOwnsBuildingsAsync(nextBuildingIds, ownerUserId);
        }

        var effectiveName = nextName ?? service.Name;
        if ((nextName != null && nextName != service.Name) || hasScopeUpdate)
        {
            var sameNameServices = await _context.Services
                .AsNoTracking()
                .Include(item => item.BuildingScopes)
                .Where(item => item.OwnerUserId == ownerUserId
                    && item.Id != service.Id
                    && item.IsActive
                    && item.Name == effectiveName)
                .ToListAsync();
            if (sameNameServices.Any(item => ServiceScopesConflict(GetServiceBuildingIds(item), nextBuildingIds)))
            {
                throw new InvalidOperationException($"Dịch vụ '{effectiveName}' đã tồn tại trong phạm vi này");
            }
        }

        if (nextName != null && nextName != service.Name)
        {
            service.Name = nextName;
        }

        if (!string.IsNullOrWhiteSpace(dto.ServiceType))
        {
            service.ServiceType = NormalizeServiceType(dto.ServiceType, service.Name);
        }

        if (dto.BuildingIds != null || dto.BuildingId.HasValue)
        {
            await SyncServiceBuildingScopesAsync(service, nextBuildingIds);
            service.BuildingId = null;
        }

        if (dto.Unit != null)
        {
            service.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? null : dto.Unit.Trim();
        }

        var now = DateTime.UtcNow;
        var vietnamToday = GetVietnamToday();
        var pendingPriceHistories = service.PriceHistories
            .Where(history => GetVietnamDate(history.EffectiveDate) > vietnamToday)
            .ToList();
        var requestedEffectiveDate = dto.EffectiveDate ?? now;
        var pendingDateChanged = pendingPriceHistories.Count > 0
            && service.EffectiveDate.HasValue
            && GetVietnamDate(service.EffectiveDate.Value) != GetVietnamDate(requestedEffectiveDate);
        var priceChanged = dto.CommonUnitPrice.HasValue
            && (dto.CommonUnitPrice.Value != (service.CommonUnitPrice ?? 0) || pendingDateChanged);

        if (priceChanged)
        {
            var currentPrice = ResolvePriceState(service).CurrentPrice ?? service.CommonUnitPrice ?? 0;
            _context.ServicePriceHistories.RemoveRange(pendingPriceHistories);
            foreach (var pendingHistory in pendingPriceHistories)
            {
                service.PriceHistories.Remove(pendingHistory);
            }

            var effectiveDate = requestedEffectiveDate;
            var newPrice = dto.CommonUnitPrice.GetValueOrDefault();
            service.PriceHistories.Add(new ServicePriceHistory
            {
                ServiceId = id,
                OldPrice = currentPrice,
                NewPrice = newPrice,
                EffectiveDate = effectiveDate,
                Reason = dto.Reason,
                ChangedAt = DateTime.UtcNow
            });

            service.CommonUnitPrice = newPrice;
            service.EffectiveDate = effectiveDate;

            if (IsMarketPriceService(service) && GetVietnamDate(effectiveDate) <= vietnamToday)
            {
                await SynchronizeMarketPriceAsync(service, newPrice, ownerUserId);
            }
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

    private async Task SynchronizeMarketPriceAsync(Service service, decimal newPrice, int ownerUserId)
    {
        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var rooms = await _context.Rooms
            .Where(room => room.Floor.Building.OwnerUserId == ownerUserId)
            .ToListAsync();

        foreach (var room in rooms)
        {
            var serviceIds = DeserializeJson<List<int>>(room.ServiceIdsJson, jsonOptions) ?? new List<int>();
            var prices = DeserializeJson<List<RoomServicePriceDto>>(room.ServicePricesJson, jsonOptions)
                ?? new List<RoomServicePriceDto>();
            var roomUsesService = serviceIds.Contains(service.Id)
                || prices.Any(item => item.ServiceId == service.Id);
            if (!roomUsesService)
            {
                continue;
            }

            var price = prices.FirstOrDefault(item => item.ServiceId == service.Id);
            if (price == null)
            {
                prices.Add(new RoomServicePriceDto { ServiceId = service.Id, Price = newPrice });
            }
            else
            {
                price.Price = newPrice;
            }

            room.ServicePricesJson = JsonSerializer.Serialize(prices, jsonOptions);
        }

        var today = DateTime.UtcNow.Date;
        var activeContracts = await _context.HopDongs
            .Where(contract =>
                contract.Room.Floor.Building.OwnerUserId == ownerUserId
                && (contract.ExpectedEndDate == null || contract.ExpectedEndDate.Value.Date >= today))
            .ToListAsync();

        foreach (var contract in activeContracts)
        {
            var formula = DeserializeJson<List<BillingFormulaItemDto>>(contract.BillingFormulaJson, jsonOptions);
            if (formula == null)
            {
                continue;
            }

            var changed = false;
            foreach (var item in formula.Where(item => item.ServiceId == service.Id))
            {
                item.UnitPrice = newPrice;
                changed = true;
            }

            if (changed)
            {
                contract.BillingFormulaJson = JsonSerializer.Serialize(formula, jsonOptions);
                contract.UpdatedAt = DateTime.UtcNow;
            }
        }
    }

    private static T? DeserializeJson<T>(string? json, JsonSerializerOptions options)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return default;
        }

        try
        {
            return JsonSerializer.Deserialize<T>(json, options);
        }
        catch
        {
            return default;
        }
    }

    private static bool IsMarketPriceService(Service service)
    {
        var type = NormalizeKey(service.ServiceType);
        var name = NormalizeKey(service.Name);
        return type == "dien"
            || type == "nuoc"
            || name.Contains("dien")
            || name.Contains("nuoc");
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

    private static string NormalizeServiceType(string? serviceType, string? serviceName = null)
    {
        var value = (serviceType ?? string.Empty).Trim().ToLowerInvariant();
        var searchableValue = NormalizeKey($"{serviceType} {serviceName}");
        if (string.IsNullOrWhiteSpace(value))
        {
            return "Theo tháng";
        }

        if (searchableValue.Contains("dien") || searchableValue.Contains("electric"))
        {
            return "Điện";
        }

        if (searchableValue.Contains("nuoc") || searchableValue.Contains("water"))
        {
            return "Nước";
        }

        if (searchableValue.Contains("xe") || searchableValue.Contains("parking"))
        {
            return "Cần nhập số lượng";
        }

        if (searchableValue.Contains("nguoi") || searchableValue.Contains("person"))
        {
            return "Cần nhập số lượng";
        }

        if (value.Contains("biến") || value.Contains("bien") || value.Contains("variable"))
        {
            return "Điện";
        }

        if (value.Contains("cố định") || value.Contains("co dinh") || value.Contains("fixed"))
        {
            return "Theo tháng";
        }

        return NormalizeKey(serviceType) switch
        {
            "dien" => "Điện",
            "nuoc" => "Nước",
            "can nhap so luong" => "Cần nhập số lượng",
            "theo thang" => "Theo tháng",
            _ => throw new InvalidOperationException("Loại dịch vụ không hợp lệ")
        };
    }

    private static string NormalizeKey(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var normalized = value.Trim().ToLowerInvariant().Normalize(System.Text.NormalizationForm.FormD);
        var builder = new System.Text.StringBuilder(normalized.Length);
        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character == 'đ' ? 'd' : character);
            }
        }

        return builder.ToString().Normalize(System.Text.NormalizationForm.FormC);
    }

    private static ServiceDto MapToDto(Service service)
    {
        var priceState = ResolvePriceState(service);
        var scopedBuildings = service.BuildingScopes?
            .Where(scope => scope.Building != null)
            .OrderBy(scope => scope.Building.BuildingName)
            .ToList() ?? new List<ServiceBuildingScope>();

        return new ServiceDto
        {
            Id = service.Id,
            Name = service.Name,
            ServiceType = service.ServiceType,
            Unit = service.Unit,
            CommonUnitPrice = service.CommonUnitPrice,
            CurrentUnitPrice = priceState.CurrentPrice,
            ScheduledUnitPrice = priceState.ScheduledPrice,
            ScheduledEffectiveDate = priceState.ScheduledEffectiveDate,
            IsActive = service.IsActive,
            EffectiveDate = service.EffectiveDate,
            PriceUpdatedAt = service.PriceHistories
                .OrderByDescending(history => history.ChangedAt)
                .Select(history => (DateTime?)history.ChangedAt)
                .FirstOrDefault() ?? service.EffectiveDate,
            OwnerUserId = service.OwnerUserId,
            BuildingId = scopedBuildings.Count == 1 ? scopedBuildings[0].BuildingId : service.BuildingId,
            BuildingName = scopedBuildings.Count == 1 ? scopedBuildings[0].Building.BuildingName : service.Building?.BuildingName,
            BuildingIds = scopedBuildings.Select(scope => scope.BuildingId).ToList(),
            BuildingNames = scopedBuildings.Select(scope => scope.Building.BuildingName).ToList()
        };
    }

    private static List<int> NormalizeBuildingIds(List<int>? buildingIds, int? buildingId)
    {
        var ids = buildingIds?.Where(id => id > 0).Distinct().ToList() ?? new List<int>();
        if (ids.Count == 0 && buildingId.HasValue && buildingId.Value > 0)
        {
            ids.Add(buildingId.Value);
        }

        return ids;
    }

    private static List<int> GetServiceBuildingIds(Service service)
    {
        var scopedIds = service.BuildingScopes?
            .Select(scope => scope.BuildingId)
            .Where(id => id > 0)
            .Distinct()
            .OrderBy(id => id)
            .ToList() ?? new List<int>();

        if (scopedIds.Count == 0 && service.BuildingId.HasValue && service.BuildingId.Value > 0)
        {
            scopedIds.Add(service.BuildingId.Value);
        }

        return scopedIds;
    }

    private static bool ServiceScopesEqual(List<int> first, List<int> second)
    {
        return first.Count == second.Count && first.OrderBy(id => id).SequenceEqual(second.OrderBy(id => id));
    }

    private static bool ServiceScopesConflict(List<int> first, List<int> second)
    {
        var firstIsCommon = first.Count == 0;
        var secondIsCommon = second.Count == 0;
        if (firstIsCommon || secondIsCommon)
        {
            return firstIsCommon && secondIsCommon;
        }

        return first.Intersect(second).Any();
    }

    private async Task EnsureOwnsBuildingsAsync(List<int> buildingIds, int ownerUserId)
    {
        if (buildingIds.Count == 0)
        {
            return;
        }

        var ownedCount = await _context.Buildings
            .AsNoTracking()
            .CountAsync(building => buildingIds.Contains(building.Id) && building.OwnerUserId == ownerUserId);
        if (ownedCount != buildingIds.Count)
        {
            throw new InvalidOperationException("Có tòa nhà không tồn tại hoặc không thuộc quyền quản lý");
        }
    }

    private async Task SyncServiceBuildingScopesAsync(Service service, List<int> buildingIds)
    {
        service.BuildingScopes.Clear();
        foreach (var buildingId in buildingIds.Distinct())
        {
            service.BuildingScopes.Add(new ServiceBuildingScope
            {
                Service = service,
                BuildingId = buildingId
            });
        }

        await Task.CompletedTask;
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
                var priceState = latest.Service == null
                    ? (CurrentPrice: (decimal?)null, ScheduledPrice: (decimal?)null, ScheduledEffectiveDate: (DateTime?)null)
                    : ResolvePriceState(latest.Service);
                var currentPrice = latestWithOverride?.OverrideUnitPrice ?? priceState.CurrentPrice;

                return new ServiceInContractDto
                {
                    ServiceId = group.Key,
                    ServiceName = latest.Service?.Name ?? string.Empty,
                    ServiceType = latest.Service?.ServiceType ?? string.Empty,
                    Unit = latest.Service?.Unit,
                    UnitPrice = currentPrice,
                    CurrentUnitPrice = currentPrice,
                    ScheduledUnitPrice = priceState.ScheduledPrice,
                    ScheduledEffectiveDate = priceState.ScheduledEffectiveDate,
                    ApplyFrom = group.Min(item => item.ApplyFrom),
                    ApplyTo = applyToValues.Count > 0 ? applyToValues.Max() : null,
                    PriceUpdatedAt = latest.Service?.PriceHistories
                        .OrderByDescending(history => history.ChangedAt)
                        .Select(history => (DateTime?)history.ChangedAt)
                        .FirstOrDefault() ?? latest.Service?.EffectiveDate,
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

    private static (decimal? CurrentPrice, decimal? ScheduledPrice, DateTime? ScheduledEffectiveDate) ResolvePriceState(Service service)
    {
        var vietnamToday = GetVietnamToday();
        var histories = service.PriceHistories?
            .OrderBy(history => history.EffectiveDate)
            .ToList() ?? new List<ServicePriceHistory>();
        var currentHistory = histories
            .Where(history => GetVietnamDate(history.EffectiveDate) <= vietnamToday)
            .OrderByDescending(history => history.EffectiveDate)
            .FirstOrDefault();
        var scheduledHistory = histories
            .Where(history => GetVietnamDate(history.EffectiveDate) > vietnamToday)
            .OrderBy(history => history.EffectiveDate)
            .FirstOrDefault();

        var currentPrice = currentHistory?.NewPrice
            ?? scheduledHistory?.OldPrice
            ?? service.CommonUnitPrice;

        return (
            currentPrice,
            scheduledHistory?.NewPrice,
            scheduledHistory?.EffectiveDate
        );
    }

    private static DateTime GetVietnamToday()
    {
        return DateTime.UtcNow.AddHours(7).Date;
    }

    private static DateTime GetVietnamDate(DateTime value)
    {
        var utcValue = value.Kind == DateTimeKind.Utc
            ? value
            : DateTime.SpecifyKind(value, DateTimeKind.Utc);
        return utcValue.AddHours(7).Date;
    }
}
