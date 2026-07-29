import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, RefreshControl, SafeAreaView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { chatService } from '../services/chat.service';
import { Conversation } from '../types/chat';
import { normalizeApiError } from '../types/api';

export default function ConversationListScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await chatService.getConversations();
      setItems(result.items);
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const confirmDelete = (item: Conversation) => Alert.alert(
    'Xóa cuộc trò chuyện', `Bạn muốn xóa “${item.title}”?`,
    [{ text: 'Hủy', style: 'cancel' }, {
      text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await chatService.deleteConversation(item.conversation_id);
          setItems(current => current.filter(x => x.conversation_id !== item.conversation_id));
        } catch (e) { Alert.alert('Không thể xóa', normalizeApiError(e).message); }
      },
    }],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></TouchableOpacity>
        <Text style={styles.title}>Cuộc trò chuyện</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Chatbot')}><Text style={styles.newText}>Mới</Text></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={styles.loading} /> : (
        <FlatList
          data={items} keyExtractor={item => item.conversation_id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<Text style={styles.empty}>{error || 'Chưa có cuộc trò chuyện.'}</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate('Chatbot', { conversationId: item.conversation_id })}
              onLongPress={() => confirmDelete(item)}
            >
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.preview} numberOfLines={1}>{item.last_message || 'Chưa có tin nhắn'}</Text>
              <Text style={styles.meta}>{item.message_count} tin nhắn · {new Date(item.updated_at).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  back: { fontSize: 32, color: '#1A4B84' }, title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  newText: { color: '#1A4B84', fontWeight: '700' }, loading: { marginTop: 60 },
  empty: { textAlign: 'center', color: '#64748B', marginTop: 80 },
  item: { backgroundColor: '#fff', padding: 16, marginHorizontal: 14, marginTop: 12, borderRadius: 12 },
  itemTitle: { fontWeight: '700', color: '#0F172A' }, preview: { color: '#475569', marginTop: 5 },
  meta: { color: '#94A3B8', fontSize: 11, marginTop: 7 },
});
