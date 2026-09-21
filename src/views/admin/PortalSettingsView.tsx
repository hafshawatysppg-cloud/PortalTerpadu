import React, { useState, useEffect } from 'react';
import { Settings, Save, Download, Upload, ShieldAlert, Database, Server, GitBranch, ExternalLink, CheckCircle, HelpCircle } from 'lucide-react';
import { PortalSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const PortalSettingsView: React.FC = () => {
  const { refreshSettings } = useAuth();
  const [form, setForm] = useState<PortalSettings>({
    namaPortal: 'Portal Administrasi Terpadu',
    deskripsi: 'Single Entry Point Enterprise & Module Integration Gateway (e-Surat & Stock Opname)',
    logoUrl: '',
    theme: 'light',
    primaryColor: '#2563EB',
    smtpHost: 'smtp.instansi.go.id',
    smtpPort: 587,
    smtpUser: 'notifications@instansi.go.id',
    maintenanceMode: false,
    sessionTimeoutMinutes: 120,
    rateLimitPerMin: 100
  });

  const [message, setMessage] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/v1/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setForm(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Pengaturan Portal berhasil disimpan!');
        refreshSettings();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackupExport = async () => {
    try {
      const res = await fetch('/api/v1/settings/backup/export');
      const data = await res.json();
      if (data.success) {
        const jsonStr = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-portal-terpadu-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const res = await fetch('/api/v1/settings/backup/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: parsed })
        });
        const data = await res.json();
        if (data.success) {
          alert('System Restore Berhasil! Mengulas data terbaru...');
          window.location.reload();
        }
      } catch (err) {
        alert('File backup JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-red-600" /> Konfigurasi Utama Portal & Backup System
        </h2>
        <p className="text-xs text-slate-500">
          Pengaturan nama instansi, logo, SMTP server, maintenance mode, & backup / restore data JSON
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
            Informasi Branding & Sistem
          </h3>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nama Portal Terpadu</label>
            <input
              type="text"
              required
              value={form.namaPortal}
              onChange={(e) => setForm({ ...form, namaPortal: e.target.value })}
              className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Deskripsi Sub-sistem</label>
            <input
              type="text"
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">SMTP Host Server</label>
              <input
                type="text"
                value={form.smtpHost}
                onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">SMTP Port</label>
              <input
                type="number"
                value={form.smtpPort}
                onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) })}
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> Mode Perawatan (Maintenance Mode)
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Jika diaktifkan, hanya Super Admin yang dapat mengakses portal. Modul lain akan dikunci sementara.
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.maintenanceMode}
              onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
              className="w-5 h-5 text-amber-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Simpan Perubahan Pengaturan
            </button>
          </div>
        </form>

        {/* Backup & Restore Panel */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600" /> Backup & Restore System
          </h3>

          <p className="text-xs text-slate-500">
            Cadangkan atau pulihkan seluruh snapshot database (Users, Menus, Master Data, e-Surat, Stock) dalam bentuk file JSON.
          </p>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleBackupExport}
              className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Unduh Backup JSON Snapshot
            </button>

            <label className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700">
              <Upload className="w-4 h-4" /> Restore Data dari JSON
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* GitHub Integration Guidance Panel */}
        <div className="lg:col-span-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-slate-900 dark:text-white" /> Konfigurasi Integrasi & Otorisasi GitHub (github.com)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* OAuth Callback URL Configuration */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> GitHub OAuth Callback Redirect URIs
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Daftarkan callback URL berikut pada OAuth App di GitHub (<strong>https://github.com/settings/developers</strong>):
              </p>
              
              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="p-2 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <div className="text-[9px] font-sans text-slate-400 font-bold">Active Current Host Redirect URI:</div>
                  <div className="select-all break-all text-emerald-600 dark:text-emerald-400 font-bold">
                    {window.location.origin}/api/v1/auth/github/callback
                  </div>
                </div>

                <div className="p-2 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <div className="text-[9px] font-sans text-slate-400 font-bold">Shared / Publish App Redirect URI:</div>
                  <div className="select-all break-all text-indigo-600 dark:text-indigo-400 font-bold">
                    https://ais-pre-k4w35jyvnwrt25kbn6ydlk-9009902503.asia-southeast1.run.app/api/v1/auth/github/callback
                  </div>
                </div>

                <div className="p-2 bg-slate-100 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <div className="text-[9px] font-sans text-slate-400 font-bold">Development Redirect URI:</div>
                  <div className="select-all break-all text-blue-600 dark:text-blue-400 font-bold">
                    https://ais-dev-k4w35jyvnwrt25kbn6ydlk-9009902503.asia-southeast1.run.app/api/v1/auth/github/callback
                  </div>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-500">
                Variabel Lingkungan di <code>.env.example</code>:
                <div className="font-mono text-[10px] bg-slate-900 text-amber-300 p-2 rounded mt-1">
                  GITHUB_CLIENT_ID=your_github_client_id<br />
                  GITHUB_CLIENT_SECRET=your_github_client_secret
                </div>
              </div>
            </div>

            {/* AI Studio GitHub Export Guidance */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-500" /> Penautan Repositori Kode ke GitHub
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                Untuk menyimpan dan mengekspor source code proyek ini langsung ke akun GitHub Anda:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
                <li>Buka menu <strong>Settings &gt; Export to GitHub</strong> pada bilah kanan atas AI Studio UI.</li>
                <li>Pilih <strong>Connect GitHub Account</strong> dan selesaikan izin otorisasi.</li>
                <li>Pilih nama repositori target (misal: <code>portal-administrasi-terpadu</code>) dan klik <strong>Export</strong>.</li>
              </ol>

              <div className="pt-3">
                <a
                  href="https://github.com/apps/google-ai-studio"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-[11px] transition"
                >
                  <ExternalLink className="w-3 h-3 text-amber-400" /> Buka Otorisasi AI Studio App di GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
