import React, { useCallback, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { postService } from '../services/post.service';
import type { PostEditHistoryDto } from '../types/dto';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return `${date.toLocaleDateString('vi-VN')} lúc ${date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export default function RoommateHistoryScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomLabel, setRoomLabel] = useState('Chưa cập nhật');
  const [history, setHistory] = useState<PostEditHistoryDto[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const post = await postService.getMyPost();
      setRoomLabel(`${post.roomCode} • ${post.buildingName}`);
      setHistory(await postService.getHistory(post.id));
    } catch (e: any) {
      setHistory([]);
      setError(e?.response?.data?.message || e?.message || 'Không thể tải lịch sử chỉnh sửa');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Lịch sử chỉnh sửa</Text>
          <Text style={styles.headerSub}>{roomLabel}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1A4B84" />
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {history.length > 0 ? (
            history.map((item) => (
              <View key={item.id} style={[styles.card, item.isCurrent && styles.currentCard]}>
                <View style={styles.cardTop}>
                  <View style={styles.versionWrap}>
                    <Text style={styles.versionText}>{item.version}</Text>
                    {item.isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Hiện tại</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="time-outline" size={18} color="#9CA3AF" />
                </View>

                <Text style={styles.summaryText}>{item.summary}</Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{formatDateTime(item.changedAt)}</Text>
                  {item.changedBy ? <Text style={styles.metaText}>Bởi {item.changedBy}</Text> : null}
                </View>

                <View style={styles.changeList}>
                  {item.changes.map((change, idx) => (
                    <Text key={`${item.id}-${idx}`} style={styles.changeText}>
                      • {change}
                    </Text>
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="time-outline" size={28} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>Chưa có lịch sử chỉnh sửa</Text>
              <Text style={styles.emptySub}>Mọi thay đổi tiếp theo sẽ được lưu tự động ở đây.</Text>
            </View>
          )}
        </ScrollView>
      )}
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
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSub: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  currentCard: {
    backgroundColor: '#EFF6FF',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  versionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  versionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  currentBadge: {
    borderRadius: 999,
    backgroundColor: '#1A4B84',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  currentBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryText: {
    marginTop: 8,
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  changeList: {
    marginTop: 10,
    gap: 4,
  },
  changeText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  errorCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#1A4B84',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
