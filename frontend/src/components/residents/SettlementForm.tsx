import { Search, Calculator, CheckCircle, Plus, Eye, Loader2, AlertTriangle, X, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { tatToanService, contractService, invoiceService } from '../../services/api.service';
import { formatDisplayDate, formatLocalDateInput } from '../../lib/date-utils';
import { searchIncludes } from '../../lib/search';
import { MoneyInput } from '../ui/MoneyInput';
import { DateTextInput } from '../ui/DateTextInput';

function parseAmount(input: string): number {
  const normalized = input.replace(/[^0-9.-]/g, '');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function formatAmount(input: string): string {
  const value = parseAmount(input);
  return value.toLocaleString('vi-VN');
}

function getContractStatus(contract: any): string {
  return (contract?.status || '').toString().toLowerCase();
}

function isActiveContract(contract: any): boolean {
  const s = getContractStatus(contract);
  if (!s) return true;
  return s.includes('active') || s.includes('đang') || s.includes('hieu') || s.includes('hiệu');
}

function getMainResidentName(contract: any): string {
  const residents: any[] = Array.isArray(contract?.residents) ? contract.residents : [];
  const head = residents.find((r: any) => r.residencyRole === 'Người thuê chính')
    || residents.find((r: any) => r.residencyRole === 'Người thuê')
    || residents[0];
  return head?.fullName || head?.hoTen || contract?.tenantName || contract?.tenCuDan || '-';
}



export function SettlementForm() {
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view');

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Tabs */}
      <div className="product-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('view')}
          className={activeTab === 'view' ? 'is-active' : ''}
        >
          <Eye size={16} />
          <span>Xem hồ sơ tất toán</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={activeTab === 'create' ? 'is-active' : ''}
        >
          <Plus size={16} />
          <span>Tạo hồ sơ tất toán</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'view' ? (
        <ViewSettlementsTab />
      ) : (
        <CreateSettlementTab onCreated={() => setActiveTab('view')} />
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
  const [selectedSettlement, setSelectedSettlement] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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
    return (
      searchIncludes(s.id, searchTerm) ||
      searchIncludes(s.roomNumber, searchTerm) ||
      searchIncludes(s.residentName, searchTerm)
    );
  });

  const openSettlementDetail = async (settlementId: number) => {
    try {
      setLoadingDetail(true);
      const detail = await tatToanService.getById(settlementId);
      setSelectedSettlement(detail);
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết hồ sơ tất toán');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Search Bar */}
      <div className="bg-white border-2 border-gray-300 rounded p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo mã tất toán, phòng hoặc tên cư dân..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:border-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition-colors"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Settlements List */}
      <div className="bg-white border-2 border-gray-300 rounded overflow-hidden flex-1">
        <div className="border-b border-gray-300 px-6 py-4 bg-gray-50">
          <h2 className="table-section-title">Danh sách hồ sơ tất toán ({filtered.length})</h2>
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
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Mã TS</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Ngày tất toán</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Phòng</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Cư dân đại diện</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Tiền hoàn cọc</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Khấu trừ</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Tổng tất toán</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Trạng thái</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const { label, cls } = statusLabel(s.status);
                return (
                  <tr
                    key={s.id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50"
                    onClick={() => openSettlementDetail(Number(s.id))}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">TS-{String(s.id).padStart(3, '0')}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDisplayDate(s.settlementDate, '-')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{s.roomNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{s.residentName || '-'}</td>
                    <td className="px-6 py-4 text-sm text-green-600 text-right">
                      {s.depositRefund != null ? `+${Number(s.depositRefund).toLocaleString('vi-VN')}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 text-right">
                      {s.deductions != null ? `-${Number(s.deductions).toLocaleString('vi-VN')}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {s.totalSettlement != null ? Number(s.totalSettlement).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="px-6 py-4 text-center" onClick={(event) => event.stopPropagation()}>
                      <span className={`inline-block px-3 py-1 rounded border text-xs ${cls}`}>{label}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openSettlementDetail(Number(s.id))}
                        className="product-action-icon"
                        title="Xem chi tiết"
                        aria-label={`Xem chi tiết hồ sơ TS-${String(s.id).padStart(3, '0')}`}
                      >
                        <Eye size={16} />
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

      {(loadingDetail || selectedSettlement) && (
        <SettlementDetailModal
          settlement={selectedSettlement}
          loading={loadingDetail}
          onClose={() => {
            setLoadingDetail(false);
            setSelectedSettlement(null);
          }}
        />
      )}
    </div>
  );
}

function SettlementDetailModal({ settlement, loading, onClose }: { settlement: any; loading: boolean; onClose: () => void }) {
  const details: any[] = Array.isArray(settlement?.details) ? settlement.details : [];

  return (
    <div className="admin-content-modal-overlay">
      <div className="w-full max-w-3xl bg-white rounded border-2 border-gray-300 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText size={18} className="text-gray-700" />
            <h3 className="text-lg text-gray-900">Chi tiết hồ sơ tất toán</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-600">
              <Loader2 size={22} className="animate-spin mr-2" />
              Đang tải chi tiết...
            </div>
          ) : !settlement ? (
            <div className="py-10 text-center text-gray-500">Không có dữ liệu hồ sơ</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 border border-gray-300 rounded p-3">
                  <p className="text-gray-500">Mã hồ sơ</p>
                  <p className="text-gray-900 font-medium">TS-{String(settlement.id).padStart(3, '0')}</p>
                </div>
                <div className="bg-gray-50 border border-gray-300 rounded p-3">
                  <p className="text-gray-500">Trạng thái</p>
                  <p className="text-gray-900 font-medium">{settlement.status || 'Pending'}</p>
                </div>
                <div className="bg-gray-50 border border-gray-300 rounded p-3">
                  <p className="text-gray-500">Phòng</p>
                  <p className="text-gray-900 font-medium">{settlement.roomNumber || '-'}</p>
                </div>
                <div className="bg-gray-50 border border-gray-300 rounded p-3">
                  <p className="text-gray-500">Cư dân</p>
                  <p className="text-gray-900 font-medium">{settlement.residentName || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-gray-600">Hoàn cọc</p>
                  <p className="text-green-700 font-semibold">+{Number(settlement.depositRefund || 0).toLocaleString('vi-VN')} VNĐ</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-gray-600">Công nợ + Khấu trừ</p>
                  <p className="text-red-700 font-semibold">-{(Number(settlement.outstandingDebt || 0) + Number(settlement.deductions || 0)).toLocaleString('vi-VN')} VNĐ</p>
                </div>
              </div>

              <div className="bg-white border border-gray-300 rounded">
                <div className="px-4 py-3 border-b border-gray-300 bg-gray-50 text-sm text-gray-700">Chi tiết các khoản</div>
                {details.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-500">Không có chi tiết khoản mục</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {details.map((d: any) => (
                      <div key={d.id} className="px-4 py-3 text-sm flex items-center justify-between">
                        <div>
                          <p className="text-gray-900">{d.description || d.type || 'Khoản mục'}</p>
                          <p className="text-xs text-gray-500">Loại: {d.type || '-'}</p>
                        </div>
                        <p className="text-gray-900 font-medium">{Number(d.amount || 0).toLocaleString('vi-VN')} VNĐ</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded p-4 text-right">
                <p className="text-sm text-gray-700">Tổng tất toán</p>
                <p className="text-2xl text-gray-900 font-semibold">{Number(settlement.totalSettlement || 0).toLocaleString('vi-VN')} VNĐ</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Component for creating new settlement
function CreateSettlementTab({ onCreated }: { onCreated: () => void }) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [contractQuery, setContractQuery] = useState('');
  const [selectedContractId, setSelectedContractId] = useState('');
  const [settlementDate, setSettlementDate] = useState(() => formatLocalDateInput());
  const [depositRefundInput, setDepositRefundInput] = useState('0');
  const [currentDebt, setCurrentDebt] = useState(0);
  const [loadingDebt, setLoadingDebt] = useState(false);
  const [compensationInput, setCompensationInput] = useState('0');
  const [deductionsInput, setDeductionsInput] = useState('0');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const [contractsData, settlementsData] = await Promise.all([
        contractService.getAll(),
        tatToanService.getAll(),
      ]);
      setContracts(Array.isArray(contractsData) ? contractsData : []);
      setSettlements(Array.isArray(settlementsData) ? settlementsData : []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu hợp đồng/tất toán');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const settledContractIds = new Set<number>(
    settlements.map((s: any) => Number(s.residencyId)).filter((id: number) => Number.isFinite(id))
  );

  const eligibleContracts = contracts
    .filter((c: any) => isActiveContract(c) && !settledContractIds.has(Number(c.id)))
    .filter((c: any) => {
      return (
        searchIncludes(c.contractCode || c.maHopDong, contractQuery) ||
        searchIncludes(c.roomNumber || c.soPhong, contractQuery) ||
        searchIncludes(getMainResidentName(c), contractQuery)
      );
    });

  const selectedContract = eligibleContracts.find((c: any) => String(c.id) === selectedContractId)
    || contracts.find((c: any) => String(c.id) === selectedContractId)
    || null;

  useEffect(() => {
    if (!selectedContract) {
      setDepositRefundInput('0');
      setCurrentDebt(0);
      return;
    }

    const defaultDeposit = Number(selectedContract.depositAmount ?? selectedContract.deposit ?? 0);
    setDepositRefundInput(String(defaultDeposit));
    setCurrentDebt(0);

    const loadCurrentDebt = async () => {
      try {
        setLoadingDebt(true);
        const debtSummary = await invoiceService.getOutstandingDebtByContract(Number(selectedContract.id));
        setCurrentDebt(Number(debtSummary.outstandingDebt ?? 0));
      } catch {
        setCurrentDebt(0);
      } finally {
        setLoadingDebt(false);
      }
    };

    loadCurrentDebt();
  }, [selectedContractId]);

  const depositRefund = parseAmount(depositRefundInput);
  const outstandingDebt = currentDebt;
  const compensation = parseAmount(compensationInput);
  const deductions = parseAmount(deductionsInput);
  const totalSettlement = depositRefund - outstandingDebt + compensation - deductions;

  const handleCreate = async () => {
    if (!selectedContract) {
      setError('Vui lòng chọn hợp đồng cần tất toán');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const details: any[] = [];
      if (depositRefund > 0) details.push({ description: 'Hoàn tiền cọc', amount: depositRefund, type: 'DepositRefund' });
      if (outstandingDebt > 0) details.push({ description: 'Công nợ hiện tại', amount: outstandingDebt, type: 'OutstandingDebt' });
      if (compensation > 0) details.push({ description: 'Bồi thường', amount: compensation, type: 'Compensation' });
      if (deductions > 0) details.push({ description: notes || 'Khấu trừ khác', amount: deductions, type: 'Deduction' });

      await tatToanService.create({
        residencyId: Number(selectedContract.id),
        settlementDate,
        depositRefund,
        outstandingDebt,
        compensation,
        deductions,
        status: 'Completed',
        details,
      });

      setSuccess('Đã tạo hồ sơ tất toán thành công');
      setSelectedContractId('');
      setContractQuery('');
      setDepositRefundInput('0');
      setCurrentDebt(0);
      setCompensationInput('0');
      setDeductionsInput('0');
      setNotes('');
      await loadData();
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Không thể tạo hồ sơ tất toán');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 h-full">
      {/* Search Contract */}
      <div className="bg-white border-2 border-gray-300 rounded p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Tìm theo mã hợp đồng, số phòng hoặc cư dân đại diện..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:border-gray-500"
              value={contractQuery}
              onChange={(e) => setContractQuery(e.target.value)}
            />
          </div>
          <select
            className="min-w-[360px] px-3 py-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:border-gray-500"
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
            disabled={loadingData}
          >
            <option value="">Chọn hợp đồng</option>
            {eligibleContracts.map((c: any) => (
              <option key={c.id} value={c.id}>
                {(c.contractCode || c.maHopDong || `HD-${c.id}`)} - {(c.roomNumber || c.soPhong || '-')} - {getMainResidentName(c)}
              </option>
            ))}
          </select>
        </div>
        {loadingData && <p className="mt-2 text-xs text-gray-500">Đang tải hợp đồng...</p>}
        {!loadingData && eligibleContracts.length === 0 && (
          <p className="mt-2 text-xs text-orange-600">Không còn hợp đồng đang hiệu lực nào chưa có hồ sơ tất toán.</p>
        )}
      </div>

      {(error || success) && (
        <div className={`border rounded p-3 text-sm ${error ? 'bg-red-50 border-red-300 text-red-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
          {error || success}
        </div>
      )}

      {/* Main Content - 2 Columns */}
      <div className="grid grid-cols-2 gap-6 flex-1">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Contract Info */}
          <div className="bg-white border-2 border-gray-300 rounded">
            <div className="border-b border-gray-300 px-6 py-4 bg-gray-50">
              <h2 className="text-lg text-gray-800">Thông tin hợp đồng</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Mã HĐ</p>
                <p className="text-gray-900">{selectedContract?.contractCode || selectedContract?.maHopDong || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Phòng</p>
                <p className="text-gray-900">{selectedContract?.roomNumber || selectedContract?.soPhong || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Cư dân đại diện</p>
                <p className="text-gray-900">{selectedContract ? getMainResidentName(selectedContract) : '-'}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Ngày trả phòng</p>
                <DateTextInput
                  value={settlementDate}
                  onChange={setSettlementDate}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Deposit */}
          <div className="bg-white border-2 border-gray-300 rounded">
            <div className="border-b border-gray-300 px-6 py-4 bg-gray-50">
              <h3 className="text-lg text-gray-800">1. Tiền cọc gốc</h3>
            </div>
            <div className="p-6">
              <MoneyInput value={depositRefundInput} onChange={setDepositRefundInput} defaultScale="million" />
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-white border-2 border-gray-300 rounded">
            <div className="border-b border-gray-300 px-6 py-4 bg-gray-50">
              <h3 className="text-lg text-gray-800">2. Các khoản khấu trừ</h3>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-gray-700">Công nợ hiện tại</p>
                    <p className="text-sm text-gray-500">Lấy tự động từ hóa đơn chưa thanh toán và thanh toán một phần.</p>
                  </div>
                  <div className="min-w-40 text-right">
                    <p className="text-sm font-medium text-red-700">
                      {loadingDebt ? 'Đang tải...' : formatAmount(String(outstandingDebt))}
                    </p>
                    <p className="text-sm text-gray-500">VNĐ</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-700">Khấu trừ khác</p>
                  <MoneyInput value={deductionsInput} onChange={setDeductionsInput} defaultScale="thousand" compact className="w-48" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-700">Bồi thường cộng thêm</p>
                  <MoneyInput value={compensationInput} onChange={setCompensationInput} defaultScale="thousand" compact className="w-48" />
                </div>
              </div>

              <div className="border-t-2 border-gray-300 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-gray-800">Tổng khấu trừ:</p>
                  <p className="text-lg text-red-600">-{(outstandingDebt + deductions).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Final Amount */}
          <div className="bg-white border-2 border-gray-300 rounded">
            <div className="border-b border-gray-300 px-6 py-4 bg-gray-50">
              <h3 className="text-lg text-gray-800 flex items-center">
                <Calculator size={16} className="mr-2" />
                3. Tổng kết tất toán
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-300 text-sm">
                <p className="text-gray-700">Tiền cọc gốc:</p>
                <p className="text-gray-900">+{depositRefund.toLocaleString('vi-VN')}</p>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-300 text-sm">
                <p className="text-gray-700">Tổng khấu trừ:</p>
                <p className="text-red-600">-{(outstandingDebt + deductions).toLocaleString('vi-VN')}</p>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-300 text-sm">
                <p className="text-gray-700">Bồi thường cộng thêm:</p>
                <p className="text-blue-600">+{compensation.toLocaleString('vi-VN')}</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-base text-gray-800">Số tiền hoàn trả:</p>
                <p className={`text-2xl font-semibold ${totalSettlement >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalSettlement.toLocaleString('vi-VN')}</p>
              </div>
              <p className="text-xs text-gray-600 text-right">VNĐ</p>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border-2 border-gray-300 rounded">
            <div className="border-b border-gray-300 px-6 py-4 bg-gray-50">
              <h3 className="text-lg text-gray-800">Ghi chú tất toán</h3>
            </div>
            <div className="p-6">
              <textarea 
                className="w-full h-24 p-3 border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
                placeholder="Nhập ghi chú về quá trình tất toán..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleCreate}
            disabled={!selectedContract || submitting}
            className="w-full px-4 py-3 bg-gray-800 text-white text-sm rounded flex items-center justify-center space-x-2 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle size={18} />
            <span>{submitting ? 'Đang tạo hồ sơ...' : 'Xác nhận tất toán'}</span>
          </button>

        </div>
      </div>
    </div>
  );
}
