import { Filter, Monitor, Smartphone } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { auditLogService, AuditLog } from '../../services/api.service';

interface AuditLogRow {
  time: string;
  account: string;
  fullName: string;
  action: string;
  details: string;
  ip: string;
  device: string;
  accountType: string;
}

const actionLabelMap: Record<string, string> = {
  'CREATE': 'Tạo mới',
  'UPDATE': 'Cập nhật',
  'DELETE': 'Xoá',
  'LOGIN': 'Đăng nhập',
  'LOGOUT': 'Đăng xuất',
};

const mapAuditLog = (log: AuditLog): AuditLogRow => {
  const date = new Date(log.createdAt);
  const time = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const actionLabel = actionLabelMap[log.action] || log.action;
  return {
    time,
    account: log.username || (log.userId ? `user-${log.userId}` : '—'),
    fullName: log.fullName || '',
    action: actionLabel,
    details: log.details || (log.entityType ? `${log.entityType}${log.entityId ? ` #${log.entityId}` : ''}` : ''),
    ip: log.ipAddress || '—',
    device: log.userAgent || 'Web Browser',
    accountType: log.userRole === 'Admin' || log.userRole === 'QuanLy' || log.userRole === 'KeToan' ? 'admin' : 'resident',
  };
};

const actionColors: Record<string, string> = {
  'Đăng nhập': 'text-green-700',
  'Đăng xuất': 'text-gray-700',
  'Tạo mới': 'text-blue-700',
  'Cập nhật': 'text-blue-700',
  'Xoá': 'text-red-700',
  'Sửa hóa đơn': 'text-blue-700',
  'Sửa hợp đồng': 'text-blue-700',
  'Xóa hợp đồng': 'text-red-700',
  'Cập nhật tri thức AI': 'text-purple-700',
  'Khóa tài khoản': 'text-orange-700',
  'Phê duyệt & Gửi hóa đơn': 'text-blue-700',
  'Xem hóa đơn': 'text-gray-700',
};

const getActionColor = (action: string) => {
  return actionColors[action] || 'text-gray-700';
};

const getDeviceIcon = (device: string) => {
  if (device.includes('Mobile App')) {
    return <Smartphone size={14} className="text-gray-600" />;
  }
  return <Monitor size={14} className="text-gray-600" />;
};

// Helper to parse date from time string
const parseDate = (timeString: string) => {
  const [datePart] = timeString.split(' ');
  const [day, month, year] = datePart.split('/');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

export function AuditLogsTable() {
  const [auditLogsData, setAuditLogsData] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchText, setSearchText] = useState('');

  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError(null);
    auditLogService.getAll(500)
      .then(data => setAuditLogsData(data.map(mapAuditLog)))
      .catch((err: any) => {
        setAuditLogsData([]);
        setError(err?.message || 'Không tải được nhật ký hoạt động');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const todayStr = new Date().toLocaleDateString('vi-VN');
  const todayLogs = auditLogsData.filter(l => l.time.startsWith(todayStr.split('/').reverse().map((p, i) => i === 0 ? p : p.padStart(2, '0')).reverse().join('/')));
  const loginCount = auditLogsData.filter(l => l.action === 'Đăng nhập').length;

  // Filter data
  const filteredLogs = auditLogsData.filter(log => {
    const accountMatch = accountFilter === 'all' || log.accountType === accountFilter;
    const actionMatch = actionFilter === 'all' || log.action === actionFilter;
    const searchMatch = searchText === '' ||
      log.account.toLowerCase().includes(searchText.toLowerCase()) ||
      log.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      log.details.toLowerCase().includes(searchText.toLowerCase());
    
    let dateMatch = true;
    if (dateFrom || dateTo) {
      const logDate = parseDate(log.time);
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        dateMatch = dateMatch && logDate >= fromDate;
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        dateMatch = dateMatch && logDate <= toDate;
      }
    }
    
    return accountMatch && actionMatch && dateMatch && searchMatch;
  });

  return (
    <div className="space-y-4">
      {/* Summary Cards - Only showing 2 cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Tổng hoạt động hôm nay</p>
          <p className="text-gray-900" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{loading ? '...' : todayLogs.length}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>hành động</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Đăng nhập</p>
          <p className="text-green-600" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{loading ? '...' : loginCount}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>lần</p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-300 rounded p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center flex-wrap gap-3">
        <div className="flex items-center space-x-3 flex-wrap gap-3">
          <Filter size={16} className="text-gray-500" />
          
          <select 
            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
            style={{ fontSize: 'var(--type-caption)' }}
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
          >
            <option value="all">Tất cả tài khoản</option>
            <option value="admin">Admin</option>
            <option value="resident">Cư dân</option>
          </select>
          
          <select 
            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
            style={{ fontSize: 'var(--type-caption)' }}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="all">Tất cả hành động</option>
            <option value="Đăng nhập">Đăng nhập</option>
            <option value="Đăng xuất">Đăng xuất</option>
            <option value="Tạo mới">Tạo mới</option>
            <option value="Cập nhật">Cập nhật</option>
            <option value="Xoá">Xoá</option>
            <option value="Sửa hóa đơn">Sửa hóa đơn</option>
            <option value="Sửa hợp đồng">Sửa hợp đồng</option>
            <option value="Xóa hợp đồng">Xóa hợp đồng</option>
            <option value="Khóa tài khoản">Khóa tài khoản</option>
            <option value="Phê duyệt &amp; Gửi hóa đơn">Phê duyệt &amp; Gửi hóa đơn</option>
            <option value="Cập nhật tri thức AI">Cập nhật tri thức AI</option>
          </select>
          
          <input 
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
            style={{ fontSize: 'var(--type-caption)' }}
          />
          
          <span className="text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>đến</span>
          
          <input 
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
            style={{ fontSize: 'var(--type-caption)' }}
          />

          <input
            type="text"
            placeholder="Tìm tài khoản, chi tiết..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500 w-48"
            style={{ fontSize: 'var(--type-caption)' }}
          />
        </div>

      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-gray-800" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Nhật ký hoạt động - {filteredLogs.length} bản ghi</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Thời gian</th>
                <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Tài khoản</th>
                <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Hành động</th>
                <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Chi tiết</th>
                <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>IP / Thiết bị</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-700" style={{ fontSize: 'var(--type-caption)' }}>{log.time}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-800" style={{ fontSize: 'var(--type-caption)' }}>{log.account}</p>
                      <p className="text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>{log.fullName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={getActionColor(log.action)} style={{ fontSize: 'var(--type-caption)' }}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700" style={{ fontSize: 'var(--type-caption)' }}>
                    {log.details}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-2">
                      {getDeviceIcon(log.device)}
                      <div>
                        <p className="text-gray-700" style={{ fontSize: 'var(--type-caption)' }}>{log.ip}</p>
                        <p className="text-gray-500" style={{ fontSize: 'var(--type-caption)' }}>{log.device}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500" style={{ fontSize: 'var(--type-body)' }}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              )}
              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500" style={{ fontSize: 'var(--type-body)' }}>
                    Không có bản ghi nào phù hợp với bộ lọc
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}