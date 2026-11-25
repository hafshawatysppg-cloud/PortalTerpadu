import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { PurchaseOrderDocument, POItem } from '../../types';
import { useFirestoreRealtime } from '../../lib/useFirestoreRealtime';

interface PortalSupplierViewProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export interface SupplierUnifiedDayGroup {
  date: string;
  orderDate?: string;
  targetArrivalDate?: string;
  menuSummary: string;
  targetArrival: string;
  location: string;
  bahanBakuPO?: PurchaseOrderDocument;
  operasionalPO?: PurchaseOrderDocument;
  otherPOs: PurchaseOrderDocument[];
  allDocs: PurchaseOrderDocument[];
  totalBahanBaku: number;
  totalOperasional: number;
  totalGrand: number;
  totalItemsCount: number;
  overallStatus: 'Perlu Dibelanjakan' | 'Sedang Dibelanjakan' | 'Dalam Pengiriman' | 'Selesai';
  driverInfo?: {
    driverName?: string;
    driverPhone?: string;
    driverPlate?: string;
  };
  supplierName: string;
}

export const PortalSupplierView: React.FC<PortalSupplierViewProps> = ({ currentPath = '/portal-supplier', onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'pesanan' | 'manifest' | 'sop'>('pesanan');
  const [orders, setOrders] = useState<PurchaseOrderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Expanded table rows for showing detailed items of both POs
  const [expandedRowDates, setExpandedRowDates] = useState<Record<string, boolean>>({});

  // Single order view / print
  const [selectedOrderToView, setSelectedOrderToView] = useState<PurchaseOrderDocument | null>(null);
  
  // Group view / print for Combined Surat Jalan
  const [selectedGroupToPrint, setSelectedGroupToPrint] = useState<SupplierUnifiedDayGroup | null>(null);

  // Interactive Checklist State per order & item
  const [checkedItemsMap, setCheckedItemsMap] = useState<Record<string, boolean>>({});

  // Sync subroute with activeTab
  useEffect(() => {
    if (currentPath.includes('manifest')) {
      setActiveTab('manifest');
    } else if (currentPath.includes('sop')) {
      setActiveTab('sop');
    } else {
      setActiveTab('pesanan');
    }
  }, [currentPath]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch POs confirmed by admin
  const fetchSupplierOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/nutrition-plans/po/supplier-list');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setOrders(json.data);
      } else {
        // Fallback to general list
        const resAll = await fetch('/api/v1/nutrition-plans/po/list');
        const jsonAll = await resAll.json();
        if (jsonAll.success && Array.isArray(jsonAll.data)) {
          // Filter out drafts
          setOrders(jsonAll.data.filter((p: PurchaseOrderDocument) => p.status !== 'Draft'));
        }
      }
    } catch (err) {
      console.error('Error fetching supplier orders:', err);
      showToast('Gagal memuat daftar pesanan supplier', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Realtime Firestore synchronization for Purchase Orders
  const { data: realtimePOs } = useFirestoreRealtime<PurchaseOrderDocument>('purchaseOrders');

  useEffect(() => {
    if (realtimePOs && realtimePOs.length > 0) {
      setOrders(realtimePOs.filter((p: PurchaseOrderDocument) => p.status !== 'Draft'));
    }
  }, [realtimePOs]);

  useEffect(() => {
    fetchSupplierOrders();
  }, []);

  // Update PO progress by Supplier (Single PO)
  const handleUpdateStatusSingle = async (
    po: PurchaseOrderDocument, 
    newStatus: PurchaseOrderDocument['status'], 
    customDriverData?: any
  ) => {
    try {
      const res = await fetch('/api/v1/nutrition-plans/po/supplier-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poId: po.id,
          status: newStatus,
          supplierData: {
            acceptedBy: 'Koperasi Konsumen Zantara',
            ...(customDriverData || {})
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `Status pesanan ${po.poNumber} berhasil diperbarui menjadi ${newStatus}!`, 'success');
        fetchSupplierOrders();
      } else {
        showToast(json.message || 'Gagal memperbarui status pesanan', 'error');
      }
    } catch (err) {
      console.error('Error updating supplier status:', err);
      showToast('Gagal menghubungi server', 'error');
    }
  };

  // Update PO progress in Batch (Both Bahan Baku and Operasional for a Day Group)
  const handleUpdateStatusGroup = async (
    group: SupplierUnifiedDayGroup,
    newStatus: PurchaseOrderDocument['status'],
    customDriverData?: any
  ) => {
    try {
      const poIds = group.allDocs.map(d => d.id).filter(Boolean);
      if (poIds.length === 0) return;

      const res = await fetch('/api/v1/nutrition-plans/po/supplier-progress-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poIds,
          status: newStatus,
          supplierData: {
            acceptedBy: 'Koperasi Konsumen Zantara',
            ...(customDriverData || {})
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Status PO Bahan Baku & Operasional tanggal ${formatDateIndo(group.date)} berhasil diperbarui menjadi "${newStatus}"!`, 'success');
        fetchSupplierOrders();
      } else {
        // Fallback sequentially
        for (const doc of group.allDocs) {
          await handleUpdateStatusSingle(doc, newStatus, customDriverData);
        }
      }
    } catch (err) {
      console.error('Error updating group supplier status:', err);
      showToast('Gagal memproses pembaruan status gabungan', 'error');
    }
  };

  // Toggle row expansion
  const toggleRowExpand = (date: string) => {
    setExpandedRowDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // Toggle item checklist
  const toggleItemCheck = (key: string) => {
    setCheckedItemsMap(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Format date helper
  const formatDateIndo = (dStr: string) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  // Helper untuk menghitung tanggal target tiba (H-1 sebelum tanggal menu/pemesanan)
  const computeTargetArrivalDate = (menuDateStr: string): string => {
    if (!menuDateStr) return '';
    try {
      const parts = menuDateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        d.setDate(d.getDate() - 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      const d = new Date(menuDateStr);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    } catch {
      return menuDateStr;
    }
  };

  // Group raw orders by date to form Unified Day Groups (Combining Bahan Baku & Operasional)
  const unifiedGroups: SupplierUnifiedDayGroup[] = useMemo(() => {
    const map: Record<string, {
      date: string;
      orderDate: string;
      targetArrivalDate: string;
      menuSummary: string;
      targetArrival: string;
      location: string;
      bahanBakuPO?: PurchaseOrderDocument;
      operasionalPO?: PurchaseOrderDocument;
      otherPOs: PurchaseOrderDocument[];
      supplierName: string;
    }> = {};

    orders.forEach(po => {
      const d = po.date || 'Tanpa Tanggal';
      const orderDate = po.orderDate || d;
      const targetArrivalDate = po.targetArrivalDate || computeTargetArrivalDate(orderDate);

      if (!map[d]) {
        map[d] = {
          date: d,
          orderDate,
          targetArrivalDate,
          menuSummary: po.menuSummary || '-',
          targetArrival: po.estimatedArrival || `${formatDateIndo(targetArrivalDate)} Pkl 16:00 WIB (H-1)`,
          location: po.shipTo?.name || 'SPPG Krejengan Temenggungan',
          supplierName: po.supplier?.name || 'Koperasi Konsumen Zantara',
          otherPOs: []
        };
      } else {
        if ((!map[d].menuSummary || map[d].menuSummary === '-') && po.menuSummary) {
          map[d].menuSummary = po.menuSummary;
        }
        if (po.targetArrivalDate) {
          map[d].targetArrivalDate = po.targetArrivalDate;
        }
      }

      if (po.poType === 'Bahan Baku' && !map[d].bahanBakuPO) {
        map[d].bahanBakuPO = po;
      } else if (po.poType === 'Operasional' && !map[d].operasionalPO) {
        map[d].operasionalPO = po;
      } else {
        map[d].otherPOs.push(po);
      }
    });

    const list = Object.values(map).sort((a, b) => b.date.localeCompare(a.date));

    return list.map(g => {
      const allDocs = [g.bahanBakuPO, g.operasionalPO, ...g.otherPOs].filter(Boolean) as PurchaseOrderDocument[];
      const totalBahanBaku = g.bahanBakuPO?.totalAmount || 0;
      const totalOperasional = g.operasionalPO?.totalAmount || 0;
      const totalGrand = totalBahanBaku + totalOperasional + g.otherPOs.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
      
      const totalItemsCount = (g.bahanBakuPO?.items?.length || 0) + 
                              (g.operasionalPO?.items?.length || 0) + 
                              g.otherPOs.reduce((acc, p) => acc + (p.items?.length || 0), 0);

      // Determine overall status
      const isAllDone = allDocs.length > 0 && allDocs.every(d => d.status === 'Dikonfirmasi Supplier' || d.status === 'Selesai');
      const isAnyDispatched = allDocs.some(d => d.status === 'Dikirim Supplier');
      const isAnyShopping = allDocs.some(d => d.status === 'Diproses Belanja');

      let overallStatus: SupplierUnifiedDayGroup['overallStatus'] = 'Perlu Dibelanjakan';
      if (isAllDone) {
        overallStatus = 'Selesai';
      } else if (isAnyDispatched) {
        overallStatus = 'Dalam Pengiriman';
      } else if (isAnyShopping) {
        overallStatus = 'Sedang Dibelanjakan';
      } else {
        overallStatus = 'Perlu Dibelanjakan';
      }

      // Check for driver info
      const driverDoc = allDocs.find(d => d.supplierShoppingStatus?.driverName);
      const driverInfo = driverDoc?.supplierShoppingStatus ? {
        driverName: driverDoc.supplierShoppingStatus.driverName,
        driverPhone: driverDoc.supplierShoppingStatus.driverPhone,
        driverPlate: driverDoc.supplierShoppingStatus.driverPlate,
      } : undefined;

      return {
        ...g,
        allDocs,
        totalBahanBaku,
        totalOperasional,
        totalGrand,
        totalItemsCount,
        overallStatus,
        driverInfo
      };
    });
  }, [orders]);

  // Available unique dates from groups
  const availableDates = useMemo(() => {
    return Array.from(new Set(unifiedGroups.map(g => g.date))).sort();
  }, [unifiedGroups]);

  // Filtered Groups for Table Display
  const filteredGroups = useMemo(() => {
    return unifiedGroups.filter(g => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q ||
        g.date.includes(q) ||
        g.menuSummary.toLowerCase().includes(q) ||
        (g.bahanBakuPO?.poNumber && g.bahanBakuPO.poNumber.toLowerCase().includes(q)) ||
        (g.operasionalPO?.poNumber && g.operasionalPO.poNumber.toLowerCase().includes(q)) ||
        g.supplierName.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (selectedDate !== 'Semua' && g.date !== selectedDate) return false;

      if (statusFilter !== 'Semua') {
        if (g.overallStatus !== statusFilter) return false;
      }

      return true;
    });
  }, [unifiedGroups, searchTerm, selectedDate, statusFilter]);

  // KPI Metrics calculated from unified groups
  const metrics = useMemo(() => {
    const totalHariMenu = unifiedGroups.length;
    const perluDibelanjakan = unifiedGroups.filter(g => g.overallStatus === 'Perlu Dibelanjakan').length;
    const sedangBelanja = unifiedGroups.filter(g => g.overallStatus === 'Sedang Dibelanjakan').length;
    const dalamPengiriman = unifiedGroups.filter(g => g.overallStatus === 'Dalam Pengiriman').length;
    const selesai = unifiedGroups.filter(g => g.overallStatus === 'Selesai').length;
    const totalGrandNilai = unifiedGroups.reduce((acc, g) => acc + g.totalGrand, 0);

    return { totalHariMenu, perluDibelanjakan, sedangBelanja, dalamPengiriman, selesai, totalGrandNilai };
  }, [unifiedGroups]);

  // Commodity Manifest Aggregator across orders (For Tab 2)
  const commodityManifest = useMemo(() => {
    const categories: Record<string, { item: POItem; orderDate: string; poNumber: string; poType: string }[]> = {
      'Sayur Mayur & Dedauan': [],
      'Protein Hewani & Nabati': [],
      'Bumbu Dapur & Rempah': [],
      'Karbohidrat & Pokok': [],
      'Buah Segar': [],
      'Operasional & Kemasan': [],
      'Lainnya': []
    };

    orders.forEach(order => {
      (order.items || []).forEach(item => {
        const name = (item.details || '').toLowerCase();
        if (order.poType === 'Operasional' || item.category === 'Operasional') {
          categories['Operasional & Kemasan'].push({ item, orderDate: order.date, poNumber: order.poNumber, poType: order.poType });
        } else if (name.includes('bayam') || name.includes('wortel') || name.includes('kangkung') || name.includes('buncis') || name.includes('kol') || name.includes('labu') || name.includes('tomat') || name.includes('seledri') || name.includes('daun') || name.includes('jagung') || name.includes('tauge')) {
          categories['Sayur Mayur & Dedauan'].push({ item, orderDate: order.date, poNumber: order.poNumber, poType: order.poType });
        } else if (name.includes('ayam') || name.includes('daging') || name.includes('ikan') || name.includes('telur') || name.includes('tahu') || name.includes('tempe') || name.includes('udang') || name.includes('sapi')) {
          categories['Protein Hewani & Nabati'].push({ item, orderDate: order.date, poNumber: order.poNumber, poType: order.poType });
        } else if (name.includes('bawang') || name.includes('cabai') || name.includes('jahe') || name.includes('kunyit') || name.includes('lengkuas') || name.includes('garam') || name.includes('gula') || name.includes('merica') || name.includes('kecap') || name.includes('minyak')) {
          categories['Bumbu Dapur & Rempah'].push({ item, orderDate: order.date, poNumber: order.poNumber, poType: order.poType });
        } else if (name.includes('beras') || name.includes('kentang') || name.includes('mie') || name.includes('tepung') || name.includes('bihun')) {
          categories['Karbohidrat & Pokok'].push({ item, orderDate: order.date, poNumber: order.poNumber, poType: order.poType });
        } else if (name.includes('pisang') || name.includes('semangka') || name.includes('pepaya') || name.includes('jeruk') || name.includes('melon') || name.includes('apel')) {
          categories['Buah Segar'].push({ item, orderDate: order.date, poNumber: order.poNumber, poType: order.poType });
        } else {
          categories['Lainnya'].push({ item, orderDate: order.date, poNumber: order.poNumber, poType: order.poType });
        }
      });
    });

    return categories;
  }, [orders]);

  // Generate WA confirmation text for a unified group
  const handleSendWAConfirmationGroup = (group: SupplierUnifiedDayGroup) => {
    const text = `*KONFIRMASI STATUS PESANAN GABUNGAN SUPPLIER (SPPG)*%0A%0A` +
      `Kepada Yth. Tim Dapur & Admin SPPG,%0A` +
      `Kami dari *${group.supplierName}* mengonfirmasi jadwal kedatangan barang & pengerjaan Purchase Order Gabungan berikut:%0A%0A` +
      `📅 *Tanggal Pemesanan (Menu)*: ${formatDateIndo(group.orderDate || group.date)}%0A` +
      `🚚 *Tanggal Target Tiba (H-1)*: ${formatDateIndo(group.targetArrivalDate)} (1 Hari Sebelum Menu)%0A` +
      `🍲 *Menu SPPG*: ${group.menuSummary}%0A` +
      (group.bahanBakuPO ? `🥬 *PO Bahan Baku*: ${group.bahanBakuPO.poNumber} (Rp ${group.totalBahanBaku.toLocaleString('id-ID')}) - [${group.bahanBakuPO.status}]%0A` : '') +
      (group.operasionalPO ? `📦 *PO Operasional*: ${group.operasionalPO.poNumber} (Rp ${group.totalOperasional.toLocaleString('id-ID')}) - [${group.operasionalPO.status}]%0A` : '') +
      `💰 *Total Nilai Gabungan*: *Rp ${group.totalGrand.toLocaleString('id-ID')}*%0A` +
      `📊 *Status Progres*: *${group.overallStatus}*%0A` +
      `⏰ *Target Kedatangan di Dapur*: ${group.targetArrival}%0A%0A` +
      `_Barang dan komoditas bahan segar akan ditargetkan tiba di dapur H-1 sebelum jadwal saji menu._%0A%0A` +
      `Terima kasih,%0A*Koperasi Konsumen Zantara*`;

    const cleanPhone = '082319871985';
    const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    window.open(`https://wa.me/${finalPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold transition-all ${
          toastMessage.type === 'success' ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700' :
          toastMessage.type === 'error' ? 'bg-rose-900/95 text-rose-100 border-rose-700' :
          'bg-blue-900/95 text-blue-100 border-blue-700'
        }`}>
          <Icons.CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Supplier Portal Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-emerald-800/40">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <Icons.Truck className="w-80 h-80 text-emerald-300" />
        </div>

        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 shadow-xs">
              <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Portal Resmi Rekanan Supplier & Koperasi
            </span>
            <span className="px-3 py-1 bg-teal-500/20 text-teal-200 border border-teal-400/30 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Icons.Store className="w-3.5 h-3.5 text-amber-300" />
              Koperasi Konsumen Zantara
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Icons.Clock className="w-3.5 h-3.5 text-cyan-300" />
              Target Drop Dapur: Maksimal Pkl 05:00 WIB
            </span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Portal Pengadaan & Belanja Supplier</span>
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/80 leading-relaxed max-w-3xl">
              Portal terintegrasi bagi rekanan supplier untuk melihat dan mengelola pesanan <strong className="text-white">PO Bahan Baku dan PO Operasional dalam 1 tabel terpadu</strong>, memeriksa rincian item, mencetak Surat Jalan, dan mengirimkan konfirmasi via WhatsApp.
            </p>
          </div>

          <div className="p-3.5 bg-emerald-900/40 border border-emerald-700/50 rounded-2xl flex items-start gap-3 text-xs text-emerald-100">
            <Icons.Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-white">Panduan Tabel Gabungan PO:</p>
              <p className="text-emerald-200/90 text-[11px] leading-normal">
                Setiap baris tabel menggabungkan pesanan <strong>Bahan Baku Segar</strong> dan <strong>Operasional/Kemasan</strong> untuk tanggal menu yang sama. Anda dapat melihat rincian item lewat tombol <strong>Item</strong>, mencetak Surat Jalan resmi lewat tombol <strong>Print</strong>, serta mengirimkan rekapitulasi via tombol <strong>WA</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pesanan');
              if (onNavigate) onNavigate('/portal-supplier/pesanan');
            }}
            className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pesanan'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Icons.Table2 className="w-4 h-4" />
            <span>Tabel Gabungan PO Bahan Baku & Operasional</span>
            {filteredGroups.length > 0 && (
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'pesanan' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {filteredGroups.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('manifest');
              if (onNavigate) onNavigate('/portal-supplier/manifest');
            }}
            className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'manifest'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Icons.ShoppingCart className="w-4 h-4" />
            <span>Manifest Komoditas Pasar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sop');
              if (onNavigate) onNavigate('/portal-supplier/sop');
            }}
            className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sop'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Icons.Truck className="w-4 h-4" />
            <span>SOP & Standar Penerimaan Dapur</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSupplierOrders}
            disabled={loading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Segarkan Data Pesanan"
          >
            <Icons.RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TABEL LIST GABUNGAN PO BAHAN BAKU & PO OPERASIONAL */}
      {/* ========================================================================= */}
      {activeTab === 'pesanan' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Nomor PO, Menu Masakan, Tanggal, atau Supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="Semua">Semua Tanggal Belanja</option>
                {availableDates.map(d => (
                  <option key={d} value={d}>{formatDateIndo(d)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Unified Table */}
          {loading ? (
            <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">Memuat Tabel Gabungan PO dari Admin SPPG...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-6">
              <Icons.Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                Tidak ada pesanan yang memenuhi kriteria
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Pesanan Purchase Order akan otomatis muncul di tabel ini setelah diverifikasi dan <strong>dikonfirmasi oleh Admin SPPG</strong> pada menu Purchase Order.
              </p>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('/purchase-order')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm transition-all mt-2"
                >
                  <Icons.FileCheck className="w-4 h-4" />
                  <span>Buka Menu Purchase Order Admin untuk Konfirmasi</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3.5 px-3 text-center w-12">No</th>
                      <th className="py-3.5 px-4 min-w-[210px]">Tgl Pemesanan & Target Tiba</th>
                      <th className="py-3.5 px-4 min-w-[200px]">Menu Masakan SPPG</th>
                      <th className="py-3.5 px-4 min-w-[190px]">PO Bahan Baku</th>
                      <th className="py-3.5 px-4 min-w-[190px]">PO Operasional</th>
                      <th className="py-3.5 px-4 min-w-[160px] text-right">Total Gabungan (Rp)</th>
                      <th className="py-3.5 px-4 min-w-[220px] text-center">Aksi Tim Supplier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredGroups.map((group, idx) => {
                      const isExpanded = !!expandedRowDates[group.date];
                      const isNeedShopping = group.overallStatus === 'Perlu Dibelanjakan';
                      const isShopping = group.overallStatus === 'Sedang Dibelanjakan';
                      const isDispatched = group.overallStatus === 'Dalam Pengiriman';
                      const isDone = group.overallStatus === 'Selesai';

                      return (
                        <React.Fragment key={group.date}>
                          <tr className={`transition-colors ${
                            isExpanded ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                          }`}>
                            {/* No & Expand Trigger */}
                            <td className="py-3.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => toggleRowExpand(group.date)}
                                className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                                title="Buka / Tutup Rincian Item Gabungan"
                              >
                                {isExpanded ? <Icons.ChevronDown className="w-4 h-4 text-emerald-600" /> : <Icons.ChevronRight className="w-4 h-4" />}
                              </button>
                            </td>

                            {/* Tanggal Pemesanan & Target Tiba */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1.5">
                                <div className="bg-blue-50/80 dark:bg-blue-950/40 p-1.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                                  <div className="flex items-center gap-1 text-[9.5px] font-black text-blue-700 dark:text-blue-300 uppercase">
                                    <Icons.Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                                    <span>Tgl Pemesanan (Menu)</span>
                                  </div>
                                  <span className="font-black text-slate-900 dark:text-slate-100 text-xs block mt-0.5">
                                    {formatDateIndo(group.orderDate || group.date)}
                                  </span>
                                </div>
                                <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                                  <div className="flex items-center gap-1 text-[9.5px] font-black text-emerald-700 dark:text-emerald-300 uppercase">
                                    <Icons.Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>Target Tiba (H-1)</span>
                                  </div>
                                  <span className="font-black text-emerald-800 dark:text-emerald-300 text-xs block mt-0.5">
                                    {formatDateIndo(group.targetArrivalDate)}
                                  </span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-[180px]" title={group.location}>
                                    {group.targetArrival} &bull; {group.location}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Menu Masakan */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <p className="font-black text-slate-900 dark:text-slate-100 text-xs leading-snug">
                                  {group.menuSummary}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                    {group.totalItemsCount} Total Komoditas
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* PO Bahan Baku Box */}
                            <td className="py-3.5 px-4">
                              {group.bahanBakuPO ? (
                                <div className="space-y-1 p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono text-[11px] font-black text-emerald-800 dark:text-emerald-300 truncate" title={group.bahanBakuPO.poNumber}>
                                      {group.bahanBakuPO.poNumber}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrderToView(group.bahanBakuPO!)}
                                      className="p-0.5 text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 cursor-pointer"
                                      title="Lihat Detail Item Bahan Baku"
                                    >
                                      <Icons.ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-slate-500">{group.bahanBakuPO.items?.length || 0} Bahan</span>
                                    <span className="font-black text-emerald-700 dark:text-emerald-300">
                                      Rp {group.totalBahanBaku.toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                  <div className="pt-0.5">
                                    <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase ${
                                      group.bahanBakuPO.status === 'Dikonfirmasi Supplier' || group.bahanBakuPO.status === 'Selesai'
                                        ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                                        : group.bahanBakuPO.status === 'Dikirim Supplier'
                                        ? 'bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200'
                                        : group.bahanBakuPO.status === 'Diproses Belanja'
                                        ? 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
                                        : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                                    }`}>
                                      {group.bahanBakuPO.status}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">- Tidak Ada PO -</span>
                              )}
                            </td>

                            {/* PO Operasional Box */}
                            <td className="py-3.5 px-4">
                              {group.operasionalPO ? (
                                <div className="space-y-1 p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono text-[11px] font-black text-amber-800 dark:text-amber-300 truncate" title={group.operasionalPO.poNumber}>
                                      {group.operasionalPO.poNumber}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrderToView(group.operasionalPO!)}
                                      className="p-0.5 text-amber-700 hover:text-amber-900 dark:text-amber-400 cursor-pointer"
                                      title="Lihat Detail Item Operasional"
                                    >
                                      <Icons.ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-slate-500">{group.operasionalPO.items?.length || 0} Item</span>
                                    <span className="font-black text-amber-700 dark:text-amber-300">
                                      Rp {group.totalOperasional.toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                  <div className="pt-0.5">
                                    <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase ${
                                      group.operasionalPO.status === 'Dikonfirmasi Supplier' || group.operasionalPO.status === 'Selesai'
                                        ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                                        : group.operasionalPO.status === 'Dikirim Supplier'
                                        ? 'bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200'
                                        : group.operasionalPO.status === 'Diproses Belanja'
                                        ? 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
                                        : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                                    }`}>
                                      {group.operasionalPO.status}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">- Tidak Ada PO -</span>
                              )}
                            </td>

                            {/* Total Gabungan (Rp) */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="space-y-0.5">
                                <span className="text-sm font-black text-slate-900 dark:text-slate-100 block">
                                  Rp {group.totalGrand.toLocaleString('id-ID')}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 block">
                                  Bahan + Ops
                                </span>
                              </div>
                            </td>

                            {/* Aksi Tim Supplier */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex flex-wrap items-center justify-center gap-1.5">
                                {/* Tombol Print */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedGroupToPrint(group)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border border-slate-200 dark:border-slate-700"
                                  title="Cetak Surat Jalan & Manifest Gabungan (PDF)"
                                >
                                  <Icons.Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  <span>Print</span>
                                </button>

                                {/* Tombol WA */}
                                <button
                                  type="button"
                                  onClick={() => handleSendWAConfirmationGroup(group)}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                                  title="Kirim Konfirmasi WA ke Dapur SPPG"
                                >
                                  <Icons.Send className="w-3.5 h-3.5" />
                                  <span>WA</span>
                                </button>

                                {/* Tombol Item */}
                                <button
                                  type="button"
                                  onClick={() => toggleRowExpand(group.date)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                                    isExpanded
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900'
                                  }`}
                                  title="Buka / Tutup Rincian Item PO Bahan Baku & Operasional"
                                >
                                  <Icons.Layers className="w-3.5 h-3.5" />
                                  <span>{isExpanded ? 'Tutup Item' : 'Item'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDABLE SUB-ROW: DUAL-TABLE DETAILED ITEMS VIEW */}
                          {isExpanded && (
                            <tr className="bg-slate-50/70 dark:bg-slate-900/70 border-b-2 border-slate-300 dark:border-slate-700">
                              <td colSpan={7} className="p-4 md:p-6">
                                <div className="space-y-4">
                                  {/* Sub-row Header Banner */}
                                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                      <Icons.PackageCheck className="w-5 h-5 text-emerald-600" />
                                      <div>
                                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm flex flex-wrap items-center gap-2">
                                          <span>Rincian Belanja Gabungan</span>
                                          <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-lg">
                                            Menu: {formatDateIndo(group.orderDate || group.date)}
                                          </span>
                                          <span className="text-[11px] font-extrabold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg">
                                            Target Tiba: {formatDateIndo(group.targetArrivalDate)} (H-1)
                                          </span>
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                          Menu: {group.menuSummary} &bull; Vendor: {group.supplierName} &bull; Kedatangan barang satu hari sebelum tanggal menu dimasak.
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedGroupToPrint(group)}
                                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                                      >
                                        <Icons.Printer className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Cetak Surat Jalan Gabungan (PDF)</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSendWAConfirmationGroup(group)}
                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                                      >
                                        <Icons.Send className="w-3.5 h-3.5" />
                                        <span>Kirim WA Gabungan</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Two Column Grid for Bahan Baku vs Operasional */}
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* PANEL A: PO BAHAN BAKU */}
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800/70 p-4 space-y-3 shadow-2xs">
                                      <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/50 pb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                            <Icons.Apple className="w-4 h-4" />
                                          </span>
                                          <div>
                                            <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs">
                                              PO Bahan Baku Pangan
                                            </h5>
                                            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                              {group.bahanBakuPO?.poNumber || 'Belum Terbit'}
                                            </span>
                                          </div>
                                        </div>

                                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                                          Subtotal: Rp {group.totalBahanBaku.toLocaleString('id-ID')}
                                        </span>
                                      </div>

                                      {group.bahanBakuPO?.items && group.bahanBakuPO.items.length > 0 ? (
                                        <div className="max-h-[300px] overflow-y-auto pr-1">
                                          <table className="w-full text-[11px] text-left border-collapse">
                                            <thead>
                                              <tr className="bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-extrabold text-[9px] uppercase border-b border-emerald-200 dark:border-emerald-800">
                                                <th className="py-2 px-2 text-center w-8">Cek</th>
                                                <th className="py-2 px-2">Komoditas Bahan</th>
                                                <th className="py-2 px-2 text-center w-20">Volume</th>
                                                <th className="py-2 px-2 text-right w-24">Harga (Rp)</th>
                                                <th className="py-2 px-2 text-right w-24">Total (Rp)</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                              {group.bahanBakuPO.items.map((it, iIdx) => {
                                                const checkKey = `${group.bahanBakuPO!.id}_${iIdx}`;
                                                const isChecked = !!checkedItemsMap[checkKey];

                                                return (
                                                  <tr key={iIdx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isChecked ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}>
                                                    <td className="py-1.5 px-2 text-center">
                                                      <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleItemCheck(checkKey)}
                                                        className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                        title="Ceklis belanja di pasar"
                                                      />
                                                    </td>
                                                    <td className={`py-1.5 px-2 font-medium ${isChecked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                      {it.details}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                                                      {it.qty} {it.unit}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-right text-slate-500">
                                                      {it.unitPrice ? it.unitPrice.toLocaleString('id-ID') : '-'}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-right font-black text-slate-900 dark:text-slate-100">
                                                      {it.totalPrice ? it.totalPrice.toLocaleString('id-ID') : '-'}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <p className="text-center py-6 text-xs text-slate-400 italic">Tidak ada item komoditas bahan baku</p>
                                      )}
                                    </div>

                                    {/* PANEL B: PO OPERASIONAL */}
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/70 p-4 space-y-3 shadow-2xs">
                                      <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-900/50 pb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="p-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                            <Icons.Boxes className="w-4 h-4" />
                                          </span>
                                          <div>
                                            <h5 className="font-black text-slate-900 dark:text-slate-100 text-xs">
                                              PO Operasional & Kemasan
                                            </h5>
                                            <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                                              {group.operasionalPO?.poNumber || 'Belum Terbit'}
                                            </span>
                                          </div>
                                        </div>

                                        <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                                          Subtotal: Rp {group.totalOperasional.toLocaleString('id-ID')}
                                        </span>
                                      </div>

                                      {group.operasionalPO?.items && group.operasionalPO.items.length > 0 ? (
                                        <div className="max-h-[300px] overflow-y-auto pr-1">
                                          <table className="w-full text-[11px] text-left border-collapse">
                                            <thead>
                                              <tr className="bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-extrabold text-[9px] uppercase border-b border-amber-200 dark:border-amber-800">
                                                <th className="py-2 px-2 text-center w-8">Cek</th>
                                                <th className="py-2 px-2">Kebutuhan Operasional</th>
                                                <th className="py-2 px-2 text-center w-20">Volume</th>
                                                <th className="py-2 px-2 text-right w-24">Harga (Rp)</th>
                                                <th className="py-2 px-2 text-right w-24">Total (Rp)</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                              {group.operasionalPO.items.map((it, iIdx) => {
                                                const checkKey = `${group.operasionalPO!.id}_${iIdx}`;
                                                const isChecked = !!checkedItemsMap[checkKey];

                                                return (
                                                  <tr key={iIdx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isChecked ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                                                    <td className="py-1.5 px-2 text-center">
                                                      <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleItemCheck(checkKey)}
                                                        className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                                        title="Ceklis barang operasional"
                                                      />
                                                    </td>
                                                    <td className={`py-1.5 px-2 font-medium ${isChecked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                      {it.details}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                                                      {it.qty} {it.unit}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-right text-slate-500">
                                                      {it.unitPrice ? it.unitPrice.toLocaleString('id-ID') : '-'}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-right font-black text-slate-900 dark:text-slate-100">
                                                      {it.totalPrice ? it.totalPrice.toLocaleString('id-ID') : '-'}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <p className="text-center py-6 text-xs text-slate-400 italic">Tidak ada item kebutuhan operasional</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Bottom Subtotal Bar */}
                                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                                      <span>Bahan Baku: <strong>Rp {group.totalBahanBaku.toLocaleString('id-ID')}</strong></span>
                                      <span>&bull;</span>
                                      <span>Operasional: <strong>Rp {group.totalOperasional.toLocaleString('id-ID')}</strong></span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-extrabold text-slate-500 mr-2">TOTAL PEMBELANJAAN GABUNGAN:</span>
                                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                                        Rp {group.totalGrand.toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/90 dark:bg-slate-800/90 font-black text-xs border-t-2 border-slate-300 dark:border-slate-700">
                      <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        TOTAL KESELURUHAN SELURUH PESANAN GABUNGAN:
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                        Rp {filteredGroups.reduce((acc, g) => acc + g.totalGrand, 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-bold">
                        {filteredGroups.length} Tanggal Jadwal Menu
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MANIFEST DAFTAR BELANJAAN KOMODITAS (SHOPPING CHECKLIST) */}
      {/* ========================================================================= */}
      {activeTab === 'manifest' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Icons.ShoppingCart className="w-5 h-5 text-emerald-600" />
                <span>Manifest Terpadu Belanjaan Pasar / Distributor</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Daftar gabungan seluruh komoditas yang harus dibelanjakan hari ini, dikelompokkan menurut kategori pasar untuk memudahkan tim lapangan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="Semua">Semua Tanggal</option>
                {availableDates.map(d => (
                  <option key={d} value={d}>{formatDateIndo(d)}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Icons.Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Belanja</span>
              </button>
            </div>
          </div>

          {/* Grouped Category Cards */}
          <div className="space-y-6">
            {Object.entries(commodityManifest).map(([categoryName, untypedItems]) => {
              const items = untypedItems as Array<{ item: POItem; orderDate: string; poNumber: string; poType: string }>;
              if (items.length === 0) return null;

              return (
                <div key={categoryName} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{categoryName}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                        {items.length} Komoditas
                      </span>
                    </div>

                    <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                      Total: Rp {items.reduce((sum, it) => sum + (it.item.totalPrice || 0), 0).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="p-4 overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                          <th className="py-2 px-3 text-center w-10">Cek</th>
                          <th className="py-2 px-3">Nama Komoditas</th>
                          <th className="py-2 px-3 text-center w-24">Jumlah</th>
                          <th className="py-2 px-3 text-center w-20">Satuan</th>
                          <th className="py-2 px-3 text-right w-28">Harga (Rp)</th>
                          <th className="py-2 px-3 text-right w-32">Subtotal (Rp)</th>
                          <th className="py-2 px-3 text-center w-36">Nomor PO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {items.map((row, idx) => {
                          const checkKey = `${row.poNumber}_${idx}_${row.item.details}`;
                          const isChecked = !!checkedItemsMap[checkKey];

                          return (
                            <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isChecked ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleItemCheck(checkKey)}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </td>
                              <td className={`py-2 px-3 font-bold ${isChecked ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                {row.item.details}
                              </td>
                              <td className="py-2 px-3 text-center font-black">{row.item.qty}</td>
                              <td className="py-2 px-3 text-center text-slate-500">{row.item.unit}</td>
                              <td className="py-2 px-3 text-right font-semibold">Rp {row.item.unitPrice?.toLocaleString('id-ID')}</td>
                              <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                                Rp {row.item.totalPrice?.toLocaleString('id-ID')}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className="font-mono text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold">
                                  {row.poNumber}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SOP & PANDUAN PENERIMAAN DAPUR */}
      {/* ========================================================================= */}
      {activeTab === 'sop' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Icons.Truck className="w-5 h-5 text-emerald-600" />
              <span>Standar Operasional Prosedur (SOP) Pengiriman Bahan Pangan SPPG</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Seluruh rekanan supplier dan koperasi wajib mematuhi standar mutu, kebersihan, serta batas waktu kedatangan demi kelancaran pengolahan menu bergizi bagi ribuan penerima manfaat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black">
                <Icons.Clock className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">Waktu Kedatangan Dapur</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bahan pangan segar (sayur, daging, ayam, ikan, bumbu) <strong>wajib tiba maksimal Pukul 05:00 WIB</strong> di Dapur SPPG Temenggungan Krejengan untuk langsung diproses tim persiapan masak subuh.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black">
                <Icons.ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">Standar Mutu & Kesegaran</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sayuran harus segar dan bebas busuk/ulat. Daging ayam dan sapi harus bersih, bersertifikasi Halal, dan dikirim menggunakan wadah tertutup atau coolbox untuk menjaga suhu rantai dingin.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black">
                <Icons.FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm">Pemeriksaan & Serah Terima</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Driver dan Petugas Penerima Gudang SPPG wajib melakukan penimbangan ulang serta menandatangani <strong>Surat Jalan & Manifest Gabungan</strong> fisik sebelum armada meninggalkan area dapur.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL ORDER SATUAN */}
      {/* ========================================================================= */}
      {selectedOrderToView && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Rincian Dokumen PO ({selectedOrderToView.poType})
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {selectedOrderToView.poNumber}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderToView(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
              {/* Info Tanggal Pemesanan vs Target Tiba */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Tanggal Pemesanan (Menu):</span>
                  <span className="font-black text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1 mt-0.5">
                    <Icons.Calendar className="w-3.5 h-3.5 text-blue-600" />
                    {formatDateIndo(selectedOrderToView.orderDate || selectedOrderToView.date)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Target Kedatangan (H-1):</span>
                  <span className="font-black text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1 mt-0.5">
                    <Icons.Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {formatDateIndo(selectedOrderToView.targetArrivalDate || computeTargetArrivalDate(selectedOrderToView.date))}
                  </span>
                </div>
              </div>

              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3 text-center w-12">No</th>
                    <th className="py-2.5 px-4">Rincian Komoditas / Barang</th>
                    <th className="py-2.5 px-3 text-center w-28">Volume / Qty</th>
                    <th className="py-2.5 px-3 text-center w-24">Satuan</th>
                    <th className="py-2.5 px-4 text-right w-36">Harga Satuan (Rp)</th>
                    <th className="py-2.5 px-4 text-right w-40">Total (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {selectedOrderToView.items && selectedOrderToView.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-4 font-bold text-slate-900 dark:text-slate-100">{it.details}</td>
                      <td className="py-2 px-3 text-center font-black">{it.qty}</td>
                      <td className="py-2 px-3 text-center text-slate-500">{it.unit}</td>
                      <td className="py-2 px-4 text-right font-semibold">Rp {it.unitPrice?.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-4 text-right font-black text-slate-900 dark:text-slate-100">
                        Rp {it.totalPrice?.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700 font-black text-sm">
                    <td colSpan={5} className="py-3 px-4 text-right">TOTAL NILAI PEMBELANJAAN:</td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                      Rp {selectedOrderToView.totalAmount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrderToView(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CETAK SURAT JALAN & MANIFEST PENGIRIMAN GABUNGAN (PDF READY) */}
      {/* ========================================================================= */}
      {selectedGroupToPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <Icons.Truck className="w-8 h-8 text-emerald-600" />
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight">
                    SURAT JALAN & MANIFEST PENGIRIMAN GABUNGAN
                  </h2>
                  <p className="text-xs text-slate-500">
                    Satuan Pelayanan Pemenuhan Gizi (SPPG) Kabupaten Probolinggo &bull; Paket Harian Terpadu
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Icons.Printer className="w-4 h-4" />
                  <span>Cetak PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGroupToPrint(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Vendor & Receiver Information */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-400 uppercase text-[10px]">Vendor Pengirim (Supplier):</p>
                <p className="font-black text-slate-900 text-sm">{selectedGroupToPrint.supplierName}</p>
                <p className="text-slate-600 font-medium">Jl. Raya Kraksaan, Kab. Probolinggo</p>
                <p className="text-slate-500 font-medium mt-1">Pengadaan Terpadu Dapur SPPG</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase text-[10px]">Tujuan Penerimaan (SPPG):</p>
                <p className="font-black text-slate-900 text-sm">{selectedGroupToPrint.location}</p>
                <p className="text-slate-700 font-bold mt-1">📅 Tanggal Pemesanan (Menu): {formatDateIndo(selectedGroupToPrint.orderDate || selectedGroupToPrint.date)}</p>
                <p className="text-emerald-700 font-black mt-0.5">🚚 Target Kedatangan (H-1): {formatDateIndo(selectedGroupToPrint.targetArrivalDate)}</p>
                <p className="text-slate-500 text-[10px] font-medium mt-0.5">Drop: {selectedGroupToPrint.targetArrival} (Barang tiba 1 hari sebelum tanggal menu dimasak)</p>
              </div>
            </div>

            {/* Dokumen PO Reference Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 rounded-xl text-xs font-bold">
              <span>Menu: <strong className="text-slate-900">{selectedGroupToPrint.menuSummary}</strong></span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                {selectedGroupToPrint.bahanBakuPO && <span>PO-BB: {selectedGroupToPrint.bahanBakuPO.poNumber}</span>}
                {selectedGroupToPrint.operasionalPO && <span>PO-OPS: {selectedGroupToPrint.operasionalPO.poNumber}</span>}
              </div>
            </div>

            {/* TABEL 1: KOMODITAS BAHAN BAKU */}
            <div className="space-y-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Icons.Apple className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Daftar Komoditas Bahan Baku Pangan Segar</span>
              </h4>
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] border-b">
                    <th className="py-2 px-3 text-center w-10">No</th>
                    <th className="py-2 px-4">Nama Bahan / Komoditas Pangan</th>
                    <th className="py-2 px-3 text-center w-24">Jumlah</th>
                    <th className="py-2 px-3 text-center w-20">Satuan</th>
                    <th className="py-2 px-4 text-center w-32">Kondisi Fisik</th>
                    <th className="py-2 px-4 text-center w-28">Paraf Penerima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {selectedGroupToPrint.bahanBakuPO?.items && selectedGroupToPrint.bahanBakuPO.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-1.5 px-4 font-bold text-slate-900">{it.details}</td>
                      <td className="py-1.5 px-3 text-center font-black">{it.qty}</td>
                      <td className="py-1.5 px-3 text-center text-slate-600">{it.unit}</td>
                      <td className="py-1.5 px-4 text-center text-slate-500">[ &nbsp; ] Segar / Baik</td>
                      <td className="py-1.5 px-4 text-center text-slate-400">........................</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TABEL 2: PERLENGKAPAN OPERASIONAL & KEMASAN */}
            {selectedGroupToPrint.operasionalPO?.items && selectedGroupToPrint.operasionalPO.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Icons.Boxes className="w-3.5 h-3.5 text-amber-600" />
                  <span>2. Daftar Perlengkapan Operasional & Kemasan</span>
                </h4>
                <table className="w-full text-xs text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] border-b">
                      <th className="py-2 px-3 text-center w-10">No</th>
                      <th className="py-2 px-4">Nama Barang / Kemasan / Operasional</th>
                      <th className="py-2 px-3 text-center w-24">Jumlah</th>
                      <th className="py-2 px-3 text-center w-20">Satuan</th>
                      <th className="py-2 px-4 text-center w-32">Kondisi Fisik</th>
                      <th className="py-2 px-4 text-center w-28">Paraf Penerima</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {selectedGroupToPrint.operasionalPO.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-1.5 px-4 font-bold text-slate-900">{it.details}</td>
                        <td className="py-1.5 px-3 text-center font-black">{it.qty}</td>
                        <td className="py-1.5 px-3 text-center text-slate-600">{it.unit}</td>
                        <td className="py-1.5 px-4 text-center text-slate-500">[ &nbsp; ] Utuh / Baik</td>
                        <td className="py-1.5 px-4 text-center text-slate-400">........................</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature Area */}
            <div className="grid grid-cols-3 gap-6 text-center text-xs pt-4 border-t">
              <div>
                <p className="font-bold text-slate-500 text-[11px]">Dikeluarkan Oleh (Supplier):</p>
                <div className="h-16"></div>
                <p className="font-black text-slate-900">{selectedGroupToPrint.supplierName}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 text-[11px]">Petugas Pengantar:</p>
                <div className="h-16"></div>
                <p className="font-black text-slate-900">Petugas Pengantar</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 text-[11px]">Diterima Oleh (SPPG):</p>
                <div className="h-16"></div>
                <p className="font-black text-slate-900">Petugas Gudang / Ahli Gizi</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalSupplierView;
