import apiService from './api.service';
import {
  ConversationListResponse, MessageListResponse,
  SendChatRequest, SendChatResponse,
} from '../types/chat';

export const chatService = {
  sendMessage: (payload: SendChatRequest) =>
    apiService.post<SendChatResponse>('/api/v1/chat', payload),
  getConversations: (page = 1, pageSize = 20) =>
    apiService.get<ConversationListResponse>(
      `/api/conversations?page=${page}&page_size=${pageSize}`,
    ),
  getMessages: (conversationId: string, page = 1, pageSize = 50) =>
    apiService.get<MessageListResponse>(
      `/api/conversations/${encodeURIComponent(conversationId)}/messages?page=${page}&page_size=${pageSize}`,
    ),
  deleteConversation: (conversationId: string) =>
    apiService.delete<{ success: boolean }>(
      `/api/conversations/${encodeURIComponent(conversationId)}`,
    ),
};
