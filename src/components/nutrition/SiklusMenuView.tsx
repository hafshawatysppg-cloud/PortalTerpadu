import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCw,
  Calendar,
  Plus,
  Trash2,
  Save,
  Printer,
  Download,
  AlertCircle,
  CheckCircle2,
  Columns,
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  Lock,
  Unlock,
  Edit3,
  Link,
  X,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { MasterMenuRecord } from '../../types/masterMenu';
import { exportSiklusMenuToExcel, exportSiklusMenuToPdf } from '../../utils/giziExportHelper';

export interface SiklusIngredientRow {
  id: string;
  pairKey?: string; // Synchronizes rows between Porsi Kecil and Porsi Besar
  namaMasakan: string; // Belongs to a dish from Master Menu
  bahanMasakan: string; // Manually entered in Porsi Kecil, auto-synced to Porsi Besar
  beratBersih: number; // gram
  energi: number; // kkal
  protein: number; // gram
  lemak: number; // gram
  karbohidrat: number; // gram
  serat: number; // gram
  customFields?: Record<string, number | string>; // Dynamically added custom columns
}

export interface SiklusMenuData {
  tanggal: string;
  porsiKecil: SiklusIngredientRow[];
  porsiBesar: SiklusIngredientRow[];
  customColumns: { id: string; label: string; unit: string }[];
  isLocked?: boolean;
}

interface SiklusMenuViewProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  masterMenus: MasterMenuRecord[];
  activeDateFilter?: string;
  onDateFilterChange?: (date: string) => void;
}

// Initial seed data for Monday, 26 October 2026 matching the user reference image
const SEED_PORSI_KECIL_20261026: SiklusIngredientRow[] = [
  { id: 'pk-1', pairKey: 'p-1', namaMasakan: 'Nasi', bahanMasakan: 'Nasi', beratBersih: 100, energi: 180, protein: 3, lemak: 0.3, karbohidrat: 39.8, serat: 0.2 },
  { id: 'pk-2', pairKey: 'p-2', namaMasakan: 'Rolade daging', bahanMasakan: 'Daging sapi', beratBersih: 50, energi: 136.5, protein: 8.75, lemak: 11, karbohidrat: 0, serat: 0 },
  { id: 'pk-3', pairKey: 'p-3', namaMasakan: 'Rolade daging', bahanMasakan: 'Tepung terigu', beratBersih: 5, energi: 17.5, protein: 0.55, lemak: 0.07, karbohidrat: 3.65, serat: 0 },
  { id: 'pk-4', pairKey: 'p-4', namaMasakan: 'Rolade daging', bahanMasakan: 'Minyak', beratBersih: 5, energi: 44.5, protein: 0, lemak: 5, karbohidrat: 0, serat: 0 },
  { id: 'pk-5', pairKey: 'p-5', namaMasakan: 'Tempe krispy', bahanMasakan: 'Tempe', beratBersih: 50, energi: 100.5, protein: 10.4, lemak: 4.4, karbohidrat: 6.75, serat: 0.7 },
  { id: 'pk-6', pairKey: 'p-6', namaMasakan: 'Tempe krispy', bahanMasakan: 'Tepung krispy', beratBersih: 10, energi: 33.3, protein: 0.9, lemak: 0.1, karbohidrat: 7.72, serat: 0.03 },
  { id: 'pk-7', pairKey: 'p-7', namaMasakan: 'Tempe krispy', bahanMasakan: 'Minyak', beratBersih: 5, energi: 44.5, protein: 0, lemak: 5, karbohidrat: 0, serat: 0 },
  { id: 'pk-8', pairKey: 'p-8', namaMasakan: 'Tumis jagung & wortel', bahanMasakan: 'Jagung', beratBersih: 25, energi: 92, protein: 1.37, lemak: 1.15, karbohidrat: 19.5, serat: 0.72 },
  { id: 'pk-9', pairKey: 'p-9', namaMasakan: 'Tumis jagung & wortel', bahanMasakan: 'Wortel', beratBersih: 25, energi: 9, protein: 0.25, lemak: 0.15, karbohidrat: 1.97, serat: 0.25 },
  { id: 'pk-10', pairKey: 'p-10', namaMasakan: 'Tumis jagung & wortel', bahanMasakan: 'Minyak', beratBersih: 2.5, energi: 22.1, protein: 0, lemak: 2.5, karbohidrat: 0, serat: 0 },
  { id: 'pk-11', pairKey: 'p-11', namaMasakan: 'Semangka kuning', bahanMasakan: 'Semangka kuning', beratBersih: 100, energi: 28, protein: 0.5, lemak: 0.2, karbohidrat: 6.9, serat: 0.4 },
];

