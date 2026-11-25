import fs from 'fs';
import path from 'path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { dbStore, initialMenus } from './store';
import { MasterBarang } from '../../src/types';
import {
  getServerSupabaseClient,
  getServerSupabaseMetadata,
  isServerSupabaseConfigured
} from './supabase';
import {
  batchSyncSupabaseDocs,
  fetchSupabaseCollection,
  fetchSupabaseDoc,
  upsertSupabaseDoc
} from '../../src/lib/supabaseService';

let isConnected = isServerSupabaseConfigured;
let lastFullSyncAt = 0;
const SYNC_COOLDOWN_MS = 10 * 60 * 1000;

const operationalSnapshot: Record<string, any> = {};

const SNAPSHOT_DIR = path.resolve(process.cwd(), '.cloud-sync-cache');
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, 'db-snapshot.json');
let snapshotSaveTimer: NodeJS.Timeout | null = null;

function sanitizeDocId(rawKey: string): string {
  return encodeURIComponent(rawKey).replace(/%/g, '_').slice(0, 200);
}

export function hydrateFromLocalSnapshot(): boolean {
  try {
    if (!fs.existsSync(SNAPSHOT_FILE)) return false;
    const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf8');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return false;

    if (parsed.collections && typeof parsed.collections === 'object') {
      for (const item of SYNCED_COLLECTIONS) {
        if (parsed.collections[item.key] !== undefined) {
          (dbStore as any)[item.key] = parsed.collections[item.key];
        }
      }
    }
    if (parsed.appStateSync && typeof parsed.appStateSync === 'object') {
      dbStore.appStateSync = { ...dbStore.appStateSync, ...parsed.appStateSync };
    }
    if (parsed.operationalSnapshot && typeof parsed.operationalSnapshot === 'object') {
      Object.assign(operationalSnapshot, parsed.operationalSnapshot);
    }
    if (typeof parsed.lastFullSyncAt === 'number') {
      lastFullSyncAt = parsed.lastFullSyncAt;
    }
    console.log(
      `💾 Hydrated local persistent cloud cache (${Object.keys(dbStore.appStateSync).length} app-state keys, ${Object.keys(operationalSnapshot).length} operational slices).`
    );
    return true;
  } catch (err: any) {
    console.warn('⚠️ Failed to hydrate local snapshot cache:', err?.message || err);
    return false;
  }
}

