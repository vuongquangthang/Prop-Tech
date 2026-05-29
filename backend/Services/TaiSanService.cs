using backend.DTOs;
using backend.Repositories;
using backend.Models;

namespace backend.Services
{
    public interface ITaiSanService
    {
        Task<IEnumerable<TaiSanDto>> GetAllAsync(int ownerUserId);
        Task<TaiSanDto?> GetByIdAsync(int id, int ownerUserId);
        Task<TaiSanDto?> GetByCodeAsync(string assetCode, int ownerUserId);
        Task<TaiSanDto> CreateAsync(CreateTaiSanDto dto, int ownerUserId);
        Task<TaiSanDto> UpdateAsync(int id, UpdateTaiSanDto dto, int ownerUserId);
        Task<bool> DeleteAsync(int id, int ownerUserId);
    }

    public class TaiSanService : ITaiSanService
    {
        private readonly ITaiSanRepository _taiSanRepository;

        public TaiSanService(ITaiSanRepository taiSanRepository)
        {
            _taiSanRepository = taiSanRepository;
        }

        public async Task<IEnumerable<TaiSanDto>> GetAllAsync(int ownerUserId)
        {
            var taiSans = await _taiSanRepository.GetAllAsync(ownerUserId);
            return taiSans.Select(MapToDto);
        }

        public async Task<TaiSanDto?> GetByIdAsync(int id, int ownerUserId)
        {
            var taiSan = await _taiSanRepository.GetByIdAsync(id, ownerUserId);
            return taiSan == null ? null : MapToDto(taiSan);
        }

        public async Task<TaiSanDto?> GetByCodeAsync(string assetCode, int ownerUserId)
        {
            var taiSan = await _taiSanRepository.GetByCodeAsync(assetCode, ownerUserId);
            return taiSan == null ? null : MapToDto(taiSan);
        }

        public async Task<TaiSanDto> CreateAsync(CreateTaiSanDto dto, int ownerUserId)
        {
            // Check duplicate asset code
            if (await _taiSanRepository.ExistsByCodeAsync(dto.AssetCode, ownerUserId))
            {
                throw new Exception($"Mã tài sản '{dto.AssetCode}' đã tồn tại");
            }

            var taiSan = new TaiSan
            {
                AssetName = dto.AssetName,
                AssetCode = dto.AssetCode,
                OwnerUserId = ownerUserId
            };

            var created = await _taiSanRepository.CreateAsync(taiSan);
            return MapToDto(created);
        }

        public async Task<TaiSanDto> UpdateAsync(int id, UpdateTaiSanDto dto, int ownerUserId)
        {
            var taiSan = await _taiSanRepository.GetByIdAsync(id, ownerUserId);
            if (taiSan == null)
            {
                throw new Exception("Tài sản không tồn tại");
            }

            // Update fields
            if (!string.IsNullOrEmpty(dto.AssetName))
                taiSan.AssetName = dto.AssetName;

            if (!string.IsNullOrEmpty(dto.AssetCode))
            {
                // Check duplicate if changing code
                if (dto.AssetCode != taiSan.AssetCode && await _taiSanRepository.ExistsByCodeAsync(dto.AssetCode, ownerUserId))
                {
                    throw new Exception($"Mã tài sản '{dto.AssetCode}' đã tồn tại");
                }
                taiSan.AssetCode = dto.AssetCode;
            }

            var updated = await _taiSanRepository.UpdateAsync(taiSan);
            return MapToDto(updated);
        }

        public async Task<bool> DeleteAsync(int id, int ownerUserId)
        {
            return await _taiSanRepository.DeleteAsync(id, ownerUserId);
        }

        private TaiSanDto MapToDto(TaiSan taiSan)
        {
            return new TaiSanDto
            {
                Id = taiSan.Id,
                AssetName = taiSan.AssetName,
                AssetCode = taiSan.AssetCode,
                OwnerUserId = taiSan.OwnerUserId,
                TotalRooms = taiSan.ChiTietTaiSanPhongs?.Select(c => c.RoomId).Distinct().Count() ?? 0,
                TotalQuantity = taiSan.ChiTietTaiSanPhongs?.Sum(c => c.Quantity) ?? 0
            };
        }
    }
}
