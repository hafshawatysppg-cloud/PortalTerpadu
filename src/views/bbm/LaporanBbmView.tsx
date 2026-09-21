import React, { useState, useEffect } from 'react';
import { 
  Fuel, 
  Car, 
  Calendar, 
  Milestone, 
  DollarSign, 
  Receipt, 
  BarChart3, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Trash2, 
  Pencil,
  Upload, 
  X, 
  RefreshCw, 
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  LineChart, 
  Line 
} from 'recharts';
import { LaporanBbm, MasterKendaraan, BbmDashboardSummary, JenisBbm } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';
import { GlobalReportHeader } from '../../components/document/GlobalReportHeader';
import { GlobalReportFooter } from '../../components/document/GlobalReportFooter';
import { DocumentSignatures } from '../../components/document/DocumentSignatures';

export const LaporanBbmView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transaksi' | 'kendaraan'>('dashboard');

  // Data State
  const [logs, setLogs] = useState<LaporanBbm[]>([]);
  const [kendaraanList, setKendaraanList] = useState<MasterKendaraan[]>([]);
  const [summary, setSummary] = useState<BbmDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters State
  const [filterTanggal, setFilterTanggal] = useState<string>('');
  const [filterBulan, setFilterBulan] = useState<string>('');
  const [filterTahun, setFilterTahun] = useState<string>('2026');
  const [filterKendaraan, setFilterKendaraan] = useState<string>('');
  const [filterJenisBbm, setFilterJenisBbm] = useState<string>('');
  const [filterStatusPemakaian, setFilterStatusPemakaian] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [selectedStrukUrl, setSelectedStrukUrl] = useState<string | null>(null);
  const [isKendaraanModalOpen, setIsKendaraanModalOpen] = useState<boolean>(false);
  const [editingKendaraanId, setEditingKendaraanId] = useState<string | null>(null);

  // New BBM Form State
  const [formData, setFormData] = useState({
    tanggalPembelian: new Date().toISOString().split('T')[0],
    kendaraanId: '',
    jenisBbm: 'Pertamax' as JenisBbm,
    kmAwal: 0,
    kmAkhir: '',
    hargaBbm: '',
    jumlahLiter: '',
    uploadStruk: '',
    userInput: user?.nama || 'Operator Terpadu'
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Master Kendaraan Form State
  const [kendaraanFormData, setKendaraanFormData] = useState({
    namaKendaraan: '',
    platNomor: '',
    jenisKendaraan: 'Mobil Operasional' as MasterKendaraan['jenisKendaraan'],
    standarKmLiter: 10,
    status: 'Aktif' as MasterKendaraan['status']
  });

  // Fetch data from backend API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Dashboard Analytics
      const dashRes = await fetch(`/api/v1/bbm/dashboard?tahun=${filterTahun || '2026'}&bulan=${filterBulan || ''}`);
      const dashData = await dashRes.json();
      if (dashData.success) {
        setSummary(dashData.data);
      }

      // 2. Fetch Master Kendaraan
      const kndRes = await fetch('/api/v1/bbm/kendaraan');
      const kndData = await kndRes.json();
      if (kndData.success) {
        setKendaraanList(kndData.data);
      }

      // 3. Fetch Laporan BBM
      const query = new URLSearchParams();
      if (filterTanggal) query.append('tanggal', filterTanggal);
      if (filterBulan) query.append('bulan', filterBulan);
      if (filterTahun) query.append('tahun', filterTahun);
      if (filterKendaraan) query.append('kendaraanId', filterKendaraan);
      if (filterJenisBbm) query.append('jenisBbm', filterJenisBbm);
      if (filterStatusPemakaian) query.append('statusPemakaian', filterStatusPemakaian);
      if (searchTerm) query.append('search', searchTerm);

      const logsRes = await fetch(`/api/v1/bbm?${query.toString()}`);
      const logsData = await logsRes.json();
      if (logsData.success) {
        setLogs(logsData.data);
      }
    } catch (err) {
      console.error('Error fetching BBM data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Realtime Firestore synchronization
  const { data: realtimeLogs } = useFirestoreRealtime<LaporanBbm>('laporanBbm');

  useEffect(() => {
    if (realtimeLogs && realtimeLogs.length > 0) {
      fetchData();
    }
  }, [realtimeLogs]);

  useEffect(() => {
    fetchData();
  }, [filterTanggal, filterBulan, filterTahun, filterKendaraan, filterJenisBbm, filterStatusPemakaian, searchTerm]);

  // Handle vehicle selection in new form -> auto fill KM Awal and Plat
  const handleSelectKendaraan = async (kendaraanId: string) => {
    setFormData(prev => ({ ...prev, kendaraanId }));
    if (!kendaraanId) return;

    try {
      const res = await fetch(`/api/v1/bbm/latest-km/${kendaraanId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setFormData(prev => ({
          ...prev,
          kmAwal: data.data.latestKmAwal
        }));
      }
    } catch (err) {
      console.error('Error fetching latest KM:', err);
    }
  };

  // Live Calculations for Form
  const selectedVehicle = kendaraanList.find(k => k.id === formData.kendaraanId);
  const numKmAkhir = Number(formData.kmAkhir) || 0;
  const numKmAwal = formData.kmAwal;
  const numLiter = Number(formData.jumlahLiter) || 0;
  const numHarga = Number(formData.hargaBbm) || 0;

  const calculatedJarakTempuh = numKmAkhir > numKmAwal ? numKmAkhir - numKmAwal : 0;
  const calculatedKmLiterAktual = (calculatedJarakTempuh > 0 && numLiter > 0)
    ? parseFloat((calculatedJarakTempuh / numLiter).toFixed(2))
    : 0;

  const vehicleStandar = selectedVehicle?.standarKmLiter || 10;
  const calculatedStatusPemakaian = (calculatedKmLiterAktual > 0)
    ? (calculatedKmLiterAktual >= vehicleStandar ? 'Normal' : 'Tidak Normal')
    : 'Normal';

  const calculatedKeterangan = calculatedStatusPemakaian === 'Normal' ? 'Pemakaian Wajar' : 'Boros';
  const calculatedStatusStruk = formData.uploadStruk ? 'Ter-upload' : 'Belum Upload';

  // Handle Struk Image File Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, uploadStruk: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit New BBM Log
  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validations
    if (!formData.tanggalPembelian) {
      setFormError('Tanggal Pembelian wajib diisi.');
      return;
    }

    if (!formData.kendaraanId) {
      setFormError('Silakan pilih Kendaraan terlebih dahulu.');
      return;
    }

    if (numKmAkhir <= numKmAwal) {
      setFormError(`KM Akhir (${numKmAkhir}) tidak boleh lebih kecil atau sama dengan KM Awal (${numKmAwal}).`);
      return;
    }

    if (numHarga <= 0) {
      setFormError('Harga BBM (Total Pembayaran) wajib lebih dari nol.');
      return;
    }

    if (numLiter <= 0) {
      setFormError('Jumlah Liter BBM wajib lebih dari nol.');
      return;
    }

    if (!formData.uploadStruk) {
      setFormError('Foto Struk Pembelian BBM bersifat WAJIB di-upload sebelum menyimpan data.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/bbm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          kmAkhir: numKmAkhir,
          hargaBbm: numHarga,
          jumlahLiter: numLiter
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
          tanggalPembelian: new Date().toISOString().split('T')[0],
          kendaraanId: '',
          jenisBbm: 'Pertamax',
          kmAwal: 0,
          kmAkhir: '',
          hargaBbm: '',
          jumlahLiter: '',
          uploadStruk: '',
          userInput: user?.nama || 'Operator Terpadu'
        });
        fetchData();
      } else {
        setFormError(data.message || 'Gagal menyimpan data laporan BBM.');
      }
    } catch (err: any) {
      setFormError('Terjadi kesalahan koneksi server: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Master Kendaraan
  const handleSubmitKendaraan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kendaraanFormData.namaKendaraan || !kendaraanFormData.platNomor) return;

    try {
      const url = editingKendaraanId ? `/api/v1/bbm/kendaraan/${editingKendaraanId}` : '/api/v1/bbm/kendaraan';
      const method = editingKendaraanId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kendaraanFormData)
      });
      const data = await res.json();
      if (data.success) {
        setIsKendaraanModalOpen(false);
        setEditingKendaraanId(null);
        setKendaraanFormData({
          namaKendaraan: '',
          platNomor: '',
          jenisKendaraan: 'Mobil Operasional',
          standarKmLiter: 10,
          status: 'Aktif'
        });
        fetchData();
      } else {
        alert(data.message || 'Gagal menyimpan data kendaraan.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Master Kendaraan
  const handleEditKendaraan = (knd: MasterKendaraan) => {
    setEditingKendaraanId(knd.id);
    setKendaraanFormData({
      namaKendaraan: knd.namaKendaraan,
      platNomor: knd.platNomor,
      jenisKendaraan: knd.jenisKendaraan,
      standarKmLiter: knd.standarKmLiter,
      status: knd.status
    });
    setIsKendaraanModalOpen(true);
  };

  // Delete Master Kendaraan
  const handleDeleteKendaraan = async (id: string, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus armada ${nama}?`)) return;
    try {
      const res = await fetch(`/api/v1/bbm/kendaraan/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.message || 'Gagal menghapus kendaraan.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete BBM log
  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan transaksi BBM ini?')) return;
    try {
      const res = await fetch(`/api/v1/bbm/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export to CSV / Excel
  const handleExportExcel = () => {
    if (logs.length === 0) return;
    
    const headers = [
      'ID Transaksi',
      'Tanggal Pembelian',
      'Kendaraan',
      'Plat Nomor',
      'Jenis BBM',
      'KM Awal',
      'KM Akhir',
      'Jarak Tempuh (KM)',
      'Harga BBM (Rp)',
      'Jumlah Liter',
      'KM/Liter Aktual',
      'Standar KM/Liter',
      'Status Pemakaian',
      'Status Struk',
      'Keterangan',
      'Operator'
    ];

    const rows = logs.map(l => [
      l.id,
      l.tanggalPembelian,
      `"${l.kendaraanNama}"`,
      l.platNomor,
      l.jenisBbm,
      l.kmAwal,
      l.kmAkhir,
      l.jarakTempuh,
      l.hargaBbm,
      l.jumlahLiter,
      l.kmLiterAktual,
      l.standarKmLiter,
      l.statusPemakaian,
      l.statusStruk,
      l.keterangan,
      `"${l.userInput}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_BBM_Kendaraan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterTanggal('');
    setFilterBulan('');
    setFilterTahun('2026');
    setFilterKendaraan('');
    setFilterJenisBbm('');
    setFilterStatusPemakaian('');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title Header */}
      <div className="p-6 bg-gradient-to-r from-sky-900 via-blue-900 to-slate-900 rounded-2xl shadow-lg border border-sky-800 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-400/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 border border-sky-400/30 rounded-full text-sky-300 text-xs font-semibold mb-2">
              <Fuel className="w-3.5 h-3.5 text-sky-400" />
              Sistem Pengawasan Logistik Kendaraan Operasional
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Laporan BBM Kendaraan
            </h1>
            <p className="text-xs text-sky-200 mt-1 max-w-2xl">
              Pencatatan otomatis transaksi pengisian bahan bakar minyak, analisis efisiensi KM/Liter aktual vs standar, serta deteksi dini konsumsi pemakaian boros.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Transaksi BBM
            </button>
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-300" /> Print Laporan
            </button>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-sky-800/80 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-sky-200 hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> 📊 Dashboard BBM
          </button>
          <button
            onClick={() => setActiveTab('transaksi')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'transaksi'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-sky-200 hover:bg-white/10'
            }`}
          >
            <Fuel className="w-4 h-4" /> ⛽ Transaksi Laporan BBM ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('kendaraan')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'kendaraan'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-sky-200 hover:bg-white/10'
            }`}
          >
            <Car className="w-4 h-4" /> 🚗 Master Kendaraan ({kendaraanList.length})
          </button>
        </div>
      </div>

      {/* ======================================= */}
      {/* TAB 1: DASHBOARD BBM */}
      {/* ======================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold">Total Pengeluaran BBM</span>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Rp {(summary?.totalPengeluaranBulanIni || 0).toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-slate-400">
                Total akumulasi biaya BBM bulan ini
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold">Total Liter BBM</span>
                <div className="p-2 bg-sky-50 dark:bg-sky-950/50 rounded-xl text-sky-600 dark:text-sky-400">
                  <Fuel className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {(summary?.totalLiterBulanIni || 0).toLocaleString('id-ID')} <span className="text-xs font-medium text-slate-500">Liter</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Volume bahan bakar dikonsumsi
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold">Total Jarak Tempuh</span>
                <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400">
                  <Milestone className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {(summary?.totalJarakTempuhBulanIni || 0).toLocaleString('id-ID')} <span className="text-xs font-medium text-slate-500">KM</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Odometer jarak perjalanan
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold">Rata-rata Efisiensi</span>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {summary?.rataRataKmLiter || 0} <span className="text-xs font-medium text-slate-500">KM/Liter</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Efisiensi konsumsi rata-rata armada
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold">Total Transaksi</span>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {summary?.totalTransaksi || 0} <span className="text-xs font-medium text-slate-500">Nota</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Pengisian BBM tercatat
              </div>
            </div>
          </div>

          {/* Charts Row 1: Pengeluaran Per Bulan & Efisiensi KM/Liter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Grafik Pengeluaran BBM per Bulan */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Grafik Pengeluaran BBM per Bulan (2026)
                  </h3>
                  <p className="text-[11px] text-slate-500">Akumulasi nominal Rupiah pembelian BBM armada</p>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                  Rp x 1.000
                </span>
              </div>

              <div className="h-64 w-full">
                {summary?.pengeluaranPerBulan && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.pengeluaranPerBulan}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `${val / 1000}rb`} />
                      <Tooltip 
                        formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Total Pengeluaran']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      />
                      <Bar dataKey="totalRupiah" fill="#0284c7" radius={[6, 6, 0, 0]} name="Pengeluaran BBM (Rp)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Grafik Efisiensi KM/Liter Aktual vs Standar */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-sky-500" /> Grafik Efisiensi KM/Liter per Kendaraan
                  </h3>
                  <p className="text-[11px] text-slate-500">Perbandingan KM/Liter Aktual vs Standar Pabrikan</p>
                </div>
              </div>

              <div className="h-64 w-full">
                {summary?.efisiensiPerKendaraan && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.efisiensiPerKendaraan}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="platNomor" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        formatter={(val: any, name: any) => [`${val} KM/Liter`, name]}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="kmLiterAktual" fill="#10b981" radius={[4, 4, 0, 0]} name="KM/L Aktual" />
                      <Bar dataKey="standarKmLiter" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Standar KM/L" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Chart 3 & Boros Alert Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kendaraan Paling Boros Table / Card */}
            <div className="lg:col-span-1 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" /> Kendaraan Paling Boros
                </h3>
                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                  Indikator Warning
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Armada dengan tren konsumsi bahan bakar di bawah standar</p>

              <div className="space-y-2 mt-3">
                {summary?.kendaraanTerboros && summary.kendaraanTerboros.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      item.totalBorosCount > 0 
                        ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60' 
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.kendaraan}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.platNomor}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.avgKmLiter} KM/L
                      </div>
                      {item.totalBorosCount > 0 ? (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center justify-end gap-1">
                          <XCircle className="w-3 h-3" /> {item.totalBorosCount}x Boros
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Normal
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Fuel Records Quick Glance */}
            <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-sky-500" /> Transaksi BBM Terbaru
                  </h3>
                  <p className="text-[11px] text-slate-500">Entri pengisian bahan bakar teranyar</p>
                </div>

                <button
                  onClick={() => setActiveTab('transaksi')}
                  className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Tanggal</th>
                      <th className="p-2.5">Kendaraan</th>
                      <th className="p-2.5">BBM</th>
                      <th className="p-2.5">Jarak & Liter</th>
                      <th className="p-2.5">KM/L Aktual</th>
                      <th className="p-2.5 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {logs.slice(0, 5).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-2.5 font-mono text-[11px]">{log.tanggalPembelian}</td>
                        <td className="p-2.5">
                          <div className="font-semibold">{log.kendaraanNama}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.platNomor}</div>
                        </td>
                        <td className="p-2.5 font-medium">{log.jenisBbm}</td>
                        <td className="p-2.5">
                          <div>{log.jarakTempuh} KM</div>
                          <div className="text-[10px] text-slate-500">{log.jumlahLiter} Liter</div>
                        </td>
                        <td className="p-2.5 font-bold">
                          {log.kmLiterAktual} <span className="text-[10px] text-slate-400">/ std {log.standarKmLiter}</span>
                        </td>
                        <td className="p-2.5">
                          {log.statusPemakaian === 'Normal' ? (
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Normal
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px] rounded-full inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-500" /> Tidak Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* TAB 2: TRANSAKSI LAPORAN BBM */}
      {/* ======================================= */}
      {activeTab === 'transaksi' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                <SlidersHorizontal className="w-4 h-4 text-sky-500" /> Filter Data Laporan BBM
              </div>
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset Filter
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* Filter Tanggal */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              {/* Filter Bulan */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bulan</label>
                <select
                  value={filterBulan}
                  onChange={(e) => setFilterBulan(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="">Semua Bulan</option>
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
              </div>

              {/* Filter Tahun */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tahun</label>
                <select
                  value={filterTahun}
                  onChange={(e) => setFilterTahun(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              {/* Filter Kendaraan */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kendaraan</label>
                <select
                  value={filterKendaraan}
                  onChange={(e) => setFilterKendaraan(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="">Semua Kendaraan</option>
                  {kendaraanList.map(k => (
                    <option key={k.id} value={k.id}>{k.namaKendaraan} ({k.platNomor})</option>
                  ))}
                </select>
              </div>

              {/* Filter Jenis BBM */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Jenis BBM</label>
                <select
                  value={filterJenisBbm}
                  onChange={(e) => setFilterJenisBbm(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="">Semua BBM</option>
                  <option value="Pertalite">Pertalite</option>
                  <option value="Pertamax">Pertamax</option>
                  <option value="Pertamax Turbo">Pertamax Turbo</option>
                  <option value="Solar">Solar</option>
                  <option value="Dexlite">Dexlite</option>
                  <option value="Pertamina Dex">Pertamina Dex</option>
                </select>
              </div>

              {/* Filter Status Pemakaian */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status Pemakaian</label>
                <select
                  value={filterStatusPemakaian}
                  onChange={(e) => setFilterStatusPemakaian(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="">Semua Status</option>
                  <option value="Normal">Normal</option>
                  <option value="Tidak Normal">Tidak Normal (Boros)</option>
                </select>
              </div>
            </div>

            {/* Search Bar & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari plat nomor, nama kendaraan, operator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleExportExcel}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Export PDF / Print
                </button>
              </div>
            </div>
          </div>

          {/* Main Data Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">ID & Tanggal</th>
                    <th className="p-3">Kendaraan & Plat</th>
                    <th className="p-3">Jenis BBM</th>
                    <th className="p-3">KM Awal - Akhir</th>
                    <th className="p-3">Jarak Tempuh</th>
                    <th className="p-3">Harga BBM (Rp)</th>
                    <th className="p-3">Liter</th>
                    <th className="p-3">KM/Liter (Aktual vs Std)</th>
                    <th className="p-3">Status Pemakaian</th>
                    <th className="p-3">Struk</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-8 text-center text-slate-400">
                        Tidak ada data transaksi BBM yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-3">
                          <div className="font-mono font-bold text-sky-600 dark:text-sky-400 text-[11px]">{log.id}</div>
                          <div className="text-[10px] text-slate-500">{log.tanggalPembelian}</div>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{log.kendaraanNama}</div>
                          <div className="inline-block px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300 rounded mt-0.5">
                            {log.platNomor}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold text-[10px] rounded-md border border-sky-200 dark:border-sky-800">
                            {log.jenisBbm}
                          </span>
                        </td>

                        <td className="p-3 font-mono text-[11px]">
                          <div>{log.kmAwal.toLocaleString('id-ID')} KM</div>
                          <div className="text-slate-500 font-bold">→ {log.kmAkhir.toLocaleString('id-ID')} KM</div>
                        </td>

                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                          {log.jarakTempuh.toLocaleString('id-ID')} KM
                        </td>

                        <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Rp {log.hargaBbm.toLocaleString('id-ID')}
                        </td>

                        <td className="p-3 font-medium">
                          {log.jumlahLiter} Liter
                        </td>

                        <td className="p-3">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100">
                            {log.kmLiterAktual} KM/L
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Std: {log.standarKmLiter} KM/L
                          </div>
                        </td>

                        <td className="p-3">
                          {log.statusPemakaian === 'Normal' ? (
                            <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-full inline-flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Normal
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-[10px] rounded-full inline-flex items-center gap-1 border border-rose-300 dark:border-rose-800">
                              <AlertTriangle className="w-3 h-3 text-rose-500" /> Tidak Normal
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          {log.uploadStruk ? (
                            <button
                              onClick={() => setSelectedStrukUrl(log.uploadStruk || null)}
                              className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-[10px] font-bold flex items-center gap-1"
                            >
                              <Receipt className="w-3 h-3" /> Struk Ada
                            </button>
                          ) : (
                            <span className="text-rose-500 font-bold text-[10px]">Belum Upload</span>
                          )}
                        </td>

                        <td className="p-3">
                          <span className={`font-semibold text-[11px] ${log.keterangan === 'Pemakaian Wajar' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400 font-bold'}`}>
                            {log.keterangan}
                          </span>
                        </td>

                        <td className="p-3 text-[11px] text-slate-600 dark:text-slate-400">
                          {log.userInput}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* TAB 3: MASTER KENDARAAN */}
      {/* ======================================= */}
      {activeTab === 'kendaraan' && (
        <div className="space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Car className="w-4 h-4 text-sky-500" /> Master Armada & Standar Efisiensi BBM
              </h2>
              <p className="text-xs text-slate-500">Kelola daftar kendaraan operasional dan batas acuan Standar KM/Liter</p>
            </div>

            <button
              onClick={() => {
                setEditingKendaraanId(null);
                setKendaraanFormData({
                  namaKendaraan: '',
                  platNomor: '',
                  jenisKendaraan: 'Mobil Operasional',
                  standarKmLiter: 10,
                  status: 'Aktif'
                });
                setIsKendaraanModalOpen(true);
              }}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Kendaraan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kendaraanList.map((knd) => (
              <div 
                key={knd.id}
                className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-xl">
                    <Car className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      knd.status === 'Aktif' 
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}>
                      {knd.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{knd.namaKendaraan}</h3>
                  <div className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs rounded">
                    {knd.platNomor}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                  <div className="grid grid-cols-2 gap-2 text-xs flex-1">
                    <div>
                      <span className="text-[10px] text-slate-400">Jenis Armada:</span>
                      <div className="font-medium">{knd.jenisKendaraan}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Standar Konsumsi:</span>
                      <div className="font-bold text-amber-600 dark:text-amber-400">{knd.standarKmLiter} KM / Liter</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => handleEditKendaraan(knd)}
                      className="px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/80 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Edit Kendaraan"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteKendaraan(knd.id, knd.namaKendaraan)}
                      className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Hapus Kendaraan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL 1: TAMBAH TRANSAKSI BBM */}
      {/* ======================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-sky-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Fuel className="w-5 h-5 text-amber-400" />
                Input Transaksi Pengisian BBM
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLog} className="p-6 space-y-4 text-xs">
              {/* Form Error Alert */}
              {formError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs">Peringatan Validasi:</div>
                    <div className="text-[11px] mt-0.5">{formError}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tanggal Pembelian */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Pembelian <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalPembelian}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggalPembelian: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  />
                </div>

                {/* Pilih Kendaraan */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Kendaraan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.kendaraanId}
                    onChange={(e) => handleSelectKendaraan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    required
                  >
                    <option value="">-- Pilih Armada Kendaraan --</option>
                    {kendaraanList.map(k => (
                      <option key={k.id} value={k.id}>{k.namaKendaraan} ({k.platNomor})</option>
                    ))}
                  </select>
                </div>

                {/* Plat Nomor Auto Fill */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plat Nomor (Auto Fill)
                  </label>
                  <input
                    type="text"
                    value={selectedVehicle ? selectedVehicle.platNomor : ''}
                    readOnly
                    placeholder="Auto terisi dari kendaraan"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-600 dark:text-slate-300"
                  />
                </div>

                {/* Jenis BBM */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis BBM <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.jenisBbm}
                    onChange={(e) => setFormData(prev => ({ ...prev, jenisBbm: e.target.value as JenisBbm }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  >
                    <option value="Pertalite">Pertalite</option>
                    <option value="Pertamax">Pertamax</option>
                    <option value="Pertamax Turbo">Pertamax Turbo</option>
                    <option value="Solar">Solar</option>
                    <option value="Dexlite">Dexlite</option>
                    <option value="Pertamina Dex">Pertamina Dex</option>
                  </select>
                </div>

                {/* KM Awal */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    KM Awal (Auto / Odometer Sebelumnya)
                  </label>
                  <input
                    type="number"
                    value={formData.kmAwal}
                    onChange={(e) => setFormData(prev => ({ ...prev, kmAwal: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                {/* KM Akhir */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    KM Akhir (Saat Pengisian) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder={`Wajib > ${numKmAwal}`}
                    value={formData.kmAkhir}
                    onChange={(e) => setFormData(prev => ({ ...prev, kmAkhir: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                    required
                  />
                </div>

                {/* Total Harga BBM (Rupiah) */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Harga BBM (Rp Total Pembayaran) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 150000"
                    value={formData.hargaBbm}
                    onChange={(e) => setFormData(prev => ({ ...prev, hargaBbm: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                    required
                  />
                </div>

                {/* Jumlah Liter */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jumlah Liter (Desimal) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Contoh: 8.53"
                    value={formData.jumlahLiter}
                    onChange={(e) => setFormData(prev => ({ ...prev, jumlahLiter: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* AUTOMATED CALCULATIONS DISPLAY */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Hasil Perhitungan Automatis Efisiensi BBM
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500">Jarak Tempuh:</span>
                    <div className="font-mono font-extrabold text-slate-900 dark:text-slate-100">
                      {calculatedJarakTempuh} KM
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500">KM/Liter Aktual:</span>
                    <div className="font-mono font-extrabold text-slate-900 dark:text-slate-100">
                      {calculatedKmLiterAktual} KM/L
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500">Standar Kendaraan:</span>
                    <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {vehicleStandar} KM/L
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500">Status & Keterangan:</span>
                    <div>
                      {calculatedStatusPemakaian === 'Normal' ? (
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-full inline-block">
                          Normal (Pemakaian Wajar)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px] rounded-full inline-block">
                          Tidak Normal (Boros)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Foto Struk (Wajib) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Foto Struk Pembelian BBM <span className="text-rose-500">* (Wajib)</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="px-4 py-2.5 bg-sky-50 dark:bg-sky-950/60 border border-dashed border-sky-300 dark:border-sky-800 rounded-xl cursor-pointer hover:bg-sky-100 transition flex items-center gap-2 text-sky-700 dark:text-sky-300 font-semibold">
                    <Upload className="w-4 h-4" /> Unggah Foto Struk
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  <span className={`text-[11px] font-bold ${formData.uploadStruk ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {formData.uploadStruk ? '✓ Foto Struk Ter-upload' : '⚠️ Struk Belum Di-upload'}
                  </span>
                </div>

                {formData.uploadStruk && (
                  <div className="mt-2 relative w-32 h-24 border rounded-xl overflow-hidden bg-slate-100">
                    <img src={formData.uploadStruk} alt="Preview Struk" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, uploadStruk: '' }))}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Laporan BBM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL 2: TAMBAH MASTER KENDARAAN */}
      {/* ======================================= */}
      {isKendaraanModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between font-bold text-sm">
              <span className="flex items-center gap-2">
                <Car className="w-4 h-4 text-sky-400" />
                {editingKendaraanId ? 'Edit Master Kendaraan' : 'Tambah Master Kendaraan'}
              </span>
              <button type="button" onClick={() => setIsKendaraanModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitKendaraan} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nama Kendaraan</label>
                <input
                  type="text"
                  placeholder="Contoh: Mobil Operasional Innova"
                  value={kendaraanFormData.namaKendaraan}
                  onChange={(e) => setKendaraanFormData(prev => ({ ...prev, namaKendaraan: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Plat Nomor</label>
                <input
                  type="text"
                  placeholder="Contoh: B 1234 TIK"
                  value={kendaraanFormData.platNomor}
                  onChange={(e) => setKendaraanFormData(prev => ({ ...prev, platNomor: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl uppercase font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Jenis Armada</label>
                <select
                  value={kendaraanFormData.jenisKendaraan}
                  onChange={(e) => setKendaraanFormData(prev => ({ ...prev, jenisKendaraan: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="Mobil Operasional">Mobil Operasional</option>
                  <option value="Mobil Box">Mobil Box</option>
                  <option value="Motor">Motor</option>
                  <option value="Ambulance">Ambulance</option>
                  <option value="Bus">Bus</option>
                  <option value="Truk">Truk</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Standar Efisiensi (KM / Liter)</label>
                <input
                  type="number"
                  placeholder="Contoh: 12"
                  value={kendaraanFormData.standarKmLiter}
                  onChange={(e) => setKendaraanFormData(prev => ({ ...prev, standarKmLiter: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Status Kendaraan</label>
                <select
                  value={kendaraanFormData.status}
                  onChange={(e) => setKendaraanFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-Aktif">Non-Aktif / Servis</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKendaraanModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingKendaraanId ? 'Perbarui Armada' : 'Simpan Armada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL 3: LIGHTBOX FOTO STRUK */}
      {/* ======================================= */}
      {selectedStrukUrl && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden">
            <button
              onClick={() => setSelectedStrukUrl(null)}
              className="absolute top-3 right-3 bg-slate-800 text-white p-1.5 rounded-full hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-amber-400" /> Foto Struk Pembelian BBM
            </div>
            <img src={selectedStrukUrl} alt="Struk BBM" className="w-full h-auto max-h-[70vh] object-contain rounded-xl border border-slate-700" />
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL 4: PRINT & PDF REPORT VIEW */}
      {/* ======================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl p-8 space-y-6 overflow-hidden my-8">
            {/* Header Instansi dari Master Template Dokumen */}
            <GlobalReportHeader
              documentTypeId="bbm-laporan"
              metadata={[
                { label: 'Periode Laporan', value: `Tahun ${filterTahun || '2026'} ${filterBulan ? `Bulan ${filterBulan}` : ''}` },
                { label: 'Klasifikasi', value: 'Dokumen Resmi Logistik BBM' }
              ]}
            />

            {/* Summary Metrics Row */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-100 rounded-xl text-xs font-semibold">
              <div>
                <span className="text-slate-500 text-[10px]">Total Transaksi:</span>
                <div className="font-bold text-sm">{logs.length} Nota</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Total Liter:</span>
                <div className="font-bold text-sm">{logs.reduce((a,b)=>a+b.jumlahLiter,0).toFixed(1)} L</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Total Jarak:</span>
                <div className="font-bold text-sm">{logs.reduce((a,b)=>a+b.jarakTempuh,0).toLocaleString('id-ID')} KM</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Total Pengeluaran:</span>
                <div className="font-bold text-sm text-emerald-700">Rp {logs.reduce((a,b)=>a+b.hargaBbm,0).toLocaleString('id-ID')}</div>
              </div>
            </div>

            {/* Print Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold uppercase text-[10px]">
                    <th className="border border-slate-300 p-2">Tanggal</th>
                    <th className="border border-slate-300 p-2">Kendaraan & Plat</th>
                    <th className="border border-slate-300 p-2">BBM</th>
                    <th className="border border-slate-300 p-2">KM awal-akhir</th>
                    <th className="border border-slate-300 p-2">Jarak</th>
                    <th className="border border-slate-300 p-2">Liter</th>
                    <th className="border border-slate-300 p-2">Harga (Rp)</th>
                    <th className="border border-slate-300 p-2">KM/L</th>
                    <th className="border border-slate-300 p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-2 font-mono text-[10px]">{log.tanggalPembelian}</td>
                      <td className="border border-slate-300 p-2 font-bold">{log.kendaraanNama} ({log.platNomor})</td>
                      <td className="border border-slate-300 p-2">{log.jenisBbm}</td>
                      <td className="border border-slate-300 p-2 font-mono">{log.kmAwal} - {log.kmAkhir}</td>
                      <td className="border border-slate-300 p-2 font-bold">{log.jarakTempuh} KM</td>
                      <td className="border border-slate-300 p-2">{log.jumlahLiter} L</td>
                      <td className="border border-slate-300 p-2 font-bold">Rp {log.hargaBbm.toLocaleString('id-ID')}</td>
                      <td className="border border-slate-300 p-2 font-bold">{log.kmLiterAktual}</td>
                      <td className="border border-slate-300 p-2 font-semibold">
                        {log.statusPemakaian === 'Normal' ? 'Normal' : 'Tidak Normal (Boros)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature Block & Footer dari Master Template Dokumen */}
            <DocumentSignatures documentTypeId="bbm-laporan" />
            <GlobalReportFooter documentTypeId="bbm-laporan" />

            {/* Modal Actions */}
            <div className="pt-4 border-t flex items-center justify-end gap-3">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>

              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Cetak / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
