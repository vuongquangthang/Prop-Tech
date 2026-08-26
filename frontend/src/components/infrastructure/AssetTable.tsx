import { Plus, Edit2, Trash2, X, AlertTriangle, Package, Link2, Loader2, Eye, ChevronRight } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { api } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../lib/api-config';
import { normalizeSearchText, searchIncludes } from '../../lib/search';
import { buildingService } from '../../services/api.service';
import { PageHeader } from '../ui/product-system';
import { useTablePagination } from '../../lib/useTablePagination';
import { TablePaginationBar } from '../ui/TablePaginationBar';
import { getCachedData, getCurrentDataCacheScope, invalidateCachedData, setCachedData } from '../../lib/memoryDataCache';

const INFRA_CACHE_TTL_MS = 2 * 60 * 1000;

const getInfrastructureCacheKey = (name: string) => `infrastructure:${getCurrentDataCacheScope()}:${name}`;
const invalidateInfrastructureCache = () => invalidateCachedData(`infrastructure:${getCurrentDataCacheScope()}:`);

interface TaiSanDto {
  id: number;
  assetName: string;
  assetCode: string;
  totalRooms: number;
  totalQuantity: number;
  buildingId?: number | null;
  buildingName?: string | null;
  buildingIds?: number[];
  buildingNames?: string[];
}

interface AssetGroup extends TaiSanDto {
  items: TaiSanDto[];
  assetIds: number[];
  buildingIds: number[];
  buildingNames: string[];
}

interface FormData {
  assetName: string;
  assetCode: string;
  buildingIds: number[];
}

interface AssetFieldErrors {
  buildingIds?: string;
  assetName?: string;
  assetCode?: string;
}

interface BuildingOption {
  id: number;
  buildingName?: string;
  name?: string;
}

interface RoomItem {
  id: number;
  roomCode: string;
  status: string;
  buildingId?: number | null;
  buildingName?: string;
  floorNumber?: number;
}

interface RoomAssignment {
  roomId: number;
  assetId: number;
  quantity: number;
  condition?: string;
  note?: string;
  roomCode?: string;
  assetName?: string;
  assetCode?: string;
  buildingId?: number | null;
  buildingName?: string;
  floorNumber?: number;
}

interface AssetTableProps {
  embedded?: boolean;
  contextBuildingId?: number | null;
  inlineForms?: boolean;
}

