using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public interface IHopDongService
{
    Task<List<HopDongDto>> GetAllAsync();
    Task<List<HopDongDto>> GetByRoomIdAsync(int roomId);
    Task<List<HopDongDto>> GetActiveContractsAsync();
    Task<HopDongDto?> GetByIdAsync(int id);
    Task<HopDongDto> CreateAsync(CreateHopDongDto dto);
    Task<HopDongDto> UpdateAsync(int id, UpdateHopDongDto dto);
    Task DeleteAsync(int id);
}

public class HopDongService : IHopDongService
{
    private readonly IHopDongRepository _hopDongRepository;
    private readonly IRoomRepository _roomRepository;
    private readonly IResidentRepository _residentRepository;
    private readonly IServiceRepository _serviceRepository;
    private readonly IChiTietSuDungDichVuRepository _chiTietSuDungDichVuRepository;
    private readonly IChiTietORepository _chiTietORepository;
    private readonly IUserRepository _userRepository;

    public HopDongService(
        IHopDongRepository hopDongRepository,
        IRoomRepository roomRepository,
        IResidentRepository residentRepository,
        IServiceRepository serviceRepository,
        IChiTietSuDungDichVuRepository chiTietSuDungDichVuRepository,
        IChiTietORepository chiTietORepository,
        IUserRepository userRepository)
    {
        _hopDongRepository = hopDongRepository;
        _roomRepository = roomRepository;
        _residentRepository = residentRepository;
        _serviceRepository = serviceRepository;
        _chiTietSuDungDichVuRepository = chiTietSuDungDichVuRepository;
        _chiTietORepository = chiTietORepository;
        _userRepository = userRepository;
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

        // Validate room exists
        var room = await _roomRepository.GetByIdAsync(dto.RoomId);
        if (room == null)
        {
            throw new InvalidOperationException("Phòng không tồn tại");
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

        // Create contract
        var contract = new HopDong
        {
            RoomId = dto.RoomId,
            StartDate = dto.StartDate,
            ExpectedEndDate = dto.ExpectedEndDate,
            ActualRentPrice = dto.ActualRentPrice,
            DepositAmount = dto.DepositAmount
        };

        await _hopDongRepository.AddAsync(contract);
        await _hopDongRepository.SaveChangesAsync();

        // Auto-generate contract code after ID is available.
        contract.ContractCode = $"HD-{DateTime.UtcNow:yyyy}-{contract.Id:D5}";

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
        await _chiTietORepository.SaveChangesAsync();

        // Auto-create default service usages so monthly invoice calculation has baseline services.
        var activeServices = (await _serviceRepository.GetActiveServicesAsync()).ToList();
        var defaultServices = activeServices
            .Where(IsAutoAssignableDefaultService)
            .ToList();

        var primaryResidentId = dto.Residents
            .FirstOrDefault(r => r.ResidencyRole == "Người thuê chính")?.ResidentId
            ?? dto.Residents.FirstOrDefault(r => r.ResidencyRole == "Người thuê")?.ResidentId
            ?? dto.Residents.First().ResidentId;

        await EnsureResidentAccountAsync(primaryResidentId);

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

        // Update room status to "Đã thuê"
        room.Status = "Đã thuê";
        _roomRepository.Update(room);

        await _hopDongRepository.SaveChangesAsync();

        // Reload to get navigation properties
        var createdContract = await _hopDongRepository.GetWithDetailsAsync(contract.Id);
        return MapToDto(createdContract!);
    }

    public async Task<HopDongDto> UpdateAsync(int id, UpdateHopDongDto dto)
    {
        var contract = await _hopDongRepository.GetByIdAsync(id);
        if (contract == null)
        {
            throw new InvalidOperationException("Hợp đồng không tồn tại");
        }

        if (dto.ExpectedEndDate.HasValue)
            contract.ExpectedEndDate = dto.ExpectedEndDate;

        if (dto.ActualRentPrice.HasValue)
            contract.ActualRentPrice = dto.ActualRentPrice.Value;

        if (dto.DepositAmount.HasValue)
            contract.DepositAmount = dto.DepositAmount;

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

        // Update room status back to "Trống"
        var room = await _roomRepository.GetByIdAsync(contract.RoomId);
        if (room != null)
        {
            room.Status = "Trống";
            _roomRepository.Update(room);
        }

        _hopDongRepository.Remove(contract);
        await _hopDongRepository.SaveChangesAsync();
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
            Residents = contract.ChiTietOs.Select(ct => new ResidentInContractDto
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
            }).ToList()
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

    private async Task EnsureResidentAccountAsync(int residentId)
    {
        var resident = await _residentRepository.GetByIdAsync(residentId);
        if (resident == null)
        {
            throw new InvalidOperationException("Không tìm thấy cư dân chủ hộ để tạo tài khoản");
        }

        var phone = (resident.PhoneNumber ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(phone))
        {
            throw new InvalidOperationException("Chủ hộ chưa có số điện thoại, không thể tự động tạo tài khoản");
        }

        var existingByResident = await _userRepository.FirstOrDefaultAsync(u => u.ResidentId == residentId);
        if (existingByResident != null)
        {
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
            existingByPhone.IsLocked = false;
            existingByPhone.MustChangePassword = true;
            _userRepository.Update(existingByPhone);
            await _userRepository.SaveChangesAsync();
            return;
        }

        var defaultPassword = "123456";
        var user = new User
        {
            PhoneNumber = phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword),
            Role = "CuDan",
            ResidentId = residentId,
            IsLocked = false,
            MustChangePassword = true
        };

        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();
    }
}
