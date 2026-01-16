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
            BuildingCode = b.BuildingCode,
            BuildingName = b.BuildingName,
            Address = b.Address,
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
            BuildingCode = building.BuildingCode,
            BuildingName = building.BuildingName,
            Address = building.Address,
            CreatedAt = building.CreatedAt
        };
    }

    public async Task<BuildingDto> CreateAsync(CreateBuildingDto dto)
    {
        // Check if code exists
        if (await _buildingRepository.CodeExistsAsync(dto.BuildingCode))
        {
            throw new InvalidOperationException($"Mã tòa nhà '{dto.BuildingCode}' đã tồn tại");
        }

        var building = new Building
        {
            BuildingCode = dto.BuildingCode,
            BuildingName = dto.BuildingName,
            Address = dto.Address,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _buildingRepository.AddAsync(building);
        await _buildingRepository.SaveChangesAsync();

        return new BuildingDto
        {
            Id = building.Id,
            BuildingCode = building.BuildingCode,
            BuildingName = building.BuildingName,
            Address = building.Address,
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

        building.BuildingName = dto.BuildingName;
        building.Address = dto.Address;
        building.UpdatedAt = DateTime.UtcNow;

        _buildingRepository.Update(building);
        await _buildingRepository.SaveChangesAsync();

        return new BuildingDto
        {
            Id = building.Id,
            BuildingCode = building.BuildingCode,
            BuildingName = building.BuildingName,
            Address = building.Address,
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
