using backend.DTOs;
using backend.Data;
using backend.Repositories;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public interface ITatToanService
    {
        Task<IEnumerable<TatToanDto>> GetAllAsync(int ownerUserId);
        Task<TatToanDto?> GetByIdAsync(int id, int ownerUserId);
        Task<IEnumerable<TatToanDto>> GetByResidencyIdAsync(int residencyId, int ownerUserId);
        Task<IEnumerable<TatToanDto>> GetByStatusAsync(string status, int ownerUserId);
        Task<TatToanDto> CreateAsync(CreateTatToanDto dto, int ownerUserId);
        Task<TatToanDto> UpdateAsync(int id, UpdateTatToanDto dto, int ownerUserId);
        Task<bool> DeleteAsync(int id, int ownerUserId);
    }

    public class TatToanService : ITatToanService
    {
        private const string ActivePostStatus = "active";
        private const string AvailableRoomStatus = "Trống";

        private readonly ITatToanRepository _tatToanRepository;
        private readonly IChiTietPhieuTatToanRepository _detailRepository;
        private readonly IHopDongRepository _hopDongRepository;
        private readonly IRoomRepository _roomRepository;
        private readonly IChiTietORepository _chiTietORepository;
        private readonly IChiTietSuDungDichVuRepository _chiTietSuDungDichVuRepository;
        private readonly ApplicationDbContext _context;

        public TatToanService(
            ITatToanRepository tatToanRepository,
            IChiTietPhieuTatToanRepository detailRepository,
            IHopDongRepository hopDongRepository,
            IRoomRepository roomRepository,
            IChiTietORepository chiTietORepository,
            IChiTietSuDungDichVuRepository chiTietSuDungDichVuRepository,
            ApplicationDbContext context)
        {
            _tatToanRepository = tatToanRepository;
            _detailRepository = detailRepository;
            _hopDongRepository = hopDongRepository;
            _roomRepository = roomRepository;
            _chiTietORepository = chiTietORepository;
            _chiTietSuDungDichVuRepository = chiTietSuDungDichVuRepository;
            _context = context;
        }

        public async Task<IEnumerable<TatToanDto>> GetAllAsync(int ownerUserId)
        {
            var tatToans = await _tatToanRepository.GetAllAsync(ownerUserId);
            return tatToans.Select(MapToDto);
        }

        public async Task<TatToanDto?> GetByIdAsync(int id, int ownerUserId)
        {
            var tatToan = await _tatToanRepository.GetByIdAsync(id, ownerUserId);
            return tatToan == null ? null : MapToDto(tatToan);
        }

        public async Task<IEnumerable<TatToanDto>> GetByResidencyIdAsync(int residencyId, int ownerUserId)
        {
            var tatToans = await _tatToanRepository.GetByResidencyIdAsync(residencyId, ownerUserId);
            return tatToans.Select(MapToDto);
        }

        public async Task<IEnumerable<TatToanDto>> GetByStatusAsync(string status, int ownerUserId)
        {
            var tatToans = await _tatToanRepository.GetByStatusAsync(status, ownerUserId);
            return tatToans.Select(MapToDto);
        }

        public async Task<TatToanDto> CreateAsync(CreateTatToanDto dto, int ownerUserId)
        {
            // Validate residency exists
            var residency = await _context.HopDongs
                .Include(contract => contract.Room)
                    .ThenInclude(room => room.Floor)
                        .ThenInclude(floor => floor.Building)
                .FirstOrDefaultAsync(contract =>
                    contract.Id == dto.ResidencyId &&
                    contract.Room.Floor.Building.OwnerUserId == ownerUserId);
            if (residency == null)
            {
                throw new Exception("Hợp đồng không tồn tại");
            }

            var currentOutstandingDebt = await CalculateCurrentOutstandingDebtAsync(dto.ResidencyId);

            // Calculate total settlement
            var totalSettlement = CalculateTotalSettlement(
                dto.DepositRefund ?? 0,
                currentOutstandingDebt,
                dto.Compensation ?? 0,
                dto.Deductions ?? 0
            );

            var tatToan = new TatToan
            {
                ResidencyId = dto.ResidencyId,
                SettlementDate = dto.SettlementDate,
                DepositRefund = dto.DepositRefund,
                OutstandingDebt = currentOutstandingDebt,
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

            if (IsSettlementCompleted(created.Status))
            {
                await FinalizeContractAfterSettlementAsync(created.ResidencyId, created.SettlementDate);
            }

            // Reload to get details
            var result = await _tatToanRepository.GetByIdAsync(created.Id, ownerUserId);
            return MapToDto(result!);
        }

        public async Task<TatToanDto> UpdateAsync(int id, UpdateTatToanDto dto, int ownerUserId)
        {
            var tatToan = await _tatToanRepository.GetByIdAsync(id, ownerUserId);
            if (tatToan == null)
            {
                throw new Exception("Phiếu tất toán không tồn tại");
            }

            // Update fields
            if (dto.SettlementDate.HasValue)
                tatToan.SettlementDate = dto.SettlementDate.Value;
            if (dto.DepositRefund.HasValue)
                tatToan.DepositRefund = dto.DepositRefund;
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

            tatToan.OutstandingDebt = await CalculateCurrentOutstandingDebtAsync(tatToan.ResidencyId);

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

            if (IsSettlementCompleted(updated.Status))
            {
                await FinalizeContractAfterSettlementAsync(updated.ResidencyId, updated.SettlementDate);
            }
            
            // Reload to get details
            var result = await _tatToanRepository.GetByIdAsync(updated.Id, ownerUserId);
            return MapToDto(result!);
        }

        public async Task<bool> DeleteAsync(int id, int ownerUserId)
        {
            return await _tatToanRepository.DeleteAsync(id, ownerUserId);
        }

        private decimal CalculateTotalSettlement(
            decimal depositRefund,
            decimal outstandingDebt,
            decimal compensation,
            decimal deductions)
        {
            // Công thức tất toán: tiền cọc +- tiền phòng +- tiền dịch vụ (+ bồi thường) - khấu trừ.
            // Ở đây OutstandingDebt là tổng nợ phòng + nợ dịch vụ.
            return depositRefund - outstandingDebt + compensation - deductions;
        }

        private async Task<decimal> CalculateCurrentOutstandingDebtAsync(int contractId)
        {
            var invoices = await _context.HoaDons
                .Include(hd => hd.ThanhToans)
                .Where(hd => hd.ContractId == contractId &&
                    (hd.Status == "Chưa thanh toán" || hd.Status == "Đã thanh toán một phần"))
                .ToListAsync();

            var totalOutstanding = invoices.Sum(invoice =>
            {
                var paidAmount = invoice.ThanhToans
                    .Where(payment => payment.Status == "SUCCESS")
                    .Sum(payment => payment.Amount);

                var remaining = invoice.TotalAmount - paidAmount;
                return remaining > 0 ? remaining : 0;
            });

            return totalOutstanding;
        }

        private static bool IsSettlementCompleted(string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return false;
            }

            var normalized = status.Trim().ToLowerInvariant();
            return normalized is "completed" or "hoàn thành" or "hoan thanh" or "da hoan tien";
        }

        private async Task FinalizeContractAfterSettlementAsync(int contractId, DateTime settlementDate)
        {
            var contract = await _hopDongRepository.GetWithDetailsAsync(contractId);
            if (contract == null)
            {
                return;
            }

            var endDate = settlementDate.Date.AddDays(-1);

            contract.ExpectedEndDate = endDate;
            _hopDongRepository.Update(contract);

            var shouldReleaseRoom = !await HasActiveRoomContractAsync(contract.RoomId, contract.Id);
            var room = await _roomRepository.GetByIdAsync(contract.RoomId);
            if (room != null && shouldReleaseRoom)
            {
                room.Status = AvailableRoomStatus;
                _roomRepository.Update(room);
                await UnlockRoomPostsAsync(room.Id, room.Status);
            }

            var occupancies = await _chiTietORepository.GetByContractIdAsync(contract.Id);
            foreach (var occupancy in occupancies)
            {
                if (!occupancy.ToDate.HasValue || occupancy.ToDate.Value > endDate)
                {
                    occupancy.ToDate = endDate;
                    _chiTietORepository.Update(occupancy);
                }
            }

            var serviceUsages = await _chiTietSuDungDichVuRepository.GetByRoomIdAsync(contract.RoomId);
            foreach (var usage in serviceUsages)
            {
                if (!usage.ApplyTo.HasValue || usage.ApplyTo.Value > endDate)
                {
                    usage.ApplyTo = endDate;
                    _chiTietSuDungDichVuRepository.Update(usage);
                }
            }

            await _hopDongRepository.SaveChangesAsync();
        }

        private async Task UnlockRoomPostsAsync(int roomId, string roomStatus)
        {
            var posts = await _context.BaiDangTimPhongs
                .Where(post => post.RoomId == roomId)
                .ToListAsync();

            foreach (var post in posts)
            {
                post.IsLocked = false;
                post.Status = ActivePostStatus;
                post.RoomStatus = roomStatus;
            }
        }

        private Task<bool> HasActiveRoomContractAsync(int roomId, int? excludingContractId = null)
        {
            var now = DateTime.UtcNow;
            return _context.HopDongs.AnyAsync(contract =>
                contract.RoomId == roomId
                && (!excludingContractId.HasValue || contract.Id != excludingContractId.Value)
                && (contract.ExpectedEndDate == null || contract.ExpectedEndDate > now));
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
