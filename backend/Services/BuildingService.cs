using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IBuildingService
{
    Task<List<BuildingDto>> GetAllAsync();
    Task<BuildingDto?> GetByIdAsync(long id);
    Task<BuildingDto> CreateAsync(CreateBuildingDto dto);
    Task<BuildingDto> UpdateAsync(long id, UpdateBuildingDto dto);
    Task DeleteAsync(long id);
}

public class BuildingService : IBuildingService
{
    private readonly IBuildingRepository _buildingRepository;

    public BuildingService(IBuildingRepository buildingRepository)
    {
        _buildingRepository = buildingRepository;
    }

    public async Task<List<BuildingDto>> GetAllAsync()
    {
        var buildings = await _buildingRepository.GetAllWithDetailsAsync();
        
        return buildings.Select(b => new BuildingDto
        {
            Id = b.Id,
            Code = b.Code,
            Name = b.Name,
            Address = b.Address,
            TotalFloors = b.TotalFloors,
            Status = b.Status,
            CreatedAt = b.CreatedAt
        }).ToList();
    }

    public async Task<BuildingDto?> GetByIdAsync(long id)
    {
        var building = await _buildingRepository.GetByIdAsync(id);
        
        if (building == null)
            return null;

        return new BuildingDto
        {
            Id = building.Id,
            Code = building.Code,
            Name = building.Name,
            Address = building.Address,
            TotalFloors = building.TotalFloors,
            Status = building.Status,
            CreatedAt = building.CreatedAt
        };
    }

    public async Task<BuildingDto> CreateAsync(CreateBuildingDto dto)
    {
        // Check if code exists
        if (await _buildingRepository.CodeExistsAsync(dto.Code))
        {
            throw new InvalidOperationException($"Mã tòa nhà '{dto.Code}' đã tồn tại");
        }

        var building = new Building
        {
            Code = dto.Code,
            Name = dto.Name,
            Address = dto.Address,
            TotalFloors = dto.TotalFloors,
            Status = "ACTIVE",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _buildingRepository.AddAsync(building);
        await _buildingRepository.SaveChangesAsync();

        return new BuildingDto
        {
            Id = building.Id,
            Code = building.Code,
            Name = building.Name,
            Address = building.Address,
            TotalFloors = building.TotalFloors,
            Status = building.Status,
            CreatedAt = building.CreatedAt
        };
    }

    public async Task<BuildingDto> UpdateAsync(long id, UpdateBuildingDto dto)
    {
        var building = await _buildingRepository.GetByIdAsync(id);
        
        if (building == null)
        {
            throw new InvalidOperationException("Không tìm thấy tòa nhà");
        }

        building.Name = dto.Name;
        building.Address = dto.Address;
        building.TotalFloors = dto.TotalFloors;
        building.Status = dto.Status;
        building.UpdatedAt = DateTime.UtcNow;

        _buildingRepository.Update(building);
        await _buildingRepository.SaveChangesAsync();

        return new BuildingDto
        {
            Id = building.Id,
            Code = building.Code,
            Name = building.Name,
            Address = building.Address,
            TotalFloors = building.TotalFloors,
            Status = building.Status,
            CreatedAt = building.CreatedAt
        };
    }

    public async Task DeleteAsync(long id)
    {
        var building = await _buildingRepository.GetByIdAsync(id);
        
        if (building == null)
        {
            throw new InvalidOperationException("Không tìm thấy tòa nhà");
        }

        _buildingRepository.Remove(building);
        await _buildingRepository.SaveChangesAsync();
    }
}
