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
import { palette, radius } from '../../theme/palette';

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
    accent: palette.secondary,
    background: palette.secondarySoft,
  },
  {
    title: 'Sự cố',
    subtitle: 'Xử lý, nghiệm thu',
    icon: 'construct-outline',
    screen: 'AdminMaintenance',
    accent: palette.warning,
    background: '#FEF3C7',
  },
  {
    title: 'Bài đăng',
    subtitle: 'Tạo, khóa/mở bài',
    icon: 'megaphone-outline',
    screen: 'AdminPosts',
    accent: palette.accent,
    background: palette.accentSoft,
  },
  {
    title: 'Tài khoản',
    subtitle: 'Thông tin quản lý',
    icon: 'person-outline',
    screen: 'AdminProfile',
    accent: palette.primary,
    background: palette.primarySoft,
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
              <Ionicons name="speedometer-outline" size={20} color={palette.surface} />
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
            <Ionicons name="arrow-forward" size={16} color={palette.surface} />
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
          <Ionicons name="information-circle-outline" size={17} color={palette.primary} />
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
    backgroundColor: palette.background,
  },
  container: {
    padding: 16,
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
    color: palette.primary,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 3,
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  primaryCard: {
    borderRadius: radius.xl,
    backgroundColor: palette.primary,
    padding: 14,
    shadowColor: palette.primary,
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
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadge: {
    height: 24,
    borderRadius: radius.md,
    paddingHorizontal: 9,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
  },
  primaryBadgeText: {
    color: palette.surface,
    fontSize: 10,
    fontWeight: '800',
  },
  primaryContent: {
    marginBottom: 12,
  },
  primaryTitle: {
    color: palette.surface,
    fontSize: 18,
    fontWeight: '900',
  },
  primaryText: {
    color: '#DDF4FF',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  primaryFooter: {
    height: 32,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryActionText: {
    color: palette.surface,
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
    color: palette.text,
    fontSize: 13,
    fontWeight: '900',
  },
  sectionMeta: {
    color: palette.textMuted,
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
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 31,
    height: 31,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  actionTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '900',
  },
  actionSubtitle: {
    color: palette.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },
  noticeCard: {
    marginTop: 10,
    borderRadius: radius.lg,
    padding: 10,
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    flexDirection: 'row',
    gap: 7,
  },
  noticeText: {
    flex: 1,
    color: palette.primaryDark,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
});
