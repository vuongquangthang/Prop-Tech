using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IRoomService
{
    Task<List<RoomDto>> GetByFloorIdAsync(long floorId);
    Task<List<RoomDto>> GetByBuildingIdAsync(long buildingId);
    Task<List<RoomDto>> GetAvailableRoomsAsync(long? buildingId = null);
    Task<RoomDto?> GetByIdAsync(long id);
    Task<RoomDto> CreateAsync(CreateRoomDto dto);
    Task<RoomDto> UpdateAsync(long id, UpdateRoomDto dto);
    Task DeleteAsync(long id);
}

public class RoomService : IRoomService
{
    private readonly IRoomRepository _roomRepository;
    private readonly IFloorRepository _floorRepository;

    public RoomService(IRoomRepository roomRepository, IFloorRepository floorRepository)
    {
        _roomRepository = roomRepository;
        _floorRepository = floorRepository;
    }

    public async Task<List<RoomDto>> GetByFloorIdAsync(long floorId)
    {
        var rooms = await _roomRepository.GetByFloorIdAsync(floorId);
        
        return rooms.Select(r => MapToDto(r)).ToList();
    }

    public async Task<List<RoomDto>> GetByBuildingIdAsync(long buildingId)
    {
        var rooms = await _roomRepository.GetByBuildingIdAsync(buildingId);
        
        return rooms.Select(r => MapToDto(r)).ToList();
    }

    public async Task<List<RoomDto>> GetAvailableRoomsAsync(long? buildingId = null)
    {
        var rooms = await _roomRepository.GetAvailableRoomsAsync(buildingId);
        
        return rooms.Select(r => MapToDto(r)).ToList();
    }

    public async Task<RoomDto?> GetByIdAsync(long id)
    {
        var room = await _roomRepository.GetWithDetailsAsync(id);
        
        if (room == null)
            return null;

        return MapToDto(room);
    }

    public async Task<RoomDto> CreateAsync(CreateRoomDto dto)
    {
        // Check if floor exists
        var floor = await _floorRepository.GetWithRoomsAsync(dto.FloorId);
        if (floor == null)
        {
            throw new InvalidOperationException("Không tìm thấy tầng");
        }

        // Check if room number exists in floor
        if (await _roomRepository.RoomNumberExistsAsync(dto.FloorId, dto.RoomNumber))
        {
            throw new InvalidOperationException($"Phòng {dto.RoomNumber} đã tồn tại trong tầng");
        }

        var room = new Room
        {
            FloorId = dto.FloorId,
            RoomCode = dto.RoomCode,
            RoomNumber = dto.RoomNumber,
            RoomType = dto.RoomType,
            AreaSqm = dto.AreaSqm,
            MonthlyRent = dto.MonthlyRent,
            SalePrice = dto.SalePrice,
            Status = "VACANT",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _roomRepository.AddAsync(room);
        await _roomRepository.SaveChangesAsync();

        // Reload to get navigation properties
        room = await _roomRepository.GetWithDetailsAsync(room.Id);

        return MapToDto(room!);
    }

    public async Task<RoomDto> UpdateAsync(long id, UpdateRoomDto dto)
    {
        var room = await _roomRepository.GetWithDetailsAsync(id);
        
        if (room == null)
        {
            throw new InvalidOperationException("Không tìm thấy phòng");
        }

        room.RoomNumber = dto.RoomNumber;
        room.RoomType = dto.RoomType;
        room.AreaSqm = dto.AreaSqm;
        room.MonthlyRent = dto.MonthlyRent;
        room.SalePrice = dto.SalePrice;
        room.Status = dto.Status;
        room.UpdatedAt = DateTime.UtcNow;

        _roomRepository.Update(room);
        await _roomRepository.SaveChangesAsync();

        return MapToDto(room);
    }

    public async Task DeleteAsync(long id)
    {
        var room = await _roomRepository.GetByIdAsync(id);
        
        if (room == null)
        {
            throw new InvalidOperationException("Không tìm thấy phòng");
        }

        _roomRepository.Remove(room);
        await _roomRepository.SaveChangesAsync();
    }

    private RoomDto MapToDto(Room room)
    {
        return new RoomDto
        {
            Id = room.Id,
            FloorId = room.FloorId,
            BuildingId = room.Floor?.BuildingId ?? 0,
            BuildingName = room.Floor?.Building?.BuildingName ?? "",
            FloorNumber = room.Floor?.FloorNumber ?? 0,
            RoomCode = room.RoomCode,
            RoomNumber = room.RoomNumber,
            RoomType = room.RoomType,
            AreaSqm = room.AreaSqm,
            MonthlyRent = room.MonthlyRent,
            SalePrice = room.SalePrice,
            Status = room.Status,
            CreatedAt = room.CreatedAt
        };
    }
}
