using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IChiTietSuDungDichVuService
{
    Task<List<ChiTietSuDungDichVuDto>> GetAllAsync(int ownerUserId);
    Task<List<ChiTietSuDungDichVuDto>> GetActiveUsagesAsync(int ownerUserId);
    Task<List<ChiTietSuDungDichVuDto>> GetByResidentIdAsync(int residentId, int? ownerUserId = null);
    Task<List<ChiTietSuDungDichVuDto>> GetByRoomIdAsync(int roomId, int? ownerUserId = null);
    Task<List<ChiTietSuDungDichVuDto>> GetByServiceIdAsync(int serviceId, int ownerUserId);
    Task<ChiTietSuDungDichVuDto?> GetByIdAsync(long id, int? ownerUserId = null);
    Task<ChiTietSuDungDichVuDto> CreateAsync(CreateChiTietSuDungDichVuDto dto, int ownerUserId);
    Task<ChiTietSuDungDichVuDto> UpdateAsync(long id, UpdateChiTietSuDungDichVuDto dto, int ownerUserId);
    Task EndUsageAsync(long id, EndChiTietSuDungDichVuDto dto, int ownerUserId);
    Task DeleteAsync(long id, int ownerUserId);
}

public class ChiTietSuDungDichVuService : IChiTietSuDungDichVuService
{
    private readonly IChiTietSuDungDichVuRepository _chiTietRepository;
    private readonly IServiceRepository _serviceRepository;
    private readonly IResidentRepository _residentRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly IXeRepository _xeRepository;

    public ChiTietSuDungDichVuService(
        IChiTietSuDungDichVuRepository chiTietRepository,
        IServiceRepository serviceRepository,
        IResidentRepository residentRepository,
        IRoomRepository roomRepository,
        IXeRepository xeRepository)
    {
        _chiTietRepository = chiTietRepository;
        _serviceRepository = serviceRepository;
        _residentRepository = residentRepository;
        _roomRepository = roomRepository;
        _xeRepository = xeRepository;
    }

    public async Task<List<ChiTietSuDungDichVuDto>> GetAllAsync(int ownerUserId)
    {
        var usages = await _chiTietRepository.GetAllAsync(ownerUserId);
        var usagesList = usages.ToList();
        var result = new List<ChiTietSuDungDichVuDto>();
        foreach (var usage in usagesList)
        {
            var dto = await MapToDtoAsync(usage);
            result.Add(dto);
        }
        return result;
    }

    public async Task<List<ChiTietSuDungDichVuDto>> GetActiveUsagesAsync(int ownerUserId)
    {
        var usages = await _chiTietRepository.GetActiveUsagesAsync(ownerUserId);
        var result = new List<ChiTietSuDungDichVuDto>();
        foreach (var usage in usages)
        {
            var dto = await MapToDtoAsync(usage);
            result.Add(dto);
        }
        return result;
    }

    public async Task<List<ChiTietSuDungDichVuDto>> GetByResidentIdAsync(int residentId, int? ownerUserId = null)
    {
        var usages = ownerUserId.HasValue
            ? await _chiTietRepository.GetByResidentIdAsync(residentId, ownerUserId.Value)
            : await _chiTietRepository.GetByResidentIdAsync(residentId);
        var result = new List<ChiTietSuDungDichVuDto>();
        foreach (var usage in usages)
        {
            var dto = await MapToDtoAsync(usage);
            result.Add(dto);
        }
        return result;
    }

    public async Task<List<ChiTietSuDungDichVuDto>> GetByRoomIdAsync(int roomId, int? ownerUserId = null)
    {
        var usages = ownerUserId.HasValue
            ? await _chiTietRepository.GetByRoomIdAsync(roomId, ownerUserId.Value)
            : await _chiTietRepository.GetByRoomIdAsync(roomId);
        var result = new List<ChiTietSuDungDichVuDto>();
        foreach (var usage in usages)
        {
            var dto = await MapToDtoAsync(usage);
            result.Add(dto);
        }
        return result;
    }

    public async Task<List<ChiTietSuDungDichVuDto>> GetByServiceIdAsync(int serviceId, int ownerUserId)
    {
        var usages = await _chiTietRepository.GetByServiceIdAsync(serviceId, ownerUserId);
        var result = new List<ChiTietSuDungDichVuDto>();
        foreach (var usage in usages)
        {
            var dto = await MapToDtoAsync(usage);
            result.Add(dto);
        }
        return result;
    }

    public async Task<ChiTietSuDungDichVuDto?> GetByIdAsync(long id, int? ownerUserId = null)
    {
        var usage = ownerUserId.HasValue
            ? (await _chiTietRepository.GetAllAsync(ownerUserId.Value)).FirstOrDefault(item => item.Id == id)
            : await _chiTietRepository.GetByIdAsync(id);
        if (usage == null) return null;
        return await MapToDtoAsync(usage);
    }

