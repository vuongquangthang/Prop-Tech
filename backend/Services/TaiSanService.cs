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
            var assetName = dto.AssetName?.Trim();
            var assetCode = dto.AssetCode?.Trim();
            if (string.IsNullOrWhiteSpace(assetName))
            {
                throw new Exception("Vui lòng nhập tên tài sản");
            }
            if (string.IsNullOrWhiteSpace(assetCode))
            {
                throw new Exception("Vui lòng nhập mã tài sản");
            }

            var buildingIds = NormalizeBuildingIds(dto.BuildingIds, dto.BuildingId);
            if (buildingIds.Count == 0)
            {
                throw new Exception("Vui lòng chọn tòa nhà áp dụng");
            }
            await EnsureOwnsBuildingsAsync(buildingIds, ownerUserId);

            // Check duplicate asset code
            var normalizedAssetCode = assetCode.ToUpper();
            var sameCodeAssets = await _context.TaiSans
                .AsNoTracking()
                .Include(asset => asset.BuildingScopes)
                .Where(asset => asset.OwnerUserId == ownerUserId && asset.AssetCode.Trim().ToUpper() == normalizedAssetCode)
                .ToListAsync();
            if (sameCodeAssets.Any(asset => AssetScopesConflict(GetAssetBuildingIds(asset), buildingIds)))
            {
                throw new Exception($"Mã tài sản '{assetCode}' đã tồn tại trong tòa nhà đã chọn");
            }

            var taiSan = new TaiSan
            {
                AssetName = assetName,
                AssetCode = assetCode,
                OwnerUserId = ownerUserId,
                BuildingId = null
            };
            SyncAssetBuildingScopes(taiSan, buildingIds);

            var created = await _taiSanRepository.CreateAsync(taiSan);
            var reloaded = await _taiSanRepository.GetByIdAsync(created.Id, ownerUserId);
            return MapToDto(reloaded ?? created);
        }

        public async Task<TaiSanDto> UpdateAsync(int id, UpdateTaiSanDto dto, int ownerUserId)
        {
            var taiSan = await _taiSanRepository.GetByIdAsync(id, ownerUserId);
            if (taiSan == null)
            {
                throw new Exception("Tài sản không tồn tại");
            }

            // Update fields
            if (dto.AssetName != null)
            {
                var nextAssetName = dto.AssetName.Trim();
                if (string.IsNullOrWhiteSpace(nextAssetName))
                {
                    throw new Exception("Vui lòng nhập tên tài sản");
                }
                taiSan.AssetName = nextAssetName;
            }

            if (dto.AssetCode != null)
            {
                var nextAssetCode = dto.AssetCode.Trim();
                if (string.IsNullOrWhiteSpace(nextAssetCode))
                {
                    throw new Exception("Vui lòng nhập mã tài sản");
                }
                var isChangingAssetCode = !string.Equals(taiSan.AssetCode, nextAssetCode, StringComparison.OrdinalIgnoreCase);
                var normalizedNextAssetCode = nextAssetCode.ToUpper();

                var nextBuildingIds = dto.BuildingIds != null || dto.BuildingId.HasValue
                    ? NormalizeBuildingIds(dto.BuildingIds, dto.BuildingId)
                    : GetAssetBuildingIds(taiSan);
                if (nextBuildingIds.Count == 0)
                {
                    throw new Exception("Vui lòng chọn tòa nhà áp dụng");
                }

                if (isChangingAssetCode || dto.BuildingIds != null || dto.BuildingId.HasValue)
                {
                    var sameCodeAssets = await _context.TaiSans
                        .AsNoTracking()
                        .Include(asset => asset.BuildingScopes)
                        .Where(asset => asset.Id != taiSan.Id
                            && asset.OwnerUserId == ownerUserId
                            && asset.AssetCode.Trim().ToUpper() == normalizedNextAssetCode)
                        .ToListAsync();
                    if (sameCodeAssets.Any(asset => AssetScopesConflict(GetAssetBuildingIds(asset), nextBuildingIds)))
                    {
                        throw new Exception($"Mã tài sản '{nextAssetCode}' đã tồn tại trong tòa nhà đã chọn");
                    }
                }
                taiSan.AssetCode = nextAssetCode;
            }

            if (dto.BuildingIds != null || dto.BuildingId.HasValue)
            {
                var buildingIds = NormalizeBuildingIds(dto.BuildingIds, dto.BuildingId);
                if (buildingIds.Count == 0)
                {
                    throw new Exception("Vui lòng chọn tòa nhà áp dụng");
                }
                await EnsureOwnsBuildingsAsync(buildingIds, ownerUserId);
                SyncAssetBuildingScopes(taiSan, buildingIds);
                taiSan.BuildingId = null;
            }

            var updated = await _taiSanRepository.UpdateAsync(taiSan);
            var reloaded = await _taiSanRepository.GetByIdAsync(updated.Id, ownerUserId);
            return MapToDto(reloaded ?? updated);
        }

        public async Task<bool> DeleteAsync(int id, int ownerUserId)
        {
            var taiSan = await _taiSanRepository.GetByIdAsync(id, ownerUserId);
            if (taiSan == null)
            {
                return false;
            }

            var usedRoomCount = taiSan.ChiTietTaiSanPhongs?
                .Select(detail => detail.RoomId)
                .Distinct()
                .Count() ?? 0;
            if (usedRoomCount > 0)
            {
                throw new InvalidOperationException($"Không thể xóa tài sản đang được sử dụng ở {usedRoomCount} phòng. Vui lòng gỡ tài sản khỏi các phòng trước khi xóa.");
            }

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

        private static List<int> GetAssetBuildingIds(TaiSan asset)
        {
            var scopedIds = asset.BuildingScopes?
                .Select(scope => scope.BuildingId)
                .Where(id => id > 0)
                .Distinct()
                .ToList() ?? new List<int>();
            if (scopedIds.Count == 0 && asset.BuildingId.HasValue && asset.BuildingId.Value > 0)
            {
                scopedIds.Add(asset.BuildingId.Value);
            }

            return scopedIds;
        }

        private static bool AssetScopesConflict(List<int> first, List<int> second)
        {
            if (first.Count == 0 || second.Count == 0)
            {
                return first.Count == second.Count;
            }

            return first.Intersect(second).Any();
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
