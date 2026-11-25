import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Layers,
  Activity,
  AlertCircle,
  CheckCircle,
  X,
  Server
} from 'lucide-react';

interface FirebaseSetupGuideProps {
  onClose?: () => void;
  isModal?: boolean;
}

interface CloudStatusInfo {
  provider?: string;
  isConnected: boolean;
  status: string;
  projectId: string;
  databaseId: string;
  authDomain: string;
  syncedCollectionsCount: number;
  supabaseConfigured?: boolean;
  supabaseUrlConfigured?: boolean;
  supabaseKeyConfigured?: boolean;
  serviceRoleConfigured?: boolean;
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

  const [testingProbe, setTestingProbe] = useState<boolean>(false);
  const [probeResult, setProbeResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    probeTimestamp?: string;
  } | null>(null);

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
        setSyncSuccessMsg(data.message || 'Koleksi berhasil disinkronisasi ke Supabase!');
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
      title: 'Koneksi Supabase',
      shortDesc: 'Status environment VITE_SUPABASE_URL & Anon/Service Key',
      icon: Database
    },
    {
      id: 2,
      title: 'Skema & Kebijakan RLS',
      shortDesc: 'Tabel utama PostgreSQL & Row Level Security (supabase_schema.sql)',
      icon: ShieldCheck
    },
    {
      id: 3,
      title: 'Sinkronisasi & Seeding',
      shortDesc: 'Sinkronisasi seluruh modul operasional ke Supabase',
      icon: Layers
    },
    {
      id: 4,
      title: 'Pengujian Koneksi Langsung',
      shortDesc: 'Live read probe & cek latensi database Supabase',
      icon: Activity
    }
  ];

  const content = (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl border border-emerald-900/50 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Database className="w-48 h-48 text-emerald-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/30 mb-2.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              Supabase PostgreSQL &amp; Realtime
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Konfigurasi &amp; Status Database Supabase
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Penyimpanan data portal terintegrasi penuh dengan Supabase PostgreSQL dan Supabase Realtime,
              didukung cadangan snapshot server lokal sehingga operasional tetap berjalan stabil setiap saat.
            </p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-700/80 text-right">
            <div className="text-[11px] text-slate-400 font-medium">Status Koneksi Saat Ini:</div>
            <div className="flex items-center justify-end gap-2 mt-0.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  cloudInfo?.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                {cloudInfo?.status === 'online'
                  ? 'Supabase Online'
                  : cloudInfo
                  ? 'Cache Lokal Aktif'
                  : 'Memeriksa...'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Project Ref:</span>
            <span className="font-mono text-white font-semibold truncate block mt-0.5">
              {cloudInfo?.projectId || 'Belum diatur'}
            </span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Schema Target:</span>
            <span className="font-mono text-emerald-300 font-semibold truncate block mt-0.5">
              {cloudInfo?.databaseId || 'supabase-postgres-public'}
            </span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Mode Transport:</span>
            <span className="text-blue-300 font-semibold truncate block mt-0.5">
              Supabase Realtime WebSocket
            </span>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Entitas Terdaftar:</span>
            <span className="text-emerald-300 font-bold text-sm block mt-0.5">
              {cloudInfo?.syncedCollectionsCount || 46} Entitas Real-time
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isActive = activeStep === step.id;
          const isCompleted = activeStep > step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(step.id)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>
                <StepIcon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">{step.title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{step.shortDesc}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {activeStep === 1 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Langkah 1 dari 4
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Konfigurasi Environment Supabase
                </h3>
              </div>
              <button
                type="button"
                onClick={fetchStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Segarkan Status
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Isi variabel environment pada file <code>.env</code> server dan Vite client (<code>VITE_SUPABASE_URL</code>,{' '}
              <code>VITE_SUPABASE_ANON_KEY</code>, dan opsional <code>SUPABASE_SERVICE_ROLE_KEY</code> di sisi server).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">VITE_SUPABASE_URL</div>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {cloudInfo?.supabaseUrlConfigured ? 'Terkonfigurasi' : 'Belum Diisi (.env)'}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">VITE_SUPABASE_ANON_KEY</div>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {cloudInfo?.supabaseKeyConfigured ? 'Terkonfigurasi' : 'Belum Diisi (.env)'}
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">SUPABASE_SERVICE_ROLE_KEY (Server)</div>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {cloudInfo?.serviceRoleConfigured ? 'Aktif di Server' : 'Opsional (Gunakan Anon / RLS)'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <span>Lanjut ke Langkah 2: Skema &amp; RLS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Langkah 2 dari 4
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Skema SQL &amp; Row Level Security (RLS)
                </h3>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                RLS Policies Ready
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Jalankan file <code>supabase_schema.sql</code> di Supabase SQL Editor untuk membuat seluruh tabel utama (
              <code>users</code>, <code>barang</code>, <code>stock_movements</code>, <code>opname_sessions</code>,{' '}
              <code>menu_harian</code>, <code>suhu_pengolahan_v2</code>, <code>suhu_masuk_ompreng_v2</code>,{' '}
              <code>organoleptik_v1</code>, <code>app_state_sync</code>, serta <code>portal_collections</code>)
              beserta kebijakan Row Level Security (RLS) dan publikasi Realtime.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Tabel Utama &amp; Stok
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  users, barang, stock_movements, opname_sessions dengan indeks unik dan pemicu updated_at otomatis.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Modul Gizi &amp; QC
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  menu_harian, suhu_pengolahan_v2, suhu_masuk_ompreng_v2, organoleptik_v1 dengan Realtime aktif.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Sinkronisasi &amp; Koleksi Dinamis
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  app_state_sync &amp; portal_collections dilindungi fungsi <code>is_portal_admin()</code> dan kebijakan RLS.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <span>Lanjut ke Langkah 3: Sinkronisasi Data</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Langkah 3 dari 4
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Sinkronisasi &amp; Seeding Data ke Supabase
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tekan tombol di bawah untuk mengunggah dan menyinkronkan data awal dari server lokal ke tabel Supabase.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleReseedData}
                disabled={syncingData}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${syncingData ? 'animate-spin' : ''}`} />
                <span>{syncingData ? 'Menyinkronkan...' : 'Sinkronkan Koleksi ke Supabase'}</span>
              </button>

              {syncSuccessMsg && (
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  {syncSuccessMsg}
                </span>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <span>Lanjut ke Langkah 4: Tes Koneksi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Langkah 4 dari 4
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Pengujian Koneksi Langsung Supabase
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Uji konektivitas server Express ke database Supabase PostgreSQL dan periksa latensi respons.
            </p>

            <button
              type="button"
              onClick={handleRunProbe}
              disabled={testingProbe}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Activity className={`w-4 h-4 ${testingProbe ? 'animate-spin' : ''}`} />
              <span>{testingProbe ? 'Menguji Koneksi...' : 'Jalankan Uji Koneksi Supabase'}</span>
            </button>

            {probeResult && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                  probeResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200'
                }`}
              >
                {probeResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div className="space-y-1">
                  <div className="font-bold">{probeResult.message}</div>
                  <div className="text-[11px] opacity-80">Latensi: {probeResult.latencyMs} ms</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl max-w-4xl w-full p-6 relative shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
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
