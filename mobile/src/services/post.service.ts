import apiService from './api.service';
import { CreatePostDto, PostDto, PostEditHistoryDto, UpdatePostDto, UpdatePostLockDto } from '../types/dto';

class PostService {
  private baseUrl = '/api/posts';

  async getAll(): Promise<PostDto[]> {
    return apiService.get<PostDto[]>(this.baseUrl);
  }

  async getById(id: number): Promise<PostDto> {
    return apiService.get<PostDto>(`${this.baseUrl}/${id}`);
  }

  async getMyPost(): Promise<PostDto> {
    return apiService.get<PostDto>(`${this.baseUrl}/my`);
  }

  async create(data: CreatePostDto): Promise<PostDto> {
    return apiService.post<PostDto>(this.baseUrl, data);
  }

  async update(id: number, data: UpdatePostDto): Promise<PostDto> {
    return apiService.put<PostDto>(`${this.baseUrl}/${id}`, data);
  }

  async updateLock(id: number, data: UpdatePostLockDto): Promise<PostDto> {
    return apiService.patch<PostDto>(`${this.baseUrl}/${id}/lock`, data);
  }

  async delete(id: number): Promise<void> {
    return apiService.delete(`${this.baseUrl}/${id}`);
  }

  async getHistory(id: number, limit = 20): Promise<PostEditHistoryDto[]> {
    return apiService.get<PostEditHistoryDto[]>(`${this.baseUrl}/${id}/history?limit=${limit}`);
  }
}

export const postService = new PostService();
