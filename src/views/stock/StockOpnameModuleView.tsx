import React from 'react';
import { 
  Boxes, ArrowDownRight, ArrowUpRight, 
  ClipboardCheck, History, FileSpreadsheet
} from 'lucide-react';

import { MasterBarangView } from './MasterBarangView';
import { BarangMasukView } from './BarangMasukView';
import { BarangKeluarView } from './BarangKeluarView';
import { StockOpnamePhysicalView } from './StockOpnamePhysicalView';
import { HistoryBarangMasukView } from './HistoryBarangMasukView';
import { HistoryBarangKeluarView } from './HistoryBarangKeluarView';
import { StockLaporanView } from './StockLaporanView';

interface StockOpnameModuleViewProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const StockOpnameModuleView: React.FC<StockOpnameModuleViewProps> = ({ currentPath, onNavigate }) => {
  const tabs = [
    { id: 'master-stok', label: '1. Master Stok', path: '/stock-opname/barang', icon: Boxes },
    { id: 'opname', label: '2. Stock Opname', path: '/stock-opname/stock-opname', icon: ClipboardCheck },
    { id: 'barang-masuk', label: '3. Barang Masuk', path: '/stock-opname/barang-masuk', icon: ArrowDownRight },
    { id: 'barang-keluar', label: '4. Barang Keluar', path: '/stock-opname/barang-keluar', icon: ArrowUpRight },
    { id: 'history-masuk', label: '5. History Barang Masuk', path: '/stock-opname/history-masuk', icon: History },
    { id: 'history-keluar', label: '6. History Barang Keluar', path: '/stock-opname/history-keluar', icon: History },
    { id: 'laporan', label: '7. Cetak Laporan Stock', path: '/stock-opname/laporan', icon: FileSpreadsheet },
  ];

  const getActiveTab = () => {
    if (currentPath === '/stock/barang' || currentPath === '/stock-opname/barang' || currentPath === '/stock-opname/master-stok') return 'master-stok';
    if (currentPath === '/stock/opname' || currentPath === '/stock-opname/stock-opname' || currentPath === '/stock-opname/opname') return 'opname';
    if (currentPath === '/stock-opname/barang-masuk') return 'barang-masuk';
    if (currentPath === '/stock-opname/barang-keluar') return 'barang-keluar';
    if (currentPath === '/stock-opname/history-masuk') return 'history-masuk';
    if (currentPath === '/stock-opname/history-keluar') return 'history-keluar';
    if (currentPath === '/stock-opname/laporan') return 'laporan';
    if (currentPath === '/stock-opname/riwayat') return 'history-masuk';
    return 'master-stok';
  };

  const activeTab = getActiveTab();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'master-stok':
        return <MasterBarangView />;
      case 'opname':
        return <StockOpnamePhysicalView />;
      case 'barang-masuk':
        return <BarangMasukView />;
      case 'barang-keluar':
        return <BarangKeluarView />;
      case 'history-masuk':
        return <HistoryBarangMasukView />;
      case 'history-keluar':
        return <HistoryBarangKeluarView />;
      case 'laporan':
        return <StockLaporanView />;
      default:
        return <MasterBarangView />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs Header */}
      <div className="p-1.5 bg-slate-200/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner flex flex-wrap items-center gap-1 overflow-x-auto print:hidden">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.path)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Subview Content */}
      <div className="transition-all duration-200">
        {renderActiveView()}
      </div>
    </div>
  );
};
