using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IFloorService
{
    Task<List<FloorDto>> GetAllAsync(int ownerUserId);
    Task<List<FloorDto>> GetByBuildingIdAsync(int buildingId, int ownerUserId);
    Task<FloorDetailDto?> GetByIdAsync(int id, int ownerUserId);
    Task<FloorDto> CreateAsync(CreateFloorDto dto, int ownerUserId);
    Task<FloorDto> UpdateAsync(int id, UpdateFloorDto dto, int ownerUserId);
    Task DeleteAsync(int id, int ownerUserId);
}

public class FloorService : IFloorService
{
    private readonly ApplicationDbContext _context;

    public FloorService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<FloorDto>> GetAllAsync(int ownerUserId)
    {
        var floors = await _context.Floors
            .AsNoTracking()
            .Include(floor => floor.Building)
            .Include(floor => floor.Rooms)
            .Where(floor => floor.Building.OwnerUserId == ownerUserId
                && !floor.IsDeleted
                && !floor.Building.IsDeleted)
            .OrderBy(floor => floor.Building.BuildingName)
            .ThenBy(floor => floor.FloorNumber)
            .ToListAsync();

        return floors.Select(MapToDto).ToList();
    }

    public async Task<List<FloorDto>> GetByBuildingIdAsync(int buildingId, int ownerUserId)
    {
        var floors = await _context.Floors
            .AsNoTracking()
            .Include(floor => floor.Building)
            .Include(floor => floor.Rooms)
            .Where(floor => floor.BuildingId == buildingId
                && floor.Building.OwnerUserId == ownerUserId
                && !floor.IsDeleted
                && !floor.Building.IsDeleted)
            .OrderBy(floor => floor.FloorNumber)
            .ToListAsync();

        return floors.Select(MapToDto).ToList();
    }

    public async Task<FloorDetailDto?> GetByIdAsync(int id, int ownerUserId)
    {
        var floor = await _context.Floors
            .AsNoTracking()
            .Include(item => item.Building)
            .Include(item => item.Rooms)
            .FirstOrDefaultAsync(item => item.Id == id
                && item.Building.OwnerUserId == ownerUserId
                && !item.IsDeleted
                && !item.Building.IsDeleted);
        if (floor == null) return null;

        return new FloorDetailDto
        {
            Id = floor.Id,
            BuildingId = floor.BuildingId,
            BuildingName = floor.Building.BuildingName,
            BuildingAddress = floor.Building.Address,
            BuildingLatitude = floor.Building.Latitude,
            BuildingLongitude = floor.Building.Longitude,
            FloorNumber = floor.FloorNumber,
            TotalRooms = floor.Rooms.Count(room => room.Status != "Đã xóa"),
            Rooms = floor.Rooms
                .Where(room => room.Status != "Đã xóa")
                .OrderBy(room => room.RoomCode)
                .Select(room => new RoomDto
                {
                    Id = room.Id,
                    FloorId = room.FloorId,
                    BuildingId = floor.BuildingId,
                    BuildingName = floor.Building.BuildingName,
                    BuildingAddress = floor.Building.Address,
                    BuildingLatitude = floor.Building.Latitude,
                    BuildingLongitude = floor.Building.Longitude,
                    FloorNumber = floor.FloorNumber,
                    RoomCode = room.RoomCode,
                    Area = room.Area,
                    MaxOccupants = room.MaxOccupants,
                    DefaultRentPrice = room.DefaultRentPrice,
                    Description = room.Description,
                    Status = room.Status,
                    RoomType = room.RoomType,
                    HasPrivateBathroom = room.HasPrivateBathroom,
                    LivingRoomCount = room.LivingRoomCount,
                    BedroomCount = room.BedroomCount,
                    KitchenCount = room.KitchenCount,
                    BathroomCount = room.BathroomCount,
                })
                .ToList()
        };
    }

    public async Task<FloorDto> CreateAsync(CreateFloorDto dto, int ownerUserId)
    {
        var building = await _context.Buildings
            .FirstOrDefaultAsync(item => item.Id == dto.BuildingId
                && item.OwnerUserId == ownerUserId
                && !item.IsDeleted);
        if (building == null)
        {
            throw new InvalidOperationException("Tòa nhà không tồn tại");
        }

        var existing = await _context.Floors
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.BuildingId == dto.BuildingId
                && item.FloorNumber == dto.FloorNumber
                && !item.IsDeleted);
        if (existing != null)
        {
            throw new InvalidOperationException($"Tầng {dto.FloorNumber} đã tồn tại trong tòa nhà này");
        }

