import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Calendar,
  Download,
  FileText,
  Hash,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Users,
  CheckCircle2,
  UserCheck,
  Wallet
} from 'lucide-react';
import { MasterDivisi } from '../../types';
import { SlipGajiNumberingConfig } from '../../types/akuntan';
import { safeParseJson } from '../../lib/safeJson';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';
import {
  DEFAULT_SLIP_GAJI_NUMBERING,
  getAkuntanConfigsSnapshot,
  subscribeOperationalSlice,
  updateAkuntanConfigDoc
} from '../../lib/firestoreOperationalStore';
import {
  resolveKepalaSppgName,
  resolvePengawasKeuanganName
} from '../../utils/divisiDistribusiHelper';
import {
  SlipGajiRelawanData,
  downloadAllSlipGajiOfficialPdf,
  downloadSlipGajiOfficialPdf,
  formatAngkaKehadiran,
  formatNomorSlipGaji,
  formatTanggalIndoLong,
  formatTerbilangRupiah,
  getRomanMonthFromDate,
  getYearFromDate,
  padNomorUrutSurat,
  printAllSlipGajiDirectly,
  printSlipGajiDirectly
} from '../../utils/slipGajiPrintHelper';

interface SlipGajiPeriodeItem {
  petugasId: string;
  nomor: string;
  nama: string;
  jabatan: string;
  status: string;
  gajiHarian: number;
  totalKehadiran: number;
  totalGaji: number;
  tanggalHadir: string[];
}

interface SlipGajiPeriodeResponse {
  startDate: string;
  endDate: string;
  recordedDates: string[];
  totalPetugas: number;
  totalHadirKeseluruhan: number;
  totalGajiKeseluruhan: number;
  items: SlipGajiPeriodeItem[];
}

interface SlipGajiRelawanViewProps {
  defaultDate?: string;
  onToast?: (msg: string, type?: 'success' | 'error') => void;
}

function getMondayOfWeek(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3) return isoDate;
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const day = d.getUTCDay(); // 0 = Sun, 1 = Mon
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}

function addDaysIso(isoDate: string, days: number): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3) return isoDate;
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function formatRupiah(val: number): string {
  return 'Rp ' + Math.round(Number(val || 0)).toLocaleString('id-ID');
}

