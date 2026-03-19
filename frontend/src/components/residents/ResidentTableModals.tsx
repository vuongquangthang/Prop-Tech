import { X, AlertTriangle, Lock, UserCheck, User, Phone } from 'lucide-react';
import { useState } from 'react';
import { residentService, userService } from '../../services/api.service';
import { Loader2 } from 'lucide-react';

interface ModalProps {
  resident?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddResidentModal({ onClose, onSuccess }: ModalProps) {
  const [fullName, setFullName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!fullName.trim() || !idCard.trim() || !phone.trim()) {
      setError('Vui lòng điền đầy đủ họ tên, CCCD và số điện thoại');
      return;
    }
    setLoading(true); setError(null);
    try {
      await residentService.create({
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        idCardNumber: idCard.trim(),
      } as any);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[700px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center space-x-2">
            <User size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Thêm cư dân mới</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Họ và tên *</label>
              <input 
                type="text"
                placeholder="VD: Nguyễn Văn A"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">CMND/CCCD *</label>
              <input 
                type="text"
                placeholder="VD: 001234567890"
                value={idCard}
                onChange={e => setIdCard(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Số điện thoại *</label>
            <input 
              type="text"
              placeholder="VD: 0912345678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Dùng để đăng nhập App/Web cư dân</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{error}</p>
          )}
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>Xác nhận thêm cư dân</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditResidentModal({ resident, onClose, onSuccess }: ModalProps) {
  const [fullName, setFullName] = useState(resident?.fullName || resident?.name || '');
  const [idCard, setIdCard] = useState(resident?.idCardNumber || resident?.idCard || '');
  const [phone, setPhone] = useState(resident?.phoneNumber || resident?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setError('Vui lòng điền họ tên');
      return;
    }
    setLoading(true); setError(null);
    try {
      await residentService.update(resident.id, {
        fullName: fullName.trim(),
        phoneNumber: phone.trim() || undefined,
        idCardNumber: idCard.trim() || undefined,
      } as any);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[700px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center space-x-2">
            <User size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Chỉnh sửa thông tin cư dân - {resident?.fullName || resident?.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Họ và tên *</label>
              <input 
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">CMND/CCCD</label>
              <input 
                type="text"
                value={idCard}
                onChange={e => setIdCard(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Số điện thoại</label>
            <input 
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-2">Thông tin hợp đồng</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>Trạng thái tài khoản:</strong>
                <span className={`ml-2 inline-block px-2 py-0.5 text-xs rounded border ${
                  resident?.status === 'active' 
                    ? 'bg-green-100 text-green-800 border-green-300' 
                    : 'bg-red-100 text-red-800 border-red-300'
                }`}>
                  {resident?.status === 'active' ? 'Đang hoạt động' : 'Bị khóa'}
                </span>
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{error}</p>
          )}
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function LockAccountModal({ resident, onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true); setError(null);
    try {
      await userService.lock(resident.id);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi khóa tài khoản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[550px]">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock size={20} className="text-red-600" />
            <h3 className="text-lg text-gray-800">Khóa tài khoản cư dân</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={20} className="text-gray-600" /></button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-start space-x-3 bg-red-50 border border-red-300 rounded p-4">
            <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-bold mb-1">Bạn có chắc chắn muốn khóa tài khoản này?</p>
              <p className="text-sm text-red-700">Cư dân sẽ không thể đăng nhập vào App/Web cư dân!</p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-800"><strong>Họ tên:</strong> {resident?.fullName || resident?.name}</p>
              <p className="text-sm text-gray-800"><strong>SĐT:</strong> {resident?.phoneNumber || resident?.phone}</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{error}</p>}
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50">Hủy</button>
          <button onClick={handleConfirm} disabled={loading} className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>Xác nhận khóa</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function UnlockAccountModal({ resident, onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true); setError(null);
    try {
      await userService.unlock(resident.id);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi mở khóa tài khoản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[550px]">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck size={20} className="text-green-600" />
            <h3 className="text-lg text-gray-800">Mở khóa tài khoản cư dân</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={20} className="text-gray-600" /></button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <p className="text-sm text-gray-600 mb-2">Tài khoản sẽ được mở khóa:</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-800"><strong>Họ tên:</strong> {resident?.fullName || resident?.name}</p>
              <p className="text-sm text-gray-800"><strong>SĐT:</strong> {resident?.phoneNumber || resident?.phone}</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-300 rounded p-4">
            <p className="text-sm text-green-800">✅ Sau khi mở khóa, cư dân có thể đăng nhập lại App/Web ngay lập tức.</p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-300 rounded px-3 py-2">{error}</p>}
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50">Hủy</button>
          <button onClick={handleConfirm} disabled={loading} className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>Xác nhận mở khóa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
