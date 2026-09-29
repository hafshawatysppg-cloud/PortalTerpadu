import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Utensils,
  ClipboardEdit,
  Calendar,
  Flame,
  Camera,
  Upload,
  Image as ImageIcon,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  Trash2,
  Pencil,
  Eye,
  Sparkles,
  RefreshCw,
  Check,
  Users,
  Calculator
} from 'lucide-react';
import { MenuHarianRecord, NilaiGiziPorsi } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';

interface MenuHarianViewProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatTanggalIndo(dateStr: string): { hari: string; formatted: string } {
  try {
    if (!dateStr) return { hari: '-', formatted: '-' };
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const hari = NAMA_HARI[d.getDay()] || 'Senin';
      const formatted = `${hari}, ${String(d.getDate()).padStart(2, '0')} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
      return { hari, formatted };
    }
    const d = new Date(dateStr);
    const hari = NAMA_HARI[d.getDay()] || 'Senin';
    const formatted = `${hari}, ${String(d.getDate()).padStart(2, '0')} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
    return { hari, formatted };
  } catch {
    return { hari: 'Senin', formatted: dateStr };
  }
}

function getGiziBesar(rec: MenuHarianRecord): NilaiGiziPorsi {
  if (rec.giziPorsiBesar) {
    return {
      energiKkal: Number(rec.giziPorsiBesar.energiKkal) || 0,
      proteinGram: Number(rec.giziPorsiBesar.proteinGram) || 0,
      lemakGram: Number(rec.giziPorsiBesar.lemakGram) || 0,
      karbohidratGram: Number(rec.giziPorsiBesar.karbohidratGram) || 0,
      seratGram: Number(rec.giziPorsiBesar.seratGram) || 0,
      keterangan: rec.giziPorsiBesar.keterangan || ''
    };
  }
  return {
    energiKkal: Number(rec.energiKkal) || 0,
    proteinGram: Number(rec.proteinGram) || 0,
    lemakGram: Number(rec.lemakGram) || 0,
    karbohidratGram: Number(rec.karbohidratGram) || 0,
    seratGram: Number(rec.seratGram) || 0,
    keterangan: ''
  };
}

function getGiziKecil(rec: MenuHarianRecord): NilaiGiziPorsi {
  if (rec.giziPorsiKecil) {
    return {
      energiKkal: Number(rec.giziPorsiKecil.energiKkal) || 0,
      proteinGram: Number(rec.giziPorsiKecil.proteinGram) || 0,
      lemakGram: Number(rec.giziPorsiKecil.lemakGram) || 0,
      karbohidratGram: Number(rec.giziPorsiKecil.karbohidratGram) || 0,
      seratGram: Number(rec.giziPorsiKecil.seratGram) || 0,
      keterangan: rec.giziPorsiKecil.keterangan || ''
    };
  }
  return {
    energiKkal: 0,
    proteinGram: 0,
    lemakGram: 0,
    karbohidratGram: 0,
    seratGram: 0,
    keterangan: ''
  };
}

