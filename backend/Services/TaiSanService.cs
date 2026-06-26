using backend.DTOs;
using backend.Repositories;
using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;

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
        private readonly ApplicationDbContext _context;

        public TaiSanService(ITaiSanRepository taiSanRepository, ApplicationDbContext context)
        {
            _taiSanRepository = taiSanRepository;
            _context = context;
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
            var buildingIds = NormalizeBuildingIds(dto.BuildingIds, dto.BuildingId);
            await EnsureOwnsBuildingsAsync(buildingIds, ownerUserId);

            // Check duplicate asset code
            if (await _context.TaiSans.AnyAsync(asset => asset.OwnerUserId == ownerUserId && asset.AssetCode == dto.AssetCode))
            {
                throw new Exception($"Mã tài sản '{dto.AssetCode}' đã tồn tại");
            }

            var taiSan = new TaiSan
            {
                AssetName = dto.AssetName,
                AssetCode = dto.AssetCode,
                OwnerUserId = ownerUserId,
                BuildingId = null
            };
            SyncAssetBuildingScopes(taiSan, buildingIds);

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

            if (!string.IsNullOrWhiteSpace(dto.AssetCode))
            {
                var nextAssetCode = dto.AssetCode.Trim();
                var isChangingAssetCode = !string.Equals(taiSan.AssetCode, nextAssetCode, StringComparison.OrdinalIgnoreCase);

                // Check duplicate only when the code is actually changed.
                // Scope-only updates must not fail because of legacy grouped asset rows with the same code.
                if (isChangingAssetCode && await _context.TaiSans.AnyAsync(asset => asset.Id != taiSan.Id && asset.OwnerUserId == ownerUserId && asset.AssetCode == nextAssetCode))
                {
                    throw new Exception($"Mã tài sản '{nextAssetCode}' đã tồn tại");
                }
                taiSan.AssetCode = nextAssetCode;
            }

            if (dto.BuildingIds != null || dto.BuildingId.HasValue)
            {
                var buildingIds = NormalizeBuildingIds(dto.BuildingIds, dto.BuildingId);
                await EnsureOwnsBuildingsAsync(buildingIds, ownerUserId);
                SyncAssetBuildingScopes(taiSan, buildingIds);
                taiSan.BuildingId = null;
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
            var scopedBuildings = taiSan.BuildingScopes?
                .Where(scope => scope.Building != null)
                .OrderBy(scope => scope.Building.BuildingName)
                .ToList() ?? new List<TaiSanBuildingScope>();

            return new TaiSanDto
            {
                Id = taiSan.Id,
                AssetName = taiSan.AssetName,
                AssetCode = taiSan.AssetCode,
                OwnerUserId = taiSan.OwnerUserId,
                BuildingId = scopedBuildings.Count == 1 ? scopedBuildings[0].BuildingId : taiSan.BuildingId,
                BuildingName = scopedBuildings.Count == 1 ? scopedBuildings[0].Building.BuildingName : taiSan.Building?.BuildingName,
                BuildingIds = scopedBuildings.Select(scope => scope.BuildingId).ToList(),
                BuildingNames = scopedBuildings.Select(scope => scope.Building.BuildingName).ToList(),
                TotalRooms = taiSan.ChiTietTaiSanPhongs?.Select(c => c.RoomId).Distinct().Count() ?? 0,
                TotalQuantity = taiSan.ChiTietTaiSanPhongs?.Sum(c => c.Quantity) ?? 0
            };
        }

        private static List<int> NormalizeBuildingIds(List<int>? buildingIds, int? buildingId)
        {
            var ids = buildingIds?.Where(id => id > 0).Distinct().ToList() ?? new List<int>();
            if (ids.Count == 0 && buildingId.HasValue && buildingId.Value > 0)
            {
                ids.Add(buildingId.Value);
            }

            return ids;
        }

        private async Task EnsureOwnsBuildingsAsync(List<int> buildingIds, int ownerUserId)
        {
            if (buildingIds.Count == 0)
            {
                return;
            }

            var ownedCount = await _context.Buildings
                .AsNoTracking()
                .CountAsync(building => buildingIds.Contains(building.Id) && building.OwnerUserId == ownerUserId);
            if (ownedCount != buildingIds.Count)
            {
                throw new Exception("Có tòa nhà không tồn tại hoặc không thuộc quyền quản lý");
            }
        }

        private static void SyncAssetBuildingScopes(TaiSan asset, List<int> buildingIds)
        {
            asset.BuildingScopes.Clear();
            foreach (var buildingId in buildingIds.Distinct())
            {
                asset.BuildingScopes.Add(new TaiSanBuildingScope
                {
                    Asset = asset,
                    BuildingId = buildingId
                });
            }
        }
    }
}
