import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Disposisi } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';

export const DisposisiView: React.FC = () => {
  const [items, setItems] = useState<Disposisi[]>([]);

  // Realtime Firestore synchronization
  const { data: realtimeDisposisi } = useFirestoreRealtime<Disposisi>('disposisi');

  useEffect(() => {
    if (realtimeDisposisi && realtimeDisposisi.length > 0) {
      setItems(realtimeDisposisi);
    }
  }, [realtimeDisposisi]);

  useEffect(() => {
    fetch('/api/v1/esurat/disposisi')
      .then(res => res.json())
      .then(data => {
        if (data.success) setItems(data.data);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-600" /> Disposisi Surat Terpadu & Tracking Workflow
        </h2>
        <p className="text-xs text-slate-500">
          Pemantauan tindak lanjut instruksi pimpinan dan batas waktu penyelesaian disposisi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((dsp) => (
          <div key={dsp.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {dsp.nomorSurat}
              </span>
              <Badge variant={dsp.sifat === 'Segera' ? 'danger' : 'warning'}>
                {dsp.sifat}
              </Badge>
            </div>

            <div className="text-xs space-y-1">
              <div className="text-slate-500">Dari: <span className="font-semibold text-slate-900 dark:text-slate-100">{dsp.pengirimDisposisi}</span></div>
              <div className="text-slate-500">Kepada: <span className="font-semibold text-slate-900 dark:text-slate-100">{dsp.penerimaDisposisi}</span></div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-700 dark:text-slate-300">Instruksi Pimpinan:</span>
              <p className="text-slate-900 dark:text-slate-100 mt-1">{dsp.instruksi}</p>
            </div>

            {dsp.catatanPenerima && (
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg text-xs border border-blue-200 dark:border-blue-800/60">
                <span className="font-bold text-blue-700 dark:text-blue-300">Catatan Tindak Lanjut:</span>
                <p className="text-slate-800 dark:text-slate-200 mt-1">{dsp.catatanPenerima}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Deadline: {dsp.batasWaktu}
              </span>
              <Badge variant={dsp.status === 'Selesai' ? 'success' : 'warning'}>
                {dsp.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
