using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend.Services;

public interface IRoomService
{
    Task<List<RoomDto>> GetAllAsync();
    Task<List<RoomDto>> GetByFloorIdAsync(int floorId);
    Task<List<RoomDto>> GetByStatusAsync(string status);
    Task<RoomDetailDto?> GetByIdAsync(int id);
    Task<MyRoomDto?> GetMyRoomAsync(int userId);
    Task<RoomDto> CreateAsync(CreateRoomDto dto);
    Task<RoomDto> UpdateAsync(int id, UpdateRoomDto dto);
    Task DeleteAsync(int id);
}

public class RoomService : IRoomService
{
    private readonly IRoomRepository _roomRepository;
    private readonly IFloorRepository _floorRepository;
    private readonly IBuildingRepository _buildingRepository;
    private readonly IHopDongRepository _hopDongRepository;
    private readonly IChiTietORepository _chiTietORepository;
    private readonly IUserRepository _userRepository;
    private readonly IServiceRepository _serviceRepository;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public RoomService(
        IRoomRepository roomRepository,
        IFloorRepository floorRepository,
        IBuildingRepository buildingRepository,
        IHopDongRepository hopDongRepository,
        IChiTietORepository chiTietORepository,
        IUserRepository userRepository,
        IServiceRepository serviceRepository)
    {
        _roomRepository = roomRepository;
        _floorRepository = floorRepository;
        _buildingRepository = buildingRepository;
        _hopDongRepository = hopDongRepository;
        _chiTietORepository = chiTietORepository;
        _userRepository = userRepository;
        _serviceRepository = serviceRepository;
    }

    public async Task<List<RoomDto>> GetAllAsync()
    {
        var rooms = await _roomRepository.GetAllAsync();
        var roomDtos = new List<RoomDto>();
        foreach (var room in rooms)
        {
            roomDtos.Add(await MapToDto(room));
        }
        return roomDtos;
    }

    public async Task<List<RoomDto>> GetByFloorIdAsync(int floorId)
    {
        var rooms = await _roomRepository.GetByFloorIdAsync(floorId);
        var roomDtos = new List<RoomDto>();
        foreach (var room in rooms)
        {
            roomDtos.Add(await MapToDto(room));
        }
        return roomDtos;
    }

    public async Task<List<RoomDto>> GetByStatusAsync(string status)
    {
        var rooms = await _roomRepository.GetByStatusAsync(status);
        var roomDtos = new List<RoomDto>();
        foreach (var room in rooms)
        {
            roomDtos.Add(await MapToDto(room));
        }
        return roomDtos;
    }

    public async Task<RoomDetailDto?> GetByIdAsync(int id)
    {
        var room = await _roomRepository.GetWithDetailsAsync(id);
        if (room == null) return null;

        var floor = await _floorRepository.GetByIdAsync(room.FloorId);
        var building = floor != null ? await _buildingRepository.GetByIdAsync(floor.BuildingId) : null;
        var baseDto = await MapToDto(room);

        return new RoomDetailDto
        {
            Id = baseDto.Id,
            FloorId = baseDto.FloorId,
            BuildingId = floor?.BuildingId ?? baseDto.BuildingId,
            BuildingName = building?.BuildingName ?? baseDto.BuildingName,
            FloorNumber = baseDto.FloorNumber,
            RoomCode = baseDto.RoomCode,
            Area = baseDto.Area,
            MaxOccupants = baseDto.MaxOccupants,
            DefaultRentPrice = baseDto.DefaultRentPrice,
            Status = baseDto.Status,
            RoomType = baseDto.RoomType,
            HasPrivateBathroom = baseDto.HasPrivateBathroom,
            LivingRoomCount = baseDto.LivingRoomCount,
            BedroomCount = baseDto.BedroomCount,
            KitchenCount = baseDto.KitchenCount,
            BathroomCount = baseDto.BathroomCount,
            ImageUrls = baseDto.ImageUrls,
            Amenities = baseDto.Amenities,
            ServiceIds = baseDto.ServiceIds,
            Services = baseDto.Services,
            ActiveContracts = room.HopDongs?
                .Where(hd => hd.ExpectedEndDate == null || hd.ExpectedEndDate > DateTime.UtcNow)
                .Select(hd => new ContractSummaryDto
                {
                    Id = hd.Id,
                    StartDate = hd.StartDate,
                    ExpectedEndDate = hd.ExpectedEndDate,
                    ActualRentPrice = hd.ActualRentPrice,
                    ResidentNames = hd.ChiTietOs?.Select(ct => ct.Resident.FullName).ToList() ?? new()
                }).ToList(),
            Assets = room.ChiTietTaiSanPhongs?
                .Select(ct => new AssetSummaryDto
                {
                    AssetId = ct.AssetId,
                    AssetName = ct.TaiSan?.AssetName ?? string.Empty,
                    Quantity = ct.Quantity,
                    Condition = ct.Condition
                }).ToList()
        };
    }

