import { Search, Calculator, CheckCircle, Plus, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { tatToanService } from '../../services/api.service';

const settlementData = {
  contract: {
    code: 'HD-2025-089',
    room: 'C-312',
    tenant: 'Lê Văn C',
    startDate: '01/03/2025',
    endDate: '28/02/2026',
    actualEndDate: '05/02/2026',
  },
  deposit: {
    amount: 10000000,
  },
  deductions: {
    proRata: {
      days: 5,
      amount: 1666667,
      calculation: '(10.000.000 ÷ 30) × 5 ngày'
    },
    utilities: [
      { name: 'Tiền điện', amount: 350000 },
      { name: 'Tiền nước', amount: 120000 },
      { name: 'Phí quản lý', amount: 500000 },
    ],
  }
};

const totalDeductions = 
  settlementData.deductions.proRata.amount +
  settlementData.deductions.utilities.reduce((sum, item) => sum + item.amount, 0);

const finalAmount = settlementData.deposit.amount - totalDeductions;



export function SettlementForm() {
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view');

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab('view')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-base transition-colors ${
            activeTab === 'view'
              ? 'bg-[var(--brand-primary)] text-white'
              : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          style={{ height: 'var(--btn-height)' }}
        >
          <Eye size={20} />
          <span>Xem hồ sơ tất toán</span>
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-base transition-colors ${
            activeTab === 'create'
              ? 'bg-[var(--brand-primary)] text-white'
              : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          style={{ height: 'var(--btn-height)' }}
        >
          <Plus size={20} />
          <span>Tạo hồ sơ tất toán</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'view' ? (
        <ViewSettlementsTab />
      ) : (
        <CreateSettlementTab />
      )}
    </div>
  );
}

// Component for viewing settlements
function ViewSettlementsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tatToanService.getAll();
      setSettlements(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách tất toán');
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (status: string) => {
    if (!status) return { label: 'Chờ xử lý', cls: 'bg-yellow-100 text-yellow-800' };
    const s = status.toLowerCase();
    if (s === 'completed') return { label: 'Đã hoàn tiền', cls: 'bg-green-100 text-green-800' };
    if (s === 'cancelled') return { label: 'Đã hủy', cls: 'bg-red-100 text-red-800' };
    return { label: 'Chờ hoàn tiền', cls: 'bg-yellow-100 text-yellow-800' };
  };

  const filtered = settlements.filter(s => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      String(s.id).includes(q) ||
      (s.roomNumber || '').toLowerCase().includes(q) ||
      (s.residentName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col space-y-4">
      {/* Search Bar */}
      <div className="bg-white border-2 border-gray-300 rounded-2xl p-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm theo mã tất toán, phòng hoặc tên cư dân..."
              className="w-full pl-12 pr-4 border border-gray-300 rounded-lg bg-white text-base focus:outline-none focus:border-[var(--brand-primary)]"
              style={{ height: 'var(--input-height)' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="px-6 bg-gray-800 text-white text-base rounded-lg hover:bg-gray-700 transition-colors"
            style={{ height: 'var(--btn-height)' }}
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Settlements List */}
      <div className="bg-white border-2 border-gray-300 rounded-2xl overflow-hidden flex-1">
        <div className="border-b-2 border-gray-300 px-6 py-4 bg-gray-50">
          <h2 className="text-lg text-gray-800">Danh sách hồ sơ tất toán ({filtered.length})</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-gray-400 mr-3" />
            <span className="text-gray-600">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-red-500">
            <AlertTriangle size={24} className="mr-2" />
            <span>{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-base">Không có hồ sơ tất toán nào</span>
          </div>
        ) : (
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
          <table className="w-full">
            <thead className="bg-gray-100 sticky top-0">
              <tr className="border-b border-gray-300">
                <th className="px-6 py-4 text-left text-base text-gray-700">Mã TS</th>
                <th className="px-6 py-4 text-left text-base text-gray-700">Ngày tất toán</th>
                <th className="px-6 py-4 text-left text-base text-gray-700">Phòng</th>
                <th className="px-6 py-4 text-left text-base text-gray-700">Chủ hộ</th>
                <th className="px-6 py-4 text-right text-base text-gray-700">Tiền hoàn cọc</th>
                <th className="px-6 py-4 text-right text-base text-gray-700">Khấu trừ</th>
                <th className="px-6 py-4 text-right text-base text-gray-700">Tổng tất toán</th>
                <th className="px-6 py-4 text-center text-base text-gray-700">Trạng thái</th>
                <th className="px-6 py-4 text-center text-base text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const { label, cls } = statusLabel(s.status);
                return (
                  <tr key={s.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-base text-gray-900 font-medium">TS-{String(s.id).padStart(3, '0')}</td>
                    <td className="px-6 py-4 text-base text-gray-700">
                      {s.settlementDate ? new Date(s.settlementDate).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-700">{s.roomNumber || '-'}</td>
                    <td className="px-6 py-4 text-base text-gray-700">{s.residentName || '-'}</td>
                    <td className="px-6 py-4 text-base text-green-600 text-right">
                      {s.depositRefund != null ? `+${Number(s.depositRefund).toLocaleString('vi-VN')}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-base text-red-600 text-right">
                      {s.deductions != null ? `-${Number(s.deductions).toLocaleString('vi-VN')}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-base text-gray-900 text-right font-medium">
                      {s.totalSettlement != null ? Number(s.totalSettlement).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${cls}`}>{label}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="px-4 py-2 bg-[var(--brand-primary)] text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}

// Component for creating new settlement
function CreateSettlementTab() {
  return (
    <div className="flex flex-col space-y-4 h-full">
      {/* Search Contract */}
      <div className="bg-white border-2 border-gray-300 rounded p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Tìm theo mã hợp đồng hoặc số phòng..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:border-gray-500"
              defaultValue="HD-2025-089"
            />
          </div>
          <button className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Main Content - 2 Columns */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Contract Info */}
          <div className="bg-white border-2 border-gray-300 rounded">
            <div className="border-b border-gray-300 px-4 py-2 bg-gray-50">
              <h2 className="text-sm text-gray-800">Thông tin hợp đồng</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-600 mb-1">Mã HĐ</p>
                <p className="text-gray-900">{settlementData.contract.code}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Phòng</p>
                <p className="text-gray-900">{settlementData.contract.room}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Chủ hộ</p>
                <p className="text-gray-900">{settlementData.contract.tenant}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Ngày trả phòng</p>
                <p className="text-red-600">{settlementData.contract.actualEndDate}</p>
              </div>
            </div>
          </div>

          {/* Deposit */}
          <div className="bg-white border-2 border-gray-300 rounded">
            <div className="border-b border-gray-300 px-4 py-2 bg-green-50">
              <h3 className="text-sm text-gray-800">1. Tiền cọc gốc</h3>
            </div>
            <div className="p-4">
              <p className="text-2xl text-gray-900">{settlementData.deposit.amount.toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-1">VNĐ</p>
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-white border-2 border-gray-300 rounded">
            <div className="border-b border-gray-300 px-4 py-2 bg-red-50">
              <h3 className="text-sm text-gray-800">2. Các khoản khấu trừ</h3>
            </div>
            <div className="p-4 space-y-3 text-xs">
              {/* Pro-rata */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-700">Tiền phòng lẻ ({settlementData.deductions.proRata.days} ngày)</p>
                  <p className="text-gray-900">-{settlementData.deductions.proRata.amount.toLocaleString()}</p>
                </div>
                <p className="text-gray-500 mt-1">{settlementData.deductions.proRata.calculation}</p>
              </div>

              <div className="border-t border-gray-200 pt-2">
                <p className="text-gray-700 mb-2">Dịch vụ chưa thanh toán:</p>
                {settlementData.deductions.utilities.map((item, index) => (
                  <div key={index} className="flex items-center justify-between mb-1">
                    <p className="text-gray-600">• {item.name}</p>
                    <p className="text-gray-900">-{item.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-gray-300 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-gray-800">Tổng khấu trừ:</p>
                  <p className="text-lg text-red-600">-{totalDeductions.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Final Amount */}
          <div className="bg-white border-2 border-gray-800 rounded">
            <div className="border-b border-gray-800 px-4 py-2 bg-gray-800">
              <h3 className="text-sm text-white flex items-center">
                <Calculator size={16} className="mr-2" />
                3. Tổng kết tất toán
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-300 text-sm">
                <p className="text-gray-700">Tiền cọc gốc:</p>
                <p className="text-gray-900">+{settlementData.deposit.amount.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-300 text-sm">
                <p className="text-gray-700">Tổng khấu trừ:</p>
                <p className="text-red-600">-{totalDeductions.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-base text-gray-800">Số tiền hoàn trả:</p>
                <p className="text-3xl text-green-600">{finalAmount.toLocaleString()}</p>
              </div>
              <p className="text-xs text-gray-600 text-right">VNĐ</p>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border-2 border-gray-300 rounded">
            <div className="border-b border-gray-300 px-4 py-2">
              <h3 className="text-sm text-gray-800">Ghi chú tất toán</h3>
            </div>
            <div className="p-4">
              <textarea 
                className="w-full h-24 p-2 border border-gray-300 rounded text-xs focus:outline-none focus:border-gray-500"
                placeholder="Nhập ghi chú về quá trình tất toán..."
              ></textarea>
            </div>
          </div>

          {/* Action Button */}
          <button className="w-full px-4 py-3 bg-gray-800 text-white text-sm rounded flex items-center justify-center space-x-2 hover:bg-gray-700">
            <CheckCircle size={18} />
            <span>Xác nhận tất toán</span>
          </button>

          {/* Warning */}
          <div className="bg-red-50 border border-red-300 rounded p-3">
            <p className="text-xs text-red-800">
              <strong>⚠️ Sau khi xác nhận:</strong> Hợp đồng → Thanh lý | Phòng → Trống | Tài khoản → Đóng
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}