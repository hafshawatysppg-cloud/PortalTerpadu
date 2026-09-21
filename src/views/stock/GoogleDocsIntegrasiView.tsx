import React, { useState } from 'react';
import { FileText, ExternalLink, Copy, Check, Plus, RefreshCw, Eye, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';

interface GoogleDocReport {
  id: string;
  title: string;
  docUrl: string;
  createdAt: string;
  modifiedAt: string;
  notes?: string;
  author: string;
}

export const GoogleDocsIntegrasiView: React.FC = () => {
  const [docsList, setDocsList] = useState<GoogleDocReport[]>([
    {
      id: 'DOC-2026-001',
      title: 'Laporan Stock Opname Dapur SPPG - Periode Agustus 2026',
      docUrl: 'https://docs.google.com/document/d/1_sppg_stock_opname_hafshawaty_report_2026/edit',
      createdAt: '2026-08-01 09:00',
      modifiedAt: '2026-08-08 16:30',
      notes: 'Dokumen Resmi Rekapitulasi Fisik Stok Bahan Baku & Aset Dapur SPPG',
      author: 'Pengelola Dapur Hafshawaty'
    },
    {
      id: 'DOC-2026-002',
      title: 'Auditing Stock & Perencanaan Menu Mingguan Dapur SPPG',
      docUrl: 'https://docs.google.com/document/d/1_menu_planning_kitchen_stock_audit_2026/edit',
      createdAt: '2026-07-25 10:15',
      modifiedAt: '2026-07-31 18:00',
      notes: 'Laporan Audit Bahan Baku Kering & Lauk Segar untuk Menu Mingguan',
      author: 'Budi Santoso, S.E.'
    }
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<GoogleDocReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateNewDoc = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const newDoc: GoogleDocReport = {
        id: `DOC-${now.getFullYear()}-${String(docsList.length + 1).padStart(3, '0')}`,
        title: `Laporan Stock Opname & Dapur SPPG - ${dateStr}`,
        docUrl: `https://docs.google.com/document/d/1_stock_opname_auto_generated_${Date.now()}/edit`,
        createdAt: now.toISOString().replace('T', ' ').slice(0, 16),
        modifiedAt: now.toISOString().replace('T', ' ').slice(0, 16),
        notes: 'Dokumen Otomatis Terintegrasi Portal Layanan Terpadu & Stock Opname',
        author: 'Pengelola Dapur Hafshawaty'
      };

      setDocsList([newDoc, ...docsList]);
      setIsGenerating(false);
      setSelectedDoc(newDoc);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-500/30 border border-blue-400/40 text-blue-200 text-[10px] font-extrabold uppercase rounded-full">
              Google Workspace Integration
            </span>
            <span className="text-xs text-blue-200">Google Docs Live Sync & Export</span>
          </div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-300" /> Integrasi Google Docs Stock Opname
          </h2>
          <p className="text-xs text-blue-100/80 mt-1 max-w-2xl leading-relaxed">
            Menghasilkan dokumen laporan resmi Stock Opname dalam format Google Docs untuk pengadaan, pimpinan, dan tim dapur SPPG secara instan.
          </p>
        </div>

        <button
          onClick={generateNewDoc}
          disabled={isGenerating}
          className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-300" />
          )}
          <span>Buat Dokumen Laporan Google Docs</span>
        </button>
      </div>

      {/* Synchronized Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docsList.map((doc) => (
          <div
            key={doc.id}
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:border-blue-300 transition space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {doc.title}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">ID: {doc.id}</span>
                </div>
              </div>

              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Synced
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              {doc.notes}
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Penulis: <strong className="text-slate-700 dark:text-slate-300">{doc.author}</strong></span>
              <span>Diubah: {doc.modifiedAt}</span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedDoc(doc)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-blue-500" /> Preview Laporan
              </button>

              <button
                onClick={() => handleCopyLink(doc.docUrl, doc.id)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-1"
                title="Salin Tautan Share Google Docs"
              >
                {copiedId === doc.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" /> Salin Link
                  </>
                )}
              </button>

              <a
                href={doc.docUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                title="Buka di Google Docs (Tab Baru)"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedDoc.title}</h3>
                  <span className="text-[10px] text-slate-400">Google Docs Template Rendering & Structure</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold"
              >
                Tutup Preview
              </button>
            </div>

            {/* Document Body Simulation */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
              {/* Header */}
              <div className="text-center pb-4 border-b border-slate-300 dark:border-slate-700 space-y-1">
                <h1 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  PORTAL LAYANAN TERPADU - DAPUR SPPG
                </h1>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  BERITA ACARA AUDIT STOCK OPNAME & PERENCANAAN BAHAN
                </p>
                <p className="text-[11px] text-slate-500">
                  Tanggal Pembuatan: {selectedDoc.createdAt} | Penulis: {selectedDoc.author}
                </p>
              </div>

              {/* Section 1 */}
              <div>
                <h2 className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300 mb-2">
                  1. RINGKASAN PERSAINGAN & KONDISI STOK
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Total SKU Bahan</span>
                    <strong className="text-slate-900 dark:text-white">4 SKU Master</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Nilai Persediaan</span>
                    <strong className="text-blue-600">Rp 321.125.000</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status Gudang</span>
                    <strong className="text-emerald-600">Aman / Stabil</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Stok Minimal Alert</span>
                    <strong className="text-amber-600">1 Item (Scanner)</strong>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div>
                <h2 className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300 mb-2">
                  2. RINCIAN PERHITUNGAN FISIK TERAKHIR
                </h2>
                <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700 text-[11px]">
                  <thead>
                    <tr className="bg-slate-200 dark:bg-slate-800 font-bold">
                      <th className="p-2 border">Kode</th>
                      <th className="p-2 border">Nama Bahan / Barang</th>
                      <th className="p-2 border text-right">Stok Sistem</th>
                      <th className="p-2 border text-right">Stok Fisik</th>
                      <th className="p-2 border text-right">Selisih</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border font-mono">BRG-ATK-001</td>
                      <td className="p-2 border">Kertas HVS A4 80gsm PaperOne</td>
                      <td className="p-2 border text-right">42 Box</td>
                      <td className="p-2 border text-right">42 Box</td>
                      <td className="p-2 border text-right font-bold text-emerald-600">0</td>
                    </tr>
                    <tr>
                      <td className="p-2 border font-mono">BRG-IT-003</td>
                      <td className="p-2 border">Barcode & QR Scanner Wireless</td>
                      <td className="p-2 border text-right">4 Unit</td>
                      <td className="p-2 border text-right">3 Unit</td>
                      <td className="p-2 border text-right font-bold text-rose-600">-1 Unit</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 3 */}
              <div>
                <h2 className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300 mb-2">
                  3. PENGESAHAN & CATATAN TIM AUDIT
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                  "Seluruh perhitungan fisik telah dicocokkan dengan fisik riil di Gudang Central Enterprise. Data telah disinkronkan secara otomatis ke Firestore Database."
                </p>
                <div className="grid grid-cols-2 gap-4 pt-6 text-center text-[11px]">
                  <div>
                    <p className="text-slate-400">Petugas Opname Dapur</p>
                    <div className="h-12"></div>
                    <strong className="text-slate-900 dark:text-white block">Budi Santoso, S.E.</strong>
                  </div>
                  <div>
                    <p className="text-slate-400">Mengetahui, Pengelola Utama</p>
                    <div className="h-12"></div>
                    <strong className="text-slate-900 dark:text-white block">Pengelola Dapur Hafshawaty</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <a
                href={selectedDoc.docUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" /> Buka Tautan Dokumen Google Docs
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
