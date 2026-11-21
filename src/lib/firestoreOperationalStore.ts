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
  notifyFirestoreFailure,
  sanitizeForFirestore
} from './firestoreHelper';
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
  RealisasiOperasionalItem
} from '../types/akuntan';
import {
  initialInsentifFasilitas,
  initialRealisasiBahanBaku,
  initialRealisasiOperasional
} from '../data/akuntanSeedData';

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
  savedPrices: Record<string, number>;
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
  savedPrices: {}
};

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
  try {
    const snap = await getDoc(doc(db, 'app_meta', 'seed_flags'));
    seedFlagsCache = snap.exists() ? (snap.data() as Record<string, boolean>) : {};
    return seedFlagsCache;
  } catch (err) {
    console.error('Gagal memeriksa status seed Firestore:', err);
    return {};
  }
}

async function markSeedFlag(flagKey: string): Promise<void> {
  try {
    seedFlagsCache = { ...(seedFlagsCache || {}), [flagKey]: true };
    await setDoc(doc(db, 'app_meta', 'seed_flags'), { [flagKey]: true }, { merge: true });
  } catch (err) {
    console.error(`Gagal menandai seed flag ${flagKey}:`, err);
  }
}

function attachCollectionListener<T extends { id: string }>(
  collectionName: string,
  sliceKey: StoreSliceKey,
  assign: (items: T[]) => void,
  options?: { seedItems?: T[]; seedFlag?: string }
): void {
  try {
    const q = query(collection(db, collectionName));
    const unsub = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty && options?.seedItems && options.seedItems.length > 0 && options.seedFlag) {
          const flags = await getSeedFlags();
          if (!flags[options.seedFlag]) {
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
              notifyFirestoreFailure(seedErr, OperationType.WRITE, collectionName, `Gagal inisialisasi data awal ${collectionName}`);
            }
          }
        }

        const list: T[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as T), id: docSnap.id });
        });
        assign(list);
        notifySlice(sliceKey);
      },
      (err) => {
        notifyFirestoreFailure(err, OperationType.GET, collectionName, `Gagal sinkronisasi real-time ${collectionName}`);
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
          if (!flags.siklusMenuSeeded) {
            try {
              await setDoc(
                doc(db, 'siklus_menu', SEED_SIKLUS_20261026.id),
                sanitizeForFirestore(SEED_SIKLUS_20261026),
                { merge: true }
              );
              await markSeedFlag('siklusMenuSeeded');
              return;
            } catch (seedErr) {
              notifyFirestoreFailure(seedErr, OperationType.WRITE, 'siklus_menu', 'Gagal inisialisasi data awal Siklus Menu');
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
      },
      (err) => {
        notifyFirestoreFailure(err, OperationType.GET, 'siklus_menu', 'Gagal sinkronisasi real-time Siklus Menu');
      }
    );
    unsubscribers.push(unsubSiklus);
  } catch (err) {
    notifyFirestoreFailure(err, OperationType.GET, 'siklus_menu', 'Gagal membuka listener Siklus Menu');
  }

  // 3. Akuntan Configs single doc
  try {
    const unsubCfg = onSnapshot(
      doc(db, 'akuntan_configs', 'main'),
      (snap) => {
        if (snap.exists()) {
          state.akuntanConfigs = { ...DEFAULT_AKUNTAN_CONFIG, ...(snap.data() as Partial<AkuntanConfigState>) };
        }
        state.akuntanConfigsLoaded = true;
        notifySlice('akuntanConfigs');
      },
      (err) => {
        notifyFirestoreFailure(err, OperationType.GET, 'akuntan_configs/main', 'Gagal memuat konfigurasi Akuntan dari Firebase');
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

// ---------------- Master Menu Firestore CRUD ----------------
export async function createMasterMenuDoc(input: Omit<MasterMenuRecord, 'id'>): Promise<MasterMenuRecord> {
  const prefix = `MM_${(input.tanggalPelaksanaan || '').replace(/-/g, '') || 'MENU'}`;
  const docId = generateUniqueDocId(prefix);
  const record: MasterMenuRecord = { ...input, id: docId };
  try {
    await setDoc(doc(db, 'master_menus', docId), sanitizeForFirestore(record));
    return record;
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.CREATE, `master_menus/${docId}`, 'Gagal menyimpan Master Menu baru');
    throw new Error(msg);
  }
}

export async function updateMasterMenuDoc(id: string, patch: Partial<MasterMenuRecord>): Promise<void> {
  try {
    await setDoc(doc(db, 'master_menus', id), sanitizeForFirestore(patch), { merge: true });
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.UPDATE, `master_menus/${id}`, 'Gagal memperbarui Master Menu');
    throw new Error(msg);
  }
}

export async function deleteMasterMenuDoc(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'master_menus', id));
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.DELETE, `master_menus/${id}`, 'Gagal menghapus Master Menu');
    throw new Error(msg);
  }
}

