import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Download,
  UtensilsCrossed,
  Boxes,
  Users,
  Coins,
  Building2,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Edit3,
  Check,
  X
} from 'lucide-react';
import {
  RabBahanBakuItem,
  RabOperasionalBarangItem,
  GajiKaryawanRecord,
  InsentifPicRecord,
  GajiStafRecord,
  OperasionalLainnyaItem,
  InsentifFasilitasRecord,
  RealisasiBahanBakuItem,
  RealisasiOperasionalItem
} from '../../types/akuntan';
import { formatRupiah, exportTableToExcel } from '../../utils/akuntanDocGenerator';
import { calculateDailyRecordsPortion } from '../../utils/portionHelper';

interface DashboardAkuntanProps {
  rabBahanBaku: RabBahanBakuItem[];
  rabOperasionalBarang: RabOperasionalBarangItem[];
  gajiKaryawan: GajiKaryawanRecord[];
  insentifPicLembaga: InsentifPicRecord[];
  insentifPicPosyandu: InsentifPicRecord[];
  gajiStaf: GajiStafRecord[];
  operasionalLainnya: OperasionalLainnyaItem[];
  insentifFasilitas: InsentifFasilitasRecord[];
  realisasiBahanBaku: RealisasiBahanBakuItem[];
  realisasiOperasional: RealisasiOperasionalItem[];
  onNavigate: (path: string) => void;
  onRefreshData?: () => void;
}

// Visual color palette for charts
const CATEGORY_COLORS: Record<string, string> = {
  'Bahan Pokok': '#0D9488', // Teal-600
  'Lauk Hewani': '#E11D48', // Rose-600
  'Lauk Nabati': '#F59E0B', // Amber-500
  'Sayuran': '#10B981', // Emerald-500
  'Buah & Pelengkap': '#8B5CF6', // Violet-500
  'Bumbu & Minyak': '#6366F1', // Indigo-500
};

const OPERATIONAL_COLORS = [
  '#0EA5E9', // Sky
  '#F97316', // Orange
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#84CC16', // Lime
  '#14B8A6', // Teal
  '#A855F7', // Purple
  '#EAB308', // Yellow
];

