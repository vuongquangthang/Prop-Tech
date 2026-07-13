import { Plus, ChevronRight, ChevronDown, X, Loader2, Building2, Trash2, AlertTriangle, Info, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { buildingService, floorService } from '../../services/api.service';
import { LocationPicker } from '../LocationPicker';

interface FloorData {
  id: number;
  floorNumber: number;
  totalRooms?: number;
  buildingId?: number;
  buildingName?: string;
}

interface BuildingData {
  id: number;
  buildingName: string;
  buildingCode: string;
  totalFloors: number;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  totalRooms?: number;
  floors: FloorData[];
}

interface BuildingSidebarProps {
  selectedFloor: number | null;
  onSelectFloor: (floorId: number | null) => void;
  selectedBuilding: number | null;
  onSelectBuilding: (buildingId: number | null) => void;
  onRequestAddRoom?: (floorId: number) => void;
  onStructureChange?: () => void;
  structureRefreshKey?: number;
}

export function BuildingSidebar({
  selectedFloor,
  onSelectFloor,
  selectedBuilding,
  onSelectBuilding,
  onRequestAddRoom,
  onStructureChange,
  structureRefreshKey = 0
}: BuildingSidebarProps) {
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBuilding, setExpandedBuilding] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'building' | 'floor'>('building');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'building'; id: number; name: string }
    | { type: 'floor'; id: number; name: string }
    | null
  >(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<
    | { type: 'building'; building: BuildingData }
    | { type: 'floor'; floor: FloorData; building: BuildingData }
    | null
  >(null);
  const [detailEditMode, setDetailEditMode] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editBuildingName, setEditBuildingName] = useState('');
  const [editBuildingAddress, setEditBuildingAddress] = useState('');
  const [editBuildingFloors, setEditBuildingFloors] = useState('');
  const [editLatitude, setEditLatitude] = useState<number | null>(null);
  const [editLongitude, setEditLongitude] = useState<number | null>(null);
  const [editFloorNumber, setEditFloorNumber] = useState('');
  // Building form fields
  const [buildingName, setBuildingName] = useState('');
  const [totalFloorsInput, setTotalFloorsInput] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  // Floor form fields
  const [selectedBuildingId, setSelectedBuildingId] = useState<number>(0);
  const [lockedAddBuildingId, setLockedAddBuildingId] = useState<number | null>(null);
  const [floorNumber, setFloorNumber] = useState('');

  useEffect(() => {
    fetchBuildings();
  }, [structureRefreshKey]);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      setError(null);
      const buildingsData = await buildingService.getAll();
      
      // Fetch floors for each building
      const buildingsWithFloors = await Promise.all(
        buildingsData.map(async (building) => {
          try {
            const floors = await floorService.getByBuilding(building.id);
            return {
              ...building,
              id: building.id || building.toaNhaId || 0,
              buildingName: building.buildingName || building.tenToaNha || '',
              buildingCode: building.buildingCode || building.maToaNha || '',
              totalFloors: (building as any).numberOfFloors || building.totalFloors || building.soTang || 0,
              address: building.address || building.diaChi || '',
              latitude: building.latitude ?? null,
              longitude: building.longitude ?? null,
              totalRooms: building.totalRooms || building.tongSoPhong || 0,
              floors: floors.map((f: any) => ({
                id: f.id || f.tangId || 0,
                floorNumber: f.floorNumber || f.soTang || 0,
                totalRooms: f.totalRooms || f.tongSoPhong || 0,
                buildingId: f.buildingId || building.id || building.toaNhaId || 0,
                buildingName: f.buildingName || building.buildingName || building.tenToaNha || '',
              }))
            };
          } catch {
            return {
              ...building,
              id: building.id || building.toaNhaId || 0,
              buildingName: building.buildingName || building.tenToaNha || '',
              buildingCode: building.buildingCode || building.maToaNha || '',
              totalFloors: (building as any).numberOfFloors || building.totalFloors || building.soTang || 0,
              address: building.address || building.diaChi || '',
              latitude: building.latitude ?? null,
              longitude: building.longitude ?? null,
              totalRooms: building.totalRooms || building.tongSoPhong || 0,
              floors: []
            };
          }
        })
      );
      
      setBuildings(buildingsWithFloors);
      
      // Auto-expand first building
      if (buildingsWithFloors.length > 0) {
        setExpandedBuilding(buildingsWithFloors[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách tòa nhà');
      console.error('Error fetching buildings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setShowAddModal(true);
    setAddType('building');
    setLockedAddBuildingId(null);
    setBuildingName('');
    setTotalFloorsInput('');
    setAddress('');
    setLatitude(null);
    setLongitude(null);
    setFloorNumber('');
    setSelectedBuildingId(buildings.length > 0 ? buildings[0].id : 0);
    setFormError(null);
  };

  const ensureFloorsForBuilding = async (buildingId: number, numberOfFloors: number) => {
    const existingFloors = await floorService.getByBuilding(buildingId);
    const existingFloorNumbers = new Set(
      existingFloors.map((floor: any) => floor.floorNumber || floor.soTang)
    );
    const missingFloorNumbers = Array.from(
      { length: numberOfFloors },
      (_, index) => index + 1
    ).filter((floorNumber) => !existingFloorNumbers.has(floorNumber));

    await Promise.all(
      missingFloorNumbers.map((floorNumber) =>
        floorService.create({
          buildingId,
          floorNumber,
        } as any)
      )
    );
  };

  const handleSubmit = async () => {
    setFormError(null);
    setFormLoading(true);
    try {
      if (addType === 'building') {
        if (!buildingName.trim() || !totalFloorsInput || !address.trim()) {
          setFormError('Vui lòng nhập tên tòa nhà, số tầng và địa chỉ');
          setFormLoading(false);
          return;
        }
        const numberOfFloors = parseInt(totalFloorsInput);
        const createdBuilding = await buildingService.create({
          buildingName: buildingName.trim(),
          address: address.trim() || '',
          numberOfFloors: parseInt(totalFloorsInput),
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
        } as any);
        const createdBuildingId = createdBuilding.id || (createdBuilding as any).toaNhaId || 0;
        if (createdBuildingId) {
          await ensureFloorsForBuilding(createdBuildingId, numberOfFloors);
        }
      } else {
        const bid = selectedBuildingId || (buildings[0]?.id ?? 0);
        if (!bid || !floorNumber) {
          setFormError('Vui lòng chọn tòa nhà và nhập số thứ tự tầng');
          setFormLoading(false);
          return;
        }
        const nextFloorNumber = parseInt(floorNumber);
        await floorService.create({
          buildingId: bid,
          floorNumber: nextFloorNumber,
        } as any);
        const targetBuilding = buildings.find((building) => building.id === bid);
        if (targetBuilding && nextFloorNumber > targetBuilding.totalFloors) {
          await buildingService.update(bid, {
            numberOfFloors: nextFloorNumber,
          } as any);
        }
      }
      await fetchBuildings();
      onStructureChange?.();
      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (
    target:
      | { type: 'building'; id: number; name: string }
      | { type: 'floor'; id: number; name: string }
  ) => {
    setDeleteTarget(target);
    setDeleteError(null);
  };

  const openDetailModal = (
    target:
      | { type: 'building'; building: BuildingData }
      | { type: 'floor'; floor: FloorData; building: BuildingData }
  ) => {
    setDetailTarget(target);
    setDetailEditMode(false);
    setDetailError(null);
    if (target.type === 'building') {
      setEditBuildingName(target.building.buildingName);
      setEditBuildingAddress(target.building.address || '');
      setEditBuildingFloors(String(target.building.totalFloors || target.building.floors.length || 1));
      setEditLatitude(target.building.latitude ?? null);
      setEditLongitude(target.building.longitude ?? null);
      setEditFloorNumber('');
    } else {
      setEditFloorNumber(String(target.floor.floorNumber));
      setEditBuildingName('');
      setEditBuildingAddress('');
      setEditBuildingFloors('');
      setEditLatitude(null);
      setEditLongitude(null);
    }
  };

  const handleContextAdd = () => {
    if (!detailTarget) return;

    setFormError(null);
    setBuildingName('');
    setTotalFloorsInput('');
    setAddress('');
    setLatitude(null);
    setLongitude(null);
    setFloorNumber('');

    if (detailTarget.type === 'building') {
      setShowAddModal(true);
      setAddType('floor');
      setSelectedBuildingId(detailTarget.building.id);
      setLockedAddBuildingId(detailTarget.building.id);
    } else {
      onSelectFloor(detailTarget.floor.id);
      onSelectBuilding(null);
      onRequestAddRoom?.(detailTarget.floor.id);
      setDetailTarget(null);
      return;
    }
    setDetailTarget(null);
  };

  const handleDetailDelete = () => {
    if (!detailTarget) return;

    const target =
      detailTarget.type === 'building'
        ? {
            type: 'building' as const,
            id: detailTarget.building.id,
            name: detailTarget.building.buildingName,
          }
        : {
            type: 'floor' as const,
            id: detailTarget.floor.id,
            name: `Tầng ${detailTarget.floor.floorNumber}`,
          };

    setDetailTarget(null);
    openDeleteModal(target);
  };

  const handleDetailUpdate = async () => {
    if (!detailTarget) return;

    setDetailLoading(true);
    setDetailError(null);
    try {
      if (detailTarget.type === 'building') {
        if (!editBuildingName.trim() || !editBuildingAddress.trim() || !editBuildingFloors) {
          setDetailError('Vui lòng nhập đủ tên tòa, địa chỉ và số tầng');
          return;
        }

        const numberOfFloors = parseInt(editBuildingFloors);
        await buildingService.update(detailTarget.building.id, {
          buildingName: editBuildingName.trim(),
          address: editBuildingAddress.trim(),
          numberOfFloors,
          latitude: editLatitude ?? undefined,
          longitude: editLongitude ?? undefined,
        } as any);
        await ensureFloorsForBuilding(detailTarget.building.id, numberOfFloors);
      } else {
        if (!editFloorNumber) {
          setDetailError('Vui lòng nhập số tầng');
          return;
        }

        await floorService.update(detailTarget.floor.id, {
          floorNumber: parseInt(editFloorNumber),
        } as any);
      }

      await fetchBuildings();
      onStructureChange?.();
      setDetailEditMode(false);
      setDetailTarget(null);
    } catch (err: any) {
      setDetailError(err.message || 'Không thể cập nhật, vui lòng thử lại');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      if (deleteTarget.type === 'building') {
        await buildingService.delete(deleteTarget.id);
        if (selectedBuilding === deleteTarget.id) {
          onSelectBuilding(null);
        }
      } else {
        await floorService.delete(deleteTarget.id);
        if (selectedFloor === deleteTarget.id) {
          onSelectFloor(null);
        }
      }

      await fetchBuildings();
      onStructureChange?.();
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Không thể xóa, vui lòng thử lại');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ 
      height: '100%',
      backgroundColor: 'var(--surface-card)', 
      border: '1px solid var(--surface-border)',
      borderRadius: 'var(--radius-card)'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '20px', 
        borderBottom: '1px solid var(--surface-border)' 
      }}>
        <button 
          onClick={handleAddClick}
          className="w-full rounded transition-colors flex items-center justify-center"
          style={{
            height: 'var(--input-height)',
            padding: '0 16px',
            backgroundColor: 'var(--brand-primary)',
            color: 'var(--text-on-color)',
            fontSize: 'var(--type-body)',
            fontWeight: 600,
            borderRadius: 'var(--radius-button)',
            gap: '8px'
          }}
        >
          <Plus size={20} />
          <span>Thêm Tòa nhà/Tầng</span>
        </button>
      </div>
      
      {/* Tree View */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '20px' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 size={32} className="animate-spin text-gray-400 mb-3" />
            <span className="text-gray-600 text-sm">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Building2 size={32} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm mb-3">{error}</p>
            <button 
              onClick={fetchBuildings}
              className="px-3 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
            >
              Thử lại
            </button>
          </div>
        ) : buildings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Building2 size={32} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Chưa có tòa nhà nào</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Show all rooms button */}
            <button
              onClick={() => { onSelectFloor(null); onSelectBuilding(null); }}
              className="w-full text-left rounded transition-colors"
              style={{
                padding: '10px 16px',
                fontSize: 'var(--type-body)',
                backgroundColor: selectedFloor === null && selectedBuilding === null ? 'var(--brand-surface)' : 'transparent',
                color: selectedFloor === null && selectedBuilding === null ? 'var(--brand-primary)' : 'var(--text-secondary)',
                fontWeight: selectedFloor === null && selectedBuilding === null ? 600 : 400,
              }}
            >
              Tất cả phòng
            </button>
            {buildings.map((building) => (
              <div key={building.id}>
                {/* Building */}
                <div
                  className="grid items-center rounded transition-colors hover:bg-[var(--brand-surface)]"
                  style={{
                    gridTemplateColumns: 'minmax(0, 1fr) 32px',
                    columnGap: '8px',
                    backgroundColor: selectedBuilding === building.id && selectedFloor === null ? 'var(--brand-surface)' : 'transparent',
                  }}
                >
                  <button
                    onClick={() => {
                      setExpandedBuilding(expandedBuilding === building.id ? null : building.id);
                      onSelectBuilding(selectedBuilding === building.id ? null : building.id);
                      onSelectFloor(null);
                    }}
                    className="flex min-w-0 items-center justify-between rounded transition-colors"
                    style={{
                      padding: '12px 12px 12px 16px',
                      fontSize: 'var(--type-body)',
                      color: selectedBuilding === building.id && selectedFloor === null ? 'var(--brand-primary)' : 'var(--text-primary)',
                      fontWeight: selectedBuilding === building.id && selectedFloor === null ? 700 : 600,
                      gap: '8px'
                    }}
                  >
                    <div className="flex min-w-0 items-center" style={{ gap: '8px' }}>
                      {expandedBuilding === building.id ? (
                        <ChevronDown size={18} className="shrink-0" />
                      ) : (
                        <ChevronRight size={18} className="shrink-0" />
                      )}
                      <span className="truncate" style={{ fontWeight: 600 }}>
                        {building.buildingName} ({building.floors.length}/{building.totalFloors} tầng)
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => openDetailModal({ type: 'building', building })}
                    className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-transparent text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    title="Xem chi tiết tòa"
                    aria-label={`Xem chi tiết tòa ${building.buildingName}`}
                  >
                    <Info size={16} />
                  </button>
                </div>
                
                {/* Floors */}
                {expandedBuilding === building.id && (
                  <div style={{ marginLeft: '24px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {building.floors.length === 0 ? (
                      <div className="text-sm text-gray-400 px-4 py-2">Chưa có tầng nào</div>
                    ) : (
                      building.floors.map((floor) => (
                        <div
                          key={floor.id}
                          className="grid items-center rounded transition-colors hover:bg-[var(--brand-surface)]"
                          style={{
                            gridTemplateColumns: 'minmax(0, 1fr) 32px',
                            columnGap: '8px',
                            backgroundColor: selectedFloor === floor.id ? 'var(--brand-surface)' : 'transparent',
                          }}
                        >
                          <button
                            onClick={() => { onSelectFloor(selectedFloor === floor.id ? null : floor.id); onSelectBuilding(null); }}
                            className="min-w-0 text-left rounded transition-colors"
                            style={{
                              padding: '10px 12px 10px 16px',
                              fontSize: 'var(--type-body)',
                              color: selectedFloor === floor.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                              fontWeight: selectedFloor === floor.id ? 600 : 400
                            }}
                          >
                            Tầng {floor.floorNumber}
                          </button>
                          <button
                            onClick={() => openDetailModal({ type: 'floor', floor, building })}
                            className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-transparent text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                            title="Xem chi tiết tầng"
                            aria-label={`Xem chi tiết tầng ${floor.floorNumber}`}
                          >
                            <Info size={15} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Building/Floor Modal */}
      {showAddModal && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[500px] max-h-[90vh] flex flex-col">
            {/* Header co dinh: khong troi khi body cuon */}
            <div className="shrink-0 border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg text-gray-800">
                {lockedAddBuildingId ? 'Thêm tầng mới' : 'Thêm Tòa nhà/Tầng mới'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Type Selection */}
              {!lockedAddBuildingId && (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Loại *</label>
                  <div className="flex space-x-2">
                    <button 
                      type="button"
                      onClick={() => setAddType('building')}
                      className="building-type-toggle flex-1 px-4 py-2 text-sm border transition-colors"
                      style={{
                        backgroundColor: addType === 'building' ? 'var(--brand-primary)' : '#ffffff',
                        borderColor: addType === 'building' ? 'var(--brand-primary)' : '#d1d5db',
                        borderRadius: 0,
                        color: addType === 'building' ? '#ffffff' : '#374151',
                      }}
                    >
                      Tòa nhà
                    </button>
                    <button 
                      type="button"
                      onClick={() => setAddType('floor')}
                      className="building-type-toggle flex-1 px-4 py-2 text-sm border transition-colors"
                      style={{
                        backgroundColor: addType === 'floor' ? 'var(--brand-primary)' : '#ffffff',
                        borderColor: addType === 'floor' ? 'var(--brand-primary)' : '#d1d5db',
                        borderRadius: 0,
                        color: addType === 'floor' ? '#ffffff' : '#374151',
                      }}
                    >
                      Tầng
                    </button>
                  </div>
                </div>
              )}

              {addType === 'building' ? (
                <>
                  {/* Building Name */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Tên tòa nhà *</label>
                    <input 
                      type="text"
                      placeholder="VD: Tòa D, Tòa E..."
                      value={buildingName}
                      onChange={e => setBuildingName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  {/* Number of Floors */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Số tầng *</label>
                    <input 
                      type="number"
                      placeholder="VD: 5"
                      min="1"
                      value={totalFloorsInput}
                      onChange={e => setTotalFloorsInput(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Địa chỉ <span className="text-red-500">*</span></label>
                    <textarea 
                      rows={2}
                      placeholder="Nhập địa chỉ chi tiết..."
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>

                  {/* Vi tri tren ban do */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Vị trí trên bản đồ {latitude && longitude ? '(đã chọn)' : '(tuỳ chọn)'}
                    </label>
                    <LocationPicker
                      lat={latitude}
                      lng={longitude}
                      addressQuery={address}
                      onChange={(la, ln, location) => {
                        setLatitude(la);
                        setLongitude(ln);
                        if (location?.address && location.source === 'manual-nearby-scan') {
                          setAddress(location.address);
                        }
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Select Building */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Chọn tòa nhà *</label>
                    <select
                      value={selectedBuildingId}
                      onChange={e => setSelectedBuildingId(parseInt(e.target.value))}
                      disabled={lockedAddBuildingId !== null}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-700">
                      {loading ? (
                        <option>Đang tải...</option>
                      ) : buildings.length === 0 ? (
                        <option>Chưa có tòa nhà</option>
                      ) : (
                        buildings.map(building => (
                          <option key={building.id} value={building.id}>
                            {building.buildingName}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Floor Number */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Số thứ tự tầng *</label>
                    <input 
                      type="number"
                      placeholder="VD: 1, 2, 3..."
                      min="1"
                      value={floorNumber}
                      onChange={e => setFloorNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    />
                  </div>
                </>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Ghi chú</label>
                <textarea 
                  rows={2}
                  placeholder="Thông tin bổ sung..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{formError}</p>
              )}
            </div>
            
            <div className="shrink-0 border-t border-gray-300 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={formLoading}
                className="building-detail-action-button"
              >
                <span
                  className="building-detail-action-inner text-gray-700"
                  style={{
                    borderColor: '#d1d5db',
                    borderRadius: 10,
                    clipPath: 'inset(0 round 10px)',
                    overflow: 'hidden',
                  }}
                >
                  Hủy
                </span>
              </button>
              <button 
                onClick={handleSubmit}
                disabled={formLoading}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {formLoading && <Loader2 size={14} className="animate-spin" />}
                <span>Xác nhận thêm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {detailTarget && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[560px] max-h-[90vh] flex flex-col">
            {/* Header co dinh: khong troi khi body cuon */}
            <div className="shrink-0 border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg text-gray-800">
                  {detailTarget.type === 'building' ? 'Chi tiết tòa nhà' : 'Chi tiết tầng'}
                </h3>
                <p className="text-sm text-gray-500">
                  {detailTarget.type === 'building'
                    ? detailTarget.building.buildingName
                    : `Tầng ${detailTarget.floor.floorNumber} - ${detailTarget.building.buildingName}`}
                </p>
              </div>
              <button
                onClick={() => setDetailTarget(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {detailTarget.type === 'building' ? (
                detailEditMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">Tên tòa *</label>
                      <input
                        value={editBuildingName}
                        onChange={(event) => setEditBuildingName(event.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">Địa chỉ *</label>
                      <textarea
                        rows={2}
                        value={editBuildingAddress}
                        onChange={(event) => setEditBuildingAddress(event.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">
                        Vá»‹ trÃ­ trÃªn báº£n Ä‘á»“ {editLatitude && editLongitude ? '(Ä‘Ã£ chá»n)' : '(tuá»³ chá»n)'}
                      </label>
                      <LocationPicker
                        lat={editLatitude}
                        lng={editLongitude}
                        addressQuery={editBuildingAddress}
                        onChange={(la, ln, location) => {
                          setEditLatitude(la);
                          setEditLongitude(ln);
                          if (location?.address && location.source === 'manual-nearby-scan') {
                            setEditBuildingAddress(location.address);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">Số tầng *</label>
                      <input
                        type="number"
                        min="1"
                        value={editBuildingFloors}
                        onChange={(event) => setEditBuildingFloors(event.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Nếu tăng số tầng, hệ thống sẽ tự tạo thêm tầng còn thiếu.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Tên tòa</p>
                      <p className="mt-1 font-semibold text-gray-900">{detailTarget.building.buildingName}</p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Số tầng</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {detailTarget.building.floors.length}/{detailTarget.building.totalFloors}
                      </p>
                    </div>
                    <div className="rounded border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Số phòng</p>
                      <p className="mt-1 font-semibold text-gray-900">{detailTarget.building.totalRooms || 0}</p>
                    </div>
                    <div className="col-span-2 rounded border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Địa chỉ</p>
                      <p className="mt-1 font-semibold text-gray-900">{detailTarget.building.address || 'Chưa có địa chỉ'}</p>
                    </div>
                  </div>
                )
              ) : detailEditMode ? (
                <div>
                  <label className="mb-2 block text-sm text-gray-700">Số tầng *</label>
                  <input
                    type="number"
                    min="1"
                    value={editFloorNumber}
                    onChange={(event) => setEditFloorNumber(event.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Tòa nhà</p>
                    <p className="mt-1 font-semibold text-gray-900">{detailTarget.building.buildingName}</p>
                  </div>
                  <div className="rounded border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Tầng</p>
                    <p className="mt-1 font-semibold text-gray-900">Tầng {detailTarget.floor.floorNumber}</p>
                  </div>
                  <div className="rounded border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Số phòng</p>
                    <p className="mt-1 font-semibold text-gray-900">{detailTarget.floor.totalRooms || 0}</p>
                  </div>
                </div>
              )}

              {detailError && (
                <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">{detailError}</p>
              )}
            </div>

            <div className="shrink-0 border-t border-gray-300 px-6 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDetailDelete}
                  disabled={detailLoading}
                  className="building-detail-action-button"
                >
                  <span
                    className="building-detail-action-inner text-red-600"
                    style={{
                      borderColor: '#fca5a5',
                      borderRadius: 10,
                      clipPath: 'inset(0 round 10px)',
                      overflow: 'hidden',
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Xóa</span>
                  </span>
                </button>
                <button
                  onClick={handleContextAdd}
                  disabled={detailLoading}
                  className="building-detail-action-button"
                >
                  <span
                    className="building-detail-action-inner text-gray-700"
                    style={{
                      borderColor: '#d1d5db',
                      borderRadius: 10,
                      clipPath: 'inset(0 round 10px)',
                      overflow: 'hidden',
                    }}
                  >
                    <Plus size={16} />
                    <span>{detailTarget.type === 'building' ? 'Thêm tầng' : 'Thêm phòng'}</span>
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {detailEditMode && (
                  <button
                    onClick={() => {
                      setDetailEditMode(false);
                      setDetailError(null);
                    }}
                    disabled={detailLoading}
                    className="building-detail-action-button"
                  >
                    <span
                      className="building-detail-action-inner text-gray-700"
                      style={{
                        borderColor: '#d1d5db',
                        borderRadius: 10,
                        clipPath: 'inset(0 round 10px)',
                        overflow: 'hidden',
                      }}
                    >
                      Hủy sửa
                    </span>
                  </button>
                )}
                <button
                  onClick={detailEditMode ? handleDetailUpdate : () => setDetailEditMode(true)}
                  disabled={detailLoading}
                  className="inline-flex items-center gap-2 rounded bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  {detailLoading ? <Loader2 size={14} className="animate-spin" /> : <Edit2 size={16} />}
                  <span>{detailEditMode ? 'Lưu thay đổi' : 'Sửa'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg text-gray-800">Xác nhận xóa</h3>
              <button onClick={() => setDeleteTarget(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3 rounded border border-red-300 bg-red-50 p-4">
                <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Bạn có chắc chắn muốn xóa {deleteTarget.type === 'building' ? 'tòa' : 'tầng'} này?
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    {deleteTarget.type === 'building'
                      ? 'Tòa chỉ xóa được khi các tầng bên trong chưa có phòng.'
                      : 'Tầng chỉ xóa được khi chưa có phòng.'}
                  </p>
                </div>
              </div>

              <div className="rounded border border-gray-300 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Đối tượng sẽ bị xóa:</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{deleteTarget.name}</p>
              </div>

              {deleteError && (
                <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>
              )}
            </div>

            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="building-delete-cancel-button px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
