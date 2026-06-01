import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { roomService } from '../../services/api.service';

interface OccupancyData {
  name: string;
  value: number;
  color: string;
}

interface BuildingStat {
  building: string;
  total: number;
  vacant: number;
  occupancy: number;
}

export function OccupancyReportContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
  const [buildingStats, setBuildingStats] = useState<BuildingStat[]>([]);

  useEffect(() => {
    fetchOccupancyData();
  }, []);

  const fetchOccupancyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const rooms = await roomService.getAll();
      
      // Count rooms by status
      const statusCounts: Record<string, number> = {};
      const buildingCounts: Record<string, { total: number; vacant: number }> = {};
      
      rooms.forEach((room: any) => {
        const status = (room.status || room.trangThai || 'Trống').toLowerCase();
        const roomNumber = room.roomCode || room.maPhong || '';
        const building = roomNumber.split('-')[0] || 'Unknown';
        
        // Count by status
        let statusKey = 'Trống';
        if (status === 'đã thuê' || status === 'rented') {
          statusKey = 'Đã thuê';
        } else if (status === 'bảo trì' || status === 'maintenance') {
          statusKey = 'Bảo trì';
        }
        statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
        
        // Count by building
        if (!buildingCounts[building]) {
          buildingCounts[building] = { total: 0, vacant: 0 };
        }
        buildingCounts[building].total++;
        if (statusKey === 'Trống') {
          buildingCounts[building].vacant++;
        }
      });
      
      // Prepare occupancy chart data
      const chartData: OccupancyData[] = [
        { name: 'Đã thuê', value: statusCounts['Đã thuê'] || 0, color: '#10b981' },
        { name: 'Trống', value: statusCounts['Trống'] || 0, color: '#6b7280' },
        { name: 'Bảo trì', value: statusCounts['Bảo trì'] || 0, color: '#f59e0b' },
      ];
      
      // Prepare building stats
      const stats: BuildingStat[] = Object.entries(buildingCounts)
        .map(([building, counts]) => ({
          building: `Tòa ${building}`,
          total: counts.total,
          vacant: counts.vacant,
          occupancy: counts.total > 0 ? parseFloat((((counts.total - counts.vacant) / counts.total) * 100).toFixed(1)) : 0,
        }))
        .sort((a, b) => a.building.localeCompare(b.building));
      
      setOccupancyData(chartData);
      setBuildingStats(stats);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu công suất');
      console.error('Error fetching occupancy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalRooms = buildingStats.reduce((sum, b) => sum + b.total, 0);
  const totalVacant = buildingStats.reduce((sum, b) => sum + b.vacant, 0);
  const totalRented = occupancyData.find(d => d.name === 'Đã thuê')?.value || 0;
  const overallOccupancy = totalRooms > 0 ? (((totalRooms - totalVacant) / totalRooms) * 100).toFixed(1) : '0.0';

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 size={48} className="animate-spin text-gray-400" />
          <span className="text-gray-600">Đang tải dữ liệu công suất...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <AlertTriangle size={48} className="text-red-500" />
          <p className="text-red-600 text-center">{error}</p>
          <button 
            onClick={fetchOccupancyData}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Tổng số phòng</p>
          <p className="text-gray-900" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{totalRooms}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>phòng</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Đã cho thuê</p>
          <p className="text-green-600" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{totalRented}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>phòng</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Phòng trống</p>
          <p className="text-gray-600" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{totalVacant}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>phòng</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Tỷ lệ lấp đầy</p>
          <p className="text-blue-600" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{overallOccupancy}%</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>tổng thể</p>
        </div>
      </div>
      
      {/* Chart and Building Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Pie Chart */}
        <div className="bg-white border-2 border-gray-300 rounded p-6">
          <h2 className="text-gray-800 mb-4" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Phân bổ trạng thái phòng</h2>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#1E4E8C"
                dataKey="value"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px' }}
              >
                {occupancyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #d7e0ea',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Building Stats Table */}
        <div className="app-card">
          <div className="border-b border-surface-border px-6 py-4">
            <h2 className="text-gray-800" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Thống kê theo tòa nhà</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Tòa nhà</th>
                  <th className="px-6 py-3 text-center text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Tổng số</th>
                  <th className="px-6 py-3 text-center text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Trống</th>
                  <th className="px-6 py-3 text-center text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Tỷ lệ lấp đầy</th>
                </tr>
              </thead>
              <tbody>
                {buildingStats.map((stat, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800" style={{ fontSize: 'var(--type-body)' }}>{stat.building}</td>
                    <td className="px-6 py-4 text-gray-700 text-center" style={{ fontSize: 'var(--type-body)' }}>{stat.total}</td>
                    <td className="px-6 py-4 text-gray-700 text-center" style={{ fontSize: 'var(--type-body)' }}>{stat.vacant}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={stat.occupancy >= 90 ? 'text-green-600' : stat.occupancy >= 85 ? 'text-blue-600' : 'text-orange-600'} style={{ fontSize: 'var(--type-body)' }}>
                        {stat.occupancy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}