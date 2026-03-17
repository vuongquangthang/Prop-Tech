import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiService from '../services/api.service';

interface Message {
  id: string;
  type: 'bot' | 'user';
  text: string;
}

const MessageItem = memo(({ item }: { item: Message }) => {
  if (item.type === 'bot') {
    return (
      <View style={styles.messageWrapper}>
        <View style={styles.botMessageContainer}>
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubbles" size={18} color="#1A4B84" />
          </View>
          <View style={styles.botMessage}>
            <Text style={styles.botMessageText}>{item.text}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.messageWrapper}>
      <View style={styles.userMessageContainer}>
        <View style={styles.userMessage}>
          <Text style={styles.userMessageText}>{item.text}</Text>
        </View>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={18} color="#6B7280" />
        </View>
      </View>
    </View>
  );
});

export default function ChatbotScreen() {
  const navigation = useNavigation();
  const listRef = useRef<FlatList<Message>>(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: 'Chào bạn! Tôi là trợ lý AI của SmartHome. Tôi có thể giúp bạn giải thích hóa đơn, tra cứu nội quy hoặc hướng dẫn thanh toán.',
    },
  ]);

  useEffect(() => {
    // Keep latest message visible.
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Load chat history from backend
    apiService.get<any[]>('/api/Chat/history?limit=40').then(history => {
      if (!history || history.length === 0) return;
      const mapped: Message[] = history.map((m: any) => ({
        id: String(m.id),
        type: m.messageRole === 'user' ? 'user' : 'bot',
        text: m.messageText,
      }));
      setMessages(mapped);
    }).catch(() => {/* keep welcome message on error */});
  }, []);

  const suggestions = [
    'Quy định tòa nhà là gì?',
    'Lấy pass wifi phòng chờ?',
  ];

  const renderItem = useCallback(({ item }: { item: Message }) => <MessageItem item={item} />, []);

  const handleSend = async () => {
    if (message.trim() === '' || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: message.trim(),
    };
    const userMessageText = message.trim();
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    try {
      const response = await apiService.post<any>('/api/Chat/send', { messageText: userMessageText });

      const botMessage: Message = {
        id: String(response.id),
        type: 'bot',
        text: response.messageText || 'Tôi không hiểu câu hỏi của bạn. Bạn có thể nói rõ hơn không?',
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: 'Xin lỗi, tôi đang gặp vấn đề. Vui lòng thử lại sau.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trợ lý ảo tòa nhà</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={listRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={8}
        removeClippedSubviews
        ListFooterComponent={
          <>
            {isTyping && (
              <View style={styles.messageWrapper}>
                <View style={styles.botMessageContainer}>
                  <View style={styles.botAvatar}>
                    <Ionicons name="chatbubbles" size={18} color="#1A4B84" />
                  </View>
                  <View style={styles.botMessage}>
                    <ActivityIndicator size="small" color="#1A4B84" />
                  </View>
                </View>
              </View>
            )}

            {messages.length === 1 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => setMessage(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        }
      />

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Nhập câu hỏi..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (isTyping || !message.trim()) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isTyping || !message.trim()}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>
          AI có thể không chính xác 100%. Vui lòng không chia sẻ mã số cá nhân.
        </Text>
      </View>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 12,
  },
  messageWrapper: {
    marginBottom: 20,
  },
  botMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '85%',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F0FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  botMessage: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  botMessageText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  userMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    maxWidth: '85%',
    alignSelf: 'flex-end',
  },
  userMessage: {
    backgroundColor: '#1A4B84',
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessageText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 44,
    marginTop: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    fontSize: 12,
    color: '#1A4B84',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingRight: 48,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  sendButton: {
    position: 'absolute',
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A4B84',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  disclaimer: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});
