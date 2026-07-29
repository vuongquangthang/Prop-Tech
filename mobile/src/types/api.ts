import { AxiosError } from 'axios';

export interface AppApiError {
  status?: number;
  errorCode?: string;
  message: string;
  detail?: unknown;
  requestId?: string;
}

export function normalizeApiError(error: unknown): AppApiError {
  const axiosError = error as AxiosError<{
    error_code?: string;
    message?: string;
    detail?: unknown;
  }>;
  if (!axiosError?.isAxiosError) {
    return { message: error instanceof Error ? error.message : 'Đã xảy ra lỗi.' };
  }
  const status = axiosError.response?.status;
  const fallback: Record<number, string> = {
    400: 'Dữ liệu không hợp lệ.',
    401: 'Phiên đăng nhập đã hết hạn.',
    403: 'Bạn không có quyền thực hiện thao tác này.',
    404: 'Không tìm thấy dữ liệu.',
    409: 'Dữ liệu đang được xử lý.',
    413: 'File vượt quá dung lượng cho phép.',
    422: 'Dữ liệu gửi lên không hợp lệ.',
    500: 'Hệ thống đang gặp lỗi.',
  };
  return {
    status,
    errorCode: axiosError.response?.data?.error_code,
    message: axiosError.response?.data?.message
      || (status ? fallback[status] : undefined)
      || 'Không thể kết nối tới máy chủ.',
    detail: axiosError.response?.data?.detail,
    requestId: axiosError.response?.headers?.['x-request-id'],
  };
}
