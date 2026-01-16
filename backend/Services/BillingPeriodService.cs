using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IBillingPeriodService
{
    Task<BillingPeriodDto?> GetByIdAsync(long id);
    Task<List<BillingPeriodDto>> GetAllAsync();
    Task<BillingPeriodDto?> GetByMonthAsync(DateTime periodMonth);
    Task<BillingPeriodDto> CreateAsync(CreateBillingPeriodDto dto);
    Task<BillingPeriodDto> UpdateAsync(long id, UpdateBillingPeriodDto dto);
}

public class BillingPeriodService : IBillingPeriodService
{
    private readonly IBillingPeriodRepository _billingPeriodRepository;
    private readonly ILogger<BillingPeriodService> _logger;

    public BillingPeriodService(IBillingPeriodRepository billingPeriodRepository, ILogger<BillingPeriodService> logger)
    {
        _billingPeriodRepository = billingPeriodRepository;
        _logger = logger;
    }

    public async Task<BillingPeriodDto?> GetByIdAsync(long id)
    {
        var period = await _billingPeriodRepository.GetByIdAsync(id);
        return period == null ? null : MapToDto(period);
    }

    public async Task<List<BillingPeriodDto>> GetAllAsync()
    {
        var periods = await _billingPeriodRepository.GetAllAsync();
        return periods.Select(MapToDto).ToList();
    }

    public async Task<BillingPeriodDto?> GetByMonthAsync(DateTime periodMonth)
    {
        var period = await _billingPeriodRepository.GetByMonthAsync(periodMonth);
        return period == null ? null : MapToDto(period);
    }

    public async Task<BillingPeriodDto> CreateAsync(CreateBillingPeriodDto dto)
    {
        // Check if period already exists
        var existing = await _billingPeriodRepository.GetByMonthAsync(dto.PeriodMonth);
        if (existing != null)
        {
            throw new InvalidOperationException("Kỳ tính phí này đã tồn tại");
        }

        // Set defaults for cutoff and due dates
        var cutoffDate = dto.CutoffDate ?? new DateTime(dto.PeriodMonth.Year, dto.PeriodMonth.Month, 25);
        var dueDate = dto.DueDate ?? new DateTime(dto.PeriodMonth.Year, dto.PeriodMonth.Month, DateTime.DaysInMonth(dto.PeriodMonth.Year, dto.PeriodMonth.Month));

        var period = new BillingPeriod
        {
            PeriodMonth = dto.PeriodMonth,
            CutoffDate = cutoffDate,
            DueDate = dueDate,
            Status = "DRAFT",
            LateFeeEnabled = dto.LateFeeEnabled,
            LateFeePercent = dto.LateFeePercent,
            LateFeeFixed = dto.LateFeeFixed,
            CreatedAt = DateTime.UtcNow
        };

        await _billingPeriodRepository.AddAsync(period);
        await _billingPeriodRepository.SaveChangesAsync();

        return MapToDto(period);
    }

    public async Task<BillingPeriodDto> UpdateAsync(long id, UpdateBillingPeriodDto dto)
    {
        var period = await _billingPeriodRepository.GetByIdAsync(id);
        
        if (period == null)
        {
            throw new InvalidOperationException("Không tìm thấy kỳ tính phí");
        }

        if (dto.CutoffDate.HasValue)
        {
            period.CutoffDate = dto.CutoffDate.Value;
        }

        if (dto.DueDate.HasValue)
        {
            period.DueDate = dto.DueDate.Value;
        }

        if (!string.IsNullOrEmpty(dto.Status))
        {
            var validStatuses = new[] { "DRAFT", "CONFIRMED", "CLOSED" };
            if (!validStatuses.Contains(dto.Status))
            {
                throw new InvalidOperationException("Trạng thái không hợp lệ");
            }

            period.Status = dto.Status;
        }

        _billingPeriodRepository.Update(period);
        await _billingPeriodRepository.SaveChangesAsync();

        return MapToDto(period);
    }

    private BillingPeriodDto MapToDto(BillingPeriod period)
    {
        return new BillingPeriodDto
        {
            Id = period.Id,
            PeriodMonth = period.PeriodMonth,
            CutoffDate = period.CutoffDate,
            DueDate = period.DueDate,
            Status = period.Status,
            LateFeeEnabled = period.LateFeeEnabled,
            LateFeePercent = period.LateFeePercent,
            LateFeeFixed = period.LateFeeFixed,
            CreatedAt = period.CreatedAt
        };
    }
}
