export type DriveUploadCategory =
  | 'Menu Harian'
  | 'Siklus Menu'
  | 'Laporan Distribusi'
  | 'Suhu Masuk Ompreng'
  | 'Suhu Pengolahan'
  | 'Logistik'
  | string;

export interface DriveUploadResult {
  status: 'success';
  imageUrl: string;
  folder?: string;
  fileId?: string;
}

export interface CompressedImageData {
  dataUrl: string;
  base64: string;
  mimeType: 'image/jpeg';
  sizeKb: number;
}

const GAS_UPLOAD_URL = String(import.meta.env.VITE_GAS_UPLOAD_URL ?? '').trim();

export function isGasUploadConfigured(): boolean {
  if (!GAS_UPLOAD_URL) return false;
  try {
    const parsed = new URL(GAS_UPLOAD_URL);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isValidDriveOrHttpUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isSafeImageSrc(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) return false;
  return (
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('data:image/') ||
    lower.startsWith('blob:') ||
    trimmed.startsWith('/')
  );
}

/**
 * Compresses an image File in-browser using HTML5 Canvas
 * (max width 1024px, JPEG format at quality 0.8).
 */
export function compressImageToJpeg(
  file: File,
  maxWidth = 1024,
  quality = 0.8
): Promise<CompressedImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = (event.target?.result as string) || '';
      if (!rawDataUrl) {
        reject(new Error('File gambar tidak dapat dibaca.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxWidth) {
            height = Math.max(1, Math.round((height * maxWidth) / width));
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas 2D context tidak tersedia.'));
            return;
          }

          // White background ensures transparent PNGs convert cleanly to JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
          const sizeKb = Math.max(1, Math.round((base64.length * 0.75) / 1024));

          resolve({
            dataUrl,
            base64,
            mimeType: 'image/jpeg',
            sizeKb,
          });
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Gagal mengompresi gambar.'));
        }
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar untuk kompresi.'));
      img.src = rawDataUrl;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
}

function buildDriveFileName(rawName: string, tanggal?: string): string {
  const datePart = (tanggal || new Date().toISOString().split('T')[0]).replace(/[^0-9-]/g, '');
  const baseName = (rawName || 'foto-sppg')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return `${datePart}_${baseName || 'dokumentasi'}.jpg`;
}

/**
 * Compresses an image File (max width 1024px, JPEG 0.8) and uploads it to Google Drive
 * via Google Apps Script Web App (`VITE_GAS_UPLOAD_URL`) with automatic sub-folder categorization.
 * Uses `Content-Type: text/plain;charset=utf-8` to avoid CORS preflight failures on GAS.
 */
export async function uploadImageToGoogleDrive(
  file: File,
  options: {
    category: DriveUploadCategory;
    tanggal?: string;
    fileName?: string;
  }
): Promise<DriveUploadResult> {
  if (!isGasUploadConfigured()) {
    throw new Error(
      'URL Google Apps Script (VITE_GAS_UPLOAD_URL) belum dikonfigurasi pada environment (.env).'
    );
  }

  const compressed = await compressImageToJpeg(file, 1024, 0.8);
  const formattedFileName = buildDriveFileName(options.fileName || file.name, options.tanggal);

  const payload = {
    imageBase64: compressed.base64,
    mimeType: 'image/jpeg',
    fileName: formattedFileName,
    category: options.category,
  };

  const response = await fetch(GAS_UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Upload ke Google Drive gagal (HTTP ${response.status}).`);
  }

  let parsed: any;
  try {
    parsed = await response.json();
  } catch {
    throw new Error('Respons Google Apps Script tidak valid (bukan JSON).');
  }

  if (parsed?.status !== 'success' || !isValidDriveOrHttpUrl(parsed?.imageUrl)) {
    throw new Error(parsed?.message || 'Google Apps Script gagal mengembalikan imageUrl.');
  }

  return {
    status: 'success',
    imageUrl: String(parsed.imageUrl).trim(),
    folder: parsed.folder ? String(parsed.folder) : options.category,
    fileId: parsed.fileId ? String(parsed.fileId) : undefined,
  };
}
