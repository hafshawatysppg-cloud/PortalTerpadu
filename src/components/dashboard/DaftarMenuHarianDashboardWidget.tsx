import React, { useState, useEffect, useMemo } from 'react';
import {
  Eye,
  ArrowRight,
  Utensils,
  Plus,
  X,
  Pencil,
  Maximize2
} from 'lucide-react';
import { MenuHarianRecord, NilaiGiziPorsi } from '../../types';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';

interface DaftarMenuHarianDashboardWidgetProps {
  onNavigate?: (path: string) => void;
}

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatIndoLongDate(dateStr: string): string {
  try {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    const d = parts.length === 3
      ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      : new Date(dateStr);
    const hari = NAMA_HARI[d.getDay()] || 'Senin';
    const day = String(d.getDate()).padStart(2, '0');
    const month = NAMA_BULAN[d.getMonth()] || 'Januari';
    const year = d.getFullYear();
    return `${hari}, ${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

function formatDDMMYYYY(dateStr: string): string {
  try {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}

function formatPlusMenuTitle(namaMenu: string): string {
  if (!namaMenu) return 'MENU HARIAN MBG';
  const parts = namaMenu
    .split(/[,+]/)
    .map(s => s.trim())
    .filter(Boolean);
  if (parts.length > 1) {
    return parts.join(' + ').toUpperCase();
  }
  return namaMenu.toUpperCase();
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
  const besar = getGiziBesar(rec);
  if (rec.giziPorsiKecil && (
    Number(rec.giziPorsiKecil.energiKkal) > 0 ||
    Number(rec.giziPorsiKecil.proteinGram) > 0 ||
    Number(rec.giziPorsiKecil.lemakGram) > 0 ||
    Number(rec.giziPorsiKecil.karbohidratGram) > 0
  )) {
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
    energiKkal: Math.round(besar.energiKkal * 0.7),
    proteinGram: Number((besar.proteinGram * 0.7).toFixed(1)),
    lemakGram: Number((besar.lemakGram * 0.7).toFixed(1)),
    karbohidratGram: Number((besar.karbohidratGram * 0.7).toFixed(1)),
    seratGram: Number(((besar.seratGram || 0) * 0.7).toFixed(1)),
    keterangan: ''
  };
}

function formatDecimalIndo(val: number | undefined): string {
  const num = Number(val) || 0;
  return num.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

export const DaftarMenuHarianDashboardWidget: React.FC<DaftarMenuHarianDashboardWidgetProps> = ({
  onNavigate
}) => {
  const { data: realtimeMenus } = useFirestoreRealtime<MenuHarianRecord>('menuHarian');
  const [menus, setMenus] = useState<MenuHarianRecord[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<MenuHarianRecord | null>(null);
  const [fullscreenImageRec, setFullscreenImageRec] = useState<MenuHarianRecord | null>(null);
  const [showAllCards, setShowAllCards] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch('/api/v1/menu-harian');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data)) {
            setMenus(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load menu harian for dashboard:', err);
      }
    };
    fetchMenus();
  }, []);

  useEffect(() => {
    if (realtimeMenus && realtimeMenus.length > 0) {
      setMenus(realtimeMenus);
    }
  }, [realtimeMenus]);

  // Sort menus chronologically so "Menu MBG Sebelumnya" is on the left and "Menu MBG Hari Ini" on the right
  const displayMenus = useMemo(() => {
    const sortedDesc = [...menus].sort((a, b) =>
      (b.tanggalOperasional || '').localeCompare(a.tanggalOperasional || '')
    );
    const subset = showAllCards ? sortedDesc : sortedDesc.slice(0, 2);
    return !showAllCards && subset.length === 2 ? [...subset].reverse() : subset;
  }, [menus, showAllCards]);

  const getMenuStatusLabel = (tanggal: string, index: number, total: number): string => {
    if (tanggal === todayStr) return 'Menu MBG Hari Ini';
    if (tanggal < todayStr) return 'Menu MBG Sebelumnya';
    if (tanggal > todayStr) return 'Menu MBG Selanjutnya';
    return index === 0 && total > 1 ? 'Menu MBG Sebelumnya' : 'Menu MBG Hari Ini';
  };

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Daftar Menu Harian Makan Bergizi Gratis (MBG)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Informasi sajian menu harian dan analisis kandungan gizi (Porsi Besar &amp; Porsi Kecil)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {menus.length > 2 && (
            <button
              type="button"
              onClick={() => setShowAllCards(!showAllCards)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              {showAllCards ? 'Tampilkan 2 Terbaru' : `Lihat Semua (${menus.length})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/menu-harian/form')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Input Menu Harian</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {displayMenus.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Utensils className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Belum ada data Menu Harian
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Silakan tambahkan menu harian melalui sub menu Form Menu Harian untuk menampilkan kartu Menu Makan Bergizi Gratis di Dashboard.
          </p>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/menu-harian/form')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buka Form Menu Harian</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayMenus.map((rec, index) => {
            const gb = getGiziBesar(rec);
            const gk = getGiziKecil(rec);
            const statusLabel = getMenuStatusLabel(rec.tanggalOperasional, index, displayMenus.length);
            const dateHyphen = formatDDMMYYYY(rec.tanggalOperasional);
            const dateLongIndo = rec.hariTanggalFormatted || formatIndoLongDate(rec.tanggalOperasional);
            const plusTitle = formatPlusMenuTitle(rec.namaMenu);

            const compItems = [
              rec.rincianKomponen?.sayur,
              rec.rincianKomponen?.laukHewani,
              rec.rincianKomponen?.laukNabati,
              rec.rincianKomponen?.buahSusu,
              rec.rincianKomponen?.karbohidrat
            ].filter(Boolean);

            return (
              <div
                key={rec.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6 flex flex-col justify-between"
              >
                {/* ========================================================= */}
                {/* TOP VISUAL POSTER AREA ("Menu Makan Bergizi Gratis")      */}
                {/* ========================================================= */}
                <div>
                  <div className="relative rounded-xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 pt-4 pb-4 px-3 sm:px-5 overflow-hidden">
                    {/* Poster Header Title */}
                    <div className="text-center space-y-0.5">
                      <div className="text-xl sm:text-2xl font-black leading-none tracking-tight">
                        <span className="text-[#091E5A] dark:text-slate-100">Menu </span>
                        <span className="text-[#1D4ED8] dark:text-blue-400">Makan</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-black leading-tight tracking-tight">
                        <span className="text-[#091E5A] dark:text-slate-100">Bergizi </span>
                        <span className="text-[#1D4ED8] dark:text-blue-400">Gratis</span>
                      </div>

                      <div className="pt-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-300">
                        SPPG Badan Gizi Nasional
                      </div>

                      <div className="pt-1 flex justify-center">
                        <span className="inline-block px-4 py-0.5 rounded-full border border-slate-700 dark:border-slate-500 text-[11px] font-extrabold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                          {dateLongIndo}
                        </span>
                      </div>
                    </div>

                    {/* Full Uncropped Menu Image Container */}
                    <div className="my-4 relative flex items-center justify-center">
                      {rec.fotoMenuUrl ? (
                        <div
                          onClick={() => setFullscreenImageRec(rec)}
                          className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-900 relative group cursor-pointer flex items-center justify-center"
                          title="Klik untuk melihat gambar ukuran penuh"
                        >
                          <img
                            src={rec.fotoMenuUrl}
                            alt={rec.namaMenu}
                            referrerPolicy="no-referrer"
                            className="w-full h-auto max-h-[480px] object-contain block transition-transform duration-300 group-hover:scale-[1.01]"
                          />
                          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <Maximize2 className="w-3 h-3" />
                            <span>Perbesar Gambar</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full min-h-[220px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400 p-6 text-center">
                          <Utensils className="w-10 h-10 mb-2 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {rec.namaMenu}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Optional Component Callout Line */}
                    {compItems.length > 0 && (
                      <div className="text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-2.5">
                        {compItems.join(' • ')}
                      </div>
                    )}

                    {/* "Analisis Gizi" Header */}
                    <div className="flex justify-center mt-1 mb-2.5">
                      <span className="inline-block px-5 py-0.5 rounded-full border border-slate-700 dark:border-slate-500 text-[11px] font-extrabold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                        Analisis Gizi
                      </span>
                    </div>

                    {/* 2-Column Analisis Gizi Table (Left: Porsi Besar, Right: Porsi Kecil) */}
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-[400px] mx-auto text-[11px] leading-snug relative z-10">
                      {/* Left Column: Porsi Besar */}
                      <div className="space-y-0.5">
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-1 text-center border-b border-slate-200 dark:border-slate-800 pb-0.5">
                          Porsi Besar
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[#091E5A] dark:text-slate-300">Energi</span>
                          <span className="font-extrabold text-[#091E5A] dark:text-white tabular-nums">{formatDecimalIndo(gb.energiKkal)} kkal</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[#091E5A] dark:text-slate-300">Protein</span>
                          <span className="font-extrabold text-[#091E5A] dark:text-white tabular-nums">{formatDecimalIndo(gb.proteinGram)} g</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[#091E5A] dark:text-slate-300">Lemak</span>
                          <span className="font-extrabold text-[#091E5A] dark:text-white tabular-nums">{formatDecimalIndo(gb.lemakGram)} g</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[#091E5A] dark:text-slate-300">Karbohidrat</span>
                          <span className="font-extrabold text-[#091E5A] dark:text-white tabular-nums">{formatDecimalIndo(gb.karbohidratGram)} g</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[#091E5A] dark:text-slate-300">Serat</span>
                          <span className="font-extrabold text-[#091E5A] dark:text-white tabular-nums">{formatDecimalIndo(gb.seratGram)} g</span>
                        </div>
                      </div>

                      {/* Right Column: Porsi Kecil */}
                      <div className="space-y-0.5">
                        <div className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1 text-center border-b border-slate-200 dark:border-slate-800 pb-0.5">
                          Porsi Kecil
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[#091E5A] dark:text-slate-300">Energi</span>
                          <span className="font-extrabold text-[#091E5A] dark:text-white tabular-nums">{formatDecimalIndo(gk.energiKkal)} kkal</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[#091E5A] dark:text-slate-300">Protein</span>
                          <span className="font-extrabold text-[#091E5A] dark:text-white tabular-nums">{formatDecimalIndo(gk.proteinGram)} g</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[#091E5A] dark:text-slate-300">Lemak</span>
                          <span className="font-extrabold text-[#091E5A] dark:text-white tabular-nums">{formatDecimalIndo(gk.lemakGram)} g</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[#091E5A] dark:text-slate-300">Karbohidrat</span>
                          <span className="font-extrabold text-[#091E5A] dark:text-white tabular-nums">{formatDecimalIndo(gk.karbohidratGram)} g</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[#091E5A] dark:text-slate-300">Serat</span>
                          <span className="font-extrabold text-[#091E5A] dark:text-white tabular-nums">{formatDecimalIndo(gk.seratGram)} g</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* MIDDLE INFO: STATUS DATE & MENU TITLE                     */}
                  {/* ========================================================= */}
                  <div className="mt-4 space-y-2">
                    <div className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 font-medium">
                      {statusLabel}{' '}
                      <span className="italic font-bold text-slate-400 dark:text-slate-300 tabular-nums">
                        {dateHyphen}
                      </span>
                    </div>

                    <h3
                      className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100 uppercase leading-snug"
                      title={plusTitle}
                    >
                      {plusTitle}
                    </h3>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* BOTTOM ACTION BUTTONS ("Rincian" & "Selebihnya ->")       */}
                {/* ========================================================= */}
                <div className="mt-5 pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDetail(rec)}
                    className="px-5 py-2.5 rounded-lg bg-[#0D7FF2] hover:bg-blue-600 active:bg-blue-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Rincian</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('/menu-harian/form')}
                    className="px-5 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>Selebihnya</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal for Menu Image */}
      {fullscreenImageRec && (
        <div
          onClick={() => setFullscreenImageRec(null)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]"
          >
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {fullscreenImageRec.hariTanggalFormatted || formatIndoLongDate(fullscreenImageRec.tanggalOperasional)}
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white uppercase">
                  {formatPlusMenuTitle(fullscreenImageRec.namaMenu)}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setFullscreenImageRec(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-auto">
              <img
                src={fullscreenImageRec.fotoMenuUrl}
                alt={fullscreenImageRec.namaMenu}
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[78vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Rincian Menu Harian */}
      {selectedDetail && (() => {
        const gb = getGiziBesar(selectedDetail);
        const gk = getGiziKecil(selectedDetail);
        const dateLongIndo = selectedDetail.hariTanggalFormatted || formatIndoLongDate(selectedDetail.tanggalOperasional);

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    Rincian Menu Makan Bergizi Gratis (MBG)
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    {dateLongIndo}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetail(null)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto">
                {selectedDetail.fotoMenuUrl && (
                  <div className="w-full rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <img
                      src={selectedDetail.fotoMenuUrl}
                      alt={selectedDetail.namaMenu}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto max-h-[65vh] object-contain block"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-400">Komposisi Nama Menu</div>
                  <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white uppercase">
                    {formatPlusMenuTitle(selectedDetail.namaMenu)}
                  </div>
                </div>

                {/* Analisis Gizi Porsi Besar & Porsi Kecil */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-200/70 dark:border-indigo-900/50 space-y-2">
                    <div className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200">
                      Analisis Gizi — Porsi Besar
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span>Energi</span><span className="font-bold tabular-nums">{formatDecimalIndo(gb.energiKkal)} kkal</span></div>
                      <div className="flex justify-between"><span>Protein</span><span className="font-bold tabular-nums">{formatDecimalIndo(gb.proteinGram)} g</span></div>
                      <div className="flex justify-between"><span>Lemak</span><span className="font-bold tabular-nums">{formatDecimalIndo(gb.lemakGram)} g</span></div>
                      <div className="flex justify-between"><span>Karbohidrat</span><span className="font-bold tabular-nums">{formatDecimalIndo(gb.karbohidratGram)} g</span></div>
                      <div className="flex justify-between"><span>Serat</span><span className="font-bold tabular-nums">{formatDecimalIndo(gb.seratGram)} g</span></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/25 border border-emerald-200/70 dark:border-emerald-900/50 space-y-2">
                    <div className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                      Analisis Gizi — Porsi Kecil
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span>Energi</span><span className="font-bold tabular-nums">{formatDecimalIndo(gk.energiKkal)} kkal</span></div>
                      <div className="flex justify-between"><span>Protein</span><span className="font-bold tabular-nums">{formatDecimalIndo(gk.proteinGram)} g</span></div>
                      <div className="flex justify-between"><span>Lemak</span><span className="font-bold tabular-nums">{formatDecimalIndo(gk.lemakGram)} g</span></div>
                      <div className="flex justify-between"><span>Karbohidrat</span><span className="font-bold tabular-nums">{formatDecimalIndo(gk.karbohidratGram)} g</span></div>
                      <div className="flex justify-between"><span>Serat</span><span className="font-bold tabular-nums">{formatDecimalIndo(gk.seratGram)} g</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDetail(null);
                    if (onNavigate) onNavigate('/menu-harian/form');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Kelola di Form Menu Harian</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};
