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
  Clock,
  UtensilsCrossed,
  Lock,
  Unlock,
  Save,
  Edit,
  Trash2
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
  initialRealisasiOperasional,
  hitungInsentifPicPosyandu,
  hitungInsentifPicSekolah
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
import { DashboardAkuntan } from '../../components/akuntan/DashboardAkuntan';
import { CetakLaporanAkuntanView } from '../../components/akuntan/CetakLaporanAkuntanView';
import { calculateDailyRecordsPortion } from '../../utils/portionHelper';
import { INITIAL_PDF_INGREDIENTS } from '../../components/nutrition/nutritionData';
import {
  deleteAkuntanItemDoc,
  getAkuntanConfigsSnapshot,
  getBarangDatangSnapshot,
  getGajiKaryawanSnapshot,
  getGajiStafSnapshot,
  getInsentifFasilitasSnapshot,
  getNutritionPlansSnapshot,
  getOpLainnyaSnapshot,
  getPicLembagaSnapshot,
  getPicPosyanduSnapshot,
  getRabBahanBakuSnapshot,
  getRabOpBarangSnapshot,
  getRealisasiBbSnapshot,
  getRealisasiOpSnapshot,
  replaceAkuntanDocsForPredicate,
  saveAkuntanItemDoc,
  subscribeOperationalSlice,
  updateAkuntanConfigDoc,
  updateAkuntanItemFields,
  updateNutritionPlanPriceInFirestore
} from '../../lib/firestoreOperationalStore';
import { generateUniqueDocId } from '../../lib/firestoreHelper';

interface AkuntanViewProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const AkuntanView: React.FC<AkuntanViewProps> = ({ currentPath, onNavigate }) => {
  // Toast Notification state (supports success & error notifications)
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Debounced single-item field persistence helper to Firestore
  const fieldSyncTimers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const scheduleItemFieldsSync = React.useCallback(
    (collectionName: string, docId: string, fields: Record<string, any>) => {
      const key = `${collectionName}:${docId}`;
      if (fieldSyncTimers.current[key]) {
        clearTimeout(fieldSyncTimers.current[key]);
      }
      fieldSyncTimers.current[key] = setTimeout(async () => {
        try {
          await updateAkuntanItemFields(collectionName, docId, fields);
        } catch (err: any) {
          console.error(`Gagal memperbarui ${collectionName}/${docId}:`, err);
          triggerToast(err?.message || 'Gagal menyimpan perubahan ke Firebase', 'error');
        }
      }, 300);
    },
    []
  );