    public async Task<MyRoomDto?> GetMyRoomAsync(int userId)
    {
        // Get user with resident info
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null || user.ResidentId == null)
        {
            return null;
        }

        // Find active residency for this resident
        var activeResidency = await _chiTietORepository.FirstOrDefaultAsync(ct => 
            ct.ResidentId == user.ResidentId.Value &&
            (ct.ToDate == null || ct.ToDate > DateTime.UtcNow));

        if (activeResidency == null)
        {
            return null;
        }

        var contract = await _hopDongRepository.GetByIdAsync(activeResidency.ContractId);
        if (contract == null)
        {
            return null;
        }

        var room = await _roomRepository.GetByIdAsync(contract.RoomId);
        if (room == null)
        {
            return null;
        }

        var floor = await _floorRepository.GetByIdAsync(room.FloorId);
        var building = floor != null ? await _buildingRepository.GetByIdAsync(floor.BuildingId) : null;

        // Find household head (Người thuê chính) for this contract
        var allResidencies = await _chiTietORepository.GetByContractIdAsync(contract.Id);
        var householdHead = allResidencies
            .FirstOrDefault(ct => ct.ResidencyRole == "Người thuê chính" && (ct.ToDate == null || ct.ToDate > DateTime.UtcNow));
        var householdHeadName = householdHead?.Resident?.FullName
            ?? allResidencies.FirstOrDefault()?.Resident?.FullName; // fallback to first resident

