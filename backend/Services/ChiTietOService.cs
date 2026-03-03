using backend.DTOs;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IChiTietOService
{
    Task<List<ResidentInContractDto>> GetResidentsByContractAsync(int contractId);
    Task<ResidentInContractDto> AddResidentToContractAsync(int contractId, CreateChiTietODto dto);
    Task RemoveResidentFromContractAsync(int contractId, int residentId);
    Task UpdateMoveOutDateAsync(int contractId, int residentId, DateTime toDate);
}

public class ChiTietOService : IChiTietOService
{
    private readonly IChiTietORepository _chiTietORepository;
    private readonly IHopDongRepository _hopDongRepository;
    private readonly IResidentRepository _residentRepository;

    public ChiTietOService(
        IChiTietORepository chiTietORepository,
        IHopDongRepository hopDongRepository,
        IResidentRepository residentRepository)
    {
        _chiTietORepository = chiTietORepository;
        _hopDongRepository = hopDongRepository;
        _residentRepository = residentRepository;
    }

    public async Task<List<ResidentInContractDto>> GetResidentsByContractAsync(int contractId)
    {
        var residents = await _chiTietORepository.GetByContractIdAsync(contractId);
        return residents.Select(MapToDto).ToList();
    }

    public async Task<ResidentInContractDto> AddResidentToContractAsync(int contractId, CreateChiTietODto dto)
    {
        // Validate contract exists
        var contract = await _hopDongRepository.GetByIdAsync(contractId);
        if (contract == null)
        {
            throw new InvalidOperationException("Hợp đồng không tồn tại");
        }

        // Validate resident exists
        var resident = await _residentRepository.GetByIdAsync(dto.ResidentId);
        if (resident == null)
        {
            throw new InvalidOperationException("Cư dân không tồn tại");
        }

        // Check if resident already in this contract
        var existing = await _chiTietORepository.GetByContractAndResidentAsync(contractId, dto.ResidentId);
        if (existing != null && existing.ToDate == null)
        {
            throw new InvalidOperationException("Cư dân đã có trong hợp đồng này");
        }

        // Create new ChiTietO record
        var chiTietO = new ChiTietO
        {
            ContractId = contractId,
            ResidentId = dto.ResidentId,
            ResidencyRole = dto.ResidencyRole,
            FromDate = dto.FromDate,
            ToDate = null
        };

        await _chiTietORepository.AddAsync(chiTietO);
        await _chiTietORepository.SaveChangesAsync();

        // Reload to get navigation properties
        var created = await _chiTietORepository.GetByContractAndResidentAsync(contractId, dto.ResidentId);
        return MapToDto(created!);
    }

    public async Task RemoveResidentFromContractAsync(int contractId, int residentId)
    {
        var chiTietO = await _chiTietORepository.GetByContractAndResidentAsync(contractId, residentId);
        if (chiTietO == null)
        {
            throw new InvalidOperationException("Cư dân không có trong hợp đồng này");
        }

        // Set ToDate to mark as moved out
        chiTietO.ToDate = DateTime.Now;
        _chiTietORepository.Update(chiTietO);
        await _chiTietORepository.SaveChangesAsync();
    }

    public async Task UpdateMoveOutDateAsync(int contractId, int residentId, DateTime toDate)
    {
        var chiTietO = await _chiTietORepository.GetByContractAndResidentAsync(contractId, residentId);
        if (chiTietO == null)
        {
            throw new InvalidOperationException("Cư dân không có trong hợp đồng này");
        }

        if (toDate < chiTietO.FromDate)
        {
            throw new InvalidOperationException("Ngày chuyển đi phải sau ngày chuyển vào");
        }

        chiTietO.ToDate = toDate;
        _chiTietORepository.Update(chiTietO);
        await _chiTietORepository.SaveChangesAsync();
    }

    private ResidentInContractDto MapToDto(ChiTietO chiTietO)
    {
        return new ResidentInContractDto
        {
            ResidentId = chiTietO.ResidentId,
            FullName = chiTietO.Resident?.FullName,
            PhoneNumber = chiTietO.Resident?.PhoneNumber,
            ResidencyRole = chiTietO.ResidencyRole,
            FromDate = chiTietO.FromDate,
            ToDate = chiTietO.ToDate
        };
    }
}
