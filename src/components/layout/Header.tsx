import React, { useState } from 'react';
import { Search, Bell, Moon, Sun, Shield, LogOut, Menu, MoreVertical, UserCheck, LogIn, Eye, Flame } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MenuItem } from '../../types';
import { NotificationDropdown } from '../common/NotificationDropdown';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { FirebaseSetupGuide } from '../common/FirebaseSetupGuide';
import logoImg from '../../assets/images/badan_gizi_logo_1785799692960.jpg';

interface HeaderProps {
  currentPath?: string;
  onToggleSidebar?: () => void;
  onNavigate?: (path: string) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath = '/dashboard',
  onToggleSidebar = () => {},
  onNavigate = (_path: string) => {},
  darkMode = false,
  onToggleDarkMode = () => {}
}) => {
  const { user, menus, notifications, logout, settings } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-b border-slate-200/70 dark:border-slate-800/80 shadow-xs transition-all duration-300">
        {/* Tier 1: Brand, Search, Utilities */}
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Left: Mobile Menu Drawer Toggle (Titik Tiga) & App Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 flex items-center justify-center border border-slate-200/80 dark:border-slate-800 shadow-2xs cursor-pointer group"
              title="Navigasi Menu (Klik Titik Tiga)"
            >
              <MoreVertical className="w-5 h-5 text-slate-700 dark:text-slate-200 group-hover:scale-110 transition-transform" />
            </button>

            <div 
              onClick={() => onNavigate('/dashboard')} 
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img
                src={logoImg}
                alt="Badan Gizi Nasional Logo"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm group-hover:scale-105 transition-all duration-300"
                referrerPolicy="no-referrer"
              />
              <div>
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[140px] min-[400px]:max-w-[200px] sm:max-w-none">
                  {settings.namaPortal || 'Portal Administrasi Terpadu'}
                </h1>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wide block truncate">
                  Badan Gizi Nasional RI
                </span>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full py-2 px-4 bg-slate-100/80 dark:bg-slate-800/70 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 text-slate-500 dark:text-slate-400 rounded-full text-xs font-medium flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 shadow-2xs group"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">Cari surat, barang, pegawai, atau dokumen...</span>
              </div>
              <span className="px-2 py-0.5 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-full text-[10px] font-medium border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                ⌘K
              </span>
            </button>
          </div>

          {/* Right Section: Utilities, Theme, Notifications & User Profile */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Firebase Setup Guide Quick Button */}
            <button
              onClick={() => setShowFirebaseGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-semibold border border-amber-200/80 dark:border-amber-800/80 transition shadow-2xs cursor-pointer group"
              title="Panduan Inisialisasi Database Firebase Baru"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Panduan Firebase</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-200"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Dropdown Toggle with Unread Count Badge */}
            <div className="relative">
              <button
                id="notification-bell-btn"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                aria-label="Pusat Notifikasi dan Pembaruan Sistem"
                className={`p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all duration-200 relative cursor-pointer ${
                  isNotifOpen ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20' : ''
                }`}
                title={unreadNotifs > 0 ? `${unreadNotifs} Notifikasi baru` : 'Pusat Notifikasi Sistem'}
              >
                <Bell className={`w-4 h-4 transition-transform duration-200 ${unreadNotifs > 0 ? 'text-slate-700 dark:text-slate-200 group-hover:rotate-12' : ''}`} />
                {unreadNotifs > 0 && (
                  <span
                    id="notification-unread-badge"
                    className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm animate-pulse"
                  >
                    {unreadNotifs > 99 ? '99+' : unreadNotifs}
                  </span>
                )}
              </button>
              <NotificationDropdown
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                onNavigate={onNavigate}
              />
            </div>

            <div className="w-px h-5 bg-slate-200/80 dark:bg-slate-800 mx-1.5" />

            {/* User Profile / Visitor Login */}
            {!user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-100 dark:border-blue-900">
                  <Eye className="w-3.5 h-3.5 text-blue-500" /> Mode Pengunjung
                </span>
                <button
                  onClick={() => onNavigate('/login')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login Pengguna</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all duration-200 border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50"
                >
                  <img
                    src={user.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={user.nama}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/20"
                  />
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                      {user.nama}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      {user.role}
                    </div>
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl p-3.5 z-50 transition-all">
                    <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {user.nama}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {user.email}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                          {user.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{user.divisi}</span>
                      </div>
                    </div>

                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          onNavigate('/admin/users');
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl flex items-center gap-2.5 transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-slate-400" /> Profil & Akses Saya
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('/admin/settings');
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl flex items-center gap-2.5 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-slate-400" /> Keamanan Portal
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl flex items-center gap-2.5 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Firebase Setup Guide Dialog Modal */}
      {showFirebaseGuide && (
        <FirebaseSetupGuide
          isModal={true}
          onClose={() => setShowFirebaseGuide(false)}
        />
      )}
    </>
  );
};
