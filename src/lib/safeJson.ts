export async function safeParseJson<T = any>(res: Response): Promise<T | null> {
  try {
    const contentType = (res.headers?.get('content-type') || '').toLowerCase();
    const text = await res.text();
    if (!text) return null;
    const trimmed = text.trim();
    if (
      contentType.includes('text/html') ||
      trimmed.startsWith('<') ||
      (!contentType.includes('json') &&
        !trimmed.startsWith('{') &&
        !trimmed.startsWith('['))
    ) {
      return null;
    }
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

let jsonGuardInstalled = false;

export function installSafeJsonResponseGuard(): void {
  if (jsonGuardInstalled || typeof window === 'undefined' || typeof Response === 'undefined') {
    return;
  }
  jsonGuardInstalled = true;

  Response.prototype.json = async function patchedJson(this: Response): Promise<any> {
    const contentType = (this.headers?.get('content-type') || '').toLowerCase();
    const isHtmlContentType = contentType.includes('text/html');
    const url = this.url || '';

    const text = await this.text();
    const trimmed = (text || '').trim();

    if (!trimmed) {
      return {
        success: false,
        data: null,
        message: 'Respons server kosong.'
      };
    }

    if (isHtmlContentType || trimmed.startsWith('<')) {
      console.warn(
        `[SafeJSON Guard] Respons HTML/non-JSON diterima dari ${url || 'endpoint'} (HTTP ${this.status})`
      );
      return {
        success: false,
        data: null,
        message: 'Server mengembalikan halaman HTML alih-alih JSON.'
      };
    }

    return JSON.parse(trimmed);
  };
}
