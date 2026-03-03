import { X, AlertTriangle, Key, Lock, UserCheck, Shield, Mail, Phone, User, Home, FileText, Calendar } from 'lucide-react';

interface ModalProps {
  resident?: any;
  onClose: () => void;
}

export function AddResidentModal({ onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-300 rounded p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Lưu ý:</strong> Thông thường, cư dân sẽ được tạo tự động khi lập <strong>Hợp đồng mới</strong>. 
              Chỉ dùng form này khi cần thêm cư dân thủ công (ví dụ: thành viên gia đình phụ).
            </p>
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Ảnh đại diện</label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-4xl">
                👤
              </div>
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                Tải ảnh lên
              </button>
            </div>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Họ và tên *</label>
              <input 
                type="text"
                placeholder="VD: Nguyễn Văn A"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">CMND/CCCD *</label>
              <input 
                type="text"
                placeholder="VD: 001234567890"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Số điện thoại *</label>
              <input 
                type="text"
                placeholder="VD: 0912345678"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Dùng để đăng nhập App/Web cư dân</p>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Email</label>
              <input 
                type="email"
                placeholder="VD: nguyenvana@email.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          {/* Room Assignment */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Phòng *</label>
            <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500">
              <option value="">Chọn phòng...</option>
              <option value="A-101">A-101 (Đang trống)</option>
              <option value="A-102">A-102 (Đã có cư dân)</option>
              <option value="A-103">A-103 (Đang trống)</option>
              <option value="B-201">B-201 (Đang trống)</option>
              <option value="B-202">B-202 (Đã có cư dân)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              🔗 Danh sách phòng được đồng bộ từ <strong>Quản lý Hạ tầng → Cơ cấu tòa nhà & phòng</strong>
            </p>
          </div>

          {/* Contract Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Mã hợp đồng</label>
              <input 
                type="text"
                placeholder="Tự động tạo nếu để trống"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Vai trò</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500">
                <option value="owner">Chủ hợp đồng</option>
                <option value="family">Thành viên gia đình</option>
                <option value="tenant">Người thuê phụ</option>
              </select>
            </div>
          </div>

          {/* Account Settings */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm text-gray-800 font-bold mb-3">Cài đặt tài khoản</h4>
            
            <div>
              <label className="block text-sm text-gray-700 mb-2">Mật khẩu đăng nhập *</label>
              <input 
                type="password"
                placeholder="Tối thiểu 8 ký tự"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mật khẩu sẽ được gửi qua SMS/Email. Cư dân có thể đổi sau khi đăng nhập.
              </p>
            </div>

            <div className="mt-3 space-y-2">
              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Gửi mật khẩu qua SMS</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Gửi mật khẩu qua Email</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span>Tài khoản hoạt động ngay (không khóa)</span>
              </label>
            </div>
          </div>

        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
          >
            Xác nhận thêm cư dân
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditResidentModal({ resident, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[700px] max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center space-x-2">
            <User size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Chỉnh sửa thông tin cư dân - {resident?.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Ảnh đại diện</label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 border-2 border-gray-300 rounded-full flex items-center justify-center text-4xl">
                {resident?.avatar || '👤'}
              </div>
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                Thay đổi ảnh
              </button>
            </div>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Họ và tên *</label>
              <input 
                type="text"
                defaultValue={resident?.name}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">CMND/CCCD *</label>
              <input 
                type="text"
                defaultValue={resident?.idCard}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Số điện thoại *</label>
              <input 
                type="text"
                defaultValue={resident?.phone}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">Email</label>
              <input 
                type="email"
                defaultValue={resident?.email}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          {/* Room Assignment */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Phòng *</label>
            <select defaultValue={resident?.room} className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500">
              <option value="A-101">A-101</option>
              <option value="A-102">A-102</option>
              <option value="A-103">A-103</option>
              <option value="B-201">B-201</option>
              <option value="B-202">B-202</option>
              <option value="B-205">B-205</option>
              <option value="C-312">C-312</option>
              <option value="D-108">D-108</option>
            </select>
          </div>

          {/* Contract Info */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <h4 className="text-sm text-gray-700 font-bold mb-2">Thông tin hợp đồng</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>Mã hợp đồng:</strong> {resident?.contractCode}</p>
              <p><strong>Trạng thái tài khoản:</strong> 
                <span className={`ml-2 inline-block px-2 py-0.5 text-xs rounded border ${
                  resident?.status === 'active' 
                    ? 'bg-green-100 text-green-800 border-green-300' 
                    : 'bg-red-100 text-red-800 border-red-300'
                }`}>
                  {resident?.status === 'active' ? 'Đang hoạt động' : 'Bị khóa'}
                </span>
              </p>
              {resident?.debt !== '0' && (
                <p className="text-red-700">
                  <strong>Công nợ:</strong> {resident?.debt} VNĐ
                  <button className="ml-2 text-xs underline">Xem chi tiết →</button>
                </p>
              )}
            </div>
          </div>

          {/* Warning if debt exists */}
          {resident?.debt !== '0' && (
            <div className="bg-orange-50 border border-orange-300 rounded p-4">
              <p className="text-sm text-orange-800">
                <strong>⚠️ Lưu ý:</strong> Cư dân này đang có công nợ. Hãy xem chi tiết trong{' '}
                <strong>Hóa đơn & Tài chính → Quản lý Công nợ</strong>
              </p>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3 sticky bottom-0 bg-white">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResetPasswordModal({ resident, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[550px]">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key size={20} className="text-gray-800" />
            <h3 className="text-lg text-gray-800">Reset mật khẩu cư dân</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Resident Info */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <p className="text-sm text-gray-600 mb-3">Thông tin cư dân:</p>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-2xl">
                {resident.avatar}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-gray-800"><strong>Họ tên:</strong> {resident.name}</p>
                <p className="text-sm text-gray-800"><strong>Phòng:</strong> {resident.room}</p>
                <p className="text-sm text-gray-800"><strong>SĐT:</strong> {resident.phone}</p>
                <p className="text-sm text-gray-800"><strong>Email:</strong> {resident.email}</p>
              </div>
            </div>
          </div>

          {/* Send Method */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Phương thức gửi mật khẩu mới</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <Phone size={16} className="text-gray-600" />
                <span>SMS tới {resident.phone}</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <Mail size={16} className="text-gray-600" />
                <span>Email tới {resident.email}</span>
              </label>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-orange-50 border border-orange-300 rounded p-4">
            <p className="text-sm text-orange-800">
              <strong>⚠️ Lưu ý:</strong> Mật khẩu cũ sẽ bị vô hiệu hóa ngay lập tức. 
              Cư dân cần sử dụng mật khẩu mới để đăng nhập.
            </p>
          </div>

        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
          >
            Xác nhận reset
          </button>
        </div>
      </div>
    </div>
  );
}

export function LockAccountModal({ resident, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[550px]">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock size={20} className="text-red-600" />
            <h3 className="text-lg text-gray-800">Khóa tài khoản cư dân</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Warning */}
          <div className="flex items-start space-x-3 bg-red-50 border border-red-300 rounded p-4">
            <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-bold mb-1">Bạn có chắc chắn muốn khóa tài khoản này?</p>
              <p className="text-sm text-red-700">Cư dân sẽ không thể đăng nhập vào App/Web cư dân!</p>
            </div>
          </div>

          {/* Resident Info */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <p className="text-sm text-gray-600 mb-3">Tài khoản sẽ bị khóa:</p>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-2xl">
                {resident.avatar}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-gray-800"><strong>Họ tên:</strong> {resident.name}</p>
                <p className="text-sm text-gray-800"><strong>Phòng:</strong> {resident.room}</p>
                <p className="text-sm text-gray-800"><strong>Hợp đồng:</strong> {resident.contractCode}</p>
              </div>
            </div>
          </div>

          {/* Lock Reason */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Lý do khóa tài khoản *</label>
            <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500">
              <option value="">Chọn lý do...</option>
              <option value="debt">Nợ tiền quá lâu (xem Quản lý Công nợ)</option>
              <option value="violation">Vi phạm quy định chung cư</option>
              <option value="suspicious">Hoạt động đáng ngờ</option>
              <option value="request">Theo yêu cầu cư dân</option>
              <option value="other">Lý do khác</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Ghi chú chi tiết</label>
            <textarea 
              rows={2}
              placeholder="Mô tả chi tiết lý do khóa..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Impact Info */}
          <div className="bg-orange-50 border border-orange-300 rounded p-4">
            <h4 className="text-sm text-orange-800 font-bold mb-2">⚠️ Khi khóa tài khoản:</h4>
            <ul className="text-sm text-orange-800 space-y-1 ml-4">
              <li>• Cư dân KHÔNG thể đăng nhập App/Web</li>
              <li>• Cư dân KHÔNG thể xem hóa đơn online</li>
              <li>• Cư dân KHÔNG thể gửi yêu cầu sửa chữa</li>
              <li>• Hợp đồng và dữ liệu vẫn được giữ nguyên</li>
              <li>• Admin có thể MỞ KHÓA bất cứ lúc nào</li>
            </ul>
          </div>

        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Xác nhận khóa
          </button>
        </div>
      </div>
    </div>
  );
}

export function UnlockAccountModal({ resident, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[550px]">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck size={20} className="text-green-600" />
            <h3 className="text-lg text-gray-800">Mở khóa tài khoản cư dân</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Resident Info */}
          <div className="bg-gray-50 border border-gray-300 rounded p-4">
            <p className="text-sm text-gray-600 mb-3">Tài khoản sẽ được mở khóa:</p>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 border border-gray-300 rounded-full flex items-center justify-center text-2xl">
                {resident.avatar}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-gray-800"><strong>Họ tên:</strong> {resident.name}</p>
                <p className="text-sm text-gray-800"><strong>Phòng:</strong> {resident.room}</p>
                <p className="text-sm text-gray-800"><strong>Hợp đồng:</strong> {resident.contractCode}</p>
                <p className="text-sm text-red-800">
                  <strong>Công nợ hiện tại:</strong>{' '}
                  <span className={resident.debt !== '0' ? 'text-red-700 font-bold' : 'text-green-700'}>
                    {resident.debt} VNĐ
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Debt Warning */}
          {resident.debt !== '0' && (
            <div className="bg-orange-50 border border-orange-300 rounded p-4">
              <p className="text-sm text-orange-800">
                <strong>⚠️ Cảnh báo:</strong> Cư dân này vẫn còn nợ <strong>{resident.debt} VNĐ</strong>. 
                Vui lòng kiểm tra và xác nhận đã thanh toán hoặc có thỏa thuận trước khi mở khóa.
              </p>
              <button className="mt-2 px-3 py-1.5 bg-orange-100 border border-orange-400 text-orange-800 text-xs rounded hover:bg-orange-200">
                → Xem chi tiết công nợ
              </button>
            </div>
          )}

          {/* Unlock Note */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Lý do mở khóa</label>
            <textarea 
              rows={2}
              placeholder="VD: Đã thanh toán đầy đủ công nợ, Vi phạm đã được giải quyết..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Success Info */}
          <div className="bg-green-50 border border-green-300 rounded p-4">
            <h4 className="text-sm text-green-800 font-bold mb-2">✅ Sau khi mở khóa:</h4>
            <ul className="text-sm text-green-800 space-y-1 ml-4">
              <li>• Cư dân có thể đăng nhập lại App/Web ngay lập tức</li>
              <li> Tất cả tính năng sẽ hoạt động bình thường</li>
              <li>• Hệ thống sẽ gửi thông báo qua SMS/Email</li>
            </ul>
          </div>

        </div>
        
        <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
          >
            Hủy
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Xác nhận mở khóa
          </button>
        </div>
      </div>
    </div>
  );
}