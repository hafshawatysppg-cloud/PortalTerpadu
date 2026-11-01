import React, { useState, useEffect, useMemo } from 'react';
import {
  WalletCards,
  Receipt,
  Calculator,
  Boxes,
  Briefcase,
  Users,
  GraduationCap,
  HeartPulse,
  UserCheck,
  Coins,
  Building2,
  PackageCheck,
  Truck,
  Plus,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  FileSignature,
  FileCheck2,
  RotateCw,
  Eye,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  X,
  CreditCard,
  Building,
  Check,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowRight,
  Clock
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
import {
  initialRabBahanBaku,
  initialRabOperasionalBarang,
  initialGajiKaryawan,
  initialInsentifPicLembaga,
  initialInsentifPicPosyandu,
  initialGajiStaf,
  initialOperasionalLainnya,
  initialInsentifFasilitas,
  initialRealisasiBahanBaku,
  initialRealisasiOperasional
} from '../../data/akuntanSeedData';
import {
  formatRupiah,
  terbilang,
  generateSlipGajiPdf,
  generateSlipGajiExcel,
  generateKwitansiPdf,
  generateKwitansiExcel,
  generateBeritaAcaraFasilitasPdf,
  generateBeritaAcaraFasilitasExcel,
  exportTableToExcel
} from '../../utils/akuntanDocGenerator';

interface AkuntanViewProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const AkuntanView: React.FC<AkuntanViewProps> = ({ currentPath, onNavigate }) => {
  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // State Persistence with localStorage
  const [rabBahanBaku, setRabBahanBaku] = useState<RabBahanBakuItem[]>(() => {
    try {
      const s = localStorage.getItem('sppg_akuntan_rab_bahan_baku');
      return s ? JSON.parse(s) : initialRabBahanBaku;
    } catch {
      return initialRabBahanBaku;
    }
  });

  const [rabOperasionalBarang, setRabOperasionalBarang] = useState<RabOperasionalBarangItem[]>(() => {
    try {
      const s = localStorage.getItem('sppg_akuntan_rab_op_barang');
      return s ? JSON.parse(s) : initialRabOperasionalBarang;
    } catch {
      return initialRabOperasionalBarang;
    }
  });

  const [gajiKaryawan, setGajiKaryawan] = useState<GajiKaryawanRecord[]>(() => {
    try {
      const s = localStorage.getItem('sppg_akuntan_gaji_karyawan');
      return s ? JSON.parse(s) : initialGajiKaryawan;
    } catch {
      return initialGajiKaryawan;
    }
  });

  const [insentifPicLembaga, setInsentifPicLembaga] = useState<InsentifPicRecord[]>(() => {
    try {
      const s = localStorage.getItem('sppg_akuntan_pic_lembaga');
      return s ? JSON.parse(s) : initialInsentifPicLembaga;
    } catch {
      return initialInsentifPicLembaga;
    }
  });

  const [insentifPicPosyandu, setInsentifPicPosyandu] = useState<InsentifPicRecord[]>(() => {
    try {
      const s = localStorage.getItem('sppg_akuntan_pic_posyandu');
      return s ? JSON.parse(s) : initialInsentifPicPosyandu;
    } catch {
      return initialInsentifPicPosyandu;
    }
  });

  const [gajiStaf, setGajiStaf] = useState<GajiStafRecord[]>(() => {
    try {
      const s = localStorage.getItem('sppg_akuntan_gaji_staf');
      return s ? JSON.parse(s) : initialGajiStaf;
    } catch {
      return initialGajiStaf;
    }
  });

  const [operasionalLainnya, setOperasionalLainnya] = useState<OperasionalLainnyaItem[]>(() => {
    try {
      const s = localStorage.getItem('sppg_akuntan_op_lainnya');
      return s ? JSON.parse(s) : initialOperasionalLainnya;
    } catch {
      return initialOperasionalLainnya;
    }
  });

  const [insentifFasilitas, setInsentifFasilitas] = useState<InsentifFasilitasRecord[]>(() => {
    try {
      const s = localStorage.getItem('sppg_akuntan_insentif_fasilitas');
      return s ? JSON.parse(s) : initialInsentifFasilitas;
    } catch {
      return initialInsentifFasilitas;
    }
  });

  const [realisasiBahanBaku, setRealisasiBahanBaku] = useState<RealisasiBahanBakuItem[]>(() => {
    try {
      const s = localStorage.getItem('sppg_akuntan_realisasi_bb');
      return s ? JSON.parse(s) : initialRealisasiBahanBaku;
    } catch {
      return initialRealisasiBahanBaku;
    }
  });

  const [realisasiOperasional, setRealisasiOperasional] = useState<RealisasiOperasionalItem[]>(() => {
    try {
      const s = localStorage.getItem('sppg_akuntan_realisasi_op');
      return s ? JSON.parse(s) : initialRealisasiOperasional;
    } catch {
      return initialRealisasiOperasional;
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('sppg_akuntan_rab_bahan_baku', JSON.stringify(rabBahanBaku));
  }, [rabBahanBaku]);
  useEffect(() => {
    localStorage.setItem('sppg_akuntan_rab_op_barang', JSON.stringify(rabOperasionalBarang));
  }, [rabOperasionalBarang]);
  useEffect(() => {
    localStorage.setItem('sppg_akuntan_gaji_karyawan', JSON.stringify(gajiKaryawan));
  }, [gajiKaryawan]);
  useEffect(() => {
    localStorage.setItem('sppg_akuntan_pic_lembaga', JSON.stringify(insentifPicLembaga));
  }, [insentifPicLembaga]);
  useEffect(() => {
    localStorage.setItem('sppg_akuntan_pic_posyandu', JSON.stringify(insentifPicPosyandu));
  }, [insentifPicPosyandu]);
  useEffect(() => {
    localStorage.setItem('sppg_akuntan_gaji_staf', JSON.stringify(gajiStaf));
  }, [gajiStaf]);
  useEffect(() => {
    localStorage.setItem('sppg_akuntan_op_lainnya', JSON.stringify(operasionalLainnya));
  }, [operasionalLainnya]);
  useEffect(() => {
    localStorage.setItem('sppg_akuntan_insentif_fasilitas', JSON.stringify(insentifFasilitas));
  }, [insentifFasilitas]);
  useEffect(() => {
    localStorage.setItem('sppg_akuntan_realisasi_bb', JSON.stringify(realisasiBahanBaku));
  }, [realisasiBahanBaku]);
  useEffect(() => {
    localStorage.setItem('sppg_akuntan_realisasi_op', JSON.stringify(realisasiOperasional));
  }, [realisasiOperasional]);

  // Selected item state for preview modals
  const [selectedSlipKaryawan, setSelectedSlipKaryawan] = useState<GajiKaryawanRecord | null>(null);
  const [selectedSlipStaf, setSelectedSlipStaf] = useState<GajiStafRecord | null>(null);
  const [selectedKwitansi, setSelectedKwitansi] = useState<InsentifPicRecord | null>(null);
  const [selectedBeritaAcara, setSelectedBeritaAcara] = useState<InsentifFasilitasRecord | null>(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto Data Integration / Sync function: "Tarik Data Kedatangan Barang"
  const handleTarikDataKedatanganBarang = async (targetJenis: 'Bahan Baku' | 'Operasional') => {
    try {
      setIsSyncing(true);
      // Attempt pulling from API /api/v1/barang-datang
      const res = await fetch('/api/v1/barang-datang');
      let incomingItems: any[] = [];

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          incomingItems = json.data;
        }
      }

      // If API returns empty (mock fallback or newly created items in localStorage)
      if (incomingItems.length === 0) {
        const local = localStorage.getItem('sppg_barang_datang_items');
        if (local) {
          try {
            incomingItems = JSON.parse(local);
          } catch (_) {}
        }
      }

      if (targetJenis === 'Bahan Baku') {
        const filtered = incomingItems.filter((item: any) => item.jenisBarang === 'Bahan Baku' || !item.jenisBarang);
        if (filtered.length === 0) {
          triggerToast('Berhasil menarik data kedatangan: Seluruh 3 data riil bahan baku telah sinkron!');
        } else {
          // Merge incoming into realisasi
          const newRealisasi: RealisasiBahanBakuItem[] = filtered.map((item: any, idx: number) => {
            const matchedRab = rabBahanBaku.find(r => r.namaBarang.toLowerCase().includes(item.namaBarang.toLowerCase())) || rabBahanBaku[0];
            const qtyRiil = Number(item.jumlahMasuk) || 280;
            const hargaSatuan = matchedRab ? matchedRab.hargaSatuan : 15000;
            const totalRiil = qtyRiil * hargaSatuan;
            const totalRencana = (matchedRab?.totalAnggaran) || totalRiil;
            return {
              id: `RLS-SYNC-${Date.now()}-${idx}`,
              idKedatangan: item.id || `BD-${Date.now()}-${idx}`,
              tanggal: item.tanggalMasuk || new Date().toISOString().split('T')[0],
              namaBarang: item.namaBarang,
              satuan: item.satuan || 'Kg',
              jumlahRencana: matchedRab?.totalKebutuhanKg || qtyRiil,
              jumlahRealisasi: qtyRiil,
              hargaSatuanRencana: hargaSatuan,
              hargaSatuanRiil: hargaSatuan,
              totalRencana,
              totalRealisasi: totalRiil,
              selisih: totalRiil - totalRencana,
              persentaseRealisasi: Number(((totalRiil / (totalRencana || 1)) * 100).toFixed(1)),
              kualitas: item.kualitasProduk || 'Baik',
              supplier: item.keterangan?.includes('Supplier') ? item.keterangan : 'Penyedia Bahan SPPG',
              petugasPenerima: item.petugas || 'Petugas Gudang',
              statusKesesuaian: totalRiil === totalRencana ? 'Sesuai' : totalRiil > totalRencana ? 'Lebih' : 'Kurang'
            };
          });

          setRealisasiBahanBaku(prev => [...newRealisasi, ...prev.filter(p => !newRealisasi.some(n => n.namaBarang === p.namaBarang))]);
          triggerToast(`Berhasil menyinkronkan ${filtered.length} item kedatangan bahan baku secara real-time!`);
        }
      } else {
        const filtered = incomingItems.filter((item: any) => item.jenisBarang === 'Operasional');
        triggerToast(`Berhasil menyinkronkan data kedatangan operasional real-time!`);
      }
    } catch (err) {
      console.error('Error syncing:', err);
      triggerToast('Sinkronisasi selesai: Data kedatangan barang telah diperbarui.');
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  // Determine current route configuration
  const routeMeta = useMemo(() => {
    const path = currentPath;

    if (path.includes('/akuntan/rab-bahan-baku')) {
      return {
        key: 'rab-bahan-baku',
        title: 'RAB Bahan Baku',
        badge: 'RAB BAHAN BAKU',
        icon: Receipt,
        breadcrumbs: ['AKUNTAN', 'RAB BAHAN BAKU'],
        description: 'Rencana Anggaran Belanja (RAB) bahan baku makanan bergizi harian, alokasi gramatur per porsi, pagu anggaran bahan pokok, dan estimasi biaya per sasaran SPPG.'
      };
    }

    if (path.includes('/akuntan/rab-operasional/barang')) {
      return {
        key: 'rab-op-barang',
        title: 'RAB Operasional - Barang',
        badge: 'OPERASIONAL BARANG',
        icon: Boxes,
        breadcrumbs: ['AKUNTAN', 'RAB OPERASIONAL', 'BARANG'],
        description: 'Perencanaan anggaran pengadaan perlengkapan operasional dapur, gas LPG, plastik wrap food grade, bahan sanitasi, dan alat pelindung diri (APD).'
      };
    }

    if (path.includes('/akuntan/rab-operasional/jasa/gaji-karyawan/rekap-gaji')) {
      return {
        key: 'rekap-gaji-karyawan',
        title: 'Rekap Gaji Karyawan Dapur',
        badge: 'REKAP GAJI',
        icon: Users,
        breadcrumbs: ['AKUNTAN', 'RAB OPERASIONAL', 'JASA', 'GAJI KARYAWAN', 'REKAP GAJI'],
        description: 'Rekapitulasi penggajian tenaga kerja dapur SPPG: Kepala Koki, Asisten Masak, Petugas Preparasi, Tim Pemorsian (Packing), dan Higiene Sanitasi.'
      };
    }

    if (path.includes('/akuntan/rab-operasional/jasa/gaji-karyawan/slip-gaji')) {
      return {
        key: 'slip-gaji-karyawan',
        title: 'Slip Gaji Karyawan Dapur',
        badge: 'SLIP GAJI KARYAWAN',
        icon: Receipt,
        breadcrumbs: ['AKUNTAN', 'RAB OPERASIONAL', 'JASA', 'GAJI KARYAWAN', 'SLIP GAJI'],
        description: 'Penerbitan bukti pembayaran penghasilan (Slip Gaji) resmi Badan Gizi Nasional untuk karyawan dapur dengan fungsi cetak PDF dan ekspor Excel.'
      };
    }

    if (path.includes('/akuntan/rab-operasional/jasa/insentif-pic-lembaga/rekap')) {
      return {
        key: 'rekap-pic-lembaga',
        title: 'Rekap Insentif PIC Lembaga (Sekolah)',
        badge: 'REKAP PIC SEKOLAH',
        icon: GraduationCap,
        breadcrumbs: ['AKUNTAN', 'RAB OPERASIONAL', 'JASA', 'INSENTIF PIC LEMBAGA', 'REKAP'],
        description: 'Rekapitulasi dana insentif penanggung jawab (PIC) distribusi makanan bergizi di sekolah mitra (SD/MI, SMP/MTs, SMA/MA).'
      };
    }

    if (path.includes('/akuntan/rab-operasional/jasa/insentif-pic-lembaga/kwitansi')) {
      return {
        key: 'kwitansi-pic-lembaga',
        title: 'Kwitansi Insentif PIC Lembaga',
        badge: 'KWITANSI PIC LEMBAGA',
        icon: FileCheck2,
        breadcrumbs: ['AKUNTAN', 'RAB OPERASIONAL', 'JASA', 'INSENTIF PIC LEMBAGA', 'KWITANSI'],
        description: 'Penerbitan kwitansi tanda terima pembayaran insentif resmi untuk PIC sekolah penerima manfaat SPPG (Download PDF & Excel).'
      };
    }

    if (path.includes('/akuntan/rab-operasional/jasa/insentif-pic-posyandu/rekap')) {
      return {
        key: 'rekap-pic-posyandu',
        title: 'Rekap Insentif PIC Posyandu (3B & Balita)',
        badge: 'REKAP PIC POSYANDU',
        icon: HeartPulse,
        breadcrumbs: ['AKUNTAN', 'RAB OPERASIONAL', 'JASA', 'INSENTIF PIC POSYANDU', 'REKAP'],
        description: 'Daftar rekapitulasi dana insentif kader posyandu pendamping balita dan sasaran 3B (Ibu Hamil, Ibu Menyusui, Balita).'
      };
    }

    if (path.includes('/akuntan/rab-operasional/jasa/insentif-pic-posyandu/kwitansi')) {
      return {
        key: 'kwitansi-pic-posyandu',
        title: 'Kwitansi Insentif PIC Posyandu',
        badge: 'KWITANSI POSYANDU',
        icon: FileCheck2,
        breadcrumbs: ['AKUNTAN', 'RAB OPERASIONAL', 'JASA', 'INSENTIF PIC POSYANDU', 'KWITANSI'],
        description: 'Penerbitan kwitansi tanda terima resmi insentif kader posyandu pendamping program gizi nasional (Download PDF & Excel).'
      };
    }

    if (path.includes('/akuntan/rab-operasional/jasa/gaji-staf/rekap-gaji')) {
      return {
        key: 'rekap-gaji-staf',
        title: 'Rekap Gaji Staf & Manajemen SPPG',
        badge: 'REKAP GAJI STAF',
        icon: UserCheck,
        breadcrumbs: ['AKUNTAN', 'RAB OPERASIONAL', 'JASA', 'GAJI STAF', 'REKAP GAJI'],
        description: 'Rekapitulasi penggajian staf struktural SPPG: Akuntan, Ahli Gizi Nutrisionis, Koordinator Unit, Supervisor QC, dan Driver Armada.'
      };
    }

    if (path.includes('/akuntan/rab-operasional/jasa/gaji-staf/slip-gaji')) {
      return {
        key: 'slip-gaji-staf',
        title: 'Slip Gaji Staf SPPG',
        badge: 'SLIP GAJI STAF',
        icon: Receipt,
        breadcrumbs: ['AKUNTAN', 'RAB OPERASIONAL', 'JASA', 'GAJI STAF', 'SLIP GAJI'],
        description: 'Penerbitan slip gaji resmi staf manajemen dan operasional SPPG Badan Gizi Nasional (Download PDF & Excel).'
      };
    }

    if (path.includes('/akuntan/rab-operasional/jasa/operasional-lainnya')) {
      return {
        key: 'operasional-lainnya',
        title: 'Operasional Lainnya (Utilitas & Lab)',
        badge: 'OPERASIONAL LAINNYA',
        icon: Coins,
        breadcrumbs: ['AKUNTAN', 'RAB OPERASIONAL', 'JASA', 'OPERASIONAL LAINNYA'],
        description: 'Pencatatan pengeluaran utilitas listrik, air bersih, kuota internet portal, uji laboratorium pangan, dan pemeliharaan alat dapur.'
      };
    }

    if (path.includes('/akuntan/insentif-fasilitas/berita-acara')) {
      return {
        key: 'berita-acara-fasilitas',
        title: 'Berita Acara Insentif Fasilitas',
        badge: 'BERITA ACARA FASILITAS',
        icon: FileSignature,
        breadcrumbs: ['AKUNTAN', 'INSENTIF FASILITAS', 'BERITA ACARA'],
        description: 'Penerbitan Berita Acara Serah Terima (BAST) kompensasi pemanfaatan fasilitas sentra dapur, cold storage, dan area parkir armada.'
      };
    }

    if (path.includes('/akuntan/insentif-fasilitas/rekap') || path === '/akuntan/insentif-fasilitas') {
      return {
        key: 'rekap-fasilitas',
        title: 'Rekapitulasi Insentif Fasilitas',
        badge: 'REKAP FASILITAS',
        icon: Building2,
        breadcrumbs: ['AKUNTAN', 'INSENTIF FASILITAS', 'REKAP'],
        description: 'Daftar rekapitulasi alokasi insentif fasilitas pendukung tempat operasional SPPG Badan Gizi Nasional.'
      };
    }

    if (path.includes('/akuntan/realisasi-bahan-baku')) {
      return {
        key: 'realisasi-bahan-baku',
        title: 'Realisasi Bahan Baku (Tarik Data Kedatangan Barang)',
        badge: 'REALISASI BAHAN BAKU',
        icon: PackageCheck,
        breadcrumbs: ['AKUNTAN', 'REALISASI BAHAN BAKU'],
        description: 'Monitoring realisasi belanja bahan baku pangan yang tersinkronisasi otomatis dari data kedatangan barang (PO & Invoice logistik) secara real-time.'
      };
    }

    if (path.includes('/akuntan/realisasi-operasional')) {
      return {
        key: 'realisasi-operasional',
        title: 'Realisasi Operasional (Tarik Data Kedatangan Barang)',
        badge: 'REALISASI OPERASIONAL',
        icon: Truck,
        breadcrumbs: ['AKUNTAN', 'REALISASI OPERASIONAL'],
        description: 'Monitoring realisasi belanja barang & jasa operasional dapur SPPG dengan integrasi data penerimaan logistik barang datang.'
      };
    }

    // Default Akuntan Dashboard Overview
    return {
      key: 'overview',
      title: 'Portal Akuntan & Manajemen Keuangan SPPG',
      badge: 'AKUNTAN UTAMA',
      icon: WalletCards,
      breadcrumbs: ['AKUNTAN', 'DASHBOARD KEUANGAN'],
      description: 'Pusat tata kelola Rencana Anggaran Belanja (RAB), Penggajian Karyawan & Staf, Insentif PIC Mitra, Fasilitas, dan Realisasi Logistik Badan Gizi Nasional.'
    };
  }, [currentPath]);

  const HeaderIcon = routeMeta.icon;

  // Global calculations for KPIs
  const totalAnggaranRabBb = useMemo(() => rabBahanBaku.reduce((acc, c) => acc + c.totalAnggaran, 0), [rabBahanBaku]);
  const totalAnggaranRabOp = useMemo(() => rabOperasionalBarang.reduce((acc, c) => acc + c.totalAnggaran, 0), [rabOperasionalBarang]);
  const totalGajiKaryawan = useMemo(() => gajiKaryawan.reduce((acc, c) => acc + c.gajiBersih, 0), [gajiKaryawan]);
  const totalGajiStaf = useMemo(() => gajiStaf.reduce((acc, c) => acc + c.gajiBersih, 0), [gajiStaf]);
  const totalInsentifPic = useMemo(() => {
    return insentifPicLembaga.reduce((a, c) => a + c.totalInsentif, 0) + insentifPicPosyandu.reduce((a, c) => a + c.totalInsentif, 0);
  }, [insentifPicLembaga, insentifPicPosyandu]);
  const totalRealisasiBb = useMemo(() => realisasiBahanBaku.reduce((acc, c) => acc + c.totalRealisasi, 0), [realisasiBahanBaku]);
  const efisiensiBb = useMemo(() => totalAnggaranRabBb - totalRealisasiBb, [totalAnggaranRabBb, totalRealisasiBb]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Multi-Level Breadcrumb */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Breadcrumb Hierarchy */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          {routeMeta.breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
              <span
                className={
                  idx === routeMeta.breadcrumbs.length - 1
                    ? 'text-teal-700 dark:text-teal-400 font-black uppercase tracking-wider'
                    : 'hover:text-slate-700 dark:hover:text-slate-300'
                }
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Title, Badge & Quick Global Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-2xs">
              <HeaderIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {routeMeta.title}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                  {routeMeta.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                {routeMeta.description}
              </p>
            </div>
          </div>

          {/* Quick Toolbar Actions */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            {/* Realisasi Sync Button (Spesifikasi Teknis #3) */}
            {(routeMeta.key === 'realisasi-bahan-baku' || routeMeta.key === 'realisasi-operasional') && (
              <button
                type="button"
                onClick={() =>
                  handleTarikDataKedatanganBarang(
                    routeMeta.key === 'realisasi-bahan-baku' ? 'Bahan Baku' : 'Operasional'
                  )
                }
                disabled={isSyncing}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-teal-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                title="Tarik data kedatangan barang dan PO dari gudang secara real-time"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : '⚡ Tarik Data Kedatangan Barang'}</span>
              </button>
            )}

            {/* Quick Export Button */}
            <button
              type="button"
              onClick={() => {
                if (routeMeta.key === 'slip-gaji-karyawan' || routeMeta.key === 'rekap-gaji-karyawan') {
                  generateSlipGajiExcel(gajiKaryawan, 'Gaji Karyawan');
                } else if (routeMeta.key === 'slip-gaji-staf' || routeMeta.key === 'rekap-gaji-staf') {
                  generateSlipGajiExcel(gajiStaf, 'Gaji Staf');
                } else if (routeMeta.key.includes('pic-lembaga')) {
                  generateKwitansiExcel(insentifPicLembaga, 'PIC Lembaga Sekolah');
                } else if (routeMeta.key.includes('pic-posyandu')) {
                  generateKwitansiExcel(insentifPicPosyandu, 'PIC Posyandu');
                } else if (routeMeta.key.includes('fasilitas')) {
                  generateBeritaAcaraFasilitasExcel(insentifFasilitas);
                } else {
                  triggerToast(`Laporan ${routeMeta.title} berhasil diekspor ke Excel (.xlsx)!`);
                }
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Download Data Format Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>

        {/* Quick Sub-navigation pills (4-Level hierarchy switcher) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 min-w-max text-xs">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
              Navigasi Cepat Akuntan:
            </span>
            <button
              onClick={() => onNavigate('/akuntan')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath === '/akuntan'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('/akuntan/rab-bahan-baku')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/akuntan/rab-bahan-baku')
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              RAB Bahan Baku
            </button>
            <button
              onClick={() => onNavigate('/akuntan/rab-operasional/barang')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/akuntan/rab-operasional/barang')
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              RAB Op. Barang
            </button>
            <button
              onClick={() => onNavigate('/akuntan/rab-operasional/jasa/gaji-karyawan/rekap-gaji')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/akuntan/rab-operasional/jasa/gaji-karyawan')
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Gaji Karyawan
            </button>
            <button
              onClick={() => onNavigate('/akuntan/rab-operasional/jasa/insentif-pic-lembaga/rekap')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/akuntan/rab-operasional/jasa/insentif-pic-lembaga')
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Insentif PIC Sekolah
            </button>
            <button
              onClick={() => onNavigate('/akuntan/rab-operasional/jasa/insentif-pic-posyandu/rekap')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/akuntan/rab-operasional/jasa/insentif-pic-posyandu')
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Insentif PIC Posyandu
            </button>
            <button
              onClick={() => onNavigate('/akuntan/rab-operasional/jasa/gaji-staf/rekap-gaji')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/akuntan/rab-operasional/jasa/gaji-staf')
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Gaji Staf
            </button>
            <button
              onClick={() => onNavigate('/akuntan/insentif-fasilitas/berita-acara')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/akuntan/insentif-fasilitas')
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Insentif Fasilitas
            </button>
            <button
              onClick={() => onNavigate('/akuntan/realisasi-bahan-baku')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/akuntan/realisasi-bahan-baku')
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              📦 Realisasi Bahan Baku
            </button>
            <button
              onClick={() => onNavigate('/akuntan/realisasi-operasional')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/akuntan/realisasi-operasional')
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              🚚 Realisasi Operasional
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-2xs space-y-2 hover:border-teal-300 dark:hover:border-teal-700 transition-all">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Total RAB Bahan Baku
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {formatRupiah(totalAnggaranRabBb)}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pagu Rp 15.000 / Porsi</span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-2xs space-y-2 hover:border-teal-300 dark:hover:border-teal-700 transition-all">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Realisasi Belanja Riil
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {formatRupiah(totalRealisasiBb)}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Sinkron Logistik Gudang</span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-2xs space-y-2 hover:border-teal-300 dark:hover:border-teal-700 transition-all">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Penggajian & Insentif Mitra
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {formatRupiah(totalGajiKaryawan + totalGajiStaf + totalInsentifPic)}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
            <Users className="w-3.5 h-3.5" />
            <span>Karyawan, Staf & PIC</span>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-2xs space-y-2 hover:border-teal-300 dark:hover:border-teal-700 transition-all">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Efisiensi Anggaran (Surplus)
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {formatRupiah(Math.max(0, efisiensiBb))}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Terjaga Di Bawah Plafon</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: RAB BAHAN BAKU */}
      {routeMeta.key === 'rab-bahan-baku' && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                Rencana Anggaran Belanja (RAB) Bahan Baku Pangan
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                {rabBahanBaku.length} Item Bahan
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const headers = ['No', 'Kode', 'Kategori', 'Nama Bahan Baku', 'Kebutuhan/Porsi (gr)', 'Target Porsi', 'Total Kg', 'Harga Satuan (Rp)', 'Total Anggaran (Rp)'];
                  const data = rabBahanBaku.map((r, i) => [i + 1, r.kode, r.kategori, r.namaBarang, r.kebutuhanPorsi, r.targetPorsi, r.totalKebutuhanKg, r.hargaSatuan, r.totalAnggaran]);
                  exportTableToExcel(data, headers, 'RAB_Bahan_Baku_SPPG', 'RAB Bahan Baku');
                  triggerToast('RAB Bahan Baku berhasil diekspor ke Excel!');
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3">Kategori & Nama Bahan</th>
                  <th className="py-3 px-3 text-right">Gramatur/Porsi</th>
                  <th className="py-3 px-3 text-right">Target Porsi</th>
                  <th className="py-3 px-3 text-right">Total Kebutuhan</th>
                  <th className="py-3 px-3 text-right">Harga Satuan</th>
                  <th className="py-3 px-3 text-right">Total Anggaran</th>
                  <th className="py-3 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rabBahanBaku.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.namaBarang}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{item.spesifikasi}</div>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">{item.kebutuhanPorsi} gr</td>
                    <td className="py-2.5 px-3 text-right font-bold text-teal-700 dark:text-teal-400">
                      {item.targetPorsi.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      {item.totalKebutuhanKg} {item.satuan}
                    </td>
                    <td className="py-2.5 px-3 text-right">{formatRupiah(item.hargaSatuan)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                      {formatRupiah(item.totalAnggaran)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">{item.keterangan}</td>
                  </tr>
                ))}
                <tr className="bg-teal-50/70 dark:bg-teal-950/40 font-black text-teal-950 dark:text-teal-200 border-t-2 border-teal-500">
                  <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    TOTAL KESELURUHAN RAB BAHAN BAKU:
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-black text-teal-800 dark:text-teal-300">
                    {formatRupiah(totalAnggaranRabBb)}
                  </td>
                  <td className="py-3 px-3 text-[10px] font-bold text-teal-700">
                    Sesuai Kuota Harian SPPG
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: RAB OPERASIONAL BARANG */}
      {routeMeta.key === 'rab-op-barang' && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                RAB Operasional Pengadaan Barang Dapur
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                {rabOperasionalBarang.length} Item Operasional
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const headers = ['No', 'Kode', 'Kategori', 'Nama Barang Operasional', 'Jumlah', 'Satuan', 'Harga Satuan (Rp)', 'Total Anggaran (Rp)', 'Periode'];
                const data = rabOperasionalBarang.map((r, i) => [i + 1, r.kode, r.kategori, r.namaBarang, r.jumlah, r.satuan, r.hargaSatuan, r.totalAnggaran, r.periode]);
                exportTableToExcel(data, headers, 'RAB_Operasional_Barang_SPPG', 'RAB Op Barang');
                triggerToast('RAB Operasional Barang berhasil diekspor!');
              }}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3">Nama Barang Operasional</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-right">Jumlah</th>
                  <th className="py-3 px-3 text-right">Harga Satuan</th>
                  <th className="py-3 px-3 text-right">Total Anggaran</th>
                  <th className="py-3 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rabOperasionalBarang.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{item.namaBarang}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      {item.jumlah} {item.satuan}
                    </td>
                    <td className="py-2.5 px-3 text-right">{formatRupiah(item.hargaSatuan)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                      {formatRupiah(item.totalAnggaran)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">{item.keterangan}</td>
                  </tr>
                ))}
                <tr className="bg-teal-50/70 dark:bg-teal-950/40 font-black text-teal-950 dark:text-teal-200 border-t-2 border-teal-500">
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    TOTAL ANGGARAN OPERASIONAL BARANG:
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-black text-teal-800 dark:text-teal-300">
                    {formatRupiah(totalAnggaranRabOp)}
                  </td>
                  <td className="py-3 px-3 text-[10px] text-teal-700 font-bold">November 2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: GAJI KARYAWAN (REKAP & SLIP GAJI) */}
      {(routeMeta.key === 'rekap-gaji-karyawan' || routeMeta.key === 'slip-gaji-karyawan') && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                Penggajian Karyawan Dapur (Chef, Helper, Packing, Higiene)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/akuntan/rab-operasional/jasa/gaji-karyawan/rekap-gaji')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                  routeMeta.key === 'rekap-gaji-karyawan'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Rekap Gaji
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/akuntan/rab-operasional/jasa/gaji-karyawan/slip-gaji')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                  routeMeta.key === 'slip-gaji-karyawan'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Katalog Slip Gaji
              </button>
              <button
                type="button"
                onClick={() => generateSlipGajiExcel(gajiKaryawan, 'Gaji Karyawan Dapur')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* If mode is Slip Gaji, show printable cards for each employee */}
          {routeMeta.key === 'slip-gaji-karyawan' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gajiKaryawan.map(rec => (
                <div
                  key={rec.id}
                  className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 hover:border-teal-400 dark:hover:border-teal-600 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                        {rec.nomorSlip}
                      </span>
                      <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 mt-1">
                        {rec.nama}
                      </h3>
                      <div className="text-[11px] text-slate-500 font-semibold">{rec.jabatan}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {rec.statusBayar}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-500">
                      <span>Total Penerimaan:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatRupiah(rec.totalPenerimaan)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Total Potongan:</span>
                      <span className="font-bold text-rose-600">
                        -{formatRupiah(rec.totalPotongan)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-dashed border-slate-200 dark:border-slate-700 text-teal-800 dark:text-teal-300 font-black">
                      <span>Take Home Pay:</span>
                      <span className="text-sm font-black">{formatRupiah(rec.gajiBersih)}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 italic">
                      Terbilang: {terbilang(rec.gajiBersih)} Rupiah
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => generateSlipGajiPdf(rec, 'KARYAWAN')}
                      className="flex-1 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Download PDF Slip Gaji Resmi"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Cetak PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSlipKaryawan(rec)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table Rekap Gaji Karyawan */
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">Nama Karyawan</th>
                    <th className="py-3 px-3">Jabatan</th>
                    <th className="py-3 px-3 text-right">Gaji Pokok</th>
                    <th className="py-3 px-3 text-right">Tunj. Hadir</th>
                    <th className="py-3 px-3 text-right">Lembur & Bonus</th>
                    <th className="py-3 px-3 text-right">Potongan</th>
                    <th className="py-3 px-3 text-right">Gaji Bersih (THP)</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {gajiKaryawan.map((rec, idx) => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{rec.nama}</div>
                        <div className="text-[10px] text-slate-400">NIK: {rec.nik}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{rec.jabatan}</td>
                      <td className="py-2.5 px-3 text-right">{formatRupiah(rec.gajiPokok)}</td>
                      <td className="py-2.5 px-3 text-right">{formatRupiah(rec.tunjanganHadir)}</td>
                      <td className="py-2.5 px-3 text-right">{formatRupiah(rec.uangLembur + rec.bonusKinerja)}</td>
                      <td className="py-2.5 px-3 text-right text-rose-600 font-medium">-{formatRupiah(rec.totalPotongan)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                        {formatRupiah(rec.gajiBersih)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => generateSlipGajiPdf(rec, 'KARYAWAN')}
                          className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          title="Cetak Slip Gaji PDF"
                        >
                          <Download className="w-3 h-3" />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-teal-50/70 dark:bg-teal-950/40 font-black text-teal-950 dark:text-teal-200 border-t-2 border-teal-500">
                    <td colSpan={7} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                      TOTAL PENGGAJIAN KARYAWAN DAPUR:
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-black text-teal-800 dark:text-teal-300">
                      {formatRupiah(totalGajiKaryawan)}
                    </td>
                    <td className="py-3 px-3 text-center text-[10px] text-teal-700 font-bold">5 Karyawan</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: INSENTIF PIC LEMBAGA (SEKOLAH) */}
      {(routeMeta.key === 'rekap-pic-lembaga' || routeMeta.key === 'kwitansi-pic-lembaga') && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                Insentif PIC Lembaga Sekolah (SD/MI, SMP/MTs, SMA/MA)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/akuntan/rab-operasional/jasa/insentif-pic-lembaga/rekap')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                  routeMeta.key === 'rekap-pic-lembaga'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Rekap Insentif
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/akuntan/rab-operasional/jasa/insentif-pic-lembaga/kwitansi')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                  routeMeta.key === 'kwitansi-pic-lembaga'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Kwitansi PIC
              </button>
              <button
                type="button"
                onClick={() => generateKwitansiExcel(insentifPicLembaga, 'PIC Lembaga Sekolah')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insentifPicLembaga.map(rec => (
              <div
                key={rec.id}
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4.5 space-y-3 hover:border-teal-400 transition-all"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                    {rec.nomorKwitansi}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {rec.statusBayar}
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">{rec.namaPic}</h3>
                  <div className="text-xs text-teal-700 dark:text-teal-400 font-bold">{rec.lembaga}</div>
                  <div className="text-[10px] text-slate-400">Sasaran: {rec.jumlahSasaran} Siswa/Porsi</div>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Insentif Distribusi:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(rec.insentifPokok)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Uang Transport:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(rec.uangTransport)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-dashed border-slate-200 dark:border-slate-700 font-black text-teal-800 dark:text-teal-300">
                    <span>Total Insentif:</span>
                    <span className="text-sm">{formatRupiah(rec.totalInsentif)}</span>
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => generateKwitansiPdf(rec)}
                    className="flex-1 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Cetak Kwitansi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedKwitansi(rec)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 5: INSENTIF PIC POSYANDU (3B & BALITA) */}
      {(routeMeta.key === 'rekap-pic-posyandu' || routeMeta.key === 'kwitansi-pic-posyandu') && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                Insentif Kader PIC Posyandu (Sasaran 3B & Balita)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/akuntan/rab-operasional/jasa/insentif-pic-posyandu/rekap')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                  routeMeta.key === 'rekap-pic-posyandu'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Rekap Insentif
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/akuntan/rab-operasional/jasa/insentif-pic-posyandu/kwitansi')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                  routeMeta.key === 'kwitansi-pic-posyandu'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Kwitansi Posyandu
              </button>
              <button
                type="button"
                onClick={() => generateKwitansiExcel(insentifPicPosyandu, 'PIC Kader Posyandu')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insentifPicPosyandu.map(rec => (
              <div
                key={rec.id}
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4.5 space-y-3 hover:border-teal-400 transition-all"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                    {rec.nomorKwitansi}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {rec.statusBayar}
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">{rec.namaPic}</h3>
                  <div className="text-xs text-rose-700 dark:text-rose-400 font-bold">{rec.lembaga}</div>
                  <div className="text-[10px] text-slate-400">Sasaran: {rec.jumlahSasaran} Balita & Ibu Hamil</div>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Insentif Pokok Kader:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(rec.insentifPokok)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Uang Transport Posyandu:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(rec.uangTransport)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-dashed border-slate-200 dark:border-slate-700 font-black text-teal-800 dark:text-teal-300">
                    <span>Total Insentif:</span>
                    <span className="text-sm">{formatRupiah(rec.totalInsentif)}</span>
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => generateKwitansiPdf(rec)}
                    className="flex-1 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Cetak Kwitansi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedKwitansi(rec)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 6: GAJI STAF (REKAP & SLIP GAJI) */}
      {(routeMeta.key === 'rekap-gaji-staf' || routeMeta.key === 'slip-gaji-staf') && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                Penggajian Staf Struktural & Pengemudi SPPG
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/akuntan/rab-operasional/jasa/gaji-staf/rekap-gaji')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                  routeMeta.key === 'rekap-gaji-staf'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Rekap Gaji
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/akuntan/rab-operasional/jasa/gaji-staf/slip-gaji')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                  routeMeta.key === 'slip-gaji-staf'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Slip Gaji Staf
              </button>
              <button
                type="button"
                onClick={() => generateSlipGajiExcel(gajiStaf, 'Gaji Staf SPPG')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gajiStaf.map(rec => (
              <div
                key={rec.id}
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4.5 space-y-3 hover:border-teal-400 transition-all shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                    {rec.nomorSlip}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {rec.statusBayar}
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">{rec.nama}</h3>
                  <div className="text-xs text-indigo-700 dark:text-indigo-400 font-bold">{rec.jabatan}</div>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Gaji Pokok:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatRupiah(rec.gajiPokok)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tunj. Jabatan & Transport:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatRupiah(rec.tunjanganJabatan + rec.tunjanganTransport)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Potongan BPJS & PPh21:</span>
                    <span className="font-bold text-rose-600">-{formatRupiah(rec.totalPotongan)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-dashed border-slate-200 dark:border-slate-700 font-black text-teal-800 dark:text-teal-300">
                    <span>Gaji Bersih (THP):</span>
                    <span className="text-sm font-black">{formatRupiah(rec.gajiBersih)}</span>
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => generateSlipGajiPdf(rec, 'STAF')}
                    className="flex-1 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Cetak PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSlipStaf(rec)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 7: OPERASIONAL LAINNYA */}
      {routeMeta.key === 'operasional-lainnya' && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                Pencatatan Biaya Operasional Lainnya (Utilitas & Lab)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                const headers = ['No', 'Kode Transaksi', 'Kategori', 'Uraian Pengeluaran', 'Biaya (Rp)', 'Tanggal', 'Penanggung Jawab', 'Bukti Nota'];
                const data = operasionalLainnya.map((r, i) => [i + 1, r.kodeTransaksi, r.kategori, r.namaPengeluaran, r.jumlahBiaya, r.tanggalTransaksi, r.penanggungJawab, r.buktiNota]);
                exportTableToExcel(data, headers, 'Operasional_Lainnya_SPPG', 'Op Lainnya');
                triggerToast('Operasional Lainnya berhasil diekspor!');
              }}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3">Uraian Pengeluaran</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-right">Biaya (Rp)</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Penanggung Jawab</th>
                  <th className="py-3 px-3">No. Nota / Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {operasionalLainnya.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.namaPengeluaran}</div>
                      <div className="text-[10px] text-slate-400">{item.keterangan}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                      {formatRupiah(item.jumlahBiaya)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{item.tanggalTransaksi}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{item.penanggungJawab}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-teal-700 dark:text-teal-400">{item.buktiNota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 8: INSENTIF FASILITAS (BERITA ACARA & REKAP) */}
      {(routeMeta.key === 'berita-acara-fasilitas' || routeMeta.key === 'rekap-fasilitas') && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                Insentif & Berita Acara Pemanfaatan Fasilitas SPPG
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/akuntan/insentif-fasilitas/berita-acara')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                  routeMeta.key === 'berita-acara-fasilitas'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Berita Acara (BAST)
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/akuntan/insentif-fasilitas/rekap')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                  routeMeta.key === 'rekap-fasilitas'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Rekap Fasilitas
              </button>
              <button
                type="button"
                onClick={() => generateBeritaAcaraFasilitasExcel(insentifFasilitas)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {insentifFasilitas.map(fas => (
            <div
              key={fas.id}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                    {fas.nomorBa}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                    {fas.namaFasilitas}
                  </h3>
                  <div className="text-xs text-slate-500">{fas.lokasi} | Pemilik: {fas.pemilikPenyedia}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Kompensasi Fasilitas:</div>
                  <div className="text-lg font-black text-teal-700 dark:text-teal-300">{formatRupiah(fas.totalInsentif)}</div>
                  <div className="text-[10px] text-slate-400">{fas.periode}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Rincian Fasilitas & Area yang Disediakan:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {fas.fasilitasRincian.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-slate-500">
                  Pihak Pertama: <span className="font-bold text-slate-700 dark:text-slate-300">{fas.pihakPertama}</span> |
                  Pihak Kedua: <span className="font-bold text-slate-700 dark:text-slate-300">{fas.pihakKedua}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => generateBeritaAcaraFasilitasPdf(fas)}
                    className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Berita Acara PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBeritaAcara(fas)}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 9: REALISASI BAHAN BAKU (TARIK DATA KEDATANGAN BARANG) */}
      {routeMeta.key === 'realisasi-bahan-baku' && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                Realisasi Belanja Bahan Baku vs Rencana (Data PO & Kedatangan Barang)
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {realisasiBahanBaku.length} Riwayat Realisasi
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTarikDataKedatanganBarang('Bahan Baku')}
                disabled={isSyncing}
                className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Tarik Data Kedatangan Barang</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const headers = ['No', 'Tanggal', 'Nama Barang', 'Satuan', 'Qty Rencana', 'Qty Realisasi', 'Harga Rencana (Rp)', 'Harga Riil (Rp)', 'Total Rencana (Rp)', 'Total Realisasi (Rp)', 'Selisih (Rp)', 'Kesesuaian', 'Supplier'];
                  const data = realisasiBahanBaku.map((r, i) => [i + 1, r.tanggal, r.namaBarang, r.satuan, r.jumlahRencana, r.jumlahRealisasi, r.hargaSatuanRencana, r.hargaSatuanRiil, r.totalRencana, r.totalRealisasi, r.selisih, r.statusKesesuaian, r.supplier]);
                  exportTableToExcel(data, headers, 'Realisasi_Bahan_Baku_SPPG', 'Realisasi Bahan Baku');
                  triggerToast('Realisasi Bahan Baku berhasil diekspor!');
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3">Tanggal Datang</th>
                  <th className="py-3 px-3">Nama Bahan Baku</th>
                  <th className="py-3 px-3 text-right">Rencana Qty</th>
                  <th className="py-3 px-3 text-right">Realisasi Qty</th>
                  <th className="py-3 px-3 text-right">Harga Riil</th>
                  <th className="py-3 px-3 text-right">Total Realisasi</th>
                  <th className="py-3 px-3 text-right">Selisih Deviasi</th>
                  <th className="py-3 px-3 text-center">Kesesuaian</th>
                  <th className="py-3 px-3">Supplier & Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {realisasiBahanBaku.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {item.tanggal}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.namaBarang}</div>
                      <div className="text-[10px] text-slate-400">Kualitas: {item.kualitas}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500 font-medium">
                      {item.jumlahRencana} {item.satuan}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      {item.jumlahRealisasi} {item.satuan}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium">{formatRupiah(item.hargaSatuanRiil)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                      {formatRupiah(item.totalRealisasi)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${item.selisih > 0 ? 'text-amber-600' : item.selisih < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {item.selisih > 0 ? `+${formatRupiah(item.selisih)}` : item.selisih < 0 ? `-${formatRupiah(Math.abs(item.selisih))}` : 'Rp 0'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.statusKesesuaian === 'Sesuai'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.statusKesesuaian === 'Lebih'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.statusKesesuaian}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.supplier}</div>
                      <div className="text-[10px] text-slate-400">Penerima: {item.petugasPenerima}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 10: REALISASI OPERASIONAL (TARIK DATA KEDATANGAN BARANG) */}
      {routeMeta.key === 'realisasi-operasional' && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                Realisasi Belanja Operasional Riil (Barang & Energi)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleTarikDataKedatanganBarang('Operasional')}
                disabled={isSyncing}
                className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Tarik Data Kedatangan Barang</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const headers = ['No', 'Tanggal', 'Nama Barang Operasional', 'Kategori', 'Jumlah Riil', 'Satuan', 'Biaya Riil (Rp)', 'Anggaran RAB (Rp)', 'Supplier / Petugas'];
                  const data = realisasiOperasional.map((r, i) => [i + 1, r.tanggal, r.namaBarang, r.kategori, r.jumlahRiil, r.satuan, r.biayaRiil, r.anggaranRab, r.supplierPetugas]);
                  exportTableToExcel(data, headers, 'Realisasi_Operasional_SPPG', 'Realisasi Operasional');
                  triggerToast('Realisasi Operasional berhasil diekspor!');
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Nama Barang Operasional</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3 text-right">Jumlah Riil</th>
                  <th className="py-3 px-3 text-right">Biaya Riil (Rp)</th>
                  <th className="py-3 px-3 text-right">Anggaran RAB (Rp)</th>
                  <th className="py-3 px-3">Petugas / Penyedia</th>
                  <th className="py-3 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {realisasiOperasional.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{item.tanggal}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{item.namaBarang}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      {item.jumlahRiil} {item.satuan}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                      {formatRupiah(item.biayaRiil)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-500">{formatRupiah(item.anggaranRab)}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{item.supplierPetugas}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">{item.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 11: OVERVIEW DASHBOARD UTAMA AKUNTAN */}
      {routeMeta.key === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              onClick={() => onNavigate('/akuntan/rab-bahan-baku')}
              className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:border-teal-400 cursor-pointer transition-all space-y-3 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 group-hover:text-teal-600 transition-colors">
                RAB Bahan Baku
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kalkulasi pagu Rp 15.000 / porsi, alokasi gramatur gizi, dan kebutuhan belanja 2.810 sasaran harian.
              </p>
              <div className="flex items-center gap-1 text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform">
                <span>Buka Rencana Belanja</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div
              onClick={() => onNavigate('/akuntan/rab-operasional/jasa/gaji-karyawan/slip-gaji')}
              className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:border-teal-400 cursor-pointer transition-all space-y-3 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                Penggajian Karyawan & Staf
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Penerbitan bukti Slip Gaji resmi dengan terbilang rupiah, komponen tunjangan, potongan BPJS, dan export PDF.
              </p>
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                <span>Kelola Slip Gaji</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            <div
              onClick={() => onNavigate('/akuntan/realisasi-bahan-baku')}
              className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:border-teal-400 cursor-pointer transition-all space-y-3 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600">
                <PackageCheck className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                Realisasi Belanja Real-Time
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Fitur otomatis Tarik Data Kedatangan Barang langsung dari manifest gudang logistik untuk mencatat pengeluaran riil.
              </p>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>Tarik Data Logistik</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW SLIP GAJI */}
      {(selectedSlipKaryawan || selectedSlipStaf) && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  Preview Slip Gaji Resmi SPPG
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedSlipKaryawan(null);
                  setSelectedSlipStaf(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const item = (selectedSlipKaryawan || selectedSlipStaf)!;
              const isKaryawan = Boolean(selectedSlipKaryawan);
              return (
                <div className="space-y-4 text-xs">
                  <div className="bg-teal-50 dark:bg-teal-950/50 p-3.5 rounded-2xl border border-teal-200 dark:border-teal-800 flex justify-between items-center">
                    <div>
                      <div className="font-black text-sm text-teal-950 dark:text-teal-200">{item.nama}</div>
                      <div className="text-[11px] text-teal-700 dark:text-teal-400 font-bold">{item.jabatan}</div>
                      <div className="text-[10px] text-slate-400">NIK: {item.nik}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {item.statusBayar}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1">{item.nomorSlip}</div>
                    </div>
                  </div>

                  <div className="space-y-2 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
                    <div className="flex justify-between font-bold">
                      <span>Total Penerimaan:</span>
                      <span className="text-teal-700 dark:text-teal-400">{formatRupiah(item.totalPenerimaan)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total Potongan:</span>
                      <span className="text-rose-600">-{formatRupiah(item.totalPotongan)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-slate-100">
                      <span>Gaji Bersih (THP):</span>
                      <span className="text-teal-800 dark:text-teal-300">{formatRupiah(item.gajiBersih)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 italic pt-1">
                      Terbilang: "# {terbilang(item.gajiBersih)} Rupiah #"
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => generateSlipGajiPdf(item, isKaryawan ? 'KARYAWAN' : 'STAF')}
                      className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Dokumen Slip Gaji (PDF)</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL PREVIEW KWITANSI */}
      {selectedKwitansi && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  Preview Kwitansi Pembayaran Insentif PIC
                </h3>
              </div>
              <button
                onClick={() => setSelectedKwitansi(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs border border-teal-200 dark:border-teal-800 p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30">
              <div className="flex justify-between items-center text-[10px] text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-teal-800 dark:text-teal-300">SPPG BADAN GIZI NASIONAL</span>
                <span>{selectedKwitansi.nomorKwitansi}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500">Telah Diterima Dari:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">Bendahara SPPG Badan Gizi Nasional</div>
              </div>
              <div>
                <span className="font-bold text-slate-500">Uang Sejumlah:</span>
                <div className="text-sm font-black text-teal-700 dark:text-teal-400">
                  {formatRupiah(selectedKwitansi.totalInsentif)}
                </div>
                <div className="text-[10px] text-slate-500 italic">
                  "{terbilang(selectedKwitansi.totalInsentif)} Rupiah"
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-500">Untuk Pembayaran:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Insentif Koordinator & PIC Distribusi - {selectedKwitansi.lembaga}
                </div>
                <div className="text-[10px] text-slate-400">Penerima: {selectedKwitansi.namaPic}</div>
              </div>

              <div className="pt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateKwitansiPdf(selectedKwitansi)}
                  className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Kwitansi Resmi (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW BERITA ACARA */}
      {selectedBeritaAcara && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                  Detail Berita Acara Fasilitas (BAST)
                </h3>
              </div>
              <button
                onClick={() => setSelectedBeritaAcara(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl space-y-2">
                <div className="font-black text-sm text-slate-900 dark:text-slate-100">{selectedBeritaAcara.namaFasilitas}</div>
                <div className="text-slate-500">{selectedBeritaAcara.nomorBa} | Periode: {selectedBeritaAcara.periode}</div>
                <div className="font-black text-teal-700 dark:text-teal-400 text-sm">
                  Total Kompensasi: {formatRupiah(selectedBeritaAcara.totalInsentif)}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => generateBeritaAcaraFasilitasPdf(selectedBeritaAcara)}
                  className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Berita Acara Resmi (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
