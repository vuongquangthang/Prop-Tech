import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { SettingRow } from '../components/SettingRow';

export default function AccountScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tài khoản</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#2563EB" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.fullName || user?.phoneNumber || 'Cư dân'}
            </Text>
            <Text style={styles.profileRole}>
              {user?.role === 'Resident' ? 'Cư dân' : user?.role || 'N/A'} • Phòng{' '}
              {(user as any)?.roomNumber || (user as any)?.roomId || 'N/A'}
            </Text>
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
              subtitle={user?.fullName || 'Chưa cập nhật'}
              borderBottom
            />
            <SettingRow
              icon="location-outline"
              title="Phòng"
              subtitle={`Phòng ${(user as any)?.roomNumber || (user as any)?.roomId || 'N/A'}`}
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
              onPress={() => {}}
            />
            <SettingRow
              icon="notifications-outline"
              title="Thông báo & Cài đặt"
              subtitle="Quản lý thông báo của bạn"
              borderBottom
              onPress={() => {}}
            />
            <SettingRow
              icon="help-circle-outline"
              title="Trợ giúp & Hỗ trợ"
              subtitle="Liên hệ ban quản lý"
              onPress={() => {}}
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
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
