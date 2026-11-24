import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import {
  OperationType,
  generateUniqueDocId,
  isFirestoreQuotaError,
  isFirestoreQuotaExhausted,
  markFirestoreQuotaExhausted,
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
const unsubscribers: Unsubscribe[] = [];
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

function teardownOperationalListeners(): void {
  while (unsubscribers.length > 0) {
    const unsub = unsubscribers.pop();
    try {
      unsub?.();
    } catch (_) {}
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
      const json = await safeParseJson<{ success?: boolean; slices?: Record<string, any> }>(res);
      const slices = json?.slices;
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

function handleOperationalQuotaError(
  err: unknown,
  operationType: OperationType,
  path: string,
  context: string
): string {
  if (isFirestoreQuotaError(err)) {
    markFirestoreQuotaExhausted();
    teardownOperationalListeners();
    void hydrateOperationalStoreFromServer();
  }
  return notifyFirestoreFailure(err, operationType, path, context);
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
  if (isFirestoreQuotaExhausted()) return {};
  if (seedFlagsPromise) return seedFlagsPromise;

  seedFlagsPromise = (async () => {
    try {
      const snap = await getDoc(doc(db, 'app_meta', 'seed_flags'));
      seedFlagsCache = snap.exists() ? (snap.data() as Record<string, boolean>) : {};
      return seedFlagsCache;
    } catch (err) {
      if (isFirestoreQuotaError(err)) {
        markFirestoreQuotaExhausted();
        teardownOperationalListeners();
      } else {
        console.warn('Gagal memeriksa status seed Firestore:', err);
      }
      return {};
    } finally {
      seedFlagsPromise = null;
    }
  })();
  return seedFlagsPromise;
}

async function markSeedFlag(flagKey: string): Promise<void> {
  seedFlagsCache = { ...(seedFlagsCache || {}), [flagKey]: true };
  if (isFirestoreQuotaExhausted()) return;
  try {
    await setDoc(doc(db, 'app_meta', 'seed_flags'), { [flagKey]: true }, { merge: true });
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      markFirestoreQuotaExhausted();
      teardownOperationalListeners();
    } else {
      console.warn(`Gagal menandai seed flag ${flagKey}:`, err);
    }
  }
}

function attachCollectionListener<T extends { id: string }>(
  collectionName: string,
  sliceKey: StoreSliceKey,
  assign: (items: T[]) => void,
  options?: { seedItems?: T[]; seedFlag?: string }
): void {
  if (isFirestoreQuotaExhausted()) return;
  try {
    const q = query(collection(db, collectionName));
    const unsub = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty && options?.seedItems && options.seedItems.length > 0 && options.seedFlag) {
          const flags = await getSeedFlags();
          if (!flags[options.seedFlag] && !isFirestoreQuotaExhausted()) {
            try {
              const batch = writeBatch(db);
              for (const item of options.seedItems) {
                const docId = item.id || generateUniqueDocId(collectionName);
                batch.set(doc(db, collectionName, docId), sanitizeForFirestore({ ...item, id: docId }), { merge: true });
              }
              await batch.commit();
              await markSeedFlag(options.seedFlag);
              return;
            } catch (seedErr) {
              handleOperationalQuotaError(seedErr, OperationType.WRITE, collectionName, `Gagal inisialisasi data awal ${collectionName}`);
            }
          }
        }

        const list: T[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as T), id: docSnap.id });
        });
        if (list.length > 0 || !isFirestoreQuotaExhausted()) {
          assign(list);
          notifySlice(sliceKey);
          schedulePersistOperationalSnapshot();
        }
      },
      (err) => {
        handleOperationalQuotaError(err, OperationType.GET, collectionName, `Gagal sinkronisasi real-time ${collectionName}`);
      }
    );
    unsubscribers.push(unsub);
  } catch (err) {
    handleOperationalQuotaError(err, OperationType.GET, collectionName, `Gagal membuka listener ${collectionName}`);
  }
}

