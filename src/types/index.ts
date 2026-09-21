/**
 * Portal Administrasi Terpadu - Enterprise Domain Types
 */

export type UserRole = 
  | 'Admin Penuh'
  | 'Staff Kantor'
  | 'Distribusi'
  | 'Super Admin'
  | 'Admin'
  | 'Operator'
  | 'Supervisor'
  | 'Manager'
  | 'Staff'
  | 'Viewer';

export interface User {
  id: string;
  nama: string;
  username: string;
  email: string;
  role: UserRole;
  divisi: string;
  jabatan: string;
  status: 'Aktif' | 'Nonaktif';
  password?: string;
  foto?: string;
  lastLogin?: string;
  createdAt: string;
  emailVerified?: boolean;
}

export interface RolePermission {
  role: UserRole;
  description: string;
  modulesAccess: {
    dashboard: boolean;
    esurat: boolean;
    stockOpname: boolean;
    bbm: boolean;
    masterData: boolean;
    userManagement: boolean;
    dynamicMenu: boolean;
    activityLogs: boolean;
    settings: boolean;
    apiDocs: boolean;
  };
  actions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canApprove: boolean;
    canExport: boolean;
  };
}

export interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: string; // Lucide icon identifier
  color?: string; // CSS color or Tailwind class
  order: number;
  targetModule: 'portal' | 'esurat' | 'stock' | 'po' | 'barangDatang' | 'external';
  requiredRole?: UserRole[];
  parentId?: string;
  isActive: boolean;
}

