import { isSupabaseConfigured } from './supabase';
import {
  batchSyncSupabaseDocs,
  deleteSupabaseDoc,
  fetchSupabaseDoc,
  subscribeSupabaseCollection,
  subscribeSupabaseDoc,
  upsertSupabaseDoc
} from './supabaseService';
import {
  OperationType,
  generateUniqueDocId,
  notifyFirestoreFailure,
  sanitizeForFirestore
} from './firestoreHelper';
import { safeParseJson } from './safeJson';
import { MasterMenuRecord, initialMasterMenuRecords } from '../types/masterMenu';
import type { SiklusIngredientRow, SiklusMenuData } from '../components/nutrition/SiklusMenuView';
import type {
  GajiKaryawanRecord,
  GajiStafRecord,
  InsentifFasilitasRecord,
  InsentifPicRecord,
  OperasionalLainnyaItem,
  RabBahanBakuItem,
  RabOperasionalBarangItem,
  RealisasiBahanBakuItem,
  RealisasiOperasionalItem,
  RekapGajiHarianSavedRecord,
  SlipGajiNumberingConfig
} from '../types/akuntan';
import {
  initialInsentifFasilitas,
  initialRealisasiBahanBaku,
  initialRealisasiOperasional
} from '../data/akuntanSeedData';

export const DEFAULT_SLIP_GAJI_NUMBERING: SlipGajiNumberingConfig = {
  nextNomorUrut: 67,
  digitLength: 3,
  kodeJenis: 'SLIP.GAJI',
  kodeInstansi: 'SPPG-TMG',
  autoIncrementAfterPrint: true
};

export interface AkuntanConfigState {
  selectedDate: string;
  rabBbLocked: boolean;
  rabOpLocked: boolean;
  opLainnyaLocked: boolean;
  rabOpBarangConfigured: boolean;
  gajiKaryawanConfigured: boolean;
  picLembagaConfigured: boolean;
  picPosyanduConfigured: boolean;
  opLainnyaConfigured: boolean;
  realisasiBbLockedMap: Record<string, boolean>;
  realisasiOpLockedMap: Record<string, boolean>;
  gajiKaryawanLockedMap: Record<string, boolean>;
  rekapGajiHarianMap: Record<string, RekapGajiHarianSavedRecord>;
  savedPrices: Record<string, number>;
  slipGajiNumbering: SlipGajiNumberingConfig;
}

const DEFAULT_AKUNTAN_CONFIG: AkuntanConfigState = {
  selectedDate: '2026-11-01',
  rabBbLocked: false,
  rabOpLocked: false,
  opLainnyaLocked: false,
  rabOpBarangConfigured: false,
  gajiKaryawanConfigured: false,
  picLembagaConfigured: false,
  picPosyanduConfigured: false,
  opLainnyaConfigured: false,
  realisasiBbLockedMap: {},
  realisasiOpLockedMap: {},
  gajiKaryawanLockedMap: {},
  rekapGajiHarianMap: {},
  savedPrices: {},
  slipGajiNumbering: { ...DEFAULT_SLIP_GAJI_NUMBERING }
};

function mergeAkuntanConfigState(
  base: AkuntanConfigState,
  patch?: Partial<AkuntanConfigState> | null
): AkuntanConfigState {
  if (!patch) return base;
  return {
    ...base,
    ...patch,
    slipGajiNumbering: {
      ...DEFAULT_SLIP_GAJI_NUMBERING,
      ...(base.slipGajiNumbering || {}),
      ...(patch.slipGajiNumbering || {})
    }
  };
}

const SEED_SIKLUS_20261026: SiklusMenuData & { id: string } = {
  id: 'siklus_seed_20261026',
  tanggal: '2026-10-26',
  porsiKecil: [
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
    { id: 'pk-11', pairKey: 'p-11', namaMasakan: 'Semangka kuning', bahanMasakan: 'Semangka kuning', beratBersih: 100, energi: 28, protein: 0.5, lemak: 0.2, karbohidrat: 6.9, serat: 0.4 }
  ] as SiklusIngredientRow[],
  porsiBesar: [
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
    { id: 'pb-11', pairKey: 'p-11', namaMasakan: 'Semangka kuning', bahanMasakan: 'Semangka kuning', beratBersih: 100, energi: 28, protein: 0.5, lemak: 0.2, karbohidrat: 6.9, serat: 0.4 }
  ] as SiklusIngredientRow[],
  customColumns: [],
  isLocked: true
};

