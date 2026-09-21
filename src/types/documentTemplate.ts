export interface InstitutionProfile {
  namaInstansi: string;
  namaSppg: string;
  namaYayasan: string;
  alamat: string;
  rtRw: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  nomorTelepon: string;
  email: string;
  website: string;
  penanggungJawabNama: string;
  penanggungJawabJabatan: string;
  penanggungJawabNip?: string;
}

export interface LetterheadSettings {
  logoUrl: string;
  logoSize: number; // in px, default 68
  logoPosition: 'left' | 'center' | 'right';
  showLogo: boolean;
  namaInstansi: string;
  namaSppg: string;
  namaYayasan: string;
  alamatLengkap: string;
  showContactInfo: boolean;
  fontFamily: 'Arial, sans-serif' | 'Times New Roman, serif' | 'Calibri, sans-serif' | 'Courier New, monospace' | 'inherit';
  instansiFontSize: number; // in px, default 15
  sppgFontSize: number; // in px, default 13
  yayasanFontSize: number; // in px, default 12
  alamatFontSize: number; // in px, default 10
  isBoldInstansi: boolean;
  isBoldSppg: boolean;
  isBoldYayasan: boolean;
  isItalicAlamat: boolean;
  textAlign: 'left' | 'center' | 'right';
  lineSpacing: 'tight' | 'normal' | 'relaxed';
  gapLogoWithText: number; // in px, default 16
  borderThickness: number; // in px, default 3
  borderStyle: 'solid' | 'double' | 'dashed';
  borderColor: string; // default '#0f172a'
  kopMarginBottom: number; // in px, default 16
  repeatOnEveryPage: boolean; // default false
}

export interface DocumentFormatSettings {
  paperSize: 'A4' | 'F4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  marginTop: number; // in mm, default 18
  marginBottom: number; // in mm, default 18
  marginLeft: number; // in mm, default 18
  marginRight: number; // in mm, default 18
  defaultFontFamily: string;
  defaultFontSize: number; // in pt, default 10
  fontColor: string; // default '#0f172a'
  lineHeight: number; // default 1.4
  paragraphSpacing: number; // default 8
  tableFontSize: number; // in pt, default 9
  tableBorderWidth: number; // in px, default 1
  tableBorderColor: string; // default '#334155'
  tableHeaderBg: string; // default '#f1f5f9'
  tableCellPadding: number; // in px, default 6
}

export interface FooterSettings {
  showFooter: boolean;
  showPageNumber: boolean;
  pageNumberFormat: 'Halaman {page} dari {total}' | 'Hal. {page}/{total}' | 'Page {page}' | '{page}';
  showPrintDate: boolean;
  printDateFormat: 'DD MMMM YYYY, HH:mm' | 'YYYY-MM-DD HH:mm';
  customDocumentNote: string;
  isConfidential: boolean;
  confidentialText: string;
  footerAlignment: 'left' | 'center' | 'between';
}

export interface DocumentNumberingSettings {
  prefix: string; // e.g. 'SPPG-TMG'
  counterLength: number; // e.g. 3 -> 001
  currentCounters: Record<string, number>;
  monthFormat: 'roman' | 'number' | 'none'; // 'IX' or '09'
  yearFormat: 'YYYY' | 'YY';
  separator: '/' | '-' | '.';
  formatPattern: string; // '{counter}/{prefix}/{code}/{month}/{year}'
  resetInterval: 'year' | 'month' | 'never';
  lastResetDate: string;
}

export interface MasterSignature {
  id: string;
  nama: string;
  jabatan: string;
  nip?: string;
  keterangan: string; // e.g. 'Mengetahui', 'Disetujui Oleh', 'Dibuat Oleh'
  signatureImageUrl?: string;
  stampImageUrl?: string;
  isActive: boolean;
  isDefault: boolean;
  order: number;
}

export interface DocumentTypeTemplate {
  id: string;
  code: string; // e.g. 'STOK', 'BBM', 'DIV', 'MENU', 'PO', 'RAB', 'BA'
  name: string;
  category: 'Logistik & Stok' | 'Operasional & Menu' | 'Pengadaan & PO' | 'Keuangan & BBM' | 'Surat & Administrasi';
  enableLetterhead: boolean;
  enableFooter: boolean;
  enableAutoNumber: boolean;
  paperSize: 'A4' | 'F4' | 'Letter' | 'default';
  orientation: 'portrait' | 'landscape' | 'default';
  selectedSignatureIds: string[];
  signatureLayout: '1-kolom' | '2-kolom' | '3-kolom';
  customTitle?: string;
  customSubTitle?: string;
  notes?: string;
}

