import { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquareWarning, RefreshCcw } from 'lucide-react';
import { contractService, ContractChangeTrackingItem } from '../services/api.service';
import { formatDisplayDateTime } from '../lib/date-utils';

type TrackingStatus = 'ALL' | 'PENDING' | 'DISCUSSING' | 'CONFIRMED';

const statusLabel: Record<TrackingStatus, string> = {
  ALL: 'Tất cả',
  PENDING: 'Pending',
  DISCUSSING: 'Discussing',
  CONFIRMED: 'Confirmed',
};

const statusBadgeClass: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
  DISCUSSING: 'bg-blue-100 text-blue-800 border-blue-300',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const formatDateTime = (value?: string) => {
  return formatDisplayDateTime(value, '-');
};

const formatMoney = (value?: number) => {
  const number = Number(value ?? 0);
  return `${number.toLocaleString('vi-VN')} VNĐ`;
};

export function ContractChangeTrackingPage() {
  const [items, setItems] = useState<ContractChangeTrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TrackingStatus>('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = statusFilter === 'ALL' ? undefined : statusFilter;
      const rows = await contractService.getChangeRequestTracking(status, 200);
      setItems(Array.isArray(rows) ? rows : []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách đề xuất thay đổi hợp đồng');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const summary = useMemo(() => {
    const total = items.length;
    const pending = items.filter(x => (x.status || '').toUpperCase() === 'PENDING').length;
    const discussing = items.filter(x => (x.status || '').toUpperCase() === 'DISCUSSING').length;
    const confirmed = items.filter(x => (x.status || '').toUpperCase() === 'CONFIRMED').length;
    return { total, pending, discussing, confirmed };
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="table-section-title">Đề xuất đang chờ cư dân xác nhận</h2>
            <p className="text-sm text-gray-600 mt-1">Theo dõi trạng thái đề xuất thay đổi hợp đồng: Pending, Discussing, Confirmed</p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <RefreshCcw size={16} />
            Làm mới
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">Tổng hợp đồng</p>
            <p className="text-xl font-semibold text-gray-900">{summary.total}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-700">Pending</p>
            <p className="text-xl font-semibold text-amber-800">{summary.pending}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs text-blue-700">Discussing</p>
            <p className="text-xl font-semibold text-blue-800">{summary.discussing}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs text-emerald-700">Confirmed</p>
            <p className="text-xl font-semibold text-emerald-800">{summary.confirmed}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(['ALL', 'PENDING', 'DISCUSSING', 'CONFIRMED'] as TrackingStatus[]).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full border text-sm ${statusFilter === status ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              {statusLabel[status]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center text-gray-600 gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span>Đang tải danh sách đề xuất...</span>
          </div>
        ) : error ? (
          <div className="py-10 px-6 text-center text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center text-gray-500 gap-2">
            <MessageSquareWarning size={24} />
            <p>Không có đề xuất phù hợp với bộ lọc hiện tại</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Hợp đồng</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Phòng</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Ngày đề xuất</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Ngày áp dụng</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Giá phòng</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Dịch vụ</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Phản hồi cư dân</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const normalizedStatus = (row.status || 'PENDING').toUpperCase();
                  return (
                    <tr key={`${row.contractId}-${row.notificationId}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{row.contractCode || `#${row.contractId}`}</div>
                        <div className="text-xs text-gray-500">Notification #{row.notificationId}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-800">{row.roomNumber || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${statusBadgeClass[normalizedStatus] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                          {normalizedStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatDateTime(row.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatDateTime(row.effectiveDate)}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 text-xs">Hiện tại: {formatMoney(row.currentRentPrice)}</div>
                        <div className="text-gray-900 font-medium">Đề xuất: {formatMoney(row.proposedRentPrice ?? row.currentRentPrice)}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>Đổi giá: {row.servicePriceChangeCount}</div>
                        <div>Thêm mới: {row.addedServiceCount}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs">
                        <div className="line-clamp-2">{row.residentMessage || '-'}</div>
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
