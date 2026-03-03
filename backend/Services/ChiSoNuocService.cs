using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IChiSoNuocService
{
    Task<List<ChiSoNuocDto>> GetAllAsync();
    Task<List<ChiSoNuocDto>> GetByServiceUsageDetailIdAsync(long serviceUsageDetailId);
    Task<ChiSoNuocDto?> GetByPeriodAsync(long serviceUsageDetailId, byte month, short year);
    Task<List<ChiSoNuocDto>> GetByPeriodRangeAsync(DateTime from, DateTime to);
    Task<ChiSoNuocDto?> GetByIdAsync(int id);
    Task<ChiSoNuocDto> CreateAsync(int userId, CreateChiSoNuocDto dto);
    Task<ChiSoNuocDto> UpdateAsync(int id, UpdateChiSoNuocDto dto);
    Task DeleteAsync(int id);
}

public class ChiSoNuocService : IChiSoNuocService
{
    private readonly IChiSoNuocRepository _chiSoNuocRepository;
    private readonly IChiTietSuDungDichVuRepository _serviceUsageRepository;
    private readonly IUserRepository _userRepository;

    public ChiSoNuocService(
        IChiSoNuocRepository chiSoNuocRepository,
        IChiTietSuDungDichVuRepository serviceUsageRepository,
        IUserRepository userRepository)
    {
        _chiSoNuocRepository = chiSoNuocRepository;
        _serviceUsageRepository = serviceUsageRepository;
        _userRepository = userRepository;
    }

    public async Task<List<ChiSoNuocDto>> GetAllAsync()
    {
        var readings = await _chiSoNuocRepository.GetAllAsync();
        var result = new List<ChiSoNuocDto>();
        
        foreach (var reading in readings)
        {
            var dto = await MapToDtoAsync(reading);
            result.Add(dto);
        }
        
        return result;
    }

    public async Task<List<ChiSoNuocDto>> GetByServiceUsageDetailIdAsync(long serviceUsageDetailId)
    {
        var readings = await _chiSoNuocRepository.GetByServiceUsageDetailIdAsync(serviceUsageDetailId);
        var result = new List<ChiSoNuocDto>();
        
        foreach (var reading in readings)
        {
            var dto = await MapToDtoAsync(reading);
            result.Add(dto);
        }
        
        return result;
    }

    public async Task<ChiSoNuocDto?> GetByPeriodAsync(long serviceUsageDetailId, byte month, short year)
    {
        var reading = await _chiSoNuocRepository.GetByPeriodAsync(serviceUsageDetailId, month, year);
        if (reading == null) return null;
        
        return await MapToDtoAsync(reading);
    }

    public async Task<List<ChiSoNuocDto>> GetByPeriodRangeAsync(DateTime from, DateTime to)
    {
        var readings = await _chiSoNuocRepository.GetByPeriodRangeAsync(from, to);
        var result = new List<ChiSoNuocDto>();
        
        foreach (var reading in readings)
        {
            var dto = await MapToDtoAsync(reading);
            result.Add(dto);
        }
        
        return result;
    }

    public async Task<ChiSoNuocDto?> GetByIdAsync(int id)
    {
        var reading = await _chiSoNuocRepository.GetByIdAsync(id);
        if (reading == null) return null;
        
        return await MapToDtoAsync(reading);
    }

