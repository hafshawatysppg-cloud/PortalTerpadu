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
  MapPin
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
    id: '3B (Baliat, Ibu Hamil & Ibu Menyusui)',
    label: '3B (Baliat, Ibu Hamil & Ibu Menyusui)',
    shortName: '3B (Baliat, Ibu Hamil & Ibu Menyusui)',
    badge: 'Baduta, Balita, Bumil & Busui',
    desc: 'Kategori terpadu 3B: Balita (Baduta/Balita), Ibu Hamil (Trimester 1-3), dan Ibu Menyusui pencegahan stunting & 1000 HPK.',
    defaultKlasifikasi: 'Bumil & Busui',
    targetCategory: '3B',
    mainTargetLabel: 'Sasaran 3B',
    teacherLabel: 'Jumlah Bidan Desa & Kader Posyandu',
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
      { key: 'baduta', label: 'Baduta (6 - 23 Bulan)', shortLabel: 'Baduta', portionTier: 'Porsi Balita', ageRange: '6 - 23 Bulan', desc: 'Porsi Balita (MP-ASI)' },
      { key: 'balita', label: 'Balita (24 - 59 Bulan)', shortLabel: 'Balita', portionTier: 'Porsi Balita', ageRange: '24 - 59 Bulan', desc: 'Porsi Balita' },
      { key: 'bumil', label: 'Ibu Hamil (Trimester 1 - 3)', shortLabel: 'Ibu Hamil', portionTier: 'Porsi Ibu Hamil', ageRange: 'Usia 1 - 9 Bulan', desc: 'Porsi Bumil' },
      { key: 'busui', label: 'Ibu Menyusui (0 - 12 Bulan)', shortLabel: 'Ibu Menyusui', portionTier: 'Porsi Ibu Menyusui', ageRange: '0 - 12 Bulan', desc: 'Porsi Busui' }
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
  const found = KATEGORI_LEMBAGA_CONFIGS.find(k => 
    k.id.toLowerCase() === norm || 
    k.label.toLowerCase() === norm || 
    k.shortName.toLowerCase() === norm ||
    (norm.includes('paud') && k.id === 'PAUD / TK / RA') ||
    (norm.includes('tk') && k.id === 'PAUD / TK / RA') ||
    (norm.includes('sd') && k.id === 'SD / MI') ||
    (norm.includes('mi') && k.id === 'SD / MI') ||
    (norm.includes('smp') && k.id === 'SMP / MTs') ||
    (norm.includes('mts') && k.id === 'SMP / MTs') ||
    (norm.includes('sma') && k.id === 'SMA / SMK / MA') ||
    (norm.includes('smk') && k.id === 'SMA / SMK / MA') ||
    (norm.includes('pesantren') && k.id === 'Pondok Pesantren') ||
    ((norm.includes('3b') || norm.includes('baliat') || norm.includes('balita') || norm.includes('bumil') || norm.includes('busui') || norm.includes('hamil') || norm.includes('menyusui') || norm.includes('posyandu')) && k.id.includes('3B'))
  );
  return found || KATEGORI_LEMBAGA_CONFIGS[0];
};

