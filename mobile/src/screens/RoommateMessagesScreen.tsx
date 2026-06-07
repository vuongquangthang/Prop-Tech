import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { postMessageService } from '../services/post-message.service';
import { PostConversationDto } from '../types/dto';

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Vừa xong';

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày`;
  return date.toLocaleDateString('vi-VN');
};

export default function RoommateMessagesScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<PostConversationDto[]>([]);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const items = await postMessageService.getConversations();
      setConversations(items);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không thể tải danh sách tin nhắn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter(
      (item) =>
        item.otherUserName.toLowerCase().includes(query) ||
        item.roomCode.toLowerCase().includes(query) ||
        item.postTitle.toLowerCase().includes(query) ||
        item.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const pendingMessages = filteredConversations.filter((item) => item.isUnread);
  const oldMessages = filteredConversations.filter((item) => !item.isUnread);
  const totalPending = pendingMessages.reduce((sum, item) => sum + item.unreadCount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        {totalPending > 0 ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{totalPending} chờ</Text>
          </View>
        ) : (
          <View style={{ width: 52 }} />
        )}
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm tin nhắn..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A4B84" />
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadConversations()}>
            <Text style={styles.retryText}>Tải lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadConversations(true);
          }} />}
        >
          {pendingMessages.length > 0 && (
            <View>
              <View style={styles.pendingSectionHeader}>
                <Text style={styles.pendingSectionTitle}>Tin nhắn chờ ({pendingMessages.length})</Text>
              </View>
              {pendingMessages.map((conversation) => (
                <ConversationItem
                  key={`${conversation.postId}-${conversation.otherUserId}`}
                  item={conversation}
                  onPress={() =>
                    navigation.navigate('RoommateConversation', {
                      conversationId: conversation.conversationId,
                    })
                  }
                />
              ))}
            </View>
          )}

          {oldMessages.length > 0 && (
            <View>
              <View style={styles.oldSectionHeader}>
                <Text style={styles.oldSectionTitle}>Tin nhắn cũ</Text>
              </View>
              {oldMessages.map((conversation) => (
                <ConversationItem
                  key={`${conversation.postId}-${conversation.otherUserId}`}
                  item={conversation}
                  onPress={() =>
                    navigation.navigate('RoommateConversation', {
                      conversationId: conversation.conversationId,
                    })
                  }
                />
              ))}
            </View>
          )}

          {filteredConversations.length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{searchQuery ? 'Không tìm thấy tin nhắn' : 'Chưa có tin nhắn nào'}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ConversationItem({
  item,
  onPress,
}: {
  item: PostConversationDto;
  onPress: () => void;
}) {
  const initials = item.otherUserName.trim().slice(0, 1).toUpperCase();

  return (
    <TouchableOpacity onPress={onPress} style={[styles.conversationCard, item.isUnread && styles.unreadCard]}>
      <View style={styles.avatarWrap}>
        {item.otherUserAvatarUrl ? (
          <Image source={{ uri: item.otherUserAvatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{initials}</Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationTop}>
          <Text style={[styles.nameText, item.isUnread && styles.nameTextUnread]} numberOfLines={1}>
            {item.otherUserName}
          </Text>
          <Text style={[styles.timeText, item.isUnread && styles.timeTextUnread]}>
            {formatRelativeTime(item.lastMessageAt)}
          </Text>
        </View>
        <Text style={styles.postMeta} numberOfLines={1}>
          {item.roomCode} · {item.postTitle}
        </Text>
        <View style={styles.conversationBottom}>
          <Text style={[styles.messageText, item.isUnread && styles.messageTextUnread]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.isUnread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          ) : (
            <Ionicons name="checkmark-done" size={16} color="#1A4B84" />
          )}
        </View>
      </View>
    </TouchableOpacity>
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
    justifyContent: 'space-between',
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
    flex: 1,
    marginLeft: 6,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  pendingBadge: {
    backgroundColor: '#1A4B84',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  searchWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    height: 42,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A4B84',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pendingSectionHeader: {
    backgroundColor: '#EFF6FF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pendingSectionTitle: {
    fontSize: 12,
    color: '#1A4B84',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  oldSectionHeader: {
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  oldSectionTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  unreadCard: {
    backgroundColor: '#F8FAFF',
  },
  avatarWrap: {
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 16,
  },
  conversationContent: {
    flex: 1,
  },
  conversationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  nameText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  nameTextUnread: {
    fontWeight: '700',
  },
  postMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  timeTextUnread: {
    color: '#1A4B84',
    fontWeight: '600',
  },
  conversationBottom: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  messageTextUnread: {
    color: '#111827',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1A4B84',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyWrap: {
    paddingVertical: 56,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
