import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const revenueData = [
  { month: 'Th 8', revenue: 95000000 },
  { month: 'Th 9', revenue: 102000000 },
  { month: 'Th 10', revenue: 98000000 },
  { month: 'Th 11', revenue: 110000000 },
  { month: 'Th 12', revenue: 118000000 },
  { month: 'Th 1', revenue: 125500000 },
];

const occupancyData = [
  { name: 'Đã thuê', value: 68, color: '#1f2937' },
  { name: 'Trống', value: 12, color: '#d1d5db' },
  { name: 'Bảo trì', value: 5, color: '#9ca3af' },
];

export function Charts() {
  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      {/* Bar Chart - 70% */}
      <div className="col-span-2 bg-white border-2 border-gray-300 rounded p-6">
        <h2 style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>Biến động doanh thu 6 tháng gần nhất</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" tickFormatter={(value) => `${value / 1000000}M`} />
            <Tooltip 
              formatter={(value: number) => `${value.toLocaleString()} VNĐ`}
              contentStyle={{ border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
            <Bar dataKey="revenue" fill="#1f2937" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Pie Chart - 30% */}
      <div className="bg-white border-2 border-gray-300 rounded p-6">
        <h2 style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>Tỷ lệ lấp đầy phòng</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={occupancyData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {occupancyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {occupancyData.map((item, index) => (
            <div key={index} className="flex items-center justify-between" style={{ fontSize: 'var(--type-caption)' }}>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
              </div>
              <span style={{ color: 'var(--text-primary)' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}