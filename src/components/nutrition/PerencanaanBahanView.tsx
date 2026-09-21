import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  UtensilsCrossed, 
  Plus, 
  Trash2, 
  Copy, 
  Save, 
  Lock, 
  Printer, 
  FileSpreadsheet, 
  RefreshCw, 
  Apple, 
  History, 
  BarChart3, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ChefHat, 
  Users, 
  Calendar, 
  Tag, 
  DollarSign, 
  Scale, 
  Building2, 
  Info,
  ChevronRight,
  Sparkles,
  Download,
  Eye,
  X,
  Layers,
  FileCheck,
  CalendarCheck,
  CalendarDays,
  ArrowRight,
  PlusCircle,
  Unlock,
  FileEdit,
  RotateCcw,
  WalletCards,
  Coins
} from 'lucide-react';

import { 
  NutritionPlan, 
  NutritionPlanItem, 
  MasterBahanPangan, 
  MasterMenuResep,
  NutritionPlanRekapItem 
} from '../../types';

import { 
  INITIAL_PDF_INGREDIENTS, 
  DEFAULT_TARGET_COUNTS, 
  MultiGroupIngredientItem, 
  TargetCountConfig 
} from './nutritionData';

import { MultiGroupWorksheetTable } from './MultiGroupWorksheetTable';
import { RekapBufferTable } from './RekapBufferTable';
import { OfficialPdfPrintModal } from './OfficialPdfPrintModal';
import { RencanaAnggaranBelanjaView } from './RencanaAnggaranBelanjaView';
import { PurchaseOrderView } from './PurchaseOrderView';

interface PerencanaanBahanViewProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const PerencanaanBahanView: React.FC<PerencanaanBahanViewProps> = ({ currentPath = '/perencanaan-bahan', onNavigate }) => {
  // Determine active sub-tab based on route or state
  const getSubTabFromPath = (path: string) => {
    if (path.includes('rab') || path.includes('anggaran')) return 'rab';
    if (path.includes('po') || path.includes('purchase-order')) return 'po';
    if (path.includes('riwayat')) return 'riwayat';
    if (path.includes('rekap')) return 'rekap';
    if (path.includes('master-bahan')) return 'master-bahan';
    return 'kalkulator';
  };

  const [activeTab, setActiveTab] = useState<'kalkulator' | 'rab' | 'po' | 'riwayat' | 'rekap' | 'master-bahan'>(getSubTabFromPath(currentPath));


  useEffect(() => {
    setActiveTab(getSubTabFromPath(currentPath));
  }, [currentPath]);

  // Master Data States
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [masterBahan, setMasterBahan] = useState<MasterBahanPangan[]>([]);
  const [masterResep, setMasterResep] = useState<MasterMenuResep[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Active Plan Form State (Calculator & Worksheet)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [tanggalPerencanaan, setTanggalPerencanaan] = useState<string>(todayStr);
  const [tanggalPelaksanaan, setTanggalPelaksanaan] = useState<string>(todayStr);
  const [menuName, setMenuName] = useState<string>('NASI + CHICKEN KATSU (DAUN PISANG) + TAHU GORENG + CURRY WORTEL & KENTANG + KELENGKENG');
  const [periode, setPeriode] = useState<'Harian' | 'Mingguan' | 'Bulanan'>('Harian');
  const [keterangan, setKeterangan] = useState<string>('Standar Menu SPPG Probolinggo Krejengan Temenggungan (Yayasan Hafshawaty)');
  const [nutritionistName, setNutritionistName] = useState<string>('Fitria, S. ST');
  const [kepalaSppgName, setKepalaSppgName] = useState<string>('Sri Rohayu, S. Pd');
  const [planStatus, setPlanStatus] = useState<'Draft' | 'Dalam Perhitungan' | 'Final' | 'Disetujui' | 'Selesai'>('Draft');

  // Real-time synchronization state (Tugas Divisi & Penerima Manfaat)
  const [tugasDivisiMenuHarian, setTugasDivisiMenuHarian] = useState<string>('');
  const [isSyncingMenu, setIsSyncingMenu] = useState<boolean>(false);
  const [isSyncingBeneficiaries, setIsSyncingBeneficiaries] = useState<boolean>(false);
  const [liveBeneficiarySummary, setLiveBeneficiarySummary] = useState<any>(null);
  const [hasAutoSyncedDate, setHasAutoSyncedDate] = useState<string>('');
  const [autoSyncToTugasDivisi, setAutoSyncToTugasDivisi] = useState<boolean>(true);

  // Multi-Group State for Worksheet & Algorithms
  const [ingredients, setIngredients] = useState<MultiGroupIngredientItem[]>(INITIAL_PDF_INGREDIENTS);
  const [targetCounts, setTargetCounts] = useState<TargetCountConfig>(DEFAULT_TARGET_COUNTS);

  // Modals
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showAddBahanModal, setShowAddBahanModal] = useState<boolean>(false);
  const [showPlanDetailModal, setShowPlanDetailModal] = useState<boolean>(false);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<NutritionPlan | null>(null);

