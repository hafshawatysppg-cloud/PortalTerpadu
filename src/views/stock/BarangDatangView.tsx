import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PackagePlus,
  TableProperties,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Search,
  Filter,
  Eye,
  X,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowDownRight,
  Boxes,
  Wrench,
  UtensilsCrossed,
  UserCheck,
  RefreshCw,
  Plus,
  Pencil,
  FileDown,
  ExternalLink
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImg from '../../assets/images/badan_gizi_logo_1785799692960.jpg';
import { BarangDatang, JenisBarangDatang } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface BarangDatangViewProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

// Helper nama hari Indonesia
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

// Daftar saran nama barang umum
const SARAN_BAHAN_BAKU = [
  'Beras Premium Ramos',
  'Daging Ayam Broiler Segar',
  'Telur Ayam Ras Fresh',
  'Minyak Goreng Sawit',
  'Bawang Merah Brebes',
  'Bawang Putih Honan',
  'Cabai Merah Keriting',
  'Wortel Brastagi',
  'Kentang Dieng',
  'Tahu Putih Segar',
  'Tempe Daun Tradisional',
  'Ikan Kembung Segar',
  'Garam Beryodium',
  'Gula Pasir Kristal Putih'
];

const SARAN_OPERASIONAL = [
  'Gas LPG 12 Kg',
  'Plastik Wrap Roll Food Grade',
  'Sabun Cuci Piring Cair 5L',
  'Kantong Plastik Kresek Tebal',
  'Spons Cuci Piring Heavy Duty',
  'Kertas Minyak Pembungkus',
  'Sarung Tangan Plastik Higienis',
  'Masker Medis Dapur (Box)',
  'Hairnet Pelindung Rambut',
  'Disinfektan Cair Lantai 5L'
];

const DAFTAR_SATUAN = [
  'Kg',
  'Gram',
  'Liter',
  'Pcs',
  'Tabung',
  'Roll',
  'Dus',
  'Jerigen',
  'Ikat',
  'Tray',
  'Pack',
  'Karung',
  'Botol'
];

