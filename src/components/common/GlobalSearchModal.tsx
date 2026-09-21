import React, { useState, useEffect } from 'react';
import { Search, X, Mail, Boxes, Database, FileText, ArrowRight } from 'lucide-react';
import { GlobalSearchResult } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setResults(data.data);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Cari nomor surat, barang, kode barang, pegawai, atau dokumen..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-base"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="px-2.5 py-1 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded">
            ESC
          </button>
        </div>

        {/* Search Results Container */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {isLoading && (
            <div className="py-8 text-center text-slate-500 text-sm">
              Mencari di seluruh modul enterprise...
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-sm">
              Tidak ada hasil yang cocok dengan kata kunci &quot;<span className="font-semibold">{query}</span>&quot;
            </div>
          )}

          {!isLoading && !query && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Ketik kata kunci untuk pencarian lintas modul (e-Surat, Stock Opname, Master Data).
            </div>
          )}

          {!isLoading && results.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onNavigate(item.targetView);
                onClose();
              }}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-700/60 rounded-lg cursor-pointer transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 shrink-0">
                  {item.modul === 'e-Surat' && <Mail className="w-5 h-5" />}
                  {item.modul === 'Stock Opname' && <Boxes className="w-5 h-5" />}
                  {item.modul === 'Master Data' && <Database className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                      {item.modul} • {item.type}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {item.subtitle}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
