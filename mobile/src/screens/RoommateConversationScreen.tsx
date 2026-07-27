import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { postMessageService } from '../services/post-message.service';
import { PostConversationDetailDto, PostMessageDto } from '../types/dto';
import { palette, radius } from '../theme/palette';

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

type Params = {
  RoommateConversation: {
    conversationId: string;
  };
};

export default function RoommateConversationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Params, 'RoommateConversation'>>();
  const { conversationId } = route.params;
  const scrollRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PostConversationDetailDto | null>(null);
  const [content, setContent] = useState('');

  const loadConversation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await postMessageService.getConversation(conversationId);
      setDetail(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Không thể tải hội thoại');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    if (!detail?.messages?.length) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 80);
    return () => clearTimeout(timer);
  }, [detail?.messages]);

  const handleSend = async () => {
    const nextContent = content.trim();
    if (!nextContent || sending || !detail) return;

      const optimisticMessage: PostMessageDto = {
      id: String(Date.now()),
      conversationId,
      postId: detail.postId,
      content: nextContent,
      createdAt: new Date().toISOString(),
      readAt: null,
      isMine: true,
      status: 'sent',
    };

    setContent('');
    setSending(true);
    setDetail((prev) => {
      if (!prev) return prev;
      return { ...prev, messages: [...prev.messages, optimisticMessage] };
    });

    try {
      const created = await postMessageService.send({
        conversationId,
        content: nextContent,
      });

      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map((item) => (item.id === optimisticMessage.id ? created : item)),
        };
      });
    } catch (e: any) {
      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((item) => item.id !== optimisticMessage.id),
        };
      });
      setError(e?.response?.data?.message || e?.message || 'Không thể gửi tin nhắn');
      setContent(nextContent);
    } finally {
      setSending(false);
    }
  };

  const groupedMessages = useMemo(() => detail?.messages ?? [], [detail?.messages]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={palette.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {detail?.otherUser.displayName || 'Hội thoại'}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {detail ? `${detail.roomCode} · ${detail.postTitle}` : 'Đang tải...'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : error && !detail ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadConversation}>
              <Text style={styles.retryText}>Tải lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {error ? (
              <View style={styles.inlineError}>
                <Text style={styles.inlineErrorText}>{error}</Text>
              </View>
            ) : null}

            <ScrollView
              ref={scrollRef}
              style={styles.messageList}
              contentContainerStyle={styles.messageContent}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
            >
              {groupedMessages.map((message) => (
                <View
                  key={message.id}
                  style={[styles.messageBubble, message.isMine ? styles.myBubble : styles.otherBubble]}
                >
                  <Text style={[styles.messageText, message.isMine && styles.myMessageText]}>{message.content}</Text>
                  <Text style={[styles.messageTime, message.isMine && styles.myMessageTime]}>
                    {formatTime(message.createdAt)}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập tin nhắn..."
                placeholderTextColor={palette.textMuted}
                value={content}
                onChangeText={(text) => {
                  if (error) setError(null);
                  setContent(text);
                }}
                multiline
                maxLength={2000}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!content.trim() || sending) && styles.sendButtonDisabled]}
                disabled={!content.trim() || sending}
                onPress={handleSend}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    gap: 8,
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
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.text,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: palette.textMuted,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    margin: 16,
    padding: 16,
    borderRadius: radius.md,
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
  inlineError: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: radius.sm,
    backgroundColor: palette.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  inlineErrorText: {
    color: palette.danger,
    fontSize: 13,
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: 16,
    gap: 10,
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: palette.primary,
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderSoft,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 14,
    color: palette.text,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    marginTop: 4,
    fontSize: 11,
    color: palette.textMuted,
    textAlign: 'right',
  },
  myMessageTime: {
    color: palette.primarySoft,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: palette.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});
