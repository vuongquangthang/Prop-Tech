using backend.DTOs;
using backend.Data;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend.Services;

public interface IRoomService
{
    Task<List<RoomDto>> GetAllAsync(int ownerUserId);
    Task<List<RoomDto>> GetByFloorIdAsync(int floorId, int ownerUserId);
    Task<List<RoomDto>> GetByStatusAsync(string status, int ownerUserId);
    Task<RoomDetailDto?> GetByIdAsync(int id, int? ownerUserId = null);
    Task<MyRoomDto?> GetMyRoomAsync(int userId);
    Task<RoomDto> CreateAsync(CreateRoomDto dto, int ownerUserId);
    Task<RoomDto> UpdateAsync(int id, UpdateRoomDto dto, int ownerUserId);
    Task DeleteAsync(int id, int ownerUserId);
}

public class RoomService : IRoomService
{
    private const string ActivePostStatus = "active";
    private const string PausedPostStatus = "paused";
    private const string DeletedPostStatus = "deleted";
    private const string DeletedRoomStatus = "Đã xóa";

    private readonly IRoomRepository _roomRepository;
    private readonly IFloorRepository _floorRepository;
    private readonly IBuildingRepository _buildingRepository;
    private readonly IHopDongRepository _hopDongRepository;
    private readonly IChiTietORepository _chiTietORepository;
    private readonly IUserRepository _userRepository;
    private readonly IServiceRepository _serviceRepository;
    private readonly IChiTietTaiSanPhongRepository _chiTietTaiSanPhongRepository;
    private readonly ITaiSanRepository _taiSanRepository;
    private readonly ApplicationDbContext _dbContext;

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
        IServiceRepository serviceRepository,
        IChiTietTaiSanPhongRepository chiTietTaiSanPhongRepository,
        ITaiSanRepository taiSanRepository,
        ApplicationDbContext dbContext)
    {
        _roomRepository = roomRepository;
        _floorRepository = floorRepository;
        _buildingRepository = buildingRepository;
        _hopDongRepository = hopDongRepository;
        _chiTietORepository = chiTietORepository;
        _userRepository = userRepository;
        _serviceRepository = serviceRepository;
        _chiTietTaiSanPhongRepository = chiTietTaiSanPhongRepository;
        _taiSanRepository = taiSanRepository;
        _dbContext = dbContext;
    }

    private IQueryable<Room> RoomsForOwner(int ownerUserId)
    {
        return _dbContext.Rooms
            .AsNoTracking()
            .Include(room => room.Floor)
                .ThenInclude(floor => floor.Building)
            .Include(room => room.HopDongs)
            .Include(room => room.ChiTietTaiSanPhongs)
                .ThenInclude(detail => detail.TaiSan)
            .Where(room => room.Floor.Building.OwnerUserId == ownerUserId
                && !room.Floor.IsDeleted
                && !room.Floor.Building.IsDeleted
                && room.Status != DeletedRoomStatus);
    }

    public async Task<List<RoomDto>> GetAllAsync(int ownerUserId)
    {
        var rooms = await RoomsForOwner(ownerUserId)
            .OrderBy(room => room.RoomCode)
            .ToListAsync();
        var roomDtos = new List<RoomDto>();
        foreach (var room in rooms)
        {
            roomDtos.Add(await MapToDto(room));
        }
        return roomDtos;
    }

    public async Task<List<RoomDto>> GetByFloorIdAsync(int floorId, int ownerUserId)
    {
        var rooms = await RoomsForOwner(ownerUserId)
            .Where(room => room.FloorId == floorId)
            .OrderBy(room => room.RoomCode)
            .ToListAsync();
        var roomDtos = new List<RoomDto>();
        foreach (var room in rooms)
        {
            roomDtos.Add(await MapToDto(room));
        }
        return roomDtos;
    }

    public async Task<List<RoomDto>> GetByStatusAsync(string status, int ownerUserId)
    {
        var rooms = await RoomsForOwner(ownerUserId)
            .Where(room => room.Status == status)
            .OrderBy(room => room.RoomCode)
            .ToListAsync();
        var roomDtos = new List<RoomDto>();
        foreach (var room in rooms)
        {
            roomDtos.Add(await MapToDto(room));
        }
        return roomDtos;
    }

    public async Task<RoomDetailDto?> GetByIdAsync(int id, int? ownerUserId = null)
    {
        var query = _dbContext.Rooms
            .Include(room => room.Floor)
                .ThenInclude(floor => floor.Building)
            .Include(room => room.HopDongs)
                .ThenInclude(contract => contract.ChiTietOs)
                    .ThenInclude(residency => residency.Resident)
            .Include(room => room.ChiTietTaiSanPhongs)
                .ThenInclude(detail => detail.TaiSan)
            .Where(room => room.Id == id
                && room.Status != DeletedRoomStatus
                && !room.Floor.IsDeleted
                && !room.Floor.Building.IsDeleted);

        if (ownerUserId.HasValue)
        {
            query = query.Where(room => room.Floor.Building.OwnerUserId == ownerUserId.Value);
        }

        var room = await query.FirstOrDefaultAsync();
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
            BuildingAddress = building?.Address ?? baseDto.BuildingAddress,
            FloorNumber = baseDto.FloorNumber,
            RoomCode = baseDto.RoomCode,
            Area = baseDto.Area,
            MaxOccupants = baseDto.MaxOccupants,
            DefaultRentPrice = baseDto.DefaultRentPrice,
            Description = baseDto.Description,
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
            ServicePrices = baseDto.ServicePrices,
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

    public async Task<RoomDto> CreateAsync(CreateRoomDto dto, int ownerUserId)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        // Validate floor exists
        var floor = await _dbContext.Floors
            .Include(item => item.Building)
            .FirstOrDefaultAsync(item => item.Id == dto.FloorId && item.Building.OwnerUserId == ownerUserId);
        if (floor == null)
        {
            throw new InvalidOperationException("Tầng không tồn tại");
        }

        if (dto.MaxOccupants.HasValue && dto.MaxOccupants.Value <= 0)
        {
            throw new InvalidOperationException("Số người tối đa phải lớn hơn 0");
        }

        // Check for duplicate room code
        var roomCode = dto.RoomCode.Trim();
        var existing = await _dbContext.Rooms
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.FloorId == dto.FloorId
                && item.RoomCode == roomCode
                && item.Status != DeletedRoomStatus);
        if (existing != null)
        {
            throw new InvalidOperationException($"Mã phòng '{roomCode}' đã tồn tại");
        }

        ValidateCoordinates(dto.Latitude, dto.Longitude);

        var room = new Room
        {
            FloorId = dto.FloorId,
            RoomCode = roomCode,
            Address = NormalizeOptionalText(dto.Address),
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            NormalizedAddress = NormalizeOptionalText(dto.NormalizedAddress),
            GoongPlaceId = NormalizeOptionalText(dto.GoongPlaceId),
            LocationSource = NormalizeOptionalText(dto.LocationSource),
            LocationAccuracy = NormalizeOptionalText(dto.LocationAccuracy),
            LocationVerifiedAt = dto.Latitude.HasValue && dto.Longitude.HasValue ? DateTime.UtcNow : null,
            ManualScanRadiusMeters = dto.ManualScanRadiusMeters,
            Area = dto.Area,
            MaxOccupants = dto.MaxOccupants,
            DefaultRentPrice = dto.DefaultRentPrice,
            Description = dto.Description,
            Status = dto.Status,
            RoomType = NormalizeRoomType(dto.RoomType),
            HasPrivateBathroom = dto.HasPrivateBathroom,
            LivingRoomCount = dto.LivingRoomCount,
            BedroomCount = dto.BedroomCount,
            KitchenCount = dto.KitchenCount,
            BathroomCount = dto.BathroomCount,
            ImageUrlsJson = JsonSerializer.Serialize(SanitizeImageUrls(dto.ImageUrls), JsonOptions),
            AmenitiesJson = JsonSerializer.Serialize(dto.Amenities ?? new List<string>(), JsonOptions),
            ServiceIdsJson = JsonSerializer.Serialize(dto.ServiceIds ?? new List<int>(), JsonOptions),
            ServicePricesJson = JsonSerializer.Serialize(dto.ServicePrices ?? new List<RoomServicePriceDto>(), JsonOptions)
        };

        await _roomRepository.AddAsync(room);
        await _roomRepository.SaveChangesAsync();

        await SyncRoomAssetsAsync(room.Id, dto.Amenities, ownerUserId, floor.BuildingId);
        await _roomRepository.SaveChangesAsync();

        await transaction.CommitAsync();

        var createdRoom = await _roomRepository.GetWithDetailsAsync(room.Id);
        if (createdRoom == null)
        {
            throw new InvalidOperationException("Không thể tải lại thông tin phòng vừa tạo");
        }

        return await MapToDto(createdRoom);
    }

    public async Task<RoomDto> UpdateAsync(int id, UpdateRoomDto dto, int ownerUserId)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        var room = await _dbContext.Rooms
            .Include(item => item.Floor)
                .ThenInclude(item => item.Building)
            .FirstOrDefaultAsync(item => item.Id == id && item.Floor.Building.OwnerUserId == ownerUserId);
        if (room == null)
        {
            throw new InvalidOperationException("Phòng không tồn tại");
        }

        if (dto.MaxOccupants.HasValue && dto.MaxOccupants.Value <= 0)
        {
            throw new InvalidOperationException("Số người tối đa phải lớn hơn 0");
        }

        // Check for duplicate room code (if changed)
        var nextRoomCode = string.IsNullOrWhiteSpace(dto.RoomCode) ? null : dto.RoomCode.Trim();
        if (nextRoomCode != null && nextRoomCode != room.RoomCode)
        {
            var existing = await _dbContext.Rooms
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.FloorId == room.FloorId
                    && item.RoomCode == nextRoomCode
                    && item.Status != DeletedRoomStatus);
            if (existing != null)
            {
                throw new InvalidOperationException($"Mã phòng '{nextRoomCode}' đã tồn tại");
            }
            room.RoomCode = nextRoomCode;
        }

        var shouldLockRoomPosts = dto.Status != null && IsOccupiedRoomStatus(dto.Status);
        var shouldUnlockRoomPosts = dto.Status != null && IsAvailableRoomStatus(dto.Status);
        if (shouldLockRoomPosts && !await HasActiveRoomContractAsync(room.Id))
        {
            throw new InvalidOperationException("Không thể chuyển phòng sang Đã thuê khi chưa có hợp đồng");
        }

        if (shouldUnlockRoomPosts && await HasActiveRoomContractAsync(room.Id))
        {
            throw new InvalidOperationException("Không thể chuyển phòng về Trống khi vẫn còn hợp đồng");
        }

        if (dto.Area.HasValue) room.Area = dto.Area;
        if (dto.MaxOccupants.HasValue) room.MaxOccupants = dto.MaxOccupants;
        if (dto.DefaultRentPrice.HasValue) room.DefaultRentPrice = dto.DefaultRentPrice;
        if (dto.Description != null) room.Description = dto.Description;
        if (dto.Status != null) room.Status = dto.Status;
        if (dto.RoomType != null) room.RoomType = NormalizeRoomType(dto.RoomType);
        if (dto.HasPrivateBathroom.HasValue) room.HasPrivateBathroom = dto.HasPrivateBathroom.Value;
        if (dto.LivingRoomCount.HasValue) room.LivingRoomCount = dto.LivingRoomCount;
        if (dto.BedroomCount.HasValue) room.BedroomCount = dto.BedroomCount;
        if (dto.KitchenCount.HasValue) room.KitchenCount = dto.KitchenCount;
        if (dto.BathroomCount.HasValue) room.BathroomCount = dto.BathroomCount;
        if (dto.Address != null) room.Address = NormalizeOptionalText(dto.Address);
        if (dto.NormalizedAddress != null) room.NormalizedAddress = NormalizeOptionalText(dto.NormalizedAddress);
        if (dto.GoongPlaceId != null) room.GoongPlaceId = NormalizeOptionalText(dto.GoongPlaceId);
        if (dto.LocationSource != null) room.LocationSource = NormalizeOptionalText(dto.LocationSource);
        if (dto.LocationAccuracy != null) room.LocationAccuracy = NormalizeOptionalText(dto.LocationAccuracy);
        if (dto.ManualScanRadiusMeters.HasValue) room.ManualScanRadiusMeters = dto.ManualScanRadiusMeters;
        if (dto.Latitude.HasValue || dto.Longitude.HasValue)
        {
            ValidateCoordinates(dto.Latitude, dto.Longitude);
            room.Latitude = dto.Latitude;
            room.Longitude = dto.Longitude;
            room.LocationVerifiedAt = DateTime.UtcNow;
        }
        if (dto.ImageUrls != null) room.ImageUrlsJson = JsonSerializer.Serialize(SanitizeImageUrls(dto.ImageUrls), JsonOptions);
        if (dto.Amenities != null) room.AmenitiesJson = JsonSerializer.Serialize(dto.Amenities, JsonOptions);
        if (dto.ServiceIds != null) room.ServiceIdsJson = JsonSerializer.Serialize(dto.ServiceIds, JsonOptions);
        if (dto.ServicePrices != null) room.ServicePricesJson = JsonSerializer.Serialize(dto.ServicePrices, JsonOptions);

        if (shouldLockRoomPosts)
        {
            await LockRoomPostsAsync(room.Id, room.Status);
        }
        else if (shouldUnlockRoomPosts)
        {
            await UnlockRoomPostsAsync(room.Id, room.Status);
        }

        _roomRepository.Update(room);
        await _roomRepository.SaveChangesAsync();

        if (dto.Amenities != null)
        {
            await SyncRoomAssetsAsync(room.Id, dto.Amenities, ownerUserId, room.Floor.BuildingId);
            await _roomRepository.SaveChangesAsync();
        }

        await transaction.CommitAsync();

        var updatedRoom = await _roomRepository.GetWithDetailsAsync(room.Id);
        if (updatedRoom == null)
        {
            throw new InvalidOperationException("Không thể tải lại thông tin phòng vừa cập nhật");
        }

        return await MapToDto(updatedRoom);
    }

    public async Task DeleteAsync(int id, int ownerUserId)
    {
        var room = await _dbContext.Rooms
            .Include(item => item.Floor)
                .ThenInclude(item => item.Building)
            .Include(item => item.HopDongs)
            .Include(item => item.ChiTietSuDungDichVus)
            .FirstOrDefaultAsync(item => item.Id == id && item.Floor.Building.OwnerUserId == ownerUserId);
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

        room.Status = DeletedRoomStatus;
        room.Description = string.IsNullOrWhiteSpace(room.Description)
            ? $"Phòng đã được xóa khỏi danh sách ngày {DateTime.UtcNow:dd/MM/yyyy}."
            : $"{room.Description}\nPhòng đã được xóa khỏi danh sách ngày {DateTime.UtcNow:dd/MM/yyyy}.";
        await MarkRoomPostsDeletedAsync(room.Id);
        _roomRepository.Update(room);
        await _roomRepository.SaveChangesAsync();
    }

    private async Task MarkRoomPostsDeletedAsync(int roomId)
    {
        var posts = await _dbContext.BaiDangTimPhongs
            .Where(post => post.RoomId == roomId)
            .ToListAsync();

        foreach (var post in posts)
        {
            post.IsLocked = true;
            post.Status = DeletedPostStatus;
            post.RoomStatus = DeletedRoomStatus;
        }
    }

    private async Task LockRoomPostsAsync(int roomId, string roomStatus)
    {
        var posts = await _dbContext.BaiDangTimPhongs
            .Include(post => post.CreatedByUser)
            .Where(post => post.RoomId == roomId)
            .ToListAsync();

        foreach (var post in posts)
        {
            if (IsDeletedPost(post))
            {
                post.IsLocked = true;
                post.RoomStatus = roomStatus;
                continue;
            }

            if (IsSharedRoommatePost(post))
            {
                post.IsLocked = false;
                post.Status = ActivePostStatus;
                post.RoomStatus = roomStatus;
                continue;
            }

            post.IsLocked = true;
            post.Status = PausedPostStatus;
            post.RoomStatus = roomStatus;
        }
    }

    private async Task UnlockRoomPostsAsync(int roomId, string roomStatus)
    {
        var posts = await _dbContext.BaiDangTimPhongs
            .Where(post => post.RoomId == roomId)
            .ToListAsync();

        foreach (var post in posts)
        {
            if (IsDeletedPost(post))
            {
                post.IsLocked = true;
                post.RoomStatus = roomStatus;
                continue;
            }

            post.IsLocked = false;
            post.Status = ActivePostStatus;
            post.RoomStatus = roomStatus;
        }
    }

    private static bool IsOccupiedRoomStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return false;
        }

        var normalized = status.Trim().ToLowerInvariant();
        return normalized == "đã thuê"
            || normalized == "ÄÃ£ thuÃª"
            || normalized == "da thue"
            || normalized == "rented"
            || normalized == "occupied";
    }

    private static bool IsSharedRoommatePost(BaiDangTimPhong post)
    {
        return string.Equals(post.CreatedByUser?.Role, "CuDan", StringComparison.OrdinalIgnoreCase)
            || (post.CurrentOccupants ?? 0) > 0;
    }

    private static bool IsDeletedPost(BaiDangTimPhong post)
    {
        return string.Equals(post.Status, DeletedPostStatus, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAvailableRoomStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return false;
        }

        var normalized = status.Trim().ToLowerInvariant();
        return normalized == "trống"
            || normalized == "trá»‘ng"
            || normalized == "trong"
            || normalized == "available"
            || normalized == "empty";
    }

    private Task<bool> HasActiveRoomContractAsync(int roomId)
    {
        var now = DateTime.UtcNow;
        return _dbContext.HopDongs.AnyAsync(contract =>
            contract.RoomId == roomId
            && (contract.ExpectedEndDate == null || contract.ExpectedEndDate > now));
    }

    private async Task<RoomDto> MapToDto(Room room)
    {
        var floor = await _floorRepository.GetByIdAsync(room.FloorId);
        var building = floor != null ? await _buildingRepository.GetByIdAsync(floor.BuildingId) : null;
        var serviceIds = DeserializeList<int>(room.ServiceIdsJson);
        var servicePrices = DeserializeList<RoomServicePriceDto>(room.ServicePricesJson);
        var services = await ResolveServicesAsync(serviceIds, servicePrices);
        var imageUrls = DeserializeList<string>(room.ImageUrlsJson);
        var now = DateTime.UtcNow;
        var activeContract = room.HopDongs?
            .Where(contract => contract.ExpectedEndDate == null || contract.ExpectedEndDate > now)
            .OrderBy(contract => contract.ExpectedEndDate ?? DateTime.MaxValue)
            .FirstOrDefault();
        var amenities = room.ChiTietTaiSanPhongs != null && room.ChiTietTaiSanPhongs.Count > 0
            ? room.ChiTietTaiSanPhongs
                .Where(ct => ct.TaiSan != null)
                .Select(ct => ct.TaiSan!.AssetName)
                .Distinct()
                .ToList()
            : DeserializeList<string>(room.AmenitiesJson);

        return new RoomDto
        {
            Id = room.Id,
            FloorId = room.FloorId,
            BuildingId = floor?.BuildingId ?? 0,
            BuildingName = building?.BuildingName ?? "",
            BuildingAddress = building?.Address ?? "",
            FloorNumber = floor?.FloorNumber ?? 0,
            RoomCode = room.RoomCode,
            Address = room.Address,
            Latitude = room.Latitude,
            Longitude = room.Longitude,
            NormalizedAddress = room.NormalizedAddress,
            GoongPlaceId = room.GoongPlaceId,
            LocationSource = room.LocationSource,
            LocationAccuracy = room.LocationAccuracy,
            LocationVerifiedAt = room.LocationVerifiedAt,
            ManualScanRadiusMeters = room.ManualScanRadiusMeters,
            Area = room.Area,
            MaxOccupants = room.MaxOccupants,
            DefaultRentPrice = room.DefaultRentPrice,
            Description = room.Description,
            Status = room.Status,
            ActiveContractEndDate = activeContract?.ExpectedEndDate,
            RoomType = NormalizeRoomType(room.RoomType),
            HasPrivateBathroom = room.HasPrivateBathroom,
            LivingRoomCount = room.LivingRoomCount,
            BedroomCount = room.BedroomCount,
            KitchenCount = room.KitchenCount,
            BathroomCount = room.BathroomCount,
            ImageUrls = imageUrls,
            Amenities = amenities,
            ServiceIds = serviceIds,
            ServicePrices = servicePrices,
            Services = services
        };
    }

    private async Task SyncRoomAssetsAsync(int roomId, List<string>? amenityNames, int ownerUserId, int roomBuildingId)
    {
        var selectedAmenityNames = (amenityNames ?? new List<string>())
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var allAssets = (await _taiSanRepository.GetAllAsync(ownerUserId)).ToList();
        var selectedAssets = new List<TaiSan>();

        foreach (var amenityName in selectedAmenityNames)
        {
            var asset = allAssets.FirstOrDefault(x =>
                string.Equals(x.AssetName?.Trim(), amenityName, StringComparison.OrdinalIgnoreCase)
                && AppliesToBuilding(x, roomBuildingId));
            if (asset == null)
            {
                throw new InvalidOperationException($"Tiện nghi '{amenityName}' không tồn tại trong kho tài sản của tòa này");
            }

            selectedAssets.Add(asset);
        }

        var existingDetails = (await _chiTietTaiSanPhongRepository.GetByRoomIdAsync(roomId, ownerUserId)).ToList();
        var existingByAssetId = existingDetails.ToDictionary(x => x.AssetId);
        var selectedAssetIds = selectedAssets.Select(x => x.Id).ToHashSet();

        foreach (var detail in existingDetails.Where(x => !selectedAssetIds.Contains(x.AssetId)).ToList())
        {
            await _chiTietTaiSanPhongRepository.DeleteAsync(detail.RoomId, detail.AssetId, ownerUserId);
        }

        foreach (var asset in selectedAssets)
        {
            if (existingByAssetId.ContainsKey(asset.Id))
            {
                continue;
            }

            await _chiTietTaiSanPhongRepository.CreateAsync(new ChiTietTaiSanPhong
            {
                RoomId = roomId,
                AssetId = asset.Id,
                Quantity = 1,
                Condition = "Tốt"
            });
        }
    }

    private static bool AppliesToBuilding(TaiSan asset, int buildingId)
    {
        if (asset.BuildingScopes != null && asset.BuildingScopes.Count > 0)
        {
            return asset.BuildingScopes.Any(scope => scope.BuildingId == buildingId);
        }

        return !asset.BuildingId.HasValue || asset.BuildingId.Value == buildingId;
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

    private static string? NormalizeOptionalText(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private const int MaxImageUrls = 6;

    private static List<string> SanitizeImageUrls(IEnumerable<string>? urls)
    {
        if (urls == null)
        {
            return new List<string>();
        }

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var result = new List<string>();
        foreach (var url in urls)
        {
            if (string.IsNullOrWhiteSpace(url))
            {
                continue;
            }

            var trimmed = url.Trim();
            if (!seen.Add(trimmed))
            {
                continue;
            }

            result.Add(trimmed);
            if (result.Count >= MaxImageUrls)
            {
                break;
            }
        }

        return result;
    }

    private static void ValidateCoordinates(double? latitude, double? longitude)
    {
        if (latitude.HasValue != longitude.HasValue)
        {
            throw new InvalidOperationException("Vui lÃ²ng chá»n Ä‘á»§ cáº£ vá»¹ Ä‘á»™ vÃ  kinh Ä‘á»™");
        }

        if ((latitude.HasValue && (double.IsNaN(latitude.Value) || double.IsInfinity(latitude.Value)))
            || (longitude.HasValue && (double.IsNaN(longitude.Value) || double.IsInfinity(longitude.Value))))
        {
            throw new InvalidOperationException("Toa do khong hop le");
        }

        if (latitude is < -90 or > 90)
        {
            throw new InvalidOperationException("VÄ© Ä‘á»™ khÃ´ng há»£p lá»‡");
        }

        if (longitude is < -180 or > 180)
        {
            throw new InvalidOperationException("Kinh Ä‘á»™ khÃ´ng há»£p lá»‡");
        }
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

    private async Task<List<ServiceInfoDto>> ResolveServicesAsync(
        List<int> serviceIds,
        List<RoomServicePriceDto>? roomServicePrices = null)
    {
        if (serviceIds.Count == 0)
        {
            return new List<ServiceInfoDto>();
        }

        var services = await _serviceRepository.FindAsync(s => serviceIds.Contains(s.Id));
        var serviceMap = services.ToDictionary(s => s.Id, s => s);
        var priceMap = (roomServicePrices ?? new List<RoomServicePriceDto>())
            .GroupBy(item => item.ServiceId)
            .ToDictionary(group => group.Key, group => group.Last().Price);

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
                Price = priceMap.TryGetValue(id, out var roomPrice) ? roomPrice : service.CommonUnitPrice ?? 0,
                Unit = service.Unit ?? string.Empty
            });
        }

        return result;
    }
}