    public async Task<ChiTietSuDungDichVuDto> CreateAsync(CreateChiTietSuDungDichVuDto dto, int ownerUserId)
    {
        // Validate service exists
        var service = await _serviceRepository.GetByIdAsync(dto.ServiceId);
        if (service == null)
        {
            throw new InvalidOperationException("Dịch vụ không tồn tại");
        }
        if (service.OwnerUserId != ownerUserId)
        {
            throw new InvalidOperationException("Dịch vụ không thuộc chủ nhà hiện tại");
        }

        // Validate resident exists
        var resident = await _residentRepository.GetByIdAsync(dto.ResidentId);
        if (resident == null)
        {
            throw new InvalidOperationException("Cư dân không tồn tại");
        }

        // Validate room exists
        var room = await _roomRepository.GetWithDetailsAsync(dto.RoomId);
        if (room == null)
        {
            throw new InvalidOperationException("Phòng không tồn tại");
        }
        if (room.Floor?.Building?.OwnerUserId != ownerUserId)
        {
            throw new InvalidOperationException("Phòng không thuộc chủ nhà hiện tại");
        }

        // Validate vehicle if specified
        if (dto.VehicleId.HasValue)
        {
            var vehicle = await _xeRepository.GetByIdAsync(dto.VehicleId.Value);
            if (vehicle == null)
            {
                throw new InvalidOperationException("Xe không tồn tại");
            }

            if (vehicle.ResidentId != dto.ResidentId)
            {
                throw new InvalidOperationException("Xe không thuộc về cư dân này");
            }
        }

        var usage = new ChiTietSuDungDichVu
        {
            ServiceId = dto.ServiceId,
            ResidentId = dto.ResidentId,
            RoomId = dto.RoomId,
            VehicleId = dto.VehicleId,
            ApplyFrom = dto.ApplyFrom,
            ApplyTo = dto.ApplyTo,
            OverrideUnitPrice = dto.OverrideUnitPrice,
            Quantity = dto.Quantity,
            Note = dto.Note,
            CreatedAt = DateTime.UtcNow
        };

        await _chiTietRepository.AddAsync(usage);
        await _chiTietRepository.SaveChangesAsync();

        var created = await _chiTietRepository.GetByIdAsync(usage.Id);
        return await MapToDtoAsync(created!);
    }

    public async Task<ChiTietSuDungDichVuDto> UpdateAsync(long id, UpdateChiTietSuDungDichVuDto dto, int ownerUserId)
    {
        var usage = (await _chiTietRepository.GetAllAsync(ownerUserId)).FirstOrDefault(item => item.Id == id);
        if (usage == null)
        {
            throw new InvalidOperationException("Chi tiết sử dụng dịch vụ không tồn tại");
        }

        if (dto.ApplyTo.HasValue)
            usage.ApplyTo = dto.ApplyTo;

        if (dto.OverrideUnitPrice.HasValue)
            usage.OverrideUnitPrice = dto.OverrideUnitPrice;

        if (dto.Quantity.HasValue)
            usage.Quantity = dto.Quantity;

        if (dto.Note != null)
            usage.Note = dto.Note;

        _chiTietRepository.Update(usage);
        await _chiTietRepository.SaveChangesAsync();

        var updated = await _chiTietRepository.GetByIdAsync(id);
        return await MapToDtoAsync(updated!);
    }

    public async Task EndUsageAsync(long id, EndChiTietSuDungDichVuDto dto, int ownerUserId)
    {
        var usage = (await _chiTietRepository.GetAllAsync(ownerUserId)).FirstOrDefault(item => item.Id == id);
        if (usage == null)
        {
            throw new InvalidOperationException("Chi tiết sử dụng dịch vụ không tồn tại");
        }

        if (usage.ApplyTo.HasValue)
        {
            throw new InvalidOperationException("Dịch vụ đã được kết thúc");
        }

        usage.ApplyTo = dto.ApplyTo;
        _chiTietRepository.Update(usage);
        await _chiTietRepository.SaveChangesAsync();
    }

    public async Task DeleteAsync(long id, int ownerUserId)
    {
        var usage = (await _chiTietRepository.GetAllAsync(ownerUserId)).FirstOrDefault(item => item.Id == id);
        if (usage == null)
        {
            throw new InvalidOperationException("Chi tiết sử dụng dịch vụ không tồn tại");
        }

        _chiTietRepository.Remove(usage);
        await _chiTietRepository.SaveChangesAsync();
    }

    private async Task<ChiTietSuDungDichVuDto> MapToDtoAsync(ChiTietSuDungDichVu usage)
    {
        var service = await _serviceRepository.GetByIdAsync(usage.ServiceId);
        var resident = await _residentRepository.GetByIdAsync(usage.ResidentId);
        var room = await _roomRepository.GetByIdAsync(usage.RoomId);
        var vehicle = usage.VehicleId.HasValue ? await _xeRepository.GetByIdAsync(usage.VehicleId.Value) : null;

        return new ChiTietSuDungDichVuDto
        {
            Id = usage.Id,
            ServiceId = usage.ServiceId,
            ServiceName = service?.Name,
            ServiceType = service?.ServiceType,
            ResidentId = usage.ResidentId,
            ResidentName = resident?.FullName,
            RoomId = usage.RoomId,
            RoomNumber = room?.RoomCode,
            VehicleId = usage.VehicleId,
            LicensePlate = vehicle?.LicensePlate,
            ApplyFrom = usage.ApplyFrom,
            ApplyTo = usage.ApplyTo,
            OverrideUnitPrice = usage.OverrideUnitPrice,
            Quantity = usage.Quantity,
            Note = usage.Note,
            CreatedAt = usage.CreatedAt
        };
    }
}
