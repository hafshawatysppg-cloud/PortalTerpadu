import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Flame,
  ClipboardEdit,
  TableProperties,
  Image as ImageIcon,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Eye,
  Printer,
  Upload,
  X,
  Search,
  Filter,
  Download,
  Utensils,
  RefreshCw,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  ZoomIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDb } from '../../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';

interface SuhuPengolahanViewProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export type SesiKey = 'sesi1' | 'sesi2' | 'sesi3';

export interface SubItemSuhu {
  suhu: number | null;
  fotoUrl?: string;
  namaMenu?: string;
  catatan?: string;
}

export interface SesiGroupData {
  makananPokok: SubItemSuhu;
  proteinHewani: SubItemSuhu;
  proteinNabati: SubItemSuhu;
  sayuran: SubItemSuhu;
  waktu?: string;
}

export interface DailySuhuPengolahanRecord {
  id: string; // e.g. '2026-10-26'
  tanggal: string; // YYYY-MM-DD
  status: string; // 'Sesuai Standar'
  petugas: string;
  petugasRole?: string;
  sesi1: SesiGroupData;
  sesi2: SesiGroupData;
  sesi3: SesiGroupData;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

// Seed data matching the user's uploaded images (Image 1 & Image 2)
const SEED_DAILY_RECORDS: DailySuhuPengolahanRecord[] = [
  {
    id: '2026-10-26',
    tanggal: '2026-10-26',
    status: 'Sesuai Standar',
    petugas: 'Abdus Salam',
    petugasRole: 'Petugas Pengolahan SPPG',
    sesi1: {
      waktu: '07:15 WIB',
      makananPokok: {
        suhu: 77.7,
        fotoUrl: '/assets/suhu_seed/suhu_makanan_pokok_seed.png',
        namaMenu: 'Nasi Putih Pulen Steamer'
      },
      proteinHewani: {
        suhu: 72.6,
        fotoUrl: '/assets/suhu_seed/suhu_protein_hewani_seed.png',
        namaMenu: 'Daging Cincang Rempah'
      },
      proteinNabati: {
        suhu: 61.2,
        fotoUrl: '/assets/suhu_seed/suhu_protein_nabati_seed.png',
        namaMenu: 'Tempe Goreng Renyah'
      },
      sayuran: {
        suhu: 96.1,
        fotoUrl: '/assets/suhu_seed/suhu_sayuran_seed.png',
        namaMenu: 'Sop Jagung Wortel'
      }
    },
    sesi2: {
      waktu: '08:45 WIB',
      makananPokok: {
        suhu: 77.5,
        fotoUrl: '/assets/suhu_seed/suhu_makanan_pokok_seed.png',
        namaMenu: 'Nasi Putih Pulen Steamer'
      },
      proteinHewani: {
        suhu: 72.8,
        fotoUrl: '/assets/suhu_seed/suhu_protein_hewani_seed.png',
        namaMenu: 'Daging Cincang Rempah'
      },
      proteinNabati: {
        suhu: 61.5,
        fotoUrl: '/assets/suhu_seed/suhu_protein_nabati_seed.png',
        namaMenu: 'Tempe Goreng Renyah'
      },
      sayuran: {
        suhu: 96.7,
        fotoUrl: '/assets/suhu_seed/suhu_sayuran_seed.png',
        namaMenu: 'Sop Jagung Wortel'
      }
    },
    sesi3: {
      waktu: '10:30 WIB',
      makananPokok: {
        suhu: 77.2,
        fotoUrl: '/assets/suhu_seed/suhu_makanan_pokok_seed.png',
        namaMenu: 'Nasi Putih Pulen Steamer'
      },
      proteinHewani: {
        suhu: 72.3,
        fotoUrl: '/assets/suhu_seed/suhu_protein_hewani_seed.png',
        namaMenu: 'Daging Cincang Rempah'
      },
      proteinNabati: {
        suhu: 61.7,
        fotoUrl: '/assets/suhu_seed/suhu_protein_nabati_seed.png',
        namaMenu: 'Tempe Goreng Renyah'
      },
      sayuran: {
        suhu: 96.3,
        fotoUrl: '/assets/suhu_seed/suhu_sayuran_seed.png',
        namaMenu: 'Sop Jagung Wortel'
      }
    },
    createdAt: '2026-10-26T07:30:00.000Z',
    updatedAt: '2026-10-26T11:00:00.000Z'
  },
  {
    id: '2026-10-27',
    tanggal: '2026-10-27',
    status: 'Sesuai Standar',
    petugas: 'Sri Rohayu, S.Pd.',
    petugasRole: 'Kepala SPPG / Supervisor QC',
    sesi1: {
      waktu: '07:20 WIB',
      makananPokok: {
        suhu: 75.4,
        fotoUrl: '/assets/suhu_seed/suhu_makanan_pokok_seed.png',
        namaMenu: 'Nasi Putih'
      },
      proteinHewani: {
        suhu: 73.1,
        fotoUrl: '/assets/suhu_seed/suhu_protein_hewani_seed.png',
        namaMenu: 'Ayam Kecap Rempah'
      },
      proteinNabati: {
        suhu: 63.8,
        fotoUrl: '/assets/suhu_seed/suhu_protein_nabati_seed.png',
        namaMenu: 'Tahu Goreng Gurih'
      },
      sayuran: {
        suhu: 97.5,
        fotoUrl: '/assets/suhu_seed/suhu_sayuran_seed.png',
        namaMenu: 'Sayur Sop Bening'
      }
    },
    sesi2: {
      waktu: '08:50 WIB',
      makananPokok: {
        suhu: 75.8,
        fotoUrl: '/assets/suhu_seed/suhu_makanan_pokok_seed.png',
        namaMenu: 'Nasi Putih'
      },
      proteinHewani: {
        suhu: 73.5,
        fotoUrl: '/assets/suhu_seed/suhu_protein_hewani_seed.png',
        namaMenu: 'Ayam Kecap Rempah'
      },
      proteinNabati: {
        suhu: 63.5,
        fotoUrl: '/assets/suhu_seed/suhu_protein_nabati_seed.png',
        namaMenu: 'Tahu Goreng Gurih'
      },
      sayuran: {
        suhu: 97.2,
        fotoUrl: '/assets/suhu_seed/suhu_sayuran_seed.png',
        namaMenu: 'Sayur Sop Bening'
      }
    },
    sesi3: {
      waktu: '10:40 WIB',
      makananPokok: {
        suhu: 75.3,
        fotoUrl: '/assets/suhu_seed/suhu_makanan_pokok_seed.png',
        namaMenu: 'Nasi Putih'
      },
      proteinHewani: {
        suhu: 73.8,
        fotoUrl: '/assets/suhu_seed/suhu_protein_hewani_seed.png',
        namaMenu: 'Ayam Kecap Rempah'
      },
      proteinNabati: {
        suhu: 63.2,
        fotoUrl: '/assets/suhu_seed/suhu_protein_nabati_seed.png',
        namaMenu: 'Tahu Goreng Gurih'
      },
      sayuran: {
        suhu: 97.8,
        fotoUrl: '/assets/suhu_seed/suhu_sayuran_seed.png',
        namaMenu: 'Sayur Sop Bening'
      }
    },
    createdAt: '2026-10-27T07:30:00.000Z',
    updatedAt: '2026-10-27T11:00:00.000Z'
  }
];

// Helper: Format date for table display: '2026-10-26' -> '26-10-2026'
function formatTanggalTable(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

// Helper: Format date for Indonesian header banner: '2026-10-26' -> '26 OKTOBER 2026'
function formatTanggalBanner(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ];
    return `${day} ${months[monthIdx] || ''} ${year}`;
  }
  return dateStr.toUpperCase();
}