export interface MasterPegawai {
  id: string;
  nip: string;
  nama: string;
  email: string;
  telepon: string;
  divisiId: string;
  divisiNama: string;
  jabatanId: string;
  jabatanNama: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface MasterDivisi {
  id: string;
  kode: string;
  nama: string;
  kepalaDivisi?: string;
  keterangan?: string;
}

export interface MasterJabatan {
  id: string;
  kode: string;
  nama: string;
  level: number;
}

export interface MasterGudang {
  id: string;
  kode: string;
  nama: string;
  lokasi: string;
  penanggungJawab: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface MasterKategori {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string;
}

export interface MasterInstansi {
  id: string;
  kode: string;
  nama: string;
  alamat: string;
  telepon: string;
  email: string;
  kontakPerson: string;
}

// --- e-Surat Digital Domain ---
export interface SuratMasuk {
  id: string;
  nomorSurat: string;
  nomorAgenda: string;
  pengirim: string;
  perihal: string;
  tanggalSurat: string;
  tanggalTerima: string;
  sifat: 'Biasa' | 'Penting' | 'Rahasia' | 'Sangat Rahasia';
  status: 'Baru' | 'Proses Disposisi' | 'Selesai' | 'Diarsipkan';
  fileUrl?: string;
  qrCodeUrl?: string;
  ringkasan?: string;
}

export interface SuratKeluar {
  id: string;
  nomorSurat: string;
  tujuan: string;
  perihal: string;
  tanggalSurat: string;
  pembuat: string;
  statusApproval: 'Draft' | 'Menunggu Approval' | 'Disetujui' | 'Ditolak';
  approver?: string;
  templateId?: string;
  qrCodeUrl?: string;
  fileUrl?: string;
}

export interface Disposisi {
  id: string;
  suratMasukId: string;
  nomorSurat: string;
  pengirimDisposisi: string;
  penerimaDisposisi: string; // Divisi or Pegawai
  instruksi: string;
  sifat: 'Biasa' | 'Penting' | 'Segera';
  batasWaktu: string;
  status: 'Pending' | 'Dalam Proses' | 'Selesai';
  catatanPenerima?: string;
  tanggalDisposisi: string;
}

export interface TemplateSurat {
  id: string;
  nama: string;
  kategori: string;
  formatNomor: string;
  isiHeader: string;
  isiBody: string;
  isiFooter: string;
}

// --- Stock Opname Domain ---
export interface MasterBarang {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kategoriId: string;
  kategoriNama: string;
  gudangId: string;
  gudangNama: string;
  satuan: string;
  stokMinimal: number;
  stokSekarang: number;
  stokAwal?: number;
  hargaSatuan: number;
  barcode: string;
  qrCodeUrl?: string;
  fotoUrl?: string;
  sumberSupplier?: string;
  keterangan?: string;
  updatedAt?: string;
}

export interface StockMovement {
  id: string;
  jenis: 'Masuk' | 'Keluar' | 'Stock Awal' | 'Penyesuaian Opname';
  barangId: string;
  kodeBarang: string;
  namaBarang: string;
  satuan?: string;
  jumlah: number;
  gudangId: string;
  gudangNama: string;
  referensiNota: string;
  keterangan: string;
  tanggal: string;
  petugas: string;
  sumberSupplier?: string;
  penerimaTujuan?: string;
  hargaSatuan?: number;
  totalHarga?: number;
  sisaStock?: number;
}

export interface StockOpnameSession {
  id: string;
  kodeOpname: string;
  tanggal: string;
  gudangId: string;
  gudangNama: string;
  petugas: string;
  status: 'Draft' | 'Sedang Berjalan' | 'Selesai' | 'Dibatalkan';
  items: {
    barangId: string;
    kodeBarang: string;
    namaBarang: string;
    stokSistem: number;
    stokFisik: number;
    selisih: number;
    catatan: string;
  }[];
  catatanGeneral?: string;
}

export interface StockSummaryMetrics {
  totalBarang: number;
  totalStokPcs: number;
  totalNilaiPersediaan: number;
  masukHariIni: number;
  keluarHariIni: number;
  stokRendahCount: number;
  opnameTerakhir?: string;
}

// --- Central Features ---
export interface NotificationItem {
  id: string;
  modul: 'e-Surat' | 'Stock Opname' | 'System' | 'Master Data' | 'Tugas Divisi' | 'Penerima Manfaat' | 'Perencanaan Bahan';
  judul: string;
  pesan: string;
  tipe: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: string;
  linkUrl?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  namaUser: string;
  modul: string;
  aktivitas: string;
  detail?: string;
  tanggal: string;
  jam: string;
  browser: string;
  ipAddress: string;
  status: 'Sukses' | 'Gagal';
}

export interface PortalSettings {
  namaPortal: string;
  deskripsi: string;
  logoUrl: string;
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
  rateLimitPerMin: number;
}

export type JenisBbm = 
  | 'Pertalite'
  | 'Pertamax'
  | 'Pertamax Turbo'
  | 'Solar'
  | 'Dexlite'
  | 'Pertamina Dex';

export interface MasterKendaraan {
  id: string;
  namaKendaraan: string;
  platNomor: string;
  jenisKendaraan: 'Mobil Operasional' | 'Mobil Box' | 'Motor' | 'Ambulance' | 'Bus' | 'Truk';
  standarKmLiter: number;
  status: 'Aktif' | 'Perbaikan' | 'Nonaktif';
}

export interface LaporanBbm {
  id: string;
  tanggalPembelian: string; // YYYY-MM-DD
  kendaraanId: string;
  kendaraanNama: string;
  platNomor: string;
  jenisBbm: JenisBbm;
  kmAwal: number;
  kmAkhir: number;
  jarakTempuh: number; // kmAkhir - kmAwal
  hargaBbm: number; // in Rupiah
  jumlahLiter: number; // Decimal (e.g. 8.53)
  kmLiterAktual: number; // jarakTempuh / jumlahLiter (2 decimals)
  standarKmLiter: number;
  statusPemakaian: 'Normal' | 'Tidak Normal';
  uploadStruk?: string; // image base64 or URL
  statusStruk: 'Ter-upload' | 'Belum Upload';
  keterangan: 'Pemakaian Wajar' | 'Boros';
  userInput: string;
  timestamp: string; // ISO DateTime
}

export interface BbmDashboardSummary {
  totalPengeluaranBulanIni: number;
  totalLiterBulanIni: number;
  totalJarakTempuhBulanIni: number;
  rataRataKmLiter: number;
  totalTransaksi: number;
  pengeluaranPerBulan: { bulan: string; totalRupiah: number; totalLiter: number }[];
  efisiensiPerKendaraan: { kendaraan: string; platNomor: string; kmLiterAktual: number; standarKmLiter: number; status: string }[];
  kendaraanTerboros: { kendaraan: string; platNomor: string; totalBorosCount: number; avgKmLiter: number; totalRupiah: number }[];
}

export interface GlobalSearchResult {
  id: string;
  type: 'Surat Masuk' | 'Surat Keluar' | 'Barang' | 'Pegawai' | 'Dokumen';
  modul: 'e-Surat' | 'Stock Opname' | 'Master Data';
  title: string;
  subtitle: string;
  badge: string;
  targetView: string;
}

// --- TUGAS DIVISI (DIVISION TASKS) INTERFACES ---
export type DivisiId = 'persiapan' | 'pengolahan' | 'pemorsian' | 'distribusi' | 'cuci_ompreng';

export interface TugasChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  jamMulai?: string; // HH:mm
  jamSelesai?: string; // HH:mm
  namaPetugas?: string;
  catatan?: string;
  foto?: string; // Base64 or image URL
  status: 'Belum Dikerjakan' | 'Sedang Dikerjakan' | 'Selesai';
}

export interface DivisiTaskRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  divisiId: DivisiId;
  divisiNama: string;
  penanggungJawab: string;
  shift: string; // e.g. 'Shift 1 (Pagi)', 'Shift 2 (Siang)', 'Shift 3 (Malam)'
  statusProduksi: 'Dalam Persiapan' | 'Proses Memasak' | 'Proses Pemorsian' | 'Pengiriman' | 'Selesai';
  jumlahProduksi: number; // e.g. 2500 porsi
  keterangan: string;
  menuHarian?: string;
  checklists: TugasChecklistItem[];
  catatanUmum?: string;
  updatedAt: string;
  createdBy: string;
}

