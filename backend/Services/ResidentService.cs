using backend.DTOs;
using backend.Data;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IResidentService
{
    Task<List<ResidentDto>> GetAllAsync(int ownerUserId);
    Task<List<ResidentDto>> SearchByNameAsync(string name, int ownerUserId);
    Task<ResidentDetailDto?> GetByIdAsync(int id, int ownerUserId);
    Task<ResidentDto> CreateAsync(CreateResidentDto dto, int ownerUserId);
    Task<ResidentDto> UpdateAsync(int id, UpdateResidentDto dto, int ownerUserId);
    Task DeleteAsync(int id, int ownerUserId);
}

public class ResidentService : IResidentService
{
    private readonly IResidentRepository _residentRepository;
    private readonly IUserRepository _userRepository;
    private readonly ApplicationDbContext _context;

    public ResidentService(IResidentRepository residentRepository, IUserRepository userRepository, ApplicationDbContext context)
    {
        _residentRepository = residentRepository;
        _userRepository = userRepository;
        _context = context;
    }

    private IQueryable<Resident> ResidentsForOwner(int ownerUserId)
    {
        return _context.Residents
            .Include(resident => resident.Users)
            .Include(resident => resident.ChiTietOs)
                .ThenInclude(residency => residency.HopDong)
                    .ThenInclude(contract => contract.Room)
                        .ThenInclude(room => room.Floor)
                            .ThenInclude(floor => floor.Building)
            .Where(resident => resident.OwnerUserId == ownerUserId
                || resident.ChiTietOs.Any(residency => residency.HopDong.Room.Floor.Building.OwnerUserId == ownerUserId));
    }

    public async Task<List<ResidentDto>> GetAllAsync(int ownerUserId)
    {
        var residents = await ResidentsForOwner(ownerUserId)
            .AsNoTracking()
            .OrderBy(resident => resident.FullName)
            .ToListAsync();
        return residents.Select(MapToDto).ToList();
    }

    public async Task<List<ResidentDto>> SearchByNameAsync(string name, int ownerUserId)
    {
        var residents = await ResidentsForOwner(ownerUserId)
            .AsNoTracking()
            .Where(resident => resident.FullName.Contains(name))
            .OrderBy(resident => resident.FullName)
            .ToListAsync();
        return residents.Select(MapToDto).ToList();
    }

    public async Task<ResidentDetailDto?> GetByIdAsync(int id, int ownerUserId)
    {
        var resident = await ResidentsForOwner(ownerUserId)
            .AsNoTracking()
            .Include(item => item.Xes)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (resident == null) return null;

        return new ResidentDetailDto
        {
            Id = resident.Id,
            FullName = resident.FullName,
            PhoneNumber = resident.PhoneNumber,
            IdCardNumber = resident.IdCardNumber,
            Hometown = resident.Hometown,
            IdCardFrontUrl = resident.IdCardFrontUrl,
            IdCardBackUrl = resident.IdCardBackUrl,
            OwnerUserId = resident.OwnerUserId,
            Contracts = resident.ChiTietOs?
                .Select(ct => new ContractSummaryDto
                {
                    Id = ct.ContractId,
                    StartDate = ct.HopDong.StartDate,
                    ExpectedEndDate = ct.HopDong.ExpectedEndDate,
                    ActualRentPrice = ct.HopDong.ActualRentPrice,
                    ResidentNames = ct.HopDong.ChiTietOs.Select(c => c.Resident.FullName).ToList()
                }).ToList(),
            Vehicles = resident.Xes?
                .Where(x => x.CancellationDate == null)
                .Select(x => new VehicleSummaryDto
                {
                    Id = x.Id,
                    LicensePlate = x.LicensePlate,
                    VehicleType = x.VehicleType,
                    RegistrationDate = x.RegistrationDate,
                    IsActive = x.CancellationDate == null
                }).ToList()
        };
    }

    public async Task<ResidentDto> CreateAsync(CreateResidentDto dto, int ownerUserId)
    {
        // Check for duplicate phone number or ID card
        if (!string.IsNullOrEmpty(dto.PhoneNumber))
        {
            var existingByPhone = await _residentRepository.GetByPhoneNumberAsync(dto.PhoneNumber);
            if (existingByPhone != null)
            {
                throw new InvalidOperationException($"Số điện thoại '{dto.PhoneNumber}' đã được đăng ký");
            }
        }

        if (!string.IsNullOrEmpty(dto.IdCardNumber))
        {
            var existingById = await _residentRepository.GetByIdCardNumberAsync(dto.IdCardNumber);
            if (existingById != null)
            {
                throw new InvalidOperationException($"CCCD/CMND '{dto.IdCardNumber}' đã được đăng ký");
            }
        }

        var resident = new Resident
        {
            FullName = dto.FullName,
            PhoneNumber = dto.PhoneNumber,
            IdCardNumber = dto.IdCardNumber,
            Hometown = dto.Hometown,
            IdCardFrontUrl = dto.IdCardFrontUrl,
            IdCardBackUrl = dto.IdCardBackUrl,
            OwnerUserId = ownerUserId
        };

        await _residentRepository.AddAsync(resident);
        await _residentRepository.SaveChangesAsync();

        // Handle Email (Store in User table)
        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            await EnsureResidentAccountWithEmailAsync(resident.Id, dto.Email);
        }