// Helper: Format number with comma like in Image 1 (e.g. 77.7 -> '77,7')
function formatSuhu(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val) || val === 0) return '-';
  return val.toFixed(1).replace('.', ',');
}

export const SuhuPengolahanView: React.FC<SuhuPengolahanViewProps> = ({ currentPath, onNavigate }) => {
  const { user } = useAuth();

  // Determine active tab: form | tabel | dokumentasi
  const activeTab: 'form' | 'tabel' | 'dokumentasi' = useMemo(() => {
    if (currentPath.includes('/gizi/suhu/makanan/pengolahan/tabel')) return 'tabel';
    if (currentPath.includes('/gizi/suhu/makanan/pengolahan/dokumentasi')) return 'dokumentasi';
    return 'form';
  }, [currentPath]);

  // Master records state (daily records grouped by date)
  const [dailyRecords, setDailyRecords] = useState<DailySuhuPengolahanRecord[]>(() => {
    const saved = localStorage.getItem('sppg_daily_suhu_pengolahan_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing local suhu pengolahan v2:', e);
      }
    }
    return SEED_DAILY_RECORDS;
  });

  // Form State
  const defaultPetugas = user?.nama || user?.username || 'Abdus Salam';
  const defaultPetugasRole = user?.role || 'Petugas Pengolahan SPPG';

  const [formTanggal, setFormTanggal] = useState<string>(() => {
    // default to today or recent date
    return new Date().toISOString().split('T')[0];
  });
  const [activeFormSesi, setActiveFormSesi] = useState<SesiKey>('sesi1');

  // Sub 1: Makanan Pokok
  const [makananPokokSesi, setMakananPokokSesi] = useState<'Sesi 1' | 'Sesi 2' | 'Sesi 3'>('Sesi 1');
  const [makananPokokSuhu, setMakananPokokSuhu] = useState<number | string>('');
  const [makananPokokFoto, setMakananPokokFoto] = useState<string>('');
  const [makananPokokNama, setMakananPokokNama] = useState<string>('');

  // Sub 2: Protein Hewani
  const [proteinHewaniSesi, setProteinHewaniSesi] = useState<'Sesi 1' | 'Sesi 2' | 'Sesi 3'>('Sesi 1');
  const [proteinHewaniSuhu, setProteinHewaniSuhu] = useState<number | string>('');
  const [proteinHewaniFoto, setProteinHewaniFoto] = useState<string>('');
  const [proteinHewaniNama, setProteinHewaniNama] = useState<string>('');

  // Sub 3: Protein Nabati
  const [proteinNabatiSesi, setProteinNabatiSesi] = useState<'Sesi 1' | 'Sesi 2' | 'Sesi 3'>('Sesi 1');
  const [proteinNabatiSuhu, setProteinNabatiSuhu] = useState<number | string>('');
  const [proteinNabatiFoto, setProteinNabatiFoto] = useState<string>('');
  const [proteinNabatiNama, setProteinNabatiNama] = useState<string>('');

  // Sub 4: Sayuran
  const [sayuranSesi, setSayuranSesi] = useState<'Sesi 1' | 'Sesi 2' | 'Sesi 3'>('Sesi 1');
  const [sayuranSuhu, setSayuranSuhu] = useState<number | string>('');
  const [sayuranFoto, setSayuranFoto] = useState<string>('');
  const [sayuranNama, setSayuranNama] = useState<string>('');

  // General Status & Notes
  const [formStatus, setFormStatus] = useState<string>('Sesuai Standar');
  const [formCatatan, setFormCatatan] = useState<string>('');

  // Refs for file inputs per sub
  const fileInputPokokRef = useRef<HTMLInputElement>(null);
  const fileInputHewaniRef = useRef<HTMLInputElement>(null);
  const fileInputNabatiRef = useRef<HTMLInputElement>(null);
  const fileInputSayuranRef = useRef<HTMLInputElement>(null);

  // Table Filters State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected date & filters for Dokumentasi View
  const [selectedDokumentasiTanggal, setSelectedDokumentasiTanggal] = useState<string>(() => {
    return dailyRecords[0]?.tanggal || new Date().toISOString().split('T')[0];
  });
  const [docStartDate, setDocStartDate] = useState<string>('');
  const [docEndDate, setDocEndDate] = useState<string>('');
  const [docKategoriFilter, setDocKategoriFilter] = useState<'ALL' | 'makananPokok' | 'proteinHewani' | 'proteinNabati' | 'sayuran'>('ALL');

  // UI Toast & Lightbox Modal
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; suhu?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync to Firestore on mount and fallback to localStorage
  useEffect(() => {
    const fetchFirestore = async () => {
      try {
        const db = getDb();
        if (db) {
          const colRef = collection(db, 'suhu_pengolahan_v2');
          const q = query(colRef, orderBy('tanggal', 'desc'));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const list: DailySuhuPengolahanRecord[] = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() } as DailySuhuPengolahanRecord));
            setDailyRecords(list);
            localStorage.setItem('sppg_daily_suhu_pengolahan_v2', JSON.stringify(list));
          } else {
            // Seed to Firestore if empty
            for (const item of SEED_DAILY_RECORDS) {
              await setDoc(doc(db, 'suhu_pengolahan_v2', item.id), item);
            }
          }
        }
      } catch (err) {
        console.warn('Firestore sync notice (using localStorage fallback):', err);
      }
    };
    fetchFirestore();
  }, []);

  const saveRecordsLocally = (data: DailySuhuPengolahanRecord[]) => {
    setDailyRecords(data);
    localStorage.setItem('sppg_daily_suhu_pengolahan_v2', JSON.stringify(data));
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Helper when user switches active Sesi in Form
  const handleSelectFormSesi = (sesiKey: SesiKey) => {
    setActiveFormSesi(sesiKey);
    const sesiLabel: 'Sesi 1' | 'Sesi 2' | 'Sesi 3' =
      sesiKey === 'sesi1' ? 'Sesi 1' : sesiKey === 'sesi2' ? 'Sesi 2' : 'Sesi 3';

    setMakananPokokSesi(sesiLabel);
    setProteinHewaniSesi(sesiLabel);
    setProteinNabatiSesi(sesiLabel);
    setSayuranSesi(sesiLabel);

    // If current date already has data for this session, load it into inputs
    const existing = dailyRecords.find(r => r.tanggal === formTanggal);
    if (existing && existing[sesiKey]) {
      const s = existing[sesiKey];
      if (s.makananPokok?.suhu !== null && s.makananPokok?.suhu !== undefined) setMakananPokokSuhu(s.makananPokok.suhu);
      if (s.makananPokok?.fotoUrl) setMakananPokokFoto(s.makananPokok.fotoUrl);
      if (s.makananPokok?.namaMenu) setMakananPokokNama(s.makananPokok.namaMenu);

      if (s.proteinHewani?.suhu !== null && s.proteinHewani?.suhu !== undefined) setProteinHewaniSuhu(s.proteinHewani.suhu);
      if (s.proteinHewani?.fotoUrl) setProteinHewaniFoto(s.proteinHewani.fotoUrl);
      if (s.proteinHewani?.namaMenu) setProteinHewaniNama(s.proteinHewani.namaMenu);

      if (s.proteinNabati?.suhu !== null && s.proteinNabati?.suhu !== undefined) setProteinNabatiSuhu(s.proteinNabati.suhu);
      if (s.proteinNabati?.fotoUrl) setProteinNabatiFoto(s.proteinNabati.fotoUrl);
      if (s.proteinNabati?.namaMenu) setProteinNabatiNama(s.proteinNabati.namaMenu);

      if (s.sayuran?.suhu !== null && s.sayuran?.suhu !== undefined) setSayuranSuhu(s.sayuran.suhu);
      if (s.sayuran?.fotoUrl) setSayuranFoto(s.sayuran.fotoUrl);
      if (s.sayuran?.namaMenu) setSayuranNama(s.sayuran.namaMenu);
    }
  };

  // Generic photo file handler for any sub category
  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showToast('Ukuran foto maksimal 20MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
        showToast('Foto dokumentasi berhasil diunggah', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit form: saves or updates the record for that date
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formTanggal) {
        showToast('Tanggal pemeriksaan wajib diisi', 'error');
        setIsSubmitting(false);
        return;
      }

      const suhuPokok = parseFloat(String(makananPokokSuhu).replace(',', '.'));
      const suhuHewani = parseFloat(String(proteinHewaniSuhu).replace(',', '.'));
      const suhuNabati = parseFloat(String(proteinNabatiSuhu).replace(',', '.'));
      const suhuSayur = parseFloat(String(sayuranSuhu).replace(',', '.'));

      // Find existing daily record for this date or create fresh
      const existing = dailyRecords.find(r => r.tanggal === formTanggal);

      const targetSesiKey: SesiKey =
        makananPokokSesi === 'Sesi 1' ? 'sesi1' : makananPokokSesi === 'Sesi 2' ? 'sesi2' : 'sesi3';

      const updatedSesiData: SesiGroupData = {
        makananPokok: {
          suhu: isNaN(suhuPokok) ? null : suhuPokok,
          fotoUrl: makananPokokFoto || '',
          namaMenu: makananPokokNama || ''
        },
        proteinHewani: {
          suhu: isNaN(suhuHewani) ? null : suhuHewani,
          fotoUrl: proteinHewaniFoto || '',
          namaMenu: proteinHewaniNama || ''
        },
        proteinNabati: {
          suhu: isNaN(suhuNabati) ? null : suhuNabati,
          fotoUrl: proteinNabatiFoto || '',
          namaMenu: proteinNabatiNama || ''
        },
        sayuran: {
          suhu: isNaN(suhuSayur) ? null : suhuSayur,
          fotoUrl: sayuranFoto || '',
          namaMenu: sayuranNama || ''
        },
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      };

      const emptySesi: SesiGroupData = {
        makananPokok: { suhu: null },
        proteinHewani: { suhu: null },
        proteinNabati: { suhu: null },
        sayuran: { suhu: null }
      };

      const recordToSave: DailySuhuPengolahanRecord = existing
        ? {
            ...existing,
            petugas: defaultPetugas,
            petugasRole: defaultPetugasRole,
            status: formStatus || 'Sesuai Standar',
            catatan: formCatatan || existing.catatan || '',
            updatedAt: new Date().toISOString(),
            [targetSesiKey]: updatedSesiData
          }
        : {
            id: formTanggal,
            tanggal: formTanggal,
            petugas: defaultPetugas,
            petugasRole: defaultPetugasRole,
            status: formStatus || 'Sesuai Standar',
            catatan: formCatatan || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sesi1: targetSesiKey === 'sesi1' ? updatedSesiData : emptySesi,
            sesi2: targetSesiKey === 'sesi2' ? updatedSesiData : emptySesi,
            sesi3: targetSesiKey === 'sesi3' ? updatedSesiData : emptySesi
          };

      // 1. Instant Optimistic Local Update
      const existsIndex = dailyRecords.findIndex(r => r.tanggal === formTanggal);
      let updatedList: DailySuhuPengolahanRecord[];
      if (existsIndex >= 0) {
        updatedList = [...dailyRecords];
        updatedList[existsIndex] = recordToSave;
      } else {
        updatedList = [recordToSave, ...dailyRecords].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      }

      saveRecordsLocally(updatedList);
      setSelectedDokumentasiTanggal(formTanggal);
      showToast(`Data suhu ${makananPokokSesi} tanggal ${formatTanggalTable(formTanggal)} berhasil disimpan!`, 'success');

      // Reset form fields to empty for next session/entry
      setMakananPokokSuhu('');
      setMakananPokokFoto('');
      setMakananPokokNama('');
      setProteinHewaniSuhu('');
      setProteinHewaniFoto('');
      setProteinHewaniNama('');
      setProteinNabatiSuhu('');
      setProteinNabatiFoto('');
      setProteinNabatiNama('');
      setSayuranSuhu('');
      setSayuranFoto('');
      setSayuranNama('');
      setFormCatatan('');

      // 2. Immediate Navigation to Tabel
      onNavigate('/gizi/suhu/makanan/pengolahan/tabel');

      // 3. Background Async Firestore Persistence (non-blocking)
      const firestoreDb = getDb();
      if (firestoreDb) {
        setDoc(doc(firestoreDb, 'suhu_pengolahan_v2', formTanggal), recordToSave).catch(err => {
          console.warn('Background Firestore write notice:', err);
        });
      }
    } catch (err) {
      console.error('Error saving suhu pengolahan:', err);
      showToast('Gagal menyimpan data suhu pengolahan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered records for Table
  const filteredDailyRecords = useMemo(() => {
    return dailyRecords.filter(r => {
      if (startDate && r.tanggal < startDate) return false;
      if (endDate && r.tanggal > endDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${r.tanggal} ${r.petugas} ${r.status} ${r.catatan || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [dailyRecords, startDate, endDate, searchQuery]);

  // Filtered records for Dokumentasi View by date range
  const filteredDokumentasiRecords = useMemo(() => {
    return dailyRecords.filter(r => {
      if (docStartDate && r.tanggal < docStartDate) return false;
      if (docEndDate && r.tanggal > docEndDate) return false;
      return true;
    });
  }, [dailyRecords, docStartDate, docEndDate]);

  // Selected Record for Documentation View (Image 2 format)
  const currentDokumentasiRecord = useMemo(() => {
    return (
      filteredDokumentasiRecords.find(r => r.tanggal === selectedDokumentasiTanggal) ||
      filteredDokumentasiRecords[0] ||
      null
    );
  }, [filteredDokumentasiRecords, selectedDokumentasiTanggal]);

  // Delete record with instant optimistic update
  const handleDeleteDailyRecord = async (tanggal: string) => {
    if (!window.confirm(`Hapus data tanggal ${formatTanggalTable(tanggal)}?`)) return;

    // Instant local removal
    const updated = dailyRecords.filter(r => r.tanggal !== tanggal);
    saveRecordsLocally(updated);
    showToast(`Data tanggal ${formatTanggalTable(tanggal)} berhasil dihapus`, 'success');

    // Background delete in Firestore
    const firestoreDb = getDb();
    if (firestoreDb) {
      deleteDoc(doc(firestoreDb, 'suhu_pengolahan_v2', tanggal)).catch(err => {
        console.warn('Background Firestore delete notice:', err);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          ) : (
            <Info className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub Menu Navigation Tabs (As Requested: Form, Tabel, Dokumentasi) */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-2 shadow-xs no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl">
            <button
              type="button"
              onClick={() => onNavigate('/gizi/suhu/makanan/pengolahan/form')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <ClipboardEdit className="w-4 h-4" />
              <span>Form Suhu Pengolahan</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/gizi/suhu/makanan/pengolahan/tabel')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tabel'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <TableProperties className="w-4 h-4" />
              <span>Tabel Suhu Pengolahan</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                  activeTab === 'tabel' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {dailyRecords.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/gizi/suhu/makanan/pengolahan/dokumentasi')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dokumentasi'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Dokumentasi Suhu Pengolahan</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pr-2 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Standar BGN: ≥ 75.0 °C</span>
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. SUB MENU: FORM SUHU PENGOLAHAN (DENGAN UPLOAD FOTO DI SETIAP SUB)  */}
      {/* ===================================================================== */}
      {activeTab === 'form' && (
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Form Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Critical Control Point (CCP - Cooking)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  Form Suhu Pengolahan Bahan Pangan
                </h2>
                <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
                  Pencatatan suhu masakan matang di 4 sub kategori (Makanan Pokok, Protein Hewani, Protein Nabati, Sayuran).
                  Setiap sub kategori dilengkapi dengan form unggah foto dokumentasi probe thermometer.
                </p>
              </div>

              {/* Sesi Selector Tabs on Form */}
              <div className="bg-black/30 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 flex items-center gap-1 text-xs">
                <span className="text-[11px] font-bold text-emerald-200 px-2">Pilih Sesi:</span>
                <button
                  type="button"
                  onClick={() => handleSelectFormSesi('sesi1')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold cursor-pointer transition-all ${
                    activeFormSesi === 'sesi1' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-white hover:bg-white/10'
                  }`}
                >
                  Sesi 1 (I)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFormSesi('sesi2')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold cursor-pointer transition-all ${
                    activeFormSesi === 'sesi2' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-white hover:bg-white/10'
                  }`}
                >
                  Sesi 2 (II)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFormSesi('sesi3')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold cursor-pointer transition-all ${
                    activeFormSesi === 'sesi3' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-white hover:bg-white/10'
                  }`}
                >
                  Sesi 3 (III)
                </button>
              </div>
            </div>
          </div>

          {/* Metadata Card: Tanggal, Petugas (Otomatis), Status */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Tanggal Pemeriksaan & Petugas Login</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tanggal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tanggal Pengolahan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Petugas: Terisi Otomatis */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Petugas Pencatat</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ Otomatis Akun Login
                  </span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    readOnly
                    value={`${defaultPetugas} (${defaultPetugasRole})`}
                    className="w-full pl-9 pr-3 py-2 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs font-extrabold text-emerald-900 dark:text-emerald-200 cursor-not-allowed outline-none select-none"
                    title="Petugas terisi otomatis sesuai dengan akun login pengguna"
                  />
                </div>
              </div>

              {/* Status Keseluruhan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status Kepatuhan CCP
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="Sesuai Standar">Sesuai Standar</option>
                  <option value="Lolos CCP">Lolos CCP</option>
                  <option value="Perlu Pengawasan">Perlu Pengawasan</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4 SUB KATEGORI (MASING-MASING MEMILIKI UNGGAH FOTO DOKUMENTASI) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* --------------------------------------------------------------- */}
            {/* SUB 1: MAKANAN POKOK                                           */}
            {/* --------------------------------------------------------------- */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-amber-200 dark:border-amber-900/60 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase">
                      Sub Makanan Pokok
                    </h4>
                    <p className="text-[11px] text-slate-400">Nasi Putih / Beras / Kentang</p>
                  </div>
                </div>

                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  {makananPokokSesi}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Dropdown Sesi 1, Sesi 2, Sesi 3 */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dropdown Sesi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={makananPokokSesi}
                    onChange={(e) => setMakananPokokSesi(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="Sesi 1">Sesi 1 (Sesi I)</option>
                    <option value="Sesi 2">Sesi 2 (Sesi II)</option>
                    <option value="Sesi 3">Sesi 3 (Sesi III)</option>
                  </select>
                </div>

                {/* Pengisian Suhu */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Pengisian Suhu (°C) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400">Target: ≥ 75.0 °C</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={makananPokokSuhu}
                      onChange={(e) => setMakananPokokSuhu(e.target.value)}
                      placeholder="77.7"
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">°C</span>
                  </div>
                </div>

                {/* UNGGAH DOKUMENTASI FOTO SUB MAKANAN POKOK */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unggah Dokumentasi Foto Makanan Pokok:
                  </label>
                  <input
                    ref={fileInputPokokRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleUploadPhoto(e, setMakananPokokFoto)}
                  />

                  {makananPokokFoto ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 h-36 bg-slate-900 flex items-center justify-center group">
                      <img
                        src={makananPokokFoto}
                        alt="Dokumentasi Makanan Pokok"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputPokokRef.current?.click()}
                          className="px-2.5 py-1 bg-white text-slate-900 text-[11px] font-bold rounded-lg cursor-pointer shadow-md"
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setMakananPokokFoto('')}
                          className="p-1 bg-rose-600 text-white rounded-lg cursor-pointer shadow-md"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold">
                        ✓ Foto Makanan Pokok
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputPokokRef.current?.click()}
                      className="border-2 border-dashed border-amber-300 dark:border-amber-800/80 hover:border-amber-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-amber-50/40 dark:bg-amber-950/20 flex flex-col items-center justify-center gap-1.5"
                    >
                      <Upload className="w-5 h-5 text-amber-600" />
                      <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        Klik untuk Unggah Foto Makanan Pokok
                      </span>
                      <span className="text-[10px] text-slate-400">Kamera atau Galeri HP</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* SUB 2: PROTEIN HEWANI                                          */}
            {/* --------------------------------------------------------------- */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-rose-200 dark:border-rose-900/60 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase">
                      Sub Protein Hewani
                    </h4>
                    <p className="text-[11px] text-slate-400">Ayam / Daging Sapi / Telur / Ikan</p>
                  </div>
                </div>

                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200">
                  {proteinHewaniSesi}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Dropdown Sesi 1, Sesi 2, Sesi 3 */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dropdown Sesi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={proteinHewaniSesi}
                    onChange={(e) => setProteinHewaniSesi(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="Sesi 1">Sesi 1 (Sesi I)</option>
                    <option value="Sesi 2">Sesi 2 (Sesi II)</option>
                    <option value="Sesi 3">Sesi 3 (Sesi III)</option>
                  </select>
                </div>

                {/* Pengisian Suhu */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Pengisian Suhu (°C) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400">Target: ≥ 75.0 °C</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={proteinHewaniSuhu}
                      onChange={(e) => setProteinHewaniSuhu(e.target.value)}
                      placeholder="72.6"
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">°C</span>
                  </div>
                </div>

                {/* UNGGAH DOKUMENTASI FOTO SUB PROTEIN HEWANI */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unggah Dokumentasi Foto Protein Hewani:
                  </label>
                  <input
                    ref={fileInputHewaniRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleUploadPhoto(e, setProteinHewaniFoto)}
                  />

                  {proteinHewaniFoto ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 h-36 bg-slate-900 flex items-center justify-center group">
                      <img
                        src={proteinHewaniFoto}
                        alt="Dokumentasi Protein Hewani"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputHewaniRef.current?.click()}
                          className="px-2.5 py-1 bg-white text-slate-900 text-[11px] font-bold rounded-lg cursor-pointer shadow-md"
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setProteinHewaniFoto('')}
                          className="p-1 bg-rose-600 text-white rounded-lg cursor-pointer shadow-md"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold">
                        ✓ Foto Protein Hewani
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputHewaniRef.current?.click()}
                      className="border-2 border-dashed border-rose-300 dark:border-rose-800/80 hover:border-rose-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-rose-50/40 dark:bg-rose-950/20 flex flex-col items-center justify-center gap-1.5"
                    >
                      <Upload className="w-5 h-5 text-rose-600" />
                      <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        Klik untuk Unggah Foto Protein Hewani
                      </span>
                      <span className="text-[10px] text-slate-400">Kamera atau Galeri HP</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* SUB 3: PROTEIN NABATI                                          */}
            {/* --------------------------------------------------------------- */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-blue-200 dark:border-blue-900/60 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase">
                      Sub Protein Nabati
                    </h4>
                    <p className="text-[11px] text-slate-400">Tempe / Tahu / Olahan Kedelai</p>
                  </div>
                </div>

                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                  {proteinNabatiSesi}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Dropdown Sesi 1, Sesi 2, Sesi 3 */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dropdown Sesi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={proteinNabatiSesi}
                    onChange={(e) => setProteinNabatiSesi(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="Sesi 1">Sesi 1 (Sesi I)</option>
                    <option value="Sesi 2">Sesi 2 (Sesi II)</option>
                    <option value="Sesi 3">Sesi 3 (Sesi III)</option>
                  </select>
                </div>

                {/* Pengisian Suhu */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Pengisian Suhu (°C) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400">Target: ≥ 75.0 °C</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={proteinNabatiSuhu}
                      onChange={(e) => setProteinNabatiSuhu(e.target.value)}
                      placeholder="61.2"
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">°C</span>
                  </div>
                </div>

                {/* UNGGAH DOKUMENTASI FOTO SUB PROTEIN NABATI */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unggah Dokumentasi Foto Protein Nabati:
                  </label>
                  <input
                    ref={fileInputNabatiRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleUploadPhoto(e, setProteinNabatiFoto)}
                  />

                  {proteinNabatiFoto ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 h-36 bg-slate-900 flex items-center justify-center group">
                      <img
                        src={proteinNabatiFoto}
                        alt="Dokumentasi Protein Nabati"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputNabatiRef.current?.click()}
                          className="px-2.5 py-1 bg-white text-slate-900 text-[11px] font-bold rounded-lg cursor-pointer shadow-md"
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setProteinNabatiFoto('')}
                          className="p-1 bg-rose-600 text-white rounded-lg cursor-pointer shadow-md"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold">
                        ✓ Foto Protein Nabati
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputNabatiRef.current?.click()}
                      className="border-2 border-dashed border-blue-300 dark:border-blue-800/80 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-blue-50/40 dark:bg-blue-950/20 flex flex-col items-center justify-center gap-1.5"
                    >
                      <Upload className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        Klik untuk Unggah Foto Protein Nabati
                      </span>
                      <span className="text-[10px] text-slate-400">Kamera atau Galeri HP</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* SUB 4: SAYURAN                                                 */}
            {/* --------------------------------------------------------------- */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-emerald-200 dark:border-emerald-900/60 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase">
                      Sub Sayuran
                    </h4>
                    <p className="text-[11px] text-slate-400">Sop Sayuran / Capcay / Sayur Bening</p>
                  </div>
                </div>

                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                  {sayuranSesi}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Dropdown Sesi 1, Sesi 2, Sesi 3 */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dropdown Sesi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={sayuranSesi}
                    onChange={(e) => setSayuranSesi(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value="Sesi 1">Sesi 1 (Sesi I)</option>
                    <option value="Sesi 2">Sesi 2 (Sesi II)</option>
                    <option value="Sesi 3">Sesi 3 (Sesi III)</option>
                  </select>
                </div>

                {/* Pengisian Suhu */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Pengisian Suhu (°C) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-slate-400">Target: ≥ 75.0 °C</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={sayuranSuhu}
                      onChange={(e) => setSayuranSuhu(e.target.value)}
                      placeholder="96.1"
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">°C</span>
                  </div>
                </div>

                {/* UNGGAH DOKUMENTASI FOTO SUB SAYURAN */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unggah Dokumentasi Foto Sayuran:
                  </label>
                  <input
                    ref={fileInputSayuranRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleUploadPhoto(e, setSayuranFoto)}
                  />

                  {sayuranFoto ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 h-36 bg-slate-900 flex items-center justify-center group">
                      <img
                        src={sayuranFoto}
                        alt="Dokumentasi Sayuran"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputSayuranRef.current?.click()}
                          className="px-2.5 py-1 bg-white text-slate-900 text-[11px] font-bold rounded-lg cursor-pointer shadow-md"
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setSayuranFoto('')}
                          className="p-1 bg-rose-600 text-white rounded-lg cursor-pointer shadow-md"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold">
                        ✓ Foto Sayuran
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputSayuranRef.current?.click()}
                      className="border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col items-center justify-center gap-1.5"
                    >
                      <Upload className="w-5 h-5 text-emerald-600" />
                      <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        Klik untuk Unggah Foto Sayuran
                      </span>
                      <span className="text-[10px] text-slate-400">Kamera atau Galeri HP</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Bottom Bar */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              * Data akan disimpan ke tabel dan galeri dokumentasi tanggal{' '}
              <strong>{formatTanggalTable(formTanggal)}</strong> untuk <strong>{makananPokokSesi}</strong>.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMakananPokokSuhu('');
                  setProteinHewaniSuhu('');
                  setProteinNabatiSuhu('');
                  setSayuranSuhu('');
                  setMakananPokokFoto('');
                  setProteinHewaniFoto('');
                  setProteinNabatiFoto('');
                  setSayuranFoto('');
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Reset Isian
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Data...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Data Suhu Pengolahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* 2. SUB MENU: TABEL SUHU PENGOLAHAN (FORMAT PERSIS GAMBAR 1)          */}
      {/* ===================================================================== */}
      {activeTab === 'tabel' && (
        <div className="space-y-4">
          {/* Filter Bar: Dari Tanggal & Sampai Tanggal, Search */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs space-y-4 no-print">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <TableProperties className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                  Tabel Rekapitulasi Suhu Pengolahan Bahan Pangan
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/gizi/suhu/makanan/pengolahan/form')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Data Form</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Tabel</span>
                </button>
              </div>
            </div>

            {/* Date Filters: Dari Tanggal & Sampai Tanggal */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dari Tanggal:</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sampai Tanggal:</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cari Data:</span>
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik tanggal, petugas..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            {/* Quick Filter Shortcuts */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Shortcut:</span>
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setStartDate(today);
                  setEndDate(today);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartDate('2026-10-01');
                  setEndDate('2026-10-31');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]"
              >
                Oktober 2026
              </button>
              {(startDate || endDate || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* TABEL SUHU PENGOLAHAN: EXACT FORMAT FROM IMAGE 1 */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-300 overflow-x-auto text-black">
            <table className="w-full border-collapse border border-black text-center text-xs font-serif min-w-[900px]">
              <thead>
                {/* Header Row 1 */}
                <tr className="bg-[#D9E8F5]">
                  <th
                    rowSpan={2}
                    className="border border-black px-4 py-2.5 font-bold uppercase tracking-wider text-xs align-middle"
                  >
                    TANGGAL
                  </th>
                  <th
                    colSpan={3}
                    className="border border-black px-3 py-2 font-bold uppercase tracking-wider text-xs"
                  >
                    MAKANAN POKOK
                  </th>
                  <th
                    colSpan={3}
                    className="border border-black px-3 py-2 font-bold uppercase tracking-wider text-xs"
                  >
                    PROTEIN HEWANI
                  </th>
                  <th
                    colSpan={3}
                    className="border border-black px-3 py-2 font-bold uppercase tracking-wider text-xs"
                  >
                    PROTEIN NABATI
                  </th>
                  <th
                    colSpan={3}
                    className="border border-black px-3 py-2 font-bold uppercase tracking-wider text-xs"
                  >
                    SAYURAN
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black px-4 py-2.5 font-bold uppercase tracking-wider text-xs align-middle"
                  >
                    STATUS
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black px-4 py-2.5 font-bold uppercase tracking-wider text-xs align-middle"
                  >
                    PETUGAS
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-black px-3 py-2 font-bold uppercase tracking-wider text-xs align-middle no-print"
                  >
                    AKSI
                  </th>
                </tr>

                {/* Header Row 2 */}
                <tr className="bg-[#D9E8F5]">
                  <th className="border border-black px-2.5 py-1.5 font-bold text-[11px]">SESI I</th>
                  <th className="border border-black px-2.5 py-1.5 font-bold text-[11px]">SESI II</th>
                  <th className="border border-black px-2.5 py-1.5 font-bold text-[11px]">SESI III</th>

                  <th className="border border-black px-2.5 py-1.5 font-bold text-[11px]">SESI I</th>
                  <th className="border border-black px-2.5 py-1.5 font-bold text-[11px]">SESI II</th>
                  <th className="border border-black px-2.5 py-1.5 font-bold text-[11px]">SESI III</th>

                  <th className="border border-black px-2.5 py-1.5 font-bold text-[11px]">SESI I</th>
                  <th className="border border-black px-2.5 py-1.5 font-bold text-[11px]">SESI II</th>
                  <th className="border border-black px-2.5 py-1.5 font-bold text-[11px]">SESI III</th>

                  <th className="border border-black px-2.5 py-1.5 font-bold text-[11px]">SESI I</th>
                  <th className="border border-black px-2.5 py-1.5 font-bold text-[11px]">SESI II</th>
                  <th className="border border-black px-2.5 py-1.5 font-bold text-[11px]">SESI III</th>
                </tr>
              </thead>

              <tbody>
                {filteredDailyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="border border-black py-8 text-center text-slate-400 italic">
                      Tidak ada data suhu pengolahan untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredDailyRecords.map((r) => {
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        {/* Tanggal */}
                        <td className="border border-black px-3 py-2 font-semibold whitespace-nowrap">
                          {formatTanggalTable(r.tanggal)}
                        </td>

                        {/* Makanan Pokok: Sesi I, Sesi II, Sesi III */}
                        <td className="border border-black px-2 py-2">{formatSuhu(r.sesi1?.makananPokok?.suhu)}</td>
                        <td className="border border-black px-2 py-2">{formatSuhu(r.sesi2?.makananPokok?.suhu)}</td>
                        <td className="border border-black px-2 py-2">{formatSuhu(r.sesi3?.makananPokok?.suhu)}</td>

                        {/* Protein Hewani: Sesi I, Sesi II, Sesi III */}
                        <td className="border border-black px-2 py-2">{formatSuhu(r.sesi1?.proteinHewani?.suhu)}</td>
                        <td className="border border-black px-2 py-2">{formatSuhu(r.sesi2?.proteinHewani?.suhu)}</td>
                        <td className="border border-black px-2 py-2">{formatSuhu(r.sesi3?.proteinHewani?.suhu)}</td>

                        {/* Protein Nabati: Sesi I, Sesi II, Sesi III */}
                        <td className="border border-black px-2 py-2">{formatSuhu(r.sesi1?.proteinNabati?.suhu)}</td>
                        <td className="border border-black px-2 py-2">{formatSuhu(r.sesi2?.proteinNabati?.suhu)}</td>
                        <td className="border border-black px-2 py-2">{formatSuhu(r.sesi3?.proteinNabati?.suhu)}</td>

                        {/* Sayuran: Sesi I, Sesi II, Sesi III */}
                        <td className="border border-black px-2 py-2">{formatSuhu(r.sesi1?.sayuran?.suhu)}</td>
                        <td className="border border-black px-2 py-2">{formatSuhu(r.sesi2?.sayuran?.suhu)}</td>
                        <td className="border border-black px-2 py-2">{formatSuhu(r.sesi3?.sayuran?.suhu)}</td>

                        {/* Status */}
                        <td className="border border-black px-3 py-2 font-medium whitespace-nowrap">
                          {r.status || 'Sesuai Standar'}
                        </td>

                        {/* Petugas */}
                        <td className="border border-black px-3 py-2 font-medium whitespace-nowrap">
                          {r.petugas}
                        </td>

                        {/* Aksi (No Print) */}
                        <td className="border border-black px-2 py-2 whitespace-nowrap no-print font-sans">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDokumentasiTanggal(r.tanggal);
                                onNavigate('/gizi/suhu/makanan/pengolahan/dokumentasi');
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Lihat Dokumentasi Foto Tanggal Ini"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormTanggal(r.tanggal);
                                handleSelectFormSesi('sesi1');
                                onNavigate('/gizi/suhu/makanan/pengolahan/form');
                              }}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Edit Data Form"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDailyRecord(r.tanggal)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                              title="Hapus Baris Tanggal Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. SUB MENU: DOKUMENTASI HASIL FORM (FORMAT PERSIS GAMBAR 2)          */}
      {/* ===================================================================== */}
      {activeTab === 'dokumentasi' && (
        <div className="space-y-5">
          {/* Top Controls: Pilih Tanggal Dokumentasi, Print */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs space-y-3 no-print">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                  Dokumentasi Suhu Pengolahan Bahan Pangan (Lembar Foto)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/gizi/suhu/makanan/pengolahan/form')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Unggah Foto Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Lembar Dokumentasi</span>
                </button>
              </div>
            </div>

            {/* Date Selector Dropdown / Date Range & Category Filter */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Pilih Tanggal Dokumentasi:</span>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={currentDokumentasiRecord?.tanggal || selectedDokumentasiTanggal}
                  onChange={(e) => setSelectedDokumentasiTanggal(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
                >
                  {filteredDokumentasiRecords.length === 0 ? (
                    <option value="">Tidak ada data pada rentang ini</option>
                  ) : (
                    filteredDokumentasiRecords.map(r => (
                      <option key={r.tanggal} value={r.tanggal}>
                        {formatTanggalBanner(r.tanggal)} ({formatTanggalTable(r.tanggal)})
                      </option>
                    ))
                  )}
                </select>

                <input
                  type="date"
                  value={selectedDokumentasiTanggal}
                  onChange={(e) => setSelectedDokumentasiTanggal(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs"
                />
              </div>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-500 dark:text-slate-400">Rentang:</span>
                <input
                  type="date"
                  value={docStartDate}
                  onChange={(e) => setDocStartDate(e.target.value)}
                  title="Tanggal Mulai"
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-200"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={docEndDate}
                  onChange={(e) => setDocEndDate(e.target.value)}
                  title="Tanggal Akhir"
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500 dark:text-slate-400">Kategori:</span>
                <select
                  value={docKategoriFilter}
                  onChange={(e) => setDocKategoriFilter(e.target.value as 'ALL' | 'makananPokok' | 'proteinHewani' | 'proteinNabati' | 'sayuran')}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="makananPokok">Makanan Pokok</option>
                  <option value="proteinHewani">Protein Hewani</option>
                  <option value="proteinNabati">Protein Nabati</option>
                  <option value="sayuran">Sayuran</option>
                </select>
              </div>

              {(docStartDate || docEndDate || docKategoriFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setDocStartDate('');
                    setDocEndDate('');
                    setDocKategoriFilter('ALL');
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* DOKUMENTASI SHEET: EXACT LAYOUT FROM IMAGE 2 */}
          {currentDokumentasiRecord ? (
            <div className="bg-white text-black p-4 sm:p-8 rounded-2xl shadow-sm border border-black max-w-5xl mx-auto font-serif">
              {/* Judul Utama Persis Gambar 2 */}
              <h2 className="text-center font-bold text-sm sm:text-base uppercase tracking-wider mb-2">
                DOKUMENTASI SUHU PENGOLAHAN BAHAN PANGAN
              </h2>

              {/* Banner Tanggal Oranye / Peach Persis Gambar 2 */}
              <div className="border border-black bg-[#F8AD7B] text-center font-bold text-xs sm:text-sm uppercase py-1.5 tracking-wide">
                {formatTanggalBanner(currentDokumentasiRecord.tanggal)}
              </div>

              {/* Tabel Foto Dokumentasi Persis Gambar 2 */}
              <table className="w-full border-collapse border-l border-r border-b border-black text-center text-xs">
                <thead>
                  <tr className="bg-white">
                    <th className="border border-black px-3 py-2 w-16 font-bold uppercase text-[11px]">
                      SESI
                    </th>
                    {(docKategoriFilter === 'ALL' || docKategoriFilter === 'makananPokok') && (
                      <th className="border border-black px-3 py-2 font-bold uppercase text-[11px]">
                        MAKANAN POKOK
                      </th>
                    )}
                    {(docKategoriFilter === 'ALL' || docKategoriFilter === 'proteinHewani') && (
                      <th className="border border-black px-3 py-2 font-bold uppercase text-[11px]">
                        PROTEIN HEWANI
                      </th>
                    )}
                    {(docKategoriFilter === 'ALL' || docKategoriFilter === 'proteinNabati') && (
                      <th className="border border-black px-3 py-2 font-bold uppercase text-[11px]">
                        PROTEIN NABATI
                      </th>
                    )}
                    {(docKategoriFilter === 'ALL' || docKategoriFilter === 'sayuran') && (
                      <th className="border border-black px-3 py-2 font-bold uppercase text-[11px]">
                        SAYURAN
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {([1, 2, 3] as const).map((sesiNum) => {
                    const sesiKey = `sesi${sesiNum}` as 'sesi1' | 'sesi2' | 'sesi3';
                    const sesiData = currentDokumentasiRecord[sesiKey];
                    const categories = [
                      { key: 'makananPokok' as const, label: 'Makanan Pokok' },
                      { key: 'proteinHewani' as const, label: 'Protein Hewani' },
                      { key: 'proteinNabati' as const, label: 'Protein Nabati' },
                      { key: 'sayuran' as const, label: 'Sayuran' },
                    ];

                    return (
                      <tr key={sesiNum}>
                        <td className="border border-black font-bold text-base align-middle px-3 py-4">
                          {sesiNum}
                        </td>
                        {categories.map((cat) => {
                          if (docKategoriFilter !== 'ALL' && docKategoriFilter !== cat.key) {
                            return null;
                          }
                          const item = sesiData?.[cat.key];
                          return (
                            <td key={cat.key} className="border border-black p-2 align-middle">
                              {item?.fotoUrl ? (
                                <div
                                  onClick={() =>
                                    setLightboxImage({
                                      url: item.fotoUrl!,
                                      title: `${cat.label} - Sesi ${sesiNum}`,
                                      suhu: formatSuhu(item.suhu),
                                    })
                                  }
                                  className="cursor-pointer group flex flex-col items-center justify-center"
                                >
                                  <img
                                    src={item.fotoUrl}
                                    alt={`${cat.label} Sesi ${sesiNum}`}
                                    className="max-h-48 max-w-full object-contain mx-auto rounded-none group-hover:opacity-90 transition-opacity"
                                  />
                                </div>
                              ) : (
                                <div className="py-12 text-slate-400 italic text-[11px]">
                                  Foto belum diunggah
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
              <p className="font-bold">Belum ada data dokumentasi untuk tanggal ini.</p>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal for Photo Inspection */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-3xl w-full text-white shadow-2xl relative"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">{lightboxImage.title}</h4>
                {lightboxImage.suhu && (
                  <span className="text-xs text-amber-400 font-bold">
                    Suhu Terukur: {lightboxImage.suhu} °C
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={lightboxImage.url}
                alt="Detail Suhu"
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
