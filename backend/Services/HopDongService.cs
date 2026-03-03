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

    public HopDongService(
        IHopDongRepository hopDongRepository,
        IRoomRepository roomRepository,
        IResidentRepository residentRepository)
    {
        _hopDongRepository = hopDongRepository;
        _roomRepository = roomRepository;
        _residentRepository = residentRepository;
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

        // Create ChiTietO records for each resident
        foreach (var residentDto in dto.Residents)
        {
            var chiTietO = new ChiTietO
            {
                ContractId = contract.Id,
                ResidentId = residentDto.ResidentId,
                ResidencyRole = residentDto.ResidencyRole,
                FromDate = residentDto.FromDate
            };
            contract.ChiTietOs.Add(chiTietO);
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
                ResidencyRole = ct.ResidencyRole,
                FromDate = ct.FromDate,
                ToDate = ct.ToDate
            }).ToList()
        };
    }
}
