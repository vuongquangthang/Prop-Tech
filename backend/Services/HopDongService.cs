using backend.DTOs;
using backend.Models;
using backend.Repositories;
using backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Text;

namespace backend.Services;

public interface IHopDongService
{
    Task<List<HopDongDto>> GetAllAsync();
    Task<List<HopDongDto>> GetByRoomIdAsync(int roomId);
    Task<List<HopDongDto>> GetActiveContractsAsync();
    Task<HopDongDto?> GetByIdAsync(int id);
    Task<HopDongDto> CreateAsync(CreateHopDongDto dto);
    Task<HopDongDto> UpdateAsync(int id, UpdateHopDongDto dto, int? changedByUserId = null);
    Task<HopDongDto> ExtendAsync(int id, ExtendHopDongDto dto);
    Task<List<ContractEditHistoryDto>> GetEditHistoryAsync(int id);
    Task DeleteAsync(int id);
    Task SendContractChangeProposalAsync(int contractId, SendContractChangeProposalDto dto, int senderUserId);
    Task<ContractChangeDetailDto> GetContractChangeDetailAsync(int notificationId, int userId);
    Task<List<ContractChangeTrackingItemDto>> GetContractChangeTrackingAsync(string? status, int limit = 200);
    Task ConfirmContractChangeAsync(int notificationId, int userId);
    Task RequestContractChangeDiscussionAsync(int notificationId, int userId, string? message);
}

public class HopDongService : IHopDongService
{
    private const string ActivePostStatus = "active";
    private const string PausedPostStatus = "paused";
    private const string DeletedPostStatus = "deleted";
    private const string OccupiedRoomStatus = "Đã thuê";
    private const string AvailableRoomStatus = "Trống";

    private readonly IHopDongRepository _hopDongRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly IResidentRepository _residentRepository;
    private readonly IServiceRepository _serviceRepository;
    private readonly IChiTietSuDungDichVuRepository _chiTietSuDungDichVuRepository;
    private readonly IChiTietORepository _chiTietORepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationService _notificationService;
    private readonly IEmailService _emailService;
    private readonly ILogger<HopDongService> _logger;
    private readonly ApplicationDbContext _context;

    // Thong tin tai khoan cu dan vua tao tu dong (de gui email). Gom trong 1 luot tao HD.
    private readonly List<NewResidentAccount> _pendingAccountEmails = new();

    private sealed record NewResidentAccount(string Email, string FullName, string PhoneNumber, string PlainPassword);

    public HopDongService(
        IHopDongRepository hopDongRepository,
        IRoomRepository roomRepository,
        IResidentRepository residentRepository,
        IServiceRepository serviceRepository,
        IChiTietSuDungDichVuRepository chiTietSuDungDichVuRepository,
        IChiTietORepository chiTietORepository,
        IUserRepository userRepository,
        INotificationRepository notificationRepository,
        INotificationService notificationService,
        IEmailService emailService,
        ILogger<HopDongService> logger,
        ApplicationDbContext context)
    {
        _hopDongRepository = hopDongRepository;
        _roomRepository = roomRepository;
        _residentRepository = residentRepository;
        _serviceRepository = serviceRepository;
        _chiTietSuDungDichVuRepository = chiTietSuDungDichVuRepository;
        _chiTietORepository = chiTietORepository;
        _userRepository = userRepository;
        _notificationRepository = notificationRepository;
        _notificationService = notificationService;
        _emailService = emailService;
        _logger = logger;
        _context = context;
    }

    private sealed class ContractChangeEnvelope
    {
        public string Status { get; set; } = "PENDING";
        public DateTime CreatedAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? DiscussedAt { get; set; }
        public int ContractId { get; set; }
        public string? ContractCode { get; set; }
        public int RoomId { get; set; }
        public string? RoomNumber { get; set; }
        public decimal CurrentRentPrice { get; set; }
        public DateTime EffectiveDate { get; set; }
        public decimal? ProposedRentPrice { get; set; }
        public List<ServicePriceChangeDto> ServicePriceChanges { get; set; } = new();
        public List<int> AddedServiceIds { get; set; } = new();
        public List<int> RemovedServiceIds { get; set; } = new();
        public string? Note { get; set; }
        public string? ResidentMessage { get; set; }
        public int SenderUserId { get; set; }
    }

    public async Task<List<HopDongDto>> GetAllAsync()
    {
        var contracts = await _hopDongRepository.GetAllAsync();
        return contracts.Select(MapToDto).ToList();
    }

    public async Task<List<HopDongDto>> GetByRoomIdAsync(int roomId)
    {
        var contracts = await _hopDongRepository.GetByRoomIdAsync(roomId);
        return contracts.Select(MapToDto).ToList();
    }

    public async Task<List<HopDongDto>> GetActiveContractsAsync()
    {
        var contracts = await _hopDongRepository.GetActiveContractsAsync();
        return contracts.Select(MapToDto).ToList();
    }

    public async Task<HopDongDto?> GetByIdAsync(int id)
    {
        var contract = await _hopDongRepository.GetWithDetailsAsync(id);
        return contract == null ? null : MapToDto(contract);
    }

