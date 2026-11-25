import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, RefreshCw } from 'lucide-react';
import { MasterBarang, StockMovement } from '../../types';
import { Badge } from '../../components/common/Badge';

export const StockMovementView: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [barangList, setBarangList] = useState<MasterBarang[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [form, setForm] = useState({
    jenis: 'Masuk' as 'Masuk' | 'Keluar',
    barangId: '',
    jumlah: 10,
    referensiNota: '',
    keterangan: '',
    petugas: 'Budi Santoso, S.E.'
  });

  const fetchData = async () => {
    try {
      const r1 = await fetch('/api/v1/stock/movements');
      const d1 = await r1.json();
      if (d1.success) setMovements(d1.data);

      const r2 = await fetch('/api/v1/stock/barang');
      const d2 = await r2.json();
      if (d2.success) {
        setBarangList(d2.data);
        if (d2.data.length > 0 && !form.barangId) {
          setForm(prev => ({ ...prev, barangId: d2.data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/stock/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setForm(prev => ({ ...prev, jumlah: 10, referensiNota: '', keterangan: '' }));
        fetchData();
      } else {
        alert(data.message || 'Gagal menyimpan transaksi stok');
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
            <RefreshCw className="w-5 h-5 text-blue-600" /> Modul Stock Opname: Transaksi Barang Masuk & Keluar
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan mutasi mutasi masuk/keluar barang dengan pembaruan otomatis saldo stok gudang
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Catat Transaksi Stok
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              <th className="p-3">Waktu Transaksi</th>
              <th className="p-3">Jenis Mutasi</th>
              <th className="p-3">Barang & Kode</th>
              <th className="p-3">Jumlah</th>
              <th className="p-3">Gudang</th>
              <th className="p-3">Ref. Nota</th>
              <th className="p-3">Petugas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {movements.map((mov) => (
              <tr key={mov.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                <td className="p-3 font-medium text-slate-900 dark:text-slate-100">{mov.tanggal}</td>
                <td className="p-3">
                  <Badge variant={mov.jenis === 'Masuk' ? 'success' : 'danger'}>
                    {mov.jenis === 'Masuk' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    Stok {mov.jenis}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{mov.namaBarang}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{mov.kodeBarang}</div>
                </td>
                <td className="p-3 font-bold text-base">
                  {mov.jenis === 'Masuk' ? `+${mov.jumlah}` : `-${mov.jumlah}`}
                </td>
                <td className="p-3">{mov.gudangNama}</td>
                <td className="p-3 font-mono">{mov.referensiNota}</td>
                <td className="p-3">{mov.petugas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Catat Mutasi Stok Barang</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, jenis: 'Masuk' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      form.jenis === 'Masuk'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    + Barang Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, jenis: 'Keluar' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      form.jenis === 'Keluar'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    - Barang Keluar
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Pilih Barang SKU</label>
                <select
                  value={form.barangId}
                  onChange={(e) => setForm({ ...form, barangId: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  {barangList.map(b => (
                    <option key={b.id} value={b.id}>
                      [{b.kodeBarang}] {b.namaBarang} (Stok: {b.stokSekarang} {b.satuan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Jumlah Mutasi</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.jumlah}
                  onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Referensi Nota / PO / Request</label>
                <input
                  type="text"
                  placeholder="PO-2026-XXXX atau Nota pengeluaran"
                  value={form.referensiNota}
                  onChange={(e) => setForm({ ...form, referensiNota: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
