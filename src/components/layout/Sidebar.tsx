import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MenuItem } from '../../types';
import logoImg from '../../assets/images/badan_gizi_logo_1785799692960.jpg';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

interface SubMenuItemDef {
  title: string;
  path: string;
  icon: any;
  isExternal?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, isOpen, onClose }) => {
  const { user, menus } = useAuth();

  // Track expanded state for each menu module by key
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    esurat: true,
    stock: true,
    barangDatang: true,
    penerima: true,
    perencanaanBahan: true,
    po: true,
    tugas: true,
    bbm: true,
    master: false,
    admin: true,
  });

  const toggleModuleExpand = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNav = (path: string, isExternal?: boolean) => {
    if (isExternal) {
      window.open(path, '_blank');
    } else {
      onNavigate(path);
    }
    if (onClose) onClose();
  };

  // Submenus definitions
  const submenusMap: Record<string, SubMenuItemDef[]> = {
    esurat: [
      { title: 'Surat Masuk Digital', path: '/esurat/masuk', icon: Icons.Inbox },
      { title: 'Surat Keluar Digital', path: '/esurat/keluar', icon: Icons.Send },
      { title: 'Disposisi Digital', path: '/esurat/disposisi', icon: Icons.FileCheck },
      { title: 'Arsip Surat Digital', path: '/esurat/arsip', icon: Icons.Archive },
      { title: 'Buka App e-Surat Cloud', path: 'https://e-surat-digital-1.ai.studio', icon: Icons.ExternalLink, isExternal: true },
    ],
    stock: [
      { title: 'Master Stok Barang', path: '/stock-opname/barang', icon: Icons.Boxes },
      { title: 'Barang Masuk', path: '/stock-opname/barang-masuk', icon: Icons.ArrowDownRight },
      { title: 'Barang Keluar', path: '/stock-opname/barang-keluar', icon: Icons.ArrowUpRight },
      { title: 'Session Stock Opname', path: '/stock-opname/stock-opname', icon: Icons.ClipboardCheck },
      { title: 'Riwayat Barang Masuk', path: '/stock-opname/history-masuk', icon: Icons.History },
      { title: 'Riwayat Barang Keluar', path: '/stock-opname/history-keluar', icon: Icons.History },
      { title: 'Laporan Stock & Opname', path: '/stock-opname/laporan', icon: Icons.FileSpreadsheet },
    ],
    barangDatang: [
      { title: 'Form Input Barang', path: '/barang-datang/form', icon: Icons.ClipboardEdit },
      { title: 'Data Barang Masuk', path: '/barang-datang/data', icon: Icons.TableProperties },
    ],
    penerima: [
      { title: 'Summary Hari Ini', path: '/penerima-manfaat/hari-ini', icon: Icons.BarChart3 },
      { title: 'Pengaturan Kelompok & Sasaran', path: '/penerima-manfaat/kelompok', icon: Icons.Settings },
      { title: 'Rekapitulasi Harian', path: '/penerima-manfaat/rekap-harian', icon: Icons.Calendar },
      { title: 'Rekapitulasi Bulanan', path: '/penerima-manfaat/rekap-bulanan', icon: Icons.FileText },
    ],
    perencanaanBahan: [
      { title: 'Kalkulator & Worksheet', path: '/perencanaan-bahan/kalkulator', icon: Icons.Calculator },
      { title: 'Rencana Anggaran Belanja (RAB)', path: '/perencanaan-bahan/rab', icon: Icons.WalletCards },
      { title: 'Rekap & Kebutuhan Pengadaan', path: '/perencanaan-bahan/rekap', icon: Icons.FileSpreadsheet },
      { title: 'Riwayat Perencanaan', path: '/perencanaan-bahan/riwayat', icon: Icons.History },
      { title: 'Master Data Bahan Pangan', path: '/perencanaan-bahan/master-bahan', icon: Icons.Apple },
    ],
    po: [
      { title: 'Konsolidasi PO 5-Hari', path: '/purchase-order', icon: Icons.FileCheck },
      { title: 'Riwayat & Daftar PO', path: '/purchase-order/riwayat', icon: Icons.History },
      { title: 'Master Supplier & Ship-To', path: '/purchase-order/pengaturan', icon: Icons.Building2 },
    ],
    supplier: [
      { title: 'Status Pemesanan PO', path: '/portal-supplier/pesanan', icon: Icons.PackageCheck },
      { title: 'Manifest Belanjaan', path: '/portal-supplier/manifest', icon: Icons.ShoppingCart },
      { title: 'SOP & Pengiriman', path: '/portal-supplier/sop', icon: Icons.Truck },
    ],
    tugas: [
      { title: 'Tugas Divisi Hari Ini', path: '/tugas-divisi/hari-ini', icon: Icons.CheckSquare },
      { title: 'Perencanaan Menu Harian', path: '/tugas-divisi/menu-harian', icon: Icons.Utensils },
      { title: 'Riwayat & Verifikasi', path: '/tugas-divisi/riwayat', icon: Icons.History },
      { title: 'Template Checklist Divisi', path: '/tugas-divisi/template', icon: Icons.FileSpreadsheet },
      { title: 'Laporan PDF & Cetak', path: '/tugas-divisi/laporan', icon: Icons.Printer },
      { title: 'Notifikasi WhatsApp Divisi', path: '/tugas-divisi/whatsapp', icon: Icons.MessageSquare },
    ],
    bbm: [
      { title: 'Laporan BBM & Armada', path: '/bbm/laporan', icon: Icons.Fuel },
    ],
    distribusi: [
      { title: 'Form Distribusi', path: '/laporan-distribusi/form', icon: Icons.ClipboardEdit },
      { title: 'Data Distribusi', path: '/laporan-distribusi/data', icon: Icons.TableProperties },
      { title: 'Driver', path: '/laporan-distribusi/driver', icon: Icons.UserCheck },
    ],
    admin: [
      { title: 'Manajemen Pengguna', path: '/admin/users', icon: Icons.Users },
      { title: 'Builder Menu Dynamic', path: '/admin/menus', icon: Icons.Menu },
      { title: 'Hak Akses & Role', path: '/admin/roles', icon: Icons.Shield },
      { title: 'Audit & Log Aktivitas', path: '/admin/logs', icon: Icons.FileText },
      { title: 'Master Template Dokumen', path: '/admin/document-template', icon: Icons.FileSignature },
      { title: 'Pengaturan Portal', path: '/admin/settings', icon: Icons.Settings },
    ]
  };

  // Helper function to render dynamic Lucide icon
  const renderIcon = (iconName: string, className = 'w-4 h-4') => {
    const IconComponent = (Icons as any)[iconName] || Icons.Circle;
    return <IconComponent className={className} />;
  };

  // Filter menus based on user role
  const allowedMenus = menus.filter(m => {
    if (!m.isActive) return false;
    if (!m.requiredRole || m.requiredRole.length === 0) return true;
    if (!user) return false;
    return m.requiredRole.includes(user.role);
  });

  // Identify module key from menu item
  const getModuleKey = (menu: MenuItem): string => {
    if (menu.targetModule === 'esurat' || menu.path.includes('esurat')) return 'esurat';
    if (menu.targetModule === 'barangDatang' || menu.path.includes('barang-datang')) return 'barangDatang';
    if (menu.targetModule === 'stock' || menu.path.includes('stock')) return 'stock';
    if (menu.path.includes('penerima-manfaat')) return 'penerima';
    if (menu.targetModule === 'po' || menu.path.includes('purchase-order') || menu.path === '/po') return 'po';
    if (menu.path.includes('portal-supplier')) return 'supplier';
    if (menu.path.includes('perencanaan-bahan')) return 'perencanaanBahan';
    if (menu.path.includes('tugas-divisi')) return 'tugas';
    if (menu.path.includes('bbm')) return 'bbm';
    if (menu.path.includes('laporan-distribusi') || menu.path.includes('distribusi')) return 'distribusi';
    if (menu.path.includes('admin') || menu.path.includes('users') || menu.path.includes('menu')) return 'admin';
    return '';
  };

  return (
    <>
      {/* Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      <aside className={`w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl text-slate-700 dark:text-slate-200 border-r border-slate-200/80 dark:border-slate-800/80 shadow-2xl flex flex-col transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 overflow-hidden`}>
        {/* Portal Brand Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Badan Gizi Nasional Logo"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Badan Gizi Nasional
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Enterprise Dashboard
              </div>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        {/* User Status Card */}
        {!user ? (
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 m-3 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 flex items-center justify-center font-bold shrink-0">
                <Icons.Eye className="w-4 h-4" />
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  Pengunjung Portal
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate">
                  Akses Publik
                </div>
              </div>
            </div>

            <button
              onClick={() => handleNav('/login')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-200 cursor-pointer"
            >
              <Icons.LogIn className="w-3.5 h-3.5" />
              <span>Login Pengguna</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 m-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-2">
            <div className="flex items-center gap-2.5">
              <img
                src={user.foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user.nama}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
              />
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user.nama}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-200/60 dark:border-slate-700/50">
              <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                {user.role}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SSO Active
              </span>
            </div>
          </div>
        )}

        {/* Navigation Menu Items with Expandable Submenus */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {!user ? (
            /* Visitor Mode Navigation */
            <button
              onClick={() => handleNav('/dashboard')}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium flex items-center justify-between transition-all duration-200 ${
                currentPath === '/dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icons.LayoutDashboard className={`w-4 h-4 ${currentPath === '/dashboard' ? 'text-white' : 'text-slate-500'}`} />
                <span>Dashboard Utama</span>
              </div>
            </button>
          ) : (
            /* Logged In Navigation */
            <>
              <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>Main Navigation Menu</span>
                <span className="text-[9px] font-normal text-slate-400">Klik Panah untuk Submenu</span>
              </div>

              {allowedMenus.map((menu: MenuItem) => {
                const moduleKey = getModuleKey(menu);
                const subitems = moduleKey ? submenusMap[moduleKey] : null;
                const hasSubmenus = Boolean(subitems && subitems.length > 0);
                const isExpanded = Boolean(expandedModules[moduleKey]);
                const isActive = currentPath === menu.path || currentPath.startsWith(`${menu.path}/`) || (moduleKey && currentPath.includes(moduleKey));

                return (
                  <div key={menu.id} className="space-y-1">
                    {/* Main Menu Button Row */}
                    <div className={`w-full rounded-2xl text-xs font-medium flex items-center justify-between transition-all duration-200 group ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}>
                      {/* Main Title Button */}
                      <button
                        onClick={() => {
                          if (hasSubmenus && !isExpanded) {
                            toggleModuleExpand(moduleKey);
                          }
                          if (moduleKey === 'esurat') {
                            handleNav('/esurat/masuk');
                          } else if (moduleKey === 'barangDatang') {
                            handleNav('/barang-datang/form');
                          } else if (moduleKey === 'tugas') {
                            handleNav('/tugas-divisi/hari-ini');
                          } else if (moduleKey === 'stock') {
                            handleNav('/stock-opname/barang');
                          } else if (moduleKey === 'po') {
                            handleNav('/purchase-order');
                          } else {
                            handleNav(menu.path);
                          }
                        }}
                        className="flex-1 px-3.5 py-2.5 flex items-center gap-3 cursor-pointer text-left overflow-hidden"
                      >
                        <span className={`${isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400 group-hover:scale-110'} transition-transform shrink-0`}>
                          {renderIcon(menu.icon, 'w-4 h-4')}
                        </span>
                        <span className="truncate">{menu.title}</span>
                      </button>

                      {/* Right Section: Badge & Dedicated Arrow Toggle Button */}
                      <div className="flex items-center gap-1 pr-2 shrink-0">
                        {hasSubmenus && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-100 dark:border-blue-900'
                          }`}>
                            {subitems.length} Sub
                          </span>
                        )}

                        {/* Arrow Icon Button (Panah Submenu) */}
                        {hasSubmenus && (
                          <button
                            type="button"
                            onClick={(e) => toggleModuleExpand(moduleKey, e)}
                            className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                              isActive
                                ? 'hover:bg-white/20 text-white'
                                : 'hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                            title={isExpanded ? 'Sembunyikan Submenu' : 'Tampilkan Submenu'}
                          >
                            {isExpanded ? (
                              <Icons.ChevronDown className="w-4 h-4 transition-transform text-current" />
                            ) : (
                              <Icons.ChevronRight className="w-4 h-4 transition-transform text-current" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Render Collapsible Submenus */}
                    {hasSubmenus && isExpanded && (
                      <div className="ml-4 pl-3 border-l-2 border-blue-200/80 dark:border-blue-900/60 space-y-1 py-1">
                        {subitems.map((sub) => {
                          const isSubActive = currentPath === sub.path || (sub.path === '/esurat/masuk' && currentPath === '/esurat');
                          const SubIcon = sub.icon;

                          return (
                            <button
                              key={sub.path}
                              onClick={() => handleNav(sub.path, sub.isExternal)}
                              className={`w-full px-3 py-1.5 rounded-xl text-[11px] font-medium flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                                isSubActive
                                  ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 font-bold shadow-2xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                                <span className="truncate">{sub.title}</span>
                              </div>

                              {sub.isExternal ? (
                                <Icons.ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                              ) : (
                                <Icons.ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer System Status */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500 text-center font-medium leading-relaxed">
          SSO Authentication Active
          <br />
          Integrated Enterprise SPPG
        </div>
      </aside>
    </>
  );
};
