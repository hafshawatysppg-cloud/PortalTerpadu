import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  Plus,
  Save,
  Printer,
  Calendar,
  Building2,
  Users,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  FileText,
  Clock,
  ExternalLink,
  Info,
  Layers,
  Percent,
  Weight,
  HelpCircle,
  Eye,
  Edit3
} from 'lucide-react';
import { FoodWasteRecord, FoodWasteItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface FoodWasteViewProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatIndonesianDateUpper(dateStr: string): string {
  try {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const hari = NAMA_HARI[d.getDay()] || 'Senin';
      const dateNum = String(d.getDate()).padStart(2, '0');
      const monthName = NAMA_BULAN[d.getMonth()] || 'Januari';
      const year = d.getFullYear();
      return `${hari.toUpperCase()}, ${dateNum} ${monthName.toUpperCase()} ${year}`;
    }
    const d = new Date(dateStr);
    const hari = NAMA_HARI[d.getDay()] || 'Senin';
    const dateNum = String(d.getDate()).padStart(2, '0');
    const monthName = NAMA_BULAN[d.getMonth()] || 'Januari';
    const year = d.getFullYear();
    return `${hari.toUpperCase()}, ${dateNum} ${monthName.toUpperCase()} ${year}`;
  } catch {
    return dateStr;
  }
}

// Sample image data preset for 06 Agustus 2026
const SAMPLE_IMAGE_ITEMS: Omit<FoodWasteItem, 'id'>[] = [
  {
    menu: 'Nasi',
    jumlah: 66.9,
    satuan: 'Kg',
    penerimaManfaat: 2808,
    standarPorsi: 150,
    totalDisajikanKg: 421.2,
    persentase: 16,
    kesimpulan: 'Toleransi'
  },
  {
    menu: 'Chickem katsu',
    jumlah: 1.1,
    satuan: 'Kg',
    penerimaManfaat: 2808,
    standarPorsi: 50,
    totalDisajikanKg: 140.4,
    persentase: 1,
    kesimpulan: 'Baik Sekali'
  },
  {
    menu: 'Tahu goreng',
    jumlah: 7.2,
    satuan: 'Kg',
    penerimaManfaat: 2808,
    standarPorsi: 50,
    totalDisajikanKg: 140.4,
    persentase: 5,
    kesimpulan: 'Baik Sekali'
  },
  {
    menu: 'Curry wortel & kentang',
    jumlah: 39.65,
    satuan: 'Kg',
    penerimaManfaat: 2808,
    standarPorsi: 50,
    totalDisajikanKg: 140.4,
    persentase: 28,
    kesimpulan: 'Perlu perbaikan menu'
  },
  {
    menu: 'Jeruk santang',
    jumlah: 0,
    satuan: 'Kg',
    penerimaManfaat: 2808,
    standarPorsi: 100,
    totalDisajikanKg: 280.8,
    persentase: 0,
    kesimpulan: 'Baik Sekali'
  }
];

