import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, CheckCircle, Save, AlertTriangle, FileText, RefreshCw, Calendar, Building, Printer } from 'lucide-react';
import { MasterBarang, StockOpnameSession, MasterGudang } from '../../types';
import { GlobalReportHeader } from '../../components/document/GlobalReportHeader';
import { GlobalReportFooter } from '../../components/document/GlobalReportFooter';
import { DocumentSignatures } from '../../components/document/DocumentSignatures';

export const StockOpnamePhysicalView: React.FC = () => {
  const [sessions, setSessions] = useState<StockOpnameSession[]>([]);
  const [barangList, setBarangList] = useState<MasterBarang[]>([]);
  const [gudangList, setGudangList] = useState<MasterGudang[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedGudangId, setSelectedGudangId] = useState('GDG-001');
  const [petugas, setPetugas] = useState('Budi Santoso, S.E. & Tim Audit');
  const [catatanGeneral, setCatatanGeneral] = useState('Sesi opname fisik pergudangan bulanan');

  // Interactive counting items map
  const [counts, setCounts] = useState<{ [barangId: string]: { fisik: number; catatan: string } }>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resS, resB, resG] = await Promise.all([
        fetch('/api/v1/stock/opname-sessions'),
        fetch('/api/v1/stock/barang'),
        fetch('/api/v1/master/gudang')
      ]);

      const dS = await resS.json();
      if (dS.success) setSessions(dS.data);

      const dB = await resB.json();
      if (dB.success) {
        setBarangList(dB.data);
        // Initialize counts
        const initMap: { [id: string]: { fisik: number; catatan: string } } = {};
        dB.data.forEach((b: MasterBarang) => {
          initMap[b.id] = { fisik: b.stokSekarang, catatan: '' };
        });
        setCounts(initMap);
      }

      const dG = await resG.json();
      if (dG.success) setGudangList(dG.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFisikChange = (barangId: string, val: number) => {
    setCounts(prev => ({
      ...prev,
      [barangId]: { ...prev[barangId], fisik: Math.max(0, val) }
    }));
  };

  const handleCatatanChange = (barangId: string, text: string) => {
    setCounts(prev => ({
      ...prev,
      [barangId]: { ...prev[barangId], catatan: text }
    }));
  };

  const filteredBarangByGudang = barangList.filter(b => !selectedGudangId || b.gudangId === selectedGudangId);

  const handleSubmitSession = async () => {
    const sessionItems = filteredBarangByGudang.map(b => {
      const cnt = counts[b.id] || { fisik: b.stokSekarang, catatan: '' };
      const selisih = cnt.fisik - b.stokSekarang;
      return {
        barangId: b.id,
        kodeBarang: b.kodeBarang,
        namaBarang: b.namaBarang,
        stokSistem: b.stokSekarang,
        stokFisik: cnt.fisik,
        selisih: selisih,
        catatan: cnt.catatan || (selisih === 0 ? 'Sesuai Fisik' : `Selisih ${selisih > 0 ? '+' : ''}${selisih} ${b.satuan}`)
      };
    });

    try {
      const res = await fetch('/api/v1/stock/opname-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gudangId: selectedGudangId,
          petugas,
          catatanGeneral,
          items: sessionItems
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Sesi Stock Opname ${data.data.kodeOpname} berhasil disimpan dan stok sistem telah disesuaikan.`);
        setTimeout(() => setSuccessMsg(null), 5000);
        setIsSessionOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Official Letterhead Header for Print / PDF Archival */}
      <div className="hidden print:block print-official-header">
        <GlobalReportHeader
          title="BERITA ACARA AUDIT STOCK OPNAME FISIK & REKONSILIASI PERSEDIAAN"
          subTitle="Hasil Penghitungan Fisik Inventaris Gudang, Kalkulasi Selisih (Variance Gap), & Penyesuaian Saldo Sistem"
          documentNumber={`BA-SOP/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getDate().toString().padStart(2, '0')}`}
          documentDate={new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          metadata={[
            { label: 'Gudang Objek Audit', value: gudangList.find(g => g.id === selectedGudangId)?.nama || 'Gudang Central Operasional' },
            { label: 'Tim Auditor / Petugas', value: petugas },
            { label: 'Sifat Dokumen', value: 'Berita Acara Resmi Persediaan (Arsip Fisik)' },
            { label: 'Klasifikasi Rekonsiliasi', value: 'Audit Fisik Berkala Bulanan' }
          ]}
        />
      </div>

      {/* Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-amber-600" /> Sesi Opname Fisik & Penyesuaian Selisih
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pelaksanaan audit hitung fisik persediaan barang gudang, kalkulasi selisih (opname gap), dan sinkronisasi stok otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-xs transition flex items-center gap-2 cursor-pointer"
            title="Cetak Berita Acara Opname Fisik (PDF / Kertas)"
          >
            <Printer className="w-4 h-4 text-amber-600" />
            <span>Cetak Berita Acara (PDF)</span>
          </button>

          <button
            onClick={() => setIsSessionOpen(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Mulai Sesi Opname Fisik Baru
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" /> {successMsg}
        </div>
      )}

      {/* Sesi Opname Sheet (Modal / Section) */}
      {isSessionOpen && (
        <div className="p-6 bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase rounded-md">
                Lembar Kerja Audit Opname Fisik Active
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                Formulir Hitung Fisik Barang Gudang
              </h3>
            </div>

            <button
              onClick={() => setIsSessionOpen(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition"
            >
              Tutup / Batal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Gudang Target Audit</label>
              <select
                value={selectedGudangId}
                onChange={(e) => setSelectedGudangId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none"
              >
                {gudangList.map(g => (
                  <option key={g.id} value={g.id}>{g.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tim Auditor / Petugas</label>
              <input
                type="text"
                value={petugas}
                onChange={(e) => setPetugas(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Catatan Audit</label>
              <input
                type="text"
                value={catatanGeneral}
                onChange={(e) => setCatatanGeneral(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Interactive Table for Counting */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">Kode SKU</th>
                  <th className="p-3">Nama Barang</th>
                  <th className="p-3 text-center">Stok Sistem</th>
                  <th className="p-3 text-center">Hasil Hitung Fisik</th>
                  <th className="p-3 text-center">Selisih (Gap)</th>
                  <th className="p-3">Catatan / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBarangByGudang.map((b) => {
                  const cnt = counts[b.id] || { fisik: b.stokSekarang, catatan: '' };
                  const selisih = cnt.fisik - b.stokSekarang;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{b.kodeBarang}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{b.namaBarang}</td>
                      <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-400">
                        {b.stokSekarang} {b.satuan}
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={cnt.fisik}
                          onChange={(e) => handleFisikChange(b.id, Number(e.target.value))}
                          className="w-24 px-2 py-1 bg-amber-50 dark:bg-amber-950 border border-amber-300 font-black text-center text-amber-900 dark:text-amber-100 rounded-lg focus:outline-none"
                        />
                      </td>
                      <td className="p-3 text-center font-black">
                        {selisih === 0 ? (
                          <span className="text-emerald-600 font-bold">0 (Sesuai)</span>
                        ) : selisih > 0 ? (
                          <span className="text-blue-600 font-black">+{selisih} {b.satuan}</span>
                        ) : (
                          <span className="text-rose-600 font-black">{selisih} {b.satuan}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="Keterangan selisih jika ada..."
                          value={cnt.catatan}
                          onChange={(e) => handleCatatanChange(b.id, e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500 italic">
              * Menyimpan sesi opname fisik akan secara otomatis memperbarui saldo stok sistem dengan angka hasil hitung fisik.
            </p>

            <button
              onClick={handleSubmitSession}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Selesaikan & Penyesuaian Stok System
            </button>
          </div>
        </div>
      )}

      {/* Riwayat Sesi Opname Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
            Riwayat Sesi Stock Opname Fisik
          </h3>
          <button onClick={fetchData} className="p-1 text-slate-400 hover:text-slate-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {sessions.map((sess) => (
            <div key={sess.id} className="p-4 space-y-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold text-xs rounded-lg">
                    {sess.kodeOpname}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">{sess.gudangNama}</span>
                    <span className="text-[11px] text-slate-400">Tanggal: {sess.tanggal} &bull; Auditor: {sess.petugas}</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] rounded-full uppercase tracking-wider self-start sm:self-center">
                  Status: {sess.status}
                </span>
              </div>

              {sess.catatanGeneral && (
                <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                  Catatan: {sess.catatanGeneral}
                </p>
              )}

              {/* Items summary */}
              {Array.isArray(sess.items) && sess.items.length > 0 && (
                <div className="bg-slate-50/60 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Item Hasil Hitung Fisik ({sess.items.length} SKU):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                    {sess.items.map((it, idx) => (
                      <div key={idx} className="p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{it.namaBarang}</span>
                        <span className={`font-bold ml-2 ${it.selisih === 0 ? 'text-slate-500' : it.selisih > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                          {it.stokFisik} (selisih {it.selisih > 0 ? '+' : ''}{it.selisih})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Official Signatures & Archival Footer for Print */}
      <div className="hidden print:block print-signatures">
        <DocumentSignatures
          leftTitle="Tim Petugas Pelaksana Hitung Fisik"
          leftName={petugas}
          leftRole="Auditor Lapangan Gudang"
          rightTitle="Penanggung Jawab Gudang & Logistik"
          rightName="Hendra Kusuma, S.T."
          rightRole="Kepala Seksi Manajemen Logistik & Gudang"
          rightNip="19820719 200801 1 007"
        />
        <GlobalReportFooter
          qrValue={`https://pat-bgn.go.id/verify/stock-opname/${selectedGudangId}-archival-2026`}
          showSystemWatermark={true}
          isPrintPreview={true}
        />
      </div>
    </div>
  );
};
