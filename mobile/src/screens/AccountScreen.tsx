import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { SettingRow } from '../components/SettingRow';
import apiService from '../services/api.service';
// @ts-ignore - TypeScript cache issue, restart TS server if error persists
import { roomService, MyRoom } from '../services/room.service';
import ContractPicker from '../components/ContractPicker';
import { palette, radius } from '../theme/palette';

export default function AccountScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const [myRoom, setMyRoom] = useState<MyRoom | null>(null);

  const activeContractId = useAuthStore((s) => s.activeContractId);

  React.useEffect(() => {
    roomService.getMyRoom().then(setMyRoom).catch(() => {});
  }, [activeContractId]);

  // Change password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Xác nhận đăng xuất', 'Bạn có chắc chắn muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const openPasswordModal = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    if (!oldPassword.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      setIsChanging(true);
      await apiService.post('/api/auth/change-password', { oldPassword, newPassword });
      setShowPasswordModal(false);
      Alert.alert('Thành công', 'Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.', [
        { text: 'OK', onPress: () => logout() },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể đổi mật khẩu');
    } finally {
      setIsChanging(false);
    }
  };

  const handleSupport = () => {
    Alert.alert(
      'Trợ giúp & Hỗ trợ',
      'Ban quản lý tòa nhà\n\n📞 Hotline: 0900 123 456\n✉️ Email: bql@apartment.vn\n🕐 Giờ làm việc: 7:00 – 21:00 hằng ngày\n\nHoặc gửi yêu cầu sửa chữa qua tab Yêu cầu.',
      [{ text: 'Đóng' }]
    );
  };

  const handleNotifications = () => {
    Alert.alert(
      'Thông báo & Cài đặt',
      'Thông báo đang được bật cho tài khoản này.\n\nBạn sẽ nhận thông báo về:\n• Hóa đơn mới\n• Cập nhật yêu cầu sửa chữa\n• Thông báo từ ban quản lý',
      [{ text: 'Đóng' }]
    );
  };

  const accountDisplayName =
    user?.displayName ||
    user?.fullName ||
    user?.residentName ||
    user?.phoneNumber ||
    'Cư dân';

  const getInitials = () => {
    const name = accountDisplayName === user?.phoneNumber ? '' : accountDisplayName;
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (name.length > 0) return name[0].toUpperCase();
    return '?';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSideButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tài khoản</Text>
        <View style={styles.headerRightSlot} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {accountDisplayName}
            </Text>
            <Text style={styles.profilePhone}>{user?.phoneNumber}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {user?.role === 'Resident' || user?.role === 'CuDan' ? 'Cư dân' : user?.role || 'Cư dân'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contract picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HỢP ĐỒNG</Text>
          <View style={styles.contractPickerShell}> 
            <ContractPicker />
          </View>
        </View>

        {/* Account Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÔNG TIN TÀI KHOẢN</Text>
          <View style={styles.card}>
            <SettingRow
              icon="call-outline"
              title="Số điện thoại"
              subtitle={user?.phoneNumber || 'N/A'}
              borderBottom
            />
            <SettingRow
              icon="person-outline"
              title="Họ và tên"
              subtitle={accountDisplayName !== user?.phoneNumber ? accountDisplayName : 'Chưa cập nhật'}
              borderBottom
            />
            <SettingRow
              icon="id-card-outline"
              title="Mã cư dân"
              subtitle={user?.residentId ? `#${user.residentId}` : 'N/A'}
            />
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CÀI ĐẶT</Text>
          <View style={styles.card}>
            <SettingRow
              icon="lock-closed-outline"
              title="Thay đổi mật khẩu"
              subtitle="Cập nhật mật khẩu đăng nhập"
              borderBottom
              onPress={openPasswordModal}
            />
            <SettingRow
              icon="notifications-outline"
              title="Thông báo & Cài đặt"
              subtitle="Thông báo đang bật"
              borderBottom
              onPress={handleNotifications}
            />
            <SettingRow
              icon="help-circle-outline"
              title="Trợ giúp & Hỗ trợ"
              subtitle="Liên hệ ban quản lý"
              onPress={handleSupport}
            />
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÔNG TIN</Text>
          <View style={styles.card}>
            <SettingRow
              icon="information-circle-outline"
              title="Phiên bản: 1.0.0"
              subtitle="Smart Building Management System"
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thay đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Mật khẩu hiện tại *</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showOld}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowOld(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showOld ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Mật khẩu mới *</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Ít nhất 6 ký tự"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Xác nhận mật khẩu mới *</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {confirmPassword.length > 0 && (
                <Text style={{ fontSize: 12, marginTop: 4, color: newPassword === confirmPassword ? '#059669' : '#DC2626' }}>
                  {newPassword === confirmPassword ? '✓ Mật khẩu khớp' : '✗ Mật khẩu không khớp'}
                </Text>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowPasswordModal(false)}
                disabled={isChanging}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, isChanging && styles.btnDisabled]}
                onPress={handleChangePassword}
                disabled={isChanging}
              >
                {isChanging ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Xác nhận</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  headerSideButton: { width: 52, height: 28, justifyContent: 'center', zIndex: 2 },
  headerRightSlot: { width: 52, minHeight: 28, zIndex: 2 },
  headerTitle: {
    position: 'absolute',
    left: 72,
    right: 72,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: palette.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.primaryDark,
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#38BDF8',
    shadowColor: palette.shadowStrong,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 7,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textMuted,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    overflow: 'hidden',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 4,
  },
  contractPickerShell: {
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: palette.danger,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    flexDirection: 'row',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.text,
    marginBottom: 6,
    marginTop: 12,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceAlt,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: palette.text,
  },
  eyeBtn: {
    padding: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: palette.surface,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
