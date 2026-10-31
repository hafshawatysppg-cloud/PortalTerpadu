import React, { useState } from 'react';
import {
  UtensilsCrossed,
  BookOpen,
  RotateCw,
  Coins,
  Thermometer,
  Droplets,
  Snowflake,
  Refrigerator,
  Utensils,
  Soup,
  Flame,
  PackageCheck,
  Sparkles,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  ChevronRight,
  Search,
  RefreshCw,
  Printer,
  ShieldCheck,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { PerencanaanBahanView } from '../../components/nutrition/PerencanaanBahanView';

interface GiziViewProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const GiziView: React.FC<GiziViewProps> = ({ currentPath, onNavigate }) => {
  // If navigating to Food Cost, render the complete Food Cost & MultiGroup Nutrition Calculation System
  if (currentPath.includes('/gizi/food-cost')) {
    return <PerencanaanBahanView currentPath={currentPath} onNavigate={onNavigate} />;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('Hari Ini');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  // Determine active sub-feature configuration
  const getFeatureConfig = () => {
    if (currentPath.includes('/gizi/master-menu')) {
      return {
        key: 'master-menu',
        title: 'Master Menu & Resep Standar',
        badge: 'MASTER MENU',
        icon: BookOpen,
        color: 'emerald',
        breadcrumbs: ['GIZI', 'MASTER MENU'],
        description: 'Katalog master resep, komposisi bahan baku, takaran gramatur, dan standar penyajian SPPG Badan Gizi Nasional.',
        kpis: [
          { label: 'Total Resep Aktif', value: '36 Menu', status: 'Standar SPPG', color: 'emerald' },
          { label: 'Kategori Porsi', value: '4 Kelompok', status: 'Kecil, Besar, Balita, 3B', color: 'blue' },
          { label: 'Pemberitahuan Uji Coba', value: '100% Terverifikasi', status: 'Lolos Ahli Gizi', color: 'indigo' },
          { label: 'Update Terakhir', value: 'Hari Ini', status: 'Oleh Ahli Gizi', color: 'amber' },
        ],
        columns: ['Kode Menu', 'Nama Menu & Lauk', 'Kategori Sasaran', 'Gramatur / Porsi', 'Status', 'Aksi'],
        rows: [
          { c1: 'MNU-BGN-001', c2: 'Nasi Putih + Ayam Semur + Capcay + Buah Jeruk', c3: 'SD/MI (Porsi Kecil & Besar)', c4: '380 gram', c5: 'Aktif Standar', c6: 'Edit Resep' },
          { c1: 'MNU-BGN-002', c2: 'Nasi + Ikan Goreng Fillet + Sayur Bening Bayam + Semangka', c3: 'SMP & SMA (Porsi Besar)', c4: '450 gram', c5: 'Aktif Standar', c6: 'Edit Resep' },
          { c1: 'MNU-BGN-003', c2: 'Bubur Beras + Telur Puyuh Rebus + Pure Brokoli Wortel', c3: 'Balita 12-59 Bulan', c4: '200 gram', c5: 'Aktif Standar', c6: 'Edit Resep' },
          { c1: 'MNU-BGN-004', c2: 'Nasi Pulen + Daging Rendang Daging Sapi + Sop Kacang Merah', c3: 'Ibu Hamil & Menyusui (3B)', c4: '420 gram', c5: 'Aktif Standar', c6: 'Edit Resep' },
        ]
      };
    }

    if (currentPath.includes('/gizi/siklus-menu')) {
      return {
        key: 'siklus-menu',
        title: 'Siklus Menu (Kandungan Gizi)',
        badge: 'SIKLUS MENU (KANDUNGAN GIZI)',
        icon: RotateCw,
        color: 'emerald',
        breadcrumbs: ['GIZI', 'SIKLUS MENU (KANDUNGAN GIZI)'],
        description: 'Perencanaan siklus menu harian / 10 hari dan evaluasi kesesuaian Angka Kecukupan Gizi (AKG) Badan Gizi Nasional.',
        kpis: [
          { label: 'Target Energi (Kalori)', value: '625 - 710 Kkal', status: 'Sesuai Standar AKG', color: 'emerald' },
          { label: 'Protein Rata-rata', value: '24.8 gram', status: 'Tercapai 105%', color: 'blue' },
          { label: 'Lemak Seimbang', value: '18.2 gram', status: 'Dalam Batas Aman', color: 'indigo' },
          { label: 'Kepatuhan Siklus', value: 'Hari ke-4 / 10', status: 'Siklus 10 Hari', color: 'amber' },
        ],
        columns: ['Hari / Siklus', 'Kombinasi Menu', 'Energi (Kkal)', 'Protein (g)', 'Karbohidrat (g)', 'Status AKG'],
        rows: [
          { c1: 'Hari 1 (Senin)', c2: 'Nasi + Ayam Bakar Madu + Cah Buncis Jagung + Buah Pisang', c3: '685 Kkal', c4: '26.2 g', c5: '84.0 g', c6: 'Memenuhi AKG' },
          { c1: 'Hari 2 (Selasa)', c2: 'Nasi + Telur Balado + Orek Tempe + Sayur Asem + Jeruk', c3: '640 Kkal', c4: '22.5 g', c5: '88.5 g', c6: 'Memenuhi AKG' },
          { c1: 'Hari 3 (Rabu)', c2: 'Nasi + Daging Sapi Lada Hitam + Sop Sayuran + Melon', c3: '710 Kkal', c4: '27.4 g', c5: '79.2 g', c6: 'Memenuhi AKG' },
          { c1: 'Hari 4 (Kamis)', c2: 'Nasi + Ikan Tuna Woku + Tumis Tahu Tauge + Pepaya', c3: '655 Kkal', c4: '25.1 g', c5: '82.0 g', c6: 'Memenuhi AKG' },
          { c1: 'Hari 5 (Jumat)', c2: 'Nasi Kuning Komplit + Ayam Suwir + Kering Tempe + Apel', c3: '690 Kkal', c4: '24.0 g', c5: '86.4 g', c6: 'Memenuhi AKG' },
        ]
      };
    }

    if (currentPath.includes('/gizi/food-cost')) {
      return {
        key: 'food-cost',
        title: 'Food Cost & Analisa Biaya Porsi',
        badge: 'FOOD COST',
        icon: Coins,
        color: 'emerald',
        breadcrumbs: ['GIZI', 'FOOD COST'],
        description: 'Kalkulasi HPP bahan baku per porsi, evaluasi efisiensi pengadaan, dan monitoring pagu anggaran makanan bergizi.',
        kpis: [
          { label: 'Plafon Anggaran', value: 'Rp 15.000 / Porsi', status: 'Batas Maksimal SPPG', color: 'blue' },
          { label: 'Realisasi Rata-rata', value: 'Rp 13.820 / Porsi', status: 'Efisiensi +7.87%', color: 'emerald' },
          { label: 'Biaya Buffer Porsi', value: 'Rp 450 / Porsi', status: 'Cadangan Darurat', color: 'indigo' },
          { label: 'Estimasi Penghematan', value: 'Rp 1.180 / Porsi', status: 'Optimalisasi Anggaran', color: 'amber' },
        ],
        columns: ['Tanggal Menu', 'Nama Menu', 'Total Sasaran', 'Biaya Bahan Baku', 'Food Cost / Porsi', 'Status Biaya'],
        rows: [
          { c1: '31 Okt 2026', c2: 'Paket Ayam Semur & Sayur', c3: '3.450 Porsi', c4: 'Rp 47.782.500', c5: 'Rp 13.850', c6: 'Sesuai Plafon (Hemat)' },
          { c1: '30 Okt 2026', c2: 'Paket Ikan Tuna & Sop Sayur', c3: '3.450 Porsi', c4: 'Rp 47.265.000', c5: 'Rp 13.700', c6: 'Sesuai Plafon (Hemat)' },
          { c1: '29 Okt 2026', c2: 'Paket Daging Sapi & Kacang Merah', c3: '3.450 Porsi', c4: 'Rp 49.335.000', c5: 'Rp 14.300', c6: 'Batas Standar Wajar' },
        ]
      };
    }

    if (currentPath.includes('/gizi/suhu/kelembapan-gudang-kering')) {
      return {
        key: 'suhu-kelembapan-gudang-kering',
        title: 'Monitoring Kelembapan & Suhu Gudang Kering',
        badge: 'KELEMBAPAN GUDANG KERING',
        icon: Droplets,
        color: 'emerald',
        breadcrumbs: ['GIZI', 'SUHU', 'KELEMBAPAN GUDANG KERING'],
        description: 'Pencatatan higrometer dan termometer ruangan penyimpanan bahan kering (beras, tepung, bumbu, gula) standar sanitasi pangan.',
        kpis: [
          { label: 'Standar Kelembapan (RH)', value: '50% - 65% RH', status: 'Batas Kritis Maks 70%', color: 'blue' },
          { label: 'RH Terkini', value: '58% RH', status: 'Kondisi Kering Ideal', color: 'emerald' },
          { label: 'Suhu Ruangan', value: '22.8 °C', status: 'Sejuk & Bersih (18-25°C)', color: 'indigo' },
          { label: 'Status Ventilasi', value: 'Exhaust Aktif', status: 'Sirkulasi Normal', color: 'amber' },
        ],
        columns: ['Waktu Inspeksi', 'Petugas Pemeriksa', 'Kelembapan (RH)', 'Suhu (°C)', 'Area Rak', 'Status Validasi'],
        rows: [
          { c1: 'Pagi (06:00 WIB)', c2: 'Ahmad Fauzi (Logistik)', c3: '57% RH', c4: '22.4 °C', c5: 'Rak A (Beras & Biji-bijian)', c6: 'Sesuai Standar' },
          { c1: 'Siang (12:00 WIB)', c2: 'Siti Rahmawati (Sanitarian)', c3: '59% RH', c4: '23.1 °C', c5: 'Rak B (Bumbu Kering & Minyak)', c6: 'Sesuai Standar' },
          { c1: 'Sore (17:00 WIB)', c2: 'Ahmad Fauzi (Logistik)', c3: '58% RH', c4: '22.6 °C', c5: 'Rak C (Tepung & Kemasan)', c6: 'Sesuai Standar' },
        ]
      };
    }

    if (currentPath.includes('/gizi/suhu/freezer')) {
      return {
        key: 'suhu-freezer',
        title: 'Monitoring Suhu Freezer (Pembekuan)',
        badge: 'FREEZER',
        icon: Snowflake,
        color: 'emerald',
        breadcrumbs: ['GIZI', 'SUHU', 'FREEZER'],
        description: 'Pemantauan suhu ruang beku (Cold Storage / Chest Freezer) untuk penyimpanan daging, unggas, dan ikan beku (Target: ≤ -18°C).',
        kpis: [
          { label: 'Standar Suhu Freezer', value: '≤ -18 °C', status: 'Batas Kritis Maks -15°C', color: 'blue' },
          { label: 'Suhu Sensor Terkini', value: '-19.4 °C', status: 'Optimal Pembekuan', color: 'emerald' },
          { label: 'Alarm Temperatur', value: 'Normal / Hijau', status: 'Tidak Ada Deviasi', color: 'indigo' },
          { label: 'Siklus Defrost', value: '3 Hari Lalu', status: 'Bebas Bunga Es Tebal', color: 'amber' },
        ],
        columns: ['Unit Freezer', 'Jam Cek', 'Suhu Terukur', 'Komoditas Tersimpan', 'Petugas PIC', 'Hasil Evaluasi'],
        rows: [
          { c1: 'Freezer Daging Sapi 01', c2: '06:30 WIB', c3: '-19.2 °C', c4: 'Daging Sapi Giling & Potong', c5: 'Budi Santoso', c6: 'Sangat Aman' },
          { c1: 'Freezer Daging Ayam 02', c2: '06:30 WIB', c3: '-19.8 °C', c4: 'Ayam Fillet Segar', c5: 'Budi Santoso', c6: 'Sangat Aman' },
          { c1: 'Freezer Ikan & Seafood 03', c2: '06:35 WIB', c3: '-18.9 °C', c4: 'Ikan Tuna & Ikan Kakap', c5: 'Budi Santoso', c6: 'Sangat Aman' },
        ]
      };
    }

    if (currentPath.includes('/gizi/suhu/chiller')) {
      return {
        key: 'suhu-chiller',
        title: 'Monitoring Suhu Chiller (Pendingin Segar)',
        badge: 'CHILLER',
        icon: Refrigerator,
        color: 'emerald',
        breadcrumbs: ['GIZI', 'SUHU', 'CHILLER'],
        description: 'Pencatatan suhu ruang pendingin komoditas sayur segar, buah potong, telur, susu, dan bumbu basah (Standar: 0°C s/d 4°C).',
        kpis: [
          { label: 'Standar Suhu Chiller', value: '0°C s/d 4°C', status: 'Batas Kritis Maks 7°C', color: 'blue' },
          { label: 'Suhu Rata-rata', value: '2.8 °C', status: 'Segar & Terjaga', color: 'emerald' },
          { label: 'Kapasitas Ruang', value: '72% Terisi', status: 'Sirkulasi Udara Lancar', color: 'indigo' },
          { label: 'Kondisi Fisik', value: 'Bersih & Kering', status: 'Higienis Tanpa Bau', color: 'amber' },
        ],
        columns: ['Unit Chiller', 'Jam Cek', 'Suhu (°C)', 'Komoditas', 'Sirkulasi Udara', 'Status'],
        rows: [
          { c1: 'Chiller Sayur Hijau 01', c2: '06:00 WIB', c3: '3.1 °C', c4: 'Bayam, Brokoli, Buncis', c5: 'Normal', c6: 'Segar Optimal' },
          { c1: 'Chiller Buah & Produk Susu 02', c2: '06:05 WIB', c3: '2.5 °C', c4: 'Susu UHT, Semangka, Jeruk', c5: 'Normal', c6: 'Segar Optimal' },
          { c1: 'Chiller Bumbu Basah 03', c2: '06:10 WIB', c3: '2.9 °C', c4: 'Bawang Kupas, Bumbu Marinasi', c5: 'Normal', c6: 'Segar Optimal' },
        ]
      };
    }

    if (currentPath.includes('/gizi/suhu/pemorsian')) {
      return {
        key: 'suhu-pemorsian',
        title: 'Monitoring Suhu Ruang Pemorsian (Packing Area)',
        badge: 'PEMORSIAN',
        icon: Utensils,
        color: 'emerald',
        breadcrumbs: ['GIZI', 'SUHU', 'PEMORSIAN'],
        description: 'Standar pengkondisian suhu udara dan kebersihan ruangan packing/pemorsian makanan bergizi (Target Ruangan: 18°C s/d 22°C ber-AC).',
        kpis: [
          { label: 'Suhu Ruang Pemorsian', value: '20.2 °C', status: 'Kondisi Sejuk AC Standar', color: 'blue' },
          { label: 'Batas Waktu Paparan', value: 'Maks 60 Menit', status: 'Kecepatan Packing Tinggi', color: 'emerald' },
          { label: 'Petugas Bertugas', value: '18 Personel', status: 'APD Lengkap (Masker/Sarung)', color: 'indigo' },
          { label: 'Higienitas Meja', value: 'Sanitasi Food Grade', status: 'Steril Uji Swab', color: 'amber' },
        ],
        columns: ['Sesi Pemorsian', 'Waktu Mulai - Selesai', 'Suhu Ruang (°C)', 'Jumlah Meja Packing', 'Penanggung Jawab', 'Kepatuhan'],
        rows: [
          { c1: 'Pemorsian Batch 1 (SD/MI)', c2: '07:30 - 08:45 WIB', c3: '19.8 °C', c4: '6 Meja Stainless Steel', c5: 'Ibu Ratna (Supervisor)', c6: '100% Sesuai SOP' },
          { c1: 'Pemorsian Batch 2 (SMP/SMA)', c2: '08:50 - 09:40 WIB', c3: '20.4 °C', c4: '6 Meja Stainless Steel', c5: 'Ibu Ratna (Supervisor)', c6: '100% Sesuai SOP' },
          { c1: 'Pemorsian Batch 3 (3B & Balita)', c2: '09:45 - 10:15 WIB', c3: '20.1 °C', c4: '3 Meja Khusus 3B', c5: 'Ibu Ratna (Supervisor)', c6: '100% Sesuai SOP' },
        ]
      };
    }

    if (currentPath.includes('/gizi/suhu/makanan/pengolahan')) {
      return {
        key: 'suhu-makanan-pengolahan',
        title: 'Monitoring Suhu Makanan Tahap Pengolahan (Cooking CCP)',
        badge: 'PENGOLAHAN',
        icon: Flame,
        color: 'emerald',
        breadcrumbs: ['GIZI', 'SUHU', 'MAKANAN', 'PENGOLAHAN'],
        description: 'Critical Control Point (CCP): Pengujian suhu inti masakan matang dengan probe thermometer digital untuk memastikan mikroorganisme patogen musnah (Target Inti: ≥ 75°C s/d 100°C).',
        kpis: [
          { label: 'Batas Kritis (CCP Inti)', value: '≥ 75.0 °C', status: 'Standar Keamanan Pangan', color: 'blue' },
          { label: 'Rata-rata Suhu Matang', value: '88.5 °C', status: 'Sangat Higienis & Matang', color: 'emerald' },
          { label: 'Metode Pengujian', value: 'Probe Digital Tusuk', status: 'Dikalibrasi Berkala', color: 'indigo' },
          { label: 'Status CCP Dapur', value: '0 Deviasi', status: 'Lolos Quality Control', color: 'amber' },
        ],
        columns: ['Nama Menu / Masakan', 'Waktu Pengukuran', 'Suhu Inti Terukur (°C)', 'Standar Minimum', 'Petugas QC / Chef', 'Keputusan'],
        rows: [
          { c1: 'Ayam Semur Bumbu Rempah', c2: '07:15 WIB', c3: '86.4 °C', c4: '≥ 75.0 °C', c5: 'Chef Hasan & QC Rina', c6: 'Lolos CCP (Aman)' },
          { c1: 'Sop Sayuran Daging Sapi', c2: '07:25 WIB', c3: '94.2 °C', c4: '≥ 80.0 °C (Titik Didih)', c5: 'Chef Hasan & QC Rina', c6: 'Lolos CCP (Aman)' },
          { c1: 'Nasi Putih Pulen (Steamer)', c2: '07:05 WIB', c3: '89.0 °C', c4: '≥ 75.0 °C', c5: 'Chef Hasan & QC Rina', c6: 'Lolos CCP (Aman)' },
          { c1: 'Capcay Kuah Kental', c2: '07:35 WIB', c3: '84.8 °C', c4: '≥ 75.0 °C', c5: 'Chef Hasan & QC Rina', c6: 'Lolos CCP (Aman)' },
        ]
      };
    }

    if (currentPath.includes('/gizi/suhu/makanan/masuk-ompreng')) {
      return {
        key: 'suhu-makanan-masuk-ompreng',
        title: 'Monitoring Suhu Makanan Saat Masuk Ompreng / Packing',
        badge: 'MASUK OMPRENG',
        icon: PackageCheck,
        color: 'emerald',
        breadcrumbs: ['GIZI', 'SUHU', 'MAKANAN', 'MASUK OMPRENG'],
        description: 'Pemantauan suhu makanan saat pengisian ke wadah ompreng / thermal food box agar tetap di atas Danger Zone (Target Minimal: ≥ 60°C - 65°C) sebelum ditutup rapat.',
        kpis: [
          { label: 'Batas Minimum Masuk Ompreng', value: '≥ 60.0 °C', status: 'Mencegah Bakteri Danger Zone', color: 'blue' },
          { label: 'Suhu Terukur Rata-rata', value: '68.4 °C', status: 'Hangat & Terjaga', color: 'emerald' },
          { label: 'Suhu Estimasi Tiba', value: '≥ 55.0 °C', status: 'Insulasi Thermal Box', color: 'indigo' },
          { label: 'Wadah Ompreng', value: 'Food Grade 304', status: 'Rapat & Tersegel', color: 'amber' },
        ],
        columns: ['Sampel Ompreng Box', 'Jenis Makanan', 'Jam Masuk Ompreng', 'Suhu (°C)', 'Kondisi Penutupan', 'Status QC'],
        rows: [
          { c1: 'Box Kloter 1 - SD Zainul Hasan', c2: 'Ayam Semur + Nasi', c3: '08:10 WIB', c4: '69.2 °C', c5: 'Tutup Rapat + Seal Karet', c6: 'Sesuai Standar Panas' },
          { c1: 'Box Kloter 2 - SMP Zainul Hasan', c2: 'Ayam Semur + Nasi', c3: '08:25 WIB', c4: '68.0 °C', c5: 'Tutup Rapat + Seal Karet', c6: 'Sesuai Standar Panas' },
          { c1: 'Box Kloter 3 - MA Hafshawaty', c2: 'Ayam Semur + Nasi', c3: '08:40 WIB', c4: '67.5 °C', c5: 'Tutup Rapat + Seal Karet', c6: 'Sesuai Standar Panas' },
          { c1: 'Box Kloter 4 - Posyandu Temenggungan', c2: 'Menu 3B Khusus', c3: '09:00 WIB', c4: '65.8 °C', c5: 'Tutup Rapat + Seal Karet', c6: 'Sesuai Standar Panas' },
        ]
      };
    }

    if (currentPath.includes('/gizi/kebersihan-dapur')) {
      return {
        key: 'kebersihan-dapur',
        title: 'Checklist & Kontrol Higiene Kebersihan Dapur',
        badge: 'KEBERSIHAN DAPUR',
        icon: Sparkles,
        color: 'emerald',
        breadcrumbs: ['GIZI', 'KEBERSIHAN DAPUR'],
        description: 'Audit harian sanitasi area dapur SPPG: area basah, pemotongan, washtafel sanitasi, saluran air, dan protokol pembersihan berkala.',
        kpis: [
          { label: 'Skor Sanitasi Dapur', value: '98.5 / 100', status: 'Kategori Grade A (Sempurna)', color: 'emerald' },
          { label: 'Item Checklist Terpenuhi', value: '16 / 16 Item', status: '100% Kepatuhan Harian', color: 'blue' },
          { label: 'Pest Control Status', value: 'Bebas Hama', status: 'Inspeksi Rutin Aktif', color: 'indigo' },
          { label: 'Sanitasi Air Bersih', value: '0.00 E.coli / 100ml', status: 'Standar Air Minum Permenkes', color: 'amber' },
        ],
        columns: ['Area / Fasilitas Dapur', 'Prosedur Sanitasi', 'Frekuensi', 'Kondisi Lapangan', 'Inspektur Sanitarian', 'Status'],
        rows: [
          { c1: 'Lantai Area Pengolahan & Masak', c2: 'Penyikatan + Disinfektan Food Safe', c3: '3x Sehari (Pagi, Siang, Sore)', c4: 'Kering, Tidak Licin, Bebas Minyak', c5: 'Siti Rahmawati, S.Tr.Kes', c6: 'Bersih Sempurna' },
          { c1: 'Meja Stainless Steel Pemorsian', c2: 'Alkohol 70% Food Contact Sanitizer', c3: 'Sebelum & Sesudah Pemorsian', c4: 'Steril Tanpa Residu', c5: 'Siti Rahmawati, S.Tr.Kes', c6: 'Bersih Sempurna' },
          { c1: 'Wastafel Cuci Tangan & Ompreng', c2: 'Sabun Antiseptik + Air Mengalir Hangat', c3: 'Setiap Selesai Digunakan', c4: 'Air Lancar, Sabun & Tisu Terisi', c5: 'Siti Rahmawati, S.Tr.Kes', c6: 'Bersih Sempurna' },
          { c1: 'Tempat Sampah Medis & Organik', c2: 'Tutup Pedal Berfungsi + Plastik Dobel', c3: 'Dikosongkan Maks 4 Jam Sekali', c4: 'Tertutup Rapat, Tidak Ada Lalat', c5: 'Siti Rahmawati, S.Tr.Kes', c6: 'Bersih Sempurna' },
        ]
      };
    }

    // Default overview for /gizi
    return {
      key: 'gizi-overview',
      title: 'Portal Tata Kelola & Standar Mutu Gizi (SPPG)',
      badge: 'GIZI UTAMA',
      icon: UtensilsCrossed,
      color: 'emerald',
      breadcrumbs: ['GIZI', 'DASHBOARD UTAMA GIZI'],
      description: 'Pusat integrasi Master Menu, Siklus AKG, Food Costing, Pemantauan Suhu Rantai Dingin & Masakan, serta Sanitasi Dapur Badan Gizi Nasional.',
      kpis: [
        { label: 'Master Resep Standar', value: '36 Resep', status: 'Aktif di 4 Kelompok', color: 'emerald' },
        { label: 'Kepatuhan Suhu CCP', value: '100% Sesuai SOP', status: 'Pengolahan & Packing Aman', color: 'blue' },
        { label: 'Rata-rata Food Cost', value: 'Rp 13.820', status: 'Efisiensi Anggaran Terjaga', color: 'indigo' },
        { label: 'Skor Higiene Dapur', value: 'Grade A (98.5%)', status: 'Sertifikasi Laik Higiene', color: 'amber' },
      ],
      columns: ['Sub-Modul Menu Gizi', 'Deskripsi Parameter', 'Tingkat Navigasi', 'Status Sistem', 'Kondisi', 'Akses Rute'],
      rows: [
        { c1: 'Master Menu', c2: 'Database resep standar gramatur & komponen makanan bergizi', c3: 'Level 1: /gizi/master-menu', c4: 'Aktif & Terverifikasi', c5: 'Standar SPPG', c6: '/gizi/master-menu' },
        { c1: 'Siklus Menu (Kandungan Gizi)', c2: 'Jadwal siklus 10 hari & analisa AKG (Energi, Protein, Karbo, Lemak)', c3: 'Level 1: /gizi/siklus-menu', c4: 'Aktif & Terverifikasi', c5: 'AKG Lengkap', c6: '/gizi/siklus-menu' },
        { c1: 'Food Cost', c2: 'Perhitungan HPP porsi vs plafon Rp 15.000 / porsi', c3: 'Level 1: /gizi/food-cost', c4: 'Aktif & Terverifikasi', c5: 'Porsi Efisien', c6: '/gizi/food-cost' },
        { c1: 'Suhu - Kelembapan Gudang Kering', c2: 'Higrometer & suhu ruang penyimpanan bahan baku kering (RH 50-65%)', c3: 'Level 2: /gizi/suhu/kelembapan-gudang-kering', c4: 'Sensor Optimal', c5: 'RH 58%', c6: '/gizi/suhu/kelembapan-gudang-kering' },
        { c1: 'Suhu - Freezer', c2: 'Monitoring suhu cold storage beku daging & ikan (≤ -18°C)', c3: 'Level 2: /gizi/suhu/freezer', c4: 'Sensor Optimal', c5: '-19.4 °C', c6: '/gizi/suhu/freezer' },
        { c1: 'Suhu - Chiller', c2: 'Suhu pendingin sayur segar, buah potong, dan telur (0°C - 4°C)', c3: 'Level 2: /gizi/suhu/chiller', c4: 'Sensor Optimal', c5: '2.8 °C', c6: '/gizi/suhu/chiller' },
        { c1: 'Suhu - Pemorsian', c2: 'Pengkondisian suhu ruangan packing bersih ber-AC (18°C - 22°C)', c3: 'Level 2: /gizi/suhu/pemorsian', c4: 'Sensor Optimal', c5: '20.2 °C', c6: '/gizi/suhu/pemorsian' },
        { c1: 'Suhu - Makanan - Pengolahan', c2: 'Critical Control Point (CCP) suhu inti masakan matang (≥ 75°C)', c3: 'Level 3: /gizi/suhu/makanan/pengolahan', c4: 'CCP Terpantau', c5: '88.5 °C Inti', c6: '/gizi/suhu/makanan/pengolahan' },
        { c1: 'Suhu - Makanan - Masuk Ompreng', c2: 'Suhu minimal makanan panas saat pengisian ompreng (≥ 60°C)', c3: 'Level 3: /gizi/suhu/makanan/masuk-ompreng', c4: 'Insulasi Aman', c5: '68.4 °C Hangat', c6: '/gizi/suhu/makanan/masuk-ompreng' },
        { c1: 'Kebersihan Dapur', c2: 'Checklist sanitasi harian, washtafel, saluran pembuangan & higiene personel', c3: 'Level 1: /gizi/kebersihan-dapur', c4: 'Grade A', c5: 'Skor 98.5', c6: '/gizi/kebersihan-dapur' },
      ]
    };
  };

  const config = getFeatureConfig();
  const HeaderIcon = config.icon;

  // Filtered rows
  const filteredRows = config.rows.filter(r =>
    Object.values(r).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Breadcrumbs Row */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500">
          <button
            onClick={() => onNavigate('/gizi')}
            className="hover:text-emerald-600 transition-colors cursor-pointer flex items-center gap-1"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>MODUL GIZI</span>
          </button>
          {config.breadcrumbs.slice(1).map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <span className={idx === config.breadcrumbs.length - 2 ? 'text-emerald-700 dark:text-emerald-400 font-extrabold uppercase' : 'hover:text-slate-600 dark:hover:text-slate-300'}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Title, Badge & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
              <HeaderIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {config.title}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  {config.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                {config.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Data Baru</span>
            </button>
            <button
              onClick={() => triggerToast(`Data laporan ${config.badge} berhasil diekspor ke PDF/Excel!`)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Download Rekapitulasi Data"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => triggerToast('Mencetak lembar logbook resmi SPPG Badan Gizi Nasional...')}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Cetak Logbook"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Sub-navigation bar across all 10 sub-features */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 min-w-max text-xs">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
              Navigasi Cepat:
            </span>
            <button
              onClick={() => onNavigate('/gizi/master-menu')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/gizi/master-menu')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Master Menu
            </button>
            <button
              onClick={() => onNavigate('/gizi/siklus-menu')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/gizi/siklus-menu')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Siklus Menu (AKG)
            </button>
            <button
              onClick={() => onNavigate('/gizi/food-cost')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/gizi/food-cost')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Food Cost
            </button>
            <button
              onClick={() => onNavigate('/gizi/suhu/kelembapan-gudang-kering')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/gizi/suhu/kelembapan-gudang-kering')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Gudang Kering (RH)
            </button>
            <button
              onClick={() => onNavigate('/gizi/suhu/freezer')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/gizi/suhu/freezer')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Freezer
            </button>
            <button
              onClick={() => onNavigate('/gizi/suhu/chiller')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/gizi/suhu/chiller')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Chiller
            </button>
            <button
              onClick={() => onNavigate('/gizi/suhu/pemorsian')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/gizi/suhu/pemorsian')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Ruang Pemorsian
            </button>
            <button
              onClick={() => onNavigate('/gizi/suhu/makanan/pengolahan')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/gizi/suhu/makanan/pengolahan')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              🔥 Suhu Pengolahan (CCP)
            </button>
            <button
              onClick={() => onNavigate('/gizi/suhu/makanan/masuk-ompreng')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/gizi/suhu/makanan/masuk-ompreng')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              📦 Suhu Masuk Ompreng
            </button>
            <button
              onClick={() => onNavigate('/gizi/kebersihan-dapur')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                currentPath.includes('/gizi/kebersihan-dapur')
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Kebersihan Dapur
            </button>
          </div>
        </div>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {config.kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-2xs space-y-2 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
          >
            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {kpi.label}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {kpi.value}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{kpi.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table / Data Section */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Table Filter & Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Daftar Catatan & Verifikasi {config.badge}
            </h2>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredRows.length} Data
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari catatan..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Filter Period Dropdown */}
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <option value="Hari Ini">Hari Ini</option>
              <option value="7 Hari Terakhir">7 Hari Terakhir</option>
              <option value="Bulan Ini">Bulan Ini</option>
            </select>
          </div>
        </div>

        {/* Table Responsive Box */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                {config.columns.map((col, idx) => (
                  <th key={idx} className="py-3 px-4">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-slate-800 dark:text-slate-200 font-medium"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                    {row.c1}
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    {row.c2}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {row.c3}
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">
                    {row.c4}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {row.c5 || 'Normal'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {config.key === 'gizi-overview' ? (
                      <button
                        onClick={() => onNavigate(row.c6 || '/gizi')}
                        className="px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800"
                      >
                        <span>Buka Modul</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => triggerToast(`Membuka rincian data: ${row.c1}`)}
                        className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-emerald-600 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Detail & Audit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Terintegrasi Standar Operasional Prosedur (SOP) Badan Gizi Nasional Republik Indonesia.</span>
          </div>
          <div>Menampilkan {filteredRows.length} dari {config.rows.length} total rekaman</div>
        </div>
      </div>

      {/* Input Form Modal Placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <HeaderIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    Form Pencatatan {config.badge}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Input log parameter harian ke dalam database SPPG
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tanggal & Waktu Pemeriksaan
                </label>
                <input
                  type="datetime-local"
                  defaultValue={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Menu / Area / Titik Uji
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ayam Semur Kloter 1 / Chiller Sayur 01"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nilai Pengukuran (Suhu/RH/Biaya)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 85.5 °C / 58% RH"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Status Evaluasi
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Sesuai Standar">🟢 Sesuai Standar SOP</option>
                    <option value="Perlu Tindakan">🟡 Perlu Penyesuaian</option>
                    <option value="Deviasi">🔴 Kritis (Deviasi)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan / Nama Petugas PIC
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan hasil pengukuran lapangan atau tindakan korektif..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  triggerToast(`Data catatan ${config.badge} berhasil disimpan ke sistem!`);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
