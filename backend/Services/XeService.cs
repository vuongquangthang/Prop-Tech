using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IXeService
{
    Task<List<XeDto>> GetAllAsync(int ownerUserId);
    Task<List<XeDto>> GetActiveVehiclesAsync(int ownerUserId);
    Task<List<XeDto>> GetByResidentIdAsync(int residentId, int ownerUserId);
    Task<XeDto?> GetByIdAsync(int id, int ownerUserId);
    Task<XeDto> CreateAsync(CreateXeDto dto, int ownerUserId);
    Task<XeDto> UpdateAsync(int id, UpdateXeDto dto, int ownerUserId);
    Task CancelAsync(int id, CancelXeDto dto, int ownerUserId);
    Task DeleteAsync(int id, int ownerUserId);
}

public class XeService : IXeService
{
    private readonly IXeRepository _xeRepository;
    private readonly IResidentRepository _residentRepository;

    public XeService(
        IXeRepository xeRepository,
        IResidentRepository residentRepository)
    {
        _xeRepository = xeRepository;
        _residentRepository = residentRepository;
    }

    public async Task<List<XeDto>> GetAllAsync(int ownerUserId)
    {
        var vehicles = await _xeRepository.FindAsync(v => v.Resident.OwnerUserId == ownerUserId);
        var vehiclesList = vehicles.ToList();
        var result = new List<XeDto>();
        foreach (var vehicle in vehiclesList)
        {
            var resident = await _residentRepository.GetByIdAsync(vehicle.ResidentId);
            result.Add(MapToDto(vehicle, resident));
        }
        return result;
    }

    public async Task<List<XeDto>> GetActiveVehiclesAsync(int ownerUserId)
    {
        var vehicles = await _xeRepository.FindAsync(v => v.CancellationDate == null && v.Resident.OwnerUserId == ownerUserId);
        var result = new List<XeDto>();
        foreach (var vehicle in vehicles)
        {
            var resident = await _residentRepository.GetByIdAsync(vehicle.ResidentId);
            result.Add(MapToDto(vehicle, resident));
        }
        return result;
    }

    public async Task<List<XeDto>> GetByResidentIdAsync(int residentId, int ownerUserId)
    {
        var resident = await _residentRepository.GetByIdAsync(residentId);
        if (resident?.OwnerUserId != ownerUserId)
        {
            return new List<XeDto>();
        }

        var vehicles = await _xeRepository.GetByResidentIdAsync(residentId);
        return vehicles.Select(v => MapToDto(v, resident)).ToList();
    }

    public async Task<XeDto?> GetByIdAsync(int id, int ownerUserId)
    {
        var vehicle = await _xeRepository.GetByIdAsync(id);
        if (vehicle == null) return null;
        var resident = await _residentRepository.GetByIdAsync(vehicle.ResidentId);
        if (resident?.OwnerUserId != ownerUserId) return null;
        return MapToDto(vehicle, resident);
    }

    public async Task<XeDto> CreateAsync(CreateXeDto dto, int ownerUserId)
    {
        // Validate resident exists
        var resident = await _residentRepository.GetByIdAsync(dto.ResidentId);
        if (resident == null || resident.OwnerUserId != ownerUserId)
        {
            throw new InvalidOperationException("Cư dân không tồn tại");
        }

        // Check if license plate already exists
        var existingVehicle = await _xeRepository.GetByLicensePlateAsync(dto.LicensePlate);
        if (existingVehicle != null)
        {
            throw new InvalidOperationException($"Biển số {dto.LicensePlate} đã được đăng ký");
        }

        var vehicle = new Xe
        {
            ResidentId = dto.ResidentId,
            LicensePlate = dto.LicensePlate,
            VehicleType = dto.VehicleType,
            RegistrationDate = DateTime.UtcNow
        };

        await _xeRepository.AddAsync(vehicle);
        await _xeRepository.SaveChangesAsync();

        var created = await _xeRepository.GetByIdAsync(vehicle.Id);
        return MapToDto(created!, resident);
    }

    public async Task<XeDto> UpdateAsync(int id, UpdateXeDto dto, int ownerUserId)
    {
        var vehicle = await _xeRepository.GetByIdAsync(id);
        if (vehicle == null)
        {
            throw new InvalidOperationException("Xe không tồn tại");
        }

        var resident = await _residentRepository.GetByIdAsync(vehicle.ResidentId);
        if (resident?.OwnerUserId != ownerUserId)
        {
            throw new InvalidOperationException("Xe khong ton tai");
        }

        if (vehicle.CancellationDate.HasValue)
        {
            throw new InvalidOperationException("Không thể cập nhật xe đã hủy đăng ký");
        }

        // Check unique license plate if changing
        if (!string.IsNullOrWhiteSpace(dto.LicensePlate) && dto.LicensePlate != vehicle.LicensePlate)
        {
            var existingVehicle = await _xeRepository.GetByLicensePlateAsync(dto.LicensePlate);
            if (existingVehicle != null)
            {
                throw new InvalidOperationException($"Biển số {dto.LicensePlate} đã được đăng ký");
            }
            vehicle.LicensePlate = dto.LicensePlate;
        }

        if (!string.IsNullOrWhiteSpace(dto.VehicleType))
            vehicle.VehicleType = dto.VehicleType;

        _xeRepository.Update(vehicle);
        await _xeRepository.SaveChangesAsync();

        var updated = await _xeRepository.GetByIdAsync(id);
        return MapToDto(updated!, resident);
    }

    public async Task CancelAsync(int id, CancelXeDto dto, int ownerUserId)
    {
        var vehicle = await _xeRepository.GetByIdAsync(id);
        if (vehicle == null)
        {
            throw new InvalidOperationException("Xe không tồn tại");
        }

        var resident = await _residentRepository.GetByIdAsync(vehicle.ResidentId);
        if (resident?.OwnerUserId != ownerUserId)
        {
            throw new InvalidOperationException("Xe khong ton tai");
        }

        if (vehicle.CancellationDate.HasValue)
        {
            throw new InvalidOperationException("Xe đã được hủy đăng ký");
        }

        vehicle.CancellationDate = dto.CancellationDate;
        _xeRepository.Update(vehicle);
        await _xeRepository.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id, int ownerUserId)
    {
        var vehicle = await _xeRepository.GetByIdAsync(id);
        if (vehicle == null)
        {
            throw new InvalidOperationException("Xe không tồn tại");
        }

        var resident = await _residentRepository.GetByIdAsync(vehicle.ResidentId);
        if (resident?.OwnerUserId != ownerUserId)
        {
            throw new InvalidOperationException("Xe khong ton tai");
        }

        // Check if vehicle is used in service usage
        var hasUsage = await _xeRepository.AnyAsync(v => v.Id == id && v.ChiTietSuDungDichVus.Any());
        if (hasUsage)
        {
            throw new InvalidOperationException("Không thể xóa xe đã có lịch sử sử dụng dịch vụ");
        }

        _xeRepository.Remove(vehicle);
        await _xeRepository.SaveChangesAsync();
    }

    private static XeDto MapToDto(Xe vehicle, Resident? resident)
    {
        return new XeDto
        {
            Id = vehicle.Id,
            ResidentId = vehicle.ResidentId,
            ResidentName = resident?.FullName,
            PhoneNumber = resident?.PhoneNumber,
            LicensePlate = vehicle.LicensePlate,
            VehicleType = vehicle.VehicleType,
            RegistrationDate = vehicle.RegistrationDate,
            CancellationDate = vehicle.CancellationDate
        };
    }
}
