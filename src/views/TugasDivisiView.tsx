import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ClipboardCheck, 
  History, 
  FileSpreadsheet, 
  Printer, 
  MessageSquare, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Save, 
  Share2, 
  Edit3, 
  Eye, 
  Filter, 
  Search, 
  Upload, 
  Camera, 
  Sparkles, 
  CheckSquare, 
  AlertCircle, 
  ChevronRight, 
  ArrowLeft,
  QrCode,
  FileText,
  PhoneCall,
  Settings,
  RefreshCw,
  X,
  ExternalLink,
  Utensils,
  CalendarDays,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  DivisiTaskRecord, 
  TugasChecklistItem, 
  WhatsAppDivisiSetting, 
  TaskTemplate, 
  DivisiId 
} from '../types';
import { useFirestoreRealtime } from '../lib/useFirestoreRealtime';
import { GlobalReportHeader } from '../components/document/GlobalReportHeader';
import { GlobalReportFooter } from '../components/document/GlobalReportFooter';
import { DocumentSignatures } from '../components/document/DocumentSignatures';

interface TugasDivisiViewProps {
  onNavigate?: (path: string) => void;
  currentPath?: string;
}

export const TugasDivisiView: React.FC<TugasDivisiViewProps> = ({ currentPath = '/tugas-divisi' }) => {
  const { user } = useAuth();
  
  // Determine active sub tab based on path
  const getInitialTab = () => {
    if (currentPath.includes('/menu-harian')) return 'menu-harian';
    if (currentPath.includes('/riwayat')) return 'riwayat';
    if (currentPath.includes('/template')) return 'template';
    if (currentPath.includes('/laporan')) return 'laporan';
    if (currentPath.includes('/whatsapp')) return 'whatsapp';
    return 'hari-ini';
  };

  const [activeTab, setActiveTab] = useState<'hari-ini' | 'menu-harian' | 'riwayat' | 'template' | 'laporan' | 'whatsapp'>(getInitialTab());

  // Date state (defaults to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Core Data States
  const [records, setRecords] = useState<DivisiTaskRecord[]>([]);
  const [waSettings, setWaSettings] = useState<WhatsAppDivisiSetting[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isEditTemplateModalOpen, setIsEditTemplateModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Category Filter State for Hari Ini
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categoryTabs = [
    { id: 'all', label: 'Semua Divisi' },
    { id: 'persiapan', label: 'Persiapan' },
    { id: 'pengolahan', label: 'Pengolahan' },
    { id: 'pemorsian', label: 'Pemorsian' },
    { id: 'distribusi', label: 'Distribusi' },
    { id: 'cuci_ompreng', label: 'Cuci Ompreng' }
  ];

  // Active Selected Division for Edit Modal / PDF Print
  const [editingRecord, setEditingRecord] = useState<DivisiTaskRecord | null>(null);
  const [pdfPrintRecords, setPdfPrintRecords] = useState<DivisiTaskRecord[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  const pdfPrintRecord = pdfPrintRecords[0] || records[0] || null;

  // Menu Harian state
  const [menuHarianInput, setMenuHarianInput] = useState<string>('');

  useEffect(() => {
    if (records.length > 0) {
      const existingMenu = records.find(r => r.menuHarian)?.menuHarian || records[0]?.menuHarian || '';
      setMenuHarianInput(existingMenu);
    } else {
      setMenuHarianInput('');
    }
  }, [records]);

  const handleSaveMenuHarian = async () => {
    if (!selectedDate) return;
    try {
      const res = await fetch('/api/v1/tugas-divisi/menu-harian', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: selectedDate,
          menuHarian: menuHarianInput
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', `Menu harian tanggal ${selectedDate} berhasil disimpan.`);
        fetchTasksForDate(selectedDate);
      } else {
        showToast('error', json.message || 'Gagal menyimpan menu harian.');
      }
    } catch (err) {
      console.error('Error saving menu harian:', err);
      showToast('error', 'Terjadi kesalahan koneksi.');
    }
  };

  // Form Management System States for Menu Harian (5 Item Components)
  const [formDate, setFormDate] = useState<string>(todayStr);
  const [formKarbo, setFormKarbo] = useState<string>('Nasi Putih');
  const [formLaukHewani, setFormLaukHewani] = useState<string>('');
  const [formLaukNabati, setFormLaukNabati] = useState<string>('');
  const [formSayur, setFormSayur] = useState<string>('');
  const [formBuahExtra, setFormBuahExtra] = useState<string>('');
  const [formCatatan, setFormCatatan] = useState<string>('');
  const [formMenuCombined, setFormMenuCombined] = useState<string>('');
  const [isSavingForm, setIsSavingForm] = useState<boolean>(false);

  // Weekly / Range Menu Harian Planner States
  const [weeklyStartDate, setWeeklyStartDate] = useState<string>(todayStr);
  const [weeklyNumDays, setWeeklyNumDays] = useState<number>(7);
  const [weeklyMenuItems, setWeeklyMenuItems] = useState<Array<{ tanggal: string; menuHarian: string; isPlanned: boolean }>>([]);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState<boolean>(false);
  const [isSavingWeekly, setIsSavingWeekly] = useState<boolean>(false);

  const loadFormForDate = (dateStr: string, existingText?: string) => {
    setFormDate(dateStr);
    let text = existingText;
    if (text === undefined) {
      const found = weeklyMenuItems.find(i => i.tanggal === dateStr);
      text = found ? found.menuHarian : '';
    }
    const safeText = text || '';
    setFormMenuCombined(safeText);

    if (safeText.trim()) {
      const parts = safeText.split(',').map(s => s.trim());
      setFormKarbo(parts[0] || 'Nasi Putih');
      setFormLaukHewani(parts[1] || '');
      setFormLaukNabati(parts[2] || '');
      setFormSayur(parts[3] || '');
      setFormBuahExtra(parts[4] || '');
      setFormCatatan(parts.slice(5).join(', ') || '');
    } else {
      setFormKarbo('Nasi Putih');
      setFormLaukHewani('');
      setFormLaukNabati('');
      setFormSayur('');
      setFormBuahExtra('');
      setFormCatatan('');
    }
  };

  const handleResetForm = () => {
    setFormKarbo('Nasi Putih');
    setFormLaukHewani('');
    setFormLaukNabati('');
    setFormSayur('');
    setFormBuahExtra('');
    setFormCatatan('');
    setFormMenuCombined('');
  };

  const handleDeleteMenuHarian = async (tanggal: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus / mengosongkan menu harian untuk tanggal ${tanggal}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/tugas-divisi/menu-harian?tanggal=${tanggal}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || `Menu harian tanggal ${tanggal} berhasil dihapus.`);
        if (tanggal === selectedDate) {
          setMenuHarianInput('');
          fetchTasksForDate(selectedDate);
        }
        if (formDate === tanggal) {
          handleResetForm();
        }
        fetchWeeklyMenuRange(weeklyStartDate, weeklyNumDays);
      } else {
        showToast('error', json.message || 'Gagal menghapus menu harian.');
      }
    } catch (err) {
      console.error('Error deleting menu harian:', err);
      showToast('error', 'Terjadi kesalahan koneksi.');
    }
  };

  const handleSaveFormMenu = async () => {
    if (!formDate) {
      showToast('error', 'Pilih tanggal terlebih dahulu.');
      return;
    }

    const assembledParts = [formKarbo, formLaukHewani, formLaukNabati, formSayur, formBuahExtra, formCatatan].map(s => s.trim()).filter(Boolean);
    const targetText = formMenuCombined.trim() || assembledParts.join(', ');

    setIsSavingForm(true);
    try {
      const res = await fetch('/api/v1/tugas-divisi/menu-harian', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal: formDate, menuHarian: targetText })
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', `Menu harian tanggal ${formDate} berhasil disimpan!`);
        if (formDate === selectedDate) {
          setMenuHarianInput(targetText);
          fetchTasksForDate(selectedDate);
        }
        fetchWeeklyMenuRange(weeklyStartDate, weeklyNumDays);
      } else {
        showToast('error', json.message || 'Gagal menyimpan menu.');
      }
    } catch (err) {
      console.error('Error saving form menu:', err);
      showToast('error', 'Terjadi kesalahan koneksi.');
    } finally {
      setIsSavingForm(false);
    }
  };

  const fetchWeeklyMenuRange = async (start: string = weeklyStartDate, days: number = weeklyNumDays) => {
    setIsLoadingWeekly(true);
    try {
      const res = await fetch(`/api/v1/tugas-divisi/menu-harian-range?startDate=${start}&days=${days}`);
      const json = await res.json();
      if (json.success) {
        setWeeklyMenuItems(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching weekly menu range:', err);
    } finally {
      setIsLoadingWeekly(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'menu-harian') {
      fetchWeeklyMenuRange(weeklyStartDate, weeklyNumDays);
    }
  }, [activeTab, weeklyStartDate, weeklyNumDays]);

  const handleWeeklyItemChange = (index: number, val: string) => {
    const copy = [...weeklyMenuItems];
    copy[index] = {
      ...copy[index],
      menuHarian: val,
      isPlanned: Boolean(val && val.trim() !== '')
    };
    setWeeklyMenuItems(copy);
  };

  const handleSaveSingleWeeklyMenu = async (tanggal: string, menuHarian: string) => {
    try {
      const res = await fetch('/api/v1/tugas-divisi/menu-harian', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal, menuHarian })
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', `Menu harian tanggal ${tanggal} berhasil disimpan!`);
        if (tanggal === selectedDate) {
          setMenuHarianInput(menuHarian);
          fetchTasksForDate(selectedDate);
        }
        fetchWeeklyMenuRange(weeklyStartDate, weeklyNumDays);
      } else {
        showToast('error', json.message || 'Gagal menyimpan menu.');
      }
    } catch (err) {
      console.error('Error saving single weekly menu:', err);
      showToast('error', 'Terjadi kesalahan koneksi.');
    }
  };

  const handleSaveAllWeeklyMenus = async () => {
    setIsSavingWeekly(true);
    try {
      const res = await fetch('/api/v1/tugas-divisi/menu-harian-bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: weeklyMenuItems.map(i => ({ tanggal: i.tanggal, menuHarian: i.menuHarian })) })
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Perencanaan menu harian berhasil disimpan!');
        fetchTasksForDate(selectedDate);
        fetchWeeklyMenuRange(weeklyStartDate, weeklyNumDays);
      } else {
        showToast('error', json.message || 'Gagal menyimpan perencanaan menu.');
      }
    } catch (err) {
      console.error('Error saving weekly menus:', err);
      showToast('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setIsSavingWeekly(false);
    }
  };

  const menuPresets = [
    { label: '🍗 Paket Ayam Lengkuas + Tahu', karbo: 'Nasi Putih', laukHewani: 'Ayam Goreng Lengkuas', laukNabati: 'Tahu Goreng Crispy', sayur: 'Sayur Sop Bening', buahExtra: 'Pisang Ambon', catatan: 'Sambal Terpisah', text: 'Nasi Putih, Ayam Goreng Lengkuas, Tahu Goreng Crispy, Sayur Sop Bening, Pisang Ambon' },
    { label: '🐟 Paket Ikan Bakar + Tempe', karbo: 'Nasi Putih', laukHewani: 'Ikan Gurame Bakar Kecap', laukNabati: 'Tempe Bacem Gurih', sayur: 'Tumis Kangkung Belacan', buahExtra: 'Buah Jeruk Manis', catatan: 'Kerupuk', text: 'Nasi Putih, Ikan Gurame Bakar Kecap, Tempe Bacem Gurih, Tumis Kangkung Belacan, Buah Jeruk Manis' },
    { label: '🥩 Paket Rendang + Perkedel', karbo: 'Nasi Putih', laukHewani: 'Rendang Daging Sapi', laukNabati: 'Perkedel Kentang', sayur: 'Sayur Nangka Gulai', buahExtra: 'Buah Semangka Segar', catatan: 'Kuah Gulai Terpisah', text: 'Nasi Putih, Rendang Daging Sapi, Perkedel Kentang, Sayur Nangka Gulai, Buah Semangka Segar' },
    { label: '🍳 Paket Telur Balado + Tahu', karbo: 'Nasi Putih', laukHewani: 'Telur Balado Pedas Manis', laukNabati: 'Tahu Bacem Kukus', sayur: 'Sayur Asem Jakarta', buahExtra: 'Buah Pisang + Susu UHT', catatan: 'Sambal Terpisah', text: 'Nasi Putih, Telur Balado Pedas Manis, Tahu Bacem Kukus, Sayur Asem Jakarta, Buah Pisang + Susu UHT' },
    { label: '🍲 Paket Soto Ayam + Tempe', karbo: 'Nasi Putih', laukHewani: 'Soto Ayam Lamongan', laukNabati: 'Tempe Goreng Tepung', sayur: 'Tauge & Kol Kuah Soto', buahExtra: 'Buah Melon + Puding', catatan: 'Jeruk Nipis & Koya', text: 'Nasi Putih, Soto Ayam Lamongan, Tempe Goreng Tepung, Tauge & Kol Kuah Soto, Buah Melon + Puding' },
    { label: '🍗 Paket Semur Ayam + Tahu', karbo: 'Nasi Putih', laukHewani: 'Semur Ayam Kecap', laukNabati: 'Tahu Isi Sayuran', sayur: 'Capcay Kuah Kental', buahExtra: 'Buah Apel Merah', catatan: 'Kerupuk Udang', text: 'Nasi Putih, Semur Ayam Kecap, Tahu Isi Sayuran, Capcay Kuah Kental, Buah Apel Merah' },
    { label: '🐟 Paket Ikan Fillet + Bakwan', karbo: 'Nasi Putih', laukHewani: 'Ikan Fillet Goreng Tepung', laukNabati: 'Bakwan Jagung Manis', sayur: 'Tumis Buncis Wortel', buahExtra: 'Buah Jeruk + Susu', catatan: 'Saus Mayones', text: 'Nasi Putih, Ikan Fillet Goreng Tepung, Bakwan Jagung Manis, Tumis Buncis Wortel, Buah Jeruk + Susu' },
  ];

  const handleApplyPresetToForm = (preset: typeof menuPresets[0]) => {
    setFormKarbo(preset.karbo);
    setFormLaukHewani(preset.laukHewani);
    setFormLaukNabati(preset.laukNabati);
    setFormSayur(preset.sayur);
    setFormBuahExtra(preset.buahExtra);
    setFormCatatan(preset.catatan || '');
    setFormMenuCombined(preset.text);
  };

  const handleAutoFillWeeklyRotation = () => {
    const copy = [...weeklyMenuItems];
    copy.forEach((item, idx) => {
      if (!item.menuHarian || item.menuHarian.trim() === '') {
        const preset = menuPresets[idx % menuPresets.length];
        item.menuHarian = preset.text;
        item.isPlanned = true;
      }
    });
    setWeeklyMenuItems(copy);
    showToast('success', 'Form berhasil diisi dengan preset menu bergilir.');
  };

  const exportWeeklyMenuPDF = () => {
    if (weeklyMenuItems.length === 0) return;
    const doc = new jsPDF('portrait');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PERENCANAAN MENU HARIAN DAPUR SPPG', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${weeklyMenuItems[0]?.tanggal} s/d ${weeklyMenuItems[weeklyMenuItems.length - 1]?.tanggal}`, 14, 22);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 27);

    const tableColumn = ['No', 'Hari & Tanggal', 'Rincian Menu Harian', 'Status Planning'];
    const tableRows = weeklyMenuItems.map((item, idx) => {
      const dt = new Date(item.tanggal);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayName = days[dt.getDay()];
      const formattedDate = `${dayName}, ${dt.getDate()} ${dt.toLocaleString('id-ID', { month: 'short' })} ${dt.getFullYear()}`;
      return [
        idx + 1,
        formattedDate,
        item.menuHarian || '(Belum Diisi)',
        item.isPlanned ? 'TERISI' : 'BELUM DIISI'
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 32,
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 45, fontStyle: 'bold' },
        2: { cellWidth: 100 },
        3: { cellWidth: 30, halign: 'center' }
      }
    });

    doc.save(`Perencanaan_Menu_Harian_${weeklyStartDate}.pdf`);
  };

  // Bulk Selection States
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (availableRecords: DivisiTaskRecord[]) => {
    const availableIds = availableRecords.map(r => r.id);
    const isAllSelected = availableIds.length > 0 && availableIds.every(id => selectedRecordIds.includes(id));

    if (isAllSelected) {
      setSelectedRecordIds(prev => prev.filter(id => !availableIds.includes(id)));
    } else {
      setSelectedRecordIds(prev => Array.from(new Set([...prev, ...availableIds])));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecordIds.length === 0) return;
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedRecordIds.length} tugas divisi yang dipilih?`)) {
      return;
    }

    try {
      let successCount = 0;
      for (const id of selectedRecordIds) {
        const res = await fetch(`/api/v1/tugas-divisi/record/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) successCount++;
      }

      showToast('success', `Berhasil menghapus ${successCount} tugas divisi.`);
      setSelectedRecordIds([]);
      fetchTasksForDate(selectedDate);
      if (activeTab === 'riwayat') {
        fetchHistory();
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      showToast('error', 'Terjadi kesalahan saat menghapus data massal.');
    }
  };

  const handleBulkExportPdf = () => {
    if (selectedRecordIds.length === 0) return;
    
    const allAvailable = [...records, ...historyRecords];
    const selectedRecords = allAvailable.filter(r => selectedRecordIds.includes(r.id));
    
    const uniqueRecordsMap = new Map<string, DivisiTaskRecord>();
    selectedRecords.forEach(r => uniqueRecordsMap.set(r.id, r));
    const uniqueSelected = Array.from(uniqueRecordsMap.values());

    if (uniqueSelected.length === 0) {
      showToast('error', 'Tidak ada data tugas terpilih yang ditemukan.');
      return;
    }

    setPdfPrintRecords(uniqueSelected);
    setIsPdfModalOpen(true);
  };

  // Create Task Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createTanggal, setCreateTanggal] = useState<string>(todayStr);
  const [createDivisiId, setCreateDivisiId] = useState<DivisiId>('persiapan');
  const [createPenanggungJawab, setCreatePenanggungJawab] = useState<string>('Budi Santoso, S.ST');
  const [createShift, setCreateShift] = useState<string>('Shift 1 (Pagi)');
  const [createJumlahProduksi, setCreateJumlahProduksi] = useState<number>(2500);
  const [createKeterangan, setCreateKeterangan] = useState<string>('Pemeriksaan & pelaksanaan operasional divisi.');
  const [createMenuHarian, setCreateMenuHarian] = useState<string>('Nasi, Ayam Goreng Lengkuas, Sayur Sop Bening, Pisang Ambon');
  const [createChecklists, setCreateChecklists] = useState<string[]>([]);
  const [newChecklistInput, setNewChecklistInput] = useState<string>('');

  const defaultPJMap: Record<string, string> = {
    persiapan: 'Budi Santoso, S.ST',
    pengolahan: 'Chef Hendra Wijaya',
    pemorsian: 'Siti Rahmawati',
    distribusi: 'Rudi Hermawan',
    cuci_ompreng: 'Dewi Sartika'
  };

  const defaultDivisiNamaMap: Record<string, string> = {
    persiapan: 'Divisi Persiapan',
    pengolahan: 'Divisi Pengolahan',
    pemorsian: 'Divisi Pemorsian',
    distribusi: 'Divisi Distribusi',
    cuci_ompreng: 'Divisi Cuci Ompreng'
  };

  const openCreateModal = () => {
    setCreateTanggal(selectedDate || todayStr);
    setCreateDivisiId('persiapan');
    setCreatePenanggungJawab(defaultPJMap['persiapan']);
    setCreateShift('Shift 1 (Pagi)');
    setCreateJumlahProduksi(2500);
    setCreateKeterangan('Pemeriksaan & pelaksanaan operasional divisi.');
    setCreateMenuHarian(menuHarianInput || 'Nasi, Ayam Goreng Lengkuas, Sayur Sop Bening, Pisang Ambon');
    
    const tpl = templates.find(t => t.divisiId === 'persiapan');
    setCreateChecklists(tpl ? [...tpl.checklists] : [
      'Pemeriksaan bahan baku',
      'Pemeriksaan kualitas sayur',
      'Menimbang bahan',
      'Menyiapkan alat'
    ]);
    setNewChecklistInput('');
    setIsCreateModalOpen(true);
  };

  const handleDivisiChangeInCreate = (divId: DivisiId) => {
    setCreateDivisiId(divId);
    setCreatePenanggungJawab(defaultPJMap[divId] || 'Penanggung Jawab Divisi');
    const tpl = templates.find(t => t.divisiId === divId);
    if (tpl) {
      setCreateChecklists([...tpl.checklists]);
    }
  };

  const handleAddChecklistInCreate = () => {
    if (newChecklistInput.trim()) {
      setCreateChecklists(prev => [...prev, newChecklistInput.trim()]);
      setNewChecklistInput('');
    }
  };

  const handleRemoveChecklistInCreate = (index: number) => {
    setCreateChecklists(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateTaskSubmit = async () => {
    if (!createTanggal || !createDivisiId || !createPenanggungJawab) {
      showToast('error', 'Tanggal, Divisi, dan Penanggung Jawab wajib diisi.');
      return;
    }

    const checklistsToSave: TugasChecklistItem[] = createChecklists.map((text, idx) => ({
      id: `CHK-${createDivisiId}-${Date.now()}-${idx + 1}`,
      text,
      completed: false,
      status: 'Belum Dikerjakan'
    }));

    const newTaskRecord: DivisiTaskRecord = {
      id: `TASK-${createTanggal}-${createDivisiId}-${Date.now()}`,
      tanggal: createTanggal,
      divisiId: createDivisiId,
      divisiNama: defaultDivisiNamaMap[createDivisiId] || createDivisiId,
      penanggungJawab: createPenanggungJawab,
      shift: createShift,
      statusProduksi: 'Dalam Persiapan',
      jumlahProduksi: Number(createJumlahProduksi) || 2500,
      keterangan: createKeterangan,
      menuHarian: createMenuHarian,
      checklists: checklistsToSave,
      updatedAt: new Date().toISOString(),
      createdBy: user?.nama || 'Petugas SPPG'
    };

    await handleSaveRecord(newTaskRecord);
    if (createTanggal) {
      setSelectedDate(createTanggal);
    }
    setIsCreateModalOpen(false);
  };

  // Filter states for Riwayat Tugas
  const [filterTanggal, setFilterTanggal] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));
  const [filterDivisi, setFilterDivisi] = useState<string>('semua');
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [historyRecords, setHistoryRecords] = useState<DivisiTaskRecord[]>([]);

  // Role permissions
  const userRole = user?.role || 'Viewer';
  const canEdit = ['Admin Penuh', 'Super Admin', 'Admin', 'Supervisor', 'Operator', 'Staff Kantor', 'Distribusi', 'Staff'].includes(userRole);
  const canManageTemplate = ['Admin Penuh', 'Super Admin', 'Admin'].includes(userRole);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Date Navigation Helpers
  const goToPrevDate = () => {
    const d = new Date(selectedDate);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    }
  };

  const goToNextDate = () => {
    const d = new Date(selectedDate);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    }
  };

  // Fetch Tasks for Selected Date
  const fetchTasksForDate = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/tugas-divisi/by-date?tanggal=${dateStr}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch WhatsApp settings
  const fetchWaSettings = async () => {
    try {
      const res = await fetch('/api/v1/tugas-divisi/wa-settings');
      const json = await res.json();
      if (json.success) {
        setWaSettings(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch WA settings:', err);
    }
  };

  // Fetch Templates
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/v1/tugas-divisi/templates');
      const json = await res.json();
      if (json.success) {
        setTemplates(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  // Handle Save Template
  const handleSaveTemplate = async (templateToSave: TaskTemplate) => {
    try {
      const res = await fetch('/api/v1/tugas-divisi/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateToSave)
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Template tugas divisi berhasil disimpan.');
        fetchTemplates();
        setIsEditTemplateModalOpen(false);
        setEditingTemplate(null);
      } else {
        showToast('error', json.message || 'Gagal menyimpan template.');
      }
    } catch (err) {
      console.error('Save template error:', err);
      showToast('error', 'Terjadi kesalahan koneksi saat menyimpan template.');
    }
  };

  // Fetch Task History
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        bulan: filterMonth,
        tahun: filterYear,
        divisi: filterDivisi,
        status: filterStatus,
        search: searchQuery
      });
      if (filterTanggal) {
        params.append('tanggal', filterTanggal);
      }
      const res = await fetch(`/api/v1/tugas-divisi/history?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setHistoryRecords(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Realtime Firestore synchronization
  const { data: realtimeTasks } = useFirestoreRealtime<DivisiTaskRecord>('divisiTaskRecords');
  const { data: realtimeTemplates } = useFirestoreRealtime<TaskTemplate>('taskTemplates');

  useEffect(() => {
    if (realtimeTasks && realtimeTasks.length > 0) {
      fetchTasksForDate(selectedDate);
      if (activeTab === 'riwayat') {
        fetchHistory();
      }
    }
  }, [realtimeTasks]);

  useEffect(() => {
    if (realtimeTemplates && realtimeTemplates.length > 0) {
      setTemplates(realtimeTemplates);
    }
  }, [realtimeTemplates]);

  useEffect(() => {
    fetchTasksForDate(selectedDate);
    fetchWaSettings();
    fetchTemplates();
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === 'riwayat') {
      fetchHistory();
    }
  }, [activeTab, filterTanggal, filterMonth, filterYear, filterDivisi, filterStatus, searchQuery]);

  // Handle Save Division Task Record Updates
  const handleSaveRecord = async (recordToSave: DivisiTaskRecord) => {
    try {
      const res = await fetch('/api/v1/tugas-divisi/record', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...recordToSave,
          createdBy: user?.nama || 'Petugas SPPG'
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Tugas divisi berhasil diperbarui.');
        const targetDate = recordToSave.tanggal || selectedDate;
        if (targetDate !== selectedDate) {
          setSelectedDate(targetDate);
        } else {
          fetchTasksForDate(targetDate);
        }
        setIsEditModalOpen(false);
      } else {
        showToast('error', json.message || 'Gagal menyimpan tugas divisi.');
      }
    } catch (err) {
      console.error('Save record error:', err);
      showToast('error', 'Terjadi kesalahan koneksi saat menyimpan.');
    }
  };

  // Handle Delete Division Task Record
  const handleDeleteRecord = async (record: DivisiTaskRecord) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus tugas ${record.divisiNama} tanggal ${record.tanggal}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/tugas-divisi/record/${record.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Tugas divisi berhasil dihapus.');
        fetchTasksForDate(selectedDate);
        if (activeTab === 'riwayat') {
          fetchHistory();
        }
        if (editingRecord?.id === record.id) {
          setIsEditModalOpen(false);
        }
      } else {
        showToast('error', json.message || 'Gagal menghapus tugas divisi.');
      }
    } catch (err) {
      console.error('Delete record error:', err);
      showToast('error', 'Terjadi kesalahan koneksi saat menghapus.');
    }
  };

  // Handle Share WhatsApp
  const handleShareWhatsApp = (record: DivisiTaskRecord) => {
    const setting = waSettings.find(s => s.divisiId === record.divisiId);
    const targetPhone = setting ? setting.nomorWa : '';

    const currentMenu = record.menuHarian || menuHarianInput || '-';

    let taskListFormatted = record.checklists
      .map((item, idx) => `${idx + 1}. ${item.text}`)
      .join('\n');

    const messageText = `*TUGAS DIVISI SPPG*

Tanggal: ${record.tanggal}
Divisi: ${record.divisiNama}
PJ: ${record.penanggungJawab}
Menu Harian: ${currentMenu}

*KETERANGAN TUGAS DIVISI:*
${record.keterangan ? `${record.keterangan}\n` : ''}${taskListFormatted}`;

    const encodedText = encodeURIComponent(messageText);
    const waUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  // Handle Save WA Settings
  const handleSaveWaSettings = async (updatedSettings: WhatsAppDivisiSetting[]) => {
    try {
      const res = await fetch('/api/v1/tugas-divisi/wa-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Nomor WhatsApp Divisi berhasil disimpan.');
        setWaSettings(json.data);
      } else {
        showToast('error', json.message);
      }
    } catch (err) {
      showToast('error', 'Gagal menyimpan kontak WhatsApp.');
    }
  };

  // Helper calculation for overall today summary
  const totalDivisions = records.length;
  const overallCompletedCount = records.reduce((acc, r) => acc + r.checklists.filter(c => c.completed).length, 0);
  const overallTotalChecklists = records.reduce((acc, r) => acc + r.checklists.length, 0);
  const overallProgress = overallTotalChecklists > 0 ? Math.round((overallCompletedCount / overallTotalChecklists) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6 font-sans antialiased text-slate-800 dark:text-slate-100">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-xl flex items-center gap-3 animate-slide-up transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-500/95 text-white border-emerald-400' 
            : 'bg-rose-500/95 text-white border-rose-400'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header Banner - Apple Minimal Premium */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <ClipboardCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Modul Kelola Operasional SPPG</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Tugas Divisi Dapur SPPG
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Kelola keterangan tugas harian 5 divisi utama (Persiapan, Pengolahan, Pemorsian, Distribusi, Cuci Ompreng) lengkap dengan input menu harian, laporan PDF, dan integrasi WhatsApp.
            </p>
          </div>

          {/* Quick Stat Pill & Create Task Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={openCreateModal}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Buat Tugas Divisi</span>
            </button>

            <div className="flex items-center gap-3.5 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 sm:p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 max-w-xs">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                <Utensils className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Menu Harian Hari Ini
                </div>
                <div className="text-[11px] text-amber-800/80 dark:text-amber-400 font-medium truncate">
                  {menuHarianInput || 'Belum diisi'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('hari-ini')}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'hari-ini'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-500'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tugas Hari Ini</span>
          </button>

          <button
            onClick={() => setActiveTab('menu-harian')}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'menu-harian'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20 ring-1 ring-amber-500'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Menu Harian (1 Minggu)</span>
          </button>

          <button
            onClick={() => setActiveTab('riwayat')}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'riwayat'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-500'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Tugas</span>
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'template'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-500'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Template Tugas</span>
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'laporan'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-500'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Laporan PDF</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-500'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Divisi</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TUGAS HARI INI */}
      {activeTab === 'hari-ini' && (
        <div className="space-y-6">
          {/* Date Picker & Production Global Info Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Pilih Tanggal Produksi
                  </label>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <button
                      type="button"
                      onClick={goToPrevDate}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                      title="Tanggal Sebelumnya"
                    >
                      &larr;
                    </button>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={goToNextDate}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                      title="Tanggal Berikutnya"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>
                <div className="hidden lg:block pl-3 border-l border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">
                    {(() => {
                      try {
                        if (!selectedDate) return '';
                        const parts = selectedDate.split('-');
                        if (parts.length === 3) {
                          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                          return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                        }
                        return selectedDate;
                      } catch (e) {
                        return selectedDate;
                      }
                    })()}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {selectedDate === todayStr ? '● Tanggal Hari Ini' : '○ Tanggal Terpilih'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={openCreateModal}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Tugas Divisi</span>
                </button>
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Hari Ini ({todayStr})
                </button>
                <button
                  onClick={() => fetchTasksForDate(selectedDate)}
                  className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* General Production Settings for this Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold text-[10px] block">KOORDINATOR UTAMA</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-500" />
                  Budi Santoso, S.ST
                </span>
              </div>

              <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 font-semibold text-[10px] block">MENU UTAMA HARI INI</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {menuHarianInput || 'Nasi, Ayam Lengkuas, Sayur Sop, Pisang'}
                </span>
              </div>
            </div>

            {/* Dedicated Input Menu Harian Form Block */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-gradient-to-r from-amber-50/90 to-orange-50/90 dark:from-slate-800/90 dark:to-slate-800/60 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                      <Utensils className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        Input Menu Harian ({selectedDate})
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Isikan menu harian yang berlaku untuk seluruh divisi pada tanggal terpilih
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveMenuHarian}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Menu Harian</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={menuHarianInput}
                    onChange={(e) => setMenuHarianInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveMenuHarian();
                      }
                    }}
                    placeholder="Contoh: Nasi Putih, Ayam Goreng Lengkuas, Sayur Sop Bening, Buah Pisang"
                    className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CATEGORY FILTER TAB BUTTONS & BULK SELECT ALL */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-x-auto pb-1 no-scrollbar">
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 w-full sm:w-auto overflow-x-auto no-scrollbar">
              <div className="px-2.5 py-1 text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider shrink-0">
                <Filter className="w-3.5 h-3.5 text-blue-500" />
                <span>Kategori:</span>
              </div>
              {categoryTabs.map((tab) => {
                const isActive = selectedCategory === tab.id;
                const count = tab.id === 'all' 
                  ? records.length 
                  : records.filter(r => r.divisiId === tab.id).length;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`min-h-[40px] px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-[0.97] cursor-pointer whitespace-nowrap shrink-0 touch-manipulation ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/70'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {records.length > 0 && (
              <button
                onClick={() => {
                  const filtered = selectedCategory === 'all' 
                    ? records 
                    : records.filter(r => r.divisiId === selectedCategory);
                  toggleSelectAll(filtered);
                }}
                className="min-h-[40px] px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.97] border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shrink-0 touch-manipulation"
              >
                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>
                  {(() => {
                    const filtered = selectedCategory === 'all' ? records : records.filter(r => r.divisiId === selectedCategory);
                    const isAll = filtered.length > 0 && filtered.every(r => selectedRecordIds.includes(r.id));
                    return isAll ? 'Batal Pilih Semua' : 'Pilih Semua Tugas';
                  })()}
                </span>
              </button>
            )}
          </div>

          {/* 5 DIVISION CARDS GRID */}
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs font-semibold">Memuat data tugas divisi...</span>
            </div>
          ) : (() => {
            if (records.length === 0) {
              return (
                <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[24px] p-8 space-y-4">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/60 rounded-2xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
                    <ClipboardCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                      Belum Ada Tugas Divisi
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                      Belum ada data tugas divisi yang dibuat untuk tanggal <span className="font-bold text-slate-700 dark:text-slate-300">{selectedDate}</span>. Klik tombol di bawah untuk menambahkan tugas divisi.
                    </p>
                  </div>
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Tugas Divisi Baru</span>
                  </button>
                </div>
              );
            }

            const filteredRecords = selectedCategory === 'all' 
              ? records 
              : records.filter(r => r.divisiId === selectedCategory);

            if (filteredRecords.length === 0) {
              return (
                <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[24px] p-8 space-y-3">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                    <Filter className="w-6 h-6 text-blue-500" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Tidak Ada Tugas untuk Divisi Ini
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Tidak ada tugas untuk kategori &quot;{categoryTabs.find(t => t.id === selectedCategory)?.label}&quot; pada tanggal {selectedDate}.
                  </p>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="mt-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl hover:bg-blue-100 transition cursor-pointer"
                  >
                    Tampilkan Semua Divisi
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecords.map((record) => {
                  const isSelected = selectedRecordIds.includes(record.id);

                  return (
                    <div
                      key={record.id}
                      className={`bg-white dark:bg-slate-900 border rounded-[24px] p-6 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-5 ${
                        isSelected 
                          ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 dark:ring-blue-500/20 bg-blue-50/10 dark:bg-blue-950/10' 
                          : 'border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                    {/* Division Header */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <label className="flex items-start gap-3 cursor-pointer group p-1 -m-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRecord(record.id)}
                            className="mt-1 w-5 h-5 rounded-md border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                            title="Pilih tugas ini"
                          />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                              {record.divisiId.replace('_', ' ')}
                            </span>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                              {record.divisiNama}
                            </h3>
                          </div>
                        </label>
                      </div>

                      {/* Penanggung Jawab */}
                      <div className="text-xs space-y-1 text-slate-500 dark:text-slate-400 pt-1">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>PJ: <strong className="text-slate-700 dark:text-slate-300">{record.penanggungJawab}</strong></span>
                        </div>
                      </div>

                      {/* Menu Harian Badge */}
                      <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                          <Utensils className="w-3 h-3" />
                          <span>MENU HARIAN</span>
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                          {record.menuHarian || menuHarianInput || '-'}
                        </span>
                      </div>
                    </div>

                    {/* Keterangan Tugas Divisi */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        KETERANGAN TUGAS DIVISI
                      </span>
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                        {record.keterangan && (
                          <p className="text-slate-700 dark:text-slate-300 font-medium pb-1 border-b border-slate-200/50 dark:border-slate-700/50">
                            {record.keterangan}
                          </p>
                        )}
                        {record.checklists.length > 0 ? (
                          <ul className="space-y-1 pt-0.5">
                            {record.checklists.map((chk, idx) => (
                              <li key={chk.id || idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-300 leading-snug">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                <span>{chk.text}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-400 italic text-[11px]">Belum ada rincian tugas.</p>
                        )}
                      </div>
                    </div>

                    {/* Card Action Buttons (Touch-Optimized Grid) */}
                    <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => {
                          setEditingRecord(JSON.parse(JSON.stringify(record)));
                          setIsEditModalOpen(true);
                        }}
                        className="min-h-[44px] sm:min-h-[38px] py-2.5 px-3 sm:py-2 sm:px-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs active:scale-[0.97] cursor-pointer touch-manipulation"
                        title="Detail & Update Checklist"
                      >
                        <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        <span>Detail</span>
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(record)}
                        className="min-h-[44px] sm:min-h-[38px] py-2.5 px-3 sm:py-2 sm:px-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs active:scale-[0.97] cursor-pointer touch-manipulation"
                        title="Share Ke WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        <span>Share</span>
                      </button>

                      <button
                        onClick={() => {
                          setPdfPrintRecords([record]);
                          setIsPdfModalOpen(true);
                        }}
                        className="min-h-[44px] sm:min-h-[38px] py-2.5 px-3 sm:py-2 sm:px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.97] cursor-pointer touch-manipulation"
                        title="Export / Cetak PDF"
                      >
                        <Printer className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => handleDeleteRecord(record)}
                        className="min-h-[44px] sm:min-h-[38px] py-2.5 px-3 sm:py-2 sm:px-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 text-xs sm:text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.97] cursor-pointer touch-manipulation"
                        title="Hapus Tugas Divisi"
                      >
                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            );
          })()}
        </div>
      )}

      {/* TAB MENU HARIAN (SISTEM FORM PENGISIAN, EDIT & HAPUS BERDASARKAN TANGGAL) */}
      {activeTab === 'menu-harian' && (
        <div className="space-y-6">
          {/* SECTION 1: DEDICATED FORM PENGISIAN & EDIT MENU HARIAN */}
          <div className="bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-amber-900/50 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                  <Utensils className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Form Pengisian & Edit Menu Harian
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Form Sistem
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Pilih tanggal, kelola dan edit atau hapus menu harian secara detail dan presisi. Menu otomatis diperbarui pada tugas divisi tanggal terkait.
                  </p>
                </div>
              </div>

              {/* Date Selector for Form */}
              <div className="flex flex-wrap items-center gap-2.5 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/60 dark:border-amber-800/60">
                <CalendarDays className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Pilih Tanggal:</span>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => loadFormForDate(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => loadFormForDate(todayStr)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                      formDate === todayStr 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => {
                      const tom = new Date();
                      tom.setDate(tom.getDate() + 1);
                      loadFormForDate(tom.toISOString().split('T')[0]);
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded-lg transition cursor-pointer"
                  >
                    Besok
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Presets Selector Bar */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Rekomendasi Paket Menu Bergizi SPPG:</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {menuPresets.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleApplyPresetToForm(preset)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields Inputs Grid - 5 Distinct Menu Items + Notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>1. Karbohidrat / Pokok</span>
                  <span className="text-[10px] text-amber-600 font-mono">Item 1</span>
                </label>
                <input
                  type="text"
                  value={formKarbo}
                  onChange={(e) => setFormKarbo(e.target.value)}
                  placeholder="Nasi Putih, Nasi Kuning, Kentang..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>2. Lauk Hewani</span>
                  <span className="text-[10px] text-amber-600 font-mono">Item 2</span>
                </label>
                <input
                  type="text"
                  value={formLaukHewani}
                  onChange={(e) => setFormLaukHewani(e.target.value)}
                  placeholder="Ayam Goreng, Ikan Bakar, Rendang..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>3. Lauk Nabati</span>
                  <span className="text-[10px] text-amber-600 font-mono">Item 3</span>
                </label>
                <input
                  type="text"
                  value={formLaukNabati}
                  onChange={(e) => setFormLaukNabati(e.target.value)}
                  placeholder="Tahu Crispy, Tempe Bacem, Perkedel..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>4. Sayur / Sup</span>
                  <span className="text-[10px] text-amber-600 font-mono">Item 4</span>
                </label>
                <input
                  type="text"
                  value={formSayur}
                  onChange={(e) => setFormSayur(e.target.value)}
                  placeholder="Sayur Sop Bening, Capcay, Kangkung..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>5. Buah / Susu / Extra</span>
                  <span className="text-[10px] text-amber-600 font-mono">Item 5</span>
                </label>
                <input
                  type="text"
                  value={formBuahExtra}
                  onChange={(e) => setFormBuahExtra(e.target.value)}
                  placeholder="Pisang Ambon, Buah Jeruk, Susu UHT..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Optional Notes / Catatan Tambahan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Catatan / Keterangan Khusus (Opsional):
              </label>
              <input
                type="text"
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
                placeholder="Contoh: Sambal terpisah, ekstra kerupuk udang, porsi khusus..."
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Combined Result Area / Custom Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pratinjau Teks Menu Harian Lengkap (Tanggal: <span className="text-amber-600 dark:text-amber-400 font-mono">{formDate}</span>):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const combined = [formKarbo, formLaukHewani, formLaukNabati, formSayur, formBuahExtra, formCatatan].map(s => s.trim()).filter(Boolean).join(', ');
                    setFormMenuCombined(combined);
                  }}
                  className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Atur Ulang Teks dari 5 Item Di Atas</span>
                </button>
              </div>

              <textarea
                rows={2}
                value={formMenuCombined || [formKarbo, formLaukHewani, formLaukNabati, formSayur, formBuahExtra, formCatatan].map(s => s.trim()).filter(Boolean).join(', ')}
                onChange={(e) => setFormMenuCombined(e.target.value)}
                placeholder="Rincian 5 item menu harian akan digabung otomatis di sini..."
                className="w-full px-3.5 py-2.5 bg-amber-50/40 dark:bg-slate-950 border border-amber-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Form Action Controls: SIMPAN, HAPUS, RESET */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reset Form</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteMenuHarian(formDate)}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/80 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Menu Tanggal Ini</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveFormMenu}
                disabled={isSavingForm}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {isSavingForm ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Simpan / Update Menu ({formDate})</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: JADWAL & DAFTAR PERENCANAAN MULTI-DAY */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <span>Daftar & Jadwal Perencanaan Menu Harian</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tinjau dan kelola rincian menu konsumsi per hari. Klik <span className="font-semibold text-amber-600">Edit di Form</span> untuk mengubah di form atas, atau klik <span className="font-semibold text-rose-600">Hapus</span> untuk mengosongkan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAutoFillWeeklyRotation}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Auto-Isi Rotasi</span>
                </button>

                <button
                  onClick={exportWeeklyMenuPDF}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-500" />
                  <span>Cetak PDF</span>
                </button>

                <button
                  onClick={handleSaveAllWeeklyMenus}
                  disabled={isSavingWeekly}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingWeekly ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan Semua ({weeklyMenuItems.length} Hari)</span>
                </button>
              </div>
            </div>

            {/* Range Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Mulai:</span>
                  <input
                    type="date"
                    value={weeklyStartDate}
                    onChange={(e) => setWeeklyStartDate(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Durasi:</span>
                  <select
                    value={weeklyNumDays}
                    onChange={(e) => setWeeklyNumDays(Number(e.target.value))}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value={7}>7 Hari (1 Minggu)</option>
                    <option value={10}>10 Hari</option>
                    <option value={14}>14 Hari (2 Minggu)</option>
                    <option value={30}>30 Hari (1 Bulan)</option>
                  </select>
                </div>
              </div>

              {/* Range Quick Shortcuts */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => {
                    setWeeklyStartDate(todayStr);
                    setWeeklyNumDays(7);
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded-lg transition cursor-pointer shrink-0"
                >
                  Minggu Ini
                </button>

                <button
                  onClick={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    setWeeklyStartDate(nextWeek.toISOString().split('T')[0]);
                    setWeeklyNumDays(7);
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded-lg transition cursor-pointer shrink-0"
                >
                  Minggu Depan
                </button>
              </div>
            </div>

            {/* List / Grid of Days for Menu Planning */}
            {isLoadingWeekly ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center">
                <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Memuat data perencanaan menu harian...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {weeklyMenuItems.map((item, idx) => {
                  const dt = new Date(item.tanggal);
                  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                  const dayName = days[dt.getDay()];
                  const formattedDate = `${dayName}, ${dt.getDate()} ${dt.toLocaleString('id-ID', { month: 'long' })} ${dt.getFullYear()}`;

                  const isToday = item.tanggal === todayStr;
                  const isSelectedInForm = item.tanggal === formDate;
                  const dateDiffDays = Math.round((new Date(item.tanggal).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24));

                  let relativeTag = '';
                  if (isToday) relativeTag = 'Hari Ini';
                  else if (dateDiffDays === 1) relativeTag = 'Besok';
                  else if (dateDiffDays === 2) relativeTag = 'Lusa';
                  else if (dateDiffDays > 2) relativeTag = `+${dateDiffDays} Hari`;
                  else if (dateDiffDays < 0) relativeTag = `${dateDiffDays} Hari`;

                  return (
                    <div
                      key={item.tanggal}
                      className={`bg-white dark:bg-slate-900 border transition-all rounded-2xl p-5 shadow-2xs space-y-3 ${
                        isSelectedInForm
                          ? 'ring-2 ring-amber-500 border-amber-500/80 dark:border-amber-500/80 bg-amber-50/20'
                          : isToday
                          ? 'ring-1 ring-amber-500/60 border-amber-400 dark:border-amber-700'
                          : item.isPlanned
                          ? 'border-slate-200 dark:border-slate-800'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/30'
                      }`}
                    >
                      {/* Item Day Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isToday
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {formattedDate}
                              </span>
                              {relativeTag && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  isToday
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}>
                                  {relativeTag}
                                </span>
                              )}
                              {isSelectedInForm && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white">
                                  Aktif di Form
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {item.tanggal}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {item.isPlanned ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Terisi</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span>Kosong</span>
                            </span>
                          )}

                          <button
                            onClick={() => {
                              loadFormForDate(item.tanggal, item.menuHarian);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                            title="Edit menu harian tanggal ini di form atas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit di Form</span>
                          </button>

                          <button
                            onClick={() => handleSaveSingleWeeklyMenu(item.tanggal, item.menuHarian)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Simpan</span>
                          </button>

                          {item.isPlanned && (
                            <button
                              onClick={() => handleDeleteMenuHarian(item.tanggal)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                              title="Hapus / Kosongkan menu harian tanggal ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Input Area */}
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={item.menuHarian}
                          onChange={(e) => handleWeeklyItemChange(idx, e.target.value)}
                          placeholder="Contoh: Nasi Putih, Ayam Goreng Lengkuas, Sayur Sop Bening, Buah Pisang Ambon..."
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />

                        {/* Quick Fill Chips for this Day */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 mr-1">Quick Preset:</span>
                            {menuPresets.slice(0, 4).map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                onClick={() => handleWeeklyItemChange(idx, preset.text)}
                                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-600 dark:text-slate-300 hover:text-amber-900 dark:hover:text-amber-200 text-[10px] font-medium rounded-md transition cursor-pointer"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>

                          {idx > 0 && (
                            <button
                              onClick={() => {
                                const prevMenu = weeklyMenuItems[idx - 1]?.menuHarian || '';
                                if (prevMenu) {
                                  handleWeeklyItemChange(idx, prevMenu);
                                  showToast('success', 'Disalin dari hari sebelumnya.');
                                } else {
                                  showToast('error', 'Menu hari sebelumnya masih kosong.');
                                }
                              }}
                              className="px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Salin Hari Sebelumnya</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Bottom Bulk Action Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Total <span className="font-bold text-slate-900 dark:text-slate-100">{weeklyMenuItems.length} Hari</span> Terjadwal ({weeklyMenuItems.filter(i => i.isPlanned).length} Terisi)
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveAllWeeklyMenus}
                      disabled={isSavingWeekly}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      {isSavingWeekly ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Simpan Semua Perencanaan Menu</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT TUGAS */}
      {activeTab === 'riwayat' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-slate-100">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Filter & Pencarian Riwayat Tugas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-slate-400 block">TANGGAL SPESIFIK</label>
                  {filterTanggal && (
                    <button
                      type="button"
                      onClick={() => setFilterTanggal('')}
                      className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">BULAN</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 font-semibold text-slate-700 dark:text-slate-200"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2026, m - 1, 1).toLocaleString('id-ID', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">TAHUN</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">DIVISI</label>
                <select
                  value={filterDivisi}
                  onChange={(e) => setFilterDivisi(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="semua">Semua Divisi</option>
                  <option value="persiapan">Divisi Persiapan</option>
                  <option value="pengolahan">Divisi Pengolahan</option>
                  <option value="pemorsian">Divisi Pemorsian</option>
                  <option value="distribusi">Divisi Distribusi</option>
                  <option value="cuci_ompreng">Divisi Cuci Ompreng</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">STATUS</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="semua">Semua Status</option>
                  <option value="Dalam Persiapan">Dalam Persiapan</option>
                  <option value="Proses Memasak">Proses Memasak</option>
                  <option value="Proses Pemorsian">Proses Pemorsian</option>
                  <option value="Pengiriman">Pengiriman</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">CARI DIVISI / PETUGAS</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nama divisi, petugas, menu..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 font-semibold text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table Riwayat */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={historyRecords.length > 0 && historyRecords.every(r => selectedRecordIds.includes(r.id))}
                        onChange={() => toggleSelectAll(historyRecords)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        title="Pilih semua riwayat"
                      />
                    </th>
                    <th className="p-4">TANGGAL</th>
                    <th className="p-4">DIVISI</th>
                    <th className="p-4">PENANGGUNG JAWAB</th>
                    <th className="p-4">MENU HARIAN</th>
                    <th className="p-4 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-200">
                  {historyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Tidak ada riwayat tugas yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    historyRecords.map((item) => {
                      const isSelected = selectedRecordIds.includes(item.id);

                      return (
                        <tr 
                          key={item.id} 
                          className={`transition ${
                            isSelected 
                              ? 'bg-blue-50/40 dark:bg-blue-950/20' 
                              : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="p-4 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRecord(item.id)}
                              className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            />
                          </td>
                          <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                            {item.tanggal}
                          </td>
                          <td className="p-4">
                            <span className="font-bold">{item.divisiNama}</span>
                          </td>
                          <td className="p-4">{item.penanggungJawab}</td>
                          <td className="p-4 font-medium text-amber-700 dark:text-amber-300 max-w-xs truncate">
                            {item.menuHarian || menuHarianInput || '-'}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingRecord(JSON.parse(JSON.stringify(item)));
                                  setIsEditModalOpen(true);
                                }}
                                className="min-w-[38px] min-h-[38px] p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition active:scale-95 flex items-center justify-center cursor-pointer touch-manipulation"
                                title="Lihat Detail / Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleShareWhatsApp(item)}
                                className="min-w-[38px] min-h-[38px] p-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer touch-manipulation"
                                title="Share WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setPdfPrintRecords([item]);
                                  setIsPdfModalOpen(true);
                                }}
                                className="min-w-[38px] min-h-[38px] p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer touch-manipulation"
                                title="Laporan PDF"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(item)}
                                className="min-w-[38px] min-h-[38px] p-2 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300 rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer touch-manipulation"
                                title="Hapus Tugas Divisi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATE TUGAS */}
      {activeTab === 'template' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Daftar Template Checklist Harian Divisi
                </h2>
                <p className="text-xs text-slate-500">
                  Pengaturan standar item checklist yang secara otomatis diterapkan pada pembuatan tugas divisi baru.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                        {tpl.divisiNama}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {tpl.judulTemplate}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate({
                          ...tpl,
                          checklists: [...tpl.checklists]
                        });
                        setIsEditTemplateModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95 shrink-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Template</span>
                    </button>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 text-xs space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                    {tpl.checklists.map((itemText, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span className="w-4 h-4 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{itemText}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LAPORAN PDF PRINT PREVIEW */}
      {activeTab === 'laporan' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Pratinjau & Cetak Laporan PDF Divisi
                </h2>
                <p className="text-xs text-slate-500">
                  Pilih divisi dan tanggal untuk menghasilkan dokumen resmi berformat PDF lengkap dengan verifikasi QR Code & Tanda Tangan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
                  title="Filter Tanggal Laporan"
                />

                <select
                  value={pdfPrintRecord?.id || ''}
                  onChange={(e) => {
                    const found = records.find(r => r.id === e.target.value);
                    if (found) setPdfPrintRecords([found]);
                  }}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold"
                >
                  <option value="">-- Pilih Divisi Untuk Dicetak --</option>
                  {records.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.divisiNama} ({r.tanggal})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak PDF Sekarang</span>
                </button>
              </div>
            </div>

            {/* Print View Component Container */}
            {pdfPrintRecord ? (
              <div className="p-8 bg-white border border-slate-300 rounded-2xl shadow-sm text-slate-900 max-w-4xl mx-auto space-y-6 print:p-0 print:border-none print:shadow-none">
                {/* PDF Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center gap-4">
                    <img
                      src="/badan_gizi_logo.jpg"
                      alt="Logo SPPG"
                      className="w-16 h-16 rounded-full object-cover border"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight uppercase">
                        BADAN GIZI NASIONAL RI
                      </h2>
                      <h3 className="text-sm font-bold text-slate-700">
                        SATUAN PELAYANAN PROGRAM GIZI (SPPG)
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        Jl. Raya Dapur Central No. 1, Jakarta • Telp: (021) 8899-0000 • Website: sppg.bgn.go.id
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="px-3 py-1 bg-blue-100 text-blue-900 font-bold text-xs rounded-full inline-block">
                      DOKUMEN RESMI SPPG
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono">
                      REF: {pdfPrintRecord.id}
                    </div>
                  </div>
                </div>

                {/* PDF Title */}
                <div className="text-center space-y-1">
                  <h4 className="text-lg font-bold underline uppercase">
                    LAPORAN TUGAS HARIAN DIVISI OPERASIONAL
                  </h4>
                  <p className="text-xs text-slate-600">
                    Sistem Manajemen Mutu & Kebersihan Dapur SPPG
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">TANGGAL PRODUKSI:</span>
                    <span className="font-bold">{pdfPrintRecord.tanggal}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">DIVISI DARAPUR:</span>
                    <span className="font-bold text-blue-600">{pdfPrintRecord.divisiNama}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">PENANGGUNG JAWAB:</span>
                    <span className="font-bold">{pdfPrintRecord.penanggungJawab}</span>
                  </div>
                </div>

                {/* Checklist Table */}
                <div className="space-y-2">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    DAFTAR CHECKLIST OPERASIONAL DIVISI
                  </h5>
                  <table className="w-full text-left text-xs border border-slate-300 divide-y divide-slate-300">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="p-2.5 border-r">NO</th>
                        <th className="p-2.5 border-r">ITEM URAIAN TUGAS</th>
                        <th className="p-2.5 border-r text-center">STATUS</th>
                        <th className="p-2.5 border-r">WAKTU (MULAI - SELESAI)</th>
                        <th className="p-2.5 border-r">PETUGAS</th>
                        <th className="p-2.5">CATATAN KHUSUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pdfPrintRecord.checklists.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="p-2.5 border-r font-bold text-center">{idx + 1}</td>
                          <td className="p-2.5 border-r font-semibold">{item.text}</td>
                          <td className="p-2.5 border-r text-center">
                            {item.completed ? (
                              <span className="font-bold text-emerald-600">✓ SELESAI</span>
                            ) : (
                              <span className="text-slate-400">---</span>
                            )}
                          </td>
                          <td className="p-2.5 border-r font-mono text-[11px]">
                            {item.jamMulai || '-'} s/d {item.jamSelesai || '-'}
                          </td>
                          <td className="p-2.5 border-r">{item.namaPetugas || '-'}</td>
                          <td className="p-2.5 italic text-slate-600">{item.catatan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signatures & Verification */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
                  <div className="space-y-2">
                    <span className="font-bold text-slate-700 block">QR Code Verifikasi Sistem:</span>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center p-2">
                        <QrCode className="w-16 h-16 text-slate-800" />
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <p className="font-bold text-slate-800">Verifikasi Terverifikasi Digital</p>
                        <p>ID: {pdfPrintRecord.id}</p>
                        <p>Dicetak: {new Date().toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-12">
                    <div>
                      <p className="text-slate-500">Dibuat & Disetujui Oleh,</p>
                      <p className="font-bold text-slate-800">{pdfPrintRecord.penanggungJawab}</p>
                    </div>
                    <div>
                      <div className="w-36 h-0.5 bg-slate-800 mx-auto" />
                      <p className="text-[10px] text-slate-400 mt-1">Penanggung Jawab {pdfPrintRecord.divisiNama}</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Diproduksi oleh SPPG • Badan Gizi Nasional RI</span>
                  <span>Halaman 1 dari 1</span>
                  <span>Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Printer className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Silakan pilih salah satu divisi di atas untuk melihat laporan PDF resmi.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PENGATURAN WHATSAPP DIVISI */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Pengaturan Nomor WhatsApp Divisi
                </h2>
                <p className="text-xs text-slate-500">
                  Atur nomor kontak WhatsApp penerima laporan untuk masing-masing divisi SPPG saat tombol Share ditekan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {waSettings.map((item, idx) => (
                <div
                  key={item.divisiId}
                  className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {item.divisiNama}
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                        NOMOR WHATSAPP (Awal 628...)
                      </label>
                      <input
                        type="text"
                        value={item.nomorWa}
                        onChange={(e) => {
                          const copy = [...waSettings];
                          copy[idx].nomorWa = e.target.value;
                          setWaSettings(copy);
                        }}
                        placeholder="6281234567890"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                        NAMA KONTAK PENANGGUNG JAWAB
                      </label>
                      <input
                        type="text"
                        value={item.namaKontak}
                        onChange={(e) => {
                          const copy = [...waSettings];
                          copy[idx].namaKontak = e.target.value;
                          setWaSettings(copy);
                        }}
                        placeholder="Nama kontak"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => handleSaveWaSettings(waSettings)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Nomor WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / DETAIL CHECKLIST MODAL */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                  Kelola Checklist Tugas
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {editingRecord.divisiNama} ({editingRecord.tanggal})
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Info Metadata Inputs */}
            <div className="grid grid-cols-1 gap-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">PENANGGUNG JAWAB</label>
                <input
                  type="text"
                  value={editingRecord.penanggungJawab}
                  onChange={(e) => setEditingRecord({ ...editingRecord, penanggungJawab: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">MENU HARIAN</label>
                <input
                  type="text"
                  value={editingRecord.menuHarian || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, menuHarian: e.target.value })}
                  placeholder="Contoh: Nasi Putih, Ayam Goreng Lengkuas, Sayur Sop Bening"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div className="col-span-full">
                <label className="text-[10px] font-bold text-slate-400 block mb-1">KETERANGAN / INSTRUKSI UTAMA DIVISI</label>
                <textarea
                  value={editingRecord.keterangan || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, keterangan: e.target.value })}
                  rows={2}
                  placeholder="Instruksi & keterangan utama..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-xs"
                />
              </div>
            </div>

            {/* Checklist Items List without checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rincian Deskripsi Tugas Divisi ({editingRecord.checklists.length} Item)
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const newChk: TugasChecklistItem = {
                      id: `CHK-${editingRecord.divisiId}-${Date.now()}-${editingRecord.checklists.length + 1}`,
                      text: '',
                      completed: false,
                      status: 'Belum Dikerjakan'
                    };
                    setEditingRecord({
                      ...editingRecord,
                      checklists: [...editingRecord.checklists, newChk]
                    });
                  }}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Item Tugas</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {editingRecord.checklists.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] rounded-lg flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const copy = { ...editingRecord };
                        copy.checklists[idx].text = e.target.value;
                        setEditingRecord(copy);
                      }}
                      placeholder={`Deskripsi tugas ${idx + 1}...`}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = { ...editingRecord };
                        copy.checklists = copy.checklists.filter((_, i) => i !== idx);
                        setEditingRecord(copy);
                      }}
                      className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                      title="Hapus Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                {editingRecord && (
                  <button
                    onClick={() => handleDeleteRecord(editingRecord)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/80 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Tugas</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => handleSaveRecord(editingRecord)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Buat Tugas Divisi Baru
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tambahkan instruksi & checklist operasional divisi dapur SPPG
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    TANGGAL PRODUKSI *
                  </label>
                  <input
                    type="date"
                    value={createTanggal}
                    onChange={(e) => setCreateTanggal(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    DIVISI OPERASIONAL *
                  </label>
                  <select
                    value={createDivisiId}
                    onChange={(e) => handleDivisiChangeInCreate(e.target.value as DivisiId)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="persiapan">Divisi Persiapan</option>
                    <option value="pengolahan">Divisi Pengolahan</option>
                    <option value="pemorsian">Divisi Pemorsian</option>
                    <option value="distribusi">Divisi Distribusi</option>
                    <option value="cuci_ompreng">Divisi Cuci Ompreng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  PENANGGUNG JAWAB (PJ) *
                </label>
                <input
                  type="text"
                  value={createPenanggungJawab}
                  onChange={(e) => setCreatePenanggungJawab(e.target.value)}
                  placeholder="Contoh: Budi Santoso, S.ST"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  MENU HARIAN
                </label>
                <input
                  type="text"
                  value={createMenuHarian}
                  onChange={(e) => setCreateMenuHarian(e.target.value)}
                  placeholder="Contoh: Nasi Putih, Ayam Goreng Lengkuas, Sayur Sop Bening, Pisang"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  KETERANGAN / INSTRUKSI UTAMA DIVISI
                </label>
                <input
                  type="text"
                  value={createKeterangan}
                  onChange={(e) => setCreateKeterangan(e.target.value)}
                  placeholder="Keterangan atau instruksi khusus operasional divisi..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Checklist Builder */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
                    Rincian Keterangan Tugas Divisi ({createChecklists.length} Item)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const tpl = templates.find(t => t.divisiId === createDivisiId);
                      if (tpl) setCreateChecklists([...tpl.checklists]);
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset dari Template</span>
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  {createChecklists.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic text-center py-2">
                      Belum ada item checklist. Tambahkan secara manual di bawah.
                    </p>
                  ) : (
                    createChecklists.map((itemText, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-md font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate">{itemText}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistInCreate(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer shrink-0"
                          title="Hapus Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Custom Checklist Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newChecklistInput}
                    onChange={(e) => setNewChecklistInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistInCreate();
                      }
                    }}
                    placeholder="Tambah item checklist baru..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistInCreate}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-1 transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleCreateTaskSubmit}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Tugas Divisi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BULK ACTION BAR */}
      {selectedRecordIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-md flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-[95vw] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 border-r border-slate-700 pr-4 shrink-0">
            <CheckSquare className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold whitespace-nowrap">
              {selectedRecordIds.length} Tugas Dipilih
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleBulkExportPdf}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
              title="Export PDF untuk tugas terpilih"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export PDF ({selectedRecordIds.length})</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
              title="Hapus tugas terpilih"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Terpilih ({selectedRecordIds.length})</span>
            </button>

            <button
              onClick={() => setSelectedRecordIds([])}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Batal Pilihan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PDF PRINT PREVIEW MODAL */}
      {isPdfModalOpen && pdfPrintRecords.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {pdfPrintRecords.length === 1 
                    ? `Pratinjau PDF ${pdfPrintRecords[0].divisiNama}`
                    : `Pratinjau PDF Massal (${pdfPrintRecords.length} Tugas Divisi)`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak PDF ({pdfPrintRecords.length})</span>
                </button>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Layout containing 1 or multiple records */}
            <div className="space-y-8">
              {pdfPrintRecords.map((record, index) => (
                <div key={record.id} className="p-8 bg-white text-slate-900 border border-slate-200 rounded-xl space-y-6 break-after-page">
                  {/* PDF Header dari Master Template Dokumen (Single Source of Truth) */}
                  <GlobalReportHeader
                    documentTypeId="tugas-divisi"
                    documentNumber={record.id}
                    documentDate={record.tanggal}
                    metadata={[
                      { label: 'Divisi Operasional', value: record.divisiNama },
                      { label: 'Penanggung Jawab', value: record.penanggungJawab },
                      { label: 'Status Verifikasi', value: record.statusVerifikasi || 'Terverifikasi' }
                    ]}
                  />

                  {/* Summary Box */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div>
                      <p className="text-slate-500 font-bold uppercase text-[10px]">MENU HARIAN</p>
                      <p className="font-bold text-slate-900">{record.menuHarian || menuHarianInput || '-'}</p>
                    </div>
                    {record.keterangan && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-slate-500 font-bold uppercase text-[10px]">KETERANGAN TUGAS DIVISI</p>
                        <p className="font-medium text-slate-800">{record.keterangan}</p>
                      </div>
                    )}
                  </div>

                  {/* Checklist */}
                  <table className="w-full text-left text-xs border border-slate-300 divide-y divide-slate-300">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2 border-r w-10 text-center">NO</th>
                        <th className="p-2 border-r">RINCIAN DESKRIPSI TUGAS</th>
                        <th className="p-2">PETUGAS / PJ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {record.checklists.map((c, i) => (
                        <tr key={c.id || i}>
                          <td className="p-2 border-r text-center font-bold">{i + 1}</td>
                          <td className="p-2 border-r font-medium">{c.text}</td>
                          <td className="p-2">{c.namaPetugas || record.penanggungJawab}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Signatures & Footer dari Master Template Dokumen */}
                  <DocumentSignatures documentTypeId="tugas-divisi" />
                  <GlobalReportFooter 
                    documentTypeId="tugas-divisi" 
                    currentPage={index + 1} 
                    totalPages={pdfPrintRecords.length} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* EDIT TEMPLATE MODAL */}
      {isEditTemplateModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Pengaturan Template
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Edit Template Checklist {editingTemplate.divisiNama}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditTemplateModalOpen(false);
                  setEditingTemplate(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1 uppercase tracking-wider">
                  Judul Template
                </label>
                <input
                  type="text"
                  value={editingTemplate.judulTemplate}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, judulTemplate: e.target.value })}
                  placeholder="Contoh: Checklist Standar Persiapan Bahan SPPG"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Daftar Item Checklist Standard ({editingTemplate.checklists.length} Item)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate({
                        ...editingTemplate,
                        checklists: [...editingTemplate.checklists, '']
                      });
                    }}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {editingTemplate.checklists.map((itemText, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] rounded-lg flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={itemText}
                        onChange={(e) => {
                          const updated = [...editingTemplate.checklists];
                          updated[idx] = e.target.value;
                          setEditingTemplate({ ...editingTemplate, checklists: updated });
                        }}
                        placeholder={`Item checklist ${idx + 1}...`}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingTemplate.checklists.filter((_, i) => i !== idx);
                          setEditingTemplate({ ...editingTemplate, checklists: updated });
                        }}
                        className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                        title="Hapus Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {editingTemplate.checklists.length === 0 && (
                    <p className="text-center text-slate-400 py-4 italic text-xs">
                      Belum ada item checklist. Klik tombol "Tambah Item" untuk menambahkan.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditTemplateModalOpen(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSaveTemplate(editingTemplate)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Template</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
