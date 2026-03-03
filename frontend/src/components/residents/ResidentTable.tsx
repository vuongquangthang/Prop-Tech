import { Plus, Search, Edit2, Key, Lock, UserCheck, X, AlertTriangle, User, Mail, Phone, Home, Shield } from 'lucide-react';
import { useState } from 'react';
import { AddResidentModal, EditResidentModal, ResetPasswordModal, LockAccountModal, UnlockAccountModal } from './ResidentTableModals';

const residentsData = [
  { 
    id: 1,
    avatar: '👤', 
    name: 'Nguyễn Văn A', 
    phone: '0912345678', 
    email: 'nguyenvana@email.com', 
    room: 'A-101',
    status: 'active',
    contractCode: 'HD-2025-001',
    idCard: '001234567890',
    debt: '0'
  },
  { 
    id: 2,
    avatar: '👤', 
    name: 'Trần Thị B', 
    phone: '0923456789', 
    email: 'tranthib@email.com', 
    room: 'B-205',
    status: 'active',
    contractCode: 'HD-2025-002',
    idCard: '001234567891',
    debt: '0'
  },
  { 
    id: 3,
    avatar: '👤', 
    name: 'Lê Văn C', 
    phone: '0934567890', 
    email: 'levanc@email.com', 
    room: 'C-312',
    status: 'locked',
    contractCode: 'HD-2025-003',
    idCard: '001234567892',
    debt: '15.500.000'
  },
  { 
    id: 4,
    avatar: '👤', 
    name: 'Phạm Thị D', 
    phone: '0945678901', 
    email: 'phamthid@email.com', 
    room: 'D-108',
    status: 'active',
    contractCode: 'HD-2025-004',
    idCard: '001234567893',
    debt: '0'
  },
  { 
    id: 5,
    avatar: '👤', 
    name: 'Hoàng Văn E', 
    phone: '0956789012', 
    email: 'hoangvane@email.com', 
    room: 'A-203',
    status: 'active',
    contractCode: 'HD-2025-005',
    idCard: '001234567894',
    debt: '0'
  },
  { 
    id: 6,
    avatar: '👤', 
    name: 'Vũ Thị F', 
    phone: '0967890123', 
    email: 'vuthif@email.com', 
    room: 'B-115',
    status: 'active',
    contractCode: 'HD-2025-006',
    idCard: '001234567895',
    debt: '0'
  },
];

const statusConfig = {
  active: { label: 'Đang hoạt động', color: 'bg-green-100 text-green-800 border-green-300' },
  locked: { label: 'Bị khóa', color: 'bg-red-100 text-red-800 border-red-300' },
};

export function ResidentTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any>(null);

  const filteredResidents = residentsData.filter((resident) => {
    const matchesSearch = resident.name.includes(searchTerm) || resident.phone.includes(searchTerm) || resident.room.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || resident.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditClick = (resident: any) => {
    setSelectedResident(resident);
    setShowEditModal(true);
  };

  const handleResetPasswordClick = (resident: any) => {
    setSelectedResident(resident);
    setShowResetPasswordModal(true);
  };

  const handleLockClick = (resident: any) => {
    setSelectedResident(resident);
    if (resident.status === 'active') {
      setShowLockModal(true);
    } else {
      setShowUnlockModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo SĐT hoặc tên phòng..."
              className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:border-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select className="px-3 py-2 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-gray-500" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Bị khóa</option>
          </select>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded flex items-center space-x-2 hover:bg-gray-700"
        >
          <Plus size={16} />
          <span>Thêm cư dân mới</span>
        </button>
      </div>
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800">Danh sách cư dân - {filteredResidents.length} người</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Ảnh đại diện</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Họ tên</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Số điện thoại</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Email</th>
                <th className="px-6 py-3 text-left text-sm text-gray-600">Số phòng</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Trạng thái</th>
                <th className="px-6 py-3 text-center text-sm text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredResidents.map((resident, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-xl">
                      {resident.avatar}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{resident.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{resident.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{resident.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{resident.room}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 text-xs rounded border ${statusConfig[resident.status as keyof typeof statusConfig].color}`}>
                      {statusConfig[resident.status as keyof typeof statusConfig].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded" title="Sửa thông tin" onClick={() => handleEditClick(resident)}>
                        <Edit2 size={16} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded" title="Reset mật khẩu" onClick={() => handleResetPasswordClick(resident)}>
                        <Key size={16} className="text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded" title={resident.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'} onClick={() => handleLockClick(resident)}>
                        {resident.status === 'active' ? (
                          <Lock size={16} className="text-gray-600" />
                        ) : (
                          <UserCheck size={16} className="text-gray-600" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-300 rounded p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Hướng dẫn:</strong> Tài khoản cư dân sẽ tự động được tạo khi lập hợp đồng mới. Nếu cư dân quên mật khẩu, Admin có thể reset và gửi mật khẩu mới qua SMS.
        </p>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddResidentModal 
          onClose={() => setShowAddModal(false)} 
        />
      )}

      {showEditModal && selectedResident && (
        <EditResidentModal 
          resident={selectedResident} 
          onClose={() => setShowEditModal(false)} 
        />
      )}

      {showResetPasswordModal && selectedResident && (
        <ResetPasswordModal 
          resident={selectedResident} 
          onClose={() => setShowResetPasswordModal(false)} 
        />
      )}

      {showLockModal && selectedResident && (
        <LockAccountModal 
          resident={selectedResident} 
          onClose={() => setShowLockModal(false)} 
        />
      )}

      {showUnlockModal && selectedResident && (
        <UnlockAccountModal 
          resident={selectedResident} 
          onClose={() => setShowUnlockModal(false)} 
        />
      )}
    </div>
  );
}