export const FoodWasteView: React.FC<FoodWasteViewProps> = ({ currentPath, onNavigate }) => {
  const { user } = useAuth();
  
  // Tabs: 'form' | 'rekap'
  const [activeTab, setActiveTab] = useState<'form' | 'rekap'>('form');

  // Form Fields
  const [tanggal, setTanggal] = useState<string>('2026-08-06');
  const [sppgName, setSppgName] = useState<string>('SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN');
  const [penerimaManfaatTotal, setPenerimaManfaatTotal] = useState<number>(2808);
  const [petugas, setPetugas] = useState<string>('Ahli Gizi SPPG');
  const [catatanEvaluasi, setCatatanEvaluasi] = useState<string>('');
  const [recordId, setRecordId] = useState<string | null>('FW-20260806-001');

  // Items State
  const [items, setItems] = useState<FoodWasteItem[]>(() => {
    return SAMPLE_IMAGE_ITEMS.map((item, idx) => ({
      ...item,
      id: `ITEM-${idx + 1}`
    }));
  });

  // Rekapitulasi State
  const [allRecords, setAllRecords] = useState<FoodWasteRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<FoodWasteRecord | null>(null);

  // Sync tab with path if needed
  useEffect(() => {
    if (currentPath === '/food-waste/rekap') {
      setActiveTab('rekap');
    } else if (currentPath === '/food-waste' || currentPath === '/food-waste/form') {
      setActiveTab('form');
    }
  }, [currentPath]);

  // Fetch all records on mount and when rekap is opened
  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/food-waste');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAllRecords(data.data);
      }
    } catch (err: any) {
      console.warn('Gagal memuat daftar Food Waste:', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Fetch contextual data when tanggal changes
  const fetchContextForDate = async (targetDate: string) => {
    try {
      const res = await fetch(`/api/food-waste/context/${targetDate}`);
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.existingRecord) {
          const rec = data.data.existingRecord;
          setRecordId(rec.id);
          setSppgName(rec.sppgName || 'SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN');
          setPenerimaManfaatTotal(rec.penerimaManfaatTotal || 2808);
          setPetugas(rec.petugas || 'Ahli Gizi SPPG');
          setCatatanEvaluasi(rec.catatanEvaluasi || '');
          setItems(rec.items || []);
        } else {
          // New record context
          setRecordId(null);
          if (data.data.totalBeneficiaries) {
            setPenerimaManfaatTotal(data.data.totalBeneficiaries);
          }
        }
      }
    } catch (err) {
      console.warn('Gagal memuat konteks tanggal:', err);
    }
  };

  // Live calculations for item row
  const calculateItemValues = (
    jumlah: number,
    pm: number,
    sp: number,
    customKesimpulan?: string
  ): { totalDisajikanKg: number; persentase: number; kesimpulan: string } => {
    const totalDisajikanKg = Number(((pm * sp) / 1000).toFixed(2));
    const persentase = totalDisajikanKg > 0 ? Math.round((jumlah / totalDisajikanKg) * 100) : 0;
    
    let kesimpulan = customKesimpulan;
    if (!kesimpulan || kesimpulan === 'Auto') {
      if (persentase > 20) {
        kesimpulan = 'Perlu perbaikan menu';
      } else if (persentase > 15) {
        kesimpulan = 'Toleransi';
      } else {
        kesimpulan = 'Baik Sekali';
      }
    }

    return { totalDisajikanKg, persentase, kesimpulan };
  };

  // Update item field
  const handleItemChange = (id: string, field: keyof FoodWasteItem, value: any) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Recalculate if values changed
        if (field === 'jumlah' || field === 'penerimaManfaat' || field === 'standarPorsi') {
          const sisa = Number(field === 'jumlah' ? value : item.jumlah) || 0;
          const pm = Number(field === 'penerimaManfaat' ? value : item.penerimaManfaat) || 0;
          const sp = Number(field === 'standarPorsi' ? value : item.standarPorsi) || 0;
          const { totalDisajikanKg, persentase, kesimpulan } = calculateItemValues(sisa, pm, sp);

          updated.totalDisajikanKg = totalDisajikanKg;
          updated.persentase = persentase;
          updated.kesimpulan = kesimpulan;
        }

        return updated;
      })
    );
  };

  // Add Row
  const handleAddRow = () => {
    const newId = `ITEM-${Date.now()}`;
    const newItem: FoodWasteItem = {
      id: newId,
      menu: '',
      jumlah: 0,
      satuan: 'Kg',
      penerimaManfaat: penerimaManfaatTotal || 2808,
      standarPorsi: 50,
      totalDisajikanKg: Number((((penerimaManfaatTotal || 2808) * 50) / 1000).toFixed(2)),
      persentase: 0,
      kesimpulan: 'Baik Sekali'
    };
    setItems(prev => [...prev, newItem]);
  };

  // Remove Row
  const handleRemoveRow = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Apply global recipient count to all rows
  const handleApplyGlobalRecipient = () => {
    setItems(prev =>
      prev.map(item => {
        const { totalDisajikanKg, persentase, kesimpulan } = calculateItemValues(
          item.jumlah,
          penerimaManfaatTotal,
          item.standarPorsi
        );
        return {
          ...item,
          penerimaManfaat: penerimaManfaatTotal,
          totalDisajikanKg,
          persentase,
          kesimpulan
        };
      })
    );
  };

  // Load Preset 06 Agustus 2026 (exact as in user image)
  const handleLoadSampleData = () => {
    setTanggal('2026-08-06');
    setSppgName('SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN');
    setPenerimaManfaatTotal(2808);
    setPetugas('Ahli Gizi SPPG');
    setRecordId('FW-20260806-001');
    setCatatanEvaluasi('Menu curry wortel & kentang sisa 28% (39.65 Kg) melebihi batas toleransi. Direkomendasikan evaluasi tingkat kematangan bumbu kari dan preferensi penerima manfaat.');
    setItems(
      SAMPLE_IMAGE_ITEMS.map((item, idx) => ({
        ...item,
        id: `SAMPLE-${idx + 1}`
      }))
    );
    setSaveSuccessMessage('Data contoh (06 Agustus 2026 sesuai gambar) berhasil dimuat!');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Sync menu components from Menu Harian for the selected date
  const handleSyncFromMenuHarian = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/food-waste/context/${tanggal}`);
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.menuHarian && data.data.suggestedItems && data.data.suggestedItems.length > 0) {
          const newItems: FoodWasteItem[] = data.data.suggestedItems.map((sug: any, idx: number) => {
            const pm = penerimaManfaatTotal || data.data.totalBeneficiaries || 2808;
            const sp = sug.standarPorsi || 50;
            const totalDisajikanKg = Number(((pm * sp) / 1000).toFixed(2));
            return {
              id: `SYNC-${Date.now()}-${idx + 1}`,
              menu: sug.menu,
              jumlah: 0,
              satuan: 'Kg',
              penerimaManfaat: pm,
              standarPorsi: sp,
              totalDisajikanKg,
              persentase: 0,
              kesimpulan: 'Baik Sekali'
            };
          });
          setItems(newItems);
          setSaveSuccessMessage(`Berhasil menyinkronkan komponen dari Menu Harian (${data.data.menuHarian.namaMenu})!`);
          setTimeout(() => setSaveSuccessMessage(null), 3500);
        } else {
          setErrorMessage('Tidak ditemukan data Menu Harian untuk tanggal ini.');
          setTimeout(() => setErrorMessage(null), 3500);
        }
      }
    } catch (err: any) {
      setErrorMessage('Gagal menyinkronkan dari Menu Harian: ' + err.message);
      setTimeout(() => setErrorMessage(null), 3500);
    } finally {
      setIsLoading(false);
    }
  };

  // Summary Totals
  const totalDisajikanKg = useMemo(() => {
    return Number(items.reduce((sum, item) => sum + (Number(item.totalDisajikanKg) || 0), 0).toFixed(2));
  }, [items]);

  const totalSisaKg = useMemo(() => {
    return Number(items.reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0).toFixed(2));
  }, [items]);

  const rataRataPersentase = useMemo(() => {
    if (totalDisajikanKg <= 0) return 0;
    return Math.round((totalSisaKg / totalDisajikanKg) * 100);
  }, [totalSisaKg, totalDisajikanKg]);

  const generalConclusion = useMemo(() => {
    if (rataRataPersentase > 20) {
      return '>20% perlu perbaikan menu, porsi, atau edukasi';
    } else if (rataRataPersentase > 15) {
      return '≤20% masih dianggap batas toleransi maksimal';
    } else {
      return '<10-15% adalah target efisiensi yang baik';
    }
  }, [rataRataPersentase]);

  // Save Record
  const handleSave = async () => {
    if (!tanggal) {
      setErrorMessage('Tanggal operasional wajib dipilih.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Minimal isi 1 baris komponen menu.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const payload: Partial<FoodWasteRecord> = {
        id: recordId || undefined,
        tanggal,
        hariTanggalFormatted: formatIndonesianDateUpper(tanggal),
        sppgName: sppgName.trim() || 'SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN',
        penerimaManfaatTotal,
        items,
        totalDisajikanKg,
        totalSisaKg,
        rataRataPersentase,
        kesimpulanUmum: generalConclusion,
        petugas: petugas || user?.nama || 'Ahli Gizi SPPG',
        catatanEvaluasi,
        status: 'Final'
      };

      const res = await fetch('/api/food-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        setRecordId(result.data.id);
        setSaveSuccessMessage('Data Food Waste berhasil disimpan secara permanen!');
        fetchRecords();
        setTimeout(() => setSaveSuccessMessage(null), 3500);
      } else {
        setErrorMessage(result.message || 'Gagal menyimpan data Food Waste');
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan koneksi: ' + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan Food Waste ini?')) return;
    try {
      const res = await fetch(`/api/food-waste/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAllRecords(prev => prev.filter(r => r.id !== id));
        if (recordId === id) {
          setRecordId(null);
        }
        setSaveSuccessMessage('Catatan Food Waste berhasil dihapus');
        setTimeout(() => setSaveSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setErrorMessage('Gagal menghapus: ' + err.message);
    }
  };

  // Edit from table
  const handleEditRecord = (rec: FoodWasteRecord) => {
    setRecordId(rec.id);
    setTanggal(rec.tanggal);
    setSppgName(rec.sppgName || 'SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN');
    setPenerimaManfaatTotal(rec.penerimaManfaatTotal || 2808);
    setPetugas(rec.petugas || 'Ahli Gizi SPPG');
    setCatatanEvaluasi(rec.catatanEvaluasi || '');
    setItems(rec.items || []);
    setActiveTab('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered Records for Rekap Tab
  const filteredRecords = useMemo(() => {
    return allRecords.filter(rec => {
      const matchesSearch =
        !searchQuery ||
        rec.sppgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.hariTanggalFormatted.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.petugas?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.items?.some(it => it.menu.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStart = !filterStartDate || rec.tanggal >= filterStartDate;
      const matchesEnd = !filterEndDate || rec.tanggal <= filterEndDate;

      return matchesSearch && matchesStart && matchesEnd;
    });
  }, [allRecords, searchQuery, filterStartDate, filterEndDate]);

  // Color helper for Kesimpulan badge
  const getBadgeStyle = (kesimpulan: string) => {
    if (kesimpulan.toLowerCase().includes('perlu perbaikan') || kesimpulan.toLowerCase().includes('>20%')) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    }
    if (kesimpulan.toLowerCase().includes('toleransi') || kesimpulan.toLowerCase().includes('≤20%')) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    }
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-emerald-100">
              <Trash2 className="w-3.5 h-3.5" />
              Modul Evaluasi Sisa Makanan (Food Waste)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pencatatan & Analisis Food Waste
            </h1>
            <p className="text-emerald-100 text-sm max-w-2xl leading-relaxed">
              Formulir pengisian pemantauan sisa makanan, perhitungan persentase penyajian vs sisa secara real-time,
              serta evaluasi kepatuhan batas toleransi efisiensi gizi SPPG.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleLoadSampleData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition shadow-sm backdrop-blur-md active:scale-95 border border-white/20"
              title="Muat data 06 Agustus 2026 sesuai gambar"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Muat Contoh Data Gambar
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen
            </button>
          </div>
        </div>

        {/* Tab Selector inside Banner */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white/20">
          <button
            onClick={() => {
              setActiveTab('form');
              if (onNavigate) onNavigate('/food-waste');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'form'
                ? 'bg-white text-emerald-800 shadow-md'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Formulir & Tabel Evaluasi
          </button>
          <button
            onClick={() => {
              setActiveTab('rekap');
              fetchRecords();
              if (onNavigate) onNavigate('/food-waste/rekap');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'rekap'
                ? 'bg-white text-emerald-800 shadow-md'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Laporan & Rekapitulasi Data
            {allRecords.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'rekap' ? 'bg-emerald-100 text-emerald-900' : 'bg-white/20 text-white'
              }`}>
                {allRecords.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
          <button onClick={() => setSaveSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            &times;
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-sm flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
            &times;
          </button>
        </div>
      )}

      {/* TAB 1: FORMULIR INPUT & TABEL HASIL */}
      {activeTab === 'form' && (
        <div className="space-y-6">
          {/* Form Header Configuration Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Parameter Dokumen Food Waste
                  </h2>
                  <p className="text-xs text-slate-500">
                    Konfigurasi tanggal pelaksanaan, nama unit SPPG, dan jumlah sasaran penerima manfaat
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncFromMenuHarian}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition disabled:opacity-50"
                  title="Ambil komponen masakan dari Menu Harian pada tanggal ini"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Impor Komponen Menu Harian
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tanggal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Tanggal Pelaksanaan
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={e => {
                    const newDate = e.target.value;
                    setTanggal(newDate);
                    fetchContextForDate(newDate);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  {formatIndonesianDateUpper(tanggal) || '-'}
                </p>
              </div>

              {/* Nama SPPG */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  Nama Unit SPPG
                </label>
                <input
                  type="text"
                  value={sppgName}
                  onChange={e => setSppgName(e.target.value)}
                  placeholder="Contoh: SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                <p className="text-[11px] text-slate-400">Unit dapur penyelenggara makanan</p>
              </div>

              {/* Penerima Manfaat Global */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  Total Penerima Manfaat (Porsi)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={penerimaManfaatTotal || ''}
                    onChange={e => setPenerimaManfaatTotal(Number(e.target.value) || 0)}
                    placeholder="2808"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={handleApplyGlobalRecipient}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95"
                    title="Terapkan jumlah penerima ini ke semua baris menu"
                  >
                    Terapkan
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">Jumlah porsi yang diproduksi & disajikan</p>
              </div>
            </div>
          </div>

          {/* TABLE DISPLAY - Exact reproduction of user image layout */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 print:p-0 print:border-none print:shadow-none">
            {/* Header Document Table */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-slate-50">
                  {formatIndonesianDateUpper(tanggal)}
                </h3>
                <h4 className="text-sm font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  {sppgName}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Menu
                </button>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3.5 w-12 text-center">No</th>
                    <th className="py-3 px-3.5 min-w-[200px]">Menu</th>
                    <th className="py-3 px-3.5 w-28 text-right">Jumlah (Sisa)</th>
                    <th className="py-3 px-3.5 w-20 text-center">Satuan</th>
                    <th className="py-3 px-3.5 w-32 text-right">Penerima Manfaat</th>
                    <th className="py-3 px-3.5 w-32 text-right">Standar Porsi (gr)</th>
                    <th className="py-3 px-3.5 w-36 text-right">Total yang Disajikan (Kg)</th>
                    <th className="py-3 px-3.5 w-28 text-right">Persentase (%)</th>
                    <th className="py-3 px-3.5 min-w-[150px]">Kesimpulan</th>
                    <th className="py-3 px-3 w-12 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400 italic">
                        Belum ada item menu yang ditambahkan. Klik tombol "Tambah Menu" atau "Muat Contoh Data Gambar".
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* No */}
                        <td className="py-2.5 px-3.5 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Menu */}
                        <td className="py-2.5 px-3.5">
                          <input
                            type="text"
                            value={item.menu}
                            onChange={e => handleItemChange(item.id, 'menu', e.target.value)}
                            placeholder="Nama masakan/lauk/sayur"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Jumlah (Sisa) */}
                        <td className="py-2.5 px-3.5 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.jumlah === 0 ? '0' : item.jumlah || ''}
                            onChange={e => handleItemChange(item.id, 'jumlah', parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Satuan */}
                        <td className="py-2.5 px-3.5 text-center font-semibold text-slate-600 dark:text-slate-400">
                          <input
                            type="text"
                            value={item.satuan || 'Kg'}
                            onChange={e => handleItemChange(item.id, 'satuan', e.target.value)}
                            className="w-full text-center px-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Penerima Manfaat */}
                        <td className="py-2.5 px-3.5 text-right">
                          <input
                            type="number"
                            min="1"
                            value={item.penerimaManfaat || ''}
                            onChange={e => handleItemChange(item.id, 'penerimaManfaat', parseInt(e.target.value) || 0)}
                            className="w-full text-right px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Standar Porsi */}
                        <td className="py-2.5 px-3.5 text-right">
                          <input
                            type="number"
                            step="1"
                            min="1"
                            value={item.standarPorsi || ''}
                            onChange={e => handleItemChange(item.id, 'standarPorsi', parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Total yang Disajikan (Kg) */}
                        <td className="py-2.5 px-3.5 text-right font-bold text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/30">
                          {Number(item.totalDisajikanKg).toFixed(1)}
                        </td>

                        {/* Persentase (%) */}
                        <td className="py-2.5 px-3.5 text-right font-black">
                          <span className={item.persentase > 20 ? 'text-rose-600' : item.persentase > 15 ? 'text-amber-600' : 'text-emerald-600'}>
                            {item.persentase}%
                          </span>
                        </td>

                        {/* Kesimpulan */}
                        <td className="py-2.5 px-3.5">
                          <select
                            value={item.kesimpulan}
                            onChange={e => handleItemChange(item.id, 'kesimpulan', e.target.value)}
                            className={`w-full px-2 py-1 rounded-lg text-xs font-bold border transition ${getBadgeStyle(item.kesimpulan)}`}
                          >
                            <option value="Baik Sekali">Baik Sekali (&le;15%)</option>
                            <option value="Toleransi">Toleransi (16-20%)</option>
                            <option value="Perlu perbaikan menu">Perlu perbaikan menu (&gt;20%)</option>
                          </select>
                        </td>

                        {/* Aksi Hapus */}
                        <td className="py-2.5 px-3 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(item.id)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Summary / Total Footer Row */}
                {items.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-800/90 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                      <td colSpan={2} className="py-3 px-3.5 text-left uppercase tracking-wide">
                        TOTAL KESELURUHAN
                      </td>
                      <td className="py-3 px-3.5 text-right text-rose-600 dark:text-rose-400 font-extrabold text-sm">
                        {totalSisaKg.toFixed(2)}
                      </td>
                      <td className="py-3 px-3.5 text-center text-xs text-slate-500">
                        Kg
                      </td>
                      <td colSpan={2} className="py-3 px-3.5 text-right text-xs text-slate-500">
                        Total Disajikan :
                      </td>
                      <td className="py-3 px-3.5 text-right text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                        {totalDisajikanKg.toFixed(1)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-black text-sm">
                        <span className={rataRataPersentase > 20 ? 'text-rose-600' : rataRataPersentase > 15 ? 'text-amber-600' : 'text-emerald-600'}>
                          {rataRataPersentase}%
                        </span>
                      </td>
                      <td colSpan={2} className="py-3 px-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${getBadgeStyle(generalConclusion)}`}>
                          {generalConclusion}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Standard Reference Note (Exactly from user image) */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>Pedoman Standar & Ambang Batas Evaluasi Food Waste SPPG:</span>
              </div>
              <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400 pl-6 list-disc">
                <li>
                  <strong className="text-emerald-600 dark:text-emerald-400">&lt;10-15%</strong> adalah target efisiensi yang baik (status: <em>Baik Sekali</em>)
                </li>
                <li>
                  <strong className="text-amber-600 dark:text-amber-400">&le;20%</strong> masih dianggap batas toleransi maksimal (status: <em>Toleransi</em>)
                </li>
                <li>
                  <strong className="text-rose-600 dark:text-rose-400">&gt;20%</strong> perlu perbaikan menu, porsi, atau edukasi (status: <em>Perlu perbaikan menu</em>)
                </li>
              </ul>
            </div>

            {/* Notes and Evaluator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Petugas Evaluasi / Ahli Gizi
                </label>
                <input
                  type="text"
                  value={petugas}
                  onChange={e => setPetugas(e.target.value)}
                  placeholder="Nama Ahli Gizi / Petugas Pencatat"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Catatan Tindak Lanjut & Evaluasi
                </label>
                <textarea
                  rows={2}
                  value={catatanEvaluasi}
                  onChange={e => setCatatanEvaluasi(e.target.value)}
                  placeholder="Contoh: Evaluasi resep curry sayur karena anak-anak kurang menyukai tingkat kepedasan bumbu..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleData}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset / Muat Contoh Gambar
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  Print Preview
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold shadow-md transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Data Food Waste'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAPORAN & REKAPITULASI DATA */}
      {activeTab === 'rekap' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Arsip & Riwayat Laporan Food Waste
              </h2>
              <p className="text-xs text-slate-500">
                Seluruh data pencatatan sisa makanan harian yang tersimpan di sistem
              </p>
            </div>

            <button
              onClick={() => {
                setActiveTab('form');
                if (onNavigate) onNavigate('/food-waste');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Entri Data Baru
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari menu, SPPG, petugas..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <input
                type="date"
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                placeholder="Dari Tanggal"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <input
                type="date"
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                placeholder="Sampai Tanggal"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Table of Records */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">Tanggal & Hari</th>
                  <th className="py-3 px-4">Unit SPPG</th>
                  <th className="py-3 px-4 text-center">Komponen Menu</th>
                  <th className="py-3 px-4 text-right">Porsi</th>
                  <th className="py-3 px-4 text-right">Disajikan (Kg)</th>
                  <th className="py-3 px-4 text-right">Sisa (Kg)</th>
                  <th className="py-3 px-4 text-center">Persentase</th>
                  <th className="py-3 px-4">Kesimpulan</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 italic">
                      Memuat data catatan Food Waste...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 space-y-2">
                      <p className="font-semibold">Belum ada riwayat dokumen Food Waste.</p>
                      <button
                        onClick={handleLoadSampleData}
                        className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold"
                      >
                        Muat Contoh Data Gambar (06 Agustus 2026)
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {rec.hariTanggalFormatted || rec.tanggal}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">
                        {rec.sppgName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
                          {rec.items?.length || 0} Menu
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {(rec.penerimaManfaatTotal || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700 dark:text-slate-300">
                        {rec.totalDisajikanKg}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                        {rec.totalSisaKg}
                      </td>
                      <td className="py-3 px-4 text-center font-black">
                        <span className={rec.rataRataPersentase > 20 ? 'text-rose-600' : rec.rataRataPersentase > 15 ? 'text-amber-600' : 'text-emerald-600'}>
                          {rec.rataRataPersentase}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyle(rec.kesimpulanUmum || '')}`}>
                          {rec.kesimpulanUmum || (rec.rataRataPersentase > 20 ? 'Perlu perbaikan' : 'Baik Sekali')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedRecordForModal(rec)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Lihat Rincian Tabel"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditRecord(rec)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition"
                            title="Edit Dokumen"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR RECORD PREVIEW */}
      {selectedRecordForModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black uppercase text-slate-900 dark:text-white">
                  {selectedRecordForModal.hariTanggalFormatted}
                </h3>
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  {selectedRecordForModal.sppgName}
                </h4>
              </div>
              <button
                onClick={() => setSelectedRecordForModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition"
              >
                &times;
              </button>
            </div>

            {/* Modal Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3">Menu</th>
                    <th className="py-2.5 px-3 text-right">Jumlah Sisa</th>
                    <th className="py-2.5 px-3 text-center">Satuan</th>
                    <th className="py-2.5 px-3 text-right">Penerima Manfaat</th>
                    <th className="py-2.5 px-3 text-right">Standar Porsi (gr)</th>
                    <th className="py-2.5 px-3 text-right">Total Disajikan (Kg)</th>
                    <th className="py-2.5 px-3 text-right">Persentase</th>
                    <th className="py-2.5 px-3">Kesimpulan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedRecordForModal.items?.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-semibold">{it.menu}</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-600">{it.jumlah}</td>
                      <td className="py-2 px-3 text-center text-slate-500">{it.satuan}</td>
                      <td className="py-2 px-3 text-right">{it.penerimaManfaat}</td>
                      <td className="py-2 px-3 text-right">{it.standarPorsi}</td>
                      <td className="py-2 px-3 text-right font-bold">{it.totalDisajikanKg}</td>
                      <td className="py-2 px-3 text-right font-black">
                        <span className={it.persentase > 20 ? 'text-rose-600' : it.persentase > 15 ? 'text-amber-600' : 'text-emerald-600'}>
                          {it.persentase}%
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyle(it.kesimpulan)}`}>
                          {it.kesimpulan}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800 font-black border-t-2 border-slate-300 dark:border-slate-700">
                    <td className="py-2.5 px-3">TOTAL KESELURUHAN</td>
                    <td className="py-2.5 px-3 text-right text-rose-600 font-extrabold">{selectedRecordForModal.totalSisaKg}</td>
                    <td className="py-2.5 px-3 text-center">Kg</td>
                    <td colSpan={2} className="py-2.5 px-3 text-right text-slate-500">Total Disajikan:</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-extrabold">{selectedRecordForModal.totalDisajikanKg}</td>
                    <td className="py-2.5 px-3 text-right font-black">{selectedRecordForModal.rataRataPersentase}%</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyle(selectedRecordForModal.kesimpulanUmum || '')}`}>
                        {selectedRecordForModal.kesimpulanUmum}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {selectedRecordForModal.catatanEvaluasi && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">Catatan Evaluasi:</span>
                <p className="text-slate-600 dark:text-slate-400">{selectedRecordForModal.catatanEvaluasi}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  handleEditRecord(selectedRecordForModal);
                  setSelectedRecordForModal(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
              >
                Buka & Edit di Formulir
              </button>
              <button
                onClick={() => setSelectedRecordForModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodWasteView;
