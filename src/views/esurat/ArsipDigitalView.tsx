import React, { useState, useEffect } from 'react';
import { Archive, QrCode, Search, Eye, Download, ShieldCheck } from 'lucide-react';
import { SuratMasuk, SuratKeluar } from '../../types';
import { Badge } from '../../components/common/Badge';

export const ArsipDigitalView: React.FC = () => {
  const [suratMasuk, setSuratMasuk] = useState<SuratMasuk[]>([]);
  const [suratKeluar, setSuratKeluar] = useState<SuratKeluar[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/v1/esurat/surat-masuk')
      .then(res => res.json())
      .then(data => { if (data.success) setSuratMasuk(data.data); });

    fetch('/api/v1/esurat/surat-keluar')
      .then(res => res.json())
      .then(data => { if (data.success) setSuratKeluar(data.data); });
  }, []);

  const allArchives = [
    ...suratMasuk.map(s => ({ ...s, tipe: 'Surat Masuk' })),
    ...suratKeluar.map(s => ({ ...s, tipe: 'Surat Keluar' }))
  ].filter(item =>
    item.nomorSurat.toLowerCase().includes(search.toLowerCase()) ||
    (item.perihal || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Archive className="w-5 h-5 text-emerald-600" /> Arsip Digital e-Surat & Otentikasi QR Code
        </h2>
        <p className="text-xs text-slate-500">
          Repositori penyimpanan dokumen resmi digital terpusat dengan verifikasi otentisitas tanda tangan digital QR Code
        </p>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nomor arsip digital, pengirim/tujuan, atau perihal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              <th className="p-3">Tipe Dokumen</th>
              <th className="p-3">Nomor Surat Resmi</th>
              <th className="p-3">Perihal / Subjek</th>
              <th className="p-3">Otentikasi TTD</th>
              <th className="p-3 text-right">Preview Dokumen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {allArchives.map((doc, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                <td className="p-3">
                  <Badge variant={doc.tipe === 'Surat Masuk' ? 'primary' : 'success'}>
                    {doc.tipe}
                  </Badge>
                </td>
                <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">{doc.nomorSurat}</td>
                <td className="p-3 max-w-xs truncate">{doc.perihal}</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi QR
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded font-medium text-[11px] inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View PDF & QR
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-600">Dokumen Arsip Resmi</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedDoc.nomorSurat}</h3>
              </div>
              <img src={selectedDoc.qrCodeUrl} alt="QR Code" className="w-16 h-16 border rounded p-1 bg-white" />
            </div>

            <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/40 space-y-3 font-serif">
              <div className="text-center border-b pb-2 border-slate-300 dark:border-slate-700">
                <div className="font-bold text-sm tracking-wide text-slate-900 dark:text-slate-100">PEMERINTAH KOTA ADMINISTRASI TERPADU</div>
                <div className="text-[10px] text-slate-500 font-sans">Jalan Utama Kompleks Perkantoran Terpadu No. 1</div>
              </div>

              <div className="text-xs space-y-1 font-sans">
                <div>Nomor: <span className="font-mono font-bold">{selectedDoc.nomorSurat}</span></div>
                <div>Perihal: <span className="font-semibold">{selectedDoc.perihal}</span></div>
              </div>

              <div className="text-xs leading-relaxed py-2 font-sans text-slate-700 dark:text-slate-300">
                Dokumen ini merupakan arsip digital sah yang diterbitkan melalui Portal Administrasi Terpadu. Seluruh otentisitas tanda tangan dan stempel telah terekam dalam ledger otentikasi QR Code.
              </div>

              <div className="pt-4 flex justify-end font-sans">
                <div className="text-center space-y-1">
                  <img src={selectedDoc.qrCodeUrl} alt="QR TTD" className="w-16 h-16 mx-auto border bg-white p-1" />
                  <div className="text-[9px] text-slate-400 font-mono">Digitally Signed by Portal SSO</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
