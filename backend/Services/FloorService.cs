using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IFloorService
{
    Task<List<FloorDto>> GetByBuildingIdAsync(long buildingId);
    Task<FloorDto?> GetByIdAsync(long id);
    Task<FloorDto> CreateAsync(CreateFloorDto dto);
    Task<FloorDto> UpdateAsync(long id, UpdateFloorDto dto);
    Task DeleteAsync(long id);
}

public class FloorService : IFloorService
{
    private readonly IFloorRepository _floorRepository;
    private readonly IBuildingRepository _buildingRepository;

    public FloorService(IFloorRepository floorRepository, IBuildingRepository buildingRepository)
    {
        _floorRepository = floorRepository;
        _buildingRepository = buildingRepository;
    }

    public async Task<List<FloorDto>> GetByBuildingIdAsync(long buildingId)
    {
        var floors = await _floorRepository.GetByBuildingIdAsync(buildingId);
        
        return floors.Select(f => new FloorDto
        {
            Id = f.Id,
            BuildingId = f.BuildingId,
            BuildingName = f.Building?.BuildingName ?? "",
            FloorNumber = f.FloorNumber,
            FloorName = f.FloorName,
            CreatedAt = f.CreatedAt
        }).ToList();
    }

    public async Task<FloorDto?> GetByIdAsync(long id)
    {
        var floor = await _floorRepository.GetWithRoomsAsync(id);
        
        if (floor == null)
            return null;

        return new FloorDto
        {
            Id = floor.Id,
            BuildingId = floor.BuildingId,
            BuildingName = floor.Building?.BuildingName ?? "",
            FloorNumber = floor.FloorNumber,
            FloorName = floor.FloorName,
            CreatedAt = floor.CreatedAt
        };
    }

    public async Task<FloorDto> CreateAsync(CreateFloorDto dto)
    {
        // Check if building exists
        var building = await _buildingRepository.GetByIdAsync(dto.BuildingId);
        if (building == null)
        {
            throw new InvalidOperationException("Không tìm thấy tòa nhà");
        }

        // Check if floor number exists in building
        if (await _floorRepository.FloorNumberExistsAsync(dto.BuildingId, dto.FloorNumber))
        {
            throw new InvalidOperationException($"Tầng {dto.FloorNumber} đã tồn tại trong tòa nhà");
        }

        var floor = new Floor
        {
            BuildingId = dto.BuildingId,
            FloorNumber = dto.FloorNumber,
            FloorName = dto.FloorName,
            CreatedAt = DateTime.UtcNow
        };

        await _floorRepository.AddAsync(floor);
        await _floorRepository.SaveChangesAsync();

        return new FloorDto
        {
            Id = floor.Id,
            BuildingId = floor.BuildingId,
            BuildingName = building.BuildingName,
            FloorNumber = floor.FloorNumber,
            FloorName = floor.FloorName,
            CreatedAt = floor.CreatedAt
        };
    }

    public async Task<FloorDto> UpdateAsync(long id, UpdateFloorDto dto)
    {
        var floor = await _floorRepository.GetWithRoomsAsync(id);
        
        if (floor == null)
        {
            throw new InvalidOperationException("Không tìm thấy tầng");
        }

        floor.FloorNumber = dto.FloorNumber;
        floor.FloorName = dto.FloorName;

        _floorRepository.Update(floor);
        await _floorRepository.SaveChangesAsync();

        return new FloorDto
        {
            Id = floor.Id,
            BuildingId = floor.BuildingId,
            BuildingName = floor.Building?.BuildingName ?? "",
            FloorNumber = floor.FloorNumber,
            FloorName = floor.FloorName,
            CreatedAt = floor.CreatedAt
        };
    }

    public async Task DeleteAsync(long id)
    {
        var floor = await _floorRepository.GetByIdAsync(id);
        
        if (floor == null)
        {
            throw new InvalidOperationException("Không tìm thấy tầng");
        }

        _floorRepository.Remove(floor);
        await _floorRepository.SaveChangesAsync();
    }
}
