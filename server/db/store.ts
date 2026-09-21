/**
 * Central Enterprise Store & Memory DB
 * Provides mock relational datasets for Core DB, Shared DB, and Module DBs.
 */

import { 
  User, 
  RolePermission, 
  MenuItem, 
  MasterPegawai, 
  MasterDivisi, 
  MasterJabatan, 
  MasterGudang, 
  MasterKategori, 
  MasterInstansi, 
  SuratMasuk, 
  SuratKeluar, 
  Disposisi, 
  TemplateSurat, 
  MasterBarang, 
  StockMovement, 
  StockOpnameSession, 
  NotificationItem, 
  ActivityLog, 
  PortalSettings,
  MasterKendaraan,
  LaporanBbm,
  DivisiTaskRecord,
  WhatsAppDivisiSetting,
  TaskTemplate,
  TugasChecklistItem,
  BeneficiaryGroup,
  BeneficiaryLocation,
  DailyBeneficiaryRecord,
  BeneficiaryAuditLog,
  DailyBeneficiarySummary,
  MasterBahanPangan,
  MasterMenuResep,
  NutritionPlan,
  NutritionPlanItem,
  RABPlan,
  RABTarifConfig,
  RABKomposisiConfig,
  RABItemBahan,
  RABBiayaItem,
  RABAnalisisKelayakan,
  PurchaseOrderDocument,
  POItem,
  POSupplier,
  POShipTo,
  BarangDatang,
  JenisBarangDatang,
  DriverStaff,
  DistributionReport,
  MasterDocumentTemplateConfig,
  DEFAULT_MASTER_TEMPLATE_CONFIG
} from '../../src/types';

export const JWT_SECRET = process.env.JWT_SECRET || 'portal-administrasi-terpadu-super-secret-jwt-key-2026';

// --- INITIAL DATA STORE ---
export const initialUsers: User[] = [
  {
    id: 'USR-001',
    nama: 'Dr. H. Ahmad Pratama, M.Kom',
    username: 'superadmin',
    email: 'admin.portal@instansi.go.id',
    role: 'Admin Penuh',
    divisi: 'Teknologi Informasi & Komunikasi',
    jabatan: 'Kepala Pusat Data & Sistem Informasi',
    status: 'Aktif',
    password: 'password123',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    lastLogin: new Date().toISOString(),
    createdAt: '2026-01-01T08:00:00Z',
    emailVerified: true
  },
  {
    id: 'USR-001-USER',
    nama: 'Pengelola Dapur Hafshawaty',
    username: 'dapurhafshawaty',
    email: 'dapurhafshawaty@gmail.com',
    role: 'Admin Penuh',
    divisi: 'Direksi & Administrasi Utama',
    jabatan: 'Administrator Utama Portal',
    status: 'Aktif',
    password: 'password123',
    foto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    lastLogin: new Date().toISOString(),
    createdAt: '2026-01-01T08:00:00Z',
    emailVerified: true
  },
  {
    id: 'USR-009',
    nama: 'Siti Aminah, S.AP',
    username: 'staff_kantor',
    email: 'staff.kantor@instansi.go.id',
    role: 'Staff Kantor',
    divisi: 'Sekretariat & Operasional Kantor',
    jabatan: 'Staf Administrasi & Inventaris',
    status: 'Aktif',
    password: 'password123',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    lastLogin: new Date(Date.now() - 1800000).toISOString(),
    createdAt: '2026-01-10T09:30:00Z',
    emailVerified: true
  },
  {
    id: 'USR-010',
    nama: 'Rudi Hermawan',
    username: 'distribusi_bbm',
    email: 'distribusi@instansi.go.id',
    role: 'Distribusi',
    divisi: 'Logistik & Armada Distribusi',
    jabatan: 'Koordinator Distribusi & BBM Kendaraan',
    status: 'Aktif',
    password: 'password123',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
    createdAt: '2026-01-12T10:00:00Z',
    emailVerified: true
  },
  {
    id: 'USR-002',
    nama: 'Siti Rahmawati, S.STP',
    username: 'admin',
    email: 'siti.rahmawati@instansi.go.id',
    role: 'Admin',
    divisi: 'Sekretariat / Tata Usaha',
    jabatan: 'Head of Administrative Services',
    status: 'Aktif',
    password: 'password123',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    lastLogin: new Date(Date.now() - 3600000).toISOString(),
    createdAt: '2026-01-10T09:30:00Z',
    emailVerified: true
  },
  {
    id: 'USR-003',
    nama: 'Budi Santoso, S.E.',
    username: 'operator_surat',
    email: 'budi.santoso@instansi.go.id',
    role: 'Operator',
    divisi: 'Sekretariat / Tata Usaha',
    jabatan: 'Staf Registrasi e-Surat',
    status: 'Aktif',
    password: 'password123',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    lastLogin: new Date(Date.now() - 7200000).toISOString(),
    createdAt: '2026-01-15T11:00:00Z',
    emailVerified: true
  },
  {
    id: 'USR-004',
    nama: 'Ahmad Fauzi, S.T.',
    username: 'operator_stock',
    email: 'ahmad.fauzi@instansi.go.id',
    role: 'Operator',
    divisi: 'Logistik & Perlengkapan',
    jabatan: 'Staf Opname Gudang Central',
    status: 'Aktif',
    password: 'password123',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    lastLogin: new Date(Date.now() - 10800000).toISOString(),
    createdAt: '2026-01-18T08:15:00Z',
    emailVerified: true
  },
  {
    id: 'USR-005',
    nama: 'Drs. Bambang Hariyanto, M.Si',
    username: 'supervisor',
    email: 'bambang.hariyanto@instansi.go.id',
    role: 'Supervisor',
    divisi: 'Keuangan & Aset',
    jabatan: 'Kabid Pengawasan Aset',
    status: 'Aktif',
    password: 'password123',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    lastLogin: new Date(Date.now() - 14400000).toISOString(),
    createdAt: '2026-02-01T10:00:00Z',
    emailVerified: true
  },
  {
    id: 'USR-006',
    nama: 'Rina Wijaya, S.E., M.M.',
    username: 'manager',
    email: 'rina.wijaya@instansi.go.id',
    role: 'Manager',
    divisi: 'Perencanaan & Evaluasi',
    jabatan: 'Manager Perencanaan Strategic',
    status: 'Aktif',
    password: 'password123',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    createdAt: '2026-02-05T14:20:00Z',
    emailVerified: true
  },
  {
    id: 'USR-007',
    nama: 'Eko Prasetyo, S.Kom',
    username: 'staff',
    email: 'eko.prasetyo@instansi.go.id',
    role: 'Staff',
    divisi: 'Teknologi Informasi & Komunikasi',
    jabatan: 'Staf Support IT',
    status: 'Aktif',
    password: 'password123',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    lastLogin: new Date(Date.now() - 172800000).toISOString(),
    createdAt: '2026-02-10T09:00:00Z',
    emailVerified: true
  },
  {
    id: 'USR-008',
    nama: 'Maya Indah, S.Sos',
    username: 'viewer',
    email: 'maya.indah@instansi.go.id',
    role: 'Viewer',
    divisi: 'Hubungan Masyarakat',
    jabatan: 'Analis Publikasi Data',
    status: 'Aktif',
    password: 'password123',
    foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    lastLogin: new Date(Date.now() - 259200000).toISOString(),
    createdAt: '2026-02-12T11:30:00Z',
    emailVerified: true
  }
];

export const initialRoles: RolePermission[] = [
  {
    role: 'Admin Penuh',
    description: 'Akses penuh tanpa batas ke seluruh fitur aplikasi, master data, user management, dan cloud settings.',
    modulesAccess: {
      dashboard: true,
      esurat: true,
      stockOpname: true,
      bbm: true,
      masterData: true,
      userManagement: true,
      dynamicMenu: true,
      activityLogs: true,
      settings: true,
      apiDocs: true
    },
    actions: { canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true }
  },
  {
    role: 'Staff Kantor',
    description: 'Mengakses Menu Dashboard Utama, e-Surat Digital, dan Stock Opname.',
    modulesAccess: {
      dashboard: true,
      esurat: true,
      stockOpname: true,
      bbm: false,
      masterData: false,
      userManagement: false,
      dynamicMenu: false,
      activityLogs: false,
      settings: false,
      apiDocs: false
    },
    actions: { canCreate: true, canEdit: true, canDelete: false, canApprove: false, canExport: true }
  },
  {
    role: 'Distribusi',
    description: 'Mengakses Dashboard Utama dan Laporan BBM Kendaraan.',
    modulesAccess: {
      dashboard: true,
      esurat: false,
      stockOpname: false,
      bbm: true,
      masterData: false,
      userManagement: false,
      dynamicMenu: false,
      activityLogs: false,
      settings: false,
      apiDocs: false
    },
    actions: { canCreate: true, canEdit: true, canDelete: false, canApprove: false, canExport: true }
  },
  {
    role: 'Super Admin',
    description: 'Akses penuh tanpa batas ke seluruh modul, master data, audit logs, dan konfigurasi portal.',
    modulesAccess: {
      dashboard: true,
      esurat: true,
      stockOpname: true,
      bbm: true,
      masterData: true,
      userManagement: true,
      dynamicMenu: true,
      activityLogs: true,
      settings: true,
      apiDocs: true
    },
    actions: { canCreate: true, canEdit: true, canDelete: true, canApprove: true, canExport: true }
  },
  {
    role: 'Admin',
    description: 'Akses pengelolaan operasional, master data, e-Surat, dan Stock Opname.',
    modulesAccess: {
      dashboard: true,
      esurat: true,
      stockOpname: true,
      bbm: true,
      masterData: true,
      userManagement: true,
      dynamicMenu: false,
      activityLogs: true,
      settings: false,
      apiDocs: true
    },
    actions: { canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true }
  },
  {
    role: 'Operator',
    description: 'Akses entri data surat masuk/keluar, transaksi stok masuk/keluar, dan fisik opname.',
    modulesAccess: {
      dashboard: true,
      esurat: true,
      stockOpname: true,
      bbm: false,
      masterData: false,
      userManagement: false,
      dynamicMenu: false,
      activityLogs: false,
      settings: false,
      apiDocs: false
    },
    actions: { canCreate: true, canEdit: true, canDelete: false, canApprove: false, canExport: true }
  },
  {
    role: 'Supervisor',
    description: 'Pengawasan, verifikasi surat, disposisi, dan persetujuan stok penyesuaian.',
    modulesAccess: {
      dashboard: true,
      esurat: true,
      stockOpname: true,
      bbm: true,
      masterData: true,
      userManagement: false,
      dynamicMenu: false,
      activityLogs: true,
      settings: false,
      apiDocs: false
    },
    actions: { canCreate: true, canEdit: true, canDelete: false, canApprove: true, canExport: true }
  },
  {
    role: 'Manager',
    description: 'Akses laporan, persetujuan level tinggi, analisis aktivitas, dan dashboard eksekutif.',
    modulesAccess: {
      dashboard: true,
      esurat: true,
      stockOpname: true,
      bbm: true,
      masterData: true,
      userManagement: false,
      dynamicMenu: false,
      activityLogs: true,
      settings: false,
      apiDocs: true
    },
    actions: { canCreate: false, canEdit: true, canDelete: false, canApprove: true, canExport: true }
  },
  {
    role: 'Staff',
    description: 'Menerima disposisi surat, mengajukan permintaan barang, dan melihat status dokumen.',
    modulesAccess: {
      dashboard: true,
      esurat: true,
      stockOpname: true,
      bbm: false,
      masterData: false,
      userManagement: false,
      dynamicMenu: false,
      activityLogs: false,
      settings: false,
      apiDocs: false
    },
    actions: { canCreate: true, canEdit: false, canDelete: false, canApprove: false, canExport: false }
  },
  {
    role: 'Viewer',
    description: 'Hanya dapat melihat ringkasan dashboard dan laporan publik tanpa hak modifikasi.',
    modulesAccess: {
      dashboard: true,
      esurat: false,
      stockOpname: false,
      bbm: false,
      masterData: false,
      userManagement: false,
      dynamicMenu: false,
      activityLogs: false,
      settings: false,
      apiDocs: false
    },
    actions: { canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: true }
  }
];

export const initialMenus: MenuItem[] = [
  {
    id: 'MNU-001',
    title: 'Dashboard Utama',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    color: '#3B82F6',
    order: 1,
    targetModule: 'portal',
    requiredRole: ['Admin Penuh', 'Staff Kantor', 'Distribusi', 'Super Admin', 'Admin', 'Operator', 'Supervisor', 'Manager', 'Staff', 'Viewer'],
    isActive: true
  },
  {
    id: 'MNU-002',
    title: 'e-Surat Digital',
    path: '/esurat',
    icon: 'Mail',
    color: '#10B981',
    order: 2,
    targetModule: 'esurat',
    requiredRole: ['Admin Penuh', 'Staff Kantor', 'Super Admin', 'Admin', 'Operator', 'Supervisor', 'Manager', 'Staff'],
    isActive: true
  },
  {
    id: 'MNU-003',
    title: 'Stock Opname',
    path: '/stock',
    icon: 'Boxes',
    color: '#F59E0B',
    order: 3,
    targetModule: 'stock',
    requiredRole: ['Admin Penuh', 'Staff Kantor', 'Super Admin', 'Admin', 'Operator', 'Supervisor', 'Manager', 'Staff'],
    isActive: true
  },
  {
    id: 'MNU-003-DATANG',
    title: 'Input Kedatangan Barang',
    path: '/barang-datang',
    icon: 'PackagePlus',
    color: '#0284C7',
    order: 3.1,
    targetModule: 'barangDatang',
    requiredRole: ['Admin Penuh', 'Staff Kantor', 'Distribusi', 'Super Admin', 'Admin', 'Operator', 'Supervisor', 'Manager', 'Staff', 'Viewer'],
    isActive: true
  },
  {
    id: 'MNU-003-BENEFICIARY',
    title: 'Penerima Manfaat',
    path: '/penerima-manfaat',
    icon: 'Users',
    color: '#059669',
    order: 3.5,
    targetModule: 'portal',
    requiredRole: ['Admin Penuh', 'Staff Kantor', 'Distribusi', 'Super Admin', 'Admin', 'Operator', 'Supervisor', 'Manager', 'Staff', 'Viewer'],
    isActive: true
  },
  {
    id: 'MNU-003-PLANNING',
    title: 'Perencanaan Bahan Pangan',
    path: '/perencanaan-bahan',
    icon: 'UtensilsCrossed',
    color: '#10B981',
    order: 3.8,
    targetModule: 'portal',
    requiredRole: ['Admin Penuh', 'Staff Kantor', 'Distribusi', 'Super Admin', 'Admin', 'Operator', 'Supervisor', 'Manager', 'Staff', 'Viewer'],
    isActive: true
  },
  {
    id: 'MNU-003-PO',
    title: 'Purchase Order (PO) 5 Hari',
    path: '/purchase-order',
    icon: 'FileCheck',
    color: '#2563EB',
    order: 3.9,
    targetModule: 'po',
    requiredRole: ['Admin Penuh', 'Staff Kantor', 'Distribusi', 'Super Admin', 'Admin', 'Operator', 'Supervisor', 'Manager', 'Staff', 'Viewer'],
    isActive: true
  },
  {
    id: 'MNU-003-SUPPLIER',
    title: 'Portal Supplier',
    path: '/portal-supplier',
    icon: 'Truck',
    color: '#059669',
    order: 3.95,
    targetModule: 'portal',
    requiredRole: ['Admin Penuh', 'Staff Kantor', 'Distribusi', 'Super Admin', 'Admin', 'Operator', 'Supervisor', 'Manager', 'Staff', 'Viewer'],
    isActive: true
  },
  {
    id: 'MNU-003-TUGAS',
    title: 'Tugas Divisi',
    path: '/tugas-divisi',
    icon: 'ClipboardCheck',
    color: '#2563EB',
    order: 4,
    targetModule: 'portal',
    requiredRole: ['Admin Penuh', 'Staff Kantor', 'Distribusi', 'Super Admin', 'Admin', 'Operator', 'Supervisor', 'Manager', 'Staff', 'Viewer'],
    isActive: true
  },
  {
    id: 'MNU-003-BBM',
    title: 'Laporan BBM Kendaraan',
    path: '/bbm/laporan',
    icon: 'Fuel',
    color: '#0284C7',
    order: 5,
    targetModule: 'portal',
    requiredRole: ['Admin Penuh', 'Distribusi', 'Super Admin', 'Admin', 'Supervisor', 'Manager'],
    isActive: true
  },
  {
    id: 'MNU-003-DISTRIBUSI',
    title: 'Laporan Distribusi',
    path: '/laporan-distribusi',
    icon: 'Truck',
    color: '#2563EB',
    order: 4.5,
    targetModule: 'portal',
    requiredRole: ['Admin Penuh', 'Staff Kantor', 'Distribusi', 'Super Admin', 'Admin', 'Operator', 'Supervisor', 'Manager', 'Staff', 'Viewer'],
    isActive: true
  },
  {
    id: 'MNU-004',
    title: 'Master Data Terpadu',
    path: '/master-data',
    icon: 'Database',
    color: '#8B5CF6',
    order: 5,
    targetModule: 'portal',
    requiredRole: ['Admin Penuh', 'Super Admin', 'Admin', 'Supervisor', 'Manager'],
    isActive: true
  },
  {
    id: 'MNU-005',
    title: 'Manajemen Pengguna',
    path: '/admin/users',
    icon: 'Users',
    color: '#EC4899',
    order: 6,
    targetModule: 'portal',
    requiredRole: ['Admin Penuh', 'Super Admin', 'Admin'],
    isActive: true
  },
  {
    id: 'MNU-006',
    title: 'Menu Dinamis',
    path: '/admin/menus',
    icon: 'Menu',
    color: '#06B6D4',
    order: 7,
    targetModule: 'portal',
    requiredRole: ['Admin Penuh', 'Super Admin'],
    isActive: true
  },
  {
    id: 'MNU-007',
    title: 'Log Aktivitas Central',
    path: '/admin/logs',
    icon: 'FileText',
    color: '#64748B',
    order: 8,
    targetModule: 'portal',
    requiredRole: ['Admin Penuh', 'Super Admin', 'Admin', 'Supervisor', 'Manager'],
    isActive: true
  },
  {
    id: 'MNU-008',
    title: 'Dokumentasi REST API',
    path: '/docs/api',
    icon: 'Code2',
    color: '#14B8A6',
    order: 8,
    targetModule: 'portal',
    isActive: true
  },
  {
    id: 'MNU-009',
    title: 'Arsitektur Enterprise',
    path: '/docs/architecture',
    icon: 'BookOpen',
    color: '#6366F1',
    order: 9,
    targetModule: 'portal',
    isActive: true
  },
  {
    id: 'MNU-010',
    title: 'Pengaturan Portal',
    path: '/admin/settings',
    icon: 'Settings',
    color: '#EF4444',
    order: 10,
    targetModule: 'portal',
    requiredRole: ['Super Admin'],
    isActive: true
  }
];

