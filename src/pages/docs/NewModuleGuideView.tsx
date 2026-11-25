import React from 'react';
import { Code2, PlusCircle, Layers, CheckCircle, Database } from 'lucide-react';

export const NewModuleGuideView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase">
          <Code2 className="w-4 h-4" /> Developer Guide & Extension Pattern
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Panduan Penambahan Modul Baru Tanpa Mengubah Kode Inti Portal
        </h2>
        <p className="text-xs text-slate-500">
          Sistem Portal dirancang secara modular dengan arsitektur Plug-and-Play (API Gateway & Database Driven Menu).
        </p>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-5 text-xs text-slate-700 dark:text-slate-300">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <Layers className="w-4 h-4 text-blue-600" /> Langkah 1: Pendaftaran Menu Dinamis (Tanpa Touch Code)
        </h3>
        <p>
          Buka menu <strong>"Pengelola Menu Dinamis"</strong> di Admin Portal, lalu buat item menu baru:
        </p>
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-1">
          <div>• <strong>Judul:</strong> Nama Modul Baru (misal: "Keuangan & Payroll")</div>
          <div>• <strong>Path URL Target:</strong> <code>/payroll</code></div>
          <div>• <strong>Icon & Warna:</strong> Pilih Icon Lucide dan Warna Accent</div>
          <div>• <strong>Modul Target:</strong> <code>external</code> / <code>payroll</code></div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 pt-2">
          <Database className="w-4 h-4 text-emerald-600" /> Langkah 2: Tambah Router Express Backend
        </h3>
        <p>
          Buat file router baru di <code>server/routes/payroll.ts</code>:
        </p>
        <div className="p-4 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px]">
          <div>import &#123; Router &#125; from 'express';</div>
          <div>export const payrollRouter = Router();</div>
          <br />
          <div>payrollRouter.get('/summary', (req, res) =&gt; &#123;</div>
          <div>&nbsp;&nbsp;res.json(&#123; success: true, data: [] &#125;);</div>
          <div>&#125;);</div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 pt-2">
          <PlusCircle className="w-4 h-4 text-purple-600" /> Langkah 3: Daftarkan Router ke Express Entry Point (server.ts)
        </h3>
        <div className="p-4 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px]">
          <div>// Di server.ts</div>
          <div>import &#123; payrollRouter &#125; from './server/routes/payroll';</div>
          <div>app.use('/api/v1/payroll', payrollRouter);</div>
        </div>
      </div>
    </div>
  );
};
