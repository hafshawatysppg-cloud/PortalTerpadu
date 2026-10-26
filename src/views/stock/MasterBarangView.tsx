import React, { useState, useEffect } from 'react';
import { 
  Boxes, Plus, Search, QrCode, CheckCircle, Barcode, 
  Edit, Trash2, Save, X, AlertTriangle, Archive, RotateCcw
} from 'lucide-react';
import { MasterBarang, MasterKategori, MasterGudang } from '../../types';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';

export const MasterBarangView: React.FC = () => {
  const { data: realtimeBarang } = useFirestoreRealtime<MasterBarang>('barang');
  const [items, setItems] = useState<MasterBarang[]>([]);
  const [kategoriList, setKategoriList] = useState<MasterKategori[]>([]);
  const [gudangList, setGudangList] = useState<MasterGudang[]>([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'aktif' | 'arsip' | 'semua'>('aktif');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<MasterBarang | null>(null);

  // Edit Item Modal State (tanpa minimal stok)
  const [editingItem, setEditingItem] = useState<MasterBarang | null>(null);
  const [editForm, setEditForm] = useState({
    namaBarang: '',
    kategoriId: '',
    gudangId: '',
    satuan: 'Pcs',
    stokSekarang: 0,
    status: 'Aktif' as 'Aktif' | 'Tidak Aktif' | 'Arsip',
    hargaSatuan: 0,
    sumberSupplier: '',
    keterangan: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Confirmation State
  const [deletingItem, setDeletingItem] = useState<MasterBarang | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Inline Quick Price Edit State
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState<number>(0);
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);

  useEffect(() => {
    if (realtimeBarang && realtimeBarang.length > 0) {
      setItems(realtimeBarang);
    }
  }, [realtimeBarang]);

  // Form Tambah Barang Baru (tanpa minimal stok)
  const [form, setForm] = useState({
    namaBarang: '',
    kategoriId: 'KAT-001',
    gudangId: 'GDG-001',
    satuan: 'Kg',
    stokSekarang: 25,
    hargaSatuan: 150000,
    sumberSupplier: '',
    keterangan: ''
  });

  const fetchData = async () => {
    try {
      const res1 = await fetch('/api/v1/stock/barang');
      const d1 = await res1.json();
      if (d1.success) setItems(d1.data);

      const res2 = await fetch('/api/v1/master/kategori');
      const d2 = await res2.json();
      if (d2.success) setKategoriList(d2.data);

      const res3 = await fetch('/api/v1/master/gudang');
      const d3 = await res3.json();
      if (d3.success) setGudangList(d3.data);
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
      const res = await fetch('/api/v1/stock/barang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: 'Aktif' })
      });
      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setForm({ 
          namaBarang: '', 
          kategoriId: 'KAT-001', 
          gudangId: 'GDG-001', 
          satuan: 'Kg', 
          stokSekarang: 25, 
          hargaSatuan: 150000,
          sumberSupplier: '',
          keterangan: ''
        });
        setFeedback({ type: 'success', message: 'Master barang baru berhasil ditambahkan!' });
        setTimeout(() => setFeedback(null), 4000);
        fetchData();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Gagal menambahkan barang' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Koneksi error' });
    }
  };

  // Open Edit Modal with Pre-populated Data
  const handleOpenEdit = (item: MasterBarang) => {
    setEditingItem(item);
    setEditForm({
      namaBarang: item.namaBarang,
      kategoriId: item.kategoriId || 'KAT-001',
      gudangId: item.gudangId || 'GDG-001',
      satuan: item.satuan || 'Pcs',
      stokSekarang: Number(item.stokSekarang) || 0,
      status: item.status || (Number(item.stokSekarang) <= 0 ? 'Arsip' : 'Aktif'),
      hargaSatuan: Number(item.hargaSatuan) || 0,
      sumberSupplier: item.sumberSupplier || '',
      keterangan: item.keterangan || ''
    });
  };

  // Save Edited Item
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/v1/stock/barang/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaBarang: editForm.namaBarang,
          kategoriId: editForm.kategoriId,
          gudangId: editForm.gudangId,
          satuan: editForm.satuan,
          stokSekarang: Number(editForm.stokSekarang),
          status: editForm.status,
          hargaSatuan: Number(editForm.hargaSatuan),
          sumberSupplier: editForm.sumberSupplier,
          keterangan: editForm.keterangan,
          petugas: 'Admin Master Stok'
        })
      });

      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.map(b => b.id === editingItem.id ? { ...b, ...data.data } : b));
        setEditingItem(null);
        setFeedback({ type: 'success', message: `Data barang "${editForm.namaBarang}" berhasil diperbarui!` });
        setTimeout(() => setFeedback(null), 4000);
        fetchData();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Gagal memperbarui barang.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Gagal menyimpan perubahan barang.' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Confirm Delete Item
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/stock/barang/${deletingItem.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petugas: 'Admin Master Stok' })
      });

      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.filter(b => b.id !== deletingItem.id));
        setDeletingItem(null);
        setFeedback({ 
          type: 'success', 
          message: data.message || `Barang "${deletingItem.namaBarang}" berhasil dihapus dan tercatat di History Keluar!` 
        });
        setTimeout(() => setFeedback(null), 5000);
        fetchData();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Gagal menghapus barang.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Gagal memproses penghapusan.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartEditPrice = (item: MasterBarang) => {
    setEditingPriceId(item.id);
    setEditingPriceVal(item.hargaSatuan || 0);
  };

  const handleSavePrice = async (id: string) => {
    setSavingPriceId(id);
    try {
      const res = await fetch(`/api/v1/stock/barang/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hargaSatuan: Number(editingPriceVal) })
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.map(b => b.id === id ? { ...b, hargaSatuan: Number(editingPriceVal) } : b));
        setEditingPriceId(null);
        setFeedback({ type: 'success', message: 'Harga satuan berhasil diperbarui!' });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Save price error:', err);
    } finally {
      setSavingPriceId(null);
    }
  };

  // Restore an archived item back to active
  const handleRestoreItem = async (item: MasterBarang) => {
    try {
      const res = await fetch(`/api/v1/stock/barang/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Aktif', petugas: 'Admin Master Stok' })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Barang "${item.namaBarang}" berhasil diaktifkan kembali!` });
        setTimeout(() => setFeedback(null), 4000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter items by status and keyword
  const activeCount = items.filter(i => (i.status === 'Aktif' || !i.status) && (Number(i.stokSekarang) || 0) > 0).length;
  const arsipCount = items.filter(i => i.status === 'Arsip' || i.status === 'Tidak Aktif' || (Number(i.stokSekarang) || 0) <= 0).length;

  const filteredItems = items.filter(i => {
    const isZeroOrArchived = i.status === 'Arsip' || i.status === 'Tidak Aktif' || (Number(i.stokSekarang) || 0) <= 0;
    
    if (statusFilter === 'aktif' && isZeroOrArchived) return false;
    if (statusFilter === 'arsip' && !isZeroOrArchived) return false;

    return (
      i.namaBarang.toLowerCase().includes(filter.toLowerCase()) ||
      i.kodeBarang.toLowerCase().includes(filter.toLowerCase()) ||
      (i.barcode && i.barcode.includes(filter)) ||
      (i.kategoriNama && i.kategoriNama.toLowerCase().includes(filter.toLowerCase())) ||
      (i.gudangNama && i.gudangNama.toLowerCase().includes(filter.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-extrabold uppercase rounded-full">
              Pusat Persediaan & SKU
            </span>
            <span className="text-xs text-slate-500">
              {activeCount} Aktif &bull; {arsipCount} Arsip (Stok 0)
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-600" /> Master Stok Persediaan Barang
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manajemen data barang dengan tombol Edit dan Hapus di setiap baris. Barang stok 0 otomatis terarsip dan tercatat di History Keluar.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Barang Baru
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-70 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Filter Status & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tab Toggle */}
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setStatusFilter('aktif')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'aktif'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Barang Aktif ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('arsip')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'arsip'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-rose-500" />
            <span>Arsip / Stok 0 ({arsipCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('semua')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'semua'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Semua ({items.length})
          </button>
        </div>

        {/* Filter Keyword */}
        <div className="flex-1 sm:max-w-md p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari nama barang, kode SKU, kategori, atau barcode..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {filter && (
            <button onClick={() => setFilter('')} className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table (Tanpa kolom Minimal Stok) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
              <th className="p-3 w-12 text-center">No</th>
              <th className="p-3">Kode SKU & Barcode</th>
              <th className="p-3">Nama Barang</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Gudang</th>
              <th className="p-3 text-right">Stok Saat Ini</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Harga Satuan (Rp)</th>
              <th className="p-3 text-center w-52">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                  {statusFilter === 'arsip'
                    ? 'Tidak ada barang di arsip atau semua barang memiliki stok aktif.'
                    : 'Tidak ada data barang ditemukan.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const isEditing = editingPriceId === item.id;
                const isZeroStock = (item.stokSekarang || 0) <= 0 || item.status === 'Arsip' || item.status === 'Tidak Aktif';

                return (
                  <tr 
                    key={item.id} 
                    className={`transition ${isZeroStock ? 'bg-slate-50/60 dark:bg-slate-800/30' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'}`}
                  >
                    <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{item.kodeBarang}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Barcode className="w-3 h-3" /> {item.barcode}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100 max-w-xs">
                      <div>{item.namaBarang}</div>
                      {item.sumberSupplier && (
                        <div className="text-[10px] text-slate-400">Supplier: {item.sumberSupplier}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-medium text-[11px]">
                        {item.kategoriNama || '-'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{item.gudangNama || '-'}</td>
                    <td className="p-3 text-right">
                      <span className={`font-black ${
                        isZeroStock 
                          ? 'text-slate-400 dark:text-slate-500' 
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {item.stokSekarang || 0} {item.satuan}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {isZeroStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                          <Archive className="w-2.5 h-2.5" /> Arsip / Stok 0
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            value={editingPriceVal}
                            onChange={(e) => setEditingPriceVal(Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-amber-50 dark:bg-slate-800 border border-amber-500 rounded text-xs font-bold text-right text-slate-900 dark:text-slate-100 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(item.id)}
                            disabled={savingPriceId === item.id}
                            className="p-1.5 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 transition cursor-pointer"
                            title="Simpan Harga"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 group">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            Rp {(item.hargaSatuan || 0).toLocaleString('id-ID')}
                          </span>
                          <button
                            onClick={() => handleStartEditPrice(item)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-600 transition rounded cursor-pointer"
                            title="Quick Edit Harga"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* TOMBOL EDIT */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] rounded-lg border border-blue-200 dark:border-blue-800 transition flex items-center gap-1 cursor-pointer"
                          title="Edit Data Barang"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Edit</span>
                        </button>

                        {/* TOMBOL HAPUS */}
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-[11px] rounded-lg border border-rose-200 dark:border-rose-800 transition flex items-center gap-1 cursor-pointer"
                          title="Hapus Barang dari Master Stok"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Hapus</span>
                        </button>

                        {/* TOMBOL CETAK QR */}
                        <button
                          onClick={() => setSelectedQR(item)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer"
                          title="Cetak Label QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT DATA BARANG (Tanpa Minimal Stok) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Modul Master Stok
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-blue-600" /> Edit Data Barang: {editingItem.kodeBarang}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Barang / Bahan Baku *</label>
                <input
                  type="text"
                  required
                  value={editForm.namaBarang}
                  onChange={(e) => setEditForm({ ...editForm, namaBarang: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori Barang *</label>
                  <select
                    value={editForm.kategoriId}
                    onChange={(e) => setEditForm({ ...editForm, kategoriId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {kategoriList.map(k => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lokasi Gudang *</label>
                  <select
                    value={editForm.gudangId}
                    onChange={(e) => setEditForm({ ...editForm, gudangId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {gudangList.map(g => (
                      <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Satuan *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kg, Pcs, Liter"
                    value={editForm.satuan}
                    onChange={(e) => setEditForm({ ...editForm, satuan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Stok Saat Ini *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.stokSekarang}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditForm({ 
                        ...editForm, 
                        stokSekarang: val,
                        status: val <= 0 ? 'Arsip' : 'Aktif'
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status Barang</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Arsip">Arsip / Tidak Aktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Harga Satuan (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.hargaSatuan}
                    onChange={(e) => setEditForm({ ...editForm, hargaSatuan: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sumber Supplier / Vendor</label>
                  <input
                    type="text"
                    placeholder="Nama distributor / pasar / vendor"
                    value={editForm.sumberSupplier}
                    onChange={(e) => setEditForm({ ...editForm, sumberSupplier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Keterangan / Catatan Barang</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan tambahan spesifikasi atau penempatan..."
                  value={editForm.keterangan}
                  onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS BARANG */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Hapus Barang dari Master Stok?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Anda akan menghapus data barang: <br />
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{deletingItem.namaBarang}</span>{' '}
                <span className="font-mono text-amber-600 font-bold">({deletingItem.kodeBarang})</span>
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 text-left space-y-1">
                <div>&bull; Sisa stok saat ini: <strong className="text-rose-600">{deletingItem.stokSekarang || 0} {deletingItem.satuan}</strong></div>
                <div>&bull; Seluruh riwayat transaksi & mutasi barang ini <strong>tetap tersimpan aman di History Barang Keluar</strong>.</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Barang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Barang Baru (Tanpa Minimal Stok) */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-amber-600" /> Tambah Master Barang Baru
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Barang / Bahan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beras Ramos Super 25kg, Telur Ayam Ras..."
                  value={form.namaBarang}
                  onChange={(e) => setForm({ ...form, namaBarang: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori *</label>
                  <select
                    value={form.kategoriId}
                    onChange={(e) => setForm({ ...form, kategoriId: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {kategoriList.map(k => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lokasi Gudang *</label>
                  <select
                    value={form.gudangId}
                    onChange={(e) => setForm({ ...form, gudangId: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {gudangList.map(g => (
                      <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Satuan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Kg, Pcs, Liter"
                    value={form.satuan}
                    onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Stok Awal *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.stokSekarang}
                    onChange={(e) => setForm({ ...form, stokSekarang: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Harga Satuan (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.hargaSatuan}
                    onChange={(e) => setForm({ ...form, hargaSatuan: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sumber Supplier</label>
                  <input
                    type="text"
                    placeholder="Vendor / Distributor"
                    value={form.sumberSupplier}
                    onChange={(e) => setForm({ ...form, sumberSupplier: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Keterangan / Catatan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan tambahan barang..."
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Simpan Barang Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Label QR & Barcode Fisik</h3>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl inline-block shadow-inner">
              <img src={selectedQR.qrCodeUrl} alt="QR Code" className="w-44 h-44 mx-auto" />
              <div className="font-mono text-xs font-bold text-slate-900 mt-2">{selectedQR.kodeBarang}</div>
              <div className="text-[10px] text-slate-500 font-mono">{selectedQR.barcode}</div>
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {selectedQR.namaBarang}
            </div>
            <p className="text-[11px] text-slate-500">
              Scan QR code ini untuk verifikasi inventaris gudang dan pencatatan mutasi otomatis.
            </p>
            <button
              onClick={() => setSelectedQR(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Tutup Label
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
