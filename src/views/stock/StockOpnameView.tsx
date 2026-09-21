import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Play, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink, Boxes } from 'lucide-react';
import { MasterBarang, StockOpnameSession } from '../../types';
import { Badge } from '../../components/common/Badge';

export const StockOpnameView: React.FC = () => {
  const [sessions, setSessions] = useState<StockOpnameSession[]>([]);
  const [barangList, setBarangList] = useState<MasterBarang[]>([]);
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);

  const [opnameItems, setOpnameItems] = useState<{
    barangId: string;
    kodeBarang: string;
    namaBarang: string;
    stokSistem: number;
    stokFisik: number;
    selisih: number;
    catatan: string;
  }[]>([]);

  const fetchData = async () => {
    try {
      const r1 = await fetch('/api/v1/stock/opname-sessions');
      const d1 = await r1.json();
      if (d1.success) setSessions(d1.data);

      const r2 = await fetch('/api/v1/stock/barang');
      const d2 = await r2.json();
      if (d2.success && Array.isArray(d2.data)) {
        setBarangList(d2.data);
        setOpnameItems(d2.data.map((b: MasterBarang) => ({
          barangId: b.id,
          kodeBarang: b.kodeBarang,
          namaBarang: b.namaBarang,
          stokSistem: b.stokSekarang,
          stokFisik: b.stokSekarang,
          selisih: 0,
          catatan: 'Hitung fisik sesuai sistem'
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFisikChange = (index: number, newFisik: number) => {
    setOpnameItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const sel = newFisik - item.stokSistem;
        return {
          ...item,
          stokFisik: newFisik,
          selisih: sel,
          catatan: sel === 0 ? 'Sesuai' : sel > 0 ? 'Surplus Fisik' : 'Defisit Fisik'
        };
      }
      return item;
    }));
  };

  const handleFinishSession = async () => {
    try {
      const res = await fetch('/api/v1/stock/opname-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gudangId: 'GDG-001',
          petugas: 'Budi Santoso, S.E. & Audit Team',
          items: opnameItems,
          catatanGeneral: 'Stock Opname Fisik Bulanan disetujui & disesuaikan.'
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsNewSessionOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-purple-600" /> Sesi Physical Stock Opname & Penyesuaian Stok
          </h2>
          <p className="text-xs text-slate-500">
            Perhitungan stok fisik lapangan, kalkulasi variansi selisih stok, & auto adjustment ke database
          </p>
        </div>

        <button
          onClick={() => setIsNewSessionOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <Play className="w-4 h-4" /> Mulai Sesi Opname Fisik Baru
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Riwayat Sesi Stock Opname</h3>
        {sessions.map((sess) => (
          <div key={sess.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                  {sess.kodeOpname}
                </span>
                <div className="text-xs text-slate-500">{sess.gudangNama} • Tanggal: {sess.tanggal}</div>
              </div>
              <Badge variant={sess.status === 'Selesai' ? 'success' : 'warning'}>
                {sess.status}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1">
                    <th className="py-1">Barang</th>
                    <th className="py-1">Stok Sistem</th>
                    <th className="py-1">Hitung Fisik</th>
                    <th className="py-1">Selisih (Variance)</th>
                    <th className="py-1">Catatan Auditor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sess.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-medium text-slate-900 dark:text-slate-100">
                        {it.namaBarang} ({it.kodeBarang})
                      </td>
                      <td className="py-2">{it.stokSistem}</td>
                      <td className="py-2 font-bold">{it.stokFisik}</td>
                      <td className="py-2">
                        <span className={`font-bold ${it.selisih === 0 ? 'text-slate-500' : it.selisih > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {it.selisih > 0 ? `+${it.selisih}` : it.selisih}
                        </span>
                      </td>
                      <td className="py-2 text-slate-500">{it.catatan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Runner Modal */}
      {isNewSessionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-purple-600" /> Sesi Hitung Fisik Stock Opname Lapangan
            </h3>
            <p className="text-xs text-slate-500">
              Masukkan hasil hitung fisik riil di gudang. Sistem secara otomatis menghitung selisih dan melakukan penyesuaian stok.
            </p>

            <div className="space-y-3">
              {opnameItems.map((item, idx) => (
                <div key={item.barangId} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{item.namaBarang}</div>
                    <div className="text-slate-500 font-mono">{item.kodeBarang} • Stok Sistem: <span className="font-semibold text-blue-600">{item.stokSistem}</span></div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block">Hitung Fisik</label>
                      <input
                        type="number"
                        min="0"
                        value={item.stokFisik}
                        onChange={(e) => handleFisikChange(idx, Number(e.target.value))}
                        className="w-20 p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold text-center"
                      />
                    </div>
                    <div className="text-right min-w-16">
                      <label className="text-[10px] font-bold text-slate-400 block">Selisih</label>
                      <span className={`font-bold text-sm ${item.selisih === 0 ? 'text-slate-500' : item.selisih > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.selisih > 0 ? `+${item.selisih}` : item.selisih}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsNewSessionOpen(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleFinishSession}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
              >
                Selesaikan Sesi & Penyesuaian Stok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
