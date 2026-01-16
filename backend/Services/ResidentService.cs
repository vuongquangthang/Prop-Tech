using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IResidentService
{
    Task<List<ResidentDto>> GetAllAsync();
    Task<ResidentDto?> GetByIdAsync(long id);
    Task<ResidentDto> CreateAsync(CreateResidentDto dto);
    Task<ResidentDto> UpdateAsync(long id, UpdateResidentDto dto);
    Task DeleteAsync(long id);
    Task<List<ResidentDto>> GetByRoomAsync(long roomId);
}

public class ResidentService : IResidentService
{
    private readonly IResidentRepository _residentRepository;
    private readonly ILogger<ResidentService> _logger;

    public ResidentService(IResidentRepository residentRepository, ILogger<ResidentService> logger)
    {
        _residentRepository = residentRepository;
        _logger = logger;
    }

    public async Task<List<ResidentDto>> GetAllAsync()
    {
        var residents = await _residentRepository.GetAllAsync();
        return residents.Select(MapToDto).ToList();
    }

    public async Task<ResidentDto?> GetByIdAsync(long id)
    {
        var resident = await _residentRepository.GetByIdAsync(id);
        return resident == null ? null : MapToDto(resident);
    }

    public async Task<ResidentDto> CreateAsync(CreateResidentDto dto)
    {
        // Validate unique constraints
        if (!string.IsNullOrEmpty(dto.IdCardNumber) && await _residentRepository.IdCardExistsAsync(dto.IdCardNumber))
        {
            throw new InvalidOperationException("CCCD đã tồn tại");
        }

        if (!string.IsNullOrEmpty(dto.PhoneNumber) && await _residentRepository.PhoneExistsAsync(dto.PhoneNumber))
        {
            throw new InvalidOperationException("Số điện thoại đã tồn tại");
        }

        var resident = new Resident
        {
            FullName = dto.FullName,
            IdCardNumber = dto.IdCardNumber,
            PhoneNumber = dto.PhoneNumber,
            Email = dto.Email,
            DateOfBirth = dto.DateOfBirth,
            Gender = dto.Gender,
            PermanentAddress = dto.PermanentAddress,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _residentRepository.AddAsync(resident);
        await _residentRepository.SaveChangesAsync();

        return MapToDto(resident);
    }

    public async Task<ResidentDto> UpdateAsync(long id, UpdateResidentDto dto)
    {
        var resident = await _residentRepository.GetByIdAsync(id);
        
        if (resident == null)
        {
            throw new InvalidOperationException("Không tìm thấy cư dân");
        }

        // Validate CCCD uniqueness if changed
        if (!string.IsNullOrEmpty(dto.IdCardNumber) && 
            dto.IdCardNumber != resident.IdCardNumber && 
            await _residentRepository.IdCardExistsAsync(dto.IdCardNumber))
        {
            throw new InvalidOperationException("CCCD đã tồn tại");
        }

        // Validate phone uniqueness if changed
        if (!string.IsNullOrEmpty(dto.PhoneNumber) && 
            dto.PhoneNumber != resident.PhoneNumber && 
            await _residentRepository.PhoneExistsAsync(dto.PhoneNumber))
        {
            throw new InvalidOperationException("Số điện thoại đã tồn tại");
        }

        resident.FullName = dto.FullName;
        resident.IdCardNumber = dto.IdCardNumber;
        resident.PhoneNumber = dto.PhoneNumber;
        resident.Email = dto.Email;
        resident.DateOfBirth = dto.DateOfBirth;
        resident.Gender = dto.Gender;
        resident.PermanentAddress = dto.PermanentAddress;
        resident.UpdatedAt = DateTime.UtcNow;

        _residentRepository.Update(resident);
        await _residentRepository.SaveChangesAsync();

        return MapToDto(resident);
    }

    public async Task DeleteAsync(long id)
    {
        var resident = await _residentRepository.GetByIdAsync(id);
        
        if (resident == null)
        {
            throw new InvalidOperationException("Không tìm thấy cư dân");
        }

        _residentRepository.Remove(resident);
        await _residentRepository.SaveChangesAsync();
    }

    public async Task<List<ResidentDto>> GetByRoomAsync(long roomId)
    {
        var residents = await _residentRepository.GetByRoomAsync(roomId);
        return residents.Select(MapToDto).ToList();
    }

    private ResidentDto MapToDto(Resident resident)
    {
        return new ResidentDto
        {
            Id = resident.Id,
            UserId = resident.UserId,
            FullName = resident.FullName,
            IdCardNumber = resident.IdCardNumber,
            PhoneNumber = resident.PhoneNumber,
            Email = resident.Email,
            DateOfBirth = resident.DateOfBirth,
            Gender = resident.Gender,
            PermanentAddress = resident.PermanentAddress,
            CreatedAt = resident.CreatedAt
        };
    }
}
