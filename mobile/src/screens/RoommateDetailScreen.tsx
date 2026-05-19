import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { formatCurrency, postDetail } from './roommateData';

export default function RoommateDetailScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={16} color="#6B7280" />
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Chi tiết bài đăng</Text>
              <Text style={styles.subTitle}>Bài đăng #{postDetail.id}</Text>
            </View>
            <View style={[styles.statusBadge, postDetail.status === 'open' ? styles.openStatus : styles.closedStatus]}>
              <Ionicons
                name={postDetail.status === 'open' ? 'lock-open-outline' : 'lock-closed-outline'}
                size={12}
                color={postDetail.status === 'open' ? '#15803D' : '#4B5563'}
              />
              <Text style={[styles.statusText, postDetail.status === 'open' ? styles.openText : styles.closedText]}>
                {postDetail.status === 'open' ? 'Đang mở' : 'Đã khóa'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Ngày đăng" value={postDetail.postedDate} />
          <StatCard label="Lượt xem" value={`${postDetail.views}`} icon="eye-outline" />
          <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('RoommateMessages')}>
            <View style={styles.statValueRow}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color="#1A4B84" />
              <Text style={styles.statValuePrimary}>{postDetail.pendingMessages}</Text>
            </View>
            <Text style={styles.statLabelPrimary}>Tin nhắn chờ</Text>
          </TouchableOpacity>
        </View>

        <SectionCard title="Thông tin phòng">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
            {postDetail.roomInfo.images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.roomImage} />
            ))}
          </ScrollView>

          <View style={styles.infoGrid}>
            <InfoField label="Mã phòng" value={postDetail.roomInfo.roomCode} />
            <InfoField label="Vị trí" value={postDetail.roomInfo.location} />
            <InfoField label="Diện tích" value={postDetail.roomInfo.area} />
            <InfoField label="Số người tối đa" value={`${postDetail.roomInfo.maxOccupants} người`} />
            <InfoField label="Giá thuê" value={`${formatCurrency(postDetail.roomInfo.rentPrice)} VNĐ/tháng`} />
            <InfoField label="Loại phòng" value={postDetail.roomInfo.roomType} />
          </View>

          <View style={styles.amenityRow}>
            <Ionicons
              name={postDetail.roomInfo.hasPrivateBathroom ? 'checkmark-circle' : 'close-circle-outline'}
              size={16}
              color={postDetail.roomInfo.hasPrivateBathroom ? '#16A34A' : '#6B7280'}
            />
            <Text style={styles.amenityText}>
              {postDetail.roomInfo.hasPrivateBathroom ? 'Có vệ sinh khép kín' : 'Không có vệ sinh khép kín'}
            </Text>
          </View>

          <Text style={styles.innerTitle}>Tiện nghi:</Text>
          <View style={styles.tagsWrap}>
            {postDetail.roomInfo.amenities.map((amenity) => (
              <View key={amenity} style={styles.tag}>
                <Text style={styles.tagText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Thông tin đăng bài">
          <View style={styles.twoStatRow}>
            <BigStat label="Số người đang ở" value={`${postDetail.currentOccupants} người`} />
            <BigStat label="Cần tìm thêm" value={`${postDetail.needMore} người`} highlighted />
          </View>

          <Text style={styles.innerTitle}>Bảng giá:</Text>
          <View style={styles.tableWrap}>
            <TableRow label="Loại phí" before="Trước khi chia" after="Sau khi chia" isHeader />
            <TableRow
              label="Giá phòng"
              before={`${formatCurrency(postDetail.pricing.roomPrice.before)}đ`}
              after={`${formatCurrency(postDetail.pricing.roomPrice.after)}đ`}
            />
            <TableRow
              label="Tiền điện"
              before={`${formatCurrency(postDetail.pricing.electricity.before)}đ`}
              after={`${formatCurrency(postDetail.pricing.electricity.after)}đ`}
            />
            <TableRow
              label="Tiền nước"
              before={`${formatCurrency(postDetail.pricing.water.before)}đ`}
              after={`${formatCurrency(postDetail.pricing.water.after)}đ`}
            />
            <TableRow
              label="Phí quản lý"
              before={`${formatCurrency(postDetail.pricing.management.before)}đ`}
              after={`${formatCurrency(postDetail.pricing.management.after)}đ`}
            />
          </View>
        </SectionCard>

        <SectionCard title="Thời gian vào ở">
          <View style={styles.iconInfoRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="location-outline" size={16} color="#1A4B84" />
            </View>
            <View>
              <Text style={styles.infoSmallLabel}>Có thể vào ở</Text>
              <Text style={styles.infoSmallValue}>
                {postDetail.moveInType === 'now' ? 'Ở luôn' : `Từ ${postDetail.moveInDate}`}
              </Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Thông tin bổ sung">
          <View style={styles.iconInfoRow}>
            <View style={[styles.iconWrap, { backgroundColor: postDetail.floodZone ? '#FEF3C7' : '#DCFCE7' }]}>
              <Ionicons
                name="warning-outline"
                size={16}
                color={postDetail.floodZone ? '#D97706' : '#16A34A'}
              />
            </View>
            <View>
              <Text style={styles.infoSmallLabel}>Khu vực ngập lụt</Text>
              <Text style={[styles.infoSmallValue, { color: postDetail.floodZone ? '#D97706' : '#16A34A' }]}>
                {postDetail.floodZone ? 'Có' : 'Không'}
              </Text>
            </View>
          </View>

          <Text style={styles.innerTitle}>Yêu cầu từ chủ nhà:</Text>
          <Text style={styles.requirementBox}>{postDetail.requirements}</Text>
        </SectionCard>

        <SectionCard title="Thông tin liên hệ" highlighted>
          <View style={styles.iconInfoRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="person-outline" size={16} color="#1A4B84" />
            </View>
            <View>
              <Text style={styles.infoSmallLabel}>Tên liên hệ</Text>
              <Text style={styles.infoSmallValue}>{postDetail.contactName}</Text>
            </View>
          </View>

          <View style={styles.iconInfoRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="call-outline" size={16} color="#1A4B84" />
            </View>
            <View>
              <Text style={styles.infoSmallLabel}>Số điện thoại</Text>
              <Text style={styles.infoSmallValue}>{postDetail.contactPhone}</Text>
            </View>
          </View>
        </SectionCard>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.bottomButtonOutline} onPress={() => navigation.navigate('RoommateMessages')}>
          <Ionicons name="chatbubble-ellipses-outline" size={15} color="#374151" />
          <Text style={styles.bottomButtonOutlineText}>Tin nhắn chờ ({postDetail.pendingMessages})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomButtonFill} onPress={() => navigation.navigate('RoommateEdit')}>
          <Text style={styles.bottomButtonFillText}>Chỉnh sửa</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SectionCard({
  title,
  children,
  highlighted,
}: {
  title: string;
  children: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <View style={[styles.card, highlighted && styles.highlightCard]}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.statCard}>
      {icon ? (
        <View style={styles.statValueRow}>
          <Ionicons name={icon} size={14} color="#6B7280" />
          <Text style={styles.statValue}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoField}>
      <Text style={styles.infoFieldLabel}>{label}</Text>
      <Text style={styles.infoFieldValue}>{value}</Text>
    </View>
  );
}

function BigStat({ label, value, highlighted }: { label: string; value: string; highlighted?: boolean }) {
  return (
    <View style={[styles.bigStatCard, highlighted && styles.bigStatHighlight]}>
      <Text style={styles.bigStatLabel}>{label}</Text>
      <Text style={styles.bigStatValue}>{value}</Text>
    </View>
  );
}

function TableRow({
  label,
  before,
  after,
  isHeader,
}: {
  label: string;
  before: string;
  after: string;
  isHeader?: boolean;
}) {
  return (
    <View style={[styles.tableRow, isHeader && styles.tableHeader]}>
      <Text style={[styles.tableCell, isHeader && styles.tableHeaderText]}>{label}</Text>
      <Text style={[styles.tableCellRight, isHeader && styles.tableHeaderText]}>{before}</Text>
      <Text style={[styles.tableCellRight, isHeader ? styles.tableHeaderText : styles.tablePrimary]}>{after}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 96,
  },
  headerTop: {
    gap: 6,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backText: {
    fontSize: 13,
    color: '#6B7280',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subTitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  openStatus: {
    backgroundColor: '#DCFCE7',
  },
  closedStatus: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  openText: {
    color: '#15803D',
  },
  closedText: {
    color: '#4B5563',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statValuePrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A4B84',
  },
  statLabel: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
  },
  statLabelPrimary: {
    marginTop: 3,
    fontSize: 12,
    color: '#1A4B84',
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
  },
  highlightCard: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  imageRow: {
    gap: 8,
  },
  roomImage: {
    width: 120,
    height: 90,
    borderRadius: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoField: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
  },
  infoFieldLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  infoFieldValue: {
    marginTop: 2,
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amenityText: {
    fontSize: 13,
    color: '#6B7280',
  },
  innerTitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  tagText: {
    fontSize: 12,
    color: '#374151',
  },
  twoStatRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bigStatCard: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#F3F4F6',
  },
  bigStatHighlight: {
    backgroundColor: '#DBEAFE',
  },
  bigStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  bigStatValue: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: '700',
    color: '#1A4B84',
  },
  tableWrap: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  tableHeader: {
    borderTopWidth: 0,
    backgroundColor: '#F3F4F6',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#111827',
  },
  tableCellRight: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    color: '#6B7280',
  },
  tableHeaderText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  tablePrimary: {
    color: '#1A4B84',
    fontWeight: '600',
  },
  iconInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSmallLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoSmallValue: {
    marginTop: 2,
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  requirementBox: {
    marginTop: 2,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    padding: 10,
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
  },
  bottomActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  bottomButtonOutline: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  bottomButtonOutlineText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  bottomButtonFill: {
    flex: 1,
    height: 42,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A4B84',
  },
  bottomButtonFillText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