export const SlipGajiRelawanView: React.FC<SlipGajiRelawanViewProps> = ({
  defaultDate,
  onToast
}) => {
  const initialRefDate = defaultDate || new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(() => getMondayOfWeek(initialRefDate));
  const [endDate, setEndDate] = useState<string>(() => initialRefDate);
  const [tanggalCetak, setTanggalCetak] = useState<string>(() => initialRefDate);
  const [isTanggalCetakManual, setIsTanggalCetakManual] = useState<boolean>(false);

  const initialNumbering = useMemo<SlipGajiNumberingConfig>(() => {
    const cfg = getAkuntanConfigsSnapshot()?.slipGajiNumbering;
    return {
      ...DEFAULT_SLIP_GAJI_NUMBERING,
      ...(cfg || {})
    };
  }, []);

  const [startNomorUrut, setStartNomorUrut] = useState<string>(() =>
    padNomorUrutSurat(initialNumbering.nextNomorUrut, initialNumbering.digitLength)
  );
  const [digitLength, setDigitLength] = useState<number>(() => initialNumbering.digitLength || 3);
  const [kodeJenisSurat, setKodeJenisSurat] = useState<string>(
    () => initialNumbering.kodeJenis || 'SLIP.GAJI'
  );
  const [kodeInstansi, setKodeInstansi] = useState<string>(
    () => initialNumbering.kodeInstansi || 'SPPG-TMG'
  );
  const [autoIncrementAfterPrint, setAutoIncrementAfterPrint] = useState<boolean>(
    () => initialNumbering.autoIncrementAfterPrint !== false
  );
  const [hasPendingNumberingEdit, setHasPendingNumberingEdit] = useState<boolean>(false);
  const hasPendingEditRef = useRef<boolean>(false);
  useEffect(() => {
    hasPendingEditRef.current = hasPendingNumberingEdit;
  }, [hasPendingNumberingEdit]);

  const [savingNumbering, setSavingNumbering] = useState<boolean>(false);
  const [sessionIssuedSeqMap, setSessionIssuedSeqMap] = useState<Record<string, number>>({});

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyAttending, setOnlyAttending] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [periodeData, setPeriodeData] = useState<SlipGajiPeriodeResponse | null>(null);
  const [selectedPetugasId, setSelectedPetugasId] = useState<string>('');

  // Sinkronisasi pengaturan nomor surat dari AkuntanConfig (Firestore + Snapshot Server)
  useEffect(() => {
    const applyConfig = () => {
      if (hasPendingEditRef.current) return;
      const cfg = {
        ...DEFAULT_SLIP_GAJI_NUMBERING,
        ...(getAkuntanConfigsSnapshot()?.slipGajiNumbering || {})
      };
      const safeDigits = Math.max(2, Math.min(6, Number(cfg.digitLength) || 3));
      setDigitLength(safeDigits);
      setStartNomorUrut(padNomorUrutSurat(cfg.nextNomorUrut, safeDigits));
      setKodeJenisSurat(cfg.kodeJenis || 'SLIP.GAJI');
      setKodeInstansi(cfg.kodeInstansi || 'SPPG-TMG');
      setAutoIncrementAfterPrint(cfg.autoIncrementAfterPrint !== false);
    };

    applyConfig();
    const unsub = subscribeOperationalSlice('akuntanConfigs', applyConfig);
    return () => unsub();
  }, []);

  // Sinkron tanggal cetak otomatis ke endDate selama belum diubah manual
  useEffect(() => {
    if (!isTanggalCetakManual) {
      setTanggalCetak(endDate);
    }
  }, [endDate, isTanggalCetakManual]);

  // Reset status cetak per-sesi saat rentang tanggal berubah
  useEffect(() => {
    setSessionIssuedSeqMap({});
  }, [startDate, endDate]);

  // Tarik Master Divisi secara real-time + fallback server REST
  const [masterDivisiFallback, setMasterDivisiFallback] = useState<MasterDivisi[]>([]);
  const fetchDivisiFallback = useCallback(async (): Promise<MasterDivisi[]> => {
    try {
      const res = await fetch('/api/v1/master/divisi');
      if (!res.ok) return [];
      const json = await safeParseJson<{ success?: boolean; data?: MasterDivisi[] }>(res);
      return Array.isArray(json?.data) ? json.data : [];
    } catch {
      return [];
    }
  }, []);

  const { data: realtimeDivisiList } = useFirestoreRealtime<MasterDivisi>(
    'divisi',
    fetchDivisiFallback
  );

  useEffect(() => {
    let active = true;
    fetchDivisiFallback().then((rows) => {
      if (active && rows.length > 0) setMasterDivisiFallback(rows);
    });
    return () => {
      active = false;
    };
  }, [fetchDivisiFallback]);

  const effectiveDivisiList = useMemo(
    () => (realtimeDivisiList.length > 0 ? realtimeDivisiList : masterDivisiFallback),
    [realtimeDivisiList, masterDivisiFallback]
  );

  const pengawasKeuangan = useMemo(
    () => resolvePengawasKeuanganName(effectiveDivisiList, 'Muhammad Fadil, S.Akun'),
    [effectiveDivisiList]
  );

  const kepalaSppg = useMemo(
    () => resolveKepalaSppgName(effectiveDivisiList, 'Sri Rohayu, S.Pd'),
    [effectiveDivisiList]
  );

  const fetchPeriodeData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/petugas/slip-gaji/periode?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await safeParseJson<{ success?: boolean; data?: SlipGajiPeriodeResponse; message?: string }>(res);
      if (json?.success && json.data) {
        setPeriodeData(json.data);
        setSelectedPetugasId((prev) => {
          const items = json.data!.items;
          if (prev && items.some((it) => it.petugasId === prev)) return prev;
          const firstPresent = items.find((it) => it.totalKehadiran > 0);
          return firstPresent?.petugasId || items[0]?.petugasId || '';
        });
      }
    } catch (err: any) {
      console.error('Error fetching periode slip gaji:', err);
      onToast?.(err?.message || 'Gagal memuat akumulasi slip gaji periode', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, onToast]);

  useEffect(() => {
    fetchPeriodeData();
  }, [fetchPeriodeData]);

  const filteredItems = useMemo(() => {
    const items = periodeData?.items || [];
    const q = searchQuery.trim().toLowerCase();
    return items.filter((it) => {
      if (onlyAttending && it.totalKehadiran <= 0) return false;
      if (!q) return true;
      return (
        it.nama.toLowerCase().includes(q) ||
        it.jabatan.toLowerCase().includes(q) ||
        String(it.nomor).toLowerCase().includes(q)
      );
    });
  }, [periodeData, searchQuery, onlyAttending]);

  const selectedIndex = useMemo(() => {
    const idx = filteredItems.findIndex((it) => it.petugasId === selectedPetugasId);
    return idx >= 0 ? idx : 0;
  }, [filteredItems, selectedPetugasId]);

  const selectedItem = filteredItems[selectedIndex] || periodeData?.items[0] || null;

  const baseSeqNum = useMemo(() => {
    const digitsOnly = String(startNomorUrut || '').replace(/\D/g, '');
    if (!digitsOnly) return 1;
    const n = parseInt(digitsOnly, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  }, [startNomorUrut]);

  // Tetapkan nomor urut surat otomatis per karyawan sesuai urutan daftar
  // Karyawan yang sudah tercetak pada sesi ini mempertahankan nomor yang terbit agar karyawan berikutnya tidak melompat
  const assignedSeqMap = useMemo(() => {
    const map: Record<string, number> = {};
    let unprintedOffset = 0;
    filteredItems.forEach((item) => {
      const alreadyIssued = sessionIssuedSeqMap[item.petugasId];
      if (typeof alreadyIssued === 'number' && Number.isFinite(alreadyIssued)) {
        map[item.petugasId] = alreadyIssued;
      } else {
        map[item.petugasId] = baseSeqNum + unprintedOffset;
        unprintedOffset += 1;
      }
    });
    return map;
  }, [filteredItems, sessionIssuedSeqMap, baseSeqNum]);

  const buildSlipDataWithSeq = useCallback(
    (item: SlipGajiPeriodeItem, seqNum: number): SlipGajiRelawanData => {
      return {
        nomorUrut: padNomorUrutSurat(seqNum, digitLength),
        digitLength,
        kodeJenis: kodeJenisSurat,
        kodeInstansi,
        tanggalCetak,
        startDate: startDate <= endDate ? startDate : endDate,
        endDate: startDate <= endDate ? endDate : startDate,
        nama: item.nama,
        jabatan: item.jabatan,
        totalKehadiran: item.totalKehadiran,
        gajiHarian: item.gajiHarian,
        totalGaji: item.totalGaji,
        pengawasKeuangan,
        kepalaSppg
      };
    },
    [
      digitLength,
      kodeJenisSurat,
      kodeInstansi,
      tanggalCetak,
      startDate,
      endDate,
      pengawasKeuangan,
      kepalaSppg
    ]
  );

  const selectedSlipData = useMemo(() => {
    if (!selectedItem) return null;
    const seqNum = assignedSeqMap[selectedItem.petugasId] ?? baseSeqNum + selectedIndex;
    return buildSlipDataWithSeq(selectedItem, seqNum);
  }, [selectedItem, assignedSeqMap, baseSeqNum, selectedIndex, buildSlipDataWithSeq]);

  const allBatchSlips = useMemo(() => {
    return filteredItems.map((it, idx) => {
      const seqNum = assignedSeqMap[it.petugasId] ?? baseSeqNum + idx;
      return buildSlipDataWithSeq(it, seqNum);
    });
  }, [filteredItems, assignedSeqMap, baseSeqNum, buildSlipDataWithSeq]);

  const persistNumberingConfig = useCallback(
    async (nextSeq: number, silent: boolean = false) => {
      const cleanJenis = String(kodeJenisSurat || 'SLIP.GAJI').trim().toUpperCase() || 'SLIP.GAJI';
      const cleanInstansi = String(kodeInstansi || 'SPPG-TMG').trim().toUpperCase() || 'SPPG-TMG';
      const safeDigits = Math.max(2, Math.min(6, Number(digitLength) || 3));
      const safeSeq = Math.max(1, Math.round(Number(nextSeq) || 1));

      const payload: SlipGajiNumberingConfig = {
        nextNomorUrut: safeSeq,
        digitLength: safeDigits,
        kodeJenis: cleanJenis,
        kodeInstansi: cleanInstansi,
        autoIncrementAfterPrint,
        updatedAt: new Date().toISOString()
      };

      setStartNomorUrut(padNomorUrutSurat(safeSeq, safeDigits));
      setKodeJenisSurat(cleanJenis);
      setKodeInstansi(cleanInstansi);
      setHasPendingNumberingEdit(false);

      await updateAkuntanConfigDoc({ slipGajiNumbering: payload });
      if (!silent) {
        const preview = formatNomorSlipGaji(
          safeSeq,
          cleanJenis,
          cleanInstansi,
          tanggalCetak,
          safeDigits
        );
        onToast?.(`Pengaturan nomor urut surat disimpan. Nomor awal berikutnya: ${preview}`);
      }
    },
    [kodeJenisSurat, kodeInstansi, digitLength, autoIncrementAfterPrint, tanggalCetak, onToast]
  );

  const handleSaveNumberingSettings = async () => {
    setSavingNumbering(true);
    try {
      setSessionIssuedSeqMap({});
      await persistNumberingConfig(baseSeqNum, false);
    } catch (err: any) {
      onToast?.(err?.message || 'Gagal menyimpan pengaturan nomor urut surat', 'error');
    } finally {
      setSavingNumbering(false);
    }
  };

  const advanceAfterSingleIssue = useCallback(
    async (item: SlipGajiPeriodeItem, issuedSeq: number) => {
      if (!autoIncrementAfterPrint) return;
      const nextSeq = Math.max(baseSeqNum, issuedSeq + 1);
      setSessionIssuedSeqMap((prev) => ({
        ...prev,
        [item.petugasId]: issuedSeq
      }));
      try {
        await persistNumberingConfig(nextSeq, true);
        const nextPreview = formatNomorSlipGaji(
          nextSeq,
          kodeJenisSurat,
          kodeInstansi,
          tanggalCetak,
          digitLength
        );
        onToast?.(`Nomor urut berikutnya otomatis dilanjutkan ke ${nextPreview}`);
      } catch (err) {
        console.error('Gagal memperbarui nomor urut otomatis:', err);
      }
    },
    [
      autoIncrementAfterPrint,
      baseSeqNum,
      persistNumberingConfig,
      kodeJenisSurat,
      kodeInstansi,
      tanggalCetak,
      digitLength,
      onToast
    ]
  );

  const advanceAfterBatchIssue = useCallback(
    async (slips: SlipGajiRelawanData[]) => {
      if (!autoIncrementAfterPrint || slips.length === 0) return;
      const seqNumbers = slips
        .map((s) => parseInt(String(s.nomorUrut).replace(/\D/g, ''), 10))
        .filter((n) => Number.isFinite(n));
      const highestSeq = seqNumbers.length > 0 ? Math.max(...seqNumbers) : baseSeqNum + slips.length - 1;
      const firstSeq = seqNumbers.length > 0 ? Math.min(...seqNumbers) : baseSeqNum;
      const nextSeq = highestSeq + 1;

      setSessionIssuedSeqMap({});
      try {
        await persistNumberingConfig(nextSeq, true);
        onToast?.(
          `${slips.length} slip (${padNomorUrutSurat(firstSeq, digitLength)} s/d ${padNomorUrutSurat(highestSeq, digitLength)}) diterbitkan. Urutan berikutnya otomatis ke ${padNomorUrutSurat(nextSeq, digitLength)}.`
        );
      } catch (err) {
        console.error('Gagal memperbarui nomor urut batch:', err);
      }
    },
    [autoIncrementAfterPrint, baseSeqNum, digitLength, persistNumberingConfig, onToast]
  );

  const handleApplyPreset = (preset: 'today' | 'week' | 'month') => {
    const ref = defaultDate || new Date().toISOString().split('T')[0];
    if (preset === 'today') {
      setStartDate(ref);
      setEndDate(ref);
    } else if (preset === 'week') {
      setStartDate(addDaysIso(ref, -6));
      setEndDate(ref);
    } else if (preset === 'month') {
      const parts = ref.split('-');
      if (parts.length === 3) {
        setStartDate(`${parts[0]}-${parts[1]}-01`);
        setEndDate(ref);
      }
    }
  };

  const handlePrintSingle = async () => {
    if (!selectedSlipData || !selectedItem) return;
    const issuedSeq = assignedSeqMap[selectedItem.petugasId] ?? baseSeqNum + selectedIndex;
    printSlipGajiDirectly(selectedSlipData);
    await advanceAfterSingleIssue(selectedItem, issuedSeq);
  };

  const handlePrintAll = async () => {
    if (allBatchSlips.length === 0) {
      onToast?.('Tidak ada data karyawan pada daftar terfilter untuk dicetak.', 'error');
      return;
    }
    printAllSlipGajiDirectly(allBatchSlips);
    await advanceAfterBatchIssue(allBatchSlips);
  };

  const handleDownloadSinglePdf = async () => {
    if (!selectedSlipData || !selectedItem) return;
    const issuedSeq = assignedSeqMap[selectedItem.petugasId] ?? baseSeqNum + selectedIndex;
    setDownloadingPdf(true);
    try {
      await downloadSlipGajiOfficialPdf(selectedSlipData);
      onToast?.(`PDF Slip Gaji ${selectedSlipData.nama} berhasil diunduh.`);
      await advanceAfterSingleIssue(selectedItem, issuedSeq);
    } catch (err: any) {
      onToast?.(err?.message || 'Gagal membuat PDF Slip Gaji', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadAllPdf = async () => {
    if (allBatchSlips.length === 0) {
      onToast?.('Tidak ada data karyawan untuk diunduh.', 'error');
      return;
    }
    setDownloadingPdf(true);
    try {
      await downloadAllSlipGajiOfficialPdf(allBatchSlips);
      if (!autoIncrementAfterPrint) {
        onToast?.(`PDF Gabungan ${allBatchSlips.length} Slip Gaji berhasil diunduh.`);
      }
      await advanceAfterBatchIssue(allBatchSlips);
    } catch (err: any) {
      onToast?.(err?.message || 'Gagal membuat PDF Gabungan', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const romanPreview = getRomanMonthFromDate(tanggalCetak);
  const yearPreview = getYearFromDate(tanggalCetak);
  const nomorSuratPreview = selectedSlipData
    ? formatNomorSlipGaji(
        selectedSlipData.nomorUrut,
        selectedSlipData.kodeJenis,
        selectedSlipData.kodeInstansi,
        selectedSlipData.tanggalCetak,
        digitLength
      )
    : `${padNomorUrutSurat(baseSeqNum, digitLength)}/${kodeJenisSurat}/${kodeInstansi}/${romanPreview}/${yearPreview}`;

  const nomorBerikutnyaSingle = useMemo(() => {
    const currentSeq = selectedItem
      ? assignedSeqMap[selectedItem.petugasId] ?? baseSeqNum + selectedIndex
      : baseSeqNum;
    return formatNomorSlipGaji(
      currentSeq + 1,
      kodeJenisSurat,
      kodeInstansi,
      tanggalCetak,
      digitLength
    );
  }, [
    selectedItem,
    assignedSeqMap,
    baseSeqNum,
    selectedIndex,
    kodeJenisSurat,
    kodeInstansi,
    tanggalCetak,
    digitLength
  ]);

  const nomorBerikutnyaBatch = useMemo(() => {
    const count = Math.max(1, allBatchSlips.length);
    const highestSeq =
      allBatchSlips.length > 0
        ? Math.max(
            ...allBatchSlips.map(
              (s) => parseInt(String(s.nomorUrut).replace(/\D/g, ''), 10) || baseSeqNum
            )
          )
        : baseSeqNum + count - 1;
    return formatNomorSlipGaji(
      highestSeq + 1,
      kodeJenisSurat,
      kodeInstansi,
      tanggalCetak,
      digitLength
    );
  }, [allBatchSlips, baseSeqNum, kodeJenisSurat, kodeInstansi, tanggalCetak, digitLength]);

  const issuedCountInSession = Object.keys(sessionIssuedSeqMap).length;

  return (
    <div className="space-y-5">
      {/* Control Panel: Rentang Tanggal Periode & Tanggal Cetak */}
      <div className="bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Periode & Dokumen Slip Gaji (Tanda Terima Upah Relawan)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kehadiran & total gaji terhitung otomatis dari absensi harian dalam rentang tanggal dipilih. Penandatangan Pengawas Keuangan & Ka. SPPG tersinkronisasi dari Master Divisi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyPreset('today')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500 cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('week')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500 cursor-pointer"
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('month')}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-500 cursor-pointer"
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={fetchPeriodeData}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>

        {/* Date Range Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Dari Tanggal (Periode)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Sampai Tanggal (Periode)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tanggal Cetak Slip
              </label>
              {isTanggalCetakManual && (
                <button
                  type="button"
                  onClick={() => {
                    setIsTanggalCetakManual(false);
                    setTanggalCetak(endDate);
                  }}
                  className="text-[10px] font-bold text-teal-600 hover:underline cursor-pointer"
                >
                  Auto
                </button>
              )}
            </div>
            <input
              type="date"
              value={tanggalCetak}
              onChange={(e) => {
                setIsTanggalCetakManual(true);
                setTanggalCetak(e.target.value);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Dedicated Pengaturan Nomor Urut Surat Panel */}
        <div className="bg-white dark:bg-slate-950/60 border border-teal-200/80 dark:border-teal-900/60 rounded-xl p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-600/10 dark:bg-teal-500/20 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Pengaturan Nomor Urut Surat
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tentukan nomor urut awal surat. Nomor karyawan berikutnya & cetak selanjutnya otomatis berurutan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasPendingNumberingEdit && (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-lg">
                  Belum disimpan
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveNumberingSettings}
                disabled={savingNumbering}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingNumbering ? 'Menyimpan...' : 'Simpan Pengaturan Nomor'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                No. Urut Awal Surat
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={startNomorUrut}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^\d]/g, '');
                  setStartNomorUrut(cleaned);
                  setSessionIssuedSeqMap({});
                  setHasPendingNumberingEdit(true);
                }}
                onBlur={() => {
                  setStartNomorUrut(padNomorUrutSurat(baseSeqNum, digitLength));
                }}
                placeholder="067"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Panjang Digit
              </label>
              <select
                value={digitLength}
                onChange={(e) => {
                  const nextDigits = Math.max(2, Math.min(6, Number(e.target.value) || 3));
                  setDigitLength(nextDigits);
                  setStartNomorUrut(padNomorUrutSurat(baseSeqNum, nextDigits));
                  setHasPendingNumberingEdit(true);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value={2}>2 Digit (01, 67)</option>
                <option value={3}>3 Digit (001, 067)</option>
                <option value={4}>4 Digit (0001, 0067)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Kode Jenis Surat
              </label>
              <input
                type="text"
                value={kodeJenisSurat}
                onChange={(e) => {
                  setKodeJenisSurat(e.target.value.toUpperCase());
                  setHasPendingNumberingEdit(true);
                }}
                placeholder="SLIP.GAJI"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Kode SPPG / Instansi
              </label>
              <input
                type="text"
                value={kodeInstansi}
                onChange={(e) => {
                  setKodeInstansi(e.target.value.toUpperCase());
                  setHasPendingNumberingEdit(true);
                }}
                placeholder="SPPG-TMG"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center h-[34px]">
              <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoIncrementAfterPrint}
                  onChange={(e) => {
                    setAutoIncrementAfterPrint(e.target.checked);
                    setHasPendingNumberingEdit(true);
                  }}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Otomatis lanjut urutan setelah cetak / PDF</span>
              </label>
            </div>
          </div>

          {/* Live Sequence Progression Info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300">
              <span>
                Urutan Awal Aktif:{' '}
                <strong className="font-mono text-teal-700 dark:text-teal-300">
                  {formatNomorSlipGaji(
                    baseSeqNum,
                    kodeJenisSurat,
                    kodeInstansi,
                    tanggalCetak,
                    digitLength
                  )}
                </strong>
              </span>
              {autoIncrementAfterPrint && (
                <>
                  <span>
                    Setelah Cetak Slip Ini:{' '}
                    <strong className="font-mono text-slate-900 dark:text-slate-100">
                      {nomorBerikutnyaSingle}
                    </strong>
                  </span>
                  {allBatchSlips.length > 1 && (
                    <span>
                      Setelah Cetak Semua ({allBatchSlips.length}):{' '}
                      <strong className="font-mono text-indigo-700 dark:text-indigo-300">
                        {nomorBerikutnyaBatch}
                      </strong>
                    </span>
                  )}
                </>
              )}
            </div>
            {issuedCountInSession > 0 && (
              <button
                type="button"
                onClick={() => setSessionIssuedSeqMap({})}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-teal-700 cursor-pointer self-start md:self-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Penanda Tercetak ({issuedCountInSession})</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary Strip & Master Divisi Signer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 flex items-center gap-3">
            <Users className="w-4 h-4 text-teal-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Karyawan Terfilter</div>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 tabular-nums">
                {filteredItems.length} Orang
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Hari Tercatat di Rentang</div>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100 tabular-nums">
                {periodeData?.recordedDates?.length || 0} Hari Kerja
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 flex items-center gap-3">
            <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Total Gaji Periode</div>
              <div className="text-sm font-black text-emerald-700 dark:text-emerald-400 tabular-nums truncate">
                {formatRupiah(
                  filteredItems.reduce((sum, it) => sum + (it.totalGaji || 0), 0)
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 flex items-center gap-3">
            <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Master Divisi Penandatangan</div>
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                {pengawasKeuangan} • {kepalaSppg}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Workspace: Daftar Karyawan (Kiri) + Live Preview A4 (Kanan) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Panel: Employee Selector & Attendance Summary */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Daftar Karyawan & Urutan Surat
            </h4>
            <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAttending}
                onChange={(e) => setOnlyAttending(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>Hanya yang hadir (&gt;0)</span>
            </label>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama karyawan atau jabatan..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Batch Print / PDF Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintAll}
              disabled={allBatchSlips.length === 0}
              className="flex-1 min-w-[140px] px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-teal-700 dark:hover:bg-teal-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Semua ({allBatchSlips.length})</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadAllPdf}
              disabled={allBatchSlips.length === 0 || downloadingPdf}
              className="flex-1 min-w-[140px] px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Semua ({allBatchSlips.length})</span>
            </button>
          </div>

          {/* Employee Table */}
          <div className="max-h-[640px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-2 text-center w-9">No</th>
                  <th className="py-2.5 px-2 text-center w-16">No. Surat</th>
                  <th className="py-2.5 px-2.5">Nama / Jabatan</th>
                  <th className="py-2.5 px-2 text-center">Hadir</th>
                  <th className="py-2.5 px-2.5 text-right">Total Gaji</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                      Menghitung akumulasi kehadiran periode...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                      Tidak ada karyawan yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, idx) => {
                    const isSelected = selectedItem?.petugasId === item.petugasId;
                    const seqNum = assignedSeqMap[item.petugasId] ?? baseSeqNum + idx;
                    const seqPadded = padNomorUrutSurat(seqNum, digitLength);
                    const wasIssuedInSession =
                      typeof sessionIssuedSeqMap[item.petugasId] === 'number';
                    return (
                      <tr
                        key={item.petugasId}
                        onClick={() => setSelectedPetugasId(item.petugasId)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-teal-950/60'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-2.5 px-2 text-center font-bold text-slate-500 tabular-nums">
                          {item.nomor || idx + 1}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-md font-mono text-[11px] font-black tabular-nums ${
                              wasIssuedInSession
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                            title={
                              wasIssuedInSession
                                ? 'Sudah dicetak / diunduh pada sesi ini'
                                : 'Nomor urut surat otomatis'
                            }
                          >
                            {seqPadded}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span className="truncate">{item.nama}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {item.jabatan} • {formatRupiah(item.gajiHarian)}/hari
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${
                              item.totalKehadiran > 0
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {formatAngkaKehadiran(item.totalKehadiran)}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-black text-slate-900 dark:text-slate-100 tabular-nums">
                          {Math.round(item.totalGaji).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Exact PDF-Matching A4 Preview */}
        <div className="xl:col-span-7 space-y-3">
          {/* Action Toolbar above Paper Preview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Preview Cetak Slip Gaji Resmi (Format A4)
              </div>
              <div className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono truncate mt-0.5">
                {nomorSuratPreview}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePrintSingle}
                disabled={!selectedSlipData}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Slip Ini</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadSinglePdf}
                disabled={!selectedSlipData || downloadingPdf}
                className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadingPdf ? 'Memproses...' : 'Download PDF'}</span>
              </button>
            </div>
          </div>

          {/* Crisp White A4 Paper Canvas */}
          <div className="bg-slate-200/70 dark:bg-slate-800/60 p-3 sm:p-6 rounded-2xl border border-slate-300/70 dark:border-slate-700 overflow-x-auto">
            {!selectedSlipData ? (
              <div className="bg-white text-slate-500 rounded-lg p-12 text-center text-xs max-w-[760px] mx-auto shadow-md">
                Pilih karyawan di sebelah kiri untuk menampilkan preview slip gaji.
              </div>
            ) : (
              <div
                className="bg-white text-black mx-auto shadow-lg border border-slate-200 px-8 sm:px-14 py-10 sm:py-12 min-w-[620px] max-w-[780px]"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                {/* KOP SURAT */}
                <div className="flex items-center gap-4 pb-2">
                  <img
                    src="/badan-gizi-nasional-seeklogo.png"
                    alt="Logo Badan Gizi Nasional"
                    className="w-16 h-16 object-contain shrink-0"
                  />
                  <div className="leading-snug">
                    <div
                      className="font-bold uppercase tracking-wide"
                      style={{ fontSize: '16.5px', color: '#1b365d' }}
                    >
                      BADAN GIZI NASIONAL (NATIONAL NUTRITION AGENCY)
                    </div>
                    <div
                      className="uppercase"
                      style={{ fontSize: '15px', color: '#1b365d' }}
                    >
                      SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN
                    </div>
                    <div
                      className="uppercase"
                      style={{ fontSize: '14px', color: '#1b365d' }}
                    >
                      YAYASAN HAFSHAWATY ZAINUL HASAN
                    </div>
                    <div className="text-gray-900 mt-0.5" style={{ fontSize: '12px' }}>
                      Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo
                    </div>
                  </div>
                </div>

                {/* Garis Ganda Kop Surat */}
                <div className="border-t-[3px] border-b border-gray-900 h-[5px] mb-6" />

                {/* Judul & Nomor Surat */}
                <div className="text-center font-bold underline uppercase text-[14.5px]">
                  TANDA TERIMA UPAH RELAWAN
                </div>
                <div className="text-center font-bold uppercase text-[14px] mt-2 mb-6">
                  NOMOR : {nomorSuratPreview}
                </div>

                {/* Paragraf Pertama */}
                <p className="text-justify text-[14px] leading-relaxed mb-6">
                  Bersama ini kami lampirkan slip gaji Periode{' '}
                  {formatTanggalIndoLong(selectedSlipData.startDate)} s/d{' '}
                  {formatTanggalIndoLong(selectedSlipData.endDate)} atas nama relawan yang
                  bersangkutan sebagai bukti pembayaran gaji sesuai dengan periode diatas. Slip ini
                  memuat informasi mengenai pendapatan total gaji yang diterima.
                </p>

                {/* Tabel Informasi Karyawan & Nominal Gaji */}
                <table className="w-full border-collapse text-[14px] mb-10">
                  <tbody>
                    <tr>
                      <td className="py-1 w-[195px] align-top">Nama</td>
                      <td className="py-1 w-[14px] text-center align-top">:</td>
                      <td className="py-1 align-top">{selectedSlipData.nama}</td>
                    </tr>
                    <tr>
                      <td className="py-1 align-top">Jabatan</td>
                      <td className="py-1 text-center align-top">:</td>
                      <td className="py-1 align-top">{selectedSlipData.jabatan}</td>
                    </tr>
                    <tr>
                      <td className="py-1 align-top">Total Kehadiran</td>
                      <td className="py-1 text-center align-top">:</td>
                      <td className="py-1 align-top">
                        {formatAngkaKehadiran(selectedSlipData.totalKehadiran)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 align-top">Total gaji yang diterima</td>
                      <td className="py-1 text-center align-top">:</td>
                      <td className="py-1 align-top">
                        {Math.round(selectedSlipData.totalGaji).toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 align-top">Terbilang</td>
                      <td className="py-1 text-center align-top">:</td>
                      <td className="py-1 align-top italic">
                        {formatTerbilangRupiah(selectedSlipData.totalGaji)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Area Tanda Tangan: Penerima & Pengawas Keuangan */}
                <table className="w-full border-collapse text-[14px] mt-2">
                  <tbody>
                    <tr>
                      <td className="w-[58%] align-top">
                        <div>&nbsp;</div>
                        <div>Penerima</div>
                        <div className="h-16" />
                        <div className="font-bold">{selectedSlipData.nama}</div>
                      </td>
                      <td className="w-[42%] align-top">
                        <div>Probolinggo, {formatTanggalIndoLong(selectedSlipData.tanggalCetak)}</div>
                        <div>Pengawas Keuangan</div>
                        <div className="h-16" />
                        <div className="font-bold">{selectedSlipData.pengawasKeuangan}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Area Tanda Tangan: Mengetahui Ka. SPPG */}
                <div className="text-center text-[14px] mt-5">
                  <div>Mengetahui,</div>
                  <div>Ka. SPPG</div>
                  <div className="h-16" />
                  <div className="font-bold">{selectedSlipData.kepalaSppg}</div>
                </div>

                {/* Garis Tebal Bawah Halaman */}
                <div className="border-t-[3px] border-gray-900 mt-14" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
