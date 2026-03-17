using backend.DTOs;
using backend.Repositories;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public interface ITatToanService
    {
        Task<IEnumerable<TatToanDto>> GetAllAsync();
        Task<TatToanDto?> GetByIdAsync(int id);
        Task<IEnumerable<TatToanDto>> GetByResidencyIdAsync(int residencyId);
        Task<IEnumerable<TatToanDto>> GetByStatusAsync(string status);
        Task<TatToanDto> CreateAsync(CreateTatToanDto dto);
        Task<TatToanDto> UpdateAsync(int id, UpdateTatToanDto dto);
        Task<bool> DeleteAsync(int id);
    }

    public class TatToanService : ITatToanService
    {
        private readonly ITatToanRepository _tatToanRepository;
        private readonly IChiTietPhieuTatToanRepository _detailRepository;
        private readonly IHopDongRepository _hopDongRepository;

        public TatToanService(
            ITatToanRepository tatToanRepository,
            IChiTietPhieuTatToanRepository detailRepository,
            IHopDongRepository hopDongRepository)
        {
            _tatToanRepository = tatToanRepository;
            _detailRepository = detailRepository;
            _hopDongRepository = hopDongRepository;
        }

        public async Task<IEnumerable<TatToanDto>> GetAllAsync()
        {
            var tatToans = await _tatToanRepository.GetAllAsync();
            return tatToans.Select(MapToDto);
        }

        public async Task<TatToanDto?> GetByIdAsync(int id)
        {
            var tatToan = await _tatToanRepository.GetByIdAsync(id);
            return tatToan == null ? null : MapToDto(tatToan);
        }

        public async Task<IEnumerable<TatToanDto>> GetByResidencyIdAsync(int residencyId)
        {
            var tatToans = await _tatToanRepository.GetByResidencyIdAsync(residencyId);
            return tatToans.Select(MapToDto);
        }

        public async Task<IEnumerable<TatToanDto>> GetByStatusAsync(string status)
        {
            var tatToans = await _tatToanRepository.GetByStatusAsync(status);
            return tatToans.Select(MapToDto);
        }

        public async Task<TatToanDto> CreateAsync(CreateTatToanDto dto)
        {
            // Validate residency exists
            var residency = await _hopDongRepository.GetByIdAsync(dto.ResidencyId);
            if (residency == null)
            {
                throw new Exception("Hợp đồng không tồn tại");
            }

            // Calculate total settlement
            var totalSettlement = CalculateTotalSettlement(
                dto.DepositRefund ?? 0,
                dto.OutstandingDebt ?? 0,
                dto.Compensation ?? 0,
                dto.Deductions ?? 0
            );

            var tatToan = new TatToan
            {
                ResidencyId = dto.ResidencyId,
                SettlementDate = dto.SettlementDate,
                DepositRefund = dto.DepositRefund,
                OutstandingDebt = dto.OutstandingDebt,
                Compensation = dto.Compensation,
                Deductions = dto.Deductions,
                TotalSettlement = totalSettlement,
                ResidentSignature = dto.ResidentSignature,
                ManagerSignature = dto.ManagerSignature,
                Status = dto.Status,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _tatToanRepository.CreateAsync(tatToan);

            // Create details
            foreach (var detailDto in dto.Details)
            {
                var detail = new ChiTietPhieuTatToan
                {
                    SettlementId = created.Id,
                    Description = detailDto.Description,
                    Amount = detailDto.Amount,
                    Type = detailDto.Type,
                    CreatedAt = DateTime.UtcNow
                };
                await _detailRepository.CreateAsync(detail);
            }

            // Reload to get details
            var result = await _tatToanRepository.GetByIdAsync(created.Id);
            return MapToDto(result!);
        }

        public async Task<TatToanDto> UpdateAsync(int id, UpdateTatToanDto dto)
        {
            var tatToan = await _tatToanRepository.GetByIdAsync(id);
            if (tatToan == null)
            {
                throw new Exception("Phiếu tất toán không tồn tại");
            }

            // Update fields
            if (dto.SettlementDate.HasValue)
                tatToan.SettlementDate = dto.SettlementDate.Value;
            if (dto.DepositRefund.HasValue)
                tatToan.DepositRefund = dto.DepositRefund;
            if (dto.OutstandingDebt.HasValue)
                tatToan.OutstandingDebt = dto.OutstandingDebt;
            if (dto.Compensation.HasValue)
                tatToan.Compensation = dto.Compensation;
            if (dto.Deductions.HasValue)
                tatToan.Deductions = dto.Deductions;
            if (!string.IsNullOrEmpty(dto.ResidentSignature))
                tatToan.ResidentSignature = dto.ResidentSignature;
            if (!string.IsNullOrEmpty(dto.ManagerSignature))
                tatToan.ManagerSignature = dto.ManagerSignature;
            if (!string.IsNullOrEmpty(dto.Status))
                tatToan.Status = dto.Status;

            // Recalculate total
            tatToan.TotalSettlement = CalculateTotalSettlement(
                tatToan.DepositRefund ?? 0,
                tatToan.OutstandingDebt ?? 0,
                tatToan.Compensation ?? 0,
                tatToan.Deductions ?? 0
            );

            // Update details if provided
            if (dto.Details != null)
            {
                // Delete old details
                await _detailRepository.DeleteBySettlementIdAsync(id);

                // Create new details
                foreach (var detailDto in dto.Details)
                {
                    var detail = new ChiTietPhieuTatToan
                    {
                        SettlementId = id,
                        Description = detailDto.Description,
                        Amount = detailDto.Amount,
                        Type = detailDto.Type,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _detailRepository.CreateAsync(detail);
                }
            }

            var updated = await _tatToanRepository.UpdateAsync(tatToan);
            
            // Reload to get details
            var result = await _tatToanRepository.GetByIdAsync(updated.Id);
            return MapToDto(result!);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _tatToanRepository.DeleteAsync(id);
        }

        private decimal CalculateTotalSettlement(
            decimal depositRefund,
            decimal outstandingDebt,
            decimal compensation,
            decimal deductions)
        {
            // TotalSettlement = DepositRefund - OutstandingDebt + Compensation - Deductions
            return depositRefund - outstandingDebt + compensation - deductions;
        }

        private TatToanDto MapToDto(TatToan tatToan)
        {
            var mainResident = tatToan.Residency?.ChiTietOs?.FirstOrDefault(c => c.ResidencyRole == "Người thuê")?.Resident
                ?? tatToan.Residency?.ChiTietOs?.FirstOrDefault(c => c.ResidencyRole == "Người thuê chính")?.Resident
                ?? tatToan.Residency?.ChiTietOs?.FirstOrDefault()?.Resident;
            
            return new TatToanDto
            {
                Id = tatToan.Id,
                ResidencyId = tatToan.ResidencyId,
                SettlementDate = tatToan.SettlementDate,
                DepositRefund = tatToan.DepositRefund,
                OutstandingDebt = tatToan.OutstandingDebt,
                Compensation = tatToan.Compensation,
                Deductions = tatToan.Deductions,
                TotalSettlement = tatToan.TotalSettlement,
                ResidentSignature = tatToan.ResidentSignature,
                ManagerSignature = tatToan.ManagerSignature,
                Status = tatToan.Status,
                CreatedAt = tatToan.CreatedAt,
                UpdatedAt = tatToan.UpdatedAt,
                RoomNumber = tatToan.Residency?.Room?.RoomCode,
                ResidentName = mainResident?.FullName,
                ResidentPhone = mainResident?.PhoneNumber,
                Details = tatToan.Details?.Select(d => new ChiTietPhieuTatToanDto
                {
                    Id = d.Id,
                    SettlementId = d.SettlementId,
                    Description = d.Description,
                    Amount = d.Amount,
                    Type = d.Type,
                    CreatedAt = d.CreatedAt
                }).ToList() ?? new List<ChiTietPhieuTatToanDto>()
            };
        }
    }
}
