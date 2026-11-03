export type AkuntanSubPath =
  | '/akuntan'
  | '/akuntan/rab-bahan-baku'
  | '/akuntan/rab-operasional'
  | '/akuntan/rab-operasional/barang'
  | '/akuntan/rab-operasional/jasa'
  | '/akuntan/rab-operasional/jasa/gaji-karyawan'
  | '/akuntan/rab-operasional/jasa/gaji-karyawan/rekap-gaji'
  | '/akuntan/rab-operasional/jasa/gaji-karyawan/slip-gaji'
  | '/akuntan/rab-operasional/jasa/insentif-pic-lembaga'
  | '/akuntan/rab-operasional/jasa/insentif-pic-lembaga/rekap'
  | '/akuntan/rab-operasional/jasa/insentif-pic-lembaga/kwitansi'
  | '/akuntan/rab-operasional/jasa/insentif-pic-posyandu'
  | '/akuntan/rab-operasional/jasa/insentif-pic-posyandu/rekap'
  | '/akuntan/rab-operasional/jasa/insentif-pic-posyandu/kwitansi'
  | '/akuntan/rab-operasional/jasa/operasional-lainnya'
  | '/akuntan/insentif-fasilitas'
  | '/akuntan/insentif-fasilitas/berita-acara'
  | '/akuntan/insentif-fasilitas/rekap'
  | '/akuntan/realisasi-bahan-baku'
  | '/akuntan/realisasi-operasional';

export interface RabBahanBakuItem {
  id: string;
  kode?: string;
  kategori?: string;
  namaBarang: string;
  spesifikasi?: string;
  kebutuhanPorsi?: number; // gram per porsi
  targetPorsi?: number; // jumlah sasaran
  totalKebutuhanKg?: number;
  pembulatan?: number; // Pembulatan kebutuhan dari Food Cost
  satuan: string; // Satuan pembelian dari Food Cost
  hargaSatuan: number; // Harga satuan yang diisi oleh akuntan
  totalAnggaran: number; // Pembulatan * Harga Satuan
  tanggalPelaksanaan: string;
  keterangan: string;
}

export interface RabOperasionalBarangItem {
  id: string;
  kode: string;
  namaBarang: string;
  kategori: 'Bahan Bakar & Energi' | 'Kebersihan & Sanitasi' | 'Packaging & Wadah' | 'Perlengkapan Kerja (APD)' | 'Logistik & Distribusi';
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalAnggaran: number;
  periode: string;
  keterangan: string;
}

export interface GajiKaryawanRecord {
  id: string;
  nomorSlip: string;
  nik: string;
  nama: string;
  jabatan: 'Kepala Koki (Head Chef)' | 'Cook Helper (Asisten Masak)' | 'Petugas Preparasi Bahan' | 'Tim Pemorsian (Packing)' | 'Petugas Cuci & Higiene Dapur' | string;
  tipeGaji: 'Bulanan' | 'Harian';
  hariKerja: number;
  gajiPokok: number;
  tunjanganHadir: number;
  uangLembur: number;
  bonusKinerja: number;
  potonganBpjs: number;
  potonganAbsensi: number;
  totalPenerimaan: number;
  totalPotongan: number;
  gajiBersih: number;
  periode: string;
  tanggalBayar: string;
  statusBayar: 'Lunas' | 'Menunggu Verifikasi' | 'Draft' | string;
  rekeningBank: string;
}

export interface InsentifPicRecord {
  id: string;
  nomorKwitansi: string;
  namaPic: string;
  nik: string;
  lembaga: string;
  kategori: 'Sekolah / Madrasah' | 'Posyandu / Balita & 3B';
  jumlahSasaran: number;
  nominalPerPorsi: number;
  insentifPokok: number;
  uangTransport: number;
  totalInsentif: number;
  periode: string;
  tanggalKwitansi: string;
  statusBayar: 'Lunas' | 'Draft';
  telepon: string;
  penerimaNama: string;
  tierInfo?: string;
}

export interface GajiStafRecord {
  id: string;
  nomorSlip: string;
  nik: string;
  nama: string;
  jabatan: 'Koordinator Unit SPPG' | 'Akuntan / Finance' | 'Ahli Gizi (Nutrisionis)' | 'Supervisor QC & Sanitasi' | 'Petugas Logistik & Gudang' | 'Driver Distribusi Armada';
  gajiPokok: number;
  tunjanganJabatan: number;
  tunjanganTransport: number;
  uangMakan: number;
  lembur: number;
  potonganBpjs: number;
  potonganPph21: number;
  totalPenerimaan: number;
  totalPotongan: number;
  gajiBersih: number;
  periode: string;
  tanggalBayar: string;
  statusBayar: 'Lunas' | 'Menunggu Verifikasi' | 'Draft';
  rekeningBank: string;
}

export interface OperasionalLainnyaItem {
  id: string;
  kodeTransaksi: string;
  namaPengeluaran: string;
  satuan?: string;
  biayaSatuan?: number;
  kategori?: string;
  jumlahBiaya: number;
  tanggalTransaksi: string;
  penanggungJawab: string;
  buktiNota: string;
  keterangan: string;
}

export interface InsentifFasilitasRecord {
  id: string;
  nomorBa: string;
  namaFasilitas: string;
  lokasi: string;
  pemilikPenyedia: string;
  pihakPertama: string; // Akuntan / Kepala SPPG
  pihakKedua: string; // Pengelola Tempat
  kompensasiBulan: number;
  biayaUtilitas: number;
  totalInsentif: number;
  periode: string;
  tanggalBeritaAcara: string;
  fasilitasRincian: string[];
  status: 'Aktif' | 'Selesai' | 'Verifikasi';
}

export interface RealisasiBahanBakuItem {
  id: string;
  idKedatangan?: string;
  tanggal: string;
  kodePo?: string;
  namaBarang: string;
  satuan: string;
  jumlahRencana: number;
  jumlahRealisasi: number;
  hargaSatuanRencana: number;
  hargaSatuanRiil: number;
  totalRencana: number;
  totalRealisasi: number;
  selisih: number; // totalRealisasi - totalRencana
  persentaseRealisasi: number;
  kualitas: string;
  supplier: string;
  petugasPenerima: string;
  statusKesesuaian: 'Sesuai' | 'Lebih' | 'Kurang' | 'Harga Berubah';
}

export interface RealisasiOperasionalItem {
  id: string;
  idKedatangan?: string;
  tanggal: string;
  namaBarang: string;
  kategori: string;
  satuan: string;
  jumlahRiil: number;
  biayaRiil: number;
  anggaranRab: number;
  selisih: number;
  supplierPetugas: string;
  keterangan: string;
}
