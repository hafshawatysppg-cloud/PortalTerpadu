import React, { useState, useEffect } from 'react';
import { Layers, Search, Edit3, Check, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { MasterBarang } from '../../types';

export const StockAwalView: React.FC = () => {
  const [items, setItems] = useState<MasterBarang[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [editNote, setEditNote] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fetchBarang = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/stock/barang');
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarang();
  }, []);

  const handleStartEdit = (item: MasterBarang) => {
    setEditingId(item.id);
    setEditValue(item.stokAwal !== undefined ? item.stokAwal : item.stokSekarang);
    setEditNote('Penyesuaian Saldo Awal Gudang');
  };

  const handleSaveStockAwal = async (barangId: string) => {
    try {
      const res = await fetch('/api/v1/stock/stock-awal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barangId,
          stokAwal: Number(editValue),
          keterangan: editNote,
          petugas: 'Staf Stock Opname'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(`Stock awal berhasil disimpan!`);
        setTimeout(() => setSaveSuccess(null), 3000);
        setEditingId(null);
        fetchBarang();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = items.filter(i =>
    i.namaBarang.toLowerCase().includes(filter.toLowerCase()) ||
    i.kodeBarang.toLowerCase().includes(filter.toLowerCase()) ||
    i.gudangNama.toLowerCase().includes(filter.toLowerCase())
  );

  const totalStokAwal = items.reduce((acc, i) => acc + (i.stokAwal !== undefined ? i.stokAwal : i.stokSekarang), 0);
  const totalNilaiAwal = items.reduce((acc, i) => acc + ((i.stokAwal !== undefined ? i.stokAwal : i.stokSekarang) * i.hargaSatuan), 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" /> Pengaturan Stock Awal Barang
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manajemen saldo awal persediaan barang sebelum transaksi mutasi masuk/keluar harian.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
          <div>
            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold uppercase block">Total Qty Stock Awal</span>
            <span className="text-sm font-black text-amber-900 dark:text-amber-100">{totalStokAwal.toLocaleString('id-ID')} Pcs</span>
          </div>
          <div className="h-6 w-px bg-amber-200 dark:bg-amber-800"></div>
          <div>
            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold uppercase block">Total Nilai Saldo Awal</span>
            <span className="text-sm font-black text-amber-900 dark:text-amber-100">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalNilaiAwal)}
            </span>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> {saveSuccess}
        </div>
      )}

      {/* Filter */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode SKU, nama barang, atau gudang..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-transparent text-xs focus:outline-none"
          />
        </div>

        <button
          onClick={fetchBarang}
          className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          title="Refresh Table"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5">Kode SKU</th>
                <th className="p-3.5">Nama Barang</th>
                <th className="p-3.5">Gudang</th>
                <th className="p-3.5 text-center">Harga Satuan</th>
                <th className="p-3.5 text-center">Qty Stock Awal</th>
                <th className="p-3.5 text-center">Stok Saat Ini</th>
                <th className="p-3.5 text-center">Aksi / Pengaturan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map((item) => {
                const isEditing = editingId === item.id;
                const stokAwalVal = item.stokAwal !== undefined ? item.stokAwal : item.stokSekarang;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">{item.kodeBarang}</td>
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-white">{item.namaBarang}</td>
                    <td className="p-3.5 text-slate-500">{item.gudangNama}</td>
                    <td className="p-3.5 text-center font-medium">
                      Rp {item.hargaSatuan.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-amber-50 dark:bg-amber-950 border border-amber-300 text-center font-bold text-amber-900 dark:text-amber-100 rounded focus:outline-none"
                        />
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold rounded-lg border border-amber-200/60">
                          {stokAwalVal} {item.satuan}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-900 dark:text-slate-100">
                      {item.stokSekarang} {item.satuan}
                    </td>
                    <td className="p-3.5 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSaveStockAwal(item.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded transition flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" /> Simpan
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold text-[11px] rounded transition"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-700 dark:text-slate-300 font-medium text-[11px] rounded-lg transition flex items-center gap-1 mx-auto"
                        >
                          <Edit3 className="w-3 h-3" /> Set Stock Awal
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