export const initialPegawai: MasterPegawai[] = [
  { id: 'PEG-001', nip: '198504122010121001', nama: 'Dr. H. Ahmad Pratama, M.Kom', email: 'admin.portal@instansi.go.id', telepon: '081234567890', divisiId: 'DIV-001', divisiNama: 'Teknologi Informasi & Komunikasi', jabatanId: 'JAB-001', jabatanNama: 'Kepala Pusat Data & Sistem Informasi', status: 'Aktif' },
  { id: 'PEG-002', nip: '199002152015032002', nama: 'Siti Rahmawati, S.STP', email: 'siti.rahmawati@instansi.go.id', telepon: '081298765432', divisiId: 'DIV-002', divisiNama: 'Sekretariat / Tata Usaha', jabatanId: 'JAB-002', jabatanNama: 'Head of Administrative Services', status: 'Aktif' },
  { id: 'PEG-003', nip: '199208202018011003', nama: 'Budi Santoso, S.E.', email: 'budi.santoso@instansi.go.id', telepon: '081377889900', divisiId: 'DIV-003', divisiNama: 'Logistik & Perlengkapan', jabatanId: 'JAB-003', jabatanNama: 'Staf Opname Gudang Central', status: 'Aktif' },
  { id: 'PEG-004', nip: '198211052008041002', nama: 'Drs. Bambang Hariyanto, M.Si', email: 'bambang.hariyanto@instansi.go.id', telepon: '081122334455', divisiId: 'DIV-004', divisiNama: 'Keuangan & Aset', jabatanId: 'JAB-004', jabatanNama: 'Kabid Pengawasan Aset', status: 'Aktif' },
  { id: 'PEG-005', nip: '198806122012022001', nama: 'Rina Wijaya, S.E., M.M.', email: 'rina.wijaya@instansi.go.id', telepon: '081566778899', divisiId: 'DIV-005', divisiNama: 'Perencanaan & Evaluasi', jabatanId: 'JAB-005', jabatanNama: 'Manager Perencanaan Strategic', status: 'Aktif' }
];

export const initialDivisi: MasterDivisi[] = [
  { id: 'DIV-001', kode: 'TIK', nama: 'Teknologi Informasi & Komunikasi', kepalaDivisi: 'Dr. H. Ahmad Pratama, M.Kom', keterangan: 'Pengelola Infrastruktur IT, Server, & Aplikasi Enterprise' },
  { id: 'DIV-002', kode: 'TU', nama: 'Sekretariat / Tata Usaha', kepalaDivisi: 'Siti Rahmawati, S.STP', keterangan: 'Pengelola Persuratan, Arsip, & Administrasi Umum' },
  { id: 'DIV-003', kode: 'LOG', nama: 'Logistik & Perlengkapan', kepalaDivisi: 'Ahmad Fauzi, S.T.', keterangan: 'Pengelola Pergudangan, Aset, & Stock Opname' },
  { id: 'DIV-004', kode: 'KEU', nama: 'Keuangan & Aset', kepalaDivisi: 'Drs. Bambang Hariyanto, M.Si', keterangan: 'Pengelolaan Anggaran, Akuntansi, & Verifikasi Aset' },
  { id: 'DIV-005', kode: 'REN', nama: 'Perencanaan & Evaluasi', kepalaDivisi: 'Rina Wijaya, S.E., M.M.', keterangan: 'Perencanaan Program Kerja & Monitoring Kinerja' }
];

export const initialJabatan: MasterJabatan[] = [
  { id: 'JAB-001', kode: 'KAPUS', nama: 'Kepala Pusat Data & Sistem Informasi', level: 1 },
  { id: 'JAB-002', kode: 'HEAD-TU', nama: 'Head of Administrative Services', level: 2 },
  { id: 'JAB-003', kode: 'STAF-LOG', nama: 'Staf Opname Gudang Central', level: 4 },
  { id: 'JAB-004', kode: 'KABID-ASET', nama: 'Kabid Pengawasan Aset', level: 2 },
  { id: 'JAB-005', kode: 'MGR-REN', nama: 'Manager Perencanaan Strategic', level: 3 }
];

export const initialGudang: MasterGudang[] = [
  { id: 'GDG-001', kode: 'GDG-CENTRAL', nama: 'Gudang Utama Central Enterprise', lokasi: 'Gedung A Lantai Dasar, Kompleks Perkantoran Pusat', penanggungJawab: 'Budi Santoso, S.E.', status: 'Aktif' },
  { id: 'GDG-002', kode: 'GDG-ATK', nama: 'Gudang ATK & Cetakan', lokasi: 'Gedung B Ruang 102', penanggungJawab: 'Dewi Lestari, A.Md', status: 'Aktif' },
  { id: 'GDG-003', kode: 'GDG-IT', nama: 'Gudang Perangkat Hardware TIK', lokasi: 'Gedung Server Lantai 2', penanggungJawab: 'Ahmad Pratama, M.Kom', status: 'Aktif' }
];

export const initialKategori: MasterKategori[] = [
  { id: 'KAT-001', kode: 'BAHAN_BAKU', nama: 'Bahan Baku', deskripsi: 'Semua jenis bahan baku makanan, bumbu, dan konsumsi dapur' },
  { id: 'KAT-002', kode: 'OPERASIONAL', nama: 'Operasional', deskripsi: 'Perlengkapan operasional, peralatan, ATK, dan kebersihan' }
];

export const initialInstansi: MasterInstansi[] = [
  { id: 'INS-001', kode: 'KEMENKEU', nama: 'Kementerian Keuangan Republik Indonesia', alamat: 'Jl. Dr. Wahidin Raya No.1, Jakarta Pusat', telepon: '021-3841000', email: 'humas@kemenkeu.go.id', kontakPerson: 'Bapak Sugeng S.' },
  { id: 'INS-002', kode: 'BKN', nama: 'Badan Kepegawaian Negara', alamat: 'Jl. Mayor Jendral Sutoyo No.12, Cililitan, Jakarta Timur', telepon: '021-80882815', email: 'info@bkn.go.id', kontakPerson: 'Ibu Ratna M.' },
  { id: 'INS-003', kode: 'PEMPROV', nama: 'Pemerintah Provinsi DKI Jakarta', alamat: 'Jl. Medan Merdeka Selatan No.8-9, Jakarta Pusat', telepon: '021-3822222', email: 'sekretariat@jakarta.go.id', kontakPerson: 'Drs. Hendra W.' }
];

// --- e-Surat Sample Data ---
export const initialSuratMasuk: SuratMasuk[] = [
  {
    id: 'SM-2026-001',
    nomorSurat: '102/KEMENKEU/07/2026',
    nomorAgenda: 'AGD-2026-089',
    pengirim: 'Kementerian Keuangan Republik Indonesia',
    perihal: 'Undangan Koordinasi Penganggaran & Sinkronisasi Sistem Informasi Terpadu',
    tanggalSurat: '2026-07-25',
    tanggalTerima: '2026-07-28',
    sifat: 'Penting',
    status: 'Proses Disposisi',
    ringkasan: 'Permohonan kehadiran pada Rapat Koordinasi Nasional Integrasi Layanan Digital.',
    fileUrl: '/docs/surat-undangan-kemenkeu.pdf',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFIED-SM-2026-001'
  },
  {
    id: 'SM-2026-002',
    nomorSurat: '450/BKN/SEC/2026',
    nomorAgenda: 'AGD-2026-090',
    pengirim: 'Badan Kepegawaian Negara',
    perihal: 'Pemberitahuan Audit Kepatuhan Data Pegawai Enterprise',
    tanggalSurat: '2026-07-27',
    tanggalTerima: '2026-07-29',
    sifat: 'Biasa',
    status: 'Baru',
    ringkasan: 'Pelaksanaan sinkronisasi Master Data Pegawai periode Semester II.',
    fileUrl: '/docs/surat-bkn-audit.pdf',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFIED-SM-2026-002'
  },
  {
    id: 'SM-2026-003',
    nomorSurat: '088/PEMPROV/DKI/2026',
    nomorAgenda: 'AGD-2026-085',
    pengirim: 'Pemerintah Provinsi DKI Jakarta',
    perihal: 'Kerjasama Layanan Publik & Pertukaran Data Antar Moda',
    tanggalSurat: '2026-07-20',
    tanggalTerima: '2026-07-21',
    sifat: 'Sangat Rahasia',
    status: 'Diarsipkan',
    ringkasan: 'Kesepakatan bersama integrasi API Gateway antar instansi.',
    fileUrl: '/docs/mou-dki.pdf',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFIED-SM-2026-003'
  }
];

export const initialSuratKeluar: SuratKeluar[] = [
  {
    id: 'SK-2026-001',
    nomorSurat: '005/PORTAL-TIK/SK/VII/2026',
    tujuan: 'Kementerian Keuangan Republik Indonesia',
    perihal: 'Konfirmasi Kehadiran & Penyampaian Laporan Kesiapan Portal Terpadu',
    tanggalSurat: '2026-07-29',
    pembuat: 'Siti Rahmawati, S.STP',
    statusApproval: 'Disetujui',
    approver: 'Dr. H. Ahmad Pratama, M.Kom',
    templateId: 'TMP-001',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFIED-SK-2026-001',
    fileUrl: '/docs/sk-005-kemenkeu.pdf'
  },
  {
    id: 'SK-2026-002',
    nomorSurat: '006/PORTAL-LOG/SK/VII/2026',
    tujuan: 'PT Nusa Logistics Enterprise',
    perihal: 'Permohonan Pengadaan Barang & Stock Refill Gudang Central',
    tanggalSurat: '2026-07-30',
    pembuat: 'Budi Santoso, S.E.',
    statusApproval: 'Menunggu Approval',
    approver: 'Drs. Bambang Hariyanto, M.Si',
    templateId: 'TMP-002',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFIED-SK-2026-002'
  }
];

export const initialDisposisi: Disposisi[] = [
  {
    id: 'DSP-001',
    suratMasukId: 'SM-2026-001',
    nomorSurat: '102/KEMENKEU/07/2026',
    pengirimDisposisi: 'Dr. H. Ahmad Pratama, M.Kom (Kepala Pusat)',
    penerimaDisposisi: 'Sekretariat / Tata Usaha & Divisi TIK',
    instruksi: 'Harap siapkan materi presentasi arsitektur SSO dan API Gateway sebelum rapat tgl 5 Agustus.',
    sifat: 'Segera',
    batasWaktu: '2026-08-03',
    status: 'Dalam Proses',
    catatanPenerima: 'Materi sedang disusun oleh tim pengembangan.',
    tanggalDisposisi: '2026-07-28 14:00'
  }
];

export const initialTemplateSurat: TemplateSurat[] = [
  {
    id: 'TMP-001',
    nama: 'Surat Undangan / Konfirmasi Resmi',
    kategori: 'Surat Keluar Dinamis',
    formatNomor: '{URUT}/PORTAL-{DIVISI}/SK/{BULAN-ROMAWI}/{TAHUN}',
    isiHeader: 'PORTAL ADMINISTRASI TERPADU ENTERPRISE\nSEKRETARIAT UTAMA PUSAT DATA',
    isiBody: 'Dengan hormat, sehubungan dengan {PERIHAL}, kami menyampaikan konfirmasi kehadiran tim...',
    isiFooter: 'Demikian disampaikan, atas perhatian dan kerjasamanya diucapkan terima kasih.'
  },
  {
    id: 'TMP-002',
    nama: 'Surat Permohonan Pengadaan & Stock Refill',
    kategori: 'Logistik',
    formatNomor: '{URUT}/PORTAL-LOG/SK/{BULAN-ROMAWI}/{TAHUN}',
    isiHeader: 'DIVISI LOGISTIK & PERLENGKAPAN GUDANG CENTRAL',
    isiBody: 'Guna menunjang operasional, bersama ini kami mengajukan permohonan pengadaan barang...',
    isiFooter: 'Mengetahui, Kepala Pusat Data & Sistem Informasi.'
  }
];

