using backend.DTOs;
using backend.Repositories;
using backend.Models;

namespace backend.Services
{
    public interface ITaiSanService
    {
        Task<IEnumerable<TaiSanDto>> GetAllAsync();
        Task<TaiSanDto?> GetByIdAsync(int id);
        Task<TaiSanDto?> GetByCodeAsync(string assetCode);
        Task<TaiSanDto> CreateAsync(CreateTaiSanDto dto);
        Task<TaiSanDto> UpdateAsync(int id, UpdateTaiSanDto dto);
        Task<bool> DeleteAsync(int id);
    }

    public class TaiSanService : ITaiSanService
    {
        private readonly ITaiSanRepository _taiSanRepository;

        public TaiSanService(ITaiSanRepository taiSanRepository)
        {
            _taiSanRepository = taiSanRepository;
        }

        public async Task<IEnumerable<TaiSanDto>> GetAllAsync()
        {
            var taiSans = await _taiSanRepository.GetAllAsync();
            return taiSans.Select(MapToDto);
        }

        public async Task<TaiSanDto?> GetByIdAsync(int id)
        {
            var taiSan = await _taiSanRepository.GetByIdAsync(id);
            return taiSan == null ? null : MapToDto(taiSan);
        }

        public async Task<TaiSanDto?> GetByCodeAsync(string assetCode)
        {
            var taiSan = await _taiSanRepository.GetByCodeAsync(assetCode);
            return taiSan == null ? null : MapToDto(taiSan);
        }

        public async Task<TaiSanDto> CreateAsync(CreateTaiSanDto dto)
        {
            // Check duplicate asset code
            if (await _taiSanRepository.ExistsByCodeAsync(dto.AssetCode))
            {
                throw new Exception($"Mã tài sản '{dto.AssetCode}' đã tồn tại");
            }

            var taiSan = new TaiSan
            {
                AssetName = dto.AssetName,
                AssetCode = dto.AssetCode
            };

            var created = await _taiSanRepository.CreateAsync(taiSan);
            return MapToDto(created);
        }

        public async Task<TaiSanDto> UpdateAsync(int id, UpdateTaiSanDto dto)
        {
            var taiSan = await _taiSanRepository.GetByIdAsync(id);
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
                if (dto.AssetCode != taiSan.AssetCode && await _taiSanRepository.ExistsByCodeAsync(dto.AssetCode))
                {
                    throw new Exception($"Mã tài sản '{dto.AssetCode}' đã tồn tại");
                }
                taiSan.AssetCode = dto.AssetCode;
            }

            var updated = await _taiSanRepository.UpdateAsync(taiSan);
            return MapToDto(updated);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _taiSanRepository.DeleteAsync(id);
        }

        private TaiSanDto MapToDto(TaiSan taiSan)
        {
            return new TaiSanDto
            {
                Id = taiSan.Id,
                AssetName = taiSan.AssetName,
                AssetCode = taiSan.AssetCode,
                TotalRooms = taiSan.ChiTietTaiSanPhongs?.Select(c => c.RoomId).Distinct().Count() ?? 0,
                TotalQuantity = taiSan.ChiTietTaiSanPhongs?.Sum(c => c.Quantity) ?? 0
            };
        }
    }
}