export const BarangDatangView: React.FC<BarangDatangViewProps> = ({ currentPath, onNavigate }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active sub-tab ('form' | 'data')
  const [activeTab, setActiveTab] = useState<'form' | 'data'>(() => {
    if (currentPath === '/barang-datang/data') return 'data';
    return 'form';
  });

  // Sync tab with route path
  useEffect(() => {
    if (currentPath === '/barang-datang/data') {
      setActiveTab('data');
    } else if (currentPath === '/barang-datang/form' || currentPath === '/barang-datang') {
      setActiveTab('form');
    }
  }, [currentPath]);

  const switchTab = (tab: 'form' | 'data') => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate(tab === 'form' ? '/barang-datang/form' : '/barang-datang/data');
    }
  };

  // State data barang datang
  const [items, setItems] = useState<BarangDatang[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Form State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [tanggalInput, setTanggalInput] = useState<string>(todayStr);
  const [namaBarang, setNamaBarang] = useState<string>('');
  const [jumlahMasuk, setJumlahMasuk] = useState<string>('');
  const [satuan, setSatuan] = useState<string>('Kg');
  const [customSatuan, setCustomSatuan] = useState<string>('');
  const [jenisBarang, setJenisBarang] = useState<JenisBarangDatang>('Bahan Baku');
  const [dokumentasiUrl, setDokumentasiUrl] = useState<string>('');
  const [keterangan, setKeterangan] = useState<string>('');
  const [petugas, setPetugas] = useState<string>(user?.nama || 'Petugas Logistik');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filters State for 'data' tab
  const [filterTanggal, setFilterTanggal] = useState<string>('');
  const [filterRentangMulai, setFilterRentangMulai] = useState<string>('');
  const [filterRentangSelesai, setFilterRentangSelesai] = useState<string>('');
  const [filterJenis, setFilterJenis] = useState<'Semua' | 'Bahan Baku' | 'Operasional'>('Semua');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal Detail & Foto
  const [previewItem, setPreviewItem] = useState<BarangDatang | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<BarangDatang | null>(null);
  const [editTanggal, setEditTanggal] = useState<string>('');
  const [editNamaBarang, setEditNamaBarang] = useState<string>('');
  const [editJumlahMasuk, setEditJumlahMasuk] = useState<string>('');
  const [editSatuan, setEditSatuan] = useState<string>('Kg');
  const [editCustomSatuan, setEditCustomSatuan] = useState<string>('');
  const [editJenisBarang, setEditJenisBarang] = useState<JenisBarangDatang>('Bahan Baku');
  const [editDokumentasiUrl, setEditDokumentasiUrl] = useState<string>('');
  const [editKeterangan, setEditKeterangan] = useState<string>('');
  const [editPetugas, setEditPetugas] = useState<string>('');
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal Print Preview & Cetak Resmi BGN
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Calculated info for input tanggal
  const dateInfo = useMemo(() => formatTanggalIndo(tanggalInput), [tanggalInput]);

  // Fetch Items from backend API
  const fetchItems = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/v1/barang-datang');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setItems(json.data);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data barang datang:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Update petugas saat user context termuat
  useEffect(() => {
    if (user?.nama) {
      setPetugas(user.nama);
    }
  }, [user]);

  // Auto clear toasts
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  // Handle Foto Upload (FileReader to base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorToast('Ukuran file foto maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const base64 = loadEvt.target?.result as string;
      setDokumentasiUrl(base64);
      setSuccessToast('Foto dokumentasi berhasil dimuat');
    };
    reader.onerror = () => {
      setErrorToast('Gagal membaca file gambar');
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaBarang.trim()) {
      setErrorToast('Nama barang wajib diisi');
      return;
    }

    const jmlNum = Number(jumlahMasuk);
    if (!jumlahMasuk || isNaN(jmlNum) || jmlNum <= 0) {
      setErrorToast('Jumlah masuk harus berupa angka lebih dari 0');
      return;
    }

    const effectiveSatuan = satuan === 'Lainnya' ? customSatuan.trim() : satuan;
    if (!effectiveSatuan) {
      setErrorToast('Satuan barang wajib ditentukan');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        hari: dateInfo.hari,
        tanggal: tanggalInput,
        hariTanggalFormatted: dateInfo.formatted,
        namaBarang: namaBarang.trim(),
        jumlahMasuk: jmlNum,
        satuan: effectiveSatuan,
        jenisBarang,
        dokumentasiUrl,
        keterangan: keterangan.trim(),
        petugas: petugas.trim() || 'Petugas Logistik'
      };

      const res = await fetch('/api/v1/barang-datang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type') || '';
      const json = contentType.includes('application/json') ? await res.json() : null;
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Gagal menyimpan barang datang');
      }

      setSuccessToast(`Berhasil menyimpan kedatangan ${jenisBarang}: ${namaBarang} (${jmlNum} ${effectiveSatuan})!`);

      // Reset Form (keep tanggal as today)
      setNamaBarang('');
      setJumlahMasuk('');
      setDokumentasiUrl('');
      setKeterangan('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Re-fetch data
      await fetchItems();
    } catch (err: any) {
      console.error(err);
      setErrorToast(err?.message || 'Terjadi kesalahan sistem saat menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Item
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/barang-datang/${id}`, {
        method: 'DELETE'
      });
      const contentType = res.headers.get('content-type') || '';
      const json = contentType.includes('application/json') ? await res.json() : null;
      if (res.ok && json?.success) {
        setItems(prev => prev.filter(item => item.id !== id));
        setSuccessToast('Data kedatangan barang berhasil dihapus');
        if (previewItem?.id === id) setPreviewItem(null);
      } else {
        setErrorToast(json?.message || 'Gagal menghapus data');
      }
    } catch (err) {
      setErrorToast('Gagal menghapus data');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: BarangDatang) => {
    setEditingItem(item);
    setEditTanggal(item.tanggal);
    setEditNamaBarang(item.namaBarang);
    setEditJumlahMasuk(String(item.jumlahMasuk));

    if (DAFTAR_SATUAN.includes(item.satuan)) {
      setEditSatuan(item.satuan);
      setEditCustomSatuan('');
    } else {
      setEditSatuan('Lainnya');
      setEditCustomSatuan(item.satuan);
    }

    setEditJenisBarang(item.jenisBarang);
    setEditDokumentasiUrl(item.dokumentasiUrl || '');
    setEditKeterangan(item.keterangan || '');
    setEditPetugas(item.petugas || user?.nama || 'Petugas Logistik');
    setEditModalOpen(true);
  };

  // Handle Edit File Upload
  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorToast('Ukuran foto terlalu besar. Maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setEditDokumentasiUrl(reader.result);
        setSuccessToast('Foto dokumentasi baru berhasil dipilih');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Edit Changes
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editNamaBarang.trim()) {
      setErrorToast('Nama barang wajib diisi!');
      return;
    }

    const jml = parseFloat(editJumlahMasuk);
    if (isNaN(jml) || jml <= 0) {
      setErrorToast('Jumlah masuk harus berupa angka lebih dari 0!');
      return;
    }

    const effectiveSatuan = editSatuan === 'Lainnya' ? (editCustomSatuan.trim() || 'Unit') : editSatuan;
    const editDateInfo = formatTanggalIndo(editTanggal);

    setEditSubmitting(true);
    try {
      const payload: Partial<BarangDatang> = {
        hari: editDateInfo.hari,
        tanggal: editTanggal,
        hariTanggalFormatted: editDateInfo.formatted,
        namaBarang: editNamaBarang.trim(),
        jumlahMasuk: jml,
        satuan: effectiveSatuan,
        jenisBarang: editJenisBarang,
        dokumentasiUrl: editDokumentasiUrl,
        keterangan: editKeterangan.trim(),
        petugas: editPetugas.trim() || 'Petugas Logistik'
      };

      const res = await fetch(`/api/v1/barang-datang/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type') || '';
      const json = contentType.includes('application/json') ? await res.json() : null;
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Gagal memperbarui data barang datang');
      }

      setItems(prev => prev.map(it => (it.id === editingItem.id ? { ...it, ...payload } : it)));
      if (previewItem?.id === editingItem.id) {
        setPreviewItem(prev => prev ? { ...prev, ...payload } : null);
      }

      setSuccessToast(`Data kedatangan "${editNamaBarang}" berhasil diperbarui!`);
      setEditModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error(err);
      setErrorToast(err?.message || 'Terjadi kesalahan saat menyimpan perubahan');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Helper untuk mengubah URL gambar ke Base64 (untuk jsPDF dan print rendering)
  const loadImageAsBase64 = async (url: string): Promise<string> => {
    if (!url) return '';
    if (url.startsWith('data:image/')) return url;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve('');
          }
        } catch {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = url;
    });
  };

  // Helper untuk mendapatkan judul jenis formulir
  const getJudulFormulir = () => {
    if (filterJenis === 'Operasional') return 'FORMULIR KEDATANGAN OPERASIONAL';
    if (filterJenis === 'Semua') return 'FORMULIR KEDATANGAN BAHAN BAKU & OPERASIONAL';
    return 'FORMULIR KEDATANGAN BAHAN BAKU';
  };

  const getLabelJenis = () => {
    if (filterJenis === 'Operasional') return 'OPERASIONAL';
    if (filterJenis === 'Semua') return 'BAHAN BAKU & OPERASIONAL';
    return 'BAHAN BAKU';
  };

  // Generator HTML Mandiri untuk Print Out Tab Baru (100% Anti-Gagal & Sesuai Format PDF)
  const generatePrintHtml = (itemsData: BarangDatang[], tanggalStr: string) => {
    const dateDetail = formatTanggalIndo(tanggalStr);
    const judul = getJudulFormulir();
    const labelJenis = getLabelJenis();
    const namaPJ = user?.nama || 'Qoidul Muttaqin';

    const rowsHtml = itemsData.map((item, idx) => {
      const fotoHtml = item.dokumentasiUrl ? `
        <div style="display:flex;justify-content:center;align-items:center;padding:4px;">
          <img src="${item.dokumentasiUrl}" alt="${item.namaBarang}" style="max-height:125px;max-width:145px;object-fit:contain;border:1px solid #cbd5e1;border-radius:4px;" />
        </div>
      ` : `<div style="color:#94a3b8;font-size:10px;text-align:center;">-</div>`;

      return `
        <tr style="page-break-inside:avoid;">
          <td style="border:1px solid #000;padding:6px 4px;text-align:center;font-size:11px;vertical-align:middle;">${idx + 1}</td>
          <td style="border:1px solid #000;padding:6px 8px;font-size:11px;font-weight:600;vertical-align:middle;">${item.namaBarang}</td>
          <td style="border:1px solid #000;padding:6px 6px;text-align:center;font-size:11px;font-weight:600;vertical-align:middle;">${Number(item.jumlahMasuk).toLocaleString('id-ID')}</td>
          <td style="border:1px solid #000;padding:6px 6px;text-align:center;font-size:11px;vertical-align:middle;">${item.satuan}</td>
          <td style="border:1px solid #000;padding:4px;text-align:center;vertical-align:middle;">${fotoHtml}</td>
          <td style="border:1px solid #000;padding:6px 8px;font-size:11px;vertical-align:middle;">${item.keterangan || ''}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>${judul} - ${dateDetail.hari}, ${dateDetail.formatted}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #000;
            background: #fff;
          }
          .header-container {
            position: relative;
            text-align: center;
            margin-bottom: 22px;
            min-height: 80px;
          }
          .logo-box {
            position: absolute;
            left: 0;
            top: 0;
            width: 76px;
            height: 76px;
          }
          .logo-box img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .header-titles {
            padding-left: 80px;
            padding-right: 80px;
          }
          .title-main {
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin: 0 0 3px 0;
            text-transform: uppercase;
          }
          .title-sub {
            font-size: 13px;
            font-weight: 800;
            margin: 0 0 3px 0;
            text-transform: uppercase;
          }
          .title-unit {
            font-size: 13px;
            font-weight: 800;
            margin: 0;
            text-transform: uppercase;
          }
          .meta-table {
            margin-bottom: 14px;
            font-size: 11px;
            font-weight: 600;
          }
          .meta-table td {
            padding: 2px 4px;
            vertical-align: middle;
          }
          .badge-jenis {
            background-color: #2B6CB0;
            color: #ffffff;
            padding: 3px 10px;
            display: inline-block;
            font-weight: 800;
            font-size: 11px;
            border-radius: 2px;
            letter-spacing: 0.5px;
          }
          .content-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin-bottom: 24px;
          }
          .content-table th {
            background-color: #2B6CB0 !important;
            color: #ffffff !important;
            border: 1px solid #000;
            padding: 7px 4px;
            font-size: 11px;
            font-weight: 800;
            text-align: center;
            vertical-align: middle;
            text-transform: uppercase;
          }
          .signature-section {
            page-break-inside: avoid;
            margin-top: 25px;
          }
          .signature-title {
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 20px;
          }
          .signature-grid {
            display: flex;
            justify-content: space-between;
            text-align: center;
            font-size: 11px;
            padding: 0 40px;
          }
          .signature-box {
            width: 220px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .signature-center {
            margin-top: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            font-size: 11px;
          }
          .signature-space {
            height: 55px;
            width: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .signature-name {
            font-weight: 800;
            margin-top: 4px;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="logo-box">
            <img src="${logoImg}" alt="Badan Gizi Nasional Logo" />
          </div>
          <div class="header-titles">
            <h1 class="title-main">${judul}</h1>
            <h2 class="title-sub">UNIT PELAYANAN GIZI NASIONAL</h2>
            <h3 class="title-unit">SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN 001</h3>
          </div>
        </div>

        <table class="meta-table">
          <tr>
            <td style="width: 150px;">TANGGAL</td>
            <td style="width: 15px;">:</td>
            <td>${dateDetail.hari}, ${dateDetail.formatted}</td>
          </tr>
          <tr>
            <td>PENANGGUNG JAWAB</td>
            <td>:</td>
            <td>${namaPJ}</td>
          </tr>
          <tr>
            <td>JENIS</td>
            <td>:</td>
            <td><span class="badge-jenis">${labelJenis}</span></td>
          </tr>
        </table>

        <table class="content-table">
          <thead>
            <tr>
              <th style="width: 35px;">NO</th>
              <th style="width: 200px;">NAMA BARANG</th>
              <th style="width: 80px;">JUMLAH<br/>MASUK</th>
              <th style="width: 70px;">SATUAN</th>
              <th style="width: 190px;">DOKUMENTASI</th>
              <th style="width: 85px;">KET</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-title">Mengetahui,</div>
          <div class="signature-grid">
            <div class="signature-box">
              <div>Kepala Lapangan</div>
              <div class="signature-space"></div>
              <div class="signature-name">${namaPJ}</div>
            </div>
            <div class="signature-box">
              <div>Penata Layanan Operasional<br/>Keuangan</div>
              <div class="signature-space"></div>
              <div class="signature-name">Muhammad Fadil, S. Akun</div>
            </div>
          </div>
          <div class="signature-center">
            <div>Kepala SPPG</div>
            <div class="signature-space">
              <svg width="80" height="40" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 35C25 15 35 45 45 20C55 5 60 40 75 25C85 15 90 30 95 20" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="signature-name">Sri Rohayu, S. Pd</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
  };

  // Fungsi Export PDF Resmi Sesuai Format Lampiran User (Portrait A4, Logo, Header Biru, Foto Dokumentasi, TTD 3 Pihak)
  const handleExportPDF = async () => {
    if (!filterTanggal) {
      setErrorToast('Silakan pilih tanggal pada filter tanggal terlebih dahulu untuk export PDF.');
      return;
    }
    if (filteredItems.length === 0) {
      setErrorToast(`Tidak ada data barang masuk pada tanggal ${filterTanggal} untuk diekspor.`);
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setSuccessToast('Sedang memproses dokumen PDF resmi & memuat foto dokumentasi...');

      const dateDetail = formatTanggalIndo(filterTanggal);
      const judul = getJudulFormulir();
      const labelJenis = getLabelJenis();
      const namaPJ = user?.nama || 'Qoidul Muttaqin';

      // Preload Logo BGN ke Base64
      const logoBase64 = await loadImageAsBase64(logoImg);

      // Preload seluruh foto dokumentasi barang masuk ke Base64
      const preloadedPhotos: Record<number, string> = {};
      for (let i = 0; i < filteredItems.length; i++) {
        const item = filteredItems[i];
        if (item.dokumentasiUrl) {
          const b64 = await loadImageAsBase64(item.dokumentasiUrl);
          if (b64) {
            preloadedPhotos[i] = b64;
          }
        }
      }

      // Inisialisasi Dokumen Portrait A4 (210mm x 297mm)
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // 1. Gambar Logo BGN di kiri atas (jika ada)
      if (logoBase64) {
        doc.addImage(logoBase64, 'JPEG', 14, 10, 22, 22);
      }

      // 2. Judul Formulir di Tengah (Center Aligned)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text(judul, pageWidth / 2, 16, { align: 'center' });

      doc.setFontSize(11);
      doc.text('UNIT PELAYANAN GIZI NASIONAL', pageWidth / 2, 22, { align: 'center' });

      doc.setFontSize(11.5);
      doc.text('SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN 001', pageWidth / 2, 28, { align: 'center' });

      // 3. Metadata Tanggal, Penanggung Jawab, Jenis (Kiri)
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);

      // Baris Tanggal
      doc.text('TANGGAL', 14, 38);
      doc.text(':', 56, 38);
      doc.setFont('helvetica', 'normal');
      doc.text(`${dateDetail.hari}, ${dateDetail.formatted}`, 60, 38);

      // Baris Penanggung Jawab
      doc.setFont('helvetica', 'bold');
      doc.text('PENANGGUNG JAWAB', 14, 44);
      doc.text(':', 56, 44);
      doc.setFont('helvetica', 'normal');
      doc.text(namaPJ, 60, 44);

      // Baris Jenis
      doc.setFont('helvetica', 'bold');
      doc.text('JENIS', 14, 50);
      doc.text(':', 56, 50);

      // Kotak Badge Biru untuk Jenis
      doc.setFillColor(43, 108, 176); // #2B6CB0
      doc.roundedRect(60, 46.5, 48, 5.5, 0.5, 0.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(labelJenis, 84, 50.5, { align: 'center' });

      // 4. Tabel Data Barang Masuk
      const tableHead = [['NO', 'NAMA BARANG', 'JUMLAH\nMASUK', 'SATUAN', 'DOKUMENTASI', 'KET']];
      const tableBody = filteredItems.map((item, idx) => [
        String(idx + 1),
        item.namaBarang,
        Number(item.jumlahMasuk).toLocaleString('id-ID'),
        item.satuan,
        '', // Diisi oleh hook didDrawCell jika ada foto
        item.keterangan || ''
      ]);

      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 55,
        theme: 'plain',
        headStyles: {
          fillColor: [43, 108, 176], // Biru BGN persis PDF
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'center',
          valign: 'middle',
          lineColor: [0, 0, 0],
          lineWidth: 0.2
        },
        styles: {
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          fontSize: 8.5,
          textColor: [0, 0, 0],
          valign: 'middle'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left', cellWidth: 50, fontStyle: 'bold' },
          2: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
          3: { halign: 'center', cellWidth: 18 },
          4: { halign: 'center', cellWidth: 56, minCellHeight: 34 },
          5: { halign: 'left', cellWidth: 26 }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            const rowIndex = data.row.index;
            const photoB64 = preloadedPhotos[rowIndex];
            if (photoB64) {
              try {
                const imgW = 46;
                const imgH = 30;
                const posX = data.cell.x + (data.cell.width - imgW) / 2;
                const posY = data.cell.y + (data.cell.height - imgH) / 2;
                doc.addImage(photoB64, 'JPEG', posX, posY, imgW, imgH);
              } catch (e) {
                console.warn('Gagal menyematkan foto ke sel PDF:', e);
              }
            } else {
              doc.setFontSize(8);
              doc.setTextColor(148, 163, 184);
              doc.text('-', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: 'center' });
            }
          }
        }
      });

      // 5. Bagian Tanda Tangan (Mengetahui)
      const lastY = (doc as any).lastAutoTable?.finalY || 180;
      const pageHeight = doc.internal.pageSize.getHeight();

      // Jika sisa halaman tidak cukup untuk tanda tangan (butuh ~50mm), tambahkan halaman baru
      if (lastY + 52 > pageHeight) {
        doc.addPage();
        drawSignatures(doc, 20, namaPJ);
      } else {
        drawSignatures(doc, lastY + 8, namaPJ);
      }

      doc.save(`Formulir_Kedatangan_Barang_${filterTanggal}.pdf`);
      setSuccessToast(`PDF Formulir Kedatangan Barang tanggal ${filterTanggal} berhasil diunduh!`);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setErrorToast('Gagal membuat dokumen PDF: ' + (err?.message || 'Error tidak diketahui'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Helper untuk menggambar tanda tangan 3 pihak di PDF
  const drawSignatures = (doc: jsPDF, startY: number, namaPJ: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);

    doc.text('Mengetahui,', 105, startY, { align: 'center' });

    // Baris 1: Kepala Lapangan (Kiri) & Penata Layanan Operasional Keuangan (Kanan)
    const yRow1 = startY + 8;
    doc.text('Kepala Lapangan', 50, yRow1, { align: 'center' });
    doc.text('Penata Layanan Operasional', 160, yRow1, { align: 'center' });
    doc.text('Keuangan', 160, yRow1 + 4, { align: 'center' });

    // Nama Pejabat Baris 1
    const yName1 = yRow1 + 22;
    doc.setFont('helvetica', 'bold');
    doc.text(namaPJ, 50, yName1, { align: 'center' });
    doc.text('Muhammad Fadil, S. Akun', 160, yName1, { align: 'center' });

    // Baris 2: Kepala SPPG (Tengah Bawah)
    const yRow2 = yName1 + 8;
    doc.setFont('helvetica', 'normal');
    doc.text('Kepala SPPG', 105, yRow2, { align: 'center' });

    // Visual tanda tangan garis lengkung elegan
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.lines([[8, -6], [5, 10], [6, -8], [7, 6], [10, -4]], 90, yRow2 + 8, [1, 1]);

    const yName2 = yRow2 + 18;
    doc.setFont('helvetica', 'bold');
    doc.text('Sri Rohayu, S. Pd', 105, yName2, { align: 'center' });
  };

  // Handler Buka Lembar Cetak di Tab Baru (Metode 100% Anti-Gagal Tanpa Hambatan Iframe)
  const handleOpenPrintTab = () => {
    if (!filterTanggal) {
      setErrorToast('Silakan pilih tanggal pada filter tanggal terlebih dahulu.');
      return;
    }
    if (filteredItems.length === 0) {
      setErrorToast(`Tidak ada data barang masuk pada tanggal ${filterTanggal} untuk dicetak.`);
      return;
    }
    try {
      const html = generatePrintHtml(filteredItems, filterTanggal);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const newWin = window.open(blobUrl, '_blank');
      if (!newWin) {
        setIsPrintModalOpen(true);
        setErrorToast('Jendela pop-up cetak terhalang browser. Silakan cetak melalui jendela Pratinjau.');
      } else {
        setSuccessToast('Lembar cetak dibuka di tab baru! Dialog print otomatis akan muncul.');
      }
    } catch (e: any) {
      console.error(e);
      setIsPrintModalOpen(true);
    }
  };

  // Handler Tombol Cetak Rekap: Membuka Modal Pratinjau Cetak Resmi BGN
  const handlePrintRekap = () => {
    if (!filterTanggal) {
      setErrorToast('Silakan pilih tanggal pada filter tanggal terlebih dahulu untuk Cetak Rekap.');
      return;
    }
    if (filteredItems.length === 0) {
      setErrorToast(`Tidak ada data barang masuk pada tanggal ${filterTanggal} untuk dicetak.`);
      return;
    }
    // Langsung buka modal pratinjau cetak agar user melihat dokumen dan bisa mencetak seketika
    setIsPrintModalOpen(true);
  };

  // Handler Print langsung dari dalam modal
  const handleTriggerPrintFromModal = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Direct window.print failed, opening print tab:', e);
      handleOpenPrintTab();
    }
  };

  // Filtered Items for 'data' tab
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Single date filter
      if (filterTanggal && item.tanggal !== filterTanggal) {
        return false;
      }
      // Range filter
      if (filterRentangMulai && item.tanggal < filterRentangMulai) {
        return false;
      }
      if (filterRentangSelesai && item.tanggal > filterRentangSelesai) {
        return false;
      }
      // Jenis barang filter
      if (filterJenis !== 'Semua' && item.jenisBarang !== filterJenis) {
        return false;
      }
      // Search text filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = item.namaBarang?.toLowerCase().includes(q);
        const matchesKet = item.keterangan?.toLowerCase().includes(q);
        const matchesPetugas = item.petugas?.toLowerCase().includes(q);
        const matchesSatuan = item.satuan?.toLowerCase().includes(q);
        if (!matchesName && !matchesKet && !matchesPetugas && !matchesSatuan) {
          return false;
        }
      }
      return true;
    });
  }, [items, filterTanggal, filterRentangMulai, filterRentangSelesai, filterJenis, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const totalSemua = items.length;
    const countBahanBaku = items.filter(i => i.jenisBarang === 'Bahan Baku').length;
    const countOperasional = items.filter(i => i.jenisBarang === 'Operasional').length;
    const totalHariIni = items.filter(i => i.tanggal === todayStr).length;
    return { totalSemua, countBahanBaku, countOperasional, totalHariIni };
  }, [items, todayStr]);

  return (
    <div id="barang-datang-container" className="space-y-6">
      {/* Tampilan Layar Web (Disembunyikan saat aksi Cetak Print Out) */}
      <div className="print:hidden space-y-6">
        {/* Toast Notifikasi */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="ml-2 hover:opacity-80 text-emerald-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-rose-600 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-rose-500 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="ml-2 hover:opacity-80 text-rose-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Modul Kedatangan Barang */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
              <PackagePlus className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Input Kedatangan Barang
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Logistik & Penerimaan
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Pencatatan resmi barang masuk dengan klasifikasi <strong className="text-amber-600 dark:text-amber-400">Bahan Baku</strong> dan <strong className="text-sky-600 dark:text-sky-400">Operasional</strong>, dilengkapi dokumentasi visual dan filter tanggal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={fetchItems}
              disabled={refreshing}
              title="Refresh data"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs transition"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
              <span className="hidden sm:inline">Sinkronkan</span>
            </button>
          </div>
        </div>

        {/* 2 Sub Menu Navigation Tabs Sesuai Instruksi User */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="tab-btn-form"
              onClick={() => switchTab('form')}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm ${
                activeTab === 'form'
                  ? 'bg-sky-600 text-white shadow-sky-600/25 ring-2 ring-sky-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <PackagePlus className="w-4 h-4" />
              <span>1. Form Input Barang</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'form'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                Input Baru
              </span>
            </button>

            <button
              id="tab-btn-data"
              onClick={() => switchTab('data')}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm ${
                activeTab === 'data'
                  ? 'bg-sky-600 text-white shadow-sky-600/25 ring-2 ring-sky-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <TableProperties className="w-4 h-4" />
              <span>2. Data Barang Masuk</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'data'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}>
                {items.length} Data
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB MENU 1: FORM INPUT BARANG */}
      {/* ========================================================================= */}
      {activeTab === 'form' && (
        <div id="sub-menu-form-input" className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Kolom Kiri: Form Utama */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      Formulir Input Kedatangan Barang
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Lengkapi data fisik barang dan dokumentasi foto tanda terima penerimaan.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => switchTab('data')}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <span>Lihat Riwayat Data</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. HARI & TANGGAL */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      Hari & Tanggal Penerimaan <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2.5 py-0.5 rounded-full">
                      {dateInfo.hari}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <input
                        id="input-tanggal"
                        type="date"
                        value={tanggalInput}
                        onChange={(e) => setTanggalInput(e.target.value)}
                        required
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{dateInfo.formatted}</span>
                    </div>
                  </div>
                </div>

                {/* 2. JENIS BARANG (2 PILIHAN TEGAS: BAHAN BAKU & OPERASIONAL) */}
                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Jenis Barang <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Opsi 1: Bahan Baku */}
                    <div
                      id="opt-bahan-baku"
                      onClick={() => setJenisBarang('Bahan Baku')}
                      className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex items-start gap-3.5 ${
                        jenisBarang === 'Bahan Baku'
                          ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20 shadow-md shadow-amber-500/10'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        jenisBarang === 'Bahan Baku'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-slate-900 dark:text-white">Bahan Baku</span>
                          {jenisBarang === 'Bahan Baku' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Bahan mentah makanan & bumbu dapur (Beras, Daging, Sayur, Telur, dll).
                        </p>
                      </div>
                    </div>

                    {/* Opsi 2: Operasional */}
                    <div
                      id="opt-operasional"
                      onClick={() => setJenisBarang('Operasional')}
                      className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex items-start gap-3.5 ${
                        jenisBarang === 'Operasional'
                          ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/20 shadow-md shadow-sky-500/10'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        jenisBarang === 'Operasional'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-slate-900 dark:text-white">Operasional</span>
                          {jenisBarang === 'Operasional' && (
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Kebutuhan non-konsumsi, peralatan & sanitasi (Gas LPG, Plastik, Sabun, dll).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. NAMA BARANG */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      Nama Barang <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Pilih rekomendasi atau ketik baru</span>
                  </div>

                  <input
                    id="input-nama-barang"
                    type="text"
                    value={namaBarang}
                    onChange={(e) => setNamaBarang(e.target.value)}
                    placeholder={
                      jenisBarang === 'Bahan Baku'
                        ? 'Contoh: Beras Premium Ramos, Daging Ayam, Sayur Kol...'
                        : 'Contoh: Gas LPG 12 Kg, Sabun Cuci Piring 5L, Plastik Wrap...'
                    }
                    list="barang-suggestions"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                  />
                  <datalist id="barang-suggestions">
                    {(jenisBarang === 'Bahan Baku' ? SARAN_BAHAN_BAKU : SARAN_OPERASIONAL).map((s, idx) => (
                      <option key={idx} value={s} />
                    ))}
                  </datalist>

                  {/* Quick Chips Rekomendasi */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Rekomendasi Cepat:</span>
                    {(jenisBarang === 'Bahan Baku' ? SARAN_BAHAN_BAKU.slice(0, 5) : SARAN_OPERASIONAL.slice(0, 5)).map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNamaBarang(s)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-300 border border-slate-200 dark:border-slate-700 transition"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. JUMLAH MASUK & SATUAN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Jumlah Masuk */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Jumlah Masuk <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="input-jumlah-masuk"
                      type="number"
                      step="any"
                      min="0.01"
                      value={jumlahMasuk}
                      onChange={(e) => setJumlahMasuk(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-base font-black text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  {/* Satuan */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-2">
                      Satuan Barang <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="select-satuan"
                      value={satuan}
                      onChange={(e) => setSatuan(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition"
                    >
                      {DAFTAR_SATUAN.map((sat) => (
                        <option key={sat} value={sat}>{sat}</option>
                      ))}
                      <option value="Lainnya">+ Satuan Lainnya...</option>
                    </select>

                    {satuan === 'Lainnya' && (
                      <input
                        type="text"
                        value={customSatuan}
                        onChange={(e) => setCustomSatuan(e.target.value)}
                        placeholder="Ketik nama satuan khusus..."
                        className="mt-2 w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* 5. DOKUMENTASI BARANG MASUK */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      Dokumentasi Barang Masuk
                    </label>
                    <span className="text-[11px] text-slate-400">Foto bukti fisik penerimaan barang</span>
                  </div>

                  {/* Area Upload & Dropzone */}
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload-input"
                    />

                    {dokumentasiUrl ? (
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden max-h-64 bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          <img
                            src={dokumentasiUrl}
                            alt="Dokumentasi Barang Masuk"
                            className="w-full h-auto max-h-64 object-contain"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => {
                                setDokumentasiUrl('');
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="p-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-600/50 rounded-md transition"
                              title="Hapus foto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-4 h-4" /> Foto dokumentasi siap dilampirkan
                          </span>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="font-bold text-sky-600 dark:text-sky-400 hover:underline"
                          >
                            Ganti Foto
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 shadow-inner">
                          <Camera className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                          Ambil Foto dari Kamera atau Pilih File
                        </p>
                        <p className="text-xs text-slate-400 max-w-xs mb-4">
                          Dukung foto format JPG, PNG, WebP (maksimal ukuran 5MB).
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Unggah Foto Dokumentasi</span>
                          </button>
                        </div>

                        {/* Opsi Input URL Foto alternatif */}
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/60 w-full max-w-md">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Atau tempel tautan/URL foto:
                          </label>
                          <input
                            type="url"
                            value={dokumentasiUrl}
                            onChange={(e) => setDokumentasiUrl(e.target.value)}
                            placeholder="https://example.com/foto-barang.jpg"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* KETERANGAN & PETUGAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      Petugas Penerima
                    </label>
                    <input
                      type="text"
                      value={petugas}
                      onChange={(e) => setPetugas(e.target.value)}
                      placeholder="Nama petugas logistik"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                      Keterangan / Kondisi Barang
                    </label>
                    <input
                      type="text"
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      placeholder="Contoh: Kemasan utuh, segar, segel aman..."
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                {/* TOMBOL SIMPAN */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    * Pastikan data jumlah dan foto dokumentasi telah sesuai sebelum disimpan.
                  </span>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Simpan Kedatangan Barang</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Kolom Kanan: Rekap & Preview Cepat */}
          <div className="space-y-6">
            {/* Live Preview Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Pratinjau Data yang Sedang Diinput
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wide ${
                    jenisBarang === 'Bahan Baku'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                  }`}>
                    {jenisBarang}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {dateInfo.hari}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {namaBarang || 'Nama Barang Belum Diisi'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dateInfo.formatted}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {jumlahMasuk || '0'}
                  </span>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    {satuan === 'Lainnya' ? (customSatuan || 'Satuan') : satuan}
                  </span>
                </div>

                {dokumentasiUrl ? (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-32 bg-slate-900 flex items-center justify-center">
                    <img src={dokumentasiUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>Belum ada foto dokumentasi</span>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 pt-1">
                  Petugas: <strong className="text-slate-700 dark:text-slate-300">{petugas || '-'}</strong>
                </div>
              </div>

              <div className="mt-5 p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/60">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    i
                  </div>
                  <p className="text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
                    Setiap barang yang masuk melalui formulir ini akan tersimpan di cloud database secara realtime dan langsung tampil pada sub menu <strong>Data Barang Masuk</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Statistik Penerimaan */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Ringkasan Database Penerimaan
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block">Bahan Baku</span>
                  <span className="text-xl font-black text-amber-800 dark:text-amber-200">{stats.countBahanBaku} Item</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60">
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase block">Operasional</span>
                  <span className="text-xl font-black text-sky-800 dark:text-sky-200">{stats.countOperasional} Item</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span>Penerimaan Hari Ini:</span>
                <span className="font-bold text-slate-900 dark:text-white">{stats.totalHariIni} Item</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB MENU 2: DATA BARANG MASUK (DENGAN FILTER TANGGAL) */}
      {/* ========================================================================= */}
      {activeTab === 'data' && (
        <div id="sub-menu-data-masuk" className="space-y-6 animate-in fade-in duration-300">
          {/* Filter & Control Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TableProperties className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  Data Barang Masuk
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan seluruh data kedatangan barang yang diinput dari formulir dengan fitur filter tanggal.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Tombol Export PDF (di sebelah kiri Cetak Rekap) */}
                <button
                  type="button"
                  onClick={Boolean(filterTanggal) ? handleExportPDF : () => setErrorToast('Silakan pilih tanggal pada filter tanggal terlebih dahulu untuk Export PDF.')}
                  disabled={!filterTanggal || isGeneratingPdf}
                  title={filterTanggal ? `Export PDF Rekap Tanggal ${filterTanggal}` : 'Pilih tanggal pada filter tanggal terlebih dahulu'}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    filterTanggal && !isGeneratingPdf
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isGeneratingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Export PDF'}</span>
                </button>

                {/* Tombol Cetak Rekap */}
                <button
                  type="button"
                  onClick={Boolean(filterTanggal) ? handlePrintRekap : () => setErrorToast('Silakan pilih tanggal pada filter tanggal terlebih dahulu untuk Cetak Rekap.')}
                  disabled={!filterTanggal}
                  title={filterTanggal ? `Pratinjau & Cetak Formulir Kedatangan Tanggal ${filterTanggal}` : 'Pilih tanggal pada filter tanggal terlebih dahulu'}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    filterTanggal
                      ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 active:scale-95 cursor-pointer'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Rekap</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchTab('form')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Input Barang Baru</span>
                </button>
              </div>
            </div>

            {/* Filter Section: Filter Tanggal Utama & Kriteria Tambahan */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Filter Tanggal Spesifik */}
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Filter Tanggal Tertentu
                </label>
                <div className="relative">
                  <input
                    id="filter-tanggal-input"
                    type="date"
                    value={filterTanggal}
                    onChange={(e) => {
                      setFilterTanggal(e.target.value);
                      if (e.target.value) {
                        setFilterRentangMulai('');
                        setFilterRentangSelesai('');
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {filterTanggal && (
                    <button
                      type="button"
                      onClick={() => setFilterTanggal('')}
                      className="absolute right-8 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Reset tanggal"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Jenis Barang */}
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Filter Jenis Barang
                </label>
                <select
                  value={filterJenis}
                  onChange={(e) => setFilterJenis(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Semua">Semua Jenis (Bahan Baku & Operasional)</option>
                  <option value="Bahan Baku">Hanya Bahan Baku</option>
                  <option value="Operasional">Hanya Operasional</option>
                </select>
              </div>

              {/* Pencarian Nama Barang */}
              <div className="lg:col-span-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1.5 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Cari Nama Barang / Petugas
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ketik nama barang, satuan, atau petugas..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-2">
              <span className="text-[11px] font-bold text-slate-400">Pintasan Tanggal:</span>
              <button
                type="button"
                onClick={() => {
                  setFilterTanggal(todayStr);
                  setFilterRentangMulai('');
                  setFilterRentangSelesai('');
                }}
                className={`text-[11px] font-bold px-3 py-1 rounded-lg transition ${
                  filterTanggal === todayStr
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Hari Ini
              </button>

              <button
                type="button"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setFilterTanggal(yesterday.toISOString().split('T')[0]);
                  setFilterRentangMulai('');
                  setFilterRentangSelesai('');
                }}
                className="text-[11px] font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Kemarin
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterTanggal('');
                  setFilterRentangMulai('');
                  setFilterRentangSelesai('');
                  setFilterJenis('Semua');
                  setSearchTerm('');
                }}
                className="text-[11px] font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
              >
                Tampilkan Semua Tanggal
              </button>

              {/* Status Hasil */}
              <div className="ml-auto text-xs font-semibold text-slate-500">
                Menampilkan <strong className="text-slate-900 dark:text-white">{filteredItems.length}</strong> dari {items.length} transaksi
              </div>
            </div>
          </div>

          {/* Tabel Data Barang Masuk */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider">
                  <tr>
                    <th className="py-4 px-4 w-12 text-center">No</th>
                    <th className="py-4 px-4">Hari & Tanggal</th>
                    <th className="py-4 px-4">Nama Barang</th>
                    <th className="py-4 px-4">Jenis Barang</th>
                    <th className="py-4 px-4 text-right">Jumlah Masuk</th>
                    <th className="py-4 px-4 text-center">Dokumentasi</th>
                    <th className="py-4 px-4">Petugas</th>
                    <th className="py-4 px-4 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
                          <span>Memuat database kedatangan barang...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-1">
                            <TableProperties className="w-6 h-6" />
                          </div>
                          <span className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                            Tidak Ada Data Barang Masuk
                          </span>
                          <span className="text-xs text-slate-400 leading-relaxed">
                            {filterTanggal
                              ? `Tidak ada catatan kedatangan barang pada tanggal ${filterTanggal}. Silakan ubah filter tanggal atau masukkan data baru.`
                              : 'Belum ada data barang masuk yang tersimpan. Silakan gunakan Form Input Barang.'}
                          </span>
                          <button
                            onClick={() => switchTab('form')}
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Buka Form Input Barang</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => {
                      const itemDate = formatTanggalIndo(item.tanggal);
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          {/* No */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                            {index + 1}
                          </td>

                          {/* Hari & Tanggal */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 dark:text-white">
                                {item.hari || itemDate.hari}, {item.tanggal}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {item.hariTanggalFormatted || itemDate.formatted}
                              </span>
                            </div>
                          </td>

                          {/* Nama Barang & Keterangan */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-black text-sm text-slate-900 dark:text-white">
                                {item.namaBarang}
                              </span>
                              {item.keterangan && (
                                <span className="text-[11px] text-slate-400 line-clamp-1 italic">
                                  {item.keterangan}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Jenis Barang: Bahan Baku / Operasional */}
                          <td className="py-3.5 px-4">
                            {item.jenisBarang === 'Bahan Baku' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                                <UtensilsCrossed className="w-3 h-3 text-amber-600" />
                                Bahan Baku
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80">
                                <Wrench className="w-3 h-3 text-sky-600" />
                                Operasional
                              </span>
                            )}
                          </td>

                          {/* Jumlah Masuk & Satuan */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-baseline gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                              <span className="font-black text-sm text-slate-900 dark:text-white">
                                {Number(item.jumlahMasuk).toLocaleString('id-ID')}
                              </span>
                              <span className="font-bold text-[11px] text-slate-500 dark:text-slate-400">
                                {item.satuan}
                              </span>
                            </div>
                          </td>

                          {/* Dokumentasi Barang Masuk */}
                          <td className="py-3.5 px-4 text-center">
                            {item.dokumentasiUrl ? (
                              <button
                                type="button"
                                onClick={() => setPreviewItem(item)}
                                className="group relative inline-block w-11 h-11 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition"
                                title="Klik untuk memperbesar foto dokumentasi"
                              >
                                <img
                                  src={item.dokumentasiUrl}
                                  alt="Dokumentasi"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <Eye className="w-4 h-4" />
                                </div>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Tanpa Foto
                              </span>
                            )}
                          </td>

                          {/* Petugas */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium text-[11px]">{item.petugas || '-'}</span>
                            </div>
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => setPreviewItem(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950 transition cursor-pointer"
                                title="Lihat detail transaksi"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit Data Barang Masuk (Poin 3) */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition cursor-pointer"
                                title="Edit catatan barang masuk"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition cursor-pointer"
                                title="Hapus catatan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Rekap Singkat */}
            {filteredItems.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-4 flex-wrap">
                  <span>
                    Bahan Baku: <strong className="text-amber-600">{filteredItems.filter(i => i.jenisBarang === 'Bahan Baku').length} Item</strong>
                  </span>
                  <span>
                    Operasional: <strong className="text-sky-600">{filteredItems.filter(i => i.jenisBarang === 'Operasional').length} Item</strong>
                  </span>
                  {!filterTanggal && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                      💡 Pilih tanggal di atas untuk mengaktifkan cetak & export
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Tombol Export PDF (disebelah kiri Cetak Rekap) */}
                  <button
                    type="button"
                    onClick={Boolean(filterTanggal) ? handleExportPDF : () => setErrorToast('Silakan pilih tanggal pada filter tanggal terlebih dahulu untuk Export PDF.')}
                    disabled={!filterTanggal || isGeneratingPdf}
                    title={filterTanggal ? `Export PDF Rekap Tanggal ${filterTanggal}` : 'Pilih tanggal pada filter tanggal terlebih dahulu'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                      filterTanggal && !isGeneratingPdf
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 active:scale-95 cursor-pointer'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {isGeneratingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                    <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Export PDF'}</span>
                  </button>

                  {/* Tombol Cetak Rekap (aktif ketika sudah memilih tanggal) */}
                  <button
                    type="button"
                    onClick={Boolean(filterTanggal) ? handlePrintRekap : () => setErrorToast('Silakan pilih tanggal pada filter tanggal terlebih dahulu untuk Cetak Rekap.')}
                    disabled={!filterTanggal}
                    title={filterTanggal ? `Pratinjau & Cetak Formulir Kedatangan Tanggal ${filterTanggal}` : 'Pilih tanggal pada filter tanggal terlebih dahulu'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                      filterTanggal
                        ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 active:scale-95 cursor-pointer'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Rekap</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PREVIEW DETAIL & DOKUMENTASI FOTO */}
      {/* ========================================================================= */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center font-bold">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Detail Kedatangan Barang
                  </h3>
                  <span className="text-[11px] text-slate-400">ID: {previewItem.id}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Foto Dokumentasi */}
              {previewItem.dokumentasiUrl ? (
                <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <img
                    src={previewItem.dokumentasiUrl}
                    alt="Dokumentasi Barang Masuk"
                    className="w-full h-auto max-h-80 object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
                  Tidak ada foto dokumentasi fisik yang dilampirkan.
                </div>
              )}

              {/* Rincian Info */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Hari & Tanggal</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {previewItem.hari}, {previewItem.tanggal}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Jenis Barang</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-black mt-0.5 ${
                    previewItem.jenisBarang === 'Bahan Baku'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                  }`}>
                    {previewItem.jenisBarang}
                  </span>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Barang</span>
                  <span className="font-black text-base text-slate-900 dark:text-white">
                    {previewItem.namaBarang}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Jumlah Masuk</span>
                  <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                    {previewItem.jumlahMasuk} {previewItem.satuan}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Petugas Penerima</span>
                  <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                    {previewItem.petugas || '-'}
                  </span>
                </div>

                {previewItem.keterangan && (
                  <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Keterangan / Kondisi</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                      {previewItem.keterangan}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Hapus Catatan Barang Masuk?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tindakan ini tidak dapat dibatalkan. Catatan dan foto dokumentasi akan dihapus dari sistem.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white shadow-md shadow-rose-600/20"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT DATA KEDATANGAN BARANG (PERMINTAAN USER: TOMBOL EDIT) */}
      {/* ========================================================================= */}
      {editModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Edit Data Barang Masuk
                  </h3>
                  <span className="text-[11px] text-slate-400">ID: {editingItem.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Hari & Tanggal */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Hari & Tanggal Masuk
                </label>
                <input
                  type="date"
                  value={editTanggal}
                  onChange={e => setEditTanggal(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Hari terpilih: <strong>{formatTanggalIndo(editTanggal).hari}, {formatTanggalIndo(editTanggal).formatted}</strong>
                </p>
              </div>

              {/* Jenis Barang (Bahan Baku vs Operasional) */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Jenis Barang
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditJenisBarang('Bahan Baku')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                      editJenisBarang === 'Bahan Baku'
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <UtensilsCrossed className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Bahan Baku</div>
                      <div className="text-[10px] text-slate-500">Pangan & masakan</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditJenisBarang('Operasional')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                      editJenisBarang === 'Operasional'
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-sky-600 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Operasional</div>
                      <div className="text-[10px] text-slate-500">Alat, kemasan & sabun</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Nama Barang */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  value={editNamaBarang}
                  onChange={e => setEditNamaBarang(e.target.value)}
                  placeholder="Contoh: Beras Premium, Minyak Goreng, Sabun Cuci"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Jumlah Masuk & Satuan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Jumlah Masuk
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editJumlahMasuk}
                    onChange={e => setEditJumlahMasuk(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Satuan
                  </label>
                  <select
                    value={editSatuan}
                    onChange={e => setEditSatuan(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {DAFTAR_SATUAN.map(sat => (
                      <option key={sat} value={sat}>{sat}</option>
                    ))}
                    <option value="Lainnya">Lainnya...</option>
                  </select>
                </div>
              </div>

              {editSatuan === 'Lainnya' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tuliskan Satuan Kustom
                  </label>
                  <input
                    type="text"
                    value={editCustomSatuan}
                    onChange={e => setEditCustomSatuan(e.target.value)}
                    placeholder="Contoh: Galon, Jerigen, Sak"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>
              )}

              {/* Dokumentasi Foto */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Dokumentasi Barang Masuk
                </label>

                {editDokumentasiUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 max-h-48 flex items-center justify-center">
                      <img
                        src={editDokumentasiUrl}
                        alt="Preview Foto"
                        className="max-h-48 w-auto object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setEditDokumentasiUrl('')}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow"
                        title="Hapus foto ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Ganti Foto Dokumentasi</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-2xl p-4 text-center cursor-pointer transition bg-slate-50 dark:bg-slate-800/40"
                  >
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Klik untuk mengunggah foto dokumentasi baru
                    </p>
                    <p className="text-[10px] text-slate-400">PNG, JPG, WEBP (Maks 5MB)</p>
                  </div>
                )}

                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditFileUpload}
                  className="hidden"
                />
              </div>

              {/* Keterangan / Kondisi */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Keterangan / Kondisi Barang (Opsional)
                </label>
                <textarea
                  value={editKeterangan}
                  onChange={e => setEditKeterangan(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Kemasan baik, segel utuh, barang baru datang"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Petugas Penerima */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Petugas Penerima
                </label>
                <input
                  type="text"
                  value={editPetugas}
                  onChange={e => setEditPetugas(e.target.value)}
                  placeholder="Nama petugas"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 active:scale-95 transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {editSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL PRATINJAU CETAK RESMI BGN & PEMECAH MASALAH PRINT SANDBOX */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0">
          {/* Modal Header & Actions Floating Toolbar */}
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handleTriggerPrintFromModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition cursor-pointer"
              title="Kirim ke Printer atau Simpan PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print)</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPrintTab}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition cursor-pointer"
              title="Buka lembar cetak di tab baru browser (100% bebas hambatan sandbox iframe)"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka di Tab Baru</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition cursor-pointer disabled:opacity-60"
            >
              {isGeneratingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(false)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-lg transition cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Kontainer Lembar A4 Portrait Pratinjau */}
          <div className="w-full max-w-4xl my-8 bg-white text-slate-950 p-8 sm:p-12 rounded-2xl shadow-2xl font-sans print:m-0 print:p-0 print:w-full print:max-w-none print:shadow-none print:rounded-none">
            {/* Header Instansi Resmi */}
            <div className="relative text-center mb-6 min-h-[85px]">
              <div className="absolute left-0 top-0 w-20 h-20">
                <img src={logoImg} alt="Badan Gizi Nasional Logo" className="w-full h-full object-contain" />
              </div>
              <div className="px-20 space-y-1">
                <h1 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-900">
                  {getJudulFormulir()}
                </h1>
                <h2 className="text-sm sm:text-base font-extrabold uppercase text-slate-800">
                  UNIT PELAYANAN GIZI NASIONAL
                </h2>
                <h3 className="text-xs sm:text-sm font-extrabold uppercase text-slate-700">
                  SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN 001
                </h3>
              </div>
            </div>

            {/* Metadata Dokumen */}
            <div className="mb-4 text-xs font-semibold text-slate-800 space-y-1">
              <div className="flex items-center">
                <span className="w-44 font-bold">TANGGAL</span>
                <span className="w-4">:</span>
                <span className="font-medium">{formatTanggalIndo(filterTanggal).hari}, {formatTanggalIndo(filterTanggal).formatted}</span>
              </div>
              <div className="flex items-center">
                <span className="w-44 font-bold">PENANGGUNG JAWAB</span>
                <span className="w-4">:</span>
                <span className="font-medium">{user?.nama || 'Qoidul Muttaqin'}</span>
              </div>
              <div className="flex items-center pt-0.5">
                <span className="w-44 font-bold">JENIS</span>
                <span className="w-4">:</span>
                <span className="bg-[#2B6CB0] text-white px-3 py-0.5 font-extrabold text-[11px] rounded-xs tracking-wide">
                  {getLabelJenis()}
                </span>
              </div>
            </div>

            {/* Tabel Data Barang Sesuai Format PDF Screenshot */}
            <table className="w-full border-collapse border border-slate-950 text-xs mb-8">
              <thead>
                <tr className="bg-[#2B6CB0] text-white">
                  <th className="border border-slate-950 py-2 px-1 text-center w-10 font-bold uppercase">NO</th>
                  <th className="border border-slate-950 py-2 px-2 text-left font-bold uppercase">NAMA BARANG</th>
                  <th className="border border-slate-950 py-2 px-1 text-center w-24 font-bold uppercase leading-tight">
                    JUMLAH<br />MASUK
                  </th>
                  <th className="border border-slate-950 py-2 px-1 text-center w-20 font-bold uppercase">SATUAN</th>
                  <th className="border border-slate-950 py-2 px-2 text-center w-48 font-bold uppercase">DOKUMENTASI</th>
                  <th className="border border-slate-950 py-2 px-2 text-left w-24 font-bold uppercase">KET</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-950">
                    <td className="border border-slate-950 py-2 px-1 text-center align-middle font-medium">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-950 py-2 px-2 align-middle font-bold text-slate-900">
                      {item.namaBarang}
                    </td>
                    <td className="border border-slate-950 py-2 px-1 text-center align-middle font-bold">
                      {Number(item.jumlahMasuk).toLocaleString('id-ID')}
                    </td>
                    <td className="border border-slate-950 py-2 px-1 text-center align-middle font-medium">
                      {item.satuan}
                    </td>
                    <td className="border border-slate-950 p-2 align-middle text-center">
                      {item.dokumentasiUrl ? (
                        <div className="flex justify-center items-center">
                          <img
                            src={item.dokumentasiUrl}
                            alt={item.namaBarang}
                            className="max-h-28 max-w-36 object-contain rounded border border-slate-300 shadow-xs"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>
                    <td className="border border-slate-950 py-2 px-2 align-middle text-slate-700 text-[11px]">
                      {item.keterangan || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bagian Tanda Tangan Mengetahui (3 Pihak Persis Screenshot PDF) */}
            <div className="pt-2 text-xs">
              <div className="text-center font-semibold mb-6">Mengetahui,</div>
              <div className="flex justify-between px-10 text-center">
                <div className="w-56 flex flex-col items-center">
                  <div className="font-semibold text-slate-800">Kepala Lapangan</div>
                  <div className="h-16 flex items-center justify-center"></div>
                  <div className="font-extrabold text-slate-900">{user?.nama || 'Qoidul Muttaqin'}</div>
                </div>

                <div className="w-56 flex flex-col items-center">
                  <div className="font-semibold text-slate-800 leading-tight">
                    Penata Layanan Operasional<br />Keuangan
                  </div>
                  <div className="h-16 flex items-center justify-center"></div>
                  <div className="font-extrabold text-slate-900">Muhammad Fadil, S. Akun</div>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center text-center">
                <div className="font-semibold text-slate-800">Kepala SPPG</div>
                <div className="h-14 flex items-center justify-center">
                  <svg width="80" height="35" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 35C25 15 35 45 45 20C55 5 60 40 75 25C85 15 90 30 95 20" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="font-extrabold text-slate-900">Sri Rohayu, S. Pd</div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ========================================================================= */}
      {/* KONTEN CETAK RESMI FORMAT A4 (DIBACA SAAT BROWSER PRINT / CTRL+P) */}
      {/* ========================================================================= */}
      <div className="hidden print:block text-slate-900 bg-white p-6 font-sans">
        {/* Kop Formulir Resmi BGN */}
        <div className="relative text-center mb-6 min-h-[80px]">
          <div className="absolute left-0 top-0 w-20 h-20">
            <img src={logoImg} alt="Logo BGN" className="w-full h-full object-contain" />
          </div>
          <div className="px-20 space-y-1">
            <h1 className="text-base font-black uppercase tracking-wide">
              {getJudulFormulir()}
            </h1>
            <h2 className="text-sm font-extrabold uppercase">
              UNIT PELAYANAN GIZI NASIONAL
            </h2>
            <h3 className="text-xs font-extrabold uppercase">
              SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN 001
            </h3>
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-4 text-xs font-semibold text-slate-800 space-y-1">
          <div className="flex items-center">
            <span className="w-40 font-bold">TANGGAL</span>
            <span className="w-4">:</span>
            <span>{filterTanggal ? `${formatTanggalIndo(filterTanggal).hari}, ${formatTanggalIndo(filterTanggal).formatted}` : '-'}</span>
          </div>
          <div className="flex items-center">
            <span className="w-40 font-bold">PENANGGUNG JAWAB</span>
            <span className="w-4">:</span>
            <span>{user?.nama || 'Qoidul Muttaqin'}</span>
          </div>
          <div className="flex items-center pt-0.5">
            <span className="w-40 font-bold">JENIS</span>
            <span className="w-4">:</span>
            <span className="bg-[#2B6CB0] text-white px-3 py-0.5 font-bold text-[11px]">
              {getLabelJenis()}
            </span>
          </div>
        </div>

        {/* Tabel Cetak */}
        <table className="w-full border-collapse border border-slate-950 text-xs mb-8">
          <thead>
            <tr className="bg-[#2B6CB0] text-white">
              <th className="border border-slate-950 py-2 px-1 text-center w-10 font-bold uppercase">NO</th>
              <th className="border border-slate-950 py-2 px-2 text-left font-bold uppercase">NAMA BARANG</th>
              <th className="border border-slate-950 py-2 px-1 text-center w-24 font-bold uppercase leading-tight">
                JUMLAH<br />MASUK
              </th>
              <th className="border border-slate-950 py-2 px-1 text-center w-20 font-bold uppercase">SATUAN</th>
              <th className="border border-slate-950 py-2 px-2 text-center w-48 font-bold uppercase">DOKUMENTASI</th>
              <th className="border border-slate-950 py-2 px-2 text-left w-24 font-bold uppercase">KET</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, idx) => (
              <tr key={item.id} className="border-b border-slate-950">
                <td className="border border-slate-950 py-2 px-1 text-center align-middle font-medium">
                  {idx + 1}
                </td>
                <td className="border border-slate-950 py-2 px-2 align-middle font-bold">
                  {item.namaBarang}
                </td>
                <td className="border border-slate-950 py-2 px-1 text-center align-middle font-bold">
                  {Number(item.jumlahMasuk).toLocaleString('id-ID')}
                </td>
                <td className="border border-slate-950 py-2 px-1 text-center align-middle">
                  {item.satuan}
                </td>
                <td className="border border-slate-950 p-2 align-middle text-center">
                  {item.dokumentasiUrl ? (
                    <div className="flex justify-center items-center">
                      <img
                        src={item.dokumentasiUrl}
                        alt={item.namaBarang}
                        className="max-h-28 max-w-36 object-contain border border-slate-300"
                      />
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px]">-</span>
                  )}
                </td>
                <td className="border border-slate-950 py-2 px-2 align-middle text-[11px]">
                  {item.keterangan || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Kolom Tanda Tangan Mengetahui */}
        <div className="pt-2 text-xs">
          <div className="text-center font-semibold mb-6">Mengetahui,</div>
          <div className="flex justify-between px-10 text-center">
            <div className="w-56 flex flex-col items-center">
              <div className="font-semibold text-slate-800">Kepala Lapangan</div>
              <div className="h-16"></div>
              <div className="font-extrabold text-slate-900">{user?.nama || 'Qoidul Muttaqin'}</div>
            </div>

            <div className="w-56 flex flex-col items-center">
              <div className="font-semibold text-slate-800 leading-tight">
                Penata Layanan Operasional<br />Keuangan
              </div>
              <div className="h-16"></div>
              <div className="font-extrabold text-slate-900">Muhammad Fadil, S. Akun</div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center text-center">
            <div className="font-semibold text-slate-800">Kepala SPPG</div>
            <div className="h-14 flex items-center justify-center">
              <svg width="80" height="35" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 35C25 15 35 45 45 20C55 5 60 40 75 25C85 15 90 30 95 20" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="font-extrabold text-slate-900">Sri Rohayu, S. Pd</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarangDatangView;
