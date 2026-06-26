import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { getRoleLabel } from '../../utils/roleUtils';

type Props = {
  navigation: {
    navigate: (screen: string) => void;
  };
};

const quickActions = [
  {
    title: 'Hóa đơn',
    subtitle: 'Tính nháp, duyệt gửi',
    icon: 'receipt-outline',
    screen: 'AdminInvoices',
    accent: '#0f766e',
    background: '#ecfdf5',
  },
  {
    title: 'Sự cố',
    subtitle: 'Xử lý, nghiệm thu',
    icon: 'construct-outline',
    screen: 'AdminMaintenance',
    accent: '#b45309',
    background: '#fffbeb',
  },
  {
    title: 'Bài đăng',
    subtitle: 'Tạo, khóa/mở bài',
    icon: 'megaphone-outline',
    screen: 'AdminPosts',
    accent: '#7c3aed',
    background: '#f5f3ff',
  },
  {
    title: 'Tài khoản',
    subtitle: 'Thông tin quản lý',
    icon: 'person-outline',
    screen: 'AdminProfile',
    accent: '#2563eb',
    background: '#eff6ff',
  },
] as const;

export default function AdminHomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const displayName = user?.residentName || user?.phoneNumber || 'Quản lý';
  const roleLabel = getRoleLabel(user?.role);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{roleLabel}</Text>
            <Text style={styles.title}>Công việc hôm nay</Text>
            <Text style={styles.subtitle}>{displayName}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AdminReadings')}
        >
          <View style={styles.primaryTopRow}>
            <View style={styles.primaryIcon}>
              <Ionicons name="speedometer-outline" size={20} color="#ffffff" />
            </View>
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>Ưu tiên</Text>
            </View>
          </View>
          <View style={styles.primaryContent}>
            <Text style={styles.primaryTitle}>Chốt điện/nước</Text>
            <Text style={styles.primaryText}>Nhập chỉ số theo tòa, tầng, phòng khi đi kiểm tra.</Text>
          </View>
          <View style={styles.primaryFooter}>
            <Text style={styles.primaryActionText}>Mở danh sách phòng</Text>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tác vụ nhanh</Text>
          <Text style={styles.sectionMeta}>4 mục</Text>
        </View>

        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.screen}
              style={styles.actionCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.background }]}>
                <Ionicons
                  name={action.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={action.accent}
                />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.noticeCard}>
          <Ionicons name="information-circle-outline" size={17} color="#1A4B84" />
          <Text style={styles.noticeText}>
            App chỉ giữ các tác vụ hiện trường. Các cấu hình chi tiết vẫn xử lý trên web quản lý.
          </Text>
        </View>
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
    padding: 12,
    paddingBottom: 86,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  eyebrow: {
    color: '#1A4B84',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 3,
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  primaryCard: {
    borderRadius: 18,
    backgroundColor: '#1A4B84',
    padding: 14,
    shadowColor: '#1A4B84',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  primaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadge: {
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 9,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
  },
  primaryBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  primaryContent: {
    marginBottom: 12,
  },
  primaryTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  primaryText: {
    color: '#dbeafe',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  primaryFooter: {
    height: 32,
    borderRadius: 11,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeader: {
    marginTop: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
  },
  sectionMeta: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionCard: {
    width: '48.8%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  actionTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
  },
  actionSubtitle: {
    color: '#64748b',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },
  noticeCard: {
    marginTop: 10,
    borderRadius: 13,
    padding: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexDirection: 'row',
    gap: 7,
  },
  noticeText: {
    flex: 1,
    color: '#1e3a8a',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
});
