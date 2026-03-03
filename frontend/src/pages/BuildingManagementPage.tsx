import { BuildingSidebar } from '../components/infrastructure/BuildingSidebar';
import { RoomTable } from '../components/infrastructure/RoomTable';

export function BuildingManagementPage() {
  return (
    <div className="flex-1 overflow-hidden flex" style={{ padding: 'var(--space-layout)', gap: 'var(--space-layout)' }}>
      {/* Building Sidebar - Left Column */}
      <div style={{ width: '280px', flexShrink: 0 }}>
        <BuildingSidebar />
      </div>
      
      {/* Room Table - Right Column */}
      <div className="flex-1 overflow-y-auto">
        <RoomTable />
      </div>
    </div>
  );
}