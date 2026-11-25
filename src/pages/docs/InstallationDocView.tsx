import React from 'react';
import { BookOpen, Server, Code2, Terminal, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const InstallationDocView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase">
          <BookOpen className="w-4 h-4" /> Dokumentasi Arsitektur Portal
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Panduan Instalasi & Depolymen Portal Administrasi Terpadu
        </h2>
        <p className="text-xs text-slate-500">
          Pedoman langkah demi langkah untuk melakukan deploy aplikasi SSO & Module Gateway ke lingkungan Server/Cloud Container.
        </p>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4 text-xs text-slate-700 dark:text-slate-300">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <Terminal className="w-4 h-4 text-emerald-600" /> 1. Persyaratan Lingkungan (System Requirements)
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Node.js:</strong> v20.0.0 atau v22 LTS (Pure ESM)</li>
          <li><strong>NPM:</strong> npm v9+</li>
          <li><strong>Port Binding:</strong> Dinamis via <code>PORT</code> (default 3000 pada 0.0.0.0)</li>
          <li><strong>Entry Point Produksi:</strong> <code>server.js</code></li>
        </ul>

        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 pt-4">
          <Code2 className="w-4 h-4 text-blue-600" /> 2. Langkah Instalasi &amp; Build Production
        </h3>
        <div className="p-4 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] space-y-2">
          <div># 1. Clone repository &amp; install dependencies</div>
          <div className="text-emerald-400">npm install</div>
          <div className="pt-2"># 2. Jalankan Mode Pengembangan (Development)</div>
          <div className="text-emerald-400">npm run dev</div>
          <div className="pt-2"># 3. Build Production (Vite Client + esbuild ESM Bundle)</div>
          <div className="text-emerald-400">npm run build</div>
          <div className="pt-2"># 4. Jalankan Standalone Production Server</div>
          <div className="text-emerald-400">npm start</div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 pt-4">
          <ShieldCheck className="w-4 h-4 text-purple-600" /> 3. Variabel Lingkungan (.env)
        </h3>
        <div className="p-4 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px]">
          <div>PORT=3000</div>
          <div>NODE_ENV=production</div>
          <div>JWT_SECRET=YOUR_JWT_SECRET_HERE</div>
          <div>VITE_SUPABASE_URL=YOUR_SUPABASE_URL_HERE</div>
          <div>VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE</div>
        </div>
      </div>
    </div>
  );
};
