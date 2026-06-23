import { useState } from 'react';
import { BuildingSidebar } from '../components/infrastructure/BuildingSidebar';
import { RoomTable } from '../components/infrastructure/RoomTable';
import { PageHeader } from '../components/ui/product-system';

export function BuildingManagementPage() {
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [addRoomRequest, setAddRoomRequest] = useState<{ id: number; floorId: number } | null>(null);

  const handleRequestAddRoom = (floorId: number) => {
    setSelectedFloorId(floorId);
    setSelectedBuildingId(null);
    setAddRoomRequest({ id: Date.now(), floorId });
  };

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ padding: 'var(--space-layout)', gap: '14px' }}>
      <PageHeader
        eyebrow="Quản lý hạ tầng"
        title="Cơ cấu tòa nhà và phòng"
        description="Quản lý tòa nhà, tầng, phòng và thông tin vận hành trong cùng một khu vực."
      />

      <div className="flex min-h-0 flex-1 overflow-hidden" style={{ gap: 'var(--space-layout)' }}>
        <div style={{ width: '280px', flexShrink: 0 }}>
          <BuildingSidebar
            selectedFloor={selectedFloorId}
            onSelectFloor={setSelectedFloorId}
            selectedBuilding={selectedBuildingId}
            onSelectBuilding={setSelectedBuildingId}
            onRequestAddRoom={handleRequestAddRoom}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <RoomTable
            selectedFloorId={selectedFloorId}
            selectedBuildingId={selectedBuildingId}
            addRoomRequest={addRoomRequest}
          />
        </div>
      </div>
    </div>
  );
}