export interface WhatsAppDivisiSetting {
  divisiId: DivisiId;
  divisiNama: string;
  nomorWa: string; // e.g. '6281234567890'
  namaKontak: string;
}

export interface TaskTemplate {
  id: string;
  divisiId: DivisiId;
  divisiNama: string;
  judulTemplate: string;
  checklists: string[];
}

// ==========================================
// PENERIMA MANFAAT (BENEFICIARY MODULE) TYPES
// ==========================================

export type KlasifikasiPorsi = 'Porsi Besar' | 'Porsi Kecil' | 'Porsi Balita' | 'Porsi Ibu Hamil' | 'Porsi Ibu Menyusui' | 'Balita' | 'Bumil & Busui';

export interface BeneficiaryGroup {
  id: string;
  nama: string; // PAUD/TK, SD, SMP, SMA/MA, Ibu Hamil, Ibu Menyusui, Balita, Guru/Staf
  kategoriUtama: 'Siswa' | 'Balita' | 'Ibu Hamil' | 'Ibu Menyusui' | 'Guru / Staf' | 'Lainnya';
  klasifikasiPorsi?: KlasifikasiPorsi;
  deskripsi?: string;
  urutan: number;
  status: 'Aktif' | 'Nonaktif';
  lembagaList?: Array<{
    id?: string;
    namaInstansi: string;
    targetSiswa: number;
    targetGuru: number;
    targetBalita?: number;
    targetBumilBusui?: number;
    total: number;
    klasifikasiPorsi: KlasifikasiPorsi;
  }>;
}

export interface BeneficiaryLocation {
  id: string;
  groupId: string;
  groupNama: string;
  namaInstansi: string; // e.g. SD Zainul Hasan Genggong, MA Model Hafshawaty
  alamat?: string;
  kontak?: string;
  klasifikasiPorsi?: KlasifikasiPorsi;
  kategoriBreakdown?: {
    siswa?: number;
    guru?: number;
    balita?: number;
    ibuHamil?: number;
    ibuMenyusui?: number;
    staf?: number;
  };
  defaultJumlah: number;
  status: 'Aktif' | 'Nonaktif';
}

export interface DailyBeneficiaryRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  groupId: string;
  groupNama: string;
  locationId: string;
  namaInstansi: string;
  kategori: 'Siswa' | 'Balita' | 'Ibu Hamil' | 'Ibu Menyusui' | 'Guru / Staf' | 'Lainnya';
  jumlahAwal: number;
  penambahan: number;
  pengurangan: number;
  totalPenerima: number; // jumlahAwal + penambahan - pengurangan
  keterangan?: string;
  status: 'DRAFT' | 'FINAL';
  finalizedBy?: string;
  finalizedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface BeneficiaryAuditLog {
  id: string;
  recordId: string;
  namaInstansi: string;
  tanggal: string;
  jam: string;
  user: string;
  dataSebelum: number;
  dataSesudah: number;
  selisih: number;
  keterangan: string;
}

