using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IBuildingService
{
    Task<List<BuildingDto>> GetAllAsync();
    Task<BuildingDetailDto?> GetByIdAsync(int id);
    Task<BuildingDto> CreateAsync(CreateBuildingDto dto);
    Task<BuildingDto> UpdateAsync(int id, UpdateBuildingDto dto);
    Task DeleteAsync(int id);
}

public class BuildingService : IBuildingService
{
    private readonly IBuildingRepository _buildingRepository;
    private readonly IFloorRepository _floorRepository;

    public BuildingService(
        IBuildingRepository buildingRepository,
        IFloorRepository floorRepository)
    {
        _buildingRepository = buildingRepository;
        _floorRepository = floorRepository;
    }

    public async Task<List<BuildingDto>> GetAllAsync()
    {
        var buildings = await _buildingRepository.GetAllAsync();
        return buildings.Select(MapToDto).ToList();
    }

    public async Task<BuildingDetailDto?> GetByIdAsync(int id)
    {
        var building = await _buildingRepository.GetByIdAsync(id);
        if (building == null) return null;

        var floors = await _floorRepository.GetByBuildingIdAsync(id);
        
        return new BuildingDetailDto
        {
            Id = building.Id,
            BuildingName = building.BuildingName,
            Address = building.Address,
            NumberOfFloors = building.NumberOfFloors,
            Description = building.Description,
            TotalRooms = floors.Sum(f => f.Rooms?.Count ?? 0),
            Floors = floors.Select(f => new FloorDto
            {
                Id = f.Id,
                BuildingId = f.BuildingId,
                BuildingName = building.BuildingName,
                FloorNumber = f.FloorNumber,
                TotalRooms = f.Rooms?.Count ?? 0
            }).ToList()
        };
    }

    public async Task<BuildingDto> CreateAsync(CreateBuildingDto dto)
    {
        // Check for duplicate building name
        var existing = await _buildingRepository.GetByNameAsync(dto.BuildingName);
        if (existing != null)
        {
            throw new InvalidOperationException($"Tòa nhà '{dto.BuildingName}' đã tồn tại");
        }

        var building = new Building
        {
            BuildingName = dto.BuildingName,
            Address = dto.Address,
            NumberOfFloors = dto.NumberOfFloors,
            Description = dto.Description
        };

        await _buildingRepository.AddAsync(building);
        await _buildingRepository.SaveChangesAsync();
        return MapToDto(building);
    }

    public async Task<BuildingDto> UpdateAsync(int id, UpdateBuildingDto dto)
    {
        var building = await _buildingRepository.GetByIdAsync(id);
        if (building == null)
        {
            throw new InvalidOperationException("Tòa nhà không tồn tại");
        }

        // Check for duplicate building name (if changed)
        if (dto.BuildingName != null && dto.BuildingName != building.BuildingName)
        {
            var existing = await _buildingRepository.GetByNameAsync(dto.BuildingName);
            if (existing != null)
            {
                throw new InvalidOperationException($"Tòa nhà '{dto.BuildingName}' đã tồn tại");
            }
            building.BuildingName = dto.BuildingName;
        }

        if (dto.Address != null) building.Address = dto.Address;
        if (dto.NumberOfFloors.HasValue) building.NumberOfFloors = dto.NumberOfFloors.Value;
        if (dto.Description != null) building.Description = dto.Description;

        _buildingRepository.Update(building);
        await _buildingRepository.SaveChangesAsync();
        return MapToDto(building);
    }

    public async Task DeleteAsync(int id)
    {
        var building = await _buildingRepository.GetByIdAsync(id);
        if (building == null)
        {
            throw new InvalidOperationException("Tòa nhà không tồn tại");
        }

        // Check if building has floors
        var floors = await _floorRepository.GetByBuildingIdAsync(id);
        if (floors.Any())
        {
            throw new InvalidOperationException("Không thể xóa tòa nhà đã có tầng");
        }

        _buildingRepository.Remove(building);
        await _buildingRepository.SaveChangesAsync();
    }

    private BuildingDto MapToDto(Building building)
    {
        return new BuildingDto
        {
            Id = building.Id,
            BuildingName = building.BuildingName,
            Address = building.Address,
            NumberOfFloors = building.NumberOfFloors,
            Description = building.Description,
            TotalRooms = building.Floors?.Sum(f => f.Rooms?.Count ?? 0) ?? 0
        };
    }
}
