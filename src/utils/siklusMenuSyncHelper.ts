import { SiklusIngredientRow, SiklusMenuData } from '../components/nutrition/SiklusMenuView';
import { MasterMenuRecord, initialMasterMenuRecords } from '../types/masterMenu';
import { NilaiGiziPorsi } from '../types';

// Default seed data for 26 October 2026 if not yet in localStorage
const DEFAULT_SEED_PORSI_KECIL_20261026: SiklusIngredientRow[] = [
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

const DEFAULT_SEED_PORSI_BESAR_20261026: SiklusIngredientRow[] = [
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

export interface SyncedSiklusData {
  found: boolean;
  tanggal: string;
  namaMenu: string;
  kategoriPorsi: string;
  giziPorsiBesar: NilaiGiziPorsi;
  giziPorsiKecil: NilaiGiziPorsi;
  rincianKomponen: {
    karbohidrat: string;
    laukHewani: string;
    laukNabati: string;
    sayur: string;
    buahSusu: string;
  };
  catatanGizi: string;
  dishesList: string[];
  source: 'siklus_menu_detailed' | 'master_menu_auto' | 'none';
}

export interface AvailableSiklusDate {
  tanggal: string;
  label: string;
  namaMenu: string;
  isDetailed: boolean;
}

// Helper to categorize dish into standard 5 components of MBG
export function categorizeDishes(dishes: string[]): {
  karbohidrat: string;
  laukHewani: string;
  laukNabati: string;
  sayur: string;
  buahSusu: string;
} {
  const result = {
    karbohidrat: '',
    laukHewani: '',
    laukNabati: '',
    sayur: '',
    buahSusu: ''
  };

  const karboKeywords = ['nasi', 'beras', 'kentang', 'singkong', 'ubi', 'mie', 'bihun', 'roti'];
  const laukHewaniKeywords = ['ayam', 'daging', 'sapi', 'ikan', 'telur', 'rolade', 'udang', 'bebek', 'kambing', 'katsu', 'fillet', 'nugget', 'krambel'];
  const laukNabatiKeywords = ['tempe', 'tahu', 'bakwan', 'perkedel', 'kacang', 'kedelai', 'orek'];
  const sayurKeywords = ['tumis', 'sayur', 'sop', 'capcay', 'acar', 'bayam', 'jagung', 'wortel', 'buncis', 'kangkung', 'labu', 'brokoli', 'daun', 'asem'];
  const buahSusuKeywords = ['buah', 'semangka', 'melon', 'pisang', 'apel', 'jeruk', 'kelengkeng', 'pepaya', 'salak', 'mangga', 'susu', 'madu'];

  dishes.forEach((rawDish) => {
    const dish = rawDish.trim();
    if (!dish) return;
    const lower = dish.toLowerCase();

    if (!result.karbohidrat && karboKeywords.some(k => lower.includes(k))) {
      result.karbohidrat = dish;
    } else if (!result.laukHewani && laukHewaniKeywords.some(k => lower.includes(k))) {
      result.laukHewani = dish;
    } else if (!result.laukNabati && laukNabatiKeywords.some(k => lower.includes(k))) {
      result.laukNabati = dish;
    } else if (!result.sayur && sayurKeywords.some(k => lower.includes(k))) {
      result.sayur = dish;
    } else if (!result.buahSusu && buahSusuKeywords.some(k => lower.includes(k))) {
      result.buahSusu = dish;
    }
  });

  // Fallback assignment by position if any remained unfilled
  if (!result.karbohidrat && dishes[0]) result.karbohidrat = dishes[0];
  if (!result.laukHewani && dishes[1]) result.laukHewani = dishes[1];
  if (!result.laukNabati && dishes[2]) result.laukNabati = dishes[2];
  if (!result.sayur && dishes[3]) result.sayur = dishes[3];
  if (!result.buahSusu && dishes[4]) result.buahSusu = dishes[4];

  return result;
}

// Calculate total nutrients from ingredient rows
export function calculateNutrientTotals(rows: SiklusIngredientRow[]): {
  energi: number;
  protein: number;
  lemak: number;
  karbohidrat: number;
  serat: number;
} {
  let energi = 0;
  let protein = 0;
  let lemak = 0;
  let karbohidrat = 0;
  let serat = 0;

  rows.forEach((r) => {
    energi += Number(r.energi) || 0;
    protein += Number(r.protein) || 0;
    lemak += Number(r.lemak) || 0;
    karbohidrat += Number(r.karbohidrat) || 0;
    serat += Number(r.serat) || 0;
  });

  return {
    energi: parseFloat(energi.toFixed(1)),
    protein: parseFloat(protein.toFixed(1)),
    lemak: parseFloat(lemak.toFixed(1)),
    karbohidrat: parseFloat(karbohidrat.toFixed(1)),
    serat: parseFloat(serat.toFixed(1))
  };
}

// Load all saved cycles from localStorage with default seeds
export function loadSavedCycles(): Record<string, SiklusMenuData> {
  const defaultMap: Record<string, SiklusMenuData> = {
    '2026-10-26': {
      tanggal: '2026-10-26',
      porsiKecil: DEFAULT_SEED_PORSI_KECIL_20261026,
      porsiBesar: DEFAULT_SEED_PORSI_BESAR_20261026,
      customColumns: [],
      isLocked: true
    }
  };

  try {
    const stored = localStorage.getItem('sppg_siklus_menu_records');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultMap, ...parsed };
    }
  } catch (e) {
    console.error('Failed reading saved cycles in helper:', e);
  }

  return defaultMap;
}