    public async Task<HopDongDto> CreateAsync(CreateHopDongDto dto)
    {
        if (dto.Residents == null || dto.Residents.Count == 0)
        {
            throw new InvalidOperationException("Hợp đồng phải có ít nhất 1 cư dân");
        }

        var duplicateResident = dto.Residents
            .GroupBy(r => r.ResidentId)
            .FirstOrDefault(g => g.Count() > 1);
        if (duplicateResident != null)
        {
            throw new InvalidOperationException("Danh sách cư dân bị trùng lặp");
        }

        if (dto.ExpectedEndDate.HasValue && dto.ExpectedEndDate.Value.Date < dto.StartDate.Date)
        {
            throw new InvalidOperationException("Ngày kết thúc dự kiến không được nhỏ hơn ngày bắt đầu");
        }

        // Validate room exists
        var room = await _roomRepository.GetByIdAsync(dto.RoomId);
        if (room == null)
        {
            throw new InvalidOperationException("Phòng không tồn tại");
        }

        // FIX #2: Check room status is "Trống" (empty) BEFORE creating contract
        if (room.Status != "Trống")
        {
            throw new InvalidOperationException($"Phòng hiện tại ở trạng thái '{room.Status}' (cần phải 'Trống')");
        }

        // Check if room already has an active contract
        var activeContract = await _hopDongRepository.GetActiveByRoomIdAsync(dto.RoomId);
        if (activeContract != null)
        {
            throw new InvalidOperationException("Phòng đã có hợp đồng đang hoạt động");
        }

        // Validate all residents exist
        foreach (var residentDto in dto.Residents)
        {
            var resident = await _residentRepository.GetByIdAsync(residentDto.ResidentId);
            if (resident == null)
            {
                throw new InvalidOperationException($"Cư dân ID {residentDto.ResidentId} không tồn tại");
            }
        }

        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
        // Reset danh sach email gom (phong truong hop ExecutionStrategy retry lan 2).
        _pendingAccountEmails.Clear();
        // FIX #1: Use database transaction for atomic operation (ALL-or-NOTHING)
        using (var transaction = await _context.Database.BeginTransactionAsync())
        {
            try
            {
                // Create contract
                var contract = new HopDong
                {
                    RoomId = dto.RoomId,
                    ContractCode = await GenerateContractCodeAsync(dto.StartDate.Year),
                    StartDate = dto.StartDate,
                    ExpectedEndDate = dto.ExpectedEndDate,
                    ActualRentPrice = dto.ActualRentPrice,
                    DepositAmount = dto.DepositAmount,
                    DepositPaid = dto.DepositPaid,
                    PaymentDayOfMonth = dto.PaymentDayOfMonth,
                    BillingFormulaJson = SerializeBillingFormula(dto.BillingFormulaItems)
                };

                await _hopDongRepository.AddAsync(contract);
                // Save now to get ContractId for ChiTietO (composite key requires known FK)
                await _hopDongRepository.SaveChangesAsync();

                if (contract.Id <= 0)
                {
                    throw new InvalidOperationException("Không thể tạo hợp đồng: ContractId chưa được sinh");
                }

                // Persist ChiTietO records explicitly to avoid missing residents in detail views.
                foreach (var residentDto in dto.Residents)
                {
                    var chiTietO = new ChiTietO
                    {
                        ContractId = contract.Id,
                        ResidentId = residentDto.ResidentId,
                        ResidencyRole = residentDto.ResidencyRole,
                        FromDate = residentDto.FromDate
                    };
                    await _chiTietORepository.AddAsync(chiTietO);
                }

                // Persist contract + residency details before any other SaveChanges (e.g., user creation)
                await _hopDongRepository.SaveChangesAsync();

                // Auto-create default service usages so monthly invoice calculation has baseline services.
                var selectedServiceIds = dto.SelectedServiceIds
                    .Where(id => id > 0)
                    .Distinct()
                    .ToHashSet();

                var activeServices = (await _serviceRepository.GetActiveServicesAsync()).ToList();
                var defaultServices = activeServices
                    .Where(s => selectedServiceIds.Contains(s.Id))
                    .Where(IsAutoAssignableDefaultService)
                    .ToList();

                var primaryResident = dto.Residents
                    .FirstOrDefault(r => r.ResidencyRole == "Người thuê chính" || r.ResidencyRole == "Chủ hộ" || r.ResidencyRole == "Chủ phòng")
                    ?? dto.Residents.FirstOrDefault(r => r.ResidencyRole == "Người thuê")
                    ?? dto.Residents.First();

                var primaryResidentId = primaryResident.ResidentId;

                await EnsureResidentAccountsAsync(dto.Residents);

                if (defaultServices.Count > 0)
                {
                    var existingUsages = (await _chiTietSuDungDichVuRepository.GetByRoomIdAsync(dto.RoomId)).ToList();

                    foreach (var service in defaultServices)
                    {
                        var hasOverlap = existingUsages.Any(u =>
                            u.ServiceId == service.Id
                            && u.ApplyFrom <= (dto.ExpectedEndDate ?? DateTime.MaxValue)
                            && (u.ApplyTo == null || u.ApplyTo >= dto.StartDate));

                        if (hasOverlap)
                        {
                            continue;
                        }

                        await _chiTietSuDungDichVuRepository.AddAsync(new ChiTietSuDungDichVu
                        {
                            ServiceId = service.Id,
                            ResidentId = primaryResidentId,
                            RoomId = dto.RoomId,
                            ApplyFrom = dto.StartDate,
                            ApplyTo = dto.ExpectedEndDate,
                            Quantity = 1,
                            CreatedAt = DateTime.UtcNow,
                            Note = $"Tự động tạo khi phát sinh hợp đồng {contract.ContractCode}"
                        });
                    }
                }

                // Update room status and related listings atomically with contract creation.
                room.Status = OccupiedRoomStatus;
                _roomRepository.Update(room);
                await LockRoomPostsAsync(room.Id, room.Status);

                // SINGLE SaveChangesAsync at the end - either all succeed or all rollback
                await _hopDongRepository.SaveChangesAsync();

                // Commit transaction
                await transaction.CommitAsync();

                // Gui email thong tin tai khoan cho cu dan SAU khi commit thanh cong
                // (tranh gui mail roi transaction bi rollback). Loi mail khong chan.
                await SendPendingAccountEmailsAsync();

                // Reload to get navigation properties
                var createdContract = await _hopDongRepository.GetWithDetailsAsync(contract.Id);
                return MapToDto(createdContract!);
            }
            catch
            {
                // Transaction will auto-rollback on exception
                _pendingAccountEmails.Clear(); // bo cac email gom duoc vi HD khong duoc tao
                await transaction.RollbackAsync();
                throw;
            }
        }
        });
    }

    public async Task<HopDongDto> UpdateAsync(int id, UpdateHopDongDto dto, int? changedByUserId = null)
    {
        var contract = await _hopDongRepository.GetWithDetailsAsync(id);
        if (contract == null)
        {
            throw new InvalidOperationException("Hợp đồng không tồn tại");
        }

        var existingHistoryCount = await _context.ContractEditHistories.CountAsync(item => item.ContractId == id);
        if (existingHistoryCount == 0)
        {
            _context.ContractEditHistories.Add(new ContractEditHistory
            {
                ContractId = id,
                Version = 1,
                Summary = "Phiên bản hợp đồng trước lần chỉnh sửa đầu tiên",
                SnapshotJson = SerializeContractSnapshot(contract),
                ChangedByUserId = changedByUserId,
                ChangedByName = await ResolveChangedByNameAsync(changedByUserId),
                ChangedAt = contract.UpdatedAt ?? contract.StartDate
            });
        }

        if (dto.StartDate.HasValue)
            contract.StartDate = dto.StartDate.Value;

        if (dto.ExpectedEndDate.HasValue)
            contract.ExpectedEndDate = dto.ExpectedEndDate;

        if (dto.ActualRentPrice.HasValue)
            contract.ActualRentPrice = dto.ActualRentPrice.Value;

        if (dto.DepositAmount.HasValue)
            contract.DepositAmount = dto.DepositAmount;

        if (dto.DepositPaid.HasValue)
            contract.DepositPaid = dto.DepositPaid.Value;

        if (dto.PaymentDayOfMonth.HasValue)
            contract.PaymentDayOfMonth = dto.PaymentDayOfMonth;

        if (dto.BillingFormulaItems != null && dto.BillingFormulaItems.Count > 0)
        {
            contract.BillingFormulaJson = SerializeBillingFormula(dto.BillingFormulaItems);
        }
        else if (!string.IsNullOrWhiteSpace(dto.BillingFormulaJson))
        {
            contract.BillingFormulaJson = dto.BillingFormulaJson;
        }

        // Sync selected services to ChiTietSuDungDichVu so contract detail and billing stay consistent.
        var selectedServiceIds = (dto.SelectedServiceIds ?? new List<int>())
            .Where(x => x > 0)
            .Distinct()
            .ToHashSet();

        if (selectedServiceIds.Count == 0 && dto.BillingFormulaItems != null)
        {
            foreach (var sid in dto.BillingFormulaItems
                .Where(x => x.ServiceId.HasValue && x.ServiceId.Value > 0)
                .Select(x => x.ServiceId!.Value)
                .Distinct())
            {
                selectedServiceIds.Add(sid);
            }
        }

        if (selectedServiceIds.Count > 0)
        {
            var effectiveDate = (dto.StartDate ?? contract.StartDate).Date;
            var primaryResidentId = contract.ChiTietOs
                .OrderBy(ct => ct.ResidencyRole == "Người thuê chính" ? 0 : 1)
                .Select(ct => ct.ResidentId)
                .FirstOrDefault();

            var allUsages = (await _chiTietSuDungDichVuRepository.GetByRoomIdAsync(contract.RoomId)).ToList();
            var activeUsagesAtEffectiveDate = allUsages
                .Where(u => u.ApplyFrom.Date <= effectiveDate && (u.ApplyTo == null || u.ApplyTo.Value.Date >= effectiveDate))
                .ToList();

            var activeServiceIds = activeUsagesAtEffectiveDate
                .Select(u => u.ServiceId)
                .Distinct()
                .ToHashSet();

            var formulaQtyMap = (dto.BillingFormulaItems ?? new List<BillingFormulaItemDto>())
                .Where(x => x.ServiceId.HasValue && x.ServiceId.Value > 0)
                .GroupBy(x => x.ServiceId!.Value)
                .ToDictionary(g => g.Key, g => g.First().Quantity ?? 1m);

            var addServiceIds = selectedServiceIds.Except(activeServiceIds).ToList();
            var removeServiceIds = activeServiceIds.Except(selectedServiceIds).ToList();

            foreach (var serviceId in addServiceIds)
            {
                if (primaryResidentId <= 0)
                {
                    continue;
                }

                var quantity = formulaQtyMap.TryGetValue(serviceId, out var q) ? q : 1m;
                await _chiTietSuDungDichVuRepository.AddAsync(new ChiTietSuDungDichVu
                {
                    ServiceId = serviceId,
                    ResidentId = primaryResidentId,
                    RoomId = contract.RoomId,
                    ApplyFrom = effectiveDate,
                    ApplyTo = contract.ExpectedEndDate,
                    Quantity = quantity <= 0 ? 1m : quantity,
                    CreatedAt = DateTime.UtcNow,
                    Note = $"Cập nhật theo sửa hợp đồng {contract.ContractCode}"
                });
            }

            if (removeServiceIds.Count > 0)
            {
                var removalBoundary = effectiveDate.AddDays(-1);
                foreach (var usage in activeUsagesAtEffectiveDate.Where(u => removeServiceIds.Contains(u.ServiceId)))
                {
                    usage.ApplyTo = removalBoundary;
                    _chiTietSuDungDichVuRepository.Update(usage);
                }
            }

            foreach (var usage in activeUsagesAtEffectiveDate.Where(u => selectedServiceIds.Contains(u.ServiceId)))
            {
                if (formulaQtyMap.TryGetValue(usage.ServiceId, out var q))
                {
                    usage.Quantity = q <= 0 ? 1m : q;
                    _chiTietSuDungDichVuRepository.Update(usage);
                }
            }
        }

        // Sync residents for edit-contract flow (add/remove members in contract detail).
        if (dto.Residents != null && dto.Residents.Count > 0)
        {
            var residentDtos = dto.Residents
                .Where(r => r.ResidentId > 0)
                .GroupBy(r => r.ResidentId)
                .Select(g => g.First())
                .ToList();

            foreach (var residentDto in residentDtos)
            {
                var resident = await _residentRepository.GetByIdAsync(residentDto.ResidentId);
                if (resident == null)
                {
                    throw new InvalidOperationException($"Cư dân ID {residentDto.ResidentId} không tồn tại");
                }
            }

            var existingResidents = await _chiTietORepository.GetByContractIdAsync(contract.Id);
            var activeResidents = existingResidents.Where(x => x.ToDate == null).ToList();
            var desiredResidentIds = residentDtos.Select(x => x.ResidentId).ToHashSet();
            var syncDate = (dto.StartDate ?? contract.StartDate).Date;
            var syncedActiveResidents = new List<ChiTietO>();

            foreach (var active in activeResidents)
            {
                if (desiredResidentIds.Contains(active.ResidentId))
                {
                    continue;
                }

                active.ToDate = syncDate.AddDays(-1);
                _chiTietORepository.Update(active);
            }

            foreach (var residentDto in residentDtos)
            {
                var existingActive = activeResidents.FirstOrDefault(x => x.ResidentId == residentDto.ResidentId);
                if (existingActive != null)
                {
                    existingActive.ResidencyRole = residentDto.ResidencyRole;
                    _chiTietORepository.Update(existingActive);
                    syncedActiveResidents.Add(existingActive);
                    continue;
                }

                var existingInactive = existingResidents.FirstOrDefault(x => x.ResidentId == residentDto.ResidentId);
                if (existingInactive != null)
                {
                    existingInactive.ResidencyRole = residentDto.ResidencyRole;
                    existingInactive.FromDate = residentDto.FromDate == default ? syncDate : residentDto.FromDate;
                    existingInactive.ToDate = null;
                    _chiTietORepository.Update(existingInactive);
                    syncedActiveResidents.Add(existingInactive);
                    continue;
                }

                var newResidency = new ChiTietO
                {
                    ContractId = contract.Id,
                    ResidentId = residentDto.ResidentId,
                    ResidencyRole = residentDto.ResidencyRole,
                    FromDate = residentDto.FromDate == default ? syncDate : residentDto.FromDate,
                    ToDate = null
                };

                await _chiTietORepository.AddAsync(newResidency);
                syncedActiveResidents.Add(newResidency);
            }

            var promotedResident = PromotePrimaryResidentIfMissing(syncedActiveResidents);
            if (promotedResident != null)
            {
                _chiTietORepository.Update(promotedResident);
            }

            await EnsureResidentAccountsAsync(residentDtos);
        }

        contract.UpdatedAt = DateTime.UtcNow;
        _hopDongRepository.Update(contract);
        await _hopDongRepository.SaveChangesAsync();

        var updatedContract = await _hopDongRepository.GetWithDetailsAsync(id);
        var currentVersion = await _context.ContractEditHistories
            .Where(item => item.ContractId == id)
            .MaxAsync(item => (int?)item.Version) ?? 0;
        var nextVersion = currentVersion + 1;
        _context.ContractEditHistories.Add(new ContractEditHistory
        {
            ContractId = id,
            Version = nextVersion,
            Summary = BuildEditSummary(dto),
            SnapshotJson = SerializeContractSnapshot(updatedContract!),
            ChangedByUserId = changedByUserId,
            ChangedByName = await ResolveChangedByNameAsync(changedByUserId),
            ChangedAt = contract.UpdatedAt.Value
        });
        await _context.SaveChangesAsync();
        return MapToDto(updatedContract!);
    }

    public async Task<List<ContractEditHistoryDto>> GetEditHistoryAsync(int id)
    {
        var histories = await _context.ContractEditHistories
            .AsNoTracking()
            .Where(item => item.ContractId == id)
            .OrderByDescending(item => item.Version)
            .ToListAsync();

        var currentVersion = histories.Count == 0 ? 0 : histories.Max(item => item.Version);
        return histories.Select(item => new ContractEditHistoryDto
        {
            Id = item.Id,
            Version = item.Version,
            Summary = item.Summary,
            SnapshotJson = item.SnapshotJson,
            ChangedByUserId = item.ChangedByUserId,
            ChangedByName = item.ChangedByName,
            ChangedAt = item.ChangedAt,
            IsCurrent = item.Version == currentVersion
        }).ToList();
    }

    public async Task<HopDongDto> ExtendAsync(int id, ExtendHopDongDto dto)
    {
        var contract = await _hopDongRepository.GetWithDetailsAsync(id);
        if (contract == null)
        {
            throw new InvalidOperationException("Hợp đồng không tồn tại");
        }

        if (!contract.ExpectedEndDate.HasValue)
        {
            throw new InvalidOperationException("Hợp đồng chưa có ngày kết thúc để gia hạn");
        }

        var currentEndDate = contract.ExpectedEndDate.Value.Date;
        var newEndDate = dto.NewEndDate.Date;
        if (newEndDate <= currentEndDate)
        {
            throw new InvalidOperationException("Ngày kết thúc mới phải sau ngày kết thúc hiện tại");
        }

        var hasCompletedSettlement = await _context.TatToans
            .AsNoTracking()
            .AnyAsync(item =>
                item.ResidencyId == id
                && (item.Status == "Completed"
                    || item.Status == "Hoàn thành"
                    || item.Status == "Da hoan tien"));
        if (hasCompletedSettlement)
        {
            throw new InvalidOperationException("Hợp đồng đã tất toán nên không thể gia hạn");
        }

        var hasOverlappingContract = await _context.HopDongs
            .AsNoTracking()
            .AnyAsync(item =>
                item.Id != id
                && item.RoomId == contract.RoomId
                && item.StartDate <= newEndDate
                && (item.ExpectedEndDate == null || item.ExpectedEndDate >= currentEndDate.AddDays(1)));
        if (hasOverlappingContract)
        {
            throw new InvalidOperationException("Phòng đã có hợp đồng khác trong thời gian muốn gia hạn");
        }

        var endBoundary = currentEndDate.AddDays(1);
        var serviceUsages = await _context.ChiTietSuDungDichVus
            .Where(item =>
                item.RoomId == contract.RoomId
                && item.ApplyTo.HasValue
                && item.ApplyTo.Value >= currentEndDate
                && item.ApplyTo.Value < endBoundary)
            .ToListAsync();

        foreach (var usage in serviceUsages)
        {
            usage.ApplyTo = newEndDate;
        }

        contract.ExpectedEndDate = newEndDate;
        contract.UpdatedAt = DateTime.UtcNow;
        _hopDongRepository.Update(contract);
        await _hopDongRepository.SaveChangesAsync();

        var updatedContract = await _hopDongRepository.GetWithDetailsAsync(id);
        return MapToDto(updatedContract!);
    }

    public async Task DeleteAsync(int id)
    {
        var contract = await _hopDongRepository.GetByIdAsync(id);
        if (contract == null)
        {
            throw new InvalidOperationException("Hợp đồng không tồn tại");
        }

        // Check if contract has invoices
        var hasInvoices = await _hopDongRepository.AnyAsync(c => c.Id == id && c.HoaDons.Any());
        if (hasInvoices)
        {
            throw new InvalidOperationException("Không thể xóa hợp đồng đã có hóa đơn");
        }

        var shouldReleaseRoom = !await HasActiveRoomContractAsync(contract.RoomId, contract.Id);
        var room = await _roomRepository.GetByIdAsync(contract.RoomId);
        if (room != null && shouldReleaseRoom)
        {
            room.Status = AvailableRoomStatus;
            _roomRepository.Update(room);
            await UnlockRoomPostsAsync(room.Id, room.Status);
        }

        _hopDongRepository.Remove(contract);
        await _hopDongRepository.SaveChangesAsync();
    }

    public async Task SendContractChangeProposalAsync(int contractId, SendContractChangeProposalDto dto, int senderUserId)
    {
        var contract = await _hopDongRepository.GetWithDetailsAsync(contractId)
            ?? throw new InvalidOperationException("Hợp đồng không tồn tại");

        if (dto.EffectiveDate == default)
        {
            throw new InvalidOperationException("Ngày áp dụng không hợp lệ");
        }

        var serviceIds = dto.ServicePriceChanges.Select(x => x.ServiceId)
            .Concat(dto.AddedServiceIds)
            .Concat(dto.RemovedServiceIds)
            .Where(x => x > 0)
            .Distinct()
            .ToList();
        var serviceMap = (await _serviceRepository.GetAllAsync())
            .Where(s => serviceIds.Contains(s.Id))
            .ToDictionary(s => s.Id, s => s);

        foreach (var p in dto.ServicePriceChanges)
        {
            if (!serviceMap.ContainsKey(p.ServiceId))
            {
                throw new InvalidOperationException($"Dịch vụ ID {p.ServiceId} không tồn tại");
            }

            if (p.NewPrice <= 0)
            {
                throw new InvalidOperationException("Giá dịch vụ mới phải lớn hơn 0");
            }
        }

        var envelope = new ContractChangeEnvelope
        {
            Status = "CONFIRMED",
            CreatedAt = DateTime.UtcNow,
            ConfirmedAt = DateTime.UtcNow,
            ContractId = contract.Id,
            ContractCode = contract.ContractCode,
            RoomId = contract.RoomId,
            RoomNumber = contract.Room?.RoomCode,
            CurrentRentPrice = contract.ActualRentPrice,
            EffectiveDate = dto.EffectiveDate,
            ProposedRentPrice = dto.NewRentPrice,
            ServicePriceChanges = dto.ServicePriceChanges,
            AddedServiceIds = dto.AddedServiceIds.Where(x => x > 0).Distinct().ToList(),
                        RemovedServiceIds = dto.RemovedServiceIds.Where(x => x > 0).Distinct().ToList(),
            Note = dto.Note,
            SenderUserId = senderUserId,
        };

        await ApplyProposalToContractAsync(envelope);

        var ownerUserId = contract.Room?.Floor?.Building?.OwnerUserId
            ?? await ResolveOwnerUserIdForUserAsync(senderUserId);

        await _notificationService.CreateAdminNotificationAsync(
            "Hợp đồng đã được cập nhật",
            $"Đã áp dụng ngay thay đổi cho hợp đồng {contract.ContractCode} (phòng {contract.Room?.RoomCode ?? "không xác định"}).",
            "CONTRACT_CHANGE",
            ownerUserId);
    }

    public async Task<ContractChangeDetailDto> GetContractChangeDetailAsync(int notificationId, int userId)
    {
        var notification = await _notificationRepository.GetByIdWithUserAsync(notificationId)
            ?? throw new InvalidOperationException("Không tìm thấy thông báo");

        if (notification.RecipientId != userId && notification.ScopeType != "ALL")
        {
            throw new InvalidOperationException("Bạn không có quyền xem thông báo này");
        }

        if (!string.Equals(notification.NotificationType, "CONTRACT_CHANGE", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Thông báo không phải thay đổi hợp đồng");
        }

        var envelope = DecodeEnvelope(notification.LinkUrl);

        var serviceIds = envelope.ServicePriceChanges.Select(x => x.ServiceId)
            .Concat(envelope.AddedServiceIds)
            .Concat(envelope.RemovedServiceIds)
            .Where(x => x > 0)
            .Distinct()
            .ToList();
        var serviceMap = (await _serviceRepository.GetAllAsync())
            .Where(s => serviceIds.Contains(s.Id))
            .ToDictionary(s => s.Id, s => s);

        return new ContractChangeDetailDto
        {
            NotificationId = notification.Id,
            Status = envelope.Status,
            CreatedAt = envelope.CreatedAt,
            EffectiveDate = envelope.EffectiveDate,
            ContractId = envelope.ContractId,
            ContractCode = envelope.ContractCode,
            RoomId = envelope.RoomId,
            RoomNumber = envelope.RoomNumber,
            CurrentRentPrice = envelope.CurrentRentPrice,
            ProposedRentPrice = envelope.ProposedRentPrice,
            Note = envelope.Note,
            ResidentMessage = envelope.ResidentMessage,
            ServicePriceChanges = envelope.ServicePriceChanges.Select(x => new ServicePriceChangeDetailDto
            {
                ServiceId = x.ServiceId,
                ServiceName = serviceMap.TryGetValue(x.ServiceId, out var s) ? s.Name : $"Dịch vụ #{x.ServiceId}",
                CurrentPrice = serviceMap.TryGetValue(x.ServiceId, out var s2) ? (s2.CommonUnitPrice ?? 0) : 0,
                NewPrice = x.NewPrice,
            }).ToList(),
            AddedServices = envelope.AddedServiceIds.Select(id =>
            {
                serviceMap.TryGetValue(id, out var s);
                return new AddedServiceDetailDto
                {
                    ServiceId = id,
                    ServiceName = s?.Name ?? $"Dịch vụ #{id}",
                    UnitPrice = s?.CommonUnitPrice ?? 0,
                    Unit = s?.Unit,
                };
            }).ToList(),
        };
    }

    public async Task<List<ContractChangeTrackingItemDto>> GetContractChangeTrackingAsync(string? status, int limit = 200)
    {
        var normalizedStatus = string.IsNullOrWhiteSpace(status)
            ? null
            : status.Trim().ToUpperInvariant();

        var allowedStatuses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "PENDING",
            "DISCUSSING",
            "CONFIRMED"
        };

        if (normalizedStatus != null && !allowedStatuses.Contains(normalizedStatus))
        {
            throw new InvalidOperationException("Trạng thái không hợp lệ. Chỉ hỗ trợ: PENDING, DISCUSSING, CONFIRMED");
        }

        var safeLimit = Math.Clamp(limit, 1, 500);
        var fetchLimit = Math.Clamp(safeLimit * 4, 200, 2000);

        var notifications = await _notificationRepository.GetAllRecentAsync(fetchLimit);
        var trackingItems = new List<ContractChangeTrackingItemDto>();

        foreach (var notification in notifications)
        {
            if (!string.Equals(notification.NotificationType, "CONTRACT_CHANGE", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(notification.LinkUrl) || !notification.LinkUrl.StartsWith("contract-change:"))
            {
                continue;
            }

            ContractChangeEnvelope envelope;
            try
            {
                envelope = DecodeEnvelope(notification.LinkUrl);
            }
            catch
            {
                continue;
            }

            var itemStatus = string.IsNullOrWhiteSpace(envelope.Status)
                ? "PENDING"
                : envelope.Status.Trim().ToUpperInvariant();

            if (normalizedStatus != null && !string.Equals(itemStatus, normalizedStatus, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            trackingItems.Add(new ContractChangeTrackingItemDto
            {
                NotificationId = notification.Id,
                ContractId = envelope.ContractId,
                ContractCode = envelope.ContractCode,
                RoomId = envelope.RoomId,
                RoomNumber = envelope.RoomNumber,
                Status = itemStatus,
                CreatedAt = envelope.CreatedAt,
                EffectiveDate = envelope.EffectiveDate,
                CurrentRentPrice = envelope.CurrentRentPrice,
                ProposedRentPrice = envelope.ProposedRentPrice,
                Note = envelope.Note,
                ResidentMessage = envelope.ResidentMessage,
                ServicePriceChangeCount = envelope.ServicePriceChanges?.Count ?? 0,
                AddedServiceCount = envelope.AddedServiceIds?.Distinct().Count() ?? 0,
            });
        }

        return trackingItems
            .GroupBy(x => x.ContractId)
            .Select(g => g.OrderByDescending(x => x.CreatedAt).First())
            .OrderByDescending(x => x.CreatedAt)
            .Take(safeLimit)
            .ToList();
    }

    public async Task ConfirmContractChangeAsync(int notificationId, int userId)
    {
        var notification = await _notificationRepository.GetByIdWithUserAsync(notificationId)
            ?? throw new InvalidOperationException("Không tìm thấy thông báo");

        if (notification.RecipientId != userId)
        {
            throw new InvalidOperationException("Bạn không có quyền xác nhận thông báo này");
        }

        if (!string.Equals(notification.NotificationType, "CONTRACT_CHANGE", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Thông báo không phải thay đổi hợp đồng");
        }

        var envelope = DecodeEnvelope(notification.LinkUrl);
        if (!string.Equals(envelope.Status, "PENDING", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(envelope.Status, "DISCUSSING", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        await ApplyProposalToContractAsync(envelope);

        envelope.Status = "CONFIRMED";
        envelope.ConfirmedAt = DateTime.UtcNow;
        notification.LinkUrl = EncodeEnvelope(envelope);
        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;

        await _notificationRepository.SaveChangesAsync();

        var roomText = string.IsNullOrWhiteSpace(envelope.RoomNumber) ? "không xác định" : envelope.RoomNumber;
        await _notificationService.CreateAdminNotificationAsync(
            "Cư dân đã xác nhận thay đổi hợp đồng",
            $"Thay đổi hợp đồng {envelope.ContractCode ?? ("#" + envelope.ContractId)} - phòng {roomText} đã được cư dân xác nhận và áp dụng.",
            "CONTRACT_CHANGE",
            notification.OwnerUserId ?? await ResolveOwnerUserIdForContractAsync(envelope.ContractId));
    }

    public async Task RequestContractChangeDiscussionAsync(int notificationId, int userId, string? message)
    {
        var notification = await _notificationRepository.GetByIdWithUserAsync(notificationId)
            ?? throw new InvalidOperationException("Không tìm thấy thông báo");

        if (notification.RecipientId != userId)
        {
            throw new InvalidOperationException("Bạn không có quyền thao tác thông báo này");
        }

        if (!string.Equals(notification.NotificationType, "CONTRACT_CHANGE", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Thông báo không phải thay đổi hợp đồng");
        }

        var envelope = DecodeEnvelope(notification.LinkUrl);
        if (string.Equals(envelope.Status, "CONFIRMED", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        envelope.Status = "DISCUSSING";
        envelope.DiscussedAt = DateTime.UtcNow;
        envelope.ResidentMessage = string.IsNullOrWhiteSpace(message)
            ? "Cư dân muốn thảo luận lại với Ban quản lý"
            : message.Trim();

        notification.LinkUrl = EncodeEnvelope(envelope);
        // Keep notification unread so resident can confirm later.
        notification.IsRead = false;
        notification.ReadAt = null;
        await _notificationRepository.SaveChangesAsync();

        await _notificationService.CreateAdminNotificationAsync(
            "Cư dân yêu cầu thảo luận lại hợp đồng",
            $"Hợp đồng {envelope.ContractCode ?? ("#" + envelope.ContractId)} có phản hồi từ cư dân: {envelope.ResidentMessage}",
            "CONTRACT_CHANGE",
            notification.OwnerUserId ?? await ResolveOwnerUserIdForContractAsync(envelope.ContractId));
    }

    private async Task<int> ResolveOwnerUserIdForUserAsync(int userId)
    {
        var ownerUserId = await _context.Users
            .Where(user => user.Id == userId)
            .Select(user => (int?)(user.OwnerUserId ?? user.Id))
            .FirstOrDefaultAsync();

        return ownerUserId ?? throw new InvalidOperationException("Khong the xac dinh chu nha cua nguoi dung");
    }

    private async Task<int> ResolveOwnerUserIdForContractAsync(int contractId)
    {
        var ownerUserId = await _context.HopDongs
            .Where(contract => contract.Id == contractId)
            .Select(contract => contract.Room.Floor.Building.OwnerUserId)
            .FirstOrDefaultAsync();

        return ownerUserId ?? throw new InvalidOperationException("Khong the xac dinh chu nha cua hop dong");
    }

    private static string BuildProposalSummary(HopDong contract, SendContractChangeProposalDto dto, Dictionary<int, Service> serviceMap)
    {
        var parts = new List<string>
        {
            $"Ngày áp dụng: {dto.EffectiveDate:dd/MM/yyyy}"
        };

        if (dto.NewRentPrice.HasValue)
        {
            parts.Add($"Giá phòng mới: {dto.NewRentPrice.Value:N0} VNĐ");
        }

        if (dto.ServicePriceChanges.Any())
        {
            var serviceText = string.Join(", ", dto.ServicePriceChanges.Select(x =>
            {
                var name = serviceMap.TryGetValue(x.ServiceId, out var s) ? s.Name : $"DV#{x.ServiceId}";
                return $"{name}: {x.NewPrice:N0} VNĐ";
            }));
            parts.Add($"Điều chỉnh giá dịch vụ: {serviceText}");
        }

        if (dto.AddedServiceIds.Any())
        {
            var added = string.Join(", ", dto.AddedServiceIds.Select(id =>
                serviceMap.TryGetValue(id, out var s) ? s.Name : $"DV#{id}"));
            parts.Add($"Thêm dịch vụ: {added}");
        }

        if (dto.RemovedServiceIds.Any())
        {
            var removed = string.Join(", ", dto.RemovedServiceIds.Select(id =>
                serviceMap.TryGetValue(id, out var s) ? s.Name : $"DV#{id}"));
            parts.Add($"Hủy dịch vụ: {removed}");
        }

        if (!string.IsNullOrWhiteSpace(dto.Note))
        {
            parts.Add($"Ghi chú: {dto.Note}");
        }

        return string.Join(" | ", parts);
    }

    private async Task ApplyProposalToContractAsync(ContractChangeEnvelope envelope)
    {
        var contract = await _hopDongRepository.GetWithDetailsAsync(envelope.ContractId)
            ?? throw new InvalidOperationException("Hợp đồng không tồn tại để áp dụng thay đổi");

        if (envelope.ProposedRentPrice.HasValue)
        {
            contract.ActualRentPrice = envelope.ProposedRentPrice.Value;
        }

        var services = (await _serviceRepository.GetAllAsync())
            .Where(s => envelope.ServicePriceChanges.Select(x => x.ServiceId).Contains(s.Id)
                || envelope.AddedServiceIds.Contains(s.Id))
            .ToDictionary(s => s.Id, s => s);

        foreach (var change in envelope.ServicePriceChanges)
        {
            if (!services.TryGetValue(change.ServiceId, out var service))
            {
                continue;
            }

            service.CommonUnitPrice = change.NewPrice;
            service.EffectiveDate = envelope.EffectiveDate;
            _serviceRepository.Update(service);
        }

        var primaryResidentId = contract.ChiTietOs
            .OrderBy(ct => ct.ResidencyRole == "Người thuê chính" ? 0 : 1)
            .Select(ct => ct.ResidentId)
            .FirstOrDefault();

        if (primaryResidentId > 0 && envelope.AddedServiceIds.Any())
        {
            var existing = (await _chiTietSuDungDichVuRepository.GetByRoomIdAsync(contract.RoomId)).ToList();
            foreach (var serviceId in envelope.AddedServiceIds.Distinct())
            {
                var overlapping = existing.Any(u =>
                    u.ServiceId == serviceId
                    && u.ApplyFrom.Date <= (contract.ExpectedEndDate?.Date ?? DateTime.MaxValue.Date)
                    && (u.ApplyTo == null || u.ApplyTo.Value.Date >= envelope.EffectiveDate.Date));

                if (overlapping)
                {
                    Console.WriteLine($"[CONTRACT] Service {serviceId} SKIPPED - overlapping exists");
                    continue;
                }

                Console.WriteLine($"[CONTRACT] ADDING service {serviceId} for resident {primaryResidentId} from {envelope.EffectiveDate}");
                await _chiTietSuDungDichVuRepository.AddAsync(new ChiTietSuDungDichVu
                {
                    ServiceId = serviceId,
                    ResidentId = primaryResidentId,
                    RoomId = contract.RoomId,
                    ApplyFrom = envelope.EffectiveDate,
                    ApplyTo = contract.ExpectedEndDate,
                    Quantity = 1,
                    CreatedAt = DateTime.UtcNow,
                    Note = $"Thêm theo cập nhật hợp đồng {contract.ContractCode}"
                });
            }
        }
        else
        {
            Console.WriteLine($"[CONTRACT] NO ADD - primaryResidentId={primaryResidentId}, AddedServiceIds.Count={envelope.AddedServiceIds.Count}");
        }

        if (envelope.RemovedServiceIds.Any())
        {
            var existing = (await _chiTietSuDungDichVuRepository.GetByRoomIdAsync(contract.RoomId)).ToList();
            var removalBoundary = envelope.EffectiveDate.Date.AddDays(-1);

            foreach (var usage in existing.Where(u =>
                         envelope.RemovedServiceIds.Contains(u.ServiceId)
                         && (u.ApplyTo == null || u.ApplyTo.Value.Date >= envelope.EffectiveDate.Date)
                         && u.ApplyFrom.Date <= envelope.EffectiveDate.Date))
            {
                usage.ApplyTo = removalBoundary;
                _chiTietSuDungDichVuRepository.Update(usage);
            }
        }

        // Save changes to ChiTietSuDungDichVu trước khi rebuild formula
        await _hopDongRepository.SaveChangesAsync();
        Console.WriteLine($"[CONTRACT] SaveChangesAsync completed");

        // Rebuild billing formula khi có thay đổi service
        if (envelope.AddedServiceIds.Any() || envelope.RemovedServiceIds.Any() || envelope.ServicePriceChanges.Any())
        {
            try
            {
                var allServices = await _serviceRepository.GetAllAsync();
                var allUsages = (await _chiTietSuDungDichVuRepository.GetByRoomIdAsync(contract.RoomId)).ToList();
                Console.WriteLine($"[FORMULA] Total usages in DB for room {contract.RoomId}: {allUsages.Count}");
                
                var currentUsages = allUsages
                    .Where(u => u.ApplyFrom.Date <= envelope.EffectiveDate.Date && (u.ApplyTo == null || u.ApplyTo.Value.Date >= envelope.EffectiveDate.Date))
                    .ToList();
                Console.WriteLine($"[FORMULA] Active usages at {envelope.EffectiveDate.Date}: {currentUsages.Count}");

                var billingFormula = new List<BillingFormulaItemDto>();
                
                // Thêm tiền phòng
                billingFormula.Add(new BillingFormulaItemDto
                {
                    SortOrder = 1,
                    ItemType = "TienPhong",
                    ServiceName = "Tiền thuê phòng",
                    UnitPrice = contract.ActualRentPrice,
                    Quantity = 1,
                    QuantityExpression = "1"
                });

                // Thêm các dịch vụ hiện tại
                var sortOrder = 2;
                foreach (var usage in currentUsages)
                {
                    var service = allServices.FirstOrDefault(s => s.Id == usage.ServiceId);
                    if (service != null)
                    {
                        Console.WriteLine($"[FORMULA] Adding {service.Name} (ID {service.Id}) @{service.CommonUnitPrice}");
                        billingFormula.Add(new BillingFormulaItemDto
                        {
                            SortOrder = sortOrder++,
                            ItemType = "DichVu",
                            ServiceId = service.Id,
                            ServiceName = service.Name,
                            UnitPrice = service.CommonUnitPrice ?? 0,
                            Quantity = usage.Quantity ?? 1,
                            QuantityExpression = "1"
                        });
                    }
                }

                contract.BillingFormulaJson = JsonSerializer.Serialize(billingFormula, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
                Console.WriteLine($"[FORMULA] Serialized {billingFormula.Count} items");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FORMULA] ERROR: {ex.Message} {ex.StackTrace}");
                // Tiếp tục không dừng lại nếu rebuild thất bại, vì những thay đổi chính đã được áp dụng
            }
        }

        _hopDongRepository.Update(contract);
        await _hopDongRepository.SaveChangesAsync();
    }

    private static ContractChangeEnvelope DecodeEnvelope(string? linkUrl)
    {
        if (string.IsNullOrWhiteSpace(linkUrl) || !linkUrl.StartsWith("contract-change:"))
        {
            throw new InvalidOperationException("Dữ liệu thay đổi hợp đồng không hợp lệ");
        }

        var encoded = linkUrl["contract-change:".Length..];
        var json = Encoding.UTF8.GetString(Convert.FromBase64String(encoded));
        return JsonSerializer.Deserialize<ContractChangeEnvelope>(json)
            ?? throw new InvalidOperationException("Không đọc được nội dung thay đổi hợp đồng");
    }

    private static string EncodeEnvelope(ContractChangeEnvelope envelope)
    {
        var json = JsonSerializer.Serialize(envelope);
        return "contract-change:" + Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
    }

    private async Task<string?> ResolveChangedByNameAsync(int? userId)
    {
        if (!userId.HasValue) return null;
        return await _context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId.Value)
            .Select(user => user.DisplayName ?? user.Resident!.FullName ?? user.PhoneNumber)
            .FirstOrDefaultAsync();
    }

    private static string BuildEditSummary(UpdateHopDongDto dto)
    {
        var changes = new List<string>();
        if (dto.Residents != null) changes.Add("cập nhật thành viên");
        if (dto.SelectedServiceIds != null) changes.Add("cập nhật danh mục dịch vụ");
        if (dto.BillingFormulaItems != null || !string.IsNullOrWhiteSpace(dto.BillingFormulaJson)) changes.Add("cập nhật công thức hóa đơn");
        if (dto.DepositPaid.HasValue) changes.Add("cập nhật trạng thái tiền cọc");
        return changes.Count == 0 ? "Cập nhật hợp đồng" : string.Join(", ", changes);
    }

    private static string SerializeContractSnapshot(HopDong contract)
    {
        return JsonSerializer.Serialize(new
        {
            contract.Id,
            contract.ContractCode,
            contract.RoomId,
            RoomNumber = contract.Room?.RoomCode,
            contract.StartDate,
            contract.ExpectedEndDate,
            contract.ActualRentPrice,
            contract.DepositAmount,
            contract.DepositPaid,
            contract.PaymentDayOfMonth,
            contract.BillingFormulaJson,
            contract.UpdatedAt,
            Residents = contract.ChiTietOs
                .Where(item => item.ToDate == null)
                .Select(item => new
                {
                    item.ResidentId,
                    FullName = item.Resident?.FullName,
                    item.ResidencyRole,
                    item.FromDate,
                    item.ToDate
                })
                .ToList()
        });
    }

    private static HopDongDto MapToDto(HopDong contract)
    {
        return new HopDongDto
        {
            Id = contract.Id,
            ContractCode = contract.ContractCode,
            RoomId = contract.RoomId,
            RoomNumber = contract.Room?.RoomCode,
            StartDate = contract.StartDate,
            ExpectedEndDate = contract.ExpectedEndDate,
            ActualRentPrice = contract.ActualRentPrice,
            DepositAmount = contract.DepositAmount,
            DepositPaid = contract.DepositPaid,
            PaymentDayOfMonth = contract.PaymentDayOfMonth,
            BillingFormulaJson = contract.BillingFormulaJson,
            UpdatedAt = contract.UpdatedAt,
            Residents = contract.ChiTietOs
                .Where(ct => ct.ToDate == null)
                .Select(ct => new ResidentInContractDto
                {
                    ResidentId = ct.ResidentId,
                    FullName = ct.Resident?.FullName,
                    PhoneNumber = ct.Resident?.PhoneNumber,
                    Email = ct.Resident?.Users?.FirstOrDefault()?.Email,
                    IdCardNumber = ct.Resident?.IdCardNumber,
                    Hometown = ct.Resident?.Hometown,
                    ResidencyRole = ct.ResidencyRole,
                    FromDate = ct.FromDate,
                    ToDate = ct.ToDate
                })
                .ToList()
        };
    }

    private static bool IsAutoAssignableDefaultService(Service service)
    {
        if (!service.IsActive)
        {
            return false;
        }

        var serviceType = (service.ServiceType ?? string.Empty).ToLowerInvariant();
        var serviceName = (service.Name ?? string.Empty).ToLowerInvariant();

        // Parking services require vehicle binding; skip auto assignment here.
        if (serviceType.Contains("gửi xe") || serviceType.Contains("xe") || serviceName.Contains("xe"))
        {
            return false;
        }

        return true;
    }

    private static ChiTietO? PromotePrimaryResidentIfMissing(IEnumerable<ChiTietO> activeResidents)
    {
        var residents = activeResidents
            .Where(item => item.ToDate == null)
            .ToList();

        if (residents.Count == 0 || residents.Any(item => IsPrimaryResidentRole(item.ResidencyRole)))
        {
            return null;
        }

        var promotedResident = residents
            .OrderBy(item => IsTenantRole(item.ResidencyRole) ? 0 : 1)
            .ThenBy(item => item.FromDate)
            .ThenBy(item => item.ResidentId)
            .First();

        promotedResident.ResidencyRole = "Người thuê chính";
        return promotedResident;
    }

    private static bool IsPrimaryResidentRole(string? role)
    {
        var normalized = RemoveDiacritics(role).ToLowerInvariant();
        return normalized.Contains("nguoi thue chinh")
            || normalized.Contains("chu ho")
            || normalized.Contains("chu phong")
            || normalized.Contains("primary")
            || normalized.Contains("owner");
    }

    private static bool IsTenantRole(string? role)
    {
        var normalized = RemoveDiacritics(role).ToLowerInvariant();
        return normalized.Contains("nguoi thue") || normalized.Contains("tenant");
    }

    private static string RemoveDiacritics(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var character in normalized)
        {
            if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(character) != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                builder.Append(character);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private async Task<string> GenerateContractCodeAsync(int contractYear)
    {
        var allContracts = await _hopDongRepository.GetAllAsync();
        var pattern = new Regex($"^HD-{contractYear}-(\\d+)$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        var maxSequence = allContracts
            .Select(c => c.ContractCode)
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(code => pattern.Match(code!))
            .Where(match => match.Success)
            .Select(match => int.TryParse(match.Groups[1].Value, out var value) ? value : 0)
            .DefaultIfEmpty(0)
            .Max();

        return $"HD-{contractYear}-{(maxSequence + 1):D5}";
    }

    private static string? SerializeBillingFormula(List<BillingFormulaItemDto>? items)
    {
        if (items == null || items.Count == 0)
        {
            return null;
        }

        var normalized = items
            .OrderBy(i => i.SortOrder)
            .Select(i => new BillingFormulaItemDto
            {
                SortOrder = i.SortOrder,
                ItemType = i.ItemType,
                ServiceId = i.ServiceId,
                ServiceName = i.ServiceName,
                UnitPrice = i.UnitPrice,
                Quantity = i.Quantity,
                QuantityExpression = string.IsNullOrWhiteSpace(i.QuantityExpression) ? "1" : i.QuantityExpression
            })
            .ToList();

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        return JsonSerializer.Serialize(normalized, options);
    }

    private async Task EnsureResidentAccountsAsync(IEnumerable<CreateChiTietODto> residents)
    {
        foreach (var resident in residents
            .Where(item => item.ResidentId > 0)
            .GroupBy(item => item.ResidentId)
            .Select(group => group.First()))
        {
            if (!string.IsNullOrWhiteSpace(resident.Email))
            {
                await EnsureResidentAccountWithEmailAsync(resident.ResidentId, resident.Email);
            }
            else
            {
                await EnsureResidentAccountAsync(resident.ResidentId);
            }
        }
    }

    private async Task EnsureResidentAccountAsync(int residentId)
    {
        var resident = await _residentRepository.GetByIdAsync(residentId);
        if (resident == null)
        {
            throw new InvalidOperationException("Không tìm thấy cư dân để tạo tài khoản");
        }

        var phone = (resident.PhoneNumber ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(phone))
        {
            throw new InvalidOperationException($"Cư dân {resident.FullName ?? ("#" + residentId)} chưa có số điện thoại, không thể tự động tạo tài khoản");
        }

        var existingByResident = await _userRepository.FirstOrDefaultAsync(u => u.ResidentId == residentId);
        if (existingByResident != null)
        {
            if (!existingByResident.OwnerUserId.HasValue && resident.OwnerUserId.HasValue)
            {
                existingByResident.OwnerUserId = resident.OwnerUserId;
                _userRepository.Update(existingByResident);
                await _userRepository.SaveChangesAsync();
            }
            return;
        }

        var existingByPhone = await _userRepository.GetByPhoneNumberAsync(phone);
        if (existingByPhone != null)
        {
            if (!string.Equals(existingByPhone.Role, "CuDan", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Số điện thoại {phone} đang thuộc tài khoản hệ thống khác, không thể gán cho cư dân");
            }

            if (existingByPhone.ResidentId.HasValue && existingByPhone.ResidentId.Value != residentId)
            {
                throw new InvalidOperationException($"Số điện thoại {phone} đã được gắn với cư dân khác");
            }

            existingByPhone.ResidentId = residentId;
            existingByPhone.OwnerUserId = resident.OwnerUserId ?? existingByPhone.OwnerUserId;
            existingByPhone.IsLocked = false;
            existingByPhone.MustChangePassword = true;
            _userRepository.Update(existingByPhone);
            await _userRepository.SaveChangesAsync();
            return;
        }

        // Nhanh nay: cu dan KHONG co email -> khong gui mail duoc.
        // Giu mat khau mac dinh 123456 de admin con bao mieng cho cu dan (theo quyet dinh nghiep vu).
        var defaultPassword = "123456";
        var user = new User
        {
            PhoneNumber = phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword),
            Role = "CuDan",
            ResidentId = residentId,
            OwnerUserId = resident.OwnerUserId,
            IsLocked = false,
            MustChangePassword = true
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();
    }

    private async Task EnsureResidentAccountWithEmailAsync(int residentId, string email)
    {
        var resident = await _residentRepository.GetByIdAsync(residentId);
        if (resident == null)
        {
            throw new InvalidOperationException($"Không tìm thấy cư dân ID {residentId}");
        }

        var phone = (resident.PhoneNumber ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(phone))
        {
            // If no phone, cannot create account - email alone is not sufficient for login
            return;
        }

        var existingByResident = await _userRepository.FirstOrDefaultAsync(u => u.ResidentId == residentId);
        if (existingByResident != null)
        {
            // Update email if user account already exists
            if (string.IsNullOrWhiteSpace(existingByResident.Email) || !existingByResident.OwnerUserId.HasValue)
            {
                if (string.IsNullOrWhiteSpace(existingByResident.Email))
                {
                    existingByResident.Email = email.Trim();
                }
                existingByResident.OwnerUserId = resident.OwnerUserId ?? existingByResident.OwnerUserId;
                _userRepository.Update(existingByResident);
                await _userRepository.SaveChangesAsync();
            }
            return;
        }

        var existingByPhone = await _userRepository.GetByPhoneNumberAsync(phone);
        if (existingByPhone != null)
        {
            if (!string.Equals(existingByPhone.Role, "CuDan", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Số điện thoại {phone} đang thuộc tài khoản hệ thống khác");
            }

            if (existingByPhone.ResidentId.HasValue && existingByPhone.ResidentId.Value != residentId)
            {
                throw new InvalidOperationException($"Số điện thoại {phone} đã được gắn với cư dân khác");
            }

            existingByPhone.ResidentId = residentId;
            existingByPhone.Email = email.Trim();
            existingByPhone.OwnerUserId = resident.OwnerUserId ?? existingByPhone.OwnerUserId;
            existingByPhone.IsLocked = false;
            existingByPhone.MustChangePassword = true;
            _userRepository.Update(existingByPhone);
            await _userRepository.SaveChangesAsync();
            return;
        }

        // Create new user account with email
        var plainPassword = GenerateRandomPassword();
        var user = new User
        {
            PhoneNumber = phone,
            Email = email.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(plainPassword),
            Role = "CuDan",
            ResidentId = residentId,
            OwnerUserId = resident.OwnerUserId,
            IsLocked = false,
            MustChangePassword = true
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        // Gom tai khoan moi tao de gui email thong tin dang nhap sau khi tao HD xong.
        _pendingAccountEmails.Add(new NewResidentAccount(
            email.Trim(), resident.FullName ?? phone, phone, plainPassword));
        _logger.LogInformation("📧 Da gom tai khoan MOI (email={Email}, phone={Phone}) vao hang doi gui mail", email.Trim(), phone);
    }

    /// <summary>Sinh mat khau ngau nhien 10 ky tu (chu + so), tranh ky tu de nham lan.</summary>
    private static string GenerateRandomPassword()
    {
        const string chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var bytes = RandomNumberGenerator.GetBytes(10);
        var sb = new StringBuilder(10);
        foreach (var b in bytes)
        {
            sb.Append(chars[b % chars.Length]);
        }
        return sb.ToString();
    }

    /// <summary>Gui email thong tin dang nhap cho cac tai khoan cu dan vua tao. Loi email KHONG chan tao HD.</summary>
    private async Task SendPendingAccountEmailsAsync()
    {
        _logger.LogInformation("📧 SendPendingAccountEmails: co {Count} tai khoan can gui mail", _pendingAccountEmails.Count);
        if (_pendingAccountEmails.Count == 0) return;

        foreach (var account in _pendingAccountEmails)
        {
            try
            {
                _logger.LogInformation("📧 Dang gui email tai khoan toi {Email} (SMTP configured={Cfg})",
                    account.Email, _emailService.IsConfigured);
                var subject = "Tài khoản Prop-Tech của bạn";
                var body = BuildAccountEmailBody(account);
                await _emailService.SendAsync(account.Email, subject, body);
                _logger.LogInformation("📧 ✅ Da gui xong email toi {Email}", account.Email);
            }
            catch (Exception ex)
            {
                // Khong chan tao HD chi vi loi gui mail.
                _logger.LogWarning(ex, "📧 ❌ Gui email tai khoan toi {Email} that bai", account.Email);
            }
        }
        _pendingAccountEmails.Clear();
    }

    private static string BuildAccountEmailBody(NewResidentAccount account)
    {
        return $@"
            <div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>
              <h2 style='color:#1A4B84'>Prop-Tech</h2>
              <p>Xin chào <b>{System.Net.WebUtility.HtmlEncode(account.FullName)}</b>,</p>
              <p>Tài khoản cư dân của bạn đã được tạo. Thông tin đăng nhập:</p>
              <table style='border-collapse:collapse;margin:12px 0'>
                <tr><td style='padding:6px 12px;color:#666'>Số điện thoại</td>
                    <td style='padding:6px 12px;font-weight:bold'>{System.Net.WebUtility.HtmlEncode(account.PhoneNumber)}</td></tr>
                <tr><td style='padding:6px 12px;color:#666'>Mật khẩu</td>
                    <td style='padding:6px 12px;font-weight:bold;font-size:18px;color:#0f2942'>{System.Net.WebUtility.HtmlEncode(account.PlainPassword)}</td></tr>
              </table>
              <p style='color:#b45309'>Vì lý do bảo mật, vui lòng <b>đổi mật khẩu ngay lần đăng nhập đầu tiên</b>.</p>
              <p style='color:#888;font-size:13px'>Đây là email tự động, vui lòng không trả lời.</p>
            </div>";
    }

    private async Task LockRoomPostsAsync(int roomId, string roomStatus)
    {
        var posts = await _context.BaiDangTimPhongs
            .Include(post => post.CreatedByUser)
            .Where(post => post.RoomId == roomId)
            .ToListAsync();

        foreach (var post in posts)
        {
            if (IsDeletedPost(post))
            {
                post.IsLocked = true;
                post.RoomStatus = roomStatus;
                continue;
            }

            if (IsSharedRoommatePost(post))
            {
                post.IsLocked = false;
                post.Status = ActivePostStatus;
                post.RoomStatus = roomStatus;
                continue;
            }

            post.IsLocked = true;
            post.Status = PausedPostStatus;
            post.RoomStatus = roomStatus;
        }
    }

    private async Task UnlockRoomPostsAsync(int roomId, string roomStatus)
    {
        var posts = await _context.BaiDangTimPhongs
            .Where(post => post.RoomId == roomId)
            .ToListAsync();

        foreach (var post in posts)
        {
            if (IsDeletedPost(post))
            {
                post.IsLocked = true;
                post.RoomStatus = roomStatus;
                continue;
            }

            post.IsLocked = false;
            post.Status = ActivePostStatus;
            post.RoomStatus = roomStatus;
        }
    }

    private static bool IsSharedRoommatePost(BaiDangTimPhong post)
    {
        return string.Equals(post.CreatedByUser?.Role, "CuDan", StringComparison.OrdinalIgnoreCase)
            || (post.CurrentOccupants ?? 0) > 0;
    }

    private static bool IsDeletedPost(BaiDangTimPhong post)
    {
        return string.Equals(post.Status, DeletedPostStatus, StringComparison.OrdinalIgnoreCase);
    }

    private Task<bool> HasActiveRoomContractAsync(int roomId, int? excludingContractId = null)
    {
        var now = DateTime.UtcNow;
        return _context.HopDongs.AnyAsync(contract =>
            contract.RoomId == roomId
            && (!excludingContractId.HasValue || contract.Id != excludingContractId.Value)
            && (contract.ExpectedEndDate == null || contract.ExpectedEndDate > now));
    }
}
