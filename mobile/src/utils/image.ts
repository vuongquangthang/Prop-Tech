import { API_BASE_URL } from '../services/api.service';

export const resolveImageUrl = (url?: string | null): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  const path = trimmed.split('?')[0].toLowerCase();
  if (path === 'placeholder.svg' || path.endsWith('/placeholder.svg')) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `${API_BASE_URL}${trimmed}`;
};
