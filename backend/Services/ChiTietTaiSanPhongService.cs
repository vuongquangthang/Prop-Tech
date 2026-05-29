using backend.DTOs;
using backend.Repositories;
using backend.Models;

namespace backend.Services
{
    public interface IChiTietTaiSanPhongService
    {
        Task<IEnumerable<ChiTietTaiSanPhongDto>> GetAllAsync(int ownerUserId);
        Task<ChiTietTaiSanPhongDto?> GetByRoomAndAssetAsync(int roomId, int assetId, int ownerUserId);
        Task<IEnumerable<ChiTietTaiSanPhongDto>> GetByRoomIdAsync(int roomId, int ownerUserId);
        Task<IEnumerable<ChiTietTaiSanPhongDto>> GetByAssetIdAsync(int assetId, int ownerUserId);
        Task<ChiTietTaiSanPhongDto> CreateAsync(CreateChiTietTaiSanPhongDto dto, int ownerUserId);
        Task<ChiTietTaiSanPhongDto> UpdateAsync(int roomId, int assetId, UpdateChiTietTaiSanPhongDto dto, int ownerUserId);
        Task<bool> DeleteAsync(int roomId, int assetId, int ownerUserId);
    }

    public class ChiTietTaiSanPhongService : IChiTietTaiSanPhongService
    {
        private readonly IChiTietTaiSanPhongRepository _detailRepository;
        private readonly IRoomRepository _roomRepository;
        private readonly ITaiSanRepository _taiSanRepository;

        public ChiTietTaiSanPhongService(
            IChiTietTaiSanPhongRepository detailRepository,
            IRoomRepository roomRepository,
            ITaiSanRepository taiSanRepository)
        {
            _detailRepository = detailRepository;
            _roomRepository = roomRepository;
            _taiSanRepository = taiSanRepository;
        }

        public async Task<IEnumerable<ChiTietTaiSanPhongDto>> GetAllAsync(int ownerUserId)
        {
            var details = await _detailRepository.GetAllAsync(ownerUserId);
            return details.Select(MapToDto);
        }

        public async Task<ChiTietTaiSanPhongDto?> GetByRoomAndAssetAsync(int roomId, int assetId, int ownerUserId)
        {
            var detail = await _detailRepository.GetByRoomAndAssetAsync(roomId, assetId, ownerUserId);
            return detail == null ? null : MapToDto(detail);
        }

        public async Task<IEnumerable<ChiTietTaiSanPhongDto>> GetByRoomIdAsync(int roomId, int ownerUserId)
        {
            var details = await _detailRepository.GetByRoomIdAsync(roomId, ownerUserId);
            return details.Select(MapToDto);
        }

        public async Task<IEnumerable<ChiTietTaiSanPhongDto>> GetByAssetIdAsync(int assetId, int ownerUserId)
        {
            var details = await _detailRepository.GetByAssetIdAsync(assetId, ownerUserId);
            return details.Select(MapToDto);
        }

        public async Task<ChiTietTaiSanPhongDto> CreateAsync(CreateChiTietTaiSanPhongDto dto, int ownerUserId)
        {
            // Validate room exists
            var room = (await _roomRepository.FindAsync(room =>
                room.Id == dto.RoomId && room.Floor.Building.OwnerUserId == ownerUserId)).FirstOrDefault();
            if (room == null)
            {
                throw new Exception("Phòng không tồn tại");
            }

            // Validate asset exists
            var taiSan = await _taiSanRepository.GetByIdAsync(dto.AssetId, ownerUserId);
            if (taiSan == null)
            {
                throw new Exception("Tài sản không tồn tại");
            }

            // Check if already exists
            var existing = await _detailRepository.GetByRoomAndAssetAsync(dto.RoomId, dto.AssetId, ownerUserId);
            if (existing != null)
            {
                throw new Exception("Tài sản đã được gán cho phòng này");
            }

            var detail = new ChiTietTaiSanPhong
            {
                RoomId = dto.RoomId,
                AssetId = dto.AssetId,
                Quantity = dto.Quantity,
                Condition = dto.Condition,
                Note = dto.Note
            };

            var created = await _detailRepository.CreateAsync(detail);
            
            // Reload to get navigation properties
            var result = await _detailRepository.GetByRoomAndAssetAsync(created.RoomId, created.AssetId, ownerUserId);
            return MapToDto(result!);
        }

        public async Task<ChiTietTaiSanPhongDto> UpdateAsync(int roomId, int assetId, UpdateChiTietTaiSanPhongDto dto, int ownerUserId)
        {
            var detail = await _detailRepository.GetByRoomAndAssetAsync(roomId, assetId, ownerUserId);
            if (detail == null)
            {
                throw new Exception("Tài sản phòng không tồn tại");
            }

            // Update fields
            if (dto.Quantity.HasValue)
                detail.Quantity = dto.Quantity.Value;
            if (!string.IsNullOrEmpty(dto.Condition))
                detail.Condition = dto.Condition;
            if (dto.Note != null)
                detail.Note = dto.Note;

            var updated = await _detailRepository.UpdateAsync(detail);
            
            // Reload to get navigation properties
            var result = await _detailRepository.GetByRoomAndAssetAsync(updated.RoomId, updated.AssetId, ownerUserId);
            return MapToDto(result!);
        }

        public async Task<bool> DeleteAsync(int roomId, int assetId, int ownerUserId)
        {
            return await _detailRepository.DeleteAsync(roomId, assetId, ownerUserId);
        }

        private ChiTietTaiSanPhongDto MapToDto(ChiTietTaiSanPhong detail)
        {
            return new ChiTietTaiSanPhongDto
            {
                RoomId = detail.RoomId,
                AssetId = detail.AssetId,
                Quantity = detail.Quantity,
                Condition = detail.Condition,
                Note = detail.Note,
                RoomCode = detail.Room?.RoomCode,
                AssetName = detail.TaiSan?.AssetName,
                AssetCode = detail.TaiSan?.AssetCode
            };
        }
    }
}