interface OperationalState {
  masterMenus: MasterMenuRecord[];
  masterMenusLoaded: boolean;
  siklusCycles: Record<string, SiklusMenuData & { id?: string }>;
  siklusCyclesLoaded: boolean;
  akuntanConfigs: AkuntanConfigState;
  akuntanConfigsLoaded: boolean;
  rabBahanBaku: RabBahanBakuItem[];
  rabOpBarang: RabOperasionalBarangItem[];
  gajiKaryawan: GajiKaryawanRecord[];
  picLembaga: InsentifPicRecord[];
  picPosyandu: InsentifPicRecord[];
  gajiStaf: GajiStafRecord[];
  opLainnya: OperasionalLainnyaItem[];
  insentifFasilitas: InsentifFasilitasRecord[];
  realisasiBb: RealisasiBahanBakuItem[];
  realisasiOp: RealisasiOperasionalItem[];
  nutritionPlans: any[];
  barangDatang: any[];
}

const state: OperationalState = {
  masterMenus: [...initialMasterMenuRecords],
  masterMenusLoaded: false,
  siklusCycles: { '2026-10-26': SEED_SIKLUS_20261026 },
  siklusCyclesLoaded: false,
  akuntanConfigs: { ...DEFAULT_AKUNTAN_CONFIG },
  akuntanConfigsLoaded: false,
  rabBahanBaku: [],
  rabOpBarang: [],
  gajiKaryawan: [],
  picLembaga: [],
  picPosyandu: [],
  gajiStaf: [],
  opLainnya: [],
  insentifFasilitas: [...initialInsentifFasilitas],
  realisasiBb: [...initialRealisasiBahanBaku],
  realisasiOp: [...initialRealisasiOperasional],
  nutritionPlans: [],
  barangDatang: []
};

export type StoreSliceKey =
  | 'masterMenus'
  | 'siklusCycles'
  | 'akuntanConfigs'
  | 'rabBahanBaku'
  | 'rabOpBarang'
  | 'gajiKaryawan'
  | 'picLembaga'
  | 'picPosyandu'
  | 'gajiStaf'
  | 'opLainnya'
  | 'insentifFasilitas'
  | 'realisasiBb'
  | 'realisasiOp'
  | 'nutritionPlans'
  | 'barangDatang';

const listeners = new Map<StoreSliceKey, Set<() => void>>();
const unsubscribers: Array<() => void> = [];
let storeInitialized = false;
let seedFlagsCache: Record<string, boolean> | null = null;
let seedFlagsPromise: Promise<Record<string, boolean>> | null = null;
let serverPersistTimer: ReturnType<typeof setTimeout> | null = null;
let serverHydrationPromise: Promise<void> | null = null;

const COLLECTION_SLICE_MAP: Record<string, StoreSliceKey> = {
  akuntan_rab_bahan_baku: 'rabBahanBaku',
  akuntan_rab_op_barang: 'rabOpBarang',
  akuntan_gaji_karyawan: 'gajiKaryawan',
  akuntan_pic_lembaga: 'picLembaga',
  akuntan_pic_posyandu: 'picPosyandu',
  akuntan_gaji_staf: 'gajiStaf',
  akuntan_op_lainnya: 'opLainnya',
  akuntan_insentif_fasilitas: 'insentifFasilitas',
  akuntan_realisasi_bb: 'realisasiBb',
  akuntan_realisasi_op: 'realisasiOp',
  nutritionPlans: 'nutritionPlans',
  barangDatang: 'barangDatang'
};

