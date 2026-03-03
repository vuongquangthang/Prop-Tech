import { Filter, Key, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const usersData = [
  { 
    id: 'USR-001',
    username: '0912345678', 
    fullName: 'Admin Hệ thống', 
    role: 'Admin',
    status: 'active',
    lastLogin: '05/02/2026 14:30',
    isLocked: false
  },
  { 
    id: 'USR-002',
    username: '0923456789', 
    fullName: 'Nguyễn Văn A', 
    role: 'Cư dân',
    status: 'active',
    lastLogin: '05/02/2026 10:15',
    isLocked: false
  },
  { 
    id: 'USR-003',
    username: '0934567890', 
    fullName: 'Trần Thị B', 
    role: 'Cư dân',
    status: 'locked',
    lastLogin: '03/02/2026 16:20',
    isLocked: true
  },
  { 
    id: 'USR-004',
    username: '0945678901', 
    fullName: 'Lê Văn C', 
    role: 'Cư dân',
    status: 'active',
    lastLogin: '04/02/2026 09:45',
    isLocked: false
  },
  { 
    id: 'USR-005',
    username: '0956789012', 
    fullName: 'Phạm Thị D', 
    role: 'Cư dân',
    status: 'inactive',
    lastLogin: 'Chưa kích hoạt',
    isLocked: false
  },
  { 
    id: 'USR-006',
    username: 'admin2', 
    fullName: 'Quản lý Tòa A', 
    role: 'Admin',
    status: 'active',
    lastLogin: '05/02/2026 08:00',
    isLocked: false
  },
  { 
    id: 'USR-007',
    username: '0978901234', 
    fullName: 'Hoàng Văn E', 
    role: 'Cư dân',
    status: 'locked',
    lastLogin: '02/02/2026 11:30',
    isLocked: true
  },
];

const roleColors = {
  Admin: 'bg-purple-100 text-purple-800 border-purple-300',
  'Cư dân': 'bg-blue-100 text-blue-800 border-blue-300',
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
  const [showResetModal, setShowResetModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('MatKhau123@');
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const handleResetPassword = (user: any) => {
    setSelectedUser(user);
    setShowResetModal(true);
    setShowCurrentPassword(false);
    setCurrentPassword('MatKhau123@'); // Mock password
  };

  const handleToggleLock = (user: any) => {
    setSelectedUser(user);
    setShowLockModal(true);
  };

  // Filter data based on selections
  const filteredUsers = usersData.filter(user => {
    const roleMatch = roleFilter === 'all' || user.role === roleFilter;
    const statusMatch = statusFilter === 'all' || user.status === statusFilter;
    const searchMatch = searchText === '' || 
      user.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
      user.username.toLowerCase().includes(searchText.toLowerCase());
    return roleMatch && statusMatch && searchMatch;
  });

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Tổng tài khoản</p>
          <p className="text-gray-900" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{usersData.length}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>tài khoản</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Đang hoạt động</p>
          <p className="text-green-600" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{usersData.filter(u => u.status === 'active').length}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>tài khoản</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Đang bị khóa</p>
          <p className="text-red-600" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{usersData.filter(u => u.status === 'locked').length}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>tài khoản</p>
        </div>
        <div className="bg-white border-2 border-gray-300 rounded p-4">
          <p className="text-gray-600 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Chưa kích hoạt</p>
          <p className="text-gray-600" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>{usersData.filter(u => u.status === 'inactive').length}</p>
          <p className="text-gray-600 mt-1" style={{ fontSize: 'var(--type-caption)' }}>tài khoản</p>
        </div>
      </div>
      
      {/* Filter Bar */}
      <div className="flex items-center space-x-4">
        <Filter size={16} className="text-gray-500" />
        
        <select 
          className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
          style={{ fontSize: 'var(--type-caption)' }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">Tất cả vai trò</option>
          <option value="Admin">Admin</option>
          <option value="Cư dân">Cư dân</option>
        </select>
        
        <select 
          className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500"
          style={{ fontSize: 'var(--type-caption)' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Đang bị khóa</option>
          <option value="inactive">Chưa kích hoạt</option>
        </select>
        
        <input 
          type="text"
          placeholder="Tìm kiếm theo tên hoặc SĐT..."
          className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500 w-64"
          style={{ fontSize: 'var(--type-caption)' }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-gray-800" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Danh sách tài khoản - {filteredUsers.length} tài khoản</h2>
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
              {filteredUsers.map((user, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-800" style={{ fontSize: 'var(--type-body)' }}>{user.username}</td>
                  <td className="px-6 py-4 text-gray-700" style={{ fontSize: 'var(--type-body)' }}>{user.fullName}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded border ${roleColors[user.role as keyof typeof roleColors]}`} style={{ fontSize: 'var(--type-caption)' }}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded border ${statusColors[user.status as keyof typeof statusColors]}`} style={{ fontSize: 'var(--type-caption)' }}>
                      {statusLabels[user.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700" style={{ fontSize: 'var(--type-body)' }}>{user.lastLogin}</td>
                  <td className="px-6 py-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!user.isLocked}
                        onChange={() => handleToggleLock(user)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-red-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleResetPassword(user)}
                      className="p-2 hover:bg-gray-100 rounded" 
                      title="Reset mật khẩu"
                    >
                      <Key size={16} className="text-gray-600" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500" style={{ fontSize: 'var(--type-body)' }}>
                    Không có tài khoản nào phù hợp với bộ lọc
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Reset Password Modal */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-gray-800" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Reset Mật khẩu</h3>
              <button onClick={() => setShowResetModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <span style={{ color: '#6B7280', fontSize: '28px', lineHeight: 1 }}>×</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-700" style={{ fontSize: 'var(--type-caption)' }}>
                Bạn đang reset mật khẩu cho tài khoản:
              </p>
              <div className="bg-gray-50 p-4 rounded border border-gray-300">
                <p className="text-gray-600" style={{ fontSize: 'var(--type-caption)' }}>Username</p>
                <p className="text-gray-900" style={{ fontSize: 'var(--type-body)' }}>{selectedUser.username}</p>
                <p className="text-gray-600 mt-2" style={{ fontSize: 'var(--type-caption)' }}>Họ và Tên</p>
                <p className="text-gray-900" style={{ fontSize: 'var(--type-body)' }}>{selectedUser.fullName}</p>
              </div>
              
              {/* Current Password Field */}
              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Mật khẩu hiện tại</label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    style={{ fontSize: 'var(--type-caption)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} className="text-gray-600" />
                    ) : (
                      <Eye size={16} className="text-gray-600" />
                    )}
                  </button>
                </div>
                <p className="text-gray-500 mt-1" style={{ fontSize: 'var(--type-caption)' }}>Click vào icon mắt để xem/ẩn mật khẩu. Bạn có thể chỉnh sửa mật khẩu trong ô này.</p>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Mật khẩu tạm thời</label>
                <input 
                  type="text"
                  value="●●●●●●●●"
                  readOnly
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded"
                  style={{ fontSize: 'var(--type-caption)' }}
                />
                <p className="text-gray-500 mt-1" style={{ fontSize: 'var(--type-caption)' }}>Mật khẩu sẽ được gửi qua SMS đến số điện thoại đăng ký</p>
              </div>
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                style={{ fontSize: 'var(--type-caption)' }}
              >
                Hủy
              </button>
              <button 
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                style={{ fontSize: 'var(--type-caption)' }}
              >
                Xác nhận Reset
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Lock/Unlock Confirmation Modal */}
      {showLockModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                onClick={() => setShowLockModal(false)}
                className={`px-4 py-2 text-white rounded hover:opacity-90 ${selectedUser.isLocked ? 'bg-green-600' : 'bg-red-600'}`}
                style={{ fontSize: 'var(--type-caption)' }}
              >
                {selectedUser.isLocked ? 'Xác nhận Mở khóa' : 'Xác nhận Khóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}