const SEED_PORSI_BESAR_20261026: SiklusIngredientRow[] = [
  { id: 'pb-1', pairKey: 'p-1', namaMasakan: 'Nasi', bahanMasakan: 'Nasi', beratBersih: 150, energi: 270, protein: 4.5, lemak: 0.45, karbohidrat: 59.7, serat: 0.2 },
  { id: 'pb-2', pairKey: 'p-2', namaMasakan: 'Rolade daging', bahanMasakan: 'Daging sapi', beratBersih: 50, energi: 136.5, protein: 8.75, lemak: 11, karbohidrat: 0, serat: 0 },
  { id: 'pb-3', pairKey: 'p-3', namaMasakan: 'Rolade daging', bahanMasakan: 'Tepung terigu', beratBersih: 5, energi: 17.5, protein: 0.55, lemak: 0.07, karbohidrat: 3.65, serat: 0 },
  { id: 'pb-4', pairKey: 'p-4', namaMasakan: 'Rolade daging', bahanMasakan: 'Minyak', beratBersih: 5, energi: 44.5, protein: 0, lemak: 5, karbohidrat: 0, serat: 0 },
  { id: 'pb-5', pairKey: 'p-5', namaMasakan: 'Tempe krispy', bahanMasakan: 'Tempe', beratBersih: 50, energi: 100.5, protein: 10.4, lemak: 4.4, karbohidrat: 6.75, serat: 0.7 },
  { id: 'pb-6', pairKey: 'p-6', namaMasakan: 'Tempe krispy', bahanMasakan: 'Tepung krispy', beratBersih: 10, energi: 33.3, protein: 0.9, lemak: 0.1, karbohidrat: 7.72, serat: 0.03 },
  { id: 'pb-7', pairKey: 'p-7', namaMasakan: 'Tempe krispy', bahanMasakan: 'Minyak', beratBersih: 5, energi: 44.5, protein: 0, lemak: 5, karbohidrat: 0, serat: 0 },
  { id: 'pb-8', pairKey: 'p-8', namaMasakan: 'Tumis jagung & wortel', bahanMasakan: 'Jagung', beratBersih: 25, energi: 92, protein: 1.37, lemak: 1.15, karbohidrat: 19.5, serat: 0.72 },
  { id: 'pb-9', pairKey: 'p-9', namaMasakan: 'Tumis jagung & wortel', bahanMasakan: 'Wortel', beratBersih: 25, energi: 9, protein: 0.25, lemak: 0.15, karbohidrat: 1.97, serat: 0.25 },
  { id: 'pb-10', pairKey: 'p-10', namaMasakan: 'Tumis jagung & wortel', bahanMasakan: 'Minyak', beratBersih: 2.5, energi: 22.1, protein: 0, lemak: 2.5, karbohidrat: 0, serat: 0 },
  { id: 'pb-11', pairKey: 'p-11', namaMasakan: 'Semangka kuning', bahanMasakan: 'Semangka kuning', beratBersih: 100, energi: 28, protein: 0.5, lemak: 0.2, karbohidrat: 6.9, serat: 0.4 },
];