function notifySlice(key: StoreSliceKey) {
  const subs = listeners.get(key);
  if (subs) {
    subs.forEach((cb) => {
      try {
        cb();
      } catch (_) {}
    });
  }
  if (typeof window !== 'undefined') {
    if (key === 'masterMenus') {
      window.dispatchEvent(new CustomEvent('sppg-master-menu-updated', { detail: state.masterMenus }));
    } else if (key === 'siklusCycles') {
      window.dispatchEvent(new CustomEvent('sppg_siklus_menu_changed'));
    } else if (key === 'rabBahanBaku' || key === 'akuntanConfigs') {
      window.dispatchEvent(new CustomEvent('sppg-akuntan-rab-updated'));
    }
  }
}

function getSerializableSlices(): Record<string, any> {
  return {
    masterMenus: state.masterMenus,
    siklusCycles: state.siklusCycles,
    akuntanConfigs: state.akuntanConfigs,
    rabBahanBaku: state.rabBahanBaku,
    rabOpBarang: state.rabOpBarang,
    gajiKaryawan: state.gajiKaryawan,
    picLembaga: state.picLembaga,
    picPosyandu: state.picPosyandu,
    gajiStaf: state.gajiStaf,
    opLainnya: state.opLainnya,
    insentifFasilitas: state.insentifFasilitas,
    realisasiBb: state.realisasiBb,
    realisasiOp: state.realisasiOp,
    nutritionPlans: state.nutritionPlans,
    barangDatang: state.barangDatang
  };
}

function schedulePersistOperationalSnapshot(delayMs = 500): void {
  if (typeof window === 'undefined') return;
  if (serverPersistTimer) clearTimeout(serverPersistTimer);
  serverPersistTimer = setTimeout(async () => {
    serverPersistTimer = null;
    try {
      await fetch('/api/v1/cloud/operational-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slices: getSerializableSlices() })
      });
    } catch (_) {}
  }, delayMs);
}

async function hydrateOperationalStoreFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (serverHydrationPromise) return serverHydrationPromise;

  serverHydrationPromise = (async () => {
    try {
      const res = await fetch('/api/v1/cloud/operational-snapshot');
      if (!res.ok) return;
      const json = await safeParseJson<{ success?: boolean; data?: Record<string, any>; slices?: Record<string, any> }>(res);
      const slices = json?.slices || json?.data;
      if (!slices || typeof slices !== 'object') return;

      const updatedSlices: StoreSliceKey[] = [];
      if (Array.isArray(slices.masterMenus) && slices.masterMenus.length > 0) {
        state.masterMenus = slices.masterMenus;
        updatedSlices.push('masterMenus');
      }
      if (slices.siklusCycles && typeof slices.siklusCycles === 'object' && Object.keys(slices.siklusCycles).length > 0) {
        state.siklusCycles = slices.siklusCycles;
        updatedSlices.push('siklusCycles');
      }
      if (slices.akuntanConfigs && typeof slices.akuntanConfigs === 'object') {
        state.akuntanConfigs = mergeAkuntanConfigState(
          DEFAULT_AKUNTAN_CONFIG,
          slices.akuntanConfigs as Partial<AkuntanConfigState>
        );
        updatedSlices.push('akuntanConfigs');
      }

      const arrayKeys: Array<Exclude<StoreSliceKey, 'masterMenus' | 'siklusCycles' | 'akuntanConfigs'>> = [
        'rabBahanBaku',
        'rabOpBarang',
        'gajiKaryawan',
        'picLembaga',
        'picPosyandu',
        'gajiStaf',
        'opLainnya',
        'insentifFasilitas',
        'realisasiBb',
        'realisasiOp',
        'nutritionPlans',
        'barangDatang'
      ];
      for (const k of arrayKeys) {
        if (Array.isArray(slices[k]) && slices[k].length > 0) {
          (state as any)[k] = slices[k];
          updatedSlices.push(k);
        }
      }

      state.masterMenusLoaded = true;
      state.siklusCyclesLoaded = true;
      state.akuntanConfigsLoaded = true;
      updatedSlices.forEach((k) => notifySlice(k));
    } catch (_) {
    } finally {
      serverHydrationPromise = null;
    }
  })();

  return serverHydrationPromise;
}

