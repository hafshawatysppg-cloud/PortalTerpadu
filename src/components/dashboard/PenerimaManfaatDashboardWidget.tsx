import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  School, 
  Baby, 
  HeartHandshake, 
  GraduationCap, 
  Building2, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { DailyBeneficiaryRecord, DailyBeneficiarySummary } from '../../types';

interface PenerimaManfaatDashboardWidgetProps {
  onNavigate?: (path: string) => void;
}

export const PenerimaManfaatDashboardWidget: React.FC<PenerimaManfaatDashboardWidgetProps> = ({ onNavigate }) => {
  const [selectedTab, setSelectedTab] = useState<'today' | 'upcoming'>('today');
  const [selectedUpcomingOffset, setSelectedUpcomingOffset] = useState<number>(1); // 1 = Besok, 2 = H+2, 3 = H+3

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [todayData, setTodayData] = useState<{ records: DailyBeneficiaryRecord[]; summary: DailyBeneficiarySummary | null }>({
    records: [],
    summary: null
  });

  const [upcomingData, setUpcomingData] = useState<{ dateStr: string; records: DailyBeneficiaryRecord[]; summary: DailyBeneficiarySummary | null }>({
    dateStr: '',
    records: [],
    summary: null
  });

  const getFormattedDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const getDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const todayStr = getFormattedDate(0);
  const targetUpcomingStr = getFormattedDate(selectedUpcomingOffset);

  // Fetch Today Data
  const fetchTodayData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/penerima-manfaat/by-date?tanggal=${todayStr}`);
      const json = await res.json();
      if (json.success) {
        setTodayData({
          records: json.records || [],
          summary: json.summary || null
        });
      }
    } catch (err) {
      console.error('Error fetching today beneficiary data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Upcoming Data
  const fetchUpcomingData = async (dateStr: string) => {
    try {
      const res = await fetch(`/api/v1/penerima-manfaat/by-date?tanggal=${dateStr}`);
      const json = await res.json();
      if (json.success) {
        setUpcomingData({
          dateStr,
          records: json.records || [],
          summary: json.summary || null
        });
      }
    } catch (err) {
      console.error('Error fetching upcoming beneficiary data:', err);
    }
  };

  useEffect(() => {
    fetchTodayData();
  }, []);

  useEffect(() => {
    fetchUpcomingData(targetUpcomingStr);
  }, [selectedUpcomingOffset]);

  const activeRecords = selectedTab === 'today' ? todayData.records : upcomingData.records;
  const activeSummary = selectedTab === 'today' ? todayData.summary : upcomingData.summary;
  const activeDateStr = selectedTab === 'today' ? todayStr : targetUpcomingStr;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[24px] p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Penerima Manfaat Hari Ini & Hari Selanjutnya
              </h3>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold rounded-full border border-emerald-200 dark:border-emerald-800">
                SPPG
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribusi Porsi Makanan Bergizi • {getDisplayDate(activeDateStr)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Main Tab Switcher */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/60 dark:border-slate-700">
            <button
              onClick={() => setSelectedTab('today')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedTab === 'today'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setSelectedTab('upcoming')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedTab === 'upcoming'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Hari Selanjutnya
            </button>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('/penerima-manfaat')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer pl-2"
          >
            <span>Kelola Full</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* If Upcoming Tab is active, show days selector (Besok, H+2, H+3) */}
      {selectedTab === 'upcoming' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Pilih Tanggal:</span>
          {[1, 2, 3, 4, 5].map((offset) => {
            const dateStr = getFormattedDate(offset);
            const d = new Date(dateStr);
            const dayName = offset === 1 ? 'Besok' : d.toLocaleDateString('id-ID', { weekday: 'short' });
            const dateFormatted = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

            return (
              <button
                key={offset}
                onClick={() => setSelectedUpcomingOffset(offset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedUpcomingOffset === offset
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{dayName} ({dateFormatted})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Total Porsi
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-100">
            {activeSummary?.totalPorsi ? activeSummary.totalPorsi.toLocaleString('id-ID') : '0'}{' '}
            <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">porsi</span>
          </div>
          <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
            Target distribusi
          </div>
        </div>

        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" />
            Siswa & Sekolah
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-950 dark:text-blue-100">
            {activeSummary?.totalSiswa ? activeSummary.totalSiswa.toLocaleString('id-ID') : '0'}{' '}
            <span className="text-xs font-normal text-blue-700 dark:text-blue-400">siswa</span>
          </div>
          <div className="text-[10px] text-blue-700/80 dark:text-blue-400">
            {activeSummary?.totalInstansi || 0} Instansi Terdaftar
          </div>
        </div>

        <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
            <Baby className="w-3.5 h-3.5" />
            Balita & Ibu Hamil
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-100">
            {((activeSummary?.totalBalita || 0) + (activeSummary?.totalIbuHamil || 0) + (activeSummary?.totalIbuMenyusui || 0)).toLocaleString('id-ID')}{' '}
            <span className="text-xs font-normal text-amber-700 dark:text-amber-400">jiwa</span>
          </div>
          <div className="text-[10px] text-amber-700/80 dark:text-amber-400">
            Bumil, Busui, Balita
          </div>
        </div>

        <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/60 rounded-2xl space-y-1">
          <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-1">
            <School className="w-3.5 h-3.5" />
            Guru & Staf
          </span>
          <div className="text-xl sm:text-2xl font-black text-purple-950 dark:text-purple-100">
            {activeSummary?.totalGuru ? activeSummary.totalGuru.toLocaleString('id-ID') : '0'}{' '}
            <span className="text-xs font-normal text-purple-700 dark:text-purple-400">orang</span>
          </div>
          <div className="text-[10px] text-purple-700/80 dark:text-purple-400">
            Tenaga Pengajar
          </div>
        </div>
      </div>

      {/* Detail Record Table per Instansi */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
          <span>Detail Rincian Instansi / Penerima ({activeRecords.length} Lokasi)</span>
          <span className="text-[11px] font-medium text-slate-400">
            Status Lock: {activeSummary?.statusLock === 'FINAL' ? '🔒 FINAL' : '📝 DRAFT'}
          </span>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Memuat data penerima manfaat...</span>
          </div>
        ) : activeRecords.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Belum ada data penerima manfaat untuk tanggal ini ({getDisplayDate(activeDateStr)}).
            </p>
            <button
              onClick={() => onNavigate && onNavigate('/penerima-manfaat')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              + Input / Replikasi Data Instansi
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Nama Instansi / Sekolah</th>
                  <th className="py-3 px-3">Kelompok Target</th>
                  <th className="py-3 px-3 text-right">Awal</th>
                  <th className="py-3 px-3 text-right text-emerald-600">+Tambah</th>
                  <th className="py-3 px-3 text-right text-rose-600">-Kurang</th>
                  <th className="py-3 px-4 text-right">Total Porsi</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{rec.namaInstansi}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {rec.groupNama || rec.kategori}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                      {rec.jumlahAwal}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {rec.penambahan > 0 ? `+${rec.penambahan}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-rose-600 dark:text-rose-400">
                      {rec.pengurangan > 0 ? `-${rec.pengurangan}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100 text-sm">
                      {rec.totalPenerima.toLocaleString('id-ID')}{' '}
                      <span className="text-[10px] font-normal text-slate-400">porsi</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {rec.status === 'FINAL' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> FINAL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" /> DRAFT
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