export function initOperationalFirestoreStore(): void {
  if (storeInitialized || typeof window === 'undefined') return;
  storeInitialized = true;

  void hydrateOperationalStoreFromServer();

  if (isFirestoreQuotaExhausted()) {
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
    const qSiklus = query(collection(db, 'siklus_menu'));
    const unsubSiklus = onSnapshot(
      qSiklus,
      async (snapshot) => {
        if (snapshot.empty) {
          const flags = await getSeedFlags();
          if (!flags.siklusMenuSeeded && !isFirestoreQuotaExhausted()) {
            try {
              await setDoc(
                doc(db, 'siklus_menu', SEED_SIKLUS_20261026.id),
                sanitizeForFirestore(SEED_SIKLUS_20261026),
                { merge: true }
              );
              await markSeedFlag('siklusMenuSeeded');
              return;
            } catch (seedErr) {
              handleOperationalQuotaError(seedErr, OperationType.WRITE, 'siklus_menu', 'Gagal inisialisasi data awal Siklus Menu');
            }
          }
        }

        const map: Record<string, SiklusMenuData & { id?: string }> = {};
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as SiklusMenuData & { id?: string };
          if (d?.tanggal) {
            map[d.tanggal] = { ...d, id: docSnap.id };
          }
        });
        state.siklusCycles = map;
        state.siklusCyclesLoaded = true;
        notifySlice('siklusCycles');
        schedulePersistOperationalSnapshot();
      },
      (err) => {
        handleOperationalQuotaError(err, OperationType.GET, 'siklus_menu', 'Gagal sinkronisasi real-time Siklus Menu');
      }
    );
    unsubscribers.push(unsubSiklus);
  } catch (err) {
    handleOperationalQuotaError(err, OperationType.GET, 'siklus_menu', 'Gagal membuka listener Siklus Menu');
  }

  // 3. Akuntan Configs single doc
  try {
    const unsubCfg = onSnapshot(
      doc(db, 'akuntan_configs', 'main'),
      (snap) => {
        if (snap.exists()) {
          state.akuntanConfigs = mergeAkuntanConfigState(
            DEFAULT_AKUNTAN_CONFIG,
            snap.data() as Partial<AkuntanConfigState>
          );
        }
        state.akuntanConfigsLoaded = true;
        notifySlice('akuntanConfigs');
        schedulePersistOperationalSnapshot();
      },
      (err) => {
        handleOperationalQuotaError(err, OperationType.GET, 'akuntan_configs/main', 'Gagal memuat konfigurasi Akuntan dari Firebase');
      }
    );
    unsubscribers.push(unsubCfg);
  } catch (err) {
    handleOperationalQuotaError(err, OperationType.GET, 'akuntan_configs/main', 'Gagal membuka listener konfigurasi Akuntan');
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

// Synchronous Snapshot Getters (backed by live Firestore onSnapshot)
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

// ---------------- Master Menu Firestore CRUD ----------------
export async function createMasterMenuDoc(input: Omit<MasterMenuRecord, 'id'>): Promise<MasterMenuRecord> {
  const prefix = `MM_${(input.tanggalPelaksanaan || '').replace(/-/g, '') || 'MENU'}`;
  const docId = generateUniqueDocId(prefix);
  const record: MasterMenuRecord = { ...input, id: docId };
  state.masterMenus = [record, ...state.masterMenus].sort((a, b) =>
    (b.tanggalPelaksanaan || '').localeCompare(a.tanggalPelaksanaan || '')
  );
  notifySlice('masterMenus');
  schedulePersistOperationalSnapshot();

  if (isFirestoreQuotaExhausted()) return record;
  try {
    await setDoc(doc(db, 'master_menus', docId), sanitizeForFirestore(record));
    return record;
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      handleOperationalQuotaError(err, OperationType.CREATE, `master_menus/${docId}`, 'Gagal menyimpan Master Menu baru');
      return record;
    }
    const msg = notifyFirestoreFailure(err, OperationType.CREATE, `master_menus/${docId}`, 'Gagal menyimpan Master Menu baru');
    throw new Error(msg);
  }
}