export function subscribeOperationalSlice(key: StoreSliceKey, listener: () => void): () => void {
  if (!storeInitialized) {
    initOperationalFirestoreStore();
  }
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
  };
}

async function getSeedFlags(): Promise<Record<string, boolean>> {
  if (seedFlagsCache) return seedFlagsCache;
  if (!isSupabaseConfigured) return {};
  if (seedFlagsPromise) return seedFlagsPromise;

  seedFlagsPromise = (async () => {
    try {
      const docData = await fetchSupabaseDoc<Record<string, boolean>>('app_meta', 'seed_flags');
      seedFlagsCache = docData || {};
      return seedFlagsCache;
    } catch (err) {
      console.warn('Gagal memeriksa status seed Supabase:', err);
      return {};
    } finally {
      seedFlagsPromise = null;
    }
  })();
  return seedFlagsPromise;
}

async function markSeedFlag(flagKey: string): Promise<void> {
  seedFlagsCache = { ...(seedFlagsCache || {}), [flagKey]: true };
  if (!isSupabaseConfigured) return;
  try {
    await upsertSupabaseDoc('app_meta', 'seed_flags', seedFlagsCache);
  } catch (err) {
    console.warn(`Gagal menandai seed flag ${flagKey}:`, err);
  }
}

function attachCollectionListener<T extends { id: string }>(
  collectionName: string,
  sliceKey: StoreSliceKey,
  assign: (items: T[]) => void,
  options?: { seedItems?: T[]; seedFlag?: string }
): void {
  if (!isSupabaseConfigured) return;
  try {
    const unsub = subscribeSupabaseCollection<T>(
      collectionName,
      (list) => {
        if (list.length > 0) {
          assign(list);
          notifySlice(sliceKey);
          schedulePersistOperationalSnapshot();
        }
      },
      {
        seedIfEmpty:
          options?.seedItems && options.seedItems.length > 0 && options.seedFlag
            ? async () => {
                const flags = await getSeedFlags();
                if (!flags[options.seedFlag!]) {
                  await batchSyncSupabaseDocs(
                    collectionName,
                    options.seedItems!.map((item) => {
                      const docId = item.id || generateUniqueDocId(collectionName);
                      return {
                        type: 'set' as const,
                        id: docId,
                        data: sanitizeForFirestore({ ...item, id: docId })
                      };
                    })
                  );
                  await markSeedFlag(options.seedFlag!);
                }
              }
            : undefined,
        onError: (err) => {
          notifyFirestoreFailure(err, OperationType.GET, collectionName, `Gagal sinkronisasi real-time ${collectionName}`);
        }
      }
    );
    unsubscribers.push(unsub);
  } catch (err) {
    notifyFirestoreFailure(err, OperationType.GET, collectionName, `Gagal membuka listener ${collectionName}`);
  }
}

