import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { contractService } from '../services/contract.service';
import { postService } from '../services/post.service';
import { MyRoom, roomService } from '../services/room.service';
import type { PostDto } from '../types/dto';
import { resolveImageUrl } from '../utils/image';

const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.round(value || 0)));

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleDateString('vi-VN');
};

export default function RoommateDetailScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<PostDto | null>(null);
  const [room, setRoom] = useState<MyRoom | null>(null);
  const [currentOccupants, setCurrentOccupants] = useState<number>(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [myPost, myRoom] = await Promise.all([postService.getMyPost(), roomService.getMyRoom()]);
      setPost(myPost);
      setRoom(myRoom);

      const contract = await contractService.getById(myRoom.contractId);
      const now = new Date();
      const activeResidents = contract.residents.filter((resident) => {
        if (!resident.toDate) return true;
        const toDate = new Date(resident.toDate);
        return !Number.isNaN(toDate.getTime()) && toDate > now;
      }).length;
      setCurrentOccupants(myPost.currentOccupants ?? activeResidents);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không thể tải chi tiết bài đăng');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const needMore = post?.maxOccupants != null ? Math.max(0, post.maxOccupants - currentOccupants) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Chi tiết bài đăng</Text>
            <Text style={styles.subtitle}>Tìm người ở cùng</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color="#1A4B84" /></View>
        ) : error ? (
          <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View>
        ) : post ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{post.title}</Text>
              <Text style={styles.itemText}>Mã phòng: {post.roomCode}</Text>
              <Text style={styles.itemText}>Tòa: {post.buildingName} - Tầng {post.floorNumber}</Text>
              <Text style={styles.itemText}>Giá thuê: {formatCurrency(post.baseRentPrice)} VNĐ/tháng</Text>
              <Text style={styles.itemText}>Đăng ngày: {formatDate(post.postDate)}</Text>
              <Text style={styles.itemText}>Trạng thái: {post.isLocked ? 'Đã khóa' : 'Đang mở'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sức chứa phòng</Text>
              <Text style={styles.itemText}>Đang ở: {currentOccupants} người</Text>
              <Text style={styles.itemText}>Tối đa: {post.maxOccupants ?? room?.maxOccupants ?? 'Chưa cập nhật'} người</Text>
              <Text style={styles.itemText}>Cần thêm: {needMore ?? 'Chưa xác định'} người</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Điều kiện vào ở</Text>
              <Text style={styles.itemText}>Có thể vào ở: {post.moveInType === 'from-date' ? `Từ ${formatDate(post.moveInDate)}` : 'Ở luôn'}</Text>
              <Text style={styles.itemText}>Khu vực ngập lụt: {post.floodProne ? 'Có' : 'Không'}</Text>
              <Text style={styles.itemText}>Yêu cầu: {post.landlordRequirements || 'Không có'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Giá dịch vụ</Text>
              {post.servicePrices.length ? (
                post.servicePrices.map((item) => (
                  <View key={`${item.key}-${item.name}`} style={styles.serviceRow}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    <Text style={styles.servicePrice}>{formatCurrency(item.price)} {item.unit || ''}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.itemText}>Chưa có cấu hình giá dịch vụ.</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tiện nghi</Text>
              {post.amenities?.length ? (
                <View style={styles.amenityList}>
                  {post.amenities.map((amenity, idx) => (
                    <View key={`${amenity}-${idx}`} style={styles.amenityTag}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.itemText}>Chưa có tiện nghi.</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ảnh bài đăng</Text>
              {post.imageUrls?.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {post.imageUrls.map((url, idx) => (
                    <Image key={`${url}-${idx}`} source={{ uri: resolveImageUrl(url) }} style={styles.postImage} />
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.itemText}>Chưa có ảnh.</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Liên hệ</Text>
              <Text style={styles.itemText}>Tên: {post.contactName}</Text>
              <Text style={styles.itemText}>SĐT: {post.contactPhone}</Text>
              <Text style={styles.itemText}>Kiểu liên hệ: {post.contactType === 'other' ? 'Thủ công' : 'Tài khoản hiện tại'}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('RoommateMessages')}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#374151" />
          <Text style={styles.outlineText}>Tin nhắn ({post?.messages ?? 0})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.replace('RoommateEdit')}>
          <Text style={styles.primaryText}>Chỉnh sửa</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, gap: 12, paddingBottom: 96 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 2, fontSize: 13, color: '#6B7280' },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  itemText: { fontSize: 14, color: '#374151' },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceName: { fontSize: 14, color: '#374151' },
  servicePrice: { fontSize: 14, fontWeight: '600', color: '#111827' },
  amenityList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityTag: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F9FAFB' },
  amenityText: { fontSize: 12, color: '#374151' },
  postImage: { width: 120, height: 90, borderRadius: 10, marginRight: 8, backgroundColor: '#F3F4F6' },
  errorCard: { borderRadius: 12, backgroundColor: '#FEE2E2', padding: 12 },
  errorText: { color: '#B91C1C', fontSize: 14 },
  bottomActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    gap: 10,
  },
  outlineBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  outlineText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  primaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1A4B84',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
