import { FileDown, Printer, BarChart2, Filter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportService, MonthlyRevenue } from '../../services/feature.service';

interface RevenueRow {
  period: string;
  rent: number;
  service: number;
  other: number;
  total: number;
}

const mapRevenue = (m: MonthlyRevenue): RevenueRow => ({
  period: `${String(m.month).padStart(2, '0')}/${m.year}`,
  rent: m.roomRentRevenue,
  service: m.serviceRevenue,
  other: m.otherRevenue,
  total: m.totalRevenue,
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

const parsePeriod = (period: string): Date => {
  const [month, year] = period.split('/').map(Number);
  return new Date(year, month - 1, 1);
};

export function RevenueReportContent() {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [dateFrom, setDateFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [dateTo, setDateTo] = useState(() => `${new Date().getFullYear()}-12-31`);
  const [allRevenueData, setAllRevenueData] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(false);
  
  const dateFromInputRef = useRef<HTMLInputElement>(null);
  const dateToInputRef = useRef<HTMLInputElement>(null);

  // Fetch data for all years in the selected range
  useEffect(() => {
    const fromYear = dateFrom ? new Date(dateFrom).getFullYear() : new Date().getFullYear();
    const toYear = dateTo ? new Date(dateTo).getFullYear() : fromYear;
    const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);

    setLoading(true);
    Promise.all(years.map(y => reportService.getMonthlyRevenue(y)))
      .then(results => {
        const rows = results.flat().map(mapRevenue);
        setAllRevenueData(rows);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  // Convert YYYY-MM-DD to dd/mm/yyyy
  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Convert dd/mm/yyyy to YYYY-MM-DD (unused but kept for future use)
  const parseToInputDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };
  void parseToInputDate; // suppress unused warning

  // Filter data
  const revenueData = allRevenueData.filter(item => {
    const itemDate = parsePeriod(item.period);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;
    return (!fromDate || itemDate >= fromDate) && (!toDate || itemDate <= toDate);
  }).sort((a, b) => parsePeriod(a.period).getTime() - parsePeriod(b.period).getTime());

  const chartData = revenueData.map(item => ({
    period: item.period,
    'Tiền phòng': item.rent / 1000000,
    'Phí dịch vụ': item.service / 1000000,
    'Doanh thu khác': item.other / 1000000,
  }));
  
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.total, 0);
  const totalRent = revenueData.reduce((sum, item) => sum + item.rent, 0);
  const totalService = revenueData.reduce((sum, item) => sum + item.service, 0);
  const totalOther = revenueData.reduce((sum, item) => sum + item.other, 0);

  // Export to Excel (CSV)
  const handleExportExcel = () => {
    let csv = 'Kỳ thanh toán,Tiền phòng (VNĐ),Phí dịch vụ (VNĐ),Doanh thu khác (VNĐ),Tổng cộng (VNĐ)\n';
    
    revenueData.forEach(row => {
      csv += `${row.period},${row.rent},${row.service},${row.other},${row.total}\n`;
    });

    csv += `\nTổng cộng,${totalRent},${totalService},${totalOther},${totalRevenue}\n`;

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
                font-family: Roboto, Arial, sans-serif; 
                padding: 20px; 
                margin: 0;
                color: #0F172A;
                background: #F4F7FB;
              }
              h1 { 
                text-align: center; 
                color: #1E4E8C; 
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
                font-size: 14px;
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
                font-size: 14px;
              }
              @media print {
                button { display: none; }
                body { padding: 10px; }
              }
            </style>
          </head>
          <body>
            <h1>BÁO CÁO DOANH THU</h1>
            <div class="info">Từ ${formatDisplayDate(dateFrom)} đến ${formatDisplayDate(dateTo)}</div>
            
            <div class="summary">
              <div class="summary-card">
                <strong>Tổng doanh thu:</strong> ${formatCurrency(totalRevenue)} VNĐ
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Kỳ thanh toán</th>
                  <th class="text-right">Tiền phòng (VNĐ)</th>
                  <th class="text-right">Phí dịch vụ (VNĐ)</th>
                  <th class="text-right">Doanh thu khác (VNĐ)</th>
                  <th class="text-right">Tổng cộng (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                ${revenueData.map(row => `
                  <tr>
                    <td>${row.period}</td>
                    <td class="text-right">${formatCurrency(row.rent)}</td>
                    <td class="text-right">${formatCurrency(row.service)}</td>
                    <td class="text-right">${formatCurrency(row.other)}</td>
                    <td class="text-right">${formatCurrency(row.total)}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td>Tổng cộng</td>
                  <td class="text-right">${formatCurrency(totalRent)}</td>
                  <td class="text-right">${formatCurrency(totalService)}</td>
                  <td class="text-right">${formatCurrency(totalOther)}</td>
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
          <p className="text-2xl text-green-600">{loading ? '...' : formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-gray-600 mt-1">VNĐ</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Tiền phòng</p>
          <p className="text-2xl text-blue-600">{loading ? '...' : formatCurrency(totalRent)}</p>
          <p className="text-xs text-gray-600 mt-1">VNĐ</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Phí dịch vụ</p>
          <p className="text-2xl text-purple-600">{loading ? '...' : formatCurrency(totalService)}</p>
          <p className="text-xs text-gray-600 mt-1">VNĐ</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Doanh thu khác</p>
          <p className="text-2xl text-orange-600">{loading ? '...' : formatCurrency(totalOther)}</p>
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
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">Đang tải dữ liệu...</div>
            ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Kỳ thanh toán</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Tiền phòng (VNĐ)</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Phí dịch vụ (VNĐ)</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Doanh thu khác (VNĐ)</th>
                  <th className="px-6 py-3 text-right text-sm text-gray-600">Tổng cộng (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">{row.period}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatCurrency(row.rent)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatCurrency(row.service)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 text-right">{formatCurrency(row.other)}</td>
                    <td className="px-6 py-4 text-sm text-green-600 text-right">{formatCurrency(row.total)}</td>
                  </tr>
                ))}
                {revenueData.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">Không có dữ liệu</td></tr>
                )}
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold">Tổng cộng</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold text-right">{formatCurrency(totalRent)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold text-right">{formatCurrency(totalService)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold text-right">{formatCurrency(totalOther)}</td>
                  <td className="px-6 py-4 text-sm text-green-700 font-bold text-right">{formatCurrency(totalRevenue)}</td>
                </tr>
              </tbody>
            </table>
            )}
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
              <XAxis dataKey="period" tick={{ fontSize: 14 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 14 }} stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: 'var(--type-caption)'
                }}
                formatter={(value: number) => `${value.toFixed(0)} triệu`}
              />
              <Legend wrapperStyle={{ fontSize: 'var(--type-caption)' }} />
              <Bar dataKey="Tiền phòng" fill="#1f2937" />
              <Bar dataKey="Phí dịch vụ" fill="#f59e0b" />
              <Bar dataKey="Doanh thu khác" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}