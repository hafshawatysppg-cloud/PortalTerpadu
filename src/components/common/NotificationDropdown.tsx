import React from 'react';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../types';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose, onNavigate }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAuth();

  if (!isOpen) return null;

  const getIcon = (tipe: NotificationItem['tipe']) => {
    switch (tipe) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Pusat Notifikasi Central ({unreadCount})
          </h3>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Tandai Dibaca
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Tidak ada notifikasi sistem saat ini.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                markNotificationRead(item.id);
                if (item.linkUrl) onNavigate(item.linkUrl);
                onClose();
              }}
              className={`p-3 text-left transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                !item.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {getIcon(item.tipe)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {item.modul}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.createdAt}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    {item.judul}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {item.pesan}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
