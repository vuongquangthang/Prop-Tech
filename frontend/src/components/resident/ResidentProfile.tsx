import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Phone, User, CreditCard, Lock, Bell, HelpCircle, LogOut, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function ResidentProfile() {
  const navigate = useNavigate();
  const { user, logout, changePassword } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passError, setPassError] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const initials = user?.fullName
    ? user.fullName.split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase()
    : 'U';

  async function handleChangePassword() {
    setPassError('');
    if (!oldPass || !newPass || !confirmPass) {
      setPassError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('Mật khẩu mới không khớp');
      return;
    }
    if (newPass.length < 6) {
      setPassError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    setPassLoading(true);
    try {
      await changePassword(oldPass, newPass);
      setShowPasswordModal(false);
      setOldPass(''); setNewPass(''); setConfirmPass('');
      alert('Đổi mật khẩu thành công!');
    } catch (e: any) {
      setPassError(e?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPassLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const sectionLabel = (text: string) => (
    <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 }}>
      {text}
    </p>
  );

  const infoRow = (icon: React.ReactNode, label: string, value: string, isLast = false) => (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '12px 16px',
      borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#111827', margin: '2px 0 0' }}>{value}</p>
      </div>
    </div>
  );

  const actionRow = (icon: React.ReactNode, label: string, onPress: () => void, isLast = false) => (
    <button
      onClick={onPress}
      style={{
        display: 'flex', alignItems: 'center', width: '100%', padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
        background: 'none', border: 'none', borderBottomWidth: isLast ? 0 : 1, borderBottomStyle: 'solid', borderBottomColor: '#F3F4F6',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
        {icon}
      </div>
      <p style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#111827', margin: 0 }}>{label}</p>
      <ChevronRight size={16} color="#C4C4C4" />
    </button>
  );

  const pwField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    show: boolean,
    onToggle: () => void,
  ) => (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{label}</p>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="••••••••"
          style={{
            width: '100%', padding: '10px 40px 10px 12px',
            border: '1px solid #E5E7EB', borderRadius: 10,
            fontSize: 14, color: '#111827', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          {show ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#FFF', borderBottom: '1px solid #F3F4F6', padding: '16px 24px', flexShrink: 0 }}>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0, textAlign: 'center' }}>Tài khoản</p>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        {/* Profile card */}
        <div style={{ backgroundColor: '#1E3A8A', borderRadius: 20, padding: '24px 20px', marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#FFF', margin: 0 }}>{initials}</p>
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#FFF', margin: '0 0 4px' }}>{user?.fullName || 'Cư dân'}</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 10px' }}>{user?.phoneNumber || ''}</p>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingTop: 4, paddingBottom: 4, paddingLeft: 12, paddingRight: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#FFF', margin: 0 }}>Cư dân</p>
          </div>
        </div>

        {/* THÔNG TIN TÀI KHOẢN */}
        {sectionLabel('Thông tin tài khoản')}
        <div style={{ backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {infoRow(<Phone size={18} color="#2563EB" />, 'Số điện thoại', user?.phoneNumber || '—')}
          {infoRow(<User size={18} color="#2563EB" />, 'Họ và tên', user?.fullName || '—')}
          {infoRow(<CreditCard size={18} color="#2563EB" />, 'Mã cư dân', String(user?.id ?? '—'), true)}
        </div>

        {/* CÀI ĐẶT */}
        {sectionLabel('Cài đặt')}
        <div style={{ backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {actionRow(<Lock size={18} color="#6B7280" />, 'Đổi mật khẩu', () => setShowPasswordModal(true))}
          {actionRow(<Bell size={18} color="#6B7280" />, 'Thông báo', () => alert('Tính năng đang phát triển'))}
          {actionRow(<HelpCircle size={18} color="#6B7280" />, 'Hỗ trợ & Liên hệ', () => alert('Hotline: 1900 1234'), true)}
        </div>

        {/* THÔNG TIN */}
        {sectionLabel('Thông tin')}
        <div style={{ backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#111827', margin: 0 }}>Phiên bản ứng dụng</p>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>1.0.0</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '14px', borderRadius: 16,
            border: '1px solid #FECACA', backgroundColor: '#FFF',
            color: '#DC2626', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <LogOut size={18} color="#DC2626" />
          Đăng xuất
        </button>
        <div style={{ height: 20 }} />
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#FFF', borderRadius: '24px 24px 0 0',
            padding: '24px 20px 32px', width: '100%', maxWidth: 360,
          }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', textAlign: 'center', margin: '0 0 20px' }}>
              Đổi mật khẩu
            </p>
            {pwField('Mật khẩu hiện tại', oldPass, setOldPass, showOld, () => setShowOld(v => !v))}
            {pwField('Mật khẩu mới', newPass, setNewPass, showNew, () => setShowNew(v => !v))}
            {pwField('Xác nhận mật khẩu mới', confirmPass, setConfirmPass, showConfirm, () => setShowConfirm(v => !v))}
            {passError && (
              <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12, textAlign: 'center' }}>{passError}</p>
            )}
            <button
              onClick={handleChangePassword}
              disabled={passLoading}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                backgroundColor: passLoading ? '#93C5FD' : '#1E3A8A',
                color: '#FFF', fontSize: 15, fontWeight: 600, cursor: passLoading ? 'default' : 'pointer', marginBottom: 10,
              }}
            >
              {passLoading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
            <button
              onClick={() => { setShowPasswordModal(false); setPassError(''); setOldPass(''); setNewPass(''); setConfirmPass(''); }}
              style={{ width: '100%', padding: '13px', borderRadius: 12, border: '1px solid #E5E7EB', backgroundColor: '#FFF', color: '#6B7280', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
