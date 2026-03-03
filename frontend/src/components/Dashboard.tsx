import { KPICards } from './KPICards';
import { QuickAccessTables } from './QuickAccessTables';
import { FloatingActions } from './FloatingActions';

export function Dashboard() {
  return (
    <>
      {/* Top: Summary KPI Cards */}
      <KPICards />
      
      {/* Main: 3 Priority Tables */}
      <QuickAccessTables />
      
      {/* Floating Actions */}
      <FloatingActions />
    </>
  );
}