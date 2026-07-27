import { useState } from 'react';
import { BuildingSidebar } from '../components/infrastructure/BuildingSidebar';
import { RoomTable } from '../components/infrastructure/RoomTable';
import { ServiceTable } from '../components/infrastructure/ServiceTable';
import { AssetTable } from '../components/infrastructure/AssetTable';
import { PageHeader } from '../components/ui/product-system';
import { ChevronDown, ChevronRight } from 'lucide-react';

type InfrastructureStep = 'rooms' | 'services' | 'assets';
type InfrastructureContext = {
  type: 'all' | 'building' | 'floor';
  buildingId: number | null;
  floorId: number | null;
  label: string;
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
  });
  const [openSteps, setOpenSteps] = useState<Record<InfrastructureStep, boolean>>({
    rooms: true,
    services: true,
    assets: true,
  });

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

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ padding: 'var(--space-layout)', gap: '14px' }}>
      <PageHeader
        eyebrow="Quản lý hạ tầng"
        title="Vận hành tòa nhà trên một màn hình"
        description="Thêm tầng, cập nhật thông tin tầng, phòng, đơn giá dịch vụ và thiết bị/tài sản mà không cần chuyển phân hệ."
      />

      <div
        className="grid min-h-0 flex-1 overflow-hidden"
        style={{ gridTemplateColumns: '300px minmax(0, 1fr)', gap: 'var(--space-layout)' }}
      >
        <div className="min-h-0 overflow-hidden">
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

        <div className="min-h-0 overflow-y-auto pr-1">
          <div className="space-y-5">
            <div className="flex items-center justify-between border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Ngữ cảnh thao tác</p>
                <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{infrastructureContext.label}</p>
              </div>
              <span className="border border-[var(--surface-border)] bg-[var(--surface-muted)] px-3 py-1 text-sm font-medium text-[var(--text-secondary)]">
                {infrastructureContext.type === 'floor'
                  ? 'Đang chọn tầng'
                  : infrastructureContext.type === 'building'
                    ? 'Đang chọn tòa'
                    : 'Toàn bộ'}
              </span>
            </div>

            <section className="rounded border border-[var(--surface-border)] bg-[var(--surface-card)]">
              <button
                type="button"
                onClick={() => toggleStep('rooms')}
                className="flex w-full items-start justify-between gap-4 border-b border-[var(--surface-border)] px-5 py-4 text-left transition-colors hover:bg-[var(--surface-muted)]"
                aria-expanded={openSteps.rooms}
              >
                <span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">Bước 1</span>
                  <span className="mt-1 block text-lg font-semibold text-[var(--text-primary)]">Thông tin phòng trong tòa</span>
                </span>
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)]">
                  {openSteps.rooms ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </span>
              </button>
              <div className={openSteps.rooms ? 'p-4' : 'hidden'}>
                <RoomTable
                  selectedFloorId={selectedFloorId}
                  selectedBuildingId={selectedBuildingId}
                  addRoomRequest={addRoomRequest}
                  structureRefreshKey={structureRefreshKey}
                  onRoomsChange={() => setStructureRefreshKey((current) => current + 1)}
                />
              </div>
            </section>

            <section className="rounded border border-[var(--surface-border)] bg-[var(--surface-card)]">
              <button
                type="button"
                onClick={() => toggleStep('services')}
                className="flex w-full items-start justify-between gap-4 border-b border-[var(--surface-border)] px-5 py-4 text-left transition-colors hover:bg-[var(--surface-muted)]"
                aria-expanded={openSteps.services}
              >
                <span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">Bước 2</span>
                  <span className="mt-1 block text-lg font-semibold text-[var(--text-primary)]">
                    Đơn giá dịch vụ áp dụng cho tòa/phòng
                  </span>
                </span>
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)]">
                  {openSteps.services ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </span>
              </button>
              <div className={openSteps.services ? 'p-4' : 'hidden'}>
                <ServiceTable embedded contextBuildingId={infrastructureContext.buildingId} />
              </div>
            </section>

            <section className="rounded border border-[var(--surface-border)] bg-[var(--surface-card)]">
              <button
                type="button"
                onClick={() => toggleStep('assets')}
                className="flex w-full items-start justify-between gap-4 border-b border-[var(--surface-border)] px-5 py-4 text-left transition-colors hover:bg-[var(--surface-muted)]"
                aria-expanded={openSteps.assets}
              >
                <span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">Bước 3</span>
                  <span className="mt-1 block text-lg font-semibold text-[var(--text-primary)]">Thiết bị và tài sản trong phòng</span>
                </span>
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)]">
                  {openSteps.assets ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </span>
              </button>
              <div className={openSteps.assets ? 'p-4' : 'hidden'}>
                <AssetTable embedded contextBuildingId={infrastructureContext.buildingId} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
