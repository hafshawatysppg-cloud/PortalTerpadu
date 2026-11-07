/**
 * Helper sinkronisasi harga antara RAB Bahan Baku dan Food Cost
 * Sesuai instruksi:
 * 1. Sambungkan data yang ada di RAB Bahan Baku dengan harga dasar di food cost.
 * 2. Sinkronkan harga sesuai dengan tanggal pembuatan atau filter tanggal RAB.
 * 3. Jika harga di RAB Bahan Baku belum terisi pada tanggal terkait maka tabel harga dasar akan KOSONG (0 / empty string).
 */

export const getCleanIngredientKey = (name: string): string => {
  if (!name) return '';
  return name.toLowerCase().trim();
};

/**
 * Mengambil filter tanggal aktif RAB Akuntan yang tersimpan di localStorage
 */
export const getActiveRabFilterDate = (): string => {
  try {
    return localStorage.getItem('sppg_akuntan_selected_date') || '2026-11-01';
  } catch {
    return '2026-11-01';
  }
};

/**
 * Menyimpan filter tanggal aktif RAB Akuntan ke localStorage
 */
export const setActiveRabFilterDate = (dateStr: string): void => {
  if (!dateStr) return;
  try {
    localStorage.setItem('sppg_akuntan_selected_date', dateStr);
  } catch (_) {}
};

export type PriceSyncSourceMode = 'pelaksanaan' | 'filter_rab';

export interface PriceSyncContext {
  tanggalPelaksanaan?: string;
  filterDateRab?: string;      // Filter tanggal di RAB Akuntan
  preferredMode?: PriceSyncSourceMode;
}

/**
 * Mengambil daftar item RAB Bahan Baku untuk tanggal tertentu
 */
export const getRabBahanBakuForDate = (dateStr: string): any[] => {
  if (!dateStr) return [];
  try {
    // 1. Cek penyimpanan spesifik tanggal: sppg_akuntan_rab_bb_${dateStr}
    const dateKey = `sppg_akuntan_rab_bb_${dateStr}`;
    const savedDate = localStorage.getItem(dateKey);
    if (savedDate) {
      const parsed = JSON.parse(savedDate);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // 2. Cek apakah sppg_akuntan_rab_bahan_baku sedang aktif untuk tanggal ini
    const savedRab = localStorage.getItem('sppg_akuntan_rab_bahan_baku');
    if (savedRab) {
      const parsed = JSON.parse(savedRab);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Cek apakah tanggal pelaksanaan item cocok
        const hasMatchingDate = parsed.some((it: any) => it.tanggalPelaksanaan === dateStr || it.periode?.includes(dateStr));
        if (hasMatchingDate) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[rabFoodCostHelper] Error reading RAB for date:', dateStr, err);
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
 * Memperhatikan:
 * - Tanggal Pembuatan (tanggalPerencanaan)
 * - Filter Tanggal RAB Akuntan (filterDateRab)
 * - Tanggal Pelaksanaan (tanggalPelaksanaan)
 */
export const getHargaDasarFromRab = (
  namaBahan: string,
  targetDateOrContext?: string | PriceSyncContext
): number => {
  if (!namaBahan) return 0;

  // Jika argumen berupa string tanggal sederhana
  if (typeof targetDateOrContext === 'string') {
    return getHargaDasarFromRabForSingleDate(namaBahan, targetDateOrContext);
  }

  const ctx = targetDateOrContext || {};
  const rabFilter = ctx.filterDateRab || getActiveRabFilterDate();
  const tglPelaksanaan = ctx.tanggalPelaksanaan || '';
  const mode = ctx.preferredMode || 'pelaksanaan';

  // 1. Jika mode ditentukan secara eksplisit
  if (mode === 'filter_rab' && rabFilter) {
    return getHargaDasarFromRabForSingleDate(namaBahan, rabFilter);
  }
  if (mode === 'pelaksanaan' && tglPelaksanaan) {
    const p = getHargaDasarFromRabForSingleDate(namaBahan, tglPelaksanaan);
    if (p > 0) return p;
  }

  // 2. Fallback hierarki: Filter RAB -> Tanggal Pelaksanaan
  const datesToTry = [rabFilter, tglPelaksanaan].filter(Boolean) as string[];
  for (const d of datesToTry) {
    const price = getHargaDasarFromRabForSingleDate(namaBahan, d);
    if (price > 0) return price;
  }

  return 0;
};

/**
 * Menyinkronkan seluruh daftar bahan dengan harga dari tanggal yang dipilih.
 * Mengembalikan array bahan ter-update beserta statistik berapa bahan yang terisi dan kosong.
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
 * Menyinkronkan harga dasar yang diinput di Food Cost ke RAB Bahan Baku untuk satu atau lebih tanggal
 */
export const syncHargaDasarToRab = (
  namaBahan: string,
  harga: number,
  targetDates?: string | string[]
): void => {
  if (!namaBahan) return;
  const key = getCleanIngredientKey(namaBahan);
  const safeHarga = Math.max(0, Number(harga) || 0);

  // Kumpulkan semua tanggal target yang perlu diperbarui
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

  try {
    // 1. Update sppg_akuntan_saved_prices
    const priceMap: Record<string, number> = {};
    const savedPrices = localStorage.getItem('sppg_akuntan_saved_prices');
    if (savedPrices) {
      try {
        Object.assign(priceMap, JSON.parse(savedPrices));
      } catch (_) {}
    }
    priceMap[key] = safeHarga;
    localStorage.setItem('sppg_akuntan_saved_prices', JSON.stringify(priceMap));

    // 2. Update sppg_akuntan_rab_bahan_baku
    const savedRab = localStorage.getItem('sppg_akuntan_rab_bahan_baku');
    if (savedRab) {
      try {
        const items = JSON.parse(savedRab);
        if (Array.isArray(items)) {
          let found = false;
          const updated = items.map((it: any) => {
            const itKey = getCleanIngredientKey(it.namaBarang);
            if (itKey === key || itKey.includes(key) || key.includes(itKey)) {
              found = true;
              const p = Number(it.pembulatan !== undefined ? it.pembulatan : (it.totalKebutuhanKg || 1));
              return {
                ...it,
                hargaSatuan: safeHarga,
                totalAnggaran: Math.round(p * safeHarga)
              };
            }
            return it;
          });
          if (found) {
            localStorage.setItem('sppg_akuntan_rab_bahan_baku', JSON.stringify(updated));
          }
        }
      } catch (_) {}
    }

    // 3. Update spesifik tiap tanggal di dates (sppg_akuntan_rab_bb_${tgl})
    dates.forEach(d => {
      const dateKey = `sppg_akuntan_rab_bb_${d}`;
      const savedDateRab = localStorage.getItem(dateKey);
      if (savedDateRab) {
        try {
          const items = JSON.parse(savedDateRab);
          if (Array.isArray(items)) {
            let found = false;
            const updated = items.map((it: any) => {
              const itKey = getCleanIngredientKey(it.namaBarang);
              if (itKey === key || itKey.includes(key) || key.includes(itKey)) {
                found = true;
                const p = Number(it.pembulatan !== undefined ? it.pembulatan : (it.totalKebutuhanKg || 1));
                return {
                  ...it,
                  hargaSatuan: safeHarga,
                  totalAnggaran: Math.round(p * safeHarga)
                };
              }
              return it;
            });
            if (found) {
              localStorage.setItem(dateKey, JSON.stringify(updated));
            }
          }
        } catch (_) {}
      }
    });
  } catch (err) {
    console.warn('[rabFoodCostHelper] Error saving price to RAB:', err);
  }
};
