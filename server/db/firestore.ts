import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore,
  setLogLevel,
  Firestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  collection, 
  writeBatch, 
  runTransaction, 
  onSnapshot 
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { dbStore, initialMenus } from './store';
import { MasterBarang } from '../../src/types';

// Suppress internal gRPC stream reset noise from the Node runtime
try {
  setLogLevel('silent');
} catch (_) {}

let firestoreDb: Firestore | null = null;
let isConnected = false;
let configData: any = null;

export function getFirestoreDb(): Firestore | null {
  if (firestoreDb) return firestoreDb;

  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // Ensure FIREBASE_API_KEY is populated into process.env if not already set
      if (!process.env.FIREBASE_API_KEY && configData.apiKey) {
        process.env.FIREBASE_API_KEY = configData.apiKey;
      }

      const existingApps = getApps();
      const app = existingApps.find(a => a.name === 'server-firestore') || initializeApp(configData, 'server-firestore');

      firestoreDb = configData.firestoreDatabaseId 
        ? getFirestore(app, configData.firestoreDatabaseId)
        : getFirestore(app);
      isConnected = true;
      console.log('🔥 Connected to Google Cloud Firestore (Primary Database):', configData.projectId, configData.firestoreDatabaseId);
    }
  } catch (err: any) {
    console.error('⚠️ Could not initialize Firestore Client SDK on server:', err?.message || err);
  }
  return firestoreDb;
}

export function getCloudInfo() {
  getFirestoreDb();
  return {
    isConnected,
    status: isConnected ? 'online' : 'offline',
    projectId: configData?.projectId || 'chromatic-reference-lt3g1',
    databaseId: configData?.firestoreDatabaseId || 'default',
    authDomain: configData?.authDomain || '',
    appId: configData?.appId || '',
    apiKey: configData?.apiKey || '',
    firebaseApiKeyConfigured: Boolean(process.env.FIREBASE_API_KEY || configData?.apiKey),
    jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
    githubOAuthConfigured: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    syncedCollectionsCount: SYNCED_COLLECTIONS.length,
    collections: SYNCED_COLLECTIONS.map(s => s.coll),
    mode: 'Google Cloud Firestore Real-time Primary Database'
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
  const db = getFirestoreDb();
  if (!db) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      message: 'Konfigurasi Firebase belum dimuat di server.'
    };
  }

  try {
    const probeRef = doc(db, 'system_health', 'connection_probe');
    const nowIso = new Date().toISOString();
    await setDoc(probeRef, {
      lastPing: nowIso,
      probeOrigin: 'firebase-setup-guide',
      status: 'healthy'
    }, { merge: true });
    
    await getDoc(probeRef);
    const latency = Date.now() - start;

    return {
      success: true,
      latencyMs: latency,
      message: 'Koneksi read & write ke Google Cloud Firestore berhasil 100%!',
      projectId: configData?.projectId,
      databaseId: configData?.firestoreDatabaseId,
      probeTimestamp: nowIso
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      message: err?.message || 'Gagal menghubungkan ke Firestore'
    };
  }
}

// Sync helper functions to write changes to Firestore in realtime
export async function syncSaveDoc(
  collectionName: string, 
  docId: string, 
  data: any, 
  userMeta?: { name?: string; userId?: string }
) {
  try {
    const db = getFirestoreDb();
    if (!db) return;
    const cleanData = JSON.parse(JSON.stringify(data));
    
    // Add metadata
    cleanData.updatedAt = new Date().toISOString();
    if (userMeta?.name) {
      cleanData.updatedBy = userMeta.name;
    }
    if (!cleanData.createdAt) {
      cleanData.createdAt = cleanData.updatedAt;
      cleanData.createdBy = userMeta?.name || 'System';
    }

    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err: any) {
    console.error(`⚠️ Error writing ${collectionName}/${docId} to Firestore:`, err?.message || err);
  }
}

