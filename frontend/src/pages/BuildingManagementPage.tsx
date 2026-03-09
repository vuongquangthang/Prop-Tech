import { useState } from 'react';
import { BuildingSidebar } from '../components/infrastructure/BuildingSidebar';
import { RoomTable } from '../components/infrastructure/RoomTable';

export function BuildingManagementPage() {
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);

  return (
    <div className="flex-1 overflow-hidden flex" style={{ padding: 'var(--space-layout)', gap: 'var(--space-layout)' }}>
      {/* Building Sidebar - Left Column */}
      <div style={{ width: '280px', flexShrink: 0 }}>
        <BuildingSidebar
          selectedFloor={selectedFloorId}
          onSelectFloor={setSelectedFloorId}
          selectedBuilding={selectedBuildingId}
          onSelectBuilding={setSelectedBuildingId}
        />
      </div>
      
      {/* Room Table - Right Column */}
      <div className="flex-1 overflow-y-auto">
        <RoomTable selectedFloorId={selectedFloorId} selectedBuildingId={selectedBuildingId} />
      </div>
    </div>
  );
}