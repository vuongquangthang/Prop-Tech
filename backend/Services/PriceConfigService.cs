using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IPriceConfigService
{
    Task<PriceConfigDto?> GetByIdAsync(long id);
    Task<List<PriceConfigDto>> GetByServiceTypeAsync(string serviceType);
    Task<PriceConfigDto?> GetLatestByServiceTypeAsync(string serviceType, DateTime? effectiveDate = null);
    Task<List<PriceConfigDto>> GetHistoryByServiceTypeAsync(string serviceType);
    Task<PriceConfigDto> CreateAsync(CreatePriceConfigDto dto);
    Task<PriceConfigDto> UpdateAsync(long id, UpdatePriceConfigDto dto);
    Task DeleteAsync(long id);
}

public class PriceConfigService : IPriceConfigService
{
    private readonly IPriceConfigRepository _priceConfigRepository;
    private readonly ILogger<PriceConfigService> _logger;

    public PriceConfigService(IPriceConfigRepository priceConfigRepository, ILogger<PriceConfigService> logger)
    {
        _priceConfigRepository = priceConfigRepository;
        _logger = logger;
    }

    public async Task<PriceConfigDto?> GetByIdAsync(long id)
    {
        var config = await _priceConfigRepository.GetByIdAsync(id);
        return config == null ? null : MapToDto(config);
    }

    public async Task<List<PriceConfigDto>> GetByServiceTypeAsync(string serviceType)
    {
        var configs = await _priceConfigRepository.GetByServiceTypeAsync(serviceType);
        return configs.Select(MapToDto).ToList();
    }

    public async Task<PriceConfigDto?> GetLatestByServiceTypeAsync(string serviceType, DateTime? effectiveDate = null)
    {
        var config = await _priceConfigRepository.GetLatestByServiceTypeAsync(serviceType, effectiveDate);
        return config == null ? null : MapToDto(config);
    }

    public async Task<List<PriceConfigDto>> GetHistoryByServiceTypeAsync(string serviceType)
    {
        var configs = await _priceConfigRepository.GetHistoryByServiceTypeAsync(serviceType);
        return configs.Select(MapToDto).ToList();
    }

    public async Task<PriceConfigDto> CreateAsync(CreatePriceConfigDto dto)
    {
        // Validate service type
        var validServiceTypes = new[] { "WATER", "ELECTRICITY", "SERVICE" };
        if (!validServiceTypes.Contains(dto.ServiceType))
        {
            throw new InvalidOperationException("Loại dịch vụ không hợp lệ");
        }

        // Validate pricing method
        var validMethods = new[] { "PER_PERSON", "PER_UNIT", "FIXED", "TIERED" };
        if (!validMethods.Contains(dto.PricingMethod))
        {
            throw new InvalidOperationException("Phương thức tính giá không hợp lệ");
        }

        var priceConfig = new PriceConfig
        {
            ServiceType = dto.ServiceType,
            PricingMethod = dto.PricingMethod,
            UnitPrice = dto.UnitPrice,
            UnitType = dto.UnitType,
            EffectiveDate = dto.EffectiveDate,
            IsTiered = dto.IsTiered,
            Description = dto.Description,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow
        };

        await _priceConfigRepository.AddAsync(priceConfig);
        await _priceConfigRepository.SaveChangesAsync();

        return MapToDto(priceConfig);
    }

    public async Task<PriceConfigDto> UpdateAsync(long id, UpdatePriceConfigDto dto)
    {
        var priceConfig = await _priceConfigRepository.GetByIdAsync(id);
        
        if (priceConfig == null)
        {
            throw new InvalidOperationException("Không tìm thấy cấu hình giá");
        }

        priceConfig.UnitPrice = dto.UnitPrice;
        priceConfig.UnitType = dto.UnitType;
        priceConfig.IsTiered = dto.IsTiered;
        priceConfig.Description = dto.Description;
        priceConfig.Notes = dto.Notes;

        _priceConfigRepository.Update(priceConfig);
        await _priceConfigRepository.SaveChangesAsync();

        return MapToDto(priceConfig);
    }

    public async Task DeleteAsync(long id)
    {
        var priceConfig = await _priceConfigRepository.GetByIdAsync(id);
        
        if (priceConfig == null)
        {
            throw new InvalidOperationException("Không tìm thấy cấu hình giá");
        }

        _priceConfigRepository.Remove(priceConfig);
        await _priceConfigRepository.SaveChangesAsync();
    }

    private PriceConfigDto MapToDto(PriceConfig config)
    {
        return new PriceConfigDto
        {
            Id = config.Id,
            ServiceType = config.ServiceType,
            PricingMethod = config.PricingMethod,
            UnitPrice = config.UnitPrice,
            UnitType = config.UnitType,
            EffectiveDate = config.EffectiveDate,
            IsTiered = config.IsTiered,
            Description = config.Description,
            Notes = config.Notes,
            CreatedAt = config.CreatedAt
        };
    }
}
