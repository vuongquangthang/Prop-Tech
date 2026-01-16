using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IDepositService
{
    Task<DepositDto?> GetByIdAsync(long id);
    Task<DepositDto?> GetByResidencyAsync(long residencyId);
    Task<List<DepositDto>> GetByRoomAsync(long roomId);
    Task<List<DepositDto>> GetByStatusAsync(string status);
    Task<DepositDto> UpdateStatusAsync(long id, UpdateDepositStatusDto dto);
    Task<DepositDto> RefundAsync(long id, RefundDepositDto dto);
}

public class DepositService : IDepositService
{
    private readonly IDepositRepository _depositRepository;
    private readonly ILogger<DepositService> _logger;

    public DepositService(IDepositRepository depositRepository, ILogger<DepositService> logger)
    {
        _depositRepository = depositRepository;
        _logger = logger;
    }

    public async Task<DepositDto?> GetByIdAsync(long id)
    {
        var deposit = await _depositRepository.GetByIdAsync(id);
        return deposit == null ? null : MapToDto(deposit);
    }

    public async Task<DepositDto?> GetByResidencyAsync(long residencyId)
    {
        var deposit = await _depositRepository.GetByResidencyAsync(residencyId);
        return deposit == null ? null : MapToDto(deposit);
    }

    public async Task<List<DepositDto>> GetByRoomAsync(long roomId)
    {
        var deposits = await _depositRepository.GetByRoomAsync(roomId);
        return deposits.Select(MapToDto).ToList();
    }

    public async Task<List<DepositDto>> GetByStatusAsync(string status)
    {
        var deposits = await _depositRepository.GetByStatusAsync(status);
        return deposits.Select(MapToDto).ToList();
    }

    public async Task<DepositDto> UpdateStatusAsync(long id, UpdateDepositStatusDto dto)
    {
        var deposit = await _depositRepository.GetByIdAsync(id);
        
        if (deposit == null)
        {
            throw new InvalidOperationException("Không tìm thấy tiền cọc");
        }

        // Validate status transition
        var validStatuses = new[] { "UNPAID", "PAID", "REFUNDED", "FORFEITED" };
        if (!validStatuses.Contains(dto.Status))
        {
            throw new InvalidOperationException("Trạng thái không hợp lệ");
        }

        deposit.Status = dto.Status;
        
        if (dto.Status == "PAID" && dto.PaidDate.HasValue)
        {
            deposit.PaidDate = dto.PaidDate.Value;
        }

        if (!string.IsNullOrEmpty(dto.Notes))
        {
            deposit.Notes = dto.Notes;
        }

        deposit.UpdatedAt = DateTime.UtcNow;
        _depositRepository.Update(deposit);
        await _depositRepository.SaveChangesAsync();

        return MapToDto(deposit);
    }

    public async Task<DepositDto> RefundAsync(long id, RefundDepositDto dto)
    {
        var deposit = await _depositRepository.GetByIdAsync(id);
        
        if (deposit == null)
        {
            throw new InvalidOperationException("Không tìm thấy tiền cọc");
        }

        if (deposit.Status == "PAID")
        {
            throw new InvalidOperationException("Chỉ có thể hoàn cọc từ tiền đã nộp");
        }

        deposit.RefundAmount = dto.RefundAmount;
        deposit.RefundDeduction = dto.RefundDeduction;
        deposit.RefundReason = dto.RefundReason;
        deposit.RefundDate = DateTime.UtcNow;
        deposit.Status = "REFUNDED";
        deposit.UpdatedAt = DateTime.UtcNow;

        _depositRepository.Update(deposit);
        await _depositRepository.SaveChangesAsync();

        return MapToDto(deposit);
    }

    private DepositDto MapToDto(Deposit deposit)
    {
        return new DepositDto
        {
            Id = deposit.Id,
            ResidencyId = deposit.ResidencyId,
            RoomId = deposit.RoomId,
            ResidentId = deposit.ResidentId,
            Amount = deposit.Amount,
            Status = deposit.Status,
            PaidDate = deposit.PaidDate,
            RefundDate = deposit.RefundDate,
            RefundAmount = deposit.RefundAmount,
            RefundDeduction = deposit.RefundDeduction,
            RefundReason = deposit.RefundReason,
            Notes = deposit.Notes,
            CreatedAt = deposit.CreatedAt
        };
    }
}
