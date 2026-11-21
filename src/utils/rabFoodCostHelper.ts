/**
 * Helper sinkronisasi harga antara RAB Bahan Baku dan Food Cost
 * Berbasis sumber kebenaran tunggal Firestore melalui firestoreOperationalStore.
 */
import {
  getAkuntanConfigsSnapshot,
  getRabBahanBakuSnapshot,
  replaceAkuntanDocsForPredicate,
  updateAkuntanConfigDoc,
  updateNutritionPlanPriceInFirestore
} from '../lib/firestoreOperationalStore';
import { OperationType, notifyFirestoreFailure } from '../lib/firestoreHelper';

export const getCleanIngredientKey = (name: string): string => {
  if (!name) return '';
  return name.toLowerCase().trim();
};

/**
 * Mengambil filter tanggal aktif RAB Akuntan dari Firestore config snapshot
 */
export const getActiveRabFilterDate = (): string => {
  try {
    return getAkuntanConfigsSnapshot().selectedDate || '2026-11-01';
  } catch {
    return '2026-11-01';
  }
};

/**
 * Menyimpan filter tanggal aktif RAB Akuntan ke Firestore config
 */
export const setActiveRabFilterDate = (dateStr: string): void => {
  if (!dateStr) return;
  void updateAkuntanConfigDoc({ selectedDate: dateStr }).catch((err) => {
    notifyFirestoreFailure(err, OperationType.UPDATE, 'akuntan_configs/main', 'Gagal menyimpan filter tanggal aktif RAB ke Firebase');
  });
};

export type PriceSyncSourceMode = 'pelaksanaan' | 'filter_rab';

export interface PriceSyncContext {
  tanggalPelaksanaan?: string;
  filterDateRab?: string;      // Filter tanggal di RAB Akuntan
  preferredMode?: PriceSyncSourceMode;
}

/**
 * Mengambil daftar item RAB Bahan Baku untuk tanggal tertentu dari Firestore snapshot
 */
export const getRabBahanBakuForDate = (dateStr: string): any[] => {
  if (!dateStr) return [];
  try {
    const allItems = getRabBahanBakuSnapshot();
    const matched = allItems.filter(
      (it: any) =>
        it.tanggalPelaksanaan === dateStr ||
        (typeof it.periode === 'string' && it.periode.includes(dateStr))
    );
    return matched;
  } catch (err) {
    console.error('[rabFoodCostHelper] Error reading RAB for date from Firestore store:', dateStr, err);
  }
  return [];
};

/**
 * Mengambil harga dasar bahan dari RAB Bahan Baku spesifik untuk satu tanggal.
 * Jika pada tanggal tersebut belum diisi oleh akuntan/admin, kembalikan 0 (kosong).
 */
export const getHargaDasarFromRabForSingleDate = (namaBahan: string, targetDate: string): number => {
  if (!namaBahan || !targetDate) return 0;
  const key = getCleanIngredientKey(namaBahan);
  const items = getRabBahanBakuForDate(targetDate);
  if (!items || items.length === 0) return 0;

  // 1. Exact match
  const exact = items.find((it: any) => getCleanIngredientKey(it.namaBarang) === key);
  if (exact) {
    const h = Number(exact.hargaSatuan);
    return h > 0 ? h : 0;
  }

  // 2. Fuzzy match (misal: "Beras kepompong 25kg" vs "Beras kepompong")
  const fuzzy = items.find((it: any) => {
    const itKey = getCleanIngredientKey(it.namaBarang);
    return itKey.includes(key) || key.includes(itKey);
  });
  if (fuzzy) {
    const h = Number(fuzzy.hargaSatuan);
    return h > 0 ? h : 0;
  }

  return 0;
};

/**
 * Mengambil harga dasar bahan dari RAB Bahan Baku dengan sinkronisasi cerdas
 */