export interface DailyBeneficiarySummary {
  tanggal: string;
  totalPenerima: number;
  totalPorsi: number;
  totalKelompok: number;
  totalInstansi: number;
  totalBalita: number;
  totalIbuHamil: number;
  totalIbuMenyusui: number;
  totalSiswa: number;
  totalGuru: number;
  portionBreakdown?: {
    porsiBesar: number;
    porsiKecil: number;
    porsiBalita?: number;
    porsiIbuHamil?: number;
    porsiIbuMenyusui?: number;
    balita?: number;
    bumilBusui?: number;
  };
  statusLock: 'DRAFT' | 'FINAL';
  finalizedBy?: string;
  finalizedAt?: string;
}

// =========================================================
// PERENCANAAN KEBUTUHAN BAHAN PANGAN (NUTRITION PLANNING) TYPES
// =========================================================

export interface MasterBahanPangan {
  id: string;
  namaBahan: string;
  kategori: string;
  satuanPembelian: string;
  satuanPerhitungan: string;
  bddDefault: number;
  hargaDasarPerKg: number;
  supplier?: string;
  lokasi?: string;
  keterangan?: string;
  statusAktif: 'Aktif' | 'Nonaktif';
  faktorKonversi?: string;
  updatedAt?: string;
}

export interface IngredientRecipeItem {
  ingredientId: string;
  ingredientName: string;
  netWeightGram: number;
  bddPercent: number;
}

export interface MasterMenuResep {
  id: string;
  namaMenu: string;
  kategoriMenu: string;
  deskripsi?: string;
  bahanResep: IngredientRecipeItem[];
  updatedAt?: string;
}

export type NutritionPlanStatus = 'Draft' | 'Dalam Perhitungan' | 'Final' | 'Disetujui' | 'Selesai' | 'Revisi';

export interface NutritionPlanRevisionRecord {
  version: number;
  reason: string;
  revisedBy: string;
  revisedAt: string;
  snapshotMenuName?: string;
  snapshotTotalCost?: number;
  snapshotTotalWeightKg?: number;
}

export interface NutritionPlan {
  id: string;
  tanggalPerencanaan: string;
  tanggalPelaksanaan: string;
  menuId?: string;
  menuName: string;
  targetGroup: string;
  targetCount: number;
  periode: 'Harian' | 'Mingguan' | 'Bulanan';
  keterangan?: string;
  nutritionistId: string;
  nutritionistName: string;
  kepalaSppgName?: string;
  status: NutritionPlanStatus;
  totalCost: number;
  totalWeightKg: number;
  ingredientsData?: any[];
  targetCountsConfig?: {
    porsiKecil: number;
    porsiBesar: number;
    balita: number;
    bumilBusui: number;
  };
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  finalizedBy?: string;
  revisionReason?: string;
  revisionCount?: number;
  revisionRequestedAt?: string;
  revisionRequestedBy?: string;
  revisionHistory?: NutritionPlanRevisionRecord[];
}

export interface NutritionPlanItem {
  id: string;
  planId: string;
  menuName: string;
  ingredientId: string;
  ingredientName: string;
  targetGroup: string;
  netWeightGram: number;
  bddPercent: number;
  grossWeightGram: number;
  targetCount: number;
  requiredKg: number;
  pricePerKg: number;
  totalPrice: number;
  stockAvailable: number;
  shortageKg: number;
  status: 'CUKUP' | 'PERLU PENGADAAN' | 'HARGA BELUM ADA' | 'DATA BELUM LENGKAP';
  notes?: string;
}

export interface NutritionPlanRekapItem {
  ingredientId: string;
  ingredientName: string;
  category: string;
  unit: string;
  totalNetWeightGram: number;
  totalGrossWeightGram: number;
  totalRequiredKg: number;
  bufferPercent?: number;
  bufferKg?: number;
  totalWithBufferKg?: number;
  pembulatan?: number | string;
  satuanBeli?: string;
  pricePerKg: number;
  totalPrice: number;
  stockAvailable: number;
  shortageKg: number;
  status: 'CUKUP' | 'PERLU PENGADAAN' | 'HARGA BELUM ADA' | 'DATA BELUM LENGKAP';
  menusInvolved: string[];
}