  // Tanggal aktif terintegrasi dengan Penerima Manfaat & Food Cost (sumber tunggal Firestore)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getAkuntanConfigsSnapshot().selectedDate || '2026-11-01';
  });
  const [isLoadingBeneficiary, setIsLoadingBeneficiary] = useState<boolean>(false);
  const [beneficiaryInfo, setBeneficiaryInfo] = useState<{
    porsiBesar: number;
    porsiKecil: number;
    totalPm: number;
    hasPlanning: boolean;
  }>({
    porsiBesar: 2397,
    porsiKecil: 519,
    totalPm: 2916,
    hasPlanning: true
  });

  // Tarik data valid dari menu Penerima Manfaat untuk menentukan klasifikasi porsi besar dan porsi kecil
  const fetchBeneficiaryForAkuntan = React.useCallback(async (targetDate: string) => {
    setIsLoadingBeneficiary(true);
    try {
      const res = await fetch(`/api/v1/penerima-manfaat/by-date?tanggal=${targetDate}`);
      if (!res.ok) {
        setIsLoadingBeneficiary(false);
        return;
      }
      const json = await res.json();
      if (json.success && ((json.records && json.records.length > 0) || (json.summary && json.summary.totalPenerima > 0))) {
        const calculated = calculateDailyRecordsPortion(json.records || [], json.summary);
        if (calculated.totalPenerima > 0) {
          setBeneficiaryInfo({
            porsiBesar: calculated.overallPorsiBesar,
            porsiKecil: calculated.overallPorsiKecil,
            totalPm: calculated.totalPenerima,
            hasPlanning: true
          });
        } else {
          setBeneficiaryInfo({
            porsiBesar: 0,
            porsiKecil: 0,
            totalPm: 0,
            hasPlanning: false
          });
        }
      }
    } catch (err) {
      console.warn('[AkuntanView] Error fetching beneficiary data:', err);
    } finally {
      setIsLoadingBeneficiary(false);
    }
  }, []);

  useEffect(() => {
    fetchBeneficiaryForAkuntan(selectedDate);
  }, [selectedDate, fetchBeneficiaryForAkuntan]);

  // State Persistence berbasis Firestore real-time
  const [rabBahanBaku, setRabBahanBaku] = useState<RabBahanBakuItem[]>(() =>
    getRabBahanBakuSnapshot().filter((it) => it.tanggalPelaksanaan === selectedDate)
  );

  // State kunci data RAB Bahan Baku (Simpan & Kunci vs Edit/Revisi)
  const [isRabBahanBakuLocked, setIsRabBahanBakuLocked] = useState<boolean>(() =>
    Boolean(getAkuntanConfigsSnapshot().rabBbLocked)
  );

  const handleSimpanRabBahanBaku = async () => {
    try {
      const existingForDate = getRabBahanBakuSnapshot().filter(
        (it) => it.tanggalPelaksanaan === selectedDate
      );
      const datedItems = rabBahanBaku.map((it) => ({
        ...it,
        tanggalPelaksanaan: it.tanggalPelaksanaan || selectedDate
      }));
      await replaceAkuntanDocsForPredicate('akuntan_rab_bahan_baku', datedItems, existingForDate);

      const currentPrices = { ...(getAkuntanConfigsSnapshot().savedPrices || {}) };
      datedItems.forEach((item) => {
        if (item.hargaSatuan > 0) {
          currentPrices[item.namaBarang.toLowerCase().trim()] = item.hargaSatuan;
        }
      });
      await updateAkuntanConfigDoc({
        rabBbLocked: true,
        savedPrices: currentPrices
      });
      setIsRabBahanBakuLocked(true);
      triggerToast('RAB Bahan Baku berhasil disimpan permanen ke Firebase dan dikunci!');
    } catch (err: any) {
      console.error('Gagal menyimpan RAB Bahan Baku:', err);
      triggerToast(err?.message || 'Gagal terhubung ke Firebase saat menyimpan RAB Bahan Baku', 'error');
    }
  };

  const handleEditRabBahanBaku = async () => {
    try {
      await updateAkuntanConfigDoc({ rabBbLocked: false });
      setIsRabBahanBakuLocked(false);
      triggerToast('Mode revisi aktif: Anda dapat mengedit nama barang, jumlah, dan harga satuan.');
    } catch (err: any) {
      console.error('Gagal membuka kunci RAB Bahan Baku:', err);
      triggerToast(err?.message || 'Gagal membuka kunci RAB Bahan Baku di Firebase', 'error');
    }
  };

  // RAB Operasional Pengadaan Barang
  const [rabOperasionalBarang, setRabOperasionalBarang] = useState<RabOperasionalBarangItem[]>(() => {
    const cfg = getAkuntanConfigsSnapshot();
    return cfg.rabOpBarangConfigured ? getRabOpBarangSnapshot() : [];
  });

  // State kunci data RAB Operasional Pengadaan Barang
  const [isRabOpBarangLocked, setIsRabOpBarangLocked] = useState<boolean>(() =>
    Boolean(getAkuntanConfigsSnapshot().rabOpLocked)
  );

  const handleSimpanRabOpBarang = async () => {
    try {
      await replaceAkuntanDocsForPredicate(
        'akuntan_rab_op_barang',
        rabOperasionalBarang,
        getRabOpBarangSnapshot()
      );
      await updateAkuntanConfigDoc({
        rabOpLocked: true,
        rabOpBarangConfigured: true
      });
      setIsRabOpBarangLocked(true);
      triggerToast('RAB Operasional Pengadaan Barang berhasil disimpan ke Firebase dan dikunci!');
    } catch (err: any) {
      console.error('Gagal menyimpan RAB Operasional Barang:', err);
      triggerToast(err?.message || 'Gagal menyimpan RAB Operasional Barang ke Firebase', 'error');
    }
  };

  const handleEditRabOpBarang = async () => {
    try {
      await updateAkuntanConfigDoc({ rabOpLocked: false });
      setIsRabOpBarangLocked(false);
      triggerToast('Mode revisi aktif: Anda dapat mengedit nama barang, satuan, jumlah, dan harga satuan.');
    } catch (err: any) {
      console.error('Gagal membuka kunci RAB Operasional Barang:', err);
      triggerToast(err?.message || 'Gagal membuka kunci RAB Operasional Barang di Firebase', 'error');
    }
  };

  const handleTambahBarisOpBarang = async () => {
    if (isRabOpBarangLocked) {
      triggerToast('Buka kunci dengan tombol "Edit Data" terlebih dahulu untuk menambah barang.');
      return;
    }
    const newItem: RabOperasionalBarangItem = {
      id: generateUniqueDocId('OPB'),
      kode: `OP-${String(rabOperasionalBarang.length + 1).padStart(2, '0')}`,
      kategori: 'Operasional Dapur',
      namaBarang: '',
      jumlah: 1,
      satuan: 'Pcs',
      hargaSatuan: 0,
      totalAnggaran: 0,
      periode: `Harian (${selectedDate})`,
      keterangan: 'Diinput oleh Admin / Akuntan'
    };
    try {
      await saveAkuntanItemDoc('akuntan_rab_op_barang', newItem);
      await updateAkuntanConfigDoc({ rabOpBarangConfigured: true });
      setRabOperasionalBarang((prev) => [...prev, newItem]);
      triggerToast('Baris barang operasional baru berhasil ditambahkan ke Firebase.');
    } catch (err: any) {
      console.error('Gagal menambah baris barang operasional:', err);
      triggerToast(err?.message || 'Gagal menambah baris barang operasional ke Firebase', 'error');
    }
  };

  const handleHapusBarisOpBarang = async (id: string) => {
    if (isRabOpBarangLocked) {
      triggerToast('Buka kunci dengan tombol "Edit Data" terlebih dahulu untuk menghapus baris.');
      return;
    }
    try {
      await deleteAkuntanItemDoc('akuntan_rab_op_barang', id);
      setRabOperasionalBarang((prev) => prev.filter((item) => item.id !== id));
      triggerToast('Barang operasional berhasil dihapus dari Firebase.');
    } catch (err: any) {
      console.error('Gagal menghapus barang operasional:', err);
      triggerToast(err?.message || 'Gagal menghapus barang operasional dari Firebase', 'error');
    }
  };

  // Gaji Karyawan Dapur
  const [gajiKaryawan, setGajiKaryawan] = useState<GajiKaryawanRecord[]>(() => {
    const cfg = getAkuntanConfigsSnapshot();
    return cfg.gajiKaryawanConfigured ? getGajiKaryawanSnapshot() : [];
  });
  const [isSyncingPetugas, setIsSyncingPetugas] = useState<boolean>(false);

  // Insentif PIC Sekolah
  const normalizePicSchools = React.useCallback((data: InsentifPicRecord[]) => {
    return data.map((item) => {
      const { nominal, tierLabel } = hitungInsentifPicSekolah(item.jumlahSasaran);
      return {
        ...item,
        insentifPokok: nominal,
        totalInsentif: nominal,
        tierInfo: tierLabel
      };
    });
  }, []);

  const [insentifPicLembaga, setInsentifPicLembaga] = useState<InsentifPicRecord[]>(() => {
    const cfg = getAkuntanConfigsSnapshot();
    return cfg.picLembagaConfigured ? normalizePicSchools(getPicLembagaSnapshot()) : [];
  });

  // Insentif PIC Posyandu
  const normalizePicPosyandu = React.useCallback((data: InsentifPicRecord[]) => {
    return data.map((item) => {
      const { nominal, tierLabel } = hitungInsentifPicPosyandu(item.jumlahSasaran);
      return {
        ...item,
        insentifPokok: nominal,
        totalInsentif: nominal,
        tierInfo: tierLabel
      };
    });
  }, []);

  const [insentifPicPosyandu, setInsentifPicPosyandu] = useState<InsentifPicRecord[]>(() => {
    const cfg = getAkuntanConfigsSnapshot();
    return cfg.picPosyanduConfigured ? normalizePicPosyandu(getPicPosyanduSnapshot()) : [];
  });

  const [gajiStaf, setGajiStaf] = useState<GajiStafRecord[]>(() => getGajiStafSnapshot());

  // Operasional Lainnya
  const normalizeOpLainnya = React.useCallback((data: OperasionalLainnyaItem[]) => {
    return data.map((item) => ({
      ...item,
      satuan: item.satuan || (item.kategori?.includes('Lab') ? 'Sampel' : 'Bulan'),
      biayaSatuan: item.biayaSatuan !== undefined ? item.biayaSatuan : item.jumlahBiaya,
      jumlahBiaya: item.biayaSatuan !== undefined ? item.biayaSatuan : item.jumlahBiaya
    }));
  }, []);

  const [operasionalLainnya, setOperasionalLainnya] = useState<OperasionalLainnyaItem[]>(() => {
    const cfg = getAkuntanConfigsSnapshot();
    return cfg.opLainnyaConfigured ? normalizeOpLainnya(getOpLainnyaSnapshot()) : [];
  });

  // State kunci data Operasional Lainnya
  const [isOperasionalLainnyaLocked, setIsOperasionalLainnyaLocked] = useState<boolean>(() =>
    Boolean(getAkuntanConfigsSnapshot().opLainnyaLocked)
  );

  const handleSimpanOperasionalLainnya = async () => {
    try {
      await replaceAkuntanDocsForPredicate(
        'akuntan_op_lainnya',
        operasionalLainnya,
        getOpLainnyaSnapshot()
      );
      await updateAkuntanConfigDoc({
        opLainnyaLocked: true,
        opLainnyaConfigured: true
      });
      setIsOperasionalLainnyaLocked(true);
      triggerToast('Data Operasional Lainnya berhasil disimpan permanen ke Firebase dan dikunci!');
    } catch (err: any) {
      console.error('Gagal menyimpan Operasional Lainnya:', err);
      triggerToast(err?.message || 'Gagal menyimpan Operasional Lainnya ke Firebase', 'error');
    }
  };

  const handleEditOperasionalLainnya = async () => {
    try {
      await updateAkuntanConfigDoc({ opLainnyaLocked: false });
      setIsOperasionalLainnyaLocked(false);
      triggerToast('Mode revisi aktif: Anda dapat mengedit tanggal, uraian pengeluaran, satuan, dan biaya satuan.');
    } catch (err: any) {
      console.error('Gagal membuka kunci Operasional Lainnya:', err);
      triggerToast(err?.message || 'Gagal membuka kunci Operasional Lainnya di Firebase', 'error');
    }
  };

  const [insentifFasilitas, setInsentifFasilitas] = useState<InsentifFasilitasRecord[]>(() => {
    const live = getInsentifFasilitasSnapshot();
    return live.length > 0 ? live : initialInsentifFasilitas;
  });

  const [realisasiBahanBaku, setRealisasiBahanBaku] = useState<RealisasiBahanBakuItem[]>(() => {
    const live = getRealisasiBbSnapshot();
    return live.length > 0 ? live : initialRealisasiBahanBaku;
  });

  const [realisasiOperasional, setRealisasiOperasional] = useState<RealisasiOperasionalItem[]>(() => {
    const live = getRealisasiOpSnapshot();
    return live.length > 0 ? live : initialRealisasiOperasional;
  });

  // Per-date Lock State Maps untuk Realisasi Bahan Baku & Realisasi Operasional
  const [realisasiBbLockedMap, setRealisasiBbLockedMap] = useState<Record<string, boolean>>(
    () => getAkuntanConfigsSnapshot().realisasiBbLockedMap || {}
  );

  const [realisasiOpLockedMap, setRealisasiOpLockedMap] = useState<Record<string, boolean>>(
    () => getAkuntanConfigsSnapshot().realisasiOpLockedMap || {}
  );

  const isRealisasiBbLocked = Boolean(realisasiBbLockedMap[selectedDate]);
  const isRealisasiOpLocked = Boolean(realisasiOpLockedMap[selectedDate]);

  // Filter Realisasi strictly by selectedDate
  const filteredRealisasiBb = useMemo(
    () => realisasiBahanBaku.filter((item) => item.tanggal === selectedDate),
    [realisasiBahanBaku, selectedDate]
  );

  const filteredRealisasiOp = useMemo(
    () => realisasiOperasional.filter((item) => item.tanggal === selectedDate),
    [realisasiOperasional, selectedDate]
  );

  const getHargaRiilOperasional = (item: RealisasiOperasionalItem): number => {
    if (item.hargaSatuanRiil !== undefined && item.hargaSatuanRiil !== null) {
      return Number(item.hargaSatuanRiil) || 0;
    }
    const qty = Number(item.jumlahRiil) || 0;
    if (qty > 0) {
      return Math.round((Number(item.biayaRiil) || 0) / qty);
    }
    return Number(item.biayaRiil) || 0;
  };

  const handleUpdateHargaRiilBb = (itemId: string, newHarga: number) => {
    if (isRealisasiBbLocked) {
      triggerToast('Data Realisasi Bahan Baku tanggal ini sudah dikunci. Klik "Edit Data" untuk merevisi.');
      return;
    }
    const sanitized = Math.max(0, Number.isFinite(newHarga) ? newHarga : 0);
    setRealisasiBahanBaku((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const qtyRiil = Number(item.jumlahRealisasi) || 0;
        const totalRealisasi = Math.round(qtyRiil * sanitized);
        const totalRencana = Number(item.totalRencana) || 0;
        const selisih = totalRealisasi - totalRencana;
        const persentaseRealisasi = totalRencana > 0 ? Number(((totalRealisasi / totalRencana) * 100).toFixed(1)) : 100;
        let statusKesesuaian: RealisasiBahanBakuItem['statusKesesuaian'] = 'Sesuai';
        if (totalRealisasi === totalRencana) {
          statusKesesuaian = 'Sesuai';
        } else if (sanitized !== item.hargaSatuanRencana && item.jumlahRealisasi === item.jumlahRencana) {
          statusKesesuaian = 'Harga Berubah';
        } else if (totalRealisasi > totalRencana) {
          statusKesesuaian = 'Lebih';
        } else {
          statusKesesuaian = 'Kurang';
        }
        const updatedItem = {
          ...item,
          hargaSatuanRiil: sanitized,
          totalRealisasi,
          selisih,
          persentaseRealisasi,
          statusKesesuaian
        };
        scheduleItemFieldsSync('akuntan_realisasi_bb', item.id, {
          hargaSatuanRiil: sanitized,
          totalRealisasi,
          selisih,
          persentaseRealisasi,
          statusKesesuaian
        });
        return updatedItem;
      })
    );
  };

  const handleSimpanRealisasiBb = async () => {
    const updatedMap = { ...realisasiBbLockedMap, [selectedDate]: true };
    try {
      const forDate = realisasiBahanBaku.filter((item) => item.tanggal === selectedDate);
      const existingForDate = getRealisasiBbSnapshot().filter((item) => item.tanggal === selectedDate);
      await replaceAkuntanDocsForPredicate('akuntan_realisasi_bb', forDate, existingForDate);
      await updateAkuntanConfigDoc({ realisasiBbLockedMap: updatedMap });
      setRealisasiBbLockedMap(updatedMap);
      triggerToast(`Realisasi Bahan Baku tanggal ${selectedDate} berhasil disimpan ke Firebase dan dikunci!`);
    } catch (err: any) {
      console.error('Gagal menyimpan Realisasi Bahan Baku:', err);
      triggerToast(err?.message || 'Gagal menyimpan Realisasi Bahan Baku ke Firebase', 'error');
    }
  };

  const handleEditRealisasiBb = async () => {
    const updatedMap = { ...realisasiBbLockedMap, [selectedDate]: false };
    try {
      await updateAkuntanConfigDoc({ realisasiBbLockedMap: updatedMap });
      setRealisasiBbLockedMap(updatedMap);
      triggerToast(`Mode revisi Realisasi Bahan Baku tanggal ${selectedDate} aktif. Harga Riil dapat diedit kembali.`);
    } catch (err: any) {
      console.error('Gagal membuka kunci Realisasi Bahan Baku:', err);
      triggerToast(err?.message || 'Gagal membuka kunci Realisasi Bahan Baku di Firebase', 'error');
    }
  };

  const handleUpdateHargaRiilOp = (itemId: string, newHarga: number) => {
    if (isRealisasiOpLocked) {
      triggerToast('Data Realisasi Operasional tanggal ini sudah dikunci. Klik "Edit Data" untuk merevisi.');
      return;
    }
    const sanitized = Math.max(0, Number.isFinite(newHarga) ? newHarga : 0);
    setRealisasiOperasional((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const qtyRiil = Number(item.jumlahRiil) || 0;
        const biayaRiil = qtyRiil > 0 ? Math.round(qtyRiil * sanitized) : Math.round(sanitized);
        const anggaranRab = Number(item.anggaranRab) || 0;
        const selisih = biayaRiil - anggaranRab;
        scheduleItemFieldsSync('akuntan_realisasi_op', item.id, {
          hargaSatuanRiil: sanitized,
          biayaRiil,
          selisih
        });
        return {
          ...item,
          hargaSatuanRiil: sanitized,
          biayaRiil,
          selisih
        };
      })
    );
  };

  const handleSimpanRealisasiOp = async () => {
    const updatedMap = { ...realisasiOpLockedMap, [selectedDate]: true };
    try {
      const forDate = realisasiOperasional.filter((item) => item.tanggal === selectedDate);
      const existingForDate = getRealisasiOpSnapshot().filter((item) => item.tanggal === selectedDate);
      await replaceAkuntanDocsForPredicate('akuntan_realisasi_op', forDate, existingForDate);
      await updateAkuntanConfigDoc({ realisasiOpLockedMap: updatedMap });
      setRealisasiOpLockedMap(updatedMap);
      triggerToast(`Realisasi Operasional tanggal ${selectedDate} berhasil disimpan ke Firebase dan dikunci!`);
    } catch (err: any) {
      console.error('Gagal menyimpan Realisasi Operasional:', err);
      triggerToast(err?.message || 'Gagal menyimpan Realisasi Operasional ke Firebase', 'error');
    }
  };

  const handleEditRealisasiOp = async () => {
    const updatedMap = { ...realisasiOpLockedMap, [selectedDate]: false };
    try {
      await updateAkuntanConfigDoc({ realisasiOpLockedMap: updatedMap });
      setRealisasiOpLockedMap(updatedMap);
      triggerToast(`Mode revisi Realisasi Operasional tanggal ${selectedDate} aktif. Harga Riil dapat diedit kembali.`);
    } catch (err: any) {
      console.error('Gagal membuka kunci Realisasi Operasional:', err);
      triggerToast(err?.message || 'Gagal membuka kunci Realisasi Operasional di Firebase', 'error');
    }
  };

  // Real-time listeners from Firestore operational store (tanpa localStorage)
  useEffect(() => {
    const syncConfig = () => {
      const cfg = getAkuntanConfigsSnapshot();
      setIsRabBahanBakuLocked(Boolean(cfg.rabBbLocked));
      setIsRabOpBarangLocked(Boolean(cfg.rabOpLocked));
      setIsOperasionalLainnyaLocked(Boolean(cfg.opLainnyaLocked));
      setRealisasiBbLockedMap(cfg.realisasiBbLockedMap || {});
      setRealisasiOpLockedMap(cfg.realisasiOpLockedMap || {});
      if (cfg.rabOpBarangConfigured) setRabOperasionalBarang(getRabOpBarangSnapshot());
      if (cfg.gajiKaryawanConfigured) setGajiKaryawan(getGajiKaryawanSnapshot());
      if (cfg.picLembagaConfigured) setInsentifPicLembaga(normalizePicSchools(getPicLembagaSnapshot()));
      if (cfg.picPosyanduConfigured) setInsentifPicPosyandu(normalizePicPosyandu(getPicPosyanduSnapshot()));
      if (cfg.opLainnyaConfigured) setOperasionalLainnya(normalizeOpLainnya(getOpLainnyaSnapshot()));
    };

    const unsubs = [
      subscribeOperationalSlice('akuntanConfigs', syncConfig),
      subscribeOperationalSlice('rabBahanBaku', () => {
        const items = getRabBahanBakuSnapshot().filter((it) => it.tanggalPelaksanaan === selectedDate);
        if (items.length > 0) setRabBahanBaku(items);
      }),
      subscribeOperationalSlice('rabOpBarang', () => {
        if (getAkuntanConfigsSnapshot().rabOpBarangConfigured) {
          setRabOperasionalBarang(getRabOpBarangSnapshot());
        }
      }),
      subscribeOperationalSlice('gajiKaryawan', () => {
        if (getAkuntanConfigsSnapshot().gajiKaryawanConfigured) {
          setGajiKaryawan(getGajiKaryawanSnapshot());
        }
      }),
      subscribeOperationalSlice('picLembaga', () => {
        if (getAkuntanConfigsSnapshot().picLembagaConfigured) {
          setInsentifPicLembaga(normalizePicSchools(getPicLembagaSnapshot()));
        }
      }),
      subscribeOperationalSlice('picPosyandu', () => {
        if (getAkuntanConfigsSnapshot().picPosyanduConfigured) {
          setInsentifPicPosyandu(normalizePicPosyandu(getPicPosyanduSnapshot()));
        }
      }),
      subscribeOperationalSlice('gajiStaf', () => {
        setGajiStaf(getGajiStafSnapshot());
      }),
      subscribeOperationalSlice('opLainnya', () => {
        if (getAkuntanConfigsSnapshot().opLainnyaConfigured) {
          setOperasionalLainnya(normalizeOpLainnya(getOpLainnyaSnapshot()));
        }
      }),
      subscribeOperationalSlice('insentifFasilitas', () => {
        const live = getInsentifFasilitasSnapshot();
        if (live.length > 0) setInsentifFasilitas(live);
      }),
      subscribeOperationalSlice('realisasiBb', () => {
        const live = getRealisasiBbSnapshot();
        if (live.length > 0) setRealisasiBahanBaku(live);
      }),
      subscribeOperationalSlice('realisasiOp', () => {
        const live = getRealisasiOpSnapshot();
        if (live.length > 0) setRealisasiOperasional(live);
      })
    ];
    return () => unsubs.forEach((u) => u());
  }, [selectedDate, normalizeOpLainnya, normalizePicPosyandu, normalizePicSchools]);

  // Selected item state for preview modals
  const [selectedSlipKaryawan, setSelectedSlipKaryawan] = useState<GajiKaryawanRecord | null>(null);
  const [selectedSlipStaf, setSelectedSlipStaf] = useState<GajiStafRecord | null>(null);
  const [selectedKwitansi, setSelectedKwitansi] = useState<InsentifPicRecord | null>(null);
  const [selectedBeritaAcara, setSelectedBeritaAcara] = useState<InsentifFasilitasRecord | null>(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [isSyncing, setIsSyncing] = useState(false);

  // Refs keeping latest state for stable callbacks without re-triggering auto-sync useEffect loops
  const akuntanStateRef = React.useRef({
    selectedDate,
    realisasiBbLockedMap,
    realisasiOpLockedMap,
    rabBahanBaku,
    rabOperasionalBarang,
    realisasiBahanBaku,
    realisasiOperasional,
    insentifFasilitas,
    totalPm: beneficiaryInfo.totalPm
  });
  akuntanStateRef.current = {
    selectedDate,
    realisasiBbLockedMap,
    realisasiOpLockedMap,
    rabBahanBaku,
    rabOperasionalBarang,
    realisasiBahanBaku,
    realisasiOperasional,
    insentifFasilitas,
    totalPm: beneficiaryInfo.totalPm
  };

  // Auto Data Integration / Sync function: "Tarik Data Kedatangan Barang" tersinkron per tanggal aktif
  const handleTarikDataKedatanganBarang = React.useCallback(
    async (
      targetJenis: 'Bahan Baku' | 'Operasional',
      isAuto: boolean = false,
      targetDateParam?: string
    ) => {
      const {
        selectedDate: currentSelectedDate,
        realisasiBbLockedMap: currentBbLockedMap,
        realisasiOpLockedMap: currentOpLockedMap,
        rabBahanBaku: currentRabBahanBaku,
        rabOperasionalBarang: currentRabOpBarang,
        realisasiBahanBaku: currentRealisasiBb,
        realisasiOperasional: currentRealisasiOp
      } = akuntanStateRef.current;

      const targetDate = targetDateParam || currentSelectedDate;
      const lockedForDate =
        targetJenis === 'Bahan Baku'
          ? Boolean(currentBbLockedMap[targetDate])
          : Boolean(currentOpLockedMap[targetDate]);

      if (lockedForDate) {
        if (!isAuto) {
          triggerToast(
            `Data ${targetJenis} tanggal ${targetDate} sudah terkunci. Klik "Edit Data" terlebih dahulu untuk menyinkronkan ulang.`
          );
        }
        return;
      }

      try {
        if (!isAuto) setIsSyncing(true);
        let incomingItems: any[] = [];

        try {
          const res = await fetch('/api/v1/barang-datang');
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
              incomingItems = json.data;
            }
          }
        } catch (_) {}

        // Gabungkan data kedatangan barang langsung dari Firestore operational store
        const firestoreIncoming = getBarangDatangSnapshot();
        if (Array.isArray(firestoreIncoming) && firestoreIncoming.length > 0) {
          if (incomingItems.length === 0) {
            incomingItems = firestoreIncoming;
          } else {
            const existingIds = new Set(incomingItems.map((it: any) => it.id));
            firestoreIncoming.forEach((it: any) => {
              if (!existingIds.has(it.id)) incomingItems.push(it);
            });
          }
        }

        if (targetJenis === 'Bahan Baku') {
          const filtered = incomingItems.filter((item: any) => {
            const itemDate = item.tanggal || item.tanggalMasuk || '';
            const isBb = item.jenisBarang === 'Bahan Baku' || !item.jenisBarang;
            return isBb && itemDate === targetDate;
          });

          if (filtered.length === 0) {
            if (!isAuto) {
              triggerToast(`Belum ada data kedatangan Bahan Baku pada tanggal ${targetDate}.`);
            }
          } else {
            const otherDates = currentRealisasiBb.filter((p) => p.tanggal !== targetDate);
            const existingForDate = currentRealisasiBb.filter((p) => p.tanggal === targetDate);

            const syncedForDate: RealisasiBahanBakuItem[] = filtered.map((item: any, idx: number) => {
              const nama = item.namaBarang || 'Bahan Baku';
              const existingMatch = existingForDate.find(
                (e) => e.idKedatangan === item.id || e.namaBarang.toLowerCase().trim() === nama.toLowerCase().trim()
              );
              const matchedRab = currentRabBahanBaku.find((r) =>
                r.namaBarang.toLowerCase().includes(nama.toLowerCase()) ||
                nama.toLowerCase().includes(r.namaBarang.toLowerCase())
              );
              const qtyRiil = Number(item.jumlahMasuk) || 0;
              const qtyRencana =
                matchedRab?.pembulatan !== undefined
                  ? Number(matchedRab.pembulatan)
                  : matchedRab?.totalKebutuhanKg || existingMatch?.jumlahRencana || qtyRiil;
              const hargaRencana = matchedRab?.hargaSatuan ?? existingMatch?.hargaSatuanRencana ?? 0;
              const hargaRiil =
                existingMatch && existingMatch.hargaSatuanRiil > 0
                  ? existingMatch.hargaSatuanRiil
                  : hargaRencana;
              const totalRencana = matchedRab?.totalAnggaran ?? Math.round(qtyRencana * hargaRencana);
              const totalRiil = Math.round(qtyRiil * hargaRiil);
              const selisih = totalRiil - totalRencana;

              let statusKesesuaian: RealisasiBahanBakuItem['statusKesesuaian'] = 'Sesuai';
              if (totalRiil === totalRencana) statusKesesuaian = 'Sesuai';
              else if (hargaRiil !== hargaRencana && qtyRiil === qtyRencana) statusKesesuaian = 'Harga Berubah';
              else if (totalRiil > totalRencana) statusKesesuaian = 'Lebih';
              else statusKesesuaian = 'Kurang';

              return {
                id: existingMatch?.id || generateUniqueDocId(`RLS_BB_${targetDate}`),
                idKedatangan: item.id || `BD-${targetDate}-${idx}`,
                tanggal: targetDate,
                namaBarang: nama,
                satuan: item.satuan || matchedRab?.satuan || 'Kg',
                jumlahRencana: qtyRencana,
                jumlahRealisasi: qtyRiil,
                hargaSatuanRencana: hargaRencana,
                hargaSatuanRiil: hargaRiil,
                totalRencana,
                totalRealisasi: totalRiil,
                selisih,
                persentaseRealisasi: totalRencana > 0 ? Number(((totalRiil / totalRencana) * 100).toFixed(1)) : 100,
                kualitas: item.kualitas || item.kualitasProduk || 'Baik',
                supplier:
                  item.supplier ||
                  (item.keterangan?.includes('Supplier') ? item.keterangan : 'Penyedia Bahan SPPG'),
                petugasPenerima: item.petugas || 'Petugas Gudang',
                statusKesesuaian
              };
            });

            const untouchedManualRows = existingForDate.filter(
              (e) =>
                !syncedForDate.some(
                  (s) => s.idKedatangan === e.idKedatangan || s.namaBarang.toLowerCase().trim() === e.namaBarang.toLowerCase().trim()
                )
            );
            const nextForDate = [...syncedForDate, ...untouchedManualRows];
            await replaceAkuntanDocsForPredicate('akuntan_realisasi_bb', nextForDate, existingForDate);
            setRealisasiBahanBaku([...nextForDate, ...otherDates]);

            if (!isAuto) {
              triggerToast(
                `Berhasil menyinkronkan ${filtered.length} item kedatangan Bahan Baku tanggal ${targetDate} ke Firebase!`
              );
            }
          }
        } else {
          const filtered = incomingItems.filter((item: any) => {
            const itemDate = item.tanggal || item.tanggalMasuk || '';
            return item.jenisBarang === 'Operasional' && itemDate === targetDate;
          });

          if (filtered.length === 0) {
            if (!isAuto) {
              triggerToast(`Belum ada data kedatangan Operasional pada tanggal ${targetDate}.`);
            }
          } else {
            const otherDates = currentRealisasiOp.filter((p) => p.tanggal !== targetDate);
            const existingForDate = currentRealisasiOp.filter((p) => p.tanggal === targetDate);

            const syncedForDate: RealisasiOperasionalItem[] = filtered.map((item: any, idx: number) => {
              const nama = item.namaBarang || 'Barang Operasional';
              const existingMatch = existingForDate.find(
                (e) => e.id === `RLS-OP-${targetDate}-${item.id}` || e.namaBarang.toLowerCase().trim() === nama.toLowerCase().trim()
              );
              const matchedRab = currentRabOpBarang.find((r) =>
                r.namaBarang.toLowerCase().includes(nama.toLowerCase()) ||
                nama.toLowerCase().includes(r.namaBarang.toLowerCase())
              );
              const qtyRiil = Number(item.jumlahMasuk) || 0;
              const existingHarga = existingMatch ? getHargaRiilOperasional(existingMatch) : 0;
              const hargaRiil = existingHarga > 0 ? existingHarga : matchedRab?.hargaSatuan ?? 0;
              const biayaRiil = qtyRiil > 0 ? Math.round(qtyRiil * hargaRiil) : Math.round(hargaRiil);
              const anggaranRab = matchedRab?.totalAnggaran ?? existingMatch?.anggaranRab ?? 0;

              return {
                id: existingMatch?.id || generateUniqueDocId(`RLS_OP_${targetDate}`),
                tanggal: targetDate,
                namaBarang: nama,
                kategori: matchedRab?.kategori || 'Operasional Dapur',
                jumlahRiil: qtyRiil,
                satuan: item.satuan || matchedRab?.satuan || 'Pcs',
                hargaSatuanRiil: hargaRiil,
                biayaRiil,
                anggaranRab,
                selisih: biayaRiil - anggaranRab,
                supplierPetugas: item.petugas || item.supplier || 'Petugas Gudang / Penyedia',
                keterangan: item.keterangan || 'Sinkronisasi Kedatangan Barang'
              };
            });

            const untouchedManualRows = existingForDate.filter(
              (e) =>
                !syncedForDate.some(
                  (s) => s.id === e.id || s.namaBarang.toLowerCase().trim() === e.namaBarang.toLowerCase().trim()
                )
            );
            const nextForDate = [...syncedForDate, ...untouchedManualRows];
            await replaceAkuntanDocsForPredicate('akuntan_realisasi_op', nextForDate, existingForDate);
            setRealisasiOperasional([...nextForDate, ...otherDates]);

            if (!isAuto) {
              triggerToast(
                `Berhasil menyinkronkan ${filtered.length} item kedatangan Operasional tanggal ${targetDate} ke Firebase!`
              );
            }
          }
        }
      } catch (err: any) {
        console.error('Error syncing kedatangan barang:', err);
        if (!isAuto) {
          triggerToast(err?.message || 'Gagal menyinkronkan data kedatangan barang ke Firebase.', 'error');
        }
      } finally {
        if (!isAuto) {
          setTimeout(() => setIsSyncing(false), 500);
        }
      }
    },
    []
  );

  // Sinkronisasi Pagu Formula dari target PM
  const handleTarikDataPaguFormula = () => {
    setIsSyncing(true);
    fetchBeneficiaryForAkuntan(selectedDate);
    setTimeout(() => {
      setIsSyncing(false);
      triggerToast(`Pagu Operasional berhasil disinkronkan: Rp 3.000 × ${beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM = ${formatRupiah(beneficiaryInfo.totalPm * 3000)}`);
    }, 400);
  };

  // Sinkronisasi RAB Bahan Baku dengan Food Cost dari Firestore
  const syncRabBahanBakuWithFoodCost = React.useCallback(async (targetDate: string, isManual: boolean = false) => {
    // 1. Cek apakah ada data RAB Bahan Baku yang telah disimpan di Firestore untuk tanggal ini
    const savedForDate = getRabBahanBakuSnapshot().filter(
      (it) => it.tanggalPelaksanaan === targetDate
    );
    if (savedForDate.length > 0 && !isManual) {
      setRabBahanBaku(savedForDate);
      return;
    }

    if (isManual) {
      setIsSyncing(true);
    }

    try {
      let foodCostItems: any[] = [];

      // A. Ambil dari Nutrition Plans API sesuai tanggal yang dipilih
      try {
        const res = await fetch(`/api/v1/nutrition-plans/by-date/${targetDate}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            if (Array.isArray(json.data.ingredientsData) && json.data.ingredientsData.length > 0) {
              foodCostItems = json.data.ingredientsData;
            } else if (Array.isArray(json.data.items) && json.data.items.length > 0) {
              foodCostItems = json.data.items.map((it: any, idx: number) => ({
                no: idx + 1,
                bahanPangan: it.ingredientName,
                pembulatan: Math.ceil(it.requiredKg || 1),
                satuan: 'kg',
                hargaPerKg: it.pricePerKg || 0,
                totalRequiredKg: it.requiredKg
              }));
            }
          }
        }
      } catch (apiErr) {
        console.error('Error fetching nutrition plan by date:', apiErr);
      }

      // B. Jika belum ada dari API, periksa Firestore collection nutritionPlans
      if (foodCostItems.length === 0) {
        const plans = getNutritionPlansSnapshot();
        const matched = plans.find((p: any) => p.tanggalPelaksanaan === targetDate);
        if (matched && Array.isArray(matched.ingredientsData) && matched.ingredientsData.length > 0) {
          foodCostItems = matched.ingredientsData;
        } else if (matched && Array.isArray(matched.items) && matched.items.length > 0) {
          foodCostItems = matched.items.map((it: any, idx: number) => ({
            no: idx + 1,
            bahanPangan: it.ingredientName,
            pembulatan: Math.ceil(it.requiredKg || 1),
            satuan: 'kg',
            hargaPerKg: it.pricePerKg || 0,
            totalRequiredKg: it.requiredKg
          }));
        }
      }

      // C. Jika di Food Cost BELUM ada data, kembalikan tersimpan jika ada atau kosong []
      if (foodCostItems.length === 0) {
        if (savedForDate.length > 0) {
          setRabBahanBaku(savedForDate);
          if (isManual) {
            triggerToast(`Memuat ${savedForDate.length} bahan baku tersimpan untuk tanggal ${targetDate}.`);
          }
          return;
        }
        setRabBahanBaku([]);
        if (isManual) {
          triggerToast(`Belum ada data perencanaan Food Cost untuk tanggal ${targetDate}. Data RAB Bahan Baku tidak dimunculkan.`);
        }
        return;
      }

      // D. Ambil harga satuan tersimpan dari konfigurasi Firestore
      const existingPriceMap = new Map<string, number>();
      const savedPricesObj = getAkuntanConfigsSnapshot().savedPrices || {};
      Object.entries(savedPricesObj).forEach(([k, v]) => existingPriceMap.set(k.toLowerCase().trim(), Number(v)));

      const newRabBahanBaku: RabBahanBakuItem[] = foodCostItems.map((item: any, idx: number) => {
        const nama = item.bahanPangan || item.ingredientName || `Bahan Baku ${idx + 1}`;
        const cleanName = nama.toLowerCase().trim();
        const existingMatch = savedForDate.find((s) => s.namaBarang.toLowerCase().trim() === cleanName);
        const existingPrice = existingPriceMap.get(cleanName);

        let pembulatanNum = 0;
        if (typeof item.pembulatan === 'number') {
          pembulatanNum = item.pembulatan;
        } else if (typeof item.pembulatan === 'string' && item.pembulatan !== '-') {
          pembulatanNum = parseFloat(item.pembulatan) || 0;
        }
        if (pembulatanNum === 0) {
          pembulatanNum = Number(item.totalWithBufferKg || item.totalRequiredKg || item.requiredKg || 1);
        }

        const satuan = item.satuan || item.unit || 'Kg';
        const hargaSatuan = existingPrice !== undefined ? existingPrice : (Number(item.hargaPerKg) || 0);
        const totalAnggaran = Math.round(pembulatanNum * hargaSatuan);

        return {
          id: existingMatch?.id || generateUniqueDocId(`RAB_BB_${targetDate}`),
          kode: `BB-${String(idx + 1).padStart(2, '0')}`,
          kategori: item.kategori || 'Bahan Pangan',
          namaBarang: nama,
          spesifikasi: `Standar Food Cost SPPG (${satuan})`,
          kebutuhanPorsi: Number(item.porsiBesarNet || item.netWeightGram || 0),
          targetPorsi: akuntanStateRef.current.totalPm,
          totalKebutuhanKg: Number(item.totalRequiredKg || pembulatanNum),
          pembulatan: pembulatanNum,
          satuan: satuan,
          hargaSatuan: hargaSatuan,
          totalAnggaran: totalAnggaran,
          tanggalPelaksanaan: targetDate,
          keterangan: `Disinkronkan dari Food Cost (${pembulatanNum} ${satuan})`
        };
      });

      await replaceAkuntanDocsForPredicate('akuntan_rab_bahan_baku', newRabBahanBaku, savedForDate);
      setRabBahanBaku(newRabBahanBaku);
      if (isManual) {
        triggerToast(`Berhasil menarik ${newRabBahanBaku.length} bahan baku dari menu Food Cost & disimpan ke Firebase!`);
      }
    } catch (err: any) {
      console.error('Error tarik food cost:', err);
      if (isManual) {
        triggerToast(err?.message || 'Gagal menyinkronkan data food cost ke Firebase.', 'error');
      }
    } finally {
      if (isManual) {
        setIsSyncing(false);
      }
    }
  }, []);

  // Tarik Data dari Menu Food Cost (Tombol Manual)
  const handleTarikDataFoodCost = () => {
    if (isRabBahanBakuLocked) {
      triggerToast('Data RAB Bahan Baku sedang terkunci. Klik tombol "Edit Data" terlebih dahulu jika ingin merevisi.');
      return;
    }
    syncRabBahanBakuWithFoodCost(selectedDate, true);
  };

  // Handler pengisian dan pengeditan RAB Bahan Baku (Nama, Jumlah, Harga Satuan)
  const handleUpdateNamaBarang = (itemId: string, newNama: string) => {
    if (isRabBahanBakuLocked) {
      triggerToast('Data RAB Bahan Baku terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    setRabBahanBaku((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        scheduleItemFieldsSync('akuntan_rab_bahan_baku', item.id, { namaBarang: newNama });
        return { ...item, namaBarang: newNama };
      })
    );
  };

  const handleUpdateJumlah = (itemId: string, newJumlah: number) => {
    if (isRabBahanBakuLocked) {
      triggerToast('Data RAB Bahan Baku terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    const val = isNaN(newJumlah) || newJumlah < 0 ? 0 : newJumlah;
    setRabBahanBaku((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const totalAnggaran = Math.round(val * (item.hargaSatuan || 0));
        scheduleItemFieldsSync('akuntan_rab_bahan_baku', item.id, {
          pembulatan: val,
          totalKebutuhanKg: val,
          totalAnggaran
        });
        return {
          ...item,
          pembulatan: val,
          totalKebutuhanKg: val,
          totalAnggaran
        };
      })
    );
  };

  const handleUpdateHargaSatuan = (itemId: string, newHarga: number) => {
    if (isRabBahanBakuLocked) {
      triggerToast('Data RAB Bahan Baku terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    const val = isNaN(newHarga) || newHarga < 0 ? 0 : newHarga;
    let targetName = '';
    setRabBahanBaku((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        targetName = item.namaBarang;
        const p = Number(item.pembulatan !== undefined ? item.pembulatan : (item.totalKebutuhanKg || 1));
        const totalAnggaran = Math.round(p * val);
        scheduleItemFieldsSync('akuntan_rab_bahan_baku', item.id, {
          hargaSatuan: val,
          totalAnggaran
        });
        return {
          ...item,
          hargaSatuan: val,
          totalAnggaran
        };
      })
    );

    if (targetName) {
      const cleanKey = targetName.toLowerCase().trim();
      const currentPrices = { ...(getAkuntanConfigsSnapshot().savedPrices || {}), [cleanKey]: val };
      void updateAkuntanConfigDoc({ savedPrices: currentPrices }).catch((err) => {
        console.error('Gagal update savedPrices ke Firebase:', err);
      });
      void updateNutritionPlanPriceInFirestore(selectedDate, cleanKey, val);
    }
  };

  // Handler pengisian dan pengeditan RAB Operasional Barang (Nama, Jumlah, Harga Satuan)
  const handleUpdateNamaOpBarang = (itemId: string, newNama: string) => {
    if (isRabOpBarangLocked) {
      triggerToast('Data RAB Operasional Barang terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    setRabOperasionalBarang((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        scheduleItemFieldsSync('akuntan_rab_op_barang', item.id, { namaBarang: newNama });
        return { ...item, namaBarang: newNama };
      })
    );
  };

  const handleUpdateSatuanOpBarang = (itemId: string, newSatuan: string) => {
    if (isRabOpBarangLocked) {
      triggerToast('Data RAB Operasional Barang terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    setRabOperasionalBarang((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        scheduleItemFieldsSync('akuntan_rab_op_barang', item.id, { satuan: newSatuan });
        return { ...item, satuan: newSatuan };
      })
    );
  };

  const handleUpdateJumlahOpBarang = (itemId: string, newJumlah: number) => {
    if (isRabOpBarangLocked) {
      triggerToast('Data RAB Operasional Barang terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    const val = isNaN(newJumlah) || newJumlah < 0 ? 0 : newJumlah;
    setRabOperasionalBarang((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const totalAnggaran = Math.round(val * (item.hargaSatuan || 0));
        scheduleItemFieldsSync('akuntan_rab_op_barang', item.id, { jumlah: val, totalAnggaran });
        return { ...item, jumlah: val, totalAnggaran };
      })
    );
  };

  const handleUpdateHargaSatuanOpBarang = (itemId: string, newHarga: number) => {
    if (isRabOpBarangLocked) {
      triggerToast('Data RAB Operasional Barang terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    const val = isNaN(newHarga) || newHarga < 0 ? 0 : newHarga;
    setRabOperasionalBarang((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const totalAnggaran = Math.round((item.jumlah || 0) * val);
        scheduleItemFieldsSync('akuntan_rab_op_barang', item.id, { hargaSatuan: val, totalAnggaran });
        return { ...item, hargaSatuan: val, totalAnggaran };
      })
    );
  };

  // Handler pengisian dan pengeditan Operasional Lainnya (Tanggal, Uraian Pengeluaran, Satuan, Biaya Satuan)
  const handleUpdateTanggalOpLainnya = (itemId: string, newTanggal: string) => {
    if (isOperasionalLainnyaLocked) {
      triggerToast('Data Operasional Lainnya terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    setOperasionalLainnya((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        scheduleItemFieldsSync('akuntan_op_lainnya', item.id, { tanggalTransaksi: newTanggal });
        return { ...item, tanggalTransaksi: newTanggal };
      })
    );
  };

  const handleUpdateNamaPengeluaranOpLainnya = (itemId: string, newNama: string) => {
    if (isOperasionalLainnyaLocked) {
      triggerToast('Data Operasional Lainnya terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    setOperasionalLainnya((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        scheduleItemFieldsSync('akuntan_op_lainnya', item.id, { namaPengeluaran: newNama });
        return { ...item, namaPengeluaran: newNama };
      })
    );
  };

  const handleUpdateSatuanOpLainnya = (itemId: string, newSatuan: string) => {
    if (isOperasionalLainnyaLocked) {
      triggerToast('Data Operasional Lainnya terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    setOperasionalLainnya((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        scheduleItemFieldsSync('akuntan_op_lainnya', item.id, { satuan: newSatuan });
        return { ...item, satuan: newSatuan };
      })
    );
  };

  const handleUpdateBiayaSatuanOpLainnya = (itemId: string, newBiaya: number) => {
    if (isOperasionalLainnyaLocked) {
      triggerToast('Data Operasional Lainnya terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    const val = isNaN(newBiaya) || newBiaya < 0 ? 0 : newBiaya;
    setOperasionalLainnya((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        scheduleItemFieldsSync('akuntan_op_lainnya', item.id, { biayaSatuan: val, jumlahBiaya: val });
        return { ...item, biayaSatuan: val, jumlahBiaya: val };
      })
    );
  };

  const handleUpdateKeteranganOpLainnya = (itemId: string, newKet: string) => {
    if (isOperasionalLainnyaLocked) {
      triggerToast('Data Operasional Lainnya terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    setOperasionalLainnya((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        scheduleItemFieldsSync('akuntan_op_lainnya', item.id, { keterangan: newKet });
        return { ...item, keterangan: newKet };
      })
    );
  };

  const handleUpdatePenanggungJawabOpLainnya = (itemId: string, newPj: string) => {
    if (isOperasionalLainnyaLocked) {
      triggerToast('Data Operasional Lainnya terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    setOperasionalLainnya((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        scheduleItemFieldsSync('akuntan_op_lainnya', item.id, { penanggungJawab: newPj });
        return { ...item, penanggungJawab: newPj };
      })
    );
  };

  const handleUpdateBuktiNotaOpLainnya = (itemId: string, newNota: string) => {
    if (isOperasionalLainnyaLocked) {
      triggerToast('Data Operasional Lainnya terkunci. Klik tombol "Edit Data" untuk merevisi.');
      return;
    }
    setOperasionalLainnya((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        scheduleItemFieldsSync('akuntan_op_lainnya', item.id, { buktiNota: newNota });
        return { ...item, buktiNota: newNota };
      })
    );
  };

  const handleTambahBarisOpLainnya = async () => {
    if (isOperasionalLainnyaLocked) {
      triggerToast('Buka kunci data terlebih dahulu untuk menambah baris pengeluaran.');
      return;
    }
    const newId = generateUniqueDocId('OPL');
    const newItem: OperasionalLainnyaItem = {
      id: newId,
      kodeTransaksi: `TRX-OPL-${Date.now().toString().slice(-6)}`,
      namaPengeluaran: '',
      satuan: 'Bulan',
      biayaSatuan: 0,
      jumlahBiaya: 0,
      tanggalTransaksi: selectedDate || new Date().toISOString().split('T')[0],
      penanggungJawab: 'Staf Administrasi SPPG',
      buktiNota: `NOTA-${Date.now().toString().slice(-4)}`,
      keterangan: 'Pengeluaran operasional dapur'
    };
    try {
      await saveAkuntanItemDoc('akuntan_op_lainnya', newItem);
      await updateAkuntanConfigDoc({ opLainnyaConfigured: true });
      setOperasionalLainnya((prev) => [...prev, newItem]);
      triggerToast('Baris pengeluaran baru berhasil ditambahkan ke Firebase.');
    } catch (err: any) {
      console.error('Gagal menambah baris pengeluaran operasional:', err);
      triggerToast(err?.message || 'Gagal menambah baris pengeluaran ke Firebase', 'error');
    }
  };

  const handleHapusBarisOpLainnya = async (itemId: string) => {
    if (isOperasionalLainnyaLocked) {
      triggerToast('Buka kunci data terlebih dahulu untuk menghapus baris pengeluaran.');
      return;
    }
    try {
      await deleteAkuntanItemDoc('akuntan_op_lainnya', itemId);
      setOperasionalLainnya((prev) => prev.filter((item) => item.id !== itemId));
      triggerToast('Baris pengeluaran berhasil dihapus dari Firebase.');
    } catch (err: any) {
      console.error('Gagal menghapus baris pengeluaran operasional:', err);
      triggerToast(err?.message || 'Gagal menghapus baris pengeluaran dari Firebase', 'error');
    }
  };

  // Sinkronisasi data PIC Sekolah & Posyandu dari data Penerima Manfaat sesuai Skema Tarif
  const handleSyncPicDariPenerimaManfaat = React.useCallback(async (targetDate: string, showToast: boolean = true) => {
    try {
      const res = await fetch(`/api/v1/penerima-manfaat/by-date?tanggal=${targetDate}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.records && Array.isArray(json.records) && json.records.length > 0) {
        const schoolRecs = json.records.filter((r: any) => {
          const cat = (r.kategoriLembaga || '').toLowerCase();
          const inst = (r.namaInstansi || '').toLowerCase();
          return !cat.includes('posyandu') && !cat.includes('3b') && !inst.includes('posyandu') && !inst.includes('3b') && r.kategori !== 'Balita' && r.kategori !== 'Ibu Hamil';
        });

        const posyanduRecs = json.records.filter((r: any) => {
          const cat = (r.kategoriLembaga || '').toLowerCase();
          const inst = (r.namaInstansi || '').toLowerCase();
          return cat.includes('posyandu') || cat.includes('3b') || inst.includes('posyandu') || inst.includes('3b') || r.kategori === 'Balita' || r.kategori === 'Ibu Hamil';
        });

        if (schoolRecs.length > 0) {
          const existingSchools = getPicLembagaSnapshot();
          const mappedSchools: InsentifPicRecord[] = schoolRecs.map((r: any, idx: number) => {
            const pm = Number(r.totalPenerima || 0);
            const { nominal, tierLabel } = hitungInsentifPicSekolah(pm);
            const existing = existingSchools.find(
              (s) => s.lembaga === r.namaInstansi && s.tanggalKwitansi === targetDate
            );
            return {
              id: existing?.id || generateUniqueDocId(`PIC_SCH_${targetDate}`),
              nomorKwitansi: `KWT-SCH/${targetDate.replace(/-/g, '')}/${String(idx + 1).padStart(3, '0')}`,
              namaPic: r.picNama || `PIC ${r.namaInstansi}`,
              nik: `351301${targetDate.replace(/-/g, '').slice(2)}${String(idx + 1).padStart(4, '0')}`,
              lembaga: r.namaInstansi,
              kategori: 'Sekolah / Madrasah',
              jumlahSasaran: pm,
              nominalPerPorsi: pm > 0 ? Math.round(nominal / pm) : 0,
              insentifPokok: nominal,
              uangTransport: 0,
              totalInsentif: nominal,
              tierInfo: tierLabel,
              periode: `Harian (${targetDate})`,
              tanggalKwitansi: targetDate,
              statusBayar: 'Lunas',
              telepon: r.picTelepon || '0812-3456-7890',
              penerimaNama: r.picNama || `PIC ${r.namaInstansi}`
            };
          });
          await replaceAkuntanDocsForPredicate('akuntan_pic_lembaga', mappedSchools, existingSchools);
          setInsentifPicLembaga(mappedSchools);
        }

        if (posyanduRecs.length > 0) {
          const existingPos = getPicPosyanduSnapshot();
          const mappedPosyandu: InsentifPicRecord[] = posyanduRecs.map((r: any, idx: number) => {
            const pm = Number(r.totalPenerima || 0);
            const { nominal, tierLabel } = hitungInsentifPicPosyandu(pm);
            const existing = existingPos.find(
              (s) => s.lembaga === r.namaInstansi && s.tanggalKwitansi === targetDate
            );
            return {
              id: existing?.id || generateUniqueDocId(`PIC_POS_${targetDate}`),
              nomorKwitansi: `KWT-POS/${targetDate.replace(/-/g, '')}/${String(idx + 1).padStart(3, '0')}`,
              namaPic: r.picNama || `Kader ${r.namaInstansi}`,
              nik: `351301${targetDate.replace(/-/g, '').slice(2)}${String(idx + 10).padStart(4, '0')}`,
              lembaga: r.namaInstansi,
              kategori: 'Posyandu / Balita & 3B',
              jumlahSasaran: pm,
              nominalPerPorsi: pm > 0 ? Math.round(nominal / pm) : 0,
              insentifPokok: nominal,
              uangTransport: 0,
              totalInsentif: nominal,
              tierInfo: tierLabel,
              periode: `Harian (${targetDate})`,
              tanggalKwitansi: targetDate,
              statusBayar: 'Lunas',
              telepon: r.picTelepon || '0857-1122-3344',
              penerimaNama: r.picNama || `Kader ${r.namaInstansi}`
            };
          });
          await replaceAkuntanDocsForPredicate('akuntan_pic_posyandu', mappedPosyandu, existingPos);
          setInsentifPicPosyandu(mappedPosyandu);
        }

        if (showToast) {
          await updateAkuntanConfigDoc({
            picLembagaConfigured: true,
            picPosyanduConfigured: true
          });
          triggerToast(`Berhasil menyinkronkan data sasaran penerima manfaat & skema tarif insentif PIC ke Firebase (${targetDate})!`);
        }
      } else {
        if (showToast) {
          triggerToast(`Belum ada data sasaran penerima manfaat untuk tanggal ${targetDate}.`);
        }
      }
    } catch (err: any) {
      console.error('Gagal sync PIC dari penerima manfaat:', err);
      if (showToast) {
        triggerToast(err?.message || 'Gagal menyinkronkan PIC ke Firebase', 'error');
      }
    }
  }, []);

  // Sinkronisasi data Gaji Karyawan dengan Slip Gaji Harian dari Menu Daftar Petugas
  const syncGajiKaryawanFromPetugas = React.useCallback(async (targetDate: string, isAuto: boolean = false) => {
    if (isAuto) {
      const isConfigured = Boolean(getAkuntanConfigsSnapshot().gajiKaryawanConfigured);
      if (!isConfigured) {
        setGajiKaryawan([]);
        return;
      }
    }

    setIsSyncingPetugas(true);
    try {
      const res = await fetch(`/api/petugas/slip-gaji?tanggal=${targetDate}`);
      const json = await res.json();
      let slips: any[] = json.success && Array.isArray(json.data) ? json.data : [];

      if (slips.length === 0 && !isAuto) {
        try {
          const genRes = await fetch('/api/petugas/slip-gaji/batch-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tanggal: targetDate })
          });
          const genJson = await genRes.json();
          if (genJson.success && Array.isArray(genJson.data) && genJson.data.length > 0) {
            slips = genJson.data;
          }
        } catch (_) {}
      }

      if (slips.length === 0 && !isAuto) {
        try {
          const petRes = await fetch('/api/petugas');
          const petJson = await petRes.json();
          if (petJson.success && Array.isArray(petJson.data) && petJson.data.length > 0) {
            const activePetugas = petJson.data.filter((p: any) => p.status === 'Aktif');
            slips = (activePetugas.length > 0 ? activePetugas : petJson.data).map((p: any, idx: number) => ({
              id: generateUniqueDocId(`SLIP_${targetDate}`),
              nomorSlip: `SLIP/SPPG/${targetDate.replace(/-/g, '')}/${String(idx + 1).padStart(3, '0')}`,
              tanggal: targetDate,
              petugasId: p.id,
              nomorPetugas: p.nomor || `PTG-${String(idx + 1).padStart(2, '0')}`,
              namaPetugas: p.nama,
              jabatan: p.jabatan,
              kehadiranHari: 1,
              tarifGajiPerHari: p.besaranGaji || 120000,
              gajiPokokHarian: p.besaranGaji || 120000,
              uangMakanHarian: 0,
              uangTransportHarian: 0,
              uangLemburHarian: 0,
              bonusHarian: 0,
              potonganHarian: 0,
              totalPenghasilanKotor: p.besaranGaji || 120000,
              totalGajiBersih: p.besaranGaji || 120000,
              metodePembayaran: p.namaBank === 'Tunai' ? 'Tunai' : (p.namaBank || 'Transfer Bank'),
              statusPembayaran: 'Lunas',
              tanggalBayar: targetDate
            }));
          }
        } catch (_) {}
      }

      if (slips.length > 0) {
        const existingGaji = getGajiKaryawanSnapshot();
        const mappedKaryawan: GajiKaryawanRecord[] = slips.map((s: any, idx: number) => {
          const kehadiran = Number(s.kehadiranHari !== undefined ? s.kehadiranHari : 1);
          const tarifHarian = Number(s.tarifGajiPerHari || s.gajiPokokHarian || 120000);
          const gajiPokok = Number(s.gajiPokokHarian || Math.round(kehadiran * tarifHarian));
          const tunjanganHadir = Number((s.uangMakanHarian || 0) + (s.uangTransportHarian || 0));
          const uangLembur = Number(s.uangLemburHarian || 0);
          const bonusKinerja = Number(s.bonusHarian || 0);
          const totalPotongan = Number(s.potonganHarian || 0);
          const totalPenerimaan = Number(s.totalPenghasilanKotor || (gajiPokok + tunjanganHadir + uangLembur + bonusKinerja));
          const gajiBersih = Number(s.totalGajiBersih || Math.max(0, totalPenerimaan - totalPotongan));
          const existing = existingGaji.find((g) => g.nomorSlip === s.nomorSlip);

          return {
            id: existing?.id || s.id || generateUniqueDocId(`GK_${targetDate}`),
            nomorSlip: s.nomorSlip || `SLIP/SPPG/${targetDate.replace(/-/g, '')}/${String(idx + 1).padStart(3, '0')}`,
            nik: s.nomorPetugas || s.petugasId || `PTG-${String(idx + 1).padStart(2, '0')}`,
            nama: s.namaPetugas || s.nama || `Petugas ${idx + 1}`,
            jabatan: s.jabatan || 'Petugas Operasional Dapur',
            tipeGaji: 'Harian',
            hariKerja: kehadiran,
            gajiPokok: gajiPokok,
            tunjanganHadir: tunjanganHadir,
            uangLembur: uangLembur,
            bonusKinerja: bonusKinerja,
            potonganBpjs: 0,
            potonganAbsensi: totalPotongan,
            totalPenerimaan: totalPenerimaan,
            totalPotongan: totalPotongan,
            gajiBersih: gajiBersih,
            periode: s.hariTanggalFormatted || `Harian (${targetDate})`,
            tanggalBayar: s.tanggalBayar || s.tanggal || targetDate,
            statusBayar: s.statusPembayaran === 'Lunas' ? 'Lunas' : (s.statusPembayaran || 'Menunggu Verifikasi'),
            rekeningBank: s.metodePembayaran === 'Tunai' ? 'Tunai (Kas Dapur)' : (s.metodePembayaran || 'Transfer Bank')
          };
        });

        await replaceAkuntanDocsForPredicate('akuntan_gaji_karyawan', mappedKaryawan, existingGaji);
        await updateAkuntanConfigDoc({ gajiKaryawanConfigured: true });
        setGajiKaryawan(mappedKaryawan);
        if (!isAuto) {
          triggerToast(`Berhasil menyinkronkan ${mappedKaryawan.length} slip gaji harian petugas & disimpan ke Firebase!`);
        }
      } else {
        if (!isAuto) {
          triggerToast('Data slip gaji harian petugas belum tersedia di menu Daftar Petugas.');
        }
      }
    } catch (err: any) {
      console.error('Error syncing slip gaji harian petugas:', err);
      if (!isAuto) {
        triggerToast(err?.message || 'Gagal menyinkronkan data slip gaji petugas ke Firebase.', 'error');
      }
    } finally {
      setIsSyncingPetugas(false);
    }
  }, []);

  // Auto-sinkronisasi Food Cost & Realisasi saat tanggal aktif berubah
  useEffect(() => {
    syncRabBahanBakuWithFoodCost(selectedDate, false);
    handleTarikDataKedatanganBarang('Bahan Baku', true, selectedDate);
    handleTarikDataKedatanganBarang('Operasional', true, selectedDate);
    const cfg = getAkuntanConfigsSnapshot();
    if (cfg.gajiKaryawanConfigured) {
      syncGajiKaryawanFromPetugas(selectedDate, true);
    }
    if (cfg.picLembagaConfigured) {
      handleSyncPicDariPenerimaManfaat(selectedDate, false);
    }
  }, [
    selectedDate,
    syncRabBahanBakuWithFoodCost,
    handleTarikDataKedatanganBarang,
    syncGajiKaryawanFromPetugas,
    handleSyncPicDariPenerimaManfaat
  ]);

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
        title: 'Rekap Gaji Karyawan (Rincian Petugas)',
        badge: 'RINCIAN PETUGAS',
        icon: Users,
        breadcrumbs: ['AKUNTAN', 'RAB OPERASIONAL', 'JASA', 'GAJI KARYAWAN', 'RINCIAN PETUGAS'],
        description: 'Daftar rincian kehadiran dan penghasilan harian tenaga kerja dapur SPPG per petugas yang masuk/hadir.'
      };
    }

    if (path.includes('/akuntan/rab-operasional/jasa/gaji-karyawan/slip-gaji')) {
      return {
        key: 'slip-gaji-karyawan',
        title: 'Rekap Gaji Harian per Tanggal',
        badge: 'REKAP HARIAN PER TANGGAL',
        icon: Receipt,
        breadcrumbs: ['AKUNTAN', 'RAB OPERASIONAL', 'JASA', 'GAJI KARYAWAN', 'REKAP HARIAN'],
        description: 'Rekapitulasi total karyawan masuk dalam satu baris sesuai tanggal operasional dengan total gaji pokok dan total gaji bersih.'
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

    if (path.includes('/akuntan/cetak-laporan')) {
      return {
        key: 'cetak-laporan',
        title: 'Cetak Laporan Keuangan Terpadu Akuntan',
        badge: 'CETAK LAPORAN',
        icon: Printer,
        breadcrumbs: ['AKUNTAN', 'CETAK LAPORAN'],
        description: 'Preview dokumen lengkap serta Cetak A4 dan Export PDF seluruh data Akuntan: RAB Bahan Baku, RAB Operasional (seluruh sub menu), Realisasi Bahan Baku, dan Realisasi Operasional.'
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

  // Global calculations for KPIs terintegrasi dengan data valid Penerima Manfaat
  const paguBahanBakuValid = useMemo(() => {
    return (beneficiaryInfo.porsiBesar * 10000) + (beneficiaryInfo.porsiKecil * 8000);
  }, [beneficiaryInfo]);

  const paguOperasionalValid = useMemo(() => {
    return beneficiaryInfo.totalPm * 3000;
  }, [beneficiaryInfo]);

  // Pagu Sewa Fasilitas Dapur: Rp 2.000 × total Penerima Manfaat (Sesuai Dashboard Akuntan)
  const paguSewaFasilitasValid = useMemo(() => {
    return beneficiaryInfo.totalPm * 2000;
  }, [beneficiaryInfo]);

  const paguKeseluruhanValid = useMemo(() => {
    return (beneficiaryInfo.porsiBesar * 15000) + (beneficiaryInfo.porsiKecil * 13000);
  }, [beneficiaryInfo]);

  const totalAnggaranRabBb = useMemo(() => rabBahanBaku.reduce((acc, c) => acc + (c.totalAnggaran || 0), 0), [rabBahanBaku]);
  // Sisa Pagu Anggaran = Pagu Bahan Baku - Total Anggaran Belanja
  // Apabila total belanja melebihi batas pagu, nilai sisa pagu menjadi negatif (melebihi batas pagu / defisit)
  const sisaPaguBb = paguBahanBakuValid - totalAnggaranRabBb;
  const isMelebihiPaguBb = sisaPaguBb < 0;
  const sisaAnggaranBb = sisaPaguBb;

  const totalAnggaranRabOp = useMemo(() => rabOperasionalBarang.reduce((acc, c) => acc + c.totalAnggaran, 0), [rabOperasionalBarang]);
  const totalGajiKaryawan = useMemo(() => gajiKaryawan.reduce((acc, c) => acc + c.gajiBersih, 0), [gajiKaryawan]);
  const totalInsentifPicLembaga = useMemo(() => insentifPicLembaga.reduce((a, c) => a + c.totalInsentif, 0), [insentifPicLembaga]);
  const totalInsentifPicPosyandu = useMemo(() => insentifPicPosyandu.reduce((a, c) => a + c.totalInsentif, 0), [insentifPicPosyandu]);
  const totalGajiStaf = useMemo(() => gajiStaf.reduce((acc, c) => acc + c.gajiBersih, 0), [gajiStaf]);
  const totalInsentifPic = useMemo(() => totalInsentifPicLembaga + totalInsentifPicPosyandu, [totalInsentifPicLembaga, totalInsentifPicPosyandu]);

  // Total Insentif Fasilitas & Sisa Pagu Sewa Fasilitas Dapur (Pagu Rp 2.000 × PM)
  const totalInsentifFasilitas = useMemo(() => {
    return insentifFasilitas.reduce((acc, c) => acc + c.totalInsentif, 0);
  }, [insentifFasilitas]);
  const sisaPaguFasilitas = paguSewaFasilitasValid - totalInsentifFasilitas;
  const isMelebihiPaguFasilitas = sisaPaguFasilitas < 0;

  // Handler Sinkronisasi Insentif Fasilitas: Nominal = Rp 2.000 × total PM
  const handleSyncPaguFasilitas = React.useCallback(async (showToast = true) => {
    const calculated = beneficiaryInfo.totalPm * 2000;
    const updated = insentifFasilitas.map((fas) => ({
      ...fas,
      kompensasiBulan: calculated,
      biayaUtilitas: 0,
      totalInsentif: calculated,
      periode: `November 2026 (${beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM @ Rp 2.000)`
    }));
    setInsentifFasilitas(updated);
    try {
      await replaceAkuntanDocsForPredicate('akuntan_insentif_fasilitas', updated, getInsentifFasilitasSnapshot());
      if (showToast) {
        triggerToast(`Berhasil menyinkronkan Insentif Fasilitas ke Firebase: Rp 2.000 × ${beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM = ${formatRupiah(calculated)}`);
      }
    } catch (err: any) {
      console.error('Gagal menyimpan Insentif Fasilitas:', err);
      if (showToast) {
        triggerToast(err?.message || 'Gagal menyinkronkan Insentif Fasilitas ke Firebase', 'error');
      }
    }
  }, [beneficiaryInfo.totalPm, insentifFasilitas]);

  // Sinkronisasi otomatis insentif fasilitas jika total PM berubah
  const lastSyncedFasilitasKeyRef = React.useRef<string>('');
  useEffect(() => {
    const currentFasilitas = akuntanStateRef.current.insentifFasilitas;
    if (beneficiaryInfo.totalPm <= 0 || currentFasilitas.length === 0) return;
    const calculated = beneficiaryInfo.totalPm * 2000;
    const needsUpdate = currentFasilitas.some((fas) => fas.totalInsentif !== calculated);
    const syncKey = `${beneficiaryInfo.totalPm}:${currentFasilitas.length}`;
    if (!needsUpdate || lastSyncedFasilitasKeyRef.current === syncKey) return;

    lastSyncedFasilitasKeyRef.current = syncKey;
    const updated = currentFasilitas.map((fas) => ({
      ...fas,
      kompensasiBulan: calculated,
      biayaUtilitas: 0,
      totalInsentif: calculated,
      periode: `November 2026 (${beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM @ Rp 2.000)`
    }));
    setInsentifFasilitas(updated);
    void replaceAkuntanDocsForPredicate(
      'akuntan_insentif_fasilitas',
      updated,
      getInsentifFasilitasSnapshot()
    ).catch((err) => {
      console.error('Gagal auto-sync Insentif Fasilitas ke Firebase:', err);
    });
  }, [beneficiaryInfo.totalPm, insentifFasilitas.length]);

  // Kalkulasi semua total anggaran operasional: Rab Op. Barang, Gaji Karyawan, Insentif PIC Sekolah, Insentif PIC Posyandu, Operasional Lainnya
  const totalOperasionalLainnya = useMemo(() => {
    return operasionalLainnya.reduce((acc, c) => acc + c.jumlahBiaya, 0);
  }, [operasionalLainnya]);

  const totalAkumulasiOperasional = useMemo(() => {
    return totalAnggaranRabOp + totalGajiKaryawan + totalInsentifPicLembaga + totalInsentifPicPosyandu + totalOperasionalLainnya;
  }, [totalAnggaranRabOp, totalGajiKaryawan, totalInsentifPicLembaga, totalInsentifPicPosyandu, totalOperasionalLainnya]);

  // Sinkronisasi dengan Pagu Harian Operasional (Rp 3.000 × Jumlah PM)
  const sisaPaguOperasional = paguOperasionalValid - totalAkumulasiOperasional;
  const isMelebihiPaguOperasional = sisaPaguOperasional < 0;

  const totalRealisasiBb = useMemo(() => filteredRealisasiBb.reduce((acc, c) => acc + c.totalRealisasi, 0), [filteredRealisasiBb]);
  const efisiensiBb = useMemo(() => totalAnggaranRabBb - totalRealisasiBb, [totalAnggaranRabBb, totalRealisasiBb]);

  // Komponen Pagu Harian Operasional SPPG & Sinkronisasi Komponen Operasional
  const renderPaguOperasionalSection = (activeSubmenuTitle: string) => {
    return (
      <div className="space-y-3">
        {/* Banner Pagu Harian Operasional */}
        <div className="bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-transparent border-2 border-sky-500/60 dark:border-sky-500/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-md">
                2. PAGU HARIAN OPERASIONAL SPPG
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                (Alokasi: Rp 3.000 / PM)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                Menu: {activeSubmenuTitle}
              </span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <div className="text-2xl font-black text-sky-950 dark:text-sky-200 tracking-tight">
                {formatRupiah(paguOperasionalValid)}
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isMelebihiPaguOperasional
                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-700'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
              }`}>
                {isMelebihiPaguOperasional
                  ? `Sisa Pagu: -Rp ${Math.abs(sisaPaguOperasional).toLocaleString('id-ID')} (Defisit)`
                  : `Sisa Pagu: +${formatRupiah(sisaPaguOperasional)} (Surplus)`}
              </span>
            </div>
            <div className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 flex-wrap">
              <span>Formula: Rp 3.000 × {beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM = {formatRupiah(paguOperasionalValid)}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Target: {beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM (Tgl {selectedDate})</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={handleTarikDataPaguFormula}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              title="Sinkronisasi formula pagu operasional"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : `⚡ Sinkron Pagu (${formatRupiah(paguOperasionalValid)})`}</span>
            </button>
          </div>
        </div>

        {/* Ringkasan Kalkulasi Pos Pengeluaran Operasional SPPG */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className={`p-2.5 rounded-xl border transition-all ${
            activeSubmenuTitle.includes('Barang')
              ? 'bg-sky-50/80 dark:bg-sky-950/60 border-sky-400 dark:border-sky-600 ring-2 ring-sky-400/20'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80'
          }`}>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>📦</span>
              <span>1. Op. Barang</span>
            </div>
            <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">{formatRupiah(totalAnggaranRabOp)}</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            activeSubmenuTitle.includes('Karyawan')
              ? 'bg-sky-50/80 dark:bg-sky-950/60 border-sky-400 dark:border-sky-600 ring-2 ring-sky-400/20'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80'
          }`}>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>👨‍🍳</span>
              <span>2. Gaji Karyawan</span>
            </div>
            <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">{formatRupiah(totalGajiKaryawan)}</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            activeSubmenuTitle.includes('Sekolah')
              ? 'bg-sky-50/80 dark:bg-sky-950/60 border-sky-400 dark:border-sky-600 ring-2 ring-sky-400/20'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80'
          }`}>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>🏫</span>
              <span>3. PIC Sekolah</span>
            </div>
            <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">{formatRupiah(totalInsentifPicLembaga)}</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            activeSubmenuTitle.includes('Posyandu')
              ? 'bg-sky-50/80 dark:bg-sky-950/60 border-sky-400 dark:border-sky-600 ring-2 ring-sky-400/20'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80'
          }`}>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>👶</span>
              <span>4. PIC Posyandu</span>
            </div>
            <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">{formatRupiah(totalInsentifPicPosyandu)}</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            activeSubmenuTitle.includes('Lainnya')
              ? 'bg-sky-50/80 dark:bg-sky-950/60 border-sky-400 dark:border-sky-600 ring-2 ring-sky-400/20'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80'
          }`}>
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>🪙</span>
              <span>5. Op. Lainnya</span>
            </div>
            <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5">{formatRupiah(totalOperasionalLainnya)}</div>
          </div>

          <div className={`p-2.5 rounded-xl border transition-all ${
            isMelebihiPaguOperasional
              ? 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800'
              : 'bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-800'
          }`}>
            <div className={`text-[10px] font-bold ${isMelebihiPaguOperasional ? 'text-red-700 dark:text-red-400' : 'text-teal-700 dark:text-teal-300'}`}>
              Total Akumulasi
            </div>
            <div className={`text-xs font-black mt-0.5 ${isMelebihiPaguOperasional ? 'text-red-700 dark:text-red-400' : 'text-teal-900 dark:text-teal-200'}`}>
              {formatRupiah(totalAkumulasiOperasional)}
            </div>
          </div>
        </div>

        {/* Peringatan jika Total Keseluruhannya Melebihi Pagu Operasional */}
        {isMelebihiPaguOperasional && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-red-50 dark:bg-red-950/70 border-2 border-red-500 rounded-2xl text-xs text-red-950 dark:text-red-100 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/80 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />
              </div>
              <div>
                <div className="font-black text-red-700 dark:text-red-400 text-sm flex items-center gap-2 flex-wrap">
                  <span>Total Anggaran Melebihi Batas Pagu operasional</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100 border border-red-300 dark:border-red-700">
                    Defisit: -Rp {Math.abs(sisaPaguOperasional).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-[11px] text-red-800/90 dark:text-red-300/90 mt-0.5 leading-relaxed">
                  Total akumulasi operasional (Rab Op. Barang + Gaji Karyawan + Insentif PIC Sekolah + Insentif PIC Posyandu + Operasional Lainnya = <strong>{formatRupiah(totalAkumulasiOperasional)}</strong>) telah melebihi Pagu Harian Operasional (<strong>{formatRupiah(paguOperasionalValid)}</strong>). Nilai sisa pagu operasional saat ini: <span className="font-bold text-red-700 dark:text-red-400">-Rp {Math.abs(sisaPaguOperasional).toLocaleString('id-ID')}</span>.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3 border ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-100 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.msg}</span>
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
            {/* Filter Tanggal Terintegrasi Penerima Manfaat */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDate(val);
                  void updateAkuntanConfigDoc({ selectedDate: val }).catch((err) => {
                    console.error('Gagal menyimpan tanggal terpilih ke Firebase:', err);
                  });
                }}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                title="Pilih tanggal untuk sinkronisasi Penerima Manfaat & Food Cost"
              />
              <button
                type="button"
                onClick={() => fetchBeneficiaryForAkuntan(selectedDate)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-all cursor-pointer"
                title="Refresh sinkronisasi data Penerima Manfaat"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingBeneficiary ? 'animate-spin text-teal-600' : ''}`} />
              </button>
            </div>

            {/* Tombol Tarik Data Food Cost untuk Menu RAB Bahan Baku */}
            {routeMeta.key === 'rab-bahan-baku' && (
              <button
                type="button"
                onClick={handleTarikDataFoodCost}
                disabled={isSyncing}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                title="Tarik data Nama Bahan Baku, Pembulatan dan Satuan dari menu Food Cost"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'Menyinkronkan...' : '⚡ Tarik Data Food Cost'}</span>
              </button>
            )}

            {/* Sinkronisasi Slip Petugas Button */}
            {(routeMeta.key === 'rekap-gaji-karyawan' || routeMeta.key === 'slip-gaji-karyawan') && (
              <button
                type="button"
                onClick={() => syncGajiKaryawanFromPetugas(selectedDate, false)}
                disabled={isSyncingPetugas}
                className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                title="Sinkronkan data dengan slip gaji harian dan absensi petugas di menu Daftar Petugas"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPetugas ? 'animate-spin' : ''}`} />
                <span>{isSyncingPetugas ? 'Menyinkronkan Slip...' : '⚡ Sinkronkan Slip Petugas'}</span>
              </button>
            )}

            {/* Realisasi Sync Button (Spesifikasi Teknis #3) */}
            {(routeMeta.key === 'realisasi-bahan-baku' || routeMeta.key === 'realisasi-operasional') && (() => {
              const isLockedNow =
                routeMeta.key === 'realisasi-bahan-baku' ? isRealisasiBbLocked : isRealisasiOpLocked;
              return (
                <button
                  type="button"
                  onClick={() =>
                    handleTarikDataKedatanganBarang(
                      routeMeta.key === 'realisasi-bahan-baku' ? 'Bahan Baku' : 'Operasional'
                    )
                  }
                  disabled={isSyncing || isLockedNow}
                  className={`px-4 py-2 font-bold rounded-2xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 ${
                    isLockedNow
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-teal-500/20'
                  }`}
                  title={
                    isLockedNow
                      ? 'Buka kunci dengan tombol "Edit Data" terlebih dahulu untuk menyinkronkan ulang'
                      : `Tarik data kedatangan barang tanggal ${selectedDate} secara real-time`
                  }
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : '⚡ Tarik Data Kedatangan Barang'}</span>
                </button>
              );
            })()}

            {/* Tombol Sinkronisasi Pagu Sewa Fasilitas Dapur */}
            {(routeMeta.key === 'berita-acara-fasilitas' || routeMeta.key === 'rekap-fasilitas') && (
              <button
                type="button"
                onClick={() => handleSyncPaguFasilitas(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                title="Sesuaikan insentif fasilitas: Rp 2.000 × total PM"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>⚡ Sinkron Pagu Sewa ({formatRupiah(paguSewaFasilitasValid)})</span>
              </button>
            )}

            {/* Quick Export Button */}
            <button
              type="button"
              onClick={() => {
                if (routeMeta.key === 'slip-gaji-karyawan' || routeMeta.key === 'rekap-gaji-karyawan') {
                  generateSlipGajiExcel(gajiKaryawan, 'Gaji Karyawan');
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
              onClick={() => onNavigate('/akuntan/rab-operasional/jasa/operasional-lainnya')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/akuntan/rab-operasional/jasa/operasional-lainnya')
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Op. Lainnya
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
            <button
              onClick={() => onNavigate('/akuntan/cetak-laporan')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/akuntan/cetak-laporan')
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              🖨️ Cetak Laporan
            </button>
          </div>
        </div>
      </div>


      {/* VIEW 1: RAB BAHAN BAKU */}
      {routeMeta.key === 'rab-bahan-baku' && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          {/* Header Formula Banner disinkronkan dengan Penerima Manfaat */}
          <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border-2 border-teal-500/60 dark:border-teal-500/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded-md">
                  1. RAB BAHAN BAKU
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  (Pagu Harian Bahan Pokok SPPG: {formatRupiah(paguBahanBakuValid)})
                </span>
              </div>
              <div className="text-2xl font-black text-teal-950 dark:text-teal-200 tracking-tight">
                {formatRupiah(paguBahanBakuValid)}
              </div>
              <div className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 flex items-center gap-1.5 flex-wrap">
                <span>
                  Formula: Porsi Besar ({beneficiaryInfo.porsiBesar.toLocaleString('id-ID')} × Rp 10.000 = {formatRupiah(beneficiaryInfo.porsiBesar * 10000)}) + Porsi Kecil ({beneficiaryInfo.porsiKecil.toLocaleString('id-ID')} × Rp 8.000 = {formatRupiah(beneficiaryInfo.porsiKecil * 8000)})
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Target: {beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM (Tgl {selectedDate})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTarikDataFoodCost}
              disabled={isSyncing || isRabBahanBakuLocked}
              className={`px-4 py-2 font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 self-start md:self-center ${
                isRabBahanBakuLocked
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-teal-500/20'
              }`}
              title={isRabBahanBakuLocked ? 'Buka kunci dengan tombol "Edit Data" terlebih dahulu untuk menarik data baru' : 'Tarik data Nama Bahan Baku, Pembulatan, dan Satuan dari Menu Food Cost'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : '⚡ Tarik Data Food Cost'}</span>
            </button>
          </div>

          {/* Status Alert Banner: Terkunci vs Mode Edit */}
          {isRabBahanBakuLocked ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    Status Data: Terkunci (Tersimpan)
                  </div>
                  <div className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
                    Data RAB Bahan Baku telah tersimpan dan aman dari perubahan tak disengaja. Klik tombol <strong>"Edit Data"</strong> di kanan untuk merevisi harga satuan.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEditRabBahanBaku}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 self-start sm:self-center"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit / Revisi Data</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50/50 dark:from-teal-950/40 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-800/60 rounded-2xl text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-teal-100 dark:bg-teal-900/60 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Unlock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-teal-900 dark:text-teal-200">
                    Status Data: Mode Edit Aktif
                  </div>
                  <div className="text-[11px] text-teal-700/90 dark:text-teal-300/80">
                    Anda dapat mengisi dan merevisi harga satuan pada kolom tabel di bawah. Setelah selesai, klik tombol <strong>"Simpan Data"</strong> untuk mengunci anggaran.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSimpanRabBahanBaku}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 self-start sm:self-center"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan & Kunci Data</span>
              </button>
            </div>
          )}

          {/* Peringatan Visual jika Nilai Sisa Pagu Negatif (Melebihi Batas Pagu) */}
          {isMelebihiPaguBb && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-red-50 dark:bg-red-950/60 border-2 border-red-500 rounded-2xl text-xs text-red-950 dark:text-red-100 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/80 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="font-black text-red-700 dark:text-red-400 flex items-center gap-2 flex-wrap">
                    <span>PERINGATAN: Total Anggaran Melebihi Batas Pagu Bahan Baku!</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100">
                      Defisit: -Rp {Math.abs(sisaPaguBb).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-[11px] text-red-800/90 dark:text-red-300/90 mt-0.5">
                    Total RAB Bahan Baku ({formatRupiah(totalAnggaranRabBb)}) melampaui Pagu Bahan Baku ({formatRupiah(paguBahanBakuValid)}). Baris sisa anggaran di bawah ditandai warna merah.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <Receipt className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                Rencana Anggaran Belanja (RAB) Bahan Baku Pangan
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                {rabBahanBaku.length} Item Bahan (Total: {formatRupiah(totalAnggaranRabBb)})
              </span>
              {isRabBahanBakuLocked ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <Lock className="w-3 h-3" />
                  Terkunci
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                  <Unlock className="w-3 h-3" />
                  Dapat Diedit
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Tombol Simpan / Edit */}
              {isRabBahanBakuLocked ? (
                <button
                  type="button"
                  onClick={handleEditRabBahanBaku}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  title="Klik untuk membuka kunci dan merevisi harga satuan"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Data</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSimpanRabBahanBaku}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  title="Klik untuk menyimpan dan mengunci data RAB Bahan Baku"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Data</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const headers = ['No', 'Nama Bahan Baku', 'Pembulatan', 'Satuan', 'Harga Satuan (Rp)', 'Total Anggaran (Rp)', 'Keterangan'];
                  const data = rabBahanBaku.map((r, i) => [
                    i + 1,
                    r.namaBarang,
                    r.pembulatan !== undefined ? r.pembulatan : r.totalKebutuhanKg,
                    r.satuan,
                    r.hargaSatuan,
                    r.totalAnggaran,
                    r.keterangan
                  ]);
                  data.push(['', 'TOTAL KESELURUHAN RAB BAHAN BAKU', '', '', '', totalAnggaranRabBb, 'Akumulasi Pembulatan × Harga Satuan']);
                  data.push(['', 'JUMLAH PAGU BAHAN BAKU', '', '', '', paguBahanBakuValid, `PB: ${beneficiaryInfo.porsiBesar} @ 10rb + PK: ${beneficiaryInfo.porsiKecil} @ 8rb`]);
                  data.push(['', 'SISA PAGU ANGGARAN (PAGU − TOTAL)', '', '', '', sisaPaguBb, isMelebihiPaguBb ? 'DEFISIT (Melebihi Batas Pagu)' : 'SURPLUS (Di Bawah Batas Pagu)']);
                  exportTableToExcel(data, headers, `RAB_Bahan_Baku_${selectedDate}`, 'RAB Bahan Baku');
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
                  <th className="py-3 px-3">Nama Bahan Baku (Food Cost)</th>
                  <th className="py-3 px-3 text-right">Pembulatan</th>
                  <th className="py-3 px-3 text-center">Satuan</th>
                  <th className="py-3 px-3 text-right min-w-[150px]">
                    {isRabBahanBakuLocked ? 'Harga Satuan (Rp)' : 'Harga Satuan (Rp) [Diisi Akuntan]'}
                  </th>
                  <th className="py-3 px-3 text-right">Total Anggaran (Rp)</th>
                  <th className="py-3 px-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rabBahanBaku.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-300 flex items-center justify-center shadow-xs">
                          <UtensilsCrossed className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                            Belum Ada Data Food Cost untuk Tanggal Ini ({selectedDate})
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Data RAB Bahan Baku disinkronkan langsung dari menu Perencanaan Menu & Food Cost. Jika belum ada perencanaan menu dan kebutuhan bahan pangan pada tanggal <strong>{selectedDate}</strong>, tabel RAB Bahan Baku tidak akan menampilkan data.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
                          <button
                            type="button"
                            onClick={handleTarikDataFoodCost}
                            disabled={isSyncing}
                            className="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>Periksa Ulang Food Cost</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate('/perencanaan-menu')}
                            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Buka Perencanaan Menu</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rabBahanBaku.map((item, idx) => {
                    const pembulatanVal = item.pembulatan !== undefined ? item.pembulatan : (item.totalKebutuhanKg || 0);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          {isRabBahanBakuLocked ? (
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">{item.namaBarang}</div>
                              <div className="text-[10px] text-slate-400 font-medium">{item.spesifikasi || `Standar SPPG`}</div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={item.namaBarang}
                                placeholder="Nama bahan baku..."
                                onChange={(e) => handleUpdateNamaBarang(item.id, e.target.value)}
                                className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 outline-hidden shadow-2xs focus:ring-2 focus:ring-teal-500/20"
                              />
                              <div className="text-[10px] text-slate-400 font-medium pl-1">{item.spesifikasi || `Standar SPPG`}</div>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isRabBahanBakuLocked ? (
                            <div className="font-black text-slate-900 dark:text-slate-100 text-xs">
                              {typeof pembulatanVal === 'number' ? pembulatanVal.toLocaleString('id-ID') : pembulatanVal}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 shadow-2xs focus-within:ring-2 focus-within:ring-teal-500/20">
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={pembulatanVal === 0 ? '' : pembulatanVal}
                                placeholder="0"
                                onChange={(e) => handleUpdateJumlah(item.id, parseFloat(e.target.value) || 0)}
                                className="w-20 text-right text-xs font-black text-slate-900 dark:text-slate-100 bg-transparent outline-hidden"
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.satuan}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isRabBahanBakuLocked ? (
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 shadow-2xs font-bold text-slate-800 dark:text-slate-100">
                              <span>{formatRupiah(item.hargaSatuan)}</span>
                              <Lock className="w-3 h-3 text-amber-500 shrink-0" title="Terkunci (Klik Edit Data untuk merevisi)" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 shadow-2xs focus-within:ring-2 focus-within:ring-teal-500/20">
                              <span className="text-[10px] font-bold text-slate-400">Rp</span>
                              <input
                                type="number"
                                min="0"
                                step="500"
                                value={item.hargaSatuan === 0 ? '' : item.hargaSatuan}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  handleUpdateHargaSatuan(item.id, val);
                                }}
                                className="w-24 text-right text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent outline-hidden"
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-teal-700 dark:text-teal-400">
                          {formatRupiah(item.totalAnggaran)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">{item.keterangan}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                {/* Baris 1: Total Keseluruhan RAB Bahan Baku */}
                <tr className="bg-slate-50 dark:bg-slate-800/70 font-black text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    TOTAL KESELURUHAN RAB BAHAN BAKU:
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-black text-teal-800 dark:text-teal-300">
                    {formatRupiah(totalAnggaranRabBb)}
                  </td>
                  <td className="py-3 px-3 text-[10px] font-bold text-slate-500">
                    Akumulasi Pembulatan × Harga Satuan
                  </td>
                </tr>

                {/* Baris 2: Jumlah Pagu Bahan Baku */}
                <tr className="bg-teal-50/60 dark:bg-teal-950/40 font-black text-teal-950 dark:text-teal-200 border-b border-teal-200 dark:border-teal-900">
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    JUMLAH PAGU BAHAN BAKU:
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-black text-teal-900 dark:text-teal-200">
                    {formatRupiah(paguBahanBakuValid)}
                  </td>
                  <td className="py-3 px-3 text-[10px] font-bold text-teal-700 dark:text-teal-400">
                    PB: {beneficiaryInfo.porsiBesar.toLocaleString('id-ID')} × 10rb + PK: {beneficiaryInfo.porsiKecil.toLocaleString('id-ID')} × 8rb
                  </td>
                </tr>

                {/* Baris 3: Sisa Pagu Anggaran (Indikator Visual Merah jika Negatif / Melebihi Batas Pagu) */}
                <tr className={`font-black transition-colors ${
                  isMelebihiPaguBb
                    ? 'bg-red-50 dark:bg-red-950/70 text-red-950 dark:text-red-100 border-t-2 border-b-2 border-red-500'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 border-b-2 border-emerald-500'
                }`}>
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    <div className="flex flex-col items-end">
                      <span className={isMelebihiPaguBb ? 'text-red-700 dark:text-red-400 font-black' : 'text-emerald-800 dark:text-emerald-300 font-black'}>
                        SISA PAGU ANGGARAN (PAGU − TOTAL):
                      </span>
                      <span className={`text-[10px] font-semibold ${isMelebihiPaguBb ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {isMelebihiPaguBb ? '⚠️ Nilai sisa pagu negatif (melebihi batas pagu bahan baku)' : '✓ Anggaran belanja terjaga di bawah batas pagu'}
                      </span>
                    </div>
                  </td>
                  <td className={`py-3 px-3 text-right text-sm font-black ${
                    isMelebihiPaguBb ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {isMelebihiPaguBb ? `-Rp ${Math.abs(sisaPaguBb).toLocaleString('id-ID')}` : `+${formatRupiah(sisaPaguBb)}`}
                  </td>
                  <td className="py-3 px-3">
                    {isMelebihiPaguBb ? (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/80 dark:text-red-200 dark:border-red-700 shadow-xs animate-pulse">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                          DEFISIT (Melebihi Pagu)
                        </span>
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                          Melebihi {formatRupiah(Math.abs(sisaPaguBb))}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/80 dark:text-emerald-200 dark:border-emerald-700 shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          SURPLUS (Di Bawah Pagu)
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          Sisa Saldo {formatRupiah(sisaPaguBb)}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: RAB OPERASIONAL BARANG */}
      {routeMeta.key === 'rab-op-barang' && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          {/* Header Pagu Harian Operasional & Sinkronisasi 5 Komponen */}
          {renderPaguOperasionalSection('RAB Operasional Pengadaan Barang')}

          {/* Status Alert Banner RAB Operasional Barang: Terkunci vs Mode Edit */}
          {isRabOpBarangLocked ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    Status Data: Terkunci (Tersimpan)
                  </div>
                  <div className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
                    Data RAB Operasional Barang telah tersimpan dan dikunci. Klik tombol <strong>"Edit Data"</strong> untuk merevisi nama barang, satuan, jumlah, atau harga satuan.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEditRabOpBarang}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 self-start sm:self-center"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit / Revisi Data</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50/50 dark:from-teal-950/40 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-800/60 rounded-2xl text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-teal-100 dark:bg-teal-900/60 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Unlock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-teal-900 dark:text-teal-200">
                    Status Data: Mode Edit Aktif
                  </div>
                  <div className="text-[11px] text-teal-700/90 dark:text-teal-300/80">
                    Anda dapat mengedit nama barang, satuan, jumlah, dan harga satuan secara langsung. Klik tombol <strong>"Simpan Data"</strong> untuk mengunci anggaran.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSimpanRabOpBarang}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 self-start sm:self-center"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan & Kunci Data</span>
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <Boxes className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                RAB Operasional Pengadaan Barang Dapur
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                {rabOperasionalBarang.length} Item Operasional (Total: {formatRupiah(totalAnggaranRabOp)})
              </span>
              {isRabOpBarangLocked ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <Lock className="w-3 h-3" />
                  Terkunci
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                  <Unlock className="w-3 h-3" />
                  Dapat Diedit
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isRabOpBarangLocked && (
                <button
                  type="button"
                  onClick={handleTambahBarisOpBarang}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                  title="Tambah barang operasional baru"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span>Tambah Barang</span>
                </button>
              )}
              {isRabOpBarangLocked ? (
                <button
                  type="button"
                  onClick={handleEditRabOpBarang}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  title="Klik untuk membuka kunci dan merevisi data RAB Operasional"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Data</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSimpanRabOpBarang}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  title="Klik untuk menyimpan dan mengunci data RAB Operasional"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Data</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const headers = ['No', 'Kode', 'Nama Barang Operasional', 'Satuan', 'Jumlah', 'Harga Satuan (Rp)', 'Total Anggaran (Rp)', 'Periode'];
                  const data = rabOperasionalBarang.map((r, i) => [i + 1, r.kode, r.namaBarang, r.satuan, r.jumlah, r.hargaSatuan, r.totalAnggaran, r.periode]);
                  data.push(['', 'TOTAL ANGGARAN OPERASIONAL BARANG', '', '', '', '', totalAnggaranRabOp, 'RAB Op Barang']);
                  data.push(['', 'TOTAL AKUMULASI POS OPERASIONAL', '', '', '', '', totalAkumulasiOperasional, 'Barang+Gaji+PIC']);
                  data.push(['', 'PAGU HARIAN OPERASIONAL SPPG', '', '', '', '', paguOperasionalValid, `Rp 3.000 × ${beneficiaryInfo.totalPm} PM`]);
                  data.push(['', 'SISA PAGU OPERASIONAL', '', '', '', '', sisaPaguOperasional, isMelebihiPaguOperasional ? 'DEFISIT (Melebihi Pagu)' : 'SURPLUS']);
                  exportTableToExcel(data, headers, 'RAB_Operasional_Barang_SPPG', 'RAB Op Barang');
                  triggerToast('RAB Operasional Barang berhasil diekspor!');
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
                  <th className="py-3 px-3">Nama Barang Operasional</th>
                  <th className="py-3 px-3 text-center w-28">Satuan</th>
                  <th className="py-3 px-3 text-right w-28">Jumlah</th>
                  <th className="py-3 px-3 text-right">Harga Satuan</th>
                  <th className="py-3 px-3 text-right">Total Anggaran</th>
                  <th className="py-3 px-3">Keterangan</th>
                  {!isRabOpBarangLocked && <th className="py-3 px-3 text-center w-12">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rabOperasionalBarang.length === 0 ? (
                  <tr>
                    <td colSpan={isRabOpBarangLocked ? 7 : 8} className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-300 flex items-center justify-center shadow-xs">
                          <Boxes className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                            RAB Operasional Barang Belum Diatur
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Data RAB Operasional Barang masih kosong karena belum diatur atau diisi oleh admin. Klik tombol di bawah untuk mulai menyusun daftar pengadaan barang operasional dapur.
                          </p>
                        </div>
                        {!isRabOpBarangLocked && (
                          <button
                            type="button"
                            onClick={handleTambahBarisOpBarang}
                            className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/20 active:scale-95 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            <span>+ Tambah Barang Operasional</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  rabOperasionalBarang.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        {isRabOpBarangLocked ? (
                          <span className="font-bold text-slate-900 dark:text-slate-100">{item.namaBarang}</span>
                        ) : (
                          <input
                            type="text"
                            value={item.namaBarang}
                            placeholder="Nama barang operasional..."
                            onChange={(e) => handleUpdateNamaOpBarang(item.id, e.target.value)}
                            className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 outline-hidden shadow-2xs focus:ring-2 focus:ring-teal-500/20"
                          />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isRabOpBarangLocked ? (
                          <span className="font-bold text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs inline-block">
                            {item.satuan}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={item.satuan}
                            placeholder="Satuan..."
                            onChange={(e) => handleUpdateSatuanOpBarang(item.id, e.target.value)}
                            className="w-24 text-center text-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 outline-hidden shadow-2xs focus:ring-2 focus:ring-teal-500/20"
                          />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isRabOpBarangLocked ? (
                          <span className="font-black text-slate-900 dark:text-slate-100">
                            {item.jumlah.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.jumlah === 0 ? '' : item.jumlah}
                            placeholder="0"
                            onChange={(e) => handleUpdateJumlahOpBarang(item.id, parseFloat(e.target.value) || 0)}
                            className="w-20 text-right text-xs font-black text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 shadow-2xs outline-hidden focus:ring-2 focus:ring-teal-500/20 inline-block"
                          />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isRabOpBarangLocked ? (
                          <span className="font-medium">{formatRupiah(item.hargaSatuan)}</span>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 shadow-2xs focus-within:ring-2 focus-within:ring-teal-500/20">
                            <span className="text-[10px] font-bold text-slate-400">Rp</span>
                            <input
                              type="number"
                              min="0"
                              step="500"
                              value={item.hargaSatuan === 0 ? '' : item.hargaSatuan}
                              placeholder="0"
                              onChange={(e) => handleUpdateHargaSatuanOpBarang(item.id, parseFloat(e.target.value) || 0)}
                              className="w-24 text-right text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent outline-hidden"
                            />
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                        {formatRupiah(item.totalAnggaran)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{item.keterangan}</td>
                      {!isRabOpBarangLocked && (
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleHapusBarisOpBarang(item.id)}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 rounded-lg transition-all cursor-pointer"
                            title="Hapus baris barang operasional"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
                {/* Baris Total Op Barang */}
                <tr className="bg-slate-50 dark:bg-slate-800/70 font-black text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    TOTAL ANGGARAN OPERASIONAL BARANG:
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-black text-sky-800 dark:text-sky-300">
                    {formatRupiah(totalAnggaranRabOp)}
                  </td>
                  <td className="py-3 px-3 text-[10px] text-slate-500 font-bold">RAB Pengadaan Barang</td>
                </tr>
                {/* Baris Total Akumulasi Gabungan Pos Operasional */}
                <tr className="bg-sky-50/70 dark:bg-sky-950/40 font-black text-sky-950 dark:text-sky-200 border-b border-sky-200 dark:border-sky-900">
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    TOTAL AKUMULASI POS OPERASIONAL (BARANG + GAJI + PIC + OP. LAINNYA):
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-black text-sky-900 dark:text-sky-200">
                    {formatRupiah(totalAkumulasiOperasional)}
                  </td>
                  <td className="py-3 px-3 text-[10px] text-sky-700 dark:text-sky-400 font-bold">Total Gabungan Operasional</td>
                </tr>
                {/* Baris Pagu Harian Operasional */}
                <tr className="bg-blue-50/50 dark:bg-blue-950/30 font-black text-blue-950 dark:text-blue-200 border-b border-blue-200 dark:border-blue-900">
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    PAGU HARIAN OPERASIONAL SPPG:
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-black text-blue-900 dark:text-blue-200">
                    {formatRupiah(paguOperasionalValid)}
                  </td>
                  <td className="py-3 px-3 text-[10px] text-blue-700 dark:text-blue-400 font-bold">Rp 3.000 × {beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM</td>
                </tr>
                {/* Baris Sisa Pagu Operasional dengan Indikator Merah saat Negatif */}
                <tr className={`font-black transition-colors ${
                  isMelebihiPaguOperasional
                    ? 'bg-red-50 dark:bg-red-950/70 text-red-950 dark:text-red-100 border-b-2 border-red-500'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 border-b-2 border-emerald-500'
                }`}>
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    <div className="flex flex-col items-end">
                      <span className={isMelebihiPaguOperasional ? 'text-red-700 dark:text-red-400 font-black' : 'text-emerald-800 dark:text-emerald-300 font-black'}>
                        SISA PAGU OPERASIONAL (PAGU − TOTAL AKUMULASI):
                      </span>
                      <span className={`text-[10px] font-semibold ${isMelebihiPaguOperasional ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {isMelebihiPaguOperasional ? '⚠️ Total Anggaran Melebihi Batas Pagu operasional' : '✓ Total operasional terjaga di bawah pagu'}
                      </span>
                    </div>
                  </td>
                  <td className={`py-3 px-3 text-right text-sm font-black ${
                    isMelebihiPaguOperasional ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {isMelebihiPaguOperasional ? `-Rp ${Math.abs(sisaPaguOperasional).toLocaleString('id-ID')}` : `+${formatRupiah(sisaPaguOperasional)}`}
                  </td>
                  <td className="py-3 px-3">
                    {isMelebihiPaguOperasional ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/80 dark:text-red-200 dark:border-red-700 shadow-xs animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                        DEFISIT OPERASIONAL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/80 dark:text-emerald-200 dark:border-emerald-700 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        SURPLUS OPERASIONAL
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: GAJI KARYAWAN (REKAP & SLIP GAJI) */}
      {(routeMeta.key === 'rekap-gaji-karyawan' || routeMeta.key === 'slip-gaji-karyawan') && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header Pagu Harian Operasional & Sinkronisasi 5 Komponen */}
          {renderPaguOperasionalSection('Gaji Karyawan Dapur')}

          {/* Sync Status Banner */}
          <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-cyan-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-400/10 border border-teal-300 dark:border-teal-700 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-900 dark:text-teal-100">
                    Sinkronisasi Slip Gaji Harian Petugas
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
                    Terhubung Database Petugas
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Menampilkan data slip gaji riil untuk tanggal operasional <strong>{selectedDate}</strong> ({gajiKaryawan.length} petugas terdata). Total pengeluaran harian: <strong>{formatRupiah(totalGajiKaryawan)}</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => syncGajiKaryawanFromPetugas(selectedDate, false)}
                disabled={isSyncingPetugas}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 disabled:opacity-50"
                title="Tarik & sinkronkan ulang slip gaji dari menu Daftar Petugas"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPetugas ? 'animate-spin' : ''}`} />
                <span>{isSyncingPetugas ? 'Menyinkronkan...' : '⚡ Sinkronkan Slip Petugas'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                Penggajian Karyawan & Petugas Harian (Sinkron Slip Gaji)
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
                Rincian Petugas
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
                Rekap Gaji Harian (per Tanggal)
              </button>
              <button
                type="button"
                onClick={() => generateSlipGajiExcel(gajiKaryawan, `Gaji Karyawan ${selectedDate}`)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Mode 1: REKAP GAJI HARIAN (SATU BARIS SESUAI TANGGAL) */}
          {routeMeta.key === 'slip-gaji-karyawan' ? (
            <div className="space-y-4">
              {/* Highlight Card Ringkasan Total Karyawan Masuk */}
              <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border border-teal-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-teal-900 dark:text-teal-200">
                      Rekapitulasi Total Karyawan Masuk per Tanggal
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      Menampilkan total karyawan yang masuk dalam satu baris terpadu sesuai tanggal operasional SPPG.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Total Masuk: <strong>{gajiKaryawan.length} Petugas</strong>
                  </span>
                </div>
              </div>

              {/* Tabel Rekap Gaji Harian: Hanya Menampilkan Total Karyawan Masuk dalam Satu Baris Sesuai Tanggalnya */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3 w-12 text-center">No</th>
                      <th className="py-3 px-4">Tanggal Operasional</th>
                      <th className="py-3 px-4 text-center">Total Karyawan Masuk</th>
                      <th className="py-3 px-4 text-right">Total Gaji Pokok</th>
                      <th className="py-3 px-4 text-right">Total Gaji Bersih (THP)</th>
                      <th className="py-3 px-3 text-center">Status Pembayaran</th>
                      <th className="py-3 px-4 text-center">Aksi Dokumen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {gajiKaryawan.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 px-4 text-center">
                          <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-teal-600 dark:text-teal-300 flex items-center justify-center shadow-xs">
                              <Users className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                Data Gaji Karyawan Belum Diatur untuk Tanggal Ini ({selectedDate})
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Rekap gaji karyawan masih kosong karena belum diatur atau disinkronkan dari menu Daftar Petugas. Klik tombol di bawah untuk menarik slip gaji harian petugas.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => syncGajiKaryawanFromPetugas(selectedDate, false)}
                              disabled={isSyncingPetugas}
                              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPetugas ? 'animate-spin' : ''}`} />
                              <span>{isSyncingPetugas ? 'Menyinkronkan...' : '⚡ Sinkronkan Slip Petugas'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-3 text-center font-bold text-slate-500">1</td>
                        <td className="py-3.5 px-4 font-black text-slate-900 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-teal-600" />
                            <span>
                              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-normal">
                            ISO: {selectedDate}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {gajiKaryawan.length} Karyawan Masuk
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {formatRupiah(gajiKaryawan.reduce((sum, item) => sum + (item.gajiPokok || 0), 0))}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-teal-800 dark:text-teal-300 text-base">
                          {formatRupiah(totalGajiKaryawan)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                            <Check className="w-3 h-3" />
                            Lunas / Siap Dicairkan
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => generateSlipGajiExcel(gajiKaryawan, `Rekap Harian ${selectedDate}`)}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Export Excel Rekap Gaji Harian"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Excel</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onNavigate('/akuntan/rab-operasional/jasa/gaji-karyawan/rekap-gaji')}
                              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                              title="Lihat rincian per karyawan"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Rincian</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-teal-50/70 dark:bg-teal-950/40 font-black text-teal-950 dark:text-teal-200 border-t-2 border-teal-500 text-xs">
                    <tr>
                      <td colSpan={2} className="py-3 px-4 uppercase tracking-wider">
                        TOTAL REKAP HARIAN GAJI:
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-black text-emerald-800 dark:text-emerald-300">
                        {gajiKaryawan.length} Petugas Hadir
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatRupiah(gajiKaryawan.reduce((sum, item) => sum + (item.gajiPokok || 0), 0))}
                      </td>
                      <td className="py-3 px-4 text-right text-base font-black text-teal-800 dark:text-teal-300">
                        {formatRupiah(totalGajiKaryawan)}
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-center text-[11px] text-teal-700 dark:text-teal-300 font-bold">
                        1 Baris per Tanggal ({selectedDate})
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            /* Mode 2: TABEL REKAP GAJI KARYAWAN (RINCIAN PER PETUGAS TANPA KOLOM MAKAN, LEMBUR, POTONGAN) */
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">Nama Petugas</th>
                    <th className="py-3 px-3">Jabatan & Divisi</th>
                    <th className="py-3 px-2 text-center">Hadir</th>
                    <th className="py-3 px-3 text-right">Gaji Pokok (Hari)</th>
                    <th className="py-3 px-3 text-right">Gaji Bersih (THP)</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {gajiKaryawan.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-teal-600 dark:text-teal-300 flex items-center justify-center shadow-xs">
                            <Users className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                              Rincian Petugas Belum Diatur
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                              Data rincian petugas masih kosong. Klik tombol di bawah untuk menyinkronkan slip gaji harian petugas dari menu Daftar Petugas.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => syncGajiKaryawanFromPetugas(selectedDate, false)}
                            disabled={isSyncingPetugas}
                            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPetugas ? 'animate-spin' : ''}`} />
                            <span>{isSyncingPetugas ? 'Menyinkronkan...' : '⚡ Sinkronkan Slip Petugas'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    gajiKaryawan.map((rec, idx) => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{rec.nama}</div>
                        <div className="text-[10px] text-slate-400">NIK: {rec.nik} • {rec.nomorSlip}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{rec.jabatan}</div>
                        <div className="text-[10px] text-slate-400">{rec.divisi || 'Dapur & Distribusi'}</div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {rec.kehadiranHari} hr
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">{formatRupiah(rec.gajiPokok)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                        {formatRupiah(rec.gajiBersih)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          rec.statusBayar === 'Sudah Dibayar' || rec.statusBayar === 'Dibayar' || rec.statusBayar === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {rec.statusBayar}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => generateSlipGajiPdf(rec, 'KARYAWAN')}
                            className="px-2 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            title="Cetak Slip Gaji PDF"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSlipKaryawan(rec)}
                            className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            title="Preview Slip Gaji"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
                  <tr className="bg-teal-50/70 dark:bg-teal-950/40 font-black text-teal-950 dark:text-teal-200 border-t-2 border-teal-500">
                    <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                      TOTAL PENGGAJIAN HARIAN PETUGAS (SINKRON SLIP PETUGAS):
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-bold text-slate-800 dark:text-slate-200">
                      {formatRupiah(gajiKaryawan.reduce((sum, item) => sum + (item.gajiPokok || 0), 0))}
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-black text-teal-800 dark:text-teal-300">
                      {formatRupiah(totalGajiKaryawan)}
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-center text-[11px] text-teal-700 dark:text-teal-300 font-bold">
                      {gajiKaryawan.length} Petugas Terdata
                    </td>
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
          {/* Header Pagu Harian Operasional & Sinkronisasi 5 Komponen */}
          {renderPaguOperasionalSection('Insentif PIC Lembaga (Sekolah)')}

          {/* Banner Skema Tarif Insentif PIC Sekolah (Penyesuaian Resmi) */}
          <div className="bg-gradient-to-r from-teal-50 via-indigo-50/50 to-sky-50 dark:from-teal-950/40 dark:via-indigo-950/30 dark:to-sky-950/30 border border-teal-200 dark:border-teal-800 rounded-2xl p-4 space-y-2.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-black uppercase tracking-wider text-teal-900 dark:text-teal-200">
                  Tabel Skema Penyesuaian Insentif PIC Sekolah
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSyncPicDariPenerimaManfaat(selectedDate, true)}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                title="Sinkronkan ulang sasaran PM dari menu Penerima Manfaat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>⚡ Sinkronkan Sasaran Sekolah</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-[10px]">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 font-semibold">&lt; 100 PM</div>
                <div className="font-black text-teal-700 dark:text-teal-400 mt-0.5 text-xs">Rp 20.000</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 font-semibold">101 - 500 PM</div>
                <div className="font-black text-teal-700 dark:text-teal-400 mt-0.5 text-xs">Rp 30.000</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 font-semibold">501 - 750 PM</div>
                <div className="font-black text-teal-700 dark:text-teal-400 mt-0.5 text-xs">Rp 50.000</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 font-semibold">751 - 1.000 PM</div>
                <div className="font-black text-teal-700 dark:text-teal-400 mt-0.5 text-xs">Rp 60.000</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 font-semibold">1.001 - 2.000 PM</div>
                <div className="font-black text-teal-700 dark:text-teal-400 mt-0.5 text-xs">Rp 100.000</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 font-semibold">2.001 - 3.000 PM</div>
                <div className="font-black text-teal-700 dark:text-teal-400 mt-0.5 text-xs">Rp 200.000</div>
              </div>
            </div>
          </div>

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

          {/* Table / Cards PIC Sekolah */}
          {routeMeta.key === 'rekap-pic-lembaga' ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">Nama PIC & Kontak</th>
                    <th className="py-3 px-3">Nama Lembaga Sekolah</th>
                    <th className="py-3 px-3 text-center">Sasaran PM</th>
                    <th className="py-3 px-3">Skema Tier Insentif</th>
                    <th className="py-3 px-3 text-right">Total Insentif</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {insentifPicLembaga.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shadow-xs">
                            <GraduationCap className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                              Data Insentif PIC Sekolah Belum Diatur
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                              Admin belum mengatur atau mengisi data PIC Sekolah untuk tanggal ini. Klik tombol di bawah untuk menarik daftar sekolah dan sasaran penerima manfaat dari menu Penerima Manfaat.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSyncPicDariPenerimaManfaat(selectedDate, true)}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>⚡ Sinkronkan Sasaran Sekolah</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    insentifPicLembaga.map((rec, idx) => {
                      const tier = rec.tierInfo || hitungInsentifPicSekolah(rec.jumlahSasaran).tierLabel;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{rec.namaPic}</div>
                            <div className="text-[10px] text-slate-400">{rec.telepon || '-'} • NIK: {rec.nik}</div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {rec.lembaga}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-900 dark:text-slate-100">
                            {rec.jumlahSasaran.toLocaleString('id-ID')} Siswa
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {tier}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-teal-800 dark:text-teal-300 text-sm">
                            {formatRupiah(rec.totalInsentif)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {rec.statusBayar}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => generateKwitansiPdf(rec)}
                                className="px-2 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Cetak Kwitansi PDF"
                              >
                                <Download className="w-3 h-3" />
                                <span>PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedKwitansi(rec)}
                                className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                title="Lihat Rincian Kwitansi"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  <tr className="bg-teal-50/70 dark:bg-teal-950/40 font-black text-teal-950 dark:text-teal-200 border-t-2 border-teal-500">
                    <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                      TOTAL INSENTIF PIC SEKOLAH:
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-black text-teal-800 dark:text-teal-300">
                      {formatRupiah(insentifPicLembaga.reduce((sum, item) => sum + item.totalInsentif, 0))}
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-center text-[11px] text-teal-700 dark:text-teal-300 font-bold">
                      {insentifPicLembaga.length} Sekolah Terdaftar
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            insentifPicLembaga.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shadow-xs">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Kwitansi PIC Sekolah Belum Tersedia
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Data sekolah dan penerima manfaat belum diatur atau disinkronkan untuk tanggal {selectedDate}.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSyncPicDariPenerimaManfaat(selectedDate, true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>⚡ Sinkronkan Sasaran Sekolah</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insentifPicLembaga.map(rec => {
                  const tier = rec.tierInfo || hitungInsentifPicSekolah(rec.jumlahSasaran).tierLabel;
                  return (
                    <div
                      key={rec.id}
                      className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4.5 space-y-3 hover:border-teal-400 transition-all shadow-2xs"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                          {rec.nomorKwitansi}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {rec.statusBayar}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">{rec.namaPic}</h3>
                        <div className="text-xs text-teal-700 dark:text-teal-400 font-bold">{rec.lembaga}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Sasaran: {rec.jumlahSasaran} Siswa/Porsi</div>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Skema Tier:</span>
                          <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {tier}
                          </span>
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
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* VIEW 5: INSENTIF PIC POSYANDU (3B & BALITA) */}
      {(routeMeta.key === 'rekap-pic-posyandu' || routeMeta.key === 'kwitansi-pic-posyandu') && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header Pagu Harian Operasional & Sinkronisasi 5 Komponen */}
          {renderPaguOperasionalSection('Insentif PIC Posyandu (3B & Balita)')}

          {/* Banner Skema Tarif Khusus Insentif PIC Posyandu (Penyesuaian Resmi) */}
          <div className="bg-gradient-to-r from-rose-50 via-teal-50/50 to-emerald-50 dark:from-rose-950/40 dark:via-teal-950/30 dark:to-emerald-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 space-y-2.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-black uppercase tracking-wider text-rose-900 dark:text-rose-200">
                  Tabel Skema Penyesuaian Insentif Khusus PIC Posyandu
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSyncPicDariPenerimaManfaat(selectedDate, true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                title="Sinkronkan ulang sasaran Posyandu dari menu Penerima Manfaat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>⚡ Sinkronkan Sasaran Posyandu</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-[10px]">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 font-semibold">&lt; 100 PM</div>
                <div className="font-black text-rose-700 dark:text-rose-400 mt-0.5 text-xs">Rp 60.000</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 font-semibold">101 - 300 PM</div>
                <div className="font-black text-rose-700 dark:text-rose-400 mt-0.5 text-xs">Rp 150.000</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 font-semibold">301 - 500 PM</div>
                <div className="font-black text-rose-700 dark:text-rose-400 mt-0.5 text-xs">Rp 250.000</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 font-semibold">501 - 1.000 PM</div>
                <div className="font-black text-rose-700 dark:text-rose-400 mt-0.5 text-xs">Rp 400.000</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 font-semibold">1.001 - 1.500 PM</div>
                <div className="font-black text-rose-700 dark:text-rose-400 mt-0.5 text-xs">Rp 550.000</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-500 font-semibold">&gt; 1.500 PM</div>
                <div className="font-black text-rose-700 dark:text-rose-400 mt-0.5 text-xs">Rp 700.000</div>
              </div>
            </div>
          </div>

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

          {/* Table / Cards PIC Posyandu */}
          {routeMeta.key === 'rekap-pic-posyandu' ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">Nama Kader PIC</th>
                    <th className="py-3 px-3">Nama Posyandu</th>
                    <th className="py-3 px-3 text-center">Sasaran PM</th>
                    <th className="py-3 px-3">Skema Tier Insentif</th>
                    <th className="py-3 px-3 text-right">Total Insentif</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {insentifPicPosyandu.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300 flex items-center justify-center shadow-xs">
                            <HeartPulse className="w-5 h-5" />
                          </div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                            Belum Ada Data Insentif PIC Posyandu
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            RAB Insentif PIC Posyandu belum diatur untuk tanggal {selectedDate}. Klik tombol di bawah untuk menyinkronkan data kader dan sasaran dari menu Penerima Manfaat.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleSyncPicDariPenerimaManfaat(selectedDate, true)}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>⚡ Sinkronkan Sasaran Posyandu</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    insentifPicPosyandu.map((rec, idx) => {
                      const tier = rec.tierInfo || hitungInsentifPicPosyandu(rec.jumlahSasaran).tierLabel;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{rec.namaPic}</div>
                            <div className="text-[10px] text-slate-400">{rec.telepon || '-'} • NIK: {rec.nik}</div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {rec.lembaga}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black text-slate-900 dark:text-slate-100">
                            {rec.jumlahSasaran.toLocaleString('id-ID')} Balita & Bumil
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              {tier}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-teal-800 dark:text-teal-300 text-sm">
                            {formatRupiah(rec.totalInsentif)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {rec.statusBayar}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => generateKwitansiPdf(rec)}
                                className="px-2 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Cetak Kwitansi PDF"
                              >
                                <Download className="w-3 h-3" />
                                <span>PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedKwitansi(rec)}
                                className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                                title="Lihat Rincian Kwitansi"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  <tr className="bg-teal-50/70 dark:bg-teal-950/40 font-black text-teal-950 dark:text-teal-200 border-t-2 border-teal-500">
                    <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                      TOTAL INSENTIF PIC POSYANDU:
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-black text-teal-800 dark:text-teal-300">
                      {formatRupiah(insentifPicPosyandu.reduce((sum, item) => sum + item.totalInsentif, 0))}
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-center text-[11px] text-teal-700 dark:text-teal-300 font-bold">
                      {insentifPicPosyandu.length} Posyandu Terdaftar
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            insentifPicPosyandu.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300 flex items-center justify-center shadow-xs">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Kwitansi PIC Posyandu Belum Tersedia
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Data posyandu dan sasaran penerima manfaat belum diatur atau disinkronkan untuk tanggal {selectedDate}.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSyncPicDariPenerimaManfaat(selectedDate, true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>⚡ Sinkronkan Sasaran Posyandu</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insentifPicPosyandu.map(rec => {
                  const tier = rec.tierInfo || hitungInsentifPicPosyandu(rec.jumlahSasaran).tierLabel;
                  return (
                    <div
                      key={rec.id}
                      className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4.5 space-y-3 hover:border-teal-400 transition-all shadow-2xs"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                          {rec.nomorKwitansi}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {rec.statusBayar}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">{rec.namaPic}</h3>
                        <div className="text-xs text-rose-700 dark:text-rose-400 font-bold">{rec.lembaga}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Sasaran: {rec.jumlahSasaran} Balita & Ibu Hamil</div>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Skema Tier:</span>
                          <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                            {tier}
                          </span>
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
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* VIEW 7: OPERASIONAL LAINNYA */}
      {routeMeta.key === 'operasional-lainnya' && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          {/* Header Pagu Harian Operasional & Sinkronisasi 5 Komponen Tergabung */}
          {renderPaguOperasionalSection('Operasional Lainnya (Utilitas & Lab)')}

          {/* Status Alert Banner Operasional Lainnya: Terkunci vs Mode Edit */}
          {isOperasionalLainnyaLocked ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    Status Data: Terkunci (Tersimpan)
                  </div>
                  <div className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
                    Data Operasional Lainnya telah tersimpan dan dikunci. Klik tombol <strong>"Edit Data"</strong> untuk merevisi tanggal, uraian pengeluaran, satuan, atau biaya satuan.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEditOperasionalLainnya}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 self-start sm:self-center"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit / Revisi Data</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50/50 dark:from-teal-950/40 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-800/60 rounded-2xl text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-teal-100 dark:bg-teal-900/60 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Unlock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-teal-900 dark:text-teal-200">
                    Status Data: Mode Edit Aktif
                  </div>
                  <div className="text-[11px] text-teal-700/90 dark:text-teal-300/80">
                    Anda dapat mengedit tanggal, uraian pengeluaran, satuan, dan biaya satuan secara langsung. Klik tombol <strong>"Simpan Data"</strong> untuk mengunci anggaran.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSimpanOperasionalLainnya}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 self-start sm:self-center"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan & Kunci Data</span>
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <Coins className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                Pencatatan Biaya Operasional Lainnya (Utilitas & Lab)
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                {operasionalLainnya.length} Transaksi (Total: {formatRupiah(totalOperasionalLainnya)})
              </span>
              {isOperasionalLainnyaLocked ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <Lock className="w-3 h-3" />
                  Terkunci
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                  <Unlock className="w-3 h-3" />
                  Dapat Diedit
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {!isOperasionalLainnyaLocked && (
                <button
                  type="button"
                  onClick={handleTambahBarisOpLainnya}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                  title="Tambah baris pengeluaran baru"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span>Tambah Baris</span>
                </button>
              )}
              {isOperasionalLainnyaLocked ? (
                <button
                  type="button"
                  onClick={handleEditOperasionalLainnya}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  title="Klik untuk membuka kunci dan merevisi data Operasional Lainnya"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Data</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSimpanOperasionalLainnya}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  title="Klik untuk menyimpan dan mengunci data Operasional Lainnya"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Data</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const headers = ['No', 'Tanggal', 'Uraian Pengeluaran', 'Satuan', 'Biaya Satuan (Rp)', 'Total Biaya (Rp)', 'Penanggung Jawab', 'No. Nota / Bukti'];
                  const data = operasionalLainnya.map((r, i) => [
                    i + 1,
                    r.tanggalTransaksi,
                    r.namaPengeluaran,
                    r.satuan || r.kategori || 'Bulan',
                    r.biayaSatuan !== undefined ? r.biayaSatuan : r.jumlahBiaya,
                    r.jumlahBiaya,
                    r.penanggungJawab,
                    r.buktiNota
                  ]);
                  data.push(['', '', 'TOTAL BIAYA OPERASIONAL LAINNYA', '', '', totalOperasionalLainnya, '', 'Op Lainnya']);
                  data.push(['', '', 'TOTAL AKUMULASI POS OPERASIONAL', '', '', totalAkumulasiOperasional, '', 'Barang+Gaji+PIC+Lainnya']);
                  data.push(['', '', 'PAGU HARIAN OPERASIONAL SPPG', '', '', paguOperasionalValid, '', `Rp 3.000 × ${beneficiaryInfo.totalPm} PM`]);
                  data.push(['', '', 'SISA PAGU OPERASIONAL', '', '', sisaPaguOperasional, '', isMelebihiPaguOperasional ? 'DEFISIT' : 'SURPLUS']);
                  exportTableToExcel(data, headers, 'Operasional_Lainnya_SPPG', 'Op Lainnya');
                  triggerToast('Operasional Lainnya berhasil diekspor!');
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
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
                  <th className="py-3 px-3 w-36">Tanggal</th>
                  <th className="py-3 px-3">Uraian Pengeluaran</th>
                  <th className="py-3 px-3 text-center w-28">Satuan</th>
                  <th className="py-3 px-3 text-right w-36">Biaya Satuan</th>
                  <th className="py-3 px-3">Penanggung Jawab</th>
                  <th className="py-3 px-3">No. Nota / Bukti</th>
                  {!isOperasionalLainnyaLocked && <th className="py-3 px-2 text-center w-12">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {operasionalLainnya.length === 0 ? (
                  <tr>
                    <td colSpan={isOperasionalLainnyaLocked ? 7 : 8} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-teal-600 dark:text-teal-300 flex items-center justify-center shadow-xs">
                          <Coins className="w-5 h-5" />
                        </div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          Belum Ada Rincian Operasional Lainnya
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Pos Operasional Lainnya (utilitas listrik, air, lab uji berkala, dll.) belum diatur untuk tanggal {selectedDate}.
                        </p>
                        <button
                          type="button"
                          onClick={handleTambahBarisOpLainnya}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tambah Baris Pengeluaran</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  operasionalLainnya.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      {/* Kolom Tanggal (Paling Depan setelah Nomor) */}
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {isOperasionalLainnyaLocked ? (
                          <div className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.tanggalTransaksi}</span>
                          </div>
                        ) : (
                          <input
                            type="date"
                            value={item.tanggalTransaksi}
                            onChange={(e) => handleUpdateTanggalOpLainnya(item.id, e.target.value)}
                            className="w-32 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 outline-hidden shadow-2xs focus:ring-2 focus:ring-teal-500/20"
                          />
                        )}
                      </td>
                      {/* Kolom Uraian Pengeluaran (Editable) */}
                      <td className="py-2.5 px-3">
                        {isOperasionalLainnyaLocked ? (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{item.namaPengeluaran}</div>
                            <div className="text-[10px] text-slate-400">{item.keterangan}</div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={item.namaPengeluaran}
                              placeholder="Uraian pengeluaran operasional..."
                              onChange={(e) => handleUpdateNamaPengeluaranOpLainnya(item.id, e.target.value)}
                              className="w-full text-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 outline-hidden shadow-2xs focus:ring-2 focus:ring-teal-500/20"
                            />
                            <input
                              type="text"
                              value={item.keterangan || ''}
                              placeholder="Keterangan / rincian..."
                              onChange={(e) => handleUpdateKeteranganOpLainnya(item.id, e.target.value)}
                              className="w-full text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-0.5 outline-hidden"
                            />
                          </div>
                        )}
                      </td>
                      {/* Kolom Satuan (Ganti Kategori Menjadi Satuan Editable) */}
                      <td className="py-2.5 px-3 text-center">
                        {isOperasionalLainnyaLocked ? (
                          <span className="font-bold text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs inline-block">
                            {item.satuan || item.kategori || 'Bulan'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={item.satuan || ''}
                            placeholder="Satuan..."
                            onChange={(e) => handleUpdateSatuanOpLainnya(item.id, e.target.value)}
                            className="w-24 text-center text-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 outline-hidden shadow-2xs focus:ring-2 focus:ring-teal-500/20"
                          />
                        )}
                      </td>
                      {/* Kolom Biaya Satuan (Editable) */}
                      <td className="py-2.5 px-3 text-right">
                        {isOperasionalLainnyaLocked ? (
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 shadow-2xs font-bold text-slate-800 dark:text-slate-100">
                            <span>{formatRupiah(item.biayaSatuan !== undefined ? item.biayaSatuan : item.jumlahBiaya)}</span>
                            <Lock className="w-3 h-3 text-amber-500 shrink-0" title="Terkunci (Klik Edit Data untuk merevisi)" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 shadow-2xs focus-within:ring-2 focus-within:ring-teal-500/20">
                            <span className="text-[10px] font-bold text-slate-400">Rp</span>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={(item.biayaSatuan !== undefined ? item.biayaSatuan : item.jumlahBiaya) === 0 ? '' : (item.biayaSatuan !== undefined ? item.biayaSatuan : item.jumlahBiaya)}
                              placeholder="0"
                              onChange={(e) => handleUpdateBiayaSatuanOpLainnya(item.id, parseFloat(e.target.value) || 0)}
                              className="w-28 text-right text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent outline-hidden"
                            />
                          </div>
                        )}
                      </td>
                      {/* Kolom Penanggung Jawab */}
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {isOperasionalLainnyaLocked ? (
                          item.penanggungJawab
                        ) : (
                          <input
                            type="text"
                            value={item.penanggungJawab}
                            placeholder="Penanggung Jawab..."
                            onChange={(e) => handleUpdatePenanggungJawabOpLainnya(item.id, e.target.value)}
                            className="w-full text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 outline-hidden"
                          />
                        )}
                      </td>
                      {/* Kolom No. Nota / Bukti */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-teal-700 dark:text-teal-400">
                        {isOperasionalLainnyaLocked ? (
                          item.buktiNota
                        ) : (
                          <input
                            type="text"
                            value={item.buktiNota}
                            placeholder="No. Nota..."
                            onChange={(e) => handleUpdateBuktiNotaOpLainnya(item.id, e.target.value)}
                            className="w-full text-xs font-mono text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 outline-hidden"
                          />
                        )}
                      </td>
                      {/* Kolom Aksi saat mode edit */}
                      {!isOperasionalLainnyaLocked && (
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleHapusBarisOpLainnya(item.id)}
                            className="p-1 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer transition-colors"
                            title="Hapus baris pengeluaran ini"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                {/* Baris Total Op Lainnya */}
                <tr className="bg-slate-50 dark:bg-slate-800/70 font-black text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    TOTAL BIAYA OPERASIONAL LAINNYA:
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-black text-sky-800 dark:text-sky-300">
                    {formatRupiah(totalOperasionalLainnya)}
                  </td>
                  <td colSpan={isOperasionalLainnyaLocked ? 2 : 3} className="py-3 px-3 text-[10px] text-slate-500 font-bold">
                    Utilitas, Listrik, Internet & Uji Lab
                  </td>
                </tr>
                {/* Baris Total Akumulasi Gabungan Pos Operasional */}
                <tr className="bg-sky-50/70 dark:bg-sky-950/40 font-black text-sky-950 dark:text-sky-200 border-b border-sky-200 dark:border-sky-900">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    TOTAL AKUMULASI POS OPERASIONAL (BARANG + GAJI + PIC + OP. LAINNYA):
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-black text-sky-900 dark:text-sky-200">
                    {formatRupiah(totalAkumulasiOperasional)}
                  </td>
                  <td colSpan={isOperasionalLainnyaLocked ? 2 : 3} className="py-3 px-3 text-[10px] text-sky-700 dark:text-sky-400 font-bold">
                    Gabungan Seluruh Pos RAB Operasional SPPG
                  </td>
                </tr>
                {/* Baris Pagu Harian Operasional */}
                <tr className="bg-blue-50/50 dark:bg-blue-950/30 font-black text-blue-950 dark:text-blue-200 border-b border-blue-200 dark:border-blue-900">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    PAGU HARIAN OPERASIONAL SPPG (RP 3.000 × PM):
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-black text-blue-900 dark:text-blue-200">
                    {formatRupiah(paguOperasionalValid)}
                  </td>
                  <td colSpan={isOperasionalLainnyaLocked ? 2 : 3} className="py-3 px-3 text-[10px] text-blue-700 dark:text-blue-400 font-bold">
                    Rp 3.000 × {beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM
                  </td>
                </tr>
                {/* Baris Sisa Pagu Operasional dengan Indikator Defisit/Surplus */}
                <tr className={`font-black transition-colors ${
                  isMelebihiPaguOperasional
                    ? 'bg-red-50 dark:bg-red-950/70 text-red-950 dark:text-red-100 border-b-2 border-red-500'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 border-b-2 border-emerald-500'
                }`}>
                  <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                    SISA PAGU OPERASIONAL:
                  </td>
                  <td className={`py-3 px-3 text-right text-sm font-black ${
                    isMelebihiPaguOperasional ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {isMelebihiPaguOperasional
                      ? `-Rp ${Math.abs(sisaPaguOperasional).toLocaleString('id-ID')}`
                      : `+${formatRupiah(sisaPaguOperasional)}`}
                  </td>
                  <td colSpan={isOperasionalLainnyaLocked ? 2 : 3} className="py-3 px-3 text-[10px] font-bold">
                    {isMelebihiPaguOperasional ? 'DEFISIT (Melebihi Batas Pagu Operasional)' : 'SURPLUS (Efisiensi Pagu Terjaga)'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 8: INSENTIF FASILITAS (BERITA ACARA & REKAP) */}
      {(routeMeta.key === 'berita-acara-fasilitas' || routeMeta.key === 'rekap-fasilitas') && (
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          {/* Header Formula Banner Pagu Sewa Fasilitas Dapur SPPG disinkronkan dengan Dashboard Akuntan & Penerima Manfaat */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border-2 border-amber-500/60 dark:border-amber-500/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                  3. PAGU SEWA FASILITAS DAPUR SPPG
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  (Pagu Harian Sewa Fasilitas Dapur: {formatRupiah(paguSewaFasilitasValid)})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                  Alokasi: Rp 2.000 / PM
                </span>
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <div className="text-2xl font-black text-amber-950 dark:text-amber-200 tracking-tight">
                  {formatRupiah(paguSewaFasilitasValid)}
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isMelebihiPaguFasilitas
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-700'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                }`}>
                  {sisaPaguFasilitas === 0
                    ? '✓ 100% Sesuai Pagu Harian'
                    : sisaPaguFasilitas > 0
                    ? `Sisa Pagu: +${formatRupiah(sisaPaguFasilitas)} (Surplus)`
                    : `Sisa Pagu: -Rp ${Math.abs(sisaPaguFasilitas).toLocaleString('id-ID')} (Defisit)`}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 flex-wrap">
                <span>
                  Formula: Rp 2.000 × {beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM = {formatRupiah(paguSewaFasilitasValid)}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Target: {beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM (Tgl {selectedDate})
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  Sinkron dengan Dashboard Akuntan
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                type="button"
                onClick={() => handleSyncPaguFasilitas(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                title="Sesuaikan insentif fasilitas nominal Rp 2.000 × total Penerima Manfaat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>⚡ Sinkron Pagu Sewa ({formatRupiah(paguSewaFasilitasValid)})</span>
              </button>
            </div>
          </div>

          {/* Ringkasan Indikator 4 Metrik Pagu & Realisasi Sewa Fasilitas Dapur */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-amber-600" />
                <span>Pagu Sewa Fasilitas Dapur</span>
              </div>
              <div className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-100 mt-0.5">
                {formatRupiah(paguSewaFasilitasValid)}
              </div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">Dashboard Akuntan</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-500" />
                <span>Total Sasaran PM</span>
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">PB: {beneficiaryInfo.porsiBesar.toLocaleString('id-ID')} | PK: {beneficiaryInfo.porsiKecil.toLocaleString('id-ID')}</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Coins className="w-3 h-3 text-teal-600" />
                <span>Tarif Standar Insentif</span>
              </div>
              <div className="text-sm sm:text-base font-black text-teal-700 dark:text-teal-400 mt-0.5">
                Rp 2.000 / PM
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Per Penerima Manfaat</div>
            </div>

            <div className={`p-3 rounded-2xl border ${
              isMelebihiPaguFasilitas
                ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
            }`}>
              <div className={`text-[10px] font-bold ${isMelebihiPaguFasilitas ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'} flex items-center gap-1`}>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Total Insentif Fasilitas</span>
              </div>
              <div className={`text-sm sm:text-base font-black mt-0.5 ${isMelebihiPaguFasilitas ? 'text-red-900 dark:text-red-100' : 'text-emerald-900 dark:text-emerald-100'}`}>
                {formatRupiah(totalInsentifFasilitas)}
              </div>
              <div className={`text-[10px] mt-0.5 font-bold ${isMelebihiPaguFasilitas ? 'text-red-600' : 'text-emerald-600'}`}>
                {sisaPaguFasilitas === 0 ? '✓ 100% Sesuai Pagu' : sisaPaguFasilitas > 0 ? `Surplus: ${formatRupiah(sisaPaguFasilitas)}` : `Defisit: -${formatRupiah(Math.abs(sisaPaguFasilitas))}`}
              </div>
            </div>
          </div>

          {/* Submenu Toolbar Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                {routeMeta.key === 'rekap-fasilitas' ? 'Tabel Rekapitulasi Insentif Fasilitas' : 'Berita Acara Pemanfaatan Fasilitas SPPG (BAST)'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('/akuntan/insentif-fasilitas/berita-acara')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                  routeMeta.key === 'berita-acara-fasilitas'
                    ? 'bg-amber-600 text-white shadow-2xs'
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
                    ? 'bg-amber-600 text-white shadow-2xs'
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

          {/* KONTEN SUBMENU: JIKA REKAP FASILITAS TAMPILKAN TABEL RINCIAN */}
          {routeMeta.key === 'rekap-fasilitas' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3">No. BAST</th>
                    <th className="py-3 px-3">Nama Fasilitas & Lokasi</th>
                    <th className="py-3 px-3">Pengelola / Penyedia</th>
                    <th className="py-3 px-3 text-center">Sasaran PM</th>
                    <th className="py-3 px-3 text-right">Tarif / PM</th>
                    <th className="py-3 px-3 text-right">Pagu Sewa Fasilitas</th>
                    <th className="py-3 px-3 text-right">Insentif Disetujui</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {insentifFasilitas.map((fas, idx) => (
                    <tr key={fas.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        {fas.nomorBa}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{fas.namaFasilitas}</div>
                        <div className="text-[10px] text-slate-400">{fas.lokasi}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{fas.pemilikPenyedia}</div>
                        <div className="text-[10px] text-slate-400">{fas.pihakKedua}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-black text-slate-900 dark:text-slate-100">
                        {beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-600 dark:text-slate-400">
                        Rp 2.000
                      </td>
                      <td className="py-3 px-3 text-right font-black text-amber-900 dark:text-amber-300">
                        {formatRupiah(paguSewaFasilitasValid)}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(fas.totalInsentif)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {fas.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedBeritaAcara(fas)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer transition-all"
                            title="Lihat Detail BAST"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => generateBeritaAcaraFasilitasPdf(fas)}
                            className="p-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg cursor-pointer transition-all shadow-2xs"
                            title="Download Dokumen PDF BAST"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-amber-50/60 dark:bg-amber-950/40 border-t-2 border-amber-200 dark:border-amber-800 font-black">
                    <td colSpan={4} className="py-3 px-3 text-right text-amber-950 dark:text-amber-200">
                      Total Insentif & Pagu Sewa Fasilitas Dapur ({beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM × Rp 2.000):
                    </td>
                    <td className="py-3 px-3 text-center text-amber-900 dark:text-amber-300">
                      {beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM
                    </td>
                    <td className="py-3 px-3 text-right text-amber-900 dark:text-amber-300">
                      Rp 2.000
                    </td>
                    <td className="py-3 px-3 text-right text-amber-950 dark:text-amber-100 text-sm">
                      {formatRupiah(paguSewaFasilitasValid)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-800 dark:text-emerald-300 text-sm">
                      {formatRupiah(totalInsentifFasilitas)}
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-center text-[10px] text-emerald-700 dark:text-emerald-400">
                      Tercatat di Dashboard Akuntan
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* KONTEN SUBMENU: JIKA BERITA ACARA TAMPILKAN FORMAT KARTU DOKUMEN RESMI BAST */}
          {routeMeta.key === 'berita-acara-fasilitas' && (
            <div className="space-y-4">
              {insentifFasilitas.map(fas => (
                <div
                  key={fas.id}
                  className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          {fas.nomorBa}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {fas.status}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                        {fas.namaFasilitas}
                      </h3>
                      <div className="text-xs text-slate-500">{fas.lokasi} | Pemilik/Pengelola: {fas.pemilikPenyedia}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Nominal Insentif Fasilitas:</div>
                      <div className="text-lg font-black text-amber-700 dark:text-amber-300">
                        {formatRupiah(fas.totalInsentif)}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500">
                        Dasar: Rp 2.000 × {beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-amber-900 dark:text-amber-200 font-semibold">
                        Kompensasi Pemanfaatan Fasilitas Dapur Berdasarkan Pagu Harian SPPG:
                      </span>
                    </div>
                    <div className="font-black text-amber-950 dark:text-amber-100">
                      Rp 2.000 × {beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM = {formatRupiah(fas.totalInsentif)}
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
                        <span>Detail BAST</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 9: REALISASI BAHAN BAKU (TARIK DATA KEDATANGAN BARANG) */}
      {routeMeta.key === 'realisasi-bahan-baku' && (() => {
        const totalRencanaTgl = filteredRealisasiBb.reduce((s, r) => s + (r.totalRencana || 0), 0);
        const totalRealisasiTgl = filteredRealisasiBb.reduce((s, r) => s + (r.totalRealisasi || 0), 0);
        const totalSelisihTgl = totalRealisasiTgl - totalRencanaTgl;

        return (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            {/* Status Alert Banner: Terkunci vs Mode Edit */}
            {isRealisasiBbLocked ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-200">
                      Status Data Tanggal {selectedDate}: Terkunci (Tersimpan)
                    </div>
                    <div className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
                      Harga Riil Realisasi Bahan Baku tanggal {selectedDate} telah tersimpan dan dikunci. Klik tombol <strong>"Edit / Revisi Data"</strong> untuk mengubah harga riil kembali.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleEditRealisasiBb}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 self-start sm:self-center"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit / Revisi Data</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50/50 dark:from-teal-950/40 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-800/60 rounded-2xl text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-teal-100 dark:bg-teal-900/60 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                    <Unlock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-teal-900 dark:text-teal-200">
                      Status Data Tanggal {selectedDate}: Mode Edit Aktif
                    </div>
                    <div className="text-[11px] text-teal-700/90 dark:text-teal-300/80">
                      Anda dapat mengisi dan mengubah <strong>Harga Riil</strong> per barang pada tanggal <strong>{selectedDate}</strong>. Klik <strong>"Simpan Data"</strong> untuk mengunci hasil realisasi.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSimpanRealisasiBb}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 self-start sm:self-center"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Data</span>
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <PackageCheck className="w-5 h-5 text-teal-600" />
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                  Realisasi Belanja Bahan Baku ({selectedDate})
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {filteredRealisasiBb.length} Item Tanggal {selectedDate}
                </span>
                {isRealisasiBbLocked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    <Lock className="w-3 h-3" />
                    Terkunci
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                    <Unlock className="w-3 h-3" />
                    Dapat Diedit
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isRealisasiBbLocked ? (
                  <button
                    type="button"
                    onClick={handleEditRealisasiBb}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Data</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSimpanRealisasiBb}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Data</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleTarikDataKedatanganBarang('Bahan Baku')}
                  disabled={isSyncing || isRealisasiBbLocked}
                  className={`px-3.5 py-1.5 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all ${
                    isRealisasiBbLocked
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 text-white'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Tarik Data Kedatangan Barang</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const headers = ['No', 'Tanggal', 'Nama Barang', 'Satuan', 'Qty Rencana', 'Qty Realisasi', 'Harga Rencana (Rp)', 'Harga Riil (Rp)', 'Total Rencana (Rp)', 'Total Realisasi (Rp)', 'Selisih (Rp)', 'Kesesuaian', 'Supplier'];
                    const data = filteredRealisasiBb.map((r, i) => [i + 1, r.tanggal, r.namaBarang, r.satuan, r.jumlahRencana, r.jumlahRealisasi, r.hargaSatuanRencana, r.hargaSatuanRiil, r.totalRencana, r.totalRealisasi, r.selisih, r.statusKesesuaian, r.supplier]);
                    exportTableToExcel(data, headers, `Realisasi_Bahan_Baku_${selectedDate}`, 'Realisasi Bahan Baku');
                    triggerToast(`Realisasi Bahan Baku (${selectedDate}) berhasil diekspor!`);
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
                    <th className="py-3 px-3 text-right min-w-[160px]">
                      {isRealisasiBbLocked ? 'Harga Riil (Rp)' : 'Harga Riil (Rp) [Editable]'}
                    </th>
                    <th className="py-3 px-3 text-right">Total Realisasi</th>
                    <th className="py-3 px-3 text-right">Selisih Deviasi</th>
                    <th className="py-3 px-3 text-center">Kesesuaian</th>
                    <th className="py-3 px-3">Supplier &amp; Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRealisasiBb.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-2.5">
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                            <PackageCheck className="w-5 h-5" />
                          </div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                            Belum Ada Data Realisasi Bahan Baku pada Tanggal {selectedDate}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Tabel ini menampilkan data khusus untuk tanggal <strong>{selectedDate}</strong>. Klik tombol Tarik Data Kedatangan Barang atau ubah pilihan tanggal di bagian atas.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRealisasiBb.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {item.tanggal}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{item.namaBarang}</div>
                          <div className="text-[10px] text-slate-400">Kualitas: {item.kualitas}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500 font-medium tabular-nums">
                          {item.jumlahRencana} {item.satuan}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {item.jumlahRealisasi} {item.satuan}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isRealisasiBbLocked ? (
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                              <span>{formatRupiah(item.hargaSatuanRiil)}</span>
                              <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 shadow-2xs focus-within:ring-2 focus-within:ring-teal-500/20">
                              <span className="text-[10px] font-bold text-slate-400">Rp</span>
                              <input
                                type="number"
                                min="0"
                                step="500"
                                value={item.hargaSatuanRiil === 0 ? '' : item.hargaSatuanRiil}
                                placeholder="0"
                                onChange={(e) => handleUpdateHargaRiilBb(item.id, parseFloat(e.target.value) || 0)}
                                className="w-24 text-right text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent outline-hidden tabular-nums"
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100 tabular-nums">
                          {formatRupiah(item.totalRealisasi)}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${item.selisih > 0 ? 'text-amber-600' : item.selisih < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
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
                    ))
                  )}
                </tbody>
                {filteredRealisasiBb.length > 0 && (
                  <tfoot className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 font-black text-xs">
                    <tr>
                      <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Total Realisasi Bahan Baku ({selectedDate}):
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-teal-800 dark:text-teal-300 tabular-nums">
                        {formatRupiah(totalRealisasiTgl)}
                      </td>
                      <td className={`py-3 px-3 text-right text-xs tabular-nums ${totalSelisihTgl > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {totalSelisihTgl > 0 ? `+${formatRupiah(totalSelisihTgl)}` : totalSelisihTgl < 0 ? `-${formatRupiah(Math.abs(totalSelisihTgl))}` : 'Rp 0'}
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-[10px] font-bold text-slate-500">
                        Total Rencana: {formatRupiah(totalRencanaTgl)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        );
      })()}

      {/* VIEW 10: REALISASI OPERASIONAL (TARIK DATA KEDATANGAN BARANG) */}
      {routeMeta.key === 'realisasi-operasional' && (() => {
        const totalBiayaRiilOpTgl = filteredRealisasiOp.reduce((s, r) => s + (r.biayaRiil || 0), 0);
        const totalAnggaranOpTgl = filteredRealisasiOp.reduce((s, r) => s + (r.anggaranRab || 0), 0);

        return (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            {/* Status Alert Banner: Terkunci vs Mode Edit */}
            {isRealisasiOpLocked ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-200">
                      Status Data Tanggal {selectedDate}: Terkunci (Tersimpan)
                    </div>
                    <div className="text-[11px] text-amber-700/90 dark:text-amber-300/80">
                      Harga Riil Realisasi Operasional tanggal {selectedDate} telah tersimpan dan dikunci. Klik tombol <strong>"Edit / Revisi Data"</strong> untuk merevisi kembali.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleEditRealisasiOp}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 self-start sm:self-center"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit / Revisi Data</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50/50 dark:from-teal-950/40 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-800/60 rounded-2xl text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-teal-100 dark:bg-teal-900/60 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                    <Unlock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-teal-900 dark:text-teal-200">
                      Status Data Tanggal {selectedDate}: Mode Edit Aktif
                    </div>
                    <div className="text-[11px] text-teal-700/90 dark:text-teal-300/80">
                      Anda dapat mengisi dan mengubah <strong>Harga Riil</strong> per item operasional pada tanggal <strong>{selectedDate}</strong>. Klik <strong>"Simpan Data"</strong> untuk mengunci data.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSimpanRealisasiOp}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 self-start sm:self-center"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Data</span>
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Truck className="w-5 h-5 text-teal-600" />
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-200">
                  Realisasi Belanja Operasional Riil ({selectedDate})
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {filteredRealisasiOp.length} Item Tanggal {selectedDate}
                </span>
                {isRealisasiOpLocked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    <Lock className="w-3 h-3" />
                    Terkunci
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                    <Unlock className="w-3 h-3" />
                    Dapat Diedit
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isRealisasiOpLocked ? (
                  <button
                    type="button"
                    onClick={handleEditRealisasiOp}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Data</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSimpanRealisasiOp}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Data</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleTarikDataKedatanganBarang('Operasional')}
                  disabled={isSyncing || isRealisasiOpLocked}
                  className={`px-3.5 py-1.5 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all ${
                    isRealisasiOpLocked
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 text-white'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Tarik Data Kedatangan Barang</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const headers = ['No', 'Tanggal', 'Nama Barang Operasional', 'Kategori', 'Jumlah Riil', 'Satuan', 'Harga Riil (Rp)', 'Total Biaya Riil (Rp)', 'Anggaran RAB (Rp)', 'Supplier / Petugas'];
                    const data = filteredRealisasiOp.map((r, i) => [
                      i + 1,
                      r.tanggal,
                      r.namaBarang,
                      r.kategori,
                      r.jumlahRiil,
                      r.satuan,
                      getHargaRiilOperasional(r),
                      r.biayaRiil,
                      r.anggaranRab,
                      r.supplierPetugas
                    ]);
                    exportTableToExcel(data, headers, `Realisasi_Operasional_${selectedDate}`, 'Realisasi Operasional');
                    triggerToast(`Realisasi Operasional (${selectedDate}) berhasil diekspor!`);
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
                    <th className="py-3 px-3 text-right min-w-[160px]">
                      {isRealisasiOpLocked ? 'Harga Riil (Rp)' : 'Harga Riil (Rp) [Editable]'}
                    </th>
                    <th className="py-3 px-3 text-right">Total Biaya Riil (Rp)</th>
                    <th className="py-3 px-3 text-right">Anggaran RAB (Rp)</th>
                    <th className="py-3 px-3">Petugas / Penyedia</th>
                    <th className="py-3 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRealisasiOp.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-2.5">
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                            Belum Ada Data Realisasi Operasional pada Tanggal {selectedDate}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Tabel ini menampilkan data khusus untuk tanggal <strong>{selectedDate}</strong>. Klik tombol Tarik Data Kedatangan Barang atau ubah pilihan tanggal di bagian atas.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRealisasiOp.map((item, idx) => {
                      const hargaRiilVal = getHargaRiilOperasional(item);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{item.tanggal}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{item.namaBarang}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {item.kategori}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                            {item.jumlahRiil} {item.satuan}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isRealisasiOpLocked ? (
                              <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                                <span>{formatRupiah(hargaRiilVal)}</span>
                                <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-teal-500 rounded-lg px-2 py-1 shadow-2xs focus-within:ring-2 focus-within:ring-teal-500/20">
                                <span className="text-[10px] font-bold text-slate-400">Rp</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="500"
                                  value={hargaRiilVal === 0 ? '' : hargaRiilVal}
                                  placeholder="0"
                                  onChange={(e) => handleUpdateHargaRiilOp(item.id, parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right text-xs font-bold text-slate-900 dark:text-slate-100 bg-transparent outline-hidden tabular-nums"
                                />
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100 tabular-nums">
                            {formatRupiah(item.biayaRiil)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-500 tabular-nums">
                            {formatRupiah(item.anggaranRab)}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{item.supplierPetugas}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">{item.keterangan}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredRealisasiOp.length > 0 && (
                  <tfoot className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 font-black text-xs">
                    <tr>
                      <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Total Realisasi Operasional ({selectedDate}):
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-teal-800 dark:text-teal-300 tabular-nums">
                        {formatRupiah(totalBiayaRiilOpTgl)}
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                        {formatRupiah(totalAnggaranOpTgl)}
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-[10px] font-bold text-slate-500">
                        Selisih: {formatRupiah(totalBiayaRiilOpTgl - totalAnggaranOpTgl)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        );
      })()}

      {/* VIEW 12: CETAK LAPORAN TERPADU MODUL AKUNTAN */}
      {routeMeta.key === 'cetak-laporan' && (
        <CetakLaporanAkuntanView
          selectedDate={selectedDate}
          beneficiaryInfo={beneficiaryInfo}
          rabBahanBaku={rabBahanBaku}
          rabOperasionalBarang={rabOperasionalBarang}
          gajiKaryawan={gajiKaryawan}
          insentifPicLembaga={insentifPicLembaga}
          insentifPicPosyandu={insentifPicPosyandu}
          gajiStaf={gajiStaf}
          operasionalLainnya={operasionalLainnya}
          insentifFasilitas={insentifFasilitas}
          realisasiBahanBaku={filteredRealisasiBb}
          realisasiOperasional={filteredRealisasiOp}
          isRealisasiBbLocked={isRealisasiBbLocked}
          isRealisasiOpLocked={isRealisasiOpLocked}
          onToast={triggerToast}
        />
      )}

      {/* VIEW 11: OVERVIEW DASHBOARD UTAMA AKUNTAN (REAL-TIME RECHARTS VISUALS) */}
      {routeMeta.key === 'overview' && (
        <div className="space-y-6">
          <DashboardAkuntan
            rabBahanBaku={rabBahanBaku}
            rabOperasionalBarang={rabOperasionalBarang}
            gajiKaryawan={gajiKaryawan}
            insentifPicLembaga={insentifPicLembaga}
            insentifPicPosyandu={insentifPicPosyandu}
            gajiStaf={gajiStaf}
            operasionalLainnya={operasionalLainnya}
            insentifFasilitas={insentifFasilitas}
            realisasiBahanBaku={filteredRealisasiBb}
            realisasiOperasional={filteredRealisasiOp}
            onNavigate={onNavigate}
            onRefreshData={() => handleTarikDataKedatanganBarang('Bahan Baku')}
          />

          {/* Quick Submodule Gateway Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
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
