import { FileDown, Printer, BarChart2, Filter, Calendar } from 'lucide-react';
import { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const allRevenueData = [
  { period: '01/2026', building: 'Tòa A', rent: 120000000, electric: 23000000, water: 9000000, service: 32000000, total: 184000000 },
  { period: '01/2026', building: 'Tòa B', rent: 110000000, electric: 21000000, water: 8000000, service: 30000000, total: 169000000 },
  { period: '01/2026', building: 'Tòa C', rent: 115000000, electric: 22000000, water: 8500000, service: 31000000, total: 176500000 },
  { period: '01/2026', building: 'Tòa D', rent: 105000000, electric: 23000000, water: 8500000, service: 32000000, total: 168500000 },
  
  { period: '02/2026', building: 'Tòa A', rent: 120000000, electric: 24000000, water: 9500000, service: 32000000, total: 185500000 },
  { period: '02/2026', building: 'Tòa B', rent: 110000000, electric: 22000000, water: 8500000, service: 30000000, total: 170500000 },
  { period: '02/2026', building: 'Tòa C', rent: 115000000, electric: 23000000, water: 9000000, service: 31000000, total: 178000000 },
  { period: '02/2026', building: 'Tòa D', rent: 105000000, electric: 23000000, water: 9000000, service: 32000000, total: 169000000 },
  
  { period: '03/2026', building: 'Tòa A', rent: 125000000, electric: 22000000, water: 9000000, service: 33000000, total: 189000000 },
  { period: '03/2026', building: 'Tòa B', rent: 115000000, electric: 21000000, water: 8500000, service: 31000000, total: 175500000 },
  { period: '03/2026', building: 'Tòa C', rent: 120000000, electric: 22000000, water: 9000000, service: 32000000, total: 183000000 },
  { period: '03/2026', building: 'Tòa D', rent: 105000000, electric: 23000000, water: 8500000, service: 34000000, total: 170500000 },
  
  { period: '04/2026', building: 'Tòa A', rent: 125000000, electric: 21000000, water: 8500000, service: 33000000, total: 187500000 },
  { period: '04/2026', building: 'Tòa B', rent: 115000000, electric: 20000000, water: 8000000, service: 31000000, total: 174000000 },
  { period: '04/2026', building: 'Tòa C', rent: 120000000, electric: 22000000, water: 8500000, service: 32000000, total: 182500000 },
  { period: '04/2026', building: 'Tòa D', rent: 105000000, electric: 22000000, water: 8000000, service: 34000000, total: 169000000 },
  
  { period: '05/2026', building: 'Tòa A', rent: 130000000, electric: 23000000, water: 9500000, service: 34000000, total: 196500000 },
  { period: '05/2026', building: 'Tòa B', rent: 120000000, electric: 22000000, water: 9000000, service: 32000000, total: 183000000 },
  { period: '05/2026', building: 'Tòa C', rent: 125000000, electric: 23000000, water: 9500000, service: 33000000, total: 190500000 },
  { period: '05/2026', building: 'Tòa D', rent: 105000000, electric: 23000000, water: 9000000, service: 36000000, total: 173000000 },
  
  { period: '06/2026', building: 'Tòa A', rent: 130000000, electric: 24000000, water: 10000000, service: 34000000, total: 198000000 },
  { period: '06/2026', building: 'Tòa B', rent: 120000000, electric: 23000000, water: 9500000, service: 32000000, total: 184500000 },
  { period: '06/2026', building: 'Tòa C', rent: 125000000, electric: 24000000, water: 10000000, service: 33000000, total: 192000000 },
  { period: '06/2026', building: 'Tòa D', rent: 105000000, electric: 23000000, water: 8500000, service: 36000000, total: 172500000 },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

// Helper: Parse period "MM/YYYY" to Date
const parsePeriod = (period: string): Date => {
  const [month, year] = period.split('/').map(Number);
  return new Date(year, month - 1, 1);
};

// Helper: Format date input to period "MM/YYYY"
const dateToYYYYMM = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
};

export function RevenueReportContent() {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-06-30');
  const [building, setBuilding] = useState('Tất cả tòa nhà');
  
  const dateFromInputRef = useRef<HTMLInputElement>(null);
  const dateToInputRef = useRef<HTMLInputElement>(null);

  // Convert YYYY-MM-DD to dd/mm/yyyy
  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Convert dd/mm/yyyy to YYYY-MM-DD
  const parseToInputDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // Filter data
  const filteredData = allRevenueData.filter(item => {
    const itemDate = parsePeriod(item.period);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    // Check date range
    const inDateRange = (!fromDate || itemDate >= fromDate) && (!toDate || itemDate <= toDate);
    
    // Check building
    const inBuilding = building === 'Tất cả tòa nhà' || item.building === building;

    return inDateRange && inBuilding;
  });

  // Group by period and sum
  const groupedData = filteredData.reduce((acc, item) => {
    const existing = acc.find(x => x.period === item.period);
    if (existing) {
      existing.rent += item.rent;
      existing.electric += item.electric;
      existing.water += item.water;
      existing.service += item.service;
      existing.total += item.total;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, [] as typeof allRevenueData);

  // Sort by period
  const revenueData = groupedData.sort((a, b) => 
    parsePeriod(a.period).getTime() - parsePeriod(b.period).getTime()
  );

  const chartData = revenueData.map(item => ({
    period: item.period,
    'Tiền phòng': item.rent / 1000000,
    'Tiền điện': item.electric / 1000000,
    'Tiền nước': item.water / 1000000,
    'Phí dịch vụ': item.service / 1000000,
  }));
  
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.total, 0);
  const totalRent = revenueData.reduce((sum, item) => sum + item.rent, 0);
  const totalElectric = revenueData.reduce((sum, item) => sum + item.electric, 0);
  const totalWater = revenueData.reduce((sum, item) => sum + item.water, 0);
  const totalService = revenueData.reduce((sum, item) => sum + item.service, 0);

  // Export to Excel (CSV)
  const handleExportExcel = () => {
    let csv = 'Kỳ thanh toán,Tòa nhà,Tiền phòng (VNĐ),Tiền điện (VNĐ),Tiền nước (VNĐ),Phí dịch vụ (VNĐ),Tổng cộng (VNĐ)\n';
    
    filteredData.forEach(row => {
      csv += `${row.period},${row.building},${row.rent},${row.electric},${row.water},${row.service},${row.total}\n`;
    });

    csv += `\nTổng cộng,,${filteredData.reduce((s, i) => s + i.rent, 0)},${filteredData.reduce((s, i) => s + i.electric, 0)},${filteredData.reduce((s, i) => s + i.water, 0)},${filteredData.reduce((s, i) => s + i.service, 0)},${totalRevenue}\n`;

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_cao_doanh_thu_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print report
  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank', 'height=800,width=1000');
      if (!printWindow) {
        alert('Vui lòng cho phép popup để in báo cáo');
        return;
      }

      const htmlContent = `
        <html>
          <head>
            <title>Báo cáo Doanh thu</title>
            <style>
              body { 
                font-family: Inter, Arial, sans-serif; 
                padding: 20px; 
                margin: 0;
              }
              h1 { 
                text-align: center; 
                color: #1A4B84; 
                margin-bottom: 10px;
                font-size: 24px;
              }
              .info { 
                text-align: center; 
                margin-bottom: 20px; 
                color: #666;
                font-size: 14px;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px; 
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 12px; 
                text-align: left;
                font-size: 13px;
              }
              th { 
                background-color: #f5f5f5; 
                font-weight: 600; 
              }
              .text-right { 
                text-align: right; 
              }
              .total-row { 
                background-color: #f9f9f9; 
                font-weight: bold; 
              }
              .summary { 
                margin-top: 30px;
                text-align: center;
              }
              .summary-card { 
                display: inline-block; 
                margin: 10px 20px; 
                padding: 15px; 
                border: 1px solid #ddd; 
                border-radius: 8px;
                font-size: 14px;
              }
              .footer {
                margin-top: 30px;
                text-align: right;
                color: #666;
                font-size: 12px;
              }
              @media print {
                button { display: none; }
                body { padding: 10px; }
              }
            </style>
          </head>
          <body>
            <h1>BÁO CÁO DOANH THU</h1>
            <div class="info">Từ ${formatDisplayDate(dateFrom)} đến ${formatDisplayDate(dateTo)} | ${building}</div>
            
            <div class="summary">
              <div class="summary-card">
                <strong>Tổng doanh thu:</strong> ${formatCurrency(totalRevenue)} VNĐ
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Kỳ thanh toán</th>
                  ${building === 'Tất cả tòa nhà' ? '<th>Tòa nhà</th>' : ''}
                  <th class="text-right">Tiền phòng (VNĐ)</th>
                  <th class="text-right">Tiền điện (VNĐ)</th>
                  <th class="text-right">Tiền nước (VNĐ)</th>
                  <th class="text-right">Phí dịch vụ (VNĐ)</th>
                  <th class="text-right">Tổng cộng (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                ${(building === 'Tất cả tòa nhà' ? filteredData : revenueData).map(row => `
                  <tr>
                    <td>${row.period}</td>
                    ${building === 'Tất cả tòa nhà' ? `<td>${row.building}</td>` : ''}
                    <td class="text-right">${formatCurrency(row.rent)}</td>
                    <td class="text-right">${formatCurrency(row.electric)}</td>
                    <td class="text-right">${formatCurrency(row.water)}</td>
                    <td class="text-right">${formatCurrency(row.service)}</td>
                    <td class="text-right">${formatCurrency(row.total)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td>Tổng cộng</td>
                  ${building === 'Tất cả tòa nhà' ? '<td></td>' : ''}
                  <td class="text-right">${formatCurrency(filteredData.reduce((s, i) => s + i.rent, 0))}</td>
                  <td class="text-right">${formatCurrency(filteredData.reduce((s, i) => s + i.electric, 0))}</td>
                  <td class="text-right">${formatCurrency(filteredData.reduce((s, i) => s + i.water, 0))}</td>
                  <td class="text-right">${formatCurrency(filteredData.reduce((s, i) => s + i.service, 0))}</td>
                  <td class="text-right">${formatCurrency(totalRevenue)}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="footer">
              In ngày: ${new Date().toLocaleDateString('vi-VN')}
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load before printing
      printWindow.onload = function() {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
      
    } catch (error) {
      console.error('Error printing:', error);
      alert('Có lỗi khi in báo cáo. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter size={16} className="text-gray-500" />
          
          <input 
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            ref={dateFromInputRef}
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500 w-32"
          />
          
          <span className="text-sm text-gray-600">đến</span>
          
          <input 
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            ref={dateToInputRef}
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500 w-32"
          />
          
          <select 
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
          >
            <option>Tất cả tòa nhà</option>
            <option>Tòa A</option>
            <option>Tòa B</option>
            <option>Tòa C</option>
            <option>Tòa D</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setViewMode(viewMode === 'table' ? 'chart' : 'table')}
            className="px-4 py-2 bg-white border border-gray-800 text-gray-800 text-sm rounded hover:bg-gray-50 flex items-center space-x-2"
          >
            <BarChart2 size={16} />
            <span>{viewMode === 'table' ? 'Xem biểu đồ' : 'Xem bảng'}</span>
          </button>
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-white border border-gray-800 text-gray-800 text-sm rounded hover:bg-gray-50 flex items-center space-x-2"
          >
            <Printer size={16} />
            <span>In báo cáo</span>
          </button>
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2"
          >
            <FileDown size={16} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Tổng doanh thu</p>
          <p className="text-2xl text-green-600">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-gray-600 mt-1">VNĐ</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Tiền phòng</p>
          <p className="text-2xl text-blue-600">{formatCurrency(totalRent)}</p>
          <p className="text-xs text-gray-600 mt-1">VNĐ</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Tiền điện + nước</p>
          <p className="text-2xl text-orange-600">{formatCurrency(totalElectric + totalWater)}</p>
          <p className="text-xs text-gray-600 mt-1">VNĐ</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Phí dịch vụ</p>
          <p className="text-2xl text-purple-600">{formatCurrency(totalService)}</p>
          <p className="text-xs text-gray-600 mt-1">VNĐ</p>
        </div>
      </div>
      
      {/* Table or Chart View */}
      {viewMode === 'table' ? (
        <div className="bg-white border-2 border-gray-300 rounded">
          <div className="border-b border-gray-300 px-6 py-4">
            <h2 className="text-lg text-gray-800">Chi tiết doanh thu theo kỳ</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Kỳ thanh toán</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Tiền phòng (VNĐ)</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Tiền điện (VNĐ)</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Tiền nước (VNĐ)</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Phí dịch vụ (VNĐ)</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Tổng cộng (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{row.period}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatCurrency(row.rent)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatCurrency(row.electric)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatCurrency(row.water)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatCurrency(row.service)}</td>
                    <td className="px-6 py-4 text-sm text-green-600 text-right">{formatCurrency(row.total)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold">Tổng cộng</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold text-right">
                    {formatCurrency(revenueData.reduce((sum, item) => sum + item.rent, 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold text-right">
                    {formatCurrency(revenueData.reduce((sum, item) => sum + item.electric, 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold text-right">
                    {formatCurrency(revenueData.reduce((sum, item) => sum + item.water, 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold text-right">
                    {formatCurrency(revenueData.reduce((sum, item) => sum + item.service, 0))}
                  </td>
                  <td className="px-6 py-4 text-sm text-green-700 font-bold text-right">
                    {formatCurrency(totalRevenue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-300 rounded p-6">
          <div className="mb-4">
            <h2 className="text-lg text-gray-800">Biểu đồ doanh thu theo kỳ</h2>
            <p className="text-sm text-gray-600">Đơn vị: Triệu VNĐ</p>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => `${value.toFixed(0)} triệu`}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Tiền phòng" fill="#1f2937" />
              <Bar dataKey="Tiền điện" fill="#3b82f6" />
              <Bar dataKey="Tiền nước" fill="#10b981" />
              <Bar dataKey="Phí dịch vụ" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}