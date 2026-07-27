import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
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
import { palette, radius } from '../theme/palette';

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
  const [activeTab, setActiveTab] = useState<'replied' | 'pending'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(() => postMessageService.getCachedConversations().length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<PostConversationDto[]>(() => postMessageService.getCachedConversations());

  const loadConversations = useCallback(async (silent = false, force = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const items = await postMessageService.getConversations(force);
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
      const cachedConversations = postMessageService.getCachedConversations();
      if (cachedConversations.length > 0) {
        setConversations(cachedConversations);
        setLoading(false);
        if (!postMessageService.hasFreshConversationCache()) {
          loadConversations(true);
        }
      } else {
        loadConversations();
      }
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
  const repliedMessages = filteredConversations.filter((item) => !item.isUnread);
  const displayedMessages = activeTab === 'pending' ? pendingMessages : repliedMessages;
  const totalPending = pendingMessages.reduce((sum, item) => sum + item.unreadCount, 0);
  const emptyText = searchQuery
    ? 'Không tìm thấy tin nhắn'
    : activeTab === 'pending'
      ? 'Không có tin nhắn chờ phản hồi'
      : 'Chưa có đoạn chat đã phản hồi';

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('RoommatePost');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={palette.text} />
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
        <Ionicons name="search-outline" size={18} color={palette.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm tin nhắn..."
          placeholderTextColor={palette.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabCard}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'replied' && styles.tabButtonActive]}
          onPress={() => setActiveTab('replied')}
        >
          <Text style={[styles.tabText, activeTab === 'replied' && styles.tabTextActive]}>
            Đã phản hồi
          </Text>
          <Text style={[styles.tabCount, activeTab === 'replied' && styles.tabCountActive]}>
            {repliedMessages.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Tin nhắn chờ
          </Text>
          <Text style={[styles.tabCount, activeTab === 'pending' && styles.tabCountActive]}>
            {pendingMessages.length}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadConversations()}>
            <Text style={styles.retryText}>Tải lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedMessages}
          keyExtractor={(conversation) => `${conversation.postId}-${conversation.otherUserId}`}
          renderItem={({ item }) => (
            <ConversationItem
              item={item}
              onPress={() =>
                navigation.navigate('RoommateConversation', {
                  conversationId: item.conversationId,
                })
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadConversations(true, true);
          }} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons
                name={activeTab === 'pending' ? 'mail-open-outline' : 'chatbubbles-outline'}
                size={32}
                color={palette.textMuted}
              />
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          }
        />
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
            <Ionicons name="checkmark-done" size={16} color={palette.primary} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSoft,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  headerTitle: {
    position: 'absolute',
    left: 72,
    right: 72,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: palette.text,
  },
  pendingBadge: {
    backgroundColor: palette.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 2,
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
    borderColor: palette.borderSoft,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.surface,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: palette.text,
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
    backgroundColor: palette.dangerSoft,
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    color: palette.danger,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: palette.primary,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  tabCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: palette.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.surfaceSoft,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 11,
    fontWeight: '700',
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listSeparator: {
    height: 10,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 3,
  },
  unreadCard: {
    backgroundColor: '#F6FBFF',
    borderColor: '#A7E1FF',
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
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: palette.primaryDark,
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
    color: palette.text,
  },
  nameTextUnread: {
    fontWeight: '700',
  },
  postMeta: {
    marginTop: 2,
    fontSize: 12,
    color: palette.textMuted,
  },
  timeText: {
    fontSize: 12,
    color: palette.textMuted,
  },
  timeTextUnread: {
    color: palette.primary,
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
    color: palette.textMuted,
  },
  messageTextUnread: {
    color: palette.text,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.primary,
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
    color: palette.textMuted,
  },
});
