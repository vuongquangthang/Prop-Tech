import { Plus, Search, Edit2, Key, Lock, UserCheck, X, AlertTriangle, User, Mail, Phone, Home, Shield, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AddResidentModal, EditResidentModal, ResetPasswordModal, LockAccountModal, UnlockAccountModal } from './ResidentTableModals';
import { residentService } from '../../services/api.service';

interface ResidentData {
  id: number;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  idCardNumber?: string;
  room?: string;
  status?: string;
  contractCode?: string;
  debt?: string;
}

const statusConfig = {
  active: { label: 'Đang hoạt động', color: 'bg-green-100 text-green-800 border-green-300' },
  locked: { label: 'Bị khóa', color: 'bg-red-100 text-red-800 border-red-300' },
};

export function ResidentTable() {
  const [residents, setResidents] = useState<ResidentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState<any>(null);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await residentService.getAll();
      setResidents(data.map((r: any) => ({
        id: r.id,
        fullName: r.fullName || r.hoTen || '',
        phoneNumber: r.phoneNumber || r.soDienThoai || '',
        email: r.email || '',
        idCardNumber: r.idCardNumber || r.soCCCD || '',
        room: '',  // TODO: Get from residency/contract data
        status: 'active',  // TODO: Get from user account status
        contractCode: '',  // TODO: Get from contract data
        debt: '0'  // TODO: Get from invoice data
      })));
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách cư dân');
      console.error('Error fetching residents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResidents = residents.filter((resident) => {
    const matchesSearch = 
      resident.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (resident.phoneNumber && resident.phoneNumber.includes(searchTerm)) ||
      (resident.room && resident.room.includes(searchTerm));
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
              placeholder="Tìm theo SĐT hoặc tên..."
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

          <button 
            onClick={fetchResidents}
            className="px-4 py-2 bg-gray-500 text-white text-sm rounded flex items-center space-x-2 hover:bg-gray-600"
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            <span>Làm mới</span>
          </button>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gray-800 text-white text-sm rounded flex items-center space-x-2 hover:bg-gray-700"
        >
          <Plus size={16} />
          <span>Thêm cư dân mới</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded p-4 flex items-center space-x-2">
          <AlertTriangle size={20} className="text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
          <button 
            onClick={fetchResidents}
            className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      )}
      
      {/* Table */}
      <div className="bg-white border-2 border-gray-300 rounded">
        <div className="border-b border-gray-300 px-6 py-4">
          <h2 className="text-lg text-gray-800">
            Danh sách cư dân - {loading ? '...' : filteredResidents.length} người
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-gray-400" />
              <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
            </div>
          ) : filteredResidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <User size={48} className="text-gray-300 mb-3" />
              <p className="text-gray-500">Không tìm thấy cư dân nào</p>
            </div>
          ) : (
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
                {filteredResidents.map((resident) => (
                  <tr key={resident.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-xl">
                        👤
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{resident.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{resident.phoneNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{resident.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{resident.room || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 text-xs rounded border ${statusConfig[(resident.status || 'active') as keyof typeof statusConfig].color}`}>
                        {statusConfig[(resident.status || 'active') as keyof typeof statusConfig].label}
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
          )}
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