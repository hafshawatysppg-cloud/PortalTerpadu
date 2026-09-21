import React, { useEffect, useState } from 'react';
import { 
  Utensils, 
  Calendar, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ChefHat,
  Apple,
  Salad,
  Egg,
  Cookie,
  FileText,
  Edit3
} from 'lucide-react';

interface MenuHarianDashboardWidgetProps {
  onNavigate?: (path: string) => void;
}

export const MenuHarianDashboardWidget: React.FC<MenuHarianDashboardWidgetProps> = ({ onNavigate }) => {
  const [selectedOffset, setSelectedOffset] = useState<number>(0); // 0 = Hari Ini, 1 = Besok, 2 = Lusa
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [menuText, setMenuText] = useState<string>('');
  const [isPlanned, setIsPlanned] = useState<boolean>(false);

  const getFormattedDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const getDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const targetDateStr = getFormattedDate(selectedOffset);

  const fetchMenuForDate = async (tanggal: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/tugas-divisi/menu-harian?tanggal=${tanggal}`);
      if (!res.ok) {
        throw new Error(`Server status ${res.status}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      const json = await res.json();
      if (json.success && json.data) {
        setMenuText(json.data.menuHarian || '');
        setIsPlanned(Boolean(json.data.menuHarian && json.data.menuHarian.trim()));
      } else {
        setMenuText('');
        setIsPlanned(false);
      }
    } catch (err) {
      console.error('Error fetching menu harian widget:', err);
      setMenuText('');
      setIsPlanned(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuForDate(targetDateStr);
  }, [targetDateStr]);

  // Parse menu text into 5 items
  const parseMenuItems = (text: string) => {
    if (!text || !text.trim()) {
      return {
        karbo: '-',
        laukHewani: '-',
        laukNabati: '-',
        sayur: '-',
        buahExtra: '-',
        catatan: '-'
      };
    }

    const parts = text.split(',').map(s => s.trim());
    return {
      karbo: parts[0] || '-',
      laukHewani: parts[1] || '-',
      laukNabati: parts[2] || '-',
      sayur: parts[3] || '-',
      buahExtra: parts[4] || '-',
      catatan: parts.slice(5).join(', ') || ''
    };
  };

  const parsed = parseMenuItems(menuText);

  return (
    <div className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 rounded-[24px] p-6 shadow-sm space-y-6">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500 text-white rounded-2xl shrink-0 shadow-md shadow-amber-500/20">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Informasi Menu Harian Dapur SPPG
              </h3>
              <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold rounded-full border border-amber-200 dark:border-amber-900">
                5 Komponen Gizi
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rincian sajian makanan bergizi untuk penerima manfaat pada <span className="font-semibold text-amber-600 dark:text-amber-400">{getDisplayDate(targetDateStr)}</span>
            </p>
          </div>
        </div>

        {/* Date Selector Toggles & Action */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setSelectedOffset(0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedOffset === 0
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setSelectedOffset(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedOffset === 1
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Besok
            </button>
            <button
              onClick={() => setSelectedOffset(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedOffset === 2
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Lusa
            </button>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('/tugas-divisi/menu-harian')}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Kelola Menu</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-8 text-center">
          <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto mb-2" />
          <span className="text-xs text-slate-500">Memuat rincian menu harian...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status Bar */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Tanggal: <span className="font-mono text-amber-600 dark:text-amber-400">{targetDateStr}</span> ({getDisplayDate(targetDateStr)})
              </span>
            </div>

            {isPlanned ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Menu Siap & Terjadwal</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Belum Diisi / Perlu Dijadwalkan</span>
              </span>
            )}
          </div>

          {/* 5 Distinct Item Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* 1. Karbohidrat */}
            <div className="bg-amber-50/50 dark:bg-slate-800/60 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400">
                  Item 1 &bull; Pokok
                </span>
                <ChefHat className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Karbohidrat
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                {parsed.karbo}
              </div>
            </div>

            {/* 2. Lauk Hewani */}
            <div className="bg-orange-50/50 dark:bg-slate-800/60 border border-orange-200/60 dark:border-orange-900/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-orange-700 dark:text-orange-400">
                  Item 2 &bull; Protein
                </span>
                <Egg className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Lauk Hewani
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                {parsed.laukHewani}
              </div>
            </div>

            {/* 3. Lauk Nabati */}
            <div className="bg-yellow-50/50 dark:bg-slate-800/60 border border-yellow-200/60 dark:border-yellow-900/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-yellow-700 dark:text-yellow-400">
                  Item 3 &bull; Protein
                </span>
                <Cookie className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Lauk Nabati
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                {parsed.laukNabati}
              </div>
            </div>

            {/* 4. Sayur / Sup */}
            <div className="bg-emerald-50/50 dark:bg-slate-800/60 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
                  Item 4 &bull; Serat & Vit
                </span>
                <Salad className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Sayur / Sup
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                {parsed.sayur}
              </div>
            </div>

            {/* 5. Buah / Susu / Extra */}
            <div className="bg-rose-50/50 dark:bg-slate-800/60 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase text-rose-700 dark:text-rose-400">
                  Item 5 &bull; Buah/Susu
                </span>
                <Apple className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pencuci Mulut / Susu
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                {parsed.buahExtra}
              </div>
            </div>
          </div>

          {/* Combined Text / Notes Footer */}
          {parsed.catatan && parsed.catatan !== '-' && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong className="text-slate-800 dark:text-slate-200">Catatan Khusus:</strong> {parsed.catatan}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
