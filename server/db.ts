import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';

let pool: Pool | null = null;
let poolInitialized = false;
let tablesInitialized = false;
let lastMysqlError: string | null = null;

function getMysqlConfig() {
  const host = (process.env.SQL_HOST || '').trim();
  const user = (process.env.SQL_USER || '').trim();
  const password = process.env.SQL_PASSWORD || '';
  const database = (process.env.SQL_DB_NAME || '').trim();
  const port = Number(process.env.SQL_PORT) || 3306;
  return { host, user, password, database, port };
}

export function isMysqlConfigured(): boolean {
  const { host, user, database } = getMysqlConfig();
  return Boolean(host && user && database);
}

/**
 * Ensures only safe HTTP/HTTPS (or local root-relative) URLs up to 500 chars are saved in MySQL.
 * Base64 data URIs are strictly rejected so image_url VARCHAR(500) never stores Base64 payloads.
 */
export function sanitizeMysqlImageUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('data:') ||
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('blob:')
  ) {
    return '';
  }

  if (trimmed.startsWith('/')) {
    return trimmed.slice(0, 500);
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return '';
    }
    return parsed.toString().slice(0, 500);
  } catch {
    return '';
  }
}

export function getMysqlPool(): Pool | null {
  if (pool) return pool;
  if (poolInitialized) return null;
  poolInitialized = true;

  const { host, user, password, database, port } = getMysqlConfig();
  if (!host || !user || !database) {
    console.info(
      '[MySQL] SQL_HOST, SQL_USER, atau SQL_DB_NAME belum diisi; layanan MySQL Hostinger nonaktif (menggunakan store & cloud sync).'
    );
    return null;
  }

  try {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10_000,
      charset: 'utf8mb4',
    });
    lastMysqlError = null;
    return pool;
  } catch (err: any) {
    lastMysqlError = err?.message || String(err);
    console.warn('[MySQL] Gagal membuat connection pool:', lastMysqlError);
    pool = null;
    return null;
  }
}

