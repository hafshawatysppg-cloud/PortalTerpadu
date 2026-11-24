import React, { useState, useEffect, useMemo } from 'react';
import {
  Printer,
  Download,
  Calendar,
  FileText,
  Flame,
  PackageCheck,
  Image as ImageIcon,
  TableProperties,
  CheckCircle2,
  X,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import {
  DailySuhuPengolahanRecord
} from './SuhuPengolahanView';
import {
  DailySuhuOmprengRecord
} from './SuhuMasukOmprengView';
import {
  exportLaporanMakananToPdf,
  LaporanMakananSections,
  printLaporanMakananA4
} from '../../utils/laporanMakananPdfHelper';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import {
  OperationType,
  isFirestoreQuotaError,
  isFirestoreQuotaExhausted,
  markFirestoreQuotaExhausted,
  notifyFirestoreFailure
} from '../../lib/firestoreHelper';
import { safeParseJson } from '../../lib/safeJson';

interface LaporanMakananViewProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const formatTanggalTable = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const formatTanggalBanner = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ];
    return `${day} ${months[monthIdx] || ''} ${year}`;
  }
  return dateStr.toUpperCase();
};

const formatSuhu = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val) || val === 0) return '-';
  return val.toFixed(1).replace('.', ',');
};

export const LaporanMakananView: React.FC<LaporanMakananViewProps> = ({ onNavigate }) => {
  const [pengolahanRecords, setPengolahanRecords] = useState<DailySuhuPengolahanRecord[]>([]);
  const [omprengRecords, setOmprengRecords] = useState<DailySuhuOmprengRecord[]>([]);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sections, setSections] = useState<LaporanMakananSections>({
    tabelPengolahan: true,
    tabelOmpreng: true,
    dokPengolahan: true,
    dokOmpreng: true
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; suhu?: string } | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Real-time Firestore subscriptions for Laporan Makanan with server fallback
  useEffect(() => {
    let active = true;
    const loadServerFallback = async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch('/api/v1/cloud/collection/suhu_pengolahan_v2'),
          fetch('/api/v1/cloud/collection/suhu_masuk_ompreng_v2')
        ]);
        if (r1.ok && active) {
          const j1 = await safeParseJson<{ success?: boolean; data?: DailySuhuPengolahanRecord[] }>(r1);
          if (j1?.success && Array.isArray(j1.data)) {
            setPengolahanRecords(j1.data);
          }
        }
        if (r2.ok && active) {
          const j2 = await safeParseJson<{ success?: boolean; data?: DailySuhuOmprengRecord[] }>(r2);
          if (j2?.success && Array.isArray(j2.data)) {
            setOmprengRecords(j2.data);
          }
        }
      } catch (_) {}
    };

    void loadServerFallback();
    if (isFirestoreQuotaExhausted()) {
      return () => {
        active = false;
      };
    }

    let unsub1: (() => void) | null = null;
    let unsub2: (() => void) | null = null;
    try {
      const q1 = query(collection(db, 'suhu_pengolahan_v2'), orderBy('tanggal', 'desc'));
      unsub1 = onSnapshot(
        q1,
        (snap) => {
          const list: DailySuhuPengolahanRecord[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DailySuhuPengolahanRecord));
          setPengolahanRecords(list);
          void fetch('/api/v1/cloud/collection/suhu_pengolahan_v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: list })
          }).catch(() => {});
        },
        (err) => {
          if (isFirestoreQuotaError(err)) {
            markFirestoreQuotaExhausted();
            try { unsub1?.(); } catch (_) {}
            try { unsub2?.(); } catch (_) {}
            notifyFirestoreFailure(err, OperationType.LIST, 'suhu_pengolahan_v2');
            void loadServerFallback();
            return;
          }
          const msg = notifyFirestoreFailure(err, OperationType.LIST, 'suhu_pengolahan_v2', 'Gagal memuat laporan suhu pengolahan');
          showToast(msg);
        }
      );

      const q2 = query(collection(db, 'suhu_masuk_ompreng_v2'), orderBy('tanggal', 'desc'));
      unsub2 = onSnapshot(
        q2,
        (snap) => {
          const list: DailySuhuOmprengRecord[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DailySuhuOmprengRecord));
          setOmprengRecords(list);
          void fetch('/api/v1/cloud/collection/suhu_masuk_ompreng_v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: list })
          }).catch(() => {});
        },
        (err) => {
          if (isFirestoreQuotaError(err)) {
            markFirestoreQuotaExhausted();
            try { unsub1?.(); } catch (_) {}
            try { unsub2?.(); } catch (_) {}
            notifyFirestoreFailure(err, OperationType.LIST, 'suhu_masuk_ompreng_v2');
            void loadServerFallback();
            return;
          }
          const msg = notifyFirestoreFailure(err, OperationType.LIST, 'suhu_masuk_ompreng_v2', 'Gagal memuat laporan suhu ompreng');
          showToast(msg);
        }
      );
    } catch (err) {
      if (isFirestoreQuotaError(err)) {
        markFirestoreQuotaExhausted();
      }
      notifyFirestoreFailure(err, OperationType.LIST, 'suhu_pengolahan_v2');
    }

    return () => {
      active = false;
      try { unsub1?.(); } catch (_) {}
      try { unsub2?.(); } catch (_) {}
    };
  }, []);

  const filteredPengolahan = useMemo(() => {
    return [...pengolahanRecords]
      .filter(r => {
        if (startDate && r.tanggal < startDate) return false;
        if (endDate && r.tanggal > endDate) return false;
        return true;
      })
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [pengolahanRecords, startDate, endDate]);

  const filteredOmpreng = useMemo(() => {
    return [...omprengRecords]
      .filter(r => {
        if (startDate && r.tanggal < startDate) return false;
        if (endDate && r.tanggal > endDate) return false;
        return true;
      })
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [omprengRecords, startDate, endDate]);

  const toggleSection = (key: keyof LaporanMakananSections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrintOut = async () => {
    if (!sections.tabelPengolahan && !sections.tabelOmpreng && !sections.dokPengolahan && !sections.dokOmpreng) {
      showToast('Pilih minimal 1 bagian laporan untuk dicetak.');
      return;
    }
    setIsExporting(true);
    try {
      await printLaporanMakananA4({
        pengolahanRecords: filteredPengolahan,
        omprengRecords: filteredOmpreng,
        startDate,
        endDate,
        sections
      });
      showToast('Menyiapkan dokumen Print Out Laporan Makanan...');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!sections.tabelPengolahan && !sections.tabelOmpreng && !sections.dokPengolahan && !sections.dokOmpreng) {
      showToast('Pilih minimal 1 bagian laporan untuk diekspor ke PDF.');
      return;
    }
    setIsExporting(true);
    try {
      await exportLaporanMakananToPdf({
        pengolahanRecords: filteredPengolahan,
        omprengRecords: filteredOmpreng,
        startDate,
        endDate,
        sections
      });
      showToast('Laporan Monitoring Suhu Makanan (.pdf) berhasil diunduh!');
    } catch (e) {
      console.error('Failed generating PDF:', e);
      showToast('Gagal membuat PDF laporan suhu makanan.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderTemperatureTable = (
    title: string,
    badgeLabel: string,
    records: Array<DailySuhuPengolahanRecord | DailySuhuOmprengRecord>,
    defaultStatus: string
  ) => (
    <div className="bg-white rounded-2xl border border-slate-300 p-4 sm:p-6 shadow-xs space-y-3 text-black">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 font-sans">
          <TableProperties className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">{title}</h3>
        </div>
        <span className="font-sans text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
          {badgeLabel} • {records.length} Hari
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-black text-center text-xs font-serif min-w-[900px] tabular-nums">
          <thead>
            <tr className="bg-[#D9E8F5]">
              <th rowSpan={2} className="border border-black px-3 py-2 font-bold uppercase align-middle">
                TANGGAL
              </th>
              <th colSpan={3} className="border border-black px-2 py-1.5 font-bold uppercase">
                MAKANAN POKOK
              </th>
              <th colSpan={3} className="border border-black px-2 py-1.5 font-bold uppercase">
                PROTEIN HEWANI
              </th>
              <th colSpan={3} className="border border-black px-2 py-1.5 font-bold uppercase">
                PROTEIN NABATI
              </th>
              <th colSpan={3} className="border border-black px-2 py-1.5 font-bold uppercase">
                SAYURAN
              </th>
              <th rowSpan={2} className="border border-black px-3 py-2 font-bold uppercase align-middle">
                STATUS
              </th>
              <th rowSpan={2} className="border border-black px-3 py-2 font-bold uppercase align-middle">
                PETUGAS
              </th>
            </tr>
            <tr className="bg-[#D9E8F5]">
              <th className="border border-black px-2 py-1 font-bold text-[11px]">SESI I</th>
              <th className="border border-black px-2 py-1 font-bold text-[11px]">SESI II</th>
              <th className="border border-black px-2 py-1 font-bold text-[11px]">SESI III</th>
              <th className="border border-black px-2 py-1 font-bold text-[11px]">SESI I</th>
              <th className="border border-black px-2 py-1 font-bold text-[11px]">SESI II</th>
              <th className="border border-black px-2 py-1 font-bold text-[11px]">SESI III</th>
              <th className="border border-black px-2 py-1 font-bold text-[11px]">SESI I</th>
              <th className="border border-black px-2 py-1 font-bold text-[11px]">SESI II</th>
              <th className="border border-black px-2 py-1 font-bold text-[11px]">SESI III</th>
              <th className="border border-black px-2 py-1 font-bold text-[11px]">SESI I</th>
              <th className="border border-black px-2 py-1 font-bold text-[11px]">SESI II</th>
              <th className="border border-black px-2 py-1 font-bold text-[11px]">SESI III</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={15} className="border border-black py-6 text-slate-500 italic">
                  Tidak ada data untuk rentang tanggal yang dipilih.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="border border-black px-2.5 py-2 font-bold whitespace-nowrap">
                    {formatTanggalTable(r.tanggal)}
                  </td>
                  <td className="border border-black px-2 py-2">{formatSuhu(r.sesi1?.makananPokok?.suhu)}</td>
                  <td className="border border-black px-2 py-2">{formatSuhu(r.sesi2?.makananPokok?.suhu)}</td>
                  <td className="border border-black px-2 py-2">{formatSuhu(r.sesi3?.makananPokok?.suhu)}</td>
                  <td className="border border-black px-2 py-2">{formatSuhu(r.sesi1?.proteinHewani?.suhu)}</td>
                  <td className="border border-black px-2 py-2">{formatSuhu(r.sesi2?.proteinHewani?.suhu)}</td>
                  <td className="border border-black px-2 py-2">{formatSuhu(r.sesi3?.proteinHewani?.suhu)}</td>
                  <td className="border border-black px-2 py-2">{formatSuhu(r.sesi1?.proteinNabati?.suhu)}</td>
                  <td className="border border-black px-2 py-2">{formatSuhu(r.sesi2?.proteinNabati?.suhu)}</td>
                  <td className="border border-black px-2 py-2">{formatSuhu(r.sesi3?.proteinNabati?.suhu)}</td>
                  <td className="border border-black px-2 py-2">{formatSuhu(r.sesi1?.sayuran?.suhu)}</td>
                  <td className="border border-black px-2 py-2">{formatSuhu(r.sesi2?.sayuran?.suhu)}</td>
                  <td className="border border-black px-2 py-2">{formatSuhu(r.sesi3?.sayuran?.suhu)}</td>
                  <td className="border border-black px-2.5 py-2 whitespace-nowrap">
                    {r.status || defaultStatus}
                  </td>
                  <td className="border border-black px-2.5 py-2 whitespace-nowrap">{r.petugas}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPhotoDocumentation = (
    heading: string,
    records: Array<DailySuhuPengolahanRecord | DailySuhuOmprengRecord>
  ) => (
    <div className="bg-white rounded-2xl border border-slate-300 p-4 sm:p-6 shadow-xs space-y-5 text-black">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 font-sans">
          <ImageIcon className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">{heading}</h3>
        </div>
        <span className="font-sans text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300">
          {records.length} Hari Dokumentasi
        </span>
      </div>

      {records.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs italic border border-dashed border-slate-300 rounded-xl">
          Belum ada dokumentasi foto untuk rentang tanggal ini.
        </div>
      ) : (
        <div className="space-y-6">
          {records.map((rec) => (
            <div key={rec.id} className="font-serif border border-black rounded-lg overflow-hidden">
              <div className="bg-[#F8AD7B] border-b border-black text-center font-bold text-xs sm:text-sm uppercase py-1.5 tracking-wide">
                {formatTanggalBanner(rec.tanggal)}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-center text-xs min-w-[780px]">
                  <thead>
                    <tr className="bg-white">
                      <th className="border border-black px-3 py-2 w-16 font-bold uppercase text-[11px]">
                        SESI
                      </th>
                      <th className="border border-black px-3 py-2 font-bold uppercase text-[11px]">
                        MAKANAN POKOK
                      </th>
                      <th className="border border-black px-3 py-2 font-bold uppercase text-[11px]">
                        PROTEIN HEWANI
                      </th>
                      <th className="border border-black px-3 py-2 font-bold uppercase text-[11px]">
                        PROTEIN NABATI
                      </th>
                      <th className="border border-black px-3 py-2 font-bold uppercase text-[11px]">
                        SAYURAN
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {([1, 2, 3] as const).map((sesiNum) => {
                      const sesiKey = `sesi${sesiNum}` as 'sesi1' | 'sesi2' | 'sesi3';
                      const sesiData = rec[sesiKey];
                      const categories = [
                        { key: 'makananPokok' as const, label: 'Makanan Pokok' },
                        { key: 'proteinHewani' as const, label: 'Protein Hewani' },
                        { key: 'proteinNabati' as const, label: 'Protein Nabati' },
                        { key: 'sayuran' as const, label: 'Sayuran' }
                      ];

                      return (
                        <tr key={sesiNum}>
                          <td className="border border-black font-bold text-base align-middle px-3 py-4">
                            {sesiNum}
                          </td>
                          {categories.map((cat) => {
                            const item = sesiData?.[cat.key];
                            const suhuText = formatSuhu(item?.suhu);
                            return (
                              <td key={cat.key} className="border border-black p-2 align-middle">
                                {item?.fotoUrl ? (
                                  <div
                                    onClick={() =>
                                      setLightboxImage({
                                        url: item.fotoUrl!,
                                        title: `${heading} - ${cat.label} (Sesi ${sesiNum}, ${formatTanggalTable(rec.tanggal)})`,
                                        suhu: suhuText
                                      })
                                    }
                                    className="cursor-pointer group flex flex-col items-center justify-center gap-1"
                                  >
                                    <img
                                      src={item.fotoUrl}
                                      alt={`${cat.label} Sesi ${sesiNum}`}
                                      className="max-h-36 max-w-full object-contain mx-auto group-hover:opacity-90 transition-opacity"
                                    />
                                    <span className="font-sans text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 tabular-nums">
                                      {suhuText !== '-' ? `${suhuText} °C` : '-'}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="py-8 text-slate-400 italic text-[11px]">
                                    Foto belum diunggah
                                    {suhuText !== '-' && (
                                      <div className="not-italic font-bold text-slate-700 mt-1">
                                        ({suhuText} °C)
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Navigation Switcher Bar within Suhu > Makanan */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-2 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl">
            <button
              type="button"
              onClick={() => onNavigate('/gizi/suhu/makanan/pengolahan/tabel')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Pengolahan</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/gizi/suhu/makanan/masuk-ompreng/tabel')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Masuk Ompreng</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/gizi/suhu/makanan/cetak-laporan')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan Makanan</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pr-2">
            <button
              type="button"
              onClick={handlePrintOut}
              disabled={isExporting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              <span>Print Out</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
            >
              {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Section Selector Card */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <label className="font-bold text-emerald-900 dark:text-emerald-200 whitespace-nowrap">
                Dari Tanggal:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white dark:bg-slate-800 text-xs font-bold px-2.5 py-1 rounded-xl border border-emerald-300 dark:border-emerald-700 text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <label className="font-bold text-emerald-900 dark:text-emerald-200 whitespace-nowrap">
                Sampai Tanggal:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white dark:bg-slate-800 text-xs font-bold px-2.5 py-1 rounded-xl border border-emerald-300 dark:border-emerald-700 text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                setEndDate(today);
              }}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl cursor-pointer transition-colors"
            >
              Hari Ini
            </button>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Tampilkan Semua</span>
              </button>
            )}
          </div>

          {/* Section Preview Checkboxes */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 mr-1">Bagian Laporan:</span>
            {[
              { key: 'tabelPengolahan' as const, label: 'Tabel Pengolahan' },
              { key: 'tabelOmpreng' as const, label: 'Tabel Masuk Ompreng' },
              { key: 'dokPengolahan' as const, label: 'Dokumentasi Pengolahan' },
              { key: 'dokOmpreng' as const, label: 'Dokumentasi Masuk Ompreng' }
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleSection(item.key)}
                className={`px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  sections[item.key]
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${sections[item.key] ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Paper Header */}
      <div className="bg-white rounded-3xl border border-slate-300 p-5 sm:p-8 shadow-sm space-y-6 text-black">
        {/* Official Kop Surat Preview */}
        <div className="flex items-center gap-4 border-b-2 border-black pb-3 font-serif">
          <img
            src="/badan-gizi-nasional-seeklogo.png"
            alt="Logo Badan Gizi Nasional"
            className="w-14 h-14 object-contain shrink-0"
          />
          <div>
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wide">
              BADAN GIZI NASIONAL <span className="italic font-semibold">(NATIONAL NUTRITION AGENCY)</span>
            </h2>
            <p className="text-xs sm:text-sm font-bold uppercase">
              SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN &bull; YAYASAN HAFSHAWATY ZAINUL HASAN
            </p>
            <p className="text-[11px] text-slate-700">
              Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo
            </p>
          </div>
        </div>

        <div className="text-center font-serif space-y-1">
          <h3 className="text-base font-bold uppercase tracking-wider">
            PREVIEW LAPORAN MONITORING SUHU MAKANAN (PENGOLAHAN &amp; MASUK OMPRENG)
          </h3>
          <p className="text-xs text-slate-600">
            Periode Data:{' '}
            <span className="font-bold text-black">
              {startDate && endDate
                ? `${formatTanggalTable(startDate)} s/d ${formatTanggalTable(endDate)}`
                : startDate
                ? `Mulai ${formatTanggalTable(startDate)}`
                : endDate
                ? `Sampai ${formatTanggalTable(endDate)}`
                : 'Semua Tanggal Tersimpan'}
            </span>
          </p>
        </div>

        {/* 1. Preview Tabel Suhu Pengolahan */}
        {sections.tabelPengolahan &&
          renderTemperatureTable(
            '1. Tabel Suhu Pengolahan Makanan (CCP - Cooking)',
            'Target ≥ 75,0 °C',
            filteredPengolahan,
            'Sesuai Standar'
          )}

        {/* 2. Preview Tabel Suhu Masuk Ompreng */}
        {sections.tabelOmpreng &&
          renderTemperatureTable(
            '2. Tabel Suhu Makanan Masuk Ompreng',
            'Target ≥ 60,0 °C',
            filteredOmpreng,
            'Sesuai Standar (≥ 60°C)'
          )}

        {/* 3. Preview Dokumentasi Suhu Pengolahan */}
        {sections.dokPengolahan &&
          renderPhotoDocumentation(
            '3. Dokumentasi Suhu Pengolahan Bahan Pangan',
            filteredPengolahan
          )}

        {/* 4. Preview Dokumentasi Masuk Ompreng */}
        {sections.dokOmpreng &&
          renderPhotoDocumentation(
            '4. Dokumentasi Suhu Masuk Ompreng Bahan Pangan',
            filteredOmpreng
          )}

        {/* Footer Signature Preview */}
        <div className="grid grid-cols-2 text-center pt-6 font-serif text-xs border-t border-slate-200">
          <div>
            <p>Petugas Pengawas / Ahli Gizi,</p>
            <div className="h-14" />
            <p className="font-bold">Fitria, S.ST</p>
          </div>
          <div>
            <p>Mengetahui, Kepala SPPG</p>
            <div className="h-14" />
            <p className="font-bold">Sri Rohayu, S.Pd</p>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Preview dokumen laporan siap dicetak A4 Landscape atau diunduh ke PDF resmi SPPG.</span>
      </div>

      {/* Photo Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-3xl w-full text-white shadow-2xl"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">{lightboxImage.title}</h4>
                {lightboxImage.suhu && lightboxImage.suhu !== '-' && (
                  <span className="text-xs text-amber-400 font-bold">
                    Suhu Terukur: {lightboxImage.suhu} °C
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
