using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IFloorService
{
    Task<List<FloorDto>> GetAllAsync();
    Task<List<FloorDto>> GetByBuildingIdAsync(int buildingId);
    Task<FloorDetailDto?> GetByIdAsync(int id);
    Task<FloorDto> CreateAsync(CreateFloorDto dto);
    Task DeleteAsync(int id);
}

public class FloorService : IFloorService
{
    private readonly IFloorRepository _floorRepository;
    private readonly IBuildingRepository _buildingRepository;
    private readonly IRoomRepository _roomRepository;

    public FloorService(
        IFloorRepository floorRepository,
        IBuildingRepository buildingRepository,
        IRoomRepository roomRepository)
    {
        _floorRepository = floorRepository;
        _buildingRepository = buildingRepository;
        _roomRepository = roomRepository;
    }

    public async Task<List<FloorDto>> GetAllAsync()
    {
        var floors = await _floorRepository.GetAllAsync();
        var floorDtos = new List<FloorDto>();
        foreach (var floor in floors)
        {
            floorDtos.Add(await MapToDto(floor));
        }
        return floorDtos;
    }

    public async Task<List<FloorDto>> GetByBuildingIdAsync(int buildingId)
    {
        var floors = await _floorRepository.GetByBuildingIdAsync(buildingId);
        var floorDtos = new List<FloorDto>();
        foreach (var floor in floors)
        {
            floorDtos.Add(await MapToDto(floor));
        }
        return floorDtos;
    }

    public async Task<FloorDetailDto?> GetByIdAsync(int id)
    {
        var floor = await _floorRepository.GetByIdAsync(id);
        if (floor == null) return null;

        var building = await _buildingRepository.GetByIdAsync(floor.BuildingId);
        var rooms = await _roomRepository.GetByFloorIdAsync(id);

        return new FloorDetailDto
        {
            Id = floor.Id,
            BuildingId = floor.BuildingId,
            BuildingName = building?.BuildingName ?? "",
            FloorNumber = floor.FloorNumber,
            TotalRooms = rooms.Count(),
            Rooms = rooms.Select(r => new RoomDto
            {
                Id = r.Id,
                FloorId = r.FloorId,
                BuildingId = floor.BuildingId,
                BuildingName = building?.BuildingName ?? "",
                FloorNumber = floor.FloorNumber,
                RoomCode = r.RoomCode,
                Area = r.Area,
                DefaultRentPrice = r.DefaultRentPrice,
                Status = r.Status
            }).ToList()
        };
    }

    public async Task<FloorDto> CreateAsync(CreateFloorDto dto)
    {
        // Validate building exists
        var building = await _buildingRepository.GetByIdAsync(dto.BuildingId);
        if (building == null)
        {
            throw new InvalidOperationException("Tòa nhà không tồn tại");
        }

        // Check for duplicate floor number in building
        var existing = await _floorRepository.GetByBuildingAndFloorNumberAsync(dto.BuildingId, dto.FloorNumber);
        if (existing != null)
        {
            throw new InvalidOperationException($"Tầng {dto.FloorNumber} đã tồn tại trong tòa nhà này");
        }

        var floor = new Floor
        {
            BuildingId = dto.BuildingId,
            FloorNumber = dto.FloorNumber
        };

        await _floorRepository.AddAsync(floor);
        await _floorRepository.SaveChangesAsync();
        return await MapToDto(floor);
    }

    public async Task DeleteAsync(int id)
    {
        var floor = await _floorRepository.GetByIdAsync(id);
        if (floor == null)
        {
            throw new InvalidOperationException("Tầng không tồn tại");
        }

        // Check if floor has rooms
        var rooms = await _roomRepository.GetByFloorIdAsync(id);
        if (rooms.Any())
        {
            throw new InvalidOperationException("Không thể xóa tầng đã có phòng");
        }

        _floorRepository.Remove(floor);
        await _floorRepository.SaveChangesAsync();
    }

    private async Task<FloorDto> MapToDto(Floor floor)
    {
        var building = await _buildingRepository.GetByIdAsync(floor.BuildingId);
        var rooms = await _roomRepository.GetByFloorIdAsync(floor.Id);

        return new FloorDto
        {
            Id = floor.Id,
            BuildingId = floor.BuildingId,
            BuildingName = building?.BuildingName ?? "",
            FloorNumber = floor.FloorNumber,
            TotalRooms = rooms.Count()
        };
    }
}