  const [newBahanForm, setNewBahanForm] = useState<Partial<MasterBahanPangan>>({
    namaBahan: '',
    kategori: 'Sayuran',
    satuanPembelian: 'kg',
    satuanPerhitungan: 'gram',
    bddDefault: 100,
    hargaDasarPerKg: 15000,
    supplier: '',
    lokasi: 'Chiller Dapur'
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper date formatter Indonesian
  const formatDateIndo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Fetch Master Data & Plans
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resMaster, resRecipes, resPlans] = await Promise.all([
        fetch('/api/v1/nutrition-plans/master/ingredients'),
        fetch('/api/v1/nutrition-plans/master/recipes'),
        fetch('/api/v1/nutrition-plans')
      ]);

      const dataMaster = await resMaster.json();
      const dataRecipes = await resRecipes.json();
      const dataPlans = await resPlans.json();

      if (dataMaster.success) setMasterBahan(dataMaster.data);
      if (dataRecipes.success) setMasterResep(dataRecipes.data);
      if (dataPlans.success) setPlans(dataPlans.data);
    } catch (err) {
      console.error('Error fetching initial nutrition data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Real-time synchronization fetcher for selected tanggalPelaksanaan
  const fetchSyncContextForDate = async (targetDate: string, isManualTrigger = false) => {
    if (!targetDate) return;
    setIsSyncingMenu(true);
    setIsSyncingBeneficiaries(true);
    try {
      const res = await fetch(`/api/v1/nutrition-plans/sync-context?tanggal=${targetDate}`);
      const json = await res.json();
      if (json.success) {
        const menuHarian = json.menuTugasDivisi || '';
        setTugasDivisiMenuHarian(menuHarian);
        if (json.beneficiarySummary) {
          setLiveBeneficiarySummary(json.beneficiarySummary);
        }

        const existingPlanForDate = plans.find(p => p.tanggalPelaksanaan === targetDate);

        // 1. Auto-synchronize Menu Utama SPPG from Tugas Divisi if available
        if (menuHarian && menuHarian.trim()) {
          // If no existing saved plan or if creating a new plan or if user explicitly triggered sync
          if (isManualTrigger || (!existingPlanForDate && (planStatus === 'Draft' || !menuName.trim() || menuName.includes('CHICKEN KATSU')))) {
            setMenuName(menuHarian);
          }
        }

        // 2. Auto-synchronize Target Counts (Sasaran) from Penerima Manfaat
        if (json.targetCounts) {
          const hasZeroCounts = targetCounts.porsiKecil === 0 && targetCounts.porsiBesar === 0;
          if (isManualTrigger || !existingPlanForDate || hasZeroCounts || planStatus === 'Draft') {
            setTargetCounts({
              porsiKecil: json.targetCounts.porsiKecil || 0,
              porsiBesar: json.targetCounts.porsiBesar || 0,
              balita: json.targetCounts.balita || 0,
              bumilBusui: json.targetCounts.bumilBusui || 0
            });
          }
        }

        if (isManualTrigger) {
          showToast(
            `Data realtime tersinkronisasi! Menu: ${menuHarian ? `"${menuHarian}"` : '(Belum ada di Tugas Divisi)'} | Total Sasaran: ${(json.targetCounts?.total || 0).toLocaleString('id-ID')} jiwa`,
            'success'
          );
        }
      }
    } catch (err) {
      console.error('Error fetching sync context:', err);
      if (isManualTrigger) {
        showToast('Gagal menyinkronkan data realtime', 'error');
      }
    } finally {
      setIsSyncingMenu(false);
      setIsSyncingBeneficiaries(false);
    }
  };

  // Auto sync on execution date change
  useEffect(() => {
    if (tanggalPelaksanaan && tanggalPelaksanaan !== hasAutoSyncedDate) {
      setHasAutoSyncedDate(tanggalPelaksanaan);
      fetchSyncContextForDate(tanggalPelaksanaan, false);
    }
  }, [tanggalPelaksanaan, hasAutoSyncedDate]);

  // Sync targets only (Penerima Manfaat)
  const handleSyncBeneficiariesOnly = async () => {
    setIsSyncingBeneficiaries(true);
    try {
      const res = await fetch(`/api/v1/nutrition-plans/sync-context?tanggal=${tanggalPelaksanaan}`);
      const json = await res.json();
      if (json.success && json.targetCounts) {
        setTargetCounts({
          porsiKecil: json.targetCounts.porsiKecil || 0,
          porsiBesar: json.targetCounts.porsiBesar || 0,
          balita: json.targetCounts.balita || 0,
          bumilBusui: json.targetCounts.bumilBusui || 0
        });
        if (json.beneficiarySummary) {
          setLiveBeneficiarySummary(json.beneficiarySummary);
        }
        showToast(`Data sasaran berhasil disinkronkan realtime dengan Penerima Manfaat (${(json.targetCounts.total || 0).toLocaleString('id-ID')} jiwa)`, 'success');
      }
    } catch (err) {
      console.error('Error syncing beneficiaries:', err);
      showToast('Gagal menyinkronkan data sasaran penerima manfaat', 'error');
    } finally {
      setIsSyncingBeneficiaries(false);
    }
  };

  // Sync menu only (Tugas Divisi)
  const handleSyncMenuFromTugasDivisiOnly = async () => {
    setIsSyncingMenu(true);
    try {
      const res = await fetch(`/api/v1/tugas-divisi/menu-harian?tanggal=${tanggalPelaksanaan}`);
      const json = await res.json();
      if (json.success && json.data?.menuHarian) {
        setMenuName(json.data.menuHarian);
        setTugasDivisiMenuHarian(json.data.menuHarian);
        showToast(`Menu Utama SPPG berhasil disinkronkan dengan Menu Tugas Divisi: "${json.data.menuHarian}"`, 'success');
      } else {
        showToast(`Tidak ditemukan data menu harian di Tugas Divisi untuk tanggal ${formatDateIndo(tanggalPelaksanaan)}`, 'info');
      }
    } catch (err) {
      console.error('Error syncing menu from tugas divisi:', err);
      showToast('Gagal menyinkronkan menu harian', 'error');
    } finally {
      setIsSyncingMenu(false);
    }
  };

  // Revision modal states
  const [showRevisionModal, setShowRevisionModal] = useState<boolean>(false);
  const [revisionTargetPlan, setRevisionTargetPlan] = useState<NutritionPlan | null>(null);
  const [revisionReason, setRevisionReason] = useState<string>('');
  const [revisionUserName, setRevisionUserName] = useState<string>('Fitria, S. ST');
  const [submittingRevision, setSubmittingRevision] = useState<boolean>(false);

  // Check if a saved plan exists for currently selected tanggalPelaksanaan
  const existingPlanForSelectedDate = plans.find(p => p.tanggalPelaksanaan === tanggalPelaksanaan);
  const isPlanFinalized = planStatus === 'Final' || (selectedPlanId ? false : existingPlanForSelectedDate?.status === 'Final' && planStatus !== 'Revisi');

  // Open Revision Modal
  const handleOpenRevisionModal = (plan?: NutritionPlan) => {
    const target = plan || existingPlanForSelectedDate || plans.find(p => p.id === selectedPlanId);
    if (!target) {
      showToast('Tidak ada data perencanaan menu Final yang dapat direvisi', 'error');
      return;
    }
    setRevisionTargetPlan(target);
    setRevisionReason('');
    setRevisionUserName(nutritionistName || target.nutritionistName || 'Fitria, S. ST');
    setShowRevisionModal(true);
  };

  // Submit Unlock Revision
  const handleConfirmUnlockRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionReason.trim()) {
      showToast('Mohon tuliskan alasan perubahan / revisi bahan baku', 'error');
      return;
    }

    if (!revisionTargetPlan) return;

    setSubmittingRevision(true);
    try {
      const res = await fetch(`/api/v1/nutrition-plans/${revisionTargetPlan.id}/unlock-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: revisionReason,
          revisedBy: revisionUserName
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        showToast(`Kunci menu berhasil dibuka! Status diubah ke Revisi. Anda dapat langsung mengubah bahan baku di Worksheet.`, 'success');
        setShowRevisionModal(false);
        setRevisionReason('');
        
        // Update local plan state and worksheet
        handleLoadPlanToWorksheet(data.data);
        setPlanStatus('Revisi');
        fetchInitialData();
      } else {
        showToast(data.message || 'Gagal membuka kunci revisi', 'error');
      }
    } catch (err) {
      console.error('Error unlocking plan for revision:', err);
      showToast('Terjadi kesalahan saat memproses pembukaan kunci revisi', 'error');
    } finally {
      setSubmittingRevision(false);
    }
  };

  // Load a plan into Worksheet
  const handleLoadPlanToWorksheet = (plan: NutritionPlan) => {
    setSelectedPlanId(plan.id);
    setTanggalPelaksanaan(plan.tanggalPelaksanaan);
    if (plan.tanggalPerencanaan) setTanggalPerencanaan(plan.tanggalPerencanaan);
    setMenuName(plan.menuName);
    if (plan.periode) setPeriode(plan.periode);
    if (plan.keterangan) setKeterangan(plan.keterangan);
    if (plan.nutritionistName) setNutritionistName(plan.nutritionistName);
    if (plan.kepalaSppgName) setKepalaSppgName(plan.kepalaSppgName);
    setPlanStatus(plan.status || 'Draft');

    if (plan.ingredientsData && Array.isArray(plan.ingredientsData) && plan.ingredientsData.length > 0) {
      setIngredients(plan.ingredientsData);
    }
    if (plan.targetCountsConfig) {
      setTargetCounts(plan.targetCountsConfig);
    }

    setActiveTab('kalkulator');
    if (plan.status === 'Final') {
      showToast(`Memuat menu FINAL untuk tanggal ${formatDateIndo(plan.tanggalPelaksanaan)}. Data berstatus terkunci (Read-Only). Klik tombol 'Buka Kunci / Revisi Menu' untuk mengedit.`, 'info');
    } else if (plan.status === 'Revisi') {
      showToast(`Memuat menu REVISI untuk tanggal ${formatDateIndo(plan.tanggalPelaksanaan)}. Data terbuka untuk diedit dan disesuaikan.`, 'info');
    } else {
      showToast(`Berhasil memuat perencanaan menu untuk tanggal pelaksanaan: ${formatDateIndo(plan.tanggalPelaksanaan)}`, 'info');
    }
  };

  // Reset to the exact official PDF standard
  const handleResetToPdfOfficial = () => {
    setIngredients(INITIAL_PDF_INGREDIENTS);
    setTargetCounts(DEFAULT_TARGET_COUNTS);
    setMenuName('NASI + CHICKEN KATSU (DAUN PISANG) + TAHU GORENG + CURRY WORTEL & KENTANG + KELENGKENG');
    setNutritionistName('Fitria, S. ST');
    setKepalaSppgName('Sri Rohayu, S. Pd');
    showToast('Berhasil memuat konfigurasi standar resmi PDF Badan Gizi Nasional (24 Bahan Pangan, 4 Sasaran)', 'success');
  };

  // Buat Form Perencanaan Menu Baru (Data Kosong Siap Diisi)
  const handleCreateNewMenu = () => {
    setSelectedPlanId(null);
    setMenuName('');
    setIngredients([]);
    setPlanStatus('Draft');
    setKeterangan('Standar Menu SPPG Probolinggo Krejengan Temenggungan (Yayasan Hafshawaty)');
    setActiveTab('kalkulator');
    showToast('Form perencanaan menu baru telah dibuka dengan data kosong. Silakan masukkan nama menu dan pilih bahan pangan dari Master Data.', 'info');
  };

  // Overall calculations across all 4 groups & buffer
  const calcGross = (net: number, bdd: number) => {
    const safeBdd = bdd > 0 ? bdd / 100 : 1;
    return Number((net / safeBdd).toFixed(2));
  };

  const calcReqKg = (gross: number, target: number) => {
    return Number(((gross * target) / 1000).toFixed(2));
  };

  let totalKgOverall = 0;
  let totalBiayaOverall = 0;

  ingredients.forEach(item => {
    const bdd = Number(item.bddPercent) || 100;
    const reqKecil = calcReqKg(calcGross(Number(item.porsiKecilNet) || 0, bdd), targetCounts.porsiKecil);
    const reqBesar = calcReqKg(calcGross(Number(item.porsiBesarNet) || 0, bdd), targetCounts.porsiBesar);
    const reqBalita = calcReqKg(calcGross(Number(item.balitaNet) || 0, bdd), targetCounts.balita);
    const reqBumil = calcReqKg(calcGross(Number(item.bumilBusuiNet) || 0, bdd), targetCounts.bumilBusui);

    const totalItemKg = Number((reqKecil + reqBesar + reqBalita + reqBumil).toFixed(2));
    const bufferKg = Number((totalItemKg * 0.05).toFixed(2));
    const totalPlusBuffer = Number((totalItemKg + bufferKg).toFixed(2));

    totalKgOverall += totalPlusBuffer;
    totalBiayaOverall += Math.round(totalPlusBuffer * (item.hargaPerKg || 0));
  });

  const totalSasaranOverall = targetCounts.porsiKecil + targetCounts.porsiBesar + targetCounts.balita + targetCounts.bumilBusui;

  // SIMPAN PERENCANAAN MENU SESUAI TANGGAL PELAKSANAAN YANG DIPILIH
  const handleSavePlanByExecutionDate = async (targetStatus: 'Draft' | 'Final' = 'Draft') => {
    if (!tanggalPelaksanaan) {
      showToast('Silakan pilih tanggal pelaksanaan terlebih dahulu', 'error');
      return;
    }

    // Cek apakah data menu pada tanggal tersebut sudah difinalisasi
    if (isPlanFinalized) {
      showToast(
        `Peringatan: Menu untuk tanggal pelaksanaan ${formatDateIndo(tanggalPelaksanaan)} sudah berstatus FINAL & TERKUNCI (${existingPlanForSelectedDate?.menuName || menuName}). Perubahan tidak dapat disimpan.`,
        'error'
      );
      return;
    }

    if (!menuName.trim()) {
      showToast('Nama menu utama tidak boleh kosong', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tanggalPerencanaan,
        tanggalPelaksanaan,
        menuName,
        targetGroup: 'Multi-Kelompok (Porsi Kecil, Besar, Balita, Bumil/Busui)',
        targetCount: totalSasaranOverall,
        periode,
        keterangan,
        nutritionistName,
        kepalaSppgName,
        ingredientsData: ingredients,
        targetCountsConfig: targetCounts,
        totalCost: totalBiayaOverall,
        totalWeightKg: totalKgOverall,
        status: targetStatus
      };

      const res = await fetch('/api/v1/nutrition-plans/save-by-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setPlanStatus(targetStatus);
        if (data.data?.id) setSelectedPlanId(data.data.id);
        showToast(
          `Perencanaan menu untuk tanggal pelaksanaan ${formatDateIndo(tanggalPelaksanaan)} berhasil disimpan (${targetStatus})!`,
          'success'
        );
        fetchInitialData();
      } else {
        showToast(data.message || 'Gagal menyimpan data perencanaan menu', 'error');
      }
    } catch (err) {
      console.error('Error saving plan by execution date:', err);
      showToast('Terjadi kesalahan saat menyimpan ke database', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Create Master Ingredient
  const handleCreateMasterIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBahanForm.namaBahan) {
      showToast('Nama bahan pangan wajib diisi', 'error');
      return;
    }

    try {
      const res = await fetch('/api/v1/nutrition-plans/master/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBahanForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Bahan pangan baru berhasil ditambahkan ke Master Data!');
        setShowAddBahanModal(false);
        setNewBahanForm({
          namaBahan: '',
          kategori: 'Sayuran',
          satuanPembelian: 'kg',
          satuanPerhitungan: 'gram',
          bddDefault: 100,
          hargaDasarPerKg: 15000,
          supplier: '',
          lokasi: 'Chiller Dapur'
        });
        fetchInitialData();
      }
    } catch (err) {
      console.error('Error creating master ingredient:', err);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md transition-all ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700' 
            : toastMessage.type === 'error'
            ? 'bg-rose-900/90 text-rose-100 border-rose-700'
            : 'bg-slate-900/90 text-slate-100 border-slate-700'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          <span className="text-xs font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Module Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-600 dark:text-emerald-400 shrink-0">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                PERENCANAAN KEBUTUHAN BAHAN PANGAN (SPPG)
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                planStatus === 'Final' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800' 
                  : planStatus === 'Revisi'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700'
              }`}>
                {planStatus === 'Final' ? 'LOCKED / FINAL' : planStatus === 'Revisi' ? 'REVISI TERBUKA' : 'DRAFT IN PROGRESS'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
              Sistem Kalkulator & Worksheet Terpadu 4 Kelompok Sasaran (Porsi Kecil, Porsi Besar, Balita, Bumil & Busui) Standar Resmi SPPG Badan Gizi Nasional.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tombol Buat Menu Baru (Form Kosong) */}
          <button
            onClick={handleCreateNewMenu}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-500 hover:shadow-md"
            title="Buka form baru dengan data kosong untuk merancang menu baru"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Buat Menu</span>
          </button>

          {/* Tombol Buka Kunci / Revisi Menu jika Menu Berstatus FINAL */}
          {isPlanFinalized && (
            <button
              onClick={() => handleOpenRevisionModal()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer border border-amber-400 hover:shadow-md"
              title="Buka kunci status Final untuk merubah dan menyesuaikan bahan baku menu ini"
            >
              <Unlock className="w-4 h-4 text-white" />
              <span>Buka Kunci / Revisi Menu</span>
            </button>
          )}

          {/* Tombol Simpan Perencanaan Menu Sesuai Tanggal Pelaksanaan */}
          {isPlanFinalized ? (
            <button
              onClick={() => handleSavePlanByExecutionDate('Draft')}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-90 transition-all"
              title={`Menu untuk tanggal pelaksanaan ${tanggalPelaksanaan} sudah DIFINALISASI & TERKUNCI. Klik tombol 'Buka Kunci / Revisi Menu' untuk mengedit.`}
            >
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Menu Terkunci ({tanggalPelaksanaan})</span>
            </button>
          ) : (
            <button
              onClick={() => handleSavePlanByExecutionDate('Draft')}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer border border-emerald-500 hover:shadow-md"
              title={`Simpan perencanaan menu khusus untuk tanggal pelaksanaan: ${tanggalPelaksanaan}`}
            >
              <CalendarCheck className="w-4 h-4 text-white animate-pulse" />
              <span>Simpan Menu ({tanggalPelaksanaan})</span>
            </button>
          )}

          <button
            onClick={handleResetToPdfOfficial}
            disabled={isPlanFinalized}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all ${
              isPlanFinalized 
                ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 cursor-pointer shadow-2xs'
            }`}
            title={isPlanFinalized ? "Menu sudah final / terkunci" : "Muat Ulang Standar Menu Resmi PDF"}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Reset Template PDF</span>
          </button>

          <button
            onClick={() => handleSavePlanByExecutionDate('Final')}
            disabled={saving || isPlanFinalized}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition-all ${
              isPlanFinalized
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 text-white cursor-pointer'
            }`}
            title={isPlanFinalized ? "Menu sudah difinalisasi & dikunci" : "Finalisasi dan kunci data menu untuk tanggal pelaksanaan ini"}
          >
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span>{isPlanFinalized ? 'Telah Difinalisasi' : 'Finalisasi'}</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF Resmi (6 Hal)</span>
          </button>
        </div>
      </div>

      {/* Top Executive Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Estimasi Biaya (Buffer 5%)</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              Rp {totalBiayaOverall.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Realtime Kalkulasi Anggaran
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Kebutuhan Bahan (+Buffer)</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalKgOverall.toFixed(2)} <span className="text-xs font-normal text-slate-500">kg</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {ingredients.length} jenis komoditas pangan
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Penerima Manfaat</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalSasaranOverall.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">jiwa</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1 truncate max-w-[150px]">
              4 Kelompok Sasaran Terpadu
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Pengesahan Resmi SPPG</div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
              PLOG: {nutritionistName}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Kepala: {kepalaSppgName}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('kalkulator')}
          className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'kalkulator'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Form Kalkulator & Worksheet (4 Kelompok)</span>
        </button>

        <button
          onClick={() => setActiveTab('rab')}
          className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'rab'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <WalletCards className="w-4 h-4 text-emerald-600" />
          <span className="flex items-center gap-1.5">
            <span>Rencana Anggaran Belanja (RAB)</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black rounded-full">
              Live Sync
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('po')}
          className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'po'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <FileCheck className="w-4 h-4 text-blue-600" />
          <span className="flex items-center gap-1.5">
            <span>Purchase Order (PO) 5 Hari</span>
            <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-black rounded-full">
              Periode
            </span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rekap')}
          className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'rekap'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Rekapitulasi Total & Buffer 5% (Hal 5)</span>
        </button>

        <button
          onClick={() => setActiveTab('riwayat')}
          className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'riwayat'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Dokumen Perencanaan ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('master-bahan')}
          className={`pb-3 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'master-bahan'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Apple className="w-4 h-4" />
          <span>Master Bahan Pangan ({masterBahan.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: 2. RENCANA ANGGARAN BELANJA (RAB) */}
      {activeTab === 'rab' && (
        <RencanaAnggaranBelanjaView
          tanggalPelaksanaan={tanggalPelaksanaan}
          onNavigateDate={(d) => setTanggalPelaksanaan(d)}
          masterBahan={masterBahan}
        />
      )}

      {/* TAB CONTENT: PURCHASE ORDER (PO) 5 HARI */}
      {activeTab === 'po' && (
        <PurchaseOrderView onNavigate={onNavigate} />
      )}


      {/* TAB CONTENT: 1. KALKULATOR & WORKSHEET */}
      {activeTab === 'kalkulator' && (
        <div className="space-y-6">
          {/* Metadata Parameters Card */}
          <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-emerald-600" />
                <span>Parameter Menu & Identitas Perencanaan SPPG</span>
              </h2>
              <span className="text-[11px] text-slate-400">
                Formulir Standar SPPG Probolinggo Krejengan Temenggungan
              </span>
            </div>

            {/* Existing plan notification if date has a saved plan */}
            {existingPlanForSelectedDate && (
              existingPlanForSelectedDate.status === 'Final' ? (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-start sm:items-center gap-2.5 text-amber-950 dark:text-amber-200">
                    <div className="p-2 bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 rounded-lg shrink-0">
                      <Lock className="w-4 h-4 text-amber-800 dark:text-amber-300" />
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        <span>Peringatan: Menu Tanggal Pelaksanaan Ini Telah DIFINALISASI & TERKUNCI</span>
                        <span className="text-[10px] px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-full font-black">FINAL</span>
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                        Menu <strong>"{existingPlanForSelectedDate.menuName}"</strong> pada tanggal <strong>{formatDateIndo(tanggalPelaksanaan)}</strong> telah difinalisasi secara resmi. Buka kunci untuk mengajukan perubahan bahan baku.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenRevisionModal(existingPlanForSelectedDate)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="Buka kunci status final untuk merevisi bahan baku"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Buka Kunci / Revisi Menu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadPlanToWorksheet(existingPlanForSelectedDate)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <span>Lihat Data</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : existingPlanForSelectedDate.status === 'Revisi' ? (
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                    <FileEdit className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <span>
                        Menu dalam status <strong>REVISI AKTIF</strong> untuk tanggal <strong>{formatDateIndo(tanggalPelaksanaan)}</strong>:{' '}
                        <span className="font-semibold text-amber-800 dark:text-amber-300">"{existingPlanForSelectedDate.menuName}"</span>
                      </span>
                      {existingPlanForSelectedDate.revisionReason && (
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                          Alasan: {existingPlanForSelectedDate.revisionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLoadPlanToWorksheet(existingPlanForSelectedDate)}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-[11px] shrink-0 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Edit di Worksheet</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                    <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      Terdapat perencanaan tersimpan untuk tanggal <strong>{formatDateIndo(tanggalPelaksanaan)}</strong>:{' '}
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">"{existingPlanForSelectedDate.menuName}"</span>
                      <span className="ml-2 text-[10px] px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 rounded-full font-bold">
                        {existingPlanForSelectedDate.status}
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLoadPlanToWorksheet(existingPlanForSelectedDate)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-[11px] shrink-0 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Muat Data Menu Ini</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Hari / Tanggal Pelaksanaan</span>
                </label>
                <input
                  type="date"
                  value={tanggalPelaksanaan}
                  onChange={(e) => setTanggalPelaksanaan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {formatDateIndo(tanggalPelaksanaan)}
                </p>
              </div>

              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Menu Utama SPPG
                  </label>
                  {tugasDivisiMenuHarian ? (
                    <div className="flex items-center gap-1">
                      {menuName.trim() === tugasDivisiMenuHarian.trim() ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Sinkron Menu Tugas Divisi</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSyncMenuFromTugasDivisiOnly}
                          disabled={isSyncingMenu}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 transition-all cursor-pointer shadow-2xs"
                          title={`Sinkronkan dengan menu Tugas Divisi: "${tugasDivisiMenuHarian}"`}
                        >
                          <RefreshCw className={`w-3 h-3 text-amber-600 ${isSyncingMenu ? 'animate-spin' : ''}`} />
                          <span>Tarik dari Tugas Divisi: "{tugasDivisiMenuHarian.length > 20 ? `${tugasDivisiMenuHarian.slice(0, 20)}...` : tugasDivisiMenuHarian}"</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSyncMenuFromTugasDivisiOnly}
                      disabled={isSyncingMenu}
                      className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                      title="Periksa menu harian di Tugas Divisi"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isSyncingMenu ? 'animate-spin' : ''}`} />
                      <span>Cek Menu Tugas Divisi</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                    placeholder="Masukkan nama menu utama SPPG..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Periode Perencanaan
                </label>
                <select
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Harian">Harian (1 Hari)</option>
                  <option value="Mingguan">Mingguan (6 Hari)</option>
                  <option value="Bulanan">Bulanan (24 Hari)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  PLOG SPPG (Petugas Logistik / Ahli Gizi)
                </label>
                <input
                  type="text"
                  value={nutritionistName}
                  onChange={(e) => setNutritionistName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Kepala SPPG
                </label>
                <input
                  type="text"
                  value={kepalaSppgName}
                  onChange={(e) => setKepalaSppgName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Parameter Bottom Action Bar with Direct Save Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30 -mx-4 -mb-4 p-4 rounded-b-2xl">
              <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Target Pelaksanaan:</span>
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg font-bold border border-emerald-200 dark:border-emerald-800">
                  {formatDateIndo(tanggalPelaksanaan)}
                </span>
                <span className="text-slate-400">•</span>
                <span>{totalSasaranOverall.toLocaleString('id-ID')} Total Porsi</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCreateNewMenu}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Mulai form baru dengan data kosong"
                >
                  <PlusCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Buat Menu Baru</span>
                </button>

                {isPlanFinalized && (
                  <button
                    type="button"
                    onClick={() => handleOpenRevisionModal(existingPlanForSelectedDate)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Buka kunci status Final untuk merevisi bahan baku menu ini"
                  >
                    <Unlock className="w-4 h-4 text-white" />
                    <span>Revisi Menu Ini</span>
                  </button>
                )}

                {isPlanFinalized ? (
                  <button
                    type="button"
                    onClick={() => handleOpenRevisionModal(existingPlanForSelectedDate)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                    title={`Menu tanggal ${tanggalPelaksanaan} sudah DIFINALISASI & TERKUNCI. Klik untuk membuka kunci revisi.`}
                  >
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Menu Terkunci ({tanggalPelaksanaan})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSavePlanByExecutionDate('Draft')}
                    disabled={saving}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-md"
                  >
                    <CalendarCheck className="w-4 h-4 text-emerald-100" />
                    <span>Simpan Menu ({tanggalPelaksanaan})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive MultiGroup Worksheet Table */}
          <MultiGroupWorksheetTable
            ingredients={ingredients}
            onChangeIngredients={setIngredients}
            targetCounts={targetCounts}
            onChangeTargetCounts={setTargetCounts}
            menuName={menuName}
            masterBahan={masterBahan}
            isReadOnly={Boolean(isPlanFinalized)}
            onSyncBeneficiaries={handleSyncBeneficiariesOnly}
            isSyncingBeneficiaries={isSyncingBeneficiaries}
            beneficiaryLiveInfo={liveBeneficiarySummary}
            tanggalPelaksanaan={tanggalPelaksanaan}
          />
        </div>
      )}

      {/* TAB CONTENT: 2. REKAPITULASI TOTAL & BUFFER 5% */}
      {activeTab === 'rekap' && (
        <RekapBufferTable
          ingredients={ingredients}
          targetCounts={targetCounts}
          onChangeIngredients={setIngredients}
        />
      )}

      {/* TAB CONTENT: 3. RIWAYAT DOKUMEN PERENCANAAN */}
      {activeTab === 'riwayat' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                Daftar Dokumen Perencanaan Bahan Pangan SPPG Berdasarkan Tanggal Pelaksanaan
              </h3>
            </div>
            <button
              onClick={fetchInitialData}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {plans.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Belum ada arsip perencanaan yang tersimpan.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {plans.map((p) => (
                <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{p.menuName}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${
                        p.status === 'Final' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800' 
                          : p.status === 'Revisi'
                          ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700'
                      }`}>
                        {p.status === 'Revisi' ? `Revisi (v${(p.revisionCount || 0) + 1})` : p.status}
                      </span>
                    </div>
                    {p.revisionReason && (
                      <div className="mt-1 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 flex items-center gap-1.5">
                        <FileEdit className="w-3 h-3 shrink-0 text-amber-600" />
                        <span><strong>Catatan Revisi:</strong> {p.revisionReason}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Pelaksanaan: {formatDateIndo(p.tanggalPelaksanaan)} ({p.tanggalPelaksanaan})
                      </span>
                      <span>•</span>
                      <span>Total Sasaran: {p.targetCount?.toLocaleString('id-ID')} jiwa</span>
                      <span>•</span>
                      <span>PLOG: {p.nutritionistName}</span>
                      {p.totalCost > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Rp {p.totalCost.toLocaleString('id-ID')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {p.status === 'Final' && (
                      <button
                        onClick={() => handleOpenRevisionModal(p)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                        title="Buka kunci perencanaan menu ini untuk merevisi bahan baku"
                      >
                        <Unlock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Buka Kunci / Revisi</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleLoadPlanToWorksheet(p)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                      title="Muat data perencanaan ini ke Kalkulator & Worksheet"
                    >
                      <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{p.status === 'Final' ? 'Lihat Worksheet' : 'Buka & Edit'}</span>
                    </button>

                    <button
                      onClick={() => {
                        handleLoadPlanToWorksheet(p);
                        setShowPrintModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 4. MASTER BAHAN PANGAN */}
      {activeTab === 'master-bahan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase">
                Master Database Bahan Pangan ({masterBahan.length} Komoditas)
              </h3>
              <p className="text-[11px] text-slate-500">
                Data acuan BDD (Bagian Dapat Dimakan) dan satuan pembelian komoditas bahan pangan.
              </p>
            </div>
            <button
              onClick={() => setShowAddBahanModal(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Bahan Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white dark:bg-slate-950 border-b border-slate-700 text-center">
                  <th className="py-2.5 px-3 font-bold w-12 border-r border-slate-700">Kode</th>
                  <th className="py-2.5 px-3 font-bold border-r border-slate-700 text-left">Nama Bahan Pangan</th>
                  <th className="py-2.5 px-3 font-bold border-r border-slate-700">Kategori</th>
                  <th className="py-2.5 px-3 font-bold border-r border-slate-700">Satuan Beli</th>
                  <th className="py-2.5 px-3 font-bold text-center">BDD (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {masterBahan.map((mb) => (
                  <tr key={mb.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200 dark:border-slate-800">{mb.id}</td>
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">{mb.namaBahan}</td>
                    <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-semibold">{mb.kategori}</span>
                    </td>
                    <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-800 uppercase font-semibold">{mb.satuanPembelian}</td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-600">{mb.bddDefault}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official 6-Page PDF Print Modal */}
      <OfficialPdfPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        ingredients={ingredients}
        targetCounts={targetCounts}
        menuName={menuName}
        tanggalPelaksanaan={tanggalPelaksanaan}
      />

      {/* Modal Tambah Master Bahan */}
      {showAddBahanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Tambah Bahan Pangan Baru
              </h3>
              <button onClick={() => setShowAddBahanModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMasterIngredient} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Nama Bahan Pangan</label>
                <input
                  type="text"
                  required
                  value={newBahanForm.namaBahan}
                  onChange={(e) => setNewBahanForm({ ...newBahanForm, namaBahan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  placeholder="Contoh: Tempe Kedelai Super"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Kategori</label>
                  <select
                    value={newBahanForm.kategori}
                    onChange={(e) => setNewBahanForm({ ...newBahanForm, kategori: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Sembako">Sembako</option>
                    <option value="Lauk Pauk">Lauk Pauk</option>
                    <option value="Lauk Nabati">Lauk Nabati</option>
                    <option value="Sayuran">Sayuran</option>
                    <option value="Buah">Buah</option>
                    <option value="Minyak & Lemak">Minyak & Lemak</option>
                    <option value="Bumbu & Rempah">Bumbu & Rempah</option>
                    <option value="Pelengkap">Pelengkap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">BDD (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newBahanForm.bddDefault}
                    onChange={(e) => setNewBahanForm({ ...newBahanForm, bddDefault: Number(e.target.value) || 100 })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBahanModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buka Kunci / Revisi Menu */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800">
                  <Unlock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Buka Kunci & Ajukan Revisi Menu
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Membuka proteksi status Final untuk penyesuaian atau pergantian bahan baku
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowRevisionModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Menu Information Card */}
            {revisionTargetPlan && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Tanggal Pelaksanaan:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatDateIndo(revisionTargetPlan.tanggalPelaksanaan)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Menu Utama:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-right max-w-[280px] truncate">
                    {revisionTargetPlan.menuName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Status Saat Ini:</span>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-full font-bold text-[10px] border border-amber-200 dark:border-amber-800">
                    {revisionTargetPlan.status} (Terkunci)
                  </span>
                </div>
              </div>
            )}

            {/* Form Input Alasan & Otorisator */}
            <form onSubmit={handleConfirmUnlockRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>Alasan Perubahan / Revisi Bahan Baku <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] font-normal text-slate-400">Wajib diisi</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  placeholder="Contoh: Stok daging sapi di supplier habis, diganti ayam fillet dengan penyesuaian gramatur & BDD..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Alasan ini akan tercatat secara permanen di riwayat audit log dan notifikasi sistem.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Petugas / Otorisator Revisi
                </label>
                <input
                  type="text"
                  required
                  value={revisionUserName}
                  onChange={(e) => setRevisionUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Info Notice Box */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-[11px] text-blue-900 dark:text-blue-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Setelah tombol konfirmasi ditekan, status dokumen akan diubah ke <strong>Revisi / Terbuka</strong> sehingga Anda dapat mengedit, menambah, menghapus, atau mengubah gramatur bahan baku di Worksheet. Anda dapat memfinalisasi ulang kapan saja.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRevision || !revisionReason.trim()}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  {submittingRevision ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Unlock className="w-4 h-4 text-white" />
                  )}
                  <span>{submittingRevision ? 'Membuka Kunci...' : 'Buka Kunci & Mulai Revisi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
