import { Save, LogOut, Camera, Loader2, AlertTriangle, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { authService } from '../../services/api.service';

export function MyProfileForm() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only fetch profile if user is logged in (has token)
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    } else {
      // If not logged in, just set loading to false and show empty form
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await authService.getCurrentUser();
      
      // Set form fields from user data
      setFullName(user.residentName || user.phoneNumber || '');
      setPhone(user.phoneNumber || '');
      // Email and address not available in UserDto - leave empty
      // User can manually enter if needed
    } catch (err: any) {
      // If 401/403 (not authenticated), show empty form instead of error
      if (err.message?.includes('401') || err.message?.includes('403') || err.message?.includes('Unauthorized')) {
        setLoading(false);
        return;
      }
      setError(err.message || 'Không thể tải thông tin người dùng');
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 2MB');
        return;
      }
      
      // Check file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        alert('Chỉ chấp nhận file JPG hoặc PNG');
        return;
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    // Validation
    if (!fullName.trim()) {
      alert('Vui lòng nhập Họ và Tên');
      return;
    }
    if (!email.trim()) {
      alert('Vui lòng nhập Email');
      return;
    }
    if (!phone.trim()) {
      alert('Vui lòng nhập Số điện thoại');
      return;
    }
    
    // Check if changing password
    if (showPasswordForm && (newPassword || confirmPassword)) {
      if (!currentPassword) {
        alert('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu');
        return;
      }
      if (newPassword !== confirmPassword) {
        alert('Mật khẩu mới và xác nhận không khớp');
        return;
      }
      if (newPassword.length < 8) {
        alert('Mật khẩu mới phải có ít nhất 8 ký tự');
        return;
      }
    }
    
    // Show success modal
    setShowSuccessModal(true);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    // In a real app, this would redirect to login page
    alert('Đã đăng xuất thành công');
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 size={48} className="animate-spin text-gray-400" />
          <span className="text-gray-600">Đang tải thông tin người dùng...</span>
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
            onClick={fetchUserProfile}
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
      {/* Profile Form */}
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <h2 className="text-gray-800 mb-6" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Thông tin cá nhân</h2>
        
        <div className="grid grid-cols-3 gap-8">
          {/* Avatar Column */}
          <div className="col-span-1 flex flex-col items-center space-y-4">
            <div className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-300 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl text-gray-500">👤</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
              className="hidden"
            />
            <button 
              onClick={handleChangePhoto}
              className="px-4 py-2 bg-white border border-gray-800 text-gray-800 rounded hover:bg-gray-50 flex items-center space-x-2"
              style={{ fontSize: 'var(--type-caption)' }}
            >
              <Camera size={16} />
              <span>Thay đổi ảnh</span>
            </button>
            <p className="text-gray-500 text-center" style={{ fontSize: 'var(--type-caption)' }}>
              Định dạng: JPG, PNG<br/>
              Kích thước tối đa: 2MB
            </p>
          </div>
          
          {/* Info Column */}
          <div className="col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Họ và Tên *</label>
                <input 
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  style={{ fontSize: 'var(--type-caption)' }}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Username</label>
                <input 
                  type="text"
                  value="admin"
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded"
                  style={{ fontSize: 'var(--type-caption)' }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Email *</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  style={{ fontSize: 'var(--type-caption)' }}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Số điện thoại *</label>
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                  style={{ fontSize: 'var(--type-caption)' }}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Vai trò</label>
              <input 
                type="text"
                value="Admin - Quản lý hệ thống"
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded"
                style={{ fontSize: 'var(--type-caption)' }}
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Địa chỉ</label>
              <textarea 
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                style={{ fontSize: 'var(--type-caption)' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Security Section */}
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-800" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Thông tin bảo mật</h2>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="px-4 py-2 bg-white border border-gray-800 text-gray-800 rounded hover:bg-gray-50 flex items-center space-x-2"
            style={{ fontSize: 'var(--type-caption)' }}
          >
            <Key size={16} />
            <span>Đổi mật khẩu</span>
            {showPasswordForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        
        {showPasswordForm && (
        <div className="space-y-4 max-w-xl">
          <div>
            <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Mật khẩu hiện tại *</label>
            <input 
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="●●●●●●●●"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              style={{ fontSize: 'var(--type-caption)' }}
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Mật khẩu mới</label>
            <input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="●●●●●●●●"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              style={{ fontSize: 'var(--type-caption)' }}
            />
            <p className="text-gray-500 mt-1" style={{ fontSize: 'var(--type-caption)' }}>Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số</p>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Xác nhận mật khẩu mới</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="●●●●●●●●"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
              style={{ fontSize: 'var(--type-caption)' }}
            />
          </div>
        </div>
        )}
        
        {!showPasswordForm && (
          <p className="text-gray-500" style={{ fontSize: 'var(--type-caption)' }}>
            Nhấn "Đổi mật khẩu" để thay đổi mật khẩu của bạn.
          </p>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-white border border-red-600 text-red-600 rounded hover:bg-red-50 flex items-center space-x-2"
          style={{ fontSize: 'var(--type-caption)', height: 'var(--button-height)', borderRadius: 'var(--radius-button)' }}
        >
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
        
        <button 
          onClick={handleSaveChanges}
          className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center space-x-2"
          style={{ fontSize: 'var(--type-caption)', height: 'var(--button-height)', borderRadius: 'var(--radius-button)' }}
        >
          <Save size={16} />
          <span>Lưu thay đổi</span>
        </button>
      </div>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-gray-800 mb-3" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>Lưu thành công!</h3>
              <p className="text-gray-600 mb-6" style={{ fontSize: 'var(--type-caption)' }}>
                Thông tin cá nhân và bảo mật của bạn đã được cập nhật.
              </p>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                style={{ fontSize: 'var(--type-caption)' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[500px]">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <h3 className="text-gray-800" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Xác nhận đăng xuất</h3>
              <button onClick={() => setShowLogoutModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <span style={{ color: '#6B7280', fontSize: '28px', lineHeight: 1 }}>×</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 text-orange-700 bg-orange-50 p-4 rounded border border-orange-300">
                <LogOut size={20} />
                <p style={{ fontSize: 'var(--type-caption)' }}>
                  Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
                </p>
              </div>
            </div>
            
            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                style={{ fontSize: 'var(--type-caption)' }}
              >
                Hủy
              </button>
              <button 
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:opacity-90"
                style={{ fontSize: 'var(--type-caption)' }}
              >
                Xác nhận Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}