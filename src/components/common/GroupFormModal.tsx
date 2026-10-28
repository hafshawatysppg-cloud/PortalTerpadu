import React from 'react';
import {
  X,
  Plus,
  Trash2,
  Building2,
  School,
  GraduationCap,
  Award,
  Baby,
  HeartPulse,
  Users,
  Sparkles,
  Calculator,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Info,
  ChevronDown,
  MapPin,
  Phone,
  User
} from 'lucide-react';
import {
  BeneficiaryGroup,
  KategoriLembaga,
  KlasifikasiPorsi
} from '../../types';
import {
  PortionValidationBadge,
  RealtimeValidationAuditBar,
  calculatePortionValidation
} from './PortionValidationInput';
import { calculateAutoPortion } from '../../utils/portionHelper';

export interface ClassDefinition {
  key: string;
  label: string;
  shortLabel: string;
  portionTier?: KlasifikasiPorsi;
  ageRange?: string;
  desc?: string;
}

export interface KategoriLembagaConfig {
  id: KategoriLembaga;
  label: string;
  shortName: string;
  badge: string;
  desc: string;
  defaultKlasifikasi: KlasifikasiPorsi;
  targetCategory: 'Siswa' | 'Balita' | 'Ibu Hamil' | 'Ibu Menyusui' | '3B' | 'Guru / Staf' | 'Lainnya';
  mainTargetLabel: string;
  teacherLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: {
    bgLight: string;
    border: string;
    text: string;
    badgeBg: string;
    activeBorder: string;
    activeRing: string;
  };
  classes: ClassDefinition[];
}

export const KATEGORI_LEMBAGA_CONFIGS: KategoriLembagaConfig[] = [
  {
    id: 'SD / MI',
    label: 'SD / MI',
    shortName: 'SD / MI',
    badge: 'Kelas 1 - 6 + Guru',
    desc: 'Jenjang pendidikan dasar. Siswa terbagi Kelas 1-3 (Porsi Kecil) dan Kelas 4-6 (Porsi Besar) serta Guru/Staf.',
    defaultKlasifikasi: 'Porsi Kecil',
    targetCategory: 'Siswa',
    mainTargetLabel: 'Siswa',
    teacherLabel: 'Jumlah Guru & Staf Tenaga Pendidik',
    icon: School,
    accentColor: {
      bgLight: 'bg-amber-50/70',
      border: 'border-amber-200',
      text: 'text-amber-800',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      activeBorder: 'border-amber-500',
      activeRing: 'ring-amber-400'
    },
    classes: [
      { key: 'kelas1', label: 'Kelas 1', shortLabel: 'Kls 1', portionTier: 'Porsi Kecil', ageRange: '6-7 Tahun', desc: 'Porsi Kecil' },
      { key: 'kelas2', label: 'Kelas 2', shortLabel: 'Kls 2', portionTier: 'Porsi Kecil', ageRange: '7-8 Tahun', desc: 'Porsi Kecil' },
      { key: 'kelas3', label: 'Kelas 3', shortLabel: 'Kls 3', portionTier: 'Porsi Kecil', ageRange: '8-9 Tahun', desc: 'Porsi Kecil' },
      { key: 'kelas4', label: 'Kelas 4', shortLabel: 'Kls 4', portionTier: 'Porsi Besar', ageRange: '9-10 Tahun', desc: 'Porsi Besar' },
      { key: 'kelas5', label: 'Kelas 5', shortLabel: 'Kls 5', portionTier: 'Porsi Besar', ageRange: '10-11 Tahun', desc: 'Porsi Besar' },
      { key: 'kelas6', label: 'Kelas 6', shortLabel: 'Kls 6', portionTier: 'Porsi Besar', ageRange: '11-12 Tahun', desc: 'Porsi Besar' }
    ]
  },
  {
    id: 'SMP / MTs',
    label: 'SMP / MTs',
    shortName: 'SMP / MTs',
    badge: 'Kelas 7 - 9 + Guru',
    desc: 'Jenjang sekolah menengah pertama. Standar porsi besar untuk seluruh siswa kelas 7-9 dan guru.',
    defaultKlasifikasi: 'Porsi Besar',
    targetCategory: 'Siswa',
    mainTargetLabel: 'Siswa',
    teacherLabel: 'Jumlah Guru & Staf Tenaga Pendidik',
    icon: GraduationCap,
    accentColor: {
      bgLight: 'bg-blue-50/70',
      border: 'border-blue-200',
      text: 'text-blue-800',
      badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
      activeBorder: 'border-blue-500',
      activeRing: 'ring-blue-400'
    },
    classes: [
      { key: 'kelas7', label: 'Kelas 7', shortLabel: 'Kls 7', portionTier: 'Porsi Besar', ageRange: '12-13 Tahun', desc: 'Porsi Besar' },
      { key: 'kelas8', label: 'Kelas 8', shortLabel: 'Kls 8', portionTier: 'Porsi Besar', ageRange: '13-14 Tahun', desc: 'Porsi Besar' },
      { key: 'kelas9', label: 'Kelas 9', shortLabel: 'Kls 9', portionTier: 'Porsi Besar', ageRange: '14-15 Tahun', desc: 'Porsi Besar' }
    ]
  },
  {
    id: 'SMA / SMK / MA',
    label: 'SMA / SMK / MA',
    shortName: 'SMA / SMK / MA',
    badge: 'Kelas 10 - 12 + Guru',
    desc: 'Jenjang sekolah menengah atas & kejuruan dengan porsi besar untuk siswa usia remaja dan guru.',
    defaultKlasifikasi: 'Porsi Besar',
    targetCategory: 'Siswa',
    mainTargetLabel: 'Siswa',
    teacherLabel: 'Jumlah Guru & Staf Tenaga Pendidik',
    icon: Award,
    accentColor: {
      bgLight: 'bg-indigo-50/70',
      border: 'border-indigo-200',
      text: 'text-indigo-800',
      badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      activeBorder: 'border-indigo-500',
      activeRing: 'ring-indigo-400'
    },
    classes: [
      { key: 'kelas10', label: 'Kelas 10', shortLabel: 'Kls 10', portionTier: 'Porsi Besar', ageRange: '15-16 Tahun', desc: 'Porsi Besar' },
      { key: 'kelas11', label: 'Kelas 11', shortLabel: 'Kls 11', portionTier: 'Porsi Besar', ageRange: '16-17 Tahun', desc: 'Porsi Besar' },
      { key: 'kelas12', label: 'Kelas 12', shortLabel: 'Kls 12', portionTier: 'Porsi Besar', ageRange: '17-18 Tahun', desc: 'Porsi Besar' }
    ]
  },
  {
    id: 'PAUD / TK / RA',
    label: 'PAUD / TK',
    shortName: 'PAUD / TK',
    badge: 'KB, TK A, TK B + Guru',
    desc: 'Pendidikan anak usia dini dengan standar porsi menu kecil ramah anak prasekolah dan pengasuh.',
    defaultKlasifikasi: 'Porsi Kecil',
    targetCategory: 'Siswa',
    mainTargetLabel: 'Anak Didik',
    teacherLabel: 'Jumlah Guru PAUD & Tenaga Pengasuh',
    icon: Baby,
    accentColor: {
      bgLight: 'bg-emerald-50/70',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      activeBorder: 'border-emerald-500',
      activeRing: 'ring-emerald-400'
    },
    classes: [
      { key: 'kb', label: 'Kelompok Bermain (KB / SPS)', shortLabel: 'KB', portionTier: 'Porsi Kecil', ageRange: '3-4 Tahun', desc: 'Porsi Kecil' },
      { key: 'tkA', label: 'Taman Kanak-Kanak A (TK A)', shortLabel: 'TK A', portionTier: 'Porsi Kecil', ageRange: '4-5 Tahun', desc: 'Porsi Kecil' },
      { key: 'tkB', label: 'Taman Kanak-Kanak B (TK B)', shortLabel: 'TK B', portionTier: 'Porsi Kecil', ageRange: '5-6 Tahun', desc: 'Porsi Kecil' }
    ]
  },
  {
    id: 'Pondok Pesantren',
    label: 'Pondok Pesantren',
    shortName: 'Pondok Pesantren',
    badge: 'Ula, Wustha, Ulya + Pengasuh',
    desc: 'Lembaga pendidikan keagamaan / asrama santri berjenjang (Ula, Wustha, Ulya) dan pengasuh.',
    defaultKlasifikasi: 'Porsi Besar',
    targetCategory: 'Siswa',
    mainTargetLabel: 'Santri',
    teacherLabel: 'Jumlah Ustadz / Ustadzah & Pengasuh',
    icon: Building2,
    accentColor: {
      bgLight: 'bg-teal-50/70',
      border: 'border-teal-200',
      text: 'text-teal-800',
      badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
      activeBorder: 'border-teal-500',
      activeRing: 'ring-teal-400'
    },
    classes: [
      { key: 'ula', label: 'Santri Tingkat Ula (Dasar)', shortLabel: 'Ula', portionTier: 'Porsi Kecil', ageRange: 'Jenjang Dasar', desc: 'Porsi Kecil' },
      { key: 'wustha', label: 'Santri Tingkat Wustha (Menengah)', shortLabel: 'Wustha', portionTier: 'Porsi Besar', ageRange: 'Jenjang Menengah', desc: 'Porsi Besar' },
      { key: 'ulya', label: 'Santri Tingkat Ulya (Tinggi)', shortLabel: 'Ulya', portionTier: 'Porsi Besar', ageRange: 'Jenjang Tinggi', desc: 'Porsi Besar' }
    ]
  },
  {
    id: '3B (Balita, Ibu Hamil & Ibu Menyusui)',
    label: '3B (Balita, Ibu Hamil & Ibu Menyusui)',
    shortName: '3B',
    badge: 'Bumil - Busui - Balita 5-11 Bln - Balita 12-59 Bln - kader',
    desc: 'Kategori terpadu 3B: Bumil, Busui, Balita 5-11 Bln, Balita 12-59 Bln, dan Kader Posyandu.',
    defaultKlasifikasi: 'Bumil & Busui',
    targetCategory: '3B',
    mainTargetLabel: 'Sasaran 3B',
    teacherLabel: 'Jumlah Kader Posyandu & Bidan Pendamping',
    icon: HeartPulse,
    accentColor: {
      bgLight: 'bg-rose-50/70',
      border: 'border-rose-200',
      text: 'text-rose-800',
      badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
      activeBorder: 'border-rose-500',
      activeRing: 'ring-rose-400'
    },
    classes: [
      { key: 'busui_w', label: 'Busui (W)', shortLabel: 'Busui', portionTier: 'Porsi Besar', ageRange: '0 - 12 Bulan', desc: 'Porsi Besar (Busui)' },
      { key: 'bumil_w', label: 'Bumil (W)', shortLabel: 'Bumil', portionTier: 'Porsi Besar', ageRange: 'Trimester 1 - 3', desc: 'Porsi Besar (Bumil)' },
      { key: 'balita511_l', label: 'Balita 5-11 Bln (L)', shortLabel: '5-11 Bln (L)', portionTier: 'Porsi Kecil', ageRange: '5 - 11 Bulan', desc: 'Porsi Kecil (Balita)' },
      { key: 'balita511_p', label: 'Balita 5-11 Bln (P)', shortLabel: '5-11 Bln (P)', portionTier: 'Porsi Kecil', ageRange: '5 - 11 Bulan', desc: 'Porsi Kecil (Balita)' },
      { key: 'balita1259_l', label: 'Balita 12-59 Bln (L)', shortLabel: '12-59 Bln (L)', portionTier: 'Porsi Kecil', ageRange: '12 - 59 Bulan', desc: 'Porsi Kecil (Balita)' },
      { key: 'balita1259_p', label: 'Balita 12-59 Bln (P)', shortLabel: '12-59 Bln (P)', portionTier: 'Porsi Kecil', ageRange: '12 - 59 Bulan', desc: 'Porsi Kecil (Balita)' },
      { key: 'kader_l', label: 'Kader (L)', shortLabel: 'Kader (L)', portionTier: 'Porsi Besar', ageRange: 'Kader Posyandu', desc: 'Porsi Besar (Kader)' },
      { key: 'kader_p', label: 'Kader (P)', shortLabel: 'Kader (P)', portionTier: 'Porsi Besar', ageRange: 'Kader Posyandu', desc: 'Porsi Besar (Kader)' }
    ]
  },
  {
    id: 'Lainnya',
    label: 'Lainnya',
    shortName: 'Lainnya',
    badge: 'Sasaran Fleksibel + Staf',
    desc: 'Lembaga umum, panti sosial, atau kelompok penerima manfaat dengan klasifikasi fleksibel.',
    defaultKlasifikasi: 'Porsi Besar',
    targetCategory: 'Lainnya',
    mainTargetLabel: 'Penerima Manfaat',
    teacherLabel: 'Jumlah Pembina / Guru / Staf Pengelola',
    icon: Sparkles,
    accentColor: {
      bgLight: 'bg-slate-100/70',
      border: 'border-slate-300',
      text: 'text-slate-800',
      badgeBg: 'bg-slate-200 text-slate-800 border-slate-300',
      activeBorder: 'border-slate-700',
      activeRing: 'ring-slate-400'
    },
    classes: [
      { key: 'kelompok1', label: 'Kelompok Sasaran Tingkat 1', shortLabel: 'Kelompok 1', portionTier: 'Porsi Besar', desc: 'Tingkat 1' },
      { key: 'kelompok2', label: 'Kelompok Sasaran Tingkat 2', shortLabel: 'Kelompok 2', portionTier: 'Porsi Besar', desc: 'Tingkat 2' }
    ]
  }
];