export interface MasterDocumentTemplateConfig {
  version: string;
  updatedAt: string;
  updatedBy: string;
  profile: InstitutionProfile;
  letterhead: LetterheadSettings;
  format: DocumentFormatSettings;
  footer: FooterSettings;
  numbering: DocumentNumberingSettings;
  signatures: MasterSignature[];
  documentTypes: DocumentTypeTemplate[];
}

export const DEFAULT_MASTER_TEMPLATE_CONFIG: MasterDocumentTemplateConfig = {
  version: '1.0.0',
  updatedAt: '2026-09-13T08:00:00.000Z',
  updatedBy: 'Admin Penuh (Dr. H. Ahmad Pratama, M.Kom)',
  profile: {
    namaInstansi: 'BADAN GIZI NASIONAL (NATIONAL NUTRITION AGENCY)',
    namaSppg: 'SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN',
    namaYayasan: 'YAYASAN HAFSHAWATY ZAINUL HASAN',
    alamat: 'Dusun Krajan',
    rtRw: '003/004',
    desa: 'Temenggungan',
    kecamatan: 'Krejengan',
    kabupaten: 'Kab. Probolinggo',
    provinsi: 'Jawa Timur',
    kodePos: '67284',
    nomorTelepon: '0812-3456-7890',
    email: 'sppg.krejengan@bgn.go.id',
    website: 'https://sppg.bgn.go.id',
    penanggungJawabNama: 'Dr. H. Ahmad Pratama, M.Kom',
    penanggungJawabJabatan: 'Kepala SPPG Probolinggo Krejengan',
    penanggungJawabNip: '19820514 200801 1 003'
  },
  letterhead: {
    logoUrl: '/badan_gizi_logo.jpg',
    logoSize: 68,
    logoPosition: 'left',
    showLogo: true,
    namaInstansi: 'BADAN GIZI NASIONAL (NATIONAL NUTRITION AGENCY)',
    namaSppg: 'SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN',
    namaYayasan: 'YAYASAN HAFSHAWATY ZAINUL HASAN',
    alamatLengkap: 'Dusun Krajan RT/RW 003/004, Desa Temenggungan, Kec. Krejengan, Kab. Probolinggo',
    showContactInfo: false,
    fontFamily: 'inherit',
    instansiFontSize: 15,
    sppgFontSize: 13,
    yayasanFontSize: 12,
    alamatFontSize: 10,
    isBoldInstansi: true,
    isBoldSppg: true,
    isBoldYayasan: true,
    isItalicAlamat: true,
    textAlign: 'center',
    lineSpacing: 'tight',
    gapLogoWithText: 16,
    borderThickness: 3,
    borderStyle: 'double',
    borderColor: '#0f172a',
    kopMarginBottom: 16,
    repeatOnEveryPage: false
  },
  format: {
    paperSize: 'A4',
    orientation: 'portrait',
    marginTop: 18,
    marginBottom: 18,
    marginLeft: 18,
    marginRight: 18,
    defaultFontFamily: 'sans-serif',
    defaultFontSize: 10,
    fontColor: '#0f172a',
    lineHeight: 1.4,
    paragraphSpacing: 8,
    tableFontSize: 9,
    tableBorderWidth: 1,
    tableBorderColor: '#334155',
    tableHeaderBg: '#f1f5f9',
    tableCellPadding: 6
  },
  footer: {
    showFooter: true,
    showPageNumber: true,
    pageNumberFormat: 'Halaman {page} dari {total}',
    showPrintDate: true,
    printDateFormat: 'DD MMMM YYYY, HH:mm',
    customDocumentNote: 'Dokumen Resmi SPPG Krejengan Temenggungan • Badan Gizi Nasional RI',
    isConfidential: false,
    confidentialText: 'DOKUMEN RESMI INTERNAL - BGN RI',
    footerAlignment: 'between'
  },
  numbering: {
    prefix: 'SPPG-TMG',
    counterLength: 3,
    currentCounters: {
      'STOK': 14,
      'BM': 8,
      'BK': 6,
      'OPN': 4,
      'BBM': 19,
      'DIV': 22,
      'MENU': 15,
      'PO': 38,
      'RAB': 11,
      'PM': 9,
      'BA': 5,
      'TUGAS': 12,
      'UMUM': 7
    },
    monthFormat: 'roman',
    yearFormat: 'YYYY',
    separator: '/',
    formatPattern: '{counter}/{prefix}/{code}/{month}/{year}',
    resetInterval: 'year',
    lastResetDate: '2026-01-01'
  },
  signatures: [
    {
      id: 'SIG-001',
      nama: 'Dr. H. Ahmad Pratama, M.Kom',
      jabatan: 'Kepala SPPG Probolinggo Krejengan',
      nip: '19820514 200801 1 003',
      keterangan: 'Mengetahui / Menyetujui',
      signatureImageUrl: '',
      stampImageUrl: '',
      isActive: true,
      isDefault: true,
      order: 1
    },
    {
      id: 'SIG-002',
      nama: 'Siti Rahmawati, S.Gz',
      jabatan: 'Tenaga Ahli Gizi SPPG',
      nip: '19900315 201402 2 004',
      keterangan: 'Penyusun Menu & Ahli Gizi',
      signatureImageUrl: '',
      stampImageUrl: '',
      isActive: true,
      isDefault: true,
      order: 2
    },
    {
      id: 'SIG-003',
      nama: 'Budi Santoso, S.E.',
      jabatan: 'Petugas Logistik & Pengadaan (PLOG)',
      nip: '19870820 201101 1 002',
      keterangan: 'Verifikator Logistik & Pengadaan',
      signatureImageUrl: '',
      stampImageUrl: '',
      isActive: true,
      isDefault: true,
      order: 3
    },
    {
      id: 'SIG-004',
      nama: 'Rudi Hermawan',
      jabatan: 'Koordinator Distribusi & Armada',
      nip: '19920110 201503 1 005',
      keterangan: 'Pemeriksa Distribusi & BBM',
      signatureImageUrl: '',
      stampImageUrl: '',
      isActive: true,
      isDefault: false,
      order: 4
    }
  ],
  documentTypes: [
    {
      id: 'stock-laporan',
      code: 'STOK',
      name: 'Laporan Stok & Mutasi Gudang',
      category: 'Logistik & Stok',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-003', 'SIG-001'],
      signatureLayout: '2-kolom',
      customTitle: 'LAPORAN STOCK OPNAME & MUTASI BAHAN BAKU',
      customSubTitle: 'Satuan Pelayanan Program Gizi (SPPG) Krejengan Temenggungan'
    },
    {
      id: 'barang-masuk',
      code: 'BM',
      name: 'Laporan Barang Masuk & Verifikasi Penerimaan',
      category: 'Logistik & Stok',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-003', 'SIG-001'],
      signatureLayout: '2-kolom',
      customTitle: 'LAPORAN PENERIMAAN & LOGISTIK BARANG MASUK',
      customSubTitle: 'Verifikasi Penerimaan Bahan Pangan & Logistik Dapur SPPG'
    },
    {
      id: 'barang-keluar',
      code: 'BK',
      name: 'Laporan Barang Keluar (Pemakaian Dapur)',
      category: 'Logistik & Stok',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-003', 'SIG-002'],
      signatureLayout: '2-kolom',
      customTitle: 'BUKTI PENGELUARAN BARANG & BAHAN BAKU DAPUR',
      customSubTitle: 'Dokumen Mutasi Stok Logistik Dapur SPPG'
    },
    {
      id: 'stock-opname',
      code: 'OPN',
      name: 'Berita Acara Stock Opname Bulanan',
      category: 'Logistik & Stok',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-003', 'SIG-001'],
      signatureLayout: '2-kolom',
      customTitle: 'BERITA ACARA AUDIT FISIK STOCK OPNAME GUDANG',
      customSubTitle: 'Pemeriksaan Persediaan Fisik vs Sistem Terpadu SPPG'
    },
    {
      id: 'bbm-laporan',
      code: 'BBM',
      name: 'Laporan Konsumsi BBM & Armada Kendaraan',
      category: 'Keuangan & BBM',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-004', 'SIG-001'],
      signatureLayout: '2-kolom',
      customTitle: 'LAPORAN KONSUMSI BAHAN BAKAR MINYAK (BBM) KENDARAAN',
      customSubTitle: 'Operasional Logistik & Armada Distribusi Makanan Bergizi'
    },
    {
      id: 'tugas-divisi',
      code: 'DIV',
      name: 'Laporan Tugas Divisi Harian (Persiapan, Olah, Porsi, Cuci)',
      category: 'Operasional & Menu',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-002', 'SIG-001'],
      signatureLayout: '2-kolom',
      customTitle: 'LAPORAN TUGAS HARIAN DIVISI OPERASIONAL DAPUR',
      customSubTitle: 'Sistem Manajemen Mutu, Kebersihan, dan Pengolahan Pangan'
    },
    {
      id: 'laporan-menu',
      code: 'MENU',
      name: 'Laporan Perencanaan Menu & Ahli Gizi',
      category: 'Operasional & Menu',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-002', 'SIG-001'],
      signatureLayout: '2-kolom',
      customTitle: 'DOKUMEN SPESIFIKASI MENU & ANALISIS GIZI HARIAN',
      customSubTitle: 'Standar Porsi dan Kebutuhan Makro Nutrisi BGN'
    },
    {
      id: 'po-harian',
      code: 'PO',
      name: 'Purchase Order (PO) Pengadaan Bahan Pangan',
      category: 'Pengadaan & PO',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-003', 'SIG-001'],
      signatureLayout: '2-kolom',
      customTitle: 'SURAT PESANAN PEMBELIAN / PURCHASE ORDER (PO)',
      customSubTitle: 'Pengadaan Bahan Baku Pangan Segar & Kering SPPG'
    },
    {
      id: 'rab-laporan',
      code: 'RAB',
      name: 'Rencana Anggaran Biaya (RAB) Operasional',
      category: 'Keuangan & BBM',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-002', 'SIG-003', 'SIG-001'],
      signatureLayout: '3-kolom',
      customTitle: 'DOKUMEN RENCANA ANGGARAN BELANJA (RAB) OPERASIONAL',
      customSubTitle: 'Alokasi Pagu Anggaran Bahan Pangan & Operasional Dapur'
    },
    {
      id: 'penerima-manfaat',
      code: 'PM',
      name: 'Laporan Rekapitulasi Penerima Manfaat',
      category: 'Operasional & Menu',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-004', 'SIG-001'],
      signatureLayout: '2-kolom',
      customTitle: 'REKAPITULASI PENYALURAN & PENERIMA MANFAAT',
      customSubTitle: 'Distribusi Porsi Makanan Bergizi Sasaran Sekolah & Posyandu'
    },
    {
      id: 'berita-acara',
      code: 'BA',
      name: 'Berita Acara Serah Terima (BAST)',
      category: 'Surat & Administrasi',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-003', 'SIG-001'],
      signatureLayout: '2-kolom',
      customTitle: 'BERITA ACARA SERAH TERIMA PEKERJAAN & BARANG',
      customSubTitle: 'Dokumen Legalitas dan Pertanggungjawaban Resmi SPPG'
    },
    {
      id: 'surat-tugas',
      code: 'TUGAS',
      name: 'Surat Tugas / Perjalanan Dinas Operasional',
      category: 'Surat & Administrasi',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-001'],
      signatureLayout: '1-kolom',
      customTitle: 'SURAT PERINTAH TUGAS OPERASIONAL',
      customSubTitle: 'Penugasan Resmi Personel SPPG Krejengan Temenggungan'
    },
    {
      id: 'surat-pemberitahuan',
      code: 'UMUM',
      name: 'Surat Pemberitahuan / Permohonan Resmi',
      category: 'Surat & Administrasi',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-001'],
      signatureLayout: '1-kolom',
      customTitle: 'SURAT PEMBERITAHUAN RESMI',
      customSubTitle: 'Komunikasi Resmi Antar Instansi / Mitra SPPG'
    },
    {
      id: 'laporan-distribusi',
      code: 'DIST',
      name: 'Laporan Pengiriman & Distribusi Makanan',
      category: 'Operasional & Menu',
      enableLetterhead: true,
      enableFooter: true,
      enableAutoNumber: true,
      paperSize: 'A4',
      orientation: 'portrait',
      selectedSignatureIds: ['SIG-004', 'SIG-001'],
      signatureLayout: '2-kolom',
      customTitle: 'LAPORAN REKAPITULASI DISTRIBUSI & PENYERAHAN Makanan',
      customSubTitle: 'Dokumen Verifikasi Pengiriman & Penjemputan Ompreng SPPG'
    }
  ]
};
