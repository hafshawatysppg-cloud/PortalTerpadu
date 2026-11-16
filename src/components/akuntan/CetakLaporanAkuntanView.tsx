import React, { useState, useMemo } from 'react';
import {
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  Receipt,
  Calculator,
  PackageCheck,
  Truck,
  FileText,
  Lock,
  Unlock,
  Users
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
import { formatRupiah } from '../../utils/akuntanDocGenerator';
import {
  printLaporanAkuntanA4,
  exportLaporanAkuntanToPdf,
  LaporanAkuntanSections
} from '../../utils/akuntanLaporanPdfHelper';

interface CetakLaporanAkuntanViewProps {
  selectedDate: string;
  beneficiaryInfo: {
    porsiBesar: number;
    porsiKecil: number;
    totalPm: number;
    hasPlanning: boolean;
  };
  rabBahanBaku: RabBahanBakuItem[];
  rabOperasionalBarang: RabOperasionalBarangItem[];
  gajiKaryawan: GajiKaryawanRecord[];
  insentifPicLembaga: InsentifPicRecord[];
  insentifPicPosyandu: InsentifPicRecord[];
  gajiStaf: GajiStafRecord[];
  operasionalLainnya: OperasionalLainnyaItem[];
  insentifFasilitas: InsentifFasilitasRecord[];
  realisasiBahanBaku: RealisasiBahanBakuItem[];
  realisasiOperasional: RealisasiOperasionalItem[];
  isRealisasiBbLocked: boolean;
  isRealisasiOpLocked: boolean;
  onToast: (msg: string) => void;
}

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

export const CetakLaporanAkuntanView: React.FC<CetakLaporanAkuntanViewProps> = ({
  selectedDate,
  beneficiaryInfo,
  rabBahanBaku,
  rabOperasionalBarang,
  gajiKaryawan,
  insentifPicLembaga,
  insentifPicPosyandu,
  gajiStaf,
  operasionalLainnya,
  insentifFasilitas,
  realisasiBahanBaku,
  realisasiOperasional,
  isRealisasiBbLocked,
  isRealisasiOpLocked,
  onToast
}) => {
  const [sections, setSections] = useState<LaporanAkuntanSections>({
    rabBahanBaku: true,
    rabOperasional: true,
    realisasiBahanBaku: true,
    realisasiOperasional: true
  });
  const [isExporting, setIsExporting] = useState(false);

  const toggleSection = (key: keyof LaporanAkuntanSections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formattedDate = useMemo(() => {
    if (!selectedDate) return '-';
    try {
      const d = new Date(`${selectedDate}T00:00:00`);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const paguBb = beneficiaryInfo.porsiBesar * 10000 + beneficiaryInfo.porsiKecil * 8000;
  const paguOp = beneficiaryInfo.totalPm * 3000;
  const paguFas = beneficiaryInfo.totalPm * 2000;
  const paguTotal = beneficiaryInfo.porsiBesar * 15000 + beneficiaryInfo.porsiKecil * 13000;

  const totalRabBb = useMemo(() => rabBahanBaku.reduce((s, r) => s + (r.totalAnggaran || 0), 0), [rabBahanBaku]);
  const totalRabOpBarang = useMemo(() => rabOperasionalBarang.reduce((s, r) => s + (r.totalAnggaran || 0), 0), [rabOperasionalBarang]);
  const totalGajiKaryawan = useMemo(() => gajiKaryawan.reduce((s, r) => s + (r.gajiBersih || 0), 0), [gajiKaryawan]);
  const totalPicSekolah = useMemo(() => insentifPicLembaga.reduce((s, r) => s + (r.totalInsentif || 0), 0), [insentifPicLembaga]);
  const totalPicPosyandu = useMemo(() => insentifPicPosyandu.reduce((s, r) => s + (r.totalInsentif || 0), 0), [insentifPicPosyandu]);
  const totalOpLainnya = useMemo(() => operasionalLainnya.reduce((s, r) => s + (r.jumlahBiaya || 0), 0), [operasionalLainnya]);
  const totalFasilitas = useMemo(() => insentifFasilitas.reduce((s, r) => s + (r.totalInsentif || 0), 0), [insentifFasilitas]);
  const totalRabOpAkumulasi = totalRabOpBarang + totalGajiKaryawan + totalPicSekolah + totalPicPosyandu + totalOpLainnya;

  const hasRabBbData = rabBahanBaku.length > 0;
  const hasRabOpData =
    rabOperasionalBarang.length > 0 ||
    gajiKaryawan.length > 0 ||
    insentifPicLembaga.length > 0 ||
    insentifPicPosyandu.length > 0 ||
    operasionalLainnya.length > 0 ||
    insentifFasilitas.length > 0;
  const hasRealisasiBbData = realisasiBahanBaku.length > 0;
  const hasRealisasiOpData = realisasiOperasional.length > 0;

  const hasAnyVisibleSection =
    (sections.rabBahanBaku && hasRabBbData) ||
    (sections.rabOperasional && hasRabOpData) ||
    (sections.realisasiBahanBaku && hasRealisasiBbData) ||
    (sections.realisasiOperasional && hasRealisasiOpData);

  const totalRealisasiBb = useMemo(() => realisasiBahanBaku.reduce((s, r) => s + (r.totalRealisasi || 0), 0), [realisasiBahanBaku]);
  const totalRencanaBb = useMemo(() => realisasiBahanBaku.reduce((s, r) => s + (r.totalRencana || 0), 0), [realisasiBahanBaku]);
  const totalRealisasiOp = useMemo(() => realisasiOperasional.reduce((s, r) => s + (r.biayaRiil || 0), 0), [realisasiOperasional]);
  const totalAnggaranOp = useMemo(() => realisasiOperasional.reduce((s, r) => s + (r.anggaranRab || 0), 0), [realisasiOperasional]);

  const handlePrint = async () => {
    await printLaporanAkuntanA4({
      selectedDate,
      beneficiaryInfo,
      rabBahanBaku,
      rabOperasionalBarang,
      gajiKaryawan,
      insentifPicLembaga,
      insentifPicPosyandu,
      gajiStaf,
      operasionalLainnya,
      insentifFasilitas,
      realisasiBahanBaku,
      realisasiOperasional,
      sections
    });
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportLaporanAkuntanToPdf({
        selectedDate,
        beneficiaryInfo,
        rabBahanBaku,
        rabOperasionalBarang,
        gajiKaryawan,
        insentifPicLembaga,
        insentifPicPosyandu,
        gajiStaf,
        operasionalLainnya,
        insentifFasilitas,
        realisasiBahanBaku,
        realisasiOperasional,
        sections
      });
      onToast(`Laporan Keuangan Akuntan (${selectedDate}) berhasil diunduh sebagai PDF!`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Control Panel */}
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-900 dark:text-slate-100">
                Preview &amp; Cetak Laporan Terpadu Modul Akuntan
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan seluruh rekapitulasi data Akuntan tanggal{' '}
              <strong className="text-teal-700 dark:text-teal-300">{formattedDate} ({selectedDate})</strong>{' '}
              berurutan: RAB Bahan Baku, RAB Operasional (seluruh sub menu), Realisasi Bahan Baku, dan Realisasi Operasional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95 whitespace-nowrap"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>Print Out (A4)</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold rounded-2xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Membuat PDF...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>

        {/* Section Filter Checkboxes */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Tampilkan Bagian:
          </span>
          {[
            { key: 'rabBahanBaku' as const, label: '1. RAB Bahan Baku', icon: Receipt },
            { key: 'rabOperasional' as const, label: '2. RAB Operasional (Semua Submenu)', icon: Calculator },
            { key: 'realisasiBahanBaku' as const, label: '3. Realisasi Bahan Baku', icon: PackageCheck },
            { key: 'realisasiOperasional' as const, label: '4. Realisasi Operasional', icon: Truck }
          ].map((sec) => {
            const Icon = sec.icon;
            const active = sections[sec.key];
            return (
              <button
                key={sec.key}
                type="button"
                onClick={() => toggleSection(sec.key)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer border transition-all ${
                  active
                    ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 line-through'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* A4 DOCUMENT PREVIEW SHEET */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-lg p-5 sm:p-8 max-w-5xl mx-auto space-y-6">
        {/* KOP SURAT SPPG */}
        <div className="flex items-center gap-4 border-b-4 border-double border-slate-900 pb-4">
          <img
            src="/badan-gizi-nasional-seeklogo.png"
            alt="Logo Badan Gizi Nasional"
            className="w-14 h-14 object-contain shrink-0"
          />
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
              BADAN GIZI NASIONAL <span className="italic font-semibold">(NATIONAL NUTRITION AGENCY)</span>
            </h3>
            <p className="text-xs font-bold text-slate-800">
              SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN &bull; YAYASAN HAFSHAWATY ZAINUL HASAN
            </p>
            <p className="text-[11px] text-slate-600">
              Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo
            </p>
          </div>
          <div className="hidden sm:block text-right text-[11px] text-slate-600">
            <div className="font-bold text-slate-900 uppercase">Dokumen Akuntan</div>
            <div className="font-mono">{selectedDate}</div>
          </div>
        </div>

        {/* REPORT HEADER */}
        <div className="text-center space-y-1">
          <h4 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-900">
            LAPORAN KEUANGAN TERPADU MODUL AKUNTAN (RAB &amp; REALISASI)
          </h4>
          <p className="text-xs text-slate-600 flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-700" />
            <span>Periode Tanggal: <strong className="text-slate-900">{formattedDate}</strong></span>
          </p>
        </div>

        {/* RINGKASAN PAGU & SASARAN PM */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Users className="w-3 h-3 text-teal-700" /> Sasaran Penerima Manfaat
            </div>
            <div className="font-black text-slate-900 text-sm tabular-nums mt-0.5">
              {beneficiaryInfo.totalPm.toLocaleString('id-ID')} PM
            </div>
            <div className="text-[10px] text-slate-500">
              PB: {beneficiaryInfo.porsiBesar.toLocaleString('id-ID')} | PK: {beneficiaryInfo.porsiKecil.toLocaleString('id-ID')}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500">Pagu Bahan Baku</div>
            <div className="font-black text-teal-800 text-sm tabular-nums mt-0.5">{formatRupiah(paguBb)}</div>
            <div className="text-[10px] text-slate-500">RAB: {formatRupiah(totalRabBb)}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500">Pagu Operasional</div>
            <div className="font-black text-sky-800 text-sm tabular-nums mt-0.5">{formatRupiah(paguOp)}</div>
            <div className="text-[10px] text-slate-500">RAB Op: {formatRupiah(totalRabOpAkumulasi)}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500">Pagu Total Harian</div>
            <div className="font-black text-slate-900 text-sm tabular-nums mt-0.5">{formatRupiah(paguTotal)}</div>
            <div className="text-[10px] text-slate-500">Sewa Fasilitas: {formatRupiah(paguFas)}</div>
          </div>
        </div>

        {/* =========================================================
            BAGIAN 1: RAB BAHAN BAKU
           ========================================================= */}
        {sections.rabBahanBaku && hasRabBbData && (
          <section className="space-y-2.5">
            <div className="bg-teal-700 text-white px-3.5 py-2 rounded-lg flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider">1. RAB Bahan Baku Pangan</span>
              <span className="text-[11px] font-bold tabular-nums">{rabBahanBaku.length} Item | {formatRupiah(totalRabBb)}</span>
            </div>
            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
                    <th className="py-2 px-2.5 text-center w-10 border-r border-slate-300">No</th>
                    <th className="py-2 px-2.5 border-r border-slate-300">Nama Bahan Baku</th>
                    <th className="py-2 px-2.5 text-right border-r border-slate-300">Jumlah</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-300">Satuan</th>
                    <th className="py-2 px-2.5 text-right border-r border-slate-300">Harga Satuan</th>
                    <th className="py-2 px-2.5 text-right border-r border-slate-300">Total Anggaran</th>
                    <th className="py-2 px-2.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rabBahanBaku.map((item, idx) => {
                    const qty = item.pembulatan !== undefined ? item.pembulatan : item.totalKebutuhanKg || 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5 text-center border-r border-slate-200 font-semibold">{idx + 1}</td>
                        <td className="py-2 px-2.5 border-r border-slate-200 font-bold text-slate-900">{item.namaBarang}</td>
                        <td className="py-2 px-2.5 text-right border-r border-slate-200 tabular-nums">{Number(qty).toLocaleString('id-ID')}</td>
                        <td className="py-2 px-2.5 text-center border-r border-slate-200">{item.satuan}</td>
                        <td className="py-2 px-2.5 text-right border-r border-slate-200 tabular-nums">{formatRupiah(item.hargaSatuan)}</td>
                        <td className="py-2 px-2.5 text-right border-r border-slate-200 font-bold tabular-nums">{formatRupiah(item.totalAnggaran)}</td>
                        <td className="py-2 px-2.5 text-[11px] text-slate-600">{item.keterangan || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-400 font-black">
                    <td colSpan={5} className="py-2 px-3 text-right uppercase text-[11px] border-r border-slate-300">
                      Total RAB Bahan Baku
                    </td>
                    <td className="py-2 px-2.5 text-right text-teal-800 tabular-nums border-r border-slate-300">
                      {formatRupiah(totalRabBb)}
                    </td>
                    <td className="py-2 px-2.5 text-[11px] text-slate-600">
                      Pagu: {formatRupiah(paguBb)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* =========================================================
            BAGIAN 2: RAB OPERASIONAL (MELIPUTI SELURUH SUB MENUNYA)
           ========================================================= */}
        {sections.rabOperasional && hasRabOpData && (
          <section className="space-y-4">
            <div className="bg-sky-700 text-white px-3.5 py-2 rounded-lg flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider">
                2. RAB Operasional (Meliputi Seluruh Sub Menu)
              </span>
              <span className="text-[11px] font-bold tabular-nums">
                Akumulasi Operasional: {formatRupiah(totalRabOpAkumulasi)}
              </span>
            </div>

            {/* 2.1 RAB Operasional - Barang */}
            {rabOperasionalBarang.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-black text-slate-800 border-l-4 border-sky-600 pl-2.5">
                  2.1. Pengadaan Barang Operasional
                </h5>
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
                        <th className="py-2 px-2.5 text-center w-10 border-r border-slate-300">No</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">Nama Barang Operasional</th>
                        <th className="py-2 px-2.5 text-center border-r border-slate-300">Satuan</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-300">Jumlah</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-300">Harga Satuan</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-300">Total Anggaran</th>
                        <th className="py-2 px-2.5">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {rabOperasionalBarang.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="py-1.5 px-2.5 text-center border-r border-slate-200">{idx + 1}</td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold">{item.namaBarang || '-'}</td>
                          <td className="py-1.5 px-2.5 text-center border-r border-slate-200">{item.satuan}</td>
                          <td className="py-1.5 px-2.5 text-right border-r border-slate-200 tabular-nums">{item.jumlah.toLocaleString('id-ID')}</td>
                          <td className="py-1.5 px-2.5 text-right border-r border-slate-200 tabular-nums">{formatRupiah(item.hargaSatuan)}</td>
                          <td className="py-1.5 px-2.5 text-right border-r border-slate-200 font-bold tabular-nums">{formatRupiah(item.totalAnggaran)}</td>
                          <td className="py-1.5 px-2.5 text-[11px] text-slate-600">{item.keterangan || item.periode || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t border-slate-400 font-black">
                        <td colSpan={5} className="py-1.5 px-3 text-right uppercase text-[10px] border-r border-slate-300">Subtotal Operasional Barang</td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums border-r border-slate-300">{formatRupiah(totalRabOpBarang)}</td>
                        <td className="py-1.5 px-2.5 text-[11px] text-slate-600">{rabOperasionalBarang.length} Item</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 2.2 Jasa - Gaji Karyawan */}
            {gajiKaryawan.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-black text-slate-800 border-l-4 border-sky-600 pl-2.5">
                  2.2. Jasa &mdash; Gaji Karyawan (Rekap Gaji &amp; Rekap Harian per Tanggal)
                </h5>
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
                        <th className="py-2 px-2.5 text-center w-10 border-r border-slate-300">No</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">Nama Karyawan / No. Slip</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">Jabatan</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-300">Gaji Pokok</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-300">Gaji Bersih (THP)</th>
                        <th className="py-2 px-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {gajiKaryawan.map((rec, idx) => (
                        <tr key={rec.id}>
                          <td className="py-1.5 px-2.5 text-center border-r border-slate-200">{idx + 1}</td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200">
                            <div className="font-bold">{rec.nama}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{rec.nomorSlip}</div>
                          </td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200">{rec.jabatan}</td>
                          <td className="py-1.5 px-2.5 text-right border-r border-slate-200 tabular-nums">{formatRupiah(rec.gajiPokok)}</td>
                          <td className="py-1.5 px-2.5 text-right border-r border-slate-200 font-bold tabular-nums">{formatRupiah(rec.gajiBersih)}</td>
                          <td className="py-1.5 px-2.5 text-center text-[11px]">{rec.statusBayar}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t border-slate-400 font-black">
                        <td colSpan={4} className="py-1.5 px-3 text-right uppercase text-[10px] border-r border-slate-300">
                          Subtotal Gaji Karyawan ({gajiKaryawan.length} Petugas Masuk)
                        </td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums border-r border-slate-300">{formatRupiah(totalGajiKaryawan)}</td>
                        <td className="py-1.5 px-2.5 text-center text-[11px]">{selectedDate}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 2.3 Jasa - Insentif PIC Lembaga */}
            {insentifPicLembaga.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-black text-slate-800 border-l-4 border-sky-600 pl-2.5">
                  2.3. Jasa &mdash; Insentif PIC Lembaga Sekolah (Rekap &amp; Kwitansi)
                </h5>
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
                        <th className="py-2 px-2.5 text-center w-10 border-r border-slate-300">No</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">No. Kwitansi</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">Nama PIC</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">Lembaga Sekolah</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-300">Sasaran PM</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-300">Total Insentif</th>
                        <th className="py-2 px-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {insentifPicLembaga.map((rec, idx) => (
                        <tr key={rec.id}>
                          <td className="py-1.5 px-2.5 text-center border-r border-slate-200">{idx + 1}</td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 font-mono text-[11px]">{rec.nomorKwitansi}</td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold">{rec.namaPic}</td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200">{rec.lembaga}</td>
                          <td className="py-1.5 px-2.5 text-right border-r border-slate-200 tabular-nums">{rec.jumlahSasaran.toLocaleString('id-ID')} Siswa</td>
                          <td className="py-1.5 px-2.5 text-right border-r border-slate-200 font-bold tabular-nums">{formatRupiah(rec.totalInsentif)}</td>
                          <td className="py-1.5 px-2.5 text-center text-[11px]">{rec.statusBayar}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t border-slate-400 font-black">
                        <td colSpan={5} className="py-1.5 px-3 text-right uppercase text-[10px] border-r border-slate-300">Subtotal Insentif PIC Sekolah</td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums border-r border-slate-300">{formatRupiah(totalPicSekolah)}</td>
                        <td className="py-1.5 px-2.5 text-center text-[11px]">{insentifPicLembaga.length} PIC</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 2.4 Jasa - Insentif PIC Posyandu */}
            {insentifPicPosyandu.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-black text-slate-800 border-l-4 border-sky-600 pl-2.5">
                  2.4. Jasa &mdash; Insentif PIC Posyandu 3B &amp; Balita (Rekap &amp; Kwitansi)
                </h5>
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
                        <th className="py-2 px-2.5 text-center w-10 border-r border-slate-300">No</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">No. Kwitansi</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">Nama Kader PIC</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">Nama Posyandu</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-300">Sasaran PM</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-300">Total Insentif</th>
                        <th className="py-2 px-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {insentifPicPosyandu.map((rec, idx) => (
                        <tr key={rec.id}>
                          <td className="py-1.5 px-2.5 text-center border-r border-slate-200">{idx + 1}</td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 font-mono text-[11px]">{rec.nomorKwitansi}</td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold">{rec.namaPic}</td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200">{rec.lembaga}</td>
                          <td className="py-1.5 px-2.5 text-right border-r border-slate-200 tabular-nums">{rec.jumlahSasaran.toLocaleString('id-ID')} PM</td>
                          <td className="py-1.5 px-2.5 text-right border-r border-slate-200 font-bold tabular-nums">{formatRupiah(rec.totalInsentif)}</td>
                          <td className="py-1.5 px-2.5 text-center text-[11px]">{rec.statusBayar}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t border-slate-400 font-black">
                        <td colSpan={5} className="py-1.5 px-3 text-right uppercase text-[10px] border-r border-slate-300">Subtotal Insentif PIC Posyandu</td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums border-r border-slate-300">{formatRupiah(totalPicPosyandu)}</td>
                        <td className="py-1.5 px-2.5 text-center text-[11px]">{insentifPicPosyandu.length} PIC</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 2.5 Jasa - Operasional Lainnya */}
            {operasionalLainnya.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-black text-slate-800 border-l-4 border-sky-600 pl-2.5">
                  2.5. Jasa &mdash; Operasional Lainnya (Utilitas &amp; Lab)
                </h5>
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
                        <th className="py-2 px-2.5 text-center w-10 border-r border-slate-300">No</th>
                        <th className="py-2 px-2.5 text-center border-r border-slate-300">Tanggal</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">Uraian Pengeluaran</th>
                        <th className="py-2 px-2.5 text-center border-r border-slate-300">Satuan</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-300">Biaya Satuan</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">Penanggung Jawab</th>
                        <th className="py-2 px-2.5">No. Nota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {operasionalLainnya.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="py-1.5 px-2.5 text-center border-r border-slate-200">{idx + 1}</td>
                          <td className="py-1.5 px-2.5 text-center border-r border-slate-200 whitespace-nowrap">{item.tanggalTransaksi}</td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold">{item.namaPengeluaran || '-'}</td>
                          <td className="py-1.5 px-2.5 text-center border-r border-slate-200">{item.satuan || item.kategori || '-'}</td>
                          <td className="py-1.5 px-2.5 text-right border-r border-slate-200 font-bold tabular-nums">
                            {formatRupiah(item.biayaSatuan !== undefined ? item.biayaSatuan : item.jumlahBiaya)}
                          </td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200">{item.penanggungJawab}</td>
                          <td className="py-1.5 px-2.5 font-mono text-[11px]">{item.buktiNota}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t border-slate-400 font-black">
                        <td colSpan={4} className="py-1.5 px-3 text-right uppercase text-[10px] border-r border-slate-300">Subtotal Operasional Lainnya</td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums border-r border-slate-300">{formatRupiah(totalOpLainnya)}</td>
                        <td colSpan={2} className="py-1.5 px-2.5 text-[11px] text-slate-600">{operasionalLainnya.length} Transaksi</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 2.6 Insentif Fasilitas */}
            {insentifFasilitas.length > 0 && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-black text-slate-800 border-l-4 border-amber-600 pl-2.5">
                  2.6. Insentif Fasilitas / Sewa Fasilitas Dapur (Berita Acara &amp; Rekap)
                </h5>
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
                        <th className="py-2 px-2.5 text-center w-10 border-r border-slate-300">No</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">Nomor BAST</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">Nama Fasilitas</th>
                        <th className="py-2 px-2.5 border-r border-slate-300">Pemilik / Penyedia</th>
                        <th className="py-2 px-2.5 text-right border-r border-slate-300">Total Insentif</th>
                        <th className="py-2 px-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {insentifFasilitas.map((fas, idx) => (
                        <tr key={fas.id}>
                          <td className="py-1.5 px-2.5 text-center border-r border-slate-200">{idx + 1}</td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 font-mono text-[11px]">{fas.nomorBa}</td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold">{fas.namaFasilitas}</td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200">{fas.pemilikPenyedia}</td>
                          <td className="py-1.5 px-2.5 text-right border-r border-slate-200 font-bold tabular-nums">{formatRupiah(fas.totalInsentif)}</td>
                          <td className="py-1.5 px-2.5 text-center text-[11px]">{fas.status}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t border-slate-400 font-black">
                        <td colSpan={4} className="py-1.5 px-3 text-right uppercase text-[10px] border-r border-slate-300">Subtotal Insentif Fasilitas</td>
                        <td className="py-1.5 px-2.5 text-right tabular-nums border-r border-slate-300">{formatRupiah(totalFasilitas)}</td>
                        <td className="py-1.5 px-2.5 text-center text-[11px]">BAST</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* =========================================================
            BAGIAN 3: REALISASI BAHAN BAKU (TANGGAL TERPILIH)
           ========================================================= */}
        {sections.realisasiBahanBaku && hasRealisasiBbData && (
          <section className="space-y-2.5">
            <div className="bg-emerald-700 text-white px-3.5 py-2 rounded-lg flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider">
                  3. Realisasi Bahan Baku (Tanggal {selectedDate})
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20">
                  {isRealisasiBbLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {isRealisasiBbLocked ? 'Terkunci' : 'Mode Edit'}
                </span>
              </div>
              <span className="text-[11px] font-bold tabular-nums">
                {realisasiBahanBaku.length} Item | {formatRupiah(totalRealisasiBb)}
              </span>
            </div>
            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
                    <th className="py-2 px-2.5 text-center w-10 border-r border-slate-300">No</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-300">Tanggal</th>
                    <th className="py-2 px-2.5 border-r border-slate-300">Nama Bahan Baku</th>
                    <th className="py-2 px-2.5 text-right border-r border-slate-300">Qty Rencana</th>
                    <th className="py-2 px-2.5 text-right border-r border-slate-300">Qty Riil</th>
                    <th className="py-2 px-2.5 text-right border-r border-slate-300">Harga Riil</th>
                    <th className="py-2 px-2.5 text-right border-r border-slate-300">Total Realisasi</th>
                    <th className="py-2 px-2.5 text-right">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {realisasiBahanBaku.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-200">{idx + 1}</td>
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-200 whitespace-nowrap">{item.tanggal}</td>
                      <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold">{item.namaBarang}</td>
                      <td className="py-1.5 px-2.5 text-right border-r border-slate-200 tabular-nums">{item.jumlahRencana} {item.satuan}</td>
                      <td className="py-1.5 px-2.5 text-right border-r border-slate-200 tabular-nums">{item.jumlahRealisasi} {item.satuan}</td>
                      <td className="py-1.5 px-2.5 text-right border-r border-slate-200 tabular-nums">{formatRupiah(item.hargaSatuanRiil)}</td>
                      <td className="py-1.5 px-2.5 text-right border-r border-slate-200 font-bold tabular-nums">{formatRupiah(item.totalRealisasi)}</td>
                      <td className="py-1.5 px-2.5 text-right tabular-nums">
                        {item.selisih > 0 ? `+${formatRupiah(item.selisih)}` : item.selisih < 0 ? `-${formatRupiah(Math.abs(item.selisih))}` : 'Rp 0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-400 font-black">
                    <td colSpan={6} className="py-2 px-3 text-right uppercase text-[10px] border-r border-slate-300">
                      Total Realisasi Bahan Baku ({selectedDate})
                    </td>
                    <td className="py-2 px-2.5 text-right text-emerald-800 tabular-nums border-r border-slate-300">
                      {formatRupiah(totalRealisasiBb)}
                    </td>
                    <td className="py-2 px-2.5 text-right tabular-nums">
                      {(() => {
                        const diff = totalRealisasiBb - totalRencanaBb;
                        return diff > 0 ? `+${formatRupiah(diff)}` : diff < 0 ? `-${formatRupiah(Math.abs(diff))}` : 'Rp 0';
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* =========================================================
            BAGIAN 4: REALISASI OPERASIONAL (TANGGAL TERPILIH)
           ========================================================= */}
        {sections.realisasiOperasional && hasRealisasiOpData && (
          <section className="space-y-2.5">
            <div className="bg-indigo-700 text-white px-3.5 py-2 rounded-lg flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider">
                  4. Realisasi Operasional (Tanggal {selectedDate})
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20">
                  {isRealisasiOpLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {isRealisasiOpLocked ? 'Terkunci' : 'Mode Edit'}
                </span>
              </div>
              <span className="text-[11px] font-bold tabular-nums">
                {realisasiOperasional.length} Item | {formatRupiah(totalRealisasiOp)}
              </span>
            </div>
            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-700">
                    <th className="py-2 px-2.5 text-center w-10 border-r border-slate-300">No</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-300">Tanggal</th>
                    <th className="py-2 px-2.5 border-r border-slate-300">Nama Barang Operasional</th>
                    <th className="py-2 px-2.5 border-r border-slate-300">Kategori</th>
                    <th className="py-2 px-2.5 text-right border-r border-slate-300">Qty Riil</th>
                    <th className="py-2 px-2.5 text-right border-r border-slate-300">Harga Riil</th>
                    <th className="py-2 px-2.5 text-right border-r border-slate-300">Total Biaya Riil</th>
                    <th className="py-2 px-2.5 text-right border-r border-slate-300">Anggaran RAB</th>
                    <th className="py-2 px-2.5">Petugas / Penyedia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {realisasiOperasional.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-200">{idx + 1}</td>
                      <td className="py-1.5 px-2.5 text-center border-r border-slate-200 whitespace-nowrap">{item.tanggal}</td>
                      <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold">{item.namaBarang}</td>
                      <td className="py-1.5 px-2.5 border-r border-slate-200 text-[11px]">{item.kategori}</td>
                      <td className="py-1.5 px-2.5 text-right border-r border-slate-200 tabular-nums">{item.jumlahRiil} {item.satuan}</td>
                      <td className="py-1.5 px-2.5 text-right border-r border-slate-200 tabular-nums">{formatRupiah(getHargaRiilOperasional(item))}</td>
                      <td className="py-1.5 px-2.5 text-right border-r border-slate-200 font-bold tabular-nums">{formatRupiah(item.biayaRiil)}</td>
                      <td className="py-1.5 px-2.5 text-right border-r border-slate-200 tabular-nums">{formatRupiah(item.anggaranRab)}</td>
                      <td className="py-1.5 px-2.5 text-[11px]">{item.supplierPetugas}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-400 font-black">
                    <td colSpan={6} className="py-2 px-3 text-right uppercase text-[10px] border-r border-slate-300">
                      Total Realisasi Operasional ({selectedDate})
                    </td>
                    <td className="py-2 px-2.5 text-right text-indigo-800 tabular-nums border-r border-slate-300">
                      {formatRupiah(totalRealisasiOp)}
                    </td>
                    <td className="py-2 px-2.5 text-right tabular-nums border-r border-slate-300">
                      {formatRupiah(totalAnggaranOp)}
                    </td>
                    <td className="py-2 px-2.5 text-[11px] text-slate-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Tervalidasi</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {!hasAnyVisibleSection && (
          <div className="border border-dashed border-slate-300 rounded-xl py-10 px-4 text-center text-xs text-slate-500 italic">
            Belum ada data pada sub menu yang terisi untuk tanggal <strong>{selectedDate}</strong>. Sub menu dengan data kosong tidak ditampilkan di preview dan ekspor laporan.
          </div>
        )}

        {/* TANDA TANGAN RESMI */}
        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200 text-center text-xs">
          <div>
            <div className="text-slate-600">Disusun Oleh, Akuntan SPPG</div>
            <div className="h-14" />
            <div className="font-bold underline text-slate-900">Akuntan / Bagian Keuangan SPPG</div>
          </div>
          <div>
            <div className="text-slate-600">Mengetahui, Kepala SPPG</div>
            <div className="h-14" />
            <div className="font-bold underline text-slate-900">Sri Rohayu, S.Pd</div>
          </div>
        </div>
      </div>
    </div>
  );
};