        var maxFloorNumber = await _context.Floors
            .AsNoTracking()
            .Where(item => item.BuildingId == dto.BuildingId && !item.IsDeleted)
            .Select(item => (int?)item.FloorNumber)
            .MaxAsync() ?? 0;
        var expectedFloorNumber = maxFloorNumber + 1;
        if (dto.FloorNumber != expectedFloorNumber)
        {
            throw new InvalidOperationException($"Vui lòng thêm tầng {expectedFloorNumber} trước khi thêm tầng {dto.FloorNumber}");
        }

        var floor = new Floor
        {
            BuildingId = dto.BuildingId,
            FloorNumber = dto.FloorNumber,
            Building = building
        };

        await _context.Floors.AddAsync(floor);
        await _context.SaveChangesAsync();
        return MapToDto(floor);
    }

    public async Task<FloorDto> UpdateAsync(int id, UpdateFloorDto dto, int ownerUserId)
    {
        var floor = await _context.Floors
            .Include(item => item.Building)
            .Include(item => item.Rooms)
            .FirstOrDefaultAsync(item => item.Id == id
                && item.Building.OwnerUserId == ownerUserId
                && !item.IsDeleted
                && !item.Building.IsDeleted);
        if (floor == null)
        {
            throw new InvalidOperationException("Tầng không tồn tại");
        }

        if (dto.FloorNumber.HasValue)
        {
            if (dto.FloorNumber.Value <= 0)
            {
                throw new InvalidOperationException("Số tầng phải lớn hơn 0");
            }

            if (dto.FloorNumber.Value != floor.FloorNumber)
            {
                var existing = await _context.Floors
                    .AsNoTracking()
                    .FirstOrDefaultAsync(item =>
                        item.BuildingId == floor.BuildingId &&
                        item.FloorNumber == dto.FloorNumber.Value &&
                        item.Id != floor.Id &&
                        !item.IsDeleted);
                if (existing != null)
                {
                    throw new InvalidOperationException($"Tầng {dto.FloorNumber.Value} đã tồn tại trong tòa nhà này");
                }

                floor.FloorNumber = dto.FloorNumber.Value;
            }
        }

        await _context.SaveChangesAsync();
        return MapToDto(floor);
    }

    public async Task DeleteAsync(int id, int ownerUserId)
    {
        var floor = await _context.Floors
            .Include(item => item.Building)
            .Include(item => item.Rooms)
            .FirstOrDefaultAsync(item => item.Id == id
                && item.Building.OwnerUserId == ownerUserId
                && !item.IsDeleted
                && !item.Building.IsDeleted);
        if (floor == null)
        {
            throw new InvalidOperationException("Tầng không tồn tại");
        }

        var activeRooms = floor.Rooms
            .Where(room => room.Status != "Đã xóa")
            .ToList();

        if (activeRooms.Any(room => room.Status != "Trống"))
        {
            throw new InvalidOperationException("Không thể xóa tầng này do đã có cư dân ở");
        }

        var roomIds = activeRooms.Select(room => room.Id).ToList();
        if (roomIds.Count > 0)
        {
            var linkedPosts = await _context.BaiDangTimPhongs
                .Where(post => roomIds.Contains(post.RoomId)
                    && post.Status != "deleted"
                    && !post.IsLocked)
                .ToListAsync();

            foreach (var post in linkedPosts)
            {
                post.IsLocked = true;
                post.Status = "paused";
                post.RoomStatus = "Đã xóa";
            }

            foreach (var room in activeRooms)
            {
                room.Status = "Đã xóa";
            }
        }

        floor.IsDeleted = true;
        floor.Building.NumberOfFloors = await _context.Floors
            .Where(item => item.BuildingId == floor.BuildingId
                && item.Id != floor.Id
                && !item.IsDeleted)
            .MaxAsync(item => (int?)item.FloorNumber) ?? 0;

        await _context.SaveChangesAsync();
    }

    private static FloorDto MapToDto(Floor floor)
    {
        return new FloorDto
        {
            Id = floor.Id,
            BuildingId = floor.BuildingId,
            BuildingName = floor.Building?.BuildingName ?? "",
            BuildingAddress = floor.Building?.Address ?? "",
            BuildingLatitude = floor.Building?.Latitude,
            BuildingLongitude = floor.Building?.Longitude,
            FloorNumber = floor.FloorNumber,
            TotalRooms = floor.Rooms?.Count(room => room.Status != "Đã xóa") ?? 0
        };
    }
}
