using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IResidentService
{
    Task<List<ResidentDto>> GetAllAsync();
    Task<List<ResidentDto>> SearchByNameAsync(string name);
    Task<ResidentDetailDto?> GetByIdAsync(int id);
    Task<ResidentDto> CreateAsync(CreateResidentDto dto);
    Task<ResidentDto> UpdateAsync(int id, UpdateResidentDto dto);
    Task DeleteAsync(int id);
}

public class ResidentService : IResidentService
{
    private readonly IResidentRepository _residentRepository;

    public ResidentService(IResidentRepository residentRepository)
    {
        _residentRepository = residentRepository;
    }

    public async Task<List<ResidentDto>> GetAllAsync()
    {
        var residents = await _residentRepository.GetAllAsync();
        return residents.Select(MapToDto).ToList();
    }

    public async Task<List<ResidentDto>> SearchByNameAsync(string name)
    {
        var residents = await _residentRepository.SearchByNameAsync(name);
        return residents.Select(MapToDto).ToList();
    }

    public async Task<ResidentDetailDto?> GetByIdAsync(int id)
    {
        var resident = await _residentRepository.GetByIdAsync(id);
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

    public async Task<ResidentDto> CreateAsync(CreateResidentDto dto)
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
            IdCardBackUrl = dto.IdCardBackUrl
        };

        await _residentRepository.AddAsync(resident);
        return MapToDto(resident);
    }

    public async Task<ResidentDto> UpdateAsync(int id, UpdateResidentDto dto)
    {
        var resident = await _residentRepository.GetByIdAsync(id);
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
        return MapToDto(resident);
    }

    public async Task DeleteAsync(int id)
    {
        var resident = await _residentRepository.GetByIdAsync(id);
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
        return new ResidentDto
        {
            Id = resident.Id,
            FullName = resident.FullName,
            PhoneNumber = resident.PhoneNumber,
            IdCardNumber = resident.IdCardNumber,
            Hometown = resident.Hometown,
            IdCardFrontUrl = resident.IdCardFrontUrl,
            IdCardBackUrl = resident.IdCardBackUrl
        };
    }
}
