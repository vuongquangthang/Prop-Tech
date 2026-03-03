using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IChiSoDienService
{
    Task<List<ChiSoDienDto>> GetAllAsync();
    Task<List<ChiSoDienDto>> GetByServiceUsageDetailIdAsync(long serviceUsageDetailId);
    Task<ChiSoDienDto?> GetByPeriodAsync(long serviceUsageDetailId, byte month, short year);
    Task<List<ChiSoDienDto>> GetByPeriodRangeAsync(DateTime from, DateTime to);
    Task<ChiSoDienDto?> GetByIdAsync(int id);
    Task<ChiSoDienDto> CreateAsync(int userId, CreateChiSoDienDto dto);
    Task<ChiSoDienDto> UpdateAsync(int id, UpdateChiSoDienDto dto);
    Task DeleteAsync(int id);
}

public class ChiSoDienService : IChiSoDienService
{
    private readonly IChiSoDienRepository _chiSoDienRepository;
    private readonly IChiTietSuDungDichVuRepository _serviceUsageRepository;
    private readonly IUserRepository _userRepository;

    public ChiSoDienService(
        IChiSoDienRepository chiSoDienRepository,
        IChiTietSuDungDichVuRepository serviceUsageRepository,
        IUserRepository userRepository)
    {
        _chiSoDienRepository = chiSoDienRepository;
        _serviceUsageRepository = serviceUsageRepository;
        _userRepository = userRepository;
    }

    public async Task<List<ChiSoDienDto>> GetAllAsync()
    {
        var readings = await _chiSoDienRepository.GetAllAsync();
        var result = new List<ChiSoDienDto>();
        
        foreach (var reading in readings)
        {
            var dto = await MapToDtoAsync(reading);
            result.Add(dto);
        }
        
        return result;
    }

    public async Task<List<ChiSoDienDto>> GetByServiceUsageDetailIdAsync(long serviceUsageDetailId)
    {
        var readings = await _chiSoDienRepository.GetByServiceUsageDetailIdAsync(serviceUsageDetailId);
        var result = new List<ChiSoDienDto>();
        
        foreach (var reading in readings)
        {
            var dto = await MapToDtoAsync(reading);
            result.Add(dto);
        }
        
        return result;
    }

    public async Task<ChiSoDienDto?> GetByPeriodAsync(long serviceUsageDetailId, byte month, short year)
    {
        var reading = await _chiSoDienRepository.GetByPeriodAsync(serviceUsageDetailId, month, year);
        if (reading == null) return null;
        
        return await MapToDtoAsync(reading);
    }

    public async Task<List<ChiSoDienDto>> GetByPeriodRangeAsync(DateTime from, DateTime to)
    {
        var readings = await _chiSoDienRepository.GetByPeriodRangeAsync(from, to);
        var result = new List<ChiSoDienDto>();
        
        foreach (var reading in readings)
        {
            var dto = await MapToDtoAsync(reading);
            result.Add(dto);
        }
        
        return result;
    }

    public async Task<ChiSoDienDto?> GetByIdAsync(int id)
    {
        var reading = await _chiSoDienRepository.GetByIdAsync(id);
        if (reading == null) return null;
        
        return await MapToDtoAsync(reading);
    }

    public async Task<ChiSoDienDto> CreateAsync(int userId, CreateChiSoDienDto dto)
    {
        // Validate service usage detail exists
        var serviceUsage = await _serviceUsageRepository.GetByIdAsync(dto.ServiceUsageDetailId);
        if (serviceUsage == null)
        {
            throw new InvalidOperationException("Chi tiết sử dụng dịch vụ không tồn tại");
        }

        // Check if reading for this period already exists
        var existing = await _chiSoDienRepository.GetByPeriodAsync(dto.ServiceUsageDetailId, dto.Month, dto.Year);
        if (existing != null)
        {
            throw new InvalidOperationException("Chỉ số điện cho kỳ này đã tồn tại");
        }

        // Validate new reading >= previous reading
        var previousReading = await _chiSoDienRepository.GetPreviousReadingAsync(dto.ServiceUsageDetailId, dto.Month, dto.Year);
        if (previousReading != null && dto.NewReading < previousReading.NewReading)
        {
            throw new InvalidOperationException($"Chỉ số mới ({dto.NewReading}) không thể nhỏ hơn chỉ số cũ ({previousReading.NewReading})");
        }

        var reading = new ChiSoDien
        {
            ServiceUsageDetailId = dto.ServiceUsageDetailId,
            Month = dto.Month,
            Year = dto.Year,
            NewReading = dto.NewReading,
            MeterImageUrl = dto.MeterImageUrl,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        await _chiSoDienRepository.AddAsync(reading);
        await _chiSoDienRepository.SaveChangesAsync();

        var created = await _chiSoDienRepository.GetByIdAsync(reading.Id);
        return await MapToDtoAsync(created!);
    }

    public async Task<ChiSoDienDto> UpdateAsync(int id, UpdateChiSoDienDto dto)
    {
        var reading = await _chiSoDienRepository.GetByIdAsync(id);
        if (reading == null)
        {
            throw new InvalidOperationException("Chỉ số điện không tồn tại");
        }

        // Validate new reading >= previous reading
        var previousReading = await _chiSoDienRepository.GetPreviousReadingAsync(reading.ServiceUsageDetailId, reading.Month, reading.Year);
        if (previousReading != null && dto.NewReading < previousReading.NewReading)
        {
            throw new InvalidOperationException($"Chỉ số mới ({dto.NewReading}) không thể nhỏ hơn chỉ số cũ ({previousReading.NewReading})");
        }

        reading.NewReading = dto.NewReading;
        
        if (!string.IsNullOrWhiteSpace(dto.MeterImageUrl))
            reading.MeterImageUrl = dto.MeterImageUrl;

        _chiSoDienRepository.Update(reading);
        await _chiSoDienRepository.SaveChangesAsync();

        var updated = await _chiSoDienRepository.GetByIdAsync(id);
        return await MapToDtoAsync(updated!);
    }

    public async Task DeleteAsync(int id)
    {
        var reading = await _chiSoDienRepository.GetByIdAsync(id);
        if (reading == null)
        {
            throw new InvalidOperationException("Chỉ số điện không tồn tại");
        }

        _chiSoDienRepository.Remove(reading);
        await _chiSoDienRepository.SaveChangesAsync();
    }

    private async Task<ChiSoDienDto> MapToDtoAsync(ChiSoDien reading)
    {
        // Get previous reading for consumption calculation
        var previousReading = await _chiSoDienRepository.GetPreviousReadingAsync(reading.ServiceUsageDetailId, reading.Month, reading.Year);
        
        // Get service usage detail for room info
        var serviceUsage = await _serviceUsageRepository.GetByIdAsync(reading.ServiceUsageDetailId);
        
        // Get creator info
        User? creator = null;
        if (reading.CreatedBy.HasValue)
        {
            creator = await _userRepository.GetByIdAsync(reading.CreatedBy.Value);
        }

        return new ChiSoDienDto
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