export function initOperationalFirestoreStore(): void {
  if (storeInitialized || typeof window === 'undefined') return;
  storeInitialized = true;

  void hydrateOperationalStoreFromServer();

  if (!isSupabaseConfigured) {
    state.masterMenusLoaded = true;
    state.siklusCyclesLoaded = true;
    state.akuntanConfigsLoaded = true;
    return;
  }

  // 1. Master Menus
  attachCollectionListener<MasterMenuRecord>(
    'master_menus',
    'masterMenus',
    (items) => {
      state.masterMenus = items.sort((a, b) =>
        (b.tanggalPelaksanaan || '').localeCompare(a.tanggalPelaksanaan || '')
      );
      state.masterMenusLoaded = true;
    },
    { seedItems: initialMasterMenuRecords, seedFlag: 'masterMenusSeeded' }
  );

  // 2. Siklus Menu
  try {
    const unsubSiklus = subscribeSupabaseCollection<SiklusMenuData & { id?: string }>(
      'siklus_menu',
      (items) => {
        const map: Record<string, SiklusMenuData & { id?: string }> = {};
        items.forEach((d) => {
          if (d?.tanggal) {
            map[d.tanggal] = d;
          }
        });
        if (Object.keys(map).length > 0) {
          state.siklusCycles = map;
        }
        state.siklusCyclesLoaded = true;
        notifySlice('siklusCycles');
        schedulePersistOperationalSnapshot();
      },
      {
        seedIfEmpty: async () => {
          const flags = await getSeedFlags();
          if (!flags.siklusMenuSeeded) {
            await upsertSupabaseDoc('siklus_menu', SEED_SIKLUS_20261026.id, sanitizeForFirestore(SEED_SIKLUS_20261026));
            await markSeedFlag('siklusMenuSeeded');
          }
        },
        onError: (err) => {
          notifyFirestoreFailure(err, OperationType.GET, 'siklus_menu', 'Gagal sinkronisasi real-time Siklus Menu');
        }
      }
    );
    unsubscribers.push(unsubSiklus);
  } catch (err) {
    notifyFirestoreFailure(err, OperationType.GET, 'siklus_menu', 'Gagal membuka listener Siklus Menu');
  }

  // 3. Akuntan Configs single doc
  try {
    const unsubCfg = subscribeSupabaseDoc<Partial<AkuntanConfigState>>(
      'akuntan_configs',
      'main',
      (docData) => {
        if (docData) {
          state.akuntanConfigs = mergeAkuntanConfigState(DEFAULT_AKUNTAN_CONFIG, docData);
        }
        state.akuntanConfigsLoaded = true;
        notifySlice('akuntanConfigs');
        schedulePersistOperationalSnapshot();
      },
      (err) => {
        notifyFirestoreFailure(err, OperationType.GET, 'akuntan_configs/main', 'Gagal memuat konfigurasi Akuntan dari Supabase');
      }
    );
    unsubscribers.push(unsubCfg);
  } catch (err) {
    notifyFirestoreFailure(err, OperationType.GET, 'akuntan_configs/main', 'Gagal membuka listener konfigurasi Akuntan');
  }

  // 4. Akuntan Item Collections
  attachCollectionListener<RabBahanBakuItem>('akuntan_rab_bahan_baku', 'rabBahanBaku', (items) => {
    state.rabBahanBaku = items;
  });
  attachCollectionListener<RabOperasionalBarangItem>('akuntan_rab_op_barang', 'rabOpBarang', (items) => {
    state.rabOpBarang = items;
  });
  attachCollectionListener<GajiKaryawanRecord>('akuntan_gaji_karyawan', 'gajiKaryawan', (items) => {
    state.gajiKaryawan = items;
  });
  attachCollectionListener<InsentifPicRecord>('akuntan_pic_lembaga', 'picLembaga', (items) => {
    state.picLembaga = items;
  });
  attachCollectionListener<InsentifPicRecord>('akuntan_pic_posyandu', 'picPosyandu', (items) => {
    state.picPosyandu = items;
  });
  attachCollectionListener<GajiStafRecord>('akuntan_gaji_staf', 'gajiStaf', (items) => {
    state.gajiStaf = items;
  });
  attachCollectionListener<OperasionalLainnyaItem>('akuntan_op_lainnya', 'opLainnya', (items) => {
    state.opLainnya = items;
  });
  attachCollectionListener<InsentifFasilitasRecord>(
    'akuntan_insentif_fasilitas',
    'insentifFasilitas',
    (items) => {
      state.insentifFasilitas = items;
    },
    { seedItems: initialInsentifFasilitas, seedFlag: 'akuntanInsentifFasilitasSeeded' }
  );
  attachCollectionListener<RealisasiBahanBakuItem>(
    'akuntan_realisasi_bb',
    'realisasiBb',
    (items) => {
      state.realisasiBb = items;
    },
    { seedItems: initialRealisasiBahanBaku, seedFlag: 'akuntanRealisasiBbSeeded' }
  );
  attachCollectionListener<RealisasiOperasionalItem>(
    'akuntan_realisasi_op',
    'realisasiOp',
    (items) => {
      state.realisasiOp = items;
    },
    { seedItems: initialRealisasiOperasional, seedFlag: 'akuntanRealisasiOpSeeded' }
  );

  // 5. Nutrition Plans & Barang Datang read mirrors for Akuntan
  attachCollectionListener<any>('nutritionPlans', 'nutritionPlans', (items) => {
    state.nutritionPlans = items;
  });
  attachCollectionListener<any>('barangDatang', 'barangDatang', (items) => {
    state.barangDatang = items;
  });
}

