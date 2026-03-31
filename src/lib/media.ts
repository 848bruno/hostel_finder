const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5100/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function toMediaUrl(value?: string | null): string {
  const media = String(value || '').trim();
  if (!media) return '';
  if (/^https?:\/\//i.test(media)) return media;

  const normalized = media.replace(/^\/+/, '');

  if (normalized.startsWith('public/')) {
    return `${API_ORIGIN}/api/storage/public?key=${encodeURIComponent(normalized)}`;
  }

  return `${API_ORIGIN}/${normalized}`;
}
