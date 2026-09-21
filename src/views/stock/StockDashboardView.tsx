import React, { useState, useEffect } from 'react';
import { 
  Boxes, ArrowDownRight, ArrowUpRight, ClipboardCheck, 
  AlertTriangle, DollarSign, TrendingUp, History, Plus, RefreshCw, FileText
} from 'lucide-react';
import { MasterBarang, StockMovement, StockSummaryMetrics } from '../../types';

interface StockDashboardViewProps {
  onNavigate: (path: string) => void;
}

export const StockDashboardView: React.FC<StockDashboardViewProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<StockSummaryMetrics>({
    totalBarang: 0,
    totalStokPcs: 0,
    totalNilaiPersediaan: 0,
    masukHariIni: 0,
    keluarHariIni: 0,
    stokRendahCount: 0,
    opnameTerakhir: '-'
  });
  const [lowStockItems, setLowStockItems] = useState<MasterBarang[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resSummary, resBarang, resMovements] = await Promise.all([
        fetch('/api/v1/stock/summary'),
        fetch('/api/v1/stock/barang'),
        fetch('/api/v1/stock/movements')
      ]);

      const dataSummary = await resSummary.json();
      if (dataSummary.success) setMetrics(dataSummary.data);

      const dataBarang = await resBarang.json();
      if (dataBarang.success) {
        const items: MasterBarang[] = dataBarang.data;
        const low = items.filter(b => b.stokSekarang <= b.stokMinimal);
        setLowStockItems(low);
      }

      const dataMovements = await resMovements.json();
      if (dataMovements.success) {
        setRecentMovements(dataMovements.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching stock dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-white/20 text-white text-[10px] font-extrabold uppercase rounded-full tracking-wider">
              Modul Asli Terintegrasi
            </span>
            <span className="text-xs text-amber-100">Live Real-time Firestore Sync</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7" /> Dashboard Stock Opname & Enterprise Warehouse
          </h1>
          <p className="text-xs text-amber-100 mt-1 max-w-2xl leading-relaxed">
            Pusat monitoring pergudangan, pergerakan barang masuk/keluar, fisik opname, serta estimasi total nilai persediaan aset instansi secara otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchDashboardData()}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>

          <button
            onClick={() => onNavigate('/stock-opname/barang-masuk')}
            className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <ArrowDownRight className="w-4 h-4" /> Input Barang Masuk
          </button>

          <button
            onClick={() => onNavigate('/stock-opname/barang-keluar')}
            className="px-3.5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" /> Input Barang Keluar
          </button>

          <button
            onClick={() => onNavigate('/stock-opname/stock-opname')}
            className="px-3.5 py-2.5 bg-white text-amber-900 hover:bg-amber-50 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-4 h-4 text-amber-600" /> Sesi Opname Fisik
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total SKU Master Barang</span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.totalBarang} <span className="text-xs font-medium text-slate-400">SKU</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Total fisik: <strong className="text-slate-700 dark:text-slate-300">{metrics.totalStokPcs.toLocaleString('id-ID')} Pcs/Unit</strong>
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Nilai Persediaan</span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {formatRupiah(metrics.totalNilaiPersediaan)}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" /> Kalkulasi otomatis nilai persediaan
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Aktivitas Hari Ini</span>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-xl">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Masuk Hari Ini</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{metrics.masukHariIni}</span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div>
              <span className="text-xs text-slate-400 block">Keluar Hari Ini</span>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400">-{metrics.keluarHariIni}</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Status & Stok Rendah</span>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {metrics.stokRendahCount} <span className="text-xs font-medium text-slate-400">Barang Critical</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Opname terakhir: <strong className="text-slate-700 dark:text-slate-300">{metrics.opnameTerakhir}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warning Barang Stok Rendah */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Peringatan Stok Minimal (&le; Minimum Limit)</h3>
            </div>
            <button
              onClick={() => onNavigate('/stock-opname/barang')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Lihat Semua
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs italic">
              Semua barang persediaan saat ini dalam batas aman di atas batas stok minimal.
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{item.namaBarang}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 rounded">
                        {item.kodeBarang}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Gudang: {item.gudangNama} &bull; Kategori: {item.kategoriNama}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 block">
                      {item.stokSekarang} / {item.stokMinimal} {item.satuan}
                    </span>
                    <button
                      onClick={() => onNavigate('/stock-opname/barang-masuk')}
                      className="mt-1 px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold rounded transition"
                    >
                      + Refill Stok
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Riwayat Pergerakan Terbaru */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pergerakan Stok Terbaru</h3>
            </div>
            <button
              onClick={() => onNavigate('/stock-opname/riwayat')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Lihat Log Lengkap
            </button>
          </div>

          {recentMovements.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs italic">
              Belum ada pergerakan stok yang dicatat hari ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentMovements.map((mov) => (
                <div
                  key={mov.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      mov.jenis === 'Masuk' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : mov.jenis === 'Keluar'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {mov.jenis === 'Masuk' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{mov.namaBarang}</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Nota: <code className="font-mono">{mov.referensiNota}</code> &bull; Oleh: {mov.petugas}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-black block ${
                      mov.jenis === 'Masuk' ? 'text-emerald-600' : mov.jenis === 'Keluar' ? 'text-rose-600' : 'text-amber-600'
                    }`}>
                      {mov.jenis === 'Masuk' ? '+' : mov.jenis === 'Keluar' ? '-' : ''}{mov.jumlah}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{mov.tanggal}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