export async function syncSaveBatch(
  collectionName: string, 
  items: Array<{ id: string; data?: any; [key: string]: any }>,
  userMeta?: { name?: string; userId?: string }
) {
  try {
    const db = getFirestoreDb();
    if (!db || items.length === 0) return;
    
    const now = new Date().toISOString();
    const batchSize = 100;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = items.slice(i, i + batchSize);
      
      for (const rawItem of chunk) {
        const docId = rawItem.id;
        if (!docId) continue;
        const rawData = rawItem.data !== undefined ? rawItem.data : rawItem;
        const cleanData = JSON.parse(JSON.stringify(rawData));
        cleanData.updatedAt = now;
        if (userMeta?.name) cleanData.updatedBy = userMeta.name;
        if (!cleanData.createdAt) {
          cleanData.createdAt = now;
          cleanData.createdBy = userMeta?.name || 'System';
        }

        const docRef = doc(db, collectionName, docId);
        batch.set(docRef, cleanData, { merge: true });
      }

      await batch.commit();
    }
  } catch (err: any) {
    console.error(`⚠️ Error committing batch to ${collectionName}:`, err?.message || err);
  }
}

export async function syncDeleteDoc(collectionName: string, docId: string) {
  try {
    const db = getFirestoreDb();
    if (!db) return;
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.error(`⚠️ Error deleting ${collectionName}/${docId} from Firestore:`, err?.message || err);
  }
}

