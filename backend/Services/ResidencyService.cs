using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IResidencyService
{
    Task<List<ResidencyDto>> GetByRoomAsync(long roomId);
    Task<ResidencyDto?> GetByIdAsync(long id);
    Task<ResidencyDto> CheckInAsync(CheckInResidencyDto dto);
    Task<ResidencyDto> CheckOutAsync(long residencyId, CheckOutResidencyDto dto);
    Task<ResidencyDto> UpdateAsync(long id, UpdateResidencyDto dto);
    Task<int> GetHeadcountForRoomAsync(long roomId, DateTime cutoffDate);
    Task<List<ResidencyDto>> GetActiveByRoomAsync(long roomId, DateTime cutoffDate);
}

public class ResidencyService : IResidencyService
{
    private readonly IResidencyRepository _residencyRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly IResidentRepository _residentRepository;
    private readonly IDepositRepository _depositRepository;
    private readonly ILogger<ResidencyService> _logger;

    public ResidencyService(
        IResidencyRepository residencyRepository,
        IRoomRepository roomRepository,
        IResidentRepository residentRepository,
        IDepositRepository depositRepository,
        ILogger<ResidencyService> logger)
    {
        _residencyRepository = residencyRepository;
        _roomRepository = roomRepository;
        _residentRepository = residentRepository;
        _depositRepository = depositRepository;
        _logger = logger;
    }

    public async Task<List<ResidencyDto>> GetByRoomAsync(long roomId)
    {
        var residencies = await _residencyRepository.GetByRoomAsync(roomId);
        return residencies.Select(MapToDto).ToList();
    }

    public async Task<ResidencyDto?> GetByIdAsync(long id)
    {
        var residency = await _residencyRepository.GetByIdWithDetailsAsync(id);
        return residency == null ? null : MapToDto(residency);
    }

    public async Task<ResidencyDto> CheckInAsync(CheckInResidencyDto dto)
    {
        // Validate room exists
        var room = await _roomRepository.GetByIdAsync(dto.RoomId);
        if (room == null)
        {
            throw new InvalidOperationException("Không tìm thấy phòng");
        }

        // Validate resident exists
        var resident = await _residentRepository.GetByIdAsync(dto.ResidentId);
        if (resident == null)
        {
            throw new InvalidOperationException("Không tìm thấy cư dân");
        }

        // Create residency
        var residency = new Residency
        {
            RoomId = dto.RoomId,
            ResidentId = dto.ResidentId,
            OwnershipType = dto.OwnershipType,
            IsPrimaryResident = dto.IsPrimaryResident,
            CheckInDate = dto.CheckInDate,
            ContractNumber = dto.ContractNumber,
            ContractStartDate = dto.ContractStartDate,
            ContractEndDate = dto.ContractEndDate,
            Status = "ACTIVE",
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _residencyRepository.AddAsync(residency);
        await _residencyRepository.SaveChangesAsync();

        // Auto-create deposit = 1 month room rent (DEP-01)
        var deposit = new Deposit
        {
            ResidencyId = residency.Id,
            RoomId = dto.RoomId,
            ResidentId = dto.ResidentId,
            Amount = room.MonthlyRent,
            Status = "UNPAID",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _depositRepository.AddAsync(deposit);
        await _residencyRepository.SaveChangesAsync();

        // Update room status to OCCUPIED
        room.Status = "OCCUPIED";
        room.UpdatedAt = DateTime.UtcNow;
        _roomRepository.Update(room);
        await _roomRepository.SaveChangesAsync();

        // Reload to get navigation properties
        residency = await _residencyRepository.GetByIdWithDetailsAsync(residency.Id);

        return MapToDto(residency!);
    }

    public async Task<ResidencyDto> CheckOutAsync(long residencyId, CheckOutResidencyDto dto)
    {
        var residency = await _residencyRepository.GetByIdWithDetailsAsync(residencyId);
        
        if (residency == null)
        {
            throw new InvalidOperationException("Không tìm thấy cư trú");
        }

        if (residency.Status != "ACTIVE")
        {
            throw new InvalidOperationException("Cư trú không ở trạng thái ACTIVE");
        }

        // Validate checkout date >= checkin date
        if (dto.CheckOutDate < residency.CheckInDate)
        {
            throw new InvalidOperationException("Ngày kết thúc phải >= ngày bắt đầu");
        }

        residency.CheckOutDate = dto.CheckOutDate;
        residency.Status = "ENDED";
        residency.UpdatedAt = DateTime.UtcNow;

        _residencyRepository.Update(residency);
        await _residencyRepository.SaveChangesAsync();

        // Check if room still has active residents; if not, mark VACANT
        var hasActive = await _residencyRepository.HasActiveResidencyAsync(residency.RoomId);
        if (!hasActive)
        {
            var room = residency.Room;
            room.Status = "VACANT";
            room.UpdatedAt = DateTime.UtcNow;
            _roomRepository.Update(room);
            await _roomRepository.SaveChangesAsync();
        }

        return MapToDto(residency);
    }

    public async Task<ResidencyDto> UpdateAsync(long id, UpdateResidencyDto dto)
    {
        var residency = await _residencyRepository.GetByIdWithDetailsAsync(id);
        
        if (residency == null)
        {
            throw new InvalidOperationException("Không tìm thấy cư trú");
        }

        residency.OwnershipType = dto.OwnershipType;
        residency.IsPrimaryResident = dto.IsPrimaryResident;
        residency.ContractNumber = dto.ContractNumber;
        residency.ContractStartDate = dto.ContractStartDate;
        residency.ContractEndDate = dto.ContractEndDate;
        residency.Notes = dto.Notes;
        residency.UpdatedAt = DateTime.UtcNow;

        _residencyRepository.Update(residency);
        await _residencyRepository.SaveChangesAsync();

        return MapToDto(residency);
    }

    public async Task<int> GetHeadcountForRoomAsync(long roomId, DateTime cutoffDate)
    {
        return await _residencyRepository.GetHeadcountForRoomAsync(roomId, cutoffDate);
    }

    public async Task<List<ResidencyDto>> GetActiveByRoomAsync(long roomId, DateTime cutoffDate)
    {
        var residencies = await _residencyRepository.GetActiveByRoomAsync(roomId, cutoffDate);
        return residencies.Select(MapToDto).ToList();
    }

    private ResidencyDto MapToDto(Residency residency)
    {
        return new ResidencyDto
        {
            Id = residency.Id,
            RoomId = residency.RoomId,
            ResidentId = residency.ResidentId,
            OwnershipType = residency.OwnershipType,
            IsPrimaryResident = residency.IsPrimaryResident,
            CheckInDate = residency.CheckInDate,
            CheckOutDate = residency.CheckOutDate,
            Status = residency.Status,
            ContractNumber = residency.ContractNumber,
            ContractStartDate = residency.ContractStartDate,
            ContractEndDate = residency.ContractEndDate,
            Notes = residency.Notes,
            CreatedAt = residency.CreatedAt
        };
    }
}
