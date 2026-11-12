import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Printer,
  Save,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { getDb } from '../../lib/firebase';
import { MasterMenuRecord } from '../../types/masterMenu';

export interface OrganoleptikRow {
  no: number;
  namaMakanan: string;
  rasa: string;
  warna: string;
  aroma: string;
  tekstur: string;
  statusWaktu: string;
  ket: string;
}

export interface OrganoleptikRecord {
  id: string;
  namaPemeriksa: string;
  tempatPemeriksaan: 'SPPG' | 'Satuan Pendidikan' | 'Posyandu/Lainnya';
  namaTempatPemeriksa: string;
  tanggalPemeriksaan: string;
  waktuPemeriksaan: string;
  rows: OrganoleptikRow[];
  kesimpulan: 'Aman dikonsumsi' | 'Tidak aman dikonsumsi';
  updatedAt: string;
}

const DEFAULT_ROWS: OrganoleptikRow[] = [
  { no: 1, namaMakanan: 'Nasi', rasa: '', warna: '', aroma: '', tekstur: '', statusWaktu: '', ket: '' },
  { no: 2, namaMakanan: 'Telur ceplok gurih', rasa: '', warna: '', aroma: '', tekstur: '', statusWaktu: '', ket: '' },
  { no: 3, namaMakanan: 'Tempe kecap & kerupuk udang', rasa: '', warna: '', aroma: '', tekstur: '', statusWaktu: '', ket: '' },
  { no: 4, namaMakanan: 'Capcay brokoli, jamur kuping & wortel', rasa: '', warna: '', aroma: '', tekstur: '', statusWaktu: '', ket: '' },
  { no: 5, namaMakanan: 'Apel fuji', rasa: '', warna: '', aroma: '', tekstur: '', statusWaktu: '', ket: '' },
  { no: 6, namaMakanan: '', rasa: '', warna: '', aroma: '', tekstur: '', statusWaktu: '', ket: '' },
];

const STORAGE_KEY = 'sppg_organoleptik_v1';

interface OrganoleptikViewProps {
  masterMenus?: MasterMenuRecord[];
}

