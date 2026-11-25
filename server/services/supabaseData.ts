import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerSupabaseClient } from './supabase';

export type DedicatedTableName =
  | 'users'
  | 'barang'
  | 'stock_movements'
  | 'opname_sessions'
  | 'menu_harian'
  | 'suhu_pengolahan_v2'
  | 'suhu_masuk_ompreng_v2'
  | 'organoleptik_v1'
  | 'app_state_sync';

export interface SupabaseTarget {
  table: DedicatedTableName | 'portal_collections';
  isPortalCollection: boolean;
  collectionName: string;
}

const DEDICATED_COLLECTION_MAP: Record<string, DedicatedTableName> = {
  users: 'users',
  barang: 'barang',
  stockMovements: 'stock_movements',
  stock_movements: 'stock_movements',
  opnameSessions: 'opname_sessions',
  opname_sessions: 'opname_sessions',
  menuHarian: 'menu_harian',
  menu_harian: 'menu_harian',
  suhu_pengolahan_v2: 'suhu_pengolahan_v2',
  suhuPengolahan: 'suhu_pengolahan_v2',
  suhu_masuk_ompreng_v2: 'suhu_masuk_ompreng_v2',
  suhuMasukOmpreng: 'suhu_masuk_ompreng_v2',
  organoleptik_v1: 'organoleptik_v1',
  organoleptikRecords: 'organoleptik_v1',
  app_state_sync: 'app_state_sync',
  appStateSync: 'app_state_sync',
};

export function resolveSupabaseTarget(collectionName: string): SupabaseTarget {
  const dedicated = DEDICATED_COLLECTION_MAP[collectionName];
  if (dedicated) {
    return {
      table: dedicated,
      isPortalCollection: false,
      collectionName,
    };
  }
  return {
    table: 'portal_collections',
    isPortalCollection: true,
    collectionName,
  };
}

function sanitizeJson<T>(val: T): T {
  return JSON.parse(JSON.stringify(val ?? {}));
}

function stripSensitiveUserFields(record: Record<string, any>): Record<string, any> {
  const copy = { ...record };
  if ('password' in copy) {
    delete copy.password;
  }
  return copy;
}

