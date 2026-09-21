import React, { useEffect, useState } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  ChevronRight, 
  RefreshCw, 
  UserCheck, 
  Layers, 
  ChefHat, 
  Box, 
  Truck, 
  Utensils,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { DivisiTaskRecord } from '../../types';

interface ProgressTugasWidgetProps {
  onNavigate?: (path: string) => void;
}

export const ProgressTugasWidget: React.FC<ProgressTugasWidgetProps> = ({ onNavigate }) => {
  const [records, setRecords] = useState<DivisiTaskRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchTodayTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/tugas-divisi/by-date?tanggal=${todayStr}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      if (json.success && json.data) {
        setRecords(json.data);
      }
    } catch (err) {
      console.error('Failed to load today task summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayTasks();
  }, []);

  // Calculate high-level summary metrics
  const totalCompleted = records.reduce((acc, r) => acc + (r.checklists ? r.checklists.filter(c => c.completed).length : 0), 0);
  const totalChecklists = records.reduce((acc, r) => acc + (r.checklists ? r.checklists.length : 0), 0);
  const overallPercent = totalChecklists > 0 ? Math.round((totalCompleted / totalChecklists) * 100) : 0;
  const totalPorsi = records.reduce((acc, r) => acc + (r.jumlahProduksi || 0), 0);

  // Helper for division visual configuration
  const getDivisiConfig = (divisiId: string) => {
    switch (divisiId) {
      case 'persiapan':
        return {
          icon: <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          bgColor: 'bg-amber-50/70 dark:bg-slate-800/60',
          borderColor: 'border-amber-200/80 dark:border-amber-900/50',
          accentColor: 'text-amber-700 dark:text-amber-400',
          badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
        };
      case 'pengolahan':
        return {
          icon: <ChefHat className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
          bgColor: 'bg-orange-50/70 dark:bg-slate-800/60',
          borderColor: 'border-orange-200/80 dark:border-orange-900/50',
          accentColor: 'text-orange-700 dark:text-orange-400',
          badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
        };
      case 'pemorsian':
        return {
          icon: <Box className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          bgColor: 'bg-blue-50/70 dark:bg-slate-800/60',
          borderColor: 'border-blue-200/80 dark:border-blue-900/50',
          accentColor: 'text-blue-700 dark:text-blue-400',
          badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
        };
      case 'distribusi':
        return {
          icon: <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
          bgColor: 'bg-emerald-50/70 dark:bg-slate-800/60',
          borderColor: 'border-emerald-200/80 dark:border-emerald-900/50',
          accentColor: 'text-emerald-700 dark:text-emerald-400',
          badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
        };
      case 'cuci_ompreng':
        return {
          icon: <Utensils className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
          bgColor: 'bg-purple-50/70 dark:bg-slate-800/60',
          borderColor: 'border-purple-200/80 dark:border-purple-900/50',
          accentColor: 'text-purple-700 dark:text-purple-400',
          badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
        };
      default:
        return {
          icon: <ClipboardCheck className="w-5 h-5 text-slate-600 dark:text-slate-400" />,
          bgColor: 'bg-slate-50 dark:bg-slate-800/60',
          borderColor: 'border-slate-200 dark:border-slate-800',
          accentColor: 'text-slate-700 dark:text-slate-300',
          badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[24px] p-6 sm:p-7 shadow-sm space-y-6">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shrink-0 shadow-md shadow-indigo-500/20">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Ringkasan Operasional 5 Divisi Dapur
              </h3>
              <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-extrabold rounded-full border border-indigo-200 dark:border-indigo-900">
                Hari Ini
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Status kesiapan dan ketercapaian tugas 5 tim kerja operasional Dapur SPPG
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate && onNavigate('/tugas-divisi')}
          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <span>Buka Tugas Divisi</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* High-Level Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Capaian Operasional</div>
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              {overallPercent}% <span className="text-xs font-normal text-slate-400">({totalCompleted}/{totalChecklists})</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Porsi Terlayani</div>
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              {totalPorsi > 0 ? `${totalPorsi.toLocaleString('id-ID')} Porsi` : '1.500 Porsi Target'}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tim Divisi Operasional</div>
            <div className="text-base font-black text-slate-900 dark:text-slate-100">
              5 Divisi Siap
            </div>
          </div>
        </div>
      </div>

      {/* 5 Compact Division Cards Grid */}
      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Memuat data ringkasan tugas divisi...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Data tugas divisi belum diinisialisasi untuk hari ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {records.map((r) => {
            const config = getDivisiConfig(r.divisiId);
            const done = r.checklists ? r.checklists.filter(c => c.completed).length : 0;
            const total = r.checklists ? r.checklists.length : 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div
                key={r.id}
                onClick={() => onNavigate && onNavigate('/tugas-divisi')}
                className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-4 space-y-3 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between`}
              >
                <div className="space-y-2.5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xs group-hover:scale-105 transition-transform">
                      {config.icon}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${config.badgeBg}`}>
                      {pct}%
                    </span>
                  </div>

                  {/* Title & PJ */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {r.divisiNama}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">PJ: {r.penanggungJawab || 'Staf Dapur'}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Status Footer */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                    <span>{done}/{total} Tugas Selesai</span>
                  </div>
                  <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