export async function updateMasterMenuDoc(id: string, patch: Partial<MasterMenuRecord>): Promise<void> {
  state.masterMenus = state.masterMenus
    .map((m) => (m.id === id ? { ...m, ...patch } : m))
    .sort((a, b) => (b.tanggalPelaksanaan || '').localeCompare(a.tanggalPelaksanaan || ''));
  notifySlice('masterMenus');
  schedulePersistOperationalSnapshot();

  if (isFirestoreQuotaExhausted()) return;
  try {
    await setDoc(doc(db, 'master_menus', id), sanitizeForFirestore(patch), { merge: true });
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      handleOperationalQuotaError(err, OperationType.UPDATE, `master_menus/${id}`, 'Gagal memperbarui Master Menu');
      return;
    }
    const msg = notifyFirestoreFailure(err, OperationType.UPDATE, `master_menus/${id}`, 'Gagal memperbarui Master Menu');
    throw new Error(msg);
  }
}

export async function deleteMasterMenuDoc(id: string): Promise<void> {
  state.masterMenus = state.masterMenus.filter((m) => m.id !== id);
  notifySlice('masterMenus');
  schedulePersistOperationalSnapshot();

  if (isFirestoreQuotaExhausted()) return;
  try {
    await deleteDoc(doc(db, 'master_menus', id));
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      handleOperationalQuotaError(err, OperationType.DELETE, `master_menus/${id}`, 'Gagal menghapus Master Menu');
      return;
    }
    const msg = notifyFirestoreFailure(err, OperationType.DELETE, `master_menus/${id}`, 'Gagal menghapus Master Menu');
    throw new Error(msg);
  }
}

// ---------------- Siklus Menu Firestore CRUD ----------------
export async function saveSiklusMenuCycleDoc(tanggal: string, payload: SiklusMenuData): Promise<SiklusMenuData & { id: string }> {
  const existing = state.siklusCycles[tanggal];
  const docId = existing?.id || generateUniqueDocId(`siklus_${tanggal}`);
  const fullPayload = sanitizeForFirestore({ ...payload, id: docId, tanggal });
  state.siklusCycles = { ...state.siklusCycles, [tanggal]: fullPayload };
  notifySlice('siklusCycles');
  schedulePersistOperationalSnapshot();

  if (isFirestoreQuotaExhausted()) return fullPayload;
  try {
    await setDoc(doc(db, 'siklus_menu', docId), fullPayload, { merge: true });
    return fullPayload;
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      handleOperationalQuotaError(err, OperationType.WRITE, `siklus_menu/${docId}`, 'Gagal menyimpan Siklus Menu');
      return fullPayload;
    }
    const msg = notifyFirestoreFailure(err, OperationType.WRITE, `siklus_menu/${docId}`, 'Gagal menyimpan Siklus Menu');
    throw new Error(msg);
  }
}

// ---------------- Akuntan Configs & Collections CRUD ----------------
export async function updateAkuntanConfigDoc(patch: Partial<AkuntanConfigState>): Promise<void> {
  state.akuntanConfigs = mergeAkuntanConfigState(state.akuntanConfigs, patch);
  notifySlice('akuntanConfigs');
  schedulePersistOperationalSnapshot();

  if (isFirestoreQuotaExhausted()) return;
  try {
    await setDoc(doc(db, 'akuntan_configs', 'main'), sanitizeForFirestore(patch), { merge: true });
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      handleOperationalQuotaError(err, OperationType.UPDATE, 'akuntan_configs/main', 'Gagal menyimpan pengaturan Akuntan');
      return;
    }
    const msg = notifyFirestoreFailure(err, OperationType.UPDATE, 'akuntan_configs/main', 'Gagal menyimpan pengaturan Akuntan');
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

  if (isFirestoreQuotaExhausted()) return payload;
  try {
    await setDoc(doc(db, collectionName, docId), payload, { merge: true });
    return payload;
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      handleOperationalQuotaError(err, OperationType.WRITE, `${collectionName}/${docId}`, `Gagal menyimpan data ${collectionName}`);
      return payload;
    }
    const msg = notifyFirestoreFailure(err, OperationType.WRITE, `${collectionName}/${docId}`, `Gagal menyimpan data ${collectionName}`);
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

  if (isFirestoreQuotaExhausted()) return;
  try {
    await updateDoc(doc(db, collectionName, id), sanitizedFields);
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      handleOperationalQuotaError(err, OperationType.UPDATE, `${collectionName}/${id}`, `Gagal memperbarui data ${collectionName}`);
      return;
    }
    // Fallback to setDoc merge:true if document not yet persisted
    try {
      await setDoc(doc(db, collectionName, id), sanitizeForFirestore({ id, ...sanitizedFields }), { merge: true });
    } catch (innerErr) {
      if (isFirestoreQuotaError(innerErr)) {
        handleOperationalQuotaError(innerErr, OperationType.UPDATE, `${collectionName}/${id}`, `Gagal memperbarui data ${collectionName}`);
        return;
      }
      const msg = notifyFirestoreFailure(innerErr, OperationType.UPDATE, `${collectionName}/${id}`, `Gagal memperbarui data ${collectionName}`);
      throw new Error(msg);
    }
  }
}