export function mapAppRecordToRow(
  target: SupabaseTarget,
  docId: string,
  record: Record<string, any>
): Record<string, any> {
  const clean = sanitizeJson(record || {});
  const id = String(docId || clean.id || '');
  const nowIso = new Date().toISOString();

  if (target.isPortalCollection) {
    return {
      collection_name: target.collectionName,
      id,
      data: { ...clean, id },
      updated_at: clean.updatedAt || nowIso,
    };
  }

  switch (target.table) {
    case 'users': {
      const safeUser = stripSensitiveUserFields({ ...clean, id });
      return {
        id,
        auth_uid: safeUser.authUid || safeUser.auth_uid || null,
        nama: String(safeUser.nama || ''),
        username: safeUser.username || null,
        email: safeUser.email || null,
        role: String(safeUser.role || 'Staff'),
        divisi: String(safeUser.divisi || ''),
        jabatan: String(safeUser.jabatan || ''),
        status: String(safeUser.status || 'Aktif'),
        foto: String(safeUser.foto || ''),
        last_login: safeUser.lastLogin || null,
        email_verified: Boolean(safeUser.emailVerified),
        data: safeUser,
        updated_at: nowIso,
      };
    }
    case 'barang':
      return {
        id,
        kode_barang: String(clean.kodeBarang || ''),
        nama_barang: String(clean.namaBarang || ''),
        kategori_id: String(clean.kategoriId || ''),
        kategori_nama: String(clean.kategoriNama || ''),
        gudang_id: String(clean.gudangId || ''),
        gudang_nama: String(clean.gudangNama || ''),
        satuan: String(clean.satuan || 'Pcs'),
        stok_minimal: Number(clean.stokMinimal ?? 0),
        stok_sekarang: Number(clean.stokSekarang ?? 0),
        stok_awal: Number(clean.stokAwal ?? 0),
        harga_satuan: Number(clean.hargaSatuan ?? 0),
        barcode: String(clean.barcode || ''),
        qr_code_url: String(clean.qrCodeUrl || ''),
        foto_url: String(clean.fotoUrl || ''),
        sumber_supplier: String(clean.sumberSupplier || ''),
        keterangan: String(clean.keterangan || ''),
        status: String(clean.status || 'Aktif'),
        data: { ...clean, id },
        updated_at: nowIso,
      };
    case 'stock_movements':
      return {
        id,
        jenis: String(clean.jenis || 'Masuk'),
        barang_id: clean.barangId || null,
        kode_barang: String(clean.kodeBarang || ''),
        nama_barang: String(clean.namaBarang || ''),
        satuan: String(clean.satuan || 'Pcs'),
        jumlah: Number(clean.jumlah ?? 0),
        gudang_id: String(clean.gudangId || ''),
        gudang_nama: String(clean.gudangNama || ''),
        referensi_nota: String(clean.referensiNota || ''),
        keterangan: String(clean.keterangan || ''),
        tanggal: String(clean.tanggal || ''),
        petugas: String(clean.petugas || ''),
        sumber_supplier: String(clean.sumberSupplier || ''),
        penerima_tujuan: String(clean.penerimaTujuan || ''),
        harga_satuan: Number(clean.hargaSatuan ?? 0),
        total_harga: Number(clean.totalHarga ?? 0),
        sisa_stock: Number(clean.sisaStock ?? 0),
        created_by: String(clean.createdBy || ''),
        updated_by: String(clean.updatedBy || ''),
        data: { ...clean, id },
        updated_at: nowIso,
      };
    case 'opname_sessions':
      return {
        id,
        kode_opname: String(clean.kodeOpname || ''),
        tanggal: String(clean.tanggal || ''),
        gudang_id: String(clean.gudangId || ''),
        gudang_nama: String(clean.gudangNama || ''),
        petugas: String(clean.petugas || ''),
        status: String(clean.status || 'Draft'),
        items: Array.isArray(clean.items) ? clean.items : [],
        catatan_general: String(clean.catatanGeneral || ''),
        data: { ...clean, id },
        updated_at: nowIso,
      };
    case 'menu_harian':
      return {
        id,
        tanggal_operasional: String(clean.tanggalOperasional || ''),
        hari: String(clean.hari || ''),
        hari_tanggal_formatted: String(clean.hariTanggalFormatted || ''),
        nama_menu: String(clean.namaMenu || ''),
        kategori_porsi: String(clean.kategoriPorsi || 'Standar / Umum'),
        energi_kkal: Number(clean.energiKkal ?? 0),
        protein_gram: Number(clean.proteinGram ?? 0),
        lemak_gram: Number(clean.lemakGram ?? 0),
        karbohidrat_gram: Number(clean.karbohidratGram ?? 0),
        serat_gram: Number(clean.seratGram ?? 0),
        gizi_porsi_besar: clean.giziPorsiBesar ?? null,
        gizi_porsi_kecil: clean.giziPorsiKecil ?? null,
        rincian_komponen: clean.rincianKomponen ?? null,
        catatan_gizi: String(clean.catatanGizi || ''),
        foto_menu_url: String(clean.fotoMenuUrl || ''),
        foto_file_name: String(clean.fotoFileName || ''),
        foto_file_size_kb: Number(clean.fotoFileSizeKb ?? 0),
        petugas: String(clean.petugas || ''),
        created_by: String(clean.createdBy || ''),
        data: { ...clean, id },
        updated_at: nowIso,
      };
    case 'suhu_pengolahan_v2':
    case 'suhu_masuk_ompreng_v2':
      return {
        id,
        tanggal: String(clean.tanggal || ''),
        status: String(clean.status || 'Sesuai Standar'),
        petugas: String(clean.petugas || ''),
        petugas_role: String(clean.petugasRole || ''),
        sesi1: clean.sesi1 || {},
        sesi2: clean.sesi2 || {},
        sesi3: clean.sesi3 || {},
        catatan: String(clean.catatan || ''),
        data: { ...clean, id },
        updated_at: nowIso,
      };
    case 'organoleptik_v1':
      return {
        id,
        nama_pemeriksa: String(clean.namaPemeriksa || ''),
        tempat_pemeriksaan: String(clean.tempatPemeriksaan || 'SPPG'),
        nama_tempat_pemeriksa: String(clean.namaTempatPemeriksa || ''),
        tanggal_pemeriksaan: String(clean.tanggalPemeriksaan || ''),
        waktu_pemeriksaan: String(clean.waktuPemeriksaan || ''),
        rows: Array.isArray(clean.rows) ? clean.rows : [],
        kesimpulan: String(clean.kesimpulan || 'Aman dikonsumsi'),
        data: { ...clean, id },
        updated_at: nowIso,
      };
    case 'app_state_sync':
      return {
        id,
        key: String(clean.key || id),
        value: typeof clean.value === 'string' ? clean.value : JSON.stringify(clean.value ?? ''),
        updated_by: String(clean.updatedBy || ''),
        data: { ...clean, id },
        updated_at: nowIso,
      };
  }
}

