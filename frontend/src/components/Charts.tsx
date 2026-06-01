import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { reportService } from '../services/feature.service';

interface RevenueBarItem {
  month: string;
  revenue: number;
}

interface OccupancyItem {
  name: string;
  value: number;
  color: string;
}

export function Charts() {
  const [revenueData, setRevenueData] = useState<RevenueBarItem[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyItem[]>([]);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();

    Promise.all([reportService.getMonthlyRevenue(year), reportService.getRoomStats()])
      .then(([monthly, roomStats]) => {
        const bars = (monthly || [])
          .sort((a, b) => a.month - b.month)
          .slice(-6)
          .map((m) => ({
            month: `Th ${m.month}`,
            revenue: m.totalRevenue || 0,
          }));
        setRevenueData(bars);

        setOccupancyData([
          { name: 'Đã thuê', value: roomStats?.occupiedRooms || 0, color: '#1E4E8C' },
          { name: 'Trống', value: roomStats?.availableRooms || 0, color: '#CBD5E1' },
          { name: 'Bảo trì', value: roomStats?.maintenanceRooms || 0, color: '#94A3B8' },
        ]);
      })
      .catch(() => {
        setRevenueData([]);
        setOccupancyData([]);
      });
  }, []);

  const occupancyLabelData = useMemo(
    () => occupancyData.filter((item) => item.value > 0),
    [occupancyData]
  );

  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      {/* Bar Chart - 70% */}
      <div className="col-span-2 app-card p-6">
        <h2 style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>Biến động doanh thu 6 tháng gần nhất</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" tickFormatter={(value) => `${value / 1000000}M`} />
            <Tooltip 
              formatter={(value: number) => `${value.toLocaleString()} VNĐ`}
              contentStyle={{ border: '1px solid #d7e0ea', borderRadius: '8px' }}
            />
            <Bar dataKey="revenue" fill="#1E4E8C" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Pie Chart - 30% */}
      <div className="app-card p-6">
        <h2 style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>Tỷ lệ lấp đầy phòng</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={occupancyLabelData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#1E4E8C"
              dataKey="value"
            >
              {occupancyLabelData.map((entry, index) => (
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