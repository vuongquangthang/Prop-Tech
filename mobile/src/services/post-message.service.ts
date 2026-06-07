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
    return apiService.get<PostConversationDto[]>(`${this.baseUrl}/conversations`);
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