export const OrganoleptikView: React.FC<OrganoleptikViewProps> = ({ masterMenus = [] }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'print' | 'riwayat'>('form');
  const [records, setRecords] = useState<OrganoleptikRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [editingId, setEditingId] = useState<string>('');
  const [namaPemeriksa, setNamaPemeriksa] = useState<string>('');
  const [tempatPemeriksaan, setTempatPemeriksaan] = useState<'SPPG' | 'Satuan Pendidikan' | 'Posyandu/Lainnya'>('SPPG');
  const [namaTempatPemeriksa, setNamaTempatPemeriksa] = useState<string>('');
  const [tanggalPemeriksaan, setTanggalPemeriksaan] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [waktuPemeriksaan, setWaktuPemeriksaan] = useState<string>('');
  const [rows, setRows] = useState<OrganoleptikRow[]>(DEFAULT_ROWS);
  const [kesimpulan, setKesimpulan] = useState<'Aman dikonsumsi' | 'Tidak aman dikonsumsi'>('Aman dikonsumsi');

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const firestoreDb = getDb();
        if (!firestoreDb) return;
        const q = query(collection(firestoreDb, 'organoleptik_v1'), orderBy('tanggalPemeriksaan', 'desc'));
        const snapshot = await getDocs(q);
        const list: OrganoleptikRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as OrganoleptikRecord);
        });
        if (list.length > 0) {
          setRecords(list);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
      } catch {
        // Fallback silently to localStorage if Firestore quota is exceeded
      }
    };
    loadRecords();
  }, []);

  // Auto-fill Nama Makanan strictly from Master Menu matching tanggalPemeriksaan (empty if none)
  useEffect(() => {
    if (editingId) return;
    const matchedMenu = masterMenus.find((m) => m.tanggalPelaksanaan === tanggalPemeriksaan);
    if (matchedMenu && matchedMenu.menuItems.length > 0) {
      const mappedRows: OrganoleptikRow[] = matchedMenu.menuItems.map((item, idx) => ({
        no: idx + 1,
        namaMakanan: item,
        rasa: '',
        warna: '',
        aroma: '',
        tekstur: '',
        statusWaktu: '',
        ket: '',
      }));
      setRows(mappedRows);
    } else {
      setRows([]);
    }
  }, [tanggalPemeriksaan, masterMenus, editingId]);

  const handleRowChange = (index: number, field: keyof OrganoleptikRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        no: prev.length + 1,
        namaMakanan: '',
        rasa: '',
        warna: '',
        aroma: '',
        tekstur: '',
        statusWaktu: '',
        ket: '',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((r, idx) => ({ ...r, no: idx + 1 }))
    );
  };

  const handleResetForm = () => {
    setEditingId('');
    setNamaPemeriksa('');
    setTempatPemeriksaan('SPPG');
    setNamaTempatPemeriksa('');
    setTanggalPemeriksaan(new Date().toISOString().split('T')[0]);
    setWaktuPemeriksaan('');
    setRows(DEFAULT_ROWS.map((r) => ({ ...r })));
    setKesimpulan('Aman dikonsumsi');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingId || `org_${tanggalPemeriksaan}_${Date.now()}`;
    const record: OrganoleptikRecord = {
      id,
      namaPemeriksa: namaPemeriksa || '',
      tempatPemeriksaan,
      namaTempatPemeriksa: namaTempatPemeriksa || '',
      tanggalPemeriksaan,
      waktuPemeriksaan: waktuPemeriksaan || '',
      rows: rows.map((r, idx) => ({
        no: idx + 1,
        namaMakanan: r.namaMakanan || '',
        rasa: r.rasa || '',
        warna: r.warna || '',
        aroma: r.aroma || '',
        tekstur: r.tekstur || '',
        statusWaktu: r.statusWaktu || '',
        ket: r.ket || '',
      })),
      kesimpulan,
      updatedAt: new Date().toISOString(),
    };

    // Instant local state + localStorage update
    const updatedRecords = [record, ...records.filter((r) => r.id !== id)].sort((a, b) =>
      b.tanggalPemeriksaan.localeCompare(a.tanggalPemeriksaan)
    );
    setRecords(updatedRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
    setEditingId(id);

    try {
      const firestoreDb = getDb();
      if (firestoreDb) {
        await setDoc(doc(firestoreDb, 'organoleptik_v1', id), record);
      }
    } catch {
      // Saved locally even if Firestore quota is exceeded
    }
    showToast('Data Uji Organoleptik berhasil disimpan!');
    setActiveTab('print');
  };

  const handleLoadRecord = (rec: OrganoleptikRecord, targetTab: 'form' | 'print') => {
    setEditingId(rec.id);
    setNamaPemeriksa(rec.namaPemeriksa);
    setTempatPemeriksaan(rec.tempatPemeriksaan);
    setNamaTempatPemeriksa(rec.namaTempatPemeriksa);
    setTanggalPemeriksaan(rec.tanggalPemeriksaan);
    setWaktuPemeriksaan(rec.waktuPemeriksaan);
    setRows(rec.rows.length > 0 ? rec.rows : DEFAULT_ROWS);
    setKesimpulan(rec.kesimpulan);
    setActiveTab(targetTab);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Hapus data checklist uji organoleptik ini?')) return;
    const updatedRecords = records.filter((r) => r.id !== id);
    setRecords(updatedRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
    if (editingId === id) {
      handleResetForm();
    }

    try {
      const firestoreDb = getDb();
      if (firestoreDb) {
        await deleteDoc(doc(firestoreDb, 'organoleptik_v1', id));
      }
    } catch {
      // Deleted locally even if Firestore quota is exceeded
    }
    showToast('Data berhasil dihapus.');
  };

  const formatTanggalIndo = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const mIdx = parseInt(m, 10) - 1;
    return `${d} ${months[mIdx] || m} ${y}`;
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold text-white print:hidden ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Form Uji Organoleptik</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('print')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'print'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Preview & Print Out</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'riwayat'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Riwayat ({records.length})</span>
          </button>
        </div>

        {activeTab === 'print' && (
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Checklist (PDF)</span>
          </button>
        )}
      </div>

      {/* TAB 1: FORM INPUT */}
      {activeTab === 'form' && (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Form Checklist Uji Organoleptik
              </h3>
              <p className="text-xs text-slate-500">
                Isi hasil pemeriksaan organoleptik (skor 1-5) untuk dicetak atau disimpan ke riwayat.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
            >
              Reset Form
            </button>
          </div>

          {/* Identitas Pemeriksaan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Pemeriksaan</label>
              <input
                type="date"
                value={tanggalPemeriksaan}
                onChange={(e) => setTanggalPemeriksaan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Tabel Input Makanan */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold">
                <tr>
                  <th className="p-2.5 w-10 text-center">No</th>
                  <th className="p-2.5 min-w-[180px]">Nama Makanan</th>
                  <th className="p-2.5 w-16 text-center">Rasa (1-5)</th>
                  <th className="p-2.5 w-16 text-center">Warna (1-5)</th>
                  <th className="p-2.5 w-16 text-center">Aroma (1-5)</th>
                  <th className="p-2.5 w-16 text-center">Tekstur (1-5)</th>
                  <th className="p-2.5 min-w-[160px]">Waktu Uji</th>
                  <th className="p-2.5 min-w-[120px]">KET</th>
                  <th className="p-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-2 text-center font-bold">{row.no}</td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.namaMakanan}
                        onChange={(e) => handleRowChange(idx, 'namaMakanan', e.target.value)}
                        placeholder="Nama menu..."
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </td>
                    {(['rasa', 'warna', 'aroma', 'tekstur'] as const).map((field) => (
                      <td key={field} className="p-2">
                        <select
                          value={row[field]}
                          onChange={(e) => handleRowChange(idx, field, e.target.value)}
                          className="w-full px-1.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold"
                        >
                          <option value="">-</option>
                          <option value="5">5</option>
                          <option value="4">4</option>
                          <option value="3">3</option>
                          <option value="2">2</option>
                          <option value="1">1</option>
                        </select>
                      </td>
                    ))}
                    <td className="p-2">
                      <select
                        value={row.statusWaktu}
                        onChange={(e) => handleRowChange(idx, 'statusWaktu', e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      >
                        <option value="">- Pilih -</option>
                        <option value="Sebelum Pengantaran">Sebelum Pengantaran</option>
                        <option value="Saat tiba di lokasi">Saat tiba di lokasi</option>
                        <option value="Sebelum dikonsumsi">Sebelum dikonsumsi</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.ket}
                        onChange={(e) => handleRowChange(idx, 'ket', e.target.value)}
                        placeholder="Keterangan..."
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Hapus Baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Baris Makanan</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Lihat Print Out</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: PRINT OUT FORMAT PERSIS PDF */}
      {activeTab === 'print' && (
        <div className="bg-white text-black p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto font-['Times_New_Roman',Times,serif] print:border-none print:shadow-none print:p-0 print:max-w-none">
          {/* Kop Surat */}
          <div className="flex items-center gap-4 border-b-2 border-black pb-3 mb-4">
            <img
              src="/badan-gizi-nasional-seeklogo.png"
              alt="Logo Badan Gizi Nasional"
              className="w-16 h-16 object-contain shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="flex-1 text-left">
              <h1 className="text-base sm:text-lg font-bold tracking-wide uppercase">
                BADAN GIZI NASIONAL <span className="italic font-semibold">(NATIONAL NUTRITION AGENCY)</span>
              </h1>
              <p className="text-xs sm:text-sm font-semibold uppercase">
                SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN
              </p>
              <p className="text-xs font-semibold uppercase">
                YAYASAN HAFSHAWATY ZAINUL HASAN
              </p>
              <p className="text-[11px]">
                Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo
              </p>
            </div>
          </div>

          {/* Judul */}
          <h2 className="text-center font-bold text-sm sm:text-base uppercase tracking-wider mb-4">
            CHECKLIST UJI ORGANOLEPTIK
          </h2>

          {/* Identitas */}
          <table className="w-full text-xs mb-4">
            <tbody>
              <tr>
                <td className="w-44 py-0.5">Nama Pemeriksa</td>
                <td className="w-4">:</td>
                <td className="py-0.5 font-semibold">{namaPemeriksa}</td>
              </tr>
              <tr>
                <td className="py-0.5">Tempat Pemeriksaan</td>
                <td>:</td>
                <td className="py-0.5">
                  <span className={tempatPemeriksaan === 'SPPG' ? 'font-bold underline' : ''}>SPPG</span>
                  {' / '}
                  <span className={tempatPemeriksaan === 'Satuan Pendidikan' ? 'font-bold underline' : ''}>Satuan Pendidikan</span>
                  {' / '}
                  <span className={tempatPemeriksaan === 'Posyandu/Lainnya' ? 'font-bold underline' : ''}>Posyandu/Lainnya</span>
                </td>
              </tr>
              <tr>
                <td className="py-0.5">Nama Tempat Pemeriksa</td>
                <td>:</td>
                <td className="py-0.5 font-semibold">{namaTempatPemeriksa}</td>
              </tr>
              <tr>
                <td className="py-0.5">Tanggal Pemeriksaan</td>
                <td>:</td>
                <td className="py-0.5 font-semibold">{formatTanggalIndo(tanggalPemeriksaan)}</td>
              </tr>
              <tr>
                <td className="py-0.5">Waktu Pemeriksaan</td>
                <td>:</td>
                <td className="py-0.5 font-semibold">{waktuPemeriksaan}</td>
              </tr>
            </tbody>
          </table>

          {/* Tabel Checklist */}
          <table className="w-full border-collapse border border-black text-xs mb-4">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-black px-2 py-1.5 w-10 text-center font-bold">
                  No
                </th>
                <th rowSpan={2} className="border border-black px-2 py-1.5 text-center font-bold">
                  Nama Makanan
                </th>
                <th colSpan={4} className="border border-black px-2 py-1 text-center font-bold">
                  Hasil Pemeriksaan (diberi skor 1-5)
                </th>
                <th rowSpan={2} className="border border-black px-2 py-1.5 w-36 text-center font-bold leading-tight">
                  Sebelum Pengantaran/saat tiba di lokasi/sebelum dikonsumsi
                </th>
                <th rowSpan={2} className="border border-black px-2 py-1.5 w-20 text-center font-bold">
                  KET
                </th>
              </tr>
              <tr>
                <th className="border border-black px-2 py-1 w-12 text-center font-bold">Rasa</th>
                <th className="border border-black px-2 py-1 w-12 text-center font-bold">Warna</th>
                <th className="border border-black px-2 py-1 w-12 text-center font-bold">Aroma</th>
                <th className="border border-black px-2 py-1 w-12 text-center font-bold">Tekstur</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.no}>
                  <td className="border border-black px-2 py-1.5 text-center">{row.no}</td>
                  <td className="border border-black px-2 py-1.5">{row.namaMakanan}</td>
                  <td className="border border-black px-2 py-1.5 text-center">{row.rasa}</td>
                  <td className="border border-black px-2 py-1.5 text-center">{row.warna}</td>
                  <td className="border border-black px-2 py-1.5 text-center">{row.aroma}</td>
                  <td className="border border-black px-2 py-1.5 text-center">{row.tekstur}</td>
                  <td className="border border-black px-2 py-1.5 text-center text-[11px]">{row.statusWaktu}</td>
                  <td className="border border-black px-2 py-1.5 text-center">{row.ket}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={6} className="border border-black px-2 py-2 text-center font-bold">
                  Kesimpulan Menu MBG
                </td>
                <td className="border border-black px-2 py-2 text-center font-semibold">
                  Tidak/Aman dikonsumsi
                </td>
                <td className="border border-black px-2 py-2"></td>
              </tr>
            </tbody>
          </table>

          {/* Catatan & Skor */}
          <div className="text-[11px] space-y-2 mb-6">
            <div>
              <p className="font-semibold">Catatan :</p>
              <ol className="list-decimal list-inside pl-2 space-y-0.5">
                <li>
                  Silakan dipilih salah satu untuk pengisian hasil pelaksanaan uji organoleptic (Sebelum Pengantaran/Saat tiba di Lokasi/Sebelum dikonsumsi)
                </li>
                <li>
                  Form dibawa oleh supir untuk diberikan ke penanggung jawab program MBG dan diambil Kembali bersamaan dengan pengambilan ompreng MBG, dan dibawa Kembali ke SPPG.
                </li>
              </ol>
            </div>

            <div>
              <p className="font-semibold">Skor :</p>
              <div className="grid grid-cols-[90px_10px_1fr] pl-2">
                <span>Sangat baik</span><span>:</span><span>5</span>
                <span>Baik</span><span>:</span><span>4</span>
                <span>Cukup</span><span>:</span><span>3</span>
                <span>Kurang</span><span>:</span><span>2</span>
                <span>Tidak baik</span><span>:</span><span>1</span>
              </div>
            </div>
          </div>

          {/* Tanda Tangan */}
          <div className="grid grid-cols-2 text-xs text-center mt-8">
            <div>
              <p>Mengetahui</p>
              <div className="h-16" />
              <p className="font-bold">Fitria, S.ST</p>
            </div>
            <div>
              <p>Pemeriksa</p>
              <div className="h-16" />
              <p className="font-semibold">{namaPemeriksa || '.......................................'}</p>
            </div>
          </div>

          <div className="text-xs text-center mt-6">
            <p>Kepala SPPG</p>
            <div className="h-16" />
            <p className="font-bold">Sri Rohayu, S.Pd</p>
          </div>
        </div>
      )}

      {/* TAB 3: RIWAYAT */}
      {activeTab === 'riwayat' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 print:hidden">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Riwayat Checklist Uji Organoleptik
          </h3>
          {records.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              Belum ada data uji organoleptik yang tersimpan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200">
                  <tr>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700">Tanggal</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700">Pemeriksa</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700">Tempat</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700">Kesimpulan</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-semibold">{formatTanggalIndo(rec.tanggalPemeriksaan)}</td>
                      <td className="p-3">{rec.namaPemeriksa || '-'}</td>
                      <td className="p-3">
                        {rec.tempatPemeriksaan} {rec.namaTempatPemeriksa ? `(${rec.namaTempatPemeriksa})` : ''}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            rec.kesimpulan === 'Aman dikonsumsi'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {rec.kesimpulan}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleLoadRecord(rec, 'print')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadRecord(rec, 'form')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
