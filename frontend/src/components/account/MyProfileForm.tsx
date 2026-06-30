import { Save, Camera, Loader2, AlertTriangle, Key, Eye, EyeOff, CheckCircle, Trash2, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getStoredAuthToken } from '../../lib/api-client';
import { authService } from '../../services/api.service';
import { PageHeader } from '../ui/product-system';

export function MyProfileForm() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPasswordSuccessModal, setShowPasswordSuccessModal] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { changePassword, updateUser } = useAuth();

  useEffect(() => {
    // Only fetch profile if user is logged in (has token)
    const token = getStoredAuthToken();
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

      setFullName(user.displayName || user.fullName || user.residentName || '');
      setUsername(user.username || user.phoneNumber || '');
      setPhone(user.phoneNumber || '');
      setEmail(user.email || '');
      setAddress(user.address || '');
      setAvatarUrl(user.avatarUrl || '');
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

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const handleSaveChanges = async () => {
    if (!fullName.trim()) { alert('Vui lòng nhập Họ và Tên'); return; }
    if (!phone.trim()) { alert('Vui lòng nhập Số điện thoại'); return; }

    try {
      const updatedUser = await authService.updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        address: address.trim(),
        avatarUrl,
      });
      updateUser(updatedUser);
      setShowSuccessModal(true);
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật hồ sơ');
    }
  };

  const handleChangePasswordSubmit = async () => {
    setPasswordError(null);
    if (!currentPassword.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới và xác nhận không khớp');
      return;
    }
    try {
      setPasswordLoading(true);
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSuccessModal(true);
      setShowPasswordModal(false);
    } catch (err: any) {
      setPasswordError(err.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setPasswordLoading(false);
    }
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
      <PageHeader
        eyebrow="Quản lý tài khoản"
        title="Hồ sơ cá nhân"
        description="Cập nhật thông tin hiển thị, ảnh đại diện và thiết lập bảo mật của tài khoản."
        actions={
          <button
            onClick={handleSaveChanges}
            className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center space-x-2"
            style={{ fontSize: 'var(--type-caption)', height: 'var(--button-height)', borderRadius: 'var(--radius-button)' }}
          >
            <Save size={16} />
            <span>Lưu thay đổi</span>
          </button>
        }
      />

      {/* Profile Form */}
      <div className="bg-white border-2 border-gray-300 rounded p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-gray-800" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Thông tin cá nhân</h2>
            <p className="mt-1 text-gray-500" style={{ fontSize: 'var(--type-caption)' }}>Cập nhật ảnh đại diện và thông tin hiển thị của tài khoản.</p>
          </div>
        </div>
        
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
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button 
                onClick={handleChangePhoto}
                className="px-4 py-2 bg-white border border-gray-800 text-gray-800 rounded hover:bg-gray-50 flex items-center space-x-2"
                style={{ fontSize: 'var(--type-caption)' }}
              >
                <Camera size={16} />
                <span>Thay đổi ảnh</span>
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-4 py-2 bg-white border border-red-500 text-red-600 rounded hover:bg-red-50 flex items-center space-x-2"
                  style={{ fontSize: 'var(--type-caption)' }}
                >
                  <Trash2 size={16} />
                  <span>Xóa ảnh</span>
                </button>
              )}
            </div>
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
                  value={username}
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-gray-800" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>Thông tin bảo mật</h2>
            <p className="mt-2 text-gray-500" style={{ fontSize: 'var(--type-caption)' }}>
              Mật khẩu được ẩn vì lý do bảo mật. Bạn nên đổi mật khẩu định kỳ để bảo vệ tài khoản.
            </p>
          </div>
          <button
            onClick={() => {
              setPasswordError(null);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setShowPasswordModal(true);
            }}
            className="px-4 py-2 bg-white border border-gray-800 text-gray-800 rounded hover:bg-gray-50 flex items-center space-x-2"
            style={{ fontSize: 'var(--type-caption)' }}
          >
            <Key size={16} />
            <span>Đổi mật khẩu</span>
          </button>
        </div>
      </div>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="admin-content-modal-overlay">
          <div className="relative bg-white rounded-lg w-[500px]">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute right-4 top-4 rounded p-1 hover:bg-gray-100"
              aria-label="Đóng"
            >
              <X size={20} className="text-gray-600" />
            </button>
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
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="admin-content-modal-overlay">
          <div className="bg-white rounded-lg w-[520px] shadow-xl">
            <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-gray-800" style={{ fontSize: 'var(--type-body-bold)', fontWeight: 700 }}>
                  Đổi mật khẩu
                </h3>
                <p className="mt-1 text-gray-500" style={{ fontSize: 'var(--type-caption)' }}>
                  Nhập mật khẩu hiện tại và mật khẩu mới để xác nhận thay đổi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Mật khẩu hiện tại *</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    style={{ fontSize: 'var(--type-caption)' }}
                  />
                  <button type="button" onClick={() => setShowCurrentPass(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Mật khẩu mới *</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    style={{ fontSize: 'var(--type-caption)' }}
                  />
                  <button type="button" onClick={() => setShowNewPass(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-gray-500 mt-1" style={{ fontSize: 'var(--type-caption)' }}>Tối thiểu 8 ký tự</p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: 'var(--type-caption)' }}>Xác nhận mật khẩu mới *</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                    style={{ fontSize: 'var(--type-caption)' }}
                  />
                  <button type="button" onClick={() => setShowConfirmPass(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700" style={{ fontSize: 'var(--type-caption)' }}>
                  <AlertTriangle size={15} />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-300 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                style={{ fontSize: 'var(--type-caption)' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleChangePasswordSubmit}
                disabled={passwordLoading}
                className="px-5 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-60 flex items-center gap-2"
                style={{ fontSize: 'var(--type-caption)' }}
              >
                {passwordLoading ? <Loader2 size={15} className="animate-spin" /> : <Key size={15} />}
                <span>{passwordLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Change Password Success Modal */}
      {showPasswordSuccessModal && (
        <div className="admin-content-modal-overlay">
          <div className="relative bg-white rounded-lg w-[460px] shadow-xl">
            <button
              type="button"
              onClick={() => setShowPasswordSuccessModal(false)}
              className="absolute right-4 top-4 rounded p-1 hover:bg-gray-100"
              aria-label="Đóng"
            >
              <X size={20} className="text-gray-600" />
            </button>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-gray-800 mb-2" style={{ fontSize: 'var(--type-section-title)', fontWeight: 700 }}>
                Đổi mật khẩu thành công!
              </h3>
              <p className="text-gray-500 mb-6" style={{ fontSize: 'var(--type-caption)' }}>
                Mật khẩu của bạn đã được cập nhật. Vui lòng sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
