import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { PurchaseOrderDocument, POItem, POSupplier, POShipTo, RABPlan } from '../../types';
import { PurchaseOrderPrintModal } from './PurchaseOrderPrintModal';

interface PurchaseOrderViewProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const PurchaseOrderView: React.FC<PurchaseOrderViewProps> = ({ currentPath, onNavigate }) => {
  const getSubTabFromPath = (path?: string) => {
    if (path?.includes('riwayat')) return 'riwayat';
    if (path?.includes('pengaturan') || path?.includes('supplier')) return 'pengaturan';
    return 'generator';
  };

  // Sub-tabs: 'generator' | 'riwayat' | 'pengaturan'
  const [activeTab, setActiveTab] = useState<'generator' | 'riwayat' | 'pengaturan'>(getSubTabFromPath(currentPath));

  useEffect(() => {
    if (currentPath) {
      setActiveTab(getSubTabFromPath(currentPath));
    }
  }, [currentPath]);

  const [poTypeTab, setPoTypeTab] = useState<'Bahan Baku' | 'Operasional'>('Bahan Baku');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0); // 0..4 for Day 1..Day 5

  // Dates selection for 5-Day Period
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [availableRABList, setAvailableRABList] = useState<RABPlan[]>([]);

  // Daily PO Array States for 5 Days
  const [dailyPOBahan, setDailyPOBahan] = useState<PurchaseOrderDocument[]>([]);
  const [dailyPOOps, setDailyPOOps] = useState<PurchaseOrderDocument[]>([]);

  // Saved PO List
  const [savedPOList, setSavedPOList] = useState<PurchaseOrderDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Print Modal State
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);
  const [selectedPOToPrint, setSelectedPOToPrint] = useState<PurchaseOrderDocument | null>(null);
  const [selectedBundleToPrint, setSelectedBundleToPrint] = useState<PurchaseOrderDocument[] | null>(null);

  // Send Online Modal State
  const [sendOnlineModalOpen, setSendOnlineModalOpen] = useState<boolean>(false);
  const [targetPOToSend, setTargetPOToSend] = useState<PurchaseOrderDocument | null>(null);
  const [targetBundleToSend, setTargetBundleToSend] = useState<PurchaseOrderDocument[] | null>(null);
  const [supplierPhone, setSupplierPhone] = useState<string>('082319871985'); // Phone number for WA Koperasi Zantara
  const [supplierEmail, setSupplierEmail] = useState<string>('koperasi.zantara@sppg.id');

  // Supplier Portal Modal State (Simulation of Supplier Confirmation)
  const [supplierPortalOpen, setSupplierPortalOpen] = useState<boolean>(false);
  const [confirmingPO, setConfirmingPO] = useState<PurchaseOrderDocument | null>(null);
  const [confirmNotes, setConfirmNotes] = useState<string>('Semua pesanan bahan baku siap dikirim sesuai skedul harian pukul 05:00 WIB.');

  // Search & Filter state for History
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'Semua' | 'Bahan Baku' | 'Operasional'>('Semua');
  const [historyViewMode, setHistoryViewMode] = useState<'gabungan' | 'tabel'>('gabungan');
  const [expandedDateKeys, setExpandedDateKeys] = useState<Record<string, boolean>>({});

  // Load Saved RABs and POs on Mount
  useEffect(() => {
    fetchSavedRABsAndPOs();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchSavedRABsAndPOs = async () => {
    setLoading(true);
    try {
      const resRAB = await fetch('/api/v1/nutrition-plans/rab/list');
      const jsonRAB = await resRAB.json();
      if (jsonRAB.success) {
        setAvailableRABList(jsonRAB.data || []);
      }

      const resPO = await fetch('/api/v1/nutrition-plans/po/list');
      const jsonPO = await resPO.json();
      if (jsonPO.success) {
        setSavedPOList(jsonPO.data || []);
      }

      runPOAggregation(startDate);
    } catch (err) {
      console.error('Error fetching PO/RAB data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run 5-Day PO Consolidation into Daily POs
  const runPOAggregation = async (baseDate: string, customDates?: string[]) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/nutrition-plans/po/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: baseDate,
          dates: customDates && customDates.length > 0 ? customDates : undefined
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setDailyPOBahan(json.data.dailyPOBahanBaku || []);
        setDailyPOOps(json.data.dailyPOOperasional || []);
        setSelectedDates(json.data.periodeDates || []);
      }
    } catch (err) {
      console.error('Error running PO aggregation algorithm:', err);
      showToast('Gagal menjalankan konsolidasi PO', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save Single PO Document
  const handleSaveSinglePO = async (poDoc: PurchaseOrderDocument) => {
    if (!poDoc) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/nutrition-plans/po/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poDoc)
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `PO Harian ${poDoc.poNumber} berhasil disimpan!`, 'success');
        refreshPOList();
      }
    } catch (err) {
      console.error('Error saving PO:', err);
      showToast('Gagal menyimpan Purchase Order', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save Entire 5-Day PO Batch (All Daily POs)
  const handleSavePOBatch = async (batchType: string = 'Semua') => {
    let batch: PurchaseOrderDocument[] = [];
    if (batchType === 'Bahan Baku') batch = dailyPOBahan;
    else if (batchType === 'Operasional') batch = dailyPOOps;
    else batch = [...dailyPOBahan, ...dailyPOOps];

    if (batch.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/v1/nutrition-plans/po/save-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `Berhasil menerbitkan Paket PO Harian 5-Hari!`, 'success');
        refreshPOList();
      }
    } catch (err) {
      console.error('Error saving PO batch:', err);
      showToast('Gagal menyimpan paket PO', 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshPOList = async () => {
    try {
      const resList = await fetch('/api/v1/nutrition-plans/po/list');
      const jsonList = await resList.json();
      if (jsonList.success) {
        setSavedPOList(jsonList.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete saved PO
  const handleDeletePO = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus dokumen Purchase Order ini?')) return;
    try {
      const res = await fetch(`/api/v1/nutrition-plans/po/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Purchase Order berhasil dihapus', 'info');
        setSavedPOList(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Error deleting PO:', err);
      showToast('Gagal menghapus PO', 'error');
    }
  };

  // Open Print Modal for Single PO
  const handleOpenPrintSingle = (poDoc: PurchaseOrderDocument) => {
    setSelectedPOToPrint(poDoc);
    setSelectedBundleToPrint(null);
    setPrintModalOpen(true);
  };

  // Open Print Modal for 5-Day Bundle
  const handleOpenPrintBundle = (type: 'Bahan Baku' | 'Operasional') => {
    const bundle = type === 'Bahan Baku' ? dailyPOBahan : dailyPOOps;
    setSelectedPOToPrint(null);
    setSelectedBundleToPrint(bundle);
    setPrintModalOpen(true);
  };

  // Open Print Modal for Combined PO (Both Bahan Baku & Operasional for a single date)
  const handleOpenPrintBoth = (bahan?: PurchaseOrderDocument, ops?: PurchaseOrderDocument) => {
    const bundle: PurchaseOrderDocument[] = [];
    if (bahan) bundle.push(bahan);
    if (ops) bundle.push(ops);
    if (bundle.length === 0) return;
    setSelectedPOToPrint(null);
    setSelectedBundleToPrint(bundle);
    setPrintModalOpen(true);
  };

  // Send Combined WhatsApp for both Bahan Baku & Operasional on a single date
  const handleSendWABoth = (bahan?: PurchaseOrderDocument, ops?: PurchaseOrderDocument) => {
    if (!bahan && !ops) return;
    const docDate = bahan?.orderDate || bahan?.date || ops?.orderDate || ops?.date || '';
    const targetArrivalDate = bahan?.targetArrivalDate || ops?.targetArrivalDate || computeTargetArrivalDate(docDate);
    const menu = bahan?.menuSummary || ops?.menuSummary || '-';
    const totalBoth = (bahan?.totalAmount || 0) + (ops?.totalAmount || 0);

    let message =
      `*YAYASAN HAFSHAWATY ZAINUL HASAN GENGGONG*\n` +
      `*SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN*\n\n` +
      `*PESANAN PURCHASE ORDER (PO) HARIAN GABUNGAN*\n` +
      `-----------------------------------------------\n` +
      `*Tanggal Pemesanan (Menu):* ${formatDateIndo(docDate)}\n` +
      `*Target Tiba / Kedatangan (H-1):* ${formatDateIndo(targetArrivalDate)} (1 Hari Sebelum Menu)\n` +
      `*Menu Harian:* ${menu}\n` +
      `*Supplier:* ${bahan?.supplier?.name || ops?.supplier?.name || 'Koperasi Zantara'}\n\n`;

    if (bahan) {
      const bahanItems = bahan.items.map((i, idx) => `  ${idx + 1}. *${i.details}* (${i.qty} ${i.unit}) = Rp ${i.totalPrice.toLocaleString('id-ID')}`).join('\n');
      message +=
        `🟢 *1. PO BAHAN BAKU (${bahan.poNumber})*\n` +
        `*Target Tiba di Dapur (H-1):* ${bahan.estimatedArrival || formatDateIndo(targetArrivalDate) + ' Pkl 16:00 WIB (H-1)'}\n` +
        `*Rincian Bahan Pangan:*\n${bahanItems}\n` +
        `*Subtotal Bahan Baku: Rp ${bahan.totalAmount.toLocaleString('id-ID')}*\n\n`;
    }

    if (ops) {
      const opsItems = ops.items.map((i, idx) => `  ${idx + 1}. *${i.details}* (${i.qty} ${i.unit}) = Rp ${i.totalPrice.toLocaleString('id-ID')}`).join('\n');
      message +=
        `🟠 *2. PO OPERASIONAL (${ops.poNumber})*\n` +
        `*Target Tiba di Dapur (H-1):* ${ops.estimatedArrival || formatDateIndo(targetArrivalDate) + ' Pkl 16:00 WIB (H-1)'}\n` +
        `*Rincian Operasional:*\n${opsItems}\n` +
        `*Subtotal Operasional: Rp ${ops.totalAmount.toLocaleString('id-ID')}*\n\n`;
    }

    message +=
      `===============================================\n` +
      `*TOTAL PEMBAYARAN HARI INI: Rp ${totalBoth.toLocaleString('id-ID')}*\n` +
      `===============================================\n\n` +
      `_Pemesanan dan pembayaran diproses per hari. Mohon konfirmasi penerimaan PO melalui portal online._\n\n` +
      `Terima kasih,\n` +
      `*Satuan Pelayanan Pemenuhan Gizi (SPPG)*`;

    const cleanPhone = supplierPhone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    if (bahan) {
      handleSaveSinglePO({ ...bahan, status: 'Terkirim WA' });
    }
    if (ops) {
      handleSaveSinglePO({ ...ops, status: 'Terkirim WA' });
    }
    showToast(`WhatsApp Gateway Gabungan dibuka untuk tanggal ${formatDateIndo(docDate)}!`, 'success');
  };

  // Open generator with specific date & type
  const handleEditInGenerator = (date: string, type: 'Bahan Baku' | 'Operasional') => {
    setStartDate(date);
    setPoTypeTab(type);
    runPOAggregation(date);
    setActiveTab('generator');
    showToast(`Membuka PO ${type} tanggal ${formatDateIndo(date)} di Generator`, 'info');
  };

  // Toggle accordion rincian item per tanggal
  const toggleDateExpand = (date: string) => {
    setExpandedDateKeys(prev => ({ ...prev, [date]: !prev[date] }));
  };

  // Update item in selected Daily PO
  const handleUpdateDailyItem = (
    type: 'Bahan Baku' | 'Operasional',
    dayIdx: number,
    itemIdx: number,
    field: keyof POItem,
    value: any
  ) => {
    const targetArr = type === 'Bahan Baku' ? [...dailyPOBahan] : [...dailyPOOps];
    if (!targetArr[dayIdx]) return;

    const currentDoc = { ...targetArr[dayIdx] };
    const updatedItems = [...currentDoc.items];
    const targetItem = { ...updatedItems[itemIdx], [field]: value };

    if (field === 'qty' || field === 'unitPrice') {
      targetItem.totalPrice = Math.round((Number(targetItem.qty) || 0) * (Number(targetItem.unitPrice) || 0));
    }
    updatedItems[itemIdx] = targetItem;

    const totalAmount = updatedItems.reduce((sum, i) => sum + i.totalPrice, 0);
    currentDoc.items = updatedItems;
    currentDoc.totalAmount = totalAmount;
    targetArr[dayIdx] = currentDoc;

    if (type === 'Bahan Baku') setDailyPOBahan(targetArr);
    else setDailyPOOps(targetArr);
  };

  // Format Indo Date
  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Helper untuk menghitung tanggal target tiba (H-1 sebelum tanggal menu/pemesanan)
  const computeTargetArrivalDate = (menuDateStr?: string): string => {
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

  // Generate WhatsApp Message Text
  const generateWAMessage = (doc: PurchaseOrderDocument) => {
    const isBahan = doc.poType === 'Bahan Baku';
    const itemsList = doc.items.map((i, idx) => `${idx + 1}. *${i.details}* - ${i.qty} ${i.unit} (Rp ${i.unitPrice.toLocaleString('id-ID')}) = *Rp ${i.totalPrice.toLocaleString('id-ID')}*`).join('\n');

    const orderDateStr = doc.orderDate || doc.date;
    const targetArrivalDateStr = doc.targetArrivalDate || computeTargetArrivalDate(orderDateStr);

    return encodeURIComponent(
      `*YAYASAN HAFSHAWATY ZAINUL HASAN GENGGONG*\n` +
      `*SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN*\n\n` +
      `*DOKUMEN PURCHASE ORDER HARIAN*\n` +
      `-----------------------------------------------\n` +
      `*No. PO Harian:* ${doc.poNumber}\n` +
      `*Tipe PO:* ${doc.poType}\n` +
      `*Hari Ke:* ${doc.dayIndex || 1} dari 5 Periode (${doc.dayLabel || ''})\n` +
      `*Tanggal Pemesanan (Menu):* ${formatDateIndo(orderDateStr)}\n` +
      `*Target Tiba / Kedatangan (H-1):* ${formatDateIndo(targetArrivalDateStr)} (Satu hari sebelum menu)\n` +
      `*Supplier:* ${doc.supplier?.name || 'Koperasi Zantara'}\n` +
      `*Menu Harian:* ${doc.menuSummary || '-'}\n\n` +
      `*Rincian Items Pesanan:*\n${itemsList}\n\n` +
      `*TOTAL PEMBAYARAN HARIAN: Rp ${(doc.totalAmount || 0).toLocaleString('id-ID')}*\n` +
      `*Jadwal Drop Kedatangan:* ${doc.estimatedArrival || formatDateIndo(targetArrivalDateStr) + ' Pkl 16:00 WIB (H-1)'}\n\n` +
      `_Pemesanan dan pembayaran diproses per hari. Mohon konfirmasi penerimaan PO melalui tautan Portal Online berikut:_\n` +
      `https://sppg-krejengan.bgn.go.id/po-confirm/${doc.poNumber}\n\n` +
      `Terima kasih,\n` +
      `*Satuan Pelayanan Pemenuhan Gizi (SPPG)*`
    );
  };

  // Send Single PO via WhatsApp
  const handleSendWA = (doc: PurchaseOrderDocument) => {
    const text = generateWAMessage(doc);
    const cleanPhone = supplierPhone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${text}`;
    window.open(waUrl, '_blank');

    // Update status in local state & saved list
    const updated = { ...doc, status: 'Terkirim WA' as const };
    handleSaveSinglePO(updated);
    showToast(`WhatsApp Gateway dibuka untuk PO ${doc.poNumber}!`, 'success');
  };

  // Send 5-Day Bundle via WhatsApp
  const handleSendWABundle = (bundle: PurchaseOrderDocument[]) => {
    if (bundle.length === 0) return;
    const firstDoc = bundle[0];
    const totalBundle = bundle.reduce((s, d) => s + d.totalAmount, 0);

    const bundleText = encodeURIComponent(
      `*YAYASAN HAFSHAWATY ZAINUL HASAN GENGGONG*\n` +
      `*SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN*\n\n` +
      `*PAKET PERIODE 5 HARI PURCHASE ORDER HARIAN*\n` +
      `-----------------------------------------------\n` +
      `*ID Paket Periode:* ${firstDoc.periodeBatchId}\n` +
      `*Tipe PO:* ${firstDoc.poType}\n` +
      `*Periode:* ${formatDateIndo(firstDoc.periodeStartDate)} s/d ${formatDateIndo(firstDoc.periodeEndDate)}\n` +
      `*Supplier:* ${firstDoc.supplier?.name || 'Koperasi Zantara'}\n` +
      `*Jumlah Dokumen PO Harian:* ${bundle.length} Lembar PO\n\n` +
      `*Ringkasan Nominal Per Hari:*\n` +
      bundle.map((d, idx) => `• Hari ${idx + 1} (${formatDateIndo(d.date)}): *Rp ${d.totalAmount.toLocaleString('id-ID')}* [${d.poNumber}]`).join('\n') +
      `\n\n*TOTAL PAKET PERIODE 5 HARI: Rp ${totalBundle.toLocaleString('id-ID')}*\n\n` +
      `_Telah diterbitkan 5 lembar PO harian terpisah. Pengiriman dan penagihan dilakukan setiap hari._\n` +
      `Terima kasih,\n` +
      `*Satuan Pelayanan Pemenuhan Gizi (SPPG)*`
    );

    const cleanPhone = supplierPhone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${bundleText}`;
    window.open(waUrl, '_blank');

    // Save batch with updated status
    const updatedBundle = bundle.map(d => ({ ...d, status: 'Terkirim WA' as const }));
    if (firstDoc.poType === 'Bahan Baku') setDailyPOBahan(updatedBundle);
    else setDailyPOOps(updatedBundle);

    handleSavePOBatch(firstDoc.poType);
  };

  // Handle Supplier Online Confirmation
  const handleConfirmBySupplier = async (doc: PurchaseOrderDocument) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/nutrition-plans/po/confirm-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poId: doc.id || doc.poNumber,
          confirmedBy: doc.supplier?.name || 'Koperasi Zantara',
          notes: confirmNotes
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `PO ${doc.poNumber} berhasil dikonfirmasi Supplier!`, 'success');
        setSupplierPortalOpen(false);
        refreshPOList();

        // Update active daily state if matching
        if (doc.poType === 'Bahan Baku') {
          setDailyPOBahan(prev => prev.map(d => d.poNumber === doc.poNumber ? { ...d, status: 'Dikonfirmasi Supplier' } : d));
        } else {
          setDailyPOOps(prev => prev.map(d => d.poNumber === doc.poNumber ? { ...d, status: 'Dikonfirmasi Supplier' } : d));
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Gagal memproses konfirmasi supplier', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Konfirmasi PO oleh Admin (Rilis ke Portal Supplier)
  const handleConfirmAdminSingle = async (doc: PurchaseOrderDocument) => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/nutrition-plans/po/confirm-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poId: doc.id,
          confirmedBy: 'Sri Rohayu, S. Pd (Admin SPPG)',
          notes: 'Dikonfirmasi resmi oleh Admin dan dirilis ke Portal Supplier'
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`PO ${doc.poNumber} berhasil dikonfirmasi! Sekarang otomatis muncul di Status Pemesanan Portal Supplier.`, 'success');
        refreshPOList();
      } else {
        showToast(json.message || 'Gagal mengonfirmasi PO', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Gagal memproses konfirmasi Admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAdminDateGroup = async (docs: PurchaseOrderDocument[]) => {
    try {
      setLoading(true);
      const poIds = docs.map(d => d.id).filter(Boolean);
      const res = await fetch('/api/v1/nutrition-plans/po/confirm-admin-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poIds,
          confirmedBy: 'Sri Rohayu, S. Pd (Admin SPPG)',
          notes: 'Dikonfirmasi batch oleh Admin dan dirilis ke Portal Supplier'
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`${poIds.length} Dokumen PO berhasil dikonfirmasi Admin! Kini aktif di Status Pemesanan Portal Supplier.`, 'success');
        refreshPOList();
      } else {
        showToast(json.message || 'Gagal mengonfirmasi PO', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Gagal memproses konfirmasi Admin', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Active Daily PO array and current day document
  const activeDailyArray = poTypeTab === 'Bahan Baku' ? dailyPOBahan : dailyPOOps;
  const currentDailyPO = activeDailyArray[selectedDayIndex] || null;

  // Aggregate stats across 5 days
  const totalBahan5Days = dailyPOBahan.reduce((sum, d) => sum + (d.totalAmount || 0), 0);
  const totalOps5Days = dailyPOOps.reduce((sum, d) => sum + (d.totalAmount || 0), 0);
  const totalPorsi5Days = dailyPOBahan.reduce((sum, d) => sum + (d.porsiBesar || 0) + (d.porsiKecil || 0), 0);

  // Filter history list (Flat table mode)
  const filteredHistoryList = savedPOList.filter(po => {
    const matchesSearch = po.poNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
                          po.supplier?.name.toLowerCase().includes(historySearch.toLowerCase()) ||
                          po.menuSummary.toLowerCase().includes(historySearch.toLowerCase());
    const matchesType = historyTypeFilter === 'Semua' || po.poType === historyTypeFilter;
    return matchesSearch && matchesType;
  });

  // Grouped history by order date (Tanggal Pemesanan) combining Bahan Baku & Operasional
  const groupedHistory = useMemo(() => {
    const map: Record<string, {
      date: string;
      orderDate: string;
      targetArrivalDate: string;
      menuSummary: string;
      bahanBakuPO?: PurchaseOrderDocument;
      operasionalPO?: PurchaseOrderDocument;
      otherPOs: PurchaseOrderDocument[];
    }> = {};

    savedPOList.forEach(po => {
      const d = po.date || 'Tanpa Tanggal';
      const orderDate = po.orderDate || d;
      const targetArrivalDate = po.targetArrivalDate || computeTargetArrivalDate(orderDate);

      if (!map[d]) {
        map[d] = {
          date: d,
          orderDate,
          targetArrivalDate,
          menuSummary: po.menuSummary || '-',
          otherPOs: []
        };
      } else {
        if ((!map[d].menuSummary || map[d].menuSummary === '-') && po.menuSummary) {
          map[d].menuSummary = po.menuSummary;
        }
        if (!map[d].orderDate && po.orderDate) {
          map[d].orderDate = po.orderDate;
        }
        if (!map[d].targetArrivalDate && po.targetArrivalDate) {
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
      const totalDaily = (g.bahanBakuPO?.totalAmount || 0) +
                         (g.operasionalPO?.totalAmount || 0) +
                         g.otherPOs.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
      const allDocs = [g.bahanBakuPO, g.operasionalPO, ...g.otherPOs].filter(Boolean) as PurchaseOrderDocument[];
      const isAllConfirmed = allDocs.length > 0 && allDocs.every(d => d.status === 'Dikonfirmasi Supplier' || d.status === 'Selesai');
      const isAllConfirmedAdmin = allDocs.length > 0 && allDocs.every(d => d.status !== 'Draft');
      const isAnySentWA = allDocs.some(d => d.status === 'Terkirim WA');
      const isAnyDraft = allDocs.some(d => d.status === 'Draft');
      const isAnyShopping = allDocs.some(d => d.status === 'Diproses Belanja');
      const isAnyDispatched = allDocs.some(d => d.status === 'Dikirim Supplier');

      const finalOrderDate = g.orderDate || g.date;
      const finalTargetArrivalDate = g.targetArrivalDate || computeTargetArrivalDate(finalOrderDate);

      return {
        ...g,
        orderDate: finalOrderDate,
        targetArrivalDate: finalTargetArrivalDate,
        allDocs,
        totalDaily,
        isAllConfirmed,
        isAllConfirmedAdmin,
        isAnySentWA,
        isAnyDraft,
        isAnyShopping,
        isAnyDispatched
      };
    });
  }, [savedPOList]);

  // Filtered grouped history
  const filteredGroupedHistory = useMemo(() => {
    return groupedHistory.filter(group => {
      const q = historySearch.toLowerCase();
      const matchesSearch =
        !q ||
        group.date.toLowerCase().includes(q) ||
        (group.orderDate && group.orderDate.toLowerCase().includes(q)) ||
        (group.targetArrivalDate && group.targetArrivalDate.toLowerCase().includes(q)) ||
        group.menuSummary.toLowerCase().includes(q) ||
        (group.bahanBakuPO && (
          group.bahanBakuPO.poNumber.toLowerCase().includes(q) ||
          group.bahanBakuPO.supplier?.name.toLowerCase().includes(q)
        )) ||
        (group.operasionalPO && (
          group.operasionalPO.poNumber.toLowerCase().includes(q) ||
          group.operasionalPO.supplier?.name.toLowerCase().includes(q)
        ));

      if (!matchesSearch) return false;

      if (historyTypeFilter === 'Bahan Baku') {
        return !!group.bahanBakuPO;
      } else if (historyTypeFilter === 'Operasional') {
        return !!group.operasionalPO;
      }
      return true;
    });
  }, [groupedHistory, historySearch, historyTypeFilter]);

  // Aggregate stats across history
  const totalBahanInHistory = savedPOList.filter(p => p.poType === 'Bahan Baku').reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalOpsInHistory = savedPOList.filter(p => p.poType === 'Operasional').reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalAllInHistory = totalBahanInHistory + totalOpsInHistory;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold transition-all ${
          toastMessage.type === 'success' ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700/80' :
          toastMessage.type === 'error' ? 'bg-rose-900/90 text-rose-100 border-rose-700/80' :
          'bg-blue-900/90 text-blue-100 border-blue-700/80'
        }`}>
          <Icons.CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Title Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-blue-800/50">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <Icons.FileCheck className="w-72 h-72 text-white" />
        </div>

        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <Icons.Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Sistem Purchase Order (PO) Harian
            </span>
            <span className="px-3 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-full text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <Icons.Send className="w-3.5 h-3.5 text-cyan-300" />
              Distribusi Supplier Online & WA Gateway
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            Purchase Order (PO) Harian & Supplier Distribution
          </h1>
          <p className="text-xs text-blue-200/90 leading-relaxed">
            Penerbitan dokumen resmi Purchase Order (PO) per hari kepada supplier/koperasi untuk pemenuhan bahan pangan dan operasional harian SPPG, lengkap dengan integrasi WhatsApp Gateway dan konfirmasi online.
          </p>
        </div>
      </div>

      {/* Main Module Subtabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Icons.Calculator className="w-4 h-4" />
            <span>Purchase Order Harian</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'riwayat'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Icons.History className="w-4 h-4" />
            <span>Riwayat & Status PO ({savedPOList.length})</span>
          </button>
        </div>

        {activeTab === 'generator' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Tipe Dokumen:</span>
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex gap-1">
              <button
                type="button"
                onClick={() => setPoTypeTab('Bahan Baku')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  poTypeTab === 'Bahan Baku'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                PO Bahan Baku
              </button>
              <button
                type="button"
                onClick={() => setPoTypeTab('Operasional')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  poTypeTab === 'Operasional'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                PO Operasional
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: GENERATOR PO HARIAN */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          {/* Kontrol Tanggal & Filter PO */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Tanggal Pemesanan:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    runPOAggregation(e.target.value);
                  }}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() - 1);
                    const prev = d.toISOString().split('T')[0];
                    setStartDate(prev);
                    runPOAggregation(prev);
                  }}
                  className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Hari Sebelumnya"
                >
                  <Icons.ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setStartDate(today);
                    runPOAggregation(today);
                  }}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Hari Ini
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + 1);
                    const next = d.toISOString().split('T')[0];
                    setStartDate(next);
                    runPOAggregation(next);
                  }}
                  className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Hari Berikutnya"
                >
                  <Icons.ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => runPOAggregation(startDate)}
                  disabled={loading}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Icons.RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Sinkron RAB</span>
                </button>
              </div>
            </div>

            {currentDailyPO && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Status:</span>
                <span className={`px-3 py-1 rounded-xl text-xs font-extrabold border uppercase ${
                  currentDailyPO.status === 'Dikonfirmasi Supplier' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300' :
                  currentDailyPO.status === 'Terkirim WA' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300' :
                  'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                }`}>
                  {currentDailyPO.status}
                </span>
              </div>
            )}
          </div>

          {/* PO Document Detail Container */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4">
            {currentDailyPO ? (
              <div className="p-5 space-y-5">
                {/* Header Info Bar for current PO */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {currentDailyPO.poType}
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                        {currentDailyPO.poNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                      Menu Tanggal {formatDateIndo(currentDailyPO.date)}: <strong className="text-slate-900 dark:text-slate-100 uppercase">{currentDailyPO.menuSummary}</strong>
                    </p>
                  </div>

                  {/* Actions for current PO */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveSinglePO(currentDailyPO)}
                      disabled={loading}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Icons.Save className="w-4 h-4" />
                      <span>Simpan PO</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendWA(currentDailyPO)}
                      className="px-3.5 py-1.5 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Icons.Send className="w-4 h-4" />
                      <span>Kirim WA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenPrintSingle(currentDailyPO)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Icons.Printer className="w-4 h-4" />
                      <span>Cetak PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingPO(currentDailyPO);
                        setSupplierPortalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Icons.CheckCircle2 className="w-4 h-4" />
                      <span>Portal Konfirmasi Supplier</span>
                    </button>
                  </div>
                </div>

                {/* Form fields: Supplier, Phone, Tanggal Pemesanan, Target Tiba, Estimasi Kedatangan */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Supplier / Vendor:</label>
                    <input
                      type="text"
                      value={currentDailyPO.supplier?.name || ''}
                      onChange={(e) => {
                        const sup = { ...currentDailyPO.supplier!, name: e.target.value };
                        const updated = { ...currentDailyPO, supplier: sup };
                        const targetArr = poTypeTab === 'Bahan Baku' ? [...dailyPOBahan] : [...dailyPOOps];
                        targetArr[selectedDayIndex] = updated;
                        if (poTypeTab === 'Bahan Baku') setDailyPOBahan(targetArr);
                        else setDailyPOOps(targetArr);
                      }}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">WhatsApp Supplier:</label>
                    <input
                      type="text"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      placeholder="082319871985"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase block mb-1">Tgl Pemesanan (Menu):</label>
                    <input
                      type="date"
                      value={currentDailyPO.orderDate || currentDailyPO.date || ''}
                      onChange={(e) => {
                        const newOrderDate = e.target.value;
                        const newTargetArrival = computeTargetArrivalDate(newOrderDate);
                        const updated = { 
                          ...currentDailyPO, 
                          orderDate: newOrderDate, 
                          date: newOrderDate,
                          targetArrivalDate: newTargetArrival,
                          estimatedArrival: `${newTargetArrival} Pkl 16:00 WIB (H-1)`
                        };
                        const targetArr = poTypeTab === 'Bahan Baku' ? [...dailyPOBahan] : [...dailyPOOps];
                        targetArr[selectedDayIndex] = updated;
                        if (poTypeTab === 'Bahan Baku') setDailyPOBahan(targetArr);
                        else setDailyPOOps(targetArr);
                      }}
                      className="w-full px-3 py-1.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl font-black text-blue-900 dark:text-blue-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase block mb-1">Target Tiba (H-1):</label>
                    <input
                      type="date"
                      value={currentDailyPO.targetArrivalDate || computeTargetArrivalDate(currentDailyPO.orderDate || currentDailyPO.date) || ''}
                      onChange={(e) => {
                        const newTargetArrival = e.target.value;
                        const updated = { 
                          ...currentDailyPO, 
                          targetArrivalDate: newTargetArrival,
                          estimatedArrival: `${newTargetArrival} Pkl 16:00 WIB (H-1)`
                        };
                        const targetArr = poTypeTab === 'Bahan Baku' ? [...dailyPOBahan] : [...dailyPOOps];
                        targetArr[selectedDayIndex] = updated;
                        if (poTypeTab === 'Bahan Baku') setDailyPOBahan(targetArr);
                        else setDailyPOOps(targetArr);
                      }}
                      className="w-full px-3 py-1.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-xl font-black text-emerald-900 dark:text-emerald-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nomor PO Harian:</label>
                    <input
                      type="text"
                      value={currentDailyPO.poNumber || ''}
                      onChange={(e) => {
                        const updated = { ...currentDailyPO, poNumber: e.target.value };
                        const targetArr = poTypeTab === 'Bahan Baku' ? [...dailyPOBahan] : [...dailyPOOps];
                        targetArr[selectedDayIndex] = updated;
                        if (poTypeTab === 'Bahan Baku') setDailyPOBahan(targetArr);
                        else setDailyPOOps(targetArr);
                      }}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Estimasi Jam Drop:</label>
                    <input
                      type="text"
                      value={currentDailyPO.estimatedArrival || ''}
                      onChange={(e) => {
                        const updated = { ...currentDailyPO, estimatedArrival: e.target.value };
                        const targetArr = poTypeTab === 'Bahan Baku' ? [...dailyPOBahan] : [...dailyPOOps];
                        targetArr[selectedDayIndex] = updated;
                        if (poTypeTab === 'Bahan Baku') setDailyPOBahan(targetArr);
                        else setDailyPOOps(targetArr);
                      }}
                      placeholder="Contoh: 16:00 WIB (H-1)"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Table of Daily Items */}
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3 text-center w-12">No</th>
                        <th className="py-2.5 px-4 text-left">Rincian Items Pemesanan Tanggal {formatDateIndo(currentDailyPO.date)}</th>
                        <th className="py-2.5 px-3 text-center w-28">Qty Hari Ini</th>
                        <th className="py-2.5 px-3 text-center w-24">Satuan</th>
                        <th className="py-2.5 px-4 text-right w-36">Harga Satuan (Rp)</th>
                        <th className="py-2.5 px-4 text-right w-40">Total Pembayaran (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                      {currentDailyPO.items && currentDailyPO.items.map((item, itemIdx) => (
                        <tr key={itemIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-3 text-center font-bold text-slate-400">{itemIdx + 1}</td>
                          <td className="py-2 px-4 font-bold text-slate-900 dark:text-slate-100">{item.details}</td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              step="any"
                              value={item.qty}
                              onChange={(e) => handleUpdateDailyItem(poTypeTab, selectedDayIndex, itemIdx, 'qty', Number(e.target.value))}
                              className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-slate-900 dark:text-slate-100"
                            />
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-slate-600 dark:text-slate-400">
                            {item.unit}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateDailyItem(poTypeTab, selectedDayIndex, itemIdx, 'unitPrice', Number(e.target.value))}
                              className="w-28 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-slate-900 dark:text-slate-100"
                            />
                          </td>
                          <td className="py-2 px-4 text-right font-black text-slate-900 dark:text-slate-100">
                            Rp{item.totalPrice.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 dark:bg-slate-800 font-black text-xs border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                        <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider">
                          Total Pembayaran PO Hari Ini ({formatDateIndo(currentDailyPO.date)}):
                        </td>
                        <td colSpan={2} className="py-3 px-4 text-right text-base text-blue-600 dark:text-blue-400 font-black">
                          Rp{(currentDailyPO.totalAmount || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 font-medium">
                Pilih tanggal di atas untuk memuat dokumen PO Harian.
              </div>
            )}

          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT & STATUS PO TERSIMPAN (GABUNGAN PER TANGGAL PEMESANAN) */}
      {activeTab === 'riwayat' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Icons.Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hari Pemesanan</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {filteredGroupedHistory.length} <span className="text-xs font-bold text-slate-500">Tanggal</span>
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Icons.Apple className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Bahan Baku</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  Rp{totalBahanInHistory.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Icons.Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Operasional</p>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                  Rp{totalOpsInHistory.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Icons.BadgeDollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Akumulasi</p>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                  Rp{totalAllInHistory.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {/* Controls Bar & View Switcher */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Icons.Layers className="w-5 h-5 text-blue-600" />
                  <span>Riwayat & Status PO Harian Terpadu</span>
                </h3>
                <p className="text-xs text-slate-500">
                  PO Bahan Baku dan Operasional digabung per tanggal pemesanan agar admin dapat memonitor pesanan setiap hari secara menyeluruh.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* View Switcher Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setHistoryViewMode('gabungan')}
                    className={`px-3 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      historyViewMode === 'gabungan'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Icons.Calendar className="w-3.5 h-3.5" />
                    <span>Gabungan Per Tanggal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryViewMode('tabel')}
                    className={`px-3 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      historyViewMode === 'tabel'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Icons.Table className="w-3.5 h-3.5" />
                    <span>Tabel Dokumen Detail</span>
                  </button>
                </div>

                {/* Search */}
                <input
                  type="text"
                  placeholder="Cari Tanggal / Menu / No. PO..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold w-60 text-slate-900 dark:text-slate-100"
                />

                {/* Filter */}
                <select
                  value={historyTypeFilter}
                  onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="Semua">Semua Tipe PO</option>
                  <option value="Bahan Baku">PO Bahan Baku</option>
                  <option value="Operasional">PO Operasional</option>
                </select>

                <button
                  type="button"
                  onClick={refreshPOList}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  title="Muat Ulang Data"
                >
                  <Icons.RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* VIEW MODE 1: GABUNGAN PER TANGGAL (DEFAULT & UTAMA) */}
            {historyViewMode === 'gabungan' && (
              <div className="space-y-4 pt-2">
                {filteredGroupedHistory.length === 0 ? (
                  <div className="py-14 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <Icons.Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Belum ada Purchase Order untuk tanggal ini</p>
                    <p className="text-xs text-slate-400 mt-1">Gunakan Generator PO di atas untuk menerbitkan PO Bahan Baku & Operasional harian.</p>
                  </div>
                ) : (
                  filteredGroupedHistory.map((group) => {
                    const isExpanded = !!expandedDateKeys[group.date];
                    return (
                      <div
                        key={group.date}
                        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:border-blue-400 dark:hover:border-blue-700 transition-all"
                      >
                        {/* Header Bar: Tanggal Pemesanan & Ringkasan Harian */}
                        <div className="bg-slate-50 dark:bg-slate-800/80 p-4 md:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-black flex items-center gap-1.5 shadow-sm" title="Tanggal Pemesanan Menu">
                                <Icons.Calendar className="w-3.5 h-3.5" />
                                <span>Menu: {formatDateIndo(group.orderDate || group.date)}</span>
                              </span>

                              <span className="px-3 py-1 rounded-xl bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm" title="Target Kedatangan Barang (H-1)">
                                <Icons.Clock className="w-3.5 h-3.5" />
                                <span>Target Tiba (H-1): {formatDateIndo(group.targetArrivalDate)}</span>
                              </span>

                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                                group.isAllConfirmed
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                  : group.isAnyDispatched
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300'
                                  : group.isAnyShopping
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                                  : group.isAllConfirmedAdmin
                                  ? 'bg-teal-100 text-teal-800 border border-teal-300 dark:bg-teal-950 dark:text-teal-300'
                                  : group.isAnySentWA
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {group.isAllConfirmed ? 'Lengkap & Selesai' :
                                 group.isAnyDispatched ? 'Armada Dikirim Supplier' :
                                 group.isAnyShopping ? 'Sedang Dibelanjakan' :
                                 group.isAllConfirmedAdmin ? 'Dikonfirmasi Admin (Tampil di Supplier)' :
                                 group.isAnySentWA ? 'Terkirim Online' : 'Draft / Menunggu Konfirmasi Admin'}
                              </span>

                              {group.bahanBakuPO && (
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                                  Bahan: Rp{group.bahanBakuPO.totalAmount.toLocaleString('id-ID')}
                                </span>
                              )}

                              {group.operasionalPO && (
                                <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                                  Ops: Rp{group.operasionalPO.totalAmount.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-bold pt-1">
                              <Icons.Utensils className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-xl">{group.menuSummary}</span>
                            </div>
                          </div>

                          {/* Right Header: Total Nominal & Quick Unified Actions */}
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="text-right pr-2">
                              <p className="text-[10px] uppercase font-extrabold text-slate-400">Total Pengeluaran Hari Ini</p>
                              <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                                Rp{group.totalDaily.toLocaleString('id-ID')}
                              </p>
                            </div>

                            {/* Tombol Konfirmasi Admin Batch (Rilis ke Portal Supplier) */}
                            {group.isAnyDraft && (
                              <button
                                type="button"
                                onClick={() => handleConfirmAdminDateGroup(group.allDocs)}
                                disabled={loading}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                title="Konfirmasi PO hari ini agar langsung muncul di Status Pemesanan Portal Supplier"
                              >
                                <Icons.CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Konfirmasi Admin (Rilis ke Supplier)</span>
                              </button>
                            )}

                            {/* Tombol Cetak PDF Kedua PO */}
                            <button
                              type="button"
                              onClick={() => handleOpenPrintBoth(group.bahanBakuPO, group.operasionalPO)}
                              disabled={!group.bahanBakuPO && !group.operasionalPO}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              title="Cetak PDF Gabungan (Bahan Baku + Operasional)"
                            >
                              <Icons.Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Cetak Keduanya (PDF)</span>
                            </button>

                            {/* Tombol Kirim WA Gabungan */}
                            <button
                              type="button"
                              onClick={() => handleSendWABoth(group.bahanBakuPO, group.operasionalPO)}
                              disabled={!group.bahanBakuPO && !group.operasionalPO}
                              className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              title="Kirim Ringkasan Gabungan via WhatsApp"
                            >
                              <Icons.Send className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Kirim WA Gabungan</span>
                            </button>

                            {/* Tombol Shortcut ke Portal Supplier */}
                            {onNavigate && (
                              <button
                                type="button"
                                onClick={() => onNavigate('/portal-supplier/pesanan')}
                                className="px-3 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Buka Portal Supplier untuk melihat status pemesanan"
                              >
                                <Icons.ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Portal Supplier</span>
                              </button>
                            )}

                            {/* Toggle Detail Items Dropdown */}
                            <button
                              type="button"
                              onClick={() => toggleDateExpand(group.date)}
                              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                              title="Tampilkan / Sembunyikan Rincian Item"
                            >
                              <span>{isExpanded ? 'Tutup Rincian' : 'Rincian Item'}</span>
                              {isExpanded ? <Icons.ChevronUp className="w-3.5 h-3.5" /> : <Icons.ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Dual Column Layout: PO Bahan Baku & PO Operasional */}
                        <div className="p-4 md:p-6 bg-slate-50/40 dark:bg-slate-900/40 grid grid-cols-1 lg:grid-cols-2 gap-5">
                          {/* ================= COLUMN 1: PO BAHAN BAKU ================= */}
                          {group.bahanBakuPO ? (
                            <div className="bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-950 pb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                                      <Icons.Apple className="w-3.5 h-3.5" />
                                      <span>PO Bahan Baku</span>
                                    </span>
                                    <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200">
                                      {group.bahanBakuPO.poNumber}
                                    </span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    group.bahanBakuPO.status === 'Dikonfirmasi Supplier' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                    group.bahanBakuPO.status === 'Terkirim WA' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                    'bg-slate-100 text-slate-700 border border-slate-300'
                                  }`}>
                                    {group.bahanBakuPO.status}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Supplier Penerima:</p>
                                    <p className="font-extrabold text-slate-900 dark:text-slate-100">
                                      {group.bahanBakuPO.supplier?.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-semibold">{group.bahanBakuPO.supplier?.contact || supplierPhone}</p>
                                  </div>

                                  <div>
                                    <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase">Target Tiba di Dapur (H-1):</p>
                                    <p className="font-black text-emerald-700 dark:text-emerald-300">
                                      {formatDateIndo(group.bahanBakuPO.targetArrivalDate || computeTargetArrivalDate(group.bahanBakuPO.orderDate || group.date))}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                      {group.bahanBakuPO.estimatedArrival || `${formatDateIndo(group.targetArrivalDate)} Pkl 16:00 WIB`}
                                    </p>
                                  </div>
                                </div>

                                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">Rincian Komoditas:</p>
                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                      {group.bahanBakuPO.items?.length || 0} Macam Bahan Pangan Segar
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">Subtotal Bahan:</p>
                                    <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                                      Rp{group.bahanBakuPO.totalAmount.toLocaleString('id-ID')}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Aksi PO Bahan Baku */}
                              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                {group.bahanBakuPO.status === 'Draft' && (
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmAdminSingle(group.bahanBakuPO!)}
                                    disabled={loading}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                    title="Konfirmasi PO Admin dan rilis ke Portal Supplier"
                                  >
                                    <Icons.CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Konfirmasi Admin</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleSendWA(group.bahanBakuPO!)}
                                  className="px-2.5 py-1.5 bg-green-100 hover:bg-green-200 dark:bg-green-950 dark:hover:bg-green-900 text-green-800 dark:text-green-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Kirim via WhatsApp"
                                >
                                  <Icons.Send className="w-3.5 h-3.5" />
                                  <span>Kirim WA</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmingPO(group.bahanBakuPO!);
                                    setSupplierPortalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Konfirmasi Supplier"
                                >
                                  <Icons.CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Konfirmasi</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenPrintSingle(group.bahanBakuPO!)}
                                  className="px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Cetak PDF Bahan Baku"
                                >
                                  <Icons.Printer className="w-3.5 h-3.5" />
                                  <span>PDF</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeletePO(group.bahanBakuPO!.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-xl transition-all cursor-pointer"
                                  title="Hapus PO Bahan Baku"
                                >
                                  <Icons.Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-900/40 rounded-2xl p-6 bg-emerald-50/20 dark:bg-emerald-950/10 flex flex-col items-center justify-center text-center space-y-3 min-h-[190px]">
                              <Icons.Apple className="w-8 h-8 text-emerald-400 opacity-60" />
                              <div>
                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">PO Bahan Baku Belum Diterbitkan</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Tanggal {formatDateIndo(group.date)} belum memiliki PO Bahan Baku.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleEditInGenerator(group.date, 'Bahan Baku')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              >
                                <Icons.Plus className="w-3.5 h-3.5" />
                                <span>+ Terbitkan PO Bahan Baku</span>
                              </button>
                            </div>
                          )}

                          {/* ================= COLUMN 2: PO OPERASIONAL ================= */}
                          {group.operasionalPO ? (
                            <div className="bg-white dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-950 pb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                                      <Icons.Package className="w-3.5 h-3.5" />
                                      <span>PO Operasional</span>
                                    </span>
                                    <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200">
                                      {group.operasionalPO.poNumber}
                                    </span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    group.operasionalPO.status === 'Dikonfirmasi Supplier' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                    group.operasionalPO.status === 'Terkirim WA' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                    'bg-slate-100 text-slate-700 border border-slate-300'
                                  }`}>
                                    {group.operasionalPO.status}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Supplier Penerima:</p>
                                    <p className="font-extrabold text-slate-900 dark:text-slate-100">
                                      {group.operasionalPO.supplier?.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-semibold">{group.operasionalPO.supplier?.contact || supplierPhone}</p>
                                  </div>

                                  <div>
                                    <p className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase">Target Tiba di Dapur (H-1):</p>
                                    <p className="font-black text-amber-700 dark:text-amber-300">
                                      {formatDateIndo(group.operasionalPO.targetArrivalDate || computeTargetArrivalDate(group.operasionalPO.orderDate || group.date))}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-medium">
                                      {group.operasionalPO.estimatedArrival || `${formatDateIndo(group.targetArrivalDate)} Pkl 16:00 WIB`}
                                    </p>
                                  </div>
                                </div>

                                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40 flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase">Rincian Komoditas:</p>
                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                      {group.operasionalPO.items?.length || 0} Macam Gas/Kemasan/Ops
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase">Subtotal Ops:</p>
                                    <p className="text-sm font-black text-amber-700 dark:text-amber-300">
                                      Rp{group.operasionalPO.totalAmount.toLocaleString('id-ID')}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Aksi PO Operasional */}
                              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                {group.operasionalPO.status === 'Draft' && (
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmAdminSingle(group.operasionalPO!)}
                                    disabled={loading}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                    title="Konfirmasi PO Admin dan rilis ke Portal Supplier"
                                  >
                                    <Icons.CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Konfirmasi Admin</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleSendWA(group.operasionalPO!)}
                                  className="px-2.5 py-1.5 bg-green-100 hover:bg-green-200 dark:bg-green-950 dark:hover:bg-green-900 text-green-800 dark:text-green-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Kirim via WhatsApp"
                                >
                                  <Icons.Send className="w-3.5 h-3.5" />
                                  <span>Kirim WA</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmingPO(group.operasionalPO!);
                                    setSupplierPortalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Konfirmasi Supplier"
                                >
                                  <Icons.CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Konfirmasi</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenPrintSingle(group.operasionalPO!)}
                                  className="px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Cetak PDF Operasional"
                                >
                                  <Icons.Printer className="w-3.5 h-3.5" />
                                  <span>PDF</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeletePO(group.operasionalPO!.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-xl transition-all cursor-pointer"
                                  title="Hapus PO Operasional"
                                >
                                  <Icons.Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-amber-300 dark:border-amber-900/40 rounded-2xl p-6 bg-amber-50/20 dark:bg-amber-950/10 flex flex-col items-center justify-center text-center space-y-3 min-h-[190px]">
                              <Icons.Package className="w-8 h-8 text-amber-400 opacity-60" />
                              <div>
                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">PO Operasional Belum Diterbitkan</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Tanggal {formatDateIndo(group.date)} belum memiliki PO Operasional.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleEditInGenerator(group.date, 'Operasional')}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              >
                                <Icons.Plus className="w-3.5 h-3.5" />
                                <span>+ Terbitkan PO Operasional</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Extra PO documents on the same date (if any) */}
                        {group.otherPOs && group.otherPOs.length > 0 && (
                          <div className="px-6 pb-4 pt-1 bg-slate-50/40 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Dokumen PO Tambahan / Revisi:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {group.otherPOs.map((extraPO) => (
                                <div key={extraPO.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                                  <div>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{extraPO.poNumber} ({extraPO.poType})</span>
                                    <p className="text-[10px] text-slate-500">Rp{extraPO.totalAmount.toLocaleString('id-ID')} • {extraPO.status}</p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => handleSendWA(extraPO)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Icons.Send className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleOpenPrintSingle(extraPO)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Icons.Printer className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDeletePO(extraPO.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded"><Icons.Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Expandable Accordion: Tabel Rincian Item Kedua PO */}
                        {isExpanded && (
                          <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Rincian Item Bahan Baku */}
                              <div>
                                <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <Icons.Apple className="w-3.5 h-3.5" />
                                  <span>Rincian Item Bahan Baku ({group.bahanBakuPO?.poNumber || 'Belum Ada'})</span>
                                </h4>
                                {group.bahanBakuPO?.items && group.bahanBakuPO.items.length > 0 ? (
                                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                                    <table className="w-full text-xs text-left border-collapse">
                                      <thead>
                                        <tr className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 text-[10px] font-black uppercase">
                                          <th className="py-2 px-2 text-center w-8">No</th>
                                          <th className="py-2 px-3">Komoditas Bahan</th>
                                          <th className="py-2 px-2 text-center">Qty</th>
                                          <th className="py-2 px-2 text-center">Satuan</th>
                                          <th className="py-2 px-3 text-right">Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {group.bahanBakuPO.items.map((it, idx) => (
                                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="py-1.5 px-2 text-center text-slate-400">{idx + 1}</td>
                                            <td className="py-1.5 px-3 font-bold text-slate-800 dark:text-slate-200">{it.details}</td>
                                            <td className="py-1.5 px-2 text-center font-semibold">{it.qty}</td>
                                            <td className="py-1.5 px-2 text-center text-slate-500">{it.unit}</td>
                                            <td className="py-1.5 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">Rp{it.totalPrice.toLocaleString('id-ID')}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 italic">Tidak ada item bahan baku.</p>
                                )}
                              </div>

                              {/* Rincian Item Operasional */}
                              <div>
                                <h4 className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <Icons.Package className="w-3.5 h-3.5" />
                                  <span>Rincian Item Operasional ({group.operasionalPO?.poNumber || 'Belum Ada'})</span>
                                </h4>
                                {group.operasionalPO?.items && group.operasionalPO.items.length > 0 ? (
                                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                                    <table className="w-full text-xs text-left border-collapse">
                                      <thead>
                                        <tr className="bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-[10px] font-black uppercase">
                                          <th className="py-2 px-2 text-center w-8">No</th>
                                          <th className="py-2 px-3">Rincian Operasional</th>
                                          <th className="py-2 px-2 text-center">Qty</th>
                                          <th className="py-2 px-2 text-center">Satuan</th>
                                          <th className="py-2 px-3 text-right">Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {group.operasionalPO.items.map((it, idx) => (
                                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="py-1.5 px-2 text-center text-slate-400">{idx + 1}</td>
                                            <td className="py-1.5 px-3 font-bold text-slate-800 dark:text-slate-200">{it.details}</td>
                                            <td className="py-1.5 px-2 text-center font-semibold">{it.qty}</td>
                                            <td className="py-1.5 px-2 text-center text-slate-500">{it.unit}</td>
                                            <td className="py-1.5 px-3 text-right font-black text-amber-600 dark:text-amber-400">Rp{it.totalPrice.toLocaleString('id-ID')}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 italic">Tidak ada item operasional.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* VIEW MODE 2: TABEL DOKUMEN DETAIL */}
            {historyViewMode === 'tabel' && (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
                      <th className="py-3 px-3 text-center">No</th>
                      <th className="py-3 px-3">No. PO Harian</th>
                      <th className="py-3 px-3">Tipe & Hari</th>
                      <th className="py-3 px-4">Tanggal Pemesanan</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4 text-right">Total Nominal</th>
                      <th className="py-3 px-3 text-center">Status Transmisi</th>
                      <th className="py-3 px-3 text-center">Aksi & Gateway</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredHistoryList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          Belum ada dokumen Purchase Order Harian yang tersimpan.
                        </td>
                      </tr>
                    ) : (
                      filteredHistoryList.map((po, idx) => (
                        <tr key={po.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-black text-blue-600 dark:text-blue-400">{po.poNumber}</td>
                          <td className="py-3 px-3 font-extrabold space-y-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] inline-block ${
                              po.poType === 'Bahan Baku' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {po.poType}
                            </span>
                            <div className="text-[10px] text-slate-500 font-semibold">{po.dayLabel || 'HARI HARIAN'}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {formatDateIndo(po.date)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                            {po.supplier?.name}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-slate-100">
                            Rp{(po.totalAmount || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              po.status === 'Dikonfirmasi Supplier' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              po.status === 'Terkirim WA' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                              'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}>
                              {po.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSendWA(po)}
                                className="p-1.5 bg-green-100 hover:bg-green-200 dark:bg-green-950 dark:hover:bg-green-900 text-green-800 dark:text-green-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Kirim via WhatsApp"
                              >
                                <Icons.Send className="w-3.5 h-3.5" />
                                <span>WA</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmingPO(po);
                                  setSupplierPortalOpen(true);
                                }}
                                className="p-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Portal Konfirmasi Supplier"
                              >
                                <Icons.CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Konfirmasi</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenPrintSingle(po)}
                                className="p-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Cetak PDF"
                              >
                                <Icons.Printer className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeletePO(po.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-xl transition-all cursor-pointer"
                                title="Hapus PO"
                              >
                                <Icons.Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: SUPPLIER PORTAL CONFIRMATION SIMULATION */}
      {supplierPortalOpen && confirmingPO && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Icons.CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Portal Konfirmasi PO Online Supplier
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Simulasi persetujuan penerimaan PO oleh Pihak Koperasi / Supplier
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSupplierPortalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Nomor PO Harian:</span>
                <span className="font-black text-blue-600 dark:text-blue-400">{confirmingPO.poNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Tanggal Pemesanan:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatDateIndo(confirmingPO.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Total Nominal Pembayaran:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Rp{(confirmingPO.totalAmount || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Supplier:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{confirmingPO.supplier?.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Catatan Persetujuan / Konfirmasi Supplier:
              </label>
              <textarea
                rows={3}
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSupplierPortalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleConfirmBySupplier(confirmingPO)}
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <Icons.CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi & Setujui PO Online</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable PDF Modal */}
      <PurchaseOrderPrintModal
        po={selectedPOToPrint}
        poBundle={selectedBundleToPrint || undefined}
        isOpen={printModalOpen}
        onClose={() => {
          setPrintModalOpen(false);
          setSelectedPOToPrint(null);
          setSelectedBundleToPrint(null);
        }}
      />
    </div>
  );
};