export const getKategoriConfig = (kategori?: string): KategoriLembagaConfig => {
  if (!kategori) return KATEGORI_LEMBAGA_CONFIGS[0];
  const norm = (kategori || '').trim().toLowerCase();

  // 1. Prioritas utama: pencocokan persis pada id, label, atau shortName
  const exact = KATEGORI_LEMBAGA_CONFIGS.find(k => 
    k.id.toLowerCase() === norm || 
    k.label.toLowerCase() === norm || 
    k.shortName.toLowerCase() === norm
  );
  if (exact) return exact;

  // 2. Pencocokan kata kunci terfokus (3B HARUS dicek pertama sebelum SD/MI untuk mencegah 'hamil' terdeteksi 'mi')
  if (
    norm.includes('3b') ||
    norm.includes('baliat') ||
    norm.includes('balita') ||
    norm.includes('bumil') ||
    norm.includes('busui') ||
    norm.includes('hamil') ||
    norm.includes('menyusui') ||
    norm.includes('posyandu')
  ) {
    const found3B = KATEGORI_LEMBAGA_CONFIGS.find(k => k.id.includes('3B'));
    if (found3B) return found3B;
  }

  if (norm.includes('paud') || norm.includes(' tk') || norm.startsWith('tk') || norm.includes('/tk') || norm.includes(' ra ') || norm.includes('taman kanak') || norm.includes('kb ')) {
    const foundPaud = KATEGORI_LEMBAGA_CONFIGS.find(k => k.id === 'PAUD / TK / RA');
    if (foundPaud) return foundPaud;
  }

  if (norm.includes('pesantren') || norm.includes('santri') || norm.includes('ponpes')) {
    const foundPonpes = KATEGORI_LEMBAGA_CONFIGS.find(k => k.id === 'Pondok Pesantren');
    if (foundPonpes) return foundPonpes;
  }

  if (norm.includes('smp') || norm.includes('mts')) {
    const foundSmp = KATEGORI_LEMBAGA_CONFIGS.find(k => k.id === 'SMP / MTs');
    if (foundSmp) return foundSmp;
  }

  if (norm.includes('sma') || norm.includes('smk') || norm.includes(' ma ') || norm.includes('/ma') || norm.includes('aliyah')) {
    const foundSma = KATEGORI_LEMBAGA_CONFIGS.find(k => k.id === 'SMA / SMK / MA');
    if (foundSma) return foundSma;
  }

  // Khusus SD / MI menggunakan batas kata agar kata seperti 'hamil' atau 'ekonomi' tidak salah terdeteksi
  if (
    norm.includes('sd ') ||
    norm.startsWith('sd') ||
    norm.includes('/sd') ||
    norm.includes(' mi') ||
    norm.startsWith('mi') ||
    norm.includes('/mi') ||
    norm.includes('sekolah dasar') ||
    norm.includes('madrasah ibtidaiyah')
  ) {
    const foundSd = KATEGORI_LEMBAGA_CONFIGS.find(k => k.id === 'SD / MI');
    if (foundSd) return foundSd;
  }

  return KATEGORI_LEMBAGA_CONFIGS[0];
};

export const inferKategoriFromText = (nama: string = '', fallback: KategoriLembaga = 'SD / MI'): KategoriLembaga => {
  const n = (nama || '').toLowerCase();
  if (n.includes('3b') || n.includes('baliat') || n.includes('balita') || n.includes('posyandu') || n.includes('bumil') || n.includes('busui') || n.includes('hamil') || n.includes('menyusui')) return '3B (Balita, Ibu Hamil & Ibu Menyusui)';
  if (n.includes('paud') || n.includes('tk ') || n.includes('tk-') || n.includes('taman kanak') || n.includes('kb ') || n.includes('ra ')) return 'PAUD / TK / RA';
  if (n.includes('smp') || n.includes('mts')) return 'SMP / MTs';
  if (n.includes('sma') || n.includes('smk') || n.includes('ma ') || n.includes('aliyah')) return 'SMA / SMK / MA';
  if (n.includes('pesantren') || n.includes('santri') || n.includes('ponpes')) return 'Pondok Pesantren';
  if (n.includes('sd ') || n.startsWith('sd') || n.includes('mi ') || n.startsWith('mi') || n.includes('sekolah dasar')) return 'SD / MI';
  return fallback;
};

