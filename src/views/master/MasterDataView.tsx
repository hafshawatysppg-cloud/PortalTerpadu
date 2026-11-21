import React, { useState, useEffect } from 'react';
import { 
  Database, Plus, Users, Building, Briefcase, Warehouse, Tag, Landmark, Search, 
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
  const { data: realtimeDivisi, setData: setRealtimeDivisi } = useFirestoreRealtime<any>('divisi');
  const { data: realtimeJabatan, setData: setRealtimeJabatan } = useFirestoreRealtime<any>('jabatan');
  const { data: realtimeGudang } = useFirestoreRealtime<any>('gudang');

  useEffect(() => {
    if (realtimeUsers && realtimeUsers.length > 0) {
      fetchMaster();
    }
  }, [realtimeUsers, realtimeGudang]);

  useEffect(() => {
    if (realtimeDivisi && realtimeDivisi.length > 0) {
      setDivisi(realtimeDivisi);
    }
  }, [realtimeDivisi]);

  useEffect(() => {
    if (realtimeJabatan && realtimeJabatan.length > 0) {
      setJabatan(realtimeJabatan);
    }
  }, [realtimeJabatan]);

  const [filter, setFilter] = useState('');
  const [cloudStatus, setCloudStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Modals for Master Pegawai
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPeg, setEditingPeg] = useState<MasterPegawai | null>(null);
  const [deletingPeg, setDeletingPeg] = useState<MasterPegawai | null>(null);

  // Modals for other master tabs
  const [isAddDivisiOpen, setIsAddDivisiOpen] = useState(false);
  const [formDivisi, setFormDivisi] = useState({ nama: '', kode: '', keterangan: '', kepalaDivisi: '' });
  const [customKodeDivisi, setCustomKodeDivisi] = useState(false);
  const [divisiError, setDivisiError] = useState<string | null>(null);
  const [divisiSuccess, setDivisiSuccess] = useState<string | null>(null);

  const [isAddJabatanOpen, setIsAddJabatanOpen] = useState(false);
  const [formJabatan, setFormJabatan] = useState({ nama: '', kode: '', deskripsi: '' });
  const [editingJabatan, setEditingJabatan] = useState<MasterJabatan | null>(null);
  const [deletingJabatan, setDeletingJabatan] = useState<MasterJabatan | null>(null);
  const [jabatanError, setJabatanError] = useState<string | null>(null);
  const [jabatanSuccess, setJabatanSuccess] = useState<string | null>(null);
  const [customJabatanAddPeg, setCustomJabatanAddPeg] = useState(false);
  const [customJabatanEditPeg, setCustomJabatanEditPeg] = useState(false);

  const [isAddGudangOpen, setIsAddGudangOpen] = useState(false);
  const [formGudang, setFormGudang] = useState({ nama: '', kode: '', lokasi: '', penanggungJawab: '', kapasitasM3: 100 });

  const [isAddKategoriOpen, setIsAddKategoriOpen] = useState(false);
  const [formKategori, setFormKategori] = useState({ nama: '', kode: '', deskripsi: '' });

  const [isAddInstansiOpen, setIsAddInstansiOpen] = useState(false);
  const [formInstansi, setFormInstansi] = useState({ nama: '', jenis: 'Sekolah / Madrasah', alamat: '', kontak: '', telepon: '', email: '' });

  const [editingDivisi, setEditingDivisi] = useState<MasterDivisi | null>(null);
  const [editingGudang, setEditingGudang] = useState<MasterGudang | null>(null);
  const [editingKategori, setEditingKategori] = useState<MasterKategori | null>(null);
  const [editingInstansi, setEditingInstansi] = useState<MasterInstansi | null>(null);

  const [isSubmittingMaster, setIsSubmittingMaster] = useState(false);

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

  const showDivisiSuccess = (msg: string) => {
    setDivisiSuccess(msg);
    setTimeout(() => setDivisiSuccess(null), 4000);
  };

  const handleAddDivisi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDivisi.nama.trim()) {
      setDivisiError('Nama divisi wajib diisi.');
      return;
    }
    setDivisiError(null);
    setIsSubmittingMaster(true);
    try {
      const isEdit = Boolean(editingDivisi);
      const url = isEdit ? `/api/v1/master/divisi/${editingDivisi!.id}` : '/api/v1/master/divisi';
      const cleanKode = formDivisi.kode.trim().toUpperCase();
      const matchedJabatan = jabatan.find(
        j => (j.kode || '').trim().toUpperCase() === cleanKode
      );
      const payload = {
        nama: formDivisi.nama.trim(),
        kode: cleanKode,
        keterangan: formDivisi.keterangan.trim(),
        kepalaDivisi: formDivisi.kepalaDivisi.trim(),
        jabatanId: matchedJabatan?.id,
        jabatanNama: matchedJabatan?.nama
      };
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        const nextList = isEdit
          ? divisi.map(item => (item.id === editingDivisi!.id ? data.data : item))
          : [data.data, ...divisi.filter(item => item.id !== data.data.id)];
        setDivisi(nextList);
        setRealtimeDivisi(nextList);
        setIsAddDivisiOpen(false);
        setEditingDivisi(null);
        setCustomKodeDivisi(false);
        setFormDivisi({ nama: '', kode: '', keterangan: '', kepalaDivisi: '' });
        showDivisiSuccess(
          isEdit
            ? `Divisi "${data.data.nama}" berhasil diperbarui.`
            : `Divisi "${data.data.nama}" berhasil ditambahkan dan disimpan.`
        );
      } else {
        setDivisiError(data.message || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} divisi`);
      }
    } catch (err) {
      console.error(err);
      setDivisiError('Terjadi kesalahan jaringan saat menyimpan divisi.');
    } finally {
      setIsSubmittingMaster(false);
    }
  };

  const handleDeleteDivisi = async (d: MasterDivisi) => {
    if (!window.confirm(`Yakin ingin menghapus divisi "${d.nama}"?`)) return;
    try {
      const res = await fetch(`/api/v1/master/divisi/${d.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        const nextList = divisi.filter(item => item.id !== d.id);
        setDivisi(nextList);
        setRealtimeDivisi(nextList);
        showDivisiSuccess(`Divisi "${d.nama}" berhasil dihapus.`);
      } else {
        setDivisiError(data.message || 'Gagal menghapus divisi');
      }
    } catch (err) {
      console.error(err);
      setDivisiError('Terjadi kesalahan jaringan saat menghapus divisi.');
    }
  };

  const showJabatanSuccess = (msg: string) => {
    setJabatanSuccess(msg);
    setTimeout(() => setJabatanSuccess(null), 4000);
  };

  const handleSaveJabatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJabatan.nama.trim()) {
      setJabatanError('Nama jenis jabatan wajib diisi.');
      return;
    }
    setJabatanError(null);
    setIsSubmittingMaster(true);
    try {
      const isEdit = Boolean(editingJabatan);
      const url = isEdit ? `/api/v1/master/jabatan/${editingJabatan!.id}` : '/api/v1/master/jabatan';
      const payload = {
        nama: formJabatan.nama.trim(),
        kode: formJabatan.kode.trim().toUpperCase(),
        deskripsi: formJabatan.deskripsi.trim()
      };
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        const nextList = isEdit
          ? jabatan.map(item => (item.id === editingJabatan!.id ? data.data : item))
          : [data.data, ...jabatan.filter(item => item.id !== data.data.id)];
        setJabatan(nextList);
        setRealtimeJabatan(nextList);
        setIsAddJabatanOpen(false);
        setEditingJabatan(null);
        setFormJabatan({ nama: '', kode: '', deskripsi: '' });
        showJabatanSuccess(
          isEdit
            ? `Jenis jabatan "${data.data.nama}" berhasil diperbarui dan disinkronkan ke database.`
            : `Jenis jabatan "${data.data.nama}" berhasil disimpan ke database dan siap dipakai di menu lain.`
        );
      } else {
        setJabatanError(data.message || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} jenis jabatan.`);
      }
    } catch (err) {
      console.error(err);
      setJabatanError('Terjadi kesalahan jaringan saat menyimpan jenis jabatan.');
    } finally {
      setIsSubmittingMaster(false);
    }
  };

  const handleDeleteJabatanConfirm = async () => {
    if (!deletingJabatan) return;
    setIsSubmittingMaster(true);
    try {
      const target = deletingJabatan;
      const res = await fetch(`/api/v1/master/jabatan/${target.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        const nextList = jabatan.filter(item => item.id !== target.id);
        setJabatan(nextList);
        setRealtimeJabatan(nextList);
        setDeletingJabatan(null);
        showJabatanSuccess(`Jenis jabatan "${target.nama}" berhasil dihapus dari database.`);
      } else {
        setJabatanError(data.message || 'Gagal menghapus jenis jabatan.');
        setDeletingJabatan(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingMaster(false);
    }
  };

  const handleAddGudang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGudang.nama.trim()) return;
    setIsSubmittingMaster(true);
    try {
      const isEdit = Boolean(editingGudang);
      const url = isEdit ? `/api/v1/master/gudang/${editingGudang!.id}` : '/api/v1/master/gudang';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formGudang)
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (isEdit) {
          setGudang(prev => prev.map(item => (item.id === editingGudang!.id ? data.data : item)));
        } else {
          setGudang(prev => [data.data, ...prev]);
        }
        setIsAddGudangOpen(false);
        setEditingGudang(null);
        setFormGudang({ nama: '', kode: '', lokasi: '', penanggungJawab: '', kapasitasM3: 100 });
      } else {
        alert(data.message || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} gudang`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingMaster(false);
    }
  };

  const handleDeleteGudang = async (g: MasterGudang) => {
    if (!window.confirm(`Yakin ingin menghapus gudang "${g.nama}"?`)) return;
    try {
      const res = await fetch(`/api/v1/master/gudang/${g.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setGudang(prev => prev.filter(item => item.id !== g.id));
      } else {
        alert(data.message || 'Gagal menghapus gudang');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKategori.nama.trim()) return;
    setIsSubmittingMaster(true);
    try {
      const isEdit = Boolean(editingKategori);
      const url = isEdit ? `/api/v1/master/kategori/${editingKategori!.id}` : '/api/v1/master/kategori';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formKategori)
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (isEdit) {
          setKategori(prev => prev.map(item => (item.id === editingKategori!.id ? data.data : item)));
        } else {
          setKategori(prev => [data.data, ...prev]);
        }
        setIsAddKategoriOpen(false);
        setEditingKategori(null);
        setFormKategori({ nama: '', kode: '', deskripsi: '' });
      } else {
        alert(data.message || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} kategori`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingMaster(false);
    }
  };

  const handleDeleteKategori = async (k: MasterKategori) => {
    if (!window.confirm(`Yakin ingin menghapus kategori "${k.nama}"?`)) return;
    try {
      const res = await fetch(`/api/v1/master/kategori/${k.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setKategori(prev => prev.filter(item => item.id !== k.id));
      } else {
        alert(data.message || 'Gagal menghapus kategori');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddInstansi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInstansi.nama.trim()) return;
    setIsSubmittingMaster(true);
    try {
      const isEdit = Boolean(editingInstansi);
      const url = isEdit ? `/api/v1/master/instansi/${editingInstansi!.id}` : '/api/v1/master/instansi';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formInstansi)
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (isEdit) {
          setInstansi(prev => prev.map(item => (item.id === editingInstansi!.id ? data.data : item)));
        } else {
          setInstansi(prev => [data.data, ...prev]);
        }
        setIsAddInstansiOpen(false);
        setEditingInstansi(null);
        setFormInstansi({ nama: '', jenis: 'Sekolah / Madrasah', alamat: '', kontak: '', telepon: '', email: '' });
      } else {
        alert(data.message || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} instansi mitra`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingMaster(false);
    }
  };

  const handleDeleteInstansi = async (ins: MasterInstansi) => {
    if (!window.confirm(`Yakin ingin menghapus instansi mitra "${ins.nama}"?`)) return;
    try {
      const res = await fetch(`/api/v1/master/instansi/${ins.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setInstansi(prev => prev.filter(item => item.id !== ins.id));
      } else {
        alert(data.message || 'Gagal menghapus instansi mitra');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEdit = (p: MasterPegawai) => {
    setEditingPeg(p);
    const inMaster = jabatan.some(j => j.nama === p.jabatanNama);
    setCustomJabatanEditPeg(Boolean(p.jabatanNama) && !inMaster && jabatan.length > 0);
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
            onClick={() => setActiveTab('jabatan')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'jabatan' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Jenis Jabatan ({jabatan.length})
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

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {activeTab === 'pegawai' && (
            <button
              onClick={() => {
                setCustomJabatanAddPeg(false);
                if (jabatan.length > 0 && !jabatan.some(j => j.nama === form.jabatanNama)) {
                  setForm(prev => ({ ...prev, jabatanNama: jabatan[0].nama }));
                }
                setIsAddOpen(true);
              }}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Pegawai / User
            </button>
          )}
          {activeTab === 'divisi' && (
            <button
              onClick={() => {
                setEditingDivisi(null);
                setDivisiError(null);
                setCustomKodeDivisi(false);
                setFormDivisi({
                  nama: '',
                  kode: jabatan[0]?.kode || '',
                  keterangan: '',
                  kepalaDivisi: ''
                });
                setIsAddDivisiOpen(true);
              }}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Divisi
            </button>
          )}
          {activeTab === 'jabatan' && (
            <button
              onClick={() => {
                setEditingJabatan(null);
                setJabatanError(null);
                setFormJabatan({
                  nama: '',
                  kode: '',
                  deskripsi: ''
                });
                setIsAddJabatanOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Jenis Jabatan
            </button>
          )}
          {activeTab === 'gudang' && (
            <button
              onClick={() => setIsAddGudangOpen(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Gudang
            </button>
          )}
          {activeTab === 'kategori' && (
            <button
              onClick={() => setIsAddKategoriOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Kategori
            </button>
          )}
          {activeTab === 'instansi' && (
            <button
              onClick={() => setIsAddInstansiOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Instansi Mitra
            </button>
          )}
        </div>
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
          <div>
            {divisiSuccess && (
              <div className="m-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{divisiSuccess}</span>
                </div>
                <button onClick={() => setDivisiSuccess(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <th className="p-3">Kode (Jenis Jabatan)</th>
                  <th className="p-3">Nama Divisi</th>
                  <th className="p-3">Kepala Divisi</th>
                  <th className="p-3">Keterangan Fungsi</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {divisi.map((d) => {
                  const linkedJabatan = jabatan.find(
                    j => (j.kode || '').trim().toUpperCase() === (d.kode || '').trim().toUpperCase()
                  );
                  const linkedNama = linkedJabatan?.nama || d.jabatanNama;
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="font-mono font-bold text-purple-600">{d.kode}</div>
                        {linkedNama && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                            {linkedNama}
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{d.nama}</td>
                      <td className="p-3">{d.kepalaDivisi || '-'}</td>
                      <td className="p-3 text-slate-500">{d.keterangan}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const matchedJab = jabatan.find(
                                j => (j.kode || '').trim().toUpperCase() === (d.kode || '').trim().toUpperCase()
                              );
                              setEditingDivisi(d);
                              setDivisiError(null);
                              setCustomKodeDivisi(Boolean(d.kode) && !matchedJab && jabatan.length > 0);
                              setFormDivisi({
                                nama: d.nama || '',
                                kode: matchedJab ? matchedJab.kode : (d.kode || ''),
                                keterangan: d.keterangan || '',
                                kepalaDivisi: d.kepalaDivisi || ''
                              });
                              setIsAddDivisiOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition cursor-pointer"
                            title="Edit Divisi"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDivisi(d)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition cursor-pointer"
                            title="Hapus Divisi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'jabatan' && (
          <div>
            {jabatanSuccess && (
              <div className="m-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{jabatanSuccess}</span>
                </div>
                <button onClick={() => setJabatanSuccess(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {jabatan.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500 space-y-2">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Belum ada data jenis jabatan.</p>
                <p>Klik tombol "Tambah Jenis Jabatan" untuk menambahkan daftar jabatan baru.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <th className="p-3">Kode</th>
                  <th className="p-3">Nama Jenis Jabatan</th>
                  <th className="p-3">Deskripsi / Tugas</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {jabatan.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-emerald-600">{j.kode}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{j.nama}</td>
                    <td className="p-3 text-slate-500">{j.deskripsi || '-'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingJabatan(j);
                            setJabatanError(null);
                            setFormJabatan({
                              nama: j.nama || '',
                              kode: j.kode || '',
                              deskripsi: j.deskripsi || ''
                            });
                            setIsAddJabatanOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition cursor-pointer"
                          title="Edit Jenis Jabatan"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingJabatan(j)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition cursor-pointer"
                          title="Hapus Jenis Jabatan"
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
          </div>
        )}

        {activeTab === 'gudang' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <th className="p-3">Kode Gudang</th>
                <th className="p-3">Nama Gudang</th>
                <th className="p-3">Lokasi Fisik</th>
                <th className="p-3">Penanggung Jawab</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {gudang.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-amber-600">{g.kode}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{g.nama}</td>
                  <td className="p-3 text-slate-500">{g.lokasi}</td>
                  <td className="p-3">{g.penanggungJawab}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setEditingGudang(g);
                          setFormGudang({
                            nama: g.nama || '',
                            kode: g.kode || '',
                            lokasi: g.lokasi || '',
                            penanggungJawab: g.penanggungJawab || '',
                            kapasitasM3: g.kapasitasM3 || 100
                          });
                          setIsAddGudangOpen(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition"
                        title="Edit Gudang"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGudang(g)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition"
                        title="Hapus Gudang"
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

        {activeTab === 'kategori' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Kategori</th>
                <th className="p-3">Deskripsi</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {kategori.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-blue-600">{k.kode}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{k.nama}</td>
                  <td className="p-3 text-slate-500">{k.deskripsi}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setEditingKategori(k);
                          setFormKategori({
                            nama: k.nama || '',
                            kode: k.kode || '',
                            deskripsi: k.deskripsi || ''
                          });
                          setIsAddKategoriOpen(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition"
                        title="Edit Kategori"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteKategori(k)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition"
                        title="Hapus Kategori"
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

        {activeTab === 'instansi' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Instansi Partner</th>
                <th className="p-3">Alamat</th>
                <th className="p-3">Kontak & Email</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {instansi.map((ins) => (
                <tr key={ins.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-indigo-600">{ins.kode}</td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{ins.nama}</td>
                  <td className="p-3 text-slate-500 max-w-xs">{ins.alamat}</td>
                  <td className="p-3">{ins.email}<div className="text-[10px] text-slate-400">{ins.telepon} • {ins.kontakPerson}</div></td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setEditingInstansi(ins);
                          setFormInstansi({
                            nama: ins.nama || '',
                            jenis: (ins as any).jenis || 'Sekolah / Madrasah',
                            alamat: ins.alamat || '',
                            kontak: ins.kontakPerson || '',
                            telepon: ins.telepon || '',
                            email: ins.email || ''
                          });
                          setIsAddInstansiOpen(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition"
                        title="Edit Instansi Mitra"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteInstansi(ins)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition"
                        title="Hapus Instansi Mitra"
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
                    {divisi.length > 0 ? (
                      divisi.map(d => (
                        <option key={d.id} value={d.nama}>{d.nama}</option>
                      ))
                    ) : (
                      <>
                        <option value="Sekretariat / Tata Usaha">Sekretariat / Tata Usaha</option>
                        <option value="Teknologi Informasi & Komunikasi">Teknologi Informasi & Komunikasi</option>
                        <option value="Logistik & Perlengkapan">Logistik & Perlengkapan</option>
                        <option value="Keuangan & Perencanaan">Keuangan & Perencanaan</option>
                        <option value="Pemeriksaan & Pengawasan">Pemeriksaan & Pengawasan</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Jabatan</label>
                  {!customJabatanAddPeg && jabatan.length > 0 ? (
                    <select
                      value={jabatan.some(j => j.nama === form.jabatanNama) ? form.jabatanNama : '__custom__'}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setCustomJabatanAddPeg(true);
                          setForm({ ...form, jabatanNama: '' });
                        } else {
                          setForm({ ...form, jabatanNama: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      {jabatan.map(j => (
                        <option key={j.id} value={j.nama}>{j.nama}</option>
                      ))}
                      <option value="__custom__">-- Ketik Jabatan Manual --</option>
                    </select>
                  ) : (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        list="master-jabatan-list"
                        required
                        placeholder="Ketik nama jabatan..."
                        value={form.jabatanNama}
                        onChange={(e) => setForm({ ...form, jabatanNama: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                      {jabatan.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomJabatanAddPeg(false);
                            setForm({ ...form, jabatanNama: jabatan[0].nama });
                          }}
                          className="px-2 py-1 text-[10px] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 shrink-0"
                        >
                          Pilih List
                        </button>
                      )}
                    </div>
                  )}
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
                  {!customJabatanEditPeg && jabatan.length > 0 ? (
                    <select
                      value={jabatan.some(j => j.nama === editForm.jabatanNama) ? editForm.jabatanNama : '__custom__'}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setCustomJabatanEditPeg(true);
                        } else {
                          setEditForm({ ...editForm, jabatanNama: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      {jabatan.map(j => (
                        <option key={j.id} value={j.nama}>{j.nama}</option>
                      ))}
                      <option value="__custom__">-- Ketik Jabatan Manual --</option>
                    </select>
                  ) : (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        list="master-jabatan-list"
                        required
                        value={editForm.jabatanNama}
                        onChange={(e) => setEditForm({ ...editForm, jabatanNama: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                      {jabatan.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomJabatanEditPeg(false);
                            setEditForm({ ...editForm, jabatanNama: jabatan[0].nama });
                          }}
                          className="px-2 py-1 text-[10px] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 shrink-0"
                        >
                          Pilih List
                        </button>
                      )}
                    </div>
                  )}
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

      {/* Modal Tambah / Edit Divisi */}
      {isAddDivisiOpen && (() => {
        const matchedJabatanDivisi = jabatan.find(
          j => (j.kode || '').trim().toUpperCase() === (formDivisi.kode || '').trim().toUpperCase()
        );
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 my-8">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-600" /> {editingDivisi ? 'Edit Divisi' : 'Tambah Divisi Baru'}
                </h3>
                <button
                  onClick={() => {
                    setIsAddDivisiOpen(false);
                    setEditingDivisi(null);
                    setDivisiError(null);
                    setCustomKodeDivisi(false);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddDivisi} className="space-y-3 text-xs">
                {divisiError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{divisiError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nama Divisi</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Logistik & Pengadaan"
                    value={formDivisi.nama}
                    onChange={(e) => setFormDivisi({ ...formDivisi, nama: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Kode Singkatan <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">(Kode Jenis Jabatan)</span>
                    </label>
                    {!customKodeDivisi && jabatan.length > 0 ? (
                      <select
                        value={matchedJabatanDivisi ? matchedJabatanDivisi.kode : (formDivisi.kode ? '__custom__' : '')}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setCustomKodeDivisi(true);
                            setFormDivisi({ ...formDivisi, kode: '' });
                          } else {
                            setFormDivisi({ ...formDivisi, kode: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                      >
                        <option value="">-- Pilih Kode Jenis Jabatan --</option>
                        {jabatan.map(j => (
                          <option key={j.id} value={j.kode}>
                            {j.kode} — {j.nama}
                          </option>
                        ))}
                        <option value="__custom__">-- Ketik Kode Manual --</option>
                      </select>
                    ) : (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Contoh: KJM / DRV"
                          value={formDivisi.kode}
                          onChange={(e) => setFormDivisi({ ...formDivisi, kode: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono uppercase focus:outline-none focus:border-purple-500"
                        />
                        {jabatan.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomKodeDivisi(false);
                              setFormDivisi({ ...formDivisi, kode: jabatan[0]?.kode || '' });
                            }}
                            className="px-2 py-1 text-[10px] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
                          >
                            Pilih List
                          </button>
                        )}
                      </div>
                    )}
                    {matchedJabatanDivisi && (
                      <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                        Terhubung: {matchedJabatanDivisi.nama}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Kepala Divisi</label>
                    <input
                      type="text"
                      placeholder="Nama PIC..."
                      value={formDivisi.kepalaDivisi}
                      onChange={(e) => setFormDivisi({ ...formDivisi, kepalaDivisi: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Keterangan / Fungsi</label>
                  <textarea
                    rows={2}
                    placeholder="Deskripsi tugas divisi..."
                    value={formDivisi.keterangan}
                    onChange={(e) => setFormDivisi({ ...formDivisi, keterangan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddDivisiOpen(false);
                      setEditingDivisi(null);
                      setDivisiError(null);
                      setCustomKodeDivisi(false);
                    }}
                    className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingMaster}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingMaster ? 'Menyimpan...' : editingDivisi ? 'Update Divisi' : 'Simpan Divisi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal Tambah Gudang */}
      {isAddGudangOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-amber-600" /> {editingGudang ? 'Edit Gudang' : 'Tambah Gudang Baru'}
              </h3>
              <button onClick={() => setIsAddGudangOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddGudang} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nama Gudang</label>
                <input
                  type="text"
                  required
                  placeholder="Gudang Bahan Kering"
                  value={formGudang.nama}
                  onChange={(e) => setFormGudang({ ...formGudang, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Kode Gudang</label>
                  <input
                    type="text"
                    placeholder="GDG-002"
                    value={formGudang.kode}
                    onChange={(e) => setFormGudang({ ...formGudang, kode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Kapasitas (m³)</label>
                  <input
                    type="number"
                    value={formGudang.kapasitasM3}
                    onChange={(e) => setFormGudang({ ...formGudang, kapasitasM3: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Lokasi Gedung / Ruangan</label>
                <input
                  type="text"
                  placeholder="Lantai 1 Sayap Timur"
                  value={formGudang.lokasi}
                  onChange={(e) => setFormGudang({ ...formGudang, lokasi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Penanggung Jawab Gudang</label>
                <input
                  type="text"
                  placeholder="Petugas Logistik..."
                  value={formGudang.penanggungJawab}
                  onChange={(e) => setFormGudang({ ...formGudang, penanggungJawab: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddGudangOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMaster}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {isSubmittingMaster ? 'Menyimpan...' : 'Simpan Gudang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Kategori */}
      {isAddKategoriOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" /> {editingKategori ? 'Edit Kategori Barang' : 'Tambah Kategori Barang Baru'}
              </h3>
              <button onClick={() => setIsAddKategoriOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddKategori} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Bahan Pokok & Sembako"
                  value={formKategori.nama}
                  onChange={(e) => setFormKategori({ ...formKategori, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Kode Kategori</label>
                <input
                  type="text"
                  placeholder="KAT-005"
                  value={formKategori.kode}
                  onChange={(e) => setFormKategori({ ...formKategori, kode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Deskripsi Kategori</label>
                <textarea
                  rows={2}
                  placeholder="Kategori untuk beras, minyak, gula, tepung..."
                  value={formKategori.deskripsi}
                  onChange={(e) => setFormKategori({ ...formKategori, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddKategoriOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMaster}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {isSubmittingMaster ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Instansi */}
      {isAddInstansiOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-indigo-600" /> {editingInstansi ? 'Edit Instansi Mitra' : 'Tambah Instansi Mitra Baru'}
              </h3>
              <button onClick={() => setIsAddInstansiOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddInstansi} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nama Instansi / Sekolah</label>
                <input
                  type="text"
                  required
                  placeholder="SDN Kraksaan 1 / Puskesmas Krejengan"
                  value={formInstansi.nama}
                  onChange={(e) => setFormInstansi({ ...formInstansi, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Jenis Instansi</label>
                  <select
                    value={formInstansi.jenis}
                    onChange={(e) => setFormInstansi({ ...formInstansi, jenis: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Sekolah / Madrasah">Sekolah / Madrasah</option>
                    <option value="Puskesmas / Posyandu">Puskesmas / Posyandu</option>
                    <option value="Yayasan / Pesantren">Yayasan / Pesantren</option>
                    <option value="Dinas / Lembaga Pemerintahan">Dinas / Pemerintahan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nama PIC / Kontak</label>
                  <input
                    type="text"
                    placeholder="Bpk. Mulyadi"
                    value={formInstansi.kontak}
                    onChange={(e) => setFormInstansi({ ...formInstansi, kontak: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    placeholder="081234567890"
                    value={formInstansi.telepon}
                    onChange={(e) => setFormInstansi({ ...formInstansi, telepon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="kontak@sekolah.sch.id"
                    value={formInstansi.email}
                    onChange={(e) => setFormInstansi({ ...formInstansi, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  placeholder="Jl. Raya Kraksaan No. 12, Probolinggo..."
                  value={formInstansi.alamat}
                  onChange={(e) => setFormInstansi({ ...formInstansi, alamat: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddInstansiOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMaster}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {isSubmittingMaster ? 'Menyimpan...' : 'Simpan Instansi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Datalist Jenis Jabatan untuk input Pegawai */}
      <datalist id="master-jabatan-list">
        {jabatan.map((j) => (
          <option key={j.id} value={j.nama} />
        ))}
      </datalist>

      {/* Modal Tambah / Edit Jenis Jabatan */}
      {isAddJabatanOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" /> {editingJabatan ? 'Edit Jenis Jabatan' : 'Tambah Jenis Jabatan Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsAddJabatanOpen(false);
                  setEditingJabatan(null);
                  setJabatanError(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveJabatan} className="space-y-3 text-xs">
              {jabatanError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{jabatanError}</span>
                </div>
              )}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Nama Jenis Jabatan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kepala Juru Masak / Driver Distribusi"
                  value={formJabatan.nama}
                  onChange={(e) => setFormJabatan({ ...formJabatan, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Kode Jabatan <span className="text-[10px] text-slate-400 font-normal">(Opsional - otomatis dibuat jika kosong)</span></label>
                <input
                  type="text"
                  placeholder="Contoh: KJM / DRV"
                  value={formJabatan.kode}
                  onChange={(e) => setFormJabatan({ ...formJabatan, kode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Deskripsi / Keterangan Tugas</label>
                <textarea
                  rows={2}
                  placeholder="Ringkasan tanggung jawab jenis jabatan..."
                  value={formJabatan.deskripsi}
                  onChange={(e) => setFormJabatan({ ...formJabatan, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddJabatanOpen(false);
                    setEditingJabatan(null);
                    setJabatanError(null);
                  }}
                  className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMaster}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingMaster ? 'Menyimpan...' : editingJabatan ? 'Update Jabatan' : 'Simpan Jabatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Jenis Jabatan */}
      {deletingJabatan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Hapus Jenis Jabatan</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Apakah Anda yakin ingin menghapus jenis jabatan <strong>"{deletingJabatan.nama}"</strong> ({deletingJabatan.kode})?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDeletingJabatan(null)}
                className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteJabatanConfirm}
                disabled={isSubmittingMaster}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingMaster ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
