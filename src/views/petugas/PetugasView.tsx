import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Receipt,
  Plus,
  Search,
  Printer,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  RefreshCw,
  Building2,
  MapPin,
  Phone,
  FileText,
  DollarSign,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
  AlertCircle,
  X,
  Save,
  Sparkles,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { Petugas, SlipGajiHarian, RekapGajiHarianSummary } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface PetugasViewProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

// Helper konversi angka ke Terbilang Bahasa Indonesia
function angkaKeTerbilangIndo(angka: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];
  const n = Math.floor(Math.abs(angka));
  if (n === 0) return 'Nol Rupiah';

  function terbilang(x: number): string {
    if (x < 12) return bilangan[x];
    if (x < 20) return terbilang(x - 10) + ' Belas';
    if (x < 100) return terbilang(Math.floor(x / 10)) + ' Puluh' + (x % 10 !== 0 ? ' ' + terbilang(x % 10) : '');
    if (x < 200) return 'Seratus' + (x % 100 !== 0 ? ' ' + terbilang(x % 100) : '');
    if (x < 1000) return terbilang(Math.floor(x / 100)) + ' Ratus' + (x % 100 !== 0 ? ' ' + terbilang(x % 100) : '');
    if (x < 2000) return 'Seribu' + (x % 1000 !== 0 ? ' ' + terbilang(x % 1000) : '');
    if (x < 1000000) return terbilang(Math.floor(x / 1000)) + ' Ribu' + (x % 1000 !== 0 ? ' ' + terbilang(x % 1000) : '');
    if (x < 1000000000) return terbilang(Math.floor(x / 1000000)) + ' Juta' + (x % 1000000 !== 0 ? ' ' + terbilang(x % 1000000) : '');
    if (x < 1000000000000) return terbilang(Math.floor(x / 1000000000)) + ' Milyar' + (x % 1000000000 !== 0 ? ' ' + terbilang(x % 1000000000) : '');
    return String(x);
  }

  return (terbilang(n) + ' Rupiah').replace(/\s+/g, ' ').trim();
}

// Format Rupiah
function formatRupiah(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val || 0);
}

