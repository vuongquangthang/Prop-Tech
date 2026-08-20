import { Filter, Lock, Unlock, Loader2, AlertTriangle, UserX, Copy, Check, Eye, Phone, Plus, UserRound, Shield, KeyRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import { contractService, userService } from '../../services/api.service';
import { FilterSelect } from '../ui/FilterSelect';
import { useAuth } from '../../contexts/AuthContext';
import { formatDisplayDateTime } from '../../lib/date-utils';
import { searchIncludes } from '../../lib/search';

interface UserData {
  id: number | string;
  residentId?: number;
  username: string;
  fullName: string;
  role: 'Admin' | 'CuDan';
  displayRole: 'Admin' | 'CuDan' | 'CuDanDaiDien';
  status: string;
  lastLogin: string;
  isLocked: boolean;
  mustChangePassword: boolean;
}

const DEFAULT_RESIDENT_TEMP_PASSWORD = '123456';

const roleColors = {
  Admin: 'bg-purple-100 text-purple-800 border-purple-300',
  CuDan: 'bg-blue-100 text-blue-800 border-blue-300',
  CuDanDaiDien: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const roleLabels = {
  Admin: 'BQL',
  CuDan: 'Cư dân',
  CuDanDaiDien: 'Cư dân đại diện',
};

function normalizeRole(rawRole: string | undefined): 'Admin' | 'CuDan' {
  const role = (rawRole || '').toLowerCase();
  if (role === 'admin') return 'Admin';
  return 'CuDan';
}

const isRepresentativeRole = (role?: string) => {
  const normalized = String(role || '').trim().toLowerCase();
  return ['người thuê chính', 'nguoi thue chinh', 'cư dân đại diện', 'cu dan dai dien', 'chủ hộ', 'chu ho', 'chủ phòng', 'chu phong', 'primary', 'owner'].includes(normalized);
};

const getRepresentativeResidentKeys = (contracts: any[]) => {
  const ids = new Set<number>();
  const phones = new Set<string>();

  contracts.forEach((contract) => {
    const residents = Array.isArray(contract?.residents) ? contract.residents : [];
    residents.forEach((resident: any) => {
      if (!isRepresentativeRole(resident?.residencyRole || resident?.vaiTroCuTru || resident?.role)) return;
      const residentId = Number(resident?.residentId ?? resident?.id);
      if (Number.isFinite(residentId) && residentId > 0) ids.add(residentId);
      const phone = String(resident?.phoneNumber || resident?.soDienThoai || '').trim();
      if (phone) phones.add(phone);
    });
  });

  return { ids, phones };
};

const statusColors = {
  active: 'bg-green-100 text-green-800 border-green-300',
  locked: 'bg-red-100 text-red-800 border-red-300',
  inactive: 'bg-gray-100 text-gray-800 border-gray-300',
};

const statusLabels = {
  active: 'Đang hoạt động',
  locked: 'Đang bị khóa',
  inactive: 'Chưa kích hoạt',
};

export function UserAccountsTable() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewUser, setViewUser] = useState<UserData | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<'all' | null>(null);
  
  // Create user modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('CuDan');
  const [newUserResidentId, setNewUserResidentId] = useState<number | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, activeContracts] = await Promise.all([
        userService.getAll(),
        contractService.getActive().catch(() => []),
      ]);
      const representativeKeys = getRepresentativeResidentKeys(Array.isArray(activeContracts) ? activeContracts : []);
      
      const userData: UserData[] = data.map((user: any) => {
        // Determine status from isLocked field
        let status = 'active';
        if (user.isLocked) {
          status = 'locked';
        } else if (!user.lastLoginAt) {
          status = 'inactive';
        }

        const residentId = Number(user.residentId || user.resident?.id || user.cuDanId || 0);
        const username = user.phoneNumber || user.username || user.tenDangNhap || '';
        const role = normalizeRole(user.role || user.vaiTro);
        const isRepresentative = role === 'CuDan'
          && (
            (Number.isFinite(residentId) && residentId > 0 && representativeKeys.ids.has(residentId))
            || representativeKeys.phones.has(String(username).trim())
          );

        return {
          id: user.id || user.userId || 0,
          residentId: Number.isFinite(residentId) && residentId > 0 ? residentId : undefined,
          username,
          fullName: user.residentName || user.fullName || user.hoTen || '',
          role,
          displayRole: isRepresentative ? 'CuDanDaiDien' : role,
          status,
          lastLogin: formatDisplayDateTime(user.lastLoginAt, 'Chưa đăng nhập'),
          isLocked: user.isLocked || false,
          mustChangePassword: !!(user.mustChangePassword || user.mustChangeMatKhau),
        };
      });

      setUsers(userData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách tài khoản');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserPhone.trim()) {
      setCreateError('Số điện thoại không được để trống');
      return;
    }
    if (!newUserPassword.trim()) {
      setCreateError('Mật khẩu không được để trống');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      if (newUserRole === 'CuDan' && !newUserResidentId) {
        setCreateError('Vui long chon cu dan cho tai khoan cu dan');
        setCreateLoading(false);
        return;
      }
      
      await userService.create({
        phoneNumber: newUserPhone.trim(),
        password: newUserPassword,
        role: newUserRole,
        residentId: newUserRole === 'CuDan' ? newUserResidentId || undefined : undefined,
      });

      // Reset form and close modal
      setNewUserPhone('');
      setNewUserPassword('');
      setNewUserRole('CuDan');
      setNewUserResidentId(null);
      setShowCreateModal(false);

      // Refresh user list
      await fetchUsers();
    } catch (err: any) {
      setCreateError(err.message || 'Không thể tạo tài khoản');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleLock = (user: any) => {
    setSelectedUser(user);
    setLockReason('');
    setShowLockModal(true);
  };

  const handleViewUser = (user: UserData) => {
    setViewUser(user);
    setCopiedField(null);
    setShowViewModal(true);
  };

  // Filter data based on selections
  const filteredUsers = users.filter(user => {
    const roleMatch = roleFilter === 'all' || user.role === roleFilter;
    const statusMatch = statusFilter === 'all' || user.status === statusFilter;
    const searchMatch =
      searchIncludes(user.fullName, searchText) ||
      searchIncludes(user.username, searchText);
    return roleMatch && statusMatch && searchMatch;
  });

  const isViewingCurrentUser = (viewUser: UserData | null) => {
    if (!viewUser || !currentUser) return false;
    return String(viewUser.id) === String(currentUser.id)
      || (!!currentUser.phoneNumber && viewUser.username === currentUser.phoneNumber);
  };

  const getPasswordStatusText = (viewUser: UserData) => {
    if (isViewingCurrentUser(viewUser)) {
      return 'Bạn đang sử dụng mật khẩu riêng';
    }
    if (viewUser.role === 'CuDan' && viewUser.mustChangePassword) {
      return 'Mật khẩu tạm còn hiệu lực';
    }
    return 'Người dùng đã tự đặt mật khẩu';
  };

  const getPasswordDisplayText = (viewUser: UserData) => {
    if (isViewingCurrentUser(viewUser)) {
      return 'Không thể xem vì lý do bảo mật';
    }
    if (viewUser.role === 'CuDan' && viewUser.mustChangePassword) {
      return DEFAULT_RESIDENT_TEMP_PASSWORD;
    }
    return 'Không thể xem mật khẩu hiện tại';
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 size={48} className="animate-spin text-gray-400" />
          <span className="text-gray-600">Đang tải danh sách tài khoản...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <AlertTriangle size={48} className="text-red-500" />
          <p className="text-red-600 text-center">{error}</p>
          <button 
            onClick={fetchUsers}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Tổng tài khoản</p>
          <p className="text-gray-900" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{users.length}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>tài khoản</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Đang hoạt động</p>
          <p className="text-green-600" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{users.filter(u => u.status === 'active').length}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>tài khoản</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Đang bị khóa</p>
          <p className="text-red-600" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{users.filter(u => u.status === 'locked').length}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>tài khoản</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Chưa kích hoạt</p>
          <p className="text-gray-600" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{users.filter(u => u.status === 'inactive').length}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>tài khoản</p>
        </div>
      </div>
      
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter size={16} className="text-gray-500" />
          
          <FilterSelect
            className="px-3 py-2 bg-white focus:outline-none"
            style={{ fontSize: 'var(--type-caption)' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="Admin">BQL</option>
            <option value="CuDan">Cư dân</option>
          </FilterSelect>
          
          <FilterSelect
            className="px-3 py-2 bg-white focus:outline-none"
            style={{ fontSize: 'var(--type-caption)' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đang bị khóa</option>
            <option value="inactive">Chưa kích hoạt</option>
          </FilterSelect>
          
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên hoặc SĐT..."
            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500 w-64"
            style={{ fontSize: 'var(--type-caption)' }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        
      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="flex items-center justify-between gap-3 border-b border-gray-300 px-6 py-4">
          <h2 className="text-[var(--primary)]" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Danh sách tài khoản - {filteredUsers.length} tài khoản</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="app-button-primary shrink-0"
          >
            <Plus size={16} />
            <span>Thêm tài khoản</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Username/SĐT</th>
                <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Họ và Tên</th>
                <th className="px-6 py-3 text-center text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Vai trò</th>
                <th className="px-6 py-3 text-center text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Trạng thái</th>
                <th className="px-6 py-3 text-left text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Đăng nhập cuối</th>
                <th className="px-6 py-3 text-center text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Khóa/Mở</th>
                <th className="px-6 py-3 text-center text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <UserX size={48} className="text-gray-300" />
                      <p className="text-gray-500">Không tìm thấy tài khoản nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50"
                    onClick={() => handleViewUser(user)}
                  >
                    <td className="px-6 py-4 text-gray-800" style={{ fontSize: 'var(--type-body)' }}>{user.username}</td>
                    <td className="px-6 py-4 text-gray-700" style={{ fontSize: 'var(--type-body)' }}>{user.fullName}</td>
                    <td className="px-6 py-4 text-center" onClick={(event) => event.stopPropagation()}>
                      <span className={`inline-block px-3 py-1 rounded border ${roleColors[user.displayRole]}`} style={{ fontSize: 'var(--type-caption)' }}>
                        {roleLabels[user.displayRole]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center" onClick={(event) => event.stopPropagation()}>
                      <span className={`inline-block px-3 py-1 rounded border ${statusColors[user.status as keyof typeof statusColors]}`} style={{ fontSize: 'var(--type-caption)' }}>
                        {statusLabels[user.status as keyof typeof statusLabels]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700" style={{ fontSize: 'var(--type-body)' }}>{user.lastLogin}</td>
                    <td className="px-6 py-4 text-center">
                      <label className="account-lock-toggle relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={!user.isLocked}
                          onChange={() => handleToggleLock(user)}
                          className="sr-only"
                        />
                        <span
                          className="account-lock-switch"
                          style={{ clipPath: 'inset(0 round 9999px)' }}
                        ></span>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center p-2 !rounded-lg border-0 hover:bg-gray-100 text-gray-700"
                        title="Xem thông tin tài khoản"
                        onClick={() => handleViewUser(user)}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showViewModal && viewUser && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-xl w-[980px] max-w-[96vw] max-h-[88vh] shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                  <Eye size={18} className="text-white" />
                </div>
                <div className="text-left leading-tight">
                  <h3 className="text-white" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Thông tin tài khoản</h3>
                  <p className="text-white/95 text-left mt-0.5" style={{ fontSize: 'var(--type-caption)', fontWeight: 500 }}>Xem nhanh và sao chép thông tin đăng nhập</p>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-1 hover:bg-white/15 rounded">
                <span className="text-white/90 text-xl">×</span>
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <div>
                  <p className="text-gray-500" style={{ fontSize: 'var(--type-caption)' }}>Trạng thái mật khẩu</p>
                  <p className="text-gray-900" style={{ fontSize: 'var(--type-body)' }}>
                    {getPasswordStatusText(viewUser)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full border ${viewUser.role === 'CuDan' && viewUser.mustChangePassword ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}`}
                  style={{ fontSize: 'var(--type-caption)' }}
                >
                  {viewUser.role === 'CuDan' && viewUser.mustChangePassword ? 'Tạm thời' : 'Đã cập nhật'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ fontSize: 'var(--type-caption)' }}>
                <div className="border border-gray-200 rounded-lg px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Phone size={16} className="text-gray-500 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-gray-500">Username/SĐT</p>
                      <p className="text-gray-900 truncate" style={{ fontSize: 'var(--type-body)', fontWeight: 600 }}>{viewUser.username}</p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <KeyRound size={16} className="text-gray-500 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-gray-500">Mật khẩu</p>
                      <p className="text-gray-900" style={{ fontSize: 'var(--type-body)', fontWeight: 600 }}>
                        {getPasswordDisplayText(viewUser)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <UserRound size={16} className="text-gray-500 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-gray-500">Họ và tên</p>
                      <p className="text-gray-900 truncate" style={{ fontSize: 'var(--type-body)', fontWeight: 600 }}>{viewUser.fullName}</p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Shield size={16} className="text-gray-500 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-gray-500">Vai trò</p>
                      <p className="text-gray-900" style={{ fontSize: 'var(--type-body)', fontWeight: 600 }}>{roleLabels[viewUser.displayRole]}</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}
      
      {/* Lock/Unlock Confirmation Modal */}
      {showLockModal && selectedUser && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-gray-800" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>
                {selectedUser.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
              </h3>
              <button onClick={() => setShowLockModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <span className="text-gray-600 text-xl">×</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 text-orange-700 bg-orange-50 p-4 rounded border border-orange-300">
                {selectedUser.isLocked ? <Unlock size={20} /> : <Lock size={20} />}
                <p style={{ fontSize: 'var(--type-caption)' }}>
                  {selectedUser.isLocked 
                    ? 'Bạn có chắc muốn mở khóa tài khoản này?' 
                    : 'Bạn có chắc muốn khóa tài khoản này?'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded border border-gray-300">
                <p className="text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Username</p>
                <p className="text-gray-900" style={{ fontSize: 'var(--type-body)' }}>{selectedUser.username}</p>
                <p className="text-gray-600 mt-2" style={{ fontSize: 'var(--type-caption)' }}>Họ và Tên</p>
                <p className="text-gray-900" style={{ fontSize: 'var(--type-body)' }}>{selectedUser.fullName}</p>
              </div>
              
              {!selectedUser.isLocked && (
                <div>
                  <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Lý do khóa</label>
                  <textarea 
                    rows={3}
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    placeholder="Nhập lý do khóa tài khoản..."
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    style={{ fontSize: 'var(--type-caption)' }}
                  />
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowLockModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                style={{ fontSize: 'var(--type-caption)' }}
              >
                Hủy
              </button>
              <button 
                onClick={async () => {
                  if (!selectedUser) return;
                  setActionLoading(true);
                  try {
                    if (selectedUser.isLocked) {
                      await userService.unlock(Number(selectedUser.id));
                    } else {
                      await userService.lock(Number(selectedUser.id));
                    }
                    setUsers(prev => prev.map(u => 
                      u.id === selectedUser.id 
                        ? { ...u, isLocked: !selectedUser.isLocked, status: !selectedUser.isLocked ? 'locked' : 'active' }
                        : u
                    ));
                    setShowLockModal(false);
                  } catch (err: any) {
                    alert('Lỗi: ' + (err.message || 'Không thể thực hiện'));
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                className={`px-4 py-2 text-white rounded hover:opacity-90 disabled:opacity-50 ${selectedUser?.isLocked ? 'bg-green-600' : 'bg-red-600'}`}
                style={{ fontSize: 'var(--type-caption)' }}
              >
                {actionLoading ? 'Đang xử lý...' : (selectedUser?.isLocked ? 'Xác nhận Mở khóa' : 'Xác nhận Khóa')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[600px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-gray-800" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>
                Tạo tài khoản mới
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <span className="text-gray-600 text-xl">×</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-300 rounded p-3 text-sm text-red-700">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-gray-700 mb-2 font-medium" style={{ fontSize: 'var(--type-caption)' }}>
                  Số điện thoại <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="Nhập số điện thoại..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  style={{ fontSize: 'var(--type-body)' }}
                  disabled={createLoading}
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-medium" style={{ fontSize: 'var(--type-caption)' }}>
                  Mật khẩu <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  style={{ fontSize: 'var(--type-body)' }}
                  disabled={createLoading}
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-medium" style={{ fontSize: 'var(--type-caption)' }}>
                  Vai trò <span className="text-red-600">*</span>
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  style={{ fontSize: 'var(--type-body)' }}
                  disabled={createLoading}
                >
                  <option value="Admin">BQL</option>
                  <option value="CuDan">Cư dân</option>
                </select>
              </div>

            </div>

            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                style={{ fontSize: 'var(--type-caption)' }}
                disabled={createLoading}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateUser}
                disabled={createLoading}
                className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-black disabled:opacity-50"
                style={{ fontSize: 'var(--type-caption)' }}
              >
                {createLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