// Generate collision-resistant unique ID (replaces array.length + 1)
export function generateUniqueId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${randomPart}`;
}

/**
 * ATOMIC FIRESTORE TRANSACTION FOR STOCK MOVEMENTS:
 * Enforces: STOK AKHIR = STOK AWAL + BARANG MASUK - BARANG KELUAR ± PENYESUAIAN
 * Prevents race conditions and negative inventory across multiple concurrent devices (HP, Laptop).
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
  const db = getFirestoreDb();
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

  if (db) {
    try {
      // Run real Firestore atomic transaction
      return await runTransaction(db, async (transaction) => {
        const barangRef = doc(db, 'barang', barangId);
        const barangDoc = await transaction.get(barangRef);

        if (!barangDoc.exists()) {
          throw new Error(`Master Barang dengan ID "${barangId}" tidak ditemukan di database.`);
        }

        const itemData = barangDoc.data()!;
        const currentStock = Number(itemData.stokSekarang) || 0;
        const unitPrice = typeof hargaSatuan === 'number' ? hargaSatuan : (Number(itemData.hargaSatuan) || 0);

        // Validate quantity
        const qty = Number(jumlah);
        if (isNaN(qty) || (jenis !== 'Stock Awal' && jenis !== 'Penyesuaian Opname' && qty <= 0)) {
          throw new Error('Jumlah barang harus berupa angka positif.');
        }

        // Check stock sufficiency for Keluar
        if (jenis === 'Keluar' && currentStock < qty) {
          throw new Error(`Stok tidak mencukupi! Stok saat ini ${currentStock} ${itemData.satuan}, permintaan keluar: ${qty} ${itemData.satuan}.`);
        }

        // Calculate new stock: STOK AKHIR = STOK AWAL + BARANG MASUK - BARANG KELUAR ± PENYESUAIAN
        let newStock = currentStock;
        if (jenis === 'Masuk') {
          newStock = currentStock + qty;
        } else if (jenis === 'Keluar') {
          newStock = currentStock - qty;
        } else if (jenis === 'Stock Awal' || jenis === 'Penyesuaian Opname') {
          newStock = qty;
        }

        // Update master barang doc
        transaction.update(barangRef, {
          stokSekarang: newStock,
          updatedAt: nowIso,
          updatedBy: petugas
        });

        // Create stock movement record doc
        const movementRef = doc(db, 'stockMovements', movementId);
        const movementData = {
          id: movementId,
          jenis,
          barangId: itemData.id || barangId,
          kodeBarang: itemData.kodeBarang,
          namaBarang: itemData.namaBarang,
          satuan: itemData.satuan || 'Pcs',
          jumlah: jenis === 'Stock Awal' || jenis === 'Penyesuaian Opname' ? Math.abs(qty - currentStock) : qty,
          gudangId: itemData.gudangId || 'GDG-001',
          gudangNama: itemData.gudangNama || 'Gudang Utama',
          referensiNota: referensiNota || `REF-${now.getTime().toString().slice(-6)}`,
          keterangan: keterangan || `Transaksi Stok ${jenis}`,
          tanggal,
          petugas,
          sumberSupplier,
          penerimaTujuan,
          hargaSatuan: unitPrice,
          totalHarga: (jenis === 'Stock Awal' || jenis === 'Penyesuaian Opname' ? Math.abs(qty - currentStock) : qty) * unitPrice,
          sisaStock: newStock,
          createdAt: nowIso,
          createdBy: petugas,
          updatedAt: nowIso,
          updatedBy: petugas
        };

        transaction.set(movementRef, movementData);

        // Keep local in-memory store in sync immediately
        const localItem = dbStore.barang.find(b => b.id === barangId);
        if (localItem) {
          localItem.stokSekarang = newStock;
          localItem.updatedAt = nowIso;
        }
        dbStore.stockMovements.unshift(movementData as any);

        return {
          updatedBarang: { ...itemData, stokSekarang: newStock, updatedAt: nowIso } as MasterBarang,
          movement: movementData
        };
      });
    } catch (err: any) {
      console.warn(`Transaction warning for ${barangId}:`, err?.message || err);
    }
  }

  // Fallback if Firestore not reachable
  const item = dbStore.barang.find(b => b.id === barangId);
  if (!item) throw new Error(`Barang dengan ID "${barangId}" tidak ditemukan.`);

  const currentStock = Number(item.stokSekarang) || 0;
  const qty = Number(jumlah);
  if (jenis === 'Keluar' && currentStock < qty) {
    throw new Error(`Stok tidak mencukupi! Stok saat ini ${currentStock} ${item.satuan}.`);
  }

  let newStock = currentStock;
  if (jenis === 'Masuk') newStock = currentStock + qty;
  else if (jenis === 'Keluar') newStock = currentStock - qty;
  else if (jenis === 'Stock Awal' || jenis === 'Penyesuaian Opname') newStock = qty;

  item.stokSekarang = newStock;
  item.updatedAt = nowIso;

  const unitPrice = typeof hargaSatuan === 'number' ? hargaSatuan : item.hargaSatuan;
  const movement = {
    id: movementId,
    jenis,
    barangId: item.id,
    kodeBarang: item.kodeBarang,
    namaBarang: item.namaBarang,
    satuan: item.satuan,
    jumlah: jenis === 'Stock Awal' || jenis === 'Penyesuaian Opname' ? Math.abs(qty - currentStock) : qty,
    gudangId: item.gudangId,
    gudangNama: item.gudangNama,
    referensiNota: referensiNota || `REF-${now.getTime().toString().slice(-6)}`,
    keterangan: keterangan || `Transaksi Stok ${jenis}`,
    tanggal,
    petugas,
    sumberSupplier,
    penerimaTujuan,
    hargaSatuan: unitPrice,
    totalHarga: qty * unitPrice,
    sisaStock: newStock,
    createdAt: nowIso,
    createdBy: petugas,
    updatedAt: nowIso,
    updatedBy: petugas
  };

  dbStore.stockMovements.unshift(movement as any);

  // Sync docs safely in background
  syncSaveDoc('barang', item.id, item, { name: petugas });
  syncSaveDoc('stockMovements', movementId, movement, { name: petugas });

  return { updatedBarang: item, movement };
}

// All operational collections mapped to Firestore as Single Source of Truth
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
  { key: 'beneficiaryGroups', coll: 'beneficiaryGroups' },
  { key: 'beneficiaryLocations', coll: 'beneficiaryLocations' },
  { key: 'dailyBeneficiaryRecords', coll: 'dailyBeneficiaryRecords' },
  { key: 'beneficiaryAuditLogs', coll: 'beneficiaryAuditLogs' },
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
  { key: 'settings', coll: 'settings', isSingleDoc: true },
  { key: 'documentTemplate', coll: 'documentTemplate', isSingleDoc: true }
];

let isSyncing = false;

export async function initFirestoreSync() {
  if (isSyncing) return;
  const db = getFirestoreDb();
  if (!db) {
    console.warn('⚠️ Firestore initialization skipped: config not found');
    return;
  }

  isSyncing = true;
  console.log('🔄 Initializing Google Cloud Firestore Synchronization...');

  try {
    const syncSingleItem = async (item: { key: string; coll: string; isSingleDoc?: boolean }) => {
      try {
        const collRef = collection(db, item.coll);

        if (item.isSingleDoc) {
          const docRef = doc(db, item.coll, 'main');
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            const initialSettings = (dbStore as any)[item.key];
            if (initialSettings) {
              await setDoc(docRef, JSON.parse(JSON.stringify(initialSettings))).catch(() => {});
            }
          } else {
            (dbStore as any)[item.key] = docSnap.data();
          }
          return;
        }

        const snapshot = await getDocs(collRef);

        if (snapshot.empty) {
          const initialItems = (dbStore as any)[item.key];
          if (Array.isArray(initialItems) && initialItems.length > 0) {
            const batchSize = 100;
            for (let i = 0; i < initialItems.length; i += batchSize) {
              const batch = writeBatch(db);
              const chunk = initialItems.slice(i, i + batchSize);
              for (const docData of chunk) {
                const docId = docData.id || generateUniqueId('DOC');
                const dRef = doc(db, item.coll, docId);
                batch.set(dRef, JSON.parse(JSON.stringify(docData)));
              }
              await batch.commit().catch(() => {});
            }
          }
        } else {
          const docsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          if (docsData.length > 0) {
            (dbStore as any)[item.key] = docsData;
          }
        }
      } catch (err: any) {
        console.warn(`⚠️ Warning syncing collection ${item.coll}:`, err?.message || err);
      }
    };

    // Process in controlled parallel batches of 7 to finish quickly with low memory usage
    const concurrency = 7;
    for (let i = 0; i < SYNCED_COLLECTIONS.length; i += concurrency) {
      const batch = SYNCED_COLLECTIONS.slice(i, i + concurrency);
      await Promise.allSettled(batch.map(item => syncSingleItem(item)));
    }

    // Ensure default menus (including Menu Harian) are always present in dbStore.menus
    for (const defMenu of initialMenus) {
      if (!dbStore.menus.some(m => m.id === defMenu.id || m.path === defMenu.path)) {
        dbStore.menus.push({ ...defMenu });
      }
    }

    // Ensure initial sample Menu Harian items (Previous & Today) exist if collection only had 1 default record
    if (dbStore.menuHarian.length === 1 && dbStore.menuHarian[0].id === 'MH-20260929-001') {
      const prevDefault: any = {
        id: 'MH-20260928-001',
        tanggalOperasional: (() => {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          return d.toISOString().split('T')[0];
        })(),
        hari: 'Senin',
        hariTanggalFormatted: 'Senin, 28 September 2026',
        namaMenu: 'Nasi Putih, Ayam Krispy & Saus Tomat, Tempe Balado, Acar Timun & Wortel, Jeruk Madu',
        kategoriPorsi: 'Porsi Besar & Porsi Kecil',
        energiKkal: 698.9,
        proteinGram: 26.3,
        lemakGram: 27.9,
        karbohidratGram: 87.27,
        seratGram: 2.62,
        giziPorsiBesar: {
          energiKkal: 698.9,
          proteinGram: 26.3,
          lemakGram: 27.9,
          karbohidratGram: 87.27,
          seratGram: 2.62,
          keterangan: 'Sasaran SD Kelas 4-6, SMP, SMA / Bumil & Busui'
        },
        giziPorsiKecil: {
          energiKkal: 609,
          proteinGram: 24.8,
          lemakGram: 27.75,
          karbohidratGram: 67.37,
          seratGram: 2.62,
          keterangan: 'Sasaran PAUD, TK, SD Kelas 1-3 / Balita'
        },
        rincianKomponen: {
          karbohidrat: 'Nasi Putih',
          laukHewani: 'Ayam Krispy & Saus Tomat',
          laukNabati: 'Tempe Balado',
          sayur: 'Acar Timun & Wortel',
          buahSusu: 'Jeruk Madu'
        },
        catatanGizi: 'Memenuhi standar AKG harian program Makan Bergizi Gratis (MBG) Badan Gizi Nasional.',
        fotoMenuUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        fotoFileName: 'menu-mbg-ayam-krispy.jpg',
        fotoFileSizeKb: 230,
        petugas: 'Ahli Gizi SPPG',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        createdBy: 'Ahli Gizi SPPG'
      };
      dbStore.menuHarian.unshift(prevDefault);
      await syncSaveDoc('menuHarian', prevDefault.id, prevDefault).catch(() => {});
    }

    // Purge any legacy auto-seeded dummy beneficiary records (so only user-planned beneficiary records exist)
    if (Array.isArray(dbStore.dailyBeneficiaryRecords) && dbStore.dailyBeneficiaryRecords.length > 0) {
      const legacyAutoRecs = dbStore.dailyBeneficiaryRecords.filter(
        r => r.createdBy === 'System Copy' || (r.createdBy === 'USR-001' && r.createdAt?.endsWith('06:30:00'))
      );
      if (legacyAutoRecs.length > 0) {
        dbStore.dailyBeneficiaryRecords = dbStore.dailyBeneficiaryRecords.filter(
          r => r.createdBy !== 'System Copy' && !(r.createdBy === 'USR-001' && r.createdAt?.endsWith('06:30:00'))
        );
        for (const oldRec of legacyAutoRecs) {
          syncDeleteDoc('dailyBeneficiaryRecords', oldRec.id).catch(() => {});
        }
      }
    }

    // Purge any legacy auto-seeded dummy nutrition plans and unplanned auto-generated RAB plans
    if (Array.isArray(dbStore.nutritionPlans) && dbStore.nutritionPlans.length > 0) {
      const legacyDummyPlans = dbStore.nutritionPlans.filter(p => p.id === 'PLAN-20260812-001');
      if (legacyDummyPlans.length > 0) {
        dbStore.nutritionPlans = dbStore.nutritionPlans.filter(p => p.id !== 'PLAN-20260812-001');
        for (const dp of legacyDummyPlans) {
          syncDeleteDoc('nutritionPlans', dp.id).catch(() => {});
        }
      }
    }

    if (Array.isArray(dbStore.rabPlans) && dbStore.rabPlans.length > 0) {
      const legacyAutoRabs = dbStore.rabPlans.filter(
        r =>
          r.namaMenu === 'CHICKEN KATSU SAUS KARI JEPANG + TAHU GORENG + TUMIS SAYUR + BUAH KELENGKENG' &&
          !dbStore.nutritionPlans.some(p => p.tanggalPelaksanaan === r.tanggalPelaksanaan)
      );
      if (legacyAutoRabs.length > 0) {
        dbStore.rabPlans = dbStore.rabPlans.filter(
          r =>
            !(
              r.namaMenu === 'CHICKEN KATSU SAUS KARI JEPANG + TAHU GORENG + TUMIS SAYUR + BUAH KELENGKENG' &&
              !dbStore.nutritionPlans.some(p => p.tanggalPelaksanaan === r.tanggalPelaksanaan)
            )
        );
        for (const oldRab of legacyAutoRabs) {
          syncDeleteDoc('rabPlans', oldRab.id).catch(() => {});
        }
      }
    }

    dbStore.sanitizeCategories();
    console.log(`✅ Google Cloud Firestore Sync Complete (${SYNCED_COLLECTIONS.length} collections)!`);
  } finally {
    isSyncing = false;
  }
}
