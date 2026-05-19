import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { conversations } from './roommateData';

export default function RoommateMessagesScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');

  const pendingMessages = useMemo(() => conversations.filter((item) => item.unread), []);
  const oldMessages = useMemo(() => conversations.filter((item) => !item.unread), []);
  const totalPending = useMemo(
    () => pendingMessages.reduce((sum, item) => sum + item.unreadCount, 0),
    [pendingMessages]
  );

  const filterConversations = (items: typeof conversations) =>
    items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const filteredPending = filterConversations(pendingMessages);
  const filteredOld = filterConversations(oldMessages);

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

      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredPending.length > 0 && (
          <View>
            <View style={styles.pendingSectionHeader}>
              <Text style={styles.pendingSectionTitle}>Tin nhắn chờ ({filteredPending.length})</Text>
            </View>
            {filteredPending.map((conversation) => (
              <ConversationItem key={conversation.id} onPress={() => Alert.alert('Tin nhắn', 'Đang mở hội thoại...')} {...conversation} />
            ))}
          </View>
        )}

        {filteredOld.length > 0 && (
          <View>
            <View style={styles.oldSectionHeader}>
              <Text style={styles.oldSectionTitle}>Tin nhắn cũ</Text>
            </View>
            {filteredOld.map((conversation) => (
              <ConversationItem key={conversation.id} onPress={() => Alert.alert('Tin nhắn', 'Đang mở hội thoại...')} {...conversation} />
            ))}
          </View>
        )}

        {filteredPending.length === 0 && filteredOld.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{searchQuery ? 'Không tìm thấy tin nhắn' : 'Chưa có tin nhắn nào'}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type ConversationItemProps = (typeof conversations)[number] & {
  onPress: () => void;
};

function ConversationItem({
  name,
  avatar,
  lastMessage,
  time,
  unread,
  unreadCount,
  isOnline,
  onPress,
}: ConversationItemProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.conversationCard, unread && styles.unreadCard]}>
      <View style={styles.avatarWrap}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        {isOnline && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationTop}>
          <Text style={[styles.nameText, unread && styles.nameTextUnread]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.timeText, unread && styles.timeTextUnread]}>{time}</Text>
        </View>
        <View style={styles.conversationBottom}>
          <Text style={[styles.messageText, unread && styles.messageTextUnread]} numberOfLines={1}>
            {lastMessage}
          </Text>
          {unread ? (
            unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            ) : null
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
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
