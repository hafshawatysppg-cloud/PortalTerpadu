import React, { useState, useEffect } from 'react';
import { Mail, Plus, CheckCircle, Clock, FileText, QrCode, FileSpreadsheet, Check } from 'lucide-react';
import { SuratKeluar, TemplateSurat } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';

export const SuratKeluarView: React.FC = () => {
  const [items, setItems] = useState<SuratKeluar[]>([]);
  const [templates, setTemplates] = useState<TemplateSurat[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [generatedNumber, setGeneratedNumber] = useState('');

  // Realtime Firestore synchronization
  const { data: realtimeSuratKeluar } = useFirestoreRealtime<SuratKeluar>('suratKeluar');

  useEffect(() => {
    if (realtimeSuratKeluar && realtimeSuratKeluar.length > 0) {
      setItems(realtimeSuratKeluar);
    }
  }, [realtimeSuratKeluar]);

  const [form, setForm] = useState({
    nomorSurat: '',
    tujuan: '',
    perihal: '',
    templateId: 'TMP-001',
    pembuat: 'Siti Rahmawati, S.STP'
  });

  const fetchData = async () => {
    try {
      const res1 = await fetch('/api/v1/esurat/surat-keluar');
      const data1 = await res1.json();
      if (data1.success) setItems(data1.data);

      const res2 = await fetch('/api/v1/esurat/templates');
      const data2 = await res2.json();
      if (data2.success) setTemplates(data2.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateNumber = async () => {
    try {
      const res = await fetch('/api/v1/esurat/surat-keluar/generate-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ divisiCode: 'TIK' })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedNumber(data.data.nomorSurat);
        setForm(prev => ({ ...prev, nomorSurat: data.data.nomorSurat }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/esurat/surat-keluar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setForm({ nomorSurat: '', tujuan: '', perihal: '', templateId: 'TMP-001', pembuat: 'Siti Rahmawati, S.STP' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id: string, status: 'Disetujui' | 'Ditolak') => {
    try {
      const res = await fetch(`/api/v1/esurat/surat-keluar/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusApproval: status, approver: 'Dr. H. Ahmad Pratama, M.Kom' })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" /> Modul e-Surat: Surat Keluar & Approval
          </h2>
          <p className="text-xs text-slate-500">
            Penerbitan nomor surat otomatis, pemilihan template resmi, persetujuan pimpinan, & cetak PDF
          </p>
        </div>

        <button
          onClick={() => {
            handleGenerateNumber();
            setIsAddOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Buat Draft Surat Keluar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              <th className="p-3">Nomor Surat Otomatis</th>
              <th className="p-3">Tujuan Instansi</th>
              <th className="p-3">Perihal</th>
              <th className="p-3">Pembuat</th>
              <th className="p-3">Status Approval</th>
              <th className="p-3">Approver</th>
              <th className="p-3 text-right">Aksi Approval</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                  {item.nomorSurat}
                  <div className="text-[10px] text-slate-400">Tgl: {item.tanggalSurat}</div>
                </td>
                <td className="p-3 font-medium">{item.tujuan}</td>
                <td className="p-3 max-w-xs truncate">{item.perihal}</td>
                <td className="p-3">{item.pembuat}</td>
                <td className="p-3">
                  <Badge variant={item.statusApproval === 'Disetujui' ? 'success' : item.statusApproval === 'Ditolak' ? 'danger' : 'warning'}>
                    {item.statusApproval}
                  </Badge>
                </td>
                <td className="p-3 text-xs">{item.approver || '-'}</td>
                <td className="p-3 text-right space-x-1">
                  {item.statusApproval === 'Menunggu Approval' && (
                    <>
                      <button
                        onClick={() => handleApprove(item.id, 'Disetujui')}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px]"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(item.id, 'Ditolak')}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium text-[11px]"
                      >
                        Tolak
                      </button>
                    </>
                  )}
                  {item.statusApproval === 'Disetujui' && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                      <Check className="w-3.5 h-3.5" /> PDF Ready
                    </span>
                  )}
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Buat Surat Keluar Baru</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nomor Surat Otomatis</label>
                  <button
                    type="button"
                    onClick={handleGenerateNumber}
                    className="text-[10px] text-blue-600 hover:underline font-semibold"
                  >
                    Generate Ulang
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={form.nomorSurat}
                  onChange={(e) => setForm({ ...form, nomorSurat: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Pilih Template Surat Resmi</label>
                <select
                  value={form.templateId}
                  onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.nama} ({t.kategori})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Instansi Tujuan</label>
                <input
                  type="text"
                  required
                  placeholder="Instansi atau nama tujuan"
                  value={form.tujuan}
                  onChange={(e) => setForm({ ...form, tujuan: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Perihal Surat</label>
                <input
                  type="text"
                  required
                  placeholder="Perihal surat keluar"
                  value={form.perihal}
                  onChange={(e) => setForm({ ...form, perihal: e.target.value })}
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
                  Ajukan untuk Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