export interface MultiGroupRow {
  no: number;
  ingredientId: string;
  ingredientName: string;
  satuan: string;
  pembulatan: string | number;
  porsiKecil: {
    netWeightGram: number;
    bddPercent: number;
    grossWeightGram: number;
    requiredKg: number;
  };
  porsiBesar: {
    netWeightGram: number;
    bddPercent: number;
    grossWeightGram: number;
    requiredKg: number;
  };
  balita: {
    netWeightGram: number;
    bddPercent: number;
    grossWeightGram: number;
    requiredKg: number;
  };
  bumilBusui: {
    netWeightGram: number;
    bddPercent: number;
    grossWeightGram: number;
    requiredKg: number;
  };
  totalKebutuhanKg: number;
  buffer5PercentKg: number;
  totalPlusBufferKg: number;
}

// =========================================================
// RENCANA ANGGARAN BIAYA & BELANJA (RAB) TYPES
// =========================================================

export interface RABTarifConfig {
  porsiKecil: number;  // Standard default: Rp 10.000
  porsiBesar: number;  // Standard default: Rp 15.000
  balita: number;      // Standard default: Rp 8.500
  bumilBusui: number;  // Standard default: Rp 12.500
}

export interface RABKomposisiConfig {
  bahanPanganPersen: number;        // Default: 100% (Penyerapan Pagu Belanja Bahan Baku 100%)
  operasionalPersen?: number;       // Default: 0% / Terpisah
  kemasanDistribusiPersen?: number; // Dihapus (0%)
}

export interface RABItemBahan {
  no: number;
  namaBahan: string;
  kategori: string;
  kebutuhanKg: number;
  satuan: string;
  hargaSatuan: number;
  subtotal: number;
  sumberHarga?: string;
  bobotPersen?: number;
}

export interface RABBiayaItem {
  id: string;
  namaItem: string;
  kategori: 'OPERASIONAL' | 'KEMASAN' | 'DISTRIBUSI_BBM' | 'LAINNYA';
  volume: number;
  satuan: string;
  hargaSatuan: number;
  subtotal: number;
  keterangan?: string;
}

export interface RABAnalisisKelayakan {
  totalPaguAnggaran: number;
  targetPlafondBahan?: number; // Diselaraskan 100% Pagu (Target Penyerapan Penuh)
  targetPenyerapanPagu: number; // 100% Pagu
  totalRealisasiBahan: number;
  selisihPlafondBahan?: number; // Selisih Pagu Anggaran
  sisaAnggaranPagu: number;     // totalPaguAnggaran - totalRealisasiBahan
  persentaseFoodCost: number;   // Persentase serapan belanja bahan dari pagu (Target 100%)
  persentaseSerapanPagu: number;// (totalRealisasiBahan / totalPaguAnggaran) * 100
  biayaPerPorsiRataRata: number;
  statusKelayakan: 'HEMAT_EFISIEN' | 'OPTIMAL_SESUAI_PAGU' | 'PERINGATAN_OVER_BUDGET';
  keteranganStatus: string;
  topCostDrivers: {
    namaBahan: string;
    subtotal: number;
    persen: number;
  }[];
}