export const getHargaDasarFromRab = (
  namaBahan: string,
  targetDateOrContext?: string | PriceSyncContext
): number => {
  if (!namaBahan) return 0;

  if (typeof targetDateOrContext === 'string') {
    return getHargaDasarFromRabForSingleDate(namaBahan, targetDateOrContext);
  }

  const ctx = targetDateOrContext || {};
  const rabFilter = ctx.filterDateRab || getActiveRabFilterDate();
  const tglPelaksanaan = ctx.tanggalPelaksanaan || '';
  const mode = ctx.preferredMode || 'pelaksanaan';

  if (mode === 'filter_rab' && rabFilter) {
    return getHargaDasarFromRabForSingleDate(namaBahan, rabFilter);
  }
  if (mode === 'pelaksanaan' && tglPelaksanaan) {
    const p = getHargaDasarFromRabForSingleDate(namaBahan, tglPelaksanaan);
    if (p > 0) return p;
  }

  const datesToTry = [rabFilter, tglPelaksanaan].filter(Boolean) as string[];
  for (const d of datesToTry) {
    const price = getHargaDasarFromRabForSingleDate(namaBahan, d);
    if (price > 0) return price;
  }

  return 0;
};

/**
 * Menyinkronkan seluruh daftar bahan dengan harga dari tanggal yang dipilih.
 */
export const syncAllIngredientsWithRabDate = (
  ingredients: any[],
  targetDate: string
): { updatedIngredients: any[]; filledCount: number; emptyCount: number } => {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return { updatedIngredients: [], filledCount: 0, emptyCount: 0 };
  }

  let filledCount = 0;
  let emptyCount = 0;

  const updatedIngredients = ingredients.map(item => {
    const nama = item.bahanPangan || item.ingredientName || '';
    const rabPrice = getHargaDasarFromRabForSingleDate(nama, targetDate);
    if (rabPrice > 0) {
      filledCount++;
    } else {
      emptyCount++;
    }
    return {
      ...item,
      hargaPerKg: rabPrice > 0 ? rabPrice : 0
    };
  });

  return { updatedIngredients, filledCount, emptyCount };
};

/**
 * Menyinkronkan harga dasar yang diinput di Food Cost ke RAB Bahan Baku & Config di Firestore
 */
export const syncHargaDasarToRab = (
  namaBahan: string,
  harga: number,
  targetDates?: string | string[]
): void => {
  if (!namaBahan) return;
  const key = getCleanIngredientKey(namaBahan);
  const safeHarga = Math.max(0, Number(harga) || 0);

  const dates: string[] = [];
  if (typeof targetDates === 'string' && targetDates) {
    dates.push(targetDates);
  } else if (Array.isArray(targetDates)) {
    dates.push(...targetDates.filter(Boolean));
  }
  const activeRabDate = getActiveRabFilterDate();
  if (activeRabDate && !dates.includes(activeRabDate)) {
    dates.push(activeRabDate);
  }

  // Jalankan persistensi Firestore secara asinkron dengan penanganan error
  void (async () => {
    try {
      const cfg = getAkuntanConfigsSnapshot();
      const nextSavedPrices = { ...(cfg.savedPrices || {}), [key]: safeHarga };
      await updateAkuntanConfigDoc({ savedPrices: nextSavedPrices });

      const allItems = getRabBahanBakuSnapshot();
      const toUpdate = allItems
        .filter((it: any) => {
          const matchesDate =
            dates.length === 0 ||
            dates.includes(it.tanggalPelaksanaan || '') ||
            dates.some((d) => typeof it.periode === 'string' && it.periode.includes(d));
          if (!matchesDate) return false;
          const itKey = getCleanIngredientKey(it.namaBarang);
          return itKey === key || itKey.includes(key) || key.includes(itKey);
        })
        .map((it: any) => {
          const p = Number(it.pembulatan !== undefined ? it.pembulatan : (it.totalKebutuhanKg || 1));
          return {
            ...it,
            hargaSatuan: safeHarga,
            totalAnggaran: Math.round(p * safeHarga)
          };
        });

      if (toUpdate.length > 0) {
        await replaceAkuntanDocsForPredicate('akuntan_rab_bahan_baku', toUpdate, []);
      }

      for (const d of dates) {
        await updateNutritionPlanPriceInFirestore(d, key, safeHarga);
      }
    } catch (err) {
      notifyFirestoreFailure(err, OperationType.UPDATE, 'akuntan_rab_bahan_baku', 'Gagal menyinkronkan harga dasar bahan ke Firebase');
    }
  })();
};
