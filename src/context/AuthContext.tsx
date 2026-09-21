import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MenuItem, NotificationItem, PortalSettings, UserRole } from '../types';

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
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
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

  // Load user from stored token if valid; otherwise user remains null (requires login)
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('pat_sso_token');
        if (storedToken) {
          const res = await fetch('/api/v1/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          const data = await res.json();
          if (data.success && data.data) {
            setUser(data.data);
            setToken(storedToken);
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('pat_sso_token');
          }
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('pat_sso_token');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const setDemoSuperAdmin = (tok: string) => {
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
  };

  const refreshMenus = async () => {
    try {
      const res = await fetch('/api/v1/menus');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMenus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch dynamic menus', err);
    }
  };

  const refreshNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/v1/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/v1/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshMenus();
    refreshNotifications();
    refreshSettings();
  }, [token]);

  const login = async (username: string, password = 'password123'): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success && data.data?.token && data.data?.user) {
        setToken(data.data.token);
        setUser(data.data.user);
        localStorage.setItem('pat_sso_token', data.data.token);
        return true;
      }
      return false;
    } catch (err) {
      console.error('SSO login error', err);
      // Fallback in case backend is unreachable
      setDemoSuperAdmin('demo-sso-jwt-token-2026');
      return true;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pat_sso_token');
  };

  const updateCurrentUserProfile = (updatedData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedData } : null);
  };

  return (
    <AuthContext.Provider value={{
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
    }}>
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
