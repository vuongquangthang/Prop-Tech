import apiService from './api.service';
import { CreatePostDto, PostDto, UpdatePostDto, UpdatePostLockDto } from '../types/dto';

class PostService {
  private baseUrl = '/api/posts';

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
}

export const postService = new PostService();
