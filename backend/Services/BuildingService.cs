using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IBuildingService
{
    Task<List<BuildingDto>> GetAllAsync(int ownerUserId);
    Task<BuildingDetailDto?> GetByIdAsync(int id, int ownerUserId);
    Task<BuildingDto> CreateAsync(CreateBuildingDto dto, int ownerUserId);
    Task<BuildingDto> UpdateAsync(int id, UpdateBuildingDto dto, int ownerUserId);
    Task DeleteAsync(int id, int ownerUserId);
}

public class BuildingService : IBuildingService
{
    private readonly ApplicationDbContext _context;

    public BuildingService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<BuildingDto>> GetAllAsync(int ownerUserId)
    {
        var buildings = await _context.Buildings
            .AsNoTracking()
            .Include(building => building.Floors)
                .ThenInclude(floor => floor.Rooms)
            .Where(building => building.OwnerUserId == ownerUserId && !building.IsDeleted)
            .OrderBy(building => building.BuildingName)
            .ToListAsync();

        return buildings.Select(MapToDto).ToList();
    }

    public async Task<BuildingDetailDto?> GetByIdAsync(int id, int ownerUserId)
    {
        var building = await _context.Buildings
            .AsNoTracking()
            .Include(item => item.Floors)
                .ThenInclude(item => item.Rooms)
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == ownerUserId && !item.IsDeleted);
        if (building == null) return null;

        var floors = building.Floors
            .Where(floor => !floor.IsDeleted)
            .OrderBy(floor => floor.FloorNumber)
            .ToList();

        return new BuildingDetailDto
        {
            Id = building.Id,
            BuildingName = building.BuildingName,
            Address = building.Address,
            NumberOfFloors = building.NumberOfFloors,
            Description = building.Description,
            OwnerUserId = building.OwnerUserId,
            Latitude = building.Latitude,
            Longitude = building.Longitude,
            TotalRooms = floors.Sum(floor => floor.Rooms?.Count(room => room.Status != "Đã xóa") ?? 0),
            Floors = floors.Select(floor => new FloorDto
            {
                Id = floor.Id,
                BuildingId = floor.BuildingId,
                BuildingName = building.BuildingName,
                FloorNumber = floor.FloorNumber,
                TotalRooms = floor.Rooms?.Count(room => room.Status != "Đã xóa") ?? 0
            }).ToList()
        };
    }

    public async Task<BuildingDto> CreateAsync(CreateBuildingDto dto, int ownerUserId)
    {
        var buildingName = dto.BuildingName.Trim();
        if (dto.NumberOfFloors <= 0)
        {
            throw new InvalidOperationException("Số tầng phải lớn hơn 0");
        }

        if (string.IsNullOrWhiteSpace(dto.Address))
        {
            throw new InvalidOperationException("Vui lòng nhập địa chỉ tòa nhà");
        }

        var address = dto.Address.Trim();
        var existing = await _context.Buildings
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.OwnerUserId == ownerUserId && item.BuildingName == buildingName && !item.IsDeleted);
        if (existing != null)
        {
            throw new InvalidOperationException($"Tòa nhà '{buildingName}' đã tồn tại");
        }

        ValidateCoordinates(dto.Latitude, dto.Longitude);

        var building = new Building
        {
            BuildingName = buildingName,
            Address = address,
            NumberOfFloors = dto.NumberOfFloors,
            Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
            OwnerUserId = ownerUserId,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Floors = Enumerable.Range(1, dto.NumberOfFloors)
                .Select(floorNumber => new Floor
                {
                    FloorNumber = floorNumber
                })
                .ToList()
        };

        await _context.Buildings.AddAsync(building);
        await _context.SaveChangesAsync();
        return MapToDto(building);
    }

    public async Task<BuildingDto> UpdateAsync(int id, UpdateBuildingDto dto, int ownerUserId)
    {
        var building = await _context.Buildings
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == ownerUserId && !item.IsDeleted);
        if (building == null)
        {
            throw new InvalidOperationException("Tòa nhà không tồn tại");
        }

        var nextBuildingName = string.IsNullOrWhiteSpace(dto.BuildingName) ? null : dto.BuildingName.Trim();
        if (nextBuildingName != null && nextBuildingName != building.BuildingName)
        {
            var existing = await _context.Buildings
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.OwnerUserId == ownerUserId && item.BuildingName == nextBuildingName && !item.IsDeleted);
            if (existing != null)
            {
                throw new InvalidOperationException($"Tòa nhà '{nextBuildingName}' đã tồn tại");
            }

            building.BuildingName = nextBuildingName;
        }

        if (!string.IsNullOrWhiteSpace(dto.Address)) building.Address = dto.Address.Trim();
        if (dto.NumberOfFloors.HasValue) building.NumberOfFloors = dto.NumberOfFloors.Value;
        if (dto.Description != null) building.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        if (dto.Latitude.HasValue || dto.Longitude.HasValue)
        {
            ValidateCoordinates(dto.Latitude, dto.Longitude);
            building.Latitude = dto.Latitude;
            building.Longitude = dto.Longitude;
        }

        await _context.SaveChangesAsync();
        return MapToDto(building);
    }

    public async Task DeleteAsync(int id, int ownerUserId)
    {
        var building = await _context.Buildings
            .Include(item => item.Floors)
                .ThenInclude(item => item.Rooms)
            .FirstOrDefaultAsync(item => item.Id == id && item.OwnerUserId == ownerUserId && !item.IsDeleted);
        if (building == null)
        {
            throw new InvalidOperationException("Tòa nhà không tồn tại");
        }

        if (building.Floors.Any(floor => !floor.IsDeleted && floor.Rooms.Any(room => room.Status != "Đã xóa")))
        {
            throw new InvalidOperationException("Không thể xóa tòa nhà đã có phòng");
        }

        foreach (var floor in building.Floors)
        {
            floor.IsDeleted = true;
        }
        building.IsDeleted = true;
        await _context.SaveChangesAsync();
    }

    private static BuildingDto MapToDto(Building building)
    {
        return new BuildingDto
        {
            Id = building.Id,
            BuildingName = building.BuildingName,
            Address = building.Address,
            NumberOfFloors = building.NumberOfFloors,
            Description = building.Description,
            OwnerUserId = building.OwnerUserId,
            Latitude = building.Latitude,
            Longitude = building.Longitude,
            TotalRooms = building.Floors?
                .Where(floor => !floor.IsDeleted)
                .Sum(floor => floor.Rooms?.Count(room => room.Status != "Đã xóa") ?? 0) ?? 0
        };
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
}
