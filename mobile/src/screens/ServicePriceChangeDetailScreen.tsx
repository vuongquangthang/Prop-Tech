import React, { useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Notification } from '../services/notification.service';
import { palette, radius } from '../theme/palette';

type PriceChangeInfo = {
  serviceId?: number;
  serviceName?: string;
  oldPrice?: number;
  newPrice?: number;
  effectiveDate?: string;
};

const formatCurrency = (value?: number) => {
  if (value == null || Number.isNaN(value)) return 'Chưa có dữ liệu';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatDate = (value?: string) => {
  if (!value) return 'Chưa có dữ liệu';
  const normalized = value.includes('/') ? value.split('/').reverse().join('-') : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

const parseNumber = (value?: string | null) => {
  if (!value) return undefined;
  const normalized = value.replace(/[^\d.-]/g, '');
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseLinkUrl = (linkUrl?: string | null): PriceChangeInfo => {
  if (!linkUrl) return {};
  const query = linkUrl.includes('?') ? linkUrl.split('?')[1] : linkUrl;
  const params = new URLSearchParams(query);
  return {
    serviceId: parseNumber(params.get('serviceId')),
    serviceName: params.get('serviceName') || undefined,
    oldPrice: parseNumber(params.get('oldPrice')),
    newPrice: parseNumber(params.get('newPrice')),
    effectiveDate: params.get('effectiveDate') || undefined,
  };
};

const parseContent = (notification: Notification): PriceChangeInfo => {
  const titleMatch = notification.title.match(/Thay đổi giá dịch vụ\s+(.+)$/i);
  const contentMatch = notification.content.match(/dịch vụ\s+(.+?)\s+thay đổi từ\s+([\d.,]+)\s+VNĐ\s+lên\s+([\d.,]+)\s+VNĐ,\s+áp dụng từ\s+(\d{2}\/\d{2}\/\d{4})/i);
  return {
    serviceName: contentMatch?.[1] || titleMatch?.[1],
    oldPrice: parseNumber(contentMatch?.[2]),
    newPrice: parseNumber(contentMatch?.[3]),
    effectiveDate: contentMatch?.[4],
  };
};

const mergeInfo = (notification: Notification): PriceChangeInfo => {
  const fromLink = parseLinkUrl(notification.linkUrl);
  const fromContent = parseContent(notification);
  return {
    serviceId: fromLink.serviceId ?? notification.relatedId,
    serviceName: fromLink.serviceName ?? fromContent.serviceName,
    oldPrice: fromLink.oldPrice ?? fromContent.oldPrice,
    newPrice: fromLink.newPrice ?? fromContent.newPrice,
    effectiveDate: fromLink.effectiveDate ?? fromContent.effectiveDate,
  };
};

export default function ServicePriceChangeDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const notification = route.params?.notification as Notification | undefined;

  const info = useMemo(
    () => notification ? mergeInfo(notification) : {},
    [notification],
  );

  if (!notification) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Không tìm thấy thông tin thay đổi giá.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSideButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết thay đổi</Text>
        <View style={styles.headerRightSlot} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.iconWrap}>
            <Ionicons name="pricetag-outline" size={24} color={palette.primary} />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.eyebrow}>THAY ĐỔI GIÁ DỊCH VỤ</Text>
            <Text style={styles.title}>{info.serviceName || notification.title}</Text>
            <Text style={styles.subText}>
              Thông báo lúc {new Date(notification.createdAt).toLocaleString('vi-VN')}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin điều chỉnh</Text>
          <View style={styles.priceRow}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Giá cũ</Text>
              <Text style={styles.oldPrice}>{formatCurrency(info.oldPrice)}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={palette.textMuted} />
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Giá mới</Text>
              <Text style={styles.newPrice}>{formatCurrency(info.newPrice)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày áp dụng</Text>
            <Text style={styles.infoValue}>{formatDate(info.effectiveDate)}</Text>
          </View>
          {info.serviceId ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mã dịch vụ</Text>
              <Text style={styles.infoValue}>#{info.serviceId}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ảnh hưởng đến hợp đồng</Text>
          <View style={styles.noteRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={palette.success} />
            <Text style={styles.noteText}>Phòng và hợp đồng có dùng dịch vụ này được cập nhật theo ngày áp dụng.</Text>
          </View>
          <View style={styles.noteRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={palette.primary} />
            <Text style={styles.noteText}>Hóa đơn đã xuất trước ngày áp dụng vẫn giữ nguyên đơn giá cũ theo snapshot.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Nội dung thông báo</Text>
          <Text style={styles.contentText}>{notification.content}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 14, color: palette.textMuted, textAlign: 'center' },
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
  content: { padding: 16, gap: 12, paddingBottom: 28 },
  heroCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    padding: 16,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '800', color: palette.primary, letterSpacing: 0.8 },
  title: { marginTop: 4, fontSize: 20, fontWeight: '800', color: palette.text },
  subText: { marginTop: 6, fontSize: 12, color: palette.textMuted },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    padding: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: palette.text, marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  priceBox: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceSoft,
    padding: 12,
  },
  priceLabel: { fontSize: 12, color: palette.textMuted, marginBottom: 4 },
  oldPrice: { fontSize: 15, fontWeight: '800', color: palette.textMuted },
  newPrice: { fontSize: 15, fontWeight: '800', color: palette.primary },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
  },
  infoLabel: { fontSize: 13, color: palette.textMuted },
  infoValue: { flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '700', color: palette.text },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  noteText: { flex: 1, fontSize: 13, color: palette.text, lineHeight: 19 },
  contentText: { fontSize: 13, color: palette.text, lineHeight: 20 },
});