export function mapRowToAppRecord<T = any>(target: SupabaseTarget, row: Record<string, any>): T {
  if (!row || typeof row !== 'object') return row as T;

  if (target.isPortalCollection) {
    const payload = row.data && typeof row.data === 'object' ? row.data : {};
    return { ...payload, id: row.id || payload.id } as T;
  }

  const basePayload = row.data && typeof row.data === 'object' ? { ...row.data } : {};

  switch (target.table) {
    case 'users':
      return {
        ...basePayload,
        id: row.id ?? basePayload.id,
        authUid: row.auth_uid ?? basePayload.authUid,
        nama: row.nama ?? basePayload.nama ?? '',
        username: row.username ?? basePayload.username ?? '',
        email: row.email ?? basePayload.email ?? '',
        role: row.role ?? basePayload.role ?? 'Staff',
        divisi: row.divisi ?? basePayload.divisi ?? '',
        jabatan: row.jabatan ?? basePayload.jabatan ?? '',
        status: row.status ?? basePayload.status ?? 'Aktif',
        foto: row.foto ?? basePayload.foto ?? '',
        lastLogin: row.last_login ?? basePayload.lastLogin,
        emailVerified: row.email_verified ?? basePayload.emailVerified ?? false,
        createdAt: row.created_at ?? basePayload.createdAt ?? '',
      } as T;
    case 'barang':
      return {
        ...basePayload,
        id: row.id ?? basePayload.id,
        kodeBarang: row.kode_barang ?? basePayload.kodeBarang ?? '',
        namaBarang: row.nama_barang ?? basePayload.namaBarang ?? '',
        kategoriId: row.kategori_id ?? basePayload.kategoriId ?? '',
        kategoriNama: row.kategori_nama ?? basePayload.kategoriNama ?? '',
        gudangId: row.gudang_id ?? basePayload.gudangId ?? '',
        gudangNama: row.gudang_nama ?? basePayload.gudangNama ?? '',
        satuan: row.satuan ?? basePayload.satuan ?? 'Pcs',
        stokMinimal: Number(row.stok_minimal ?? basePayload.stokMinimal ?? 0),
        stokSekarang: Number(row.stok_sekarang ?? basePayload.stokSekarang ?? 0),
        stokAwal: Number(row.stok_awal ?? basePayload.stokAwal ?? 0),
        hargaSatuan: Number(row.harga_satuan ?? basePayload.hargaSatuan ?? 0),
        barcode: row.barcode ?? basePayload.barcode ?? '',
        qrCodeUrl: row.qr_code_url ?? basePayload.qrCodeUrl ?? '',
        fotoUrl: row.foto_url ?? basePayload.fotoUrl ?? '',
        sumberSupplier: row.sumber_supplier ?? basePayload.sumberSupplier ?? '',
        keterangan: row.keterangan ?? basePayload.keterangan ?? '',
        status: row.status ?? basePayload.status ?? 'Aktif',
        updatedAt: row.updated_at ?? basePayload.updatedAt,
      } as T;
    case 'stock_movements':
      return {
        ...basePayload,
        id: row.id ?? basePayload.id,
        jenis: row.jenis ?? basePayload.jenis,
        barangId: row.barang_id ?? basePayload.barangId ?? '',
        kodeBarang: row.kode_barang ?? basePayload.kodeBarang ?? '',
        namaBarang: row.nama_barang ?? basePayload.namaBarang ?? '',
        satuan: row.satuan ?? basePayload.satuan ?? 'Pcs',
        jumlah: Number(row.jumlah ?? basePayload.jumlah ?? 0),
        gudangId: row.gudang_id ?? basePayload.gudangId ?? '',
        gudangNama: row.gudang_nama ?? basePayload.gudangNama ?? '',
        referensiNota: row.referensi_nota ?? basePayload.referensiNota ?? '',
        keterangan: row.keterangan ?? basePayload.keterangan ?? '',
        tanggal: row.tanggal ?? basePayload.tanggal ?? '',
        petugas: row.petugas ?? basePayload.petugas ?? '',
        sumberSupplier: row.sumber_supplier ?? basePayload.sumberSupplier ?? '',
        penerimaTujuan: row.penerima_tujuan ?? basePayload.penerimaTujuan ?? '',
        hargaSatuan: Number(row.harga_satuan ?? basePayload.hargaSatuan ?? 0),
        totalHarga: Number(row.total_harga ?? basePayload.totalHarga ?? 0),
        sisaStock: Number(row.sisa_stock ?? basePayload.sisaStock ?? 0),
        createdBy: row.created_by ?? basePayload.createdBy,
        updatedBy: row.updated_by ?? basePayload.updatedBy,
        createdAt: row.created_at ?? basePayload.createdAt,
        updatedAt: row.updated_at ?? basePayload.updatedAt,
      } as T;
    case 'opname_sessions':
      return {
        ...basePayload,
        id: row.id ?? basePayload.id,
        kodeOpname: row.kode_opname ?? basePayload.kodeOpname ?? '',
        tanggal: row.tanggal ?? basePayload.tanggal ?? '',
        gudangId: row.gudang_id ?? basePayload.gudangId ?? '',
        gudangNama: row.gudang_nama ?? basePayload.gudangNama ?? '',
        petugas: row.petugas ?? basePayload.petugas ?? '',
        status: row.status ?? basePayload.status ?? 'Draft',
        items: row.items ?? basePayload.items ?? [],
        catatanGeneral: row.catatan_general ?? basePayload.catatanGeneral ?? '',
      } as T;
    case 'menu_harian':
      return {
        ...basePayload,
        id: row.id ?? basePayload.id,
        tanggalOperasional: row.tanggal_operasional ?? basePayload.tanggalOperasional ?? '',
        hari: row.hari ?? basePayload.hari,
        hariTanggalFormatted: row.hari_tanggal_formatted ?? basePayload.hariTanggalFormatted,
        namaMenu: row.nama_menu ?? basePayload.namaMenu ?? '',
        kategoriPorsi: row.kategori_porsi ?? basePayload.kategoriPorsi,
        energiKkal: Number(row.energi_kkal ?? basePayload.energiKkal ?? 0),
        proteinGram: Number(row.protein_gram ?? basePayload.proteinGram ?? 0),
        lemakGram: Number(row.lemak_gram ?? basePayload.lemakGram ?? 0),
        karbohidratGram: Number(row.karbohidrat_gram ?? basePayload.karbohidratGram ?? 0),
        seratGram: Number(row.serat_gram ?? basePayload.seratGram ?? 0),
        giziPorsiBesar: row.gizi_porsi_besar ?? basePayload.giziPorsiBesar,
        giziPorsiKecil: row.gizi_porsi_kecil ?? basePayload.giziPorsiKecil,
        rincianKomponen: row.rincian_komponen ?? basePayload.rincianKomponen,
        catatanGizi: row.catatan_gizi ?? basePayload.catatanGizi,
        fotoMenuUrl: row.foto_menu_url ?? basePayload.fotoMenuUrl,
        fotoFileName: row.foto_file_name ?? basePayload.fotoFileName,
        fotoFileSizeKb: Number(row.foto_file_size_kb ?? basePayload.fotoFileSizeKb ?? 0),
        petugas: row.petugas ?? basePayload.petugas,
        createdBy: row.created_by ?? basePayload.createdBy,
        createdAt: row.created_at ?? basePayload.createdAt ?? '',
        updatedAt: row.updated_at ?? basePayload.updatedAt,
      } as T;
    case 'suhu_pengolahan_v2':
    case 'suhu_masuk_ompreng_v2':
      return {
        ...basePayload,
        id: row.id ?? basePayload.id,
        tanggal: row.tanggal ?? basePayload.tanggal ?? '',
        status: row.status ?? basePayload.status ?? 'Sesuai Standar',
        petugas: row.petugas ?? basePayload.petugas ?? '',
        petugasRole: row.petugas_role ?? basePayload.petugasRole ?? '',
        sesi1: row.sesi1 ?? basePayload.sesi1 ?? {},
        sesi2: row.sesi2 ?? basePayload.sesi2 ?? {},
        sesi3: row.sesi3 ?? basePayload.sesi3 ?? {},
        catatan: row.catatan ?? basePayload.catatan ?? '',
        createdAt: row.created_at ?? basePayload.createdAt ?? '',
        updatedAt: row.updated_at ?? basePayload.updatedAt ?? '',
      } as T;
    case 'organoleptik_v1':
      return {
        ...basePayload,
        id: row.id ?? basePayload.id,
        namaPemeriksa: row.nama_pemeriksa ?? basePayload.namaPemeriksa ?? '',
        tempatPemeriksaan: row.tempat_pemeriksaan ?? basePayload.tempatPemeriksaan ?? 'SPPG',
        namaTempatPemeriksa: row.nama_tempat_pemeriksa ?? basePayload.namaTempatPemeriksa ?? '',
        tanggalPemeriksaan: row.tanggal_pemeriksaan ?? basePayload.tanggalPemeriksaan ?? '',
        waktuPemeriksaan: row.waktu_pemeriksaan ?? basePayload.waktuPemeriksaan ?? '',
        rows: row.rows ?? basePayload.rows ?? [],
        kesimpulan: row.kesimpulan ?? basePayload.kesimpulan ?? 'Aman dikonsumsi',
        updatedAt: row.updated_at ?? basePayload.updatedAt ?? '',
      } as T;
    case 'app_state_sync':
      return {
        ...basePayload,
        id: row.id ?? basePayload.id,
        key: row.key ?? basePayload.key ?? row.id,
        value: row.value ?? basePayload.value ?? '',
      } as T;
  }
}

