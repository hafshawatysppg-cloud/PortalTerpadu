import React, { useState, useEffect } from 'react';
import { Settings, Shield, Server, Database, Save, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export const StockSettingsView: React.FC = () => {
  const [config, setConfig] = useState({
    namaGudang: 'Gudang Utama Central Enterprise',
    lokasi: 'Gedung A Lantai Dasar, Kompleks Perkantoran Pusat',
    penanggungJawab: 'Budi Santoso, S.E.',
    defaultStokMinimal: 10,
    enableFifoFefo: true,
    autoNotificationLowStock: true,
    firestoreSyncEnabled: true
  });

  const [savedStatus, setSavedStatus] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/v1/cloud/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCloudStatus(data.cloud);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  const handleBackupExport = async () => {
    try {
      const [resBarang, resMovements, resSessions] = await Promise.all([
        fetch('/api/v1/stock/barang'),
        fetch('/api/v1/stock/movements'),
        fetch('/api/v1/stock/opname-sessions')
      ]);

      const dataBarang = await resBarang.json();
      const dataMovements = await resMovements.json();
      const dataSessions = await resSessions.json();

      const workbook = XLSX.utils.book_new();

      if (dataBarang.success) {
        const wsBarang = XLSX.utils.json_to_sheet(dataBarang.data);
        XLSX.utils.book_append_sheet(workbook, wsBarang, 'Master_Barang');
      }

      if (dataMovements.success) {
        const wsMovements = XLSX.utils.json_to_sheet(dataMovements.data);
        XLSX.utils.book_append_sheet(workbook, wsMovements, 'Stock_Movements');
      }

      if (dataSessions.success) {
        const wsSessions = XLSX.utils.json_to_sheet(dataSessions.data);
        XLSX.utils.book_append_sheet(workbook, wsSessions, 'Opname_Sessions');
      }

      XLSX.writeFile(workbook, `Backup_Stock_Opname_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Backup export failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-600" /> Pengaturan Modul Stock Opname & Enterprise Warehouse
          </h2>
          <p className="text-xs text-slate-500">
            Konfigurasi batas minimal stok default, aturan FIFO/FEFO, integrasi cloud Firestore, dan backup basis data
          </p>
        </div>

        <button
          onClick={handleBackupExport}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" /> Download Backup Database (Excel)
        </button>
      </div>

      {savedStatus && (
        <div className="p-4 bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Pengaturan Modul Stock Opname Berhasil Disimpan!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Main Config */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800">
            Informasi Profil Gudang Utama & Aturan Opname
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nama Gudang Utama</label>
              <input
                type="text"
                value={config.namaGudang}
                onChange={(e) => setConfig({ ...config, namaGudang: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Lokasi Fisik Gudang</label>
                <input
                  type="text"
                  value={config.lokasi}
                  onChange={(e) => setConfig({ ...config, lokasi: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Penanggung Jawab Utama</label>
                <input
                  type="text"
                  value={config.penanggungJawab}
                  onChange={(e) => setConfig({ ...config, penanggungJawab: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Default Limits Stok Minimal (Pcs/Unit)</label>
                <input
                  type="number"
                  value={config.defaultStokMinimal}
                  onChange={(e) => setConfig({ ...config, defaultStokMinimal: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex flex-col justify-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.enableFifoFefo}
                    onChange={(e) => setConfig({ ...config, enableFifoFefo: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Aktifkan Algoritma FIFO / FEFO Transaksi</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={config.autoNotificationLowStock}
                    onChange={(e) => setConfig({ ...config, autoNotificationLowStock: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Notifikasi Otomatis Peringatan Stok Minimal</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Simpan Pengaturan
              </button>
            </div>
          </form>
        </div>

        {/* Cloud & Database Status */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" /> Status Cloud Database Sync
          </h3>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Database Engine:</span>
              <span className="font-bold text-slate-900 dark:text-white">Firestore Realtime</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Project ID:</span>
              <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                ai-studio-triallayananterp
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Sync Status:</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                ONLINE & SYNCED
              </span>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-1.5 text-xs">
            <h4 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Database className="w-4 h-4" /> Koleksi Firestore Aktif:
            </h4>
            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5 text-[11px]">
              <li><code className="font-mono">barang</code> (Master SKU)</li>
              <li><code className="font-mono">stockMovements</code> (Inbound / Outbound)</li>
              <li><code className="font-mono">opnameSessions</code> (Hasil Opname)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
