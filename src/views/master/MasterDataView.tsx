import React, { useState, useEffect } from 'react';
import { 
  Database, Plus, Users, Building, Warehouse, Tag, Landmark, Search, 
  CloudCheck, RefreshCw, Pencil, Trash2, CheckCircle2, AlertTriangle, X, Shield, Lock, Phone, Mail
} from 'lucide-react';
import { MasterPegawai, MasterDivisi, MasterJabatan, MasterGudang, MasterKategori, MasterInstansi, UserRole } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';

export const MasterDataView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pegawai' | 'divisi' | 'jabatan' | 'gudang' | 'kategori' | 'instansi'>('pegawai');

  const [pegawai, setPegawai] = useState<MasterPegawai[]>([]);
  const [divisi, setDivisi] = useState<MasterDivisi[]>([]);
  const [jabatan, setJabatan] = useState<MasterJabatan[]>([]);
  const [gudang, setGudang] = useState<MasterGudang[]>([]);
  const [kategori, setKategori] = useState<MasterKategori[]>([]);
  const [instansi, setInstansi] = useState<MasterInstansi[]>([]);

  // Realtime Firestore synchronization
  const { data: realtimeUsers } = useFirestoreRealtime<any>('users');
  const { data: realtimeDivisi } = useFirestoreRealtime<any>('divisi');
  const { data: realtimeGudang } = useFirestoreRealtime<any>('gudang');

  useEffect(() => {
    if (realtimeUsers && realtimeUsers.length > 0) {
      fetchMaster();
    }
  }, [realtimeUsers, realtimeDivisi, realtimeGudang]);

  const [filter, setFilter] = useState('');
  const [cloudStatus, setCloudStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Modals for Master Pegawai
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPeg, setEditingPeg] = useState<MasterPegawai | null>(null);
  const [deletingPeg, setDeletingPeg] = useState<MasterPegawai | null>(null);

  const [form, setForm] = useState({
    nama: '',
    nip: '',
    email: '',
    telepon: '081234567890',
    username: '',
    role: 'Staff' as UserRole,
    divisiNama: 'Sekretariat / Tata Usaha',
    jabatanNama: 'Staf Operasional',
    status: 'Aktif' as 'Aktif' | 'Nonaktif',
    password: 'password123'
  });

  const [editForm, setEditForm] = useState({
    nama: '',
    nip: '',
    email: '',
    telepon: '',
    username: '',
    role: 'Staff' as UserRole,
    divisiNama: '',
    jabatanNama: '',
    status: 'Aktif' as 'Aktif' | 'Nonaktif'
  });

  const fetchCloudStatus = async () => {
    try {
      const res = await fetch('/api/v1/cloud/status');
      const data = await res.json();
      if (data.success) setCloudStatus(data.cloud);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMaster = async () => {
    setLoading(true);
    try {
      const r1 = await fetch('/api/v1/master/pegawai'); setPegawai((await r1.json()).data || []);
      const r2 = await fetch('/api/v1/master/divisi'); setDivisi((await r2.json()).data || []);
      const r3 = await fetch('/api/v1/master/jabatan'); setJabatan((await r3.json()).data || []);
      const r4 = await fetch('/api/v1/master/gudang'); setGudang((await r4.json()).data || []);
      const r5 = await fetch('/api/v1/master/kategori'); setKategori((await r5.json()).data || []);
      const r6 = await fetch('/api/v1/master/instansi'); setInstansi((await r6.json()).data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaster();
    fetchCloudStatus();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/master/pegawai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setForm({
          nama: '',
          nip: '',
          email: '',
          telepon: '081234567890',
          username: '',
          role: 'Staff',
          divisiNama: 'Sekretariat / Tata Usaha',
          jabatanNama: 'Staf Operasional',
          status: 'Aktif',
          password: 'password123'
        });
        fetchMaster();
      } else {
        alert(data.message || 'Gagal menambahkan pegawai');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (p: MasterPegawai) => {
    setEditingPeg(p);
    setEditForm({
      nama: p.nama,
      nip: p.nip,
      email: p.email,
      telepon: p.telepon || '081234567890',
      username: (p as any).username || '',
      role: (p as any).role || 'Staff',
      divisiNama: p.divisiNama,
      jabatanNama: p.jabatanNama,
      status: p.status
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeg) return;
    try {
      const res = await fetch(`/api/v1/master/pegawai/${editingPeg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setEditingPeg(null);
        fetchMaster();
      } else {
        alert(data.message || 'Gagal memperbarui pegawai');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPeg) return;
    try {
      const res = await fetch(`/api/v1/master/pegawai/${deletingPeg.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setDeletingPeg(null);
        fetchMaster();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPegawai = pegawai.filter(p =>
    p.nama.toLowerCase().includes(filter.toLowerCase()) ||
    p.nip.toLowerCase().includes(filter.toLowerCase()) ||
    p.email.toLowerCase().includes(filter.toLowerCase()) ||
    p.divisiNama.toLowerCase().includes(filter.toLowerCase()) ||
    ((p as any).username && (p as any).username.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header & Cloud Status Card */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" /> Master Data Terpadu Enterprise
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Database terpusat terintegrasi dengan Google Cloud Firestore & Manajemen Pengguna
          </p>
        </div>

        {/* Realtime Cloud Status Badge */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <CloudCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                Google Cloud Firestore <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded font-semibold">Realtime Active</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Project: <code className="font-mono text-purple-600 dark:text-purple-400">{cloudStatus?.projectId || 'chromatic-reference-lt3g1'}</code>
              </div>
            </div>
          </div>

          <button
            onClick={() => { fetchMaster(); fetchCloudStatus(); }}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-md transition"
            title="Refresh Sync Realtime"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sync Info Banner */}
      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-lg text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            <strong>Sinkronisasi Otomatis:</strong> Data pada <strong>Master Data Terpadu</strong> dan <strong>Manajemen Pengguna</strong> menggunakan 1 basis data terpusat yang sama. Perubahan di satu menu akan langsung terupdate di menu lainnya dan Google Cloud Firestore.
          </span>
        </div>
      </div>

      {/* Navigation Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('pegawai')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'pegawai' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Master Pegawai & User ({pegawai.length})
          </button>
          <button
            onClick={() => setActiveTab('divisi')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'divisi' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Building className="w-4 h-4" /> Master Divisi ({divisi.length})
          </button>
          <button
            onClick={() => setActiveTab('gudang')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'gudang' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Warehouse className="w-4 h-4" /> Master Gudang ({gudang.length})
          </button>
          <button
            onClick={() => setActiveTab('kategori')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'kategori' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" /> Kategori Barang ({kategori.length})
          </button>
          <button
            onClick={() => setActiveTab('instansi')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'instansi' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Landmark className="w-4 h-4" /> Instansi Mitra ({instansi.length})
          </button>
        </div>

        {activeTab === 'pegawai' && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Tambah Pegawai / User
          </button>
        )}
      </div>

      {/* Filter Bar for Pegawai */}
      {activeTab === 'pegawai' && (
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pegawai berdasarkan NIP, Nama, Email, Username, atau Divisi..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>
      )}

      {/* Tab Contents */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
        {activeTab === 'pegawai' && (
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <th className="p-3">NIP</th>
                <th className="p-3">Nama Lengkap & Username</th>
                <th className="p-3">Email & Kontak</th>
                <th className="p-3">Role & Divisi</th>
                <th className="p-3">Jabatan</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPegawai.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-bold text-purple-600">{p.nip}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{p.nama}</div>
                    <div className="text-[10px] text-slate-400">@{(p as any).username || 'user'}</div>
                  </td>
                  <td className="p-3">
                    <div>{p.email}</div>
                    <div className="text-[10px] text-slate-400">{p.telepon || '081234567890'}</div>
                  </td>
                  <td className="p-3">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[10px] mr-1">
                      {(p as any).role || 'Staff'}
                    </span>
                    <div className="text-[10px] text-slate-500">{p.divisiNama}</div>
                  </td>
                  <td className="p-3">{p.jabatanNama}</td>
                  <td className="p-3">
                    <Badge variant={p.status === 'Aktif' ? 'success' : 'neutral'}>{p.status}</Badge>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition"
                        title="Edit Data Pegawai & User"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingPeg(p)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition"
                        title="Hapus Pegawai"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'divisi' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Divisi</th>
                <th className="p-3">Kepala Divisi</th>
                <th className="p-3">Keterangan Fungsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {divisi.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-purple-600">{d.kode}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{d.nama}</td>
                  <td className="p-3">{d.kepalaDivisi || '-'}</td>
                  <td className="p-3 text-slate-500">{d.keterangan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'gudang' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <th className="p-3">Kode Gudang</th>
                <th className="p-3">Nama Gudang</th>
                <th className="p-3">Lokasi Fisik</th>
                <th className="p-3">Penanggung Jawab</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {gudang.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-amber-600">{g.kode}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{g.nama}</td>
                  <td className="p-3 text-slate-500">{g.lokasi}</td>
                  <td className="p-3">{g.penanggungJawab}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'kategori' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Kategori</th>
                <th className="p-3">Deskripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {kategori.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-blue-600">{k.kode}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{k.nama}</td>
                  <td className="p-3 text-slate-500">{k.deskripsi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'instansi' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Instansi Partner</th>
                <th className="p-3">Alamat</th>
                <th className="p-3">Kontak & Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {instansi.map((ins) => (
                <tr key={ins.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-indigo-600">{ins.kode}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{ins.nama}</td>
                  <td className="p-3 text-slate-500 max-w-xs">{ins.alamat}</td>
                  <td className="p-3">{ins.email}<div className="text-[10px] text-slate-400">{ins.telepon} • {ins.kontakPerson}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Add Pegawai */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" /> Tambah Pegawai Terintegrasi User
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">NIP Pegawai</label>
                  <input
                    type="text"
                    required
                    placeholder="19901234..."
                    value={form.nip}
                    onChange={(e) => setForm({ ...form, nip: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Budi Santoso, S.Kom"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Email Resmi</label>
                  <input
                    type="email"
                    required
                    placeholder="budi@perusahaan.co.id"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Username SSO</label>
                  <input
                    type="text"
                    required
                    placeholder="budisantoso"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Role User</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Operator">Operator</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="Staff Kantor">Staff Kantor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Password SSO</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Divisi</label>
                  <select
                    value={form.divisiNama}
                    onChange={(e) => setForm({ ...form, divisiNama: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Sekretariat / Tata Usaha">Sekretariat / Tata Usaha</option>
                    <option value="Teknologi Informasi & Komunikasi">Teknologi Informasi & Komunikasi</option>
                    <option value="Logistik & Perlengkapan">Logistik & Perlengkapan</option>
                    <option value="Keuangan & Perencanaan">Keuangan & Perencanaan</option>
                    <option value="Pemeriksaan & Pengawasan">Pemeriksaan & Pengawasan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Jabatan</label>
                  <input
                    type="text"
                    required
                    placeholder="Staf Operasional"
                    value={form.jabatanNama}
                    onChange={(e) => setForm({ ...form, jabatanNama: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  Simpan ke Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Pegawai */}
      {editingPeg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-purple-600" /> Edit Pegawai ({editingPeg.nama})
              </h3>
              <button onClick={() => setEditingPeg(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">NIP</label>
                  <input
                    type="text"
                    required
                    value={editForm.nip}
                    onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={editForm.nama}
                    onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Operator">Operator</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="Staff Kantor">Staff Kantor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Divisi</label>
                  <input
                    type="text"
                    required
                    value={editForm.divisiNama}
                    onChange={(e) => setEditForm({ ...editForm, divisiNama: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Jabatan</label>
                  <input
                    type="text"
                    required
                    value={editForm.jabatanNama}
                    onChange={(e) => setEditForm({ ...editForm, jabatanNama: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'Aktif' | 'Nonaktif' })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPeg(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-xs transition"
                >
                  Update Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Pegawai */}
      {deletingPeg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Konfirmasi Hapus Pegawai</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Apakah Anda yakin ingin menghapus <strong>{deletingPeg.nama}</strong>? Tindakan ini juga akan menghapus akses user SSO terkait dari Google Cloud Firestore.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingPeg(null)}
                className="px-4 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