export async function fetchSupabaseCollection<T = any>(
  collectionName: string,
  options?: {
    client?: SupabaseClient | null;
    orderByColumn?: string;
    ascending?: boolean;
  }
): Promise<T[] | null> {
  const client = options?.client ?? getServerSupabaseClient();
  if (!client) return null;

  const target = resolveSupabaseTarget(collectionName);
  let queryBuilder = client.from(target.table).select('*');

  if (target.isPortalCollection) {
    queryBuilder = queryBuilder.eq('collection_name', target.collectionName);
  }
  if (options?.orderByColumn && !target.isPortalCollection) {
    queryBuilder = queryBuilder.order(options.orderByColumn, {
      ascending: options.ascending ?? false,
    });
  }

  const { data, error } = await queryBuilder;
  if (error) {
    throw error;
  }
  return (data || []).map((row) => mapRowToAppRecord<T>(target, row));
}

export async function fetchSupabaseDoc<T = any>(
  collectionName: string,
  docId: string,
  clientOverride?: SupabaseClient | null
): Promise<T | null> {
  const client = clientOverride ?? getServerSupabaseClient();
  if (!client) return null;

  const target = resolveSupabaseTarget(collectionName);
  let queryBuilder = client.from(target.table).select('*').eq('id', docId);
  if (target.isPortalCollection) {
    queryBuilder = queryBuilder.eq('collection_name', target.collectionName);
  }

  const { data, error } = await queryBuilder.maybeSingle();
  if (error) throw error;
  return data ? mapRowToAppRecord<T>(target, data) : null;
}

