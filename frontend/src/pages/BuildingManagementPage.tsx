import { useMemo, useState } from 'react';
import { BuildingSidebar } from '../components/infrastructure/BuildingSidebar';
import { RoomTable } from '../components/infrastructure/RoomTable';
import { ServiceTable } from '../components/infrastructure/ServiceTable';
import { AssetTable } from '../components/infrastructure/AssetTable';
import { LocationPicker } from '../components/LocationPicker';
import { buildingService, floorService } from '../services/api.service';
import { AlertTriangle, Box, Building2, ChevronDown, ChevronRight, Edit2, Home, Layers3, Loader2, MapPin, Maximize2, Minimize2, Plus, PlugZap, X } from 'lucide-react';

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
  const [openSteps, setOpenSteps] = useState<Record<InfrastructureStep, boolean>>({
    services: true,
    assets: true,
    rooms: true,
  });
  const [workspaceFormMode, setWorkspaceFormMode] = useState<WorkspaceFormMode>(null);
  const [formBuildingName, setFormBuildingName] = useState('');
  const [formBuildingAddress, setFormBuildingAddress] = useState('');
  const [formBuildingFloors, setFormBuildingFloors] = useState('');
  const [formLatitude, setFormLatitude] = useState<number | null>(null);
  const [formLongitude, setFormLongitude] = useState<number | null>(null);
  const [formFloorNumber, setFormFloorNumber] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleRequestAddRoom = (floorId: number) => {
    setSelectedFloorId(floorId);
    setSelectedBuildingId(null);
    setAddRoomRequest({ id: Date.now(), floorId });
  };

  const toggleStep = (step: InfrastructureStep) => {
    setOpenSteps((current) => ({
      ...current,
      [step]: !current[step],
    }));
  };

  const openAllSteps = () => {
    setOpenSteps({ services: true, assets: true, rooms: true });
  };

  const closeAllSteps = () => {
    setOpenSteps({ services: false, assets: false, rooms: false });
  };

  const resetWorkspaceForm = () => {
    setWorkspaceFormMode(null);
    setFormBuildingName('');
    setFormBuildingAddress('');
    setFormBuildingFloors('');
    setFormLatitude(null);
    setFormLongitude(null);
    setFormFloorNumber('');
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
    setFormBuildingAddress(building.address || '');
    setFormBuildingFloors(String(building.totalFloors || building.floors.length || 1));
    setFormLatitude(building.latitude ?? null);
    setFormLongitude(building.longitude ?? null);
    setFormFloorNumber('');
    setFormError(null);
  };

  const openAddFloorForm = () => {
    if (!infrastructureContext.buildingId) return;
    const nextFloorNumber = (infrastructureContext.building?.floors.length ?? 0) + 1;
    setWorkspaceFormMode('add-floor');
    setFormFloorNumber(String(nextFloorNumber));
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
    setFormError(null);
  };

  const openEditFloorForm = () => {
    const floor = infrastructureContext.floor;
    if (!floor) return;
    setWorkspaceFormMode('edit-floor');
    setFormFloorNumber(String(floor.floorNumber || ''));
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
        if (!building || !formBuildingName.trim() || !formBuildingFloors || !formBuildingAddress.trim()) {
          setFormError('Vui lòng nhập đủ tên tòa, số tầng và địa chỉ');
          return;
        }
        const numberOfFloors = parseInt(formBuildingFloors, 10);
        await buildingService.update(building.id, {
          buildingName: formBuildingName.trim(),
          address: formBuildingAddress.trim(),
          numberOfFloors,
          latitude: formLatitude ?? undefined,
          longitude: formLongitude ?? undefined,
        } as any);
        await ensureFloorsForBuilding(building.id, numberOfFloors);
      }

      if (workspaceFormMode === 'add-floor') {
        const buildingId = infrastructureContext.buildingId;
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

  const contextTypeLabel = infrastructureContext.type === 'floor'
    ? 'Tầng'
    : infrastructureContext.type === 'building'
      ? 'Tòa nhà'
      : 'Toàn bộ';

  const selectedBuilding = infrastructureContext.building ?? null;
  const selectedFloor = infrastructureContext.floor ?? null;

  const workspaceSections = useMemo(() => [
    {
      key: 'services' as const,
      title: infrastructureContext.type === 'all'
        ? 'Đơn giá dịch vụ'
        : 'Đơn giá dịch vụ áp dụng',
      icon: PlugZap,
      content: <ServiceTable embedded contextBuildingId={infrastructureContext.buildingId} />,
    },
    {
      key: 'assets' as const,
      title: infrastructureContext.type === 'all'
        ? 'Tiện ích'
        : 'Tiện ích áp dụng',
      icon: Box,
      content: <AssetTable embedded contextBuildingId={infrastructureContext.buildingId} />,
    },
    {
      key: 'rooms' as const,
      title: infrastructureContext.type === 'floor'
        ? 'Thông tin phòng thuộc tầng'
        : infrastructureContext.type === 'building'
          ? 'Thông tin phòng thuộc tòa'
          : 'Thông tin phòng',
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
    },
  ], [
    addRoomRequest,
    infrastructureContext.buildingId,
    infrastructureContext.type,
    selectedBuildingId,
    selectedFloorId,
    structureRefreshKey,
  ]);

  const detailItems = selectedBuilding
    ? [
        { label: 'Tòa nhà', value: selectedBuilding.buildingName || '—' },
        { label: 'Số tầng', value: `${selectedBuilding.floors.length}/${selectedBuilding.totalFloors || selectedBuilding.floors.length || 0}` },
        { label: 'Số phòng', value: `${selectedBuilding.totalRooms ?? 0}` },
        { label: 'Mã tòa', value: selectedBuilding.buildingCode || '—' },
      ]
    : [
        { label: 'Ngữ cảnh', value: 'Toàn bộ hạ tầng' },
        { label: 'Phòng', value: 'Tất cả phòng' },
        { label: 'Dịch vụ', value: 'Áp dụng chung và riêng' },
        { label: 'Tài sản', value: 'Toàn hệ thống' },
      ];
  const contextTitle = selectedFloor
    ? `Tầng ${selectedFloor.floorNumber} • ${selectedBuilding?.buildingName || selectedFloor.buildingName || '—'}`
    : selectedBuilding?.buildingName || 'Toàn bộ hạ tầng';
  const contextSubtitle = selectedBuilding?.address || 'Quản lý phòng, dịch vụ và tài sản trên toàn hệ thống.';
  const hasInfrastructureSelection = infrastructureContext.type === 'building' || infrastructureContext.type === 'floor';
  const compactDetailItems = selectedFloor
    ? [
        { label: 'Tòa nhà', value: selectedBuilding?.buildingName || selectedFloor.buildingName || '—' },
        { label: 'Số thứ tự tầng', value: String(selectedFloor.floorNumber) },
        { label: 'Số phòng tầng', value: `${selectedFloor.totalRooms ?? 0}` },
        { label: 'Tổng số tầng', value: selectedBuilding ? `${selectedBuilding.floors.length}/${selectedBuilding.totalFloors || selectedBuilding.floors.length || 0}` : '—' },
      ]
    : selectedBuilding
      ? [
          { label: 'Số tầng', value: `${selectedBuilding.floors.length}/${selectedBuilding.totalFloors || selectedBuilding.floors.length || 0}` },
          { label: 'Số phòng', value: `${selectedBuilding.totalRooms ?? 0}` },
        ]
      : detailItems;
  const hasLocation = typeof selectedBuilding?.latitude === 'number' && typeof selectedBuilding?.longitude === 'number';

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-page)]" style={{ padding: 'var(--space-layout)' }}>
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
              onContextChange={setInfrastructureContext}
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
                    gridTemplateColumns: 'minmax(240px, 0.9fr) minmax(420px, 1.4fr) auto',
                    gap: '18px',
                    alignItems: 'start',
                  }}
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center bg-[var(--brand-surface)] text-[var(--brand-primary)]">
                        <Layers3 size={15} />
                      </span>
                      <span className="border border-[var(--brand-border)] bg-[var(--brand-surface)] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--brand-primary)]">
                        {contextTypeLabel}
                      </span>
                    </div>
                    <h2 className="truncate text-xl font-semibold leading-tight text-[var(--text-primary)]">{contextTitle}</h2>
                    <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{contextSubtitle}</p>
                  </div>

                  <div
                    className="text-sm"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      columnGap: '28px',
                      rowGap: '8px',
                    }}
                  >
                    {compactDetailItems.map((item) => (
                      <div
                        key={item.label}
                        className="min-w-0"
                        style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr)', gap: '8px', alignItems: 'center' }}
                      >
                        <span className="text-[var(--text-secondary)]">{item.label}</span>
                        <span className="truncate font-semibold text-[var(--text-primary)]">{item.value}</span>
                      </div>
                    ))}
                    {selectedBuilding && (
                      <div
                        className="min-w-0"
                        style={{ display: 'grid', gridColumn: '1 / -1', gridTemplateColumns: '120px minmax(0, 1fr)', gap: '8px', alignItems: 'center' }}
                      >
                        <span className="text-[var(--text-secondary)]">Vị trí</span>
                        <button
                          type="button"
                          onClick={() => setShowLocationModal(true)}
                          className="inline-flex w-fit items-center gap-2 border border-[var(--surface-border)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-surface)]"
                        >
                          <MapPin size={15} />
                          <span>{hasLocation ? 'Xem bản đồ' : 'Chưa chọn vị trí'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 justify-end gap-2">
                    <button
                      type="button"
                      onClick={openAllSteps}
                      aria-label="Mở tất cả"
                      title="Mở tất cả"
                      className="inline-flex h-9 w-9 items-center justify-center border border-[var(--surface-border)] bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)]"
                    >
                      <Maximize2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={closeAllSteps}
                      aria-label="Thu gọn"
                      title="Thu gọn"
                      className="inline-flex h-9 w-9 items-center justify-center border border-[var(--surface-border)] bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-muted)]"
                    >
                      <Minimize2 size={15} />
                    </button>
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
                            onChange={(event) => setFormBuildingName(event.target.value)}
                            className="w-full border border-[var(--surface-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                            placeholder="VD: QMS Tower"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Số tầng *</label>
                          <input
                            value={formBuildingFloors}
                            onChange={(event) => setFormBuildingFloors(event.target.value.replace(/\D/g, ''))}
                            inputMode="numeric"
                            className="w-full border border-[var(--surface-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                            placeholder="VD: 5"
                          />
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
                          onChange={(event) => setFormFloorNumber(event.target.value.replace(/\D/g, ''))}
                          inputMode="numeric"
                          className="w-full border border-[var(--surface-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                          placeholder="VD: 5"
                        />
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
                      disabled={formSaving}
                      className="inline-flex h-10 items-center justify-center rounded-[var(--radius-button)] bg-[var(--brand-primary)] px-4 text-sm font-semibold text-[var(--text-on-color)] disabled:opacity-60"
                    >
                      {formSaving && <Loader2 size={16} className="mr-2 animate-spin" />}
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </section>
            )}

            {hasInfrastructureSelection && workspaceSections.map((section) => {
              const Icon = section.icon;
              const isOpen = openSteps[section.key];
              return (
                <section key={section.key} className="border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleStep(section.key)}
                    className="flex w-full items-center justify-between gap-4 border-b border-[var(--surface-border)] bg-[var(--surface-muted)] px-4 py-3 text-left transition-colors hover:bg-[var(--brand-surface)]"
                    aria-expanded={isOpen}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[var(--surface-card)] text-[var(--brand-primary)]">
                        <Icon size={17} />
                      </span>
                      <span className="truncate text-base font-semibold text-[var(--text-primary)]">{section.title}</span>
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)]">
                      {isOpen ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                    </span>
                  </button>
                  <div className={isOpen ? 'p-3' : 'hidden'}>
                    {section.content}
                  </div>
                </section>
              );
            })}

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
