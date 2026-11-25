-- ============================================================================
-- TRIAL LAYANAN TERPADU - SUPABASE POSTGRESQL SCHEMA & RLS POLICIES
-- Migrasi penyimpanan data dari Firebase Firestore ke Supabase
-- Jalankan script ini di Supabase Dashboard -> SQL Editor
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Trigger helper untuk memperbarui kolom updated_at secara otomatis
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. TABEL USERS (Pengguna & Hak Akses Portal)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  auth_uid UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  nama TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'Staff',
  divisi TEXT DEFAULT '',
  jabatan TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Aktif',
  foto TEXT DEFAULT '',
  last_login TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT FALSE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON public.users (auth_uid);

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper function aman untuk pengecekan role Admin pada RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_portal_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.auth_uid = auth.uid()
      AND u.status = 'Aktif'
      AND u.role IN ('Admin Penuh', 'Super Admin', 'Admin')
  );
$$;

-- ============================================================================
-- 2. TABEL BARANG (Master Barang & Persediaan Gudang)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.barang (
  id TEXT PRIMARY KEY,
  kode_barang TEXT NOT NULL DEFAULT '',
  nama_barang TEXT NOT NULL DEFAULT '',
  kategori_id TEXT DEFAULT '',
  kategori_nama TEXT DEFAULT '',
  gudang_id TEXT DEFAULT '',
  gudang_nama TEXT DEFAULT '',
  satuan TEXT NOT NULL DEFAULT 'Pcs',
  stok_minimal NUMERIC NOT NULL DEFAULT 0,
  stok_sekarang NUMERIC NOT NULL DEFAULT 0,
  stok_awal NUMERIC NOT NULL DEFAULT 0,
  harga_satuan NUMERIC NOT NULL DEFAULT 0,
  barcode TEXT DEFAULT '',
  qr_code_url TEXT DEFAULT '',
  foto_url TEXT DEFAULT '',
  sumber_supplier TEXT DEFAULT '',
  keterangan TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Aktif',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barang_kode ON public.barang (kode_barang);
CREATE INDEX IF NOT EXISTS idx_barang_nama ON public.barang (nama_barang);

DROP TRIGGER IF EXISTS trg_barang_updated_at ON public.barang;
CREATE TRIGGER trg_barang_updated_at
  BEFORE UPDATE ON public.barang
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. TABEL STOCK_MOVEMENTS (Riwayat Mutasi Barang Masuk/Keluar/Opname)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id TEXT PRIMARY KEY,
  jenis TEXT NOT NULL,
  barang_id TEXT REFERENCES public.barang(id) ON DELETE SET NULL,
  kode_barang TEXT DEFAULT '',
  nama_barang TEXT DEFAULT '',
  satuan TEXT DEFAULT 'Pcs',
  jumlah NUMERIC NOT NULL DEFAULT 0,
  gudang_id TEXT DEFAULT '',
  gudang_nama TEXT DEFAULT '',
  referensi_nota TEXT DEFAULT '',
  keterangan TEXT DEFAULT '',
  tanggal TEXT NOT NULL DEFAULT '',
  petugas TEXT DEFAULT '',
  sumber_supplier TEXT DEFAULT '',
  penerima_tujuan TEXT DEFAULT '',
  harga_satuan NUMERIC DEFAULT 0,
  total_harga NUMERIC DEFAULT 0,
  sisa_stock NUMERIC DEFAULT 0,
  created_by TEXT DEFAULT '',
  updated_by TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_barang_id ON public.stock_movements (barang_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tanggal ON public.stock_movements (tanggal DESC);

DROP TRIGGER IF EXISTS trg_stock_movements_updated_at ON public.stock_movements;
CREATE TRIGGER trg_stock_movements_updated_at
  BEFORE UPDATE ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. TABEL OPNAME_SESSIONS (Sesi Audit & Penyesuaian Stock Opname)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.opname_sessions (
  id TEXT PRIMARY KEY,
  kode_opname TEXT NOT NULL DEFAULT '',
  tanggal TEXT NOT NULL DEFAULT '',
  gudang_id TEXT DEFAULT '',
  gudang_nama TEXT DEFAULT '',
  petugas TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Draft',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  catatan_general TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opname_sessions_tanggal ON public.opname_sessions (tanggal DESC);

DROP TRIGGER IF EXISTS trg_opname_sessions_updated_at ON public.opname_sessions;
CREATE TRIGGER trg_opname_sessions_updated_at
  BEFORE UPDATE ON public.opname_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 5. TABEL MENU_HARIAN (Menu Harian & Informasi Gizi MBG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.menu_harian (
  id TEXT PRIMARY KEY,
  tanggal_operasional TEXT NOT NULL DEFAULT '',
  hari TEXT DEFAULT '',
  hari_tanggal_formatted TEXT DEFAULT '',
  nama_menu TEXT NOT NULL DEFAULT '',
  kategori_porsi TEXT DEFAULT 'Standar / Umum',
  energi_kkal NUMERIC NOT NULL DEFAULT 0,
  protein_gram NUMERIC NOT NULL DEFAULT 0,
  lemak_gram NUMERIC NOT NULL DEFAULT 0,
  karbohidrat_gram NUMERIC NOT NULL DEFAULT 0,
  serat_gram NUMERIC DEFAULT 0,
  gizi_porsi_besar JSONB,
  gizi_porsi_kecil JSONB,
  rincian_komponen JSONB,
  catatan_gizi TEXT DEFAULT '',
  foto_menu_url TEXT DEFAULT '',
  foto_file_name TEXT DEFAULT '',
  foto_file_size_kb NUMERIC DEFAULT 0,
  petugas TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_harian_tanggal ON public.menu_harian (tanggal_operasional DESC);

DROP TRIGGER IF EXISTS trg_menu_harian_updated_at ON public.menu_harian;
CREATE TRIGGER trg_menu_harian_updated_at
  BEFORE UPDATE ON public.menu_harian
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 6. TABEL SUHU_PENGOLAHAN_V2 (Monitoring Suhu Pengolahan Makanan)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.suhu_pengolahan_v2 (
  id TEXT PRIMARY KEY,
  tanggal TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Sesuai Standar',
  petugas TEXT DEFAULT '',
  petugas_role TEXT DEFAULT '',
  sesi1 JSONB NOT NULL DEFAULT '{}'::jsonb,
  sesi2 JSONB NOT NULL DEFAULT '{}'::jsonb,
  sesi3 JSONB NOT NULL DEFAULT '{}'::jsonb,
  catatan TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suhu_pengolahan_tanggal ON public.suhu_pengolahan_v2 (tanggal DESC);

DROP TRIGGER IF EXISTS trg_suhu_pengolahan_updated_at ON public.suhu_pengolahan_v2;
CREATE TRIGGER trg_suhu_pengolahan_updated_at
  BEFORE UPDATE ON public.suhu_pengolahan_v2
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 7. TABEL SUHU_MASUK_OMPRENG_V2 (Monitoring Suhu Masuk Ompreng)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.suhu_masuk_ompreng_v2 (
  id TEXT PRIMARY KEY,
  tanggal TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Sesuai Standar (≥ 60°C)',
  petugas TEXT DEFAULT '',
  petugas_role TEXT DEFAULT '',
  sesi1 JSONB NOT NULL DEFAULT '{}'::jsonb,
  sesi2 JSONB NOT NULL DEFAULT '{}'::jsonb,
  sesi3 JSONB NOT NULL DEFAULT '{}'::jsonb,
  catatan TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suhu_ompreng_tanggal ON public.suhu_masuk_ompreng_v2 (tanggal DESC);

DROP TRIGGER IF EXISTS trg_suhu_ompreng_updated_at ON public.suhu_masuk_ompreng_v2;
CREATE TRIGGER trg_suhu_ompreng_updated_at
  BEFORE UPDATE ON public.suhu_masuk_ompreng_v2
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 8. TABEL ORGANOLEPTIK_V1 (Checklist Uji Organoleptik Makanan)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.organoleptik_v1 (
  id TEXT PRIMARY KEY,
  nama_pemeriksa TEXT DEFAULT '',
  tempat_pemeriksaan TEXT NOT NULL DEFAULT 'SPPG',
  nama_tempat_pemeriksa TEXT DEFAULT '',
  tanggal_pemeriksaan TEXT NOT NULL DEFAULT '',
  waktu_pemeriksaan TEXT DEFAULT '',
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  kesimpulan TEXT NOT NULL DEFAULT 'Aman dikonsumsi',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organoleptik_tanggal ON public.organoleptik_v1 (tanggal_pemeriksaan DESC);

DROP TRIGGER IF EXISTS trg_organoleptik_updated_at ON public.organoleptik_v1;
CREATE TRIGGER trg_organoleptik_updated_at
  BEFORE UPDATE ON public.organoleptik_v1
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 9. TABEL APP_STATE_SYNC (Sinkronisasi State Modul Aplikasi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.app_state_sync (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_by TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_state_sync_key ON public.app_state_sync (key);

DROP TRIGGER IF EXISTS trg_app_state_sync_updated_at ON public.app_state_sync;
CREATE TRIGGER trg_app_state_sync_updated_at
  BEFORE UPDATE ON public.app_state_sync
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 10. TABEL PORTAL_COLLECTIONS (Koleksi Operasional & Master Data Tambahan)
-- Menampung koleksi dinamis: master_menus, siklus_menu, akuntan_*, petugasList,
-- slipGajiList, beneficiaryGroups, beneficiaryLocations, documentTemplate, dll.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.portal_collections (
  collection_name TEXT NOT NULL,
  id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_name, id)
);

CREATE INDEX IF NOT EXISTS idx_portal_collections_name ON public.portal_collections (collection_name);

DROP TRIGGER IF EXISTS trg_portal_collections_updated_at ON public.portal_collections;
CREATE TRIGGER trg_portal_collections_updated_at
  BEFORE UPDATE ON public.portal_collections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opname_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_harian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suhu_pengolahan_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suhu_masuk_ompreng_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organoleptik_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_collections ENABLE ROW LEVEL SECURITY;

-- USERS: Hanya pengguna terautentikasi yang dapat melihat direktori pengguna;
-- pengguna dapat mengubah profilnya sendiri, sedangkan Admin Penuh dapat mengelola seluruh akun.
DROP POLICY IF EXISTS "users_authenticated_select" ON public.users;
CREATE POLICY "users_authenticated_select"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "users_self_or_admin_insert" ON public.users;
CREATE POLICY "users_self_or_admin_insert"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_uid OR public.is_portal_admin());

DROP POLICY IF EXISTS "users_self_or_admin_update" ON public.users;
CREATE POLICY "users_self_or_admin_update"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_uid OR public.is_portal_admin())
  WITH CHECK (auth.uid() = auth_uid OR public.is_portal_admin());

DROP POLICY IF EXISTS "users_admin_delete" ON public.users;
CREATE POLICY "users_admin_delete"
  ON public.users FOR DELETE
  TO authenticated
  USING (public.is_portal_admin());

-- BARANG
DROP POLICY IF EXISTS "barang_authenticated_select" ON public.barang;
CREATE POLICY "barang_authenticated_select"
  ON public.barang FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "barang_authenticated_write" ON public.barang;
CREATE POLICY "barang_authenticated_write"
  ON public.barang FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- STOCK MOVEMENTS
DROP POLICY IF EXISTS "stock_movements_authenticated_all" ON public.stock_movements;
CREATE POLICY "stock_movements_authenticated_all"
  ON public.stock_movements FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- OPNAME SESSIONS
DROP POLICY IF EXISTS "opname_sessions_authenticated_all" ON public.opname_sessions;
CREATE POLICY "opname_sessions_authenticated_all"
  ON public.opname_sessions FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- MENU HARIAN (pengunjung portal dapat melihat menu harian, pengguna terautentikasi dapat mengelola)
DROP POLICY IF EXISTS "menu_harian_public_read" ON public.menu_harian;
CREATE POLICY "menu_harian_public_read"
  ON public.menu_harian FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "menu_harian_authenticated_write" ON public.menu_harian;
CREATE POLICY "menu_harian_authenticated_write"
  ON public.menu_harian FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- SUHU PENGOLAHAN V2
DROP POLICY IF EXISTS "suhu_pengolahan_authenticated_all" ON public.suhu_pengolahan_v2;
CREATE POLICY "suhu_pengolahan_authenticated_all"
  ON public.suhu_pengolahan_v2 FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- SUHU MASUK OMPRENG V2
DROP POLICY IF EXISTS "suhu_ompreng_authenticated_all" ON public.suhu_masuk_ompreng_v2;
CREATE POLICY "suhu_ompreng_authenticated_all"
  ON public.suhu_masuk_ompreng_v2 FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ORGANOLEPTIK V1
DROP POLICY IF EXISTS "organoleptik_authenticated_all" ON public.organoleptik_v1;
CREATE POLICY "organoleptik_authenticated_all"
  ON public.organoleptik_v1 FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- APP STATE SYNC
DROP POLICY IF EXISTS "app_state_sync_authenticated_all" ON public.app_state_sync;
CREATE POLICY "app_state_sync_authenticated_all"
  ON public.app_state_sync FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- PORTAL COLLECTIONS
DROP POLICY IF EXISTS "portal_collections_authenticated_all" ON public.portal_collections;
CREATE POLICY "portal_collections_authenticated_all"
  ON public.portal_collections FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- SUPABASE REALTIME PUBLICATION
-- Mengaktifkan sinkronisasi perubahan data secara real-time ke client
-- ============================================================================
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'users',
    'barang',
    'stock_movements',
    'opname_sessions',
    'menu_harian',
    'suhu_pengolahan_v2',
    'suhu_masuk_ompreng_v2',
    'organoleptik_v1',
    'app_state_sync',
    'portal_collections'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_object THEN NULL;
    END;
  END LOOP;
END;
$$;