// Custom Tooltip component for Recharts
const CustomCurrencyTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700/80 text-xs backdrop-blur-md min-w-[180px] space-y-1.5 animate-in fade-in zoom-in-95">
        <div className="font-extrabold text-slate-200 border-b border-slate-700/70 pb-1">
          {label}
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color || entry.fill }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              {entry.name}:
            </span>
            <span className="font-bold text-white">
              {formatRupiah(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Tarif Standar Pagu SPPG sesuai spesifikasi user & image_b82c3f1c.png
const TARIF_SPPG = {
  porsiBesar: {
    total: 15000,
    bahanBaku: 10000,
    operasional: 3000,
    sewaFasilitas: 2000
  },
  porsiKecil: {
    total: 13000,
    bahanBaku: 8000,
    operasional: 3000,
    sewaFasilitas: 2000
  }
};

export const DashboardAkuntan: React.FC<DashboardAkuntanProps> = ({
  rabBahanBaku,
  rabOperasionalBarang,
  gajiKaryawan,
  insentifPicLembaga,
  insentifPicPosyandu,
  gajiStaf,
  operasionalLainnya,
  insentifFasilitas,
  realisasiBahanBaku,
  realisasiOperasional,
  onNavigate,
  onRefreshData
}) => {
  // Filter Tanggal State (Menggantikan filter bulan sesuai instruksi user)
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-01');
  const [activeChartTab, setActiveChartTab] = useState<'semua' | 'bahanBaku' | 'operasional' | 'komparasiTigaBagian'>('semua');
  const [isLoadingBeneficiary, setIsLoadingBeneficiary] = useState<boolean>(false);
  const [isEditingPm, setIsEditingPm] = useState<boolean>(false);

  // Beneficiary PM Harian State
  const [beneficiaryState, setBeneficiaryState] = useState<{
    porsiBesar: number;
    porsiKecil: number;
    totalPm: number;
    hasPlanning: boolean;
    isCustom: boolean;
  }>({
    porsiBesar: 2354,
    porsiKecil: 562,
    totalPm: 2916,
    hasPlanning: true,
    isCustom: false
  });

  // Fetch data Penerima Manfaat riil sesuai tanggal yang dipilih
  const fetchBeneficiaryForDate = useCallback(async (dateStr: string) => {
    setIsLoadingBeneficiary(true);
    try {
      const res = await fetch(`/api/v1/penerima-manfaat/by-date?tanggal=${dateStr}`);
      if (!res.ok) {
        setIsLoadingBeneficiary(false);
        return;
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setIsLoadingBeneficiary(false);
        return;
      }
      const text = await res.text();
      if (!text || !text.trim().startsWith('{')) {
        setIsLoadingBeneficiary(false);
        return;
      }
      const json = JSON.parse(text);

      if (json.success && ((json.records && json.records.length > 0) || (json.summary && json.summary.totalPenerima > 0))) {
        const calculated = calculateDailyRecordsPortion(json.records || [], json.summary);
        if (calculated.totalPenerima > 0) {
          setBeneficiaryState({
            porsiBesar: calculated.overallPorsiBesar,
            porsiKecil: calculated.overallPorsiKecil,
            totalPm: calculated.totalPenerima,
            hasPlanning: true,
            isCustom: false
          });
        } else {
          setBeneficiaryState({
            porsiBesar: 0,
            porsiKecil: 0,
            totalPm: 0,
            hasPlanning: false,
            isCustom: false
          });
        }
      } else {
        // Fallback bila belum ada data perencanaan di tanggal tersebut
        setBeneficiaryState(prev => {
          if (prev.isCustom) return prev;
          return {
            porsiBesar: 0,
            porsiKecil: 0,
            totalPm: 0,
            hasPlanning: false,
            isCustom: false
          };
        });
      }
    } catch (err) {
      console.warn('[DashboardAkuntan] Warning fetching beneficiary data:', err);
    } finally {
      setIsLoadingBeneficiary(false);
    }
  }, []);

  useEffect(() => {
    fetchBeneficiaryForDate(selectedDate);
  }, [selectedDate, fetchBeneficiaryForDate]);

  // Stepper tanggal (+1 hari / -1 hari)
  const handleStepDate = (days: number) => {
    try {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + days);
      setSelectedDate(d.toISOString().split('T')[0]);
    } catch {
      // fallback
    }
  };

  const formattedDisplayDate = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // =========================================================================
  // KALKULASI UTAMA SESUAI GAMBAR STRUKTUR (image_b82c3f1c.png):
  // 1. Porsi Besar = 15.000 (Bahan Baku 10.000 + Operasional 3.000 + Sewa Fasilitas 2.000)
  // 2. Porsi Kecil = 13.000 (Bahan Baku 8.000 + Operasional 3.000 + Sewa Fasilitas 2.000)
  // 3. Dikalikan Jumlah PM Harian sesuai tanggal
  // =========================================================================
  const pbCount = beneficiaryState.porsiBesar;
  const pkCount = beneficiaryState.porsiKecil;
  const totalPmCount = beneficiaryState.totalPm;

  // Breakdown Porsi Besar
  const paguPorsiBesar = pbCount * TARIF_SPPG.porsiBesar.total; // pb * 15.000
  const bbPorsiBesar = pbCount * TARIF_SPPG.porsiBesar.bahanBaku; // pb * 10.000
  const opPorsiBesar = pbCount * TARIF_SPPG.porsiBesar.operasional; // pb * 3.000
  const fasPorsiBesar = pbCount * TARIF_SPPG.porsiBesar.sewaFasilitas; // pb * 2.000

  // Breakdown Porsi Kecil
  const paguPorsiKecil = pkCount * TARIF_SPPG.porsiKecil.total; // pk * 13.000
  const bbPorsiKecil = pkCount * TARIF_SPPG.porsiKecil.bahanBaku; // pk * 8.000
  const opPorsiKecil = pkCount * TARIF_SPPG.porsiKecil.operasional; // pk * 3.000
  const fasPorsiKecil = pkCount * TARIF_SPPG.porsiKecil.sewaFasilitas; // pk * 2.000

  // 3 BAGIAN UTAMA (Total Gabungan)
  // 1. RAB Bahan Baku = (Porsi Besar * 10.000) + (Porsi Kecil * 8.000)
  const totalRabBahanBakuHarian = bbPorsiBesar + bbPorsiKecil;

  // 2. RAB Operasional = (Porsi Besar * 3.000) + (Porsi Kecil * 3.000) = Total PM * 3.000
  const totalRabOperasionalHarian = opPorsiBesar + opPorsiKecil;

  // 3. RAB Sewa Fasilitas Dapur = (Porsi Besar * 2.000) + (Porsi Kecil * 2.000) = Total PM * 2.000
  const totalRabSewaFasilitasHarian = fasPorsiBesar + fasPorsiKecil;

  // 4. PAGU KESELURUHAN = Porsi Besar * 15.000 + Porsi Kecil * 13.000
  // Memenuhi persamaan eksak: Bahan Baku + Operasional + Sewa Fasilitas Dapur = Pagu Keseluruhan
  const paguKeseluruhanHarian = paguPorsiBesar + paguPorsiKecil;

  // Realisasi Belanja Riil Bahan Baku & Operasional pada tanggal terkait
  const totalRealisasiBb = useMemo(() => {
    return realisasiBahanBaku.reduce((acc, c) => acc + c.totalRealisasi, 0);
  }, [realisasiBahanBaku]);

  const totalRealisasiOp = useMemo(() => {
    return realisasiOperasional.reduce((acc, c) => acc + c.biayaRiil, 0);
  }, [realisasiOperasional]);

  const grandTotalRealisasi = totalRealisasiBb + totalRealisasiOp;
  const persentaseSerapBb = totalRabBahanBakuHarian > 0 ? Number(((totalRealisasiBb / totalRabBahanBakuHarian) * 100).toFixed(1)) : 0;
  const persentaseSerapPagu = paguKeseluruhanHarian > 0 ? Number(((grandTotalRealisasi / paguKeseluruhanHarian) * 100).toFixed(1)) : 0;
  const efisiensiSurplus = paguKeseluruhanHarian - grandTotalRealisasi;

  // Pie Chart 3 Bagian Pagu (Bahan Baku vs Operasional vs Sewa Fasilitas)
  const threePartPieData = useMemo(() => {
    return [
      { name: 'RAB Bahan Baku', value: totalRabBahanBakuHarian, color: '#0D9488' }, // Teal
      { name: 'RAB Operasional', value: totalRabOperasionalHarian, color: '#0284C7' }, // Sky
      { name: 'RAB Sewa Fasilitas Dapur', value: totalRabSewaFasilitasHarian, color: '#F59E0B' } // Amber
    ];
  }, [totalRabBahanBakuHarian, totalRabOperasionalHarian, totalRabSewaFasilitasHarian]);

  // Chart 1 Data: Comparison RAB vs Realisasi per Kategori Bahan Baku
  const categoryComparisonData = useMemo(() => {
    const categories: Record<string, { kategori: string; rab: number; realisasi: number }> = {};

    rabBahanBaku.forEach(item => {
      if (!categories[item.kategori]) {
        categories[item.kategori] = { kategori: item.kategori, rab: 0, realisasi: 0 };
      }
      categories[item.kategori].rab += item.totalAnggaran;
    });

    realisasiBahanBaku.forEach(item => {
      const matched = rabBahanBaku.find(r => r.namaBarang.toLowerCase().includes(item.namaBarang.toLowerCase()));
      const cat = matched ? matched.kategori : 'Bahan Pokok';
      if (!categories[cat]) {
        categories[cat] = { kategori: cat, rab: 0, realisasi: 0 };
      }
      categories[cat].realisasi += item.totalRealisasi;
    });

    return Object.values(categories);
  }, [rabBahanBaku, realisasiBahanBaku]);

  // Chart 2 Data: Pie Chart Proporsi Alokasi Bahan Baku
  const pieCategoryData = useMemo(() => {
    return categoryComparisonData.map(c => ({
      name: c.kategori,
      value: c.rab,
      color: CATEGORY_COLORS[c.kategori] || '#0D9488'
    }));
  }, [categoryComparisonData]);

  // Chart 3 Data: Alokasi Operasional Breakdown
  const operationalBreakdownData = useMemo(() => {
    return [
      {
        kategori: 'Gaji Karyawan Dapur',
        nominal: gajiKaryawan.reduce((a, c) => a + c.gajiBersih, 0),
        jenis: 'Jasa Tenaga Masak'
      },
      {
        kategori: 'Gaji Staf & Manajemen',
        nominal: gajiStaf.reduce((a, c) => a + c.gajiBersih, 0),
        jenis: 'Jasa Struktural'
      },
      {
        kategori: 'Sewa Fasilitas Dapur',
        nominal: insentifFasilitas.reduce((a, c) => a + c.totalInsentif, 0),
        jenis: 'Sewa Fasilitas Dapur'
      },
      {
        kategori: 'Pengadaan Barang Dapur & APD',
        nominal: rabOperasionalBarang.reduce((a, c) => a + c.totalAnggaran, 0),
        jenis: 'Barang Perlengkapan'
      },
      {
        kategori: 'Operasional Lainnya (Listrik/Lab)',
        nominal: operasionalLainnya.reduce((a, c) => a + c.jumlahBiaya, 0),
        jenis: 'Utilitas & Lab'
      },
      {
        kategori: 'Insentif PIC Sekolah',
        nominal: insentifPicLembaga.reduce((a, c) => a + c.totalInsentif, 0),
        jenis: 'Insentif Mitra'
      },
      {
        kategori: 'Insentif PIC Posyandu',
        nominal: insentifPicPosyandu.reduce((a, c) => a + c.totalInsentif, 0),
        jenis: 'Insentif Mitra'
      }
    ].sort((a, b) => b.nominal - a.nominal);
  }, [gajiKaryawan, gajiStaf, insentifFasilitas, rabOperasionalBarang, operasionalLainnya, insentifPicLembaga, insentifPicPosyandu]);

  const totalAnggaranRabOp = useMemo(() => {
    return operationalBreakdownData.reduce((acc, c) => acc + c.nominal, 0);
  }, [operationalBreakdownData]);

  // Chart 4 Data: Daily Cumulative Trend
  const dailyTrendData = useMemo(() => {
    return [
      { tanggal: '26 Okt', paguMaksimal: 42616000, rabBahanBaku: 28036000, realisasiRiil: 26850000 },
      { tanggal: '27 Okt', paguMaksimal: 42616000, rabBahanBaku: 28036000, realisasiRiil: 27120000 },
      { tanggal: '28 Okt', paguMaksimal: 42616000, rabBahanBaku: 28036000, realisasiRiil: 26900000 },
      { tanggal: '29 Okt', paguMaksimal: 42616000, rabBahanBaku: 28036000, realisasiRiil: 27300000 },
      { tanggal: '30 Okt', paguMaksimal: 42616000, rabBahanBaku: 28036000, realisasiRiil: 27050000 },
      { tanggal: '31 Okt', paguMaksimal: 42616000, rabBahanBaku: 28036000, realisasiRiil: 26980000 },
      { tanggal: '01 Nov', paguMaksimal: paguKeseluruhanHarian, rabBahanBaku: totalRabBahanBakuHarian, realisasiRiil: grandTotalRealisasi }
    ];
  }, [paguKeseluruhanHarian, totalRabBahanBakuHarian, grandTotalRealisasi]);

  return (
    <div className="space-y-6">
      {/* =========================================================================
          EXECUTIVE TOOLBAR DENGAN FILTER TANGGAL (PILIH TANGGAL SPESIFIK)
         ========================================================================= */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-teal-800/60 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Struktur Pagu & Alokasi Anggaran Harian SPPG</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Dashboard Keuangan Eksekutif</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-900/80 text-teal-300 border border-teal-700 font-bold">
                Porsi Besar: Rp 15.000 | Porsi Kecil: Rp 13.000
              </span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Perhitungan pagu harian dikalikan jumlah penerima manfaat sesuai tanggal yang dipilih, dibagi menjadi 3 bagian: RAB Bahan Baku, RAB Operasional, dan Sewa Fasilitas Dapur.
            </p>
          </div>

          {/* FILTER TANGGAL KONTROL UTAMA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Date Input with Stepper */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-2xl p-1 shadow-inner">
              <button
                type="button"
                onClick={() => handleStepDate(-1)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-all cursor-pointer"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs w-32"
                />
              </div>

              <button
                type="button"
                onClick={() => handleStepDate(1)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-all cursor-pointer"
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Refresh */}
            {onRefreshData && (
              <button
                type="button"
                onClick={() => {
                  fetchBeneficiaryForDate(selectedDate);
                  onRefreshData();
                }}
                disabled={isLoadingBeneficiary}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-slate-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="Perbarui data tanggal ini"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isLoadingBeneficiary ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Export Summary Excel */}
            <button
              type="button"
              onClick={() => {
                const headers = ['Kategori / Alokasi', 'Porsi Besar (Rp)', 'Porsi Kecil (Rp)', 'Total Anggaran Harian (Rp)', 'Persentase Alokasi (%)'];
                const rows = [
                  [
                    'RAB Bahan Baku',
                    bbPorsiBesar,
                    bbPorsiKecil,
                    totalRabBahanBakuHarian,
                    `${((totalRabBahanBakuHarian / paguKeseluruhanHarian) * 100).toFixed(1)}%`
                  ],
                  [
                    'RAB Operasional',
                    opPorsiBesar,
                    opPorsiKecil,
                    totalRabOperasionalHarian,
                    `${((totalRabOperasionalHarian / paguKeseluruhanHarian) * 100).toFixed(1)}%`
                  ],
                  [
                    'RAB Sewa Fasilitas Dapur',
                    fasPorsiBesar,
                    fasPorsiKecil,
                    totalRabSewaFasilitasHarian,
                    `${((totalRabSewaFasilitasHarian / paguKeseluruhanHarian) * 100).toFixed(1)}%`
                  ],
                  [
                    'PAGU KESELURUHAN (TOTAL)',
                    paguPorsiBesar,
                    paguPorsiKecil,
                    paguKeseluruhanHarian,
                    '100.0%'
                  ]
                ];
                exportTableToExcel(rows, headers, `Pagu_RAB_SPPG_${selectedDate}`, `Pagu SPPG ${selectedDate}`);
              }}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-teal-500/20"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Ringkasan</span>
            </button>
          </div>
        </div>

        {/* Quick Date Shortcuts & Beneficiary Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80 mt-4 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Pintasan Tanggal:</span>
            {[
              { label: 'Hari Ini (01 Nov)', date: '2026-11-01' },
              { label: 'Besok (02 Nov)', date: '2026-11-02' },
              { label: '29 Okt 2026', date: '2026-10-29' },
              { label: '26 Okt 2026 (Demo Ref)', date: '2026-10-26' }
            ].map(p => (
              <button
                key={p.date}
                type="button"
                onClick={() => setSelectedDate(p.date)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  selectedDate === p.date
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-[11px]">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{formattedDisplayDate}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-bold text-white">
                {totalPmCount.toLocaleString('id-ID')} PM
              </span>
              <span className="text-slate-400 text-[10px]">
                ({pbCount.toLocaleString('id-ID')} Besar + {pkCount.toLocaleString('id-ID')} Kecil)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingPm(!isEditingPm)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="Sesuaikan jumlah PM untuk simulasi"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditingPm ? 'Tutup Edit' : 'Ubah PM'}</span>
            </button>
          </div>
        </div>

        {/* Inline Manual PM Adjuster (jika ingin mengubah PM secara fleksibel) */}
        {isEditingPm && (
          <div className="mt-3 p-3.5 bg-slate-900/95 border border-amber-500/40 rounded-2xl flex flex-wrap items-center gap-4 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300">Porsi Besar:</span>
              <input
                type="number"
                value={pbCount}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value) || 0);
                  setBeneficiaryState(prev => ({
                    ...prev,
                    porsiBesar: val,
                    totalPm: val + prev.porsiKecil,
                    isCustom: true
                  }));
                }}
                className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-center outline-none focus:border-amber-400"
              />
              <span className="text-slate-400">jiwa</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-300">Porsi Kecil:</span>
              <input
                type="number"
                value={pkCount}
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value) || 0);
                  setBeneficiaryState(prev => ({
                    ...prev,
                    porsiKecil: val,
                    totalPm: prev.porsiBesar + val,
                    isCustom: true
                  }));
                }}
                className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-center outline-none focus:border-emerald-400"
              />
              <span className="text-slate-400">jiwa</span>
            </div>

            <button
              type="button"
              onClick={() => fetchBeneficiaryForDate(selectedDate)}
              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer ml-auto"
            >
              Kembalikan ke data riil
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          STRUKTUR HEADER FORMULA VISUAL SESUAI GAMBAR PENGGUNA (image_b82c3f1c.png)
          - PAGU (15.000 PORSI BESAR, 13.000 PORSI KECIL)
          - BAHAN BAKU (10000 / 8000)
          - OPERASIONAL (3000 / 3000)
          - SEWA FASILITAS DAPUR (2000 / 2000)
          - X JUMLAH PM HARIAN
         ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-900 dark:border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs sm:text-sm font-bold">
            <thead>
              <tr className="border-b-2 border-slate-900 dark:border-slate-700">
                {/* Kolom Kiri: PAGU (Orange Background) */}
                <th
                  rowSpan={1}
                  className="bg-[#FF9800] text-slate-950 font-black text-sm sm:text-base p-3.5 border-r-2 border-slate-900 dark:border-slate-700 w-1/4 uppercase tracking-wider"
                >
                  PAGU
                </th>
                <th className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 p-3 border-r-2 border-slate-900 dark:border-slate-700 w-1/5 uppercase text-xs">
                  KATEGORI PORSI
                </th>
                <th className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-black p-3 border-r-2 border-slate-900 dark:border-slate-700 uppercase tracking-wider">
                  BAHAN BAKU
                </th>
                <th className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-black p-3 border-r-2 border-slate-900 dark:border-slate-700 uppercase tracking-wider">
                  OPERASIONAL
                </th>
                <th className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-black p-3 uppercase tracking-wider">
                  SEWA FASILITAS DAPUR
                </th>
              </tr>
            </thead>
            <tbody>
              {/* BARIS 1: PORSI BESAR */}
              <tr className="border-b-2 border-slate-900 dark:border-slate-700">
                <td className="bg-[#FF9800] text-slate-950 font-black p-3.5 border-r-2 border-slate-900 dark:border-slate-700 text-xs sm:text-sm">
                  15.000 PORSI BESAR
                </td>
                <td className="bg-[#FFE0B2] text-amber-950 font-black p-3.5 border-r-2 border-slate-900 dark:border-slate-700 uppercase">
                  PORSI BESAR
                </td>
                <td className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3.5 border-r-2 border-slate-900 dark:border-slate-700 font-mono text-sm sm:text-base">
                  10000
                </td>
                <td className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3.5 border-r-2 border-slate-900 dark:border-slate-700 font-mono text-sm sm:text-base">
                  3000
                </td>
                <td className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3.5 font-mono text-sm sm:text-base">
                  2000
                </td>
              </tr>

              {/* BARIS 2: PORSI KECIL */}
              <tr className="border-b-2 border-slate-900 dark:border-slate-700">
                <td className="bg-[#FF9800] text-slate-950 font-black p-3.5 border-r-2 border-slate-900 dark:border-slate-700 text-xs sm:text-sm">
                  13.000 PORSI KECIL
                </td>
                <td className="bg-[#C8E6C9] text-emerald-950 font-black p-3.5 border-r-2 border-slate-900 dark:border-slate-700 uppercase">
                  PORSI KECIL
                </td>
                <td className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3.5 border-r-2 border-slate-900 dark:border-slate-700 font-mono text-sm sm:text-base">
                  8000
                </td>
                <td className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3.5 border-r-2 border-slate-900 dark:border-slate-700 font-mono text-sm sm:text-base">
                  3000
                </td>
                <td className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3.5 font-mono text-sm sm:text-base">
                  2000
                </td>
              </tr>

              {/* BARIS BAWAH: X JUMLAH PM HARIAN (Yellow Highlight Banner) */}
              <tr>
                <td
                  colSpan={5}
                  className="bg-[#FFEE58] text-slate-950 font-black text-xs sm:text-sm py-3 px-4 tracking-wider uppercase shadow-inner"
                >
                  ✖ JUMLAH PM HARIAN : {totalPmCount.toLocaleString('id-ID')} PENERIMA MANFAAT ({pbCount.toLocaleString('id-ID')} PORSI BESAR + {pkCount.toLocaleString('id-ID')} PORSI KECIL)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RINCIAN PERHITUNGAN MATEMATIS REAL-TIME HASIL PERKALIAN */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-t-2 border-slate-900 dark:border-slate-700 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Porsi Besar Math Box */}
            <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between font-black text-amber-900 dark:text-amber-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Kalkulasi Porsi Besar ({pbCount.toLocaleString('id-ID')} PM)
                </span>
                <span className="text-sm font-black text-amber-950 dark:text-white">
                  {formatRupiah(paguPorsiBesar)}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                <div className="flex justify-between">
                  <span>• Bahan Baku ({pbCount.toLocaleString('id-ID')} × Rp 10.000):</span>
                  <span className="font-bold text-teal-700 dark:text-teal-400">{formatRupiah(bbPorsiBesar)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Operasional ({pbCount.toLocaleString('id-ID')} × Rp 3.000):</span>
                  <span className="font-bold text-sky-700 dark:text-sky-400">{formatRupiah(opPorsiBesar)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Sewa Fasilitas Dapur ({pbCount.toLocaleString('id-ID')} × Rp 2.000):</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">{formatRupiah(fasPorsiBesar)}</span>
                </div>
              </div>
            </div>

            {/* Porsi Kecil Math Box */}
            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between font-black text-emerald-900 dark:text-emerald-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Kalkulasi Porsi Kecil ({pkCount.toLocaleString('id-ID')} PM)
                </span>
                <span className="text-sm font-black text-emerald-950 dark:text-white">
                  {formatRupiah(paguPorsiKecil)}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                <div className="flex justify-between">
                  <span>• Bahan Baku ({pkCount.toLocaleString('id-ID')} × Rp 8.000):</span>
                  <span className="font-bold text-teal-700 dark:text-teal-400">{formatRupiah(bbPorsiKecil)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Operasional ({pkCount.toLocaleString('id-ID')} × Rp 3.000):</span>
                  <span className="font-bold text-sky-700 dark:text-sky-400">{formatRupiah(opPorsiKecil)}</span>
                </div>
                <div className="flex justify-between">
                  <span>• Sewa Fasilitas Dapur ({pkCount.toLocaleString('id-ID')} × Rp 2.000):</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">{formatRupiah(fasPorsiKecil)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4 KARTU HASIL PEMBAGIAN ANGGARAN UTAMA (HASIL PERKALIAN 3 BAGIAN)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KARTU 1: PAGU KESELURUHAN */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent bg-white dark:bg-slate-900 border-2 border-amber-500/60 dark:border-amber-500/40 rounded-3xl p-5 shadow-xs space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md">
              PAGU KESELURUHAN (100%)
            </span>
            <Calculator className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {formatRupiah(paguKeseluruhanHarian)}
          </div>
          <div className="text-[11px] text-slate-500 leading-snug">
            Plafon maksimal SPPG: {totalPmCount.toLocaleString('id-ID')} Penerima Manfaat
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
            PB (15rb) + PK (13rb)
          </div>
        </div>

        {/* KARTU 2: RAB BAHAN BAKU (BAGIAN 1) */}
        <div className="bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent bg-white dark:bg-slate-900 border-2 border-teal-500/60 dark:border-teal-500/40 rounded-3xl p-5 shadow-xs space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-400 bg-teal-100 dark:bg-teal-950/80 px-2 py-0.5 rounded-md">
              1. RAB BAHAN BAKU
            </span>
            <UtensilsCrossed className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-teal-900 dark:text-teal-200 tracking-tight">
            {formatRupiah(totalRabBahanBakuHarian)}
          </div>
          <div className="text-[11px] text-slate-500 leading-snug">
            {((totalRabBahanBakuHarian / (paguKeseluruhanHarian || 1)) * 100).toFixed(1)}% dari Pagu Total SPPG
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-teal-700 dark:text-teal-300">
            PB (10rb) + PK (8rb)
          </div>
        </div>

        {/* KARTU 3: RAB OPERASIONAL (BAGIAN 2) */}
        <div className="bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent bg-white dark:bg-slate-900 border-2 border-sky-500/60 dark:border-sky-500/40 rounded-3xl p-5 shadow-xs space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded-md">
              2. RAB OPERASIONAL
            </span>
            <Boxes className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-900 dark:text-sky-200 tracking-tight">
            {formatRupiah(totalRabOperasionalHarian)}
          </div>
          <div className="text-[11px] text-slate-500 leading-snug">
            {((totalRabOperasionalHarian / (paguKeseluruhanHarian || 1)) * 100).toFixed(1)}% dari Pagu Total SPPG
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
            Rp 3.000 × {totalPmCount.toLocaleString('id-ID')} PM
          </div>
        </div>

        {/* KARTU 4: RAB SEWA FASILITAS DAPUR (BAGIAN 3) */}
        <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent bg-white dark:bg-slate-900 border-2 border-purple-500/60 dark:border-purple-500/40 rounded-3xl p-5 shadow-xs space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/80 px-2 py-0.5 rounded-md">
              3. SEWA FASILITAS DAPUR
            </span>
            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-900 dark:text-purple-200 tracking-tight">
            {formatRupiah(totalRabSewaFasilitasHarian)}
          </div>
          <div className="text-[11px] text-slate-500 leading-snug">
            {((totalRabSewaFasilitasHarian / (paguKeseluruhanHarian || 1)) * 100).toFixed(1)}% dari Pagu Total SPPG
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-purple-700 dark:text-purple-300">
            Rp 2.000 × {totalPmCount.toLocaleString('id-ID')} PM
          </div>
        </div>
      </div>

      {/* Main Charts Section (Row 1: Bar Comparison & Donut Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Perbandingan Anggaran vs Realisasi per Kategori Bahan Baku */}
        <div className="lg:col-span-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Perbandingan RAB vs Realisasi Belanja Bahan Baku
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Evaluasi penyerapan anggaran pangan berdasarkan 6 kategori komposisi gizi SPPG
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">
                <span className="w-2 h-2 rounded-full bg-teal-600" />
                Anggaran RAB
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Realisasi Riil
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryComparisonData}
                margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis
                  dataKey="kategori"
                  tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<CustomCurrencyTooltip />} />
                <Bar
                  dataKey="rab"
                  name="Anggaran RAB"
                  fill="#0D9488"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="realisasi"
                  name="Realisasi Belanja"
                  fill="#E11D48"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Komposisi Alokasi Pagu (Donut Chart: 3 Bagian Pagu / Bahan Baku) */}
        <div className="lg:col-span-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Proporsi Alokasi Pagu
                </h3>
              </div>
              {/* Tab Mode Switcher */}
              <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveChartTab('komparasiTigaBagian')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    activeChartTab === 'komparasiTigaBagian' || activeChartTab === 'semua'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  3 Bagian Pagu
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('bahanBaku')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    activeChartTab === 'bahanBaku'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Kategori Bahan
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {activeChartTab === 'bahanBaku'
                ? 'Porsi anggaran makanan bergizi per 6 kelompok pangan'
                : 'Pembagian Pagu Harian: Bahan Baku, Operasional & Sewa Fasilitas Dapur'}
            </p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeChartTab === 'bahanBaku' ? pieCategoryData : threePartPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(activeChartTab === 'bahanBaku' ? pieCategoryData : threePartPieData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomCurrencyTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Donut summary */}
            <div className="absolute text-center pointer-events-none">
              <span className="text-[9px] font-bold text-slate-400 block uppercase">
                {activeChartTab === 'bahanBaku' ? 'Total Bahan' : 'Pagu Total'}
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                {activeChartTab === 'bahanBaku'
                  ? `${(totalRabBahanBakuHarian / 1000000).toFixed(1)} Jt`
                  : `${(paguKeseluruhanHarian / 1000000).toFixed(1)} Jt`}
              </span>
            </div>
          </div>

          {/* Interactive Legend with values */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
            {(activeChartTab === 'bahanBaku' ? pieCategoryData : threePartPieData).map((item, idx) => {
              const baseTotal = activeChartTab === 'bahanBaku' ? (totalRabBahanBakuHarian || 1) : (paguKeseluruhanHarian || 1);
              const percent = ((item.value / baseTotal) * 100).toFixed(1);
              return (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-1">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{formatRupiah(item.value)}</span>
                    <span className="font-extrabold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-1 rounded">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Operational Breakdown & Daily Realization Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 3: Struktur Beban RAB Operasional (Barang vs Jasa Penggajian & Insentif) */}
        <div className="lg:col-span-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Struktur Beban RAB Operasional (Barang & Jasa)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Rincian biaya tenaga kerja, fasilitas, barang perlengkapan, dan mitra
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
              {formatRupiah(totalAnggaranRabOp)}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {operationalBreakdownData.map((item, idx) => {
              const pct = totalAnggaranRabOp > 0 ? (item.nominal / totalAnggaranRabOp) * 100 : 0;
              const color = OPERATIONAL_COLORS[idx % OPERATIONAL_COLORS.length];
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.kategori}</span>
                      <span className="text-[10px] text-slate-400 font-medium">({item.jenis})</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-slate-900 dark:text-slate-100 mr-2">{formatRupiah(item.nominal)}</span>
                      <span className="text-[10px] font-bold text-slate-400">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Daily Cumulative Realization Trend (Area Chart) */}
        <div className="lg:col-span-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Tren Harian Penyerapan Anggaran vs Pagu Maksimal
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kurva stabilitas pengeluaran harian SPPG menjaga agar tidak melampaui plafon
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300">
              Pagu Rp 15.000 / Porsi Aman
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyTrendData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPagu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E11D48" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#E11D48" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="tanggal" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Jt`}
                  domain={[15000000, 21000000]}
                />
                <Tooltip content={<CustomCurrencyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="paguMaksimal"
                  name="Batas Plafon Maksimal"
                  stroke="#E11D48"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="url(#colorPagu)"
                />
                <Area
                  type="monotone"
                  dataKey="realisasiRiil"
                  name="Realisasi Pengeluaran Riil"
                  stroke="#0D9488"
                  strokeWidth={2.5}
                  fill="url(#colorRealisasi)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500">Rata-rata Realisasi Harian:</span>
            <span className="font-black text-slate-800 dark:text-slate-200">Rp 18.230.000 / Hari</span>
            <span className="text-emerald-600 font-bold text-[11px]">Hemat Rp 1.770.000 / Hari</span>
          </div>
        </div>
      </div>

      {/* Row 3: Executive Fast-Action Monitoring Table (Top Cost Drivers) */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Indikator Kunci & Item Anggaran Terbesar (High Impact Cost)
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Komponen dengan serapan anggaran terbesar yang memerlukan pengawasan kepatuhan berkala
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/akuntan/rab-bahan-baku')}
              className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Lihat Seluruh RAB</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Item Belanja Utama</th>
                <th className="py-2.5 px-3">Klasifikasi</th>
                <th className="py-2.5 px-3 text-right">Alokasi Anggaran</th>
                <th className="py-2.5 px-3 text-right">Realisasi Riil</th>
                <th className="py-2.5 px-3 text-center">Status Serapan</th>
                <th className="py-2.5 px-3 text-center">Kepatuhan Harga</th>
                <th className="py-2.5 px-3 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rabBahanBaku.slice(0, 5).map((item, idx) => {
                const matched = realisasiBahanBaku.find(r => r.namaBarang.toLowerCase().includes(item.namaBarang.toLowerCase()));
                const riil = matched ? matched.totalRealisasi : item.totalAnggaran * 0.98;
                const ratio = ((riil / item.totalAnggaran) * 100).toFixed(1);
                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                      {item.namaBarang}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                      {formatRupiah(item.totalAnggaran)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-teal-700 dark:text-teal-400">
                      {formatRupiah(riil)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                        {ratio}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Sesuai Kontrak</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onNavigate('/akuntan/realisasi-bahan-baku')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        Detail Riil
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
