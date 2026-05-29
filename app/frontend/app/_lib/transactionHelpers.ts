
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i.test(url);
}

export function formatCurrency(n: number) {
  return `₦${n.toLocaleString('en-NG')}`;
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