export const MenuHarianView: React.FC<MenuHarianViewProps> = ({
  currentPath = '/menu-harian/form',
  onNavigate
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];

  // Realtime sync from Firestore
  const { data: realtimeMenus } = useFirestoreRealtime<MenuHarianRecord>('menuHarian');

  // Form State — Top: Tanggal Operasional -> Nama Menu & Kandungan Gizi (Porsi Besar & Porsi Kecil) -> Bottom: Upload Foto Menu
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tanggalOperasional, setTanggalOperasional] = useState<string>(todayStr);
  const [namaMenu, setNamaMenu] = useState<string>('');
  const [kategoriPorsi, setKategoriPorsi] = useState<string>('Porsi Besar & Porsi Kecil');

  // Kandungan Gizi - Porsi Besar
  const [besarEnergi, setBesarEnergi] = useState<string>('');
  const [besarProtein, setBesarProtein] = useState<string>('');
  const [besarLemak, setBesarLemak] = useState<string>('');
  const [besarKarbo, setBesarKarbo] = useState<string>('');
  const [besarSerat, setBesarSerat] = useState<string>('');
  const [besarKeterangan, setBesarKeterangan] = useState<string>('');

  // Kandungan Gizi - Porsi Kecil
  const [kecilEnergi, setKecilEnergi] = useState<string>('');
  const [kecilProtein, setKecilProtein] = useState<string>('');
  const [kecilLemak, setKecilLemak] = useState<string>('');
  const [kecilKarbo, setKecilKarbo] = useState<string>('');
  const [kecilSerat, setKecilSerat] = useState<string>('');
  const [kecilKeterangan, setKecilKeterangan] = useState<string>('');

  const [catatanGizi, setCatatanGizi] = useState<string>('');

  // Optional component helper fields
  const [showKomponenHelper, setShowKomponenHelper] = useState<boolean>(false);
  const [karbohidratKomponen, setKarbohidratKomponen] = useState<string>('');
  const [laukHewaniKomponen, setLaukHewaniKomponen] = useState<string>('');
  const [laukNabatiKomponen, setLaukNabatiKomponen] = useState<string>('');
  const [sayurKomponen, setSayurKomponen] = useState<string>('');
  const [buahSusuKomponen, setBuahSusuKomponen] = useState<string>('');

  // Upload Foto Menu State (Bottom section)
  const [fotoMenuUrl, setFotoMenuUrl] = useState<string>('');
  const [fotoFileName, setFotoFileName] = useState<string>('');
  const [fotoFileSizeKb, setFotoFileSizeKb] = useState<number>(0);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState<boolean>(false);

  // Records & UI State
  const [records, setRecords] = useState<MenuHarianRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Filter & Preview Modal State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTanggal, setFilterTanggal] = useState<string>('');
  const [previewRecord, setPreviewRecord] = useState<MenuHarianRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/menu-harian');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setRecords(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch menu harian:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (realtimeMenus && realtimeMenus.length > 0) {
      const sorted = [...realtimeMenus].sort((a, b) =>
        (b.tanggalOperasional || '').localeCompare(a.tanggalOperasional || '')
      );
      setRecords(sorted);
    }
  }, [realtimeMenus]);

  const infoTanggalOperasional = useMemo(
    () => formatTanggalIndo(tanggalOperasional),
    [tanggalOperasional]
  );

  // Combine component helper into namaMenu when user fills helper inputs
  const applyKomponenToNamaMenu = () => {
    const parts = [
      karbohidratKomponen.trim(),
      laukHewaniKomponen.trim(),
      laukNabatiKomponen.trim(),
      sayurKomponen.trim(),
      buahSusuKomponen.trim()
    ].filter(Boolean);
    if (parts.length > 0) {
      setNamaMenu(parts.join(', '));
      showToast('Rincian komponen berhasil digabungkan ke Nama Menu.', 'info');
    }
  };

  // Helper to estimate Porsi Kecil (~70% from Porsi Besar) with 1 click
  const handleAutoEstimatePorsiKecil = () => {
    const eB = parseFloat(String(besarEnergi).replace(',', '.')) || 0;
    const pB = parseFloat(String(besarProtein).replace(',', '.')) || 0;
    const lB = parseFloat(String(besarLemak).replace(',', '.')) || 0;
    const kB = parseFloat(String(besarKarbo).replace(',', '.')) || 0;
    const sB = parseFloat(String(besarSerat).replace(',', '.')) || 0;

    if (eB === 0 && pB === 0 && lB === 0 && kB === 0) {
      showToast('Isikan nilai Kandungan Gizi Porsi Besar terlebih dahulu.', 'info');
      return;
    }

    const ratio = 0.7;
    setKecilEnergi(eB > 0 ? String(Math.round(eB * ratio)) : '');
    setKecilProtein(pB > 0 ? String(Number((pB * ratio).toFixed(1))) : '');
    setKecilLemak(lB > 0 ? String(Number((lB * ratio).toFixed(1))) : '');
    setKecilKarbo(kB > 0 ? String(Number((kB * ratio).toFixed(1))) : '');
    setKecilSerat(sB > 0 ? String(Number((sB * ratio).toFixed(1))) : '');
    showToast('Nilai gizi Porsi Kecil otomatis diestimasi (70% dari Porsi Besar). Silakan sesuaikan bila perlu.', 'info');
  };

  // Compress image to stay within 0.1 MB - 0.5 MB target (and Firestore safe size)
  const processAndCompressImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Format file harus berupa gambar (JPG, JPEG, PNG, WEBP).', 'error');
      return;
    }

    setIsCompressingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          let quality = 0.82;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          // Ensure size is under ~450 KB
          while (compressedDataUrl.length * 0.75 > 450 * 1024 && quality > 0.35) {
            quality -= 0.12;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          const approxSizeKb = Math.max(1, Math.round((compressedDataUrl.length * 0.75) / 1024));
          setFotoMenuUrl(compressedDataUrl);
          setFotoFileName(file.name);
          setFotoFileSizeKb(approxSizeKb);
          setIsCompressingPhoto(false);
          showToast(`Foto menu "${file.name}" (${approxSizeKb} KB) berhasil diunggah.`, 'info');
        } else {
          const approxSizeKb = Math.max(1, Math.round(file.size / 1024));
          setFotoMenuUrl(rawDataUrl);
          setFotoFileName(file.name);
          setFotoFileSizeKb(approxSizeKb);
          setIsCompressingPhoto(false);
        }
      };
      img.onerror = () => {
        setIsCompressingPhoto(false);
        showToast('Gagal memuat file gambar.', 'error');
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndCompressImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndCompressImage(file);
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTanggalOperasional(todayStr);
    setNamaMenu('');
    setKategoriPorsi('Porsi Besar & Porsi Kecil');
    setBesarEnergi('');
    setBesarProtein('');
    setBesarLemak('');
    setBesarKarbo('');
    setBesarSerat('');
    setBesarKeterangan('');
    setKecilEnergi('');
    setKecilProtein('');
    setKecilLemak('');
    setKecilKarbo('');
    setKecilSerat('');
    setKecilKeterangan('');
    setCatatanGizi('');
    setKarbohidratKomponen('');
    setLaukHewaniKomponen('');
    setLaukNabatiKomponen('');
    setSayurKomponen('');
    setBuahSusuKomponen('');
    setFotoMenuUrl('');
    setFotoFileName('');
    setFotoFileSizeKb(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditRecord = (rec: MenuHarianRecord) => {
    const gb = getGiziBesar(rec);
    const gk = getGiziKecil(rec);

    setEditingId(rec.id);
    setTanggalOperasional(rec.tanggalOperasional || todayStr);
    setNamaMenu(rec.namaMenu || '');
    setKategoriPorsi(rec.kategoriPorsi || 'Porsi Besar & Porsi Kecil');

    setBesarEnergi(gb.energiKkal ? String(gb.energiKkal) : '');
    setBesarProtein(gb.proteinGram ? String(gb.proteinGram) : '');
    setBesarLemak(gb.lemakGram ? String(gb.lemakGram) : '');
    setBesarKarbo(gb.karbohidratGram ? String(gb.karbohidratGram) : '');
    setBesarSerat(gb.seratGram ? String(gb.seratGram) : '');
    setBesarKeterangan(gb.keterangan || '');

    setKecilEnergi(gk.energiKkal ? String(gk.energiKkal) : '');
    setKecilProtein(gk.proteinGram ? String(gk.proteinGram) : '');
    setKecilLemak(gk.lemakGram ? String(gk.lemakGram) : '');
    setKecilKarbo(gk.karbohidratGram ? String(gk.karbohidratGram) : '');
    setKecilSerat(gk.seratGram ? String(gk.seratGram) : '');
    setKecilKeterangan(gk.keterangan || '');

    setCatatanGizi(rec.catatanGizi || '');
    setKarbohidratKomponen(rec.rincianKomponen?.karbohidrat || '');
    setLaukHewaniKomponen(rec.rincianKomponen?.laukHewani || '');
    setLaukNabatiKomponen(rec.rincianKomponen?.laukNabati || '');
    setSayurKomponen(rec.rincianKomponen?.sayur || '');
    setBuahSusuKomponen(rec.rincianKomponen?.buahSusu || '');
    setFotoMenuUrl(rec.fotoMenuUrl || '');
    setFotoFileName(rec.fotoFileName || '');
    setFotoFileSizeKb(rec.fotoFileSizeKb || 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tanggalOperasional) {
      showToast('Tanggal Operasional wajib diisi.', 'error');
      return;
    }

    if (!namaMenu.trim()) {
      showToast('Nama Menu wajib diisi.', 'error');
      return;
    }

    const giziPorsiBesar: NilaiGiziPorsi = {
      energiKkal: parseFloat(String(besarEnergi).replace(',', '.')) || 0,
      proteinGram: parseFloat(String(besarProtein).replace(',', '.')) || 0,
      lemakGram: parseFloat(String(besarLemak).replace(',', '.')) || 0,
      karbohidratGram: parseFloat(String(besarKarbo).replace(',', '.')) || 0,
      seratGram: parseFloat(String(besarSerat).replace(',', '.')) || 0,
      keterangan: besarKeterangan.trim()
    };

    const giziPorsiKecil: NilaiGiziPorsi = {
      energiKkal: parseFloat(String(kecilEnergi).replace(',', '.')) || 0,
      proteinGram: parseFloat(String(kecilProtein).replace(',', '.')) || 0,
      lemakGram: parseFloat(String(kecilLemak).replace(',', '.')) || 0,
      karbohidratGram: parseFloat(String(kecilKarbo).replace(',', '.')) || 0,
      seratGram: parseFloat(String(kecilSerat).replace(',', '.')) || 0,
      keterangan: kecilKeterangan.trim()
    };

    setIsSubmitting(true);
    try {
      const payload = {
        tanggalOperasional,
        namaMenu: namaMenu.trim(),
        kategoriPorsi,
        energiKkal: giziPorsiBesar.energiKkal,
        proteinGram: giziPorsiBesar.proteinGram,
        lemakGram: giziPorsiBesar.lemakGram,
        karbohidratGram: giziPorsiBesar.karbohidratGram,
        seratGram: giziPorsiBesar.seratGram,
        giziPorsiBesar,
        giziPorsiKecil,
        rincianKomponen: {
          karbohidrat: karbohidratKomponen.trim(),
          laukHewani: laukHewaniKomponen.trim(),
          laukNabati: laukNabatiKomponen.trim(),
          sayur: sayurKomponen.trim(),
          buahSusu: buahSusuKomponen.trim()
        },
        catatanGizi: catatanGizi.trim(),
        fotoMenuUrl,
        fotoFileName,
        fotoFileSizeKb,
        petugas: user?.nama || 'Ahli Gizi SPPG'
      };

      const url = editingId ? `/api/v1/menu-harian/${editingId}` : '/api/v1/menu-harian';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(
          editingId
            ? 'Data Menu Harian berhasil diperbarui!'
            : 'Data Menu Harian berhasil disimpan!',
          'success'
        );
        handleResetForm();
        await fetchRecords();
      } else {
        showToast(json.message || 'Gagal menyimpan Menu Harian.', 'error');
      }
    } catch (err) {
      console.error('Error saving Menu Harian:', err);
      showToast('Terjadi kesalahan jaringan saat menyimpan data.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/menu-harian/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast('Data Menu Harian berhasil dihapus.', 'info');
        setDeleteConfirmId(null);
        await fetchRecords();
      } else {
        showToast(json.message || 'Gagal menghapus data.', 'error');
      }
    } catch (err) {
      console.error('Error deleting Menu Harian:', err);
      showToast('Gagal menghapus data Menu Harian.', 'error');
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filterTanggal && r.tanggalOperasional !== filterTanggal) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchMenu = r.namaMenu?.toLowerCase().includes(q);
        const matchDate = r.hariTanggalFormatted?.toLowerCase().includes(q) || r.tanggalOperasional?.includes(q);
        const matchKategori = r.kategoriPorsi?.toLowerCase().includes(q);
        const matchCatatan = r.catatanGizi?.toLowerCase().includes(q);
        return Boolean(matchMenu || matchDate || matchKategori || matchCatatan);
      }
      return true;
    });
  }, [records, filterTanggal, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-blue-600 text-white border-blue-500'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="p-1 hover:bg-white/20 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Module Header & Sub Menu Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Modul Gizi & Operasional SPPG
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  &bull; {infoTanggalOperasional.formatted}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                Menu Harian
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formulir pencatatan menu harian operasional, informasi kandungan gizi (Porsi Besar &amp; Porsi Kecil), dan dokumentasi foto menu
              </p>
            </div>
          </div>

          {/* 1 Sub Menu Navigation Pill: Form Menu Harian */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/menu-harian/form')}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 bg-blue-600 text-white shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <ClipboardEdit className="w-4 h-4" />
              <span>Form Menu Harian</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN FORM CARD: FORM MENU HARIAN */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden"
      >
        {/* Form Card Top Banner */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <ClipboardEdit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {editingId ? 'Edit Form Menu Harian' : 'Form Menu Harian'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Lengkapi tanggal operasional, nama menu, kandungan gizi Porsi Besar &amp; Porsi Kecil, serta unggah foto menu harian di bawah ini
              </p>
            </div>
          </div>

          {editingId && (
            <span className="px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Mode Edit Data ({editingId})
            </span>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* ============================================================ */}
          {/* BAGIAN PALING ATAS: TANGGAL OPERASIONAL                      */}
          {/* ============================================================ */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/25 border border-blue-200/70 dark:border-blue-900/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Tanggal Operasional <span className="text-rose-500">*</span></span>
              </label>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-2xs">
                  {infoTanggalOperasional.formatted}
                </span>
                <button
                  type="button"
                  onClick={() => setTanggalOperasional(todayStr)}
                  className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition cursor-pointer"
                >
                  Hari Ini
                </button>
              </div>
            </div>

            <div>
              <input
                type="date"
                value={tanggalOperasional}
                onChange={(e) => setTanggalOperasional(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* ============================================================ */}
          {/* BAGIAN ATAS: NAMA MENU & KANDUNGAN GIZI (BESAR & KECIL)      */}
          {/* ============================================================ */}
          <div className="space-y-5">
            {/* 1. NAMA MENU */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="block text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Nama Menu <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowKomponenHelper(!showKomponenHelper)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{showKomponenHelper ? 'Sembunyikan Rincian Komponen' : 'Bantu Susun dari 5 Komponen Menu'}</span>
                </button>
              </div>

              <input
                type="text"
                value={namaMenu}
                onChange={(e) => setNamaMenu(e.target.value)}
                required
                placeholder="Masukkan nama menu makanan (Contoh: Nasi Putih, Ayam Goreng Lengkuas, Tahu Goreng, Sayur Sop, Buah Pisang)"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />

              {/* Optional 5-component builder */}
              {showKomponenHelper && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Rincian Komponen Menu (Opsional)
                    </span>
                    <button
                      type="button"
                      onClick={applyKomponenToNamaMenu}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      Terapkan ke Nama Menu
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Makanan Pokok / Karbo</label>
                      <input
                        type="text"
                        value={karbohidratKomponen}
                        onChange={(e) => setKarbohidratKomponen(e.target.value)}
                        placeholder="Cth: Nasi Putih"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Lauk Hewani</label>
                      <input
                        type="text"
                        value={laukHewaniKomponen}
                        onChange={(e) => setLaukHewaniKomponen(e.target.value)}
                        placeholder="Cth: Ayam Katsu Kari"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Lauk Nabati</label>
                      <input
                        type="text"
                        value={laukNabatiKomponen}
                        onChange={(e) => setLaukNabatiKomponen(e.target.value)}
                        placeholder="Cth: Tahu / Tempe"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sayur</label>
                      <input
                        type="text"
                        value={sayurKomponen}
                        onChange={(e) => setSayurKomponen(e.target.value)}
                        placeholder="Cth: Tumis Wortel"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Buah / Susu</label>
                      <input
                        type="text"
                        value={buahSusuKomponen}
                        onChange={(e) => setBuahSusuKomponen(e.target.value)}
                        placeholder="Cth: Kelengkeng"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. KANDUNGAN GIZI: DIBAGI MENJADI PORSI BESAR & PORSI KECIL */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    Kandungan Gizi (Porsi Besar &amp; Porsi Kecil)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Isikan nilai kandungan gizi per porsi untuk kategori Porsi Besar dan Porsi Kecil
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* ================================================== */}
                {/* PANEL A: KANDUNGAN GIZI - PORSI BESAR              */}
                {/* ================================================== */}
                <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/60 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-200/60 dark:border-indigo-800/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                        B
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-indigo-950 dark:text-indigo-200">
                          Kandungan Gizi — Porsi Besar
                        </h4>
                        <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400 font-semibold">
                          Sasaran: SD Kelas 4–6, SMP, SMA, Ibu Hamil &amp; Menyusui
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
                      Porsi Besar
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Energi Porsi Besar */}
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Energi <span className="text-slate-400 font-normal">(kkal)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={besarEnergi}
                          onChange={(e) => setBesarEnergi(e.target.value)}
                          placeholder="0"
                          className="w-full pl-3 pr-11 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          kkal
                        </span>
                      </div>
                    </div>

                    {/* Protein Porsi Besar */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Protein <span className="text-slate-400 font-normal">(g)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={besarProtein}
                          onChange={(e) => setBesarProtein(e.target.value)}
                          placeholder="0"
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          gr
                        </span>
                      </div>
                    </div>

                    {/* Lemak Porsi Besar */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Lemak <span className="text-slate-400 font-normal">(g)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={besarLemak}
                          onChange={(e) => setBesarLemak(e.target.value)}
                          placeholder="0"
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          gr
                        </span>
                      </div>
                    </div>

                    {/* Karbohidrat Porsi Besar */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Karbohidrat <span className="text-slate-400 font-normal">(g)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={besarKarbo}
                          onChange={(e) => setBesarKarbo(e.target.value)}
                          placeholder="0"
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          gr
                        </span>
                      </div>
                    </div>

                    {/* Serat Porsi Besar */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Serat <span className="text-slate-400 font-normal">(g)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={besarSerat}
                          onChange={(e) => setBesarSerat(e.target.value)}
                          placeholder="0"
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                          gr
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Keterangan Gizi Porsi Besar <span className="font-normal text-slate-400">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={besarKeterangan}
                      onChange={(e) => setBesarKeterangan(e.target.value)}
                      placeholder="Cth: Standar AKG Porsi Besar (SD 4-6, SMP, SMA)"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* ================================================== */}
                {/* PANEL B: KANDUNGAN GIZI - PORSI KECIL              */}
                {/* ================================================== */}
                <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-emerald-200/60 dark:border-emerald-800/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
                        K
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                          Kandungan Gizi — Porsi Kecil
                        </h4>
                        <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-semibold">
                          Sasaran: PAUD, TK, SD Kelas 1–3, Balita
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleAutoEstimatePorsiKecil}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        title="Hitung otomatis 70% dari nilai gizi Porsi Besar"
                      >
                        <Calculator className="w-3 h-3" />
                        <span>Estimasi 70% Porsi Besar</span>
                      </button>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700">
                        Porsi Kecil
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Energi Porsi Kecil */}
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Energi <span className="text-slate-400 font-normal">(kkal)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={kecilEnergi}
                          onChange={(e) => setKecilEnergi(e.target.value)}
                          placeholder="0"
                          className="w-full pl-3 pr-11 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          kkal
                        </span>
                      </div>
                    </div>

                    {/* Protein Porsi Kecil */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Protein <span className="text-slate-400 font-normal">(g)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={kecilProtein}
                          onChange={(e) => setKecilProtein(e.target.value)}
                          placeholder="0"
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          gr
                        </span>
                      </div>
                    </div>

                    {/* Lemak Porsi Kecil */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Lemak <span className="text-slate-400 font-normal">(g)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={kecilLemak}
                          onChange={(e) => setKecilLemak(e.target.value)}
                          placeholder="0"
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          gr
                        </span>
                      </div>
                    </div>

                    {/* Karbohidrat Porsi Kecil */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Karbohidrat <span className="text-slate-400 font-normal">(g)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={kecilKarbo}
                          onChange={(e) => setKecilKarbo(e.target.value)}
                          placeholder="0"
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          gr
                        </span>
                      </div>
                    </div>

                    {/* Serat Porsi Kecil */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Serat <span className="text-slate-400 font-normal">(g)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={kecilSerat}
                          onChange={(e) => setKecilSerat(e.target.value)}
                          placeholder="0"
                          className="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                          gr
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Keterangan Gizi Porsi Kecil <span className="font-normal text-slate-400">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={kecilKeterangan}
                      onChange={(e) => setKecilKeterangan(e.target.value)}
                      placeholder="Cth: Standar AKG Porsi Kecil (PAUD, TK, SD 1-3)"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Catatan / Keterangan Tambahan Gizi Umum */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan Umum Kandungan Gizi <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={catatanGizi}
                  onChange={(e) => setCatatanGizi(e.target.value)}
                  placeholder="Catatan tambahan nilai gizi atau standar AKG harian..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* BAGIAN BAWAH: UPLOAD FOTO MENU                               */}
          {/* ============================================================ */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Upload Foto Menu</span>
              </label>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Ukuran file antara 0.1 MB - 0.5 MB (JPG, JPEG, PNG)
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {!fotoMenuUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleDrop}
                className={`w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDraggingFile
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 hover:border-blue-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  {isCompressingPhoto ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isCompressingPhoto
                      ? 'Memproses & mengoptimalkan ukuran foto...'
                      : 'Klik untuk memilih Foto Menu atau seret foto ke area ini'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Format: <span className="font-semibold">JPG, JPEG, PNG</span> &bull; Ukuran file: <span className="font-semibold">0.1 MB - 0.5 MB</span> (Otomatis dikompresi jika &gt; 0.5 MB)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs transition"
                >
                  Pilih File Foto
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-56 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shrink-0 flex items-center justify-center">
                  <img
                    src={fotoMenuUrl}
                    alt="Preview Foto Menu"
                    className="w-full h-auto max-h-56 object-contain block"
                  />
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                      Foto Menu Terunggah
                    </span>
                    {fotoFileSizeKb > 0 && (
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Ukuran: {fotoFileSizeKb} KB ({(fotoFileSizeKb / 1024).toFixed(2)} MB)
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {fotoFileName || 'foto-menu-harian.jpg'}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Ganti Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFotoMenuUrl('');
                        setFotoFileName('');
                        setFotoFileSizeKb(0);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* TOMBOL AKSI FORM (BATAL & SIMPAN)                            */}
          {/* ============================================================ */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Batal</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan Menu Harian'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* ============================================================ */}
      {/* DAFTAR DATA MENU HARIAN YANG SUDAH DIINPUT                   */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-500" />
              <span>Daftar Menu Harian Tersimpan ({filteredRecords.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Riwayat menu operasional harian beserta rincian kandungan gizi Porsi Besar &amp; Porsi Kecil serta foto dokumentasi menu
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama menu..."
                className="pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
            />

            {filterTanggal && (
              <button
                type="button"
                onClick={() => setFilterTanggal('')}
                className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Reset Tanggal
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Memuat data Menu Harian...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Utensils className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Belum ada data Menu Harian yang sesuai filter
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Tanggal Operasional</th>
                  <th className="py-3 px-3">Foto Menu</th>
                  <th className="py-3 px-3">Nama Menu</th>
                  <th className="py-3 px-3">Kandungan Gizi (Porsi Besar &amp; Kecil)</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {filteredRecords.map((rec) => {
                  const dateInfo = formatTanggalIndo(rec.tanggalOperasional);
                  const gb = getGiziBesar(rec);
                  const gk = getGiziKecil(rec);
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-3 whitespace-nowrap align-top">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {rec.hariTanggalFormatted || dateInfo.formatted}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {rec.kategoriPorsi || 'Porsi Besar & Porsi Kecil'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 align-top">
                        {rec.fotoMenuUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewRecord(rec)}
                            className="w-16 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 block group relative cursor-pointer"
                          >
                            <img
                              src={rec.fotoMenuUrl}
                              alt={rec.namaMenu}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </button>
                        ) : (
                          <div className="w-16 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 align-top max-w-md">
                        <div className="font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                          {rec.namaMenu}
                        </div>
                        {rec.catatanGizi && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            {rec.catatanGizi}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 align-top space-y-2">
                        {/* Porsi Besar Summary */}
                        <div className="p-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 space-y-1">
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>Porsi Besar</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800 font-bold text-[10px]">
                              Energi: {gb.energiKkal || 0} kkal
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 font-bold text-[10px]">
                              Protein: {gb.proteinGram || 0} g
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800 font-bold text-[10px]">
                              Lemak: {gb.lemakGram || 0} g
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800 font-bold text-[10px]">
                              Karbo: {gb.karbohidratGram || 0} g
                            </span>
                            {Number(gb.seratGram) > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800 font-bold text-[10px]">
                                Serat: {gb.seratGram} g
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Porsi Kecil Summary */}
                        <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 space-y-1">
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>Porsi Kecil</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800 font-bold text-[10px]">
                              Energi: {gk.energiKkal || 0} kkal
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 font-bold text-[10px]">
                              Protein: {gk.proteinGram || 0} g
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800 font-bold text-[10px]">
                              Lemak: {gk.lemakGram || 0} g
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800 font-bold text-[10px]">
                              Karbo: {gk.karbohidratGram || 0} g
                            </span>
                            {Number(gk.seratGram) > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800 font-bold text-[10px]">
                                Serat: {gk.seratGram} g
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewRecord(rec)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditRecord(rec)}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 text-blue-600 dark:text-blue-400 transition cursor-pointer"
                            title="Edit Menu Harian"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(rec.id)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                            title="Hapus Menu Harian"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Menu Harian */}
      {previewRecord && (() => {
        const gb = getGiziBesar(previewRecord);
        const gk = getGiziKecil(previewRecord);
        return (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Detail Menu Harian
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {previewRecord.hariTanggalFormatted || previewRecord.tanggalOperasional}
                  </h4>
                </div>
                <button
                  onClick={() => setPreviewRecord(null)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                {previewRecord.fotoMenuUrl && (
                  <div className="w-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <img
                      src={previewRecord.fotoMenuUrl}
                      alt={previewRecord.namaMenu}
                      className="w-full h-auto max-h-[65vh] object-contain block"
                    />
                  </div>
                )}

                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-400">Nama Menu</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {previewRecord.namaMenu}
                  </div>
                </div>

                {/* Detail Kandungan Gizi Porsi Besar */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-200/70 dark:border-indigo-900/50 space-y-2.5">
                  <div className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                    <span>Kandungan Gizi — Porsi Besar</span>
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">SD 4-6, SMP, SMA, Bumil/Busui</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-amber-800 text-center">
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300">Energi</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">{gb.energiKkal} kkal</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-emerald-800 text-center">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Protein</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">{gb.proteinGram} g</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/70 dark:border-rose-800 text-center">
                      <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300">Lemak</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">{gb.lemakGram} g</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-800 text-center">
                      <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300">Karbohidrat</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">{gb.karbohidratGram} g</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200/70 dark:border-purple-800 text-center">
                      <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300">Serat</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">{gb.seratGram || 0} g</div>
                    </div>
                  </div>
                  {gb.keterangan && (
                    <div className="text-[11px] text-indigo-800 dark:text-indigo-300">
                      <span className="font-bold">Keterangan:</span> {gb.keterangan}
                    </div>
                  )}
                </div>

                {/* Detail Kandungan Gizi Porsi Kecil */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/25 border border-emerald-200/70 dark:border-emerald-900/50 space-y-2.5">
                  <div className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                    <span>Kandungan Gizi — Porsi Kecil</span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">PAUD, TK, SD 1-3, Balita</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-amber-800 text-center">
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300">Energi</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">{gk.energiKkal} kkal</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-emerald-800 text-center">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Protein</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">{gk.proteinGram} g</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/70 dark:border-rose-800 text-center">
                      <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300">Lemak</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">{gk.lemakGram} g</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-200/70 dark:border-blue-800 text-center">
                      <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300">Karbohidrat</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">{gk.karbohidratGram} g</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-200/70 dark:border-purple-800 text-center">
                      <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300">Serat</div>
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">{gk.seratGram || 0} g</div>
                    </div>
                  </div>
                  {gk.keterangan && (
                    <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      <span className="font-bold">Keterangan:</span> {gk.keterangan}
                    </div>
                  )}
                </div>

                {previewRecord.catatanGizi && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold">Catatan Umum: </span>{previewRecord.catatanGizi}
                  </div>
                )}
              </div>

              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const rec = previewRecord;
                    setPreviewRecord(null);
                    handleEditRecord(rec);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  Edit Data Ini
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Hapus Data Menu Harian?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data menu harian yang dihapus tidak dapat dikembalikan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