export async function initMysqlTables(): Promise<{
  configured: boolean;
  initialized: boolean;
  error?: string;
}> {
  const activePool = getMysqlPool();
  if (!activePool) {
    return { configured: isMysqlConfigured(), initialized: false, error: lastMysqlError || undefined };
  }

  try {
    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS menu_harian_mysql (
        id VARCHAR(64) PRIMARY KEY,
        tanggal_operasional VARCHAR(20) NOT NULL,
        hari VARCHAR(30) DEFAULT '',
        hari_tanggal_formatted VARCHAR(120) DEFAULT '',
        nama_menu VARCHAR(255) NOT NULL,
        kategori_porsi VARCHAR(120) DEFAULT 'Porsi Besar & Porsi Kecil',
        energi_kkal DECIMAL(10,2) DEFAULT 0,
        protein_gram DECIMAL(10,2) DEFAULT 0,
        lemak_gram DECIMAL(10,2) DEFAULT 0,
        karbohidrat_gram DECIMAL(10,2) DEFAULT 0,
        serat_gram DECIMAL(10,2) DEFAULT 0,
        gizi_porsi_besar JSON NULL,
        gizi_porsi_kecil JSON NULL,
        rincian_komponen JSON NULL,
        catatan_gizi TEXT NULL,
        image_url VARCHAR(500) DEFAULT '',
        foto_file_name VARCHAR(255) DEFAULT '',
        foto_file_size_kb INT DEFAULT 0,
        petugas VARCHAR(150) DEFAULT 'Ahli Gizi SPPG',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_menu_harian_tanggal (tanggal_operasional)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS siklus_menu_mysql (
        id VARCHAR(64) PRIMARY KEY,
        tanggal VARCHAR(20) NOT NULL,
        porsi_kecil JSON NULL,
        porsi_besar JSON NULL,
        custom_columns JSON NULL,
        is_locked TINYINT(1) DEFAULT 0,
        image_url VARCHAR(500) DEFAULT '',
        petugas VARCHAR(150) DEFAULT 'Ahli Gizi SPPG',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_siklus_tanggal (tanggal)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS laporan_distribusi_mysql (
        id VARCHAR(64) PRIMARY KEY,
        tanggal VARCHAR(20) NOT NULL,
        driver_id VARCHAR(64) DEFAULT '',
        driver_nama VARCHAR(150) NOT NULL,
        driver_foto VARCHAR(500) DEFAULT '',
        driver_kendaraan VARCHAR(150) DEFAULT '',
        instansi_id VARCHAR(64) DEFAULT '',
        nama_instansi VARCHAR(255) NOT NULL,
        jumlah_penerima_manfaat INT DEFAULT 0,
        jam_pengiriman VARCHAR(20) DEFAULT '',
        jam_penjemputan VARCHAR(20) DEFAULT '',
        image_url VARCHAR(500) DEFAULT '',
        image_url_penjemputan VARCHAR(500) DEFAULT '',
        catatan TEXT NULL,
        status VARCHAR(50) DEFAULT 'Selesai',
        created_by VARCHAR(150) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_laporan_distribusi_tanggal (tanggal)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS suhu_ompreng_mysql (
        id VARCHAR(64) PRIMARY KEY,
        tanggal VARCHAR(20) NOT NULL,
        jenis_pengukuran VARCHAR(50) DEFAULT 'Masuk Ompreng',
        sesi VARCHAR(30) DEFAULT 'Sesi 1',
        petugas VARCHAR(150) DEFAULT '',
        petugas_role VARCHAR(150) DEFAULT '',
        status VARCHAR(120) DEFAULT '',
        catatan TEXT NULL,
        sesi1 JSON NULL,
        sesi2 JSON NULL,
        sesi3 JSON NULL,
        image_url VARCHAR(500) DEFAULT '',
        image_url_hewani VARCHAR(500) DEFAULT '',
        image_url_nabati VARCHAR(500) DEFAULT '',
        image_url_sayuran VARCHAR(500) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_suhu_tanggal_jenis (tanggal, jenis_pengukuran)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await activePool.execute(`
      CREATE TABLE IF NOT EXISTS barang_datang_mysql (
        id VARCHAR(64) PRIMARY KEY,
        tanggal VARCHAR(20) NOT NULL,
        hari VARCHAR(30) DEFAULT '',
        hari_tanggal_formatted VARCHAR(120) DEFAULT '',
        nama_barang VARCHAR(255) NOT NULL,
        jumlah_masuk DECIMAL(12,2) DEFAULT 0,
        satuan VARCHAR(50) DEFAULT '',
        jenis_barang VARCHAR(50) DEFAULT 'Bahan Baku',
        kualitas_produk VARCHAR(30) DEFAULT 'Baik',
        image_url VARCHAR(500) DEFAULT '',
        keterangan TEXT NULL,
        petugas VARCHAR(150) DEFAULT 'Petugas Logistik',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_barang_datang_tanggal (tanggal)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    tablesInitialized = true;
    lastMysqlError = null;
    console.log('[MySQL] Tabel operasional MySQL siap digunakan.');
    return { configured: true, initialized: true };
  } catch (err: any) {
    lastMysqlError = err?.message || String(err);
    console.warn('[MySQL] Gagal menginisialisasi tabel MySQL:', lastMysqlError);
    return { configured: true, initialized: false, error: lastMysqlError || undefined };
  }
}

export async function getMysqlStatus() {
  const { host, database } = getMysqlConfig();
  const configured = isMysqlConfigured();
  const activePool = getMysqlPool();
  let connected = false;

  if (activePool) {
    try {
      await activePool.query('SELECT 1');
      connected = true;
      lastMysqlError = null;
    } catch (err: any) {
      lastMysqlError = err?.message || String(err);
    }
  }

  return {
    configured,
    connected,
    tablesInitialized,
    host: host || 'belum-dikonfigurasi',
    database: database || 'belum-dikonfigurasi',
    tables: [
      'menu_harian_mysql',
      'siklus_menu_mysql',
      'laporan_distribusi_mysql',
      'suhu_ompreng_mysql',
      'barang_datang_mysql',
    ],
    lastError: lastMysqlError,
  };
}

function safeParseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

// ============================================================================
// 1. MENU HARIAN MYSQL REPOSITORY
// ============================================================================
export const mysqlMenuHarian = {
  async list(filters?: { tanggal?: string; startDate?: string; endDate?: string; search?: string }) {
    const activePool = getMysqlPool();
    if (!activePool) return null;

    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.tanggal?.trim()) {
      conditions.push('tanggal_operasional = ?');
      params.push(filters.tanggal.trim());
    }
    if (filters?.startDate?.trim()) {
      conditions.push('tanggal_operasional >= ?');
      params.push(filters.startDate.trim());
    }
    if (filters?.endDate?.trim()) {
      conditions.push('tanggal_operasional <= ?');
      params.push(filters.endDate.trim());
    }
    if (filters?.search?.trim()) {
      const like = `%${filters.search.trim()}%`;
      conditions.push('(nama_menu LIKE ? OR catatan_gizi LIKE ? OR petugas LIKE ?)');
      params.push(like, like, like);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await activePool.execute<RowDataPacket[]>(
      `SELECT * FROM menu_harian_mysql ${whereClause} ORDER BY tanggal_operasional DESC, created_at DESC`,
      params
    );

    return rows.map((r) => ({
      id: r.id,
      tanggalOperasional: r.tanggal_operasional,
      hari: r.hari || '',
      hariTanggalFormatted: r.hari_tanggal_formatted || '',
      namaMenu: r.nama_menu,
      kategoriPorsi: r.kategori_porsi || 'Porsi Besar & Porsi Kecil',
      energiKkal: Number(r.energi_kkal) || 0,
      proteinGram: Number(r.protein_gram) || 0,
      lemakGram: Number(r.lemak_gram) || 0,
      karbohidratGram: Number(r.karbohidrat_gram) || 0,
      seratGram: Number(r.serat_gram) || 0,
      giziPorsiBesar: safeParseJsonField(r.gizi_porsi_besar, {}),
      giziPorsiKecil: safeParseJsonField(r.gizi_porsi_kecil, {}),
      rincianKomponen: safeParseJsonField(r.rincian_komponen, {}),
      catatanGizi: r.catatan_gizi || '',
      fotoMenuUrl: r.image_url || '',
      image_url: r.image_url || '',
      fotoFileName: r.foto_file_name || '',
      fotoFileSizeKb: Number(r.foto_file_size_kb) || 0,
      petugas: r.petugas || 'Ahli Gizi SPPG',
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at || ''),
      updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at || ''),
    }));
  },

  async upsert(record: Record<string, any>): Promise<boolean> {
    const activePool = getMysqlPool();
    if (!activePool) return false;

    const imageUrl = sanitizeMysqlImageUrl(record.image_url ?? record.fotoMenuUrl);
    await activePool.execute<ResultSetHeader>(
      `INSERT INTO menu_harian_mysql (
        id, tanggal_operasional, hari, hari_tanggal_formatted, nama_menu, kategori_porsi,
        energi_kkal, protein_gram, lemak_gram, karbohidrat_gram, serat_gram,
        gizi_porsi_besar, gizi_porsi_kecil, rincian_komponen, catatan_gizi,
        image_url, foto_file_name, foto_file_size_kb, petugas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        tanggal_operasional = VALUES(tanggal_operasional),
        hari = VALUES(hari),
        hari_tanggal_formatted = VALUES(hari_tanggal_formatted),
        nama_menu = VALUES(nama_menu),
        kategori_porsi = VALUES(kategori_porsi),
        energi_kkal = VALUES(energi_kkal),
        protein_gram = VALUES(protein_gram),
        lemak_gram = VALUES(lemak_gram),
        karbohidrat_gram = VALUES(karbohidrat_gram),
        serat_gram = VALUES(serat_gram),
        gizi_porsi_besar = VALUES(gizi_porsi_besar),
        gizi_porsi_kecil = VALUES(gizi_porsi_kecil),
        rincian_komponen = VALUES(rincian_komponen),
        catatan_gizi = VALUES(catatan_gizi),
        image_url = VALUES(image_url),
        foto_file_name = VALUES(foto_file_name),
        foto_file_size_kb = VALUES(foto_file_size_kb),
        petugas = VALUES(petugas)`,
      [
        String(record.id),
        String(record.tanggalOperasional || record.tanggal_operasional || ''),
        String(record.hari || ''),
        String(record.hariTanggalFormatted || record.hari_tanggal_formatted || ''),
        String(record.namaMenu || record.nama_menu || ''),
        String(record.kategoriPorsi || record.kategori_porsi || 'Porsi Besar & Porsi Kecil'),
        Number(record.energiKkal) || 0,
        Number(record.proteinGram) || 0,
        Number(record.lemakGram) || 0,
        Number(record.karbohidratGram) || 0,
        Number(record.seratGram) || 0,
        JSON.stringify(record.giziPorsiBesar || {}),
        JSON.stringify(record.giziPorsiKecil || {}),
        JSON.stringify(record.rincianKomponen || {}),
        String(record.catatanGizi || ''),
        imageUrl,
        String(record.fotoFileName || ''),
        Number(record.fotoFileSizeKb) || 0,
        String(record.petugas || 'Ahli Gizi SPPG'),
      ]
    );
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const activePool = getMysqlPool();
    if (!activePool) return false;
    const [result] = await activePool.execute<ResultSetHeader>(
      'DELETE FROM menu_harian_mysql WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },
};

// ============================================================================
// 2. SIKLUS MENU MYSQL REPOSITORY
// ============================================================================
export const mysqlSiklusMenu = {
  async list(filters?: { tanggal?: string }) {
    const activePool = getMysqlPool();
    if (!activePool) return null;

    const conditions: string[] = [];
    const params: any[] = [];
    if (filters?.tanggal?.trim()) {
      conditions.push('tanggal = ?');
      params.push(filters.tanggal.trim());
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await activePool.execute<RowDataPacket[]>(
      `SELECT * FROM siklus_menu_mysql ${whereClause} ORDER BY tanggal DESC`,
      params
    );
    return rows.map((r) => ({
      id: r.id,
      tanggal: r.tanggal,
      porsiKecil: safeParseJsonField(r.porsi_kecil, []),
      porsiBesar: safeParseJsonField(r.porsi_besar, []),
      customColumns: safeParseJsonField(r.custom_columns, []),
      isLocked: Boolean(r.is_locked),
      imageUrl: r.image_url || '',
      image_url: r.image_url || '',
      petugas: r.petugas || 'Ahli Gizi SPPG',
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at || ''),
      updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at || ''),
    }));
  },

  async upsert(record: Record<string, any>): Promise<boolean> {
    const activePool = getMysqlPool();
    if (!activePool) return false;

    const imageUrl = sanitizeMysqlImageUrl(record.image_url ?? record.imageUrl ?? record.fotoUrl);
    await activePool.execute<ResultSetHeader>(
      `INSERT INTO siklus_menu_mysql (
        id, tanggal, porsi_kecil, porsi_besar, custom_columns, is_locked, image_url, petugas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        porsi_kecil = VALUES(porsi_kecil),
        porsi_besar = VALUES(porsi_besar),
        custom_columns = VALUES(custom_columns),
        is_locked = VALUES(is_locked),
        image_url = VALUES(image_url),
        petugas = VALUES(petugas)`,
      [
        String(record.id),
        String(record.tanggal),
        JSON.stringify(record.porsiKecil || []),
        JSON.stringify(record.porsiBesar || []),
        JSON.stringify(record.customColumns || []),
        record.isLocked ? 1 : 0,
        imageUrl,
        String(record.petugas || 'Ahli Gizi SPPG'),
      ]
    );
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const activePool = getMysqlPool();
    if (!activePool) return false;
    const [result] = await activePool.execute<ResultSetHeader>(
      'DELETE FROM siklus_menu_mysql WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },
};

// ============================================================================
// 3. LAPORAN DISTRIBUSI MYSQL REPOSITORY
// ============================================================================
export const mysqlLaporanDistribusi = {
  async list(filters?: { tanggal?: string; startDate?: string; endDate?: string; search?: string }) {
    const activePool = getMysqlPool();
    if (!activePool) return null;

    const conditions: string[] = [];
    const params: any[] = [];
    if (filters?.tanggal?.trim()) {
      conditions.push('tanggal = ?');
      params.push(filters.tanggal.trim());
    }
    if (filters?.startDate?.trim()) {
      conditions.push('tanggal >= ?');
      params.push(filters.startDate.trim());
    }
    if (filters?.endDate?.trim()) {
      conditions.push('tanggal <= ?');
      params.push(filters.endDate.trim());
    }
    if (filters?.search?.trim()) {
      const like = `%${filters.search.trim()}%`;
      conditions.push('(nama_instansi LIKE ? OR driver_nama LIKE ? OR catatan LIKE ?)');
      params.push(like, like, like);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await activePool.execute<RowDataPacket[]>(
      `SELECT * FROM laporan_distribusi_mysql ${whereClause} ORDER BY tanggal DESC, created_at DESC`,
      params
    );

    return rows.map((r) => ({
      id: r.id,
      tanggal: r.tanggal,
      driverId: r.driver_id || '',
      driverNama: r.driver_nama,
      driverFoto: r.driver_foto || '',
      driverKendaraan: r.driver_kendaraan || '',
      instansiId: r.instansi_id || '',
      namaInstansi: r.nama_instansi,
      jumlahPenerimaManfaat: Number(r.jumlah_penerima_manfaat) || 0,
      jamPengiriman: r.jam_pengiriman || '',
      jamPenjemputan: r.jam_penjemputan || '',
      dokPengiriman: r.image_url || '',
      dokPenjemputan: r.image_url_penjemputan || '',
      image_url: r.image_url || '',
      catatan: r.catatan || '',
      status: r.status || 'Selesai',
      createdBy: r.created_by || '',
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at || ''),
      updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at || ''),
    }));
  },

  async upsert(record: Record<string, any>): Promise<boolean> {
    const activePool = getMysqlPool();
    if (!activePool) return false;

    const imageUrl = sanitizeMysqlImageUrl(record.image_url ?? record.dokPengiriman);
    const imageUrlPenjemputan = sanitizeMysqlImageUrl(
      record.image_url_penjemputan ?? record.dokPenjemputan
    );
    const driverFotoUrl = sanitizeMysqlImageUrl(record.driverFoto);

    await activePool.execute<ResultSetHeader>(
      `INSERT INTO laporan_distribusi_mysql (
        id, tanggal, driver_id, driver_nama, driver_foto, driver_kendaraan,
        instansi_id, nama_instansi, jumlah_penerima_manfaat, jam_pengiriman,
        jam_penjemputan, image_url, image_url_penjemputan, catatan, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        tanggal = VALUES(tanggal),
        driver_id = VALUES(driver_id),
        driver_nama = VALUES(driver_nama),
        driver_foto = VALUES(driver_foto),
        driver_kendaraan = VALUES(driver_kendaraan),
        instansi_id = VALUES(instansi_id),
        nama_instansi = VALUES(nama_instansi),
        jumlah_penerima_manfaat = VALUES(jumlah_penerima_manfaat),
        jam_pengiriman = VALUES(jam_pengiriman),
        jam_penjemputan = VALUES(jam_penjemputan),
        image_url = VALUES(image_url),
        image_url_penjemputan = VALUES(image_url_penjemputan),
        catatan = VALUES(catatan),
        status = VALUES(status)`,
      [
        String(record.id),
        String(record.tanggal),
        String(record.driverId || ''),
        String(record.driverNama || ''),
        driverFotoUrl,
        String(record.driverKendaraan || ''),
        String(record.instansiId || ''),
        String(record.namaInstansi || ''),
        Number(record.jumlahPenerimaManfaat) || 0,
        String(record.jamPengiriman || ''),
        String(record.jamPenjemputan || ''),
        imageUrl,
        imageUrlPenjemputan,
        String(record.catatan || ''),
        String(record.status || 'Selesai'),
        String(record.createdBy || record.driverNama || 'Petugas Distribusi'),
      ]
    );
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const activePool = getMysqlPool();
    if (!activePool) return false;
    const [result] = await activePool.execute<ResultSetHeader>(
      'DELETE FROM laporan_distribusi_mysql WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },
};

// ============================================================================
// 4. SUHU OMPRENG MYSQL REPOSITORY
// ============================================================================
function sanitizeSesiJsonUrls(sesiObj: any) {
  if (!sesiObj || typeof sesiObj !== 'object') return {};
  const clone = { ...sesiObj };
  for (const key of ['makananPokok', 'proteinHewani', 'proteinNabati', 'sayuran']) {
    if (clone[key] && typeof clone[key] === 'object') {
      clone[key] = {
        ...clone[key],
        fotoUrl: sanitizeMysqlImageUrl(clone[key].fotoUrl),
      };
    }
  }
  return clone;
}

export const mysqlSuhuOmpreng = {
  async list(filters?: { tanggal?: string; jenisPengukuran?: string }) {
    const activePool = getMysqlPool();
    if (!activePool) return null;

    const conditions: string[] = [];
    const params: any[] = [];
    if (filters?.tanggal?.trim()) {
      conditions.push('tanggal = ?');
      params.push(filters.tanggal.trim());
    }
    if (filters?.jenisPengukuran?.trim()) {
      conditions.push('jenis_pengukuran = ?');
      params.push(filters.jenisPengukuran.trim());
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await activePool.execute<RowDataPacket[]>(
      `SELECT * FROM suhu_ompreng_mysql ${whereClause} ORDER BY tanggal DESC, created_at DESC`,
      params
    );

    return rows.map((r) => ({
      id: r.id,
      tanggal: r.tanggal,
      jenisPengukuran: r.jenis_pengukuran || 'Masuk Ompreng',
      sesi: r.sesi || 'Sesi 1',
      petugas: r.petugas || '',
      petugasRole: r.petugas_role || '',
      status: r.status || '',
      catatan: r.catatan || '',
      sesi1: safeParseJsonField(r.sesi1, undefined),
      sesi2: safeParseJsonField(r.sesi2, undefined),
      sesi3: safeParseJsonField(r.sesi3, undefined),
      image_url: r.image_url || '',
      image_url_hewani: r.image_url_hewani || '',
      image_url_nabati: r.image_url_nabati || '',
      image_url_sayuran: r.image_url_sayuran || '',
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at || ''),
      updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at || ''),
    }));
  },

  async upsert(record: Record<string, any>): Promise<boolean> {
    const activePool = getMysqlPool();
    if (!activePool) return false;

    const s1 = sanitizeSesiJsonUrls(record.sesi1);
    const s2 = sanitizeSesiJsonUrls(record.sesi2);
    const s3 = sanitizeSesiJsonUrls(record.sesi3);

    const activeSesi = s3?.makananPokok?.fotoUrl || s3?.proteinHewani?.fotoUrl
      ? s3
      : s2?.makananPokok?.fotoUrl || s2?.proteinHewani?.fotoUrl
        ? s2
        : s1;

    const imgPokok = sanitizeMysqlImageUrl(
      record.image_url ?? activeSesi?.makananPokok?.fotoUrl ?? s1?.makananPokok?.fotoUrl
    );
    const imgHewani = sanitizeMysqlImageUrl(
      record.image_url_hewani ?? activeSesi?.proteinHewani?.fotoUrl ?? s1?.proteinHewani?.fotoUrl
    );
    const imgNabati = sanitizeMysqlImageUrl(
      record.image_url_nabati ?? activeSesi?.proteinNabati?.fotoUrl ?? s1?.proteinNabati?.fotoUrl
    );
    const imgSayuran = sanitizeMysqlImageUrl(
      record.image_url_sayuran ?? activeSesi?.sayuran?.fotoUrl ?? s1?.sayuran?.fotoUrl
    );

    await activePool.execute<ResultSetHeader>(
      `INSERT INTO suhu_ompreng_mysql (
        id, tanggal, jenis_pengukuran, sesi, petugas, petugas_role, status, catatan,
        sesi1, sesi2, sesi3, image_url, image_url_hewani, image_url_nabati, image_url_sayuran
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        sesi = VALUES(sesi),
        petugas = VALUES(petugas),
        petugas_role = VALUES(petugas_role),
        status = VALUES(status),
        catatan = VALUES(catatan),
        sesi1 = VALUES(sesi1),
        sesi2 = VALUES(sesi2),
        sesi3 = VALUES(sesi3),
        image_url = VALUES(image_url),
        image_url_hewani = VALUES(image_url_hewani),
        image_url_nabati = VALUES(image_url_nabati),
        image_url_sayuran = VALUES(image_url_sayuran)`,
      [
        String(record.id),
        String(record.tanggal),
        String(record.jenisPengukuran || 'Masuk Ompreng'),
        String(record.sesi || 'Sesi 1'),
        String(record.petugas || ''),
        String(record.petugasRole || ''),
        String(record.status || ''),
        String(record.catatan || ''),
        JSON.stringify(s1),
        JSON.stringify(s2),
        JSON.stringify(s3),
        imgPokok,
        imgHewani,
        imgNabati,
        imgSayuran,
      ]
    );
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const activePool = getMysqlPool();
    if (!activePool) return false;
    const [result] = await activePool.execute<ResultSetHeader>(
      'DELETE FROM suhu_ompreng_mysql WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },
};

// ============================================================================
// 5. BARANG DATANG / LOGISTIK MYSQL REPOSITORY
// ============================================================================
export const mysqlBarangDatang = {
  async list(filters?: { tanggal?: string; startDate?: string; endDate?: string }) {
    const activePool = getMysqlPool();
    if (!activePool) return null;

    const conditions: string[] = [];
    const params: any[] = [];
    if (filters?.tanggal?.trim()) {
      conditions.push('tanggal = ?');
      params.push(filters.tanggal.trim());
    }
    if (filters?.startDate?.trim()) {
      conditions.push('tanggal >= ?');
      params.push(filters.startDate.trim());
    }
    if (filters?.endDate?.trim()) {
      conditions.push('tanggal <= ?');
      params.push(filters.endDate.trim());
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await activePool.execute<RowDataPacket[]>(
      `SELECT * FROM barang_datang_mysql ${whereClause} ORDER BY tanggal DESC, created_at DESC`,
      params
    );

    return rows.map((r) => ({
      id: r.id,
      tanggal: r.tanggal,
      hari: r.hari || '',
      hariTanggalFormatted: r.hari_tanggal_formatted || '',
      namaBarang: r.nama_barang,
      jumlahMasuk: Number(r.jumlah_masuk) || 0,
      satuan: r.satuan || '',
      jenisBarang: r.jenis_barang || 'Bahan Baku',
      kualitasProduk: r.kualitas_produk || 'Baik',
      dokumentasiUrl: r.image_url || '',
      image_url: r.image_url || '',
      keterangan: r.keterangan || '',
      petugas: r.petugas || 'Petugas Logistik',
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at || ''),
      updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at || ''),
    }));
  },

  async upsert(record: Record<string, any>): Promise<boolean> {
    const activePool = getMysqlPool();
    if (!activePool) return false;

    const imageUrl = sanitizeMysqlImageUrl(record.image_url ?? record.dokumentasiUrl);
    await activePool.execute<ResultSetHeader>(
      `INSERT INTO barang_datang_mysql (
        id, tanggal, hari, hari_tanggal_formatted, nama_barang, jumlah_masuk,
        satuan, jenis_barang, kualitas_produk, image_url, keterangan, petugas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        tanggal = VALUES(tanggal),
        hari = VALUES(hari),
        hari_tanggal_formatted = VALUES(hari_tanggal_formatted),
        nama_barang = VALUES(nama_barang),
        jumlah_masuk = VALUES(jumlah_masuk),
        satuan = VALUES(satuan),
        jenis_barang = VALUES(jenis_barang),
        kualitas_produk = VALUES(kualitas_produk),
        image_url = VALUES(image_url),
        keterangan = VALUES(keterangan),
        petugas = VALUES(petugas)`,
      [
        String(record.id),
        String(record.tanggal),
        String(record.hari || ''),
        String(record.hariTanggalFormatted || ''),
        String(record.namaBarang || ''),
        Number(record.jumlahMasuk) || 0,
        String(record.satuan || ''),
        String(record.jenisBarang || 'Bahan Baku'),
        String(record.kualitasProduk || 'Baik'),
        imageUrl,
        String(record.keterangan || ''),
        String(record.petugas || 'Petugas Logistik'),
      ]
    );
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const activePool = getMysqlPool();
    if (!activePool) return false;
    const [result] = await activePool.execute<ResultSetHeader>(
      'DELETE FROM barang_datang_mysql WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },
};
