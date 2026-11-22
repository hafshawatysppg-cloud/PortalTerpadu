import { StatusAbsensi } from '../types';

export interface DivisiJamKerjaRule {
  key: string;
  label: string;
  keywords: string[];
  jamMasuk: string;
  jamKeluar: string;
  jamKeluarSetengahHari: string;
}

export const DIVISI_JAM_KERJA_RULES: DivisiJamKerjaRule[] = [
  {
    key: 'persiapan',
    label: 'Divisi Persiapan',
    keywords: ['persiapan', 'siap'],
    jamMasuk: '15:00',
    jamKeluar: '23:00',
    jamKeluarSetengahHari: '19:00'
  },
  {
    key: 'pengolahan',
    label: 'Divisi Pengolahan',
    keywords: ['pengolahan', 'olah', 'juru masak'],
    jamMasuk: '00:00',
    jamKeluar: '09:00',
    jamKeluarSetengahHari: '04:30'
  },
  {
    key: 'pemorsian',
    label: 'Divisi Pemorsian',
    keywords: ['pemorsian', 'porsi', 'packing'],
    jamMasuk: '02:00',
    jamKeluar: '10:00',
    jamKeluarSetengahHari: '06:00'
  },
  {
    key: 'distribusi',
    label: 'Divisi Distribusi',
    keywords: ['distribusi', 'driver', 'armada'],
    jamMasuk: '07:00',
    jamKeluar: '15:00',
    jamKeluarSetengahHari: '11:00'
  },
  {
    key: 'cuci_ompreng',
    label: 'Divisi Cuci Ompreng',
    keywords: ['cuci ompreng', 'ompreng', 'cuci'],
    jamMasuk: '12:00',
    jamKeluar: '20:00',
    jamKeluarSetengahHari: '16:00'
  },
  {
    key: 'kebersihan',
    label: 'Kebersihan',
    keywords: ['kebersihan', 'bersih', 'sanitasi', 'cleaning'],
    jamMasuk: '08:00',
    jamKeluar: '16:00',
    jamKeluarSetengahHari: '12:00'
  },
  {
    key: 'security',
    label: 'Security',
    keywords: ['security', 'keamanan', 'satpam', 'penjaga'],
    jamMasuk: '23:00',
    jamKeluar: '10:00',
    jamKeluarSetengahHari: '04:30'
  },
  {
    key: 'asisten_lapangan',
    label: 'Asisten Lapangan',
    keywords: ['asisten lapangan', 'aslap'],
    jamMasuk: '00:00',
    jamKeluar: '23:00',
    jamKeluarSetengahHari: '11:30'
  },
  {
    key: 'head_chef',
    label: 'Head Chef',
    keywords: ['head chef', 'kepala chef', 'chef'],
    jamMasuk: '00:00',
    jamKeluar: '10:00',
    jamKeluarSetengahHari: '05:00'
  }
];

export const LEGACY_DEFAULT_HOURS = new Set([
  '05:30|14:00',
  '05:30|10:30',
  '05.30|14.00',
  '05.30|10.30'
]);

export function isLegacyDefaultJamKerja(jamMasuk?: string, jamKeluar?: string): boolean {
  const m = (jamMasuk || '').trim();
  const k = (jamKeluar || '').trim();
  if (!m || m === '-' || !k || k === '-') return true;
  return LEGACY_DEFAULT_HOURS.has(`${m}|${k}`);
}

export function matchDivisiJamKerjaRule(jabatan?: string): DivisiJamKerjaRule | null {
  const normalized = (jabatan || '').toLowerCase().trim();
  if (!normalized) return null;

  // Prioritas pencocokan nama persis terlebih dahulu
  for (const rule of DIVISI_JAM_KERJA_RULES) {
    if (normalized === rule.label.toLowerCase()) {
      return rule;
    }
  }

  // Pencocokan berdasarkan kata kunci spesifik (Head Chef sebelum Asisten/dll.)
  for (const rule of DIVISI_JAM_KERJA_RULES) {
    if (rule.keywords.some(kw => normalized.includes(kw))) {
      return rule;
    }
  }

  return null;
}

export function getDefaultJamKerjaByJabatan(
  jabatan?: string,
  statusAbsensi: StatusAbsensi = 'Hadir'
): { jamMasuk: string; jamKeluar: string } {
  if (statusAbsensi !== 'Hadir' && statusAbsensi !== 'Setengah Hari') {
    return { jamMasuk: '-', jamKeluar: '-' };
  }

  const rule = matchDivisiJamKerjaRule(jabatan);
  if (rule) {
    return {
      jamMasuk: rule.jamMasuk,
      jamKeluar: statusAbsensi === 'Setengah Hari' ? rule.jamKeluarSetengahHari : rule.jamKeluar
    };
  }

  return {
    jamMasuk: '08:00',
    jamKeluar: statusAbsensi === 'Setengah Hari' ? '12:00' : '16:00'
  };
}
