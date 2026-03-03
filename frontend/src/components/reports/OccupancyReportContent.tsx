import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const occupancyData = [
  { name: 'Đã thuê', value: 142, color: '#10b981' },
  { name: 'Trống', value: 18, color: '#6b7280' },
  { name: 'Bảo trì', value: 5, color: '#f59e0b' },
];

const buildingStats = [
  { building: 'Tòa A', total: 48, vacant: 5, occupancy: 89.6 },
  { building: 'Tòa B', total: 42, vacant: 3, occupancy: 92.9 },
  { building: 'Tòa C', total: 38, vacant: 6, occupancy: 84.2 },
  { building: 'Tòa D', total: 37, vacant: 4, occupancy: 89.2 },
];

const totalRooms = buildingStats.reduce((sum, b) => sum + b.total, 0);
const totalVacant = buildingStats.reduce((sum, b) => sum + b.vacant, 0);
const overallOccupancy = (((totalRooms - totalVacant) / totalRooms) * 100).toFixed(1);

export function OccupancyReportContent() {
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
          <p className="text-green-600" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{occupancyData[0].value}</p>
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
                fill="#8884d8"
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
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '15px',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Building Stats Table */}
        <div className="bg-white border-2 border-gray-300 rounded">
          <div className="border-b border-gray-300 px-6 py-4">
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