export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (typeof window !== 'undefined') {
    try {
      const token = window.localStorage.getItem('pat_sso_token');
      if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore storage errors
    }
  }
  return headers;
}