export const inferKategoriFromText = (nama: string = '', fallback: KategoriLembaga = 'SD / MI'): KategoriLembaga => {
  const n = (nama || '').toLowerCase();
  if (n.includes('paud') || n.includes('tk ') || n.includes('tk-') || n.includes('taman kanak') || n.includes('kb ') || n.includes('ra ')) return 'PAUD / TK / RA';
  if (n.includes('smp') || n.includes('mts')) return 'SMP / MTs';
  if (n.includes('sma') || n.includes('smk') || n.includes('ma ') || n.includes('aliyah')) return 'SMA / SMK / MA';
  if (n.includes('3b') || n.includes('baliat') || n.includes('balita') || n.includes('posyandu') || n.includes('bumil') || n.includes('busui') || n.includes('hamil') || n.includes('menyusui')) return '3B (Baliat, Ibu Hamil & Ibu Menyusui)';
  if (n.includes('pesantren') || n.includes('santri') || n.includes('ponpes')) return 'Pondok Pesantren';
  if (n.includes('sd') || n.includes('mi ') || n.includes('sekolah dasar')) return 'SD / MI';
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
    const prevName = editingGroup.nama || '';
    const wasDefault = !prevName || KATEGORI_LEMBAGA_CONFIGS.some(c => prevName === c.shortName || prevName.startsWith(c.shortName));
    const newName = wasDefault ? `${newConf.shortName} (Kelas ${newConf.badge.split('+')[0].trim()})` : prevName;

    const currentList = editingGroup.lembagaList || [];
    const updatedList = (currentList.length > 0 ? currentList : [
      {
        namaInstansi: `${newConf.shortName} - Instansi 1`,
        targetSiswa: 0,
        targetGuru: 0,
        targetBalita: 0,
        targetBumilBusui: 0,
        total: 0,
        klasifikasiPorsi: newConf.defaultKlasifikasi,
        breakdownKelas: {}
      }
    ]).map((l: any, lIdx: number) => {
      const existingBd = l.breakdownKelas || {};
      const newBd: Record<string, number> = {};
      newConf.classes.forEach(c => {
        newBd[c.key] = existingBd[c.key] || 0;
      });

      const sumCls = newConf.classes.reduce((sum, c) => sum + (Number(newBd[c.key]) || 0), 0);
      const g = Number(l.targetGuru) || 0;
      const is3B = newConf.targetCategory === '3B' || newConf.id.includes('3B');
      const isBalita = newConf.targetCategory === 'Balita' && !is3B;
      const isBumil = newConf.targetCategory === 'Ibu Hamil' && !is3B;

      let bVal = 0;
      let bbVal = 0;
      let sVal = 0;

      if (is3B) {
        bVal = (Number(newBd['baduta']) || 0) + (Number(newBd['balita']) || 0);
        bbVal = (Number(newBd['bumil']) || 0) + (Number(newBd['busui']) || 0);
      } else if (isBalita) {
        bVal = sumCls;
      } else if (isBumil) {
        bbVal = sumCls;
      } else {
        sVal = sumCls;
      }

      return {
        ...l,
        namaInstansi: l.namaInstansi || `${newConf.shortName} - Instansi ${lIdx + 1}`,
        kategoriLembaga: newCat,
        klasifikasiPorsi: l.klasifikasiPorsi || newConf.defaultKlasifikasi,
        breakdownKelas: newBd,
        targetSiswa: sVal,
        targetBalita: bVal,
        targetBumilBusui: bbVal,
        total: sumCls + g
      };
    });

    setEditingGroup({
      ...editingGroup,
      nama: newName,
      kategoriLembaga: newCat,
      kategoriUtama: newConf.targetCategory,
      klasifikasiPorsi: editingGroup.klasifikasiPorsi || newConf.defaultKlasifikasi,
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

    const newItem = {
      namaInstansi: `${editingGroup.nama || activeConfig.shortName} - Instansi ${nextIdx}`,
      kategoriLembaga: currentCategory,
      breakdownKelas: initialBd,
      targetSiswa: 0,
      targetGuru: 0,
      targetBalita: 0,
      targetBumilBusui: 0,
      total: 0,
      klasifikasiPorsi: editingGroup.klasifikasiPorsi || activeConfig.defaultKlasifikasi
    };

    setEditingGroup({
      ...editingGroup,
      lembagaList: [...list, newItem]
    });
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
      item.targetBalita = (Number(bd['baduta']) || 0) + (Number(bd['balita']) || 0);
      item.targetBumilBusui = (Number(bd['bumil']) || 0) + (Number(bd['busui']) || 0);
      item.targetSiswa = 0;
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
    const g = Number(item.targetGuru) || 0;

    item.kategoriLembaga = newCat;
    item.klasifikasiPorsi = itemConf.defaultKlasifikasi;
    item.breakdownKelas = newBd;

    const is3B = itemConf.targetCategory === '3B' || itemConf.id.includes('3B');
    if (is3B) {
      item.targetBalita = (Number(newBd['baduta']) || 0) + (Number(newBd['balita']) || 0);
      item.targetBumilBusui = (Number(newBd['bumil']) || 0) + (Number(newBd['busui']) || 0);
      item.targetSiswa = 0;
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
    list[lembagaIdx] = item;
    setEditingGroup({ ...editingGroup, lembagaList: list });
  };

  // Total summary across all institutions in the form
  const totalLembagaCount = (editingGroup.lembagaList || []).length;
  const totalStudentsAll = (editingGroup.lembagaList || []).reduce((acc: number, l: any) => {
    return acc + (Number(l.targetSiswa) || Number(l.targetBalita) || Number(l.targetBumilBusui) || 0);
  }, 0);
  const totalGuruAll = (editingGroup.lembagaList || []).reduce((acc: number, l: any) => acc + (Number(l.targetGuru) || 0), 0);
  const grandTotalPortions = totalStudentsAll + totalGuruAll;

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

        <form onSubmit={onSave} className="space-y-6">
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
                Kategori Terpilih: <strong className="text-emerald-700 font-extrabold">{activeConfig.label}</strong>
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

            {/* Info Badge ringkasan kategori aktif */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Breakdown Sasaran: <strong className="font-extrabold">{activeConfig.badge}</strong>
                </span>
                <span className="text-emerald-400">•</span>
                <span>
                  Jumlah Kolom: <strong className="font-extrabold">{activeConfig.classes.length} {activeConfig.id.includes('3B') ? 'Sasaran' : 'Kelas'}</strong>
                </span>
                <span className="text-emerald-400">•</span>
                <span>
                  Sasaran Utama: <strong className="font-extrabold">{activeConfig.mainTargetLabel}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* STEP 2: IDENTITAS KELOMPOK & ALAMAT SEKOLAH */}
          <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              2. Identitas Kelompok & Alamat Sekolah
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

              {/* Alamat Sekolah (menggantikan deskripsi, klasifikasi porsi dihapus) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Alamat Sekolah
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

                  // Class sum for this item
                  const sumClassesThisItem = itemConf.classes.reduce(
                    (sum, cls) => sum + (Number(itemBd[cls.key]) || 0),
                    0
                  );
                  const numGuruThisItem = Number(item.targetGuru) || 0;
                  const totalPorsiThisItem = sumClassesThisItem + numGuruThisItem;

                  const validation = calculatePortionValidation({
                    namaInstansi: item.namaInstansi,
                    klasifikasiPorsi: item.klasifikasiPorsi || itemConf.defaultKlasifikasi,
                    targetMain: sumClassesThisItem,
                    targetGuru: numGuruThisItem,
                    targetBalita: itemConf.targetCategory === 'Balita' ? sumClassesThisItem : undefined,
                    targetBumilBusui: itemConf.targetCategory === 'Ibu Hamil' ? sumClassesThisItem : undefined
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

                          {/* Klasifikasi Porsi */}
                          <select
                            value={item.klasifikasiPorsi || itemConf.defaultKlasifikasi}
                            onChange={(e) => {
                              const list = [...(editingGroup.lembagaList || [])];
                              list[idx] = { ...list[idx], klasifikasiPorsi: e.target.value as KlasifikasiPorsi };
                              setEditingGroup({ ...editingGroup, lembagaList: list });
                            }}
                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800"
                          >
                            <option value="Porsi Kecil">🥣 Porsi Kecil</option>
                            <option value="Porsi Besar">🍱 Porsi Besar</option>
                            <option value="Porsi Balita">🍼 Porsi Balita</option>
                            <option value="Porsi Ibu Hamil">🤰 Porsi Bumil</option>
                            <option value="Porsi Ibu Menyusui">🤱 Porsi Busui</option>
                            <option value="Bumil & Busui">🌸 Bumil & Busui</option>
                          </select>

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

                      {/* BREAKDOWN DEMOGRAFI PENERIMA CONTAINER */}
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
                              Formula Hitung Porsi
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              {sumClassesThisItem} {itemConf.mainTargetLabel} + {numGuruThisItem} Guru = <strong className="text-emerald-700">{totalPorsiThisItem} Porsi</strong>
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
                    </div>
                  );
                })
              )}
            </div>

            {/* LIVE AUDIT SUMMARY BAR ACROSS ALL INSTITUTIONS */}
            {editingGroup.lembagaList && editingGroup.lembagaList.length > 0 && (
              <div className="pt-2">
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