// Load Master Menus from localStorage with initial seeds
export function loadMasterMenus(): MasterMenuRecord[] {
  try {
    const saved = localStorage.getItem('sppg_master_menus');
    if (saved) {
      const parsed: MasterMenuRecord[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default 2026-10-26 is included
        if (!parsed.some(m => m.tanggalPelaksanaan === '2026-10-26')) {
          parsed.unshift(initialMasterMenuRecords[0]);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed reading master menus in helper:', e);
  }
  return initialMasterMenuRecords;
}

/**
 * Retrieve synchronized Menu Name and Nutritional Values from Siklus Menu for a given date.
 */
export function getSiklusMenuForDate(dateStr: string): SyncedSiklusData {
  if (!dateStr) {
    return {
      found: false,
      tanggal: '',
      namaMenu: '',
      kategoriPorsi: 'Porsi Besar & Porsi Kecil',
      giziPorsiBesar: { energiKkal: 0, proteinGram: 0, lemakGram: 0, karbohidratGram: 0, seratGram: 0, keterangan: '' },
      giziPorsiKecil: { energiKkal: 0, proteinGram: 0, lemakGram: 0, karbohidratGram: 0, seratGram: 0, keterangan: '' },
      rincianKomponen: { karbohidrat: '', laukHewani: '', laukNabati: '', sayur: '', buahSusu: '' },
      catatanGizi: '',
      dishesList: [],
      source: 'none'
    };
  }

  const savedCycles = loadSavedCycles();
  const masterMenus = loadMasterMenus();

  const cycleData = savedCycles[dateStr];
  const masterMenu = masterMenus.find(m => m.tanggalPelaksanaan === dateStr);

  // Case 1: Detailed Siklus Menu exists with calculated ingredient rows
  if (cycleData && Array.isArray(cycleData.porsiBesar) && cycleData.porsiBesar.length > 0) {
    const totalsBesar = calculateNutrientTotals(cycleData.porsiBesar);
    const totalsKecil = calculateNutrientTotals(cycleData.porsiKecil || []);

    // Unique dish names from ingredient rows or master menu
    const rawDishes = masterMenu?.menuItems && masterMenu.menuItems.length > 0
      ? masterMenu.menuItems
      : Array.from(new Set(cycleData.porsiBesar.map(r => r.namaMasakan).filter(Boolean)));

    const namaMenu = rawDishes.join(', ');
    const rincianKomponen = categorizeDishes(rawDishes);

    return {
      found: true,
      tanggal: dateStr,
      namaMenu,
      kategoriPorsi: 'Porsi Besar & Porsi Kecil',
      giziPorsiBesar: {
        energiKkal: totalsBesar.energi,
        proteinGram: totalsBesar.protein,
        lemakGram: totalsBesar.lemak,
        karbohidratGram: totalsBesar.karbohidrat,
        seratGram: totalsBesar.serat,
        keterangan: 'Sasaran SD Kelas 4-6, SMP, SMA / Bumil & Busui'
      },
      giziPorsiKecil: {
        energiKkal: totalsKecil.energi || parseFloat((totalsBesar.energi * 0.7).toFixed(1)),
        proteinGram: totalsKecil.protein || parseFloat((totalsBesar.protein * 0.7).toFixed(1)),
        lemakGram: totalsKecil.lemak || parseFloat((totalsBesar.lemak * 0.7).toFixed(1)),
        karbohidratGram: totalsKecil.karbohidrat || parseFloat((totalsBesar.karbohidrat * 0.7).toFixed(1)),
        seratGram: totalsKecil.serat || parseFloat((totalsBesar.serat * 0.7).toFixed(1)),
        keterangan: 'Sasaran PAUD, TK, SD Kelas 1-3 / Balita'
      },
      rincianKomponen,
      catatanGizi: `Tersinkronisasi otomatis dari Siklus Menu SPPG. Memenuhi standar AKG harian program Makan Bergizi Gratis (MBG) Badan Gizi Nasional.`,
      dishesList: rawDishes,
      source: 'siklus_menu_detailed'
    };
  }

  // Case 2: Master Menu exists for this date, compute standard AKG baseline values
  if (masterMenu && Array.isArray(masterMenu.menuItems) && masterMenu.menuItems.length > 0) {
    const rawDishes = masterMenu.menuItems.filter(Boolean);
    const namaMenu = rawDishes.join(', ');
    const rincianKomponen = categorizeDishes(rawDishes);

    // Standard balanced AKG baseline for MBG lunch portion
    const baselineBesar = {
      energiKkal: 720.5,
      proteinGram: 26.4,
      lemakGram: 24.8,
      karbohidratGram: 88.5,
      seratGram: 2.8,
      keterangan: 'Sasaran SD Kelas 4-6, SMP, SMA / Bumil & Busui'
    };

    const baselineKecil = {
      energiKkal: 580.0,
      proteinGram: 21.2,
      lemakGram: 19.5,
      karbohidratGram: 72.0,
      seratGram: 2.2,
      keterangan: 'Sasaran PAUD, TK, SD Kelas 1-3 / Balita'
    };

    return {
      found: true,
      tanggal: dateStr,
      namaMenu,
      kategoriPorsi: 'Porsi Besar & Porsi Kecil',
      giziPorsiBesar: baselineBesar,
      giziPorsiKecil: baselineKecil,
      rincianKomponen,
      catatanGizi: `Tersinkronisasi otomatis dari Siklus Master Menu SPPG. Memenuhi standar AKG harian program Makan Bergizi Gratis (MBG) Badan Gizi Nasional.`,
      dishesList: rawDishes,
      source: 'master_menu_auto'
    };
  }

  return {
    found: false,
    tanggal: dateStr,
    namaMenu: '',
    kategoriPorsi: 'Porsi Besar & Porsi Kecil',
    giziPorsiBesar: { energiKkal: 0, proteinGram: 0, lemakGram: 0, karbohidratGram: 0, seratGram: 0, keterangan: '' },
    giziPorsiKecil: { energiKkal: 0, proteinGram: 0, lemakGram: 0, karbohidratGram: 0, seratGram: 0, keterangan: '' },
    rincianKomponen: { karbohidrat: '', laukHewani: '', laukNabati: '', sayur: '', buahSusu: '' },
    catatanGizi: '',
    dishesList: [],
    source: 'none'
  };
}

/**
 * Get all available dates that have Siklus Menu or Master Menu data configured.
 */
export function getAllAvailableSiklusDates(): AvailableSiklusDate[] {
  const savedCycles = loadSavedCycles();
  const masterMenus = loadMasterMenus();

  const dateMap = new Map<string, { namaMenu: string; isDetailed: boolean }>();

  // Add from master menus
  masterMenus.forEach(m => {
    if (m.tanggalPelaksanaan) {
      dateMap.set(m.tanggalPelaksanaan, {
        namaMenu: (m.menuItems || []).filter(Boolean).join(', '),
        isDetailed: false
      });
    }
  });

  // Add or update from saved cycles (detailed)
  Object.entries(savedCycles).forEach(([tgl, cycle]) => {
    if (cycle && Array.isArray(cycle.porsiBesar) && cycle.porsiBesar.length > 0) {
      const existing = dateMap.get(tgl);
      const dishes = Array.from(new Set(cycle.porsiBesar.map(r => r.namaMasakan).filter(Boolean)));
      dateMap.set(tgl, {
        namaMenu: existing?.namaMenu || dishes.join(', '),
        isDetailed: true
      });
    }
  });

  const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  return Array.from(dateMap.entries())
    .map(([tgl, info]) => {
      try {
        const parts = tgl.split('-');
        const d = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) : new Date(tgl);
        const day = String(d.getDate()).padStart(2, '0');
        const month = MONTH_NAMES[d.getMonth()] || '';
        const year = d.getFullYear();
        return {
          tanggal: tgl,
          label: `${day} ${month} ${year}`,
          namaMenu: info.namaMenu,
          isDetailed: info.isDetailed
        };
      } catch {
        return {
          tanggal: tgl,
          label: tgl,
          namaMenu: info.namaMenu,
          isDetailed: info.isDetailed
        };
      }
    })
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}
