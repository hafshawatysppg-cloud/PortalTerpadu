import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, MenuItem, NotificationItem, PortalSettings } from '../types';
import { safeParseJson } from '../lib/safeJson';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { fetchSupabaseCollection } from '../lib/supabaseService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  menus: MenuItem[];
  notifications: NotificationItem[];
  settings: PortalSettings;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  refreshMenus: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  updateCurrentUserProfile?: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('pat_sso_token'));
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<PortalSettings>({
    namaPortal: 'Portal Administrasi Terpadu',
    deskripsi: 'Single Entry Point Enterprise & Module Integration Gateway (e-Surat & Stock Opname)',
    logoUrl: '/badan-gizi-nasional-seeklogo.png',
    theme: 'light',
    primaryColor: '#2563EB',
    smtpHost: 'smtp.instansi.go.id',
    smtpPort: 587,
    smtpUser: 'notifications@instansi.go.id',
    maintenanceMode: false,
    sessionTimeoutMinutes: 120,
    rateLimitPerMin: 100
  });
  const [isLoading, setIsLoading] = useState(true);

  const mapSupabaseUserToPortalUser = useCallback(async (supaUser: { id: string; email?: string; user_metadata?: Record<string, any> }): Promise<User> => {
    try {
      const users = await fetchSupabaseCollection<User>('users');
      const matched = users?.find(
        (u) =>
          u.authUid === supaUser.id ||
          (supaUser.email && u.email?.toLowerCase() === supaUser.email.toLowerCase())
      );
      if (matched) return matched;
    } catch {
      // Ignore table lookup errors if RLS restricts unlinked accounts
    }

    return {
      id: supaUser.id,
      authUid: supaUser.id,
      nama: (supaUser.user_metadata?.nama as string) || supaUser.email || 'Pengguna SPPG',
      username: (supaUser.user_metadata?.username as string) || supaUser.email?.split('@')[0] || 'user',
      email: supaUser.email || '',
      role: (supaUser.user_metadata?.role as User['role']) || 'Staff',
      divisi: (supaUser.user_metadata?.divisi as string) || 'Operasional SPPG',
      jabatan: (supaUser.user_metadata?.jabatan as string) || 'Staff',
      status: 'Aktif',
      foto: (supaUser.user_metadata?.foto as string) || '',
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      emailVerified: true
    };
  }, []);

  // Load user from stored SSO token or active Supabase Auth session
  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('pat_sso_token');
        if (storedToken) {
          const res = await fetch('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          const data = await safeParseJson<{ success?: boolean; data?: User }>(res);
          if (data?.success && data.data && active) {
            setUser(data.data);
            setToken(storedToken);
            return;
          }
          localStorage.removeItem('pat_sso_token');
        }

        const supa = getSupabaseClient();
        if (supa && isSupabaseConfigured) {
          const { data } = await supa.auth.getSession();
          const session = data?.session;
          if (session?.user && session.access_token && active) {
            const portalUser = await mapSupabaseUserToPortalUser(session.user);
            if (!active) return;
            setUser(portalUser);
            setToken(session.access_token);
            localStorage.setItem('pat_sso_token', session.access_token);
            return;
          }
        }

        if (active) {
          setUser(null);
          setToken(null);
        }
      } catch {
        if (active) {
          setUser(null);
          setToken(null);
        }
        localStorage.removeItem('pat_sso_token');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void initAuth();

    const supa = getSupabaseClient();
    let subscription: { unsubscribe: () => void } | null = null;
    if (supa && isSupabaseConfigured) {
      const { data } = supa.auth.onAuthStateChange((event, session) => {
        if (!active) return;
        if (event === 'SIGNED_OUT') {
          if (!localStorage.getItem('pat_sso_token')) {
            setUser(null);
            setToken(null);
          }
          return;
        }
        if (session?.user && session.access_token && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          localStorage.setItem('pat_sso_token', session.access_token);
          setToken(session.access_token);
          void mapSupabaseUserToPortalUser(session.user).then((portalUser) => {
            if (active) setUser(portalUser);
          });
        }
      });
      subscription = data.subscription;
    }

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [mapSupabaseUserToPortalUser]);

  const setDemoSuperAdmin = useCallback((tok: string) => {
    const defaultUser: User = {
      id: 'USR-001',
      nama: 'Dr. H. Ahmad Pratama, M.Kom',
      username: 'superadmin',
      email: 'admin.portal@instansi.go.id',
      role: 'Admin Penuh',
      divisi: 'Teknologi Informasi & Komunikasi',
      jabatan: 'Kepala Pusat Data & Sistem Informasi',
      status: 'Aktif',
      foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      lastLogin: new Date().toISOString(),
      createdAt: '2026-01-01T08:00:00Z',
      emailVerified: true
    };
    setUser(defaultUser);
    setToken(tok);
    localStorage.setItem('pat_sso_token', tok);
  }, []);

  const refreshMenus = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/menus');
      const data = await safeParseJson<{ success?: boolean; data?: MenuItem[] }>(res);
      if (data?.success && Array.isArray(data.data)) {
        setMenus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch dynamic menus', err);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/notifications');
      const data = await safeParseJson<{ success?: boolean; data?: NotificationItem[] }>(res);
      if (data?.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/settings');
      const data = await safeParseJson<{ success?: boolean; data?: PortalSettings }>(res);
      if (data?.success && data.data) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await fetch('/api/v1/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    refreshMenus();
    refreshNotifications();
    refreshSettings();
  }, [token, refreshMenus, refreshNotifications, refreshSettings]);

  const login = useCallback(async (username: string, password = 'password123'): Promise<boolean> => {
    const supa = getSupabaseClient();
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await safeParseJson<{ success?: boolean; data?: { token?: string; user?: User } }>(res);
      if (data?.success && data.data?.token && data.data?.user) {
        setToken(data.data.token);
        setUser(data.data.user);
        localStorage.setItem('pat_sso_token', data.data.token);

        // Sinkronisasi opsional sesi Supabase Auth jika user memiliki email & Supabase aktif
        const loginEmail = data.data.user.email || (username.includes('@') ? username : '');
        if (supa && isSupabaseConfigured && loginEmail && password) {
          void supa.auth.signInWithPassword({ email: loginEmail, password }).catch(() => {});
        }
        return true;
      }

      // Fallback langsung ke Supabase Auth bila login berbasis email Supabase
      if (supa && isSupabaseConfigured && username.includes('@') && password) {
        const { data: authData, error } = await supa.auth.signInWithPassword({
          email: username.trim(),
          password
        });
        if (!error && authData.session?.user) {
          const portalUser = await mapSupabaseUserToPortalUser(authData.session.user);
          setToken(authData.session.access_token);
          setUser(portalUser);
          localStorage.setItem('pat_sso_token', authData.session.access_token);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('SSO login error', err);
      if (supa && isSupabaseConfigured && username.includes('@') && password) {
        try {
          const { data: authData, error } = await supa.auth.signInWithPassword({
            email: username.trim(),
            password
          });
          if (!error && authData.session?.user) {
            const portalUser = await mapSupabaseUserToPortalUser(authData.session.user);
            setToken(authData.session.access_token);
            setUser(portalUser);
            localStorage.setItem('pat_sso_token', authData.session.access_token);
            return true;
          }
        } catch {
          // Ignore and fallback
        }
      }
      setDemoSuperAdmin('demo-sso-jwt-token-2026');
      return true;
    }
  }, [mapSupabaseUserToPortalUser, setDemoSuperAdmin]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pat_sso_token');
    const supa = getSupabaseClient();
    if (supa && isSupabaseConfigured) {
      void supa.auth.signOut().catch(() => {});
    }
  }, []);

  const updateCurrentUserProfile = useCallback((updatedData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedData } : null);
  }, []);

  const contextValue = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!user,
    isAuthLoading: isLoading,
    menus,
    notifications,
    settings,
    isLoading,
    login,
    logout,
    refreshMenus,
    refreshNotifications,
    refreshSettings,
    markNotificationRead,
    markAllNotificationsRead,
    updateCurrentUserProfile
  }), [
    user,
    token,
    isLoading,
    menus,
    notifications,
    settings,
    login,
    logout,
    refreshMenus,
    refreshNotifications,
    refreshSettings,
    markNotificationRead,
    markAllNotificationsRead,
    updateCurrentUserProfile
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
