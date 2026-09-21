import { relations } from 'drizzle-orm';
import { pgTable, serial, text, integer, timestamp, varchar, boolean, doublePrecision } from 'drizzle-orm/pg-core';

// 1. Users Table (Linked to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(), // Firebase Auth UID
  nama: text('nama').notNull(),
  username: text('username').notNull().unique(),
  email: text('email').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('Staff'),
  divisi: text('divisi').default('Sekretariat / Tata Usaha'),
  jabatan: text('jabatan').default('Staf Operasional'),
  status: varchar('status', { length: 20 }).default('Aktif'),
  password: text('password'),
  foto: text('foto'),
  createdAt: timestamp('created_at').defaultNow()
});

// 2. Master Pegawai Table
export const pegawai = pgTable('pegawai', {
  id: serial('id').primaryKey(),
  nip: varchar('nip', { length: 50 }).notNull().unique(),
  nama: text('nama').notNull(),
  email: text('email').notNull(),
  telepon: varchar('telepon', { length: 30 }),
  divisiNama: text('divisi_nama'),
  jabatanNama: text('jabatan_nama'),
  status: varchar('status', { length: 20 }).default('Aktif'),
  createdAt: timestamp('created_at').defaultNow()
});

// 3. Master Divisi Table
export const divisi = pgTable('divisi', {
  id: serial('id').primaryKey(),
  kode: varchar('kode', { length: 20 }).notNull().unique(),
  nama: text('nama').notNull(),
  kepalaDivisi: text('kepala_divisi'),
  keterangan: text('keterangan'),
  createdAt: timestamp('created_at').defaultNow()
});

// 4. Master Gudang Table
export const gudang = pgTable('gudang', {
  id: serial('id').primaryKey(),
  kode: varchar('kode', { length: 20 }).notNull().unique(),
  nama: text('nama').notNull(),
  lokasi: text('lokasi'),
  penanggungJawab: text('penanggung_jawab'),
  createdAt: timestamp('created_at').defaultNow()
});

// 5. Master Kategori Table
export const kategori = pgTable('kategori', {
  id: serial('id').primaryKey(),
  kode: varchar('kode', { length: 20 }).notNull().unique(),
  nama: text('nama').notNull(),
  deskripsi: text('deskripsi'),
  createdAt: timestamp('created_at').defaultNow()
});

// 6. Master Instansi Mitra Table
export const instansi = pgTable('instansi', {
  id: serial('id').primaryKey(),
  kode: varchar('kode', { length: 20 }).notNull().unique(),
  nama: text('nama').notNull(),
  alamat: text('alamat'),
  telepon: varchar('telepon', { length: 30 }),
  email: text('email'),
  kontakPerson: text('kontak_person'),
  createdAt: timestamp('created_at').defaultNow()
});

// 7. Master Kendaraan Table
export const kendaraan = pgTable('kendaraan', {
  id: serial('id').primaryKey(),
  platNomor: varchar('plat_nomor', { length: 30 }).notNull().unique(),
  namaKendaraan: text('nama_kendaraan').notNull(),
  jenisKendaraan: varchar('jenis_kendaraan', { length: 50 }).notNull(),
  pengemudiDefault: text('pengemudi_default'),
  divisiNama: text('divisi_nama'),
  status: varchar('status', { length: 20 }).default('Aktif'),
  createdAt: timestamp('created_at').defaultNow()
});

// 8. Laporan BBM Table
export const laporanBbm = pgTable('laporan_bbm', {
  id: serial('id').primaryKey(),
  tanggal: timestamp('tanggal').defaultNow(),
  platNomor: varchar('plat_nomor', { length: 30 }).notNull(),
  kendaraanNama: text('kendaraan_nama').notNull(),
  pengemudiNama: text('pengemudi_nama').notNull(),
  jenisBbm: varchar('jenis_bbm', { length: 50 }).notNull(),
  liter: doublePrecision('liter').notNull(),
  biaya: doublePrecision('biaya').notNull(),
  odometerAwal: integer('odometer_awal').default(0),
  odometerAkhir: integer('odometer_akhir').default(0),
  spbu: text('spbu'),
  buktiFoto: text('bukti_foto'),
  catatan: text('catatan'),
  statusApprove: varchar('status_approve', { length: 30 }).default('Approved'),
  createdAt: timestamp('created_at').defaultNow()
});

// 9. Activity Logs Table
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow(),
  userNama: text('user_nama').notNull(),
  userRole: text('user_role').notNull(),
  modul: text('modul').notNull(),
  aksi: text('aksi').notNull(),
  detail: text('detail'),
  ipAddress: varchar('ip_address', { length: 50 })
});
