import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { chatService } from '../services/chat.service';
import { ChatMessage } from '../types/chat';
import { normalizeApiError } from '../types/api';
import { useAuthStore } from '../store/authStore';
import { isAdminAppUser } from '../utils/roleUtils';

type RouteParams = { conversationId?: string };

export default function ChatbotScreen() {
  const navigation = useNavigation<any>();
  const canManageDocuments = isAdminAppUser(useAuthStore(state => state.user));
  const route = useRoute();
  const initialId = (route.params as RouteParams | undefined)?.conversationId ?? null;
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [conversationId, setConversationId] = useState<string | null>(initialId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(Boolean(initialId));
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await chatService.getMessages(id);
      setMessages(result.items);
      setConversationId(id);
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialId) loadHistory(initialId);
  }, [initialId, loadHistory]);

  useEffect(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [messages, sending]);

  const send = async (text = input) => {
    const question = text.trim();
    if (!question || sending) return;
    const optimistic: ChatMessage = {
      message_id: `local-${Date.now()}`, role: 'user', content: question,
      created_at: new Date().toISOString(), pending: true,
    };
    setMessages(current => [...current, optimistic]);
    setInput('');
    setSending(true);
    setError(null);
    try {
      const response = await chatService.sendMessage({
        conversation_id: conversationId,
        question,
      });
      setConversationId(response.conversation_id);
      setMessages(current => [
        ...current.map(item => item.message_id === optimistic.message_id
          ? { ...item, pending: false } : item),
        { ...response.message, sources: response.sources },
      ]);
    } catch (e) {
      setMessages(current => current.map(item =>
        item.message_id === optimistic.message_id
          ? { ...item, pending: false, failed: true } : item,
      ));
      setError(normalizeApiError(e).message);
    } finally {
      setSending(false);
    }
  };

  const newConversation = () => {
    setConversationId(null);
    setMessages([]);
    setInput('');
    setError(null);
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={25} color="#1A4B84" />
        </TouchableOpacity>
        <Text style={styles.title}>Trợ lý tòa nhà</Text>
        <View style={styles.headerActions}>
          {canManageDocuments && (
            <TouchableOpacity onPress={() => navigation.navigate('DocumentList')}>
              <Ionicons name="document-text-outline" size={22} color="#1A4B84" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('ConversationList')}>
            <Ionicons name="time-outline" size={23} color="#1A4B84" />
          </TouchableOpacity>
          <TouchableOpacity onPress={newConversation}>
            <Ionicons name="add-circle-outline" size={24} color="#1A4B84" />
          </TouchableOpacity>
        </View>
      </View>
      {error && <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.message_id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Hãy bắt đầu một cuộc trò chuyện.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.user : styles.assistant]}>
            <Text style={item.role === 'user' ? styles.userText : styles.assistantText}>
              {item.content}
            </Text>
            <Text style={styles.time}>{new Date(item.created_at).toLocaleTimeString()}</Text>
            {item.failed && (
              <TouchableOpacity onPress={() => send(item.content)}>
                <Text style={styles.retry}>Thử lại</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListFooterComponent={sending ? (
          <View style={[styles.bubble, styles.assistant]}>
            <Text>Trợ lý đang trả lời...</Text><ActivityIndicator size="small" />
          </View>
        ) : null}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input} value={input} onChangeText={setInput}
            placeholder="Nhập câu hỏi..." multiline
          />
          <TouchableOpacity
            style={[styles.send, (!input.trim() || sending) && styles.disabled]}
            disabled={!input.trim() || sending} onPress={() => send()}
          >
            <Ionicons name="send" size={19} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 14 },
  list: { padding: 16, flexGrow: 1 },
  empty: { textAlign: 'center', marginTop: 80, color: '#64748B' },
  bubble: { maxWidth: '86%', padding: 12, borderRadius: 16, marginBottom: 12 },
  user: { alignSelf: 'flex-end', backgroundColor: '#1A4B84' },
  assistant: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  userText: { color: '#fff' }, assistantText: { color: '#1E293B' },
  time: { fontSize: 10, color: '#94A3B8', marginTop: 5 },
  retry: { color: '#DC2626', fontWeight: '600', marginTop: 6 },
  error: { backgroundColor: '#FEE2E2', padding: 10 },
  errorText: { color: '#991B1B', textAlign: 'center' },
  inputRow: { padding: 12, flexDirection: 'row', gap: 8, backgroundColor: '#fff' },
  input: { flex: 1, maxHeight: 100, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10 },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1A4B84', alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
});