export interface RABPlan {
  id: string;
  tanggalPelaksanaan: string;
  namaMenu: string;
  status: 'Draft' | 'Diajukan' | 'Disetujui' | 'Final';
  targetCounts: {
    porsiKecil: number;
    porsiBesar: number;
    balita: number;
    bumilBusui: number;
    total: number;
  };
  tarifConfig: RABTarifConfig;
  komposisiConfig: RABKomposisiConfig;
  totalPaguAnggaran: number;
  itemsBahanBaku: RABItemBahan[];
  totalBiayaBahanBaku: number;
  biayaOperasionalItems: RABBiayaItem[];
  totalBiayaOperasional: number;
  biayaKemasanDistribusiItems?: RABBiayaItem[];
  totalBiayaKemasanDistribusi?: number;
  cadanganTakTerduga: number;
  grandTotalRAB: number;
  analisis: RABAnalisisKelayakan;
  catatan?: string;
  penanggungJawab: {
    nutritionistName: string;
    kepalaSppgName: string;
    bendaharaName?: string;
  };
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface POItem {
  no: number;
  details: string;
  qty: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  category?: 'Bahan Baku' | 'Operasional';
}

export interface POSupplier {
  name: string;
  address: string;
  contact: string;
}

export interface POShipTo {
  name: string;
  address: string;
  contact: string;
}

export interface POSendLog {
  sentAt: string;
  sentTo: string;
  method: 'WhatsApp' | 'Email' | 'Portal' | 'Manual';
  status: 'Terkirim' | 'Gagal';
  notes?: string;
}

export interface POSupplierConfirmation {
  isConfirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  notes?: string;
}

export interface POAdminConfirmation {
  isConfirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  notes?: string;
}

export interface POSupplierShoppingStatus {
  isAccepted?: boolean;
  acceptedAt?: string;
  acceptedBy?: string;
  isShopping?: boolean;
  shoppingStartedAt?: string;
  isDispatched?: boolean;
  dispatchedAt?: string;
  driverName?: string;
  driverPhone?: string;
  driverPlate?: string;
  checkedItemIndexes?: number[];
  notes?: string;
}

export interface PurchaseOrderDocument {
  id: string;
  poNumber: string;
  poType: 'Bahan Baku' | 'Operasional' | 'Combined';
  periodeBatchId?: string;
  dayIndex?: number; // 1, 2, 3, 4, 5
  dayLabel?: string; // e.g. "Hari 1 dari 5 (Senin, 02 Sep 2026)"
  periodeStartDate: string;
  periodeEndDate: string;
  periodeDates: string[];
  date: string;
  orderDate?: string; // Tanggal Pemesanan (mengikuti menu harian)
  targetArrivalDate?: string; // Tanggal Target Tiba / Kedatangan Barang (H-1 sebelum tanggal menu)
  estimatedArrival: string;
  porsiBesar: number;
  porsiKecil: number;
  totalPorsi: number;
  menuSummary: string;
  supplier: POSupplier;
  shipTo: POShipTo;
  pemesan: string;
  approvedBy: string;
  approvedTitle: string;
  items: POItem[];
  totalAmount: number;
  additionalNotes?: string;
  status: 'Draft' | 'Diterbitkan' | 'Disetujui' | 'Dikonfirmasi Admin' | 'Terkirim WA' | 'Dikonfirmasi Supplier' | 'Diproses Belanja' | 'Dikirim Supplier' | 'Selesai';
  sendMethod?: 'WhatsApp' | 'Email' | 'Portal' | 'Manual';
  sendLogs?: POSendLog[];
  adminConfirmation?: POAdminConfirmation;
  supplierConfirmation?: POSupplierConfirmation;
  supplierShoppingStatus?: POSupplierShoppingStatus;
  createdAt: string;
  updatedAt: string;
}

export type JenisBarangDatang = 'Bahan Baku' | 'Operasional';

export interface DriverStaff {
  id: string;
  nama: string;
  telepon: string;
  noSim: string;
  kendaraan: string;
  platNomor: string;
  foto: string;
  status: 'Aktif' | 'Tugas' | 'Nonaktif';
  catatan?: string;
  createdAt?: string;
}

export interface DistributionReport {
  id: string;
  tanggal: string; // YYYY-MM-DD
  driverId: string;
  driverNama: string;
  driverFoto?: string;
  driverKendaraan?: string;
  instansiId: string;
  namaInstansi: string;
  jumlahPenerimaManfaat: number;
  jamPengiriman: string; // HH:mm
  jamPenjemputan: string; // HH:mm
  dokPengiriman?: string; // photo base64/URL
  dokPenjemputan?: string; // photo base64/URL
  catatan?: string;
  status?: 'Selesai' | 'Dalam Proses' | 'Dibatalkan';
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BarangDatang {
  id: string;
  hari: string; // e.g. "Senin", "Selasa", dll.
  tanggal: string; // Format YYYY-MM-DD
  hariTanggalFormatted?: string; // Format e.g. "Rabu, 09 September 2026"
  namaBarang: string;
  jumlahMasuk: number;
  satuan: string;
  jenisBarang: JenisBarangDatang;
  dokumentasiUrl?: string; // URL foto / base64 dokumentasi
  keterangan?: string;
  petugas?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export * from './documentTemplate';




