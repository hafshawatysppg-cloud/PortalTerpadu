import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  ArrowUpRight, 
  Star, 
  Calendar, 
  Bell, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Search,
  Check,
  Plus,
  ShieldCheck,
  MessageSquare,
  Send,
  X,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { PenerimaManfaatDashboardWidget } from '../components/dashboard/PenerimaManfaatDashboardWidget';
import { KeteranganTugasDivisiWidget } from '../components/dashboard/KeteranganTugasDivisiWidget';
import logoImg from '../assets/images/badan_gizi_logo_1785799692960.jpg';

interface DashboardViewProps {
  onNavigate: (path: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Recharts Monthly Statistics Data
  const monthlyAnalyticsData = [
    { month: 'Jan', inventory: 3200, fuelExpense: 2.8, value: 1.1 },
    { month: 'Feb', inventory: 3500, fuelExpense: 2.9, value: 1.25 },
    { month: 'Mar', inventory: 3800, fuelExpense: 3.1, value: 1.32 },
    { month: 'Apr', inventory: 3600, fuelExpense: 3.0, value: 1.28 },
    { month: 'May', inventory: 4000, fuelExpense: 3.3, value: 1.40 },
    { month: 'Jun', inventory: 4150, fuelExpense: 3.4, value: 1.45 },
    { month: 'Jul', inventory: 4280, fuelExpense: 3.45, value: 1.485 },
  ];

  interface StockItemSummary {
    id: string;
    kode: string;
    nama: string;
    kategori: string;
    stok: number;
    satuan: string;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  }

  const [stockItems] = useState<StockItemSummary[]>([
    { id: '1', kode: 'BRG-001', nama: 'Beras Premium SPPG 25kg', kategori: 'Bahan Pokok', stok: 1450, satuan: 'Kg', status: 'In Stock' },
    { id: '2', kode: 'BRG-002', nama: 'Minyak Goreng Sawit 5L', kategori: 'Bahan Olahan', stok: 18, satuan: 'Pcs', status: 'Low Stock' },
    { id: '3', kode: 'BRG-003', nama: 'Daging Sapi Segar Impor', kategori: 'Bahan Protein', stok: 0, satuan: 'Kg', status: 'Out of Stock' },
    { id: '4', kode: 'BRG-004', nama: 'Telur Ayam Negeri Fresh', kategori: 'Bahan Protein', stok: 850, satuan: 'Butir', status: 'In Stock' },
  ]);

  interface FeedbackItem {
    id: number;
    nama: string;
    kategori: 'Saran' | 'Kritik' | 'Apresiasi';
    pesan: string;
    tanggal: string;
    status: 'Ditinjau' | 'Direspon' | 'Terakomodasi';
  }

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([
    {
      id: 1,
      nama: 'Ahmad Subagja (Staff Logistik)',
      kategori: 'Saran',
      pesan: 'Mohon tambahkan pemindaian kode QR otomatis untuk stok opname gudang.',
      tanggal: '2026-08-04 10:15',
      status: 'Terakomodasi'
    },
    {
      id: 2,
      nama: 'Siti Rahma (Distribusi BBM)',
      kategori: 'Kritik',
      pesan: 'Kecepatan pemrosesan disposisi surat digital pada jam sibuk perlu ditingkatkan.',
      tanggal: '2026-08-03 14:30',
      status: 'Direspon'
    },
    {
      id: 3,
      nama: 'Pengunjung Portal',
      kategori: 'Apresiasi',
      pesan: 'Tampilan antarmuka sangat bersih, modern, dan mempermudah pencarian arsip.',
      tanggal: '2026-08-02 09:00',
      status: 'Ditinjau'
    }
  ]);
  const [newPesan, setNewPesan] = useState('');
  const [newKategori, setNewKategori] = useState<'Saran' | 'Kritik' | 'Apresiasi'>('Saran');
  const [newNama, setNewNama] = useState('');

  // Form State for Quick Action Floating Modal
  const [modalType, setModalType] = useState<'surat' | 'stock' | 'bbm' | 'feedback'>('surat');
  const [modalTitle, setModalTitle] = useState('');
  const [modalNote, setModalNote] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resLogs = await fetch('/api/v1/activity-logs');
        const dataLogs = await resLogs.json();
        if (dataLogs.success && Array.isArray(dataLogs.data)) {
          setRecentLogs(dataLogs.data.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const addFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPesan.trim()) return;
    const author = newNama.trim() || (user ? `${user.nama} (${user.role})` : 'Pengunjung Portal');
    const newItem: FeedbackItem = {
      id: Date.now(),
      nama: author,
      kategori: newKategori,
      pesan: newPesan.trim(),
      tanggal: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'Ditinjau'
    };
    setFeedbacks([newItem, ...feedbacks]);
    setNewPesan('');
    setNewNama('');
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;
    alert(`Transaksi ${modalType.toUpperCase()} berhasil ditambahkan!`);
    setIsAddModalOpen(false);
    setModalTitle('');
    setModalNote('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Large Greeting Section */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Badan Gizi Nasional RI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome Back{user ? `, ${user.nama}` : ''}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Monitor inventory, fuel usage, and operational activities.
          </p>
        </div>
      </div>

      {/* 👥 Penerima Manfaat Hari Ini & Hari Selanjutnya */}
      <PenerimaManfaatDashboardWidget onNavigate={onNavigate} />

      {/* 📋 Keterangan Tugas Divisi Berdasarkan Tanggal */}
      <KeteranganTugasDivisiWidget onNavigate={onNavigate} />

      {/* Main Grid: Left Side Analytics & Stock Status, Right Side Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side (7 columns) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Large Analytics Chart Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[24px] p-6 sm:p-7 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Analytics & Monthly Statistics
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Monthly inventory movement & fuel expense trend
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-full">
                2026 YTD
              </span>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyAnalyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderRadius: '16px', 
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', 
                      border: '1px solid #E2E8F0',
                      fontSize: '12px' 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="inventory" 
                    name="Inventory Items"
                    stroke="#2563EB" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#blueGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock Status Table Overview with Modern Rounded Badges */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[24px] p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Stock Status Overview
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Current inventory status & low-stock alerts
                </p>
              </div>
              <button 
                onClick={() => onNavigate('/stock')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Lihat Semua Stock &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                    <th className="pb-3 font-semibold">Kode SKU</th>
                    <th className="pb-3 font-semibold">Nama Item</th>
                    <th className="pb-3 font-semibold">Kategori</th>
                    <th className="pb-3 font-semibold text-right">Stok Gudang</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {stockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 font-mono text-slate-500 dark:text-slate-400">{item.kode}</td>
                      <td className="py-3.5 font-semibold text-slate-900 dark:text-slate-100">{item.nama}</td>
                      <td className="py-3.5 text-slate-500">{item.kategori}</td>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-slate-100 text-right">
                        {item.stok.toLocaleString('id-ID')} <span className="font-normal text-slate-400 text-[11px]">{item.satuan}</span>
                      </td>
                      <td className="py-3.5 text-center">
                        {item.status === 'In Stock' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> In Stock
                          </span>
                        )}
                        {item.status === 'Low Stock' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Low Stock
                          </span>
                        )}
                        {item.status === 'Out of Stock' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Out of Stock
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

        {/* Right Side (5 columns) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Recent Activities Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[24px] p-6 sm:p-7 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Recent Activities
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Timeline update lintas modul
                </p>
              </div>
              <button 
                onClick={() => onNavigate('/admin/logs')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Log &rarr;
              </button>
            </div>

            {/* Timeline Items */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
              {recentLogs.length > 0 ? (
                recentLogs.map((log: any, idx: number) => (
                  <div key={log.id || idx} className="relative space-y-1">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {log.namaUser}
                      </span>
                      <span className="text-[11px] text-slate-400">{log.jam}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">[{log.modul}]</span> {log.aktivitas}
                    </p>
                    {log.detail && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {log.detail}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                /* Static High Quality Fallback Timeline */
                <>
                  <div className="relative space-y-1">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Ahmad Subagja</span>
                      <span className="text-[11px] text-slate-400">10:45 AM</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-emerald-600">[Stock]</span> Melakukan Opname Bahan Pokok Gudang
                    </p>
                  </div>

                  <div className="relative space-y-1">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Siti Rahma</span>
                      <span className="text-[11px] text-slate-400">09:30 AM</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-blue-600">[e-Surat]</span> Membuat Disposisi Surat Dinas No. 042/BGN
                    </p>
                  </div>

                  <div className="relative space-y-1">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-sky-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Budi Santoso</span>
                      <span className="text-[11px] text-slate-400">08:15 AM</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-sky-600">[BBM]</span> Input Laporan Pengisian BBM Toyota Avanza
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Feedback & Suggestions Widget */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[24px] p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Saran & Masukan User
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Umpan balik pengguna & staf operasional
                </p>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full">
                {feedbacks.length} Items
              </span>
            </div>

            {/* Form Input */}
            <form onSubmit={addFeedback} className="space-y-3">
              {!user && (
                <input
                  type="text"
                  placeholder="Nama Anda (Opsional)..."
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              )}
              <div className="flex gap-2">
                <select
                  value={newKategori}
                  onChange={(e) => setNewKategori(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300 font-medium shrink-0"
                >
                  <option value="Saran">Saran</option>
                  <option value="Kritik">Kritik</option>
                  <option value="Apresiasi">Apresiasi</option>
                </select>
                <input
                  type="text"
                  placeholder="Masukkan saran & kritik Anda..."
                  value={newPesan}
                  onChange={(e) => setNewPesan(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl shadow-sm hover:shadow transition-all duration-200 shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim</span>
                </button>
              </div>
            </form>

            {/* List */}
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {feedbacks.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.nama}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {item.kategori}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    "{item.pesan}"
                  </p>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/40 dark:border-slate-700/40 flex justify-between">
                    <span>{item.tanggal}</span>
                    <span className="text-blue-600 font-medium">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Circular Add Button (Bottom Right) */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all duration-300 z-40 cursor-pointer hover:rotate-90 group"
        title="Add New Record"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Sleek Apple Glass Modal Dialog for Quick Action */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[24px] shadow-2xl border border-slate-200/60 dark:border-slate-800 p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Quick Action: Create New Record
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Input data cepat lintas modul enterprise
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector */}
            <div className="grid grid-cols-4 gap-2 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setModalType('surat')}
                className={`py-2 rounded-xl transition-all ${modalType === 'surat' ? 'bg-white dark:bg-slate-900 text-blue-600 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                e-Surat
              </button>
              <button
                type="button"
                onClick={() => setModalType('stock')}
                className={`py-2 rounded-xl transition-all ${modalType === 'stock' ? 'bg-white dark:bg-slate-900 text-blue-600 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Stock
              </button>
              <button
                type="button"
                onClick={() => setModalType('bbm')}
                className={`py-2 rounded-xl transition-all ${modalType === 'bbm' ? 'bg-white dark:bg-slate-900 text-blue-600 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                BBM Log
              </button>
              <button
                type="button"
                onClick={() => setModalType('feedback')}
                className={`py-2 rounded-xl transition-all ${modalType === 'feedback' ? 'bg-white dark:bg-slate-900 text-blue-600 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Masukan
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  {modalType === 'surat' && 'Judul / Perihal Surat'}
                  {modalType === 'stock' && 'Nama Item / SKU Baru'}
                  {modalType === 'bbm' && 'Nomor Plat Kendaraan & Volume (Liter)'}
                  {modalType === 'feedback' && 'Judul Saran / Masukan'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ketik data di sini..."
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ketik rincian atau catatan..."
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium shadow-sm transition-all cursor-pointer"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