interface GroupFormModalProps {
  isOpen: boolean;
  editingGroup: Partial<BeneficiaryGroup>;
  setEditingGroup: (grp: Partial<BeneficiaryGroup> | null) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onDelete?: (id: string, nama: string) => void;
}

export const GroupFormModal: React.FC<GroupFormModalProps> = ({
  isOpen,
  editingGroup,
  setEditingGroup,
  onClose,
  onSave,
  onDelete
}) => {
  if (!isOpen || !editingGroup) return null;

  const currentCategory: KategoriLembaga = editingGroup.kategoriLembaga || inferKategoriFromText(editingGroup.nama, 'SD / MI');
  const activeConfig = getKategoriConfig(currentCategory);

  // Switch category and recalculate breakdown fields
  const handleSelectCategory = (newCat: KategoriLembaga) => {
    const newConf = getKategoriConfig(newCat);
    const is3B = newConf.targetCategory === '3B' || newConf.id.includes('3B');

    const isCustomName = Boolean(
      editingGroup.nama && 
      !editingGroup.nama.startsWith('Kelompok Sasaran #') &&
      !KATEGORI_LEMBAGA_CONFIGS.some(c => editingGroup.nama === c.label || editingGroup.nama === c.shortName || editingGroup.nama === c.id) &&
      !editingGroup.nama.startsWith('SD') &&
      !editingGroup.nama.startsWith('SMP') &&
      !editingGroup.nama.startsWith('SMA') &&
      !editingGroup.nama.startsWith('PAUD') &&
      !editingGroup.nama.startsWith('TK') &&
      !editingGroup.nama.startsWith('3B') &&
      editingGroup.nama !== '3B (Balita, Ibu Hamil & Ibu Menyusui)' &&
      editingGroup.nama !== '3B'
    );

    const newName = isCustomName 
      ? editingGroup.nama! 
      : (is3B ? '3B (Balita, Ibu Hamil & Ibu Menyusui)' : newConf.label);

    const currentList = editingGroup.lembagaList || [];
    const updatedList = (currentList.length > 0 ? currentList : [
      {
        namaInstansi: is3B
          ? 'Posyandu Desa Temenggungan'
          : newConf.id.includes('SMP')
          ? 'SMP ZAINUL HASAN 1 GENGGONG'
          : `${newConf.shortName} - Instansi 1`,
        targetSiswa: 0,
        targetGuru: 0,
        targetBalita: 0,
        targetBumilBusui: 0,
        total: 0,
        klasifikasiPorsi: newConf.defaultKlasifikasi,
        breakdownKelas: {}
      }
    ]).map((l: any, lIdx: number) => {
      const prevInstName = l.namaInstansi || '';
      const isDefaultInstName = !prevInstName || 
        prevInstName.includes('SD Negeri') || 
        prevInstName.includes('Instansi') || 
        prevInstName.includes('SD / MI') ||
        prevInstName.includes('Posyandu / Lembaga') ||
        KATEGORI_LEMBAGA_CONFIGS.some(c => prevInstName.startsWith(c.shortName) || prevInstName.startsWith(c.label));

      const newInstName = isDefaultInstName
        ? (is3B
            ? (lIdx === 0 ? 'Posyandu Desa Temenggungan' : `Posyandu Desa Temenggungan Pos ${lIdx + 1}`)
            : newConf.id.includes('SMP')
            ? (lIdx === 0 ? 'SMP ZAINUL HASAN 1 GENGGONG' : `SMP Zainul Hasan Genggong ${lIdx + 1}`)
            : newConf.id.includes('SD')
            ? (lIdx === 0 ? 'SD Zainul Hasan Genggong' : `SD Zainul Hasan ${lIdx + 1}`)
            : `${newConf.shortName} - Instansi ${lIdx + 1}`)
        : prevInstName;

      const existingBd = l.breakdownKelas || {};
      const newBd: Record<string, number> = {};
      newConf.classes.forEach(c => {
        newBd[c.key] = existingBd[c.key] || 0;
      });

      const sumCls = newConf.classes.reduce((sum, c) => sum + (Number(newBd[c.key]) || 0), 0);
      let g = Number(l.targetGuru) || 0;
      const isBalita = newConf.targetCategory === 'Balita' && !is3B;
      const isBumil = newConf.targetCategory === 'Ibu Hamil' && !is3B;

      let bVal = 0;
      let bbVal = 0;
      let sVal = 0;
      let totalLembaga = sumCls + g;

      if (is3B) {
        const bW = existingBd['busui_w'] !== undefined ? existingBd['busui_w'] : (existingBd['busui'] || (l.targetBumilBusui ? Math.floor(l.targetBumilBusui / 2) : 0));
        const mW = existingBd['bumil_w'] !== undefined ? existingBd['bumil_w'] : (existingBd['bumil'] || (l.targetBumilBusui ? Math.ceil(l.targetBumilBusui / 2) : 0));
        
        const rawBaduta = existingBd['baduta'] || (l.targetBalita ? Math.ceil(l.targetBalita / 2) : 0);
        const rawBalita = existingBd['balita'] || (l.targetBalita ? Math.floor(l.targetBalita / 2) : 0);
        
        const b511L = existingBd['balita511_l'] !== undefined ? existingBd['balita511_l'] : Math.ceil(rawBaduta / 2);
        const b511P = existingBd['balita511_p'] !== undefined ? existingBd['balita511_p'] : Math.floor(rawBaduta / 2);
        const b1259L = existingBd['balita1259_l'] !== undefined ? existingBd['balita1259_l'] : Math.ceil(rawBalita / 2);
        const b1259P = existingBd['balita1259_p'] !== undefined ? existingBd['balita1259_p'] : Math.floor(rawBalita / 2);
        const kL = existingBd['kader_l'] !== undefined ? existingBd['kader_l'] : 0;
        const kP = existingBd['kader_p'] !== undefined ? existingBd['kader_p'] : 0;

        newBd['busui_w'] = bW;
        newBd['busui'] = bW;
        newBd['bumil_w'] = mW;
        newBd['bumil'] = mW;
        newBd['balita511_l'] = b511L;
        newBd['balita511_p'] = b511P;
        newBd['baduta'] = b511L + b511P;
        newBd['balita1259_l'] = b1259L;
        newBd['balita1259_p'] = b1259P;
        newBd['balita'] = b1259L + b1259P;
        newBd['kader_l'] = kL;
        newBd['kader_p'] = kP;
        newBd['kader'] = kL + kP;

        const totBalita511 = b511L + b511P;
        const totBalita1259 = b1259L + b1259P;
        const totKader = kL + kP;

        bVal = totBalita511 + totBalita1259;
        bbVal = (Number(bW) || 0) + (Number(mW) || 0);
        g = 0; // Guru/staf is strictly 0 for 3B
        sVal = 0;
        totalLembaga = bVal + bbVal + totKader;
      } else if (isBalita) {
        bVal = sumCls;
      } else if (isBumil) {
        bbVal = sumCls;
      } else {
        sVal = sumCls;
      }

      const autoP = calculateAutoPortion({
        kategoriLembaga: newCat,
        namaInstansi: newInstName,
        breakdownKelas: newBd,
        targetSiswa: sVal,
        targetGuru: is3B ? 0 : g,
        targetBalita: bVal,
        targetBumilBusui: bbVal,
        total: totalLembaga
      });

      return {
        ...l,
        namaInstansi: newInstName,
        kategoriLembaga: newCat,
        klasifikasiPorsi: autoP.klasifikasi,
        breakdownKelas: newBd,
        targetSiswa: sVal,
        targetBalita: bVal,
        targetBumilBusui: bbVal,
        targetGuru: g,
        total: totalLembaga
      };
    });

    const groupAutoP = calculateAutoPortion({
      kategoriLembaga: newCat,
      namaInstansi: newName,
      targetSiswa: updatedList.reduce((acc: number, item: any) => acc + (item.targetSiswa || 0), 0),
      targetGuru: updatedList.reduce((acc: number, item: any) => acc + (item.targetGuru || 0), 0),
      targetBalita: updatedList.reduce((acc: number, item: any) => acc + (item.targetBalita || 0), 0),
      targetBumilBusui: updatedList.reduce((acc: number, item: any) => acc + (item.targetBumilBusui || 0), 0)
    });

    setEditingGroup({
      ...editingGroup,
      nama: newName,
      kategoriLembaga: newCat,
      kategoriUtama: newConf.targetCategory,
      klasifikasiPorsi: groupAutoP.klasifikasi,
      lembagaList: updatedList
    });
  };

  // Add new institution inside this group
  const handleAddLembaga = () => {
    const list = editingGroup.lembagaList || [];
    const nextIdx = list.length + 1;
    const initialBd: Record<string, number> = {};
    activeConfig.classes.forEach(c => {
      initialBd[c.key] = 0;
    });

    if (activeConfig.id.includes('3B') || activeConfig.targetCategory === '3B') {
      initialBd['busui_w'] = 0;
      initialBd['bumil_w'] = 0;
      initialBd['balita511_l'] = 0;
      initialBd['balita511_p'] = 0;
      initialBd['balita1259_l'] = 0;
      initialBd['balita1259_p'] = 0;
      initialBd['kader_l'] = 0;
      initialBd['kader_p'] = 0;
      initialBd['baduta'] = 0;
      initialBd['balita'] = 0;
      initialBd['bumil'] = 0;
      initialBd['busui'] = 0;
      initialBd['kader'] = 0;
    }

    const is3B = activeConfig.id.includes('3B') || activeConfig.targetCategory === '3B';
    const isSmp = activeConfig.id.includes('SMP');
    const isSd = activeConfig.id.includes('SD');
    const newInstName = is3B
      ? (nextIdx === 1 ? 'Posyandu Desa Temenggungan' : `Posyandu Desa Temenggungan Pos ${nextIdx}`)
      : isSmp
      ? (nextIdx === 1 ? 'SMP ZAINUL HASAN 1 GENGGONG' : `SMP Zainul Hasan Genggong ${nextIdx}`)
      : isSd
      ? (nextIdx === 1 ? 'SD Zainul Hasan Genggong' : `SD Zainul Hasan ${nextIdx}`)
      : `${editingGroup.nama || activeConfig.shortName} - Instansi ${nextIdx}`;
    const autoP = calculateAutoPortion({
      kategoriLembaga: currentCategory,
      namaInstansi: newInstName,
      breakdownKelas: initialBd,
      targetSiswa: 0,
      targetGuru: 0,
      targetBalita: 0,
      targetBumilBusui: 0,
      total: 0
    });

    const newItem = {
      namaInstansi: newInstName,
      kategoriLembaga: currentCategory,
      breakdownKelas: initialBd,
      targetSiswa: 0,
      targetGuru: 0,
      targetBalita: 0,
      targetBumilBusui: 0,
      total: 0,
      klasifikasiPorsi: autoP.klasifikasi
    };

    setEditingGroup({
      ...editingGroup,
      lembagaList: [...list, newItem]
    });
  };

  // Update a 3B demography field (Busui, Bumil, Balita 5-11, Balita 12-59, Kader)
  const handle3BValueChange = (lembagaIdx: number, fieldKey: string, rawVal: string) => {
    const num = Math.max(0, parseInt(rawVal, 10) || 0);
    const list = [...(editingGroup.lembagaList || [])];
    const item = { ...list[lembagaIdx] };
    const bd = { ...(item.breakdownKelas || {}) };
    bd[fieldKey] = num;

    const bW = fieldKey === 'busui_w' ? num : (bd['busui_w'] !== undefined ? bd['busui_w'] : (bd['busui'] || 0));
    const mW = fieldKey === 'bumil_w' ? num : (bd['bumil_w'] !== undefined ? bd['bumil_w'] : (bd['bumil'] || 0));
    const b511L = fieldKey === 'balita511_l' ? num : (bd['balita511_l'] || 0);
    const b511P = fieldKey === 'balita511_p' ? num : (bd['balita511_p'] || 0);
    const b1259L = fieldKey === 'balita1259_l' ? num : (bd['balita1259_l'] || 0);
    const b1259P = fieldKey === 'balita1259_p' ? num : (bd['balita1259_p'] || 0);
    const kL = fieldKey === 'kader_l' ? num : (bd['kader_l'] || 0);
    const kP = fieldKey === 'kader_p' ? num : (bd['kader_p'] || 0);

    const tBusui = Number(bW) || 0;
    const tBumil = Number(mW) || 0;
    const tBalita511 = (Number(b511L) || 0) + (Number(b511P) || 0);
    const tBalita1259 = (Number(b1259L) || 0) + (Number(b1259P) || 0);
    const tKader = (Number(kL) || 0) + (Number(kP) || 0);

    // Sync canonical keys for downstream modules
    bd['busui_w'] = tBusui;
    bd['busui'] = tBusui;
    bd['bumil_w'] = tBumil;
    bd['bumil'] = tBumil;
    bd['balita511_l'] = Number(b511L) || 0;
    bd['balita511_p'] = Number(b511P) || 0;
    bd['baduta'] = tBalita511;
    bd['balita1259_l'] = Number(b1259L) || 0;
    bd['balita1259_p'] = Number(b1259P) || 0;
    bd['balita'] = tBalita1259;
    bd['kader_l'] = Number(kL) || 0;
    bd['kader_p'] = Number(kP) || 0;
    bd['kader'] = tKader;

    const tBalita = tBalita511 + tBalita1259;
    const tBumilBusui = tBusui + tBumil;

    item.breakdownKelas = bd;
    item.targetBalita = tBalita;
    item.targetBumilBusui = tBumilBusui;
    item.targetGuru = 0;
    item.targetKader = tKader;
    item.targetSiswa = 0;
    item.total = tBalita + tBumilBusui + tKader;

    const autoP = calculateAutoPortion({
      kategoriLembaga: item.kategoriLembaga || currentCategory,
      namaInstansi: item.namaInstansi,
      breakdownKelas: bd,
      targetSiswa: 0,
      targetBalita: tBalita,
      targetBumilBusui: tBumilBusui,
      targetGuru: 0,
      total: item.total
    });
    item.klasifikasiPorsi = autoP.klasifikasi;

    list[lembagaIdx] = item;
    setEditingGroup({ ...editingGroup, lembagaList: list });
  };

  // Update a single class target
  const handleClassValueChange = (lembagaIdx: number, classKey: string, rawVal: string) => {
    const num = Math.max(0, parseInt(rawVal, 10) || 0);
    const list = [...(editingGroup.lembagaList || [])];
    const item = { ...list[lembagaIdx] };
    const itemCat = item.kategoriLembaga || currentCategory;
    const itemConf = getKategoriConfig(itemCat);

    const bd = { ...(item.breakdownKelas || {}), [classKey]: num };
    item.breakdownKelas = bd;

    // Recalculate class sum
    const sumClasses = itemConf.classes.reduce((sum, c) => sum + (Number(bd[c.key]) || 0), 0);
    const g = Number(item.targetGuru) || 0;

    const is3B = itemConf.targetCategory === '3B' || itemConf.id.includes('3B');
    if (is3B) {
      handle3BValueChange(lembagaIdx, classKey, rawVal);
      return;
    } else if (itemConf.targetCategory === 'Balita') {
      item.targetBalita = sumClasses;
      item.targetSiswa = 0;
      item.targetBumilBusui = 0;
    } else if (itemConf.targetCategory === 'Ibu Hamil') {
      item.targetBumilBusui = sumClasses;
      item.targetSiswa = 0;
      item.targetBalita = 0;
    } else {
      item.targetSiswa = sumClasses;
      item.targetBalita = 0;
      item.targetBumilBusui = 0;
    }

    item.total = sumClasses + g;

    const autoP = calculateAutoPortion({
      kategoriLembaga: itemCat,
      namaInstansi: item.namaInstansi,
      breakdownKelas: bd,
      targetSiswa: item.targetSiswa,
      targetGuru: g,
      targetBalita: item.targetBalita,
      targetBumilBusui: item.targetBumilBusui,
      total: item.total
    });
    item.klasifikasiPorsi = autoP.klasifikasi;

    list[lembagaIdx] = item;
    setEditingGroup({ ...editingGroup, lembagaList: list });
  };

  // Update teacher / staff target
  const handleGuruChange = (lembagaIdx: number, rawVal: string) => {
    const g = Math.max(0, parseInt(rawVal, 10) || 0);
    const list = [...(editingGroup.lembagaList || [])];
    const item = { ...list[lembagaIdx] };
    item.targetGuru = g;

    const mainTarget = Number(item.targetSiswa) || Number(item.targetBalita) || Number(item.targetBumilBusui) || 0;
    item.total = mainTarget + g;

    const autoP = calculateAutoPortion({
      kategoriLembaga: item.kategoriLembaga || currentCategory,
      namaInstansi: item.namaInstansi,
      breakdownKelas: item.breakdownKelas,
      targetSiswa: item.targetSiswa,
      targetGuru: g,
      targetBalita: item.targetBalita,
      targetBumilBusui: item.targetBumilBusui,
      total: item.total
    });
    item.klasifikasiPorsi = autoP.klasifikasi;

    list[lembagaIdx] = item;
    setEditingGroup({ ...editingGroup, lembagaList: list });
  };

  // Remove institution
  const handleRemoveLembaga = (idx: number) => {
    const list = [...(editingGroup.lembagaList || [])];
    list.splice(idx, 1);
    setEditingGroup({ ...editingGroup, lembagaList: list });
  };

  // Switch category for a specific institution
  const handleLembagaCategorySwitch = (lembagaIdx: number, newCat: KategoriLembaga) => {
    const list = [...(editingGroup.lembagaList || [])];
    const item = { ...list[lembagaIdx] };
    const itemConf = getKategoriConfig(newCat);

    const newBd: Record<string, number> = {};
    itemConf.classes.forEach(c => {
      newBd[c.key] = (item.breakdownKelas && item.breakdownKelas[c.key]) || 0;
    });

    const sumClasses = itemConf.classes.reduce((sum, c) => sum + (Number(newBd[c.key]) || 0), 0);
    let g = Number(item.targetGuru) || 0;

    item.kategoriLembaga = newCat;
    item.klasifikasiPorsi = itemConf.defaultKlasifikasi;
    item.breakdownKelas = newBd;

    const is3B = itemConf.targetCategory === '3B' || itemConf.id.includes('3B');
    if (is3B) {
      const bW = newBd['busui_w'] !== undefined ? newBd['busui_w'] : (newBd['busui'] || (item.targetBumilBusui ? Math.floor(item.targetBumilBusui / 2) : 0));
      const mW = newBd['bumil_w'] !== undefined ? newBd['bumil_w'] : (newBd['bumil'] || (item.targetBumilBusui ? Math.ceil(item.targetBumilBusui / 2) : 0));
      const rawBaduta = newBd['baduta'] || (item.targetBalita ? Math.ceil(item.targetBalita / 2) : 0);
      const rawBalita = newBd['balita'] || (item.targetBalita ? Math.floor(item.targetBalita / 2) : 0);
      const b511L = newBd['balita511_l'] !== undefined ? newBd['balita511_l'] : Math.ceil(rawBaduta / 2);
      const b511P = newBd['balita511_p'] !== undefined ? newBd['balita511_p'] : Math.floor(rawBaduta / 2);
      const b1259L = newBd['balita1259_l'] !== undefined ? newBd['balita1259_l'] : Math.ceil(rawBalita / 2);
      const b1259P = newBd['balita1259_p'] !== undefined ? newBd['balita1259_p'] : Math.floor(rawBalita / 2);
      const kL = newBd['kader_l'] !== undefined ? newBd['kader_l'] : (g ? Math.ceil(g / 2) : 0);
      const kP = newBd['kader_p'] !== undefined ? newBd['kader_p'] : (g ? Math.floor(g / 2) : 0);

      newBd['busui_w'] = bW;
      newBd['busui'] = bW;
      newBd['bumil_w'] = mW;
      newBd['bumil'] = mW;
      newBd['balita511_l'] = b511L;
      newBd['balita511_p'] = b511P;
      newBd['baduta'] = b511L + b511P;
      newBd['balita1259_l'] = b1259L;
      newBd['balita1259_p'] = b1259P;
      newBd['balita'] = b1259L + b1259P;
      newBd['kader_l'] = kL;
      newBd['kader_p'] = kP;
      newBd['kader'] = kL + kP;

      const totBalita511 = b511L + b511P;
      const totBalita1259 = b1259L + b1259P;
      const totKader = kL + kP;

      item.targetBalita = totBalita511 + totBalita1259;
      item.targetBumilBusui = (Number(bW) || 0) + (Number(mW) || 0);
      item.targetGuru = 0;
      item.targetKader = totKader;
      item.targetSiswa = 0;
      item.total = item.targetBalita + item.targetBumilBusui + totKader;
      if (!item.namaInstansi || item.namaInstansi.includes('SD Negeri') || item.namaInstansi.includes('Instansi') || item.namaInstansi.includes('Posyandu / Lembaga')) {
        item.namaInstansi = lembagaIdx === 0 ? 'Posyandu Desa Temenggungan' : `Posyandu Desa Temenggungan Pos ${lembagaIdx + 1}`;
      }
    } else if (itemConf.targetCategory === 'Balita') {
      item.targetBalita = sumClasses;
      item.targetSiswa = 0;
      item.targetBumilBusui = 0;
      item.total = sumClasses + g;
    } else if (itemConf.targetCategory === 'Ibu Hamil') {
      item.targetBumilBusui = sumClasses;
      item.targetSiswa = 0;
      item.targetBalita = 0;
      item.total = sumClasses + g;
    } else {
      item.targetSiswa = sumClasses;
      item.targetBalita = 0;
      item.targetBumilBusui = 0;
      item.total = sumClasses + g;
    }

    const autoP = calculateAutoPortion({
      kategoriLembaga: newCat,
      namaInstansi: item.namaInstansi,
      breakdownKelas: newBd,
      targetSiswa: item.targetSiswa,
      targetGuru: item.targetGuru,
      targetBalita: item.targetBalita,
      targetBumilBusui: item.targetBumilBusui,
      total: item.total
    });
    item.klasifikasiPorsi = autoP.klasifikasi;

    list[lembagaIdx] = item;

    // Sinkronisasi kategori dan nama kelompok jika diubah ke 3B atau jika single-lembaga
    const shouldSyncGroup = is3B || list.length === 1;
    setEditingGroup({
      ...editingGroup,
      kategoriLembaga: shouldSyncGroup ? newCat : (editingGroup.kategoriLembaga || currentCategory),
      kategoriUtama: shouldSyncGroup ? itemConf.targetCategory : editingGroup.kategoriUtama,
      nama: is3B ? '3B (Balita, Ibu Hamil & Ibu Menyusui)' : (shouldSyncGroup && (!editingGroup.nama || KATEGORI_LEMBAGA_CONFIGS.some(c => editingGroup.nama?.startsWith(c.shortName) || editingGroup.nama?.startsWith(c.label))) ? itemConf.label : editingGroup.nama),
      klasifikasiPorsi: is3B ? 'Porsi Besar & Porsi Kecil' : (shouldSyncGroup ? autoP.klasifikasi : editingGroup.klasifikasiPorsi),
      lembagaList: list
    });
  };

  // Total summary across all institutions in the form
  const totalLembagaCount = (editingGroup.lembagaList || []).length;
  let formTotalPorsiKecil = 0;
  let formTotalPorsiBesar = 0;
  (editingGroup.lembagaList || []).forEach((l: any) => {
    const res = calculateAutoPortion({
      kategoriLembaga: l.kategoriLembaga || currentCategory,
      namaInstansi: l.namaInstansi,
      breakdownKelas: l.breakdownKelas || {},
      targetSiswa: l.targetSiswa,
      targetGuru: l.targetGuru,
      targetBalita: l.targetBalita,
      targetBumilBusui: l.targetBumilBusui,
      total: l.total
    });
    formTotalPorsiKecil += res.porsiKecil;
    formTotalPorsiBesar += res.porsiBesar;
  });
  const grandTotalPortions = formTotalPorsiKecil + formTotalPorsiBesar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-7 space-y-6 max-h-[92vh] overflow-y-auto my-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Form Penambahan & Spesifikasi Kelompok
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Modul Penerima Manfaat
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                {editingGroup.id ? 'Edit Kelompok & Spesifikasi Lembaga' : 'Form Penambahan Kelompok Baru'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih <span className="font-semibold text-slate-700">Kategori Lembaga</span> untuk menyesuaikan <span className="font-semibold text-emerald-700">BREAKDOWN DEMOGRAFI PENERIMA</span> secara otomatis berdasarkan kelas dan jumlah guru.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Tutup Form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} noValidate className="space-y-6">
          {/* STEP 1: PILIH KATEGORI LEMBAGA (DROPDOWN SELECTOR) */}
          <div className="space-y-3 bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label htmlFor="kategori-lembaga-select" className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  1. Pilih Kategori Lembaga / Satuan Pendidikan
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pilih kategori lembaga untuk menyesuaikan BREAKDOWN DEMOGRAFI PENERIMA (sesuai kelas dan jumlah guru).
                </p>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 w-fit">
                Kategori Terpilih: <strong className="text-emerald-700 font-extrabold">{activeConfig.id.includes('3B') ? '3B' : activeConfig.label}</strong>
              </span>
            </div>

            {/* Dropdown Kategori Lembaga persis seperti gambar */}
            <div className="relative">
              <select
                id="kategori-lembaga-select"
                value={currentCategory}
                onChange={(e) => handleSelectCategory(e.target.value as KategoriLembaga)}
                className="w-full px-4 py-3 bg-white border-2 border-emerald-500/40 hover:border-emerald-500 focus:border-emerald-600 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 shadow-xs transition-all cursor-pointer appearance-none"
              >
                {KATEGORI_LEMBAGA_CONFIGS.map((cfg) => (
                  <option key={cfg.id} value={cfg.id} className="py-2 text-sm font-semibold text-slate-900">
                    {cfg.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-emerald-700">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>

            {/* Info Badge ringkasan kategori aktif & Standar Porsi Otomatis */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Breakdown: <strong className="font-extrabold">{activeConfig.id.includes('3B') ? 'Bumil - Busui - Balita 5-11 Bln - Balita 12-59 Bln - kader' : activeConfig.badge}</strong>
                </span>
                <span className="text-emerald-400">•</span>
                <span>
                  Jumlah Kolom: <strong className="font-extrabold">{activeConfig.classes.length} {activeConfig.id.includes('3B') ? 'Sasaran' : 'Kelas'}</strong>
                </span>
                <span className="text-emerald-400">•</span>
                <span>
                  Sasaran Utama: <strong className="font-extrabold">{activeConfig.mainTargetLabel}</strong>
                </span>
                <span className="text-emerald-400">•</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Standar Porsi Otomatis:</span>
                  </span>
                  <strong className="font-extrabold text-blue-900 bg-white/90 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                    {activeConfig.id.includes('3B') ? (
                      <span className="inline-flex items-center gap-1.5 flex-wrap">
                        <span className="text-emerald-800">bumil, busui, kader porsi besar</span>
                        <span className="text-slate-400 font-normal">,</span>
                        <span className="text-blue-800">Balita 5-11 Bln - Balita 12-59 Bln porsi kecil</span>
                      </span>
                    ) : activeConfig.id === 'PAUD / TK / RA' ? (
                      '🥣 Porsi Kecil'
                    ) : activeConfig.id === 'SD / MI' ? (
                      '🥣 Kls 1-3 Kecil · 🍱 Kls 4-6 & Guru Besar'
                    ) : (
                      '🍱 Porsi Besar'
                    )}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* STEP 2: IDENTITAS KELOMPOK, ALAMAT & KONTAK PIC */}
          <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              2. Identitas Kelompok, Alamat & Kontak PIC
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Kelompok */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Kelompok *
                </label>
                <input
                  type="text"
                  value={editingGroup.nama || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, nama: e.target.value })}
                  placeholder={`e.g. ${activeConfig.label} Kraksaan`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Identitas kelompok sasaran penerima manfaat.
                </span>
              </div>

              {/* Alamat Sekolah / Wilayah */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Alamat Sekolah / Wilayah
                </label>
                <input
                  type="text"
                  value={editingGroup.alamat || editingGroup.deskripsi || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, alamat: e.target.value, deskripsi: e.target.value })}
                  placeholder="e.g. Jl. Raya Kraksaan No. 45, Kab. Probolinggo"
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Alamat lengkap lokasi sekolah / lembaga penerima manfaat.
                </span>
              </div>

              {/* Nama PIC (Penanggung Jawab) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  Nama PIC (Penanggung Jawab)
                </label>
                <input
                  type="text"
                  value={editingGroup.picNama || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, picNama: e.target.value })}
                  placeholder="e.g. Bpk. Ahmad Fauzi, S.Pd / Bidan Siti"
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Nama koordinator atau penanggung jawab kelompok.
                </span>
              </div>

              {/* Nomor Kontak */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Nomor Kontak (WhatsApp / Telepon)
                </label>
                <input
                  type="tel"
                  value={editingGroup.nomorKontak || editingGroup.picKontak || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, nomorKontak: e.target.value, picKontak: e.target.value })}
                  placeholder="e.g. 0812-3456-7890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Nomor kontak aktif penanggung jawab untuk koordinasi distribusi.
                </span>
              </div>
            </div>
          </div>

          {/* STEP 3: DAFTAR LEMBAGA & "BREAKDOWN DEMOGRAFI PENERIMA" */}
          <div className="space-y-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                    <School className="w-4 h-4 text-emerald-600" />
                    3. BREAKDOWN DEMOGRAFI PENERIMA SETIAP LEMBAGA
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {totalLembagaCount} Lembaga
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Isi jumlah sasaran pada masing-masing kolom kelas dan jumlah guru. Sistem menghitung subtotal siswa dan total porsi secara otomatis.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddLembaga}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Lembaga / Instansi</span>
              </button>
            </div>

            {/* Lembaga List with Responsive Class Demographics */}
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {(!editingGroup.lembagaList || editingGroup.lembagaList.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  Belum ada lembaga/instansi yang ditambahkan. Klik tombol <span className="font-bold text-slate-700">+ Tambah Lembaga / Instansi</span> di atas untuk menambahkan data sasaran.
                </div>
              ) : (
                editingGroup.lembagaList.map((item: any, idx: number) => {
                  const itemCat = item.kategoriLembaga || currentCategory;
                  const itemConf = getKategoriConfig(itemCat);
                  const itemBd = item.breakdownKelas || {};
                  const is3BItem = itemCat.includes('3B') || itemConf.id.includes('3B') || itemConf.targetCategory === '3B';

                  // Class sum for this item
                  const sumClassesThisItem = itemConf.classes.reduce(
                    (sum, cls) => sum + (Number(itemBd[cls.key]) || 0),
                    0
                  );
                  const numGuruThisItem = Number(item.targetGuru) || 0;

                  // 3B Specific Demography Calculations
                  const busuiW = itemBd.busui_w !== undefined ? itemBd.busui_w : (itemBd.busui || 0);
                  const totBusui = Number(busuiW) || 0;

                  const bumilW = itemBd.bumil_w !== undefined ? itemBd.bumil_w : (itemBd.bumil || 0);
                  const totBumil = Number(bumilW) || 0;

                  const balita511L = itemBd.balita511_l !== undefined ? itemBd.balita511_l : (itemBd.baduta ? Math.ceil(itemBd.baduta / 2) : 0);
                  const balita511P = itemBd.balita511_p !== undefined ? itemBd.balita511_p : (itemBd.baduta ? Math.floor(itemBd.baduta / 2) : 0);
                  const totBalita511 = (Number(balita511L) || 0) + (Number(balita511P) || 0);

                  const balita1259L = itemBd.balita1259_l !== undefined ? itemBd.balita1259_l : (itemBd.balita ? Math.ceil(itemBd.balita / 2) : 0);
                  const balita1259P = itemBd.balita1259_p !== undefined ? itemBd.balita1259_p : (itemBd.balita ? Math.floor(itemBd.balita / 2) : 0);
                  const totBalita1259 = (Number(balita1259L) || 0) + (Number(balita1259P) || 0);

                  const kaderL = itemBd.kader_l !== undefined ? itemBd.kader_l : 0;
                  const kaderP = itemBd.kader_p !== undefined ? itemBd.kader_p : 0;
                  const totKader = (Number(kaderL) || 0) + (Number(kaderP) || 0);

                  const totBalitaAll = totBalita511 + totBalita1259;
                  const totBumilBusuiAll = totBusui + totBumil;

                  const totalPorsiThisItem = is3BItem
                    ? (totBalitaAll + totBumilBusuiAll + totKader)
                    : (sumClassesThisItem + numGuruThisItem);

                  const autoPortionItem = calculateAutoPortion({
                    kategoriLembaga: itemCat,
                    namaInstansi: item.namaInstansi,
                    breakdownKelas: itemBd,
                    targetSiswa: is3BItem ? 0 : sumClassesThisItem,
                    targetGuru: is3BItem ? 0 : numGuruThisItem,
                    targetBalita: is3BItem ? totBalitaAll : (itemConf.targetCategory === 'Balita' ? sumClassesThisItem : 0),
                    targetBumilBusui: is3BItem ? totBumilBusuiAll : (itemConf.targetCategory === 'Ibu Hamil' ? sumClassesThisItem : 0),
                    total: totalPorsiThisItem
                  });

                  const validation = calculatePortionValidation({
                    namaInstansi: item.namaInstansi,
                    klasifikasiPorsi: autoPortionItem.klasifikasi,
                    targetMain: is3BItem ? (totBalitaAll + totBumilBusuiAll) : sumClassesThisItem,
                    targetGuru: is3BItem ? 0 : numGuruThisItem,
                    targetBalita: is3BItem ? totBalitaAll : (itemConf.targetCategory === 'Balita' ? sumClassesThisItem : undefined),
                    targetBumilBusui: is3BItem ? totBumilBusuiAll : (itemConf.targetCategory === 'Ibu Hamil' ? sumClassesThisItem : undefined)
                  });

                  return (
                    <div
                      key={idx}
                      className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 space-y-3.5 hover:border-emerald-300 hover:bg-slate-50 transition-all"
                    >
                      {/* Lembaga Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-2.5 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 max-w-md">
                            <input
                              type="text"
                              value={item.namaInstansi || ''}
                              onChange={(e) => {
                                const list = [...(editingGroup.lembagaList || [])];
                                list[idx] = { ...list[idx], namaInstansi: e.target.value };
                                setEditingGroup({ ...editingGroup, lembagaList: list });
                              }}
                              placeholder={`Nama Lembaga #${idx + 1} (e.g. ${itemConf.shortName} Negeri 1)`}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Kategori Lembaga selector for this item */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400">Kategori:</span>
                            <select
                              value={itemCat}
                              onChange={(e) => handleLembagaCategorySwitch(idx, e.target.value as KategoriLembaga)}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800"
                            >
                              {KATEGORI_LEMBAGA_CONFIGS.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.shortName}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Pembagian Porsi Otomatis (Tanpa Perlu Memilih Dropdown Manual) */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400">Porsi Otomatis:</span>
                            <div
                              className={`px-3 py-1 rounded-xl border text-[11px] font-black flex items-center gap-1.5 shadow-2xs ${autoPortionItem.badgePill.color}`}
                              title={`Pembagian porsi otomatis: ${autoPortionItem.summaryLabel}`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{autoPortionItem.badgePill.text}</span>
                              <span className="text-[10px] font-bold opacity-80">({autoPortionItem.badgePill.subtext})</span>
                            </div>
                          </div>

                          {/* Delete / Clear Lembaga Button */}
                          {editingGroup.lembagaList && editingGroup.lembagaList.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveLembaga(idx)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              title="Hapus Lembaga Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const currentList = editingGroup.lembagaList ? [...editingGroup.lembagaList] : [];
                                if (currentList[idx]) {
                                  currentList[idx] = {
                                    ...currentList[idx],
                                    namaLembaga: '',
                                    alamat: '',
                                    kontakPerson: '',
                                    targetSiswa: 0,
                                    targetGuru: 0,
                                    breakdownKelas: {}
                                  };
                                  setEditingGroup({ ...editingGroup, lembagaList: currentList });
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              title="Kosongkan / Reset Lembaga Ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Baris Kontak & PIC Lembaga Sasaran (Opsional Spesifik Lembaga) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white/70 p-2.5 rounded-xl border border-slate-200/70">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            PIC Lembaga:
                          </span>
                          <input
                            type="text"
                            value={item.picNama || item.kontakPerson || ''}
                            onChange={(e) => {
                              const list = [...(editingGroup.lembagaList || [])];
                              list[idx] = { ...list[idx], picNama: e.target.value, kontakPerson: e.target.value };
                              setEditingGroup({ ...editingGroup, lembagaList: list });
                            }}
                            placeholder="Nama PIC lembaga (opsional)"
                            className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            No. Kontak:
                          </span>
                          <input
                            type="tel"
                            value={item.nomorKontak || item.picKontak || ''}
                            onChange={(e) => {
                              const list = [...(editingGroup.lembagaList || [])];
                              list[idx] = { ...list[idx], nomorKontak: e.target.value, picKontak: e.target.value };
                              setEditingGroup({ ...editingGroup, lembagaList: list });
                            }}
                            placeholder="WhatsApp / Telepon PIC lembaga (opsional)"
                            className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* BREAKDOWN DEMOGRAFI PENERIMA CONTAINER */}
                      {is3BItem ? (
                        /* 3B CUSTOM BREAKDOWN DEMOGRAFI PENERIMA - PERSIS SESUAI GAMBAR */
                        <div className="space-y-3">
                          <div className="rounded-xl overflow-hidden border border-[#182353]/30 shadow-xs bg-white">
                            {/* Dark Navy Header Bar persis seperti gambar */}
                            <div className="bg-[#182353] text-white px-4 py-2.5 flex items-center gap-2.5">
                              <Users className="w-5 h-5 text-white shrink-0" />
                              <span className="font-black tracking-wide text-xs sm:text-sm uppercase">
                                BREAKDOWN DEMOGRAFI PENERIMA
                              </span>
                            </div>

                            {/* Table persis sesuai gambar */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-center border-collapse min-w-[680px]">
                                <thead>
                                  {/* Row 1: Group Headers */}
                                  <tr className="bg-[#eef5fc] border-b border-[#bfd6f2] text-[#183962] font-black text-xs">
                                    <th colSpan={2} className="py-2.5 px-3 border-r border-[#bfd6f2]">
                                      Busui
                                    </th>
                                    <th colSpan={2} className="py-2.5 px-3 border-r border-[#bfd6f2]">
                                      Bumil
                                    </th>
                                    <th colSpan={3} className="py-2.5 px-3 border-r border-[#bfd6f2]">
                                      Balita 5-11 Bln
                                    </th>
                                    <th colSpan={3} className="py-2.5 px-3 border-r border-[#bfd6f2]">
                                      Balita 12-59 Bln
                                    </th>
                                    <th colSpan={3} className="py-2.5 px-3">
                                      Kader
                                    </th>
                                  </tr>

                                  {/* Row 2: Sub-columns */}
                                  <tr className="bg-[#f4f8fd] border-b border-[#bfd6f2] text-[#183962] font-extrabold text-xs">
                                    {/* Busui */}
                                    <th className="py-1.5 px-2 border-r border-[#bfd6f2] w-20">W</th>
                                    <th className="py-1.5 px-2 border-r border-[#bfd6f2] w-14 bg-blue-100/30 text-blue-950 font-black">Tot</th>

                                    {/* Bumil */}
                                    <th className="py-1.5 px-2 border-r border-[#bfd6f2] w-20">W</th>
                                    <th className="py-1.5 px-2 border-r border-[#bfd6f2] w-14 bg-blue-100/30 text-blue-950 font-black">Tot</th>

                                    {/* Balita 5-11 Bln */}
                                    <th className="py-1.5 px-2 border-r border-[#bfd6f2] w-20">L</th>
                                    <th className="py-1.5 px-2 border-r border-[#bfd6f2] w-20">P</th>
                                    <th className="py-1.5 px-2 border-r border-[#bfd6f2] w-14 bg-blue-100/30 text-blue-950 font-black">Tot</th>

                                    {/* Balita 12-59 Bln */}
                                    <th className="py-1.5 px-2 border-r border-[#bfd6f2] w-20">L</th>
                                    <th className="py-1.5 px-2 border-r border-[#bfd6f2] w-20">P</th>
                                    <th className="py-1.5 px-2 border-r border-[#bfd6f2] w-14 bg-blue-100/30 text-blue-950 font-black">Tot</th>

                                    {/* Kader */}
                                    <th className="py-1.5 px-2 border-r border-[#bfd6f2] w-20">L</th>
                                    <th className="py-1.5 px-2 border-r border-[#bfd6f2] w-20">P</th>
                                    <th className="py-1.5 px-2 w-14 bg-blue-100/30 text-blue-950 font-black">Tot</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="bg-white">
                                    {/* Busui */}
                                    <td className="p-2 border-r border-[#bfd6f2]">
                                      <input
                                        type="number"
                                        min="0"
                                        value={itemBd.busui_w !== undefined ? (itemBd.busui_w === 0 ? '' : itemBd.busui_w) : (itemBd.busui === 0 ? '' : itemBd.busui || '')}
                                        onChange={(e) => handle3BValueChange(idx, 'busui_w', e.target.value)}
                                        placeholder=""
                                        className="w-full text-center py-1.5 px-1 bg-white border border-slate-300 rounded-[4px] text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                                      />
                                    </td>
                                    <td className="p-2 border-r border-[#bfd6f2] font-black text-xs text-slate-900 bg-slate-50/70">
                                      {totBusui}
                                    </td>

                                    {/* Bumil */}
                                    <td className="p-2 border-r border-[#bfd6f2]">
                                      <input
                                        type="number"
                                        min="0"
                                        value={itemBd.bumil_w !== undefined ? (itemBd.bumil_w === 0 ? '' : itemBd.bumil_w) : (itemBd.bumil === 0 ? '' : itemBd.bumil || '')}
                                        onChange={(e) => handle3BValueChange(idx, 'bumil_w', e.target.value)}
                                        placeholder=""
                                        className="w-full text-center py-1.5 px-1 bg-white border border-slate-300 rounded-[4px] text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                                      />
                                    </td>
                                    <td className="p-2 border-r border-[#bfd6f2] font-black text-xs text-slate-900 bg-slate-50/70">
                                      {totBumil}
                                    </td>

                                    {/* Balita 5-11 Bln */}
                                    <td className="p-2 border-r border-[#bfd6f2]">
                                      <input
                                        type="number"
                                        min="0"
                                        value={itemBd.balita511_l === 0 ? '' : (itemBd.balita511_l || '')}
                                        onChange={(e) => handle3BValueChange(idx, 'balita511_l', e.target.value)}
                                        placeholder=""
                                        className="w-full text-center py-1.5 px-1 bg-white border border-slate-300 rounded-[4px] text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                                      />
                                    </td>
                                    <td className="p-2 border-r border-[#bfd6f2]">
                                      <input
                                        type="number"
                                        min="0"
                                        value={itemBd.balita511_p === 0 ? '' : (itemBd.balita511_p || '')}
                                        onChange={(e) => handle3BValueChange(idx, 'balita511_p', e.target.value)}
                                        placeholder=""
                                        className="w-full text-center py-1.5 px-1 bg-white border border-slate-300 rounded-[4px] text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                                      />
                                    </td>
                                    <td className="p-2 border-r border-[#bfd6f2] font-black text-xs text-slate-900 bg-slate-50/70">
                                      {totBalita511}
                                    </td>

                                    {/* Balita 12-59 Bln */}
                                    <td className="p-2 border-r border-[#bfd6f2]">
                                      <input
                                        type="number"
                                        min="0"
                                        value={itemBd.balita1259_l === 0 ? '' : (itemBd.balita1259_l || '')}
                                        onChange={(e) => handle3BValueChange(idx, 'balita1259_l', e.target.value)}
                                        placeholder=""
                                        className="w-full text-center py-1.5 px-1 bg-white border border-slate-300 rounded-[4px] text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                                      />
                                    </td>
                                    <td className="p-2 border-r border-[#bfd6f2]">
                                      <input
                                        type="number"
                                        min="0"
                                        value={itemBd.balita1259_p === 0 ? '' : (itemBd.balita1259_p || '')}
                                        onChange={(e) => handle3BValueChange(idx, 'balita1259_p', e.target.value)}
                                        placeholder=""
                                        className="w-full text-center py-1.5 px-1 bg-white border border-slate-300 rounded-[4px] text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                                      />
                                    </td>
                                    <td className="p-2 border-r border-[#bfd6f2] font-black text-xs text-slate-900 bg-slate-50/70">
                                      {totBalita1259}
                                    </td>

                                    {/* Kader */}
                                    <td className="p-2 border-r border-[#bfd6f2]">
                                      <input
                                        type="number"
                                        min="0"
                                        value={itemBd.kader_l === 0 ? '' : (itemBd.kader_l || '')}
                                        onChange={(e) => handle3BValueChange(idx, 'kader_l', e.target.value)}
                                        placeholder=""
                                        className="w-full text-center py-1.5 px-1 bg-white border border-slate-300 rounded-[4px] text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                                      />
                                    </td>
                                    <td className="p-2 border-r border-[#bfd6f2]">
                                      <input
                                        type="number"
                                        min="0"
                                        value={itemBd.kader_p === 0 ? '' : (itemBd.kader_p || '')}
                                        onChange={(e) => handle3BValueChange(idx, 'kader_p', e.target.value)}
                                        placeholder=""
                                        className="w-full text-center py-1.5 px-1 bg-white border border-slate-300 rounded-[4px] text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                                      />
                                    </td>
                                    <td className="p-2 font-black text-xs text-slate-900 bg-slate-50/70">
                                      {totKader}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Dynamic Formula Display & Badges for 3B */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                                Subtotal 3B:
                              </span>
                              <span className="font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-[11px]">
                                Balita: {totBalitaAll}
                              </span>
                              <span className="font-extrabold text-rose-900 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 text-[11px]">
                                Bumil: {totBumil} • Busui: {totBusui}
                              </span>
                              <span className="font-extrabold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
                                Kader: {totKader}
                              </span>
                              <span className="font-black text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-200 text-[11px] ml-1">
                                🥣 {autoPortionItem.porsiKecil} Porsi Kecil
                              </span>
                              <span className="font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-[11px]">
                                🍱 {autoPortionItem.porsiBesar} Porsi Besar
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-700">
                                Total: <strong className="text-blue-900 font-black">{totalPorsiThisItem} Porsi</strong>
                              </span>
                              <PortionValidationBadge
                                subtotal={validation.subtotal}
                                formula={validation.formula}
                                compact={false}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* STANDARD BREAKDOWN DEMOGRAFI PENERIMA FOR SCHOOLS / OTHER CATEGORIES */
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                                BREAKDOWN DEMOGRAFI PENERIMA
                              </span>
                              <span className="text-xs font-bold text-slate-700">
                                {itemConf.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-extrabold text-slate-500">
                                Subtotal {itemConf.mainTargetLabel}:
                              </span>
                              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-lg border border-emerald-300">
                                {sumClassesThisItem} {itemConf.mainTargetLabel}
                              </span>
                            </div>
                          </div>

                          {/* GRID OF CLASS INPUTS */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                            {itemConf.classes.map((cls) => {
                              const val = itemBd[cls.key] !== undefined ? itemBd[cls.key] : 0;

                              return (
                                <div
                                  key={cls.key}
                                  className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col justify-between"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-extrabold text-slate-800">
                                      {cls.label}
                                    </label>
                                    {cls.portionTier && (
                                      <span className={`text-[8px] font-extrabold px-1 rounded ${
                                        cls.portionTier === 'Porsi Kecil' ? 'bg-amber-100 text-amber-800' :
                                        cls.portionTier === 'Porsi Besar' ? 'bg-blue-100 text-blue-800' :
                                        cls.portionTier === 'Porsi Balita' ? 'bg-rose-100 text-rose-800' :
                                        'bg-fuchsia-100 text-fuchsia-800'
                                      }`}>
                                        {cls.portionTier.replace('Porsi ', '')}
                                      </span>
                                    )}
                                  </div>

                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      value={val === 0 ? '' : val}
                                      onChange={(e) => handleClassValueChange(idx, cls.key, e.target.value)}
                                      placeholder="0"
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-slate-900 text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                  </div>

                                  {cls.ageRange && (
                                    <span className="text-[9px] text-slate-400 mt-1 text-center block">
                                      {cls.ageRange}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* ROW: JUMLAH GURU / TENAGA PENDIDIK & SUBTOTAL FORMULA */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-2 border-t border-slate-100">
                            {/* Guru / Staf Input */}
                            <div className="md:col-span-5 flex items-center gap-2">
                              <div className="flex-1">
                                <label className="text-[11px] font-extrabold text-slate-700 block mb-0.5">
                                  {itemConf.teacherLabel}
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    value={numGuruThisItem === 0 ? '' : numGuruThisItem}
                                    onChange={(e) => handleGuruChange(idx, e.target.value)}
                                    placeholder="0"
                                    className="w-full px-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 text-left focus:ring-2 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Dynamic Formula Display */}
                            <div className="md:col-span-4 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 text-center">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                                Pembagian Porsi Otomatis
                              </span>
                              <span className="text-xs font-bold text-slate-700">
                                {autoPortionItem.summaryLabel}
                              </span>
                            </div>

                            {/* Total Badge */}
                            <div className="md:col-span-3 flex justify-end">
                              <PortionValidationBadge
                                subtotal={validation.subtotal}
                                formula={validation.formula}
                                compact={false}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* LIVE AUDIT SUMMARY BAR ACROSS ALL INSTITUTIONS */}
            {editingGroup.lembagaList && editingGroup.lembagaList.length > 0 && (
              <div className="pt-2 space-y-2.5">
                <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Akumulasi Porsi Otomatis Seluruh Lembaga
                      </span>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-cyan-300 font-extrabold bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800 text-xs">
                          🥣 Porsi Kecil: {formTotalPorsiKecil.toLocaleString('id-ID')}
                        </span>
                        <span className="text-blue-300 font-extrabold bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-800 text-xs">
                          🍱 Porsi Besar: {formTotalPorsiBesar.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Seluruh Sasaran</span>
                    <span className="text-lg font-black text-emerald-400">
                      {grandTotalPortions.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-300">Porsi</span>
                    </span>
                  </div>
                </div>

                <RealtimeValidationAuditBar
                  totalItems={totalLembagaCount}
                  totalSubtotal={grandTotalPortions}
                  isValid={true}
                  unitLabel="Lembaga"
                />
              </div>
            )}
          </div>

          {/* Form Actions (Cancel, Delete, Save) */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {editingGroup.id && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(editingGroup.id!, editingGroup.nama || '')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-bold border border-rose-200 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Kelompok
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingGroup({
                    nama: '',
                    kategoriUtama: 'Siswa',
                    kategoriLembaga: 'SD / MI',
                    klasifikasiPorsi: 'Porsi Kecil',
                    deskripsi: '',
                    status: 'Aktif',
                    lembagaList: [
                      {
                        namaLembaga: '',
                        kategoriLembaga: 'SD / MI',
                        klasifikasiPorsi: 'Porsi Kecil',
                        alamat: '',
                        kontakPerson: '',
                        targetSiswa: 0,
                        targetGuru: 0,
                        breakdownKelas: {}
                      }
                    ]
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl text-xs font-semibold transition-all cursor-pointer border border-transparent hover:border-rose-200"
                title="Hapus / Reset semua isian input form"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset / Hapus Isian Form</span>
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-slate-900/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Simpan Kelompok & Spesifikasi Lembaga</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
