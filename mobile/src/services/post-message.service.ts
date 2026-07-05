import axios from 'axios';
import apiService from './api.service';
import {
  PostConversationDetailDto,
  PostConversationDto,
  PostMessageDto,
  SendPostMessageDto,
} from '../types/dto';

class PostMessageService {
  private baseUrl = '/api/post-messages';
  private cachedConversations: PostConversationDto[] = [];
  private lastFetchedAt = 0;
  private inFlightConversations: Promise<PostConversationDto[]> | null = null;
  private readonly cacheTtlMs = 60_000;

  getCachedConversations(): PostConversationDto[] {
    return this.cachedConversations;
  }

  hasFreshConversationCache(): boolean {
    return this.cachedConversations.length > 0 && Date.now() - this.lastFetchedAt < this.cacheTtlMs;
  }

  async getConversations(force = false): Promise<PostConversationDto[]> {
    if (!force && this.hasFreshConversationCache()) {
      return this.cachedConversations;
    }

    if (!force && this.inFlightConversations) {
      return this.inFlightConversations;
    }

    this.inFlightConversations = this.fetchConversations();
    try {
      return await this.inFlightConversations;
    } finally {
      this.inFlightConversations = null;
    }
  }

  private async fetchConversations(): Promise<PostConversationDto[]> {
    try {
      this.cachedConversations = await apiService.get<PostConversationDto[]>(`${this.baseUrl}/conversations`);
      this.lastFetchedAt = Date.now();
      return this.cachedConversations;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response && error.response.status !== 401) {
        const message = error.response.data?.message || '';
        if (
          message === 'Đã xảy ra lỗi' ||
          message.includes('hội thoại') ||
            message.includes('TroUyTinIntegration')
        ) {
          this.cachedConversations = [];
          this.lastFetchedAt = Date.now();
          return [];
        }
      }
      throw error;
    }
  }

  async getConversation(conversationId: string): Promise<PostConversationDetailDto> {
    return apiService.get<PostConversationDetailDto>(`${this.baseUrl}/conversations/${conversationId}`);
  }

  async send(data: SendPostMessageDto): Promise<PostMessageDto> {
    return apiService.post<PostMessageDto>(this.baseUrl, data);
  }

  async markRead(conversationId: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/conversations/${conversationId}/read`);
    this.cachedConversations = this.cachedConversations.map((item) =>
      item.conversationId === conversationId
        ? { ...item, isUnread: false, unreadCount: 0 }
        : item
    );
  }
}

export const postMessageService = new PostMessageService();