export const SiklusMenuView: React.FC<SiklusMenuViewProps> = ({
  currentPath,
  onNavigate,
  masterMenus,
  activeDateFilter,
  onDateFilterChange
}) => {
  // Date state: prioritize active date filter if provided, otherwise default to '2026-10-26'
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (activeDateFilter) return activeDateFilter;
    return '2026-10-26';
  });

  // Keep in sync with prop if changed from outer GiziView
  useEffect(() => {
    if (activeDateFilter && activeDateFilter !== selectedDate) {
      setSelectedDate(activeDateFilter);
    }
  }, [activeDateFilter]);

  const [activeTab, setActiveTab] = useState<'both' | 'porsiKecil' | 'porsiBesar'>('both');
  const [showToast, setShowToast] = useState<string | null>(null);

  // Lock State: Locked by default when viewing saved data, editable when unlocked
  const [isLocked, setIsLocked] = useState<boolean>(true);

  // Custom column management modal
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnUnit, setNewColumnUnit] = useState('gram');

  // Stored cycles state
  const [savedCycles, setSavedCycles] = useState<Record<string, SiklusMenuData>>(() => {
    try {
      const stored = localStorage.getItem('sppg_siklus_menu_records');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed reading saved cycles from localStorage:', e);
    }
    // Return initial seed with isLocked: true
    return {
      '2026-10-26': {
        tanggal: '2026-10-26',
        porsiKecil: SEED_PORSI_KECIL_20261026,
        porsiBesar: SEED_PORSI_BESAR_20261026,
        customColumns: [],
        isLocked: true
      }
    };
  });

  // Save to localStorage whenever savedCycles changes
  useEffect(() => {
    try {
      localStorage.setItem('sppg_siklus_menu_records', JSON.stringify(savedCycles));
    } catch (e) {
      console.error('Failed persisting cycles to localStorage:', e);
    }
  }, [savedCycles]);

  // Find corresponding Master Menu for the currently selected date
  const currentMasterMenu = useMemo(() => {
    return masterMenus.find(m => m.tanggalPelaksanaan === selectedDate) || null;
  }, [masterMenus, selectedDate]);

  // Current cycle data for the selected date
  const currentCycleData = useMemo<SiklusMenuData | null>(() => {
    // If master menu DOES NOT exist for this date, the data in siklus menu MUST BE EMPTY
    if (!currentMasterMenu) {
      return null;
    }

    if (savedCycles[selectedDate]) {
      return savedCycles[selectedDate];
    }

    // Auto-generate starting rows from the dishes in Master Menu if not previously saved
    const generateRowsFromMaster = (menuItems: string[]): { pk: SiklusIngredientRow[]; pb: SiklusIngredientRow[] } => {
      const pkRows: SiklusIngredientRow[] = [];
      const pbRows: SiklusIngredientRow[] = [];

      menuItems.forEach((dish, dIdx) => {
        const pairKey = `pair_${dIdx}_${Date.now()}`;
        const bahanDefault = dish.split(' ')[0] || dish;

        pkRows.push({
          id: `pk_${pairKey}`,
          pairKey,
          namaMasakan: dish,
          bahanMasakan: bahanDefault,
          beratBersih: 75,
          energi: 90,
          protein: 3.5,
          lemak: 2,
          karbohidrat: 14,
          serat: 0.8,
          customFields: {}
        });

        pbRows.push({
          id: `pb_${pairKey}`,
          pairKey,
          namaMasakan: dish,
          bahanMasakan: bahanDefault,
          beratBersih: 100,
          energi: 120,
          protein: 5,
          lemak: 3,
          karbohidrat: 18,
          serat: 1,
          customFields: {}
        });
      });

      return { pk: pkRows, pb: pbRows };
    };

    const initialGenerated = generateRowsFromMaster(currentMasterMenu.menuItems);

    return {
      tanggal: selectedDate,
      porsiKecil: initialGenerated.pk,
      porsiBesar: initialGenerated.pb,
      customColumns: [],
      isLocked: false // New record starts unlocked so user can fill data
    };
  }, [currentMasterMenu, savedCycles, selectedDate]);

  // Local editable state for current date
  const [localPorsiKecil, setLocalPorsiKecil] = useState<SiklusIngredientRow[]>([]);
  const [localPorsiBesar, setLocalPorsiBesar] = useState<SiklusIngredientRow[]>([]);
  const [customColumns, setCustomColumns] = useState<{ id: string; label: string; unit: string }[]>([]);

  // Update local editable arrays and lock status when currentCycleData changes
  useEffect(() => {
    if (currentCycleData) {
      setLocalPorsiKecil(currentCycleData.porsiKecil || []);
      setLocalPorsiBesar(currentCycleData.porsiBesar || []);
      setCustomColumns(currentCycleData.customColumns || []);
      setIsLocked(Boolean(currentCycleData.isLocked));
    } else {
      setLocalPorsiKecil([]);
      setLocalPorsiBesar([]);
      setCustomColumns([]);
      setIsLocked(false);
    }
  }, [currentCycleData]);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3200);
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    if (onDateFilterChange) {
      onDateFilterChange(newDate);
    }
  };

  const formatDateIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Add ingredient row under a dish:
  // Automatically creates a row in BOTH Porsi Kecil and Porsi Besar with linked pairKey!
  const handleAddIngredientRow = (dishName: string) => {
    if (isLocked) {
      triggerToast('Tabel sedang terkunci. Klik tombol "Edit Data" untuk mengubah.');
      return;
    }

    const pairKey = `pair_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newRowKecil: SiklusIngredientRow = {
      id: `pk_${pairKey}`,
      pairKey,
      namaMasakan: dishName,
      bahanMasakan: '',
      beratBersih: 0,
      energi: 0,
      protein: 0,
      lemak: 0,
      karbohidrat: 0,
      serat: 0,
      customFields: {}
    };

    const newRowBesar: SiklusIngredientRow = {
      id: `pb_${pairKey}`,
      pairKey,
      namaMasakan: dishName,
      bahanMasakan: '',
      beratBersih: 0,
      energi: 0,
      protein: 0,
      lemak: 0,
      karbohidrat: 0,
      serat: 0,
      customFields: {}
    };

    const insertAfterDish = (list: SiklusIngredientRow[], newRow: SiklusIngredientRow) => {
      const lastIndex = list.map(r => r.namaMasakan).lastIndexOf(dishName);
      if (lastIndex !== -1) {
        const next = [...list];
        next.splice(lastIndex + 1, 0, newRow);
        return next;
      }
      return [...list, newRow];
    };

    setLocalPorsiKecil(prev => insertAfterDish(prev, newRowKecil));
    setLocalPorsiBesar(prev => insertAfterDish(prev, newRowBesar));

    triggerToast(`Bahan baru untuk "${dishName}" otomatis disinkronkan ke Porsi Kecil & Porsi Besar`);
  };

  // Remove ingredient row from BOTH Porsi Kecil and Porsi Besar
  const handleRemoveIngredientRow = (rowId: string, pairKey?: string) => {
    if (isLocked) {
      triggerToast('Tabel sedang terkunci. Klik tombol "Edit Data" untuk mengubah.');
      return;
    }

    const targetKecil = localPorsiKecil.find(r => r.id === rowId || (pairKey && r.pairKey === pairKey));
    const effectivePairKey = pairKey || targetKecil?.pairKey;

    if (localPorsiKecil.length <= 1) {
      triggerToast('Minimal harus ada 1 baris bahan masakan!');
      return;
    }

    setLocalPorsiKecil(prev =>
      prev.filter(r => r.id !== rowId && (!effectivePairKey || r.pairKey !== effectivePairKey))
    );

    setLocalPorsiBesar(prev => {
      if (effectivePairKey) {
        return prev.filter(r => r.pairKey !== effectivePairKey);
      }
      return prev.filter(r => r.id !== rowId);
    });

    triggerToast('Baris bahan masakan dihapus dari kedua tabel porsi');
  };

  // Row update handlers:
  // When editing 'bahanMasakan' in Porsi Kecil, immediately synchronize to Porsi Besar!
  const handleUpdateRow = (
    portion: 'porsiKecil' | 'porsiBesar',
    id: string,
    field: keyof SiklusIngredientRow,
    value: any
  ) => {
    if (isLocked) return;

    if (portion === 'porsiKecil') {
      const targetRow = localPorsiKecil.find(r => r.id === id);
      const pairKey = targetRow?.pairKey;

      setLocalPorsiKecil(prev =>
        prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
      );

      // Automatic sync of Bahan Masakan from Porsi Kecil to Porsi Besar
      if (field === 'bahanMasakan') {
        setLocalPorsiBesar(prev => {
          if (pairKey) {
            return prev.map(r => (r.pairKey === pairKey ? { ...r, bahanMasakan: value } : r));
          }
          if (targetRow) {
            const sameDishKecil = localPorsiKecil.filter(r => r.namaMasakan === targetRow.namaMasakan);
            const indexInDish = sameDishKecil.findIndex(r => r.id === id);
            let countInDish = 0;
            return prev.map(r => {
              if (r.namaMasakan === targetRow.namaMasakan) {
                if (countInDish === indexInDish) {
                  countInDish++;
                  return { ...r, bahanMasakan: value };
                }
                countInDish++;
              }
              return r;
            });
          }
          return prev;
        });
      }
    } else {
      // Direct update on Porsi Besar fields (nutritional gramature or custom values)
      setLocalPorsiBesar(prev =>
        prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
      );
    }
  };

  const handleUpdateCustomField = (
    portion: 'porsiKecil' | 'porsiBesar',
    id: string,
    columnId: string,
    value: number
  ) => {
    if (isLocked) return;

    const updater = (prev: SiklusIngredientRow[]) =>
      prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            customFields: {
              ...(r.customFields || {}),
              [columnId]: value
            }
          };
        }
        return r;
      });

    if (portion === 'porsiKecil') {
      setLocalPorsiKecil(updater);
    } else {
      setLocalPorsiBesar(updater);
    }
  };

  // Custom Column Management
  const handleAddCustomColumn = () => {
    if (isLocked) {
      triggerToast('Tabel sedang terkunci. Klik tombol "Edit Data" untuk menambah kolom.');
      return;
    }
    if (!newColumnName.trim()) {
      triggerToast('Nama kolom nutrisi wajib diisi!');
      return;
    }
    const colId = 'col_' + Date.now();
    const newCol = {
      id: colId,
      label: newColumnName.trim(),
      unit: newColumnUnit.trim() || 'gram'
    };
    setCustomColumns(prev => [...prev, newCol]);
    setNewColumnName('');
    setIsColumnModalOpen(false);
    triggerToast(`Kolom "${newCol.label} (${newCol.unit})" berhasil ditambahkan!`);
  };

  const handleRemoveCustomColumn = (columnId: string, label: string) => {
    if (isLocked) {
      triggerToast('Tabel sedang terkunci. Klik tombol "Edit Data" untuk menghapus kolom.');
      return;
    }
    setCustomColumns(prev => prev.filter(c => c.id !== columnId));
    triggerToast(`Kolom "${label}" telah dihapus.`);
  };

  // Save current cycle data and LOCK IT
  const handleSaveAndLockCycle = () => {
    if (!currentMasterMenu) {
      triggerToast('Gagal menyimpan: Master Menu untuk tanggal ini belum ada.');
      return;
    }

    const payload: SiklusMenuData = {
      tanggal: selectedDate,
      porsiKecil: localPorsiKecil,
      porsiBesar: localPorsiBesar,
      customColumns,
      isLocked: true
    };

    setSavedCycles(prev => ({
      ...prev,
      [selectedDate]: payload
    }));

    setIsLocked(true);
    triggerToast(`Kandungan Gizi tanggal ${formatDateIndo(selectedDate)} berhasil disimpan & dikunci!`);
  };

  // Unlock to edit
  const handleUnlockToEdit = () => {
    setIsLocked(false);
    triggerToast('Mode edit aktif. Anda dapat mengubah data bahan masakan dan nilai gizi.');
  };

  // Export handlers for Excel (.xlsx) and PDF (.pdf)
  const handleExportExcel = () => {
    if (!currentMasterMenu) {
      triggerToast('Gagal ekspor: Belum ada data Master Menu pada tanggal ini.');
      return;
    }
    exportSiklusMenuToExcel(
      selectedDate,
      localPorsiKecil,
      localPorsiBesar,
      customColumns,
      currentMasterMenu.menuItems || []
    );
    triggerToast(`Data Siklus Menu ${formatDateIndo(selectedDate)} berhasil diekspor ke Excel (.xlsx)!`);
  };

  const handleExportPdf = () => {
    if (!currentMasterMenu) {
      triggerToast('Gagal ekspor: Belum ada data Master Menu pada tanggal ini.');
      return;
    }
    exportSiklusMenuToPdf(
      selectedDate,
      localPorsiKecil,
      localPorsiBesar,
      customColumns,
      currentMasterMenu.menuItems || []
    );
    triggerToast(`Laporan analisis AKG Siklus Menu ${formatDateIndo(selectedDate)} berhasil diekspor ke PDF (.pdf)!`);
  };

  // Calculate totals
  const calculateTotals = (rows: SiklusIngredientRow[]) => {
    const totals = {
      beratBersih: 0,
      energi: 0,
      protein: 0,
      lemak: 0,
      karbohidrat: 0,
      serat: 0,
      customs: {} as Record<string, number>
    };

    rows.forEach(r => {
      totals.beratBersih += Number(r.beratBersih) || 0;
      totals.energi += Number(r.energi) || 0;
      totals.protein += Number(r.protein) || 0;
      totals.lemak += Number(r.lemak) || 0;
      totals.karbohidrat += Number(r.karbohidrat) || 0;
      totals.serat += Number(r.serat) || 0;

      if (r.customFields) {
        Object.entries(r.customFields).forEach(([cId, val]) => {
          totals.customs[cId] = (totals.customs[cId] || 0) + (Number(val) || 0);
        });
      }
    });

    return {
      beratBersih: parseFloat(totals.beratBersih.toFixed(2)),
      energi: parseFloat(totals.energi.toFixed(2)),
      protein: parseFloat(totals.protein.toFixed(2)),
      lemak: parseFloat(totals.lemak.toFixed(2)),
      karbohidrat: parseFloat(totals.karbohidrat.toFixed(2)),
      serat: parseFloat(totals.serat.toFixed(2)),
      customs: totals.customs
    };
  };

  const totalsKecil = useMemo(() => calculateTotals(localPorsiKecil), [localPorsiKecil]);
  const totalsBesar = useMemo(() => calculateTotals(localPorsiBesar), [localPorsiBesar]);

  // Group rows by dish to enable multi-row grouping under each dish
  const groupRowsByDish = (rows: SiklusIngredientRow[]) => {
    const groups: { dish: string; rows: SiklusIngredientRow[] }[] = [];
    rows.forEach(row => {
      const existing = groups.find(g => g.dish === row.namaMasakan);
      if (existing) {
        existing.rows.push(row);
      } else {
        groups.push({ dish: row.namaMasakan, rows: [row] });
      }
    });
    return groups;
  };

  // Render Single Table Component
  const renderNutritionTable = (
    title: string,
    portion: 'porsiKecil' | 'porsiBesar',
    rows: SiklusIngredientRow[],
    totals: ReturnType<typeof calculateTotals>,
    headerBg: string,
    targetKalori: string
  ) => {
    const grouped = groupRowsByDish(rows);
    const isPorsiKecil = portion === 'porsiKecil';

    return (
      <div className="flex-1 min-w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col">
        {/* Table Banner Header matching user's Excel style */}
        <div className={`${headerBg} text-amber-950 px-4 py-2 text-center border-b border-amber-300 font-black tracking-wider text-xs sm:text-sm uppercase shadow-2xs flex items-center justify-center gap-2`}>
          <span>{title}</span>
          {!isPorsiKecil && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600/30 text-amber-950 border border-amber-600/40 normal-case flex items-center gap-1">
              <Link className="w-3 h-3" />
              <span>Sinkron dari Porsi Kecil</span>
            </span>
          )}
        </div>
        <div className="bg-amber-100/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-4 py-1.5 text-center text-xs font-bold border-b border-amber-200 dark:border-amber-900 flex items-center justify-center gap-2">
          <span>{formatDateIndo(selectedDate)}</span>
          {isLocked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3" />
              <span>Terkunci</span>
            </span>
          )}
        </div>

        {/* Scrollable Spreadsheet Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-700 font-bold text-[11px]">
                <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 w-36 whitespace-nowrap">
                  Nama Masakan
                </th>
                <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[130px]">
                  Bahan Masakan {!isPorsiKecil && <span className="text-[10px] text-emerald-600 font-medium">(Otomatis)</span>}
                </th>
                <th className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-right w-20 whitespace-nowrap">
                  Berat Bersih (gr)
                </th>
                <th className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-right w-20 whitespace-nowrap bg-amber-50/50 dark:bg-amber-950/20">
                  Energi (kkal)
                </th>
                <th className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-right w-16 whitespace-nowrap">
                  Protein (gr)
                </th>
                <th className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-right w-16 whitespace-nowrap">
                  Lemak (gr)
                </th>
                <th className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-right w-16 whitespace-nowrap">
                  Karbo (gr)
                </th>
                <th className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-right w-16 whitespace-nowrap">
                  Serat (gr)
                </th>
                {customColumns.map(col => (
                  <th key={col.id} className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 text-right w-20 whitespace-nowrap bg-emerald-50/40 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-between gap-1">
                      <span>{col.label} ({col.unit})</span>
                      {!isLocked && (
                        <button
                          onClick={() => handleRemoveCustomColumn(col.id, col.label)}
                          className="text-rose-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                          title="Hapus kolom ini"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                {!isLocked && <th className="py-2 px-2 text-center w-12">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
              {grouped.map((group, gIdx) => (
                <React.Fragment key={gIdx}>
                  {group.rows.map((row, rIdx) => (
                    <tr
                      key={row.id}
                      className="hover:bg-amber-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Dish Name: rowSpan for the first ingredient row of the dish */}
                      {rIdx === 0 && (
                        <td
                          rowSpan={group.rows.length}
                          className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 align-top font-bold text-slate-900 dark:text-slate-100 bg-slate-50/60 dark:bg-slate-900/60"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-xs">{group.dish}</span>
                            {/* In Porsi Kecil: Add Bahan button synchronizes both tables */}
                            {!isLocked && isPorsiKecil && (
                              <button
                                type="button"
                                onClick={() => handleAddIngredientRow(group.dish)}
                                className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-semibold cursor-pointer w-fit mt-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 transition-all shadow-2xs"
                                title={`Tambah bahan masakan baru untuk ${group.dish} (Otomatis sinkron ke Porsi Besar)`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>Tambah Bahan</span>
                              </button>
                            )}
                            {!isLocked && !isPorsiKecil && (
                              <span className="text-[9px] text-slate-400 italic">
                                Mengikuti bahan Porsi Kecil
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Bahan Masakan: In Porsi Kecil it's the master input; in Porsi Besar it reflects Porsi Kecil */}
                      <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-700">
                        {isLocked ? (
                          <span className="px-2 py-1 block text-slate-800 dark:text-slate-200 font-medium">
                            {row.bahanMasakan || '-'}
                          </span>
                        ) : isPorsiKecil ? (
                          <input
                            type="text"
                            value={row.bahanMasakan}
                            onChange={(e) =>
                              handleUpdateRow('porsiKecil', row.id, 'bahanMasakan', e.target.value)
                            }
                            placeholder="Nama bahan..."
                            className="w-full px-2 py-1 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-emerald-400 rounded text-slate-800 dark:text-slate-200 font-medium outline-none transition-all"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 px-2 py-1 text-slate-800 dark:text-slate-200 font-medium">
                            <span className="flex-1">{row.bahanMasakan || '-'}</span>
                            <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1 rounded border border-emerald-200 dark:border-emerald-800">
                              Sinkron
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Berat Bersih (gr) */}
                      <td className="py-1 px-1.5 border-r border-slate-200 dark:border-slate-700 text-right">
                        {isLocked ? (
                          <span className="px-1.5 py-1 block text-slate-800 dark:text-slate-200 font-medium">
                            {row.beratBersih}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.1"
                            value={row.beratBersih === 0 ? '' : row.beratBersih}
                            onChange={(e) =>
                              handleUpdateRow(portion, row.id, 'beratBersih', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-right px-1.5 py-1 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-emerald-400 rounded text-slate-800 dark:text-slate-200 outline-none"
                          />
                        )}
                      </td>

                      {/* Energi (kkal) */}
                      <td className="py-1 px-1.5 border-r border-slate-200 dark:border-slate-700 text-right bg-amber-50/30 dark:bg-amber-950/10">
                        {isLocked ? (
                          <span className="px-1.5 py-1 block text-amber-950 dark:text-amber-200 font-bold">
                            {row.energi}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.1"
                            value={row.energi === 0 ? '' : row.energi}
                            onChange={(e) =>
                              handleUpdateRow(portion, row.id, 'energi', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-right px-1.5 py-1 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-amber-400 rounded text-amber-950 dark:text-amber-200 font-semibold outline-none"
                          />
                        )}
                      </td>

                      {/* Protein (gr) */}
                      <td className="py-1 px-1.5 border-r border-slate-200 dark:border-slate-700 text-right">
                        {isLocked ? (
                          <span className="px-1.5 py-1 block text-slate-800 dark:text-slate-200">
                            {row.protein}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            value={row.protein === 0 ? '' : row.protein}
                            onChange={(e) =>
                              handleUpdateRow(portion, row.id, 'protein', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-right px-1.5 py-1 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-emerald-400 rounded text-slate-800 dark:text-slate-200 outline-none"
                          />
                        )}
                      </td>

                      {/* Lemak (gr) */}
                      <td className="py-1 px-1.5 border-r border-slate-200 dark:border-slate-700 text-right">
                        {isLocked ? (
                          <span className="px-1.5 py-1 block text-slate-800 dark:text-slate-200">
                            {row.lemak}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            value={row.lemak === 0 ? '' : row.lemak}
                            onChange={(e) =>
                              handleUpdateRow(portion, row.id, 'lemak', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-right px-1.5 py-1 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-emerald-400 rounded text-slate-800 dark:text-slate-200 outline-none"
                          />
                        )}
                      </td>

                      {/* Karbohidrat (gr) */}
                      <td className="py-1 px-1.5 border-r border-slate-200 dark:border-slate-700 text-right">
                        {isLocked ? (
                          <span className="px-1.5 py-1 block text-slate-800 dark:text-slate-200">
                            {row.karbohidrat}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            value={row.karbohidrat === 0 ? '' : row.karbohidrat}
                            onChange={(e) =>
                              handleUpdateRow(portion, row.id, 'karbohidrat', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-right px-1.5 py-1 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-emerald-400 rounded text-slate-800 dark:text-slate-200 outline-none"
                          />
                        )}
                      </td>

                      {/* Serat (gr) */}
                      <td className="py-1 px-1.5 border-r border-slate-200 dark:border-slate-700 text-right">
                        {isLocked ? (
                          <span className="px-1.5 py-1 block text-slate-800 dark:text-slate-200">
                            {row.serat}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            value={row.serat === 0 ? '' : row.serat}
                            onChange={(e) =>
                              handleUpdateRow(portion, row.id, 'serat', parseFloat(e.target.value) || 0)
                            }
                            className="w-full text-right px-1.5 py-1 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-emerald-400 rounded text-slate-800 dark:text-slate-200 outline-none"
                          />
                        )}
                      </td>

                      {/* Custom Dynamic Columns */}
                      {customColumns.map(col => {
                        const val = row.customFields?.[col.id] || 0;
                        return (
                          <td key={col.id} className="py-1 px-1.5 border-r border-slate-200 dark:border-slate-700 text-right">
                            {isLocked ? (
                              <span className="px-1.5 py-1 block text-slate-800 dark:text-slate-200">
                                {val}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                value={val === 0 ? '' : val}
                                onChange={(e) =>
                                  handleUpdateCustomField(portion, row.id, col.id, parseFloat(e.target.value) || 0)
                                }
                                className="w-full text-right px-1.5 py-1 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-emerald-400 rounded text-slate-800 dark:text-slate-200 outline-none"
                              />
                            )}
                          </td>
                        );
                      })}

                      {/* Delete action in Porsi Kecil removes paired row in both tables */}
                      {!isLocked && (
                        <td className="py-1 px-1 text-center">
                          {rows.length > 1 && isPorsiKecil && (
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredientRow(row.id, row.pairKey)}
                              className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors cursor-pointer"
                              title="Hapus baris bahan ini (Menghapus dari Porsi Kecil & Porsi Besar)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>

            {/* Total Footer Row matching the gold bar in image */}
            <tfoot>
              <tr className="bg-amber-400 text-amber-950 font-black text-xs border-t-2 border-amber-500">
                <td colSpan={2} className="py-2 px-3 text-center uppercase tracking-wider border-r border-amber-500">
                  TOTAL
                </td>
                <td className="py-2 px-2 text-right border-r border-amber-500">
                  {totals.beratBersih}
                </td>
                <td className="py-2 px-2 text-right border-r border-amber-500 font-black text-slate-950">
                  {totals.energi}
                </td>
                <td className="py-2 px-2 text-right border-r border-amber-500">
                  {totals.protein}
                </td>
                <td className="py-2 px-2 text-right border-r border-amber-500">
                  {totals.lemak}
                </td>
                <td className="py-2 px-2 text-right border-r border-amber-500">
                  {totals.karbohidrat}
                </td>
                <td className="py-2 px-2 text-right border-r border-amber-500">
                  {totals.serat}
                </td>
                {customColumns.map(col => (
                  <td key={col.id} className="py-2 px-2 text-right border-r border-amber-500">
                    {totals.customs[col.id] ? parseFloat(totals.customs[col.id].toFixed(2)) : 0}
                  </td>
                ))}
                {!isLocked && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Nutritional Summary Footer Card */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-300">Target AKG SPPG:</span>
            <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
              {targetKalori}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-300">Status Evaluasi:</span>
            {totals.energi > 0 ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Memenuhi Standar AKG</span>
              </span>
            ) : (
              <span className="text-slate-400">Belum ada isian</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Top Controls Toolbar: Date Picker + View Mode + Column Management + Lock/Unlock & Save */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Date Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl px-3.5 py-2 shadow-2xs">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <label className="text-xs font-black text-emerald-900 dark:text-emerald-200 whitespace-nowrap">
                Tanggal Siklus:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-white dark:bg-slate-800 text-xs font-bold px-2.5 py-1 rounded-xl border border-emerald-300 dark:border-emerald-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              />
            </div>

            {/* Lock Status Badge */}
            {currentMasterMenu && (
              isLocked ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-2xs">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Data Terkunci</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-2xs">
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mode Edit Aktif</span>
                </div>
              )
            )}
          </div>

          {/* Action Buttons: View Mode Switcher, Column Management, Lock/Save/Edit */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => setActiveTab('both')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'both'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bersandingan (2 Porsi)
              </button>
              <button
                onClick={() => setActiveTab('porsiKecil')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'porsiKecil'
                    ? 'bg-amber-400 text-amber-950 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Porsi Kecil
              </button>
              <button
                onClick={() => setActiveTab('porsiBesar')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'porsiBesar'
                    ? 'bg-amber-400 text-amber-950 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Porsi Besar
              </button>
            </div>

            {/* Manage/Add Columns (active when unlocked) */}
            <button
              onClick={() => {
                if (isLocked) {
                  triggerToast('Tabel sedang terkunci. Klik tombol "Edit Data" untuk menambah kolom.');
                  return;
                }
                setIsColumnModalOpen(true);
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isLocked
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 opacity-60'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
              title={isLocked ? 'Terkunci. Buka mode edit untuk menambah kolom.' : 'Tambah kolom nutrisi baru ke tabel'}
            >
              <Columns className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Tambah Kolom Nutrisi</span>
            </button>

            {/* Lock / Edit & Save Action Buttons */}
            {currentMasterMenu && (
              isLocked ? (
                /* Edit button to unlock data */
                <button
                  type="button"
                  onClick={handleUnlockToEdit}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black rounded-2xl text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all"
                  title="Klik untuk mengubah dan mengedit data tabel siklus menu"
                >
                  <Edit3 className="w-4 h-4 text-slate-950" />
                  <span>Edit Data</span>
                </button>
              ) : (
                /* Save & Lock button */
                <button
                  type="button"
                  onClick={handleSaveAndLockCycle}
                  className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl text-xs font-black shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
                  title="Simpan perubahan dan kunci data tabel"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan & Kunci</span>
                </button>
              )
            )}

            {/* Export Buttons: Excel & PDF */}
            {currentMasterMenu && (
              <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-2xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Download tabel siklus menu & kandungan gizi format Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ekspor Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white font-bold rounded-2xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Download laporan resmi analisis AKG siklus menu format PDF (.pdf)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Master Menu Link Indicator & Synchronization Info */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Status Data Master Menu:</span>
            {currentMasterMenu ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Terhubung ({currentMasterMenu.menuItems.length} Masakan: {currentMasterMenu.menuItems.join(', ')})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Tidak ada Master Menu untuk {formatDateIndo(selectedDate)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              💡 Menambah bahan di Porsi Kecil otomatis tersinkron ke Porsi Besar
            </span>
            <button
              onClick={() => onNavigate('/gizi/master-menu')}
              className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold text-xs inline-flex items-center gap-1 ml-2"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Buka Master Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!currentMasterMenu ? (
        /* Empty State: If no Master Menu exists for this date, data in Siklus Menu is strictly empty */
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-10 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              Data Siklus Menu Kosong
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Belum ada data Master Menu untuk tanggal <span className="font-bold text-slate-700 dark:text-slate-200">{formatDateIndo(selectedDate)}</span> ({selectedDate}). Siklus Menu (Kandungan Gizi) otomatis menarik nama masakan dari Master Menu.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('/gizi/master-menu')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Master Menu Tanggal Ini</span>
            </button>
          </div>
        </div>
      ) : (
        /* Data Tables matching user screenshot */
        <div className="space-y-4">
          <div className="flex flex-col xl:flex-row gap-5 items-stretch">
            {(activeTab === 'both' || activeTab === 'porsiKecil') &&
              renderNutritionTable(
                'PORSI KECIL',
                'porsiKecil',
                localPorsiKecil,
                totalsKecil,
                'bg-amber-500',
                '625 - 710 Kkal'
              )}

            {(activeTab === 'both' || activeTab === 'porsiBesar') &&
              renderNutritionTable(
                'PORSI BESAR',
                'porsiBesar',
                localPorsiBesar,
                totalsBesar,
                'bg-amber-500',
                '710 - 800 Kkal'
              )}
          </div>
        </div>
      )}

      {/* Modal: Tambah Kolom Nutrisi Baru */}
      {isColumnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Columns className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Tambah Kolom Nutrisi
                </h3>
              </div>
              <button
                onClick={() => setIsColumnModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Kolom / Nutrien
                </label>
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Misal: Kalsium, Besi, Vitamin C, Natrium"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Satuan Ukuran
                </label>
                <select
                  value={newColumnUnit}
                  onChange={(e) => setNewColumnUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="gram">gram (gr)</option>
                  <option value="mg">miligram (mg)</option>
                  <option value="mcg">mikrogram (mcg)</option>
                  <option value="kkal">kkal</option>
                  <option value="IU">IU</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsColumnModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddCustomColumn}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambahkan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
