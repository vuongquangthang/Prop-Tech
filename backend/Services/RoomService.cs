using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

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

    public RoomService(
        IRoomRepository roomRepository,
        IFloorRepository floorRepository,
        IBuildingRepository buildingRepository,
        IHopDongRepository hopDongRepository,
        IChiTietORepository chiTietORepository,
        IUserRepository userRepository)
    {
        _roomRepository = roomRepository;
        _floorRepository = floorRepository;
        _buildingRepository = buildingRepository;
        _hopDongRepository = hopDongRepository;
        _chiTietORepository = chiTietORepository;
        _userRepository = userRepository;
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
        var room = await _roomRepository.GetByIdAsync(id);
        if (room == null) return null;

        var floor = await _floorRepository.GetByIdAsync(room.FloorId);
        var building = floor != null ? await _buildingRepository.GetByIdAsync(floor.BuildingId) : null;

        return new RoomDetailDto
        {
            Id = room.Id,
            FloorId = room.FloorId,
            BuildingId = floor?.BuildingId ?? 0,
            BuildingName = building?.BuildingName ?? "",
            FloorNumber = floor?.FloorNumber ?? 0,
            RoomCode = room.RoomCode,
            Area = room.Area,
            DefaultRentPrice = room.DefaultRentPrice,
            Status = room.Status,
            ActiveContracts = room.HopDongs?
                .Where(hd => hd.ExpectedEndDate == null || hd.ExpectedEndDate > DateTime.Now)
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
                    AssetName = ct.TaiSan.AssetName,
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
            (ct.ToDate == null || ct.ToDate > DateTime.Now));

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
            DefaultRentPrice = dto.DefaultRentPrice,
            Status = dto.Status
        };

        await _roomRepository.AddAsync(room);
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
        if (dto.DefaultRentPrice.HasValue) room.DefaultRentPrice = dto.DefaultRentPrice;
        if (dto.Status != null) room.Status = dto.Status;

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
            hd.ExpectedEndDate == null || hd.ExpectedEndDate > DateTime.Now) ?? false;
        
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

        return new RoomDto
        {
            Id = room.Id,
            FloorId = room.FloorId,
            BuildingId = floor?.BuildingId ?? 0,
            BuildingName = building?.BuildingName ?? "",
            FloorNumber = floor?.FloorNumber ?? 0,
            RoomCode = room.RoomCode,
            Area = room.Area,
            DefaultRentPrice = room.DefaultRentPrice,
            Status = room.Status
        };
    }
}
