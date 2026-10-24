import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileCheck,
  Printer,
  Download,
  Search,
  Filter,
  Calendar,
  Building2,
  UserCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  User,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { BastDocument, BastStatus } from '../../types';
import { downloadBastDocx } from '../../utils/bastDocxGenerator';

// Authentic stylized cursive signature for Sri Rohayu, S.Pd. matching PDF template
const SriRohayuSignature: React.FC<{ className?: string }> = ({ className = 'h-14 w-auto' }) => (
  <svg viewBox="0 0 160 65" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M32 46 C27 40, 20 26, 25 12 C28 3, 37 5, 41 15 C44 24, 42 36, 40 50 C39 56, 41 58, 45 52 C49 46, 53 34, 56 24 C58 18, 61 18, 62 25 C63 33, 61 46, 64 50 C66 53, 70 43, 74 34 C77 26, 82 24, 84 31 C86 38, 84 48, 88 51 C91 53, 95 44, 99 36 C103 28, 108 28, 111 34 C114 40, 113 48, 117 50 C121 52, 127 42, 133 33 C137 27, 141 30, 140 36 C139 44, 133 52, 125 56 C117 60, 101 61, 84 62 C64 63, 44 62, 24 61 C17 61, 13 60, 11 60"
      stroke="#134e4a"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M37 17 C48 19, 68 20, 88 19 M76 11 C75 21, 74 33, 74 44"
      stroke="#134e4a"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M100 17 C106 13, 116 11, 120 17 C122 21, 118 29, 114 36"
      stroke="#134e4a"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

interface BastSubViewProps {
  initialDate?: string;
  onShowToast: (text: string, type?: 'success' | 'error') => void;
  openConfirmModal: (config: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    danger?: boolean;
    onConfirm: () => Promise<void> | void;
  }) => void;
}