// Synchronous Snapshot Getters (backed by live Supabase Realtime + server snapshot)
export const getMasterMenusSnapshot = (): MasterMenuRecord[] => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.masterMenus;
};
export const getSiklusCyclesSnapshot = (): Record<string, SiklusMenuData & { id?: string }> => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.siklusCycles;
};
export const getAkuntanConfigsSnapshot = (): AkuntanConfigState => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.akuntanConfigs;
};
export const getRabBahanBakuSnapshot = (): RabBahanBakuItem[] => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.rabBahanBaku;
};
export const getRabOpBarangSnapshot = (): RabOperasionalBarangItem[] => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.rabOpBarang;
};
export const getGajiKaryawanSnapshot = (): GajiKaryawanRecord[] => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.gajiKaryawan;
};
export const getPicLembagaSnapshot = (): InsentifPicRecord[] => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.picLembaga;
};
export const getPicPosyanduSnapshot = (): InsentifPicRecord[] => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.picPosyandu;
};
export const getGajiStafSnapshot = (): GajiStafRecord[] => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.gajiStaf;
};
export const getOpLainnyaSnapshot = (): OperasionalLainnyaItem[] => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.opLainnya;
};
export const getInsentifFasilitasSnapshot = (): InsentifFasilitasRecord[] => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.insentifFasilitas;
};
export const getRealisasiBbSnapshot = (): RealisasiBahanBakuItem[] => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.realisasiBb;
};
export const getRealisasiOpSnapshot = (): RealisasiOperasionalItem[] => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.realisasiOp;
};
export const getNutritionPlansSnapshot = (): any[] => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.nutritionPlans;
};
export const getBarangDatangSnapshot = (): any[] => {
  if (!storeInitialized) initOperationalFirestoreStore();
  return state.barangDatang;
};

function upsertLocalSliceItem<T extends { id: string }>(collectionName: string, item: T): void {
  const sliceKey = COLLECTION_SLICE_MAP[collectionName];
  if (!sliceKey) return;
  const current = Array.isArray((state as any)[sliceKey]) ? [...((state as any)[sliceKey] as T[])] : [];
  const idx = current.findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...item };
  } else {
    current.unshift(item);
  }
  (state as any)[sliceKey] = current;
  notifySlice(sliceKey);
  schedulePersistOperationalSnapshot();
}

function removeLocalSliceItem(collectionName: string, id: string): void {
  const sliceKey = COLLECTION_SLICE_MAP[collectionName];
  if (!sliceKey) return;
  const current = Array.isArray((state as any)[sliceKey]) ? ((state as any)[sliceKey] as any[]) : [];
  (state as any)[sliceKey] = current.filter((x) => x.id !== id);
  notifySlice(sliceKey);
  schedulePersistOperationalSnapshot();
}

// ---------------- Master Menu Supabase CRUD ----------------
export async function createMasterMenuDoc(input: Omit<MasterMenuRecord, 'id'>): Promise<MasterMenuRecord> {
  const prefix = `MM_${(input.tanggalPelaksanaan || '').replace(/-/g, '') || 'MENU'}`;
  const docId = generateUniqueDocId(prefix);
  const record: MasterMenuRecord = { ...input, id: docId };
  state.masterMenus = [record, ...state.masterMenus].sort((a, b) =>
    (b.tanggalPelaksanaan || '').localeCompare(a.tanggalPelaksanaan || '')
  );
  notifySlice('masterMenus');
  schedulePersistOperationalSnapshot();

  if (!isSupabaseConfigured) return record;
  try {
    await upsertSupabaseDoc('master_menus', docId, sanitizeForFirestore(record));
    return record;
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.CREATE, `master_menus/${docId}`, 'Gagal menyimpan Master Menu baru ke Supabase');
    throw new Error(msg);
  }
}