export async function deleteAkuntanItemDoc(collectionName: string, id: string): Promise<void> {
  removeLocalSliceItem(collectionName, id);

  if (isFirestoreQuotaExhausted()) return;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      handleOperationalQuotaError(err, OperationType.DELETE, `${collectionName}/${id}`, `Gagal menghapus data ${collectionName}`);
      return;
    }
    const msg = notifyFirestoreFailure(err, OperationType.DELETE, `${collectionName}/${id}`, `Gagal menghapus data ${collectionName}`);
    throw new Error(msg);
  }
}

export async function replaceAkuntanDocsForPredicate<T extends { id: string }>(
  collectionName: string,
  nextItems: T[],
  existingItemsToPrune: T[] = []
): Promise<void> {
  const sliceKey = COLLECTION_SLICE_MAP[collectionName];
  if (sliceKey) {
    const pruneIds = new Set(existingItemsToPrune.map((x) => x.id));
    const current = Array.isArray((state as any)[sliceKey]) ? ((state as any)[sliceKey] as T[]) : [];
    const kept = current.filter((x) => !pruneIds.has(x.id));
    const normalizedNext = nextItems.map((item) => {
      const docId = item.id || generateUniqueDocId(collectionName);
      return sanitizeForFirestore({ ...item, id: docId });
    });
    const nextIdSet = new Set(normalizedNext.map((x) => x.id));
    (state as any)[sliceKey] = [...kept.filter((x) => !nextIdSet.has(x.id)), ...normalizedNext];
    notifySlice(sliceKey);
    schedulePersistOperationalSnapshot();
  }

  if (isFirestoreQuotaExhausted()) return;
  try {
    const nextIds = new Set(nextItems.map((i) => i.id));
    const toDelete = existingItemsToPrune.filter((old) => old.id && !nextIds.has(old.id));

    const ops: Array<{ type: 'set' | 'delete'; id: string; data?: any }> = [];
    toDelete.forEach((d) => ops.push({ type: 'delete', id: d.id }));
    nextItems.forEach((item) => {
      const docId = item.id || generateUniqueDocId(collectionName);
      ops.push({ type: 'set', id: docId, data: sanitizeForFirestore({ ...item, id: docId }) });
    });

    const chunkSize = 400;
    for (let i = 0; i < ops.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = ops.slice(i, i + chunkSize);
      for (const op of chunk) {
        const ref = doc(db, collectionName, op.id);
        if (op.type === 'delete') {
          batch.delete(ref);
        } else {
          batch.set(ref, op.data, { merge: true });
        }
      }
      await batch.commit();
    }
  } catch (err) {
    if (isFirestoreQuotaError(err)) {
      handleOperationalQuotaError(err, OperationType.WRITE, collectionName, `Gagal menyinkronkan data ${collectionName}`);
      return;
    }
    const msg = notifyFirestoreFailure(err, OperationType.WRITE, collectionName, `Gagal menyinkronkan data ${collectionName}`);
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
          upsertLocalSliceItem('nutritionPlans', { ...plan, ingredientsData: updatedIngs });
          if (!isFirestoreQuotaExhausted()) {
            await setDoc(doc(db, 'nutritionPlans', plan.id), { ingredientsData: sanitizeForFirestore(updatedIngs) }, { merge: true });
          }
        }
      }
    }
  } catch (err) {
    handleOperationalQuotaError(err, OperationType.UPDATE, 'nutritionPlans', 'Gagal menyinkronkan harga ke Nutrition Plan');
  }
}
