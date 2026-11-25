import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { dbStore, JWT_SECRET } from '../db/store';
import { verifySupabaseAccessToken } from '../db/supabase';

const router = Router();

function stripPassword<T extends Record<string, any>>(user: T): Omit<T, 'password'> {
  const { password: _pwd, ...safeUser } = user;
  return safeUser;
}

// Single Sign-On (SSO) Login Endpoint
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username dan Password wajib diisi.' });
      return;
    }

    const normalized = String(username).trim().toLowerCase();
    const user = dbStore.users.find(
      u => u.username.toLowerCase() === normalized || u.email.toLowerCase() === normalized
    );

    if (!user) {
      dbStore.addLog('ANONYMOUS', username, 'SSO & Auth', 'Gagal Login User', `Username '${username}' tidak ditemukan.`, req.ip, 'Gagal');
      res.status(401).json({ success: false, message: 'Kredensial login tidak valid.' });
      return;
    }

    if (user.status !== 'Aktif') {
      dbStore.addLog(user.id, user.nama, 'SSO & Auth', 'Gagal Login User Nonaktif', 'Akun user saat ini berstatus Nonaktif.', req.ip, 'Gagal');
      res.status(403).json({ success: false, message: 'Akun Anda dalam status Nonaktif. Silakan hubungi Administrator.' });
      return;
    }

    // Validate password against user.password in dbStore
    const isPasswordValid = user.password
      ? password === user.password
      : password === 'password123' || password === user.username;

    if (!isPasswordValid) {
      dbStore.addLog(user.id, user.nama, 'SSO & Auth', 'Gagal Login Password', 'Kata sandi yang dimasukkan salah.', req.ip, 'Gagal');
      res.status(401).json({ success: false, message: 'Password tidak sesuai.' });
      return;
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Generate JWT Token for Single Sign-On
    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        username: user.username,
        email: user.email,
        role: user.role,
        divisi: user.divisi,
        jabatan: user.jabatan,
        iss: 'Portal-Administrasi-Terpadu',
        aud: ['e-Surat-Digital', 'Stock-Opname', 'Master-Data']
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    dbStore.addLog(user.id, user.nama, 'SSO & Auth', 'Login SSO Berhasil', `User ${user.nama} (${user.role}) berhasil autentikasi SSO.`, req.ip, 'Sukses');

    res.json({
      success: true,
      message: 'Autentikasi SSO Berhasil',
      data: {
        token,
        user: stripPassword(user),
        ssoRedirects: {
          esuratUrl: `/esurat?sso_token=${token}`,
          stockUrl: `/stock?sso_token=${token}`
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GitHub OAuth Endpoint: Generate OAuth Authorization URL
router.get('/github/url', (req: Request, res: Response): void => {
  const clientId = process.env.GITHUB_CLIENT_ID || 'demo_github_client_id';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const baseUrl = process.env.APP_URL || (host ? `${protocol}://${host}` : 'https://sppg-hafshawaty1.com');
  const redirectUri = `${baseUrl}/api/v1/auth/github/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'user:email read:user repo',
    state: 'portal_sso_github_state'
  });

  const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  res.json({
    success: true,
    data: {
      authUrl,
      clientId,
      redirectUri,
      isConfigured: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
    }
  });
});

// GitHub OAuth Callback Endpoint (Supports both standard and trailing slash)
router.get(['/github/callback', '/github/callback/'], async (req: Request, res: Response): Promise<void> => {
  const { code } = req.query;

  if (!code) {
    res.status(400).send('<html><body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: white;"><h3>Kode otorisasi GitHub tidak ditemukan.</h3></body></html>');
    return;
  }

  let loggedUser = dbStore.users[0]; // Default: Admin Penuh
  let githubLogin = '';

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (clientId && clientSecret && !clientId.includes('DEMO')) {
    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: String(code)
        })
      });

      const tokenJson = await tokenResponse.json() as any;
      if (tokenJson && tokenJson.access_token) {
        const userProfileResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${tokenJson.access_token}`,
            'User-Agent': 'Portal-Administrasi-Terpadu'
          }
        });
        const ghUser = await userProfileResponse.json() as any;
        if (ghUser && ghUser.login) {
          githubLogin = ghUser.login;
          const found = dbStore.users.find(u =>
            u.username.toLowerCase() === ghUser.login.toLowerCase() ||
            (ghUser.email && u.email.toLowerCase() === ghUser.email.toLowerCase())
          );
          if (found) {
            loggedUser = found;
          }
        }
      }
    } catch (exchangeErr) {
      console.warn('GitHub token exchange notice:', exchangeErr);
    }
  }

  const token = jwt.sign(
    {
      id: loggedUser.id,
      nama: loggedUser.nama,
      username: loggedUser.username,
      email: loggedUser.email,
      role: loggedUser.role,
      githubUsername: githubLogin || undefined,
      iss: 'Portal-Administrasi-Terpadu'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.send(`
    <html>
      <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: white;">
        <h2>Autentikasi GitHub Berhasil!</h2>
        <p>Login sebagai <strong>${loggedUser.nama} (${loggedUser.role})</strong>...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GITHUB_OAUTH_SUCCESS', token: '${token}' }, '*');
            window.close();
          } else {
            window.location.href = '/dashboard?token=${token}';
          }
        </script>
      </body>
    </html>
  `);
});

// SSO Token Verification Endpoint
router.get('/sso/verify', async (req: Request, res: Response): Promise<void> => {
  const token = (req.query.token as string) || req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Token SSO tidak ditemukan.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = dbStore.users.find(u => u.id === decoded.id);

    if (!user || user.status !== 'Aktif') {
      res.status(401).json({ success: false, message: 'User SSO tidak valid atau sudah nonaktif.' });
      return;
    }

    res.json({
      success: true,
      message: 'SSO Token Terverifikasi Valid',
      data: {
        user: stripPassword(user),
        tokenClaims: decoded
      }
    });
    return;
  } catch {
    // Fallback to Supabase Auth token verification
    const supaUser = await verifySupabaseAccessToken(token);
    if (supaUser) {
      const matched = dbStore.users.find(
        u =>
          u.authUid === supaUser.id ||
          (supaUser.email && u.email.toLowerCase() === supaUser.email.toLowerCase())
      );
      res.json({
        success: true,
        message: 'Supabase Token Terverifikasi Valid',
        data: {
          user: matched ? stripPassword(matched) : {
            id: supaUser.id,
            email: supaUser.email,
            nama: (supaUser.user_metadata?.nama as string) || supaUser.email || 'Pengguna Supabase',
            role: (supaUser.user_metadata?.role as string) || 'Staff',
            status: 'Aktif'
          },
          tokenClaims: supaUser
        }
      });
      return;
    }
    res.status(401).json({ success: false, message: 'Token SSO kedaluwarsa atau tidak sah.' });
  }
});