export async function updateMasterMenuDoc(id: string, patch: Partial<MasterMenuRecord>): Promise<void> {
  state.masterMenus = state.masterMenus
    .map((m) => (m.id === id ? { ...m, ...patch } : m))
    .sort((a, b) => (b.tanggalPelaksanaan || '').localeCompare(a.tanggalPelaksanaan || ''));
  notifySlice('masterMenus');
  schedulePersistOperationalSnapshot();

  if (!isSupabaseConfigured) return;
  try {
    const updated = state.masterMenus.find((m) => m.id === id) || { ...patch, id };
    await upsertSupabaseDoc('master_menus', id, sanitizeForFirestore(updated));
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.UPDATE, `master_menus/${id}`, 'Gagal memperbarui Master Menu di Supabase');
    throw new Error(msg);
  }
}

export async function deleteMasterMenuDoc(id: string): Promise<void> {
  state.masterMenus = state.masterMenus.filter((m) => m.id !== id);
  notifySlice('masterMenus');
  schedulePersistOperationalSnapshot();

  if (!isSupabaseConfigured) return;
  try {
    await deleteSupabaseDoc('master_menus', id);
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.DELETE, `master_menus/${id}`, 'Gagal menghapus Master Menu dari Supabase');
    throw new Error(msg);
  }
}

// ---------------- Siklus Menu Supabase CRUD ----------------
export async function saveSiklusMenuCycleDoc(tanggal: string, payload: SiklusMenuData): Promise<SiklusMenuData & { id: string }> {
  const existing = state.siklusCycles[tanggal];
  const docId = existing?.id || generateUniqueDocId(`siklus_${tanggal}`);
  const fullPayload = sanitizeForFirestore({ ...payload, id: docId, tanggal });
  state.siklusCycles = { ...state.siklusCycles, [tanggal]: fullPayload };
  notifySlice('siklusCycles');
  schedulePersistOperationalSnapshot();

  if (!isSupabaseConfigured) return fullPayload;
  try {
    await upsertSupabaseDoc('siklus_menu', docId, fullPayload);
    return fullPayload;
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.WRITE, `siklus_menu/${docId}`, 'Gagal menyimpan Siklus Menu ke Supabase');
    throw new Error(msg);
  }
}

// ---------------- Akuntan Configs & Collections CRUD ----------------
export async function updateAkuntanConfigDoc(patch: Partial<AkuntanConfigState>): Promise<void> {
  state.akuntanConfigs = mergeAkuntanConfigState(state.akuntanConfigs, patch);
  notifySlice('akuntanConfigs');
  schedulePersistOperationalSnapshot();

  if (!isSupabaseConfigured) return;
  try {
    await upsertSupabaseDoc('akuntan_configs', 'main', sanitizeForFirestore({ id: 'main', ...state.akuntanConfigs }));
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.UPDATE, 'akuntan_configs/main', 'Gagal menyimpan pengaturan Akuntan ke Supabase');
    throw new Error(msg);
  }
}

export async function saveAkuntanItemDoc<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<T> {
  const docId = item.id || generateUniqueDocId(collectionName);
  const payload = sanitizeForFirestore({ ...item, id: docId });
  upsertLocalSliceItem(collectionName, payload);

  if (!isSupabaseConfigured) return payload;
  try {
    await upsertSupabaseDoc(collectionName, docId, payload);
    return payload;
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.WRITE, `${collectionName}/${docId}`, `Gagal menyimpan data ${collectionName} ke Supabase`);
    throw new Error(msg);
  }
}

