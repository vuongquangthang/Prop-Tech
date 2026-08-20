import { useEffect, useMemo, useState } from 'react';
import { BuildingSidebar } from '../components/infrastructure/BuildingSidebar';
import { RoomTable } from '../components/infrastructure/RoomTable';
import { ServiceTable } from '../components/infrastructure/ServiceTable';
import { AssetTable } from '../components/infrastructure/AssetTable';
import { LocationPicker } from '../components/LocationPicker';
import { buildingService, floorService } from '../services/api.service';
import { AlertTriangle, Box, Building2, Home, Loader2, MapPin, PlugZap, X } from 'lucide-react';

type InfrastructureStep = 'services' | 'assets' | 'rooms';
type WorkspaceFormMode = 'add-building' | 'edit-building' | 'add-floor' | 'edit-floor' | null;
type InfrastructureContext = {
  type: 'all' | 'building' | 'floor';
  buildingId: number | null;
  floorId: number | null;
  label: string;
  building?: {
    id: number;
    buildingName: string;
    buildingCode: string;
    totalFloors: number;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    totalRooms?: number;
    floors: Array<{
      id: number;
      floorNumber: number;
      totalRooms?: number;
      buildingId?: number;
      buildingName?: string;
    }>;
  } | null;
  floor?: {
    id: number;
    floorNumber: number;
    totalRooms?: number;
    buildingId?: number;
    buildingName?: string;
  } | null;
};

