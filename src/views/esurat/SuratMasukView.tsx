import React, { useState, useEffect } from 'react';
import { Mail, Plus, Search, QrCode, ArrowRight, Eye, CheckCircle, Clock, Send, ExternalLink } from 'lucide-react';
import { SuratMasuk } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';

export const SuratMasukView: React.FC = () => {
  const [items, setItems] = useState<SuratMasuk[]>([]);
  const [filter, setFilter] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SuratMasuk | null>(null);
  const [isDisposisiOpen, setIsDisposisiOpen] = useState(false);

  // Realtime Firestore synchronization across HP, Laptop & Desktop
  const { data: realtimeSuratMasuk } = useFirestoreRealtime<SuratMasuk>('suratMasuk');

  useEffect(() => {
    if (realtimeSuratMasuk && realtimeSuratMasuk.length > 0) {
      setItems(realtimeSuratMasuk);
    }
  }, [realtimeSuratMasuk]);

  // Form State
  const [form, setForm] = useState({
    nomorSurat: '',
    pengirim: '',
    perihal: '',
    sifat: 'Biasa' as SuratMasuk['sifat'],
    ringkasan: ''
  });

  const [disposisiForm, setDisposisiForm] = useState({
    penerimaDisposisi: 'Sekretariat / Tata Usaha & Divisi TIK',
    instruksi: 'Harap dipelajari dan ditindaklanjuti sesuai kewenangan.',
    sifat: 'Segera',
    batasWaktu: '2026-08-05'
  });

  const fetchSurat = async () => {
    try {
      const res = await fetch('/api/v1/esurat/surat-masuk');
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSurat();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/esurat/surat-masuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setForm({ nomorSurat: '', pengirim: '', perihal: '', sifat: 'Biasa', ringkasan: '' });
        fetchSurat();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisposisiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      const res = await fetch('/api/v1/esurat/disposisi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suratMasukId: selectedItem.id,
          ...disposisiForm
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsDisposisiOpen(false);
        setSelectedItem(null);
        fetchSurat();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter(i =>
    i.nomorSurat.toLowerCase().includes(filter.toLowerCase()) ||
    i.pengirim.toLowerCase().includes(filter.toLowerCase()) ||
    i.perihal.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* External e-Surat Digital Banner */}
      <div className="p-5 bg-gradient-to-r from-emerald-500/20 via-emerald-600/15 to-slate-900 border border-emerald-500/40 rounded-xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Aplikasi Web e-Surat Digital Terpadu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Akses cepat ke portal khusus e-Surat Digital (<span className="font-mono text-emerald-500 font-semibold">e-surat-digital-1.ai.studio</span>)
            </p>
          </div>
        </div>

        <a
          href="https://e-surat-digital-1.ai.studio"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md shrink-0"
        >
          <Mail className="w-4 h-4" /> Buka e-Surat Digital <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-600" /> Modul e-Surat: Surat Masuk Digital
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan agenda otomatis, verifikasi QR Code, dan penerbitan lembar disposisi digital
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Catat Surat Masuk
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari berdasarkan nomor surat, pengirim, atau perihal..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              <th className="p-3">No. Agenda</th>
              <th className="p-3">Nomor & Tanggal Surat</th>
              <th className="p-3">Pengirim</th>
              <th className="p-3">Perihal</th>
              <th className="p-3">Sifat</th>
              <th className="p-3">Status Disposisi</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                  {item.nomorAgenda}
                </td>
                <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                  {item.nomorSurat}
                  <div className="text-[10px] text-slate-400">Tgl: {item.tanggalSurat}</div>
                </td>
                <td className="p-3">{item.pengirim}</td>
                <td className="p-3 max-w-xs truncate">{item.perihal}</td>
                <td className="p-3">
                  <Badge variant={item.sifat === 'Sangat Rahasia' ? 'danger' : item.sifat === 'Penting' ? 'warning' : 'primary'}>
                    {item.sifat}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge variant={item.status === 'Baru' ? 'info' : item.status === 'Proses Disposisi' ? 'warning' : 'success'}>
                    {item.status}
                  </Badge>
                </td>
                <td className="p-3 text-right space-x-1">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium text-[11px]"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setIsDisposisiOpen(true);
                    }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-[11px]"
                  >
                    + Disposisi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Catat Surat Masuk Baru</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nomor Surat Asal</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 102/KEMENKEU/07/2026"
                  value={form.nomorSurat}
                  onChange={(e) => setForm({ ...form, nomorSurat: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Instansi Pengirim</label>
                <input
                  type="text"
                  required
                  placeholder="Nama instansi pengirim"
                  value={form.pengirim}
                  onChange={(e) => setForm({ ...form, pengirim: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Perihal Surat</label>
                <input
                  type="text"
                  required
                  placeholder="Perihal surat"
                  value={form.perihal}
                  onChange={(e) => setForm({ ...form, perihal: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Sifat Surat</label>
                <select
                  value={form.sifat}
                  onChange={(e) => setForm({ ...form, sifat: e.target.value as any })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="Biasa">Biasa</option>
                  <option value="Penting">Penting</option>
                  <option value="Rahasia">Rahasia</option>
                  <option value="Sangat Rahasia">Sangat Rahasia</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Ringkasan Isi Surat</label>
                <textarea
                  rows={3}
                  placeholder="Ringkasan atau poin penting..."
                  value={form.ringkasan}
                  onChange={(e) => setForm({ ...form, ringkasan: e.target.value })}
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
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Surat Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disposisi Modal */}
      {isDisposisiOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" /> Terbitkan Disposisi Digital
            </h3>
            <p className="text-xs text-slate-500">
              Disposisi untuk Surat: <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedItem.nomorSurat}</span>
            </p>

            <form onSubmit={handleDisposisiSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tujuan Disposisi (Divisi/Pegawai)</label>
                <input
                  type="text"
                  required
                  value={disposisiForm.penerimaDisposisi}
                  onChange={(e) => setDisposisiForm({ ...disposisiForm, penerimaDisposisi: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Instruksi Disposisi Pimpinan</label>
                <textarea
                  rows={3}
                  required
                  value={disposisiForm.instruksi}
                  onChange={(e) => setDisposisiForm({ ...disposisiForm, instruksi: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Sifat Disposisi</label>
                  <select
                    value={disposisiForm.sifat}
                    onChange={(e) => setDisposisiForm({ ...disposisiForm, sifat: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="Biasa">Biasa</option>
                    <option value="Penting">Penting</option>
                    <option value="Segera">Segera</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Batas Waktu Penyelesaian</label>
                  <input
                    type="date"
                    value={disposisiForm.batasWaktu}
                    onChange={(e) => setDisposisiForm({ ...disposisiForm, batasWaktu: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDisposisiOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                >
                  Kirim Disposisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && !isDisposisiOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
                  Detail Dokumen Surat Masuk Digital
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {selectedItem.nomorSurat}
                </h3>
              </div>
              <img src={selectedItem.qrCodeUrl} alt="QR Code" className="w-16 h-16 border rounded p-1 bg-white" />
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="py-1 flex justify-between">
                <span className="text-slate-400">Pengirim:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedItem.pengirim}</span>
              </div>
              <div className="py-1 flex justify-between">
                <span className="text-slate-400">Perihal:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 max-w-xs text-right">{selectedItem.perihal}</span>
              </div>
              <div className="py-1 flex justify-between">
                <span className="text-slate-400">Tanggal Terima:</span>
                <span>{selectedItem.tanggalTerima}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-400">Ringkasan:</span>
                <p className="mt-1 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                  {selectedItem.ringkasan || 'Tidak ada ringkasan.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