export async function updateAkuntanItemFields(
  collectionName: string,
  id: string,
  fields: Record<string, any>
): Promise<void> {
  const sanitizedFields = sanitizeForFirestore(fields);
  upsertLocalSliceItem(collectionName, { id, ...sanitizedFields });

  if (!isSupabaseConfigured) return;
  try {
    const sliceKey = COLLECTION_SLICE_MAP[collectionName];
    const currentList = sliceKey && Array.isArray((state as any)[sliceKey]) ? ((state as any)[sliceKey] as any[]) : [];
    const mergedItem = currentList.find((x) => x.id === id) || { id, ...sanitizedFields };
    await upsertSupabaseDoc(collectionName, id, sanitizeForFirestore(mergedItem));
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.UPDATE, `${collectionName}/${id}`, `Gagal memperbarui data ${collectionName} di Supabase`);
    throw new Error(msg);
  }
}

export async function deleteAkuntanItemDoc(collectionName: string, id: string): Promise<void> {
  removeLocalSliceItem(collectionName, id);

  if (!isSupabaseConfigured) return;
  try {
    await deleteSupabaseDoc(collectionName, id);
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.DELETE, `${collectionName}/${id}`, `Gagal menghapus data ${collectionName} dari Supabase`);
    throw new Error(msg);
  }
}

export async function replaceAkuntanDocsForPredicate<T extends { id: string }>(
  collectionName: string,
  nextItems: T[],
  existingItemsToPrune: T[] = []
): Promise<void> {
  const sliceKey = COLLECTION_SLICE_MAP[collectionName];
  const normalizedNext = nextItems.map((item) => {
    const docId = item.id || generateUniqueDocId(collectionName);
    return sanitizeForFirestore({ ...item, id: docId });
  });

  if (sliceKey) {
    const pruneIds = new Set(existingItemsToPrune.map((x) => x.id));
    const current = Array.isArray((state as any)[sliceKey]) ? ((state as any)[sliceKey] as T[]) : [];
    const kept = current.filter((x) => !pruneIds.has(x.id));
    const nextIdSet = new Set(normalizedNext.map((x) => x.id));
    (state as any)[sliceKey] = [...kept.filter((x) => !nextIdSet.has(x.id)), ...normalizedNext];
    notifySlice(sliceKey);
    schedulePersistOperationalSnapshot();
  }

  if (!isSupabaseConfigured) return;
  try {
    const nextIds = new Set(normalizedNext.map((i) => i.id));
    const toDelete = existingItemsToPrune.filter((old) => old.id && !nextIds.has(old.id));
    const ops: Array<{ type: 'set' | 'delete'; id: string; data?: any }> = [
      ...toDelete.map((d) => ({ type: 'delete' as const, id: d.id })),
      ...normalizedNext.map((item) => ({ type: 'set' as const, id: item.id, data: item }))
    ];
    await batchSyncSupabaseDocs(collectionName, ops);
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.WRITE, collectionName, `Gagal menyinkronkan data ${collectionName} ke Supabase`);
    throw new Error(msg);
  }
}

export async function updateNutritionPlanPriceInFirestore(
  targetDate: string,
  cleanIngredientKey: string,
  harga: number
): Promise<void> {
  try {
    const matchedPlans = state.nutritionPlans.filter((p) => p.tanggalPelaksanaan === targetDate);
    for (const plan of matchedPlans) {
      if (Array.isArray(plan.ingredientsData) && plan.id) {
        let changed = false;
        const updatedIngs = plan.ingredientsData.map((ing: any) => {
          if ((ing.bahanPangan || '').toLowerCase().trim() === cleanIngredientKey) {
            changed = true;
            return { ...ing, hargaPerKg: harga };
          }
          return ing;
        });
        if (changed) {
          const updatedPlan = { ...plan, ingredientsData: updatedIngs };
          upsertLocalSliceItem('nutritionPlans', updatedPlan);
          if (isSupabaseConfigured) {
            await upsertSupabaseDoc('nutritionPlans', plan.id, sanitizeForFirestore(updatedPlan));
          }
        }
      }
    }
  } catch (err) {
    notifyFirestoreFailure(err, OperationType.UPDATE, 'nutritionPlans', 'Gagal menyinkronkan harga ke Nutrition Plan');
  }
}