export function BuildingManagementPage() {
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [addRoomRequest, setAddRoomRequest] = useState<{ id: number; floorId: number } | null>(null);
  const [structureRefreshKey, setStructureRefreshKey] = useState(0);
  const [infrastructureContext, setInfrastructureContext] = useState<InfrastructureContext>({
    type: 'all',
    buildingId: null,
    floorId: null,
    label: 'Tất cả hạ tầng',
    building: null,
    floor: null,
  });
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<InfrastructureStep>('rooms');
  const [workspaceFormMode, setWorkspaceFormMode] = useState<WorkspaceFormMode>(null);
  const [knownBuildings, setKnownBuildings] = useState<Array<{ id: number; buildingName: string }>>([]);
  const [formBuildingName, setFormBuildingName] = useState('');
  const [formBuildingNameError, setFormBuildingNameError] = useState('');
  const [formBuildingAddress, setFormBuildingAddress] = useState('');
  const [formBuildingFloors, setFormBuildingFloors] = useState('');
  const [formLatitude, setFormLatitude] = useState<number | null>(null);
  const [formLongitude, setFormLongitude] = useState<number | null>(null);
  const [formFloorNumber, setFormFloorNumber] = useState('');
  const [formFloorNumberError, setFormFloorNumberError] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchKnownBuildings = async () => {
      try {
        const buildings = await buildingService.getAll();
        if (cancelled) return;
        setKnownBuildings((buildings || []).map((building: any) => ({
          id: building.id || building.toaNhaId || 0,
          buildingName: building.buildingName || building.tenToaNha || '',
        })));
      } catch {
        if (!cancelled) setKnownBuildings([]);
      }
    };

    fetchKnownBuildings();
    return () => {
      cancelled = true;
    };
  }, [structureRefreshKey]);

  const normalizeBuildingName = (value: string) => value.trim().toLocaleLowerCase('vi');

  const getDuplicateBuildingNameMessage = (value: string, excludeBuildingId?: number) => {
    const normalizedName = normalizeBuildingName(value);
    if (!normalizedName) return '';

    const duplicated = knownBuildings.some((building) =>
      building.id !== excludeBuildingId
      && normalizeBuildingName(building.buildingName) === normalizedName
    );

    return duplicated ? 'Tên tòa nhà đã tồn tại' : '';
  };

  const getCurrentEditBuildingId = () =>
    workspaceFormMode === 'edit-building' ? infrastructureContext.building?.id : undefined;

  const handleWorkspaceBuildingNameChange = (value: string) => {
    setFormBuildingName(value);
    setFormBuildingNameError(getDuplicateBuildingNameMessage(value, getCurrentEditBuildingId()));
  };

  const getDuplicateFloorNumberMessage = (value: string, excludeFloorId?: number) => {
    const nextFloorNumber = parseInt(value, 10);
    const building = infrastructureContext.building;
    if (!building || !Number.isFinite(nextFloorNumber)) return '';

    const duplicated = building.floors.some((floor) =>
      floor.id !== excludeFloorId && floor.floorNumber === nextFloorNumber
    );

    if (duplicated) {
      return `Tầng ${nextFloorNumber} đã tồn tại trong tòa nhà này`;
    }

    if (workspaceFormMode === 'add-floor') {
      const maxFloorNumber = Math.max(0, ...building.floors.map((floor) => floor.floorNumber));
      const expectedFloorNumber = maxFloorNumber + 1;
      if (nextFloorNumber !== expectedFloorNumber) {
        return `Vui lòng thêm tầng ${expectedFloorNumber} trước khi thêm tầng ${nextFloorNumber}`;
      }
    }

    return '';
  };

  const getCurrentEditFloorId = () =>
    workspaceFormMode === 'edit-floor' ? infrastructureContext.floor?.id : undefined;

  const handleWorkspaceFloorNumberChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setFormFloorNumber(numericValue);
    setFormFloorNumberError(getDuplicateFloorNumberMessage(numericValue, getCurrentEditFloorId()));
  };

  const handleRequestAddRoom = (floorId: number) => {
    setSelectedFloorId(floorId);
    setSelectedBuildingId(null);
    setWorkspaceFormMode(null);
    setActiveWorkspaceTab('rooms');
    setAddRoomRequest({ id: Date.now(), floorId });
  };


  const resetWorkspaceForm = () => {
    setWorkspaceFormMode(null);
    setFormBuildingName('');
    setFormBuildingNameError('');
    setFormBuildingAddress('');
    setFormBuildingFloors('');
    setFormLatitude(null);
    setFormLongitude(null);
    setFormFloorNumber('');
    setFormFloorNumberError('');
    setFormError(null);
  };

  const openAddBuildingForm = () => {
    resetWorkspaceForm();
    setWorkspaceFormMode('add-building');
  };

  const openEditBuildingForm = () => {
    const building = infrastructureContext.building;
    if (!building) return;
    setWorkspaceFormMode('edit-building');
    setFormBuildingName(building.buildingName || '');
    setFormBuildingNameError('');
    setFormBuildingAddress(building.address || '');
    setFormBuildingFloors(String(building.totalFloors || building.floors.length || 1));
    setFormLatitude(building.latitude ?? null);
    setFormLongitude(building.longitude ?? null);
    setFormFloorNumber('');
    setFormError(null);
  };

  const openAddFloorForm = () => {
    if (!infrastructureContext.buildingId) return;
    const building = infrastructureContext.building;
    const nextFloorNumber = (building?.floors.length ?? 0) + 1;
    const duplicated = building?.floors.some((floor) => floor.floorNumber === nextFloorNumber);
    setWorkspaceFormMode('add-floor');
    setFormFloorNumber(String(nextFloorNumber));
    setFormBuildingNameError('');
    setFormFloorNumberError(duplicated ? `Tầng ${nextFloorNumber} đã tồn tại trong tòa nhà này` : '');
    setFormError(null);
  };

  const openAddFloorFormForBuilding = (building: NonNullable<InfrastructureContext['building']>) => {
    setSelectedBuildingId(building.id);
    setSelectedFloorId(null);
    setInfrastructureContext({
      type: 'building',
      buildingId: building.id,
      floorId: null,
      label: building.buildingName,
      building,
      floor: null,
    });
    setWorkspaceFormMode('add-floor');
    setFormFloorNumber(String((building.floors.length || 0) + 1));
    setFormBuildingNameError('');
    setFormFloorNumberError('');
    setFormError(null);
  };

  const openEditFloorForm = () => {
    const floor = infrastructureContext.floor;
    if (!floor) return;
    setWorkspaceFormMode('edit-floor');
    setFormFloorNumber(String(floor.floorNumber || ''));
    setFormBuildingNameError('');
    setFormFloorNumberError('');
    setFormError(null);
  };

  const ensureFloorsForBuilding = async (buildingId: number, numberOfFloors: number) => {
    const existingFloors = await floorService.getByBuilding(buildingId);
    const existingFloorNumbers = new Set(existingFloors.map((floor: any) => floor.floorNumber || floor.soTang));
    const missingFloorNumbers = Array.from({ length: numberOfFloors }, (_, index) => index + 1)
      .filter((floorNumber) => !existingFloorNumbers.has(floorNumber));

    await Promise.all(
      missingFloorNumbers.map((floorNumber) =>
        floorService.create({ buildingId, floorNumber } as any),
      ),
    );
  };

  const handleWorkspaceFormSubmit = async () => {
    setFormError(null);
    setFormSaving(true);
    try {
      if (workspaceFormMode === 'add-building') {
        const duplicateMessage = getDuplicateBuildingNameMessage(formBuildingName);
        if (duplicateMessage) {
          setFormBuildingNameError(duplicateMessage);
          setFormError(duplicateMessage);
          return;
        }
        if (!formBuildingName.trim() || !formBuildingFloors || !formBuildingAddress.trim()) {
          setFormError('Vui lòng nhập tên tòa nhà, số tầng và địa chỉ');
          return;
        }
        const numberOfFloors = parseInt(formBuildingFloors, 10);
        const createdBuilding = await buildingService.create({
          buildingName: formBuildingName.trim(),
          address: formBuildingAddress.trim(),
          numberOfFloors,
          latitude: formLatitude ?? undefined,
          longitude: formLongitude ?? undefined,
        } as any);
        const createdBuildingId = createdBuilding.id || createdBuilding.toaNhaId || 0;
        if (createdBuildingId) {
          await ensureFloorsForBuilding(createdBuildingId, numberOfFloors);
          const createdFloors = await floorService.getByBuilding(createdBuildingId);
          const contextBuilding = {
            id: createdBuildingId,
            buildingName: createdBuilding.buildingName || createdBuilding.tenToaNha || formBuildingName.trim(),
            buildingCode: createdBuilding.buildingCode || createdBuilding.maToaNha || '',
            totalFloors: createdBuilding.numberOfFloors || createdBuilding.totalFloors || numberOfFloors,
            address: createdBuilding.address || createdBuilding.diaChi || formBuildingAddress.trim(),
            latitude: createdBuilding.latitude ?? formLatitude,
            longitude: createdBuilding.longitude ?? formLongitude,
            totalRooms: createdBuilding.totalRooms || createdBuilding.tongSoPhong || 0,
            floors: createdFloors.map((floor: any) => ({
              id: floor.id || floor.tangId || 0,
              floorNumber: floor.floorNumber || floor.soTang || 0,
              totalRooms: floor.totalRooms || floor.tongSoPhong || 0,
              buildingId: createdBuildingId,
              buildingName: createdBuilding.buildingName || createdBuilding.tenToaNha || formBuildingName.trim(),
            })),
          };
          setSelectedBuildingId(createdBuildingId);
          setSelectedFloorId(null);
          setInfrastructureContext({
            type: 'building',
            buildingId: createdBuildingId,
            floorId: null,
            label: contextBuilding.buildingName,
            building: contextBuilding,
            floor: null,
          });
        }
      }

      if (workspaceFormMode === 'edit-building') {
        const building = infrastructureContext.building;
        const duplicateMessage = getDuplicateBuildingNameMessage(formBuildingName, building?.id);
        if (duplicateMessage) {
          setFormBuildingNameError(duplicateMessage);
          setFormError(duplicateMessage);
          return;
        }
        if (!building || !formBuildingName.trim() || !formBuildingAddress.trim()) {
          setFormError('Vui lòng nhập đủ tên tòa và địa chỉ');
          return;
        }
        await buildingService.update(building.id, {
          buildingName: formBuildingName.trim(),
          address: formBuildingAddress.trim(),
          latitude: formLatitude ?? undefined,
          longitude: formLongitude ?? undefined,
        } as any);
      }

      if (workspaceFormMode === 'add-floor') {
        const buildingId = infrastructureContext.buildingId;
        const duplicateMessage = getDuplicateFloorNumberMessage(formFloorNumber);
        if (duplicateMessage) {
          setFormFloorNumberError(duplicateMessage);
          setFormError(duplicateMessage);
          return;
        }
        if (!buildingId || !formFloorNumber) {
          setFormError('Vui lòng chọn tòa nhà và nhập số tầng');
          return;
        }
        const nextFloorNumber = parseInt(formFloorNumber, 10);
        await floorService.create({ buildingId, floorNumber: nextFloorNumber } as any);
        const building = infrastructureContext.building;
        if (building && nextFloorNumber > building.totalFloors) {
          await buildingService.update(building.id, { numberOfFloors: nextFloorNumber } as any);
        }
      }

      if (workspaceFormMode === 'edit-floor') {
        const floor = infrastructureContext.floor;
        const duplicateMessage = getDuplicateFloorNumberMessage(formFloorNumber, floor?.id);
        if (duplicateMessage) {
          setFormFloorNumberError(duplicateMessage);
          setFormError(duplicateMessage);
          return;
        }
        if (!floor || !formFloorNumber) {
          setFormError('Vui lòng nhập số tầng');
          return;
        }
        await floorService.update(floor.id, { floorNumber: parseInt(formFloorNumber, 10) } as any);
      }

      setStructureRefreshKey((current) => current + 1);
      resetWorkspaceForm();
    } catch (err: any) {
      setFormError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setFormSaving(false);
    }
  };

  const selectedBuilding = infrastructureContext.building ?? null;
  const selectedFloor = infrastructureContext.floor ?? null;

  const workspaceSections = useMemo(() => {
    const roomSection = {
      key: 'rooms' as const,
      title: infrastructureContext.type === 'floor'
        ? 'Thông tin phòng thuộc tầng'
        : infrastructureContext.type === 'building'
          ? 'Thông tin phòng thuộc tòa'
          : 'Tất cả',
      icon: Home,
      content: (
        <RoomTable
          selectedFloorId={selectedFloorId}
          selectedBuildingId={selectedBuildingId}
          addRoomRequest={addRoomRequest}
          structureRefreshKey={structureRefreshKey}
          onRoomsChange={() => setStructureRefreshKey((current) => current + 1)}
        />
      ),
    };

    if (infrastructureContext.type === 'all') {
      return [roomSection];
    }

    return [
      {
        key: 'services' as const,
        title: 'Đơn giá dịch vụ áp dụng',
        icon: PlugZap,
        content: <ServiceTable embedded contextBuildingId={infrastructureContext.buildingId} />,
      },
      {
        key: 'assets' as const,
        title: 'Tiện ích áp dụng',
        icon: Box,
        content: <AssetTable embedded contextBuildingId={infrastructureContext.buildingId} />,
      },
      roomSection,
    ];
  }, [
    addRoomRequest,
    infrastructureContext.buildingId,
    infrastructureContext.type,
    selectedBuildingId,
    selectedFloorId,
    structureRefreshKey,
  ]);
  const activeWorkspaceSection = workspaceSections.find((section) => section.key === activeWorkspaceTab)
    ?? workspaceSections[0];

  const detailItems = selectedBuilding
    ? [
        { label: 'Tòa nhà', value: selectedBuilding.buildingName || '—' },
        { label: 'Số tầng', value: `${selectedBuilding.floors.length}/${selectedBuilding.totalFloors || selectedBuilding.floors.length || 0}` },
        { label: 'Số phòng', value: `${selectedBuilding.totalRooms ?? 0}` },
        { label: 'Mã tòa', value: selectedBuilding.buildingCode || '—' },
      ]
    : [
      ];
  const contextTitle = selectedFloor
    ? `Tầng ${selectedFloor.floorNumber} • ${selectedBuilding?.buildingName || selectedFloor.buildingName || '—'}`
    : selectedBuilding?.buildingName || 'Tất cả';
  const contextSubtitle = selectedBuilding?.address || 'Xem và thao tác danh sách phòng trên toàn hệ thống.';
  const hasInfrastructureSelection = infrastructureContext.type === 'all' || infrastructureContext.type === 'building' || infrastructureContext.type === 'floor';
  const compactDetailItems = selectedFloor
    ? [
        { label: 'Số phòng', value: `${selectedFloor.totalRooms ?? 0}` },
      ]
    : selectedBuilding
      ? [
          { label: 'Số tầng', value: `${selectedBuilding.floors.length}/${selectedBuilding.totalFloors || selectedBuilding.floors.length || 0}` },
          { label: 'Số phòng', value: `${selectedBuilding.totalRooms ?? 0}` },
        ]
      : detailItems;
  const hasLocation = typeof selectedBuilding?.latitude === 'number' && typeof selectedBuilding?.longitude === 'number';

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-page)]" style={{ paddingTop: '20px', paddingRight: 'var(--space-layout)', paddingBottom: '32px', paddingLeft: 'var(--space-layout)' }}>
      <div
        className="grid min-h-0 flex-1 overflow-hidden"
        style={{ gridTemplateColumns: '300px minmax(0, 1fr)', gap: 'var(--space-layout)' }}
      >
        <aside className="min-h-0 overflow-hidden border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-sm">
          <div className="h-full min-h-0 overflow-hidden">
            <BuildingSidebar
              selectedFloor={selectedFloorId}
              onSelectFloor={setSelectedFloorId}
              selectedBuilding={selectedBuildingId}
              onSelectBuilding={setSelectedBuildingId}
              onContextChange={(context) => {
                setInfrastructureContext(context);
                if (context.type === 'all') {
                  setWorkspaceFormMode(null);
                  setActiveWorkspaceTab('rooms');
                } else {
                  setActiveWorkspaceTab('services');
                }
              }}
              onRequestAddRoom={handleRequestAddRoom}
              onStructureChange={() => setStructureRefreshKey((current) => current + 1)}
              structureRefreshKey={structureRefreshKey}
            />
          </div>
        </aside>

        <main className="min-h-0 overflow-y-auto pr-1">
          <div className="space-y-3">
            {hasInfrastructureSelection ? (
              <section className="sticky top-0 z-20 border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-sm">
                <div
                  className="px-5 py-3"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.05fr)',
                    gap: '24px',
                    alignItems: 'center',
                  }}
                >
                  <div className="flex min-w-0 flex-col justify-center">
                    <h2 className="truncate text-lg font-semibold leading-tight text-[var(--primary)]">{contextTitle}</h2>
                    {!selectedBuilding && (
                      <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{contextSubtitle}</p>
                    )}
                  </div>

                  <div
                    className="text-sm"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      columnGap: '18px',
                      rowGap: '8px',
                    }}
                  >
                    {compactDetailItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex min-w-0 items-center gap-1.5"
                      >
                        <span className="shrink-0 text-[var(--text-secondary)]">{item.label}:&nbsp;</span>
                        <span className="truncate font-semibold text-[var(--text-primary)]">{item.value}</span>
                      </div>
                    ))}
                    {selectedBuilding && (
                      <div
                        className="flex min-w-0 items-center gap-1.5"
                        style={{ gridColumn: '1 / -1' }}
                      >
                        <span className="shrink-0 text-[var(--text-secondary)]">Vị trí:&nbsp;</span>
                        <span className="min-w-0 truncate font-semibold text-[var(--text-primary)]">
                          {selectedBuilding.address || '—'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowLocationModal(true)}
                          className="ml-2 inline-flex w-fit max-w-full shrink-0 items-center gap-2 border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-surface)]"
                        >
                          <MapPin size={15} />
                          <span className="truncate">{hasLocation ? 'Xem bản đồ' : 'Chưa chọn vị trí'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </section>
            ) : (
              <section className="flex min-h-[360px] items-center justify-center border border-dashed border-[var(--surface-border)] bg-[var(--surface-card)] px-6 py-12 text-center shadow-sm">
                <div className="max-w-md">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-[var(--brand-surface)] text-[var(--brand-primary)]">
                    <Building2 size={24} />
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">Chọn tòa nhà hoặc tầng để thao tác</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Vui lòng chọn một tòa nhà hoặc tầng ở cột trái. Workspace bên phải sẽ hiển thị thông tin tầng, đơn giá dịch vụ, tiện ích và phòng theo đối tượng được chọn.
                  </p>
                </div>
              </section>
            )}

            {hasInfrastructureSelection && workspaceFormMode && (
              <section className="border border-[var(--brand-border)] bg-[var(--surface-card)] shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--surface-border)] bg-[var(--brand-surface)] px-4 py-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {workspaceFormMode === 'add-building' && 'Thêm tòa nhà'}
                      {workspaceFormMode === 'edit-building' && 'Sửa thông tin tòa nhà'}
                      {workspaceFormMode === 'add-floor' && 'Thêm tầng'}
                      {workspaceFormMode === 'edit-floor' && 'Sửa thông tin tầng'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={resetWorkspaceForm}
                    className="inline-flex h-8 w-8 items-center justify-center border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-white"
                    aria-label="Đóng form"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4 p-4">
                  {(workspaceFormMode === 'add-building' || workspaceFormMode === 'edit-building') ? (
                    <>
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Tên tòa nhà *</label>
                          <input
                            value={formBuildingName}
                            onChange={(event) => handleWorkspaceBuildingNameChange(event.target.value)}
                            onBlur={() => setFormBuildingNameError(getDuplicateBuildingNameMessage(formBuildingName, getCurrentEditBuildingId()))}
                            className={`w-full border bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none ${
                              formBuildingNameError
                                ? 'border-red-400 focus:border-red-500'
                                : 'border-[var(--surface-border)] focus:border-[var(--brand-primary)]'
                            }`}
                            placeholder="VD: QMS Tower"
                          />
                          {formBuildingNameError && (
                            <p className="mt-1 text-xs font-medium text-red-600">{formBuildingNameError}</p>
                          )}
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Số tầng *</label>
                          <input
                            value={formBuildingFloors}
                            onChange={(event) => setFormBuildingFloors(event.target.value.replace(/\D/g, ''))}
                            inputMode="numeric"
                            disabled={workspaceFormMode === 'edit-building'}
                            className="w-full border border-[var(--surface-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--text-secondary)]"
                            placeholder="VD: 5"
                          />
                          {workspaceFormMode === 'edit-building' && (
                            <p className="mt-1 text-xs text-[var(--text-secondary)]">
                              Số tầng được cập nhật qua thao tác thêm/xóa tầng.
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Địa chỉ *</label>
                        <input
                          value={formBuildingAddress}
                          onChange={(event) => setFormBuildingAddress(event.target.value)}
                          className="w-full border border-[var(--surface-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                          placeholder="Nhập địa chỉ tòa nhà"
                        />
                      </div>
                      <div className="overflow-hidden border border-[var(--surface-border)]">
                        <LocationPicker
                          lat={formLatitude}
                          lng={formLongitude}
                          addressQuery={formBuildingAddress}
                          onChange={(lat, lng) => {
                            setFormLatitude(lat);
                            setFormLongitude(lng);
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="border border-[var(--surface-border)] bg-[var(--surface-muted)] px-3 py-2">
                        <p className="text-xs text-[var(--text-secondary)]">Tòa nhà</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                          {infrastructureContext.building?.buildingName || infrastructureContext.floor?.buildingName || '—'}
                        </p>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Số tầng *</label>
                        <input
                          value={formFloorNumber}
                          onChange={(event) => handleWorkspaceFloorNumberChange(event.target.value)}
                          onBlur={() => setFormFloorNumberError(getDuplicateFloorNumberMessage(formFloorNumber, getCurrentEditFloorId()))}
                          inputMode="numeric"
                          className={`w-full border bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none ${
                            formFloorNumberError
                              ? 'border-red-400 focus:border-red-500'
                              : 'border-[var(--surface-border)] focus:border-[var(--brand-primary)]'
                          }`}
                          placeholder="VD: 5"
                        />
                        {formFloorNumberError && (
                          <p className="mt-1 text-xs font-medium text-red-600">{formFloorNumberError}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {formError && (
                    <div className="flex items-center gap-2 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      <AlertTriangle size={16} />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 border-t border-[var(--surface-border)] pt-4">
                    <button
                      type="button"
                      onClick={resetWorkspaceForm}
                      className="inline-flex h-10 items-center justify-center rounded-[var(--radius-button)] border border-[var(--surface-border)] bg-white px-4 text-sm font-medium text-[var(--text-primary)]"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleWorkspaceFormSubmit}
                      disabled={formSaving || !!formBuildingNameError || !!formFloorNumberError}
                      className="inline-flex h-10 items-center justify-center rounded-[var(--radius-button)] bg-[var(--brand-primary)] px-4 text-sm font-semibold text-[var(--text-on-color)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-100 disabled:opacity-60"
                    >
                      {formSaving && <Loader2 size={16} className="mr-2 animate-spin" />}
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </section>
            )}

            {hasInfrastructureSelection && activeWorkspaceSection && (
              <section className="border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-sm">
                <div
                  className="border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur"
                  style={{ borderRadius: '18px 18px 0 0' }}
                >
                  <div style={{ overflowX: 'auto' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${workspaceSections.length}, minmax(0, 1fr))`,
                        gap: '8px',
                        minWidth: workspaceSections.length > 1 ? '720px' : '240px',
                      }}
                    >
                    {workspaceSections.map((section) => {
                      const isActive = activeWorkspaceSection.key === section.key;
                      return (
                        <button
                          key={section.key}
                          type="button"
                          onClick={() => setActiveWorkspaceTab(section.key)}
                          className={`group relative flex min-w-0 items-center justify-center px-4 py-2.5 text-sm font-semibold transition-all ${
                            isActive
                              ? 'bg-blue-100 text-blue-800'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                          }`}
                          style={{ borderRadius: '16px', width: '100%' }}
                        >
                          <span className="truncate whitespace-nowrap">{section.title}</span>
                        </button>
                      );
                    })}
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  {activeWorkspaceSection.content}
                </div>
              </section>
            )}

            {showLocationModal && selectedBuilding && (
              <div className="admin-content-modal-overlay">
                <div className="bg-white rounded-lg w-full max-w-[820px] max-h-[90vh] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-gray-300 px-6 py-4">
                    <div>
                      <h3 className="text-lg text-gray-800">Vị trí tòa nhà</h3>
                      <p className="text-sm text-gray-500">{selectedBuilding.buildingName}</p>
                    </div>
                    <button onClick={() => setShowLocationModal(false)} className="p-1 hover:bg-gray-100 rounded" aria-label="Đóng">
                      <X size={20} className="text-gray-600" />
                    </button>
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <span className="text-gray-500">Địa chỉ: </span>
                        <span className="font-semibold text-gray-900">{selectedBuilding.address || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tọa độ: </span>
                        <span className="font-semibold text-gray-900">
                          {hasLocation ? `${selectedBuilding.latitude}, ${selectedBuilding.longitude}` : 'Chưa có tọa độ'}
                        </span>
                      </div>
                    </div>
                    {hasLocation ? (
                      <div className="overflow-hidden border border-gray-300">
                        <LocationPicker
                          lat={selectedBuilding.latitude}
                          lng={selectedBuilding.longitude}
                          addressQuery={selectedBuilding.address || selectedBuilding.buildingName}
                          onChange={() => {}}
                          readOnly
                        />
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                        Tòa nhà này chưa có dữ liệu vị trí. Sửa tòa nhà để chọn vị trí trên bản đồ.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
