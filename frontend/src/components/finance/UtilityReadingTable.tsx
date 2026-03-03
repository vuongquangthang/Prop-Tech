import { Save, Calculator, Upload, Filter, CheckCircle, X, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { useData } from '../../contexts/DataContext';

interface UtilityRow {
  room: string;
  oldElectric: string;
  newElectric: string;
  oldWater: string;
  newWater: string;
  image: boolean;
}

const initialData: UtilityRow[] = [
  { room: 'A-101', oldElectric: '1250', newElectric: '', oldWater: '45', newWater: '', image: false },
  { room: 'A-102', oldElectric: '1180', newElectric: '', oldWater: '38', newWater: '', image: false },
  { room: 'A-103', oldElectric: '1320', newElectric: '', oldWater: '42', newWater: '', image: false },
  { room: 'A-104', oldElectric: '1090', newElectric: '', oldWater: '35', newWater: '', image: false },
  { room: 'A-105', oldElectric: '1450', newElectric: '', oldWater: '50', newWater: '', image: false },
  { room: 'A-106', oldElectric: '1280', newElectric: '', oldWater: '40', newWater: '', image: false },
  { room: 'A-107', oldElectric: '1360', newElectric: '', oldWater: '48', newWater: '', image: false },
  { room: 'A-108', oldElectric: '1150', newElectric: '', oldWater: '36', newWater: '', image: false },
];

// Tenant mapping
const tenantMapping: { [key: string]: string } = {
  'A-101': 'Nguyễn Văn A',
  'A-102': 'Trần Thị B',
  'A-103': 'Lê Văn C',
  'A-104': 'Phạm Thị D',
  'A-105': 'Hoàng Văn E',
  'A-106': 'Vũ Thị F',
  'A-107': 'Mai Văn G',
  'A-108': 'Đặng Thị H',
};

export function UtilityReadingTable() {
  const { addInvoice } = useData();
  const [utilityData, setUtilityData] = useState<UtilityRow[]>(initialData);
  const [selectedBuilding, setSelectedBuilding] = useState('Tòa A');
  const [selectedFloor, setSelectedFloor] = useState('Tầng 1');
  const [selectedMonth, setSelectedMonth] = useState('Tháng 02/2026');
  const [saveModal, setSaveModal] = useState(false);
  const [calculateModal, setCalculateModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadingRoom, setUploadingRoom] = useState('');

  const handleInputChange = (index: number, field: 'newElectric' | 'newWater', value: string) => {
    const newData = [...utilityData];
    newData[index][field] = value;
    setUtilityData(newData);
  };

  const calculateUsage = (oldVal: string, newVal: string) => {
    if (!newVal || !oldVal) return '-';
    const usage = parseFloat(newVal) - parseFloat(oldVal);
    return usage >= 0 ? usage.toString() : '-';
  };

  const isAbnormal = (oldVal: string, newVal: string, type: 'electric' | 'water') => {
    if (!newVal || !oldVal) return false;
    const usage = parseFloat(newVal) - parseFloat(oldVal);
    
    // Chỉ cảnh báo khi s��� mới nhỏ hơn số cũ (tiêu thụ âm)
    return usage < 0;
  };

  const handleSaveDraft = () => {
    setSaveModal(true);
  };

  const handleCalculateInvoice = () => {
    // Check if all data is entered
    const hasEmptyFields = utilityData.some(row => !row.newElectric || !row.newWater);
    if (hasEmptyFields) {
      alert('Vui lòng nhập đầy đủ chỉ số điện và nước cho tất cả các phòng trước khi tính toán hóa đơn!');
      return;
    }
    setCalculateModal(true);
  };

  const handleUploadImage = (room: string) => {
    setUploadingRoom(room);
    setUploadModal(true);
  };

  const confirmUpload = () => {
    const newData = utilityData.map(row => 
      row.room === uploadingRoom ? { ...row, image: true } : row
    );
    setUtilityData(newData);
    setUploadModal(false);
    setUploadingRoom('');
  };

  const filledCount = utilityData.filter(row => row.newElectric && row.newWater).length;
  const totalCount = utilityData.length;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-between)' }}>
        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: 'var(--space-between)' }}>
            <Filter size={20} style={{ color: 'var(--text-secondary)' }} />
            
            <select 
              className="focus:outline-none"
              style={{
                padding: '12px 16px',
                fontSize: 'var(--type-body)',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-button)',
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-primary)',
                height: 'var(--input-height)'
              }}
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
            >
              <option>Tòa A</option>
              <option>Tòa B</option>
              <option>Tòa C</option>
            </select>
            
            <select 
              className="focus:outline-none"
              style={{
                padding: '12px 16px',
                fontSize: 'var(--type-body)',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-button)',
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-primary)',
                height: 'var(--input-height)'
              }}
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
            >
              <option>Tầng 1</option>
              <option>Tầng 2</option>
              <option>Tầng 3</option>
            </select>
            
            <select 
              className="focus:outline-none"
              style={{
                padding: '12px 16px',
                fontSize: 'var(--type-body)',
                border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-button)',
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-primary)',
                height: 'var(--input-height)'
              }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option>Tháng 02/2026</option>
              <option>Tháng 01/2026</option>
              <option>Tháng 12/2025</option>
            </select>

            <div style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)', marginLeft: '16px' }}>
              Đã nhập: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{filledCount}/{totalCount}</span> phòng
            </div>
          </div>
          
          <div className="flex items-center" style={{ gap: 'var(--space-between)' }}>
            <button 
              onClick={handleSaveDraft}
              className="flex items-center rounded transition-colors hover:bg-[var(--brand-surface)]"
              style={{
                padding: '16px 24px',
                backgroundColor: 'var(--surface-card)',
                border: '2px solid var(--brand-primary)',
                color: 'var(--brand-primary)',
                fontSize: 'var(--type-body)',
                fontWeight: 600,
                borderRadius: 'var(--radius-button)',
                height: 'var(--button-height)',
                gap: '8px'
              }}
            >
              <Save size={20} />
              <span>Lưu nháp</span>
            </button>
            <button 
              onClick={handleCalculateInvoice}
              className="flex items-center rounded transition-colors"
              style={{
                padding: '16px 24px',
                backgroundColor: 'var(--brand-primary)',
                border: 'none',
                color: 'var(--text-on-color)',
                fontSize: 'var(--type-body)',
                fontWeight: 600,
                borderRadius: 'var(--radius-button)',
                height: 'var(--button-height)',
                gap: '8px'
              }}
            >
              <Calculator size={20} />
              <span>Tính toán hóa đơn</span>
            </button>
          </div>
        </div>
        
        {/* Table */}
        <div className="rounded" style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-card)' }}>
          <div style={{ borderBottom: '1px solid var(--surface-border)', padding: 'var(--space-card)' }}>
            <h2 style={{ fontSize: 'var(--type-section-title)', color: 'var(--text-primary)', fontWeight: 600 }}>
              Nhập chỉ số Điện/Nước - {selectedBuilding}, {selectedFloor}, {selectedMonth}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--surface-bg)', borderBottom: '1px solid var(--surface-border)' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Phòng</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Số điện cũ (kWh)</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Số điện mới</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Tiêu thụ</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Số nước cũ (m³)</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Số nước mới</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Tiêu thụ</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>Ảnh đồng hồ</th>
                </tr>
              </thead>
              <tbody>
                {utilityData.map((row, index) => {
                  const electricUsage = calculateUsage(row.oldElectric, row.newElectric);
                  const waterUsage = calculateUsage(row.oldWater, row.newWater);
                  const electricAbnormal = isAbnormal(row.oldElectric, row.newElectric, 'electric');
                  const waterAbnormal = isAbnormal(row.oldWater, row.newWater, 'water');
                  
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid var(--surface-border)' }} className="hover:bg-[var(--surface-bg)] transition-colors">
                      <td style={{ padding: '12px 16px', fontSize: 'var(--type-body)', color: 'var(--text-primary)', fontWeight: 700 }}>{row.room}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input 
                          type="text" 
                          value={row.oldElectric}
                          disabled
                          className="focus:outline-none"
                          style={{
                            width: '80px',
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: 'var(--type-body)',
                            backgroundColor: 'var(--surface-bg)',
                            border: '1px solid var(--surface-border)',
                            borderRadius: 'var(--radius-button)',
                            color: 'var(--text-secondary)'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          placeholder="Nhập..."
                          value={row.newElectric}
                          onChange={(e) => handleInputChange(index, 'newElectric', e.target.value)}
                          className="focus:outline-none"
                          style={{
                            width: '80px',
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: 'var(--type-body)',
                            border: '1px solid var(--surface-border)',
                            borderRadius: 'var(--radius-button)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 'var(--type-body)',
                          fontWeight: 700,
                          color: electricAbnormal ? 'var(--error)' : electricUsage !== '-' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                        }}>
                          {electricUsage}
                          {electricAbnormal && <AlertTriangle size={16} className="inline ml-1" />}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input 
                          type="text" 
                          value={row.oldWater}
                          disabled
                          className="focus:outline-none"
                          style={{
                            width: '80px',
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: 'var(--type-body)',
                            backgroundColor: 'var(--surface-bg)',
                            border: '1px solid var(--surface-border)',
                            borderRadius: 'var(--radius-button)',
                            color: 'var(--text-secondary)'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          placeholder="Nhập..."
                          value={row.newWater}
                          onChange={(e) => handleInputChange(index, 'newWater', e.target.value)}
                          className="focus:outline-none"
                          style={{
                            width: '80px',
                            padding: '8px',
                            textAlign: 'center',
                            fontSize: 'var(--type-body)',
                            border: '1px solid var(--surface-border)',
                            borderRadius: 'var(--radius-button)',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 'var(--type-body)',
                          fontWeight: 700,
                          color: waterAbnormal ? 'var(--error)' : waterUsage !== '-' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                        }}>
                          {waterUsage}
                          {waterAbnormal && <AlertTriangle size={16} className="inline ml-1" />}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleUploadImage(row.room)}
                          className="p-2 rounded hover:bg-[var(--brand-surface)] transition-colors"
                          style={{ backgroundColor: row.image ? 'var(--success)' : 'transparent', opacity: row.image ? 0.2 : 1 }}
                          title={row.image ? 'Đã có ảnh' : 'Upload ảnh'}
                        >
                          {row.image ? (
                            <ImageIcon size={20} style={{ color: 'var(--success)' }} />
                          ) : (
                            <Upload size={20} style={{ color: 'var(--text-secondary)' }} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-300 rounded p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Hướng dẫn:</strong> Cột "Tiêu thụ" sẽ tự động tính khi bạn nhập "Số mới". Hệ thống chỉ cảnh báo màu đỏ <AlertTriangle size={14} className="inline" /> khi số mới nhỏ hơn số cũ (không hợp lý).
          </p>
        </div>
      </div>

      {/* Save Draft Modal */}
      {saveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Save size={20} className="text-gray-800" />
                <h3 className="text-base text-gray-800">Lưu nháp chỉ số Điện/Nước</h3>
              </div>
              <button onClick={() => setSaveModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-300 rounded p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle size={20} className="text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800 font-medium mb-2">Lưu nháp thành công!</p>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>• Kỳ: {selectedMonth}</p>
                      <p>• Vị trí: {selectedBuilding}, {selectedFloor}</p>
                      <p>• Đã nhập: {filledCount}/{totalCount} phòng</p>
                      <p>• Thời gian: {new Date().toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-300 rounded p-3">
                <p className="text-sm text-blue-800">
                  Dữ liệu đã được lưu tạm. Bạn có thể tiếp tục nhập sau hoặc chuyển sang tầng/tòa khác.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-300">
                <button 
                  onClick={() => setSaveModal(false)}
                  className="px-5 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculate Invoice Modal */}
      {calculateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[600px] max-h-[80vh] overflow-y-auto">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center space-x-3">
                <Calculator size={20} className="text-gray-800" />
                <h3 className="text-base text-gray-800">Tính toán hóa đơn tự động</h3>
              </div>
              <button onClick={() => setCalculateModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-300 rounded p-4">
                <p className="text-sm text-blue-800 font-medium mb-3">Thông tin tính toán:</p>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Kỳ thanh toán: {selectedMonth}</p>
                  <p>• Vị trí: {selectedBuilding}, {selectedFloor}</p>
                  <p>• Số phòng: {totalCount} phòng</p>
                  <p>• Đơn giá điện: 3.500 VNĐ/kWh</p>
                  <p>• Đơn giá nước: 25.000 VNĐ/m³</p>
                  <p>• Phí dịch vụ: 50.000 VNĐ/phòng/tháng</p>
                </div>
              </div>

              <div className="border border-gray-300 rounded">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-300">
                  <p className="text-sm text-gray-700 font-medium">Kết quả tính toán chi tiết:</p>
                </div>
                <div className="p-4 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-300">
                      <tr>
                        <th className="text-left py-2 text-xs text-gray-600">Phòng</th>
                        <th className="text-center py-2 text-xs text-gray-600">Điện (kWh)</th>
                        <th className="text-center py-2 text-xs text-gray-600">Nước (m³)</th>
                        <th className="text-right py-2 text-xs text-gray-600">Tổng tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utilityData.map((row, index) => {
                        const electricUsage = parseFloat(calculateUsage(row.oldElectric, row.newElectric)) || 0;
                        const waterUsage = parseFloat(calculateUsage(row.oldWater, row.newWater)) || 0;
                        const electricCost = electricUsage * 3500;
                        const waterCost = waterUsage * 25000;
                        const serviceFee = 50000;
                        const total = electricCost + waterCost + serviceFee;
                        
                        return (
                          <tr key={index} className="border-b border-gray-200">
                            <td className="py-2 text-gray-800">{row.room}</td>
                            <td className="py-2 text-center text-gray-700">{electricUsage.toFixed(0)}</td>
                            <td className="py-2 text-center text-gray-700">{waterUsage.toFixed(1)}</td>
                            <td className="py-2 text-right text-gray-900 font-medium">
                              {new Intl.NumberFormat('vi-VN').format(total)} đ
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-300 rounded p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-800 font-bold">Tổng cộng {totalCount} hóa đơn:</p>
                  <p className="text-lg text-green-900 font-bold">
                    {new Intl.NumberFormat('vi-VN').format(
                      utilityData.reduce((sum, row) => {
                        const eUsage = parseFloat(calculateUsage(row.oldElectric, row.newElectric)) || 0;
                        const wUsage = parseFloat(calculateUsage(row.oldWater, row.newWater)) || 0;
                        return sum + (eUsage * 3500) + (wUsage * 25000) + 50000;
                      }, 0)
                    )} VNĐ
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Lưu ý:</strong> Sau khi xác nhận, hệ thống sẽ tự động tạo {totalCount} hóa đơn ở trạng thái "Nháp". Bạn có thể xem lại và phê duyệt ở màn hình "Danh sách Hóa đơn".
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-300">
                <button 
                  onClick={() => setCalculateModal(false)}
                  className="px-5 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => {
                    // Create invoices for all utility data
                    utilityData.forEach((row) => {
                      const electricUsage = parseFloat(calculateUsage(row.oldElectric, row.newElectric)) || 0;
                      const waterUsage = parseFloat(calculateUsage(row.oldWater, row.newWater)) || 0;
                      const electricCost = electricUsage * 3500;
                      const waterCost = waterUsage * 25000;
                      const serviceFee = 50000;
                      const total = electricCost + waterCost + serviceFee;
                      
                      const tenant = tenantMapping[row.room] || 'Cư dân';
                      
                      addInvoice({
                        room: row.room,
                        tenant: tenant,
                        period: selectedMonth.replace('Tháng ', ''),
                        amount: new Intl.NumberFormat('vi-VN').format(total),
                        status: 'draft',
                        dueDate: '28/02/2026',
                        items: [
                          { name: 'Phí điện', quantity: electricUsage, unit: 'kWh', price: 3500, total: electricCost },
                          { name: 'Phí nước', quantity: waterUsage, unit: 'm³', price: 25000, total: waterCost },
                          { name: 'Phí dịch vụ', quantity: 1, unit: 'tháng', price: serviceFee, total: serviceFee },
                        ],
                      });
                    });
                    
                    alert(`✅ Đã tạo thành công ${totalCount} hóa đơn ở trạng thái \"Nháp\"!\n\nBạn có thể xem và phê duyệt các hóa đơn tại màn hình \"Quản lý Hóa đơn\".`);
                    setCalculateModal(false);
                    
                    // Reset utility data for next month
                    setUtilityData(initialData);
                  }}
                  className="px-5 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2"
                >
                  <CheckCircle size={16} />
                  <span>Xác nhận tạo hóa đơn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Image Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Upload size={20} className="text-gray-800" />
                <h3 className="text-base text-gray-800">Upload ảnh đồng hồ - Phòng {uploadingRoom}</h3>
              </div>
              <button onClick={() => setUploadModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">Kéo thả ảnh vào đây hoặc click để chọn</p>
                <input type="file" accept="image/*" className="hidden" id="fileInput" />
                <label 
                  htmlFor="fileInput"
                  className="inline-block px-4 py-2 bg-white border border-gray-800 text-gray-800 text-sm rounded hover:bg-gray-50 cursor-pointer"
                >
                  Chọn ảnh từ máy
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-300">
                <button 
                  onClick={() => setUploadModal(false)}
                  className="px-5 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmUpload}
                  className="px-5 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 flex items-center space-x-2"
                >
                  <CheckCircle size={16} />
                  <span>Xác nhận upload</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}