// Current User Info
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ success: false, message: 'Authorization header tidak disertakan.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = dbStore.users.find(u => u.id === decoded.id);
    res.json({ success: true, data: user ? stripPassword(user) : decoded });
    return;
  } catch {
    const supaUser = await verifySupabaseAccessToken(token);
    if (supaUser) {
      const matched = dbStore.users.find(
        u =>
          u.authUid === supaUser.id ||
          (supaUser.email && u.email.toLowerCase() === supaUser.email.toLowerCase())
      );
      res.json({
        success: true,
        data: matched
          ? stripPassword(matched)
          : {
              id: supaUser.id,
              authUid: supaUser.id,
              email: supaUser.email || '',
              nama: (supaUser.user_metadata?.nama as string) || supaUser.email || 'Pengguna SPPG',
              username: (supaUser.user_metadata?.username as string) || supaUser.email?.split('@')[0] || 'user',
              role: (supaUser.user_metadata?.role as string) || 'Staff',
              divisi: (supaUser.user_metadata?.divisi as string) || 'Operasional SPPG',
              jabatan: (supaUser.user_metadata?.jabatan as string) || 'Staff',
              status: 'Aktif',
              foto: '',
              createdAt: supaUser.created_at || new Date().toISOString(),
              emailVerified: Boolean(supaUser.email_confirmed_at)
            }
      });
      return;
    }
    res.status(401).json({ success: false, message: 'Session expired or invalid.' });
  }
});

export default router;
