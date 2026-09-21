import React, { useState, useEffect } from 'react';
import {
  WalletCards,
  Calculator,
  RefreshCw,
  Save,
  Printer,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  Utensils,
  Plus,
  Trash2,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  HelpCircle,
  Clock,
  Lock,
  Unlock,
  Coins,
  Receipt,
  Sparkles,
  Info
} from 'lucide-react';
import {
  RABPlan,
  RABItemBahan,
  RABBiayaItem,
  RABTarifConfig,
  RABKomposisiConfig,
  MasterBahanPangan
} from '../../types';

const formatDateIndo = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

interface RencanaAnggaranBelanjaViewProps {
  tanggalPelaksanaan?: string;
  onNavigateDate?: (tanggal: string) => void;
  masterBahan?: MasterBahanPangan[];
}

export const RencanaAnggaranBelanjaView: React.FC<RencanaAnggaranBelanjaViewProps> = ({
  tanggalPelaksanaan: initialDate,
  onNavigateDate,
  masterBahan = []
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [tanggal, setTanggal] = useState<string>(initialDate || todayStr);
  const [activeSubTab, setActiveSubTab] = useState<'bahan' | 'operasional' | 'analisis' | 'riwayat'>('bahan');

  // Loading & sync states
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Core RAB State
  const [rabData, setRabData] = useState<RABPlan | null>(null);
  const [savedRABList, setSavedRABList] = useState<RABPlan[]>([]);
  const [showTarifModal, setShowTarifModal] = useState<boolean>(false);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);

  // Temporary edit states for Tarifs & Composition
  const [customTarif, setCustomTarif] = useState<RABTarifConfig>({
    porsiKecil: 10000,
    porsiBesar: 15000,
    balita: 8500,
    bumilBusui: 12500
  });

  const [customKomposisi, setCustomKomposisi] = useState<RABKomposisiConfig>({
    bahanPanganPersen: 100,
    operasionalPersen: 0,
    kemasanDistribusiPersen: 0
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch RAB context for date
  const fetchRABContext = async (targetDate: string, isManual = false) => {
    if (!targetDate) return;
    setLoading(true);
    if (isManual) setIsSyncing(true);

    try {
      const res = await fetch(`/api/v1/nutrition-plans/rab/sync-context?tanggal=${targetDate}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRabData(json.data);
        setCustomTarif(json.data.tarifConfig || {
          porsiKecil: 10000,
          porsiBesar: 15000,
          balita: 8500,
          bumilBusui: 12500
        });
        setCustomKomposisi(json.data.komposisiConfig || {
          bahanPanganPersen: 100,
          operasionalPersen: 0,
          kemasanDistribusiPersen: 0
        });

        if (isManual) {
          showToast(`Data RAB berhasil disinkronkan realtime dengan Penerima Manfaat & Menu (${formatDateIndo(targetDate)})`, 'success');
        }
      }
    } catch (err) {
      console.error('Error fetching RAB context:', err);
      showToast('Gagal memuat data RAB', 'error');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  // 2. Fetch all saved RAB plans
  const fetchSavedRABList = async () => {
    try {
      const res = await fetch('/api/v1/nutrition-plans/rab/list');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSavedRABList(json.data);
      }
    } catch (err) {
      console.error('Error fetching saved RAB list:', err);
    }
  };

  useEffect(() => {
    fetchRABContext(tanggal);
    fetchSavedRABList();
  }, [tanggal]);

  // Recalculate local state on-the-fly when item prices or counts change
  const recalculateCurrentRAB = async (updatedFields: Partial<RABPlan>) => {
    if (!rabData) return;
    try {
      const payload = {
        ...rabData,
        ...updatedFields,
        tanggal
      };
      const res = await fetch('/api/v1/nutrition-plans/rab/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success && json.data) {
        setRabData(json.data);
      }
    } catch (err) {
      console.error('Error recalculating RAB:', err);
    }
  };

  // Change Ingredient Price or Qty
  const handleItemBahanChange = (idx: number, field: 'hargaSatuan' | 'kebutuhanKg', value: number) => {
    if (!rabData) return;
    const newItems = [...rabData.itemsBahanBaku];
    newItems[idx] = {
      ...newItems[idx],
      [field]: value,
      subtotal: Math.round((field === 'hargaSatuan' ? value : newItems[idx].hargaSatuan) * (field === 'kebutuhanKg' ? value : newItems[idx].kebutuhanKg))
    };
    recalculateCurrentRAB({ itemsBahanBaku: newItems });
  };

  // Add Item Bahan
  const handleAddCustomBahan = () => {
    if (!rabData) return;
    const newItem: RABItemBahan = {
      no: rabData.itemsBahanBaku.length + 1,
      namaBahan: 'Bahan Tambahan Baru',
      kategori: 'Pelengkap',
      kebutuhanKg: 5,
      satuan: 'Kg',
      hargaSatuan: 15000,
      subtotal: 75000,
      sumberHarga: 'Estimasi Pasar'
    };
    recalculateCurrentRAB({ itemsBahanBaku: [...rabData.itemsBahanBaku, newItem] });
  };

  // Remove Item Bahan
  const handleRemoveBahan = (idx: number) => {
    if (!rabData) return;
    const newItems = rabData.itemsBahanBaku.filter((_, i) => i !== idx);
    recalculateCurrentRAB({ itemsBahanBaku: newItems });
  };

  // Change Operasional Item
  const handleBiayaItemChange = (
    _listType: 'operasional',
    idx: number,
    field: 'volume' | 'hargaSatuan' | 'namaItem',
    val: any
  ) => {
    if (!rabData) return;
    const items = [...rabData.biayaOperasionalItems];
    items[idx] = {
      ...items[idx],
      [field]: val,
      subtotal: Math.round((field === 'volume' ? Number(val) : items[idx].volume) * (field === 'hargaSatuan' ? Number(val) : items[idx].hargaSatuan))
    };
    recalculateCurrentRAB({ biayaOperasionalItems: items });
  };

  // Add Operasional Item
  const handleAddOperasionalItem = () => {
    if (!rabData) return;
    const newItem: RABBiayaItem = {
      id: `OPS-${Date.now()}`,
      namaItem: 'Biaya Operasional Tambahan',
      kategori: 'OPERASIONAL',
      volume: 1,
      satuan: 'Paket',
      hargaSatuan: 250000,
      subtotal: 250000,
      keterangan: 'Kebutuhan tambahan operasional dapur'
    };
    recalculateCurrentRAB({ biayaOperasionalItems: [...rabData.biayaOperasionalItems, newItem] });
  };

  // Save RAB
  const handleSaveRAB = async () => {
    if (!rabData) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/nutrition-plans/rab/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rabData, tanggalPelaksanaan: tanggal })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setRabData(json.data);
        showToast('Rencana Anggaran Belanja (RAB) berhasil disimpan ke sistem', 'success');
        fetchSavedRABList();
      } else {
        showToast(json.message || 'Gagal menyimpan RAB', 'error');
      }
    } catch (err) {
      console.error('Error saving RAB:', err);
      showToast('Terjadi kesalahan saat menyimpan RAB', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Approve RAB
  const handleApproveRAB = async (status: 'Diajukan' | 'Disetujui' | 'Final') => {
    if (!rabData) return;
    try {
      const res = await fetch('/api/v1/nutrition-plans/rab/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rabData.id,
          tanggal,
          status,
          approverName: 'Sri Rohayu, S. Pd (Kepala SPPG)'
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setRabData(json.data);
        showToast(`Perencanaan Menu & RAB berhasil DIFINALISASI & DIKUNCI!`, 'success');
        fetchSavedRABList();
      }
    } catch (err) {
      console.error('Error approving RAB:', err);
      showToast('Gagal memperbarui status persetujuan RAB', 'error');
    }
  };

  // Unlock / Request Revision for RAB & Menu
  const handleUnlockRevision = async () => {
    if (!rabData) return;
    try {
      const res = await fetch('/api/v1/nutrition-plans/unlock-revision-by-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggalPelaksanaan: tanggal,
          reason: 'Penyesuaian anggaran dan bahan baku RAB',
          revisedBy: 'Kepala SPPG / Bendahara'
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Kunci Perencanaan Menu & RAB untuk tanggal ${formatDateIndo(tanggal)} berhasil dibuka untuk revisi.`, 'info');
        fetchRABContext(tanggal);
        fetchSavedRABList();
      } else {
        showToast(json.message || 'Gagal membuka kunci revisi', 'error');
      }
    } catch (err) {
      console.error('Error unlocking revision from RAB:', err);
      showToast('Gagal membuka kunci revisi', 'error');
    }
  };

  if (loading && !rabData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Menyinkronkan data Rencana Anggaran Belanja (RAB)...</p>
        <p className="text-xs text-slate-400 mt-1">Mengambil data sasaran penerima manfaat & perencanaan kebutuhan bahan pangan</p>
      </div>
    );
  }

  if (!rabData) return null;

  const { targetCounts, tarifConfig, analisis, itemsBahanBaku: rawItemsBahanBaku, biayaOperasionalItems } = rabData;

  const itemsBahanBaku = (rawItemsBahanBaku || []).map(item => {
    const masterMatch = (masterBahan || []).find(m => m.namaBahan.toLowerCase() === item.namaBahan.toLowerCase());
    return {
      ...item,
      satuan: masterMatch?.satuanPembelian || item.satuan
    };
  });

  // Status color badge helper
  const getStatusBadge = () => {
    const serapanPersen = analisis.persentaseSerapanPagu ?? analisis.persentaseFoodCost;
    if (analisis.statusKelayakan === 'OPTIMAL_SESUAI_PAGU') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Serapan Optimal 100% Pagu ({serapanPersen}%)</span>
        </span>
      );
    } else if (analisis.statusKelayakan === 'HEMAT_EFISIEN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-xl text-xs font-bold shadow-2xs">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Serapan Pagu {serapanPersen}% (Target 100%)</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-bold shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Over-Budget Pagu ({serapanPersen}%)</span>
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold transition-all transform animate-in fade-in slide-in-from-top-4 ${
          toastMessage.type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' :
          toastMessage.type === 'error' ? 'bg-rose-900 text-white border-rose-700' :
          'bg-slate-900 text-white border-slate-700'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header & Realtime Sync Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <WalletCards className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                    Rencana Anggaran Belanja (RAB) SPPG
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    ID: {rabData.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kalkulasi otomatis terpadu: <strong className="text-emerald-600">Penerima Manfaat</strong> (Sasaran Jiwa) ⇄ <strong className="text-emerald-600">Perencanaan Menu</strong> (Gramatur Bahan Baku).
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchRABContext(tanggal, true)}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              title="Tarik ulang data sasaran penerima manfaat & gramatur menu harian"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Realtime'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTarifModal(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>Atur Tarif & Pagu</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrintPreview(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Cetak / PDF Resmi</span>
            </button>

            <button
              type="button"
              onClick={handleSaveRAB}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan RAB'}</span>
            </button>

            {rabData.status === 'Final' || rabData.status === 'Disetujui' ? (
              <button
                type="button"
                onClick={handleUnlockRevision}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border border-amber-400"
                title="Buka kunci status Final untuk merubah Perencanaan Menu & RAB tanggal ini"
              >
                <Unlock className="w-3.5 h-3.5 text-white" />
                <span>Buka Kunci / Revisi RAB & Menu</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleApproveRAB('Final')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Finalisasi dan kunci Perencanaan Menu & RAB tanggal ini"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Finalisasi RAB & Menu</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Info Header Grid */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Tanggal Pelaksanaan</span>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => {
                  setTanggal(e.target.value);
                  if (onNavigateDate) onNavigateDate(e.target.value);
                }}
                className="font-bold text-slate-900 dark:text-slate-100 bg-transparent border-none p-0 focus:outline-none focus:ring-0 cursor-pointer text-xs"
              />
            </div>
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Menu SPPG Terpilih</span>
            <div className="font-bold text-slate-900 dark:text-slate-100 truncate text-xs" title={rabData.namaMenu}>
              {rabData.namaMenu}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Sasaran Riil</span>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                {targetCounts.total.toLocaleString('id-ID')} Porsi / Jiwa
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-bold">
              Live Sync
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status Dokumen RAB & Menu</span>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  rabData.status === 'Final' || rabData.status === 'Disetujui' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
                <span>{rabData.status === 'Final' ? 'FINAL / TERKUNCI' : rabData.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {rabData.status !== 'Disetujui' && rabData.status !== 'Final' ? (
                <button
                  type="button"
                  onClick={() => handleApproveRAB('Final')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                  title="Finalisasi Perencanaan Menu & RAB"
                >
                  <Lock className="w-3 h-3 text-amber-300" />
                  <span>Finalisasi</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUnlockRevision}
                  className="px-2 py-1 bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                  title="Buka kunci revisi menu & RAB"
                >
                  <Unlock className="w-3 h-3 text-amber-600" /> Buka Kunci
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Main KPI Cards: Real-time Budget Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pagu Anggaran */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Pagu Anggaran
            </span>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            Rp {rabData.totalPaguAnggaran.toLocaleString('id-ID')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Target Penyerapan:</span>
            <strong className="text-blue-600 dark:text-blue-400 font-bold">
              100% Belanja Bahan
            </strong>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Card 2: Realisasi Belanja Bahan (Food Cost) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Belanja Bahan Baku (Food Cost)
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            Rp {rabData.totalBiayaBahanBaku.toLocaleString('id-ID')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Penyerapan Pagu:</span>
            <strong className={`font-bold ${
              (analisis.persentaseSerapanPagu ?? analisis.persentaseFoodCost) > 100 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {analisis.persentaseSerapanPagu ?? analisis.persentaseFoodCost}% (Target 100%)
            </strong>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (analisis.persentaseSerapanPagu ?? analisis.persentaseFoodCost) > 100 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (analisis.persentaseSerapanPagu ?? analisis.persentaseFoodCost))}%` }}
            />
          </div>
        </div>

        {/* Card 3: Operasional Dapur */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Biaya Operasional Dapur
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            Rp {rabData.totalBiayaOperasional.toLocaleString('id-ID')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Gas LPG, Utilitas, Sanitasi & Tenaga Masak</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Card 4: Grand Total RAB & Realisasi */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Grand Total RAB & Realisasi
            </span>
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
            Rp {rabData.grandTotalRAB.toLocaleString('id-ID')}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Biaya / Porsi Riil:</span>
            <strong className="text-slate-700 dark:text-slate-200">
              Rp {analisis.biayaPerPorsiRataRata.toLocaleString('id-ID')} / Porsi
            </strong>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Evaluation Status Banner */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {getStatusBadge()}
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            {analisis.keteranganStatus}
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 shrink-0">
          Sisa Pagu Belanja Bahan: <strong className={(analisis.sisaAnggaranPagu ?? (analisis.selisihPlafondBahan || 0)) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
            Rp {(analisis.sisaAnggaranPagu ?? (analisis.selisihPlafondBahan || 0)).toLocaleString('id-ID')}
          </strong>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('bahan')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'bahan'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>1. Belanja Bahan Baku Food Cost ({itemsBahanBaku.length} Item)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('operasional')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'operasional'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>2. Biaya Operasional Dapur ({biayaOperasionalItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('analisis')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'analisis'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <PieChartIcon className="w-4 h-4" />
          <span>3. Analisis Penyerapan 100% Pagu & Pareto</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('riwayat')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'riwayat'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Riwayat RAB ({savedRABList.length})</span>
        </button>
      </div>

      {/* TAB 1: BELANJA BAHAN BAKU (FOOD COST) */}
      {activeSubTab === 'bahan' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                <span>Daftar Kebutuhan Belanja Bahan Baku</span>
                <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full font-bold">
                  Total: Rp {rabData.totalBiayaBahanBaku.toLocaleString('id-ID')}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>Rincian komoditas, estimasi harga satuan acuan pasar, dan subtotal belanja.</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                  <Lock className="w-3 h-3 text-amber-500" /> Kebutuhan QTY hanya dapat diubah di Menu Perencanaan Bahan
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCustomBahan}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Bahan</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white dark:bg-slate-950 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-10 border-r border-slate-700">No</th>
                  <th className="py-3 px-4 border-r border-slate-700">Nama Bahan Pangan</th>
                  <th className="py-3 px-3 border-r border-slate-700 text-center">Kategori</th>
                  <th className="py-3 px-3 border-r border-slate-700 text-center">Kebutuhan (Qty)</th>
                  <th className="py-3 px-3 border-r border-slate-700 text-center">Satuan</th>
                  <th className="py-3 px-4 border-r border-slate-700 text-right">Estimasi Harga / Satuan</th>
                  <th className="py-3 px-4 border-r border-slate-700 text-right">Subtotal Belanja</th>
                  <th className="py-3 px-3 border-r border-slate-700 text-center w-28">Bobot (%)</th>
                  <th className="py-3 px-2 text-center w-12">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {itemsBahanBaku.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400 border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                      {item.namaBahan}
                      {item.sumberHarga && (
                        <span className="block text-[10px] font-normal text-slate-400">{item.sumberHarga}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-semibold">{item.kategori}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                      <div className="inline-flex items-center justify-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg font-extrabold text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 shadow-2xs" title="QTY Kebutuhan disinkronkan dari Perencanaan Menu (Hanya dapat diubah di Menu Perencanaan Bahan)">
                        <span>{item.kebutuhanKg}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center uppercase font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800">
                      {item.satuan}
                    </td>
                    <td className="py-2.5 px-4 text-right border-r border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[11px] text-slate-400">Rp</span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={item.hargaSatuan}
                          onChange={(e) => handleItemBahanChange(idx, 'hargaSatuan', Number(e.target.value) || 0)}
                          className="w-28 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-xs"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 justify-center">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{item.bobotPersen || 0}%</span>
                        <div className="w-12 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, (item.bobotPersen || 0) * 2)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveBahan(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Hapus baris bahan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50 dark:bg-emerald-950/60 font-black text-xs text-slate-900 dark:text-slate-100">
                  <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider">
                    Total Estimasi Belanja Bahan Baku (Food Cost):
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                    Rp {rabData.totalBiayaBahanBaku.toLocaleString('id-ID')}
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-center text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                    100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BIAYA OPERASIONAL DAPUR */}
      {activeSubTab === 'operasional' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                <span>Rincian Biaya Operasional & Pengolahan Dapur</span>
                <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full font-bold">
                  Total: Rp {rabData.totalBiayaOperasional.toLocaleString('id-ID')}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Komponen utilitas energi gas memasak, listrik, air bersih standar hygiene, dan upah tim juru masak/pemorsian.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddOperasionalItem}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Item Operasional</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white dark:bg-slate-950 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-10 border-r border-slate-700">No</th>
                  <th className="py-3 px-4 border-r border-slate-700">Nama Item Operasional</th>
                  <th className="py-3 px-3 border-r border-slate-700 text-center">Volume</th>
                  <th className="py-3 px-3 border-r border-slate-700 text-center">Satuan</th>
                  <th className="py-3 px-4 border-r border-slate-700 text-right">Tarif / Harga Satuan</th>
                  <th className="py-3 px-4 border-r border-slate-700 text-right">Subtotal</th>
                  <th className="py-3 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {biayaOperasionalItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                      <input
                        type="text"
                        value={item.namaItem}
                        onChange={(e) => handleBiayaItemChange('operasional', idx, 'namaItem', e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 font-bold"
                      />
                    </td>
                    <td className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                      <input
                        type="number"
                        min="0"
                        value={item.volume}
                        onChange={(e) => handleBiayaItemChange('operasional', idx, 'volume', Number(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-xs"
                      />
                    </td>
                    <td className="py-3 px-3 text-center uppercase font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800">{item.satuan}</td>
                    <td className="py-3 px-4 text-right border-r border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[11px] text-slate-400">Rp</span>
                        <input
                          type="number"
                          min="0"
                          value={item.hargaSatuan}
                          onChange={(e) => handleBiayaItemChange('operasional', idx, 'hargaSatuan', Number(e.target.value) || 0)}
                          className="w-28 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-xs"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{item.keterangan || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-50 dark:bg-amber-950/60 font-black text-xs text-slate-900 dark:text-slate-100">
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider">
                    Total Biaya Operasional:
                  </td>
                  <td className="py-3 px-4 text-right text-amber-700 dark:text-amber-300 font-extrabold text-sm">
                    Rp {rabData.totalBiayaOperasional.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ANALISIS PENYERAPAN 100% PAGU & PARETO */}
      {activeSubTab === 'analisis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Cost Drivers (Pareto 80/20) */}
          <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-600" />
                <span>Analisis Pareto Top 5 Penyerap Anggaran</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                80/20 Cost Drivers
              </span>
            </div>
            <p className="text-xs text-slate-500">
              5 komoditas berikut mendominasi serapan dana belanja bahan baku harian:
            </p>

            <div className="space-y-3 pt-2">
              {analisis.topCostDrivers.map((driver, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">{driver.namaBahan}</div>
                      <span className="text-[11px] text-slate-500">Kontribusi: {driver.persen}% dari Food Cost</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      Rp {driver.subtotal.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rekomendasi & Ringkasan Kelayakan */}
          <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Rekomendasi Akuntabilitas & Penyerapan 100% Pagu</span>
              </h3>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Pagu Anggaran:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">Rp {analisis.totalPaguAnggaran.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Target Penyerapan Bahan Baku:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">100% (Rp {analisis.totalPaguAnggaran.toLocaleString('id-ID')})</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Realisasi Belanja Bahan Baku:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Rp {analisis.totalRealisasiBahan.toLocaleString('id-ID')} ({analisis.persentaseSerapanPagu ?? analisis.persentaseFoodCost}%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-semibold">Sisa Alokasi Pagu:</span>
                  <span className={`font-black text-sm ${(analisis.sisaAnggaranPagu ?? (analisis.selisihPlafondBahan || 0)) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Rp {(analisis.sisaAnggaranPagu ?? (analisis.selisihPlafondBahan || 0)).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Petunjuk Penyerapan Pagu SPPG:</span>
                </div>
                <p className="leading-relaxed">
                  Berdasarkan regulasi terbaru, penyerapan PAGU Anggaran difokuskan 100% untuk Belanja Bahan Baku makanan bergizi tanpa pembatasan plafon bahan. Seluruh anggaran dialokasikan optimal guna menjamin kualitas nutrisi dan kecukupan gizi sasaran.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowPrintPreview(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Dokumen Evaluasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RIWAYAT DOKUMEN RAB */}
      {activeSubTab === 'riwayat' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Daftar Riwayat Rencana Anggaran Belanja Tersimpan</span>
            </h3>
            <span className="text-xs text-slate-500">{savedRABList.length} Dokumen Tersedia</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white dark:bg-slate-950 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 text-center">No</th>
                  <th className="py-3 px-3">Tanggal Pelaksanaan</th>
                  <th className="py-3 px-4">Menu SPPG</th>
                  <th className="py-3 px-3 text-center">Total Sasaran</th>
                  <th className="py-3 px-4 text-right">Pagu Anggaran</th>
                  <th className="py-3 px-4 text-right">Total Food Cost</th>
                  <th className="py-3 px-4 text-right">Biaya Operasional Dapur</th>
                  <th className="py-3 px-4 text-right">Grand Total RAB</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {savedRABList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Belum ada dokumen RAB yang tersimpan. Klik "Simpan RAB" untuk mencatat dokumen aktif.
                    </td>
                  </tr>
                ) : (
                  savedRABList.map((rab, idx) => {
                    const foodCost = rab.totalBiayaBahanBaku || 0;
                    const opsCost = rab.totalBiayaOperasional ?? (rab.biayaOperasionalItems ? rab.biayaOperasionalItems.reduce((acc, i) => acc + (i.subtotal || 0), 0) : 0);
                    const grandTotal = rab.grandTotalRAB ?? (foodCost + opsCost + (rab.cadanganTakTerduga || 0));

                    return (
                      <tr key={rab.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {formatDateIndo(rab.tanggalPelaksanaan)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 max-w-xs truncate" title={rab.namaMenu}>
                          {rab.namaMenu}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600 whitespace-nowrap">
                          {rab.targetCounts?.total?.toLocaleString('id-ID') || 0} Porsi
                        </td>
                        <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                          Rp {(rab.totalPaguAnggaran || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          Rp {foodCost.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          Rp {opsCost.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          Rp {grandTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rab.status === 'Disetujui' || rab.status === 'Final'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {rab.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setTanggal(rab.tanggalPelaksanaan);
                              setRabData(rab);
                              setActiveSubTab('bahan');
                              showToast(`Memuat RAB tanggal ${formatDateIndo(rab.tanggalPelaksanaan)}`, 'info');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                          >
                            Buka
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {savedRABList.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 font-black text-xs text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                    <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider">
                      Total ({savedRABList.length} Hari RAB):
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400 font-extrabold whitespace-nowrap">
                      {savedRABList.reduce((acc, r) => acc + (r.targetCounts?.total || 0), 0).toLocaleString('id-ID')} Porsi
                    </td>
                    <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                      Rp {savedRABList.reduce((acc, r) => acc + (r.totalPaguAnggaran || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-extrabold whitespace-nowrap">
                      Rp {savedRABList.reduce((acc, r) => acc + (r.totalBiayaBahanBaku || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-600 dark:text-amber-400 font-extrabold whitespace-nowrap">
                      Rp {savedRABList.reduce((acc, r) => {
                        const ops = r.totalBiayaOperasional ?? (r.biayaOperasionalItems ? r.biayaOperasionalItems.reduce((s, i) => s + (i.subtotal || 0), 0) : 0);
                        return acc + ops;
                      }, 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-900 dark:text-slate-100 font-black whitespace-nowrap">
                      Rp {savedRABList.reduce((acc, r) => {
                        const food = r.totalBiayaBahanBaku || 0;
                        const ops = r.totalBiayaOperasional ?? (r.biayaOperasionalItems ? r.biayaOperasionalItems.reduce((s, i) => s + (i.subtotal || 0), 0) : 0);
                        const gt = r.grandTotalRAB ?? (food + ops + (r.cadanganTakTerduga || 0));
                        return acc + gt;
                      }, 0).toLocaleString('id-ID')}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ATUR TARIF & PAGU STANDAR */}
      {showTarifModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase">
                  Pengaturan Standar Tarif & Plafon Pagu
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTarifModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-500">
                Sesuaikan standar tarif biaya per porsi untuk tiap kelompok sasaran penerima manfaat:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tarif Porsi Kecil (PAUD/SD 1-3)
                  </label>
                  <input
                    type="number"
                    value={customTarif.porsiKecil}
                    onChange={(e) => setCustomTarif({ ...customTarif, porsiKecil: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tarif Porsi Besar (SD 4-6, SMP, Guru)
                  </label>
                  <input
                    type="number"
                    value={customTarif.porsiBesar}
                    onChange={(e) => setCustomTarif({ ...customTarif, porsiBesar: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tarif Sasaran Balita
                  </label>
                  <input
                    type="number"
                    value={customTarif.balita}
                    onChange={(e) => setCustomTarif({ ...customTarif, balita: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Tarif Bumil & Busui
                  </label>
                  <input
                    type="number"
                    value={customTarif.bumilBusui}
                    onChange={(e) => setCustomTarif({ ...customTarif, bumilBusui: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Target Penyerapan Pagu Belanja Bahan Baku: 100%
                </span>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                  <p className="font-bold">Ketentuan Penyerapan Pagu:</p>
                  <p className="leading-relaxed text-[11px]">
                    Sesuai instruksi, batas plafon 75% ditiadakan. Penyerapan PAGU Anggaran difokuskan 100% langsung untuk belanja bahan baku pangan bergizi, dan menu Kemasan serta BBM Distribusi telah dihapus dari sistem RAB.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTarifModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  recalculateCurrentRAB({
                    tarifConfig: customTarif,
                    komposisiConfig: {
                      bahanPanganPersen: 100,
                      operasionalPersen: 0,
                      kemasanDistribusiPersen: 0
                    }
                  });
                  setShowTarifModal(false);
                  showToast('Tarif standar pagu berhasil diperbarui', 'success');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                Terapkan & Hitung Ulang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CETAK / PDF RESMI SPPG */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full p-8 space-y-6 my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-slate-800" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  Pratinjau Cetak Dokumen Rencana Anggaran Belanja (RAB)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Printable Formal SPPG Paper */}
            <div className="border border-slate-300 p-8 rounded-2xl bg-white space-y-5 text-xs text-slate-800 shadow-xs">
              {/* Formal Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  BADAN GIZI NASIONAL (BGN) REPUBLIK INDONESIA
                </h2>
                <h3 className="text-xs font-bold uppercase text-slate-700">
                  SATUAN PELAYANAN PROGRAM GIZI (SPPG) KREJENGAN TEMENGGUNGAN
                </h3>
                <p className="text-[10px] text-slate-500">
                  KABUPATEN PROBOLINGGO - JAWA TIMUR | DOKUMEN RENCANA ANGGARAN BELANJA (RAB) OPERASIONAL
                </p>
              </div>

              {/* Meta Table */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p><strong>Nomor Dokumen:</strong> {rabData.id}</p>
                  <p><strong>Tanggal Pelaksanaan:</strong> {formatDateIndo(rabData.tanggalPelaksanaan)}</p>
                  <p><strong>Menu Utama SPPG:</strong> {rabData.namaMenu}</p>
                </div>
                <div>
                  <p><strong>Total Sasaran Porsi:</strong> {targetCounts.total.toLocaleString('id-ID')} Porsi</p>
                  <p><strong>Total Pagu Anggaran:</strong> Rp {rabData.totalPaguAnggaran.toLocaleString('id-ID')}</p>
                  <p><strong>Realisasi Bahan (Target 100% Pagu):</strong> Rp {rabData.totalBiayaBahanBaku.toLocaleString('id-ID')} ({analisis.persentaseSerapanPagu ?? analisis.persentaseFoodCost}%)</p>
                  <p><strong>Grand Total Usulan RAB:</strong> Rp {rabData.grandTotalRAB.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Table Belanja Bahan */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase text-[11px] text-slate-900">A. Belanja Bahan Baku (Food Cost - Target Penyerapan Pagu 100%)</h4>
                <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="border border-slate-300 p-1.5 text-center w-8">No</th>
                      <th className="border border-slate-300 p-1.5">Nama Bahan Pangan</th>
                      <th className="border border-slate-300 p-1.5 text-center">Kebutuhan</th>
                      <th className="border border-slate-300 p-1.5 text-right">Harga Satuan</th>
                      <th className="border border-slate-300 p-1.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsBahanBaku.map((it, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-1.5 font-medium">{it.namaBahan}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{it.kebutuhanKg} {it.satuan}</td>
                        <td className="border border-slate-300 p-1.5 text-right">Rp {it.hargaSatuan.toLocaleString('id-ID')}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-bold">Rp {it.subtotal.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={4} className="border border-slate-300 p-1.5 text-right uppercase">Subtotal Bahan Baku:</td>
                      <td className="border border-slate-300 p-1.5 text-right">Rp {rabData.totalBiayaBahanBaku.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table Operasional Dapur */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase text-[11px] text-slate-900">B. Biaya Operasional Dapur SPPG</h4>
                <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="border border-slate-300 p-1.5 text-center w-8">No</th>
                      <th className="border border-slate-300 p-1.5">Item Biaya Operasional Dapur</th>
                      <th className="border border-slate-300 p-1.5 text-center">Volume</th>
                      <th className="border border-slate-300 p-1.5 text-center">Satuan</th>
                      <th className="border border-slate-300 p-1.5 text-right">Harga Satuan</th>
                      <th className="border border-slate-300 p-1.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {biayaOperasionalItems.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-1.5 font-medium">{it.namaItem}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{it.volume}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{it.satuan}</td>
                        <td className="border border-slate-300 p-1.5 text-right">Rp {it.hargaSatuan.toLocaleString('id-ID')}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-bold">Rp {it.subtotal.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={5} className="border border-slate-300 p-1.5 text-right uppercase">Subtotal Biaya Operasional Dapur:</td>
                      <td className="border border-slate-300 p-1.5 text-right">Rp {rabData.totalBiayaOperasional.toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 text-center pt-8 text-xs">
                <div>
                  <p className="text-slate-500">Ahli Gizi SPPG,</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{rabData.penanggungJawab.nutritionistName}</p>
                  <p className="text-[10px] text-slate-400">Nutrisionis Pelaksana</p>
                </div>
                <div>
                  <p className="text-slate-500">Bendahara Pengeluaran,</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{rabData.penanggungJawab.bendaharaName || 'Hj. Siti Aminah, S.E.'}</p>
                  <p className="text-[10px] text-slate-400">Verifikator Anggaran</p>
                </div>
                <div>
                  <p className="text-slate-500">Mengetahui & Menyetujui,</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{rabData.penanggungJawab.kepalaSppgName}</p>
                  <p className="text-[10px] text-slate-400">Kepala SPPG Temenggungan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
