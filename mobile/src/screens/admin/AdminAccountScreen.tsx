import React from 'react';
import { Image, SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { getRoleLabel } from '../../utils/roleUtils';
import { resolveImageUrl } from '../../utils/image';

type InfoItem = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export default function AdminAccountScreen() {
  const { user, logout } = useAuthStore();
  const fullName = user?.displayName || user?.fullName || user?.residentName || '';
  const username = user?.username || user?.phoneNumber || '';
  const displayName = fullName || user?.phoneNumber || 'Người dùng';
  const roleLabel = getRoleLabel(user?.role);
  const avatarUrl = user?.avatarUrl?.trim();
  const infoItems: InfoItem[] = [
    { label: 'Họ và tên', value: fullName || 'Chưa cập nhật', icon: 'person-outline' },
    { label: 'Username', value: username || 'Chưa cập nhật', icon: 'at-outline' },
    { label: 'Email', value: user?.email || 'Chưa cập nhật', icon: 'mail-outline' },
    { label: 'Số điện thoại', value: user?.phoneNumber || 'Chưa cập nhật', icon: 'call-outline' },
    { label: 'Vai trò', value: roleLabel, icon: 'shield-checkmark-outline' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Tài khoản</Text>
          <Text style={styles.subtitle}>Thông tin đăng nhập và quyền truy cập app quản lý.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: resolveImageUrl(avatarUrl) }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <View style={styles.infoCard}>
            {infoItems.map((item, index) => (
              <View key={item.label}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name={item.icon} size={16} color="#1A4B84" />
                  </View>
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value}</Text>
                  </View>
                </View>
                {index < infoItems.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phạm vi app</Text>
          <View style={styles.noteCard}>
            <Ionicons name="briefcase-outline" size={17} color="#1A4B84" />
            <Text style={styles.noteText}>
              App chỉ phục vụ tác vụ hiện trường. Cấu hình hệ thống, hợp đồng chi tiết và dữ liệu nền vẫn xử lý trên web.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={17} color="#dc2626" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    padding: 24,
    paddingBottom: 86,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1A4B84',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  rolePill: {
    alignSelf: 'flex-start',
    marginTop: 5,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 8,
    backgroundColor: '#E8F0FB',
    justifyContent: 'center',
  },
  roleText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#E8F0FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  infoValue: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 50,
  },
  noteCard: {
    borderRadius: 14,
    padding: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexDirection: 'row',
    gap: 8,
  },
  noteText: {
    flex: 1,
    color: '#1e3a8a',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 14,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '900',
  },
});
