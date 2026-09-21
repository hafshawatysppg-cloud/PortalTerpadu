import React, { useState, useEffect } from 'react';
import {
  Truck,
  ClipboardEdit,
  TableProperties,
  UserCheck,
  Calendar,
  Clock,
  Building2,
  Users,
  Camera,
  Upload,
  Save,
  CheckCircle2,
  Search,
  Printer,
  FileText,
  Filter,
  Plus,
  Trash2,
  Edit,
  Eye,
  X,
  Phone,
  CreditCard,
  AlertCircle,
  Image as ImageIcon,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { DriverStaff, DistributionReport, BeneficiaryLocation } from '../../types';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';
import { GlobalReportHeader } from '../../components/document/GlobalReportHeader';
import { GlobalReportFooter } from '../../components/document/GlobalReportFooter';
import { DocumentSignatures } from '../../components/document/DocumentSignatures';

interface LaporanDistribusiViewProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const LaporanDistribusiView: React.FC<LaporanDistribusiViewProps> = ({
  currentPath = '/laporan-distribusi/form',
  onNavigate
}) => {
  // Determine active tab based on path
  const getActiveTab = (path: string): 'form' | 'data' | 'driver' => {
    if (path.includes('/data')) return 'data';
    if (path.includes('/driver')) return 'driver';
    return 'form';
  };

  const [activeTab, setActiveTab] = useState<'form' | 'data' | 'driver'>(getActiveTab(currentPath));

  useEffect(() => {
    setActiveTab(getActiveTab(currentPath));
  }, [currentPath]);

  const handleTabChange = (tab: 'form' | 'data' | 'driver') => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate(`/laporan-distribusi/${tab}`);
    }
  };

  // Realtime Data from Firestore / Fallback API
  const { data: realtimeReports } = useFirestoreRealtime<DistributionReport>('distribution_reports');
  const { data: realtimeDrivers } = useFirestoreRealtime<DriverStaff>('drivers');
  const { data: realtimeLocations } = useFirestoreRealtime<BeneficiaryLocation>('beneficiaryLocations');

  // Local State Arrays
  const [reports, setReports] = useState<DistributionReport[]>([]);
  const [drivers, setDrivers] = useState<DriverStaff[]>([]);
  const [locations, setLocations] = useState<BeneficiaryLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Alert & Toast State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --- FORM DISTRIBUSI STATE ---
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    tanggal: todayStr,
    driverId: '',
    instansiId: '',
    namaInstansi: '',
    jumlahPenerimaManfaat: 0,
    jamPengiriman: '07:30',
    jamPenjemputan: '11:30',
    dokPengiriman: '',
    dokPenjemputan: '',
    catatan: '',
    status: 'Selesai' as 'Selesai' | 'Dalam Proses' | 'Dibatalkan'
  });

  const [selectedLocationDetail, setSelectedLocationDetail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- DATA DISTRIBUSI FILTER STATE ---
  const [filterStartDate, setFilterStartDate] = useState<string>(todayStr);
  const [filterEndDate, setFilterEndDate] = useState<string>(todayStr);
  const [filterPreset, setFilterPreset] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReportDetail, setSelectedReportDetail] = useState<DistributionReport | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // --- DRIVER SUB MENU STATE ---
  const [isDriverModalOpen, setIsDriverModalOpen] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<DriverStaff | null>(null);
  const [driverFormData, setDriverFormData] = useState({
    nama: '',
    telepon: '',
    noSim: '',
    kendaraan: '',
    platNomor: '',
    foto: '',
    status: 'Aktif' as 'Aktif' | 'Tugas' | 'Nonaktif',
    catatan: ''
  });

  // Load Initial Data from API
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (realtimeReports && realtimeReports.length > 0) {
      setReports(realtimeReports);
    }
  }, [realtimeReports]);

  useEffect(() => {
    if (realtimeDrivers && realtimeDrivers.length > 0) {
      setDrivers(realtimeDrivers);
    }
  }, [realtimeDrivers]);

  useEffect(() => {
    if (realtimeLocations && realtimeLocations.length > 0) {
      setLocations(realtimeLocations);
    }
  }, [realtimeLocations]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Drivers
      const resDrivers = await fetch('/api/v1/distribusi/drivers');
      if (resDrivers.ok) {
        const json = await resDrivers.json();
        if (json.data && json.data.length > 0) setDrivers(json.data);
      }

      // 2. Fetch Reports
      const resReports = await fetch('/api/v1/distribusi/reports');
      if (resReports.ok) {
        const json = await resReports.json();
        if (json.data) setReports(json.data);
      }

      // 3. Fetch Penerima Manfaat Locations
      const resLocs = await fetch('/api/v1/penerima-manfaat/locations');
      if (resLocs.ok) {
        const json = await resLocs.json();
        if (json.data && json.data.length > 0) {
          setLocations(json.data);
        }
      }
    } catch (err) {
      console.error('Error fetching distribution data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill default driver if available and driverId is empty
  useEffect(() => {
    if (!formData.driverId && drivers.length > 0) {
      const activeDriver = drivers.find(d => d.status === 'Aktif') || drivers[0];
      if (activeDriver) {
        setFormData(prev => ({ ...prev, driverId: activeDriver.id }));
      }
    }
  }, [drivers]);

  // Handle Selection of School / Instansi from Dropdown (Penerima Manfaat Data Binding)
  const handleSelectInstansi = (instansiNamaOrId: string) => {
    if (!instansiNamaOrId) {
      setFormData(prev => ({
        ...prev,
        instansiId: '',
        namaInstansi: '',
        jumlahPenerimaManfaat: 0
      }));
      setSelectedLocationDetail('');
      return;
    }

    // Find location matching id or namaInstansi
    const loc = locations.find(l => l.id === instansiNamaOrId || l.namaInstansi === instansiNamaOrId);

    if (loc) {
      // Calculate total porsi / jumlah penerima
      const totalPorsi = loc.defaultJumlah ||
        ((loc.kategoriBreakdown?.siswa || 0) + (loc.kategoriBreakdown?.guru || 0)) ||
        0;

      setFormData(prev => ({
        ...prev,
        instansiId: loc.id,
        namaInstansi: loc.namaInstansi,
        jumlahPenerimaManfaat: totalPorsi
      }));

      setSelectedLocationDetail(
        `Kelompok: ${loc.groupNama || 'Sasaran Utama'} | Alamat: ${loc.alamat || 'Area Kraksaan'} | Kontat: ${loc.kontak || '-'}`
      );
    } else {
      // Custom entry fallback
      setFormData(prev => ({
        ...prev,
        instansiId: 'CUSTOM',
        namaInstansi: instansiNamaOrId,
      }));
      setSelectedLocationDetail('');
    }
  };

  // Image File Upload Helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'dokPengiriman' | 'dokPenjemputan') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran foto maksimal 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, [field]: base64 }));
      showToast('Foto dokumentasi berhasil diunggah.', 'info');
    };
    reader.readAsDataURL(file);
  };

  // Submit Form Distribusi
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tanggal) {
      showToast('Tanggal pengiriman wajib diisi.', 'error');
      return;
    }
    if (!formData.driverId) {
      showToast('Silakan pilih Distributor / Driver.', 'error');
      return;
    }
    if (!formData.namaInstansi) {
      showToast('Silakan pilih atau isi Nama Sekolah / Instansi.', 'error');
      return;
    }

    const selectedDriver = drivers.find(d => d.id === formData.driverId);
    const driverNama = selectedDriver ? selectedDriver.nama : 'Driver Unassigned';
    const driverFoto = selectedDriver ? selectedDriver.foto : '';
    const driverKendaraan = selectedDriver ? `${selectedDriver.kendaraan} (${selectedDriver.platNomor})` : 'Armada Box';

    setIsSubmitting(true);

    const payload = {
      ...formData,
      driverNama,
      driverFoto,
      driverKendaraan
    };

    try {
      const res = await fetch('/api/v1/distribusi/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (json.success && json.data) {
        showToast(`Laporan Distribusi untuk ${formData.namaInstansi} berhasil disimpan!`, 'success');

        // Update local state
        setReports(prev => [json.data, ...prev]);

        // Reset form
        setFormData({
          tanggal: todayStr,
          driverId: drivers[0]?.id || '',
          instansiId: '',
          namaInstansi: '',
          jumlahPenerimaManfaat: 0,
          jamPengiriman: '07:30',
          jamPenjemputan: '11:30',
          dokPengiriman: '',
          dokPenjemputan: '',
          catatan: '',
          status: 'Selesai'
        });
        setSelectedLocationDetail('');

        // Option to switch to Data Distribusi tab
        setTimeout(() => {
          handleTabChange('data');
        }, 1200);
      } else {
        showToast(json.message || 'Gagal menyimpan laporan.', 'error');
      }
    } catch (err) {
      console.error('Error saving distribution report:', err);
      showToast('Terjadi kesalahan jaringan saat menyimpan laporan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Date Presets Handler for Data Distribusi
  const handlePresetChange = (preset: 'today' | 'week' | 'month' | 'all') => {
    setFilterPreset(preset);
    const now = new Date();
    if (preset === 'today') {
      const dateStr = now.toISOString().split('T')[0];
      setFilterStartDate(dateStr);
      setFilterEndDate(dateStr);
    } else if (preset === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      setFilterStartDate(weekAgo.toISOString().split('T')[0]);
      setFilterEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setDate(now.getDate() - 30);
      setFilterStartDate(monthAgo.toISOString().split('T')[0]);
      setFilterEndDate(now.toISOString().split('T')[0]);
    } else {
      setFilterStartDate('2026-01-01');
      setFilterEndDate('2026-12-31');
    }
  };

  // Filtered Reports Array
  const filteredReports = reports.filter(rep => {
    const matchDate = rep.tanggal >= filterStartDate && rep.tanggal <= filterEndDate;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !searchQuery ||
      rep.namaInstansi.toLowerCase().includes(q) ||
      rep.driverNama.toLowerCase().includes(q) ||
      (rep.catatan && rep.catatan.toLowerCase().includes(q));

    return matchDate && matchSearch;
  });

  // Calculate totals for summary cards
  const totalPorsiTerdistribusi = filteredReports.reduce((acc, r) => acc + (Number(r.jumlahPenerimaManfaat) || 0), 0);
  const totalLaporanSelesai = filteredReports.filter(r => r.status === 'Selesai').length;

  // Driver Photo Upload Handler
  const handleDriverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran foto maksimal 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setDriverFormData(prev => ({ ...prev, foto: base64 }));
      showToast('Foto profil driver berhasil diunggah.', 'info');
    };
    reader.readAsDataURL(file);
  };

  // Driver Modal Handler
  const handleOpenDriverModal = (driver?: DriverStaff) => {
    if (driver) {
      setEditingDriver(driver);
      setDriverFormData({
        nama: driver.nama,
        telepon: driver.telepon,
        noSim: driver.noSim,
        kendaraan: driver.kendaraan || '',
        platNomor: driver.platNomor || '',
        foto: driver.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        status: driver.status,
        catatan: driver.catatan || ''
      });
    } else {
      setEditingDriver(null);
      setDriverFormData({
        nama: '',
        telepon: '',
        noSim: '',
        kendaraan: '',
        platNomor: '',
        foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        status: 'Aktif',
        catatan: ''
      });
    }
    setIsDriverModalOpen(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!driverFormData.nama) {
      showToast('Nama Driver wajib diisi.', 'error');
      return;
    }

    try {
      if (editingDriver) {
        // Edit Driver
        const res = await fetch(`/api/v1/distribusi/drivers/${editingDriver.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(driverFormData)
        });
        const json = await res.json();
        if (json.success && json.data) {
          setDrivers(prev => prev.map(d => d.id === editingDriver.id ? json.data : d));
          showToast(`Data driver ${driverFormData.nama} berhasil diperbarui.`, 'success');
        }
      } else {
        // Add New Driver
        const res = await fetch('/api/v1/distribusi/drivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(driverFormData)
        });
        const json = await res.json();
        if (json.success && json.data) {
          setDrivers(prev => [json.data, ...prev]);
          showToast(`Driver baru ${driverFormData.nama} berhasil ditambahkan.`, 'success');
        }
      }
      setIsDriverModalOpen(false);
    } catch (err) {
      console.error('Error saving driver:', err);
      showToast('Terjadi kesalahan saat menyimpan data driver.', 'error');
    }
  };

  const handleDeleteDriver = async (driverId: string, driverNama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data driver ${driverNama}?`)) return;

    try {
      const res = await fetch(`/api/v1/distribusi/drivers/${driverId}`, { method: 'DELETE' });
      if (res.ok) {
        setDrivers(prev => prev.filter(d => d.id !== driverId));
        showToast(`Driver ${driverNama} berhasil dihapus.`, 'info');
      }
    } catch (err) {
      console.error('Error deleting driver:', err);
    }
  };

  const handleDeleteReport = async (reportId: string, namaInstansi: string) => {
    if (!window.confirm(`Hapus laporan distribusi untuk ${namaInstansi}?`)) return;

    try {
      const res = await fetch(`/api/v1/distribusi/reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        showToast('Laporan distribusi berhasil dihapus.', 'info');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
    }
  };

  // Sample Presets for Documentation Photos
  const setSamplePhoto = (field: 'dokPengiriman' | 'dokPenjemputan', type: 'pengiriman' | 'penjemputan') => {
    const samplePengiriman = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500';
    const samplePenjemputan = 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=500';
    const photo = type === 'pengiriman' ? samplePengiriman : samplePenjemputan;
    setFormData(prev => ({ ...prev, [field]: photo }));
    showToast(`Dokumentasi ${type} sampel berhasil dipilih.`, 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-3 sm:p-6 text-slate-800 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border animate-bounce ${
          toastMessage.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-500'
            : toastMessage.type === 'error'
            ? 'bg-rose-600 text-white border-rose-500'
            : 'bg-blue-600 text-white border-blue-500'
        }`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-5 sm:p-7 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 mb-2 border border-white/15">
              <Truck className="w-3.5 h-3.5 text-blue-300" />
              Sistem Penyaluran & Penjemputan Ompreng Makanan
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Laporan Distribusi</h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-2xl">
              Pusat pencatatan distribusi porsi makanan bergizi, penugasan driver, dan validasi serah terima ompreng sekolah / instansi sasaran.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/15 self-start sm:self-auto">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div className="text-xs">
              <p className="font-semibold text-white">Single Source of Truth</p>
              <p className="text-blue-200">Terintegrasi Master Template & Penerima Manfaat</p>
            </div>
          </div>
        </div>

        {/* Sub-Menu Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/15 overflow-x-auto pb-1">
          <button
            onClick={() => handleTabChange('form')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'form'
                ? 'bg-white text-blue-900 shadow-md font-semibold'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <ClipboardEdit className="w-4 h-4" />
            Form Distribusi
          </button>

          <button
            onClick={() => handleTabChange('data')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'data'
                ? 'bg-white text-blue-900 shadow-md font-semibold'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <TableProperties className="w-4 h-4" />
            Data Distribusi
            {reports.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'data' ? 'bg-blue-100 text-blue-800' : 'bg-white/20 text-white'
              }`}>
                {reports.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('driver')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
              activeTab === 'driver'
                ? 'bg-white text-blue-900 shadow-md font-semibold'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Driver
            {drivers.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'driver' ? 'bg-blue-100 text-blue-800' : 'bg-white/20 text-white'
              }`}>
                {drivers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB MENU 1: FORM DISTRIBUSI */}
      {/* ========================================================================= */}
      {activeTab === 'form' && (
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <ClipboardEdit className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Form Pengisian Distribusi Makanan</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Isi detail pengiriman dan penjemputan ompreng ke sekolah/instansi sasaran
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchInitialData}
              className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              title="Sinkronisasi Data Terkini"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitForm} className="p-6 space-y-6">
            {/* Row 1: Tanggal & Distributor (Driver Dropdown) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Tanggal Pengiriman <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Distributor Dropdown (From Driver Sub Menu) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Distributor / Driver <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTabChange('driver')}
                    className="text-[11px] text-blue-600 hover:underline font-medium flex items-center gap-1"
                  >
                    + Kelola Driver
                  </button>
                </div>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <select
                    value={formData.driverId}
                    onChange={(e) => setFormData(prev => ({ ...prev, driverId: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Pilih Distributor / Driver --</option>
                    {drivers.map(drv => (
                      <option key={drv.id} value={drv.id}>
                        {drv.nama} ({drv.kendaraan} - {drv.platNomor})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: Nama Sekolah / Instansi (Dropdown from Penerima Manfaat) & Jumlah Penerima Manfaat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
              {/* Nama Sekolah / Instansi */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-900 dark:text-blue-200 mb-2">
                  Nama Sekolah / Instansi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-blue-500" />
                  <select
                    value={formData.instansiId || formData.namaInstansi}
                    onChange={(e) => handleSelectInstansi(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Pilih Sekolah / Instansi Sasaran --</option>
                    <optgroup label="Lembaga / Sasaran (Menu Penerima Manfaat)">
                      {locations.map(loc => {
                        const count = loc.defaultJumlah || ((loc.kategoriBreakdown?.siswa || 0) + (loc.kategoriBreakdown?.guru || 0));
                        return (
                          <option key={loc.id} value={loc.id}>
                            {loc.namaInstansi} ({count ? `${count} Porsi` : 'Auto-sync'})
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>
                </div>
                {selectedLocationDetail && (
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-1.5 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    {selectedLocationDetail}
                  </p>
                )}
              </div>

              {/* Jumlah Penerima Manfaat (Auto-filled from Penerima Manfaat total porsi) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-blue-900 dark:text-blue-200 mb-2">
                  Jumlah Penerima Manfaat (Porsi) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3.5 top-3.5 text-blue-500" />
                  <input
                    type="number"
                    min="0"
                    value={formData.jumlahPenerimaManfaat || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, jumlahPenerimaManfaat: parseInt(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-bold text-blue-900 dark:text-blue-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Otomatis mengikuti data Penerima Manfaat"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Otomatis ditarik dari total porsi Menu Penerima Manfaat saat instansi dipilih.
                </p>
              </div>
            </div>

            {/* Row 3: Jam Pengiriman & Jam Penjemputan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Jam Pengiriman */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Jam Pengiriman (Antar Pagi)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="time"
                    value={formData.jamPengiriman}
                    onChange={(e) => setFormData(prev => ({ ...prev, jamPengiriman: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Jam Penjemputan */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  Jam Penjemputan (Tarik Ompreng)
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="time"
                    value={formData.jamPenjemputan}
                    onChange={(e) => setFormData(prev => ({ ...prev, jamPenjemputan: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Dokumentasi Pengiriman & Dokumentasi Penjemputan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Dokumentasi Pengiriman */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/50">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2 flex items-center justify-between">
                  <span>Dokumentasi Pengiriman</span>
                  <button
                    type="button"
                    onClick={() => setSamplePhoto('dokPengiriman', 'pengiriman')}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium normal-case"
                  >
                    + Pakai Sampel
                  </button>
                </label>

                {formData.dokPengiriman ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 group h-40 bg-slate-900">
                    <img
                      src={formData.dokPengiriman}
                      alt="Dokumentasi Pengiriman"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, dokPengiriman: '' }))}
                      className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-lg shadow hover:bg-rose-700 transition"
                      title="Hapus Foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-white">
                      Foto Pengiriman Siap
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-800 transition p-4 text-center">
                    <Camera className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Upload Foto Pengiriman</span>
                    <span className="text-[10px] text-slate-400 mt-1">PNG/JPG maks 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'dokPengiriman')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Dokumentasi Penjemputan */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/50">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2 flex items-center justify-between">
                  <span>Dokumentasi Penjemputan</span>
                  <button
                    type="button"
                    onClick={() => setSamplePhoto('dokPenjemputan', 'penjemputan')}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium normal-case"
                  >
                    + Pakai Sampel
                  </button>
                </label>

                {formData.dokPenjemputan ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 group h-40 bg-slate-900">
                    <img
                      src={formData.dokPenjemputan}
                      alt="Dokumentasi Penjemputan"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, dokPenjemputan: '' }))}
                      className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-lg shadow hover:bg-rose-700 transition"
                      title="Hapus Foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-white">
                      Foto Penjemputan Siap
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-800 transition p-4 text-center">
                    <Camera className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Upload Foto Penjemputan</span>
                    <span className="text-[10px] text-slate-400 mt-1">PNG/JPG maks 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'dokPenjemputan')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Catatan Lapangan */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Catatan Operasional Distribusi (Opsional)
              </label>
              <textarea
                rows={2}
                value={formData.catatan}
                onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                placeholder="Catatan penyerahan, kondisi ompreng, penerima di lokasi..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Prominent Save Button at Bottom */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all text-base disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Menyimpan Laporan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Simpan Laporan Distribusi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB MENU 2: DATA DISTRIBUSI */}
      {/* ========================================================================= */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Filter & Summary Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              {/* Presets & Custom Date Range */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => handlePresetChange('today')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filterPreset === 'today' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => handlePresetChange('week')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filterPreset === 'week' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    7 Hari
                  </button>
                  <button
                    onClick={() => handlePresetChange('month')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filterPreset === 'month' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    30 Hari
                  </button>
                  <button
                    onClick={() => handlePresetChange('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filterPreset === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Semua
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Dari:</span>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => {
                      setFilterStartDate(e.target.value);
                      setFilterPreset('all');
                    }}
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  />
                  <span className="text-slate-500 font-medium">s/d:</span>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => {
                      setFilterEndDate(e.target.value);
                      setFilterPreset('all');
                    }}
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons: Export & Print Out */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  Cetak & PDF Master Template
                </button>
              </div>
            </div>

            {/* Search & Summary Stats */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari sekolah, driver, lokasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 px-3 py-1.5 rounded-xl">
                  <span className="text-slate-500 dark:text-slate-400">Total Laporan:</span>{' '}
                  <span className="font-bold text-blue-700 dark:text-blue-300">{filteredReports.length} Lokasi</span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 px-3 py-1.5 rounded-xl">
                  <span className="text-slate-500 dark:text-slate-400">Total Porsi Terdistribusi:</span>{' '}
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">{totalPorsiTerdistribusi.toLocaleString('id-ID')} Porsi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reports Table / Card View */}
          {filteredReports.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <TableProperties className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Belum Ada Data Laporan Distribusi</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Tidak ada data pengiriman pada rentang tanggal yang dipilih. Silakan isi form di menu Form Distribusi.
              </p>
              <button
                onClick={() => handleTabChange('form')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
              >
                + Input Form Distribusi Baru
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5">No & Tanggal</th>
                      <th className="p-3.5">Sekolah / Instansi</th>
                      <th className="p-3.5">Distributor / Driver</th>
                      <th className="p-3.5 text-center">Porsi (Penerima)</th>
                      <th className="p-3.5 text-center">Jam Kirim & Jemput</th>
                      <th className="p-3.5 text-center">Dokumentasi</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredReports.map((rep, idx) => (
                      <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{idx + 1}. {rep.tanggal}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{rep.id}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-blue-900 dark:text-blue-200 block text-sm">{rep.namaInstansi}</span>
                          {rep.catatan && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                              "{rep.catatan}"
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            {rep.driverFoto ? (
                              <img src={rep.driverFoto} alt={rep.driverNama} className="w-7 h-7 rounded-full object-cover border border-slate-300" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                {rep.driverNama?.charAt(0) || 'D'}
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 block">{rep.driverNama}</span>
                              <span className="text-[10px] text-slate-400">{rep.driverKendaraan}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs">
                            {rep.jumlahPenerimaManfaat} Porsi
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="text-[11px] font-medium space-y-0.5">
                            <span className="text-emerald-600 dark:text-emerald-400 block">Kirim: {rep.jamPengiriman || '-'}</span>
                            <span className="text-amber-600 dark:text-amber-400 block">Jemput: {rep.jamPenjemputan || '-'}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {rep.dokPengiriman ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                Kirim ✓
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px]">
                                No Kirim
                              </span>
                            )}
                            {rep.dokPenjemputan ? (
                              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                                Jemput ✓
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px]">
                                No Jemput
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            rep.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {rep.status || 'Selesai'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedReportDetail(rep)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Detail Dokumentasi & Laporan"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReport(rep.id, rep.namaInstansi)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB MENU 3: DRIVER */}
      {/* ========================================================================= */}
      {activeTab === 'driver' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Daftar Petugas Driver
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Manajemen data driver, nomor SIM, kontak WhatsApp, foto profil, dan status tugas.
              </p>
            </div>

            <button
              onClick={() => handleOpenDriverModal()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Tambah Driver Baru
            </button>
          </div>

          {/* Driver Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {drivers.map(drv => (
              <div
                key={drv.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition relative overflow-hidden group"
              >
                <div className="flex items-start gap-4">
                  {/* Foto Driver */}
                  <div className="relative">
                    <img
                      src={drv.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt={drv.nama}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/30 shadow-sm"
                    />
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                      drv.status === 'Aktif' ? 'bg-emerald-500' : drv.status === 'Tugas' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                  </div>

                  {/* Profile Driver Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">{drv.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        drv.status === 'Aktif'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : drv.status === 'Tugas'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {drv.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">{drv.nama}</h3>

                    <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <p className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{drv.telepon}</span>
                      </p>
                      <p className="flex items-center gap-1.5 truncate">
                        <CreditCard className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                        <span>SIM: {drv.noSim}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {drv.catatan && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic">
                    "{drv.catatan}"
                  </div>
                )}

                {/* Actions Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, driverId: drv.id }));
                      handleTabChange('form');
                      showToast(`Driver ${drv.nama} dipilih untuk Form Distribusi.`, 'info');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                  >
                    Gunakan di Form <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenDriverModal(drv)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Edit Driver"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(drv.id, drv.nama)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                      title="Hapus Driver"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REPORT DETAIL & DOKUMENTASI */}
      {/* ========================================================================= */}
      {selectedReportDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="bg-blue-600 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Detail Laporan Distribusi</span>
                <h3 className="text-xl font-bold">{selectedReportDetail.namaInstansi}</h3>
              </div>
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block">Tanggal Pengiriman:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{selectedReportDetail.tanggal}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Porsi (Penerima):</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{selectedReportDetail.jumlahPenerimaManfaat} Porsi</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Distributor / Driver:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedReportDetail.driverNama}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Armada Kendaraan:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedReportDetail.driverKendaraan || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Jam Pengiriman:</span>
                  <span className="font-bold text-emerald-600">{selectedReportDetail.jamPengiriman || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Jam Penjemputan:</span>
                  <span className="font-bold text-amber-600">{selectedReportDetail.jamPenjemputan || '-'}</span>
                </div>
              </div>

              {/* Documentation Photos */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Dokumentasi Serah Terima Ompreng</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">1. Foto Pengiriman</span>
                    {selectedReportDetail.dokPengiriman ? (
                      <img src={selectedReportDetail.dokPengiriman} alt="Foto Pengiriman" className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm" />
                    ) : (
                      <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400">
                        Tidak ada foto pengiriman
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold block mb-1.5 text-slate-700 dark:text-slate-300">2. Foto Penjemputan</span>
                    {selectedReportDetail.dokPenjemputan ? (
                      <img src={selectedReportDetail.dokPenjemputan} alt="Foto Penjemputan" className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm" />
                    ) : (
                      <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400">
                        Tidak ada foto penjemputan
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedReportDetail.catatan && (
                <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold block mb-0.5">Catatan Operasional:</span>
                  {selectedReportDetail.catatan}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-100 dark:bg-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedReportDetail(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINT PREVIEW MASTER TEMPLATE DOKUMEN */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-sm">Cetak Master Template Dokumen Laporan Distribusi</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
                >
                  Print / Export PDF
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Document Content */}
            <div className="p-8 bg-white text-slate-900 font-serif print:p-0">
              {/* Kop Surat Master Template Dokumen */}
              <GlobalReportHeader
                documentTypeId="laporan-distribusi"
                defaultTitle="LAPORAN REKAPITULASI DISTRIBUSI & PENYERAHAN MAKANAN BERGIZI"
                defaultSubTitle={`Periode Distribusi: ${filterStartDate} s/d ${filterEndDate}`}
              />

              <div className="my-6 space-y-4 text-xs font-sans">
                <div className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p><span className="font-bold">Nomor Dokumen:</span> DIST/SPPG/{filterStartDate.replace(/-/g, '')}/001</p>
                    <p><span className="font-bold">Tanggal Cetak:</span> {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p><span className="font-bold">Total Porsi Terdistribusi:</span> {totalPorsiTerdistribusi} Porsi</p>
                    <p><span className="font-bold">Total Laporan Selesai:</span> {totalLaporanSelesai} Lokasi</p>
                  </div>
                </div>

                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="border border-slate-300 p-2 text-center w-8">No</th>
                      <th className="border border-slate-300 p-2">Tanggal</th>
                      <th className="border border-slate-300 p-2">Sekolah / Instansi Sasaran</th>
                      <th className="border border-slate-300 p-2">Distributor / Driver</th>
                      <th className="border border-slate-300 p-2 text-center">Jumlah Porsi</th>
                      <th className="border border-slate-300 p-2 text-center">Jam Kirim / Jemput</th>
                      <th className="border border-slate-300 p-2 text-center">Dokumentasi Pengiriman</th>
                      <th className="border border-slate-300 p-2 text-center">Dokumentasi Penjemputan</th>
                      <th className="border border-slate-300 p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((r, i) => (
                      <tr key={r.id} className="border-b border-slate-200">
                        <td className="border border-slate-300 p-2 text-center align-middle">{i + 1}</td>
                        <td className="border border-slate-300 p-2 align-middle">{r.tanggal}</td>
                        <td className="border border-slate-300 p-2 align-middle font-bold">
                          {r.namaInstansi}
                          {r.catatan && (
                            <span className="block text-[10px] font-normal italic text-slate-600 mt-0.5">
                              "{r.catatan}"
                            </span>
                          )}
                        </td>
                        <td className="border border-slate-300 p-2 align-middle">{r.driverNama} ({r.driverKendaraan || 'Armada'})</td>
                        <td className="border border-slate-300 p-2 text-center align-middle font-bold">{r.jumlahPenerimaManfaat} Porsi</td>
                        <td className="border border-slate-300 p-2 text-center align-middle font-semibold">
                          <span className="text-emerald-800 block">Kirim: {r.jamPengiriman || '-'}</span>
                          <span className="text-amber-800 block">Jemput: {r.jamPenjemputan || '-'}</span>
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center align-middle">
                          {r.dokPengiriman ? (
                            <div className="flex flex-col items-center justify-center">
                              <img
                                src={r.dokPengiriman}
                                alt="Dokumentasi Pengiriman"
                                className="w-20 h-16 object-cover rounded border border-slate-400 print:w-20 print:h-16 shadow-sm"
                              />
                              <span className="text-[9px] text-slate-600 font-semibold mt-0.5">Serah Terima</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">- (Tidak ada foto)</span>
                          )}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center align-middle">
                          {r.dokPenjemputan ? (
                            <div className="flex flex-col items-center justify-center">
                              <img
                                src={r.dokPenjemputan}
                                alt="Dokumentasi Penjemputan"
                                className="w-20 h-16 object-cover rounded border border-slate-400 print:w-20 print:h-16 shadow-sm"
                              />
                              <span className="text-[9px] text-slate-600 font-semibold mt-0.5">Penjemputan</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">- (Tidak ada foto)</span>
                          )}
                        </td>
                        <td className="border border-slate-300 p-2 text-center align-middle font-bold text-emerald-700">{r.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Tanda Tangan Master Template Dokumen */}
                <div className="mt-8">
                  <DocumentSignatures documentTypeId="laporan-distribusi" />
                </div>

                {/* Footer Master Template Dokumen */}
                <div className="mt-6 border-t pt-2">
                  <GlobalReportFooter documentTypeId="laporan-distribusi" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT DRIVER */}
      {/* ========================================================================= */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingDriver ? 'Edit Data Driver' : 'Tambah Driver Baru'}
              </h3>
              <button onClick={() => setIsDriverModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nama Lengkap Driver *</label>
                <input
                  type="text"
                  value={driverFormData.nama}
                  onChange={(e) => setDriverFormData(prev => ({ ...prev, nama: e.target.value }))}
                  placeholder="e.g. Joko Susilo"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={driverFormData.telepon}
                    onChange={(e) => setDriverFormData(prev => ({ ...prev, telepon: e.target.value }))}
                    placeholder="0812-3456-7890"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">No. SIM</label>
                  <input
                    type="text"
                    value={driverFormData.noSim}
                    onChange={(e) => setDriverFormData(prev => ({ ...prev, noSim: e.target.value }))}
                    placeholder="92817263541"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Foto Profile Driver Upload */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Foto Profile Driver *</label>
                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="relative flex-shrink-0">
                    <img
                      src={driverFormData.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt="Preview Foto Driver"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-blue-500/40 shadow-sm"
                    />
                    {driverFormData.foto && (
                      <button
                        type="button"
                        onClick={() => setDriverFormData(prev => ({ ...prev, foto: '' }))}
                        className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-0.5 rounded-full hover:bg-rose-600 shadow"
                        title="Hapus Foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="driver-photo-file-upload"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Unggah Foto Profile
                      </label>
                      <input
                        id="driver-photo-file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleDriverPhotoUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Format JPG, PNG, WEBP (Maksimal 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Status Driver</label>
                <select
                  value={driverFormData.status}
                  onChange={(e) => setDriverFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Tugas">Dalam Tugas</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Catatan / Rute Penugasan</label>
                <textarea
                  rows={2}
                  value={driverFormData.catatan}
                  onChange={(e) => setDriverFormData(prev => ({ ...prev, catatan: e.target.value }))}
                  placeholder="Catatan penugasan rute..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  Simpan Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaporanDistribusiView;