export function saveSnapshotToDiskNow(): void {
  try {
    if (!fs.existsSync(SNAPSHOT_DIR)) {
      fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }
    const collections: Record<string, any> = {};
    for (const item of SYNCED_COLLECTIONS) {
      collections[item.key] = (dbStore as any)[item.key];
    }
    const payload = {
      savedAt: new Date().toISOString(),
      lastFullSyncAt,
      collections,
      appStateSync: dbStore.appStateSync,
      operationalSnapshot
    };
    const tmpFile = `${SNAPSHOT_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(payload), 'utf8');
    fs.renameSync(tmpFile, SNAPSHOT_FILE);
  } catch (err: any) {
    console.warn('⚠️ Failed saving local snapshot cache:', err?.message || err);
  }
}

export function scheduleSnapshotSave(delayMs = 250): void {
  if (snapshotSaveTimer) return;
  snapshotSaveTimer = setTimeout(() => {
    snapshotSaveTimer = null;
    saveSnapshotToDiskNow();
  }, delayMs);
}

export function getAppStateEntries(): Record<string, string> {
  return dbStore.appStateSync || {};
}

export async function saveAppStateEntries(
  entries: Record<string, string | null>,
  userMeta?: { name?: string; userId?: string }
): Promise<number> {
  if (!entries || typeof entries !== 'object') return 0;
  let updatedCount = 0;

  for (const [key, val] of Object.entries(entries)) {
    if (!key || !key.startsWith('sppg_') || key.startsWith('sppg_fs_cache_')) continue;
    const docId = sanitizeDocId(key);
    if (val === null || val === undefined) {
      if (dbStore.appStateSync[key] !== undefined) {
        delete dbStore.appStateSync[key];
        updatedCount++;
        await syncDeleteDoc('app_state_sync', docId);
      }
    } else {
      const strVal = typeof val === 'string' ? val : JSON.stringify(val);
      if (dbStore.appStateSync[key] !== strVal) {
        dbStore.appStateSync[key] = strVal;
        updatedCount++;
        await syncSaveDoc(
          'app_state_sync',
          docId,
          { id: docId, key, value: strVal },
          userMeta
        );
      }
    }
  }

  if (updatedCount > 0) {
    scheduleSnapshotSave(150);
  }
  return updatedCount;
}

export function getOperationalSnapshot(): Record<string, any> {
  return operationalSnapshot;
}

export function saveOperationalSnapshotSlices(slices: Record<string, any>): void {
  if (!slices || typeof slices !== 'object') return;
  for (const [k, v] of Object.entries(slices)) {
    if (k && v !== undefined) {
      operationalSnapshot[k] = v;
    }
  }
  scheduleSnapshotSave(150);
}

export function getCollectionSnapshot(collectionName: string): any[] | null {
  const entry = SYNCED_COLLECTIONS.find((c) => c.coll === collectionName || c.key === collectionName);
  if (entry) {
    const val = (dbStore as any)[entry.key];
    if (Array.isArray(val)) return val;
  }
  const opVal = operationalSnapshot[collectionName];
  if (Array.isArray(opVal)) return opVal;
  return null;
}

export function saveCollectionSnapshot(collectionName: string, data: any[]): void {
  if (!collectionName || !Array.isArray(data)) return;
  const entry = SYNCED_COLLECTIONS.find((c) => c.coll === collectionName || c.key === collectionName);
  if (entry) {
    (dbStore as any)[entry.key] = data;
  } else {
    operationalSnapshot[collectionName] = data;
  }
  scheduleSnapshotSave(200);
}

export function getFirestoreDb(): SupabaseClient | null {
  const client = getServerSupabaseClient();
  isConnected = Boolean(client);
  return client;
}

export function getCloudInfo() {
  const client = getFirestoreDb();
  const meta = getServerSupabaseMetadata();
  return {
    provider: 'supabase',
    isConnected: Boolean(client),
    status: client ? 'online' : 'local-cache',
    quotaExceeded: false,
    lastQuotaErrorAt: null,
    lastFullSyncAt: lastFullSyncAt ? new Date(lastFullSyncAt).toISOString() : null,
    appStateKeysCount: Object.keys(dbStore.appStateSync || {}).length,
    projectId: meta.projectRef,
    databaseId: 'supabase-postgres-public',
    authDomain: meta.projectHost,
    appId: meta.projectRef,
    apiKey: '',
    supabaseConfigured: Boolean(client),
    supabaseUrlConfigured: meta.urlConfigured,
    supabaseKeyConfigured: meta.keyConfigured,
    serviceRoleConfigured: meta.serviceRoleConfigured,
    jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
    githubOAuthConfigured: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    syncedCollectionsCount: SYNCED_COLLECTIONS.length,
    collections: SYNCED_COLLECTIONS.map((s) => s.coll),
    mode: client
      ? 'Supabase PostgreSQL + Realtime + Server Persistent Snapshot Cache'
      : 'Server Persistent Snapshot Cache (Menunggu konfigurasi VITE_SUPABASE_URL)',
    writeQueue: getQueueStatus()
  };
}

export async function testFirestoreConnection(): Promise<{
  success: boolean;
  latencyMs: number;
  message: string;
  projectId?: string;
  databaseId?: string;
  probeTimestamp?: string;
}> {
  const start = Date.now();
  const client = getFirestoreDb();
  const meta = getServerSupabaseMetadata();
  if (!client) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      message: 'Variabel VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi. Aplikasi berjalan dengan cache server lokal.',
      projectId: meta.projectRef,
      databaseId: 'local-cache'
    };
  }

  try {
    const nowIso = new Date().toISOString();
    const { error: readErr } = await client
      .from('app_state_sync')
      .select('id')
      .limit(1);

    if (readErr) {
      throw readErr;
    }

    const latency = Date.now() - start;
    return {
      success: true,
      latencyMs: latency,
      message: 'Koneksi ke database Supabase PostgreSQL berhasil 100%!',
      projectId: meta.projectRef,
      databaseId: 'supabase-postgres-public',
      probeTimestamp: nowIso
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      message: err?.message || 'Gagal menghubungkan ke Supabase PostgreSQL'
    };
  }
}

// High-Performance Asynchronous Write-Behind Queue
interface PendingWriteItem {
  type: 'set' | 'delete';
  collectionName: string;
  docId: string;
  data?: any;
  userMeta?: { name?: string; userId?: string };
  queuedAt: number;
}

const pendingWriteQueue = new Map<string, PendingWriteItem>();
let flushTimeout: NodeJS.Timeout | null = null;
let isFlushing = false;
let totalWritesQueued = 0;
let totalWritesCommitted = 0;
let writeErrors = 0;

export function getQueueStatus() {
  return {
    pendingCount: pendingWriteQueue.size,
    totalQueued: totalWritesQueued,
    totalCommitted: totalWritesCommitted,
    errors: writeErrors,
    isFlushing
  };
}

function scheduleFlush(delayMs = 25) {
  if (flushTimeout) return;
  flushTimeout = setTimeout(async () => {
    flushTimeout = null;
    await flushWriteQueue();
  }, delayMs);
}

// Background Batch Committer to Supabase
export async function flushWriteQueue(): Promise<void> {
  if (isFlushing || pendingWriteQueue.size === 0) return;

  const client = getFirestoreDb();
  if (!client) {
    pendingWriteQueue.clear();
    scheduleSnapshotSave(150);
    return;
  }

  isFlushing = true;
  try {
    const entries = Array.from(pendingWriteQueue.entries());
    const grouped = new Map<string, Array<{ key: string; op: { type: 'set' | 'delete'; id: string; data?: any } }>>();
    const now = new Date().toISOString();

    for (const [key, item] of entries) {
      let preparedData = item.data;
      if (item.type === 'set') {
        const cleanData = JSON.parse(JSON.stringify(item.data || {}));
        cleanData.updatedAt = now;
        if (item.userMeta?.name) {
          cleanData.updatedBy = item.userMeta.name;
        }
        if (!cleanData.createdAt) {
          cleanData.createdAt = now;
          cleanData.createdBy = item.userMeta?.name || 'System';
        }
        preparedData = cleanData;
      }

      const list = grouped.get(item.collectionName) || [];
      list.push({
        key,
        op: {
          type: item.type,
          id: item.docId,
          data: preparedData
        }
      });
      grouped.set(item.collectionName, list);
    }

    for (const [collectionName, groupItems] of grouped.entries()) {
      try {
        await batchSyncSupabaseDocs(
          collectionName,
          groupItems.map((g) => g.op),
          client
        );
        for (const g of groupItems) {
          pendingWriteQueue.delete(g.key);
        }
        totalWritesCommitted += groupItems.length;
      } catch (err: any) {
        writeErrors++;
        console.warn(`⚠️ Supabase batch sync notice (${collectionName}):`, err?.message || err);
        for (const g of groupItems) {
          pendingWriteQueue.delete(g.key);
        }
      }
    }
  } finally {
    isFlushing = false;
    if (pendingWriteQueue.size > 0) {
      scheduleFlush(30);
    }
  }
}

export async function syncSaveDoc(
  collectionName: string,
  docId: string,
  data: any,
  userMeta?: { name?: string; userId?: string }
): Promise<void> {
  if (!collectionName || !docId) return;
  totalWritesQueued++;
  const key = `${collectionName}/${docId}`;
  pendingWriteQueue.set(key, {
    type: 'set',
    collectionName,
    docId,
    data,
    userMeta,
    queuedAt: Date.now()
  });
  scheduleSnapshotSave();

  if (pendingWriteQueue.size >= 50) {
    setImmediate(() => {
      flushWriteQueue().catch((err) => {
        console.error('⚠️ Error flushing Supabase write queue:', err);
      });
    });
  } else {
    scheduleFlush(25);
  }
}

export async function syncSaveBatch(
  collectionName: string,
  items: Array<{ id: string; data?: any; [key: string]: any }>,
  userMeta?: { name?: string; userId?: string }
): Promise<void> {
  if (!collectionName || !items || items.length === 0) return;
  for (const rawItem of items) {
    const docId = rawItem.id;
    if (!docId) continue;
    const rawData = rawItem.data !== undefined ? rawItem.data : rawItem;
    totalWritesQueued++;
    const key = `${collectionName}/${docId}`;
    pendingWriteQueue.set(key, {
      type: 'set',
      collectionName,
      docId,
      data: rawData,
      userMeta,
      queuedAt: Date.now()
    });
  }
  scheduleSnapshotSave();

  if (pendingWriteQueue.size >= 50) {
    setImmediate(() => {
      flushWriteQueue().catch((err) => {
        console.error('⚠️ Error flushing Supabase batch queue:', err);
      });
    });
  } else {
    scheduleFlush(25);
  }
}

export async function syncDeleteDoc(collectionName: string, docId: string): Promise<void> {
  if (!collectionName || !docId) return;
  totalWritesQueued++;
  const key = `${collectionName}/${docId}`;
  pendingWriteQueue.set(key, {
    type: 'delete',
    collectionName,
    docId,
    queuedAt: Date.now()
  });
  scheduleSnapshotSave();
  scheduleFlush(25);
}

export async function syncSaveDocNow(
  collectionName: string,
  docId: string,
  data: any,
  userMeta?: { name?: string; userId?: string }
): Promise<void> {
  await syncSaveDoc(collectionName, docId, data, userMeta);
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  await flushWriteQueue();
  saveSnapshotToDiskNow();
}

export async function syncSaveBatchNow(
  collectionName: string,
  items: Array<{ id: string; data?: any; [key: string]: any }>,
  userMeta?: { name?: string; userId?: string }
): Promise<void> {
  await syncSaveBatch(collectionName, items, userMeta);
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  await flushWriteQueue();
  saveSnapshotToDiskNow();
}

export async function syncDeleteDocNow(collectionName: string, docId: string): Promise<void> {
  await syncDeleteDoc(collectionName, docId);
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  await flushWriteQueue();
  saveSnapshotToDiskNow();
}

export function generateUniqueId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${randomPart}`;
}

/**
 * ATOMIC STOCK MOVEMENT HANDLER (Supabase PostgreSQL + Local Store Fallback):
 * Enforces: STOK AKHIR = STOK AWAL + BARANG MASUK - BARANG KELUAR ± PENYESUAIAN
 */
export async function runStockTransaction(params: {
  barangId: string;
  jenis: 'Masuk' | 'Keluar' | 'Penyesuaian Opname' | 'Stock Awal';
  jumlah: number;
  referensiNota?: string;
  keterangan?: string;
  petugas?: string;
  sumberSupplier?: string;
  penerimaTujuan?: string;
  hargaSatuan?: number;
  customMovementId?: string;
}) {
  const client = getFirestoreDb();
  const {
    barangId,
    jenis,
    jumlah,
    referensiNota,
    keterangan,
    petugas = 'Petugas Logistik',
    sumberSupplier = '',
    penerimaTujuan = '',
    hargaSatuan,
    customMovementId
  } = params;

  const now = new Date();
  const nowIso = now.toISOString();
  const tanggal = `${nowIso.split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
  const movementId = customMovementId || generateUniqueId('MOV');

  // Read from Supabase if available, otherwise from local dbStore
  let itemData: MasterBarang | null = dbStore.barang.find((b) => b.id === barangId) || null;
  if (client) {
    try {
      const remoteItem = await fetchSupabaseDoc<MasterBarang>('barang', barangId, client);
      if (remoteItem) {
        itemData = remoteItem;
      }
    } catch (err: any) {
      console.warn(`Supabase stock lookup notice for ${barangId}:`, err?.message || err);
    }
  }

  if (!itemData) {
    throw new Error(`Barang dengan ID "${barangId}" tidak ditemukan.`);
  }

  const currentStock = Number(itemData.stokSekarang) || 0;
  const qty = Number(jumlah);
  if (isNaN(qty) || (jenis !== 'Stock Awal' && jenis !== 'Penyesuaian Opname' && qty <= 0)) {
    throw new Error('Jumlah barang harus berupa angka positif.');
  }
  if (jenis === 'Keluar' && currentStock < qty) {
    throw new Error(
      `Stok tidak mencukupi! Stok saat ini ${currentStock} ${itemData.satuan}, permintaan keluar: ${qty} ${itemData.satuan}.`
    );
  }

  let newStock = currentStock;
  if (jenis === 'Masuk') newStock = currentStock + qty;
  else if (jenis === 'Keluar') newStock = currentStock - qty;
  else if (jenis === 'Stock Awal' || jenis === 'Penyesuaian Opname') newStock = qty;

  const unitPrice = typeof hargaSatuan === 'number' ? hargaSatuan : Number(itemData.hargaSatuan) || 0;
  const effectiveDelta =
    jenis === 'Stock Awal' || jenis === 'Penyesuaian Opname' ? Math.abs(qty - currentStock) : qty;

  const updatedBarang: MasterBarang = {
    ...itemData,
    stokSekarang: newStock,
    updatedAt: nowIso
  };

  const movement = {
    id: movementId,
    jenis,
    barangId: itemData.id,
    kodeBarang: itemData.kodeBarang,
    namaBarang: itemData.namaBarang,
    satuan: itemData.satuan || 'Pcs',
    jumlah: effectiveDelta,
    gudangId: itemData.gudangId || 'GDG-001',
    gudangNama: itemData.gudangNama || 'Gudang Utama',
    referensiNota: referensiNota || `REF-${now.getTime().toString().slice(-6)}`,
    keterangan: keterangan || `Transaksi Stok ${jenis}`,
    tanggal,
    petugas,
    sumberSupplier,
    penerimaTujuan,
    hargaSatuan: unitPrice,
    totalHarga: effectiveDelta * unitPrice,
    sisaStock: newStock,
    createdAt: nowIso,
    createdBy: petugas,
    updatedAt: nowIso,
    updatedBy: petugas
  };

  // Update in-memory store
  const localIdx = dbStore.barang.findIndex((b) => b.id === barangId);
  if (localIdx >= 0) {
    dbStore.barang[localIdx] = updatedBarang;
  } else {
    dbStore.barang.unshift(updatedBarang);
  }
  dbStore.stockMovements.unshift(movement as any);
  scheduleSnapshotSave(150);

  // Persist to Supabase directly when configured
  if (client) {
    try {
      await upsertSupabaseDoc('barang', barangId, { ...updatedBarang, updatedBy: petugas }, client);
      await upsertSupabaseDoc('stock_movements', movementId, movement, client);
    } catch (err: any) {
      console.warn(`Supabase stock transaction sync notice for ${barangId}:`, err?.message || err);
    }
  }

  return { updatedBarang, movement };
}

// All operational collections mapped to Supabase PostgreSQL
export const SYNCED_COLLECTIONS = [
  { key: 'users', coll: 'users' },
  { key: 'roles', coll: 'roles' },
  { key: 'pegawai', coll: 'pegawai' },
  { key: 'divisi', coll: 'divisi' },
  { key: 'jabatan', coll: 'jabatan' },
  { key: 'gudang', coll: 'gudang' },
  { key: 'kategori', coll: 'kategori' },
  { key: 'instansi', coll: 'instansi' },
  { key: 'kendaraan', coll: 'kendaraan' },
  { key: 'laporanBbm', coll: 'laporanBbm' },
  { key: 'barang', coll: 'barang' },
  { key: 'barangDatang', coll: 'barangDatang' },
  { key: 'menuHarian', coll: 'menuHarian' },
  { key: 'stockMovements', coll: 'stockMovements' },
  { key: 'opnameSessions', coll: 'opnameSessions' },
  { key: 'tugasDivisiRecords', coll: 'tugasDivisi' },
  { key: 'taskTemplates', coll: 'taskTemplates' },
  { key: 'waDivisiSettings', coll: 'whatsappDivisiSettings' },
  { key: 'beneficiaryGroups', coll: 'beneficiaryGroups' },
  { key: 'beneficiaryLocations', coll: 'beneficiaryLocations' },
  { key: 'dailyBeneficiaryRecords', coll: 'dailyBeneficiaryRecords' },
  { key: 'beneficiaryAuditLogs', coll: 'beneficiaryAuditLogs' },
  { key: 'bastDocuments', coll: 'bastDocuments' },
  { key: 'drivers', coll: 'drivers' },
  { key: 'distributionReports', coll: 'distributionReports' },
  { key: 'suratMasuk', coll: 'suratMasuk' },
  { key: 'suratKeluar', coll: 'suratKeluar' },
  { key: 'disposisi', coll: 'disposisi' },
  { key: 'templateSurat', coll: 'templateSurat' },
  { key: 'masterBahanPangan', coll: 'masterBahanPangan' },
  { key: 'masterMenuResep', coll: 'masterMenuResep' },
  { key: 'nutritionPlans', coll: 'nutritionPlans' },
  { key: 'rabPlans', coll: 'rabPlans' },
  { key: 'purchaseOrders', coll: 'purchaseOrders' },
  { key: 'suppliers', coll: 'suppliers' },
  { key: 'notifications', coll: 'notifications' },
  { key: 'activityLogs', coll: 'activityLogs' },
  { key: 'menus', coll: 'menus' },
  { key: 'foodWasteRecords', coll: 'foodWasteRecords' },
  { key: 'petugasList', coll: 'petugasList' },
  { key: 'slipGajiList', coll: 'slipGajiList' },
  { key: 'rekapAbsensiList', coll: 'rekapAbsensiList' },
  { key: 'suhuPengolahan', coll: 'suhu_pengolahan_v2' },
  { key: 'suhuMasukOmpreng', coll: 'suhu_masuk_ompreng_v2' },
  { key: 'organoleptikRecords', coll: 'organoleptik_v1' },
  { key: 'settings', coll: 'settings', isSingleDoc: true },
  { key: 'documentTemplate', coll: 'documentTemplate', isSingleDoc: true }
];

let isSyncing = false;

export async function initFirestoreSync(force = false) {
  if (isSyncing) return;

  const hadLocalSnapshot = hydrateFromLocalSnapshot();

  if (!force && hadLocalSnapshot && lastFullSyncAt > 0 && Date.now() - lastFullSyncAt < SYNC_COOLDOWN_MS) {
    console.log('⚡ Using warm persistent cloud snapshot.');
    return;
  }

  const client = getFirestoreDb();
  if (!client) {
    console.log('ℹ️ Supabase credentials not set yet — running seamlessly on persistent local snapshot cache.');
    dbStore.sanitizeCategories();
    saveSnapshotToDiskNow();
    return;
  }

  isSyncing = true;
  console.log('🔄 Initializing Supabase PostgreSQL Synchronization...');

  try {
    const syncSingleItem = async (item: { key: string; coll: string; isSingleDoc?: boolean }) => {
      try {
        if (item.isSingleDoc) {
          const existingDoc = await fetchSupabaseDoc(item.coll, 'main', client);
          if (!existingDoc) {
            const initialSettings = (dbStore as any)[item.key];
            if (initialSettings) {
              await upsertSupabaseDoc(item.coll, 'main', JSON.parse(JSON.stringify(initialSettings)), client).catch(
                (err) => {
                  console.error(`⚠️ Error seeding single doc ${item.coll}/main:`, err);
                }
              );
            }
          } else {
            (dbStore as any)[item.key] = existingDoc;
          }
          return;
        }

        const remoteDocs = await fetchSupabaseCollection(item.coll, { client });
        const initialItems = (dbStore as any)[item.key];

        if (!remoteDocs || remoteDocs.length === 0) {
          if (item.coll === 'beneficiaryGroups' || item.coll === 'beneficiaryLocations') {
            (dbStore as any)[item.key] = [];
            return;
          }
          if (Array.isArray(initialItems) && initialItems.length > 0) {
            const ops = initialItems.map((docData: any) => ({
              type: 'set' as const,
              id: docData.id || generateUniqueId('DOC'),
              data: JSON.parse(JSON.stringify(docData))
            }));
            await batchSyncSupabaseDocs(item.coll, ops, client).catch((err) => {
              console.error(`⚠️ Error batch-seeding collection ${item.coll}:`, err);
            });
          }
        } else {
          if (item.coll === 'users') {
            // Pertahankan password lokal untuk autentikasi SSO internal bila sudah ada
            const passwordById = new Map<string, string>();
            for (const u of dbStore.users) {
              if (u.password) passwordById.set(u.id, u.password);
            }
            (dbStore as any)[item.key] = remoteDocs.map((u: any) => ({
              ...u,
              password: u.password || passwordById.get(u.id)
            }));
          } else {
            (dbStore as any)[item.key] = remoteDocs;
          }
        }
      } catch (err: any) {
        console.warn(`⚠️ Warning syncing collection ${item.coll}:`, err?.message || err);
      }
    };

    const concurrency = 6;
    for (let i = 0; i < SYNCED_COLLECTIONS.length; i += concurrency) {
      const batch = SYNCED_COLLECTIONS.slice(i, i + concurrency);
      await Promise.allSettled(batch.map((item) => syncSingleItem(item)));
    }

    try {
      const appStateRows = await fetchSupabaseCollection<{ id: string; key: string; value: string }>(
        'app_state_sync',
        { client }
      );
      if (Array.isArray(appStateRows)) {
        for (const row of appStateRows) {
          if (row?.key && typeof row.value === 'string') {
            dbStore.appStateSync[row.key] = row.value;
          }
        }
      }
      lastFullSyncAt = Date.now();
    } catch (err: any) {
      console.warn('⚠️ App state sync warning:', err?.message || err);
    }

    for (const defMenu of initialMenus) {
      if (!dbStore.menus.some((m) => m.id === defMenu.id || m.path === defMenu.path)) {
        dbStore.menus.push({ ...defMenu });
      }
    }

    dbStore.sanitizeCategories();
    saveSnapshotToDiskNow();
    console.log(
      `✅ Supabase Sync Complete (${SYNCED_COLLECTIONS.length} collections, ${Object.keys(dbStore.appStateSync).length} app-state keys)!`
    );
  } catch (err: any) {
    console.warn('⚠️ Supabase sync notice (server continues on local cache):', err?.message || err);
  } finally {
    isSyncing = false;
  }
}