export function AssetTable({ embedded = false, contextBuildingId = null, inlineForms = false }: AssetTableProps = {}) {
  const [assets, setAssets] = useState<TaiSanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetGroup | null>(null);
  const [deleteAssetError, setDeleteAssetError] = useState('');
  const [formData, setFormData] = useState<FormData>({ assetName: '', assetCode: '', buildingIds: [] });
  const [assetFieldErrors, setAssetFieldErrors] = useState<AssetFieldErrors>({});
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);

  // Assign to room state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignAsset, setAssignAsset] = useState<AssetGroup | null>(null);
  const [assignments, setAssignments] = useState<RoomAssignment[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [assignRoomSearch, setAssignRoomSearch] = useState('');
  const [assignStatusFilter, setAssignStatusFilter] = useState<'all' | 'available' | 'assigned'>('all');
  const [assignListMode, setAssignListMode] = useState<'assigned' | 'unassigned' | null>(null);
  // New assignment form
  const [addRoomIds, setAddRoomIds] = useState<number[]>([]);
  const [addQty, setAddQty] = useState('1');
  const [addCondition, setAddCondition] = useState('Tốt');
  const [addNote, setAddNote] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const fetchAssets = async ({ force = false, silent = false }: { force?: boolean; silent?: boolean } = {}) => {
    try {
      const cacheKey = getInfrastructureCacheKey('assets');
      const cached = !force ? getCachedData<TaiSanDto[]>(cacheKey, INFRA_CACHE_TTL_MS) : null;
      if (cached) {
        setAssets(cached);
        setError(null);
        return;
      }

      if (!silent) setLoading(true);
      setError(null);
      const res = await api.get<TaiSanDto[]>(API_ENDPOINTS.ASSETS.BASE);
      setCachedData(cacheKey, res.data);
      setAssets(res.data);
    } catch {
      setError('Không thể tải danh sách tài sản');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchBuildings();
  }, []);

  const fetchBuildings = async ({ force = false }: { force?: boolean } = {}) => {
    try {
      const cacheKey = getInfrastructureCacheKey('buildings');
      const cached = !force ? getCachedData<BuildingOption[]>(cacheKey, INFRA_CACHE_TTL_MS) : null;
      if (cached) {
        setBuildings(cached);
        return;
      }

      const data = await buildingService.getAll();
      const normalized = data as BuildingOption[];
      setCachedData(cacheKey, normalized);
      setBuildings(normalized);
    } catch {
      setBuildings([]);
    }
  };

  const assetGroups = useMemo<AssetGroup[]>(() => {
    const grouped = new Map<string, TaiSanDto[]>();
    assets.forEach((asset) => {
      const scopedBuildingIds = asset.buildingIds?.length
        ? asset.buildingIds
        : typeof asset.buildingId === 'number'
          ? [asset.buildingId]
          : [];
      const scopeKey = scopedBuildingIds.length > 0
        ? `building:${[...scopedBuildingIds].sort((a, b) => a - b).join(',')}`
        : 'legacy-unscoped';
      const key = `${asset.assetCode.trim().toLowerCase()}__${asset.assetName.trim().toLowerCase()}__${scopeKey}`;
      grouped.set(key, [...(grouped.get(key) || []), asset]);
    });

    return Array.from(grouped.values()).map((items) => {
      const first = items[0];
      const buildingIds = items.flatMap((item) =>
        item.buildingIds?.length
          ? item.buildingIds
          : typeof item.buildingId === 'number'
            ? [item.buildingId]
            : [],
      );
      const buildingNames = items.flatMap((item) =>
        item.buildingNames?.length
          ? item.buildingNames
          : item.buildingName
            ? [item.buildingName]
            : [],
      );

      return {
        ...first,
        items,
        assetIds: items.map((item) => item.id),
        buildingIds: Array.from(new Set(buildingIds)),
        buildingNames: Array.from(new Set(buildingNames)),
        totalRooms: items.reduce((sum, item) => sum + (item.totalRooms || 0), 0),
        totalQuantity: items.reduce((sum, item) => sum + (item.totalQuantity || 0), 0),
      };
    });
  }, [assets]);

  const filteredAssetGroups = useMemo(() => {
    if (typeof contextBuildingId !== 'number') {
      return assetGroups;
    }

    return assetGroups.filter((asset) =>
      asset.buildingIds.includes(contextBuildingId),
    );
  }, [assetGroups, contextBuildingId]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    pagedItems: pagedAssetGroups,
  } = useTablePagination(filteredAssetGroups, {
    initialPageSize: 10,
    resetDeps: [contextBuildingId],
  });

  const getBuildingLabel = (building: BuildingOption) => building.buildingName || building.name || `Tòa #${building.id}`;
  const getContextBuildingLabel = () => {
    if (typeof contextBuildingId !== 'number') return '';
    const building = buildings.find((item) => item.id === contextBuildingId);
    return building ? getBuildingLabel(building) : `Tòa #${contextBuildingId}`;
  };
  const getTargetBuildingIds = () =>
    typeof contextBuildingId === 'number' ? [contextBuildingId] : formData.buildingIds;

  const getAssetBuildingIds = (asset: TaiSanDto) =>
    asset.buildingIds?.length
      ? asset.buildingIds
      : typeof asset.buildingId === 'number'
        ? [asset.buildingId]
        : [];

  const assetScopesConflict = (first: number[], second: number[]) => {
    if (first.length === 0 || second.length === 0) {
      return first.length === second.length;
    }

    return first.some((buildingId) => second.includes(buildingId));
  };

  const getSelectedAssetIds = () =>
    selectedAsset?.assetIds || (selectedAsset?.id ? [selectedAsset.id] : []);

  const getDuplicateAssetCodeMessage = (
    assetCode: string,
    buildingIds: number[],
    excludeAssetIds: number[] = [],
  ) => {
    const normalizedCode = assetCode.trim().toLowerCase();
    if (!normalizedCode) return '';

    const excluded = new Set(excludeAssetIds);
    const duplicated = assets.some((asset) =>
      !excluded.has(asset.id)
      && asset.assetCode.trim().toLowerCase() === normalizedCode
      && assetScopesConflict(getAssetBuildingIds(asset), buildingIds)
    );

    return duplicated ? 'Mã tài sản đã tồn tại trong tòa nhà đã chọn' : '';
  };

  const setAssetCodeValidationError = (
    assetCode: string,
    buildingIds: number[],
    excludeAssetIds: number[] = getSelectedAssetIds(),
  ) => {
    const duplicateMessage = getDuplicateAssetCodeMessage(assetCode, buildingIds, excludeAssetIds);
    setAssetFieldErrors((current) => {
      const next = { ...current };
      if (duplicateMessage) {
        next.assetCode = duplicateMessage;
      } else if (next.assetCode === 'Mã tài sản đã tồn tại trong tòa nhà đã chọn') {
        delete next.assetCode;
      }
      return next;
    });
    return duplicateMessage;
  };

  const openAddModal = () => {
    setErrorModalMessage('');
    setAssetFieldErrors({});
    setFormData({
      assetName: '',
      assetCode: '',
      buildingIds: typeof contextBuildingId === 'number' ? [contextBuildingId] : [],
    });
    setShowAddModal(true);
  };

  const validateAssetForm = (targetBuildingIds: number[]) => {
    const nextErrors: AssetFieldErrors = {};
    if (targetBuildingIds.length === 0) {
      nextErrors.buildingIds = 'Vui lòng chọn tòa nhà áp dụng';
    }
    if (!formData.assetName.trim()) {
      nextErrors.assetName = 'Vui lòng nhập tên tài sản';
    }
    if (!formData.assetCode.trim()) {
      nextErrors.assetCode = 'Vui lòng nhập mã tài sản';
    } else {
      const duplicateMessage = getDuplicateAssetCodeMessage(
        formData.assetCode,
        targetBuildingIds,
        getSelectedAssetIds(),
      );
      if (duplicateMessage) {
        nextErrors.assetCode = duplicateMessage;
      }
    }

    setAssetFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const clearAssetFieldError = (field: keyof AssetFieldErrors) => {
    setAssetFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleAdd = async () => {
    const targetBuildingIds = getTargetBuildingIds();
    if (!validateAssetForm(targetBuildingIds)) {
      return;
    }
    try {
      setSaving(true);
      await api.post(API_ENDPOINTS.ASSETS.BASE, {
        assetName: formData.assetName.trim(),
        assetCode: formData.assetCode.trim(),
        buildingIds: targetBuildingIds,
      });
      setShowAddModal(false);
      setFormData({ assetName: '', assetCode: '', buildingIds: [] });
      invalidateInfrastructureCache();
      await fetchAssets({ force: true, silent: true });
    } catch (err: any) {
      setErrorModalMessage(err.response?.data?.message || err.message || 'Thêm tài sản thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAsset) return;
    const targetBuildingIds = getTargetBuildingIds();
    if (!validateAssetForm(targetBuildingIds)) {
      return;
    }
    try {
      setSaving(true);
      const payload = {
        assetName: formData.assetName.trim(),
        assetCode: formData.assetCode.trim(),
        buildingIds: targetBuildingIds,
      };
      await Promise.all(selectedAsset.assetIds.map((assetId) => api.put(API_ENDPOINTS.ASSETS.BY_ID(assetId), payload)));
      setShowEditModal(false);
      setSelectedAsset(null);
      invalidateInfrastructureCache();
      await fetchAssets({ force: true, silent: true });
    } catch (err: any) {
      setErrorModalMessage(err.response?.data?.message || err.message || 'Cập nhật tài sản thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;
    if ((selectedAsset.totalRooms || 0) > 0) {
      setDeleteAssetError(`Không thể xóa tài sản đang được sử dụng ở ${selectedAsset.totalRooms} phòng. Vui lòng gỡ tài sản khỏi các phòng trước khi xóa.`);
      return;
    }

    try {
      setSaving(true);
      setDeleteAssetError('');
      await Promise.all(selectedAsset.assetIds.map((assetId) => api.delete(API_ENDPOINTS.ASSETS.BY_ID(assetId))));
      setShowDeleteModal(false);
      setSelectedAsset(null);
      invalidateInfrastructureCache();
      await fetchAssets({ force: true, silent: true });
    } catch (err: any) {
      setDeleteAssetError(err.response?.data?.message || err.message || 'Xóa tài sản thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (asset: AssetGroup) => {
    setSelectedAsset(asset);
    setErrorModalMessage('');
    setAssetFieldErrors({});
    setFormData({
      assetName: asset.assetName,
      assetCode: asset.assetCode,
      buildingIds: typeof contextBuildingId === 'number' ? [contextBuildingId] : asset.buildingIds,
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (asset: AssetGroup) => {
    setSelectedAsset(asset);
    setDeleteAssetError('');
    setShowDeleteModal(true);
  };

  const handleAssignClick = async (asset: AssetGroup) => {
    setAssignAsset(asset);
    setAssignError(null);
    setAddRoomIds([]);
    setAddQty('1');
    setAddCondition('Tốt');
    setAddNote('');
    setAssignRoomSearch('');
    setAssignStatusFilter('all');
    setAssignListMode(null);
    setShowAssignModal(true);
    setAssignLoading(true);
    try {
      const [assignmentResponses, roomRes] = await Promise.all([
        Promise.all(asset.items.map((item) => api.get<RoomAssignment[]>(API_ENDPOINTS.ASSETS.ROOM_ASSETS_BY_ASSET(item.id)))),
        api.get<any[]>(API_ENDPOINTS.ROOMS.BASE),
      ]);
      const assetById = new Map(asset.items.map((item) => [item.id, item]));
      const nextAssignments = assignmentResponses.flatMap((response) =>
        response.data.map((assignment) => {
          const assetItem = assetById.get(assignment.assetId);
          return {
            ...assignment,
            buildingId: assetItem?.buildingId ?? null,
            buildingName: assetItem?.buildingName || '',
          };
        }),
      );
      setAssignments(nextAssignments);
      const mappedRooms: RoomItem[] = roomRes.data.map((r: any) => ({
        id: r.id,
        roomCode: r.roomCode || r.code || '',
        status: r.status || '',
        buildingId: r.buildingId,
        buildingName: r.buildingName || '',
        floorNumber: r.floorNumber,
      })).filter((r: RoomItem) => asset.buildingIds.length === 0 || !r.buildingId || asset.buildingIds.includes(r.buildingId));
      setRooms(mappedRooms);
    } catch {
      setAssignError('Không thể tải dữ liệu');
    } finally {
      setAssignLoading(false);
    }
  };

  const fetchAssignments = async (asset: AssetGroup) => {
    const responses = await Promise.all(
      asset.items.map((item) => api.get<RoomAssignment[]>(API_ENDPOINTS.ASSETS.ROOM_ASSETS_BY_ASSET(item.id))),
    );
    const assetById = new Map(asset.items.map((item) => [item.id, item]));
    setAssignments(
      responses.flatMap((response) =>
        response.data.map((assignment) => {
          const assetItem = assetById.get(assignment.assetId);
          return {
            ...assignment,
            buildingId: assetItem?.buildingId ?? null,
            buildingName: assetItem?.buildingName || '',
          };
        }),
      ),
    );
  };

  const toggleAddRoom = (roomId: number) => {
    setAddRoomIds((current) =>
      current.includes(roomId)
        ? current.filter((id) => id !== roomId)
        : [...current, roomId],
    );
  };

  const handleAddAssignment = async () => {
    if (!assignAsset || addRoomIds.length === 0) return;
    setAddSaving(true);
    setAssignError(null);
    try {
      await Promise.all(
        addRoomIds.map((roomId) => {
          const room = rooms.find((item) => item.id === roomId);
          const assetForRoom = assignAsset.items.find((item) => item.buildingId === room?.buildingId) || assignAsset.items[0];
          return api.post(API_ENDPOINTS.ASSETS.ROOM_ASSETS, {
            roomId,
            assetId: assetForRoom.id,
            quantity: parseInt(addQty) || 1,
            condition: addCondition,
            note: addNote.trim() || undefined,
          });
        }),
      );
      await fetchAssignments(assignAsset);
      setAddRoomIds([]); setAddQty('1'); setAddCondition('Tốt'); setAddNote('');
      invalidateInfrastructureCache();
      await fetchAssets({ force: true, silent: true });
    } catch (e: any) {
      setAssignError(e.response?.data?.message || e.message || 'Gán thất bại');
    } finally {
      setAddSaving(false);
    }
  };

  const handleRemoveAssignment = async (row: RoomAssignment) => {
    if (!assignAsset) return;
    setAssignError(null);
    try {
      await api.delete(API_ENDPOINTS.ASSETS.ROOM_ASSETS_DELETE(row.roomId, row.assetId));
      await fetchAssignments(assignAsset);
      invalidateInfrastructureCache();
      await fetchAssets({ force: true, silent: true });
    } catch (e: any) {
      setAssignError(e.response?.data?.message || e.message || 'Xóa thất bại');
    }
  };

  const assignedRoomIds = new Set(assignments.map((assignment) => assignment.roomId));
  const availableAssignRooms = rooms.filter((room) => !assignedRoomIds.has(room.id));
  const assignmentByRoomId = new Map(assignments.map((assignment) => [assignment.roomId, assignment]));
  const buildingTree = assignAsset
    ? (assignAsset.buildingIds.length > 0 ? assignAsset.buildingIds : allBuildingIds).map((buildingId) => {
        const buildingRooms = rooms.filter((room) => room.buildingId === buildingId);
        const building = buildings.find((item) => item.id === buildingId);
        const floors = Array.from(new Set(buildingRooms.map((room) => room.floorNumber ?? 0))).sort((a, b) => a - b);
        return {
          buildingId,
          buildingName: building?.buildingName || building?.name || `Tòa #${buildingId}`,
          floors: floors.map((floorNumber) => ({
            floorNumber,
            rooms: buildingRooms.filter((room) => (room.floorNumber ?? 0) === floorNumber),
          })),
        };
      })
    : [];
  const normalizedAssignSearch = normalizeSearchText(assignRoomSearch);
  const visibleBuildingTree = buildingTree
    .map((building) => ({
      ...building,
      floors: building.floors
        .map((floor) => ({
          ...floor,
          rooms: floor.rooms.filter((room) => {
            const assigned = assignedRoomIds.has(room.id);
            if (assignStatusFilter === 'available' && assigned) return false;
            if (assignStatusFilter === 'assigned' && !assigned) return false;
            if (!normalizedAssignSearch) return true;

            return [
              room.roomCode,
              building.buildingName,
              floor.floorNumber ? `Tầng ${floor.floorNumber}` : '',
            ]
              .filter(Boolean)
              .join(' ');
            return searchIncludes(searchValue, normalizedAssignSearch);
          }),
        }))
        .filter((floor) => floor.rooms.length > 0),
    }))
    .filter((building) => {
      if (building.floors.length > 0) return true;
      if (!normalizedAssignSearch && assignStatusFilter === 'all') return true;
      return normalizedAssignSearch.length > 0 && searchIncludes(building.buildingName, normalizedAssignSearch);
    });
  const visibleAvailableRoomIds = visibleBuildingTree.flatMap((building) =>
    building.floors.flatMap((floor) => floor.rooms.filter((room) => !assignedRoomIds.has(room.id)).map((room) => room.id)),
  );
  const selectedVisibleAvailable = visibleAvailableRoomIds.length > 0 && visibleAvailableRoomIds.every((roomId) => addRoomIds.includes(roomId));
  const selectedAssignRooms = rooms.filter((room) => addRoomIds.includes(room.id));
  const assignedRooms = rooms.filter((room) => assignedRoomIds.has(room.id));
  const unassignedRooms = rooms.filter((room) => !assignedRoomIds.has(room.id));
  const hasAssetFieldErrors = Object.keys(assetFieldErrors).length > 0;
  const assignScopeLabel = assignAsset
    ? assignAsset.buildingIds.length === 0
      ? 'Tất cả tòa nhà'
      : assignAsset.buildingNames.length > 0
        ? assignAsset.buildingNames.join(', ')
        : `${assignAsset.buildingIds.length} tòa nhà`
    : '';
  const assignListRooms = assignListMode === 'assigned' ? assignedRooms : assignListMode === 'unassigned' ? unassignedRooms : [];

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          eyebrow="Quản lý hạ tầng"
          title="Tài sản trong phòng"
          description="Quản lý danh mục tài sản, số lượng và các phòng đang sử dụng."
          actions={
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-gray-800 text-white text-sm rounded flex items-center space-x-2 hover:bg-gray-700"
            >
              <Plus size={16} />
              <span>Thêm tài sản</span>
            </button>
          }
        />
      )}
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="table-section-title">
              Danh sách tài sản - {filteredAssetGroups.length}/{typeof contextBuildingId === 'number' ? filteredAssetGroups.length : assetGroups.length} loại tài sản
            </h2>
            {embedded && (
              <button
                onClick={openAddModal}
                className="ml-auto inline-flex shrink-0 items-center gap-1.5 bg-gray-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700"
              >
                <Plus size={14} />
                <span>Thêm tài sản</span>
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">Đang tải...</div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={fetchAssets} className="px-4 py-2 bg-gray-800 text-white text-sm rounded">Thử lại</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">STT</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Tên tài sản</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Mã tài sản</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Số phòng sử dụng</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Tổng số lượng</th>
                  <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssetGroups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Chưa có tài sản nào. Nhấn "Thêm tài sản" để bắt đầu.
                    </td>
                  </tr>
                ) : pagedAssetGroups.map((asset, index) => (
                  <tr key={asset.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{asset.assetName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-mono">{asset.assetCode}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">{asset.totalRooms}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">{asset.totalQuantity}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button className="p-2 hover:bg-blue-50 rounded" title="Gán vào phòng" onClick={() => handleAssignClick(asset)}>
                          <Link2 size={16} className="text-blue-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded" title="Sửa" onClick={() => handleEditClick(asset)}>
                          <Edit2 size={16} className="text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded" title="Xóa" onClick={() => handleDeleteClick(asset)}>
                          <Trash2 size={16} className="text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredAssetGroups.length > 0 && (
          <TablePaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
      
      {/* Add Asset Modal */}
      {showAddModal && (
        <div className={inlineForms ? "border border-[var(--brand-border)] bg-white shadow-sm" : "admin-content-modal-overlay"}>
          <div className={inlineForms ? "w-full bg-white" : "bg-white rounded-lg w-[500px]"}>
            <div className={`border-b border-gray-300 px-6 py-4 flex items-center justify-between ${inlineForms ? 'bg-[var(--brand-surface)]' : ''}`}>
              <div className="flex items-center space-x-2">
                <Package size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Thêm tài sản vào kho</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tòa nhà áp dụng *</label>
                {typeof contextBuildingId === 'number' ? (
                  <div className="border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
                    {getContextBuildingLabel()}
                  </div>
                ) : (
                  <div className="max-h-44 overflow-y-auto border border-gray-300 bg-white">
                    {buildings.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-500">Chưa có tòa nhà để chọn.</p>
                    ) : (
                      buildings.map((building) => (
                        <label key={building.id} className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-gray-50">
                          <input
                            type="radio"
                            name="add-asset-building"
                            checked={formData.buildingIds.includes(building.id)}
                            onChange={() => {
                              const nextBuildingIds = [building.id];
                              clearAssetFieldError('buildingIds');
                              setFormData((current) => ({ ...current, buildingIds: nextBuildingIds }));
                              setAssetCodeValidationError(formData.assetCode, nextBuildingIds, []);
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-gray-800">{getBuildingLabel(building)}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
                {assetFieldErrors.buildingIds && (
                  <p className="mt-1 text-xs text-red-600">{assetFieldErrors.buildingIds}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tên tài sản *</label>
                  <input 
                    type="text"
                    value={formData.assetName}
                    onChange={e => {
                      clearAssetFieldError('assetName');
                      setFormData(f => ({ ...f, assetName: e.target.value }));
                    }}
                    placeholder="VD: Điều hòa Daikin 12000BTU"
                    className={`w-full rounded border px-3 py-2 text-sm focus:outline-none ${assetFieldErrors.assetName ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-gray-500'}`}
                  />
                  {assetFieldErrors.assetName && (
                    <p className="mt-1 text-xs text-red-600">{assetFieldErrors.assetName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Mã tài sản *</label>
                  <input 
                    type="text"
                    value={formData.assetCode}
                    onChange={e => {
                      const nextAssetCode = e.target.value;
                      clearAssetFieldError('assetCode');
                      setFormData(f => ({ ...f, assetCode: nextAssetCode }));
                      setAssetCodeValidationError(nextAssetCode, getTargetBuildingIds(), []);
                    }}
                    onBlur={() => setAssetCodeValidationError(formData.assetCode, getTargetBuildingIds(), [])}
                    placeholder="VD: AC-001"
                    className={`w-full rounded border px-3 py-2 text-sm focus:outline-none ${assetFieldErrors.assetCode ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-gray-500'}`}
                  />
                  {assetFieldErrors.assetCode ? (
                    <p className="mt-1 text-xs text-red-600">{assetFieldErrors.assetCode}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Mã tài sản phải là duy nhất trong hệ thống</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleAdd}
                disabled={saving || hasAssetFieldErrors}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-100 disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : 'Xác nhận thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && selectedAsset && (
        <div className={inlineForms ? "border border-[var(--brand-border)] bg-white shadow-sm" : "admin-content-modal-overlay"}>
          <div className={inlineForms ? "w-full bg-white" : "bg-white rounded-lg w-[500px]"}>
            <div className={`border-b border-gray-300 px-6 py-4 flex items-center justify-between ${inlineForms ? 'bg-[var(--brand-surface)]' : ''}`}>
              <div className="flex items-center space-x-2">
                <Edit2 size={20} className="text-gray-800" />
                <h3 className="text-lg text-gray-800">Chỉnh sửa tài sản</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Tòa nhà áp dụng *</label>
                {typeof contextBuildingId === 'number' ? (
                  <div className="border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900">
                    {getContextBuildingLabel()}
                  </div>
                ) : (
                  <div className="max-h-44 overflow-y-auto border border-gray-300 bg-white">
                    {buildings.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-gray-500">Chưa có tòa nhà để chọn.</p>
                    ) : (
                      buildings.map((building) => (
                        <label key={building.id} className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-gray-50">
                          <input
                            type="radio"
                            name="edit-asset-building"
                            checked={formData.buildingIds.includes(building.id)}
                            onChange={() => {
                              const nextBuildingIds = [building.id];
                              clearAssetFieldError('buildingIds');
                              setFormData((current) => ({ ...current, buildingIds: nextBuildingIds }));
                              setAssetCodeValidationError(formData.assetCode, nextBuildingIds, getSelectedAssetIds());
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-gray-800">{getBuildingLabel(building)}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
                {assetFieldErrors.buildingIds && (
                  <p className="mt-1 text-xs text-red-600">{assetFieldErrors.buildingIds}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Tên tài sản *</label>
                  <input 
                    type="text"
                    value={formData.assetName}
                    onChange={e => {
                      clearAssetFieldError('assetName');
                      setFormData(f => ({ ...f, assetName: e.target.value }));
                    }}
                    className={`w-full rounded border px-3 py-2 text-sm focus:outline-none ${assetFieldErrors.assetName ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-gray-500'}`}
                  />
                  {assetFieldErrors.assetName && (
                    <p className="mt-1 text-xs text-red-600">{assetFieldErrors.assetName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Mã tài sản *</label>
                  <input 
                    type="text"
                    value={formData.assetCode}
                    onChange={e => {
                      const nextAssetCode = e.target.value;
                      clearAssetFieldError('assetCode');
                      setFormData(f => ({ ...f, assetCode: nextAssetCode }));
                      setAssetCodeValidationError(nextAssetCode, getTargetBuildingIds(), getSelectedAssetIds());
                    }}
                    onBlur={() => setAssetCodeValidationError(formData.assetCode, getTargetBuildingIds(), getSelectedAssetIds())}
                    className={`w-full rounded border px-3 py-2 text-sm focus:outline-none ${assetFieldErrors.assetCode ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-gray-500'}`}
                  />
                  {assetFieldErrors.assetCode && (
                    <p className="mt-1 text-xs text-red-600">{assetFieldErrors.assetCode}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleEdit}
                disabled={saving || hasAssetFieldErrors}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-100 disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAsset && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg text-gray-800">Xác nhận xóa tài sản</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3 bg-red-50 border border-red-300 rounded p-4">
                <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-bold mb-1">Bạn có chắc chắn muốn xóa tài sản này?</p>
                  <p className="text-sm text-red-700">Hành động này không thể hoàn tác!</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4 space-y-1">
                <p className="text-sm text-gray-800"><strong>Tên:</strong> {selectedAsset.assetName}</p>
                <p className="text-sm text-gray-800"><strong>Mã:</strong> {selectedAsset.assetCode}</p>
                <p className="text-sm text-gray-800"><strong>Số phòng sử dụng:</strong> {selectedAsset.totalRooms}</p>
                <p className="text-sm text-gray-800"><strong>Tổng số lượng:</strong> {selectedAsset.totalQuantity}</p>
              </div>

              {deleteAssetError && (
                <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {deleteAssetError}
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Room Modal */}
      {showAssignModal && assignAsset && (
        <div className="admin-content-modal-overlay">
          <div className="asset-assign-modal-panel bg-white rounded-lg w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Liên kết tài sản với phòng</h3>
                <p className="mt-0.5 text-sm text-gray-500">
                  {assignAsset.assetName} · <span className="font-mono">{assignAsset.assetCode}</span>
                </p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="flex-shrink-0 bg-gray-50 p-5">
              {assignLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {assignError && (
                    <div className="bg-red-50 border border-red-300 rounded px-3 py-2 text-sm text-red-700">{assignError}</div>
                  )}

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="border border-gray-200 bg-white px-4 py-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tòa nhà</p>
                      <p className="mt-2 text-base font-semibold text-gray-900">{assignScopeLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAssignListMode(assignListMode === 'assigned' ? null : 'assigned')}
                      className="border border-green-200 bg-white px-4 py-4 text-left transition-colors hover:bg-green-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Đã gán phòng</p>
                          <p className="mt-2 text-2xl font-semibold text-green-700">{assignedRooms.length}</p>
                        </div>
                        <Eye size={18} className="text-green-700" />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignListMode(assignListMode === 'unassigned' ? null : 'unassigned')}
                      className="border border-blue-200 bg-white px-4 py-4 text-left transition-colors hover:bg-blue-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Chưa gán phòng</p>
                          <p className="mt-2 text-2xl font-semibold text-blue-700">{unassignedRooms.length}</p>
                        </div>
                        <Eye size={18} className="text-blue-700" />
                      </div>
                    </button>
                  </div>

                  {assignListMode && (
                    <div className="border border-gray-200 bg-white">
                      <div className="border-b border-gray-200 px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {assignListMode === 'assigned' ? 'Danh sách phòng đã gán' : 'Danh sách phòng chưa gán'}
                        </p>
                      </div>
                      <div className="grid max-h-[45vh] gap-2 overflow-y-auto p-4 sm:grid-cols-2 lg:grid-cols-3">
                        {assignListRooms.length === 0 ? (
                          <p className="text-sm text-gray-500">Không có phòng.</p>
                        ) : assignListRooms.map((room) => (
                          <div key={room.id} className="border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                            <p className="font-semibold text-gray-900">{room.roomCode}</p>
                            <p className="mt-1 text-xs text-gray-600">
                              {room.buildingName || 'Chưa rõ tòa'}{room.floorNumber ? ` · Tầng ${room.floorNumber}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain bg-gray-50 p-5">
              {assignError && (
                <div className="mb-4 bg-red-50 border border-red-300 rounded px-3 py-2 text-sm text-red-700">{assignError}</div>
              )}

              <div className="mb-4 grid grid-cols-4 gap-3">
                <div className="border border-gray-200 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Tài sản</p>
                  <p className="mt-1 truncate text-sm font-semibold text-gray-900">{assignAsset.assetName}</p>
                </div>
                <div className="border border-gray-200 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Tòa áp dụng</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {assignAsset.buildingIds.length === 0 ? 'Tất cả' : assignAsset.buildingIds.length}
                  </p>
                </div>
                <div className="border border-gray-200 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Đã gán</p>
                  <p className="mt-1 text-sm font-semibold text-green-700">{assignments.length}</p>
                </div>
                <div className="border border-gray-200 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">Có thể gán</p>
                  <p className="mt-1 text-sm font-semibold text-blue-700">{availableAssignRooms.length}</p>
                </div>
              </div>

              <div className="asset-assign-modal-grid min-h-[560px] gap-4">
                <section className="flex min-h-0 flex-col border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 bg-white px-4 py-3">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Danh sách phòng</h4>
                        <p className="mt-0.5 text-xs text-gray-500">Chọn các phòng cần gán trong phạm vi tòa đã áp dụng.</p>
                      </div>
                      {visibleAvailableRoomIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setAddRoomIds((current) => {
                              if (selectedVisibleAvailable) {
                                return current.filter((roomId) => !visibleAvailableRoomIds.includes(roomId));
                              }
                              return Array.from(new Set([...current, ...visibleAvailableRoomIds]));
                            })
                          }
                          className="shrink-0 border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          {selectedVisibleAvailable ? 'Bỏ chọn danh sách này' : 'Chọn danh sách này'}
                        </button>
                      )}
                    </div>
                    <div className="flex w-full flex-nowrap items-center gap-3">
                      <input
                        type="text"
                        value={assignRoomSearch}
                        onChange={(event) => setAssignRoomSearch(event.target.value)}
                        placeholder="Tìm phòng, tầng, tòa..."
                        className="min-w-0 flex-1 border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                      />
                      <select
                        value={assignStatusFilter}
                        onChange={(event) => setAssignStatusFilter(event.target.value as 'all' | 'available' | 'assigned')}
                        className="w-[150px] shrink-0 border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                      >
                        <option value="all">Tất cả</option>
                        <option value="available">Chưa gán</option>
                        <option value="assigned">Đã gán</option>
                      </select>
                    </div>
                  </div>

                  <div className="max-h-[58vh] flex-1 overflow-y-auto overscroll-contain p-4">
                {assignLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                  </div>
                ) : visibleBuildingTree.length === 0 ? (
                  <p className="border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">Không có phòng phù hợp với bộ lọc hiện tại.</p>
                ) : (
                  <div className="space-y-3">
                    {visibleBuildingTree.map((building) => (
                      <details key={building.buildingId} className="asset-tree-details border border-gray-200 bg-white">
                        <summary className="flex cursor-pointer list-none items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                          <ChevronRight size={16} className="asset-tree-chevron shrink-0 text-gray-500" />
                          <span className="min-w-0 flex-1 truncate">{building.buildingName}</span>
                          <span className="shrink-0 bg-white px-2 py-0.5 text-xs text-gray-600">
                            {building.floors.reduce((sum, floor) => sum + floor.rooms.length, 0)} phòng
                          </span>
                        </summary>
                        <div className="divide-y divide-gray-100">
                          {building.floors.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500">
                              Chưa có phòng trong tòa này.
                            </div>
                          ) : building.floors.map((floor) => (
                            <details key={`${building.buildingId}-${floor.floorNumber}`} className="asset-tree-details bg-white">
                              <summary className="flex cursor-pointer list-none items-center gap-3 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                                <ChevronRight size={15} className="asset-tree-chevron shrink-0 text-gray-400" />
                                <span className="min-w-0 flex-1 truncate">{floor.floorNumber ? `Tầng ${floor.floorNumber}` : 'Chưa rõ tầng'}</span>
                                <span className="text-xs text-gray-500">{floor.rooms.length} phòng</span>
                              </summary>
                              <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
                                {floor.rooms.map((room) => {
                                  const assignment = assignmentByRoomId.get(room.id);
                                  const selected = addRoomIds.includes(room.id);
                                  return (
                                    <div
                                      key={room.id}
                                      className={`border px-3 py-2 text-sm transition-colors ${
                                        assignment
                                          ? 'border-green-200 bg-green-50'
                                          : selected
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                      }`}
                                    >
                                      <label className={`flex items-center gap-2 ${assignment ? 'cursor-default' : 'cursor-pointer'}`}>
                                        <input
                                          type="checkbox"
                                          checked={assignment ? true : selected}
                                          disabled={!!assignment}
                                          onChange={() => toggleAddRoom(room.id)}
                                          className="h-4 w-4"
                                        />
                                        <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{room.roomCode}</span>
                                        {assignment ? (
                                          <span className="shrink-0 text-xs font-medium text-green-700">Đã gán</span>
                                        ) : (
                                          <span className="shrink-0 text-xs text-gray-500">{selected ? 'Đang chọn' : 'Chưa gán'}</span>
                                        )}
                                      </label>
                                      {assignment && (
                                        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-600">
                                          <span className="truncate">SL: {assignment.quantity} · {assignment.condition || 'Tốt'}</span>
                                          <button type="button" onClick={() => handleRemoveAssignment(assignment)} className="shrink-0 text-red-600 hover:text-red-700">
                                            Gỡ
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
                  </div>
                </section>

                <aside className="flex min-h-0 flex-col border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 px-4 py-3">
                    <h4 className="text-sm font-semibold text-gray-900">Thông tin gán</h4>
                    <p className="mt-0.5 text-xs text-gray-500">Áp dụng cho các phòng đang chọn.</p>
                  </div>

                  <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                    <div className="mb-4 border border-blue-100 bg-blue-50 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Phòng đang chọn</p>
                      <p className="mt-1 text-2xl font-semibold text-blue-900">{addRoomIds.length}</p>
                    </div>

                    {selectedAssignRooms.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-medium text-gray-600">Danh sách đã chọn</p>
                        <div className="max-h-28 overflow-y-auto border border-gray-200 bg-gray-50">
                          {selectedAssignRooms.map((room) => (
                            <div key={room.id} className="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-2 text-xs last:border-b-0">
                              <span className="truncate text-gray-800">
                                {room.roomCode}{room.floorNumber ? ` · Tầng ${room.floorNumber}` : ''}
                              </span>
                              <button type="button" onClick={() => toggleAddRoom(room.id)} className="shrink-0 text-gray-500 hover:text-red-600">
                                Bỏ
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {rooms.length === 0 && !assignLoading ? (
                      <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Chưa có phòng phù hợp để gán.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Số lượng *</label>
                          <input type="number" min={1} value={addQty} onChange={e => setAddQty(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Tình trạng</label>
                          <select value={addCondition} onChange={e => setAddCondition(e.target.value)}
                            className="w-full border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none">
                            <option value="Tốt">Tốt</option>
                            <option value="Trung bình">Trung bình</option>
                            <option value="Hỏng">Hỏng</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
                          <textarea
                            rows={3}
                            placeholder="Không bắt buộc"
                            value={addNote}
                            onChange={e => setAddNote(e.target.value)}
                            className="w-full resize-none border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 bg-white p-4">
                    <button onClick={handleAddAssignment}
                      disabled={addSaving || addRoomIds.length === 0 || availableAssignRooms.length === 0}
                      className="flex w-full items-center justify-center gap-2 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                      {addSaving && <Loader2 size={14} className="animate-spin" />}
                      <span>Gán vào {addRoomIds.length || 0} phòng</span>
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorModalMessage && (
        <div className="admin-content-modal-overlay">
          <div className="admin-content-modal-panel admin-content-modal-panel--narrow">
            <div className="admin-content-modal-header flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700">
                  <AlertTriangle size={21} />
                </div>
                <div>
                  <h3 className="text-lg text-gray-800">Không thể lưu tài sản</h3>
                  <p className="mt-0.5 text-xs text-gray-500">Vui lòng kiểm tra lại thông tin và thử lại.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorModalMessage('')}
                className="product-action-icon"
                aria-label="Đóng"
              >
                <X size={19} />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorModalMessage}
              </div>
            </div>

            <div className="admin-content-modal-footer flex items-center justify-end px-6 py-4">
              <button
                type="button"
                onClick={() => setErrorModalMessage('')}
                className="rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
