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

  async getConversations(): Promise<PostConversationDto[]> {
    try {
      return await apiService.get<PostConversationDto[]>(`${this.baseUrl}/conversations`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response && error.response.status !== 401) {
        const message = error.response.data?.message || '';
        if (
          message === 'Đã xảy ra lỗi' ||
          message.includes('hội thoại') ||
          message.includes('TroUyTinIntegration')
        ) {
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
  }
}

export const postMessageService = new PostMessageService();
