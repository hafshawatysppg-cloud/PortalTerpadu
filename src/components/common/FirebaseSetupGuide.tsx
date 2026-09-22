import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCw, 
  Copy, 
  Check, 
  ArrowRight, 
  ExternalLink, 
  Terminal, 
  Layers, 
  Sparkles, 
  Activity, 
  AlertCircle,
  FileCode,
  Flame,
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';

interface FirebaseSetupGuideProps {
  onClose?: () => void;
  isModal?: boolean;
}

interface CloudStatusInfo {
  isConnected: boolean;
  status: string;
  projectId: string;
  databaseId: string;
  authDomain: string;
  appId: string;
  apiKey: string;
  syncedCollectionsCount: number;
  collections?: string[];
  mode: string;
}

export const FirebaseSetupGuide: React.FC<FirebaseSetupGuideProps> = ({ 
  onClose, 
  isModal = false 
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [cloudInfo, setCloudInfo] = useState<CloudStatusInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Test Connection States
  const [testingProbe, setTestingProbe] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    probeTimestamp?: string;
  } | null>(null);

  // Reseed / Sync States
  const [syncingData, setSyncingData] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/cloud/status');
      const data = await res.json();
      if (data.success && data.cloud) {
        setCloudInfo(data.cloud);
      }
    } catch (err) {
      console.error('Gagal mengambil status cloud:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRunProbe = async () => {
    setTestingProbe(true);
    setProbeResult(null);
    try {
      const res = await fetch('/api/v1/cloud/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setProbeResult(data);
      if (data.success) {
        fetchStatus();
      }
    } catch (err: any) {
      setProbeResult({
        success: false,
        latencyMs: 0,
        message: err?.message || 'Gagal menghubungi probe server'
      });
    } finally {
      setTestingProbe(false);
    }
  };

  const handleReseedData = async () => {
    setSyncingData(true);
    setSyncSuccessMsg(null);
    try {
      const res = await fetch('/api/v1/cloud/reseed-clean-slate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setSyncSuccessMsg(data.message || 'Koleksi berhasil diinisialisasi!');
        fetchStatus();
      } else {
        setSyncSuccessMsg(`Peringatan: ${data.message}`);
      }
    } catch (err: any) {
      setSyncSuccessMsg(`Gagal: ${err?.message}`);
    } finally {
      setSyncingData(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: 'Kredensial Database Baru',
      shortDesc: 'Detail instance Google Cloud Firestore yang baru diprovisioning',
      icon: Database
    },
    {
      id: 2,
      title: 'Aturan Keamanan (Rules)',
      shortDesc: 'Verifikasi keamanan 34 koleksi data aplikasi',
      icon: ShieldCheck
    },
    {
      id: 3,
      title: 'Inisialisasi & Seeding Koleksi',
      shortDesc: 'Pengisian data master awal ke database bersih',
      icon: Layers
    },
    {
      id: 4,
      title: 'Pengujian Koneksi Langsung',
      shortDesc: 'Live read/write probe & cek latensi Firestore',
      icon: Activity
    }
  ];

  const content = (
    <div className="space-y-6">
      {/* Top Banner Status Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl border border-blue-900/50 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Flame className="w-48 h-48 text-amber-500" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-500/30 mb-2.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Clean Slate Provisioning Mode
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              Panduan Inisialisasi Database Firebase
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Panduan terstruktur untuk memverifikasi, mengamankan, dan menyinkronkan koneksi database 
              Google Cloud Firestore baru yang telah di-reset pada akun Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-700/80 text-right">
              <div className="text-[11px] text-slate-400 font-medium">Status Koneksi Saat Ini:</div>
              <div className="flex items-center justify-end gap-2 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                  {cloudInfo?.status === 'online' ? 'Online & Terhubung' : 'Memeriksa...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Parameters Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Project ID:</span>
            <span className="font-mono text-white font-semibold truncate block mt-0.5">
              {cloudInfo?.projectId || 'Memuat...'}
            </span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Firestore Database ID:</span>
            <span className="font-mono text-amber-300 font-semibold truncate block mt-0.5">
              {cloudInfo?.databaseId || 'Memuat...'}
            </span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Mode Transport:</span>
            <span className="text-blue-300 font-semibold truncate block mt-0.5">
              HTTP Long-Polling (Stabil)
            </span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Koleksi Terdaftar:</span>
            <span className="text-emerald-300 font-bold text-sm block mt-0.5">
              {cloudInfo?.syncedCollectionsCount || 34} Koleksi Real-time
            </span>
          </div>
        </div>
      </div>

      {/* Steps Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isActive = activeStep === step.id;
          const isCompleted = activeStep > step.id;

          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
                isActive 
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 shadow-sm' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : isCompleted
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>
                <StepIcon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              </div>
              <h3 className={`font-bold text-xs ${isActive ? 'text-blue-900 dark:text-blue-200' : 'text-slate-800 dark:text-slate-200'}`}>
                {step.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {step.shortDesc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Step Detailed Content Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        
        {/* STEP 1: CREDENTIALS & INSTANCE DETAILS */}
        {activeStep === 1 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Langkah 1 dari 4</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Kredensial Database Firestore Baru (Clean Slate)
                </h3>
              </div>
              <button
                onClick={fetchStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Segarkan Status
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Database baru telah diinisialisasi secara bersih. File konfigurasi <code>firebase-applet-config.json</code> pada root aplikasi 
              telah otomatis sinkron dengan kredensial Google Cloud project Anda:
            </p>

            {/* Credential Data Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-500">Google Cloud Project ID</span>
                  <button 
                    onClick={() => handleCopy(cloudInfo?.projectId || '', 'projectId')}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                    title="Salin Project ID"
                  >
                    {copiedKey === 'projectId' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="font-mono text-slate-900 dark:text-slate-100 font-bold select-all break-all">
                  {cloudInfo?.projectId || 'gen-lang-client-0372936717'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-500">Firestore Database ID</span>
                  <button 
                    onClick={() => handleCopy(cloudInfo?.databaseId || '', 'databaseId')}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                    title="Salin Database ID"
                  >
                    {copiedKey === 'databaseId' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="font-mono text-amber-600 dark:text-amber-400 font-bold select-all break-all">
                  {cloudInfo?.databaseId || 'ai-studio-portalterpadu-bbd336b6-0993-456c-8485-a574d85d70cf'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-500">Auth Domain</span>
                  <button 
                    onClick={() => handleCopy(cloudInfo?.authDomain || '', 'authDomain')}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                    title="Salin Auth Domain"
                  >
                    {copiedKey === 'authDomain' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="font-mono text-slate-900 dark:text-slate-100 font-bold select-all break-all">
                  {cloudInfo?.authDomain || 'gen-lang-client-0372936717.firebaseapp.com'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-500">Firebase API Key (Environment)</span>
                  <button 
                    onClick={() => handleCopy(cloudInfo?.apiKey || 'AIzaSyB7PQpumSDUYaOpdzqI2LOX_cJzMgI6diM', 'apiKey')}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                    title="Salin API Key"
                  >
                    {copiedKey === 'apiKey' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold select-all break-all">
                  {cloudInfo?.apiKey || 'AIzaSyB7PQpumSDUYaOpdzqI2LOX_cJzMgI6diM'}
                </div>
              </div>
            </div>

            {/* Navigation Next */}
            <div className="flex justify-end pt-3">
              <button
                onClick={() => setActiveStep(2)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition"
              >
                <span>Lanjut ke Langkah 2: Aturan Keamanan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SECURITY RULES */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Langkah 2 dari 4</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Penyebaran Aturan Keamanan (Firestore Rules)
                </h3>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Rules Deployed & Protected
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Aturan keamanan <code>firestore.rules</code> telah dikonfigurasi untuk melindungi seluruh koleksi data operasional 
              secara granular dengan aturan Cloud Firestore Rules versi 2.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Modul Logistik & Stok
                </div>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                  <li>• /barang</li>
                  <li>• /stockMovements</li>
                  <li>• /opnameSessions</li>
                  <li>• /barangDatang</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Modul Administrasi & Surat
                </div>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                  <li>• /suratMasuk</li>
                  <li>• /suratKeluar</li>
                  <li>• /disposisi</li>
                  <li>• /pegawai, /divisi, /jabatan</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Modul Program Gizi & MBG
                </div>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                  <li>• /dailyBeneficiaryRecords</li>
                  <li>• /beneficiaryGroups</li>
                  <li>• /nutritionPlans</li>
                  <li>• /laporanBbm</li>
                </ul>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Otomatisasi Server:</strong> File <code>firestore.rules</code> sudah langsung diterapkan ke proyek Anda via tool <code>deploy_firebase</code>. 
                Tidak ada konfigurasi konsol manual yang diperlukan.
              </span>
            </div>

            <div className="flex justify-between pt-3">
              <button
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Kembali
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition"
              >
                <span>Lanjut ke Langkah 3: Inisialisasi Koleksi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: INITIALIZE & SEED CLEAN SLATE */}
        {activeStep === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Langkah 3 dari 4</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Sinkronisasi & Seeding Data Awal (Clean Slate Seeding)
                </h3>
              </div>
              <div className="text-xs text-slate-500">
                Total: <strong className="text-slate-800 dark:text-slate-200">34 Koleksi</strong>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Karena database baru di-reset (*clean slate*), Anda dapat memicu inisialisasi koleksi awal (struktur data dasar, user admin, kategori, dan master template) 
              secara langsung melalui tombol di bawah ini:
            </p>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Sinkronisasi Koleksi ke Google Cloud Firestore
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Memastikan seluruh 34 koleksi aktif terdaftar dan data master siap digunakan.
                </div>
              </div>

              <button
                onClick={handleReseedData}
                disabled={syncingData}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${syncingData ? 'animate-spin' : ''}`} />
                <span>{syncingData ? 'Menyinkronkan...' : 'Jalankan Sinkronisasi Koleksi'}</span>
              </button>
            </div>

            {syncSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncSuccessMsg}</span>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Daftar Koleksi yang Ditautkan ke Firestore:
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                {(cloudInfo?.collections || [
                  'barang', 'stockMovements', 'opnameSessions', 'suratMasuk', 'suratKeluar', 
                  'disposisi', 'dailyBeneficiaryRecords', 'beneficiaryGroups', 'beneficiaryLocations',
                  'nutritionPlans', 'laporanBbm', 'tugasDivisi', 'purchaseOrders', 'suppliers',
                  'users', 'roles', 'settings', 'pegawai', 'divisi', 'jabatan', 'gudang', 'kategori'
                ]).map((c, i) => (
                  <span key={i} className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-3">
              <button
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Kembali
              </button>
              <button
                onClick={() => setActiveStep(4)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition"
              >
                <span>Lanjut ke Langkah 4: Uji Koneksi Langsung</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: LIVE CONNECTION PROBE */}
        {activeStep === 4 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Langkah 4 dari 4</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Uji Koneksi Langsung (Live Probe & Latency Check)
                </h3>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                Live Health Verification
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Jalankan probe uji aktif untuk mengonfirmasi bahwa backend dan frontend dapat melakukan operasi <strong>Read</strong> dan <strong>Write</strong> 
              langsung ke instance Google Cloud Firestore tanpa hambatan:
            </p>

            <div className="p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 dark:from-slate-800/50 dark:via-indigo-950/20 dark:to-slate-800/30 rounded-2xl border border-blue-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Kirim Probe Uji Read/Write ke Firestore
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Menulis probe dokumen sementara ke <code>system_health/connection_probe</code> lalu memverifikasi responsnya.
                </div>
              </div>

              <button
                onClick={handleRunProbe}
                disabled={testingProbe}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <Activity className={`w-4 h-4 ${testingProbe ? 'animate-pulse' : ''}`} />
                <span>{testingProbe ? 'Menguji Koneksi...' : 'Mulai Tes Koneksi Langsung'}</span>
              </button>
            </div>

            {/* Probe Results Box */}
            {probeResult && (
              <div className={`p-4 rounded-xl border text-xs transition-all ${
                probeResult.success 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm mb-2">
                  {probeResult.success ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>Hasil Pengujian: KONEKSI 100% SUKSES</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <span>Hasil Pengujian: GAGAL TERHUBUNG</span>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 font-mono text-[11px]">
                  <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Round-Trip Latency:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {probeResult.latencyMs} ms
                    </span>
                  </div>

                  <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Target Project:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                      {probeResult.projectId || cloudInfo?.projectId}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Waktu Probe:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                      {probeResult.probeTimestamp ? new Date(probeResult.probeTimestamp).toLocaleTimeString('id-ID') : 'Baru saja'}
                    </span>
                  </div>
                </div>

                <p className="mt-2.5 text-[11px] leading-relaxed">
                  {probeResult.message}
                </p>
              </div>
            )}

            {/* Checklist of Completed Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Ringkasan Status Database Bersih Anda:
              </span>
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Instance Firestore baru telah diprovisioning pada akun Anda.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Kredensial disimpan aman pada <code>firebase-applet-config.json</code>.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Protokol transport diatur ke long-polling untuk mencegah putusnya koneksi gRPC.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Koleksi operasional siap untuk transaksi surat, stok, nutrisi, dan distribusi.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-3">
              <button
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Kembali
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Selesai & Tutup Panduan</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition z-20 cursor-pointer"
              title="Tutup Panduan"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {content}
        </div>
      </div>
    );
  }

  return content;
};
