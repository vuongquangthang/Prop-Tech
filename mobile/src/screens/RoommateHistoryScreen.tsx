import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { editHistory } from './roommateData';

export default function RoommateHistoryScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Lịch sử chỉnh sửa</Text>
          <Text style={styles.headerSub}>Phòng B-105</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {editHistory.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, item.isCurrent && styles.currentCard]}
            onPress={() => Alert.alert('Lịch sử', `Đang mở ${item.version}`)}
          >
            <View style={styles.cardTop}>
              <View style={styles.versionWrap}>
                <Text style={styles.versionText}>{item.version}</Text>
                {item.isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Hiện tại</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </View>

            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={12} color="#6B7280" />
              <Text style={styles.timeText}>
                {item.date} lúc {item.time}
              </Text>
            </View>

            <View style={styles.changeList}>
              {item.changes.map((change, idx) => (
                <Text key={`${item.id}-${idx}`} style={styles.changeText}>
                  • {change}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  currentCard: {
    borderColor: '#BFDBFE',
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
  timeRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  changeList: {
    marginTop: 8,
    gap: 2,
  },
  changeText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
});