        return MapToDto(resident);
    }

    public async Task<ResidentDto> UpdateAsync(int id, UpdateResidentDto dto, int ownerUserId)
    {
        var resident = await ResidentsForOwner(ownerUserId)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (resident == null)
        {
            throw new InvalidOperationException("Cư dân không tồn tại");
        }

        // Check for duplicate phone number (if changed)
        if (dto.PhoneNumber != null && dto.PhoneNumber != resident.PhoneNumber)
        {
            var existingByPhone = await _residentRepository.GetByPhoneNumberAsync(dto.PhoneNumber);
            if (existingByPhone != null)
            {
                throw new InvalidOperationException($"Số điện thoại '{dto.PhoneNumber}' đã được đăng ký");
            }
            resident.PhoneNumber = dto.PhoneNumber;
        }

        // Check for duplicate ID card (if changed)
        if (dto.IdCardNumber != null && dto.IdCardNumber != resident.IdCardNumber)
        {
            var existingById = await _residentRepository.GetByIdCardNumberAsync(dto.IdCardNumber);
            if (existingById != null)
            {
                throw new InvalidOperationException($"CCCD/CMND '{dto.IdCardNumber}' đã được đăng ký");
            }
            resident.IdCardNumber = dto.IdCardNumber;
        }

        if (dto.FullName != null) resident.FullName = dto.FullName;
        if (dto.Hometown != null) resident.Hometown = dto.Hometown;
        if (dto.IdCardFrontUrl != null) resident.IdCardFrontUrl = dto.IdCardFrontUrl;
        if (dto.IdCardBackUrl != null) resident.IdCardBackUrl = dto.IdCardBackUrl;

        _residentRepository.Update(resident);
        await _residentRepository.SaveChangesAsync();

        // Handle Email (Update in User table)
        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            await EnsureResidentAccountWithEmailAsync(resident.Id, dto.Email);
        }

        return MapToDto(resident);
    }

    private async Task EnsureResidentAccountWithEmailAsync(int residentId, string email)
    {
        var resident = await _residentRepository.GetByIdAsync(residentId);
        if (resident == null) return;

        var phone = (resident.PhoneNumber ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(phone)) return;

        var existingByResident = await _userRepository.FirstOrDefaultAsync(u => u.ResidentId == residentId);
        if (existingByResident != null)
        {
            existingByResident.Email = email.Trim();
            existingByResident.OwnerUserId = resident.OwnerUserId ?? existingByResident.OwnerUserId;
            _userRepository.Update(existingByResident);
            await _userRepository.SaveChangesAsync();
            return;
        }

        var existingByPhone = await _userRepository.GetByPhoneNumberAsync(phone);
        if (existingByPhone != null)
        {
            existingByPhone.ResidentId = residentId;
            existingByPhone.Email = email.Trim();
            existingByPhone.OwnerUserId = resident.OwnerUserId ?? existingByPhone.OwnerUserId;
            _userRepository.Update(existingByPhone);
            await _userRepository.SaveChangesAsync();
            return;
        }

        // Create new user account
        var defaultPassword = "123456";
        var user = new User
        {
            PhoneNumber = phone,
            Email = email.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword),
            Role = "CuDan",
            ResidentId = residentId,
            OwnerUserId = resident.OwnerUserId,
            IsLocked = false,
            MustChangePassword = true
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id, int ownerUserId)
    {
        var resident = await ResidentsForOwner(ownerUserId)
            .FirstOrDefaultAsync(item => item.Id == id);
        if (resident == null)
        {
            throw new InvalidOperationException("Cư dân không tồn tại");
        }

        // Check if resident has active contracts
        var hasActiveContracts = resident.ChiTietOs?.Any(ct => 
            ct.HopDong.ExpectedEndDate == null || ct.HopDong.ExpectedEndDate > DateTime.UtcNow) ?? false;
        
        if (hasActiveContracts)
        {
            throw new InvalidOperationException("Không thể xóa cư dân đang có hợp đồng");
        }

        _residentRepository.Remove(resident);
        await _residentRepository.SaveChangesAsync();
    }

    private ResidentDto MapToDto(Resident resident)
    {
        var now = DateTime.UtcNow;
        var residentUser = resident.Users
            .OrderBy(u => u.Id)
            .FirstOrDefault();

        var activeResidency = resident.ChiTietOs
            .Where(ct => ct.FromDate <= now && (ct.ToDate == null || ct.ToDate > now))
            .OrderByDescending(ct => ct.FromDate)
            .FirstOrDefault();

        return new ResidentDto
        {
            Id = resident.Id,
            FullName = resident.FullName,
            PhoneNumber = resident.PhoneNumber,
            Email = residentUser?.Email,
            BuildingName = activeResidency?.HopDong?.Room?.Floor?.Building?.BuildingName,
            FloorNumber = activeResidency?.HopDong?.Room?.Floor?.FloorNumber,
            RoomCode = activeResidency?.HopDong?.Room?.RoomCode,
            IsLocked = residentUser?.IsLocked ?? false,
            IdCardNumber = resident.IdCardNumber,
            Hometown = resident.Hometown,
            IdCardFrontUrl = resident.IdCardFrontUrl,
            IdCardBackUrl = resident.IdCardBackUrl,
            OwnerUserId = resident.OwnerUserId
        };
    }
}
