import React, { useEffect, useState } from 'react';
import { 
  ClipboardCheck, 
  Calendar, 
  UserCheck, 
  Utensils, 
  CheckCircle2, 
  Printer, 
  Edit3, 
  Share2, 
  Trash2, 
  RefreshCw,
  Layers, 
  ChefHat, 
  Box, 
  Truck, 
  Sparkles,
  ArrowRight,
  Clock,
  CheckSquare
} from 'lucide-react';
import { DivisiTaskRecord } from '../../types';

interface KeteranganTugasDivisiWidgetProps {
  onNavigate?: (path: string) => void;
}

export const KeteranganTugasDivisiWidget: React.FC<KeteranganTugasDivisiWidgetProps> = ({ onNavigate }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [records, setRecords] = useState<DivisiTaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTasksForDate = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/tugas-divisi/by-date?tanggal=${dateStr}`);
      if (!res.ok) throw new Error('Failed to fetch division tasks');
      const json = await res.json();
      if (json.success && json.data) {
        setRecords(json.data);
      }
    } catch (err) {
      console.error('Failed to load division tasks for date:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksForDate(selectedDate);
  }, [selectedDate]);

  const getBadgeLabel = (divisiId: string) => {
    switch (divisiId) {
      case 'persiapan': return 'PERSIAPAN';
      case 'pengolahan': return 'PENGOLAHAN';
      case 'pemorsian': return 'PEMORSIAN';
      case 'distribusi': return 'DISTRIBUSI';
      case 'cuci_ompreng': return 'CUCI OMPRENG';
      default: return divisiId.toUpperCase();
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[24px] p-6 sm:p-7 shadow-sm space-y-6">
      {/* Widget Header & Date Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shrink-0 shadow-md shadow-blue-500/20">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Keterangan Tugas Divisi
              </h3>
              <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-extrabold rounded-full border border-blue-200 dark:border-blue-900">
                {formatDisplayDate(selectedDate)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rincian tugas 5 divisi operasional berdasarkan tanggal yang dipilih
            </p>
          </div>
        </div>

        {/* Date Filter & Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">Pilih Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-100 font-bold text-xs"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                selectedDate === todayStr 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Hari Ini
            </button>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('/tugas-divisi')}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Kelola di Tugas Divisi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid: 3 cols top row, 2 cols bottom row */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span>Memuat data Keterangan Tugas Divisi...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Tidak ada data tugas divisi pada tanggal {selectedDate}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((r) => {
            const menuText = r.menuHarian || 'Nasi, Ayam Goreng Lengkuas, Sayur Sop Bening, Pisang...';
            const badgeLabel = getBadgeLabel(r.divisiId);

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Badge & Title Header */}
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-extrabold tracking-wider rounded-md uppercase">
                      {badgeLabel}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                      {r.divisiNama}
                    </h4>
                    
                    {/* PJ Info */}
                    <div className="space-y-1 mt-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>PJ: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{r.penanggungJawab || 'Staf Dapur'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* MENU HARIAN Block */}
                  <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-3 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold uppercase text-[10px] tracking-wider">
                      <Utensils className="w-3.5 h-3.5 text-amber-600" />
                      <span>MENU HARIAN</span>
                    </div>
                    <p className="text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                      {menuText}
                    </p>
                  </div>

                  {/* KETERANGAN TUGAS DIVISI Block */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                    <h5 className="font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      KETERANGAN TUGAS DIVISI
                    </h5>

                    {r.keterangan && (
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] italic mb-1">
                        {r.keterangan}
                      </p>
                    )}

                    {r.checklists && r.checklists.length > 0 ? (
                      <ul className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {r.checklists.map((chk) => (
                          <li key={chk.id} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-xs">
                            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm leading-none shrink-0 mt-0.5">•</span>
                            <span className={chk.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                              {chk.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 text-xs italic">
                        Belum ada daftar tugas divisi.
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons matching card layout */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onNavigate && onNavigate('/tugas-divisi')}
                    className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Detail</span>
                  </button>
                  <button
                    onClick={() => onNavigate && onNavigate('/tugas-divisi')}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Share</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
