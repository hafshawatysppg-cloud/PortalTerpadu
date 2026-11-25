import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, ShieldCheck, AlertCircle } from 'lucide-react';
import { ActivityLog } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';

export const ActivityLogsView: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filterModul, setFilterModul] = useState('All');
  const [search, setSearch] = useState('');

  // Realtime Firestore synchronization for activity logs
  const { data: realtimeLogs } = useFirestoreRealtime<ActivityLog>('activityLogs');

  useEffect(() => {
    if (realtimeLogs && realtimeLogs.length > 0) {
      if (filterModul === 'All' && !search) {
        setLogs(realtimeLogs);
      } else {
        fetchLogs();
      }
    }
  }, [realtimeLogs]);

  const fetchLogs = async () => {
    try {
      const query = new URLSearchParams();
      if (filterModul !== 'All') query.append('modul', filterModul);
      if (search) query.append('search', search);

      const res = await fetch(`/api/v1/activity-logs?${query.toString()}`);
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterModul, search]);

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-700 dark:text-slate-300" /> Log Aktivitas & Audit Trail Central
        </h2>
        <p className="text-xs text-slate-500">
          Pencatatan riwayat seluruh aktivitas user dari e-Surat, Stock Opname, Master Data, & SSO Portal
        </p>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 flex items-center gap-2 w-full">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari user, aktivitas, detail, atau alamat IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterModul}
            onChange={(e) => setFilterModul(e.target.value)}
            className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
          >
            <option value="All">Semua Modul Enterprise</option>
            <option value="SSO">SSO & Auth</option>
            <option value="e-Surat">e-Surat Digital</option>
            <option value="Stock">Stock Opname</option>
            <option value="Master">Master Data</option>
            <option value="Menu">Menu Dinamis</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs min-w-[650px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              <th className="p-3">Waktu Log</th>
              <th className="p-3">User & IP Address</th>
              <th className="p-3">Modul</th>
              <th className="p-3">Aktivitas</th>
              <th className="p-3">Detail Keterangan</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                  {log.tanggal}
                  <div className="text-[10px] text-slate-400">{log.jam}</div>
                </td>
                <td className="p-3">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{log.namaUser}</div>
                  <div className="text-[10px] text-slate-400 font-mono">IP: {log.ipAddress}</div>
                </td>
                <td className="p-3">
                  <Badge variant="primary">{log.modul}</Badge>
                </td>
                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{log.aktivitas}</td>
                <td className="p-3 max-w-xs text-slate-500 truncate">{log.detail}</td>
                <td className="p-3">
                  <Badge variant={log.status === 'Sukses' ? 'success' : 'danger'}>
                    {log.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