// --- Stock Opname Sample Data ---
export const initialMasterBarang: MasterBarang[] = [
  { id: 'BRG-001', kodeBarang: 'BRG-ATK-001', namaBarang: 'Kertas HVS A4 80gsm PaperOne (Box)', kategoriId: 'KAT-002', kategoriNama: 'Operasional', gudangId: 'GDG-002', gudangNama: 'Gudang ATK & Cetakan', satuan: 'Box', stokMinimal: 15, stokSekarang: 42, hargaSatuan: 225000, barcode: '8991001200301', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BRG-ATK-001' },
  { id: 'BRG-002', kodeBarang: 'BRG-IT-002', namaBarang: 'Laptop Enterprise Intel i7 16GB RAM 512GB SSD', kategoriId: 'KAT-002', kategoriNama: 'Operasional', gudangId: 'GDG-003', gudangNama: 'Gudang Perangkat Hardware TIK', satuan: 'Unit', stokMinimal: 5, stokSekarang: 18, hargaSatuan: 16500000, barcode: '8991001200402', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BRG-IT-002' },
  { id: 'BRG-003', kodeBarang: 'BRG-IT-003', namaBarang: 'Barcode & QR Scanner Wireless Wireless 2D', kategoriId: 'KAT-002', kategoriNama: 'Operasional', gudangId: 'GDG-001', gudangNama: 'Gudang Utama Central Enterprise', satuan: 'Unit', stokMinimal: 4, stokSekarang: 3, hargaSatuan: 1250000, barcode: '8991001200503', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BRG-IT-003' },
  { id: 'BRG-004', kodeBarang: 'BRG-CTK-004', namaBarang: 'Map Stopmap Folio Ber-Kop Instansi (Pack 50)', kategoriId: 'KAT-002', kategoriNama: 'Operasional', gudangId: 'GDG-002', gudangNama: 'Gudang ATK & Cetakan', satuan: 'Pack', stokMinimal: 20, stokSekarang: 85, hargaSatuan: 85000, barcode: '8991001200604', qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BRG-CTK-004' }
];

export const initialStockMovements: StockMovement[] = [
  { id: 'MOV-001', jenis: 'Masuk', barangId: 'BRG-001', kodeBarang: 'BRG-ATK-001', namaBarang: 'Kertas HVS A4 80gsm PaperOne (Box)', jumlah: 20, gudangId: 'GDG-002', gudangNama: 'Gudang ATK & Cetakan', referensiNota: 'PO-LOG-2026-088', keterangan: 'Pengadaan Rutin Triwulan III', tanggal: '2026-07-28 10:00', petugas: 'Budi Santoso, S.E.' },
  { id: 'MOV-002', jenis: 'Keluar', barangId: 'BRG-002', kodeBarang: 'BRG-IT-002', namaBarang: 'Laptop Enterprise Intel i7 16GB RAM 512GB SSD', jumlah: 2, gudangId: 'GDG-003', gudangNama: 'Gudang Perangkat Hardware TIK', referensiNota: 'REQ-TIK-2026-012', keterangan: 'Penyerahan Laptop Kerja Pegawai Baru', tanggal: '2026-07-29 14:30', petugas: 'Ahmad Pratama, M.Kom' }
];

export const initialStockOpnameSessions: StockOpnameSession[] = [
  {
    id: 'SOP-2026-001',
    kodeOpname: 'SOP-JULI-2026-GDG1',
    tanggal: '2026-07-31',
    gudangId: 'GDG-001',
    gudangNama: 'Gudang Utama Central Enterprise',
    petugas: 'Budi Santoso, S.E. & Team Audit',
    status: 'Sedang Berjalan',
    items: [
      { barangId: 'BRG-003', kodeBarang: 'BRG-IT-003', namaBarang: 'Barcode & QR Scanner Wireless Wireless 2D', stokSistem: 4, stokFisik: 3, selisih: -1, catatan: '1 unit sedang dipinjam divisi TIK tanpa nota' }
    ],
    catatanGeneral: 'Opname rutin bulanan area gudang central.'
  }
];

// --- Central Notifications & Logs ---
export const initialNotifications: NotificationItem[] = [
  { id: 'NTF-001', modul: 'e-Surat', judul: 'Surat Masuk Baru Received', pesan: 'Surat Masuk 102/KEMENKEU/07/2026 perlu tindak lanjut disposisi.', tipe: 'info', isRead: false, createdAt: '2026-07-31 09:15', linkUrl: '/esurat' },
  { id: 'NTF-002', modul: 'Stock Opname', judul: 'Peringatan Stok Minimal!', pesan: 'Barang "Barcode & QR Scanner Wireless Wireless 2D" berada di bawah batas stok minimal (3/4 unit).', tipe: 'warning', isRead: false, createdAt: '2026-07-31 10:30', linkUrl: '/stock' },
  { id: 'NTF-003', modul: 'e-Surat', judul: 'Approval Surat Keluar', pesan: 'Surat Keluar 005/PORTAL-TIK/SK/VII/2026 telah disetujui oleh Kepala Pusat.', tipe: 'success', isRead: true, createdAt: '2026-07-30 16:00', linkUrl: '/esurat' },
  { id: 'NTF-004', modul: 'Stock Opname', judul: 'Stock Opname Selesai', pesan: 'Sesi Stock Opname SOP-JULI-2026-GDG1 berhasil dicatat.', tipe: 'info', isRead: true, createdAt: '2026-07-29 11:20', linkUrl: '/stock' }
];

export const initialActivityLogs: ActivityLog[] = [
  { id: 'LOG-001', userId: 'USR-001', namaUser: 'Dr. H. Ahmad Pratama, M.Kom', modul: 'SSO & Auth', aktivitas: 'User Login Single Sign-On', detail: 'Login berhasil via SSO Portal Gateway', tanggal: '2026-07-31', jam: '08:00:12', browser: 'Chrome 126.0 (Windows 11)', ipAddress: '10.240.1.45', status: 'Sukses' },
  { id: 'LOG-002', userId: 'USR-002', namaUser: 'Siti Rahmawati, S.STP', modul: 'e-Surat Digital', aktivitas: 'Proses Disposisi Surat', detail: 'Meneruskan Surat Masuk 102/KEMENKEU/07/2026 ke TIK', tanggal: '2026-07-31', jam: '09:20:05', browser: 'Firefox 127.0 (macOS)', ipAddress: '10.240.1.88', status: 'Sukses' },
  { id: 'LOG-003', userId: 'USR-003', namaUser: 'Budi Santoso, S.E.', modul: 'Stock Opname', aktivitas: 'Input Stock Opname Physical', detail: 'Mencatat hasil hitung fisik BRG-IT-003 selisih -1 unit', tanggal: '2026-07-31', jam: '10:35:40', browser: 'Edge 125.0 (Windows 11)', ipAddress: '10.240.2.12', status: 'Sukses' },
  { id: 'LOG-004', userId: 'USR-001', namaUser: 'Dr. H. Ahmad Pratama, M.Kom', modul: 'Master Data', aktivitas: 'Update Master Gudang', detail: 'Mengubah penanggung jawab Gudang Central', tanggal: '2026-07-30', jam: '15:10:00', browser: 'Chrome 126.0 (Windows 11)', ipAddress: '10.240.1.45', status: 'Sukses' }
];

export const initialSettings: PortalSettings = {
  namaPortal: 'Portal Administrasi Terpadu',
  deskripsi: 'Single Entry Point Enterprise & Module Integration Gateway (e-Surat & Stock Opname)',
  logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
  theme: 'light',
  primaryColor: '#2563EB',
  smtpHost: 'smtp.instansi.go.id',
  smtpPort: 587,
  smtpUser: 'notifications@instansi.go.id',
  maintenanceMode: false,
  sessionTimeoutMinutes: 120,
  rateLimitPerMin: 100
};

// --- Initial Master Kendaraan & Laporan BBM ---
export const initialKendaraan: MasterKendaraan[] = [
  {
    id: 'KND-001',
    namaKendaraan: 'Mobil Operasional Avanza',
    platNomor: 'B 1234 RFS',
    jenisKendaraan: 'Mobil Operasional',
    standarKmLiter: 12,
    status: 'Aktif'
  },
  {
    id: 'KND-002',
    namaKendaraan: 'Mobil Box Isuzu Traga',
    platNomor: 'B 9876 POS',
    jenisKendaraan: 'Mobil Box',
    standarKmLiter: 9,
    status: 'Aktif'
  },
  {
    id: 'KND-003',
    namaKendaraan: 'Motor Operasional Honda Beat',
    platNomor: 'B 3456 TIK',
    jenisKendaraan: 'Motor',
    standarKmLiter: 40,
    status: 'Aktif'
  },
  {
    id: 'KND-004',
    namaKendaraan: 'Ambulance Hino Dutro',
    platNomor: 'B 7788 SPP',
    jenisKendaraan: 'Ambulance',
    standarKmLiter: 8,
    status: 'Aktif'
  },
  {
    id: 'KND-005',
    namaKendaraan: 'Bus Jemputan Staf Isuzu',
    platNomor: 'B 1122 SPP',
    jenisKendaraan: 'Bus',
    standarKmLiter: 7,
    status: 'Aktif'
  }
];

export const initialLaporanBbm: LaporanBbm[] = [
  {
    id: 'BBM-202608-001',
    tanggalPembelian: '2026-08-01',
    kendaraanId: 'KND-001',
    kendaraanNama: 'Mobil Operasional Avanza',
    platNomor: 'B 1234 RFS',
    jenisBbm: 'Pertamax',
    kmAwal: 42100,
    kmAkhir: 42520,
    jarakTempuh: 420,
    hargaBbm: 451500,
    jumlahLiter: 35.0,
    kmLiterAktual: 12.0,
    standarKmLiter: 12,
    statusPemakaian: 'Normal',
    uploadStruk: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    statusStruk: 'Ter-upload',
    keterangan: 'Pemakaian Wajar',
    userInput: 'Ahmad Fauzi, S.T.',
    timestamp: '2026-08-01T09:15:00.000Z'
  },
  {
    id: 'BBM-202608-002',
    tanggalPembelian: '2026-08-02',
    kendaraanId: 'KND-002',
    kendaraanNama: 'Mobil Box Isuzu Traga',
    platNomor: 'B 9876 POS',
    jenisBbm: 'Solar',
    kmAwal: 85300,
    kmAkhir: 85660,
    jarakTempuh: 360,
    hargaBbm: 306000,
    jumlahLiter: 45.0,
    kmLiterAktual: 8.0,
    standarKmLiter: 9,
    statusPemakaian: 'Tidak Normal',
    uploadStruk: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    statusStruk: 'Ter-upload',
    keterangan: 'Boros',
    userInput: 'Budi Santoso, S.E.',
    timestamp: '2026-08-02T10:30:00.000Z'
  },
  {
    id: 'BBM-202608-003',
    tanggalPembelian: '2026-08-02',
    kendaraanId: 'KND-003',
    kendaraanNama: 'Motor Operasional Honda Beat',
    platNomor: 'B 3456 TIK',
    jenisBbm: 'Pertalite',
    kmAwal: 12400,
    kmAkhir: 12568,
    jarakTempuh: 168,
    hargaBbm: 42000,
    jumlahLiter: 4.0,
    kmLiterAktual: 42.0,
    standarKmLiter: 40,
    statusPemakaian: 'Normal',
    uploadStruk: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    statusStruk: 'Ter-upload',
    keterangan: 'Pemakaian Wajar',
    userInput: 'Eko Prasetyo, S.Kom',
    timestamp: '2026-08-02T14:10:00.000Z'
  },
  {
    id: 'BBM-202607-001',
    tanggalPembelian: '2026-07-28',
    kendaraanId: 'KND-001',
    kendaraanNama: 'Mobil Operasional Avanza',
    platNomor: 'B 1234 RFS',
    jenisBbm: 'Pertamax',
    kmAwal: 41650,
    kmAkhir: 42100,
    jarakTempuh: 450,
    hargaBbm: 470850,
    jumlahLiter: 36.5,
    kmLiterAktual: 12.33,
    standarKmLiter: 12,
    statusPemakaian: 'Normal',
    uploadStruk: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    statusStruk: 'Ter-upload',
    keterangan: 'Pemakaian Wajar',
    userInput: 'Ahmad Fauzi, S.T.',
    timestamp: '2026-07-28T16:20:00.000Z'
  },
  {
    id: 'BBM-202607-002',
    tanggalPembelian: '2026-07-25',
    kendaraanId: 'KND-004',
    kendaraanNama: 'Ambulance Hino Dutro',
    platNomor: 'B 7788 SPP',
    jenisBbm: 'Pertamina Dex',
    kmAwal: 31200,
    kmAkhir: 31520,
    jarakTempuh: 320,
    hargaBbm: 634200,
    jumlahLiter: 42.0,
    kmLiterAktual: 7.62,
    standarKmLiter: 8,
    statusPemakaian: 'Tidak Normal',
    uploadStruk: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    statusStruk: 'Ter-upload',
    keterangan: 'Boros',
    userInput: 'Dr. H. Ahmad Pratama, M.Kom',
    timestamp: '2026-07-25T11:45:00.000Z'
  },
  {
    id: 'BBM-202607-003',
    tanggalPembelian: '2026-07-20',
    kendaraanId: 'KND-005',
    kendaraanNama: 'Bus Jemputan Staf Isuzu',
    platNomor: 'B 1122 SPP',
    jenisBbm: 'Solar',
    kmAwal: 98100,
    kmAkhir: 98520,
    jarakTempuh: 420,
    hargaBbm: 394400,
    jumlahLiter: 58.0,
    kmLiterAktual: 7.24,
    standarKmLiter: 7,
    statusPemakaian: 'Normal',
    uploadStruk: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    statusStruk: 'Ter-upload',
    keterangan: 'Pemakaian Wajar',
    userInput: 'Budi Santoso, S.E.',
    timestamp: '2026-07-20T08:00:00.000Z'
  }
];

export const initialDrivers: DriverStaff[] = [
  {
    id: 'DRV-001',
    nama: 'Joko Susilo',
    telepon: '0812-3456-7891',
    noSim: '92817263541',
    kendaraan: 'Armada Box A - L300 Pendingin',
    platNomor: 'N 8412 PQ',
    foto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300',
    status: 'Aktif',
    catatan: 'Driver senior rute sekolah Pajarakan & Kraksaan'
  },
  {
    id: 'DRV-002',
    nama: 'Bambang Supriadi',
    telepon: '0813-9876-5432',
    noSim: '81726354910',
    kendaraan: 'Armada Box B - Grand Max',
    platNomor: 'N 1982 WX',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    status: 'Aktif',
    catatan: 'Driver spesialis rute Posyandu Balita & Ibu Hamil'
  },
  {
    id: 'DRV-003',
    nama: 'Herman Pratama',
    telepon: '0852-1122-3344',
    noSim: '71625349102',
    kendaraan: 'Armada Box C - Isuzu Traga',
    platNomor: 'N 3109 AZ',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    status: 'Tugas',
    catatan: 'Driver rute Pesantren & SMA Hafshawaty'
  },
  {
    id: 'DRV-004',
    nama: 'Agus Hermawan',
    telepon: '0821-4455-6677',
    noSim: '61524379801',
    kendaraan: 'Armada Pickup D - Carry',
    platNomor: 'N 7721 KL',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
    status: 'Aktif',
    catatan: 'Driver cadangan operasional dapur SPPG'
  }
];

export const initialDistributionReports: DistributionReport[] = [
  {
    id: 'DST-20260914-001',
    tanggal: new Date().toISOString().split('T')[0],
    driverId: 'DRV-001',
    driverNama: 'Joko Susilo',
    driverFoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300',
    driverKendaraan: 'Armada Box A - L300 Pendingin (N 8412 PQ)',
    instansiId: 'LOC-001',
    namaInstansi: 'SD Zainul Hasan Genggong',
    jumlahPenerimaManfaat: 409,
    jamPengiriman: '07:30',
    jamPenjemputan: '11:30',
    dokPengiriman: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500',
    dokPenjemputan: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=500',
    status: 'Selesai',
    catatan: 'Pengiriman tepat waktu, ompreng bersih dan diserahkan ke Pihak Sekolah.',
    createdBy: 'Joko Susilo',
    createdAt: new Date().toISOString()
  },
  {
    id: 'DST-20260914-002',
    tanggal: new Date().toISOString().split('T')[0],
    driverId: 'DRV-002',
    driverNama: 'Bambang Supriadi',
    driverFoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    driverKendaraan: 'Armada Box B - Grand Max (N 1982 WX)',
    instansiId: 'LOC-002',
    namaInstansi: 'MA Model Hafshawaty',
    jumlahPenerimaManfaat: 243,
    jamPengiriman: '08:00',
    jamPenjemputan: '12:00',
    dokPengiriman: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500',
    dokPenjemputan: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=500',
    status: 'Selesai',
    catatan: 'Selesai didistribusikan ke OSIS MA Model.',
    createdBy: 'Bambang Supriadi',
    createdAt: new Date().toISOString()
  }
];

export const initialWaDivisiSettings: WhatsAppDivisiSetting[] = [
  { divisiId: 'persiapan', divisiNama: 'Divisi Persiapan', nomorWa: '6281234567891', namaKontak: 'Budi Santoso (Persiapan)' },
  { divisiId: 'pengolahan', divisiNama: 'Divisi Pengolahan', nomorWa: '6281234567892', namaKontak: 'Siti Nurhaliza (Chef Dapur)' },
  { divisiId: 'pemorsian', divisiNama: 'Divisi Pemorsian', nomorWa: '6281234567893', namaKontak: 'Ahmad Yani (Pemorsian)' },
  { divisiId: 'distribusi', divisiNama: 'Divisi Distribusi', nomorWa: '6281234567894', namaKontak: 'Rudi Hermawan (Kurir/Distribusi)' },
  { divisiId: 'cuci_ompreng', divisiNama: 'Divisi Cuci Ompreng', nomorWa: '6281234567895', namaKontak: 'Dewi Sartika (Sanitasi Ompreng)' },
];

export const initialTaskTemplates: TaskTemplate[] = [
  {
    id: 'TPL-001',
    divisiId: 'persiapan',
    divisiNama: 'Divisi Persiapan',
    judulTemplate: 'Checklist Standar Persiapan Dapur SPPG',
    checklists: [
      'Pemeriksaan bahan baku',
      'Pemeriksaan kualitas sayur',
      'Pemeriksaan kualitas lauk',
      'Menimbang bahan',
      'Menyiapkan alat',
      'Membersihkan area persiapan',
      'Menyiapkan bumbu',
      'Menyiapkan bahan sesuai menu',
      'Pemeriksaan kebersihan personel',
      'Checklist selesai'
    ]
  },
  {
    id: 'TPL-002',
    divisiId: 'pengolahan',
    divisiNama: 'Divisi Pengolahan',
    judulTemplate: 'Checklist Standar Pengolahan/Memasak SPPG',
    checklists: [
      'Memasak nasi',
      'Memasak lauk',
      'Memasak sayur',
      'Memasak buah jika diperlukan',
      'Pemeriksaan suhu makanan',
      'Pemeriksaan kematangan',
      'Pemeriksaan rasa',
      'Pemeriksaan sanitasi',
      'Checklist selesai'
    ]
  },
  {
    id: 'TPL-003',
    divisiId: 'pemorsian',
    divisiNama: 'Divisi Pemorsian',
    judulTemplate: 'Checklist Standar Pemorsian Ompreng SPPG',
    checklists: [
      'Menyiapkan ompreng',
      'Pemeriksaan ompreng',
      'Pemorsian nasi',
      'Pemorsian lauk',
      'Pemorsian sayur',
      'Pemorsian buah',
      'Pemeriksaan berat porsi',
      'Pemeriksaan kualitas',
      'Menutup ompreng',
      'Checklist selesai'
    ]
  },
  {
    id: 'TPL-004',
    divisiId: 'distribusi',
    divisiNama: 'Divisi Distribusi',
    judulTemplate: 'Checklist Standar Distribusi SPPG',
    checklists: [
      'Pemeriksaan jumlah ompreng',
      'Pemeriksaan kendaraan',
      'Loading kendaraan',
      'Pemeriksaan rute',
      'Pengiriman',
      'Dokumentasi',
      'Serah terima',
      'Konfirmasi penerimaan',
      'Checklist selesai'
    ]
  },
  {
    id: 'TPL-005',
    divisiId: 'cuci_ompreng',
    divisiNama: 'Divisi Cuci Ompreng',
    judulTemplate: 'Checklist Standar Sanitasi & Cuci Ompreng SPPG',
    checklists: [
      'Penerimaan ompreng',
      'Sortir ompreng',
      'Pencucian pertama',
      'Pencucian kedua',
      'Sanitasi',
      'Pengeringan',
      'Penyimpanan',
      'Pemeriksaan akhir',
      'Checklist selesai'
    ]
  }
];

export function createDefaultTasksForDateAndDivisi(tanggal: string, divisiId: TaskTemplate['divisiId']): DivisiTaskRecord {
  const template = initialTaskTemplates.find(t => t.divisiId === divisiId);
  const checklistTexts = template ? template.checklists : [];

  const checklists: TugasChecklistItem[] = checklistTexts.map((text, idx) => ({
    id: `CHK-${divisiId}-${idx + 1}`,
    text,
    completed: idx < 3, // demo first 3 items completed
    jamMulai: idx < 3 ? '06:00' : undefined,
    jamSelesai: idx < 3 ? '07:00' : undefined,
    namaPetugas: idx < 3 ? 'Staf Dapur Operasional' : undefined,
    catatan: idx === 0 ? 'Kondisi bahan segar & lengkap.' : undefined,
    status: idx < 3 ? 'Selesai' : (idx === 3 ? 'Sedang Dikerjakan' : 'Belum Dikerjakan')
  }));

  const defaultPenanggungJawab: Record<string, string> = {
    persiapan: 'Budi Santoso, S.ST',
    pengolahan: 'Chef Hendra Wijaya',
    pemorsian: 'Siti Rahmawati',
    distribusi: 'Rudi Hermawan',
    cuci_ompreng: 'Dewi Sartika'
  };

  const defaultDivisiNama: Record<string, string> = {
    persiapan: 'Divisi Persiapan',
    pengolahan: 'Divisi Pengolahan',
    pemorsian: 'Divisi Pemorsian',
    distribusi: 'Divisi Distribusi',
    cuci_ompreng: 'Divisi Cuci Ompreng'
  };

  return {
    id: `TASK-${tanggal}-${divisiId}`,
    tanggal,
    divisiId,
    divisiNama: defaultDivisiNama[divisiId] || divisiId,
    penanggungJawab: defaultPenanggungJawab[divisiId] || 'Penanggung Jawab Divisi',
    shift: 'Shift 1 (Pagi)',
    statusProduksi: 'Proses Memasak',
    jumlahProduksi: 2500,
    keterangan: 'Pemeriksaan & pelaksanaan operasional rutin divisi.',
    menuHarian: 'Nasi, Ayam Goreng Lengkuas, Sayur Sop Bening, Pisang Ambon',
    checklists,
    updatedAt: new Date().toISOString(),
    createdBy: 'System Default'
  };
}

// --- INITIAL BENEFICIARY DATASETS ---
export const initialBeneficiaryGroups: BeneficiaryGroup[] = [
  { id: 'GRP-001', nama: 'PAUD / TK', kategoriUtama: 'Siswa', klasifikasiPorsi: 'Porsi Kecil', deskripsi: 'Kelompok Anak Usia Dini & Taman Kanak-kanak', urutan: 1, status: 'Aktif' },
  { id: 'GRP-002', nama: 'SD (Kelas 1-3)', kategoriUtama: 'Siswa', klasifikasiPorsi: 'Porsi Kecil', deskripsi: 'Kelompok Siswa Sekolah Dasar Kelas Rendah', urutan: 2, status: 'Aktif' },
  { id: 'GRP-003', nama: 'SD (Kelas 4-6)', kategoriUtama: 'Siswa', klasifikasiPorsi: 'Porsi Besar', deskripsi: 'Kelompok Siswa Sekolah Dasar Kelas Tinggi', urutan: 3, status: 'Aktif' },
  { id: 'GRP-004', nama: 'SMP / MTs', kategoriUtama: 'Siswa', klasifikasiPorsi: 'Porsi Besar', deskripsi: 'Kelompok Siswa Sekolah Menengah Pertama', urutan: 4, status: 'Aktif' },
  { id: 'GRP-005', nama: 'SMA / MA', kategoriUtama: 'Siswa', klasifikasiPorsi: 'Porsi Besar', deskripsi: 'Kelompok Siswa Sekolah Menengah Atas / Madrasah Aliyah', urutan: 5, status: 'Aktif' },
  { id: 'GRP-006', nama: 'BALITA', kategoriUtama: 'Balita', klasifikasiPorsi: 'Balita', deskripsi: 'Kelompok Anak Balita Pemenuhan Gizi', urutan: 6, status: 'Aktif' },
  { id: 'GRP-007', nama: 'IBU HAMIL & MENYUSUI', kategoriUtama: 'Ibu Hamil', klasifikasiPorsi: 'Bumil & Busui', deskripsi: 'Kelompok Ibu Hamil & Ibu Menyusui Penerima Nutrisi', urutan: 7, status: 'Aktif' },
  { id: 'GRP-008', nama: 'GURU / STAF', kategoriUtama: 'Guru / Staf', klasifikasiPorsi: 'Porsi Besar', deskripsi: 'Kelompok Guru dan Staf Tenaga Pendidik', urutan: 8, status: 'Aktif' }
];

export const initialBeneficiaryLocations: BeneficiaryLocation[] = [
  {
    id: 'LOC-001',
    groupId: 'GRP-002',
    groupNama: 'SD',
    namaInstansi: 'SD Zainul Hasan Genggong',
    alamat: 'Jl. Raya Genggong, Pajarakan, Probolinggo',
    kontak: '081234567801',
    kategoriBreakdown: { siswa: 384, guru: 25 },
    defaultJumlah: 409,
    status: 'Aktif'
  },
  {
    id: 'LOC-002',
    groupId: 'GRP-004',
    groupNama: 'SMA / MA',
    namaInstansi: 'MA Model Hafshawaty',
    alamat: 'Kompleks Pesantren Hafshawaty, Probolinggo',
    kontak: '081234567802',
    kategoriBreakdown: { siswa: 218, guru: 25 },
    defaultJumlah: 243,
    status: 'Aktif'
  },
  {
    id: 'LOC-003',
    groupId: 'GRP-003',
    groupNama: 'SMP',
    namaInstansi: 'SMP Zainul Hasan Genggong',
    alamat: 'Jl. Pesantren Genggong, Probolinggo',
    kontak: '081234567803',
    kategoriBreakdown: { siswa: 350, guru: 20 },
    defaultJumlah: 370,
    status: 'Aktif'
  },
  {
    id: 'LOC-004',
    groupId: 'GRP-001',
    groupNama: 'PAUD / TK',
    namaInstansi: 'PAUD Nurul Islam',
    alamat: 'Jl. Masjid Nurul Islam No. 12',
    kontak: '081234567804',
    kategoriBreakdown: { siswa: 95, guru: 8 },
    defaultJumlah: 103,
    status: 'Aktif'
  },
  {
    id: 'LOC-005',
    groupId: 'GRP-005',
    groupNama: 'BALITA',
    namaInstansi: 'Posyandu Melati - Balita',
    alamat: 'Posyandu Melati Desa Karanganyar',
    kontak: '081234567805',
    kategoriBreakdown: { balita: 100 },
    defaultJumlah: 100,
    status: 'Aktif'
  },
  {
    id: 'LOC-006',
    groupId: 'GRP-006',
    groupNama: 'IBU HAMIL',
    namaInstansi: 'Posyandu Melati - Ibu Hamil',
    alamat: 'Posyandu Melati Desa Karanganyar',
    kontak: '081234567806',
    kategoriBreakdown: { ibuHamil: 17 },
    defaultJumlah: 17,
    status: 'Aktif'
  },
  {
    id: 'LOC-007',
    groupId: 'GRP-007',
    groupNama: 'IBU MENYUSUI',
    namaInstansi: 'Posyandu Melati - Ibu Menyusui',
    alamat: 'Posyandu Melati Desa Karanganyar',
    kontak: '081234567807',
    kategoriBreakdown: { ibuMenyusui: 34 },
    defaultJumlah: 34,
    status: 'Aktif'
  }
];

export const createInitialBeneficiariesForDate = (tanggal: string): DailyBeneficiaryRecord[] => {
  return [
    {
      id: `BEN-${tanggal}-001`,
      tanggal,
      groupId: 'GRP-002',
      groupNama: 'SD',
      locationId: 'LOC-001',
      namaInstansi: 'SD Zainul Hasan Genggong',
      kategori: 'Siswa',
      jumlahAwal: 384,
      penambahan: 3,
      pengurangan: 1,
      totalPenerima: 386,
      keterangan: 'Penambahan siswa kelas 6',
      status: 'DRAFT',
      createdBy: 'USR-001',
      createdAt: `${tanggal} 06:30:00`
    },
    {
      id: `BEN-${tanggal}-002`,
      tanggal,
      groupId: 'GRP-008',
      groupNama: 'GURU / STAF',
      locationId: 'LOC-001',
      namaInstansi: 'SD Zainul Hasan Genggong (Guru)',
      kategori: 'Guru / Staf',
      jumlahAwal: 25,
      penambahan: 0,
      pengurangan: 0,
      totalPenerima: 25,
      keterangan: 'Guru dan tenaga kependidikan',
      status: 'DRAFT',
      createdBy: 'USR-001',
      createdAt: `${tanggal} 06:30:00`
    },
    {
      id: `BEN-${tanggal}-003`,
      tanggal,
      groupId: 'GRP-004',
      groupNama: 'SMA / MA',
      locationId: 'LOC-002',
      namaInstansi: 'MA Model Hafshawaty',
      kategori: 'Siswa',
      jumlahAwal: 218,
      penambahan: 0,
      pengurangan: 0,
      totalPenerima: 218,
      keterangan: 'Siswa MA Model',
      status: 'DRAFT',
      createdBy: 'USR-001',
      createdAt: `${tanggal} 06:30:00`
    },
    {
      id: `BEN-${tanggal}-004`,
      tanggal,
      groupId: 'GRP-008',
      groupNama: 'GURU / STAF',
      locationId: 'LOC-002',
      namaInstansi: 'MA Model Hafshawaty (Guru)',
      kategori: 'Guru / Staf',
      jumlahAwal: 25,
      penambahan: 0,
      pengurangan: 0,
      totalPenerima: 25,
      keterangan: 'Guru MA Model',
      status: 'DRAFT',
      createdBy: 'USR-001',
      createdAt: `${tanggal} 06:30:00`
    },
    {
      id: `BEN-${tanggal}-005`,
      tanggal,
      groupId: 'GRP-003',
      groupNama: 'SMP',
      locationId: 'LOC-003',
      namaInstansi: 'SMP Zainul Hasan Genggong',
      kategori: 'Siswa',
      jumlahAwal: 350,
      penambahan: 0,
      pengurangan: 0,
      totalPenerima: 350,
      keterangan: 'Siswa SMP',
      status: 'DRAFT',
      createdBy: 'USR-001',
      createdAt: `${tanggal} 06:30:00`
    },
    {
      id: `BEN-${tanggal}-006`,
      tanggal,
      groupId: 'GRP-001',
      groupNama: 'PAUD / TK',
      locationId: 'LOC-004',
      namaInstansi: 'PAUD Nurul Islam',
      kategori: 'Siswa',
      jumlahAwal: 95,
      penambahan: 0,
      pengurangan: 0,
      totalPenerima: 95,
      keterangan: 'Siswa PAUD',
      status: 'DRAFT',
      createdBy: 'USR-001',
      createdAt: `${tanggal} 06:30:00`
    },
    {
      id: `BEN-${tanggal}-007`,
      tanggal,
      groupId: 'GRP-005',
      groupNama: 'BALITA',
      locationId: 'LOC-005',
      namaInstansi: 'Posyandu Melati - Balita',
      kategori: 'Balita',
      jumlahAwal: 100,
      penambahan: 0,
      pengurangan: 0,
      totalPenerima: 100,
      keterangan: 'Anak balita wilayah kerja',
      status: 'DRAFT',
      createdBy: 'USR-001',
      createdAt: `${tanggal} 06:30:00`
    },
    {
      id: `BEN-${tanggal}-008`,
      tanggal,
      groupId: 'GRP-006',
      groupNama: 'IBU HAMIL',
      locationId: 'LOC-006',
      namaInstansi: 'Posyandu Melati - Ibu Hamil',
      kategori: 'Ibu Hamil',
      jumlahAwal: 17,
      penambahan: 0,
      pengurangan: 0,
      totalPenerima: 17,
      keterangan: 'Ibu hamil terdaftar',
      status: 'DRAFT',
      createdBy: 'USR-001',
      createdAt: `${tanggal} 06:30:00`
    },
    {
      id: `BEN-${tanggal}-009`,
      tanggal,
      groupId: 'GRP-007',
      groupNama: 'IBU MENYUSUI',
      locationId: 'LOC-007',
      namaInstansi: 'Posyandu Melati - Ibu Menyusui',
      kategori: 'Ibu Menyusui',
      jumlahAwal: 34,
      penambahan: 0,
      pengurangan: 0,
      totalPenerima: 34,
      keterangan: 'Ibu menyusui terdaftar',
      status: 'DRAFT',
      createdBy: 'USR-001',
      createdAt: `${tanggal} 06:30:00`
    }
  ];
};

// =========================================================
// INITIAL DATA FOR PERENCANAAN KEBUTUHAN BAHAN PANGAN
// =========================================================

export const initialMasterBahanPangan: MasterBahanPangan[] = [
  { id: 'ING-001', namaBahan: 'Beras kepompong 25kg', kategori: 'Sembako', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 15000, supplier: 'Perum BULOG Probolinggo', lokasi: 'Gudang Central A1', statusAktif: 'Aktif', faktorKonversi: '1 karung = 25 kg' },
  { id: 'ING-002', namaBahan: 'Daging ayam fillet', kategori: 'Lauk Pauk', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 38000, supplier: 'RPA Berkah Unggas', lokasi: 'Cold Storage Freezer 1', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-003', namaBahan: 'Tepung terigu Segitiga Biru 1 Kg', kategori: 'Bahan Olahan', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 13000, supplier: 'Distributor Bogasari', lokasi: 'Gudang Kering A2', statusAktif: 'Aktif', faktorKonversi: '1 pack = 1 kg' },
  { id: 'ING-004', namaBahan: 'Tepung panir 10Kg', kategori: 'Bahan Olahan', satuanPembelian: 'pcs', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 22000, supplier: 'Grosir Bahan Kue', lokasi: 'Gudang Kering A2', statusAktif: 'Aktif', faktorKonversi: '1 sak = 10 kg' },
  { id: 'ING-005', namaBahan: 'Daun pisang', kategori: 'Pelengkap', satuanPembelian: 'ikat', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 5000, supplier: 'Petani Lokal Temenggungan', lokasi: 'Rak Daun & Segar', statusAktif: 'Aktif', faktorKonversi: '1 ikat = 10 lembar' },
  { id: 'ING-006', namaBahan: 'Tahu', kategori: 'Lauk Nabati', satuanPembelian: 'pcs', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 10000, supplier: 'Pengrajin Tahu Temenggungan', lokasi: 'Chiller Dapur', statusAktif: 'Aktif', faktorKonversi: '1 papan = 50 potong' },
  { id: 'ING-007', namaBahan: 'Wortel', kategori: 'Sayuran', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 14000, supplier: 'Mitra Sayur Sukapura', lokasi: 'Chiller Sayuran', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-008', namaBahan: 'Kentang', kategori: 'Sayuran', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 18000, supplier: 'Petani Kentang Bromo', lokasi: 'Rak Sayur Kering', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-009', namaBahan: 'Kelengkeng', kategori: 'Buah', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 35000, supplier: 'Grosir Buah Segar Probolinggo', lokasi: 'Gudang Buah', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-010', namaBahan: 'Minyak goreng filma 2ltr', kategori: 'Minyak & Lemak', satuanPembelian: 'pcs', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 36000, supplier: 'Distributor Sinar Mas', lokasi: 'Gudang Kering B1', statusAktif: 'Aktif', faktorKonversi: '1 pouch = 2 liter' },
  { id: 'ING-011', namaBahan: 'Bumbu kari jepang 40g', kategori: 'Bumbu & Rempah', satuanPembelian: 'pcs', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 12000, supplier: 'Distributor House Foods', lokasi: 'Rak Bumbu', statusAktif: 'Aktif', faktorKonversi: '1 pack = 40 gram' },
  { id: 'ING-012', namaBahan: 'Bawang putih kupas', kategori: 'Bumbu & Rempah', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 38000, supplier: 'Pasar Dringu', lokasi: 'Rak Bumbu', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-013', namaBahan: 'Bawang merah kupas', kategori: 'Bumbu & Rempah', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 34000, supplier: 'Petani Bawang Dringu', lokasi: 'Rak Bumbu', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-014', namaBahan: 'Bawang bombay', kategori: 'Bumbu & Rempah', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 26000, supplier: 'Pasar Maron', lokasi: 'Rak Bumbu', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-015', namaBahan: 'Cabe merah besar', kategori: 'Bumbu & Rempah', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 30000, supplier: 'Pasar Maron', lokasi: 'Chiller Sayur', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-016', namaBahan: 'Jahe', kategori: 'Bumbu & Rempah', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 20000, supplier: 'Pasar Kraksaan', lokasi: 'Rak Bumbu', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-017', namaBahan: 'Kunyit', kategori: 'Bumbu & Rempah', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 16000, supplier: 'Pasar Kraksaan', lokasi: 'Rak Bumbu', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-018', namaBahan: 'Ketumbar', kategori: 'Bumbu & Rempah', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 25000, supplier: 'Grosir Rempah', lokasi: 'Rak Bumbu', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-019', namaBahan: 'Kemiri', kategori: 'Bumbu & Rempah', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 40000, supplier: 'Grosir Rempah', lokasi: 'Rak Bumbu', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-020', namaBahan: 'Daun jeruk', kategori: 'Bumbu & Rempah', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 25000, supplier: 'Kebun Herbal', lokasi: 'Rak Bumbu', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-021', namaBahan: 'Gula', kategori: 'Bumbu & Rempah', satuanPembelian: 'kg', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 17500, supplier: 'PG Gending', lokasi: 'Gudang Kering A2', statusAktif: 'Aktif', faktorKonversi: '1 kg = 1000 gram' },
  { id: 'ING-022', namaBahan: 'Garam cap kapal 250 gr', kategori: 'Bumbu & Rempah', satuanPembelian: 'pcs', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 3000, supplier: 'Grosir Garam', lokasi: 'Rak Bumbu', statusAktif: 'Aktif', faktorKonversi: '1 bungkus = 250 gram' },
  { id: 'ING-023', namaBahan: 'Ladaku', kategori: 'Bumbu & Rempah', satuanPembelian: 'renteng', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 12000, supplier: 'Distributor Motasa', lokasi: 'Rak Bumbu', statusAktif: 'Aktif', faktorKonversi: '1 renteng = 12 sachet' },
  { id: 'ING-024', namaBahan: 'Kaldu jamur totole 200 gr', kategori: 'Bumbu & Rempah', satuanPembelian: 'pcs', satuanPerhitungan: 'gram', bddDefault: 100, hargaDasarPerKg: 18000, supplier: 'PT Totole Berkah', lokasi: 'Rak Bumbu', statusAktif: 'Aktif', faktorKonversi: '1 bungkus = 200 gram' }
];

export const initialMasterMenuResep: MasterMenuResep[] = [
  {
    id: 'MNR-001',
    namaMenu: 'NASI + CHICKEN KATSU (DAUN PISANG) + TAHU GORENG + CURRY WORTEL & KENTANG + KELENGKENG',
    kategoriMenu: 'Standar SPPG Badan Gizi Nasional',
    deskripsi: 'Menu resmi SPPG Probolinggo Krejengan Temenggungan lengkap dengan 4 porsi sasaran (Porsi Kecil, Porsi Besar, Balita, Bumil & Busui).',
    bahanResep: [
      { ingredientId: 'ING-001', ingredientName: 'Beras kepompong 25kg', netWeightGram: 50, bddPercent: 100 },
      { ingredientId: 'ING-002', ingredientName: 'Daging ayam fillet', netWeightGram: 50, bddPercent: 100 },
      { ingredientId: 'ING-003', ingredientName: 'Tepung terigu Segitiga Biru 1 Kg', netWeightGram: 10, bddPercent: 100 },
      { ingredientId: 'ING-004', ingredientName: 'Tepung panir 10Kg', netWeightGram: 10, bddPercent: 100 },
      { ingredientId: 'ING-005', ingredientName: 'Daun pisang', netWeightGram: 5, bddPercent: 100 },
      { ingredientId: 'ING-006', ingredientName: 'Tahu', netWeightGram: 50, bddPercent: 100 },
      { ingredientId: 'ING-007', ingredientName: 'Wortel', netWeightGram: 25, bddPercent: 100 },
      { ingredientId: 'ING-008', ingredientName: 'Kentang', netWeightGram: 25, bddPercent: 100 },
      { ingredientId: 'ING-009', ingredientName: 'Kelengkeng', netWeightGram: 100, bddPercent: 100 },
      { ingredientId: 'ING-010', ingredientName: 'Minyak goreng filma 2ltr', netWeightGram: 15, bddPercent: 100 },
      { ingredientId: 'ING-011', ingredientName: 'Bumbu kari jepang 40g', netWeightGram: 1, bddPercent: 100 },
      { ingredientId: 'ING-012', ingredientName: 'Bawang putih kupas', netWeightGram: 1, bddPercent: 100 },
      { ingredientId: 'ING-013', ingredientName: 'Bawang merah kupas', netWeightGram: 1, bddPercent: 100 },
      { ingredientId: 'ING-014', ingredientName: 'Bawang bombay', netWeightGram: 0.5, bddPercent: 100 },
      { ingredientId: 'ING-015', ingredientName: 'Cabe merah besar', netWeightGram: 0.5, bddPercent: 100 },
      { ingredientId: 'ING-016', ingredientName: 'Jahe', netWeightGram: 0.5, bddPercent: 100 },
      { ingredientId: 'ING-017', ingredientName: 'Kunyit', netWeightGram: 0.5, bddPercent: 100 },
      { ingredientId: 'ING-018', ingredientName: 'Ketumbar', netWeightGram: 0.5, bddPercent: 100 },
      { ingredientId: 'ING-019', ingredientName: 'Kemiri', netWeightGram: 0.5, bddPercent: 100 },
      { ingredientId: 'ING-020', ingredientName: 'Daun jeruk', netWeightGram: 0.5, bddPercent: 100 },
      { ingredientId: 'ING-021', ingredientName: 'Gula', netWeightGram: 1, bddPercent: 100 },
      { ingredientId: 'ING-022', ingredientName: 'Garam cap kapal 250 gr', netWeightGram: 1, bddPercent: 100 },
      { ingredientId: 'ING-023', ingredientName: 'Ladaku', netWeightGram: 0.5, bddPercent: 100 },
      { ingredientId: 'ING-024', ingredientName: 'Kaldu jamur totole 200 gr', netWeightGram: 0.5, bddPercent: 100 }
    ]
  },
  {
    id: 'MNR-002',
    namaMenu: 'NASI + TELUR BALADO + TEMPE BACEM + SUP SAYUR BUNCIS WORTEL + BUAH JERUK',
    kategoriMenu: 'Standar SPPG Harian',
    deskripsi: 'Menu alternatif gizi seimbang dengan protein telur balado, tempe bacem, sayur buncis wortel, dan jeruk manis.',
    bahanResep: [
      { ingredientId: 'ING-001', ingredientName: 'Beras kepompong 25kg', netWeightGram: 50, bddPercent: 100 },
      { ingredientId: 'ING-006', ingredientName: 'Tahu', netWeightGram: 50, bddPercent: 100 },
      { ingredientId: 'ING-007', ingredientName: 'Wortel', netWeightGram: 25, bddPercent: 100 },
      { ingredientId: 'ING-010', ingredientName: 'Minyak goreng filma 2ltr', netWeightGram: 12, bddPercent: 100 },
      { ingredientId: 'ING-012', ingredientName: 'Bawang putih kupas', netWeightGram: 2, bddPercent: 100 },
      { ingredientId: 'ING-013', ingredientName: 'Bawang merah kupas', netWeightGram: 2, bddPercent: 100 },
      { ingredientId: 'ING-021', ingredientName: 'Gula', netWeightGram: 1, bddPercent: 100 },
      { ingredientId: 'ING-022', ingredientName: 'Garam cap kapal 250 gr', netWeightGram: 1, bddPercent: 100 },
      { ingredientId: 'ING-024', ingredientName: 'Kaldu jamur totole 200 gr', netWeightGram: 0.5, bddPercent: 100 }
    ]
  }
];

export const initialNutritionPlans: NutritionPlan[] = [
  {
    id: 'PLAN-20260812-001',
    tanggalPerencanaan: '2026-08-12',
    tanggalPelaksanaan: '2026-08-12',
    menuId: 'MNR-001',
    menuName: 'Menu A (Nasi + Telur Balado + Tahu + Tumis Wortel & Sawi + Susu + Kerupuk)',
    targetGroup: 'Porsi Kecil',
    targetCount: 471,
    periode: 'Harian',
    keterangan: 'Perencanaan distribusi makan siang bergizi sekolah SD Hafshawaty',
    nutritionistId: 'USR-006',
    nutritionistName: 'Rina Wijaya, S.Gz., M.Gizi',
    status: 'Final',
    totalCost: 1850400,
    totalWeightKg: 102.35,
    createdAt: '2026-08-12T07:00:00Z',
    updatedAt: '2026-08-12T07:30:00Z',
    finalizedAt: '2026-08-12T07:30:00Z',
    finalizedBy: 'Rina Wijaya, S.Gz., M.Gizi'
  }
];

export const initialNutritionPlanItems: NutritionPlanItem[] = [
  {
    id: 'PLI-001',
    planId: 'PLAN-20260812-001',
    menuName: 'Menu A (Nasi + Telur Balado)',
    ingredientId: 'ING-001',
    ingredientName: 'Beras Medium Premium',
    targetGroup: 'Porsi Kecil',
    netWeightGram: 50,
    bddPercent: 100,
    grossWeightGram: 50,
    targetCount: 471,
    requiredKg: 23.55,
    pricePerKg: 14800,
    totalPrice: 348540,
    stockAvailable: 100,
    shortageKg: 0,
    status: 'CUKUP',
    notes: 'Stok beras aman'
  },
  {
    id: 'PLI-002',
    planId: 'PLAN-20260812-001',
    menuName: 'Menu A (Nasi + Telur Balado)',
    ingredientId: 'ING-003',
    ingredientName: 'Telur Ayam Ras',
    targetGroup: 'Porsi Kecil',
    netWeightGram: 50,
    bddPercent: 89,
    grossWeightGram: 56.18,
    targetCount: 471,
    requiredKg: 26.46,
    pricePerKg: 28000,
    totalPrice: 740880,
    stockAvailable: 25,
    shortageKg: 1.46,
    status: 'PERLU PENGADAAN',
    notes: 'Defisit 1.46 kg (perlu tambahan 24 butir telur)'
  },
  {
    id: 'PLI-003',
    planId: 'PLAN-20260812-001',
    menuName: 'Menu A (Nasi + Telur Balado)',
    ingredientId: 'ING-004',
    ingredientName: 'Tahu Putih Sutra',
    targetGroup: 'Porsi Kecil',
    netWeightGram: 50,
    bddPercent: 100,
    grossWeightGram: 50,
    targetCount: 471,
    requiredKg: 23.55,
    pricePerKg: 12000,
    totalPrice: 282600,
    stockAvailable: 30,
    shortageKg: 0,
    status: 'CUKUP',
    notes: 'Stok cukup'
  },
  {
    id: 'PLI-004',
    planId: 'PLAN-20260812-001',
    menuName: 'Menu A (Nasi + Telur Balado)',
    ingredientId: 'ING-006',
    ingredientName: 'Wortel Lokal Organik',
    targetGroup: 'Porsi Kecil',
    netWeightGram: 20,
    bddPercent: 88,
    grossWeightGram: 22.73,
    targetCount: 471,
    requiredKg: 10.71,
    pricePerKg: 14000,
    totalPrice: 149940,
    stockAvailable: 12,
    shortageKg: 0,
    status: 'CUKUP',
    notes: 'Stok segar di chiller'
  },
  {
    id: 'PLI-005',
    planId: 'PLAN-20260812-001',
    menuName: 'Menu A (Nasi + Telur Balado)',
    ingredientId: 'ING-007',
    ingredientName: 'Sawi Putih Segar',
    targetGroup: 'Porsi Kecil',
    netWeightGram: 20,
    bddPercent: 80,
    grossWeightGram: 25,
    targetCount: 471,
    requiredKg: 11.78,
    pricePerKg: 10000,
    totalPrice: 117800,
    stockAvailable: 8,
    shortageKg: 3.78,
    status: 'PERLU PENGADAAN',
    notes: 'Defisit 3.78 kg'
  },
  {
    id: 'PLI-006',
    planId: 'PLAN-20260812-001',
    menuName: 'Menu A (Nasi + Telur Balado)',
    ingredientId: 'ING-012',
    ingredientName: 'Susu UHT 200ml Kemasan',
    targetGroup: 'Porsi Kecil',
    netWeightGram: 100,
    bddPercent: 100,
    grossWeightGram: 100,
    targetCount: 471,
    requiredKg: 47.1,
    pricePerKg: 4500,
    totalPrice: 211950,
    stockAvailable: 50,
    shortageKg: 0,
    status: 'CUKUP',
    notes: '471 kotak susu UHT'
  }
];

export const initialBarangDatang: BarangDatang[] = [
  {
    id: 'BD-20260908-001',
    hari: 'Selasa',
    tanggal: '2026-09-08',
    hariTanggalFormatted: 'Selasa, 08 September 2026',
    namaBarang: 'Beras Premium Ramos',
    jumlahMasuk: 200,
    satuan: 'Kg',
    jenisBarang: 'Bahan Baku',
    dokumentasiUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
    keterangan: 'Penerimaan beras karung 25kg x 8 karung, kemasan utuh dan kering',
    petugas: 'Dapur Hafshawaty',
    createdAt: '2026-09-08T08:30:00Z',
    createdBy: 'Dapur Hafshawaty'
  },
  {
    id: 'BD-20260908-002',
    hari: 'Selasa',
    tanggal: '2026-09-08',
    hariTanggalFormatted: 'Selasa, 08 September 2026',
    namaBarang: 'Daging Ayam Broiler Segar',
    jumlahMasuk: 75,
    satuan: 'Kg',
    jenisBarang: 'Bahan Baku',
    dokumentasiUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600',
    keterangan: 'Kondisi dingin segar, sertifikat halal terlampir',
    petugas: 'Staff Logistik',
    createdAt: '2026-09-08T09:15:00Z',
    createdBy: 'Staff Logistik'
  },
  {
    id: 'BD-20260908-003',
    hari: 'Selasa',
    tanggal: '2026-09-08',
    hariTanggalFormatted: 'Selasa, 08 September 2026',
    namaBarang: 'Gas LPG 12 Kg',
    jumlahMasuk: 8,
    satuan: 'Tabung',
    jenisBarang: 'Operasional',
    dokumentasiUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600',
    keterangan: 'Tabung terisi penuh, segel terpasang rapat dan aman',
    petugas: 'Dapur Hafshawaty',
    createdAt: '2026-09-08T10:00:00Z',
    createdBy: 'Dapur Hafshawaty'
  },
  {
    id: 'BD-20260908-004',
    hari: 'Selasa',
    tanggal: '2026-09-08',
    hariTanggalFormatted: 'Selasa, 08 September 2026',
    namaBarang: 'Plastik Wrap & Kemasan Ompreng',
    jumlahMasuk: 15,
    satuan: 'Roll',
    jenisBarang: 'Operasional',
    dokumentasiUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600',
    keterangan: 'Food grade wrapping untuk kemasan box makanan',
    petugas: 'Staff Logistik',
    createdAt: '2026-09-08T11:20:00Z',
    createdBy: 'Staff Logistik'
  },
  {
    id: 'BD-20260907-001',
    hari: 'Senin',
    tanggal: '2026-09-07',
    hariTanggalFormatted: 'Senin, 07 September 2026',
    namaBarang: 'Telur Ayam Ras Fresh',
    jumlahMasuk: 60,
    satuan: 'Tray',
    jenisBarang: 'Bahan Baku',
    dokumentasiUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600',
    keterangan: 'Telur utuh tidak ada yang retak, grade A',
    petugas: 'Dapur Hafshawaty',
    createdAt: '2026-09-07T08:00:00Z',
    createdBy: 'Dapur Hafshawaty'
  },
  {
    id: 'BD-20260907-002',
    hari: 'Senin',
    tanggal: '2026-09-07',
    hariTanggalFormatted: 'Senin, 07 September 2026',
    namaBarang: 'Sabun Cuci Piring Cair 5L',
    jumlahMasuk: 6,
    satuan: 'Jerigen',
    jenisBarang: 'Operasional',
    dokumentasiUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600',
    keterangan: 'Kebutuhan divisi cuci ompreng dan sanitasi dapur',
    petugas: 'Staff Logistik',
    createdAt: '2026-09-07T13:40:00Z',
    createdBy: 'Staff Logistik'
  }
];

// In-Memory Database Controller Singleton
class EnterpriseDataStore {

  public users: User[] = [...initialUsers];
  public roles: RolePermission[] = [...initialRoles];
  public menus: MenuItem[] = [...initialMenus];
  public pegawai: MasterPegawai[] = [...initialPegawai];
  public divisi: MasterDivisi[] = [...initialDivisi];
  public jabatan: MasterJabatan[] = [...initialJabatan];
  public gudang: MasterGudang[] = [...initialGudang];
  public kategori: MasterKategori[] = [...initialKategori];
  public instansi: MasterInstansi[] = [...initialInstansi];
  public suratMasuk: SuratMasuk[] = [...initialSuratMasuk];
  public suratKeluar: SuratKeluar[] = [...initialSuratKeluar];
  public disposisi: Disposisi[] = [...initialDisposisi];
  public templates: TemplateSurat[] = [...initialTemplateSurat];
  public barang: MasterBarang[] = [...initialMasterBarang];
  public stockMovements: StockMovement[] = [...initialStockMovements];
  public opnameSessions: StockOpnameSession[] = [...initialStockOpnameSessions];
  public kendaraan: MasterKendaraan[] = [...initialKendaraan];
  public laporanBbm: LaporanBbm[] = [...initialLaporanBbm];
  public drivers: DriverStaff[] = [...initialDrivers];
  public distributionReports: DistributionReport[] = [...initialDistributionReports];
  public notifications: NotificationItem[] = [...initialNotifications];
  public activityLogs: ActivityLog[] = [...initialActivityLogs];
  public settings: PortalSettings = { ...initialSettings };
  public waDivisiSettings: WhatsAppDivisiSetting[] = [...initialWaDivisiSettings];
  public taskTemplates: TaskTemplate[] = [...initialTaskTemplates];
  public tugasDivisiRecords: DivisiTaskRecord[] = ((): DivisiTaskRecord[] => {
    const todayStr = new Date().toISOString().split('T')[0];
    const divisionIds: TaskTemplate['divisiId'][] = ['persiapan', 'pengolahan', 'pemorsian', 'distribusi', 'cuci_ompreng'];
    return divisionIds.map(divId => createDefaultTasksForDateAndDivisi(todayStr, divId));
  })();

  // --- KEDATANGAN BARANG STORE ---
  public barangDatang: BarangDatang[] = [...initialBarangDatang];

  // --- PENERIMA MANFAAT STORE DATA & METHODS ---
  public beneficiaryGroups: BeneficiaryGroup[] = [...initialBeneficiaryGroups];
  public beneficiaryLocations: BeneficiaryLocation[] = [...initialBeneficiaryLocations];
  public dailyBeneficiaryRecords: DailyBeneficiaryRecord[] = ((): DailyBeneficiaryRecord[] => {
    const todayStr = new Date().toISOString().split('T')[0];
    return createInitialBeneficiariesForDate(todayStr);
  })();
  public beneficiaryAuditLogs: BeneficiaryAuditLog[] = [];
  public beneficiaryLockStatus: Record<string, { status: 'DRAFT' | 'FINAL'; finalizedBy?: string; finalizedAt?: string }> = {};

  // --- NUTRITION & FOOD MATERIAL PLANNING STORE ---
  public masterBahanPangan: MasterBahanPangan[] = [...initialMasterBahanPangan];
  public masterMenuResep: MasterMenuResep[] = [...initialMasterMenuResep];
  public nutritionPlans: NutritionPlan[] = [...initialNutritionPlans];
  public nutritionPlanItems: NutritionPlanItem[] = [...initialNutritionPlanItems];
  public rabPlans: RABPlan[] = [];
  public purchaseOrders: PurchaseOrderDocument[] = [];
  public documentTemplate: MasterDocumentTemplateConfig = JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE_CONFIG));

  // Helper method to compute and construct a synchronized RAB Plan
  public calculateRABPlan(
    tanggal: string,
    customData?: Partial<RABPlan>
  ): RABPlan {
    const defaultTarif: RABTarifConfig = {
      porsiKecil: 10000,
      porsiBesar: 15000,
      balita: 8500,
      bumilBusui: 12500
    };

    const defaultKomposisi: RABKomposisiConfig = {
      bahanPanganPersen: 100, // Penyerapan Pagu Anggaran harus 100% untuk Belanja Bahan Baku
      operasionalPersen: 0,
      kemasanDistribusiPersen: 0
    };

    // 1. Get real-time beneficiary target counts
    const benSummary = this.getBeneficiarySummaryForDate(tanggal);
    const pb = benSummary.portionBreakdown || {
      porsiBesar: 2220,
      porsiKecil: 471,
      balita: 75,
      bumilBusui: 43
    };

    const targetCounts = customData?.targetCounts || {
      porsiKecil: pb.porsiKecil || 471,
      porsiBesar: pb.porsiBesar || 2220,
      balita: pb.balita || 75,
      bumilBusui: pb.bumilBusui || 43,
      total: (pb.porsiKecil || 471) + (pb.porsiBesar || 2220) + (pb.balita || 75) + (pb.bumilBusui || 43)
    };

    const tarifConfig = customData?.tarifConfig || defaultTarif;
    const komposisiConfig = customData?.komposisiConfig || defaultKomposisi;

    // Calculate Total Pagu (Target Penyerapan 100% untuk Belanja Bahan Baku)
    const totalPaguAnggaran = (
      (targetCounts.porsiKecil * tarifConfig.porsiKecil) +
      (targetCounts.porsiBesar * tarifConfig.porsiBesar) +
      (targetCounts.balita * tarifConfig.balita) +
      (targetCounts.bumilBusui * tarifConfig.bumilBusui)
    );

    // Target penyerapan pagu belanja bahan baku adalah 100%
    const targetPenyerapanPagu = totalPaguAnggaran;
    const targetPlafondBahan = totalPaguAnggaran;

    // 2. Get menu name and ingredients from Nutrition Plan or fallback
    const existingPlan = this.nutritionPlans.find(p => p.tanggalPelaksanaan === tanggal);
    const tugasRecs = this.getTugasDivisiForDate(tanggal);
    const tugasMenu = tugasRecs.find(t => t.menuHarian)?.menuHarian;

    const namaMenu = customData?.namaMenu || existingPlan?.menuName || tugasMenu || 'CHICKEN KATSU SAUS KARI JEPANG + TAHU GORENG + TUMIS SAYUR + BUAH KELENGKENG';

    // 3. Build Items Bahan Baku
    let itemsBahanBaku: RABItemBahan[] = [];
    if (customData?.itemsBahanBaku && customData.itemsBahanBaku.length > 0) {
      itemsBahanBaku = customData.itemsBahanBaku.map((it, idx) => {
        const kebutuhanKg = Number(it.kebutuhanKg) || 0;
        const hargaSatuan = Number(it.hargaSatuan) || 0;
        const matchingMaster = this.masterBahanPangan.find(m => m.namaBahan.toLowerCase() === (it.namaBahan || '').toLowerCase());
        const satuan = matchingMaster?.satuanPembelian || it.satuan || 'Kg';
        return {
          ...it,
          no: idx + 1,
          kebutuhanKg,
          satuan,
          hargaSatuan,
          subtotal: Math.round(kebutuhanKg * hargaSatuan)
        };
      });
    } else if (existingPlan?.ingredientsData && existingPlan.ingredientsData.length > 0) {
      itemsBahanBaku = existingPlan.ingredientsData.map((ing: any, idx: number) => {
        const matchingMaster = this.masterBahanPangan.find(m => m.namaBahan.toLowerCase() === (ing.bahanPangan || '').toLowerCase());
        const isTahu = (ing.bahanPangan || '').toLowerCase().includes('tahu');
        
        let kebutuhan: number | null = null;
        if (ing.pembulatan !== undefined && ing.pembulatan !== null && ing.pembulatan !== '-') {
          const rawStr = String(ing.pembulatan).trim();
          if (rawStr) {
            if (rawStr.includes(',') && !rawStr.includes('.')) {
              kebutuhan = Number(rawStr.replace(',', '.'));
            } else if (rawStr.includes('.') && !rawStr.includes(',')) {
              const parts = rawStr.split('.');
              if (parts.length === 2 && parts[1].length === 3 && Number(parts[0]) > 0 && !rawStr.startsWith('0.')) {
                kebutuhan = Number(parts.join(''));
              } else {
                kebutuhan = Number(rawStr);
              }
            } else {
              kebutuhan = Number(rawStr);
            }
          }
        }

        if (kebutuhan === null || isNaN(kebutuhan) || kebutuhan <= 0) {
          if (ing.totalPlusBuffer && !isNaN(Number(ing.totalPlusBuffer)) && Number(ing.totalPlusBuffer) > 0) {
            kebutuhan = Number(ing.totalPlusBuffer);
          } else if (ing.totalKebutuhan && !isNaN(Number(ing.totalKebutuhan)) && Number(ing.totalKebutuhan) > 0) {
            kebutuhan = Number(ing.totalKebutuhan);
          } else {
            kebutuhan = isTahu ? 142 : 10;
          }
        }

        const harga = Number(ing.hargaPerKg || matchingMaster?.hargaDasarPerKg || (isTahu ? 10000 : 15000));
        const satuan = matchingMaster?.satuanPembelian || ing.satuan || 'Kg';

        return {
          no: idx + 1,
          namaBahan: ing.bahanPangan || `Bahan ${idx + 1}`,
          kategori: matchingMaster?.kategori || (isTahu ? 'Lauk Nabati' : 'Bahan Pangan'),
          kebutuhanKg: kebutuhan,
          satuan,
          hargaSatuan: harga,
          subtotal: Math.round(kebutuhan * harga),
          sumberHarga: 'Harga Acuan Pasar SPPG'
        };
      });
    } else {
      // Default standard menu items
      const defaultItems = [
        { namaBahan: 'Beras kepompong 25kg', kategori: 'Sembako', kebutuhanKg: 190, satuan: 'Kg', hargaSatuan: 15000 },
        { namaBahan: 'Daging ayam fillet', kategori: 'Lauk Hewani', kebutuhanKg: 113, satuan: 'Kg', hargaSatuan: 38000 },
        { namaBahan: 'Tepung terigu Segitiga Biru 1 Kg', kategori: 'Bahan Olahan', kebutuhanKg: 50, satuan: 'Kg', hargaSatuan: 13000 },
        { namaBahan: 'Tepung panir 10Kg', kategori: 'Bahan Olahan', kebutuhanKg: 30, satuan: 'Kg', hargaSatuan: 22000 },
        { namaBahan: 'Tahu', kategori: 'Lauk Nabati', kebutuhanKg: 142, satuan: 'Kg', hargaSatuan: 10000 },
        { namaBahan: 'Wortel', kategori: 'Sayuran', kebutuhanKg: 60, satuan: 'Kg', hargaSatuan: 14000 },
        { namaBahan: 'Kentang', kategori: 'Sayuran', kebutuhanKg: 60, satuan: 'Kg', hargaSatuan: 18000 },
        { namaBahan: 'Kelengkeng', kategori: 'Buah Segar', kebutuhanKg: 130, satuan: 'Kg', hargaSatuan: 35000 },
        { namaBahan: 'Minyak goreng filma 2ltr', kategori: 'Minyak & Lemak', kebutuhanKg: 50, satuan: 'Liter', hargaSatuan: 36000 },
        { namaBahan: 'Bumbu kari jepang 40g', kategori: 'Bumbu & Rempah', kebutuhanKg: 10, satuan: 'Pack', hargaSatuan: 12000 },
        { namaBahan: 'Bawang putih & merah kupas', kategori: 'Bumbu & Rempah', kebutuhanKg: 6, satuan: 'Kg', hargaSatuan: 36000 },
        { namaBahan: 'Bumbu pelengkap & garam', kategori: 'Bumbu & Rempah', kebutuhanKg: 5, satuan: 'Kg', hargaSatuan: 15000 }
      ];

      itemsBahanBaku = defaultItems.map((it, idx) => ({
        no: idx + 1,
        namaBahan: it.namaBahan,
        kategori: it.kategori,
        kebutuhanKg: it.kebutuhanKg,
        satuan: it.satuan,
        hargaSatuan: it.hargaSatuan,
        subtotal: Math.round(it.kebutuhanKg * it.hargaSatuan),
        sumberHarga: 'Harga Acuan Pasar'
      }));
    }

    const totalBiayaBahanBaku = itemsBahanBaku.reduce((acc, it) => acc + it.subtotal, 0);

    // Compute bobot persen for each ingredient
    itemsBahanBaku = itemsBahanBaku.map(it => ({
      ...it,
      bobotPersen: totalBiayaBahanBaku > 0 ? Number(((it.subtotal / totalBiayaBahanBaku) * 100).toFixed(1)) : 0
    }));

    // 4. Build Biaya Operasional (Menu Kemasan & BBM Distribusi Dihapus)
    const defaultOperasionalItems: RABBiayaItem[] = [
      { id: 'OPS-01', namaItem: 'Gas LPG 50 Kg / 12 Kg Dapur Industri SPPG', kategori: 'OPERASIONAL', volume: 2, satuan: 'Tabung', hargaSatuan: 850000, subtotal: 1700000, keterangan: 'Bahan bakar memasak kapasitas besar' },
      { id: 'OPS-02', namaItem: 'Listrik, Air Bersih & Sanitasi Dapur', kategori: 'OPERASIONAL', volume: 1, satuan: 'Hari', hargaSatuan: 650000, subtotal: 650000, keterangan: 'Utilitas dapur dan kebersihan standar HACCP' },
      { id: 'OPS-03', namaItem: 'Insentif & Upah Juru Masak / Tim Dapur (15 Orang)', kategori: 'OPERASIONAL', volume: 15, satuan: 'Orang/Hari', hargaSatuan: 175000, subtotal: 2625000, keterangan: 'Tenaga persiapan, pengolahan, dan pemorsian' }
    ];

    const biayaOperasionalItems = customData?.biayaOperasionalItems || defaultOperasionalItems;
    const biayaKemasanDistribusiItems: RABBiayaItem[] = []; // Kemasan & BBM Distribusi Dihapus

    const totalBiayaOperasional = biayaOperasionalItems.reduce((acc, it) => acc + it.subtotal, 0);
    const totalBiayaKemasanDistribusi = 0; // Dihapus

    const cadanganTakTerduga = customData?.cadanganTakTerduga ?? Math.round(totalPaguAnggaran * 0.02); // 2% buffer
    const grandTotalRAB = totalBiayaBahanBaku + totalBiayaOperasional + cadanganTakTerduga;

    const sisaAnggaranPagu = totalPaguAnggaran - totalBiayaBahanBaku;
    const selisihPlafondBahan = sisaAnggaranPagu;
    const persentaseSerapanPagu = totalPaguAnggaran > 0 ? Number(((totalBiayaBahanBaku / totalPaguAnggaran) * 100).toFixed(1)) : 0;
    const persentaseFoodCost = persentaseSerapanPagu;
    const biayaPerPorsiRataRata = targetCounts.total > 0 ? Math.round(grandTotalRAB / targetCounts.total) : 0;

    // Status Evaluation: Penyerapan PAGU Anggaran harus 100%
    let statusKelayakan: 'HEMAT_EFISIEN' | 'OPTIMAL_SESUAI_PAGU' | 'PERINGATAN_OVER_BUDGET' = 'OPTIMAL_SESUAI_PAGU';
    let keteranganStatus = `Penyerapan Pagu Anggaran optimal mencapai ${persentaseSerapanPagu}% dari target 100%.`;

    if (persentaseSerapanPagu > 100) {
      statusKelayakan = 'PERINGATAN_OVER_BUDGET';
      keteranganStatus = `Belanja bahan baku (${persentaseSerapanPagu}%) melebihi Pagu Anggaran 100% (Defisit Rp ${Math.abs(sisaAnggaranPagu).toLocaleString('id-ID')}). Perlu penyesuaian gramatur atau harga satuan.`;
    } else if (persentaseSerapanPagu < 98) {
      statusKelayakan = 'HEMAT_EFISIEN';
      keteranganStatus = `Penyerapan Pagu Anggaran baru mencapai ${persentaseSerapanPagu}% (Target: 100%). Terdapat sisa alokasi Rp ${sisaAnggaranPagu.toLocaleString('id-ID')} yang belum terserap maksimal untuk bahan baku.`;
    } else {
      statusKelayakan = 'OPTIMAL_SESUAI_PAGU';
      keteranganStatus = `Penyerapan Pagu Anggaran sangat presisi & optimal 100% (${persentaseSerapanPagu}%). Seluruh pagu teralokasikan tuntas untuk belanja bahan baku.`;
    }

    // Pareto Top Cost Drivers
    const sortedItems = [...itemsBahanBaku].sort((a, b) => b.subtotal - a.subtotal);
    const topCostDrivers = sortedItems.slice(0, 5).map(it => ({
      namaBahan: it.namaBahan,
      subtotal: it.subtotal,
      persen: totalBiayaBahanBaku > 0 ? Number(((it.subtotal / totalBiayaBahanBaku) * 100).toFixed(1)) : 0
    }));

    const analisis: RABAnalisisKelayakan = {
      totalPaguAnggaran,
      targetPlafondBahan: totalPaguAnggaran,
      targetPenyerapanPagu,
      totalRealisasiBahan: totalBiayaBahanBaku,
      selisihPlafondBahan: sisaAnggaranPagu,
      sisaAnggaranPagu,
      persentaseFoodCost: persentaseSerapanPagu,
      persentaseSerapanPagu,
      biayaPerPorsiRataRata,
      statusKelayakan,
      keteranganStatus,
      topCostDrivers
    };

    const nowStr = new Date().toISOString();
    return {
      id: customData?.id || `RAB-${tanggal.replace(/-/g, '')}-001`,
      tanggalPelaksanaan: tanggal,
      namaMenu,
      status: customData?.status || 'Draft',
      targetCounts,
      tarifConfig,
      komposisiConfig,
      totalPaguAnggaran,
      itemsBahanBaku,
      totalBiayaBahanBaku,
      biayaOperasionalItems,
      totalBiayaOperasional,
      biayaKemasanDistribusiItems,
      totalBiayaKemasanDistribusi,
      cadanganTakTerduga,
      grandTotalRAB,
      analisis,
      catatan: customData?.catatan || 'Rencana Anggaran Belanja (RAB) terintegrasi otomatis dengan Data Sasaran Penerima Manfaat & Lembar Kerja Gizi SPPG.',
      penanggungJawab: customData?.penanggungJawab || {
        nutritionistName: 'Rina Wijaya, S.Gz., M.Gizi',
        kepalaSppgName: 'Sri Rohayu, S. Pd',
        bendaharaName: 'Hj. Siti Aminah, S.E.'
      },
      createdAt: customData?.createdAt || nowStr,
      updatedAt: nowStr,
      approvedAt: customData?.approvedAt,
      approvedBy: customData?.approvedBy
    };
  }

  public getOrCreateRABForDate(tanggal: string): RABPlan {
    const existingIdx = this.rabPlans.findIndex(r => r.tanggalPelaksanaan === tanggal);
    const existingPlan = this.nutritionPlans.find(p => p.tanggalPelaksanaan === tanggal);

    if (existingIdx >= 0) {
      const existingRAB = this.rabPlans[existingIdx];

      // If a nutrition plan exists for this date, automatically sync RAB items with latest ingredientsData (Tabel Pembulatan)
      if (existingPlan && existingPlan.ingredientsData && existingPlan.ingredientsData.length > 0) {
        // Keep custom hargaSatuan if user customized prices in RAB
        const oldPriceMap = new Map<string, number>();
        (existingRAB.itemsBahanBaku || []).forEach(item => {
          if (item.namaBahan) {
            oldPriceMap.set(item.namaBahan.toLowerCase(), item.hargaSatuan);
          }
        });

        const updated = this.calculateRABPlan(tanggal, {
          id: existingRAB.id,
          status: existingRAB.status,
          approvedAt: existingRAB.approvedAt,
          approvedBy: existingRAB.approvedBy,
          createdAt: existingRAB.createdAt,
          biayaOperasionalItems: existingRAB.biayaOperasionalItems,
          catatan: existingRAB.catatan,
          penanggungJawab: existingRAB.penanggungJawab
        });

        if (updated.itemsBahanBaku) {
          updated.itemsBahanBaku = updated.itemsBahanBaku.map(item => {
            const oldPrice = oldPriceMap.get(item.namaBahan.toLowerCase());
            if (oldPrice && oldPrice > 0) {
              const hargaSatuan = oldPrice;
              return {
                ...item,
                hargaSatuan,
                subtotal: Math.round(item.kebutuhanKg * hargaSatuan)
              };
            }
            return item;
          });

          updated.totalBiayaBahanBaku = updated.itemsBahanBaku.reduce((sum, i) => sum + i.subtotal, 0);
          updated.grandTotalRAB = updated.totalBiayaBahanBaku + updated.totalBiayaOperasional + updated.cadanganTakTerduga;
          updated.analisis.totalRealisasiBahan = updated.totalBiayaBahanBaku;
          updated.analisis.selisihPlafondBahan = updated.totalPaguAnggaran - updated.totalBiayaBahanBaku;
          updated.analisis.sisaAnggaranPagu = updated.analisis.selisihPlafondBahan;
          updated.analisis.persentaseSerapanPagu = updated.totalPaguAnggaran > 0 ? Number(((updated.totalBiayaBahanBaku / updated.totalPaguAnggaran) * 100).toFixed(1)) : 0;
          updated.analisis.persentaseFoodCost = updated.analisis.persentaseSerapanPagu;
        }

        this.rabPlans[existingIdx] = updated;
        return updated;
      }

      if (existingRAB && existingRAB.itemsBahanBaku) {
        existingRAB.itemsBahanBaku = existingRAB.itemsBahanBaku.map(item => {
          const matchingMaster = this.masterBahanPangan.find(m => m.namaBahan.toLowerCase() === (item.namaBahan || '').toLowerCase());
          if (matchingMaster && matchingMaster.satuanPembelian) {
            return { ...item, satuan: matchingMaster.satuanPembelian };
          }
          return item;
        });
      }

      return existingRAB;
    }

    const computed = this.calculateRABPlan(tanggal);
    this.rabPlans.push(computed);
    return computed;
  }

  // --- PURCHASE ORDER (PO) CONSOLIDATION & DAILY GENERATION ALGORITHM ---
  public aggregatePeriodPO(startDate: string, datesOverride?: string[]): {
    poBahanBaku: Partial<PurchaseOrderDocument>;
    poOperasional: Partial<PurchaseOrderDocument>;
    dailyPOBahanBaku: PurchaseOrderDocument[];
    dailyPOOperasional: PurchaseOrderDocument[];
    batchId: string;
    periodeDates: string[];
    periodSummary: {
      totalBahanBaku: number;
      totalOperasional: number;
      grandTotal: number;
      totalPorsi5Hari: number;
    };
  } {
    let dates: string[] = [];
    if (datesOverride && datesOverride.length > 0) {
      dates = datesOverride.slice(0, 5);
    } else {
      const start = new Date(startDate || new Date().toISOString().split('T')[0]);
      for (let i = 0; i < 5; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
      }
    }

    const pStart = dates[0];
    const pEnd = dates[dates.length - 1];
    const batchId = `BATCH-${pStart.replace(/-/g, '')}-5D`;

    const defaultSupplier: POSupplier = {
      name: 'KOPERASI KONSUMEN ZANTARA',
      address: 'Dusun Krajan RT/RW 003/004, Temenggungan, Krejengan, Probolinggo',
      contact: '082319871985'
    };

    const defaultShipTo: POShipTo = {
      name: 'SPPG KREJENGAN TEMENGGUNGAN',
      address: 'Kantor Kesekretariatan SPPG, Temenggungan, Krejengan, Probolinggo',
      contact: '082333141643'
    };

    const rabs = dates.map(d => this.getOrCreateRABForDate(d));

    // Array 5 PO Harian Bahan Baku & 5 PO Harian Operasional
    const dailyPOBahanBaku: PurchaseOrderDocument[] = [];
    const dailyPOOperasional: PurchaseOrderDocument[] = [];

    let overallBahanTotal = 0;
    let overallOpsTotal = 0;
    let overallPorsiTotal = 0;

    dates.forEach((d, idx) => {
      const r = rabs[idx];
      const pB = (r.targetCounts?.porsiBesar || 0) + (r.targetCounts?.bumilBusui || 0);
      const pK = (r.targetCounts?.porsiKecil || 0) + (r.targetCounts?.balita || 0);
      const dayPorsi = pB + pK;
      overallPorsiTotal += dayPorsi;

      // Item Bahan Baku Harian
      const itemsBahan: POItem[] = (r.itemsBahanBaku || []).map((item, iIdx) => {
        const key = (item.namaBahan || '').trim().toLowerCase();
        const masterMatch = this.masterBahanPangan.find(m => m.namaBahan.toLowerCase() === key);
        const unit = masterMatch?.satuanPembelian || item.satuan || 'Kg';
        const price = item.hargaSatuan || masterMatch?.hargaDasarPerKg || 0;
        const qty = item.kebutuhanKg || 0;
        return {
          no: iIdx + 1,
          details: item.namaBahan,
          qty: Math.round(qty * 100) / 100,
          unit,
          unitPrice: price,
          totalPrice: Math.round(qty * price),
          category: 'Bahan Baku'
        };
      });

      const dayBahanAmount = itemsBahan.reduce((sum, i) => sum + i.totalPrice, 0);
      overallBahanTotal += dayBahanAmount;

      const dateClean = d.replace(/-/g, '');
      const yearStr = new Date().getFullYear();

      // Hitung tanggal target tiba: 1 hari sebelum tanggal pemesanan/menu (H-1)
      const dParts = d.split('-');
      const menuDateObj = new Date(Number(dParts[0]), Number(dParts[1]) - 1, Number(dParts[2]));
      const arrivalDateObj = new Date(menuDateObj);
      arrivalDateObj.setDate(arrivalDateObj.getDate() - 1);
      const arrY = arrivalDateObj.getFullYear();
      const arrM = String(arrivalDateObj.getMonth() + 1).padStart(2, '0');
      const arrD = String(arrivalDateObj.getDate()).padStart(2, '0');
      const targetArrivalDate = `${arrY}-${arrM}-${arrD}`;

      const dailyPOBahanDoc: PurchaseOrderDocument = {
        id: `PO-${d}-BB-${batchId}`,
        poNumber: `040-H${idx + 1}/PO-SPPG/HAF/${dateClean}`,
        poType: 'Bahan Baku',
        periodeBatchId: batchId,
        dayIndex: idx + 1,
        dayLabel: `Hari ${idx + 1} dari 5 (Menu: ${d} | Tiba: ${targetArrivalDate})`,
        periodeStartDate: pStart,
        periodeEndDate: pEnd,
        periodeDates: dates,
        date: d,
        orderDate: d,
        targetArrivalDate: targetArrivalDate,
        estimatedArrival: `${targetArrivalDate} Pkl 16:00 WIB (H-1)`,
        porsiBesar: pB,
        porsiKecil: pK,
        totalPorsi: dayPorsi,
        menuSummary: r.namaMenu || 'MENU PANGAN SPPG HARIAN',
        supplier: defaultSupplier,
        shipTo: defaultShipTo,
        pemesan: 'Muhammad Fadil, S. Akun',
        approvedBy: 'SRI ROHAYU, S. Pd',
        approvedTitle: 'Kepala Satuan Pelayanan Pemenuhan Gizi',
        items: itemsBahan,
        totalAmount: dayBahanAmount,
        additionalNotes: `Tanggal Pemesanan (Menu): ${d}. Target Tiba / Kedatangan Barang (H-1): ${targetArrivalDate} pkl 16:00 WIB (Satu hari sebelum tanggal masak).`,
        status: 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dailyPOBahanBaku.push(dailyPOBahanDoc);

      // Item Operasional Harian
      const itemsOps: POItem[] = (r.biayaOperasionalItems || []).map((item, oIdx) => ({
        no: oIdx + 1,
        details: item.namaItem,
        qty: Math.round((item.volume || 1) * 100) / 100,
        unit: item.satuan || 'Pack',
        unitPrice: item.hargaSatuan || 0,
        totalPrice: Math.round((item.volume || 1) * (item.hargaSatuan || 0)),
        category: 'Operasional'
      }));

      const dayOpsAmount = itemsOps.reduce((sum, i) => sum + i.totalPrice, 0);
      overallOpsTotal += dayOpsAmount;

      const dailyPOOpsDoc: PurchaseOrderDocument = {
        id: `PO-${d}-OPS-${batchId}`,
        poNumber: `041-H${idx + 1}/PO-SPPG/HAF/${dateClean}`,
        poType: 'Operasional',
        periodeBatchId: batchId,
        dayIndex: idx + 1,
        dayLabel: `Hari ${idx + 1} dari 5 (Menu: ${d} | Tiba: ${targetArrivalDate})`,
        periodeStartDate: pStart,
        periodeEndDate: pEnd,
        periodeDates: dates,
        date: d,
        orderDate: d,
        targetArrivalDate: targetArrivalDate,
        estimatedArrival: `${targetArrivalDate} Pkl 16:00 WIB (H-1)`,
        porsiBesar: pB,
        porsiKecil: pK,
        totalPorsi: dayPorsi,
        menuSummary: `PERLENGKAPAN & OPERASIONAL DAPUR HARIAN (${d})`,
        supplier: defaultSupplier,
        shipTo: defaultShipTo,
        pemesan: 'Muhammad Fadil, S. Akun',
        approvedBy: 'SRI ROHAYU, S. Pd',
        approvedTitle: 'Kepala Satuan Pelayanan Pemenuhan Gizi',
        items: itemsOps,
        totalAmount: dayOpsAmount,
        additionalNotes: `Tanggal Pemesanan (Menu): ${d}. Target Tiba / Kedatangan Barang (H-1): ${targetArrivalDate} pkl 16:00 WIB.`,
        status: 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      dailyPOOperasional.push(dailyPOOpsDoc);
    });

    // Integrated / Summary fallback objects for 5-Day Period
    const poBahanBaku: Partial<PurchaseOrderDocument> = {
      poType: 'Bahan Baku',
      periodeBatchId: batchId,
      periodeStartDate: pStart,
      periodeEndDate: pEnd,
      periodeDates: dates,
      poNumber: `040-BATCH/PO-SPPG/HAF/${pStart.replace(/-/g, '')}`,
      date: pStart,
      estimatedArrival: `${pStart} s/d ${pEnd}`,
      porsiBesar: dailyPOBahanBaku.reduce((s, d) => s + d.porsiBesar, 0),
      porsiKecil: dailyPOBahanBaku.reduce((s, d) => s + d.porsiKecil, 0),
      totalPorsi: overallPorsiTotal,
      menuSummary: dailyPOBahanBaku.map(d => `${d.dayLabel.split(' ')[0]}: ${d.menuSummary}`).join(' | '),
      supplier: defaultSupplier,
      shipTo: defaultShipTo,
      pemesan: 'Muhammad Fadil, S. Akun',
      approvedBy: 'SRI ROHAYU, S. Pd',
      approvedTitle: 'Kepala Satuan Pelayanan Pemenuhan Gizi',
      items: dailyPOBahanBaku[0]?.items || [],
      totalAmount: overallBahanTotal,
      status: 'Draft'
    };

    const poOperasional: Partial<PurchaseOrderDocument> = {
      poType: 'Operasional',
      periodeBatchId: batchId,
      periodeStartDate: pStart,
      periodeEndDate: pEnd,
      periodeDates: dates,
      poNumber: `041-BATCH/PO-SPPG/HAF/${pStart.replace(/-/g, '')}`,
      date: pStart,
      estimatedArrival: `${pStart} s/d ${pEnd}`,
      porsiBesar: dailyPOOperasional.reduce((s, d) => s + d.porsiBesar, 0),
      porsiKecil: dailyPOOperasional.reduce((s, d) => s + d.porsiKecil, 0),
      totalPorsi: overallPorsiTotal,
      menuSummary: 'OPERASIONAL DAPUR PERIODE 5 HARI (SISTEM HARIAN)',
      supplier: defaultSupplier,
      shipTo: defaultShipTo,
      pemesan: 'Muhammad Fadil, S. Akun',
      approvedBy: 'SRI ROHAYU, S. Pd',
      approvedTitle: 'Kepala Satuan Pelayanan Pemenuhan Gizi',
      items: dailyPOOperasional[0]?.items || [],
      totalAmount: overallOpsTotal,
      status: 'Draft'
    };

    return {
      batchId,
      poBahanBaku,
      poOperasional,
      dailyPOBahanBaku,
      dailyPOOperasional,
      periodeDates: dates,
      periodSummary: {
        totalBahanBaku: overallBahanTotal,
        totalOperasional: overallOpsTotal,
        grandTotal: overallBahanTotal + overallOpsTotal,
        totalPorsi5Hari: overallPorsiTotal
      }
    };
  }

  public ensureInitialPOs() {
    if (this.purchaseOrders.length === 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const aggregated = this.aggregatePeriodPO(todayStr);
      const allDaily = [...aggregated.dailyPOBahanBaku, ...aggregated.dailyPOOperasional];
      allDaily.forEach((po, idx) => {
        if (idx === 0 || idx === 5) {
          po.status = 'Dikonfirmasi Admin';
          po.adminConfirmation = {
            isConfirmed: true,
            confirmedAt: new Date(Date.now() - 3600000).toISOString(),
            confirmedBy: 'SRI ROHAYU, S. Pd',
            notes: 'PO telah diverifikasi dan dikonfirmasi Admin SPPG untuk segera dibelanjakan oleh Supplier.'
          };
        } else if (idx === 1 || idx === 6) {
          po.status = 'Diproses Belanja';
          po.adminConfirmation = {
            isConfirmed: true,
            confirmedAt: new Date(Date.now() - 7200000).toISOString(),
            confirmedBy: 'SRI ROHAYU, S. Pd',
            notes: 'Disetujui belanja pasar subuh.'
          };
          po.supplierShoppingStatus = {
            isAccepted: true,
            acceptedAt: new Date(Date.now() - 5400000).toISOString(),
            acceptedBy: 'Budi Santoso (Koperasi Zantara)',
            isShopping: true,
            shoppingStartedAt: new Date(Date.now() - 1800000).toISOString(),
            checkedItemIndexes: [0, 1, 2]
          };
        } else {
          po.status = 'Draft';
        }
        this.purchaseOrders.push(po);
      });
    }
  }

  public getAllPO(): PurchaseOrderDocument[] {
    this.ensureInitialPOs();
    return this.purchaseOrders;
  }

  public getSupplierPortalPOs(): PurchaseOrderDocument[] {
    this.ensureInitialPOs();
    return this.purchaseOrders.filter(p => p.status !== 'Draft');
  }

  public confirmPOByAdmin(poId: string, confirmedBy?: string, notes?: string): PurchaseOrderDocument | null {
    this.ensureInitialPOs();
    const targetPOs = this.purchaseOrders.filter(p => p.id === poId || p.poNumber === poId || p.periodeBatchId === poId);
    if (targetPOs.length === 0) return null;

    const now = new Date().toISOString();
    targetPOs.forEach(po => {
      po.status = 'Dikonfirmasi Admin';
      po.adminConfirmation = {
        isConfirmed: true,
        confirmedAt: now,
        confirmedBy: confirmedBy || 'SRI ROHAYU, S. Pd (Kepala SPPG)',
        notes: notes || 'PO telah diverifikasi dan dikonfirmasi resmi oleh Admin SPPG untuk dibelanjakan oleh Supplier.'
      };
      po.updatedAt = now;
    });

    this.addNotification(
      'Perencanaan Bahan',
      'PO Dikonfirmasi Admin SPPG',
      `PO ${targetPOs[0].poNumber} telah dikonfirmasi oleh Admin dan sekarang tampil di Status Pemesanan Portal Supplier.`,
      'success',
      '/portal-supplier'
    );

    return targetPOs[0];
  }

  public confirmPOBatchByAdmin(poIds: string[], confirmedBy?: string, notes?: string): PurchaseOrderDocument[] {
    this.ensureInitialPOs();
    const confirmed: PurchaseOrderDocument[] = [];
    poIds.forEach(id => {
      const res = this.confirmPOByAdmin(id, confirmedBy, notes);
      if (res && !confirmed.some(c => c.id === res.id)) {
        confirmed.push(res);
      }
    });
    return confirmed;
  }

  public updatePOSupplierShoppingProgress(
    poId: string,
    status: PurchaseOrderDocument['status'],
    supplierData?: {
      acceptedBy?: string;
      driverName?: string;
      driverPhone?: string;
      driverPlate?: string;
      checkedItemIndexes?: number[];
      notes?: string;
    }
  ): PurchaseOrderDocument | null {
    this.ensureInitialPOs();
    const targetPOs = this.purchaseOrders.filter(p => p.id === poId || p.poNumber === poId);
    if (targetPOs.length === 0) return null;

    const now = new Date().toISOString();
    targetPOs.forEach(po => {
      po.status = status;
      po.supplierShoppingStatus = {
        ...(po.supplierShoppingStatus || {}),
        isAccepted: true,
        acceptedAt: po.supplierShoppingStatus?.acceptedAt || now,
        acceptedBy: supplierData?.acceptedBy || po.supplierShoppingStatus?.acceptedBy || 'Petugas Pengadaan Supplier',
        isShopping: status === 'Diproses Belanja' || po.supplierShoppingStatus?.isShopping,
        shoppingStartedAt: status === 'Diproses Belanja' ? now : po.supplierShoppingStatus?.shoppingStartedAt,
        isDispatched: status === 'Dikirim Supplier' || po.supplierShoppingStatus?.isDispatched,
        dispatchedAt: status === 'Dikirim Supplier' ? now : po.supplierShoppingStatus?.dispatchedAt,
        driverName: supplierData?.driverName || po.supplierShoppingStatus?.driverName,
        driverPhone: supplierData?.driverPhone || po.supplierShoppingStatus?.driverPhone,
        driverPlate: supplierData?.driverPlate || po.supplierShoppingStatus?.driverPlate,
        checkedItemIndexes: supplierData?.checkedItemIndexes !== undefined ? supplierData.checkedItemIndexes : po.supplierShoppingStatus?.checkedItemIndexes,
        notes: supplierData?.notes || po.supplierShoppingStatus?.notes
      };

      if (status === 'Dikonfirmasi Supplier') {
        po.supplierConfirmation = {
          isConfirmed: true,
          confirmedAt: now,
          confirmedBy: supplierData?.acceptedBy || 'Koperasi Zantara',
          notes: supplierData?.notes || 'Pesanan telah diterima & disanggupi untuk dibelanjakan'
        };
      }
      po.updatedAt = now;
    });

    return targetPOs[0];
  }

  public savePOBatch(batch: Partial<PurchaseOrderDocument>[]): PurchaseOrderDocument[] {
    const saved: PurchaseOrderDocument[] = [];
    batch.forEach(item => {
      saved.push(this.savePO(item));
    });
    return saved;
  }

  public confirmPOBySupplier(poId: string, confirmedBy?: string, notes?: string): PurchaseOrderDocument | null {
    const targetPOs = this.purchaseOrders.filter(p => p.id === poId || p.poNumber === poId || p.periodeBatchId === poId);
    if (targetPOs.length === 0) return null;

    const now = new Date().toISOString();
    targetPOs.forEach(po => {
      po.status = 'Dikonfirmasi Supplier';
      po.supplierConfirmation = {
        isConfirmed: true,
        confirmedAt: now,
        confirmedBy: confirmedBy || 'Koperasi Zantara',
        notes: notes || 'PO Harian telah diterima dan disetujui untuk dikirimkan sesuai jadwal.'
      };
      po.updatedAt = now;
    });

    return targetPOs[0];
  }

  public savePO(data: Partial<PurchaseOrderDocument>): PurchaseOrderDocument {
    const existingIdx = this.purchaseOrders.findIndex(p => p.id === data.id);
    const now = new Date().toISOString();

    const orderDate = data.orderDate || data.date || now.split('T')[0];
    let targetArrivalDate = data.targetArrivalDate;
    if (!targetArrivalDate && orderDate) {
      const parts = orderDate.split('-');
      if (parts.length === 3) {
        const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        dObj.setDate(dObj.getDate() - 1);
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, '0');
        const d = String(dObj.getDate()).padStart(2, '0');
        targetArrivalDate = `${y}-${m}-${d}`;
      }
    }

    const poDoc: PurchaseOrderDocument = {
      id: data.id || `PO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      poNumber: data.poNumber || `PO-${Date.now()}`,
      poType: data.poType || 'Bahan Baku',
      periodeStartDate: data.periodeStartDate || now.split('T')[0],
      periodeEndDate: data.periodeEndDate || now.split('T')[0],
      periodeDates: data.periodeDates || [],
      date: orderDate,
      orderDate: orderDate,
      targetArrivalDate: targetArrivalDate || orderDate,
      estimatedArrival: data.estimatedArrival || (targetArrivalDate ? `${targetArrivalDate} Pkl 16:00 WIB (H-1)` : now.split('T')[0]),
      porsiBesar: data.porsiBesar || 0,
      porsiKecil: data.porsiKecil || 0,
      totalPorsi: (data.porsiBesar || 0) + (data.porsiKecil || 0),
      menuSummary: data.menuSummary || '',
      supplier: data.supplier || { name: 'KOPERASI KONSUMEN ZANTARA', address: '', contact: '' },
      shipTo: data.shipTo || { name: 'SPPG KREJENGAN TEMENGGUNGAN', address: '', contact: '' },
      pemesan: data.pemesan || 'Muhammad Fadil, S. Akun',
      approvedBy: data.approvedBy || 'SRI ROHAYU, S. Pd',
      approvedTitle: data.approvedTitle || 'Kepala Satuan Pelayanan Pemenuhan Gizi',
      items: data.items || [],
      totalAmount: data.totalAmount || (data.items || []).reduce((sum, i) => sum + i.totalPrice, 0),
      additionalNotes: data.additionalNotes || '',
      status: data.status || 'Draft',
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    if (existingIdx >= 0) {
      this.purchaseOrders[existingIdx] = poDoc;
    } else {
      this.purchaseOrders.unshift(poDoc);
    }

    return poDoc;
  }

  public deletePO(id: string): boolean {
    const initialLen = this.purchaseOrders.length;
    this.purchaseOrders = this.purchaseOrders.filter(p => p.id !== id);
    return this.purchaseOrders.length < initialLen;
  }


  public getTargetCountForDateAndGroup(tanggal: string, groupNama: string): number {
    const summary = this.getBeneficiarySummaryForDate(tanggal);
    const pb = summary.portionBreakdown;
    const target = (groupNama || '').toUpperCase();

    let count = 0;
    if (target.includes('PORSI BESAR') || target.includes('SD KELAS 4-6') || target.includes('SMA') || target.includes('SMP')) {
      count = pb?.porsiBesar || 0;
    } else if (target.includes('PORSI KECIL') || target.includes('SD KELAS 1-3') || target.includes('PAUD') || target.includes('TK')) {
      count = pb?.porsiKecil || 0;
    } else if (target.includes('BALITA')) {
      count = pb?.balita || 0;
    } else if (target.includes('HAMIL') || target.includes('MENYUSUI') || target.includes('BUMIL') || target.includes('BUSUI')) {
      count = pb?.bumilBusui || 0;
    } else if (target.includes('GURU') || target.includes('STAF')) {
      count = summary.totalGuru || 0;
    } else {
      const recs = this.getBeneficiaryRecordsForDate(tanggal);
      const filtered = recs.filter(r => {
        const gName = (r.groupNama || '').toUpperCase();
        return gName.includes(target) || target.includes(gName) || (r.kategori && r.kategori.toUpperCase().includes(target));
      });
      if (filtered.length > 0) {
        count = filtered.reduce((acc, curr) => acc + curr.totalPenerima, 0);
      } else {
        count = summary.totalPenerima || 0;
      }
    }

    // Fallback: calculate directly from beneficiaryGroups & lembagaList if count is 0
    if (count === 0 && Array.isArray(this.beneficiaryGroups) && this.beneficiaryGroups.length > 0) {
      let fallbackSum = 0;
      this.beneficiaryGroups.forEach(g => {
        const gKlas = g.klasifikasiPorsi || 'Porsi Besar';
        const isMatch = (
          (target.includes('PORSI BESAR') && gKlas === 'Porsi Besar') ||
          (target.includes('PORSI KECIL') && gKlas === 'Porsi Kecil') ||
          (target.includes('BALITA') && (gKlas === 'Balita' || g.nama.toUpperCase().includes('BALITA'))) ||
          ((target.includes('BUMIL') || target.includes('BUSUI') || target.includes('HAMIL') || target.includes('MENYUSUI')) && (gKlas === 'Bumil & Busui' || g.nama.toUpperCase().includes('HAMIL') || g.nama.toUpperCase().includes('MENYUSUI')))
        );
        if (isMatch) {
          if (Array.isArray(g.lembagaList) && g.lembagaList.length > 0) {
            g.lembagaList.forEach(l => {
              const tSiswa = Number(l.targetSiswa) || 0;
              const tGuru = Number(l.targetGuru) || 0;
              const tBalita = Number(l.targetBalita) || 0;
              const tBumil = Number(l.targetBumilBusui) || 0;
              if (target.includes('BALITA')) fallbackSum += (tBalita || tSiswa);
              else if (target.includes('BUMIL') || target.includes('BUSUI') || target.includes('HAMIL')) fallbackSum += (tBumil || tSiswa);
              else fallbackSum += (tSiswa + tGuru);
            });
          }
        }
      });
      if (fallbackSum > 0) return fallbackSum;
    }

    if (count > 0) return count;

    if (target.includes('PORSI BESAR')) return 618;
    if (target.includes('PORSI KECIL')) return 481;
    if (target.includes('BALITA')) return 100;
    if (target.includes('BUMIL') || target.includes('BUSUI')) return 51;

    return summary.totalPenerima || 1250;
  }

  public getBeneficiaryRecordsForDate(tanggal: string): DailyBeneficiaryRecord[] {
    return this.dailyBeneficiaryRecords.filter(r => r.tanggal === tanggal);
  }

  public getBeneficiarySummaryForDate(tanggal: string): DailyBeneficiarySummary {
    let recs = this.getBeneficiaryRecordsForDate(tanggal);
    if (recs.length === 0) {
      recs = this.copyBeneficiaryFromPreviousDay(tanggal);
    }
    const lockInfo = this.beneficiaryLockStatus[tanggal] || { status: 'DRAFT' };

    let totalPenerima = 0;
    let totalBalita = 0;
    let totalIbuHamil = 0;
    let totalIbuMenyusui = 0;
    let totalSiswa = 0;
    let totalGuru = 0;

    const groupSet = new Set<string>();
    const instansiSet = new Set<string>();

    let porsiBesar = 0;
    let porsiKecil = 0;

    recs.forEach(r => {
      totalPenerima += r.totalPenerima;
      groupSet.add(r.groupId);
      instansiSet.add(r.namaInstansi);

      const upperGroup = (r.groupNama || '').toUpperCase();

      const loc = this.beneficiaryLocations.find(l => l.id === r.locationId || l.namaInstansi === r.namaInstansi);
      const grp = this.beneficiaryGroups.find(g => g.id === r.groupId || g.nama.toUpperCase() === upperGroup);
      const klas = loc?.klasifikasiPorsi || grp?.klasifikasiPorsi;

      if (klas === 'Balita' || r.kategori === 'Balita' || upperGroup.includes('BALITA')) {
        totalBalita += r.totalPenerima;
      } else if (klas === 'Bumil & Busui' || r.kategori === 'Ibu Hamil' || r.kategori === 'Ibu Menyusui' || upperGroup.includes('HAMIL') || upperGroup.includes('MENYUSUI') || upperGroup.includes('BUSUI')) {
        if (r.kategori === 'Ibu Menyusui' || upperGroup.includes('MENYUSUI')) {
          totalIbuMenyusui += r.totalPenerima;
        } else {
          totalIbuHamil += r.totalPenerima;
        }
      } else if (r.kategori === 'Guru / Staf' || upperGroup.includes('GURU')) {
        totalGuru += r.totalPenerima;
        if (klas === 'Porsi Kecil') {
          porsiKecil += r.totalPenerima;
        } else {
          porsiBesar += r.totalPenerima;
        }
      } else {
        totalSiswa += r.totalPenerima;
        if (klas === 'Porsi Kecil' || upperGroup.includes('PAUD') || upperGroup.includes('TK') || upperGroup.includes('KELAS 1-3')) {
          porsiKecil += r.totalPenerima;
        } else {
          porsiBesar += r.totalPenerima;
        }
      }
    });

    return {
      tanggal,
      totalPenerima,
      totalPorsi: totalPenerima,
      totalKelompok: groupSet.size,
      totalInstansi: instansiSet.size,
      totalBalita,
      totalIbuHamil,
      totalIbuMenyusui,
      totalSiswa,
      totalGuru,
      portionBreakdown: {
        porsiBesar,
        porsiKecil,
        balita: totalBalita,
        bumilBusui: totalIbuHamil + totalIbuMenyusui
      },
      statusLock: lockInfo.status,
      finalizedBy: lockInfo.finalizedBy,
      finalizedAt: lockInfo.finalizedAt
    };
  }

  public copyBeneficiaryFromPreviousDay(targetDate: string, sourceDate?: string): DailyBeneficiaryRecord[] {
    let sourceRecs: DailyBeneficiaryRecord[] = [];
    if (sourceDate) {
      sourceRecs = this.getBeneficiaryRecordsForDate(sourceDate);
    } else {
      const availableDates = Array.from(new Set(this.dailyBeneficiaryRecords.map(r => r.tanggal)))
        .filter(d => d < targetDate)
        .sort((a, b) => b.localeCompare(a));

      if (availableDates.length > 0) {
        sourceRecs = this.getBeneficiaryRecordsForDate(availableDates[0]);
      } else if (this.dailyBeneficiaryRecords.length > 0) {
        sourceRecs = this.dailyBeneficiaryRecords;
      }
    }

    if (sourceRecs.length === 0) {
      const created = createInitialBeneficiariesForDate(targetDate);
      this.dailyBeneficiaryRecords.push(...created);
      return created;
    }

    this.dailyBeneficiaryRecords = this.dailyBeneficiaryRecords.filter(r => r.tanggal !== targetDate);

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newRecords: DailyBeneficiaryRecord[] = sourceRecs.map((src, idx) => ({
      ...src,
      id: `BEN-${targetDate}-${String(idx + 1).padStart(3, '0')}`,
      tanggal: targetDate,
      penambahan: 0,
      pengurangan: 0,
      totalPenerima: src.jumlahAwal,
      status: 'DRAFT',
      createdBy: 'System Copy',
      createdAt: nowStr,
      updatedBy: undefined,
      updatedAt: undefined
    }));

    this.dailyBeneficiaryRecords.push(...newRecords);
    return newRecords;
  }

  public getTugasDivisiForDate(tanggal: string): DivisiTaskRecord[] {
    return this.tugasDivisiRecords.filter(r => r.tanggal === tanggal);
  }

  public getOrCreateTugasDivisiForDate(tanggal: string): DivisiTaskRecord[] {
    let records = this.getTugasDivisiForDate(tanggal);
    if (records.length === 0) {
      const divisionIds: TaskTemplate['divisiId'][] = ['persiapan', 'pengolahan', 'pemorsian', 'distribusi', 'cuci_ompreng'];
      const newRecords = divisionIds.map(divId => createDefaultTasksForDateAndDivisi(tanggal, divId));
      this.tugasDivisiRecords.push(...newRecords);
      return newRecords;
    }
    return records;
  }

  public sanitizeCategories() {
    this.kategori = [...initialKategori];
    if (Array.isArray(this.barang)) {
      this.barang.forEach(b => {
        const kName = (b.kategoriNama || '').toLowerCase();
        const bName = (b.namaBarang || '').toLowerCase();
        const isOps = kName.includes('operasional') || kName.includes('hardware') || kName.includes('atk') ||
                      kName.includes('cetakan') || kName.includes('konsumabel') ||
                      bName.includes('laptop') || bName.includes('scanner') || bName.includes('kertas') || bName.includes('map');
        if (isOps) {
          b.kategoriId = 'KAT-002';
          b.kategoriNama = 'Operasional';
        } else {
          b.kategoriId = 'KAT-001';
          b.kategoriNama = 'Bahan Baku';
        }
      });
    }
  }

  constructor() {
    this.sanitizeCategories();
  }

  public addLog(userId: string, namaUser: string, modul: string, aktivitas: string, detail?: string, ipAddress = '127.0.0.1', status: 'Sukses' | 'Gagal' = 'Sukses') {
    const now = new Date();
    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}`,
      userId,
      namaUser,
      modul,
      aktivitas,
      detail: detail || aktivitas,
      tanggal: now.toISOString().split('T')[0],
      jam: now.toTimeString().split(' ')[0],
      browser: 'Web Browser / REST Client',
      ipAddress,
      status
    };
    this.activityLogs.unshift(newLog);
  }

  public addNotification(modul: NotificationItem['modul'], judul: string, pesan: string, tipe: NotificationItem['tipe'] = 'info', linkUrl?: string) {
    const now = new Date();
    const newNtf: NotificationItem = {
      id: `NTF-${Date.now()}`,
      modul,
      judul,
      pesan,
      tipe,
      isRead: false,
      createdAt: `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`,
      linkUrl
    };
    this.notifications.unshift(newNtf);
  }

  public addBarangDatang(item: Omit<BarangDatang, 'id' | 'createdAt'>): BarangDatang {
    const now = new Date();
    const cleanDate = (item.tanggal || now.toISOString().split('T')[0]).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const id = `BD-${cleanDate}-${rand}`;
    const newItem: BarangDatang = {
      ...item,
      id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    this.barangDatang.unshift(newItem);
    return newItem;
  }

  public updateBarangDatang(id: string, updates: Partial<BarangDatang>): BarangDatang | null {
    const idx = this.barangDatang.findIndex(b => b.id === id);
    if (idx === -1) return null;
    this.barangDatang[idx] = {
      ...this.barangDatang[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.barangDatang[idx];
  }

  public deleteBarangDatang(id: string): boolean {
    const prevLen = this.barangDatang.length;
    this.barangDatang = this.barangDatang.filter(b => b.id !== id);
    return this.barangDatang.length < prevLen;
  }
}

export const dbStore = new EnterpriseDataStore();