    public async Task<ChiSoNuocDto> CreateAsync(int userId, CreateChiSoNuocDto dto)
    {
        // Validate service usage detail exists
        var serviceUsage = await _serviceUsageRepository.GetByIdAsync(dto.ServiceUsageDetailId);
        if (serviceUsage == null)
        {
            throw new InvalidOperationException("Chi tiết sử dụng dịch vụ không tồn tại");
        }

        // Check if reading for this period already exists
        var existing = await _chiSoNuocRepository.GetByPeriodAsync(dto.ServiceUsageDetailId, dto.Month, dto.Year);
        if (existing != null)
        {
            throw new InvalidOperationException("Chỉ số nước cho kỳ này đã tồn tại");
        }

        // Validate new reading >= previous reading
        var previousReading = await _chiSoNuocRepository.GetPreviousReadingAsync(dto.ServiceUsageDetailId, dto.Month, dto.Year);
        if (previousReading != null && dto.NewReading < previousReading.NewReading)
        {
            throw new InvalidOperationException($"Chỉ số mới ({dto.NewReading}) không thể nhỏ hơn chỉ số cũ ({previousReading.NewReading})");
        }

        var reading = new ChiSoNuoc
        {
            ServiceUsageDetailId = dto.ServiceUsageDetailId,
            Month = dto.Month,
            Year = dto.Year,
            NewReading = dto.NewReading,
            MeterImageUrl = dto.MeterImageUrl,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        await _chiSoNuocRepository.AddAsync(reading);
        await _chiSoNuocRepository.SaveChangesAsync();

        var created = await _chiSoNuocRepository.GetByIdAsync(reading.Id);
        return await MapToDtoAsync(created!);
    }

    public async Task<ChiSoNuocDto> UpdateAsync(int id, UpdateChiSoNuocDto dto)
    {
        var reading = await _chiSoNuocRepository.GetByIdAsync(id);
        if (reading == null)
        {
            throw new InvalidOperationException("Chỉ số nước không tồn tại");
        }

        // Validate new reading >= previous reading
        var previousReading = await _chiSoNuocRepository.GetPreviousReadingAsync(reading.ServiceUsageDetailId, reading.Month, reading.Year);
        if (previousReading != null && dto.NewReading < previousReading.NewReading)
        {
            throw new InvalidOperationException($"Chỉ số mới ({dto.NewReading}) không thể nhỏ hơn chỉ số cũ ({previousReading.NewReading})");
        }

        reading.NewReading = dto.NewReading;
        
        if (!string.IsNullOrWhiteSpace(dto.MeterImageUrl))
            reading.MeterImageUrl = dto.MeterImageUrl;

        _chiSoNuocRepository.Update(reading);
        await _chiSoNuocRepository.SaveChangesAsync();

        var updated = await _chiSoNuocRepository.GetByIdAsync(id);
        return await MapToDtoAsync(updated!);
    }

    public async Task DeleteAsync(int id)
    {
        var reading = await _chiSoNuocRepository.GetByIdAsync(id);
        if (reading == null)
        {
            throw new InvalidOperationException("Chỉ số nước không tồn tại");
        }

        _chiSoNuocRepository.Remove(reading);
        await _chiSoNuocRepository.SaveChangesAsync();
    }

    private async Task<ChiSoNuocDto> MapToDtoAsync(ChiSoNuoc reading)
    {
        // Get previous reading for consumption calculation
        var previousReading = await _chiSoNuocRepository.GetPreviousReadingAsync(reading.ServiceUsageDetailId, reading.Month, reading.Year);
        
        // Get service usage detail for room info
        var serviceUsage = await _serviceUsageRepository.GetByIdAsync(reading.ServiceUsageDetailId);
        
        // Get creator info
        User? creator = null;
        if (reading.CreatedBy.HasValue)
        {
            creator = await _userRepository.GetByIdAsync(reading.CreatedBy.Value);
        }

        return new ChiSoNuocDto
        {
            Id = reading.Id,
            ServiceUsageDetailId = reading.ServiceUsageDetailId,
            Month = reading.Month,
            Year = reading.Year,
            NewReading = reading.NewReading,
            PreviousReading = previousReading?.NewReading,
            Consumption = previousReading != null ? reading.NewReading - previousReading.NewReading : null,
            MeterImageUrl = reading.MeterImageUrl,
            CreatedAt = reading.CreatedAt,
            CreatedBy = reading.CreatedBy,
            CreatedByName = creator?.PhoneNumber,
            RoomId = serviceUsage?.RoomId,
            RoomNumber = serviceUsage?.Room?.RoomCode
        };
    }
}