// ---------------- Siklus Menu Firestore CRUD ----------------
export async function saveSiklusMenuCycleDoc(tanggal: string, payload: SiklusMenuData): Promise<SiklusMenuData & { id: string }> {
  const existing = state.siklusCycles[tanggal];
  const docId = existing?.id || generateUniqueDocId(`siklus_${tanggal}`);
  const fullPayload = sanitizeForFirestore({ ...payload, id: docId, tanggal });
  try {
    await setDoc(doc(db, 'siklus_menu', docId), fullPayload, { merge: true });
    state.siklusCycles = { ...state.siklusCycles, [tanggal]: fullPayload };
    notifySlice('siklusCycles');
    return fullPayload;
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.WRITE, `siklus_menu/${docId}`, 'Gagal menyimpan Siklus Menu');
    throw new Error(msg);
  }
}

// ---------------- Akuntan Configs & Collections CRUD ----------------
export async function updateAkuntanConfigDoc(patch: Partial<AkuntanConfigState>): Promise<void> {
  state.akuntanConfigs = { ...state.akuntanConfigs, ...patch };
  notifySlice('akuntanConfigs');
  try {
    await setDoc(doc(db, 'akuntan_configs', 'main'), sanitizeForFirestore(patch), { merge: true });
  } catch (err) {
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
  try {
    await setDoc(doc(db, collectionName, docId), payload, { merge: true });
    return payload;
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.WRITE, `${collectionName}/${docId}`, `Gagal menyimpan data ${collectionName}`);
    throw new Error(msg);
  }
}

export async function updateAkuntanItemFields(
  collectionName: string,
  id: string,
  fields: Record<string, any>
): Promise<void> {
  try {
    await updateDoc(doc(db, collectionName, id), sanitizeForFirestore(fields));
  } catch (err) {
    // Fallback to setDoc merge:true if document not yet persisted
    try {
      await setDoc(doc(db, collectionName, id), sanitizeForFirestore({ id, ...fields }), { merge: true });
    } catch (innerErr) {
      const msg = notifyFirestoreFailure(innerErr, OperationType.UPDATE, `${collectionName}/${id}`, `Gagal memperbarui data ${collectionName}`);
      throw new Error(msg);
    }
  }
}

export async function deleteAkuntanItemDoc(collectionName: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (err) {
    const msg = notifyFirestoreFailure(err, OperationType.DELETE, `${collectionName}/${id}`, `Gagal menghapus data ${collectionName}`);
    throw new Error(msg);
  }
}

export async function replaceAkuntanDocsForPredicate<T extends { id: string }>(
  collectionName: string,
  nextItems: T[],
  existingItemsToPrune: T[] = []
): Promise<void> {
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
          await setDoc(doc(db, 'nutritionPlans', plan.id), { ingredientsData: sanitizeForFirestore(updatedIngs) }, { merge: true });
        }
      }
    }
  } catch (err) {
    notifyFirestoreFailure(err, OperationType.UPDATE, 'nutritionPlans', 'Gagal menyinkronkan harga ke Nutrition Plan');
  }
}
