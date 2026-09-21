import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Download, ArrowDownRight, ArrowUpRight, Layers, ClipboardCheck, RefreshCw } from 'lucide-react';
import { StockMovement } from '../../types';

export const StockRiwayatView: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filterText, setFilterText] = useState('');
  const [selectedJenis, setSelectedJenis] = useState<string>('Semua');
  const [loading, setLoading] = useState(false);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/stock/movements');
      const data = await res.json();
      if (data.success) setMovements(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  const filtered = movements.filter(m => {
    const matchType = selectedJenis === 'Semua' || m.jenis === selectedJenis;
    const matchText =
      m.namaBarang.toLowerCase().includes(filterText.toLowerCase()) ||
      m.kodeBarang.toLowerCase().includes(filterText.toLowerCase()) ||
      m.referensiNota.toLowerCase().includes(filterText.toLowerCase()) ||
      m.petugas.toLowerCase().includes(filterText.toLowerCase()) ||
      m.keterangan.toLowerCase().includes(filterText.toLowerCase());
    return matchType && matchText;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Jenis Transaksi', 'Kode SKU', 'Nama Barang', 'Jumlah Qty', 'Gudang', 'No Referensi', 'Petugas', 'Keterangan'];
    const rows = filtered.map(m => [
      m.id,
      m.tanggal,
      m.jenis,
      m.kodeBarang,
      `"${m.namaBarang}"`,
      m.jumlah,
      `"${m.gudangNama}"`,
      m.referensiNota,
      `"${m.petugas}"`,
      `"${m.keterangan}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Riwayat_Stock_Opname_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-600" /> Riwayat Mutasi & Audit Trail Pergerakan Stok
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log lengkap dan kronologis seluruh transaksi barang masuk, barang keluar, saldo stock awal, dan penyesuaian opname fisik.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" /> Export CSV / Excel
        </button>
      </div>

      {/* Filter Controls */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi, nomor nota, SKU, petugas, atau keterangan..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-transparent focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="Semua">Semua Jenis Transaksi</option>
            <option value="Masuk">Barang Masuk</option>
            <option value="Keluar">Barang Keluar</option>
            <option value="Stock Awal">Stock Awal</option>
            <option value="Penyesuaian Opname">Penyesuaian Opname</option>
          </select>

          <button
            onClick={fetchMovements}
            className="p-2 text-slate-500 hover:text-slate-800 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Timeline / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5">Tanggal & Waktu</th>
                <th className="p-3.5">Jenis Transaksi</th>
                <th className="p-3.5">Kode SKU / Barang</th>
                <th className="p-3.5 text-center">Jumlah Qty</th>
                <th className="p-3.5">Gudang</th>
                <th className="p-3.5">No. Referensi / Nota</th>
                <th className="p-3.5">Petugas Operator</th>
                <th className="p-3.5">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                  <td className="p-3.5 whitespace-nowrap font-mono text-slate-500">{m.tanggal}</td>
                  <td className="p-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      m.jenis === 'Masuk'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : m.jenis === 'Keluar'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : m.jenis === 'Stock Awal'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {m.jenis === 'Masuk' && <ArrowDownRight className="w-3 h-3" />}
                      {m.jenis === 'Keluar' && <ArrowUpRight className="w-3 h-3" />}
                      {m.jenis === 'Stock Awal' && <Layers className="w-3 h-3" />}
                      {m.jenis === 'Penyesuaian Opname' && <ClipboardCheck className="w-3 h-3" />}
                      {m.jenis}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 dark:text-white block">{m.namaBarang}</span>
                    <span className="text-[10px] font-mono text-slate-400">{m.kodeBarang}</span>
                  </td>
                  <td className="p-3.5 text-center font-black">
                    <span className={`text-xs ${
                      m.jenis === 'Masuk' ? 'text-emerald-600' : m.jenis === 'Keluar' ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {m.jenis === 'Masuk' ? '+' : m.jenis === 'Keluar' ? '-' : ''}{m.jumlah}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500">{m.gudangNama}</td>
                  <td className="p-3.5 font-mono font-semibold text-slate-800 dark:text-slate-200">{m.referensiNota}</td>
                  <td className="p-3.5 font-medium">{m.petugas}</td>
                  <td className="p-3.5 text-slate-500 max-w-xs truncate">{m.keterangan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
