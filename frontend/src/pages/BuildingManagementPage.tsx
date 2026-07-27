import { useState } from 'react';
import { BuildingSidebar } from '../components/infrastructure/BuildingSidebar';
import { RoomTable } from '../components/infrastructure/RoomTable';
import { ServiceTable } from '../components/infrastructure/ServiceTable';
import { AssetTable } from '../components/infrastructure/AssetTable';
import { Building2, ChevronDown, ChevronRight, Home, Maximize2, Minimize2, Package, PlugZap } from 'lucide-react';

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

  const openAllSteps = () => {
    setOpenSteps({ rooms: true, services: true, assets: true });
  };

  const closeAllSteps = () => {
    setOpenSteps({ rooms: false, services: false, assets: false });
  };

  const contextTypeLabel =
    infrastructureContext.type === 'floor'
      ? 'Đang chọn tầng'
      : infrastructureContext.type === 'building'
        ? 'Đang chọn tòa'
        : 'Toàn bộ hạ tầng';

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface-page)]" style={{ padding: 'var(--space-layout)', gap: '14px' }}>
      <div
        className="grid min-h-0 flex-1 overflow-hidden"
        style={{ gridTemplateColumns: '320px minmax(0, 1fr)', gap: 'var(--space-layout)' }}
      >
        <div className="min-h-0 overflow-hidden border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-sm">
          <div className="border-b border-[var(--surface-border)] bg-[var(--surface-muted)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--brand-primary)]">
                <Building2 size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Cấu trúc tòa nhà</p>
                <p className="text-xs text-[var(--text-secondary)]">Chọn tòa hoặc tầng để thao tác</p>
              </div>
            </div>
          </div>
          <div className="h-[calc(100%-66px)] min-h-0 overflow-hidden">
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
        </div>

        <div className="min-h-0 overflow-y-auto pr-1">
          <div className="space-y-4">
            <div className="sticky top-0 z-10 border border-[var(--surface-border)] bg-[linear-gradient(135deg,var(--surface-card)_0%,var(--brand-surface)_100%)] shadow-sm">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">{contextTypeLabel}</span>
                  <div className="flex shrink-0 items-center gap-1 border border-[var(--surface-border)] bg-[var(--surface-card)] p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={openAllSteps}
                      aria-label="Mở tất cả"
                      title="Mở tất cả"
                      className="inline-flex h-8 w-8 items-center justify-center text-[var(--text-primary)] transition-colors hover:bg-[var(--brand-surface)]"
                    >
                      <Maximize2 size={14} />
                    </button>
                    <span className="h-5 w-px bg-[var(--surface-border)]" />
                    <button
                      type="button"
                      onClick={closeAllSteps}
                      aria-label="Thu gọn"
                      title="Thu gọn"
                      className="inline-flex h-8 w-8 items-center justify-center text-[var(--text-primary)] transition-colors hover:bg-[var(--brand-surface)]"
                    >
                      <Minimize2 size={14} />
                    </button>
                  </div>
                </div>
                <h2 className="mt-1 truncate text-lg font-semibold leading-tight text-[var(--text-primary)]">
                  {infrastructureContext.label}
                </h2>
              </div>

            </div>

            <section className="border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-sm">
              <button
                type="button"
                onClick={() => toggleStep('rooms')}
                className="flex w-full items-center justify-between gap-4 border-b border-[var(--surface-border)] bg-[var(--surface-muted)] px-5 py-4 text-left transition-colors hover:bg-[var(--brand-surface)]"
                aria-expanded={openSteps.rooms}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center bg-[var(--brand-surface)] text-[var(--brand-primary)]">
                    <Home size={18} />
                  </span>
                  <span>
                    <span className="mt-1 block text-lg font-semibold text-[var(--text-primary)]">Thông tin phòng trong tòa</span>
                  </span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)]">
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

            <section className="border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-sm">
              <button
                type="button"
                onClick={() => toggleStep('services')}
                className="flex w-full items-center justify-between gap-4 border-b border-[var(--surface-border)] bg-[var(--surface-muted)] px-5 py-4 text-left transition-colors hover:bg-[var(--brand-surface)]"
                aria-expanded={openSteps.services}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center bg-[var(--brand-surface)] text-[var(--brand-primary)]">
                    <PlugZap size={18} />
                  </span>
                  <span>
                    <span className="mt-1 block text-lg font-semibold text-[var(--text-primary)]">
                      Đơn giá dịch vụ áp dụng cho tòa/phòng
                    </span>
                  </span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)]">
                  {openSteps.services ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </span>
              </button>
              <div className={openSteps.services ? 'p-4' : 'hidden'}>
                <ServiceTable embedded contextBuildingId={infrastructureContext.buildingId} />
              </div>
            </section>

            <section className="border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-sm">
              <button
                type="button"
                onClick={() => toggleStep('assets')}
                className="flex w-full items-center justify-between gap-4 border-b border-[var(--surface-border)] bg-[var(--surface-muted)] px-5 py-4 text-left transition-colors hover:bg-[var(--brand-surface)]"
                aria-expanded={openSteps.assets}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center bg-[var(--brand-surface)] text-[var(--brand-primary)]">
                    <Package size={18} />
                  </span>
                  <span>
                    <span className="mt-1 block text-lg font-semibold text-[var(--text-primary)]">Thiết bị và tài sản trong phòng</span>
                  </span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--surface-border)] bg-[var(--surface-card)] text-[var(--text-secondary)]">
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
