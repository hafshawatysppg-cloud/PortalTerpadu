import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase';

export const DISTRIBUTION_DRIVE_FOLDER_ID = '1R3aCtdsqfuDAf3dYgdtZ56MxyvotKfqb';
export const DISTRIBUTION_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1R3aCtdsqfuDAf3dYgdtZ56MxyvotKfqb?usp=drive_link';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account'
});

// In-memory token cache (never stored in localStorage or sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export interface DriveUploadedFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  size?: string;
}

export const initGoogleDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleDriveSignIn = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getGoogleDriveUser = (): User | null => {
  return auth.currentUser;
};

export const clearGoogleDriveAccessToken = () => {
  cachedAccessToken = null;
};

export const googleDriveLogout = async () => {
  cachedAccessToken = null;
  await auth.signOut();
};

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function dataUrlToCompressedJpeg(
  dataUrlOrUrl: string,
  maxWidth = 1024,
  quality = 0.75
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!dataUrlOrUrl.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = dataUrlOrUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context tidak tersedia'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.split(',')[1] || '';
      resolve({ base64, mimeType: 'image/jpeg' });
    };
    img.onerror = (err) => reject(err);
  });
}

export async function uploadImageToDriveFolder(params: {
  base64: string;
  mimeType?: string;
  fileName: string;
  description?: string;
  folderId?: string;
}): Promise<DriveUploadedFile> {
  const accessToken = getGoogleDriveAccessToken();
  if (!accessToken) {
    throw new Error('AUTH_REQUIRED');
  }

  const folderId = params.folderId || DISTRIBUTION_DRIVE_FOLDER_ID;
  const mimeType = params.mimeType || 'image/jpeg';

  const metadata = {
    name: params.fileName,
    mimeType,
    parents: [folderId],
    description: params.description || 'Dokumentasi Laporan Distribusi SPPG'
  };

  const boundary = `sppg_drive_boundary_${Date.now()}`;
  const metadataPart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`;
  const closingPart = `\r\n--${boundary}--`;

  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadataPart);
  const fileBytes = base64ToUint8Array(params.base64);
  const closingBytes = encoder.encode(closingPart);

  const bodyBytes = new Uint8Array(
    metadataBytes.length + fileBytes.length + closingBytes.length
  );
  bodyBytes.set(metadataBytes, 0);
  bodyBytes.set(fileBytes, metadataBytes.length);
  bodyBytes.set(closingBytes, metadataBytes.length + fileBytes.length);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,webContentLink,thumbnailLink,createdTime,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: bodyBytes
    }
  );

  if (res.status === 401) {
    clearGoogleDriveAccessToken();
    throw new Error('TOKEN_EXPIRED');
  }

  const data = await res.json();
  if (!res.ok) {
    const apiErrMsg = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(apiErrMsg);
  }

  return {
    id: data.id,
    name: data.name,
    webViewLink:
      data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    webContentLink: data.webContentLink,
    thumbnailLink: data.thumbnailLink,
    createdTime: data.createdTime,
    size: data.size
  };
}

export async function listDriveFolderFiles(
  folderId: string = DISTRIBUTION_DRIVE_FOLDER_ID
): Promise<DriveUploadedFile[]> {
  const accessToken = getGoogleDriveAccessToken();
  if (!accessToken) {
    throw new Error('AUTH_REQUIRED');
  }

  const query = encodeURIComponent(
    `'${folderId}' in parents and trashed = false`
  );
  const fields = encodeURIComponent(
    'files(id,name,mimeType,webViewLink,webContentLink,thumbnailLink,createdTime,size)'
  );

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime%20desc&pageSize=30&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=${fields}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (res.status === 401) {
    clearGoogleDriveAccessToken();
    throw new Error('TOKEN_EXPIRED');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `HTTP ${res.status}`);
  }

  return Array.isArray(data.files) ? data.files : [];
}
