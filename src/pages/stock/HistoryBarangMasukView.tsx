import React, { useState, useEffect } from 'react';
import { ArrowDownRight, Search, FileSpreadsheet, FileText, Download, Calendar, Filter, RefreshCw } from 'lucide-react';
import { StockMovement } from '../../types';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
autoTable; // side effect import check
import autoTable from 'jspdf-autotable';

export const HistoryBarangMasukView: React.FC = () => {
  const { data: realtimeMovements } = useFirestoreRealtime<StockMovement>('stockMovements');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  useEffect(() => {
    if (realtimeMovements && realtimeMovements.length > 0) {
      const inMovements = realtimeMovements.filter(m => m.jenis === 'Masuk');
      setMovements(inMovements);
      setLoading(false);
    }
  }, [realtimeMovements]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/stock/movements');
      const data = await res.json();
      if (data.success) {
        const inMovements = (data.data as StockMovement[]).filter(m => m.jenis === 'Masuk');
        setMovements(inMovements);
      }
    } catch (err) {
      console.error('Error fetching inbound history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filtered = movements.filter(m => {
    const matchSearch =
      m.namaBarang.toLowerCase().includes(search.toLowerCase()) ||
      m.kodeBarang.toLowerCase().includes(search.toLowerCase()) ||
      m.referensiNota.toLowerCase().includes(search.toLowerCase()) ||
      (m.sumberSupplier && m.sumberSupplier.toLowerCase().includes(search.toLowerCase())) ||
      (m.petugas && m.petugas.toLowerCase().includes(search.toLowerCase()));

    const mDate = m.tanggal.split(' ')[0];
    const matchStart = !dateStart || mDate >= dateStart;
    const matchEnd = !dateEnd || mDate <= dateEnd;

    return matchSearch && matchStart && matchEnd;
  });

  const totalVolume = filtered.reduce((acc, m) => acc + (Number(m.jumlah) || 0), 0);
  const totalNilai = filtered.reduce((acc, m) => acc + (Number(m.totalHarga) || (m.jumlah * (m.hargaSatuan || 0))), 0);

  const exportExcel = () => {
    const dataToExport = filtered.map((m, idx) => ({
      No: idx + 1,
      Tanggal: m.tanggal,
      'No Ref Nota': m.referensiNota,
      Supplier: m.sumberSupplier || '-',
      'Kode Barang': m.kodeBarang,
      'Nama Barang': m.namaBarang,
      'Jumlah Masuk': m.jumlah,
      'Harga Satuan (Rp)': m.hargaSatuan || 0,
      'Total Nilai (Rp)': m.totalHarga || (m.jumlah * (m.hargaSatuan || 0)),
      Gudang: m.gudangNama,
      Petugas: m.petugas,
      Keterangan: m.keterangan || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat_Barang_Masuk');
    XLSX.writeFile(workbook, `History_Barang_Masuk_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('RIWAYAT TRANSAKSI BARANG MASUK (INBOUND LOG)', 14, 15);
    doc.setFontSize(9);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Total Item: ${filtered.length}`, 14, 22);

    const tableColumn = ['No', 'Tanggal', 'Ref Nota', 'Supplier', 'Barang', 'Jumlah', 'Total Nilai (Rp)', 'Petugas'];
    const tableRows = filtered.map((m, idx) => [
      idx + 1,
      m.tanggal,
      m.referensiNota,
      m.sumberSupplier || '-',
      `${m.namaBarang} (${m.kodeBarang})`,
      m.jumlah,
      (m.totalHarga || (m.jumlah * (m.hargaSatuan || 0))).toLocaleString('id-ID'),
      m.petugas
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    doc.save(`History_Barang_Masuk_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold uppercase rounded-full">
              Audit Inbound Log
            </span>
            <span className="text-xs text-slate-500">Rekapitulasi Restock & Pengadaan Goods-In</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ArrowDownRight className="w-6 h-6 text-emerald-600" /> Riwayat Transaksi Barang Masuk
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition"
            title="Refresh Log"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={exportPDF}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Transaksi Masuk</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{filtered.length} Transaksi</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Volume Barang Masuk</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{totalVolume.toLocaleString('id-ID')} Pcs/Kg</span>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Nilai Pembelian (Rp)</span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400">
            Rp {totalNilai.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nota, barang, supplier, petugas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
          <span className="text-xs text-slate-400">s/d</span>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              <th className="p-3">Tanggal & Jam</th>
              <th className="p-3">Ref Nota / PO</th>
              <th className="p-3">Supplier / Sumber</th>
              <th className="p-3">Barang & SKU</th>
              <th className="p-3 text-right">Jumlah</th>
              <th className="p-3 text-right">Harga Satuan</th>
              <th className="p-3 text-right">Total Rp</th>
              <th className="p-3">Petugas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                  Tidak ada riwayat barang masuk ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono text-[11px] text-slate-500">{m.tanggal}</td>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">{m.referensiNota}</td>
                  <td className="p-3 font-medium">{m.sumberSupplier || 'Toko / Distributor Utama'}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{m.namaBarang}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{m.kodeBarang}</div>
                  </td>
                  <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                    +{m.jumlah}
                  </td>
                  <td className="p-3 text-right">Rp {(m.hargaSatuan || 0).toLocaleString('id-ID')}</td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    Rp {(m.totalHarga || (m.jumlah * (m.hargaSatuan || 0))).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{m.petugas}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
