import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity, 
  ClipboardList, 
  FileText, 
  ExternalLink,
  Clock,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem, ActivityLog } from '../../types';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

type TabType = 'all' | 'tasks' | 'logs';

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate 
}) => {
  const { notifications, markNotificationRead, markAllNotificationsRead, user, refreshNotifications } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Synchronize realtime activity logs from Firestore
  const { data: realtimeLogs } = useFirestoreRealtime<ActivityLog>('activityLogs');

  useEffect(() => {
    if (realtimeLogs && realtimeLogs.length > 0) {
      setLogs(realtimeLogs.slice(0, 15));
    } else {
      fetchLatestLogs();
    }
  }, [realtimeLogs]);

  const fetchLatestLogs = async () => {
    try {
      const res = await fetch('/api/v1/activity-logs');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLogs(data.data.slice(0, 15));
      }
    } catch (err) {
      console.error('Failed to fetch activity logs for notifications', err);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshNotifications(), fetchLatestLogs()]);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  if (!isOpen) return null;

  const getIcon = (tipe: NotificationItem['tipe']) => {
    switch (tipe) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'error': return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      default: return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  // Filter notifications by categories
  const taskNotifications = notifications.filter(
    n => n.modul === 'Tugas Divisi' || 
         n.modul === 'e-Surat' || 
         n.judul.toLowerCase().includes('tugas') || 
         n.judul.toLowerCase().includes('disposisi') ||
         n.judul.toLowerCase().includes('approval')
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const unreadTasksCount = taskNotifications.filter(n => !n.isRead).length;

  const displayedNotifications = activeTab === 'tasks' 
    ? taskNotifications 
    : notifications;

  return (
    <div 
      id="notification-dropdown-panel"
      className="absolute right-0 mt-2 w-84 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-800 dark:text-slate-100 transition-all duration-200 ring-1 ring-black/5 dark:ring-white/5"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Pusat Pembaruan Sistem
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">
              {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua telah diperbarui'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleManualRefresh}
            className={`p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
            title="Refresh Pembaruan"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          {unreadCount > 0 && (
            <button
              id="mark-all-read-btn"
              onClick={markAllNotificationsRead}
              className="px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Tandai semua notifikasi sudah dibaca"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tandai Dibaca</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex items-center p-1.5 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>Semua</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[9px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Tugas</span>
          {unreadTasksCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-bold">
              {unreadTasksCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-medium text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
        {activeTab === 'logs' ? (
          /* Activity Log Trail Tab */
          logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada log audit trail tercatat di Firestore.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                onClick={() => {
                  onNavigate('/admin/logs');
                  onClose();
                }}
                className="p-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {log.modul}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.jam || log.tanggal}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1 leading-snug">
                      {log.aktivitas}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {log.namaUser}: {log.detail || 'Melakukan pembaruan transaksi'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          /* Notifications Tab (All / Tasks) */
          displayedNotifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {activeTab === 'tasks' 
                ? 'Tidak ada pembaruan tugas atau disposisi baru.' 
                : 'Tidak ada notifikasi sistem saat ini.'}
            </div>
          ) : (
            displayedNotifications.map((item) => (
              <div
                key={item.id}
                id={`notification-item-${item.id}`}
                onClick={() => {
                  markNotificationRead(item.id);
                  if (item.linkUrl) onNavigate(item.linkUrl);
                  onClose();
                }}
                className={`p-3 text-left transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                  !item.isRead ? 'bg-blue-50/50 dark:bg-blue-950/25 border-l-2 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {getIcon(item.tipe)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {item.modul}
                        </span>
                        {!item.isRead && (
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {item.createdAt}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1 leading-snug">
                      {item.judul}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {item.pesan}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Footer link to Activity Logs & Full History */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px]">
        <button
          onClick={() => {
            onNavigate('/admin/logs');
            onClose();
          }}
          className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center gap-1 cursor-pointer transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Buka Riwayat Audit Trail</span>
        </button>

        <button
          onClick={() => {
            onNavigate('/tugas-divisi');
            onClose();
          }}
          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>Kelola Tugas</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