export async function upsertSupabaseDoc<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  record: T,
  clientOverride?: SupabaseClient | null
): Promise<boolean> {
  const client = clientOverride ?? getServerSupabaseClient();
  if (!client) return false;

  const target = resolveSupabaseTarget(collectionName);
  const row = mapAppRecordToRow(target, docId, record);
  const conflictTarget = target.isPortalCollection ? 'collection_name,id' : 'id';

  const { error } = await client.from(target.table).upsert(row, {
    onConflict: conflictTarget,
  });
  if (error) throw error;
  return true;
}

export async function batchSyncSupabaseDocs(
  collectionName: string,
  ops: Array<{ type: 'set' | 'delete'; id: string; data?: any }>,
  clientOverride?: SupabaseClient | null
): Promise<boolean> {
  const client = clientOverride ?? getServerSupabaseClient();
  if (!client || !ops.length) return false;

  const target = resolveSupabaseTarget(collectionName);
  const upserts = ops.filter((o) => o.type === 'set' && o.data);
  const deletes = ops.filter((o) => o.type === 'delete').map((o) => o.id);

  if (deletes.length > 0) {
    let delQuery = client.from(target.table).delete().in('id', deletes);
    if (target.isPortalCollection) {
      delQuery = delQuery.eq('collection_name', target.collectionName);
    }
    const { error } = await delQuery;
    if (error) throw error;
  }

  if (upserts.length > 0) {
    const rows = upserts.map((u) => mapAppRecordToRow(target, u.id, u.data));
    const conflictTarget = target.isPortalCollection ? 'collection_name,id' : 'id';
    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await client.from(target.table).upsert(chunk, {
        onConflict: conflictTarget,
      });
      if (error) throw error;
    }
  }

  return true;
}