export const BastSubView: React.FC<BastSubViewProps> = ({
  initialDate,
  onShowToast,
  openConfirmModal
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [bastList, setBastList] = useState<BastDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showDigitalSignature, setShowDigitalSignature] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'single' | 'range'>('single');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals
  const [previewDoc, setPreviewDoc] = useState<BastDocument | null>(null);
  const [editDoc, setEditDoc] = useState<BastDocument | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Form for manual creation or editing
  const [formData, setFormData] = useState<Partial<BastDocument>>({});

  // Fetch BAST list
  const fetchBastList = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRangeFilter === 'single') {
        params.append('tanggal', selectedDate);
      } else {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await fetch(`/api/v1/penerima-manfaat/bast?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setBastList(json.data || []);
      } else {
        onShowToast(json.message || 'Gagal memuat data BAST', 'error');
      }
    } catch (err) {
      console.error('Error fetching BAST documents:', err);
      onShowToast('Gagal terhubung ke server', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBastList();
  }, [selectedDate, dateRangeFilter, startDate, endDate]);

  // Handle batch generation for selected date
  const handleGenerateBatch = async (force: boolean = false) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/v1/penerima-manfaat/bast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal: selectedDate, force })
      });
      const json = await res.json();
      if (json.success) {
        onShowToast(json.message || 'BAST berhasil digenerate otomatis', 'success');
        fetchBastList();
      } else {
        onShowToast(json.message || 'Gagal generate BAST', 'error');
      }
    } catch (err) {
      onShowToast('Terjadi kesalahan saat generate BAST', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Regenerate single BAST
  const handleRegenerateSingle = (doc: BastDocument) => {
    openConfirmModal({
      isOpen: true,
      title: 'Generate Ulang Dokumen BAST',
      message: `Apakah Anda yakin ingin memperbarui data BAST "${doc.nomorBast}" untuk ${doc.namaSekolah}? Jumlah paket akan disesuaikan dengan data penerima manfaat harian terbaru pada tanggal ${doc.tanggal}.`,
      confirmText: 'Ya, Generate Ulang',
      danger: false,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/penerima-manfaat/bast/${doc.id}/regenerate`, {
            method: 'POST'
          });
          const json = await res.json();
          if (json.success) {
            onShowToast(json.message || 'BAST berhasil diperbarui', 'success');
            fetchBastList();
            if (previewDoc?.id === doc.id) {
              setPreviewDoc(json.data);
            }
          } else {
            onShowToast(json.message || 'Gagal meregenerasi dokumen', 'error');
          }
        } catch (err) {
          onShowToast('Gagal menghubungi server', 'error');
        }
      }
    });
  };

  // Handle Delete BAST
  const handleDeleteBast = (doc: BastDocument) => {
    openConfirmModal({
      isOpen: true,
      title: 'Hapus Dokumen BAST',
      message: `Konfirmasi: Hapus dokumen BAST "${doc.nomorBast}" (${doc.namaSekolah})? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus Dokumen',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/penerima-manfaat/bast/${doc.id}`, {
            method: 'DELETE'
          });
          const json = await res.json();
          if (json.success) {
            onShowToast('Dokumen BAST berhasil dihapus', 'success');
            fetchBastList();
            if (previewDoc?.id === doc.id) setPreviewDoc(null);
          } else {
            onShowToast(json.message || 'Gagal menghapus dokumen', 'error');
          }
        } catch (err) {
          onShowToast('Terjadi kesalahan saat menghapus BAST', 'error');
        }
      }
    });
  };

  // Handle Save Edit Form
  const handleSaveEdit = async () => {
    if (!editDoc && !formData.namaSekolah) {
      onShowToast('Nama sekolah/lembaga wajib diisi', 'error');
      return;
    }

    const docId = editDoc ? editDoc.id : formData.id;
    const isEdit = Boolean(editDoc);

    try {
      const url = isEdit
        ? `/api/v1/penerima-manfaat/bast/${docId}`
        : '/api/v1/penerima-manfaat/bast';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        isDataLengkap: Boolean(
          formData.namaPic?.trim() &&
          formData.telponPic?.trim() &&
          formData.namaPetugasDistribusi?.trim()
        )
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        onShowToast(
          isEdit ? 'Dokumen BAST berhasil diperbarui' : 'Dokumen BAST berhasil dibuat',
          'success'
        );
        setEditDoc(null);
        setIsCreateModalOpen(false);
        setFormData({});
        fetchBastList();
        if (previewDoc?.id === docId) {
          setPreviewDoc(json.data);
        }
      } else {
        onShowToast(json.message || 'Gagal menyimpan perubahan', 'error');
      }
    } catch (err) {
      onShowToast('Gagal menghubungi server', 'error');
    }
  };

  // Open Edit Modal
  const openEditModal = (doc: BastDocument) => {
    setEditDoc(doc);
    setFormData({
      ...doc
    });
  };

  // Open Create Manual Modal
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setFormData({
      tanggal: selectedDate,
      waktuPenerimaan: 'Jam 07:30 WIB',
      namaSekolah: '',
      namaPic: '',
      telponPic: '',
      jumlahPaketMakanan: 0,
      jumlahAlatMakan: 0,
      namaPetugasDistribusi: 'Abdus Salam',
      telponPetugasDistribusi: '085212581665',
      namaTimDistribusi: 'Tim Distribusi SPPG Hafshawaty 001 Genggong',
      namaKepalaSppg: 'Sri Rohayu, S.Pd.',
      jabatanKepalaSppg: 'Kepala SPPG Probolinggo Krejengan Temenggungan',
      status: 'SIAP_DICETAK'
    });
  };

  // Print Document Trigger
  const handlePrintDocument = (doc?: BastDocument) => {
    const target = doc || previewDoc;
    if (!target) return;
    window.print();
  };

  // Download Word (.docx)
  const handleDownloadWord = async (doc: BastDocument) => {
    try {
      onShowToast(`Menyiapkan unduhan Word: ${doc.nomorBast}...`, 'success');
      await downloadBastDocx(doc);
      onShowToast('File Word (.docx) berhasil diunduh', 'success');
    } catch (err) {
      console.error('Download error:', err);
      // Fallback to server route
      window.location.href = `/api/v1/penerima-manfaat/bast/${doc.id}/docx`;
    }
  };

  // Filtered List
  const filteredBast = bastList.filter((doc) => {
    const matchesSearch =
      doc.namaSekolah.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.nomorBast.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.namaPic && doc.namaPic.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'INCOMPLETE') return !doc.isDataLengkap;
    return doc.status === filterStatus;
  });

  // KPI Calculations
  const totalDocs = bastList.length;
  const readyDocs = bastList.filter((d) => d.status === 'SIAP_DICETAK' || d.status === 'FINAL').length;
  const incompleteDocs = bastList.filter((d) => !d.isDataLengkap).length;
  const totalPaket = bastList.reduce((acc, d) => acc + (d.jumlahPaketMakanan || 0), 0);

  // Quick Date Navigation
  const changeDateByDays = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP TOOLBAR: Date Selector, Generate Actions & Navigation */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Date Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 hover:bg-white text-slate-600 rounded-xl transition-all"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-2.5 py-1">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateRangeFilter('single');
                }}
                className="bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => changeDateByDays(1)}
              className="p-1.5 hover:bg-white text-slate-600 rounded-xl transition-all"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().split('T')[0]);
              setDateRangeFilter('single');
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
          >
            Hari Ini
          </button>

          <button
            onClick={() => fetchBastList()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Action Buttons: Auto Generate & Manual Create */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => handleGenerateBatch(false)}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold rounded-2xl shadow-sm shadow-emerald-600/20 transition-all duration-150 disabled:opacity-60"
            title="Buat dokumen BAST otomatis untuk semua sekolah di tanggal terpilih"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Memproses...' : '⚡ Generate BAST Otomatis'}</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-sm font-semibold rounded-2xl shadow-sm transition-all duration-150"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Buat BAST Baru</span>
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Dokumen BAST
            </span>
            <div className="text-2xl font-black text-slate-900">{totalDocs}</div>
            <p className="text-[11px] text-slate-500">Sekolah/lembaga terdistribusi</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Siap Cetak / Final
            </span>
            <div className="text-2xl font-black text-emerald-600">{readyDocs}</div>
            <p className="text-[11px] text-slate-500">Dokumen lengkap & valid</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Data Belum Lengkap
            </span>
            <div className={`text-2xl font-black ${incompleteDocs > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {incompleteDocs}
            </div>
            <p className="text-[11px] text-slate-500">Perlu melengkapi PIC / Kontak</p>
          </div>
          <div className={`p-3 rounded-2xl ${incompleteDocs > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Paket Makanan
            </span>
            <div className="text-2xl font-black text-indigo-600">
              {totalPaket.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500">Porsi makanan & alat makan</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama sekolah, no. BAST, atau PIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 focus:bg-white text-sm rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'Semua Status' },
            { id: 'SIAP_DICETAK', label: 'Siap Dicetak' },
            { id: 'FINAL', label: 'Final' },
            { id: 'DRAFT', label: 'Draft' },
            { id: 'INCOMPLETE', label: 'Belum Lengkap' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. TABLE OF BAST DOCUMENTS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">
              Daftar Berita Acara Serah Terima (BAST)
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {filteredBast.length} dokumen
            </span>
          </div>

          {filteredBast.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleGenerateBatch(true)}
                className="text-xs font-semibold text-slate-500 hover:text-emerald-600 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-all"
                title="Generate ulang seluruh data BAST tanggal ini"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Perbarui Semua</span>
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-7 h-7 animate-spin text-emerald-500" />
            <p className="text-sm font-medium">Memuat data BAST...</p>
          </div>
        ) : filteredBast.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center">
              <FileCheck className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">Belum Ada Dokumen BAST</h4>
            <p className="text-slate-500 text-sm max-w-md">
              Belum ada berita acara serah terima untuk tanggal{' '}
              <strong className="text-slate-700">{selectedDate}</strong>. Anda dapat mengklik tombol
              generate otomatis di bawah ini untuk membuat dokumen bagi seluruh sekolah terdistribusi.
            </p>
            <button
              onClick={() => handleGenerateBatch(false)}
              disabled={isGenerating}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold rounded-2xl shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate BAST Otomatis Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <th className="px-5 py-3.5 w-12 text-center">No</th>
                  <th className="px-5 py-3.5">Nomor BAST</th>
                  <th className="px-5 py-3.5">Sekolah / Lembaga</th>
                  <th className="px-5 py-3.5 text-center">Jumlah Paket</th>
                  <th className="px-5 py-3.5">PIC Sekolah</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBast.map((doc, idx) => {
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. No */}
                      <td className="px-5 py-3.5 text-center text-slate-400 font-semibold text-xs">
                        {idx + 1}
                      </td>

                      {/* 2. Nomor BAST */}
                      <td className="px-5 py-3.5">
                        <div className="font-mono font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {doc.nomorBast}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{doc.hariTanggalFormatted}</span>
                        </div>
                      </td>

                      {/* 3. Sekolah / Lembaga */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800">{doc.namaSekolah}</span>
                        </div>
                        {doc.alamatSekolah && (
                          <div className="text-[11px] text-slate-400 pl-6 truncate max-w-xs">
                            {doc.alamatSekolah}
                          </div>
                        )}
                      </td>

                      {/* 4. Jumlah Paket */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-black text-xs border border-emerald-200/60">
                          {doc.jumlahPaketMakanan.toLocaleString('id-ID')} Porsi
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Alat Makan: {doc.jumlahAlatMakan}
                        </div>
                      </td>

                      {/* 5. PIC & Kontak */}
                      <td className="px-5 py-3.5">
                        {doc.namaPic ? (
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{doc.namaPic}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{doc.telponPic || '-'}</span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openEditModal(doc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/60 hover:bg-amber-100 transition-all"
                          >
                            <AlertCircle className="w-3 h-3" />
                            <span>Lengkapi PIC</span>
                          </button>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {doc.status === 'FINAL' && (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              FINAL
                            </span>
                          )}
                          {doc.status === 'SIAP_DICETAK' && (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              SIAP DICETAK
                            </span>
                          )}
                          {doc.status === 'DRAFT' && (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                              DRAFT
                            </span>
                          )}

                          {!doc.isDataLengkap && (
                            <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>Belum Lengkap</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Action Buttons */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Pratinjau Dokumen */}
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Pratinjau Dokumen BAST"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Unduh Word (.docx) */}
                          <button
                            onClick={() => handleDownloadWord(doc)}
                            className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                            title="Unduh Microsoft Word (.docx)"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Cetak Langsung */}
                          <button
                            onClick={() => {
                              setPreviewDoc(doc);
                              setTimeout(() => window.print(), 300);
                            }}
                            className="p-2 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Cetak Dokumen"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit / Lengkapi */}
                          <button
                            onClick={() => openEditModal(doc)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                            title="Edit Data / PIC"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Generate Ulang */}
                          <button
                            onClick={() => handleRegenerateSingle(doc)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                            title="Generate Ulang Data"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>

                          {/* Hapus */}
                          <button
                            onClick={() => handleDeleteBast(doc)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ========================================================= */}
      {/* 5. MODAL: PRATINJAU DOKUMEN BAST (HIGH FIDELITY TO PDF)   */}
      {/* ========================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
            {/* Modal Header (Hidden on Print) */}
            <div className="p-4 md:p-5 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <FileCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm md:text-base">
                    Pratinjau Berita Acara Serah Terima (BAST)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Nomor: {previewDoc.nomorBast} • {previewDoc.namaSekolah}
                  </p>
                </div>
              </div>

              {/* Action Buttons in Modal Header */}
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl text-xs text-slate-300 cursor-pointer select-none border border-slate-700/60">
                  <input
                    type="checkbox"
                    checked={showDigitalSignature}
                    onChange={(e) => setShowDigitalSignature(e.target.checked)}
                    className="rounded text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Tanda Tangan Digital</span>
                </label>

                <button
                  onClick={() => handleDownloadWord(previewDoc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all"
                  title="Unduh Dokumen Word (.docx)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unduh Word</span>
                </button>

                <button
                  onClick={() => handlePrintDocument(previewDoc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all"
                  title="Cetak Dokumen atau Simpan PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>

                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Printable Container) */}
            <div className="p-4 md:p-8 overflow-y-auto bg-slate-100/50 text-slate-900 select-text print:p-0 print:bg-white print:overflow-visible">
              {/* STYLES FOR PRINT ONLY */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #bast-print-sheet, #bast-print-sheet * {
                    visibility: visible;
                  }
                  #bast-print-sheet {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    max-width: 100% !important;
                    padding: 8mm 14mm !important;
                    margin: 0 !important;
                    font-family: 'Times New Roman', Times, serif !important;
                    font-size: 10.5pt !important;
                    line-height: 1.25 !important;
                    color: black !important;
                    background: white !important;
                    box-shadow: none !important;
                    border: none !important;
                  }
                  @page {
                    size: A4 portrait;
                    margin: 6mm 10mm;
                  }
                }
              `}</style>

              {/* A4 Sheet Container */}
              <div
                id="bast-print-sheet"
                className="max-w-[760px] mx-auto bg-white p-6 sm:p-10 shadow-lg print:shadow-none border border-slate-200/60 print:border-none text-black font-serif leading-tight select-text"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                {(() => {
                  const cleanDate = previewDoc.hariTanggalFormatted.includes(',')
                    ? previewDoc.hariTanggalFormatted.split(',')[1].trim()
                    : previewDoc.hariTanggalFormatted;
                  const cleanWaktu = previewDoc.waktuPenerimaan
                    ? previewDoc.waktuPenerimaan.replace(/^Jam\s*/i, '').trim()
                    : '…………… WIB';

                  return (
                    <div className="space-y-6">
                      {/* ========================================================= */}
                      {/* BAGIAN A: BERITA ACARA PENERIMAAN PAKET MAKANAN         */}
                      {/* ========================================================= */}
                      <div className="space-y-3">
                        {/* Header dengan Logo di Kiri & Judul Terpusat */}
                        <div className="relative flex items-center justify-center min-h-[58px]">
                          <div className="absolute left-0 top-0">
                            <img
                              src="/badan_gizi_logo.jpg"
                              alt="Logo Badan Gizi Nasional"
                              className="w-14 h-14 object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="text-center">
                            <h2 className="text-[13pt] font-bold underline uppercase tracking-wide leading-tight">
                              BERITA ACARA PENERIMAAN PAKET MAKANAN
                            </h2>
                            <h3 className="text-[12pt] font-bold underline uppercase tracking-wide leading-tight mt-0.5">
                              PROGRAM MAKAN BERGIZI
                            </h3>
                            <p className="text-[11pt] font-normal leading-tight mt-0.5">
                              Nomor: {previewDoc.nomorBast}
                            </p>
                          </div>
                        </div>

                        {/* Paragraf Narasi Bagian A */}
                        <p className="text-justify text-[10.5pt] leading-normal mt-2">
                          Pada Hari <strong className="font-bold">{previewDoc.hari}</strong> Tanggal{' '}
                          <strong className="font-bold">{cleanDate}</strong> Jam{' '}
                          <strong className="font-bold">{cleanWaktu}</strong> Telah Diterima Paket
                          Makanan Bergizi Gratis (MBG) Sejumlah :{' '}
                          <strong className="font-bold">{previewDoc.jumlahPaketMakanan}</strong> dalam
                          keadaan baik dan layak dikonsumsi dari {previewDoc.namaSppg}.
                        </p>

                        {/* Yang Menyerahkan (Atas) */}
                        <div className="space-y-0.5 text-[10.5pt] pt-1">
                          <div className="flex items-baseline">
                            <span className="w-44">Yang Menyerahkan</span>
                            <span>
                              : <strong className="font-bold">{previewDoc.namaTimDistribusi}</strong>
                            </span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-44">Nomor Telpon</span>
                            <span>
                              : <strong className="font-bold">{previewDoc.telponPetugasDistribusi || '085212581665'}</strong>
                            </span>
                          </div>
                          <div className="pt-10">
                            <span className="font-bold">
                              ({previewDoc.namaPetugasDistribusi || 'Abdus Salam' } )
                            </span>
                          </div>
                        </div>

                        {/* Grid Bagian Bawah: Kiri Diterima Lembaga, Kanan Kotak Mengetahui */}
                        <div className="grid grid-cols-12 gap-3 text-[10.5pt] items-start pt-1">
                          {/* Kiri: Diterima Oleh Lembaga */}
                          <div className="col-span-7 space-y-0.5">
                            <div className="flex items-baseline">
                              <span className="w-44 font-bold">Diterima Oleh Lembaga:</span>
                              <strong className="font-bold uppercase">{previewDoc.namaSekolah}</strong>
                            </div>
                            <div className="flex items-baseline">
                              <span className="w-44">PIC</span>
                              <span>: {previewDoc.namaPic || 'Lulut Biyadillah'}</span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="w-44">Nomor Telpon</span>
                              <span>: {previewDoc.telponPic || '085234834095'}</span>
                            </div>
                            <div className="pt-8">
                              <div className="font-bold">
                                ( {previewDoc.namaPic || 'Lulut Biyadillah'} )
                              </div>
                              <div className="w-56 border-b border-black mt-0.5"></div>
                            </div>
                          </div>

                          {/* Kanan: Kotak Mengetahui */}
                          <div className="col-span-5 border border-black p-2.5 rounded-none text-[10pt] min-h-[142px] flex flex-col justify-between">
                            <div>
                              <div>Mengetahui:</div>
                              {showDigitalSignature ? (
                                <div className="my-0.5 -ml-1">
                                  <SriRohayuSignature className="h-12 w-auto" />
                                </div>
                              ) : (
                                <div className="h-12"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold underline leading-tight">
                                {previewDoc.namaKepalaSppg || 'Sri Rohayu, S.Pd.'}
                              </div>
                              <div className="leading-tight text-[9.5pt]">
                                Kepala SPPG Probolinggo
                              </div>
                              <div className="leading-tight text-[9.5pt]">
                                Krejengan Temenggungan
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ========================================================= */}
                      {/* BAGIAN B: BERITA ACARA PENYERAHAN ALAT MAKAN             */}
                      {/* ========================================================= */}
                      <div className="space-y-3 pt-2">
                        {/* Header dengan Logo di Kiri & Judul Terpusat */}
                        <div className="relative flex items-center justify-center min-h-[58px]">
                          <div className="absolute left-0 top-0">
                            <img
                              src="/badan_gizi_logo.jpg"
                              alt="Logo Badan Gizi Nasional"
                              className="w-14 h-14 object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="text-center">
                            <h2 className="text-[13pt] font-bold underline uppercase tracking-wide leading-tight">
                              BERITA ACARA PENYERAHAN ALAT MAKAN
                            </h2>
                            <h3 className="text-[12pt] font-bold underline uppercase tracking-wide leading-tight mt-0.5">
                              PROGRAM MAKAN BERGIZI
                            </h3>
                            <p className="text-[11pt] font-normal leading-tight mt-0.5">
                              Nomor: {previewDoc.nomorBast}
                            </p>
                          </div>
                        </div>

                        {/* Paragraf Narasi Bagian B */}
                        <p className="text-justify text-[10.5pt] leading-normal mt-2">
                          Pada Hari <strong className="font-bold">{previewDoc.hari}</strong> Tanggal{' '}
                          <strong className="font-bold">{cleanDate}</strong> Jam{' '}
                          <strong className="font-bold">{cleanWaktu}</strong> Telah Diterima Kembali
                          Alat Makan Sejumlah :{' '}
                          <strong className="font-bold">
                            {previewDoc.jumlahAlatMakan || previewDoc.jumlahPaketMakanan}
                          </strong>{' '}
                          Paket Alat Makan Bergizi Dari {previewDoc.namaSppg}.
                        </p>

                        {/* Yang Menyerahkan (diisi oleh Lembaga) (Atas) */}
                        <div className="space-y-0.5 text-[10.5pt] pt-1">
                          <div className="flex items-baseline">
                            <span className="w-72 font-bold">
                              Yang Menyerahkan (diisi oleh Lembaga):
                            </span>
                            <strong className="font-bold uppercase">{previewDoc.namaSekolah}</strong>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-72">PIC</span>
                            <span>: {previewDoc.namaPic || 'Lulut Biyadillah'}</span>
                          </div>
                          <div className="flex items-baseline">
                            <span className="w-72">Nomor Telpon</span>
                            <span>: {previewDoc.telponPic || '085234834095'}</span>
                          </div>
                          <div className="pt-8">
                            <span className="font-bold">
                              ({previewDoc.namaPic || 'Lulut Biyadillah'})
                            </span>
                            <div className="w-56 border-b border-black mt-0.5"></div>
                          </div>
                        </div>

                        {/* Grid Bagian Bawah: Kiri Diterima Tim Distribusi, Kanan Kotak Mengetahui */}
                        <div className="grid grid-cols-12 gap-3 text-[10.5pt] items-start pt-1">
                          {/* Kiri: Diterima Oleh Tim Distribusi */}
                          <div className="col-span-7 space-y-0.5">
                            <div className="flex items-baseline">
                              <span className="w-36">Diterima Oleh</span>
                              <span>
                                : <strong className="font-bold">Tim Distribusi</strong>
                              </span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="w-36"></span>
                              <strong className="font-bold">
                                SPPG Hafshawaty 001 Genggong
                              </strong>
                            </div>
                            <div className="flex items-baseline">
                              <span className="w-36">Nomor Telpon</span>
                              <span>
                                : <strong className="font-bold">{previewDoc.telponPetugasDistribusi || '085212581665'}</strong>
                              </span>
                            </div>
                            <div className="pt-8">
                              <div className="font-bold">
                                ({previewDoc.namaPetugasDistribusi || 'Abdus Salam'})
                              </div>
                            </div>
                          </div>

                          {/* Kanan: Kotak Mengetahui */}
                          <div className="col-span-5 border border-black p-2.5 rounded-none text-[10pt] min-h-[142px] flex flex-col justify-between">
                            <div>
                              <div>Mengetahui:</div>
                              {showDigitalSignature ? (
                                <div className="my-0.5 -ml-1">
                                  <SriRohayuSignature className="h-12 w-auto" />
                                </div>
                              ) : (
                                <div className="h-12"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold underline leading-tight">
                                {previewDoc.namaKepalaSppg || 'Sri Rohayu, S.Pd.'}
                              </div>
                              <div className="leading-tight text-[9.5pt]">
                                Kepala SPPG Probolinggo
                              </div>
                              <div className="leading-tight text-[9.5pt]">
                                Krejengan Temenggungan
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer (Hidden on Print) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Status Dokumen:</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                  {previewDoc.status}
                </span>
                {!previewDoc.isDataLengkap && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800">
                    Perlu Melengkapi Data
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(previewDoc)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-all"
                >
                  Edit / Lengkapi PIC
                </button>
                <button
                  onClick={() => handleDownloadWord(previewDoc)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all"
                >
                  Unduh Word (.docx)
                </button>
                <button
                  onClick={() => handlePrintDocument(previewDoc)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all"
                >
                  Cetak / PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: EDIT / LENGKAPI DATA BAST & PIC SEKOLAH         */}
      {/* ========================================================= */}
      {(editDoc || isCreateModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editDoc ? 'Edit / Lengkapi Data BAST' : 'Buat Dokumen BAST Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Perubahan nama PIC dan telepon akan otomatis diperbarui pada profil sekolah
                </p>
              </div>
              <button
                onClick={() => {
                  setEditDoc(null);
                  setIsCreateModalOpen(false);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tanggal Distribusi
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal || ''}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Waktu Penerimaan
                  </label>
                  <input
                    type="text"
                    value={formData.waktuPenerimaan || ''}
                    placeholder="Contoh: Jam 07:30 WIB"
                    onChange={(e) =>
                      setFormData({ ...formData, waktuPenerimaan: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Nama Sekolah & Alamat */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Sekolah / Lembaga
                </label>
                <input
                  type="text"
                  value={formData.namaSekolah || ''}
                  placeholder="Contoh: TK ZAINUL HASAN"
                  onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              {/* Data PIC Sekolah */}
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
                <span className="text-xs font-bold text-emerald-900 block">
                  Data PIC Sekolah / Lembaga Penerima
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Nama PIC
                    </label>
                    <input
                      type="text"
                      value={formData.namaPic || ''}
                      placeholder="Contoh: Lulut Biyadillah"
                      onChange={(e) => setFormData({ ...formData, namaPic: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Nomor HP / WA PIC
                    </label>
                    <input
                      type="text"
                      value={formData.telponPic || ''}
                      placeholder="Contoh: 085234834095"
                      onChange={(e) => setFormData({ ...formData, telponPic: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-200 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Jumlah Paket Makanan & Alat Makan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Jumlah Paket Makanan
                  </label>
                  <input
                    type="number"
                    value={formData.jumlahPaketMakanan || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jumlahPaketMakanan: Number(e.target.value),
                        jumlahAlatMakan: Number(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Jumlah Paket Alat Makan
                  </label>
                  <input
                    type="number"
                    value={formData.jumlahAlatMakan || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, jumlahAlatMakan: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Petugas Distribusi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Petugas Distribusi
                  </label>
                  <input
                    type="text"
                    value={formData.namaPetugasDistribusi || ''}
                    placeholder="Contoh: Abdus Salam"
                    onChange={(e) =>
                      setFormData({ ...formData, namaPetugasDistribusi: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    No HP Petugas Distribusi
                  </label>
                  <input
                    type="text"
                    value={formData.telponPetugasDistribusi || ''}
                    placeholder="Contoh: 085212581665"
                    onChange={(e) =>
                      setFormData({ ...formData, telponPetugasDistribusi: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Status Dokumen */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Status Dokumen
                </label>
                <select
                  value={formData.status || 'SIAP_DICETAK'}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as BastStatus })
                  }
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SIAP_DICETAK">SIAP DICETAK</option>
                  <option value="FINAL">FINAL</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setEditDoc(null);
                  setIsCreateModalOpen(false);
                }}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all"
              >
                Simpan BAST
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