// Format Hari & Tanggal Indonesia
function formatHariTanggalIndo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export const PetugasView: React.FC<PetugasViewProps> = ({ currentPath = '/petugas', onNavigate }) => {
  // Determine active tab from URL or state
  const isSlipTab = currentPath.includes('slip-gaji');
  const [activeTab, setActiveTab] = useState<'daftar' | 'slip'>(isSlipTab ? 'slip' : 'daftar');

  useEffect(() => {
    if (currentPath.includes('slip-gaji')) {
      setActiveTab('slip');
    } else {
      setActiveTab('daftar');
    }
  }, [currentPath]);

  const handleTabSwitch = (tab: 'daftar' | 'slip') => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate(tab === 'daftar' ? '/petugas/daftar' : '/petugas/slip-gaji');
    }
  };

  // State Data
  const [petugasList, setPetugasList] = useState<Petugas[]>([]);
  const [slipList, setSlipList] = useState<SlipGajiHarian[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters for Daftar Petugas
  const [searchPetugas, setSearchPetugas] = useState<string>('');
  const [filterJabatan, setFilterJabatan] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  // Filters for Slip Gaji Harian
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedTanggal, setSelectedTanggal] = useState<string>(todayStr);
  const [filterStatusBayar, setFilterStatusBayar] = useState<string>('Semua');
  const [searchSlip, setSearchSlip] = useState<string>('');

  // Modals
  const [isModalPetugasOpen, setIsModalPetugasOpen] = useState<boolean>(false);
  const [editingPetugas, setEditingPetugas] = useState<Partial<Petugas> | null>(null);

  const [isModalSlipOpen, setIsModalSlipOpen] = useState<boolean>(false);
  const [editingSlip, setEditingSlip] = useState<Partial<SlipGajiHarian> | null>(null);

  const [isModalPrintSlipOpen, setIsModalPrintSlipOpen] = useState<boolean>(false);
  const [selectedPrintSlip, setSelectedPrintSlip] = useState<SlipGajiHarian | null>(null);

  const [isModalPrintRekapOpen, setIsModalPrintRekapOpen] = useState<boolean>(false);
  const [isModalPrintDaftarOpen, setIsModalPrintDaftarOpen] = useState<boolean>(false);

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Confirmation Modal State (replaces native window.confirm for iframe compatibility)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Fetch Petugas & Slip Gaji
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resPetugas, resSlip] = await Promise.all([
        fetch('/api/petugas').then(r => r.json()),
        fetch('/api/petugas/slip-gaji').then(r => r.json())
      ]);

      if (resPetugas.success) {
        setPetugasList(resPetugas.data || []);
      }
      if (resSlip.success) {
        setSlipList(resSlip.data || []);
      }
    } catch (err) {
      console.error('Failed to load petugas/slip data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Notification helper
  const showNotif = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Preset Daftar Jabatan di SPPG Badan Gizi Nasional
  const presetJabatan = [
    'Kepala Juru Masak (Head Chef)',
    'Asisten Juru Masak',
    'Petugas Pemorsian & Packing',
    'Driver Distribusi & Armada',
    'Petugas Cuci Ompreng & Sanitasi',
    'Petugas Logistik & Gudang',
    'Ahli Gizi & Pengawas Mutu',
    'Petugas Kebersihan & Lingkungan',
    'Tenaga Administrasi SPPG'
  ];

  // ==========================================
  // DAFTAR PETUGAS LOGIC
  // ==========================================
  const filteredPetugas = useMemo(() => {
    return petugasList.filter(p => {
      const matchSearch =
        p.nama.toLowerCase().includes(searchPetugas.toLowerCase()) ||
        p.nomor.toLowerCase().includes(searchPetugas.toLowerCase()) ||
        p.jabatan.toLowerCase().includes(searchPetugas.toLowerCase()) ||
        p.alamat.toLowerCase().includes(searchPetugas.toLowerCase());
      const matchJabatan = filterJabatan === 'Semua' || p.jabatan === filterJabatan;
      const matchStatus = filterStatus === 'Semua' || p.status === filterStatus;
      return matchSearch && matchJabatan && matchStatus;
    });
  }, [petugasList, searchPetugas, filterJabatan, filterStatus]);

  // Statistik Petugas
  const statsPetugas = useMemo(() => {
    const total = petugasList.length;
    const aktif = petugasList.filter(p => p.status === 'Aktif').length;
    const totalGajiHarian = petugasList
      .filter(p => p.status === 'Aktif')
      .reduce((sum, p) => sum + (p.besaranGaji || 0), 0);
    const rataGajiHarian = aktif > 0 ? Math.round(totalGajiHarian / aktif) : 0;
    return { total, aktif, totalGajiHarian, rataGajiHarian };
  }, [petugasList]);

  // Open Modal Petugas for Add/Edit
  const handleOpenPetugasModal = (petugas?: Petugas) => {
    if (petugas) {
      setEditingPetugas({ ...petugas });
    } else {
      const nextNum = petugasList.length + 1;
      const formattedNum = String(nextNum).padStart(2, '0');
      setEditingPetugas({
        id: `PTG-${formattedNum}`,
        nomor: formattedNum,
        nama: '',
        jabatan: 'Asisten Juru Masak',
        alamat: '',
        besaranGaji: 120000,
        telepon: '',
        status: 'Aktif',
        tanggalMulai: todayStr,
        nomorRekening: '-',
        namaBank: 'Tunai',
        keterangan: ''
      });
    }
    setIsModalPetugasOpen(true);
  };

  // Save Petugas
  const handleSavePetugas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPetugas || !editingPetugas.nama || !editingPetugas.jabatan) {
      showNotif('error', 'Nama dan jabatan petugas wajib diisi');
      return;
    }

    try {
      const res = await fetch('/api/petugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPetugas)
      });
      const data = await res.json();
      if (data.success) {
        showNotif('success', 'Data petugas berhasil disimpan');
        setIsModalPetugasOpen(false);
        setEditingPetugas(null);
        fetchData();
      } else {
        showNotif('error', data.message || 'Gagal menyimpan petugas');
      }
    } catch (err: any) {
      showNotif('error', err.message || 'Terjadi kesalahan sistem');
    }
  };

  // Delete Petugas
  const handleDeletePetugas = (petugas: Petugas) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Data Petugas',
      message: `Apakah Anda yakin ingin menghapus petugas "${petugas.nama}" (${petugas.jabatan})? Seluruh riwayat data terkait petugas ini akan dihapus.`,
      confirmText: 'Ya, Hapus Petugas',
      cancelText: 'Batal',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/petugas/${petugas.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showNotif('success', 'Petugas berhasil dihapus');
            setIsModalPetugasOpen(false);
            setEditingPetugas(null);
            fetchData();
          } else {
            showNotif('error', data.message || 'Gagal menghapus');
          }
        } catch (err: any) {
          showNotif('error', err.message || 'Gagal menghapus');
        }
      }
    });
  };

  // ==========================================
  // SLIP GAJI HARIAN LOGIC
  // ==========================================

  // Filter Slip Gaji for Selected Date
  const dailySlips = useMemo(() => {
    return slipList.filter(s => {
      const matchTanggal = selectedTanggal ? s.tanggal === selectedTanggal : true;
      const matchStatus = filterStatusBayar === 'Semua' || s.statusPembayaran === filterStatusBayar;
      const matchSearch =
        s.namaPetugas.toLowerCase().includes(searchSlip.toLowerCase()) ||
        s.nomorPetugas.toLowerCase().includes(searchSlip.toLowerCase()) ||
        s.nomorSlip.toLowerCase().includes(searchSlip.toLowerCase()) ||
        s.jabatan.toLowerCase().includes(searchSlip.toLowerCase());
      return matchTanggal && matchStatus && matchSearch;
    });
  }, [slipList, selectedTanggal, filterStatusBayar, searchSlip]);

  // Daily Summary Metrics
  const dailySummary: RekapGajiHarianSummary = useMemo(() => {
    const slipsForDate = slipList.filter(s => s.tanggal === selectedTanggal);
    const totalPetugasHadir = slipsForDate.length;
    const totalGajiDibayarkan = slipsForDate.reduce((sum, s) => sum + s.totalGajiBersih, 0);
    const lunasSlips = slipsForDate.filter(s => s.statusPembayaran === 'Lunas');
    const belumLunasSlips = slipsForDate.filter(s => s.statusPembayaran !== 'Lunas');

    const totalLunas = lunasSlips.length;
    const totalBelumLunas = belumLunasSlips.length;
    const totalGajiLunas = lunasSlips.reduce((sum, s) => sum + s.totalGajiBersih, 0);
    const totalGajiBelumLunas = belumLunasSlips.reduce((sum, s) => sum + s.totalGajiBersih, 0);
    const rataRataGajiHarian = totalPetugasHadir > 0 ? Math.round(totalGajiDibayarkan / totalPetugasHadir) : 0;

    return {
      tanggal: selectedTanggal,
      totalPetugasHadir,
      totalGajiDibayarkan,
      totalLunas,
      totalBelumLunas,
      totalGajiLunas,
      totalGajiBelumLunas,
      rataRataGajiHarian
    };
  }, [slipList, selectedTanggal]);

  // Date Navigation (Prev Day / Next Day)
  const handleDateShift = (deltaDays: number) => {
    const current = new Date(selectedTanggal + 'T00:00:00');
    current.setDate(current.getDate() + deltaDays);
    setSelectedTanggal(current.toISOString().split('T')[0]);
  };

  // Mass Generate Slips for Selected Date
  const handleBatchGenerate = async () => {
    const activeStaff = petugasList.filter(p => p.status === 'Aktif');
    if (activeStaff.length === 0) {
      showNotif('error', 'Tidak ada petugas aktif yang terdaftar.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Generate Massal Slip Gaji Harian',
      message: `Generate massal slip gaji harian untuk ${activeStaff.length} petugas aktif pada tanggal ${formatHariTanggalIndo(
        selectedTanggal
      )}?`,
      confirmText: 'Ya, Generate Massal',
      cancelText: 'Batal',
      danger: false,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/petugas/slip-gaji/batch-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tanggal: selectedTanggal })
          });
          const data = await res.json();
          if (data.success) {
            showNotif('success', data.message || 'Slip gaji harian massal berhasil digenerate.');
            fetchData();
          } else {
            showNotif('error', data.message || 'Gagal generate slip');
          }
        } catch (err: any) {
          showNotif('error', err.message || 'Gagal generate massal');
        }
      }
    });
  };

  // Toggle Payment Status
  const handleTogglePaymentStatus = async (slip: SlipGajiHarian) => {
    const nextStatus = slip.statusPembayaran === 'Lunas' ? 'Belum Dibayar' : 'Lunas';
    try {
      const res = await fetch(`/api/petugas/slip-gaji/${slip.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusPembayaran: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        showNotif('success', `Status slip ${slip.namaPetugas} diubah menjadi ${nextStatus}`);
        fetchData();
      } else {
        showNotif('error', data.message || 'Gagal mengubah status');
      }
    } catch (err: any) {
      showNotif('error', err.message || 'Gagal update status');
    }
  };

  // Delete Slip
  const handleDeleteSlip = (slip: SlipGajiHarian) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Slip Gaji Harian',
      message: `Apakah Anda yakin ingin menghapus slip gaji harian ${slip.nomorSlip} untuk ${slip.namaPetugas} (${formatHariTanggalIndo(slip.tanggal)})?`,
      confirmText: 'Ya, Hapus Slip Gaji',
      cancelText: 'Batal',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/petugas/slip-gaji/${slip.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showNotif('success', 'Slip gaji berhasil dihapus');
            setIsModalSlipOpen(false);
            setEditingSlip(null);
            fetchData();
          } else {
            showNotif('error', data.message || 'Gagal menghapus slip');
          }
        } catch (err: any) {
          showNotif('error', err.message || 'Gagal menghapus');
        }
      }
    });
  };

  // Open Modal Slip for Add/Edit
  const handleOpenSlipModal = (slip?: SlipGajiHarian, prefillPetugas?: Petugas) => {
    if (slip) {
      setEditingSlip({ ...slip });
    } else {
      const targetPetugas = prefillPetugas || petugasList.find(p => p.status === 'Aktif') || petugasList[0];
      const tarif = targetPetugas ? targetPetugas.besaranGaji : 120000;
      const uangMakan = 15000;
      const uangTransport = targetPetugas?.jabatan.includes('Driver') ? 15000 : 10000;
      const totalKotor = tarif + uangMakan + uangTransport;
      const totalBersih = totalKotor;

      setEditingSlip({
        tanggal: selectedTanggal,
        hariTanggalFormatted: formatHariTanggalIndo(selectedTanggal),
        petugasId: targetPetugas?.id || '',
        nomorPetugas: targetPetugas?.nomor || '01',
        namaPetugas: targetPetugas?.nama || '',
        jabatan: targetPetugas?.jabatan || '',
        alamat: targetPetugas?.alamat || '',
        kehadiranHari: 1,
        tarifGajiPerHari: tarif,
        gajiPokokHarian: tarif,
        uangMakanHarian: uangMakan,
        uangTransportHarian: uangTransport,
        uangLemburHarian: 0,
        bonusHarian: 0,
        totalPenghasilanKotor: totalKotor,
        potonganHarian: 0,
        keteranganPotongan: '-',
        totalGajiBersih: totalBersih,
        terbilang: angkaKeTerbilangIndo(totalBersih),
        metodePembayaran: targetPetugas?.namaBank === 'Tunai' ? 'Tunai' : 'Transfer Bank',
        statusPembayaran: 'Lunas',
        tanggalBayar: selectedTanggal,
        jamBayar: '15:00 WIB',
        catatanTugas: `Operasional harian SPPG divisi ${targetPetugas?.jabatan || 'Dapur'}`,
        namaPenerima: targetPetugas?.nama || '',
        namaBendahara: 'Hj. Siti Aminah, S.E.',
        namaKepalaSppg: 'Sri Rohayu, S. Pd'
      });
    }
    setIsModalSlipOpen(true);
  };

  // When changing petugas in slip modal, auto recalculate
  const handleSlipPetugasChange = (petugasId: string) => {
    const selected = petugasList.find(p => p.id === petugasId);
    if (!selected || !editingSlip) return;

    const kehadiran = Number(editingSlip.kehadiranHari !== undefined ? editingSlip.kehadiranHari : 1);
    const tarif = selected.besaranGaji || 120000;
    const gajiPokok = Math.round(kehadiran * tarif);
    const uangMakan = Number(editingSlip.uangMakanHarian || 15000);
    const uangTransport = selected.jabatan.includes('Driver') ? 15000 : 10000;
    const uangLembur = Number(editingSlip.uangLemburHarian || 0);
    const bonus = Number(editingSlip.bonusHarian || 0);
    const totalKotor = gajiPokok + uangMakan + uangTransport + uangLembur + bonus;
    const potongan = Number(editingSlip.potonganHarian || 0);
    const totalBersih = Math.max(0, totalKotor - potongan);

    setEditingSlip({
      ...editingSlip,
      petugasId: selected.id,
      nomorPetugas: selected.nomor,
      namaPetugas: selected.nama,
      jabatan: selected.jabatan,
      alamat: selected.alamat,
      tarifGajiPerHari: tarif,
      gajiPokokHarian: gajiPokok,
      uangMakanHarian: uangMakan,
      uangTransportHarian: uangTransport,
      totalPenghasilanKotor: totalKotor,
      totalGajiBersih: totalBersih,
      terbilang: angkaKeTerbilangIndo(totalBersih),
      namaPenerima: selected.nama,
      metodePembayaran: selected.namaBank === 'Tunai' ? 'Tunai' : 'Transfer Bank',
      catatanTugas: `Operasional harian SPPG divisi ${selected.jabatan}`
    });
  };

  // Recalculate slip amounts
  const handleRecalculateSlipAmounts = (updates: Partial<SlipGajiHarian>) => {
    if (!editingSlip) return;
    const current = { ...editingSlip, ...updates };

    const kehadiran = Number(current.kehadiranHari !== undefined ? current.kehadiranHari : 1);
    const tarif = Number(current.tarifGajiPerHari || 0);
    const gajiPokok = Math.round(kehadiran * tarif);
    const uangMakan = Number(current.uangMakanHarian || 0);
    const uangTransport = Number(current.uangTransportHarian || 0);
    const uangLembur = Number(current.uangLemburHarian || 0);
    const bonus = Number(current.bonusHarian || 0);
    const totalKotor = gajiPokok + uangMakan + uangTransport + uangLembur + bonus;

    const potongan = Number(current.potonganHarian || 0);
    const totalBersih = Math.max(0, totalKotor - potongan);
    const terbilang = angkaKeTerbilangIndo(totalBersih);

    setEditingSlip({
      ...current,
      gajiPokokHarian: gajiPokok,
      totalPenghasilanKotor: totalKotor,
      totalGajiBersih: totalBersih,
      terbilang
    });
  };

  // Save Slip Gaji
  const handleSaveSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlip || !editingSlip.petugasId) {
      showNotif('error', 'Petugas wajib dipilih');
      return;
    }

    try {
      const res = await fetch('/api/petugas/slip-gaji', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSlip)
      });
      const data = await res.json();
      if (data.success) {
        showNotif('success', 'Slip gaji harian berhasil disimpan');
        setIsModalSlipOpen(false);
        setEditingSlip(null);
        fetchData();
      } else {
        showNotif('error', data.message || 'Gagal menyimpan slip');
      }
    } catch (err: any) {
      showNotif('error', err.message || 'Terjadi kesalahan sistem');
    }
  };

  // Open Voucher Slip Print
  const handlePrintSlip = (slip: SlipGajiHarian) => {
    setSelectedPrintSlip(slip);
    setIsModalPrintSlipOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="ml-2 hover:opacity-80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold backdrop-blur-sm border border-indigo-400/20">
              <Building2 className="w-3.5 h-3.5" />
              SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Manajemen Petugas & Penggajian Harian
            </h1>
            <p className="text-indigo-200 text-sm max-w-2xl">
              Sistem terpadu data petugas, pembagian tugas harian, dan pencatatan slip gaji berbasis upah per hari kerja (Daily Wage Payroll System) Badan Gizi Nasional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTabSwitch('daftar')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
                activeTab === 'daftar'
                  ? 'bg-white text-indigo-900 shadow-lg scale-105 font-bold'
                  : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-900 border border-indigo-500/30'
              }`}
            >
              <Users className="w-4 h-4" />
              Sub Menu: Daftar Petugas
            </button>
            <button
              onClick={() => handleTabSwitch('slip')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
                activeTab === 'slip'
                  ? 'bg-white text-indigo-900 shadow-lg scale-105 font-bold'
                  : 'bg-indigo-900/60 text-indigo-200 hover:bg-indigo-900 border border-indigo-500/30'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Sub Menu: Slip Gaji Harian
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: DAFTAR PETUGAS */}
      {activeTab === 'daftar' && (
        <div className="space-y-6">
          {/* KPI Cards Petugas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Petugas</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {statsPetugas.total} <span className="text-xs font-normal text-slate-400">Orang</span>
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  {statsPetugas.aktif} Petugas Aktif
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Keaktifan</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {Math.round((statsPetugas.aktif / (statsPetugas.total || 1)) * 100)}%
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {statsPetugas.total - statsPetugas.aktif} Cuti / Nonaktif
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Beban Gaji / Hari</p>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {formatRupiah(statsPetugas.totalGajiHarian)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Alokasi operasional harian</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-rata Gaji / Hari</p>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {formatRupiah(statsPetugas.rataGajiHarian)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Standar upah harian SPPG</p>
              </div>
            </div>
          </div>

          {/* Table Container & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Header Toolbar */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Daftar Petugas SPPG
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rincian data Nomer, Nama, Jabatan, Alamat, dan Besaran Gaji Harian
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsModalPrintDaftarOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Daftar Petugas
                </button>
                <button
                  onClick={() => handleOpenPetugasModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm shadow-indigo-600/30"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Petugas Baru
                </button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, nomer, jabatan, atau alamat..."
                  value={searchPetugas}
                  onChange={e => setSearchPetugas(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={filterJabatan}
                  onChange={e => setFilterJabatan(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Semua">Semua Jabatan</option>
                  {presetJabatan.map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>

                {(searchPetugas || filterJabatan !== 'Semua' || filterStatus !== 'Semua') && (
                  <button
                    onClick={() => {
                      setSearchPetugas('');
                      setFilterJabatan('Semua');
                      setFilterStatus('Semua');
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Reset Filter"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-xs uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3.5 px-4 text-center w-16">Nomer</th>
                    <th className="py-3.5 px-4">Nama Petugas</th>
                    <th className="py-3.5 px-4">Jabatan</th>
                    <th className="py-3.5 px-4">Alamat</th>
                    <th className="py-3.5 px-4 text-right">Besaran Gaji</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Memuat data petugas...
                      </td>
                    </tr>
                  ) : filteredPetugas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        Tidak ada data petugas yang sesuai dengan pencarian atau filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPetugas.map((petugas) => (
                      <tr
                        key={petugas.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        {/* Nomer */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">
                            {petugas.nomor}
                          </span>
                        </td>

                        {/* Nama */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">
                            {petugas.nama}
                          </div>
                          {petugas.telepon && (
                            <div className="text-slate-400 flex items-center gap-1 text-[11px] mt-0.5">
                              <Phone className="w-3 h-3" />
                              {petugas.telepon}
                            </div>
                          )}
                        </td>

                        {/* Jabatan */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {petugas.jabatan}
                          </span>
                        </td>

                        {/* Alamat */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="text-slate-600 dark:text-slate-300 line-clamp-2 flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>{petugas.alamat || '-'}</span>
                          </div>
                        </td>

                        {/* Besaran Gaji */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {formatRupiah(petugas.besaranGaji)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">per hari kerja</div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              petugas.status === 'Aktif'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                : petugas.status === 'Cuti'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                            }`}
                          >
                            {petugas.status}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                handleTabSwitch('slip');
                                handleOpenSlipModal(undefined, petugas);
                              }}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                              title="Buat Slip Gaji Hari Ini"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenPetugasModal(petugas)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Data Petugas"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePetugas(petugas)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="Hapus Petugas"
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

            {/* Footer Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{filteredPetugas.length}</span> dari <span className="font-bold text-slate-800 dark:text-slate-200">{petugasList.length}</span> petugas
              </div>
              <div className="text-[11px] text-slate-400">
                Sistem Penggajian Harian Resmi SPPG Badan Gizi Nasional (BGN)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SLIP GAJI HARIAN */}
      {activeTab === 'slip' && (
        <div className="space-y-6">
          {/* Daily Date Navigation & Controls */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Pilih Tanggal Gaji Harian:</span>
                <button
                  onClick={() => handleDateShift(-1)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Hari Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedTanggal}
                    onChange={e => setSelectedTanggal(e.target.value)}
                    className="pl-3 pr-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={() => handleDateShift(1)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Hari Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedTanggal(todayStr)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                    selectedTanggal === todayStr
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Hari Ini
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleBatchGenerate}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-xs hover:from-amber-600 hover:to-orange-700 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  ⚡ Generate Massal Slip Hari Ini
                </button>

                <button
                  onClick={() => handleOpenSlipModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Buat Slip Gaji Harian
                </button>

                <button
                  onClick={() => setIsModalPrintRekapOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Rekap Gaji Harian
                </button>
              </div>
            </div>

            {/* Display formatted date label */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span className="font-extrabold uppercase text-indigo-700 dark:text-indigo-400">
                  {formatHariTanggalIndo(selectedTanggal)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Sistem Gaji Dibayarkan Per Hari Kerja (Daily Wage System)
              </div>
            </div>
          </div>

          {/* Daily KPI Summary Cards for Selected Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Gaji Hari Ini</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {formatRupiah(dailySummary.totalGajiDibayarkan)}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                  {dailySummary.totalPetugasHadir} Petugas Terdata
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sudah Lunas Dibayar</p>
                <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(dailySummary.totalGajiLunas)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {dailySummary.totalLunas} Slip Lunas
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Belum Lunas / Tertunda</p>
                <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {formatRupiah(dailySummary.totalGajiBelumLunas)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {dailySummary.totalBelumLunas} Slip Pending
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-rata Gaji Bersih</p>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {formatRupiah(dailySummary.rataRataGajiHarian)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">per petugas / hari</p>
              </div>
            </div>
          </div>

          {/* Table Container Slip Gaji Harian */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Filter Row */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari no slip, nama petugas, nomor, atau jabatan..."
                  value={searchSlip}
                  onChange={e => setSearchSlip(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={filterStatusBayar}
                  onChange={e => setFilterStatusBayar(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Semua">Semua Status Bayar</option>
                  <option value="Lunas">Lunas</option>
                  <option value="Belum Dibayar">Belum Dibayar</option>
                  <option value="Tertunda">Tertunda</option>
                </select>

                <button
                  onClick={fetchData}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-xs uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3.5 px-4 text-center w-12">No</th>
                    <th className="py-3.5 px-4">No Slip Gaji</th>
                    <th className="py-3.5 px-4">Petugas</th>
                    <th className="py-3.5 px-4">Jabatan</th>
                    <th className="py-3.5 px-4 text-right">Tarif Harian</th>
                    <th className="py-3.5 px-4 text-right">Makan & Transport</th>
                    <th className="py-3.5 px-4 text-right">Lembur/Bonus</th>
                    <th className="py-3.5 px-4 text-right font-extrabold text-indigo-700 dark:text-indigo-400">Total Bersih</th>
                    <th className="py-3.5 px-4 text-center">Metode</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center w-36">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Memuat data slip gaji...
                      </td>
                    </tr>
                  ) : dailySlips.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        Belum ada slip gaji harian untuk tanggal {formatHariTanggalIndo(selectedTanggal)}.
                        <div className="mt-3">
                          <button
                            onClick={handleBatchGenerate}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Generate Otomatis Sekarang
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    dailySlips.map((slip, idx) => (
                      <tr
                        key={slip.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>

                        {/* No Slip */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {slip.nomorSlip}
                        </td>

                        {/* Petugas */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            <span className="inline-block w-6 text-indigo-600 font-extrabold mr-1">
                              #{slip.nomorPetugas}
                            </span>
                            {slip.namaPetugas}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {slip.alamat}
                          </div>
                        </td>

                        {/* Jabatan */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {slip.jabatan}
                          </span>
                        </td>

                        {/* Tarif Harian */}
                        <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                          {formatRupiah(slip.gajiPokokHarian)}
                          <div className="text-[10px] text-slate-400">{slip.kehadiranHari} hari kerja</div>
                        </td>

                        {/* Makan & Transport */}
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                          {formatRupiah((slip.uangMakanHarian || 0) + (slip.uangTransportHarian || 0))}
                        </td>

                        {/* Lembur / Bonus */}
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                          {formatRupiah((slip.uangLemburHarian || 0) + (slip.bonusHarian || 0))}
                        </td>

                        {/* Total Bersih */}
                        <td className="py-3 px-4 text-right font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                          {formatRupiah(slip.totalGajiBersih)}
                        </td>

                        {/* Metode Bayar */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            {slip.metodePembayaran === 'Tunai' ? (
                              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            {slip.metodePembayaran}
                          </span>
                        </td>

                        {/* Status Bayar */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleTogglePaymentStatus(slip)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              slip.statusPembayaran === 'Lunas'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                            }`}
                            title="Klik untuk ubah status Lunas / Belum"
                          >
                            {slip.statusPembayaran === 'Lunas' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-600" />
                            )}
                            {slip.statusPembayaran}
                          </button>
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handlePrintSlip(slip)}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                              title="Cetak Voucher Slip Gaji"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenSlipModal(slip)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Slip Gaji"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSlip(slip)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="Hapus Slip Gaji"
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

            {/* Table Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                Total Slip Gaji Hari Ini: <span className="font-bold text-slate-800 dark:text-slate-200">{dailySlips.length} slip</span> | Total Pengeluaran: <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{formatRupiah(dailySummary.totalGajiDibayarkan)}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Pencatatan Gaji Harian Terverifikasi Bendahara SPPG
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: TAMBAH / EDIT PETUGAS */}
      {/* ========================================================= */}
      {isModalPetugasOpen && editingPetugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {editingPetugas.nama ? 'Edit Data Petugas' : 'Tambah Petugas Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi rincian Nomer, Nama, Jabatan, Alamat, dan Besaran Gaji Harian
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalPetugasOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePetugas} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nomer Petugas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomer Urut / ID Petugas *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 01, PTG-001"
                    value={editingPetugas.nomor || ''}
                    onChange={e => setEditingPetugas({ ...editingPetugas, nomor: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Petugas *
                  </label>
                  <select
                    value={editingPetugas.status || 'Aktif'}
                    onChange={e => setEditingPetugas({ ...editingPetugas, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Nama Petugas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Petugas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap petugas..."
                  value={editingPetugas.nama || ''}
                  onChange={e => setEditingPetugas({ ...editingPetugas, nama: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Jabatan & Besaran Gaji */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jabatan / Unit Kerja *
                  </label>
                  <input
                    type="text"
                    list="jabatan-suggestions"
                    required
                    placeholder="Pilih atau ketik jabatan..."
                    value={editingPetugas.jabatan || ''}
                    onChange={e => setEditingPetugas({ ...editingPetugas, jabatan: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                  <datalist id="jabatan-suggestions">
                    {presetJabatan.map(j => (
                      <option key={j} value={j} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Besaran Gaji Harian (Rp / Hari) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      placeholder="120000"
                      value={editingPetugas.besaranGaji || 0}
                      onChange={e => setEditingPetugas({ ...editingPetugas, besaranGaji: Number(e.target.value) })}
                      className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatRupiah(editingPetugas.besaranGaji || 0)} per hari kerja
                  </p>
                </div>
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Lengkap Tempat Tinggal *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Dusun Krajan RT 02 RW 01, Desa Krejengan, Kab. Probolinggo"
                  value={editingPetugas.alamat || ''}
                  onChange={e => setEditingPetugas({ ...editingPetugas, alamat: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* No HP & Pembayaran */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={editingPetugas.telepon || ''}
                    onChange={e => setEditingPetugas({ ...editingPetugas, telepon: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={editingPetugas.namaBank || 'Tunai'}
                    onChange={e => setEditingPetugas({ ...editingPetugas, namaBank: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="Tunai">Tunai (Cash Harian)</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="BCA">Bank BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BSI">Bank BSI</option>
                    <option value="Jatim">Bank Jatim</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No Rekening (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Nomor rekening / -"
                    value={editingPetugas.nomorRekening || ''}
                    onChange={e => setEditingPetugas({ ...editingPetugas, nomorRekening: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Keterangan Tugas Khusus
                </label>
                <input
                  type="text"
                  placeholder="Catatan penugasan harian atau shift..."
                  value={editingPetugas.keterangan || ''}
                  onChange={e => setEditingPetugas({ ...editingPetugas, keterangan: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                {editingPetugas.id ? (
                  <button
                    type="button"
                    onClick={() => handleDeletePetugas(editingPetugas as Petugas)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Petugas</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalPetugasOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Data Petugas
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: BUAT / EDIT SLIP GAJI HARIAN */}
      {/* ========================================================= */}
      {isModalSlipOpen && editingSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {editingSlip.id ? 'Edit Slip Gaji Harian' : 'Buat Slip Gaji Harian Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sistem pembayaran gaji per hari (Daily Wage Voucher)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalSlipOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlip} className="p-5 space-y-4">
              {/* Petugas & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Petugas *
                  </label>
                  <select
                    required
                    value={editingSlip.petugasId || ''}
                    onChange={e => handleSlipPetugasChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Pilih Petugas --</option>
                    {petugasList.map(p => (
                      <option key={p.id} value={p.id}>
                        #{p.nomor} - {p.nama} ({p.jabatan})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Kerja & Penggajian *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingSlip.tanggal || selectedTanggal}
                    onChange={e => {
                      const t = e.target.value;
                      handleRecalculateSlipAmounts({
                        tanggal: t,
                        hariTanggalFormatted: formatHariTanggalIndo(t)
                      });
                    }}
                    className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Info Card Petugas Terpilih */}
              {editingSlip.namaPetugas && (
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-indigo-900 dark:text-indigo-200">
                      #{editingSlip.nomorPetugas} {editingSlip.namaPetugas}
                    </span>
                    <span className="text-slate-500 mx-2">|</span>
                    <span className="text-slate-600 dark:text-slate-300">{editingSlip.jabatan}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Tarif Master: </span>
                    <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
                      {formatRupiah(editingSlip.tarifGajiPerHari || 0)}/hari
                    </span>
                  </div>
                </div>
              )}

              {/* Rincian Komponen Gaji Harian */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Rincian Komponen Upah Harian
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Kehadiran Hari */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Kehadiran (Hari)
                    </label>
                    <select
                      value={editingSlip.kehadiranHari !== undefined ? editingSlip.kehadiranHari : 1}
                      onChange={e => handleRecalculateSlipAmounts({ kehadiranHari: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value={1}>1 Hari Penuh (100%)</option>
                      <option value={0.5}>0.5 Hari (Setengah Hari)</option>
                    </select>
                  </div>

                  {/* Tarif Pokok Harian */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tarif Pokok (Rp/Hari)
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={editingSlip.tarifGajiPerHari || 0}
                      onChange={e => handleRecalculateSlipAmounts({ tarifGajiPerHari: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Subtotal Gaji Pokok */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Subtotal Pokok Harian
                    </label>
                    <div className="px-2.5 py-1.5 text-xs font-extrabold bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200">
                      {formatRupiah(editingSlip.gajiPokokHarian || 0)}
                    </div>
                  </div>
                </div>

                {/* Tunjangan Harian: Uang Makan & Transport */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Uang Makan Harian (Rp)
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={editingSlip.uangMakanHarian || 0}
                      onChange={e => handleRecalculateSlipAmounts({ uangMakanHarian: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Uang Transport (Rp)
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={editingSlip.uangTransportHarian || 0}
                      onChange={e => handleRecalculateSlipAmounts({ uangTransportHarian: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Uang Lembur Harian (Rp)
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={editingSlip.uangLemburHarian || 0}
                      onChange={e => handleRecalculateSlipAmounts({ uangLemburHarian: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Bonus / Insentif (Rp)
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={editingSlip.bonusHarian || 0}
                      onChange={e => handleRecalculateSlipAmounts({ bonusHarian: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Potongan Harian */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1">
                      Potongan Harian (Kasbon / Terlambat)
                    </label>
                    <input
                      type="number"
                      step={1000}
                      value={editingSlip.potonganHarian || 0}
                      onChange={e => handleRecalculateSlipAmounts({ potonganHarian: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Keterangan Potongan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Terlambat 30 menit / Kasbon harian"
                      value={editingSlip.keteranganPotongan || ''}
                      onChange={e => setEditingSlip({ ...editingSlip, keteranganPotongan: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Total Bersih Display & Terbilang */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      TOTAL GAJI BERSIH DITERIMA HARI INI
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 italic mt-0.5">
                      Terbilang: "{editingSlip.terbilang || angkaKeTerbilangIndo(editingSlip.totalGajiBersih || 0)}"
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                      {formatRupiah(editingSlip.totalGajiBersih || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metode Pembayaran & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Metode Pembayaran *
                  </label>
                  <select
                    value={editingSlip.metodePembayaran || 'Tunai'}
                    onChange={e => setEditingSlip({ ...editingSlip, metodePembayaran: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="Tunai">Tunai (Cash)</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="QRIS/E-Wallet">QRIS / E-Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Pembayaran *
                  </label>
                  <select
                    value={editingSlip.statusPembayaran || 'Lunas'}
                    onChange={e => setEditingSlip({ ...editingSlip, statusPembayaran: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="Lunas">Lunas (Sudah Dibayarkan)</option>
                    <option value="Belum Dibayar">Belum Dibayar</option>
                    <option value="Tertunda">Tertunda</option>
                  </select>
                </div>
              </div>

              {/* Catatan Tugas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Penugasan Hari Ini
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Masak menu katsu & pemorsian 2800 ompreng"
                  value={editingSlip.catatanTugas || ''}
                  onChange={e => setEditingSlip({ ...editingSlip, catatanTugas: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Tanda Tangan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Penerima (Petugas)
                  </label>
                  <input
                    type="text"
                    value={editingSlip.namaPenerima || ''}
                    onChange={e => setEditingSlip({ ...editingSlip, namaPenerima: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bendahara / Pembayar SPPG
                  </label>
                  <input
                    type="text"
                    value={editingSlip.namaBendahara || 'Hj. Siti Aminah, S.E.'}
                    onChange={e => setEditingSlip({ ...editingSlip, namaBendahara: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                {editingSlip.id ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSlip(editingSlip as SlipGajiHarian)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Slip</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalSlipOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Slip Gaji
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CETAK SLIP GAJI HARIAN RESMI (VOUCHER PRINT PREVIEW) */}
      {/* ========================================================= */}
      {isModalPrintSlipOpen && selectedPrintSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full text-slate-900 shadow-2xl overflow-hidden my-6 border border-slate-200">
            {/* Action Bar (Not printed) */}
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                Pratinjau Voucher Slip Gaji Harian
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Dokumen
                </button>
                <button
                  onClick={() => setIsModalPrintSlipOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Document Area */}
            <div className="p-8 space-y-6 font-sans">
              {/* Kop Surat Resmi */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <div className="text-[11px] font-black tracking-widest uppercase text-slate-600">
                  BADAN GIZI NASIONAL (BGN) REPUBLIK INDONESIA
                </div>
                <div className="text-base font-black tracking-tight uppercase text-slate-950">
                  SATUAN PELAYANAN PANGAN GIZI (SPPG) KREJENGAN TEMENGGUNGAN
                </div>
                <div className="text-[10px] text-slate-600">
                  Kecamatan Krejengan, Kabupaten Probolinggo, Jawa Timur • Layanan Makan Bergizi Gratis (MBG)
                </div>
              </div>

              {/* Title & Slip Number */}
              <div className="text-center">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900 underline underline-offset-4">
                  SLIP GAJI HARIAN PETUGAS
                </h2>
                <div className="flex items-center justify-center gap-4 text-xs font-mono mt-1 text-slate-600">
                  <span>No: <strong>{selectedPrintSlip.nomorSlip}</strong></span>
                  <span>•</span>
                  <span>Tanggal Kerja: <strong>{formatHariTanggalIndo(selectedPrintSlip.tanggal)}</strong></span>
                </div>
              </div>

              {/* Identitas Petugas */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Nomer Petugas:</span>
                  <div className="font-bold text-slate-900 font-mono">#{selectedPrintSlip.nomorPetugas}</div>
                </div>
                <div>
                  <span className="text-slate-500">Nama Petugas:</span>
                  <div className="font-bold text-slate-900">{selectedPrintSlip.namaPetugas}</div>
                </div>
                <div>
                  <span className="text-slate-500">Jabatan / Divisi:</span>
                  <div className="font-semibold text-slate-900">{selectedPrintSlip.jabatan}</div>
                </div>
                <div>
                  <span className="text-slate-500">Alamat:</span>
                  <div className="text-slate-700 text-[11px]">{selectedPrintSlip.alamat || '-'}</div>
                </div>
              </div>

              {/* Tabel Rincian Upah Harian */}
              <div>
                <table className="w-full text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2 px-3 text-left">Komponen Upah Harian</th>
                      <th className="py-2 px-3 text-center w-28">Keterangan</th>
                      <th className="py-2 px-3 text-right w-36">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-medium">Gaji Pokok Harian</td>
                      <td className="py-2 px-3 text-center text-slate-500">{selectedPrintSlip.kehadiranHari} hari kerja</td>
                      <td className="py-2 px-3 text-right font-semibold">{formatRupiah(selectedPrintSlip.gajiPokokHarian)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">Uang Makan Harian</td>
                      <td className="py-2 px-3 text-center text-slate-500">Operasional dapur</td>
                      <td className="py-2 px-3 text-right font-semibold">{formatRupiah(selectedPrintSlip.uangMakanHarian || 0)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">Uang Transport Harian</td>
                      <td className="py-2 px-3 text-center text-slate-500">Mobilitas tugas</td>
                      <td className="py-2 px-3 text-right font-semibold">{formatRupiah(selectedPrintSlip.uangTransportHarian || 0)}</td>
                    </tr>
                    {(selectedPrintSlip.uangLemburHarian || 0) > 0 && (
                      <tr>
                        <td className="py-2 px-3">Uang Lembur Harian</td>
                        <td className="py-2 px-3 text-center text-slate-500">Persiapan subuh / shift</td>
                        <td className="py-2 px-3 text-right font-semibold">{formatRupiah(selectedPrintSlip.uangLemburHarian)}</td>
                      </tr>
                    )}
                    {(selectedPrintSlip.bonusHarian || 0) > 0 && (
                      <tr>
                        <td className="py-2 px-3">Bonus / Insentif Harian</td>
                        <td className="py-2 px-3 text-center text-slate-500">Target porsi tercapai</td>
                        <td className="py-2 px-3 text-right font-semibold">{formatRupiah(selectedPrintSlip.bonusHarian)}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan={2} className="py-2 px-3">Subtotal Penghasilan Kotor</td>
                      <td className="py-2 px-3 text-right">{formatRupiah(selectedPrintSlip.totalPenghasilanKotor)}</td>
                    </tr>
                    {(selectedPrintSlip.potonganHarian || 0) > 0 && (
                      <tr className="text-rose-700">
                        <td className="py-2 px-3">Potongan Harian</td>
                        <td className="py-2 px-3 text-center text-rose-500">{selectedPrintSlip.keteranganPotongan || '-'}</td>
                        <td className="py-2 px-3 text-right font-semibold">-{formatRupiah(selectedPrintSlip.potonganHarian)}</td>
                      </tr>
                    )}
                    <tr className="bg-emerald-50 border-t-2 border-emerald-600 font-black text-sm text-emerald-900">
                      <td colSpan={2} className="py-3 px-3 uppercase tracking-wider">
                        TOTAL BERSIH DITERIMA (TAKE HOME PAY)
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-800">
                        {formatRupiah(selectedPrintSlip.totalGajiBersih)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Terbilang */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="font-bold text-slate-600">Terbilang: </span>
                <span className="italic font-bold text-slate-900">
                  {selectedPrintSlip.terbilang || angkaKeTerbilangIndo(selectedPrintSlip.totalGajiBersih)}
                </span>
              </div>

              {/* Metode & Catatan */}
              <div className="text-[11px] text-slate-600 flex justify-between items-center px-1">
                <div>Metode Pembayaran: <strong>{selectedPrintSlip.metodePembayaran}</strong></div>
                <div>Status: <span className="font-black text-emerald-700 uppercase">{selectedPrintSlip.statusPembayaran}</span></div>
              </div>

              {/* Tanda Tangan */}
              <div className="pt-6 grid grid-cols-2 text-center text-xs gap-8">
                <div className="space-y-12">
                  <p className="text-slate-600">Penerima Upah,</p>
                  <div>
                    <p className="font-bold text-slate-900 underline underline-offset-2">{selectedPrintSlip.namaPenerima}</p>
                    <p className="text-[10px] text-slate-500">Petugas SPPG</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <p className="text-slate-600">
                    Krejengan, {formatHariTanggalIndo(selectedPrintSlip.tanggal)}<br />
                    Bendahara Pengeluaran SPPG,
                  </p>
                  <div>
                    <p className="font-bold text-slate-900 underline underline-offset-2">{selectedPrintSlip.namaBendahara}</p>
                    <p className="text-[10px] text-slate-500">NIP/ID. BGN-KEU-2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CETAK REKAPITULASI GAJI HARIAN SELURUH PETUGAS */}
      {/* ========================================================= */}
      {isModalPrintRekapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full text-slate-900 shadow-2xl overflow-hidden my-6 border border-slate-200">
            {/* Top Toolbar */}
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                Pratinjau Lembar Rekapitulasi Gaji Harian
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Lembar Rekap
                </button>
                <button
                  onClick={() => setIsModalPrintRekapOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="p-8 space-y-6">
              {/* Header Kop */}
              <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
                <div className="text-xs font-black tracking-widest uppercase text-slate-600">
                  BADAN GIZI NASIONAL (BGN) • SATUAN PELAYANAN PANGAN GIZI (SPPG)
                </div>
                <div className="text-lg font-black tracking-tight uppercase text-slate-950">
                  REKAPITULASI PEMBAYARAN UPAH HARIAN PETUGAS
                </div>
                <div className="text-xs text-slate-600 font-bold">
                  HARI & TANGGAL: {formatHariTanggalIndo(selectedTanggal).toUpperCase()}
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="py-2 px-2 text-center border-r border-slate-300 w-10">No</th>
                    <th className="py-2 px-3 text-left border-r border-slate-300">Nama Petugas</th>
                    <th className="py-2 px-3 text-left border-r border-slate-300">Jabatan</th>
                    <th className="py-2 px-2 text-center border-r border-slate-300 w-16">Hari</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300">Upah Pokok</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300">Tunjangan</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300">Total Bersih</th>
                    <th className="py-2 px-2 text-center border-r border-slate-300 w-20">Metode</th>
                    <th className="py-2 px-4 text-center w-28">Tanda Tangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dailySlips.map((slip, i) => (
                    <tr key={slip.id}>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 font-bold">{i + 1}</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">{slip.namaPetugas}</td>
                      <td className="py-2.5 px-3 border-r border-slate-200">{slip.jabatan}</td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200">{slip.kehadiranHari}</td>
                      <td className="py-2.5 px-3 text-right border-r border-slate-200 font-mono">{formatRupiah(slip.gajiPokokHarian)}</td>
                      <td className="py-2.5 px-3 text-right border-r border-slate-200 font-mono">
                        {formatRupiah((slip.uangMakanHarian || 0) + (slip.uangTransportHarian || 0) + (slip.uangLemburHarian || 0))}
                      </td>
                      <td className="py-2.5 px-3 text-right border-r border-slate-200 font-mono font-bold text-slate-900">
                        {formatRupiah(slip.totalGajiBersih)}
                      </td>
                      <td className="py-2.5 px-2 text-center border-r border-slate-200 text-[10px]">{slip.metodePembayaran}</td>
                      <td className="py-2.5 px-4 text-center border-slate-200 text-slate-400 font-mono text-[10px]">
                        {i + 1}. ....................
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-900">
                    <td colSpan={6} className="py-2.5 px-4 text-right uppercase border-r border-slate-300">
                      TOTAL DIBAYARKAN HARI INI:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 border-r border-slate-300">
                      {formatRupiah(dailySummary.totalGajiDibayarkan)}
                    </td>
                    <td colSpan={2} className="py-2.5 px-2 text-center text-[10px]">
                      {dailySlips.length} Petugas
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 text-center text-xs gap-8">
                <div className="space-y-12">
                  <p className="text-slate-600">Mengetahui,<br />Kepala SPPG Probolinggo,</p>
                  <div>
                    <p className="font-bold text-slate-900 underline">Sri Rohayu, S. Pd</p>
                    <p className="text-[10px] text-slate-500">Penanggung Jawab Operasional</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <p className="text-slate-600">
                    Krejengan, {formatHariTanggalIndo(selectedTanggal)}<br />
                    Bendahara Pengeluaran SPPG,
                  </p>
                  <div>
                    <p className="font-bold text-slate-900 underline">Hj. Siti Aminah, S.E.</p>
                    <p className="text-[10px] text-slate-500">Pengelola Keuangan Harian</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: CETAK DAFTAR PETUGAS SPPG */}
      {/* ========================================================= */}
      {isModalPrintDaftarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full text-slate-900 shadow-2xl overflow-hidden my-6 border border-slate-200">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                Cetak Master Daftar Petugas SPPG
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Dokumen
                </button>
                <button
                  onClick={() => setIsModalPrintDaftarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
                <div className="text-xs font-black tracking-widest uppercase text-slate-600">
                  BADAN GIZI NASIONAL • SATUAN PELAYANAN PANGAN GIZI (SPPG)
                </div>
                <div className="text-lg font-black tracking-tight uppercase text-slate-950">
                  DAFTAR PETUGAS & BESARAN GAJI HARIAN
                </div>
                <div className="text-xs text-slate-600">
                  SPPG Krejengan Temenggungan, Kabupaten Probolinggo
                </div>
              </div>

              <table className="w-full text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800">
                    <th className="py-2 px-2 text-center w-12 border-r border-slate-300">Nomer</th>
                    <th className="py-2 px-3 text-left border-r border-slate-300">Nama Petugas</th>
                    <th className="py-2 px-3 text-left border-r border-slate-300">Jabatan</th>
                    <th className="py-2 px-3 text-left border-r border-slate-300">Alamat Lengkap</th>
                    <th className="py-2 px-3 text-right border-r border-slate-300">Besaran Gaji Harian</th>
                    <th className="py-2 px-2 text-center w-16">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {petugasList.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 px-2 text-center font-bold border-r border-slate-200">#{p.nomor}</td>
                      <td className="py-2 px-3 font-bold border-r border-slate-200 text-slate-900">{p.nama}</td>
                      <td className="py-2 px-3 border-r border-slate-200">{p.jabatan}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-600">{p.alamat}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-800 border-r border-slate-200 font-mono">
                        {formatRupiah(p.besaranGaji)} / hari
                      </td>
                      <td className="py-2 px-2 text-center font-semibold text-[10px]">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-8 grid grid-cols-2 text-center text-xs gap-8">
                <div className="space-y-12">
                  <p className="text-slate-600">Mengetahui,<br />Kepala SPPG Probolinggo,</p>
                  <div>
                    <p className="font-bold text-slate-900 underline">Sri Rohayu, S. Pd</p>
                    <p className="text-[10px] text-slate-500">Penanggung Jawab SPPG</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <p className="text-slate-600">
                    Probolinggo, {formatHariTanggalIndo(todayStr)}<br />
                    Pengelola Administrasi & Kepegawaian,
                  </p>
                  <div>
                    <p className="font-bold text-slate-900 underline">Hj. Siti Aminah, S.E.</p>
                    <p className="text-[10px] text-slate-500">Koordinator HR & Keuangan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        danger={confirmModal.danger}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          await confirmModal.onConfirm();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
};

export default PetugasView;