        // For now, return basic room info
        // Services and pricing can be added later when the schema supports it
        return new MyRoomDto
        {
            RoomId = room.Id,
            RoomCode = room.RoomCode,
            Area = room.Area,
            Status = room.Status,
            BuildingId = building?.Id ?? 0,
            BuildingName = building?.BuildingName ?? "",
            BuildingAddress = building?.Address ?? "",
            FloorId = floor?.Id ?? 0,
            FloorNumber = floor?.FloorNumber ?? 0,
            ContractId = contract.Id,
            ContractStartDate = contract.StartDate,
            ContractEndDate = contract.ExpectedEndDate,
            RentPrice = contract.ActualRentPrice,
            Deposit = contract.DepositAmount ?? 0,
            HouseholdHeadName = householdHeadName,
            Services = new List<ServiceInfoDto>(), // TODO: Load services when schema is ready
            ElectricityBasePrice = null,
            ElectricityTiers = new List<ElectricityTierDto>(),
            WaterPricePerCubicMeter = null
        };
    }

    public async Task<RoomDto> CreateAsync(CreateRoomDto dto)
    {
        // Validate floor exists
        var floor = await _floorRepository.GetByIdAsync(dto.FloorId);
        if (floor == null)
        {
            throw new InvalidOperationException("Tầng không tồn tại");
        }

        // Check for duplicate room code
        var existing = await _roomRepository.GetByRoomCodeAsync(dto.RoomCode);
        if (existing != null)
        {
            throw new InvalidOperationException($"Mã phòng '{dto.RoomCode}' đã tồn tại");
        }

        var room = new Room
        {
            FloorId = dto.FloorId,
            RoomCode = dto.RoomCode,
            Area = dto.Area,
            MaxOccupants = dto.MaxOccupants,
            DefaultRentPrice = dto.DefaultRentPrice,
            Status = dto.Status,
            RoomType = NormalizeRoomType(dto.RoomType),
            HasPrivateBathroom = dto.HasPrivateBathroom,
            LivingRoomCount = dto.LivingRoomCount,
            BedroomCount = dto.BedroomCount,
            KitchenCount = dto.KitchenCount,
            BathroomCount = dto.BathroomCount,
            ImageUrlsJson = JsonSerializer.Serialize(dto.ImageUrls ?? new List<string>(), JsonOptions),
            AmenitiesJson = JsonSerializer.Serialize(dto.Amenities ?? new List<string>(), JsonOptions),
            ServiceIdsJson = JsonSerializer.Serialize(dto.ServiceIds ?? new List<int>(), JsonOptions)
        };

        await _roomRepository.AddAsync(room);
        await _roomRepository.SaveChangesAsync();
        return await MapToDto(room);
    }

    public async Task<RoomDto> UpdateAsync(int id, UpdateRoomDto dto)
    {
        var room = await _roomRepository.GetByIdAsync(id);
        if (room == null)
        {
            throw new InvalidOperationException("Phòng không tồn tại");
        }

        // Check for duplicate room code (if changed)
        if (dto.RoomCode != null && dto.RoomCode != room.RoomCode)
        {
            var existing = await _roomRepository.GetByRoomCodeAsync(dto.RoomCode);
            if (existing != null)
            {
                throw new InvalidOperationException($"Mã phòng '{dto.RoomCode}' đã tồn tại");
            }
            room.RoomCode = dto.RoomCode;
        }

        if (dto.Area.HasValue) room.Area = dto.Area;
        if (dto.MaxOccupants.HasValue) room.MaxOccupants = dto.MaxOccupants;
        if (dto.DefaultRentPrice.HasValue) room.DefaultRentPrice = dto.DefaultRentPrice;
        if (dto.Status != null) room.Status = dto.Status;
        if (dto.RoomType != null) room.RoomType = NormalizeRoomType(dto.RoomType);
        if (dto.HasPrivateBathroom.HasValue) room.HasPrivateBathroom = dto.HasPrivateBathroom.Value;
        if (dto.LivingRoomCount.HasValue) room.LivingRoomCount = dto.LivingRoomCount;
        if (dto.BedroomCount.HasValue) room.BedroomCount = dto.BedroomCount;
        if (dto.KitchenCount.HasValue) room.KitchenCount = dto.KitchenCount;
        if (dto.BathroomCount.HasValue) room.BathroomCount = dto.BathroomCount;
        if (dto.ImageUrls != null) room.ImageUrlsJson = JsonSerializer.Serialize(dto.ImageUrls, JsonOptions);
        if (dto.Amenities != null) room.AmenitiesJson = JsonSerializer.Serialize(dto.Amenities, JsonOptions);
        if (dto.ServiceIds != null) room.ServiceIdsJson = JsonSerializer.Serialize(dto.ServiceIds, JsonOptions);

        _roomRepository.Update(room);
        await _roomRepository.SaveChangesAsync();
        return await MapToDto(room);
    }

    public async Task DeleteAsync(int id)
    {
        var room = await _roomRepository.GetByIdAsync(id);
        if (room == null)
        {
            throw new InvalidOperationException("Phòng không tồn tại");
        }

        // Check if room has active contracts
        var hasActiveContracts = room.HopDongs?.Any(hd => 
            hd.ExpectedEndDate == null || hd.ExpectedEndDate > DateTime.UtcNow) ?? false;
        
        if (hasActiveContracts)
        {
            throw new InvalidOperationException("Không thể xóa phòng đang có hợp đồng");
        }

        _roomRepository.Remove(room);
        await _roomRepository.SaveChangesAsync();
    }

    private async Task<RoomDto> MapToDto(Room room)
    {
        var floor = await _floorRepository.GetByIdAsync(room.FloorId);
        var building = floor != null ? await _buildingRepository.GetByIdAsync(floor.BuildingId) : null;
        var serviceIds = DeserializeList<int>(room.ServiceIdsJson);
        var services = await ResolveServicesAsync(serviceIds);
        var imageUrls = DeserializeList<string>(room.ImageUrlsJson);
        var amenities = DeserializeList<string>(room.AmenitiesJson);

        return new RoomDto
        {
            Id = room.Id,
            FloorId = room.FloorId,
            BuildingId = floor?.BuildingId ?? 0,
            BuildingName = building?.BuildingName ?? "",
            FloorNumber = floor?.FloorNumber ?? 0,
            RoomCode = room.RoomCode,
            Area = room.Area,
            MaxOccupants = room.MaxOccupants,
            DefaultRentPrice = room.DefaultRentPrice,
            Status = room.Status,
            RoomType = NormalizeRoomType(room.RoomType),
            HasPrivateBathroom = room.HasPrivateBathroom,
            LivingRoomCount = room.LivingRoomCount,
            BedroomCount = room.BedroomCount,
            KitchenCount = room.KitchenCount,
            BathroomCount = room.BathroomCount,
            ImageUrls = imageUrls,
            Amenities = amenities,
            ServiceIds = serviceIds,
            Services = services
        };
    }

    private static string NormalizeRoomType(string? roomType)
    {
        if (string.IsNullOrWhiteSpace(roomType))
        {
            return "single";
        }

        var normalized = roomType.Trim().ToLowerInvariant();
        return normalized is "single" or "apartment" ? normalized : "single";
    }

    private static List<T> DeserializeList<T>(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<T>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<T>>(json, JsonOptions) ?? new List<T>();
        }
        catch
        {
            return new List<T>();
        }
    }

    private async Task<List<ServiceInfoDto>> ResolveServicesAsync(List<int> serviceIds)
    {
        if (serviceIds.Count == 0)
        {
            return new List<ServiceInfoDto>();
        }

        var services = await _serviceRepository.FindAsync(s => serviceIds.Contains(s.Id));
        var serviceMap = services.ToDictionary(s => s.Id, s => s);

        var result = new List<ServiceInfoDto>();
        foreach (var id in serviceIds)
        {
            if (!serviceMap.TryGetValue(id, out var service))
            {
                continue;
            }

            result.Add(new ServiceInfoDto
            {
                ServiceId = service.Id,
                ServiceName = service.Name,
                Price = service.CommonUnitPrice ?? 0,
                Unit = service.Unit ?? string.Empty
            });
        }

        return result;
    }
}
