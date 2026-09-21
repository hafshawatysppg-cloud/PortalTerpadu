import React from 'react';
import { 
  LayoutDashboard, 
  Mail, 
  Boxes, 
  Fuel, 
  CheckSquare, 
  Utensils, 
  Users, 
  FileText, 
  Settings, 
  ArrowRight, 
  ExternalLink, 
  Sparkles,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Layers
} from 'lucide-react';

interface RingkasanModulMenuWidgetProps {
  onNavigate?: (path: string) => void;
}

interface SystemMenuItem {
  id: string;
  title: string;
  category: string;
  badge: string;
  badgeColor: string;
  description: string;
  metrics: string;
  icon: React.ReactNode;
  path: string;
  isExternal?: boolean;
}

export const RingkasanModulMenuWidget: React.FC<RingkasanModulMenuWidgetProps> = ({ onNavigate }) => {
  const menuList: SystemMenuItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard Utama',
      category: 'Pusat Kontrol',
      badge: 'Aktif',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-900',
      description: 'Pusat pemantauan statistik operasional, ringkasan inventaris, penggunaan BBM, dan aktivitas harian.',
      metrics: 'Status Real-Time',
      icon: <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      path: '/dashboard'
    },
    {
      id: 'e-surat',
      title: 'e-Surat Digital',
      category: 'Persuratan & Disposisi',
      badge: 'Terintegrasi',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      description: 'Pengelolaan surat masuk & keluar, disposisi digital otomatis, serta pengarsipan dokumen resmi cloud.',
      metrics: 'Layanan Digital',
      icon: <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      path: 'https://e-surat-digital-1.ai.studio',
      isExternal: true
    },
    {
      id: 'stock',
      title: 'Stock Opname & Gudang',
      category: 'Logistik & Inventaris',
      badge: 'Modul Gudang',
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      description: 'Pencatatan stok bahan makanan, stok opname fisik, pelacakan barang minim, dan berita acara opname.',
      metrics: '4,280+ Unit Barang',
      icon: <Boxes className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      path: '/stock-opname'
    },
    {
      id: 'bbm',
      title: 'Laporan BBM Kendaraan',
      category: 'Transportasi & Armada',
      badge: 'Armada SPPG',
      badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      description: 'Pencatatan konsumsi bahan bakar kendaraan operasional, jarak tempuh kilometer, dan efisiensi armada.',
      metrics: '18 Armada Operasional',
      icon: <Fuel className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      path: '/bbm/laporan'
    },
    {
      id: 'tugas-divisi',
      title: 'Tugas Divisi Dapur',
      category: 'Operasional Dapur',
      badge: '5 Divisi Kerja',
      badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      description: 'Checklist tugas harian 5 divisi (Persiapan, Pengolahan, Pemorsian, Distribusi, dan Cuci Ompreng).',
      metrics: 'Checklist Dapur',
      icon: <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      path: '/tugas-divisi'
    },
    {
      id: 'menu-harian',
      title: 'Menu Harian SPPG',
      category: 'Perencanaan Gizi',
      badge: '5 Komponen',
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      description: 'Form pengisian dan jadwal perencanaan menu harian 5 item (Karbo, Hewani, Nabati, Sayur, & Buah/Susu).',
      metrics: 'Jadwal Konsumsi',
      icon: <Utensils className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      path: '/tugas-divisi/menu-harian'
    },
    {
      id: 'penerima-manfaat',
      title: 'Penerima Manfaat',
      category: 'Distribusi & Sasaran',
      badge: 'Gizi Nasional',
      badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      description: 'Pendataan sekolah sasaran, santri, ibu hamil, balita, serta rekapitulasi porsi gizi terdistribusi.',
      metrics: '1,500+ Penerima',
      icon: <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      path: '/penerima-manfaat'
    },
    {
      id: 'laporan-arsip',
      title: 'Laporan & Arsip Digital',
      category: 'Dokumentasi & PDF',
      badge: 'Rekapitulasi',
      badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      description: 'Laporan rekap harian & bulanan, galeri foto serah terima, serta ekspor dokumen PDF operasional.',
      metrics: 'Dokumen & PDF',
      icon: <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      path: '/laporan'
    },
    {
      id: 'admin-menu',
      title: 'Builder Menu Dynamic',
      category: 'Pengaturan Sistem',
      badge: 'Admin Only',
      badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-900',
      description: 'Pengaturan hirarki menu navigasi, konfigurasi ikon, dan manajemen hak akses SSO pengguna.',
      metrics: 'Konfigurasi SSO',
      icon: <Settings className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      path: '/admin/menu'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[24px] p-6 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shrink-0 shadow-md shadow-blue-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Informasi & Ringkasan Seluruh Modul Menu Sistem
              </h3>
              <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-extrabold rounded-full border border-blue-200 dark:border-blue-900">
                9 Modul Terintegrasi
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gambaran sederhana, akurat, dan akses cepat ke seluruh menu operasional SPPG
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>SSO Integrated</span>
          </span>
        </div>
      </div>

      {/* Grid of All System Menus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuList.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              if (item.isExternal) {
                window.open(item.path, '_blank');
              } else if (onNavigate) {
                onNavigate(item.path);
              }
            }}
            className="bg-slate-50/70 hover:bg-slate-100/90 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-sm"
          >
            <div className="space-y-2.5">
              {/* Item Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-2xs group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h4>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </div>

            {/* Bottom Footer Action */}
            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs font-semibold">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {item.metrics}
              </span>

              <div className="text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform text-xs font-bold">
                <span>Akses Menu</span>
                {item.isExternal ? (
                  <ExternalLink className="w-3.5 h-3.5" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
