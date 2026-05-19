import apiService from './api.service';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

class FileService {
  async uploadImage(uri: string, name?: string): Promise<string> {
    // Try to use file size if available via uri fetch
    try {
      // If possible, fetch blob to determine size and provide FormData
      const res = await fetch(uri);
      const blob = await res.blob();
      if (blob.size > MAX_BYTES) throw new Error('FILE_TOO_LARGE');

      const formData = new FormData();
      formData.append('file', {
        // @ts-ignore - React Native FormData file object
        uri,
        name: name || `photo_${Date.now()}.jpg`,
        type: blob.type || 'image/jpeg',
      } as any);

      // Retry logic: 3 attempts with backoff
      let attempt = 0;
      const maxAttempts = 3;
      let lastErr: any = null;

      while (attempt < maxAttempts) {
        try {
          const axios = apiService.getAxiosInstance();
          const response = await axios.post('/api/file/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000,
          });
          // Expect { url }
          return response.data?.url || response.data?.data?.url || '';
        } catch (err: any) {
          lastErr = err;
          attempt += 1;
          if (attempt < maxAttempts) {
            // simple backoff
            await new Promise((r) => setTimeout(r, 500 * attempt));
          }
        }
      }

      throw lastErr || new Error('Upload failed');
    } catch (e: any) {
      if (e?.message === 'FILE_TOO_LARGE') throw new Error('Ảnh vượt quá kích thước cho phép (5MB)');
      throw e;
    }
  }
}

export const fileService = new FileService();
