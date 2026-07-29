import { Directory, File, Paths } from 'expo-file-system';
import apiService, { getApiBaseUrl } from './api.service';
import {
  ChatDocument, DocumentListResponse, DocumentUploadResponse,
  SelectedDocumentFile,
} from '../types/document';

export const documentService = {
  upload: async (
    files: SelectedDocumentFile[],
    category?: string,
    title?: string,
    onProgress?: (percent: number) => void,
  ) => {
    const form = new FormData();
    if (category?.trim()) form.append('category', category.trim());
    if (title?.trim()) form.append('title', title.trim());
    files.forEach(file => form.append('files', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    } as any));
    return apiService.post<DocumentUploadResponse>('/api/documents', form, {
      timeout: 5 * 60 * 1000,
      onUploadProgress: (event: { loaded: number; total?: number }) => {
        if (event.total) onProgress?.(Math.round(event.loaded * 100 / event.total));
      },
    });
  },
  list: (page = 1, pageSize = 20) =>
    apiService.get<DocumentListResponse>(
      `/api/documents?page=${page}&page_size=${pageSize}`,
    ),
  get: (id: string) =>
    apiService.get<ChatDocument>(`/api/documents/${encodeURIComponent(id)}`),
  reindex: (id: string) =>
    apiService.post<{ success: boolean; document: ChatDocument }>(
      `/api/documents/${encodeURIComponent(id)}/reindex`, {},
    ),
  delete: (id: string) =>
    apiService.delete<{ success: boolean }>(
      `/api/documents/${encodeURIComponent(id)}`,
    ),
  /** Tải file gốc về bộ nhớ cache của máy, trả về File cục bộ để xem/chia sẻ. */
  downloadFile: async (id: string) => {
    const token = await apiService.getAccessToken();
    const url = `${getApiBaseUrl()}/api/documents/${encodeURIComponent(id)}/file`;
    const dir = new Directory(Paths.cache, id);
    dir.create({ intermediates: true, idempotent: true });
    return File.downloadFileAsync(url, dir, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      idempotent: true,
    });
  },
};
