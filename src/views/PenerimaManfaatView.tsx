import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Calendar,
  Lock,
  Unlock,
  Copy,
  Printer,
  Download,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building2,
  Baby,
  HeartPulse,
  GraduationCap,
  School,
  FileText,
  BarChart3,
  Settings,
  History,
  RefreshCw,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  Award,
  Sparkles,
  Eye,
  FileCheck,
  X,
  User,
  Phone
} from 'lucide-react';
import {
  BeneficiaryGroup,
  BeneficiaryLocation,
  DailyBeneficiaryRecord,
  DailyBeneficiarySummary,
  BeneficiaryAuditLog,
  KlasifikasiPorsi,
  KategoriLembaga
} from '../types';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useFirestoreRealtime } from '../lib/useFirestoreRealtime';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import {
  PortionValidationBadge,
  ValidatedPortionInput,
  RealtimeValidationAuditBar,
  calculatePortionValidation
} from '../components/common/PortionValidationInput';
import {
  GroupFormModal,
  getKategoriConfig,
  inferKategoriFromText,
  KATEGORI_LEMBAGA_CONFIGS
} from '../components/common/GroupFormModal';
import { calculateAutoPortion } from '../utils/portionHelper';
import { BastSubView } from '../components/penerima/BastSubView';

interface PenerimaManfaatViewProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const PenerimaManfaatView: React.FC<PenerimaManfaatViewProps> = ({ currentPath = '/penerima-manfaat', onNavigate }) => {
  const { user } = useAuth();

  const getSubTabFromPath = (path: string) => {
    if (path.includes('bast')) return 'bast';
    if (path.includes('rekap-harian')) return 'rekap-harian';
    if (path.includes('rekap-bulanan')) return 'rekap-bulanan';
    if (path.includes('kelompok')) return 'kelompok';
    return 'hari-ini';
  };

  const [activeTab, setActiveTab] = useState<'hari-ini' | 'bast' | 'rekap-harian' | 'rekap-bulanan' | 'kelompok'>(getSubTabFromPath(currentPath));

  useEffect(() => {
    setActiveTab(getSubTabFromPath(currentPath));
  }, [currentPath]);

  // Selected Date state (defaults to Today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // States for Daily Beneficiaries
  const [dailyRecords, setDailyRecords] = useState<DailyBeneficiaryRecord[]>([]);
  const [dailySummary, setDailySummary] = useState<DailyBeneficiarySummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // States for Master Groups & Locations
  const [groups, setGroups] = useState<BeneficiaryGroup[]>([]);
  const [locations, setLocations] = useState<BeneficiaryLocation[]>([]);
  const deletedGroupIds = useRef<Set<string>>(new Set());

  // Modals & Form states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<Partial<DailyBeneficiaryRecord> | null>(null);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<Partial<BeneficiaryLocation> | null>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<Partial<BeneficiaryGroup> | null>(null);

  // Rekap Harian states
  const [historyStartDate, setHistoryStartDate] = useState<string>('');
  const [historyEndDate, setHistoryEndDate] = useState<string>('');
  const [historyGroupFilter, setHistoryGroupFilter] = useState<string>('all');
  const [historyRecords, setHistoryRecords] = useState<DailyBeneficiaryRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<BeneficiaryAuditLog[]>([]);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [detailModalRekap, setDetailModalRekap] = useState<{
    tanggal: string;
    hariTanggal: string;
    totalSasaran: number;
    status: string;
    kelompokSasaran: string;
  } | null>(null);
  const [deletedRekapDates, setDeletedRekapDates] = useState<string[]>([]);

  // States for "Buat Penerima Manfaat" Form Modal
  const [isBuatPenerimaModalOpen, setIsBuatPenerimaModalOpen] = useState<boolean>(false);
  const [buatPenerimaTanggal, setBuatPenerimaTanggal] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [buatPenerimaStatusDoc, setBuatPenerimaStatusDoc] = useState<'FINAL' | 'DRAFT'>('FINAL');
  const [buatPenerimaCatatan, setBuatPenerimaCatatan] = useState<string>('');
  interface BuatPenerimaLembagaItem {
    id: string;
    groupId?: string;
    groupNama?: string;
    namaInstansi: string;
    kategoriLembaga?: KategoriLembaga;
    breakdownKelas?: Record<string, number>;
    statusKbm: 'Aktif' | 'Libur Full' | 'Libur Sebagian';
    keteranganLibur?: string;
    keterangan?: string;
    targetSiswa: number;
    targetGuru: number;
    targetBalita?: number;
    targetBumilBusui?: number;
    klasifikasiPorsi: KlasifikasiPorsi;
  }

  const [buatPenerimaLembagaList, setBuatPenerimaLembagaList] = useState<BuatPenerimaLembagaItem[]>([]);

  // Confirmation Modal State (replaces native window.confirm for iframe compatibility)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm?: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    danger: true
  });

  // Helper to build fully synced lembaga list from Pengaturan Kelompok (groups & locations)
  const buildSyncedLembagaList = (tanggalStr?: string): BuatPenerimaLembagaItem[] => {
    const list: BuatPenerimaLembagaItem[] = [];

    const existingForDate = tanggalStr
      ? (historyRecords.filter((rec) => rec.tanggal === tanggalStr).length > 0
          ? historyRecords.filter((rec) => rec.tanggal === tanggalStr)
          : dailyRecords.filter((rec) => rec.tanggal === tanggalStr))
      : [];

    // If records already exist for this date, restore them accurately including breakdownKelas & kategoriLembaga
    if (existingForDate.length > 0) {
      const mapped = existingForDate.map((rec, idx) => {
        const klas = (rec.klasifikasiPorsi || rec.groupNama || 'Porsi Besar') as KlasifikasiPorsi;
        const rs = rec.rincianSasaran;
        let targetSiswa = Number(rec.jumlahAwal) || 0;
        let targetGuru = 0;
        let targetBalita: number | undefined = undefined;
        let targetBumilBusui: number | undefined = undefined;

        // Restore kategoriLembaga and breakdownKelas by cross-matching with master groups/locations if missing
        const cleanName = rec.namaInstansi.trim().toLowerCase();
        let matchedCat: KategoriLembaga | undefined = rec.kategoriLembaga;
        let matchedBd: Record<string, number> = rec.breakdownKelas
          ? { ...rec.breakdownKelas }
          : (rs?.breakdownKelas ? { ...rs.breakdownKelas } : {});

        // Match with group data
        let matchedGroup = groups.find((g) =>
          g.id === rec.groupId ||
          (rec.groupNama && g.nama.trim().toLowerCase() === rec.groupNama.trim().toLowerCase()) ||
          (g.lembagaList && g.lembagaList.some((l) => l.namaInstansi.trim().toLowerCase() === cleanName))
        );

        let officialInstName = rec.namaInstansi;
        if (matchedGroup && matchedGroup.lembagaList) {
          const foundL = matchedGroup.lembagaList.find((l) => l.namaInstansi.trim().toLowerCase() === cleanName);
          if (foundL) {
            officialInstName = foundL.namaInstansi;
            if (!matchedCat) matchedCat = foundL.kategoriLembaga || matchedGroup.kategoriLembaga;
            if (Object.keys(matchedBd).length === 0 && foundL.breakdownKelas) {
              matchedBd = { ...foundL.breakdownKelas };
            }
          }
        }

        if (!matchedCat || Object.keys(matchedBd).length === 0) {
          for (const g of groups) {
            if (g.lembagaList) {
              const foundL = g.lembagaList.find((l) => l.namaInstansi.trim().toLowerCase() === cleanName);
              if (foundL) {
                if (!matchedGroup) matchedGroup = g;
                officialInstName = foundL.namaInstansi;
                if (!matchedCat) matchedCat = foundL.kategoriLembaga || g.kategoriLembaga;
                if (Object.keys(matchedBd).length === 0 && foundL.breakdownKelas) {
                  matchedBd = { ...foundL.breakdownKelas };
                }
                break;
              }
            }
          }
        }

        if (!matchedCat || Object.keys(matchedBd).length === 0) {
          const foundLoc = locations.find((l) => l.namaInstansi.trim().toLowerCase() === cleanName);
          if (foundLoc) {
            if (!matchedCat) matchedCat = foundLoc.kategoriLembaga;
            if (Object.keys(matchedBd).length === 0 && (foundLoc.breakdownKelas || foundLoc.kategoriBreakdown?.breakdownKelas)) {
              matchedBd = { ...(foundLoc.breakdownKelas || foundLoc.kategoriBreakdown?.breakdownKelas) };
            }
          }
        }

        if (!matchedCat) {
          matchedCat = inferKategoriFromText(rec.namaInstansi, 'SD / MI');
        }

        const resolvedGroupId = rec.groupId || matchedGroup?.id;
        const resolvedGroupNama = rec.groupNama || matchedGroup?.nama || (rec as any).kelompokSasaran || inferKategoriFromText(rec.namaInstansi, 'SD / MI');

        const isRec3B = (matchedCat && matchedCat.includes('3B')) || cleanName.includes('3b') || cleanName.includes('posyandu');
        if (isRec3B) {
          const kL = Number(matchedBd['kader_l']) || 0;
          const kP = Number(matchedBd['kader_p']) || 0;
          targetGuru = (kL + kP) || Number(matchedBd['kader']) || 0;
          targetSiswa = 0;
          const b511 = (Number(matchedBd['balita511_l']) || 0) + (Number(matchedBd['balita511_p']) || 0) || Number(matchedBd['baduta']) || 0;
          const b1259 = (Number(matchedBd['balita1259_l']) || 0) + (Number(matchedBd['balita1259_p']) || 0) || Number(matchedBd['balita']) || 0;
          targetBalita = (b511 + b1259) || Number(rs?.balita) || 0;
          const busui = Number(matchedBd['busui_w']) || Number(matchedBd['busui']) || 0;
          const bumil = Number(matchedBd['bumil_w']) || Number(matchedBd['bumil']) || 0;
          targetBumilBusui = (busui + bumil) || ((Number(rs?.ibuHamil) || 0) + (Number(rs?.ibuMenyusui) || 0));
        } else if (rs) {
          targetGuru = Number(rs.guru) || 0;
          if (klas === 'Porsi Balita' || klas === 'Balita' || rec.kategori === 'Balita') {
            targetBalita = Number(rs.balita) || 0;
            targetSiswa = targetBalita;
          } else if (
            klas === 'Porsi Ibu Hamil' ||
            klas === 'Porsi Ibu Menyusui' ||
            klas === 'Bumil & Busui' ||
            rec.kategori === 'Ibu Hamil' ||
            rec.kategori === 'Ibu Menyusui'
          ) {
            targetBumilBusui = (Number(rs.ibuHamil) || 0) + (Number(rs.ibuMenyusui) || 0);
            targetSiswa = targetBumilBusui;
          } else {
            targetSiswa = Number(rs.siswa) || 0;
          }
        }

        let statusKbm: 'Aktif' | 'Libur Full' | 'Libur Sebagian' = rec.statusKbm || 'Aktif';
        let keteranganLibur = rec.keteranganLibur || '';
        if (!rec.statusKbm) {
          if (rec.catatan?.includes('Libur Full') || rec.keterangan?.includes('Libur Full')) {
            statusKbm = 'Libur Full';
          } else if (rec.catatan?.includes('Libur Sebagian') || rec.keterangan?.includes('Libur Sebagian')) {
            statusKbm = 'Libur Sebagian';
            keteranganLibur = (rec.catatan || rec.keterangan || '').replace('Libur Sebagian:', '').trim();
          }
        }

        return {
          id: rec.locationId || rec.id || `lbg-${idx + 1}`,
          groupId: resolvedGroupId,
          groupNama: resolvedGroupNama,
          namaInstansi: officialInstName,
          kategoriLembaga: matchedCat,
          breakdownKelas: matchedBd,
          statusKbm,
          keteranganLibur,
          keterangan: rec.keterangan && !rec.keterangan.startsWith('Aktif') && !rec.keterangan.startsWith('Libur')
            ? rec.keterangan
            : '',
          targetSiswa,
          targetGuru,
          targetBalita,
          targetBumilBusui,
          klasifikasiPorsi: klas
        };
      });

      // Also ensure newly created groups in "Pengaturan Kelompok" appear in the list automatically
      const existingNames = new Set(mapped.map((r) => r.namaInstansi.trim().toLowerCase()));
      if (groups && groups.length > 0) {
        groups.forEach((g) => {
          if (g.lembagaList && g.lembagaList.length > 0) {
            g.lembagaList.forEach((l) => {
              const key = l.namaInstansi.trim().toLowerCase();
              if (existingNames.has(key)) return;
              existingNames.add(key);

              const itemCat: KategoriLembaga = l.kategoriLembaga || g.kategoriLembaga || inferKategoriFromText(l.namaInstansi, 'SD / MI');
              const itemBd: Record<string, number> = l.breakdownKelas ? { ...l.breakdownKelas } : {};
              const itemKlas = (l.klasifikasiPorsi as any) || (g.klasifikasiPorsi as any) || 'Porsi Besar';

              const isItem3B = itemCat.includes('3B');
              let targetMain = isItem3B ? 0 : (Number(l.targetSiswa) || 0);
              if (itemKlas === 'Porsi Ibu Hamil' || itemKlas === 'Porsi Ibu Menyusui' || itemKlas === 'Bumil & Busui') {
                targetMain = Number(l.targetBumilBusui) || Number(l.targetSiswa) || 0;
              } else if (itemKlas === 'Porsi Balita' || itemKlas === 'Balita') {
                targetMain = Number(l.targetBalita) || Number(l.targetSiswa) || 0;
              }
              const itemKader = isItem3B ? ((Number(itemBd.kader_l) || 0) + (Number(itemBd.kader_p) || 0) || Number(itemBd.kader) || 0) : 0;
              const targetGuruVal = isItem3B ? itemKader : (Number(l.targetGuru) || 0);

              mapped.push({
                id: l.id || `lbg-${Math.random().toString(36).substr(2, 6)}`,
                groupId: g.id,
                groupNama: g.nama,
                namaInstansi: l.namaInstansi,
                kategoriLembaga: itemCat,
                breakdownKelas: itemBd,
                statusKbm: 'Aktif',
                keteranganLibur: '',
                keterangan: l.keterangan || '',
                targetSiswa: isItem3B ? 0 : targetMain,
                targetGuru: targetGuruVal,
                targetBalita: l.targetBalita,
                targetBumilBusui: l.targetBumilBusui,
                klasifikasiPorsi: itemKlas
              });
            });
          }
        });
      }

      return mapped;
    }

    const addedInstansiNames = new Set<string>();

    if (groups && groups.length > 0) {
      groups.forEach((g) => {
        if (g.lembagaList && g.lembagaList.length > 0) {
          g.lembagaList.forEach((l) => {
            const key = l.namaInstansi.trim().toLowerCase();
            if (addedInstansiNames.has(key)) return;
            addedInstansiNames.add(key);

            const savedRec = existingForDate.find(
              (r) => r.namaInstansi.trim().toLowerCase() === key
            );

            let statusKbm: 'Aktif' | 'Libur Full' | 'Libur Sebagian' = 'Aktif';
            let keteranganLibur = '';
            if (savedRec?.catatan?.includes('Libur Full')) {
              statusKbm = 'Libur Full';
            } else if (savedRec?.catatan?.includes('Libur Sebagian')) {
              statusKbm = 'Libur Sebagian';
              keteranganLibur = savedRec.catatan.replace('Libur Sebagian:', '').trim();
            }

            const itemCat: KategoriLembaga = l.kategoriLembaga || g.kategoriLembaga || inferKategoriFromText(l.namaInstansi, 'SD / MI');
            const itemBd: Record<string, number> = l.breakdownKelas
              ? { ...l.breakdownKelas }
              : (savedRec?.breakdownKelas ? { ...savedRec.breakdownKelas } : {});
            const itemKlas = (l.klasifikasiPorsi as any) || (g.klasifikasiPorsi as any) || 'Porsi Besar';

            const isItem3B = itemCat.includes('3B');
            let targetMain = isItem3B ? 0 : (Number(l.targetSiswa) || 0);
            if (itemKlas === 'Porsi Ibu Hamil' || itemKlas === 'Porsi Ibu Menyusui' || itemKlas === 'Bumil & Busui') {
              targetMain = Number(l.targetBumilBusui) || Number(l.targetSiswa) || 0;
            } else if (itemKlas === 'Porsi Balita' || itemKlas === 'Balita') {
              targetMain = Number(l.targetBalita) || Number(l.targetSiswa) || 0;
            }
            const itemKader = isItem3B ? ((Number(itemBd.kader_l) || 0) + (Number(itemBd.kader_p) || 0) || Number(itemBd.kader) || 0) : 0;
            let targetGuru = isItem3B ? itemKader : (Number(l.targetGuru) || 0);
            if (savedRec) {
              const masterTotal = targetMain + targetGuru;
              const recTotal = Number(savedRec.jumlahAwal) || 0;
              if (recTotal !== masterTotal && recTotal > 0 && !isItem3B) {
                targetMain = recTotal;
                targetGuru = 0;
              }
            }

            list.push({
              id: l.id || `lbg-${Math.random().toString(36).substr(2, 6)}`,
              groupId: g.id,
              groupNama: g.nama,
              namaInstansi: l.namaInstansi,
              kategoriLembaga: itemCat,
              breakdownKelas: itemBd,
              statusKbm,
              keteranganLibur,
              keterangan: l.keterangan || '',
              targetSiswa: targetMain,
              targetGuru,
              targetBalita: l.targetBalita,
              targetBumilBusui: l.targetBumilBusui,
              klasifikasiPorsi: itemKlas
            });
          });
        } else {
          const key = g.nama.trim().toLowerCase();
          if (!addedInstansiNames.has(key)) {
            addedInstansiNames.add(key);
            list.push({
              id: `lbg-${g.id}`,
              groupId: g.id,
              groupNama: g.nama,
              namaInstansi: g.nama,
              kategoriLembaga: g.kategoriLembaga || 'SD / MI',
              breakdownKelas: {},
              statusKbm: 'Aktif',
              keteranganLibur: '',
              keterangan: '',
              targetSiswa: 0,
              targetGuru: 0,
              klasifikasiPorsi: (g.klasifikasiPorsi as any) || 'Porsi Besar'
            });
          }
        }

        // Also check locations array for this group
        const grpLocs = locations.filter((loc) => loc.groupId === g.id || loc.groupNama === g.nama);
        grpLocs.forEach((loc) => {
          const key = loc.namaInstansi.trim().toLowerCase();
          if (addedInstansiNames.has(key)) return;
          addedInstansiNames.add(key);

          const savedRec = existingForDate.find(
            (r) => r.namaInstansi.trim().toLowerCase() === key
          );

          let statusKbm: 'Aktif' | 'Libur Full' | 'Libur Sebagian' = 'Aktif';
          let keteranganLibur = '';
          if (savedRec?.catatan?.includes('Libur Full')) {
            statusKbm = 'Libur Full';
          } else if (savedRec?.catatan?.includes('Libur Sebagian')) {
            statusKbm = 'Libur Sebagian';
            keteranganLibur = savedRec.catatan.replace('Libur Sebagian:', '').trim();
          }

          const kb = loc.kategoriBreakdown || {};
          const locKlas = (loc.klasifikasiPorsi as any) || (g.klasifikasiPorsi as any) || 'Porsi Besar';
          const itemCat: KategoriLembaga = loc.kategoriLembaga || g.kategoriLembaga || inferKategoriFromText(loc.namaInstansi, 'SD / MI');
          const itemBd: Record<string, number> = loc.breakdownKelas || kb.breakdownKelas || (savedRec?.breakdownKelas ? { ...savedRec.breakdownKelas } : {});
          const isLoc3B = itemCat.includes('3B') || loc.namaInstansi.toLowerCase().includes('3b') || loc.namaInstansi.toLowerCase().includes('posyandu');

          let locMain = 0;
          let locKader = 0;
          if (isLoc3B) {
            locKader = (Number(itemBd.kader_l) || 0) + (Number(itemBd.kader_p) || 0) || Number(itemBd.kader) || 0;
          } else if (locKlas === 'Porsi Ibu Hamil') locMain = Number(kb.ibuHamil) || Number(kb.siswa) || 0;
          else if (locKlas === 'Porsi Ibu Menyusui') locMain = Number(kb.ibuMenyusui) || Number(kb.siswa) || 0;
          else if (locKlas === 'Bumil & Busui') locMain = (Number(kb.ibuHamil) || 0) + (Number(kb.ibuMenyusui) || 0) || Number(kb.siswa) || 0;
          else if (locKlas === 'Porsi Balita' || locKlas === 'Balita') locMain = Number(kb.balita) || Number(kb.siswa) || 0;
          else locMain = Number(kb.siswa) || 0;

          if (!locMain && !savedRec && !isLoc3B) {
            locMain = Number(loc.defaultJumlah) || 0;
          }

          list.push({
            id: loc.id,
            groupId: g.id,
            groupNama: g.nama,
            namaInstansi: loc.namaInstansi,
            kategoriLembaga: itemCat,
            breakdownKelas: itemBd,
            statusKbm,
            keteranganLibur,
            keterangan: '',
            targetSiswa: isLoc3B ? 0 : (savedRec ? Number(savedRec.jumlahAwal) || 0 : locMain),
            targetGuru: isLoc3B ? (savedRec ? 0 : locKader) : (savedRec ? 0 : (Number(kb.guru) || 0)),
            klasifikasiPorsi: locKlas
          });
        });
      });
    }

    // Check remaining locations
    if (locations && locations.length > 0) {
      locations.forEach((loc) => {
        const key = loc.namaInstansi.trim().toLowerCase();
        if (addedInstansiNames.has(key)) return;
        addedInstansiNames.add(key);

        const savedRec = existingForDate.find(
          (r) => r.namaInstansi.trim().toLowerCase() === key
        );

        let statusKbm: 'Aktif' | 'Libur Full' | 'Libur Sebagian' = 'Aktif';
        let keteranganLibur = '';
        if (savedRec?.catatan?.includes('Libur Full')) {
          statusKbm = 'Libur Full';
        } else if (savedRec?.catatan?.includes('Libur Sebagian')) {
          statusKbm = 'Libur Sebagian';
          keteranganLibur = savedRec.catatan.replace('Libur Sebagian:', '').trim();
        }

        const kb = loc.kategoriBreakdown || {};
        const locKlas = (loc.klasifikasiPorsi as any) || 'Porsi Besar';
        const itemCat: KategoriLembaga = loc.kategoriLembaga || inferKategoriFromText(loc.namaInstansi, 'SD / MI');
        const itemBd: Record<string, number> = loc.breakdownKelas || kb.breakdownKelas || (savedRec?.breakdownKelas ? { ...savedRec.breakdownKelas } : {});
        const isLoc3B = itemCat.includes('3B') || loc.namaInstansi.toLowerCase().includes('3b') || loc.namaInstansi.toLowerCase().includes('posyandu');

        let locMain = 0;
        let locKader = 0;
        if (isLoc3B) {
          locKader = (Number(itemBd.kader_l) || 0) + (Number(itemBd.kader_p) || 0) || Number(itemBd.kader) || 0;
        } else if (locKlas === 'Porsi Ibu Hamil') locMain = Number(kb.ibuHamil) || Number(kb.siswa) || 0;
        else if (locKlas === 'Porsi Ibu Menyusui') locMain = Number(kb.ibuMenyusui) || Number(kb.siswa) || 0;
        else if (locKlas === 'Bumil & Busui') locMain = (Number(kb.ibuHamil) || 0) + (Number(kb.ibuMenyusui) || 0) || Number(kb.siswa) || 0;
        else if (locKlas === 'Porsi Balita' || locKlas === 'Balita') locMain = Number(kb.balita) || Number(kb.siswa) || 0;
        else locMain = Number(kb.siswa) || 0;

        if (!locMain && !savedRec && !isLoc3B) {
          locMain = Number(loc.defaultJumlah) || 0;
        }

        list.push({
          id: loc.id,
          groupId: loc.groupId,
          groupNama: loc.groupNama,
          namaInstansi: loc.namaInstansi,
          kategoriLembaga: itemCat,
          breakdownKelas: itemBd,
          statusKbm,
          keteranganLibur,
          keterangan: '',
          targetSiswa: isLoc3B ? 0 : (savedRec ? Number(savedRec.jumlahAwal) || 0 : locMain),
          targetGuru: isLoc3B ? (savedRec ? 0 : locKader) : (savedRec ? 0 : (Number(kb.guru) || 0)),
          klasifikasiPorsi: locKlas
        });
      });
    }

    if (list.length === 0) {
      list.push(
        {
          id: '1',
          namaInstansi: 'SD Zainul Hasan Genggong',
          kategoriLembaga: 'SD / MI',
          breakdownKelas: { kelas1: 60, kelas2: 62, kelas3: 64, kelas4: 65, kelas5: 66, kelas6: 67 },
          statusKbm: 'Aktif',
          keteranganLibur: '',
          keterangan: '',
          targetSiswa: 384,
          targetGuru: 25,
          klasifikasiPorsi: 'Porsi Kecil'
        },
        {
          id: '2',
          namaInstansi: 'SMP ZAINUL HASAN 1 GENGGONG',
          kategoriLembaga: 'SMP / MTs',
          breakdownKelas: { kelas7: 120, kelas8: 115, kelas9: 115 },
          statusKbm: 'Aktif',
          keteranganLibur: '',
          keterangan: '',
          targetSiswa: 350,
          targetGuru: 20,
          klasifikasiPorsi: 'Porsi Besar'
        },
        {
          id: '3',
          namaInstansi: 'MA Model Hafshawaty',
          kategoriLembaga: 'SMA / SMK / MA',
          breakdownKelas: { kelas10: 75, kelas11: 72, kelas12: 71 },
          statusKbm: 'Aktif',
          keteranganLibur: '',
          keterangan: '',
          targetSiswa: 218,
          targetGuru: 25,
          klasifikasiPorsi: 'Porsi Besar'
        },
        {
          id: '4',
          namaInstansi: 'Posyandu Desa Temenggungan',
          kategoriLembaga: '3B (Balita, Ibu Hamil & Ibu Menyusui)',
          breakdownKelas: { busui_w: 21, bumil_w: 30, balita511_l: 15, balita511_p: 18, balita1259_l: 17, balita1259_p: 18, kader_l: 0, kader_p: 0 },
          statusKbm: 'Aktif',
          keteranganLibur: '',
          keterangan: '',
          targetSiswa: 0,
          targetGuru: 0,
          targetBalita: 68,
          targetBumilBusui: 51,
          klasifikasiPorsi: 'Bumil & Busui'
        }
      );
    }

    return list;
  };

  // Change handlers for dynamic breakdown inputs in "Buat Penerima Manfaat"
  const handleBuatPenerimaClassChange = (lembagaIdx: number, classKey: string, rawVal: string) => {
    const num = Math.max(0, parseInt(rawVal, 10) || 0);
    const list = [...buatPenerimaLembagaList];
    const item = { ...list[lembagaIdx] };
    const itemCat = item.kategoriLembaga || inferKategoriFromText(item.namaInstansi, 'SD / MI');
    const itemConf = getKategoriConfig(itemCat);

    const is3B = itemCat.includes('3B') || itemConf.id.includes('3B') || itemConf.targetCategory === '3B';
    if (is3B) {
      handleBuatPenerima3BChange(lembagaIdx, classKey, rawVal);
      return;
    }

    const bd = { ...(item.breakdownKelas || {}), [classKey]: num };
    item.breakdownKelas = bd;

    const sumClasses = itemConf.classes.reduce((sum, c) => sum + (Number(bd[c.key]) || 0), 0);
    const g = Number(item.targetGuru) || 0;

    if (itemConf.targetCategory === 'Balita') {
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

    const autoP = calculateAutoPortion({
      kategoriLembaga: itemCat,
      namaInstansi: item.namaInstansi,
      breakdownKelas: bd,
      targetSiswa: item.targetSiswa,
      targetGuru: g,
      targetBalita: item.targetBalita,
      targetBumilBusui: item.targetBumilBusui,
      total: sumClasses + g
    });
    item.klasifikasiPorsi = autoP.klasifikasi;

    list[lembagaIdx] = item;
    setBuatPenerimaLembagaList(list);
  };

  const handleBuatPenerima3BChange = (lembagaIdx: number, subKey: string, rawVal: string) => {
    const num = Math.max(0, parseInt(rawVal, 10) || 0);
    const list = [...buatPenerimaLembagaList];
    const item = { ...list[lembagaIdx] };
    const bd = { ...(item.breakdownKelas || {}), [subKey]: num };

    if (subKey === 'busui_w') bd.busui = num;
    if (subKey === 'bumil_w') bd.bumil = num;
    if (subKey === 'balita511_l' || subKey === 'balita511_p') {
      bd.baduta = (Number(bd.balita511_l) || 0) + (Number(bd.balita511_p) || 0);
    }
    if (subKey === 'balita1259_l' || subKey === 'balita1259_p') {
      bd.balita = (Number(bd.balita1259_l) || 0) + (Number(bd.balita1259_p) || 0);
    }
    if (subKey === 'kader_l' || subKey === 'kader_p') {
      bd.kader = (Number(bd.kader_l) || 0) + (Number(bd.kader_p) || 0);
    }

    item.breakdownKelas = bd;

    const tBalita511 = (Number(bd.balita511_l) || 0) + (Number(bd.balita511_p) || 0) || Number(bd.baduta) || 0;
    const tBalita1259 = (Number(bd.balita1259_l) || 0) + (Number(bd.balita1259_p) || 0) || Number(bd.balita) || 0;
    const tBalita = tBalita511 + tBalita1259;
    const tBusui = Number(bd.busui_w) || Number(bd.busui) || 0;
    const tBumil = Number(bd.bumil_w) || Number(bd.bumil) || 0;
    const tBumilBusui = tBusui + tBumil;
    const tKader = (Number(bd.kader_l) || 0) + (Number(bd.kader_p) || 0) || Number(bd.kader) || 0;

    item.targetBalita = tBalita;
    item.targetBumilBusui = tBumilBusui;
    item.targetGuru = tKader;
    item.targetSiswa = 0;

    const autoP = calculateAutoPortion({
      kategoriLembaga: item.kategoriLembaga || '3B (Balita, Ibu Hamil & Ibu Menyusui)',
      namaInstansi: item.namaInstansi,
      breakdownKelas: bd,
      targetSiswa: 0,
      targetBalita: tBalita,
      targetBumilBusui: tBumilBusui,
      targetGuru: tKader,
      total: tBalita + tBumilBusui + tKader
    });
    item.klasifikasiPorsi = autoP.klasifikasi;

    list[lembagaIdx] = item;
    setBuatPenerimaLembagaList(list);
  };

  const handleBuatPenerimaGuruChange = (lembagaIdx: number, rawVal: string) => {
    const g = Math.max(0, parseInt(rawVal, 10) || 0);
    const list = [...buatPenerimaLembagaList];
    const item = { ...list[lembagaIdx] };
    item.targetGuru = g;

    const mainTarget = Number(item.targetSiswa) || Number(item.targetBalita) || Number(item.targetBumilBusui) || 0;

    const autoP = calculateAutoPortion({
      kategoriLembaga: item.kategoriLembaga || inferKategoriFromText(item.namaInstansi, 'SD / MI'),
      namaInstansi: item.namaInstansi,
      breakdownKelas: item.breakdownKelas,
      targetSiswa: item.targetSiswa,
      targetGuru: g,
      targetBalita: item.targetBalita,
      targetBumilBusui: item.targetBumilBusui,
      total: mainTarget + g
    });
    item.klasifikasiPorsi = autoP.klasifikasi;

    list[lembagaIdx] = item;
    setBuatPenerimaLembagaList(list);
  };

  const handleBuatPenerimaCategoryChange = (lembagaIdx: number, newCat: KategoriLembaga) => {
    const list = [...buatPenerimaLembagaList];
    const item = { ...list[lembagaIdx] };
    const itemConf = getKategoriConfig(newCat);

    const newBd: Record<string, number> = {};
    itemConf.classes.forEach((c) => {
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
      const kL = newBd['kader_l'] !== undefined ? Number(newBd['kader_l']) || 0 : 0;
      const kP = newBd['kader_p'] !== undefined ? Number(newBd['kader_p']) || 0 : 0;

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

      const totBalita = b511L + b511P + b1259L + b1259P;
      const totBumilBusui = bW + mW;
      const totKader = kL + kP;

      item.targetBalita = totBalita;
      item.targetBumilBusui = totBumilBusui;
      item.targetGuru = totKader;
      item.targetSiswa = 0;
      if (!item.namaInstansi || item.namaInstansi.includes('SD') || item.namaInstansi.includes('Instansi')) {
        item.namaInstansi = `Posyandu / Lembaga 3B #${lembagaIdx + 1}`;
      }
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

    const totalVal = (Number(item.targetSiswa) || Number(item.targetBalita) || Number(item.targetBumilBusui) || 0) + (Number(item.targetGuru) || 0);
    const autoP = calculateAutoPortion({
      kategoriLembaga: newCat,
      namaInstansi: item.namaInstansi,
      breakdownKelas: newBd,
      targetSiswa: item.targetSiswa,
      targetGuru: item.targetGuru,
      targetBalita: item.targetBalita,
      targetBumilBusui: item.targetBumilBusui,
      total: totalVal
    });
    item.klasifikasiPorsi = autoP.klasifikasi;

    list[lembagaIdx] = item;
    setBuatPenerimaLembagaList(list);
  };

  // Helper to retrieve master group target and breakdown for an institution
  const getMasterLembagaData = (namaInstansi: string) => {
    const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanName = norm(namaInstansi);

    if (groups && groups.length > 0) {
      for (const g of groups) {
        if (g.lembagaList && g.lembagaList.length > 0) {
          for (const l of g.lembagaList) {
            const lName = norm(l.namaInstansi);
            if (lName === cleanName || (cleanName.length > 3 && (lName.includes(cleanName) || cleanName.includes(lName)))) {
              const isCat3B = (l.kategoriLembaga || g.kategoriLembaga || '').includes('3B') || cleanName.includes('posyandu') || cleanName.includes('3b');
              const lBd = l.breakdownKelas || {};
              const lBumil = Number(lBd.bumil_w ?? lBd.bumil) || 0;
              const lBusui = Number(lBd.busui_w ?? lBd.busui) || 0;
              const lBaduta = (Number(lBd.balita511_l) || 0) + (Number(lBd.balita511_p) || 0) || Number(lBd.baduta) || 0;
              const lBalita = (Number(lBd.balita1259_l) || 0) + (Number(lBd.balita1259_p) || 0) || Number(lBd.balita) || 0;
              const lKader = (Number(lBd.kader_l) || 0) + (Number(lBd.kader_p) || 0) || Number(lBd.kader) || 0;

              let targetSiswa = isCat3B ? 0 : (Number(l.targetSiswa) || 0);
              let targetGuru = isCat3B ? lKader : (Number(l.targetGuru) || 0);
              let targetBalita = Number(l.targetBalita) || (lBaduta + lBalita) || 0;
              let targetBumilBusui = Number(l.targetBumilBusui) || (lBumil + lBusui) || 0;

              const totalMaster = isCat3B
                ? (targetBalita + targetBumilBusui + targetGuru)
                : (targetSiswa + targetGuru + targetBalita + targetBumilBusui || Number(l.total) || 0);
              return {
                targetMaster: totalMaster,
                kategoriLembaga: l.kategoriLembaga || g.kategoriLembaga,
                breakdownKelas: l.breakdownKelas || (cleanName.includes('temenggungan') ? { busui_w: 21, bumil_w: 30, balita511_l: 15, balita511_p: 18, balita1259_l: 17, balita1259_p: 18, kader_l: 0, kader_p: 0 } : {}),
                targetSiswa,
                targetGuru,
                targetBalita,
                targetBumilBusui,
                klasifikasiPorsi: l.klasifikasiPorsi || g.klasifikasiPorsi,
                namaKelompok: g.nama
              };
            }
          }
        }
      }
    }

    if (locations && locations.length > 0) {
      for (const loc of locations) {
        const locName = norm(loc.namaInstansi);
        if (locName === cleanName || (cleanName.length > 3 && (locName.includes(cleanName) || cleanName.includes(locName)))) {
          const isLoc3B = (loc.kategoriLembaga || '').includes('3B') || locName.includes('posyandu') || locName.includes('3b');
          const kb = loc.kategoriBreakdown || {};
          const locBd = loc.breakdownKelas || kb.breakdownKelas || {};
          const locKader = (Number(locBd.kader_l) || 0) + (Number(locBd.kader_p) || 0) || Number(locBd.kader) || 0;
          const sumKb = (Number(kb.siswa) || 0) + (isLoc3B ? locKader : (Number(kb.guru) || 0)) + (Number(kb.balita) || 0) + (Number(kb.ibuHamil) || 0) + (Number(kb.ibuMenyusui) || 0);
          const totalMaster = sumKb > 0 ? sumKb : Number(loc.defaultJumlah) || 0;
          return {
            targetMaster: totalMaster,
            kategoriLembaga: loc.kategoriLembaga,
            breakdownKelas: locBd,
            targetSiswa: isLoc3B ? 0 : (Number(kb.siswa) || 0),
            targetGuru: isLoc3B ? locKader : (Number(kb.guru) || 0),
            targetBalita: Number(kb.balita) || 0,
            targetBumilBusui: (Number(kb.ibuHamil) || 0) + (Number(kb.ibuMenyusui) || 0),
            klasifikasiPorsi: loc.klasifikasiPorsi,
            namaKelompok: loc.groupNama
          };
        }
      }
    }

    // Fallback baseline for known regional SPPG Temenggungan institutions
    if (cleanName.includes('temenggungan') || cleanName.includes('posyandu')) {
      return {
        targetMaster: 119,
        kategoriLembaga: '3B (Balita, Ibu Hamil & Ibu Menyusui)' as KategoriLembaga,
        breakdownKelas: { busui_w: 21, bumil_w: 30, balita511_l: 15, balita511_p: 18, balita1259_l: 17, balita1259_p: 18, kader_l: 0, kader_p: 0 },
        targetSiswa: 0,
        targetGuru: 0,
        targetBalita: 68,
        targetBumilBusui: 51,
        klasifikasiPorsi: 'Bumil & Busui' as any,
        namaKelompok: '3B (Balita, Bumil & Busui)'
      };
    }
    if (cleanName.includes('smp') && (cleanName.includes('zainul') || cleanName.includes('genggong') || cleanName.includes('zaha'))) {
      return {
        targetMaster: 370,
        kategoriLembaga: 'SMP / MTs' as KategoriLembaga,
        breakdownKelas: { kelas7: 120, kelas8: 115, kelas9: 115 },
        targetSiswa: 350,
        targetGuru: 20,
        targetBalita: 0,
        targetBumilBusui: 0,
        klasifikasiPorsi: 'Porsi Besar' as any,
        namaKelompok: 'SMP / MTs'
      };
    }
    if (cleanName.includes('sd') && (cleanName.includes('zainul') || cleanName.includes('genggong'))) {
      return {
        targetMaster: 409,
        kategoriLembaga: 'SD / MI' as KategoriLembaga,
        breakdownKelas: { kelas1: 65, kelas2: 65, kelas3: 65, kelas4: 63, kelas5: 63, kelas6: 63 },
        targetSiswa: 384,
        targetGuru: 25,
        targetBalita: 0,
        targetBumilBusui: 0,
        klasifikasiPorsi: 'Porsi Kecil' as any,
        namaKelompok: 'SD / MI'
      };
    }
    if (cleanName.includes('ma') && cleanName.includes('hafshawaty')) {
      return {
        targetMaster: 243,
        kategoriLembaga: 'SMA / SMK / MA' as KategoriLembaga,
        breakdownKelas: { kelas10: 75, kelas11: 72, kelas12: 71 },
        targetSiswa: 218,
        targetGuru: 25,
        targetBalita: 0,
        targetBumilBusui: 0,
        klasifikasiPorsi: 'Porsi Besar' as any,
        namaKelompok: 'SMA / MA'
      };
    }

    return null;
  };

  // Calculate Selisih from Pengaturan Kelompok baseline master
  const getSelisihDataPorsi = (namaInstansi: string, currentSubtotal: number, statusKbm?: string) => {
    // If status is Libur Full, 0 porsi is expected, so do not display selisih warning
    if (statusKbm === 'Libur Full') {
      return null;
    }

    const master = getMasterLembagaData(namaInstansi);
    if (!master || master.targetMaster === 0) return null;

    const selisih = currentSubtotal - master.targetMaster;
    return {
      targetMaster: master.targetMaster,
      selisihAbs: Math.abs(selisih),
      selisih,
      isSynced: selisih === 0,
      label: selisih === 0 ? 'Selaras dengan Data Kelompok' : `Selisih ${Math.abs(selisih)} Porsi`,
      masterData: master
    };
  };

  // Re-sync institution data with master group data
  const handleResetToMaster = (lembagaIdx: number) => {
    const list = [...buatPenerimaLembagaList];
    const item = list[lembagaIdx];
    const master = getMasterLembagaData(item.namaInstansi);
    if (!master) return;

    const isMaster3B = (master.kategoriLembaga || item.kategoriLembaga || '').includes('3B');
    list[lembagaIdx] = {
      ...item,
      kategoriLembaga: master.kategoriLembaga || item.kategoriLembaga,
      breakdownKelas: master.breakdownKelas ? { ...master.breakdownKelas } : {},
      targetSiswa: isMaster3B ? 0 : master.targetSiswa,
      targetGuru: master.targetGuru,
      targetBalita: master.targetBalita,
      targetBumilBusui: master.targetBumilBusui,
      klasifikasiPorsi: master.klasifikasiPorsi || item.klasifikasiPorsi
    };
    setBuatPenerimaLembagaList(list);
    showToast(`Data "${item.namaInstansi}" berhasil disinkronkan kembali ke target kelompok (${master.targetMaster} Porsi)`);
  };

  // Close and flush Buat Penerima Manfaat modal state completely
  const handleCloseBuatPenerimaModal = () => {
    setIsBuatPenerimaModalOpen(false);
    setBuatPenerimaLembagaList([]);
    setBuatPenerimaCatatan('');
    setBuatPenerimaStatusDoc('FINAL');
  };

  // Open "Buat Penerima Manfaat" Modal with Auto-Fill from Pengaturan Kelompok
  const handleOpenBuatPenerimaModal = () => {
    const targetDate = selectedDate || new Date().toISOString().split('T')[0];
    const initialList = buildSyncedLembagaList(targetDate);
    setBuatPenerimaTanggal(targetDate);
    setBuatPenerimaStatusDoc(
      dailyRecords.length > 0 && dailySummary?.statusLock === 'DRAFT' ? 'DRAFT' : 'FINAL'
    );
    setBuatPenerimaCatatan('');
    setBuatPenerimaLembagaList(initialList);
    setIsBuatPenerimaModalOpen(true);
  };

  // Open Edit Penerima Manfaat Modal for a specific date record
  const handleOpenEditPenerimaModal = (r: { tanggal: string; hariTanggal: string; status?: string }) => {
    setBuatPenerimaTanggal(r.tanggal);
    setBuatPenerimaStatusDoc(r.status === 'Draft' || r.status === 'DRAFT' ? 'DRAFT' : 'FINAL');

    const editList = buildSyncedLembagaList(r.tanggal);
    setBuatPenerimaLembagaList(editList);
    setIsBuatPenerimaModalOpen(true);
    showToast(`Membuka form edit rekap tanggal ${r.hariTanggal}`);
  };

  // Save "Buat Penerima Manfaat" Form
  const handleSaveBuatPenerima = async (e: React.FormEvent) => {
    e.preventDefault();

    if (buatPenerimaLembagaList.length === 0) {
      showToast('Minimal tambahkan 1 lembaga/instansi', 'error');
      return;
    }

    let totalPorsi = 0;

    buatPenerimaLembagaList.forEach((l) => {
      if (l.statusKbm !== 'Libur Full') {
        const klas = (l.klasifikasiPorsi || '').toLowerCase();
        const mainVal = klas.includes('balita')
          ? Number(l.targetBalita ?? l.targetSiswa) || 0
          : klas.includes('hamil') || klas.includes('menyusui') || klas.includes('bumil')
          ? Number(l.targetBumilBusui ?? l.targetSiswa) || 0
          : Number(l.targetSiswa) || 0;
        const g = Number(l.targetGuru) || 0;
        totalPorsi += mainVal + g;
      }
    });

    const [y, m, d] = buatPenerimaTanggal.split('-').map(Number);
    let formattedDate = buatPenerimaTanggal;
    if (y && m && d) {
      const dateObj = new Date(y, m - 1, d);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      formattedDate = `${days[dateObj.getDay()]}, ${d} ${months[m - 1]} ${y}`;
    }

    // Remove from deleted list if present
    setDeletedRekapDates((prev) => prev.filter((dt) => dt !== buatPenerimaTanggal));

    try {
      const res = await fetch('/api/v1/penerima-manfaat/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: buatPenerimaTanggal,
          statusDoc: buatPenerimaStatusDoc,
          catatan: buatPenerimaCatatan,
          lembagaList: buatPenerimaLembagaList,
          userName: user?.nama || 'Operator',
          userId: user?.id || 'USR-001'
        })
      });

      const result = await res.json();
      if (!result.success) {
        showToast(result.message || 'Gagal menyimpan perencanaan penerima manfaat', 'error');
        return;
      }

      handleCloseBuatPenerimaModal();
      setSelectedDate(buatPenerimaTanggal);
      showToast(
        `Perencanaan penerima manfaat tanggal ${formattedDate} berhasil disimpan (${buatPenerimaStatusDoc}: ${totalPorsi.toLocaleString('id-ID')} Porsi)!`
      );
      fetchDailyByDate(buatPenerimaTanggal);
      fetchHistory();
    } catch (err) {
      showToast('Gagal menyimpan data penerima manfaat ke server', 'error');
    }
  };

  // Rekap Bulanan states
  const [rekapBulan, setRekapBulan] = useState<string>(String(new Date().getMonth() + 1));
  const [rekapTahun, setRekapTahun] = useState<string>(String(new Date().getFullYear()));
  const [monthlyData, setMonthlyData] = useState<any>(null);

  // Feedback Notification Message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Master Data (Groups & Locations)
  const fetchMasterData = async () => {
    try {
      const [resG, resL] = await Promise.all([
        fetch('/api/v1/penerima-manfaat/groups'),
        fetch('/api/v1/penerima-manfaat/locations')
      ]);
      const dataG = await resG.json();
      const dataL = await resL.json();

      if (dataG.success && Array.isArray(dataG.data)) {
        setGroups([...dataG.data].sort((a, b) => (a.urutan || 0) - (b.urutan || 0)));
      }
      if (dataL.success && Array.isArray(dataL.data)) setLocations(dataL.data);
    } catch (err) {
      console.error('Failed to fetch beneficiary master data:', err);
    }
  };

  // Fetch Daily Records by Date
  const fetchDailyByDate = async (tanggalStr: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/penerima-manfaat/by-date?tanggal=${tanggalStr}`);
      const result = await res.json();
      if (result.success) {
        setDailyRecords(result.records);
        setDailySummary(result.summary);
      }
    } catch (err) {
      console.error('Failed to fetch daily beneficiaries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch History for Rekap Harian
  const fetchHistory = async () => {
    try {
      const query = new URLSearchParams({
        startDate: historyStartDate,
        endDate: historyEndDate,
        groupId: historyGroupFilter
      });
      const res = await fetch(`/api/v1/penerima-manfaat/history?${query.toString()}`);
      const result = await res.json();
      if (result.success) {
        setHistoryRecords(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  // Fetch Monthly Data
  const fetchMonthly = async () => {
    try {
      const res = await fetch(`/api/v1/penerima-manfaat/rekap-bulanan?bulan=${rekapBulan}&tahun=${rekapTahun}`);
      const result = await res.json();
      if (result.success) {
        setMonthlyData(result);
      }
    } catch (err) {
      console.error('Failed to fetch monthly breakdown:', err);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/v1/penerima-manfaat/audit-logs');
      const result = await res.json();
      if (result.success) {
        setAuditLogs(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Realtime Firestore synchronization for cross-device multi-client updates
  const { data: realtimeDailyRecords } = useFirestoreRealtime<DailyBeneficiaryRecord>('dailyBeneficiaryRecords');
  const { data: realtimeGroups, loading: realtimeGroupsLoading } = useFirestoreRealtime<BeneficiaryGroup>('beneficiaryGroups');
  const { data: realtimeLocations, loading: realtimeLocationsLoading } = useFirestoreRealtime<BeneficiaryLocation>('beneficiaryLocations');

  useEffect(() => {
    if (realtimeDailyRecords) {
      if (activeTab === 'hari-ini') {
        fetchDailyByDate(selectedDate);
      } else if (activeTab === 'rekap-harian') {
        fetchHistory();
      }
    }
  }, [realtimeDailyRecords]);

  useEffect(() => {
    if (!realtimeGroupsLoading && Array.isArray(realtimeGroups)) {
      setGroups((prev) => {
        if (realtimeGroups.length === 0) {
          return prev.filter(g => !deletedGroupIds.current.has(g.id));
        }

        const map = new Map<string, BeneficiaryGroup>();
        prev.forEach((g) => {
          if (!deletedGroupIds.current.has(g.id)) {
            map.set(g.id, g);
          }
        });
        realtimeGroups.forEach((g) => {
          if (!deletedGroupIds.current.has(g.id)) {
            map.set(g.id, g);
          }
        });
        return Array.from(map.values()).sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
      });
    }
  }, [realtimeGroups, realtimeGroupsLoading]);

  useEffect(() => {
    if (!realtimeLocationsLoading && Array.isArray(realtimeLocations) && realtimeLocations.length > 0) {
      setLocations((prev) => {
        const map = new Map<string, BeneficiaryLocation>();
        prev.forEach(l => map.set(l.id, l));
        realtimeLocations.forEach(l => map.set(l.id, l));
        return Array.from(map.values());
      });
    }
  }, [realtimeLocations, realtimeLocationsLoading]);

  useEffect(() => {
    if (activeTab === 'hari-ini') {
      fetchDailyByDate(selectedDate);
    } else if (activeTab === 'rekap-harian') {
      fetchHistory();
    } else if (activeTab === 'rekap-bulanan') {
      fetchMonthly();
    }
  }, [activeTab, selectedDate, historyStartDate, historyEndDate, historyGroupFilter, rekapBulan, rekapTahun]);

  // Handle Save / Update Daily Record
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !editingRecord.namaInstansi) return;

    try {
      const payload = {
        ...editingRecord,
        tanggal: selectedDate,
        userId: user?.id || 'USR-001',
        userName: user?.nama || 'Operator',
        userRole: user?.roleNama || 'Operator'
      };

      const res = await fetch('/api/v1/penerima-manfaat/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        showToast('Data penerima manfaat berhasil disimpan');
        setIsRecordModalOpen(false);
        setEditingRecord(null);
        fetchDailyByDate(selectedDate);
      } else {
        showToast(result.message || 'Gagal menyimpan data', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi server', 'error');
    }
  };

  // Handle Delete Daily Record
  const handleDeleteRecord = (id: string, nama: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Data Penerima',
      message: `Apakah Anda yakin ingin menghapus data penerima untuk "${nama}"?`,
      confirmText: 'Ya, Hapus Data',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/penerima-manfaat/record/${id}`, { method: 'DELETE' });
          const result = await res.json();
          if (result.success) {
            showToast('Data penerima berhasil dihapus', 'success');
            fetchDailyByDate(selectedDate);
          } else {
            showToast(result.message || 'Gagal menghapus data', 'error');
          }
        } catch (err) {
          showToast('Terjadi kesalahan saat menghapus data', 'error');
        }
      }
    });
  };

  // Copy Previous Day Data
  const handleCopyPreviousDay = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Salin Data Hari Sebelumnya',
      message: `Salin data penerima dari hari sebelumnya ke tanggal ${selectedDate}?`,
      confirmText: 'Ya, Salin Data',
      danger: false,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/v1/penerima-manfaat/copy-previous', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetDate: selectedDate })
          });
          const result = await res.json();
          if (result.success) {
            showToast(result.message, 'success');
            fetchDailyByDate(selectedDate);
          } else {
            showToast(result.message || 'Gagal menyalin data', 'error');
          }
        } catch (err) {
          showToast('Gagal menyalin data dari hari sebelumnya', 'error');
        }
      }
    });
  };

  // Finalize / Lock Data
  const handleToggleLockData = () => {
    const isLocked = dailySummary?.statusLock === 'FINAL';
    const actionText = isLocked ? 'MEMBUKA KUNCI' : 'FINALISASI & MENGUNCI';

    setConfirmModal({
      isOpen: true,
      title: isLocked ? 'Buka Kunci Data' : 'Finalisasi & Kunci Data',
      message: `Apakah Anda yakin ingin ${actionText} data penerima tanggal ${selectedDate}?`,
      confirmText: isLocked ? 'Ya, Buka Kunci' : 'Ya, Finalisasi & Kunci',
      danger: !isLocked,
      onConfirm: async () => {
        try {
          const endpoint = isLocked ? '/api/v1/penerima-manfaat/unlock' : '/api/v1/penerima-manfaat/finalize';
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tanggal: selectedDate, user: user?.nama || 'Supervisor' })
          });
          const result = await res.json();
          if (result.success) {
            showToast(result.message, 'success');
            fetchDailyByDate(selectedDate);
          } else {
            showToast(result.message || 'Gagal mengubah status finalisasi', 'error');
          }
        } catch (err) {
          showToast('Terjadi kesalahan koneksi server', 'error');
        }
      }
    });
  };

  // Master Location Save
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation || !editingLocation.namaInstansi) return;

    try {
      const isEdit = Boolean(editingLocation.id);
      const url = isEdit ? `/api/v1/penerima-manfaat/locations/${editingLocation.id}` : '/api/v1/penerima-manfaat/locations';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingLocation)
      });
      const result = await res.json();
      if (result.success) {
        showToast(isEdit ? 'Lokasi berhasil diperbarui' : 'Lokasi baru berhasil ditambahkan');
        setIsLocationModalOpen(false);
        setEditingLocation(null);
        fetchMasterData();
      }
    } catch (err) {
      showToast('Gagal menyimpan data lokasi', 'error');
    }
  };

  // Master Group Save
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    try {
      const groupNama = (editingGroup.nama || '').trim() || `Kelompok Sasaran #${groups.length + 1}`;
      const groupCat: KategoriLembaga = editingGroup.kategoriLembaga || inferKategoriFromText(groupNama, 'SD / MI');
      const conf = getKategoriConfig(groupCat);

      const isEdit = Boolean(editingGroup.id);
      const groupId = editingGroup.id || `GRP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      const rawLembagaList = (editingGroup.lembagaList && editingGroup.lembagaList.length > 0)
        ? editingGroup.lembagaList
        : [
            {
              namaInstansi: `${groupNama} - Instansi 1`,
              kategoriLembaga: groupCat,
              targetSiswa: 0,
              targetGuru: 0,
              targetBalita: 0,
              targetBumilBusui: 0,
              total: 0,
              klasifikasiPorsi: conf.defaultKlasifikasi
            }
          ];

      const sanitizedLembagaList = rawLembagaList.map((l: any, idx: number) => {
        const itemCat: KategoriLembaga = l.kategoriLembaga || groupCat;
        const itemConf = getKategoriConfig(itemCat);
        const itemKlas = l.klasifikasiPorsi || editingGroup.klasifikasiPorsi || itemConf.defaultKlasifikasi || 'Porsi Besar';
        const instName = (l.namaInstansi || '').trim() || `${groupNama} - Instansi ${idx + 1}`;
        const locId = l.id || `LOC-${groupId}-${idx + 1}`;
        const norm = instName.toLowerCase();
        const bd = l.breakdownKelas || {};

        const sumClasses = itemConf.classes.reduce((sum, c) => sum + (Number(bd[c.key]) || 0), 0);
        let s = sumClasses > 0 ? sumClasses : (Number(l.targetSiswa) || 0);
        let g = Number(l.targetGuru) || 0;
        let b = Number(l.targetBalita) || 0;
        let bb = Number(l.targetBumilBusui) || 0;

        const is3B = itemCat.includes('3B') || itemConf.id.includes('3B') || itemConf.targetCategory === '3B';
        let tKader = 0;
        if (is3B) {
          const tBalita511 = (Number(bd['balita511_l']) || 0) + (Number(bd['balita511_p']) || 0) || Number(bd['baduta']) || 0;
          const tBalita1259 = (Number(bd['balita1259_l']) || 0) + (Number(bd['balita1259_p']) || 0) || Number(bd['balita']) || 0;
          const tBusui = Number(bd['busui_w']) || Number(bd['busui']) || 0;
          const tBumil = Number(bd['bumil_w']) || Number(bd['bumil']) || 0;
          tKader = (Number(bd['kader_l']) || 0) + (Number(bd['kader_p']) || 0) || Number(bd['kader']) || Number(l.targetKader) || 0;

          b = (tBalita511 + tBalita1259) || b;
          bb = (tBusui + tBumil) || bb;
          g = 0; // Strictly 0 guru/staf for 3B!
          s = 0;
        } else if (itemConf.targetCategory === 'Balita' || itemKlas === 'Porsi Balita' || itemKlas === 'Balita' || norm.includes('balita')) {
          b = sumClasses > 0 ? sumClasses : (b || s || 0);
          s = 0;
          bb = 0;
        } else if (itemConf.targetCategory === 'Ibu Hamil' || itemKlas === 'Porsi Ibu Hamil' || itemKlas === 'Porsi Ibu Menyusui' || itemKlas === 'Bumil & Busui' || norm.includes('hamil') || norm.includes('menyusui')) {
          bb = sumClasses > 0 ? sumClasses : (bb || s || 0);
          s = 0;
          b = 0;
        } else {
          s = sumClasses > 0 ? sumClasses : s;
          b = 0;
          bb = 0;
        }

        const total = is3B ? (b + bb + tKader) : (s + g + b + bb);
        const autoP = calculateAutoPortion({
          kategoriLembaga: itemCat,
          namaInstansi: instName,
          breakdownKelas: bd,
          targetSiswa: s,
          targetGuru: is3B ? 0 : g,
          targetBalita: b,
          targetBumilBusui: bb,
          total
        });

        return {
          ...l,
          id: locId,
          namaInstansi: instName,
          kategoriLembaga: itemCat,
          breakdownKelas: bd,
          targetSiswa: is3B ? 0 : s,
          targetGuru: is3B ? 0 : g,
          targetKader: is3B ? tKader : 0,
          targetBalita: b,
          targetBumilBusui: bb,
          total,
          klasifikasiPorsi: autoP.klasifikasi
        };
      });

      const groupAutoP = calculateAutoPortion({
        kategoriLembaga: groupCat,
        namaInstansi: groupNama,
        targetSiswa: sanitizedLembagaList.reduce((acc: number, item: any) => acc + (item.targetSiswa || 0), 0),
        targetGuru: sanitizedLembagaList.reduce((acc: number, item: any) => acc + (item.targetGuru || 0), 0),
        targetBalita: sanitizedLembagaList.reduce((acc: number, item: any) => acc + (item.targetBalita || 0), 0),
        targetBumilBusui: sanitizedLembagaList.reduce((acc: number, item: any) => acc + (item.targetBumilBusui || 0), 0)
      });

      const nextUrutan = isEdit ? (editingGroup.urutan || 1) : (groups.length + 1);

      const payload: BeneficiaryGroup = {
        ...editingGroup,
        id: groupId,
        nama: groupNama,
        kategoriLembaga: groupCat,
        kategoriUtama: conf.targetCategory,
        klasifikasiPorsi: groupAutoP.klasifikasi,
        urutan: nextUrutan,
        status: editingGroup.status || 'Aktif',
        alamat: editingGroup.alamat || editingGroup.deskripsi || '',
        deskripsi: editingGroup.deskripsi || editingGroup.alamat || '',
        picNama: editingGroup.picNama || '',
        nomorKontak: editingGroup.nomorKontak || editingGroup.picKontak || '',
        picKontak: editingGroup.picKontak || editingGroup.nomorKontak || '',
        lembagaList: sanitizedLembagaList
      };

      // 1. Optimistic Local State Update: Card appears immediately on screen
      deletedGroupIds.current.delete(groupId);
      setGroups((prev) => {
        const remaining = prev.filter((g) => g.id !== groupId);
        return [...remaining, payload].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
      });

      const newLocs: BeneficiaryLocation[] = sanitizedLembagaList.map((item: any, lIdx: number) => {
        const isLoc3B = (item.kategoriLembaga || groupCat).includes('3B');
        const kCount = isLoc3B ? ((Number(item.breakdownKelas?.kader_l) || 0) + (Number(item.breakdownKelas?.kader_p) || 0) || Number(item.breakdownKelas?.kader) || Number(item.targetKader) || 0) : 0;
        return {
          id: item.id || `LOC-${groupId}-${lIdx + 1}`,
          groupId: groupId,
          groupNama: groupNama,
          namaInstansi: item.namaInstansi,
          kategoriLembaga: item.kategoriLembaga || groupCat,
          klasifikasiPorsi: item.klasifikasiPorsi,
          breakdownKelas: item.breakdownKelas || {},
          defaultJumlah: item.total || 0,
          status: 'Aktif',
          kategoriBreakdown: {
            siswa: isLoc3B ? 0 : (item.targetSiswa || 0),
            guru: isLoc3B ? 0 : (item.targetGuru || 0),
            kader: kCount,
            balita: item.targetBalita || 0,
            ibuHamil: item.targetBumilBusui ? Math.ceil(item.targetBumilBusui / 2) : 0,
            ibuMenyusui: item.targetBumilBusui ? Math.floor(item.targetBumilBusui / 2) : 0,
            breakdownKelas: item.breakdownKelas || {}
          }
        };
      });

      setLocations((prev) => {
        const withoutThisGroup = prev.filter(l => l.groupId !== groupId && l.groupNama !== groupNama);
        return [...withoutThisGroup, ...newLocs];
      });

      setIsGroupModalOpen(false);
      setEditingGroup(null);
      showToast(isEdit ? 'Kelompok berhasil diperbarui' : 'Kelompok baru berhasil ditambahkan');

      // 2. Direct client-side Firestore dual-write (0ms local latency compensation + cloud persistence)
      try {
        const fDb = getDb();
        if (fDb) {
          await setDoc(doc(fDb, 'beneficiaryGroups', groupId), JSON.parse(JSON.stringify(payload)), { merge: true });
          for (const locItem of newLocs) {
            await setDoc(doc(fDb, 'beneficiaryLocations', locItem.id), JSON.parse(JSON.stringify(locItem)), { merge: true });
          }
        }
      } catch (fErr) {
        console.warn('Direct Firestore client write note:', fErr);
      }

      // 3. Backend REST API call for server-side dbStore & audit logs
      const url = isEdit ? `/api/v1/penerima-manfaat/groups/${groupId}` : '/api/v1/penerima-manfaat/groups';
      const method = isEdit ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success && result.data) {
          const serverGroup = result.data;
          setGroups((prev) => {
            const remaining = prev.filter((g) => g.id !== serverGroup.id);
            return [...remaining, serverGroup].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
          });
        }
      } catch (netErr) {
        console.warn('Server REST API sync note:', netErr);
      }
    } catch (err) {
      showToast('Gagal menyimpan kelompok', 'error');
    }
  };

  // Master Group Delete
  const handleDeleteGroup = (id: string, nama: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Kelompok Penerima',
      message: `Konfirmasi Hapus: Yakin ingin menghapus kelompok "${nama}" beserta seluruh instansinya?`,
      confirmText: 'Ya, Hapus Kelompok',
      danger: true,
      onConfirm: async () => {
        try {
          deletedGroupIds.current.add(id);

          // 1. Optimistic local state update
          setGroups((prev) => {
            const remaining = prev.filter((g) => g.id !== id);
            return remaining.map((g, idx) => ({ ...g, urutan: idx + 1 }));
          });
          setLocations((prev) => prev.filter(l => l.groupId !== id && l.groupNama !== nama));
          setIsGroupModalOpen(false);
          setEditingGroup(null);
          showToast(`Kelompok "${nama}" berhasil dihapus`, 'success');

          // 2. Direct client-side Firestore delete
          try {
            const fDb = getDb();
            if (fDb) {
              await deleteDoc(doc(fDb, 'beneficiaryGroups', id));
              const locsToDelete = locations.filter(l => l.groupId === id || l.groupNama === nama);
              for (const l of locsToDelete) {
                await deleteDoc(doc(fDb, 'beneficiaryLocations', l.id));
              }
            }
          } catch (fErr) {
            console.warn('Firestore client delete error:', fErr);
          }

          // 3. Server REST API delete
          await fetch(`/api/v1/penerima-manfaat/groups/${id}`, { method: 'DELETE' });
          fetchDailyByDate(selectedDate);
        } catch (err) {
          showToast('Terjadi kesalahan saat menghapus data', 'error');
        }
      }
    });
  };

  // Master Clear All Groups
  const handleClearAllGroups = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Kosongkan Seluruh Kelompok',
      message: 'Apakah Anda yakin ingin MENGHAPUS SEMUA kelompok penerima manfaat? Anda dapat menambahkan kelompok baru secara manual kapan saja.',
      confirmText: 'Ya, Hapus Semua',
      danger: true,
      onConfirm: async () => {
        try {
          const currentGroups = [...groups];
          const currentLocations = [...locations];

          currentGroups.forEach(g => deletedGroupIds.current.add(g.id));
          setGroups([]);
          setLocations([]);
          setIsGroupModalOpen(false);
          setEditingGroup(null);
          showToast('Semua kelompok penerima manfaat berhasil dihapus', 'success');

          // Direct client-side Firestore delete
          try {
            const fDb = getDb();
            if (fDb) {
              for (const g of currentGroups) {
                await deleteDoc(doc(fDb, 'beneficiaryGroups', g.id));
              }
              for (const l of currentLocations) {
                await deleteDoc(doc(fDb, 'beneficiaryLocations', l.id));
              }
            }
          } catch (fErr) {
            console.warn('Firestore client clear error:', fErr);
          }

          // Server REST API delete all
          await fetch('/api/v1/penerima-manfaat/groups', { method: 'DELETE' });
          fetchDailyByDate(selectedDate);
        } catch (err) {
          showToast('Gagal menghapus kelompok', 'error');
        }
      }
    });
  };

  // Master Location Delete
  const handleDeleteLocation = (id: string, nama: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Instansi / Lokasi',
      message: `Konfirmasi Hapus: Yakin ingin menghapus instansi "${nama}"?`,
      confirmText: 'Ya, Hapus Instansi',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/penerima-manfaat/locations/${id}`, {
            method: 'DELETE'
          });
          const result = await res.json();
          if (result.success) {
            showToast(result.message || 'Instansi berhasil dihapus', 'success');
            setIsLocationModalOpen(false);
            setEditingLocation(null);
            fetchMasterData();
            fetchDailyByDate(selectedDate);
          } else {
            showToast(result.message || 'Gagal menghapus instansi', 'error');
          }
        } catch (err) {
          showToast('Gagal menghapus instansi', 'error');
        }
      }
    });
  };

  // Delete Rekap Harian Date
  const handleDeleteRekapDate = (tanggal: string, hariTanggal: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Rekap Harian Tanggal',
      message: `Konfirmasi Hapus: Apakah Anda yakin ingin menghapus seluruh data rekap harian untuk tanggal "${hariTanggal}"?`,
      confirmText: 'Ya, Hapus Rekap',
      danger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/penerima-manfaat/records/date/${tanggal}`, {
            method: 'DELETE'
          });
          const result = await res.json();
          if (result.success) {
            showToast(result.message || `Data rekap harian ${hariTanggal} berhasil dihapus`, 'success');
            setDeletedRekapDates(prev => [...prev, tanggal]);
            fetchHistory();
            fetchDailyByDate(selectedDate);
          } else {
            showToast(result.message || 'Gagal menghapus rekap harian', 'error');
          }
        } catch (err) {
          showToast('Gagal menghapus rekap harian', 'error');
        }
      }
    });
  };

  // Export to CSV Function
  const handleExportCSV = (dataList: any[], filename: string) => {
    if (!dataList || dataList.length === 0) {
      showToast('Tidak ada data untuk diekspor', 'error');
      return;
    }

    const headers = Object.keys(dataList[0]).join(',');
    const rows = dataList.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Data berhasil diekspor: ${filename}.csv`);
  };

  // Filtered Daily Records
  const filteredDailyRecords = dailyRecords.filter(r => 
    r.namaInstansi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.groupNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.kategori.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 md:p-6 lg:p-8 space-y-6 text-slate-800 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-300 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-600 text-white shadow-emerald-900/10' 
            : 'bg-rose-600 text-white shadow-rose-900/10'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER SECTION (Apple-inspired Minimalist) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Penerima Manfaat SPPG</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Manajemen, pencatatan, monitoring, dan pelaporan harian porsi penerima manfaat nutrisi SPPG
          </p>
        </div>

        {/* Date Selector & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100/80 px-3.5 py-2 rounded-2xl border border-slate-200/60">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => fetchDailyByDate(selectedDate)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-600 rounded-2xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SUBMENU NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200/80">
        {[
          { id: 'hari-ini', label: 'Penerima Hari Ini', icon: Users, path: '/penerima-manfaat' },
          { id: 'bast', label: 'BAST (Berita Acara)', icon: FileCheck, path: '/penerima-manfaat/bast' },
          { id: 'rekap-harian', label: 'Rekap Harian', icon: FileText, path: '/penerima-manfaat/rekap-harian' },
          { id: 'rekap-bulanan', label: 'Rekap Bulanan', icon: BarChart3, path: '/penerima-manfaat/rekap-bulanan' },
          { id: 'kelompok', label: 'Pengaturan Kelompok', icon: Settings, path: '/penerima-manfaat/kelompok' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (onNavigate && tab.path) onNavigate(tab.path);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PENERIMA HARI INI */}
      {activeTab === 'hari-ini' && (
        <div className="space-y-6">
          
          {/* SUMMARY CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Penerima */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-emerald-200 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Penerima Hari Ini</span>
                <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Users className="w-5 h-5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {dailySummary?.totalPenerima ? dailySummary.totalPenerima.toLocaleString('id-ID') : '0'}
                </span>
                <span className="text-xs font-medium text-slate-500">Jiwa</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Target kuota gizi harian yang tercatat</p>
            </div>

            {/* Card 2: Jumlah Porsi */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-blue-200 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Jumlah Porsi</span>
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Sparkles className="w-5 h-5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {dailySummary?.totalPorsi ? dailySummary.totalPorsi.toLocaleString('id-ID') : '0'}
                </span>
                <span className="text-xs font-medium text-slate-500">Porsi Ompreng</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">100% rasio kecukupan pemorsian</p>
            </div>

            {/* Card 3: Jumlah Kelompok */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-purple-200 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Jumlah Kelompok</span>
                <span className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
                  <School className="w-5 h-5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {dailySummary?.totalKelompok || 0}
                </span>
                <span className="text-xs font-medium text-slate-500">Kelompok Target</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">PAUD, SD, SMP, SMA, Balita, Bumil, Busui</p>
            </div>

            {/* Card 4: Satuan Pendidikan & Instansi */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-amber-200 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Satuan Pendidikan / Instansi</span>
                <span className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                  <Building2 className="w-5 h-5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {dailySummary?.totalInstansi || 0}
                </span>
                <span className="text-xs font-medium text-slate-500">Titik Lokasi</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Titik penyaluran distribusi porsi</p>
            </div>

          </div>

          {/* QUICK CATEGORY BREAKDOWN BADGES */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 flex flex-wrap items-center gap-3 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Breakdown Kategori:</span>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-2xl text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              Siswa: {dailySummary?.totalSiswa || 0}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-semibold">
              <UserCheck className="w-3.5 h-3.5" />
              Guru / Staf: {dailySummary?.totalGuru || 0}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-2xl text-xs font-semibold">
              <Baby className="w-3.5 h-3.5" />
              Balita: {dailySummary?.totalBalita || 0}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-2xl text-xs font-semibold">
              <HeartPulse className="w-3.5 h-3.5" />
              Ibu Hamil: {dailySummary?.totalIbuHamil || 0}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 text-pink-700 rounded-2xl text-xs font-semibold">
              <HeartPulse className="w-3.5 h-3.5" />
              Ibu Menyusui: {dailySummary?.totalIbuMenyusui || 0}
            </div>

            {/* Lock Status Pill */}
            <div className="ml-auto flex items-center gap-2">
              {dailyRecords.length === 0 ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  BELUM ADA PERENCANAAN
                </span>
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  dailySummary?.statusLock === 'FINAL' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {dailySummary?.statusLock === 'FINAL' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {dailySummary?.statusLock === 'FINAL' ? 'FINAL (TAMPIL DI DASHBOARD)' : 'DRAFT (BELUM TAMPIL DI DASHBOARD)'}
                </span>
              )}
            </div>
          </div>

          {/* DRAFT STATUS ALERT BANNER */}
          {dailyRecords.length > 0 && dailySummary?.statusLock !== 'FINAL' && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Status Perencanaan Masih DRAFT
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Data perencanaan penerima manfaat pada tanggal ini masih berstatus <strong>DRAFT</strong> dan <strong>tidak akan ditampilkan di Dashboard</strong> sebelum difinalisasi menjadi <strong>FINAL</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleLockData}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Finalisasi Sekarang</span>
              </button>
            </div>
          )}

          {/* TOOLBAR & ACTIONS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
            
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari instansi, kelompok, atau kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleOpenBuatPenerimaModal}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {dailyRecords.length > 0 ? 'Edit Perencanaan Penerima' : 'Buat Penerima Manfaat'}
              </button>

              <button
                onClick={() => {
                  setEditingRecord({
                    jumlahAwal: 0,
                    penambahan: 0,
                    pengurangan: 0,
                    kategori: 'Siswa'
                  });
                  setIsRecordModalOpen(true);
                }}
                disabled={dailyRecords.length > 0 && dailySummary?.statusLock === 'FINAL'}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium text-sm rounded-2xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Record
              </button>

              <button
                onClick={handleCopyPreviousDay}
                disabled={dailyRecords.length > 0 && dailySummary?.statusLock === 'FINAL'}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-medium text-sm rounded-2xl border border-slate-200/80 transition-all cursor-pointer"
                title="Salin data jumlah awal dari tanggal kemarin"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                Salin Hari Sebelumnya
              </button>

              <button
                onClick={handleToggleLockData}
                disabled={dailyRecords.length === 0}
                className={`flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-2xl border transition-all disabled:opacity-40 cursor-pointer ${
                  dailySummary?.statusLock === 'FINAL'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                {dailySummary?.statusLock === 'FINAL' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {dailySummary?.statusLock === 'FINAL' ? 'Buka Kunci Data' : 'Finalisasi / Kunci Data'}
              </button>

              <button
                onClick={() => handleExportCSV(dailyRecords, `Penerima_Manfaat_${selectedDate}`)}
                disabled={dailyRecords.length === 0}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-medium text-sm rounded-2xl border border-slate-200/80 transition-all cursor-pointer"
                title="Ekspor CSV / Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Ekspor CSV
              </button>
            </div>

          </div>

          {/* TABLE OF DAILY BENEFICIARIES */}
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">No</th>
                    <th className="py-3.5 px-4">Kelompok</th>
                    <th className="py-3.5 px-4">Nama Instansi / Lokasi</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4 text-right">Awal</th>
                    <th className="py-3.5 px-4 text-right text-emerald-600">Tambah (+)</th>
                    <th className="py-3.5 px-4 text-right text-rose-600">Kurang (-)</th>
                    <th className="py-3.5 px-4 text-right font-black text-slate-900">Total</th>
                    <th className="py-3.5 px-4">Keterangan</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredDailyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-14 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2.5 max-w-md mx-auto">
                          <div className="p-3 bg-slate-100 rounded-2xl text-slate-400">
                            <Users className="w-7 h-7" />
                          </div>
                          <p className="font-bold text-slate-700 text-sm">
                            Belum ada perencanaan / pembuatan penerima manfaat pada tanggal ini
                          </p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Data Penerima Hari Ini akan kosong apabila belum ada pembuatan perencanaan penerima manfaat untuk tanggal <strong>{selectedDate}</strong>.
                          </p>
                          <button
                            onClick={handleOpenBuatPenerimaModal}
                            className="mt-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Buat Penerima Manfaat Tanggal Ini</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDailyRecords.map((item, index) => {
                      const cleanInst = (item.namaInstansi || '').toLowerCase();
                      const is3BItem = cleanInst.includes('posyandu') || cleanInst.includes('temenggungan') || cleanInst.includes('3b') || (item.kategoriLembaga && item.kategoriLembaga.includes('3B')) || item.groupNama?.includes('3B');

                      const rs = item.rincianSasaran;
                      const bd = item.breakdownKelas || rs?.breakdownKelas || {};
                      let bumilVal = Number(rs?.ibuHamil) || Number(bd.bumil_w ?? bd.bumil) || 0;
                      let busuiVal = Number(rs?.ibuMenyusui) || Number(bd.busui_w ?? bd.busui) || 0;
                      let balitaVal = Number(rs?.balita) || (Number(bd.balita511_l) || 0) + (Number(bd.balita511_p) || 0) + (Number(bd.balita1259_l) || 0) + (Number(bd.balita1259_p) || 0) || (Number(bd.baduta) || 0) + (Number(bd.balita) || 0);
                      let guruVal = Number(rs?.guru) || (Number(bd.kader_l) || 0) + (Number(bd.kader_p) || 0) || Number(bd.kader) || 0;

                      // Default baseline for Posyandu Desa Temenggungan if zero
                      if (is3BItem && (cleanInst.includes('temenggungan') || cleanInst.includes('posyandu'))) {
                        if (bumilVal === 0) bumilVal = 30;
                        if (busuiVal === 0) busuiVal = 21;
                        if (balitaVal === 0) balitaVal = 68;
                      }

                      const totalBumilBusuiVal = bumilVal + busuiVal;

                      return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-400">{index + 1}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                            {item.groupNama}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{item.namaInstansi}</div>
                          {is3BItem && (
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap font-normal">
                              {balitaVal > 0 && (
                                <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold">
                                  👶 {balitaVal} Balita
                                </span>
                              )}
                              {bumilVal > 0 && (
                                <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
                                  🤰 {bumilVal} Bumil
                                </span>
                              )}
                              {busuiVal > 0 && (
                                <span className="px-2 py-0.5 rounded-lg bg-pink-50 text-pink-800 border border-pink-200 text-[11px] font-bold">
                                  🤱 {busuiVal} Busui
                                </span>
                              )}
                              {totalBumilBusuiVal > 0 && (
                                <span className="px-2.5 py-0.5 rounded-lg bg-purple-100/90 text-purple-950 border border-purple-300 text-[11px] font-black">
                                  🤰🤱 Total Bumil & Busui: {totalBumilBusuiVal}
                                </span>
                              )}
                              {guruVal > 0 && (
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                                  👩‍🏫 {guruVal} Kader
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {is3BItem ? (
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold inline-block">
                              3B (Balita, Bumil, Busui)
                            </span>
                          ) : (
                            item.kategori
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                          {item.jumlahAwal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                          {item.penambahan > 0 ? `+${item.penambahan}` : '0'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-rose-600">
                          {item.pengurangan > 0 ? `-${item.pengurangan}` : '0'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 bg-emerald-50/30">
                          {item.totalPenerima.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs max-w-xs truncate">
                          {item.keterangan || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            item.status === 'FINAL' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingRecord(item);
                                setIsRecordModalOpen(true);
                              }}
                              disabled={dailySummary?.statusLock === 'FINAL'}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-all"
                              title="Edit Record"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(item.id, item.namaInstansi)}
                              disabled={dailySummary?.statusLock === 'FINAL'}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 rounded-lg transition-all"
                              title="Hapus Record"
                            >
                              <Trash2 className="w-4 h-4" />
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

        </div>
      )}

      {/* TAB BAST: BERITA ACARA SERAH TERIMA */}
      {activeTab === 'bast' && (
        <BastSubView
          initialDate={selectedDate}
          onShowToast={showToast}
          openConfirmModal={setConfirmModal}
        />
      )}

      {/* TAB 2: REKAP HARIAN & AUDIT LOG */}
      {activeTab === 'rekap-harian' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Rekapitulasi Harian Sasaran Penerima</h3>
                  <p className="text-xs text-slate-500 font-medium">Laporan ringkas dan arsip histori distribusi porsi harian SPPG</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleOpenBuatPenerimaModal}
                  className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Buat Penerima Manfaat
                </button>
                <button
                  onClick={() => {
                    fetchAuditLogs();
                    setShowAuditModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-2xl border border-slate-200/80 transition-all cursor-pointer shadow-2xs"
                >
                  <History className="w-4 h-4 text-slate-500" />
                  Log Perubahan
                </button>
                <button
                  onClick={() => handleExportCSV(historyRecords, `Rekap_Harian_${historyStartDate}_sd_${historyEndDate}`)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 border border-slate-200/80 transition-all cursor-pointer shadow-2xs"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  Ekspor Laporan
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Mulai Tanggal</label>
                <input
                  type="date"
                  value={historyStartDate}
                  onChange={(e) => setHistoryStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Sampai Tanggal</label>
                <input
                  type="date"
                  value={historyEndDate}
                  onChange={(e) => setHistoryEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Filter Kelompok</label>
                <select
                  value={historyGroupFilter}
                  onChange={(e) => setHistoryGroupFilter(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value="all">Semua Kelompok</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.nama}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Rekap Harian Elegan & Menarik */}
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 text-slate-100 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-5 text-left font-bold border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        Hari & Tanggal
                      </div>
                    </th>
                    <th className="py-4 px-5 text-left font-bold border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-400" />
                        Kelompok Sasaran
                      </div>
                    </th>
                    <th className="py-4 px-5 text-center font-bold border-b border-slate-800">
                      <div className="flex items-center justify-center gap-2">
                        <BarChart3 className="w-4 h-4 text-sky-400" />
                        Total Sasaran
                      </div>
                    </th>
                    <th className="py-4 px-5 text-center font-bold border-b border-slate-800">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Status
                      </div>
                    </th>
                    <th className="py-4 px-5 text-center font-bold border-b border-slate-800">
                      <div className="flex items-center justify-center gap-2">
                        <Settings className="w-4 h-4 text-indigo-400" />
                        Aksi
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(() => {
                    // Calculate grouped rekap harian
                    const map = new Map<string, {
                      tanggal: string;
                      hariTanggal: string;
                      totalSasaran: number;
                      status: string;
                    }>();

                    if (historyRecords && historyRecords.length > 0) {
                      historyRecords.forEach(rec => {
                        const t = rec.tanggal;
                        if (!map.has(t)) {
                          const [y, m, d] = t.split('-').map(Number);
                          let formattedDate = t;
                          if (y && m && d) {
                            const dateObj = new Date(y, m - 1, d);
                            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                            const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                            formattedDate = `${days[dateObj.getDay()]}, ${d} ${months[m - 1]} ${y}`;
                          }
                          map.set(t, {
                            tanggal: t,
                            hariTanggal: formattedDate,
                            totalSasaran: 0,
                            status: rec.status === 'FINAL' || rec.status === 'Final' ? 'Final' : 'Draft'
                          });
                        }
                        const existing = map.get(t)!;
                        existing.totalSasaran += Number(rec.totalPenerima) || Number(rec.jumlahAwal) || 0;
                        if (rec.status === 'FINAL' || rec.status === 'Final') {
                          existing.status = 'Final';
                        }
                      });
                    }

                    const rows = Array.from(map.values()).map(item => {
                      const recsForDate = historyRecords.filter(rec => rec.tanggal === item.tanggal);
                      const uniqueGroups = Array.from(new Set(recsForDate.map(rec => rec.klasifikasiPorsi || rec.groupNama || rec.kategori))).filter(Boolean);
                      return {
                        tanggal: item.tanggal,
                        hariTanggal: item.hariTanggal,
                        kelompokSasaran: uniqueGroups.length > 0 ? uniqueGroups.join(', ') : 'Porsi Besar, Porsi Kecil, Bumil/Busui, Balita',
                        totalSasaran: item.totalSasaran,
                        status: item.status
                      };
                    });

                    rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

                    const displayRows = rows.filter(r => !deletedRekapDates.includes(r.tanggal));

                    if (displayRows.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="py-14 text-center text-slate-400 font-medium">
                            <div className="flex flex-col items-center gap-2.5 max-w-md mx-auto">
                              <Calendar className="w-7 h-7 text-slate-300" />
                              <p className="font-bold text-slate-600 text-sm">
                                Belum ada perencanaan / pembuatan penerima manfaat
                              </p>
                              <p className="text-xs text-slate-400">
                                Klik tombol <strong>Buat Penerima Manfaat</strong> di atas untuk membuat perencanaan sasaran penerima manfaat harian.
                              </p>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return displayRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/90 transition-colors group">
                        {/* Hari & Tanggal */}
                        <td className="py-4 px-5 text-left font-bold text-slate-900 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                            <span>{r.hariTanggal}</span>
                          </div>
                        </td>

                        {/* Kelompok Sasaran */}
                        <td className="py-4 px-5 text-left border-b border-slate-100">
                          <div className="flex flex-wrap gap-1.5">
                            {r.kelompokSasaran.split(', ').map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-200/60"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Total Sasaran */}
                        <td className="py-4 px-5 text-center font-extrabold text-slate-900 font-mono text-base border-b border-slate-100">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/60">
                            {r.totalSasaran.toLocaleString('id-ID')} <span className="text-xs font-sans text-emerald-600 font-semibold">Porsi</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5 text-center border-b border-slate-100">
                          {r.status === 'Final' || r.status === 'FINAL' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Final
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200 shadow-2xs">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              Draft
                            </span>
                          )}
                        </td>

                        {/* Aksi Column with Lihat, Edit, Hapus */}
                        <td className="py-4 px-5 text-center border-b border-slate-100">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Tombol Lihat */}
                            <button
                              onClick={() => setDetailModalRekap(r)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs rounded-xl border border-sky-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                              title="Lihat Detail Rekap Harian"
                            >
                              <Eye className="w-3.5 h-3.5 text-sky-600" />
                              <span>Lihat</span>
                            </button>

                            {/* Tombol Edit */}
                            <button
                              onClick={() => handleOpenEditPenerimaModal(r)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-xs rounded-xl border border-amber-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                              title="Edit Rekap Harian Tanggal Ini"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Edit</span>
                            </button>

                            {/* Tombol Hapus */}
                            <button
                              onClick={() => handleDeleteRekapDate(r.tanggal, r.hariTanggal)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                              title="Hapus Rekap Harian Tanggal Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REKAP BULANAN */}
      {activeTab === 'rekap-bulanan' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">Rekapitulasi Bulanan Penerima Manfaat</h3>
              <p className="text-xs text-slate-500">Analisis tren distribusi porsi dan statistik bulanan SPPG</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={rekapBulan}
                onChange={(e) => setRekapBulan(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-700"
              >
                {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, idx) => (
                  <option key={idx} value={String(idx + 1)}>{m}</option>
                ))}
              </select>

              <select
                value={rekapTahun}
                onChange={(e) => setRekapTahun(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-700"
              >
                {['2024','2025','2026','2027'].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Hari Operasional</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">
                {monthlyData?.summary?.totalHariProduksi || 0} <span className="text-xs font-normal text-slate-500">Hari</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Porsi Terdistribusi</span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-2">
                {monthlyData?.summary?.totalPorsi ? monthlyData.summary.totalPorsi.toLocaleString('id-ID') : '0'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Rata-Rata Per Hari</span>
              <div className="text-3xl font-extrabold text-blue-600 mt-2">
                {monthlyData?.summary?.rataRataPerHari ? monthlyData.summary.rataRataPerHari.toLocaleString('id-ID') : '0'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Porsi Tertinggi (Peak)</span>
              <div className="text-3xl font-extrabold text-purple-600 mt-2">
                {monthlyData?.summary?.maxPenerima ? monthlyData.summary.maxPenerima.toLocaleString('id-ID') : '0'}
              </div>
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold uppercase text-slate-500">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4 text-right">Balita</th>
                    <th className="py-3 px-4 text-right">Bumil</th>
                    <th className="py-3 px-4 text-right">Busui</th>
                    <th className="py-3 px-4 text-right">Siswa</th>
                    <th className="py-3 px-4 text-right">Guru / Staf</th>
                    <th className="py-3 px-4 text-right font-extrabold text-slate-900">Total Porsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyData?.dailyList?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada rekaman penerima manfaat pada bulan ini.
                      </td>
                    </tr>
                  ) : (
                    monthlyData?.dailyList?.map((d: any) => (
                      <tr key={d.tanggal} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{d.tanggal}</td>
                        <td className="py-3 px-4 text-right">{d.totalBalita}</td>
                        <td className="py-3 px-4 text-right">{d.totalIbuHamil}</td>
                        <td className="py-3 px-4 text-right">{d.totalIbuMenyusui}</td>
                        <td className="py-3 px-4 text-right">{d.totalSiswa}</td>
                        <td className="py-3 px-4 text-right">{d.totalGuru}</td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600">{d.totalPenerima.toLocaleString('id-ID')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: PENGATURAN KELOMPOK & SPESIFIKASI SASARAN */}
      {activeTab === 'kelompok' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Pengaturan Master Kelompok & Spesifikasi Sasaran</h3>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold rounded-full">
                  Form Terpadu Lembaga & Porsi
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Atur sasaran siswa dan guru per lembaga dalam 1 form penambahan kelompok baru. Data terkonfigurasi otomatis dengan Perencanaan Menu (Porsi Besar, Porsi Kecil, Balita, & Bumil/Busui).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (onNavigate) onNavigate('/menu-harian');
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-2xl border border-emerald-200 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Buka Menu Harian</span>
              </button>

              {groups.length > 0 && (
                <button
                  onClick={handleClearAllGroups}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 transition-all cursor-pointer"
                  title="Hapus / Kosongkan semua kelompok penerima manfaat"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Kosongkan Semua</span>
                </button>
              )}

              <button
                onClick={() => {
                  const defaultCat: KategoriLembaga = 'SD / MI';
                  const conf = getKategoriConfig(defaultCat);
                  const initialBd: Record<string, number> = {};
                  conf.classes.forEach(c => { initialBd[c.key] = 0; });

                  const nextNumber = groups.length + 1;
                  setEditingGroup({
                    nama: `Kelompok Sasaran #${nextNumber}`,
                    kategoriUtama: 'Siswa',
                    kategoriLembaga: defaultCat,
                    alamat: '',
                    deskripsi: '',
                    status: 'Aktif',
                    lembagaList: [
                      {
                        namaInstansi: `Instansi Sasaran 1`,
                        alamat: '',
                        kategoriLembaga: defaultCat,
                        breakdownKelas: initialBd,
                        targetSiswa: 0,
                        targetGuru: 0,
                        targetBalita: 0,
                        targetBumilBusui: 0,
                        total: 0,
                        klasifikasiPorsi: 'Porsi Kecil'
                      }
                    ]
                  });
                  setIsGroupModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-2xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kelompok Baru</span>
              </button>
            </div>
          </div>

          {/* CLASSIFICATION SUMMARY CARDS FOR PERENCANAAN MENU */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4" />
                  KONFIGURASI KLASIFIKASI PORSI MENU & PENERIMA MANFAAT
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Distribusi sasaran penerima manfaat terkelompok berdasarkan jenis porsi untuk perhitungan bahan pangan
                </p>
              </div>

              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                Auto-Synced to Perencanaan Menu
              </span>
            </div>

            {(() => {
              // Calculate portion breakdown dynamically using user-specified automated rules:
              // PAUD/TK: Porsi kecil
              // SD/MI kelas 1–3: Porsi kecil
              // SD/MI kelas 4–6: Porsi besar (+ guru: porsi besar)
              // SMP/MTs: Porsi besar
              // SMA/SMK/MA: Porsi besar
              // Ibu hamil: Porsi besar
              // Ibu menyusui: Porsi besar
              // Balita: Porsi kecil
              let porsiBesarVal = 0;
              let porsiKecilVal = 0;
              let porsiBalitaVal = 0;
              let porsiIbuHamilVal = 0;
              let porsiIbuMenyusuiVal = 0;

              const processedInstansi = new Set<string>();

              if (groups && groups.length > 0) {
                groups.forEach((grp) => {
                  if (grp.lembagaList && grp.lembagaList.length > 0) {
                    grp.lembagaList.forEach((l) => {
                      const itemCat = l.kategoriLembaga || grp.kategoriLembaga;
                      const instKey = (l.namaInstansi || '').trim().toLowerCase();
                      if (instKey) processedInstansi.add(instKey);

                      const auto = calculateAutoPortion({
                        kategoriLembaga: itemCat,
                        namaInstansi: l.namaInstansi,
                        breakdownKelas: l.breakdownKelas || {},
                        targetSiswa: Number(l.targetSiswa) || 0,
                        targetGuru: Number(l.targetGuru) || 0,
                        targetBalita: Number(l.targetBalita) || 0,
                        targetBumilBusui: Number(l.targetBumilBusui) || 0,
                        total: Number(l.total) || 0
                      });

                      porsiKecilVal += auto.porsiKecil;
                      porsiBesarVal += auto.porsiBesar;
                      porsiBalitaVal += auto.detail.balita;
                      porsiIbuHamilVal += auto.detail.ibuHamil;
                      porsiIbuMenyusuiVal += auto.detail.ibuMenyusui;
                    });
                  } else {
                    const grpLocs = locations.filter(loc => loc.groupId === grp.id || loc.groupNama === grp.nama);
                    if (grpLocs.length > 0) {
                      grpLocs.forEach((loc) => {
                        const instKey = (loc.namaInstansi || '').trim().toLowerCase();
                        if (instKey) processedInstansi.add(instKey);

                        const auto = calculateAutoPortion({
                          kategoriLembaga: loc.kategoriLembaga || grp.kategoriLembaga,
                          namaInstansi: loc.namaInstansi,
                          breakdownKelas: loc.breakdownKelas || loc.kategoriBreakdown?.breakdownKelas || {},
                          targetSiswa: Number(loc.kategoriBreakdown?.siswa) || Number(loc.defaultJumlah) || 0,
                          targetGuru: Number(loc.kategoriBreakdown?.guru) || 0,
                          targetBalita: Number(loc.kategoriBreakdown?.balita) || 0,
                          targetBumilBusui: (Number(loc.kategoriBreakdown?.ibuHamil) || 0) + (Number(loc.kategoriBreakdown?.ibuMenyusui) || 0),
                          total: Number(loc.defaultJumlah) || 0
                        });

                        porsiKecilVal += auto.porsiKecil;
                        porsiBesarVal += auto.porsiBesar;
                        porsiBalitaVal += auto.detail.balita;
                        porsiIbuHamilVal += auto.detail.ibuHamil;
                        porsiIbuMenyusuiVal += auto.detail.ibuMenyusui;
                      });
                    }
                  }
                });
              }

              // Check if any additional standalone locations exist
              if (locations && locations.length > 0) {
                locations.forEach((loc) => {
                  const instKey = (loc.namaInstansi || '').trim().toLowerCase();
                  if (instKey && processedInstansi.has(instKey)) return;

                  const auto = calculateAutoPortion({
                    kategoriLembaga: loc.kategoriLembaga,
                    namaInstansi: loc.namaInstansi,
                    breakdownKelas: loc.breakdownKelas || loc.kategoriBreakdown?.breakdownKelas || {},
                    targetSiswa: Number(loc.kategoriBreakdown?.siswa) || Number(loc.defaultJumlah) || 0,
                    targetGuru: Number(loc.kategoriBreakdown?.guru) || 0,
                    targetBalita: Number(loc.kategoriBreakdown?.balita) || 0,
                    targetBumilBusui: (Number(loc.kategoriBreakdown?.ibuHamil) || 0) + (Number(loc.kategoriBreakdown?.ibuMenyusui) || 0),
                    total: Number(loc.defaultJumlah) || 0
                  });

                  porsiKecilVal += auto.porsiKecil;
                  porsiBesarVal += auto.porsiBesar;
                  porsiBalitaVal += auto.detail.balita;
                  porsiIbuHamilVal += auto.detail.ibuHamil;
                  porsiIbuMenyusuiVal += auto.detail.ibuMenyusui;
                });
              }

              if (porsiBesarVal === 0 && porsiKecilVal === 0) {
                porsiBesarVal = dailySummary?.portionBreakdown?.porsiBesar ?? 810;
                porsiKecilVal = dailySummary?.portionBreakdown?.porsiKecil ?? 287;
                porsiBalitaVal = dailySummary?.portionBreakdown?.porsiBalita ?? dailySummary?.portionBreakdown?.balita ?? 68;
                porsiIbuHamilVal = dailySummary?.portionBreakdown?.porsiIbuHamil ?? 30;
                porsiIbuMenyusuiVal = dailySummary?.portionBreakdown?.porsiIbuMenyusui ?? 21;
              }

              const totalSeluruhPorsi = porsiBesarVal + porsiKecilVal;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 pt-1">
                  {/* Porsi Besar */}
                  <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">🍚 Porsi Besar</div>
                      <div className="text-xl font-black text-emerald-400 mt-0.5">
                        {porsiBesarVal.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-300">Porsi</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">SD 4-6, SMP, SMA, Bumil, Busui, Guru/Kader</div>
                    </div>
                  </div>

                  {/* Porsi Kecil */}
                  <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">🥣 Porsi Kecil</div>
                      <div className="text-xl font-black text-cyan-400 mt-0.5">
                        {porsiKecilVal.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-300">Porsi</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">SD 1-3, PAUD / TK, Balita</div>
                    </div>
                  </div>

                  {/* Porsi Balita */}
                  <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">🍼 Porsi Balita</div>
                      <div className="text-xl font-black text-purple-400 mt-0.5">
                        {porsiBalitaVal.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-300">Porsi</span>
                      </div>
                      <div className="text-[10px] text-cyan-300/80 mt-0.5">Otomatis Masuk Porsi Kecil</div>
                    </div>
                  </div>

                  {/* Porsi Ibu Hamil */}
                  <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">🤰 Porsi Ibu Hamil</div>
                      <div className="text-xl font-black text-rose-400 mt-0.5">
                        {porsiIbuHamilVal.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-300">Porsi</span>
                      </div>
                      <div className="text-[10px] text-emerald-300/80 mt-0.5">Otomatis Masuk Porsi Besar</div>
                    </div>
                  </div>

                  {/* Porsi Ibu Menyusui */}
                  <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">🤱 Porsi Ibu Menyusui</div>
                      <div className="text-xl font-black text-amber-400 mt-0.5">
                        {porsiIbuMenyusuiVal.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-300">Porsi</span>
                      </div>
                      <div className="text-[10px] text-emerald-300/80 mt-0.5">Otomatis Masuk Porsi Besar</div>
                    </div>
                  </div>

                  {/* Total Seluruh Porsi */}
                  <div className="bg-emerald-950/60 border border-emerald-500/50 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1">
                        📊 TOTAL SELURUH PORSI
                      </div>
                      <div className="text-xl font-black text-amber-300 mt-0.5">
                        {totalSeluruhPorsi.toLocaleString('id-ID')} <span className="text-xs font-normal text-emerald-200">Porsi</span>
                      </div>
                      <div className="text-[10px] text-emerald-300/80 mt-0.5">Akumulasi Seluruh Sasaran</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* GROUP LIST CARDS WITH EMBEDDED LEMBAGA SASARAN */}
          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Building2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-800">Belum Ada Kelompok Penerima Manfaat</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Semua kelompok telah dikosongkan. Silakan klik tombol <span className="font-semibold text-slate-800">+ Tambah Kelompok Baru</span> di atas untuk menambahkan kelompok sasaran secara mandiri sesuai kebutuhan admin.
                </p>
              </div>
            ) : (
              groups.map((grp, groupIdx) => {
              const is3BGrp = grp.nama?.includes('3B') || grp.kategoriLembaga?.includes('3B') || grp.kategoriUtama === '3B';
              const grpLocs = locations.filter(l => l.groupId === grp.id || l.groupNama === grp.nama);
              let totalSiswa = grpLocs.reduce((acc, l) => acc + (is3BGrp ? 0 : (l.kategoriBreakdown?.siswa || 0)), 0);
              let totalGuru = grpLocs.reduce((acc, l) => acc + (is3BGrp ? 0 : (l.kategoriBreakdown?.guru || l.kategoriBreakdown?.staf || 0)), 0);
              let totalKader = grpLocs.reduce((acc, l) => acc + (is3BGrp ? (l.kategoriBreakdown?.kader || (Number(l.breakdownKelas?.kader_l) || 0) + (Number(l.breakdownKelas?.kader_p) || 0) || Number(l.breakdownKelas?.kader) || 0) : 0), 0);
              let totalBalita = grpLocs.reduce((acc, l) => acc + (l.kategoriBreakdown?.balita || 0), 0);
              let totalBumil = grpLocs.reduce((acc, l) => acc + (l.kategoriBreakdown?.ibuHamil || 0) + (l.kategoriBreakdown?.ibuMenyusui || 0), 0);

              if (grp.lembagaList && grp.lembagaList.length > 0) {
                let lSiswa = 0, lGuru = 0, lKader = 0, lBalita = 0, lBumil = 0;
                grp.lembagaList.forEach((l: any) => {
                  const bd = l.breakdownKelas || {};
                  const bW = Number(bd.busui_w ?? bd.busui) || 0;
                  const mW = Number(bd.bumil_w ?? bd.bumil) || 0;
                  const bBaduta = (Number(bd.balita511_l) || 0) + (Number(bd.balita511_p) || 0) || Number(bd.baduta) || 0;
                  const bBalita = (Number(bd.balita1259_l) || 0) + (Number(bd.balita1259_p) || 0) || Number(bd.balita) || 0;
                  const kKader = (Number(bd.kader_l) || 0) + (Number(bd.kader_p) || 0) || Number(bd.kader) || Number(l.targetKader) || 0;

                  const s = is3BGrp ? 0 : (Number(l.targetSiswa) || 0);
                  const g = is3BGrp ? 0 : (Number(l.targetGuru) || 0);
                  const kd = is3BGrp ? kKader : 0;
                  const b = Number(l.targetBalita) || (bBaduta + bBalita) || 0;
                  const bb = Number(l.targetBumilBusui) || (mW + bW) || 0;

                  lSiswa += s;
                  lGuru += g;
                  lKader += kd;
                  lBalita += b;
                  lBumil += bb;
                });
                totalSiswa = lSiswa;
                totalGuru = lGuru;
                totalKader = lKader;
                totalBalita = lBalita;
                totalBumil = lBumil;
              }

              const totalPorsi = is3BGrp
                ? (totalBalita + totalBumil + totalKader)
                : (totalSiswa + totalGuru + totalBalita + totalBumil);

              const groupAuto = calculateAutoPortion({
                kategoriLembaga: grp.kategoriLembaga,
                namaInstansi: grp.nama,
                targetSiswa: totalSiswa,
                targetGuru: totalGuru,
                targetBalita: totalBalita,
                targetBumilBusui: totalBumil,
                total: totalPorsi
              });

              return (
                <div key={grp.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all p-5 space-y-4">
                  {/* Group Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        #{groupIdx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-extrabold text-slate-900">{grp.nama}</h4>
                          <span className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-full flex items-center gap-1 shadow-2xs ${
                            groupAuto.porsiKecil > 0 && groupAuto.porsiBesar > 0 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                            groupAuto.porsiKecil > 0 ? 'bg-cyan-100 text-cyan-900 border border-cyan-300' : 'bg-blue-100 text-blue-900 border border-blue-300'
                          }`}>
                            <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{groupAuto.summaryLabel}</span>
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            grp.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {grp.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{grp.deskripsi || 'Tidak ada deskripsi'}</p>

                        {/* Nama PIC & Nomor Kontak Pengaturan Kelompok */}
                        {(grp.picNama || grp.nomorKontak || grp.picKontak) ? (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {grp.picNama && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-bold shadow-2xs">
                                <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span>PIC: <strong className="text-indigo-950 font-black">{grp.picNama}</strong></span>
                              </span>
                            )}
                            {(grp.nomorKontak || grp.picKontak) && (
                              <a
                                href={`https://wa.me/${(grp.nomorKontak || grp.picKontak || '').replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 hover:text-emerald-900 transition-colors shadow-2xs"
                                title="Klik untuk hubungi via WhatsApp"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Kontak: {grp.nomorKontak || grp.picKontak}</span>
                              </a>
                            )}
                            {grp.alamat && grp.alamat !== grp.deskripsi && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60">
                                📍 {grp.alamat}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-1.5 text-slate-400 text-xs">
                            <User className="w-3.5 h-3.5 text-slate-300" />
                            <span className="text-[11px] italic">PIC & Nomor Kontak belum diatur</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Group Aggregates */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {totalSiswa > 0 && (
                        <div className="px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-600">
                          🏫 Siswa: <span className="font-extrabold text-slate-900">{totalSiswa}</span>
                        </div>
                      )}
                      {totalBalita > 0 && (
                        <div className="px-3 py-1.5 bg-blue-50 border border-blue-200/70 rounded-xl text-xs font-medium text-blue-800">
                          👶 Balita: <span className="font-extrabold text-blue-950">{totalBalita}</span>
                        </div>
                      )}
                      {totalBumil > 0 && (
                        <div className="px-3 py-1.5 bg-rose-50 border border-rose-200/70 rounded-xl text-xs font-medium text-rose-800">
                          🤰🤱 Bumil & Busui: <span className="font-extrabold text-rose-950">{totalBumil}</span>
                        </div>
                      )}
                      {is3BGrp ? (
                        totalKader > 0 && (
                          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200/70 rounded-xl text-xs font-medium text-emerald-800">
                            👩‍⚕️ Kader: <span className="font-extrabold text-emerald-950">{totalKader}</span>
                          </div>
                        )
                      ) : (
                        totalGuru > 0 && (
                          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-600">
                            👨‍🏫 Guru: <span className="font-extrabold text-slate-900">{totalGuru}</span>
                          </div>
                        )
                      )}
                      <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-700">
                        🍱 Total Porsi: <span className="font-extrabold text-emerald-900">{totalPorsi}</span>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => {
                            const groupCat: KategoriLembaga = grp.kategoriLembaga || inferKategoriFromText(grp.nama, 'SD / MI');
                            const groupConf = getKategoriConfig(groupCat);
                            const groupLocs = locations.filter(l => l.groupId === grp.id || l.groupNama === grp.nama);

                            const lembagaList = (grp.lembagaList && grp.lembagaList.length > 0)
                              ? grp.lembagaList.map(l => {
                                  const itemCat: KategoriLembaga = l.kategoriLembaga || groupCat;
                                  const itemConf = getKategoriConfig(itemCat);
                                  const itemKlas = l.klasifikasiPorsi || grp.klasifikasiPorsi || itemConf.defaultKlasifikasi || 'Porsi Besar';
                                  const norm = (l.namaInstansi || '').trim().toLowerCase();
                                  let s = Number(l.targetSiswa) || 0;
                                  let g = Number(l.targetGuru) || 0;
                                  let b = Number(l.targetBalita) || 0;
                                  let bb = Number(l.targetBumilBusui) || 0;

                                  if (itemKlas === 'Porsi Ibu Hamil' || norm.includes('ibu hamil') || (norm.includes('hamil') && !norm.includes('menyusui'))) {
                                    bb = bb || s || 0;
                                    s = 0;
                                    b = 0;
                                  } else if (itemKlas === 'Porsi Ibu Menyusui' || norm.includes('ibu menyusui') || norm.includes('menyusui')) {
                                    bb = bb || s || 0;
                                    s = 0;
                                    b = 0;
                                  } else if (itemKlas === 'Porsi Balita' || itemKlas === 'Balita' || norm.includes('balita')) {
                                    b = b || s || 0;
                                    s = 0;
                                    bb = 0;
                                  }

                                  let bd = l.breakdownKelas ? { ...l.breakdownKelas } : {};
                                  if (!l.breakdownKelas || Object.keys(l.breakdownKelas).length === 0 || (itemCat.includes('3B') && bd['busui_w'] === undefined)) {
                                    if (itemCat.includes('3B') || itemConf.id.includes('3B')) {
                                      const rawBaduta = bd['baduta'] !== undefined ? bd['baduta'] : Math.ceil(b / 2);
                                      const rawBalita = bd['balita'] !== undefined ? bd['balita'] : Math.floor(b / 2);
                                      const bW = bd['busui_w'] !== undefined ? bd['busui_w'] : (bd['busui'] !== undefined ? bd['busui'] : Math.floor(bb / 2));
                                      const mW = bd['bumil_w'] !== undefined ? bd['bumil_w'] : (bd['bumil'] !== undefined ? bd['bumil'] : Math.ceil(bb / 2));
                                      const b511L = bd['balita511_l'] !== undefined ? bd['balita511_l'] : Math.ceil(rawBaduta / 2);
                                      const b511P = bd['balita511_p'] !== undefined ? bd['balita511_p'] : Math.floor(rawBaduta / 2);
                                      const b1259L = bd['balita1259_l'] !== undefined ? bd['balita1259_l'] : Math.ceil(rawBalita / 2);
                                      const b1259P = bd['balita1259_p'] !== undefined ? bd['balita1259_p'] : Math.floor(rawBalita / 2);
                                      const kL = bd['kader_l'] !== undefined ? Number(bd['kader_l']) || 0 : 0;
                                      const kP = bd['kader_p'] !== undefined ? Number(bd['kader_p']) || 0 : 0;

                                      bd['busui_w'] = bW;
                                      bd['busui'] = bW;
                                      bd['bumil_w'] = mW;
                                      bd['bumil'] = mW;
                                      bd['balita511_l'] = b511L;
                                      bd['balita511_p'] = b511P;
                                      bd['baduta'] = b511L + b511P;
                                      bd['balita1259_l'] = b1259L;
                                      bd['balita1259_p'] = b1259P;
                                      bd['balita'] = b1259L + b1259P;
                                      bd['kader_l'] = kL;
                                      bd['kader_p'] = kP;
                                      bd['kader'] = kL + kP;
                                    } else {
                                      const mainVal = itemConf.targetCategory === 'Balita' ? b : (itemConf.targetCategory === 'Ibu Hamil' ? bb : s);
                                      if (itemConf.classes.length > 0 && mainVal > 0) {
                                        const perCls = Math.floor(mainVal / itemConf.classes.length);
                                        const rem = mainVal % itemConf.classes.length;
                                        itemConf.classes.forEach((c, cIdx) => {
                                          bd[c.key] = perCls + (cIdx === 0 ? rem : 0);
                                        });
                                      } else {
                                        itemConf.classes.forEach(c => { bd[c.key] = 0; });
                                      }
                                    }
                                  }

                                  return {
                                    ...l,
                                    kategoriLembaga: itemCat,
                                    breakdownKelas: bd,
                                    targetSiswa: s,
                                    targetGuru: g,
                                    targetBalita: b,
                                    targetBumilBusui: bb,
                                    total: s + g + b + bb,
                                    klasifikasiPorsi: itemKlas
                                  };
                                })
                              : groupLocs.map(l => {
                                  const itemCat: KategoriLembaga = l.kategoriLembaga || groupCat;
                                  const itemConf = getKategoriConfig(itemCat);
                                  const itemKlas = l.klasifikasiPorsi || grp.klasifikasiPorsi || itemConf.defaultKlasifikasi || 'Porsi Besar';
                                  const norm = (l.namaInstansi || '').trim().toLowerCase();
                                  let s = l.kategoriBreakdown?.siswa || 0;
                                  let g = l.kategoriBreakdown?.guru || (l.kategoriBreakdown?.staf || 0);
                                  let b = l.kategoriBreakdown?.balita || 0;
                                  let bb = (l.kategoriBreakdown?.ibuHamil || 0) + (l.kategoriBreakdown?.ibuMenyusui || 0);

                                  if (itemKlas === 'Porsi Ibu Hamil' || norm.includes('ibu hamil') || (norm.includes('hamil') && !norm.includes('menyusui'))) {
                                    bb = bb || l.kategoriBreakdown?.ibuHamil || s || 0;
                                    s = 0;
                                    b = 0;
                                  } else if (itemKlas === 'Porsi Ibu Menyusui' || norm.includes('ibu menyusui') || norm.includes('menyusui')) {
                                    bb = bb || l.kategoriBreakdown?.ibuMenyusui || s || 0;
                                    s = 0;
                                    b = 0;
                                  } else if (itemKlas === 'Porsi Balita' || itemKlas === 'Balita' || norm.includes('balita')) {
                                    b = b || l.kategoriBreakdown?.balita || s || 0;
                                    s = 0;
                                    bb = 0;
                                  }

                                  let bd = (l.breakdownKelas || l.kategoriBreakdown?.breakdownKelas) ? { ...(l.breakdownKelas || l.kategoriBreakdown?.breakdownKelas) } : {};
                                  if (!l.breakdownKelas && !l.kategoriBreakdown?.breakdownKelas || Object.keys(bd).length === 0 || (itemCat.includes('3B') && bd['busui_w'] === undefined)) {
                                    if (itemCat.includes('3B') || itemConf.id.includes('3B')) {
                                      const rawBaduta = bd['baduta'] !== undefined ? bd['baduta'] : Math.ceil(b / 2);
                                      const rawBalita = bd['balita'] !== undefined ? bd['balita'] : Math.floor(b / 2);
                                      const bW = bd['busui_w'] !== undefined ? bd['busui_w'] : (bd['busui'] !== undefined ? bd['busui'] : Math.floor(bb / 2));
                                      const mW = bd['bumil_w'] !== undefined ? bd['bumil_w'] : (bd['bumil'] !== undefined ? bd['bumil'] : Math.ceil(bb / 2));
                                      const b511L = bd['balita511_l'] !== undefined ? bd['balita511_l'] : Math.ceil(rawBaduta / 2);
                                      const b511P = bd['balita511_p'] !== undefined ? bd['balita511_p'] : Math.floor(rawBaduta / 2);
                                      const b1259L = bd['balita1259_l'] !== undefined ? bd['balita1259_l'] : Math.ceil(rawBalita / 2);
                                      const b1259P = bd['balita1259_p'] !== undefined ? bd['balita1259_p'] : Math.floor(rawBalita / 2);
                                      const kL = bd['kader_l'] !== undefined ? bd['kader_l'] : Math.ceil(g / 2);
                                      const kP = bd['kader_p'] !== undefined ? bd['kader_p'] : Math.floor(g / 2);

                                      bd['busui_w'] = bW;
                                      bd['busui'] = bW;
                                      bd['bumil_w'] = mW;
                                      bd['bumil'] = mW;
                                      bd['balita511_l'] = b511L;
                                      bd['balita511_p'] = b511P;
                                      bd['baduta'] = b511L + b511P;
                                      bd['balita1259_l'] = b1259L;
                                      bd['balita1259_p'] = b1259P;
                                      bd['balita'] = b1259L + b1259P;
                                      bd['kader_l'] = kL;
                                      bd['kader_p'] = kP;
                                      bd['kader'] = kL + kP;
                                    } else {
                                      const mainVal = itemConf.targetCategory === 'Balita' ? b : (itemConf.targetCategory === 'Ibu Hamil' ? bb : s);
                                      if (itemConf.classes.length > 0 && mainVal > 0) {
                                        const perCls = Math.floor(mainVal / itemConf.classes.length);
                                        const rem = mainVal % itemConf.classes.length;
                                        itemConf.classes.forEach((c, cIdx) => {
                                          bd[c.key] = perCls + (cIdx === 0 ? rem : 0);
                                        });
                                      } else {
                                        itemConf.classes.forEach(c => { bd[c.key] = 0; });
                                      }
                                    }
                                  }

                                  const tot = s + g + b + bb;
                                  return {
                                    id: l.id,
                                    namaInstansi: l.namaInstansi,
                                    kategoriLembaga: itemCat,
                                    breakdownKelas: bd,
                                    targetSiswa: s,
                                    targetGuru: g,
                                    targetBalita: b,
                                    targetBumilBusui: bb,
                                    total: tot > 0 ? tot : (l.defaultJumlah || 0),
                                    klasifikasiPorsi: itemKlas,
                                    picNama: (l as any).picNama || (l as any).kontakPerson || '',
                                    nomorKontak: (l as any).nomorKontak || (l as any).picKontak || ''
                                  };
                                });

                            setEditingGroup({
                              ...grp,
                              alamat: grp.alamat || grp.deskripsi || '',
                              picNama: grp.picNama || '',
                              nomorKontak: grp.nomorKontak || grp.picKontak || '',
                              picKontak: grp.picKontak || grp.nomorKontak || '',
                              kategoriLembaga: groupCat,
                              klasifikasiPorsi: groupAuto.klasifikasi as any,
                              lembagaList: lembagaList.length > 0 ? lembagaList : [
                                {
                                  namaInstansi: `${grp.nama} - Instansi 1`,
                                  kategoriLembaga: groupCat,
                                  breakdownKelas: {},
                                  targetSiswa: 0,
                                  targetGuru: 0,
                                  targetBalita: 0,
                                  targetBumilBusui: 0,
                                  total: 0,
                                  klasifikasiPorsi: groupAuto.klasifikasi as any
                                }
                              ]
                            });
                            setIsGroupModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Form Kelompok & Lembaga</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteGroup(grp.id, grp.nama)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                          title="Hapus Kelompok"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lembaga Breakdown Table inside Group Card */}
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-slate-50/50">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-2.5">Nama Lembaga / Instansi</th>
                          <th className="px-3 py-2.5 text-center">{is3BGrp ? 'Balita 5-11 Bln' : 'Sasaran Siswa'}</th>
                          <th className="px-3 py-2.5 text-center">{is3BGrp ? 'Kader' : 'Guru / Staf'}</th>
                          <th className="px-3 py-2.5 text-center">{is3BGrp ? 'Balita 12-59 Bln' : 'Balita'}</th>
                          <th className="px-3 py-2.5 text-center">Bumil / Busui</th>
                          <th className="px-3 py-2.5 text-center">Subtotal Porsi</th>
                          <th className="px-3 py-2.5">PIC & Kontak</th>
                          <th className="px-4 py-2.5">Klasifikasi Porsi Menu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {grpLocs.length === 0 && (!grp.lembagaList || grp.lembagaList.length === 0) ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-4 text-center text-slate-400 font-medium">
                              Belum ada spesifikasi sasaran lembaga. Klik <span className="font-bold text-slate-700">Edit Form Kelompok & Lembaga</span> untuk mengisi rincian sasaran per instansi.
                            </td>
                          </tr>
                        ) : (
                          (grpLocs.length > 0 ? grpLocs : grp.lembagaList || []).map((loc: any, idx: number) => {
                            const pCat = loc.klasifikasiPorsi || groupAuto.klasifikasi;
                            const norm = (loc.namaInstansi || loc.nama || '').trim().toLowerCase();
                            const is3B = norm.includes('posyandu') || norm.includes('temenggungan') || (loc.kategoriLembaga && loc.kategoriLembaga.includes('3B')) || grp.kategoriLembaga?.includes('3B') || grp.nama?.includes('3B');

                            const locBd = loc.breakdownKelas || loc.kategoriBreakdown?.breakdownKelas || {};
                            let bdBumil = Number(locBd.bumil_w ?? locBd.bumil) || (loc.kategoriBreakdown?.ibuHamil || 0);
                            let bdBusui = Number(locBd.busui_w ?? locBd.busui) || (loc.kategoriBreakdown?.ibuMenyusui || 0);
                            let bdBalita511 = (Number(locBd.balita511_l) || 0) + (Number(locBd.balita511_p) || 0) || Number(locBd.baduta) || 0;
                            let bdBalita1259 = (Number(locBd.balita1259_l) || 0) + (Number(locBd.balita1259_p) || 0) || Number(locBd.balita) || 0;
                            let bdBalita = bdBalita511 + bdBalita1259 || (loc.kategoriBreakdown?.balita || 0) || (loc.targetBalita || 0);
                            let bdKader = (Number(locBd.kader_l) || 0) + (Number(locBd.kader_p) || 0) || Number(locBd.kader) || 0;

                            let s = is3B ? 0 : (loc.kategoriBreakdown?.siswa !== undefined ? loc.kategoriBreakdown.siswa : (loc.targetSiswa || 0));
                            let g = is3B ? 0 : (loc.kategoriBreakdown?.guru !== undefined ? loc.kategoriBreakdown.guru : (loc.targetGuru || 0));
                            let b = bdBalita;
                            let bb = (bdBumil + bdBusui) || (loc.kategoriBreakdown?.ibuHamil || 0) + (loc.kategoriBreakdown?.ibuMenyusui || 0) || (loc.targetBumilBusui || 0);

                            if (!is3B) {
                              if (pCat === 'Porsi Ibu Hamil' || norm.includes('ibu hamil') || (norm.includes('hamil') && !norm.includes('menyusui'))) {
                                bb = bb || (loc.kategoriBreakdown?.ibuHamil || 0) || s || 0;
                                s = 0;
                                b = 0;
                              } else if (pCat === 'Porsi Ibu Menyusui' || norm.includes('ibu menyusui') || norm.includes('menyusui')) {
                                bb = bb || (loc.kategoriBreakdown?.ibuMenyusui || 0) || s || 0;
                                s = 0;
                                b = 0;
                              } else if (pCat === 'Porsi Balita' || pCat === 'Balita' || norm.includes('balita')) {
                                b = b || (loc.kategoriBreakdown?.balita || 0) || s || 0;
                                s = 0;
                                bb = 0;
                              }
                            }

                            const calculatedSum = is3B ? (b + bb + bdKader) : (s + g + b + bb);
                            const tot = calculatedSum > 0 ? calculatedSum : (loc.total || loc.defaultJumlah || 0);

                            const locAuto = calculateAutoPortion({
                              kategoriLembaga: loc.kategoriLembaga || grp.kategoriLembaga,
                              namaInstansi: loc.namaInstansi || loc.nama,
                              breakdownKelas: loc.breakdownKelas || loc.kategoriBreakdown?.breakdownKelas || {},
                              targetSiswa: s,
                              targetGuru: is3B ? 0 : g,
                              targetBalita: b,
                              targetBumilBusui: bb,
                              total: tot
                            });

                            return (
                              <tr key={loc.id || idx} className="hover:bg-white transition-all">
                                <td className="px-4 py-2.5 font-bold text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{loc.namaInstansi || loc.nama}</span>
                                    {(loc.kategoriLembaga || grp.kategoriLembaga) && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        {loc.kategoriLembaga || grp.kategoriLembaga}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {is3BGrp ? (
                                    <div className="font-semibold text-slate-700">{bdBalita511 > 0 ? bdBalita511 : '-'}</div>
                                  ) : (
                                    <>
                                      <div className="font-semibold text-slate-700">{s}</div>
                                      {loc.breakdownKelas && Object.keys(loc.breakdownKelas).length > 0 && (
                                        <div className="text-[9px] text-slate-400 font-medium truncate max-w-[160px] mx-auto" title={Object.entries(loc.breakdownKelas).map(([k, v]) => `${k}: ${v}`).join(', ')}>
                                          {Object.entries(loc.breakdownKelas).filter(([_, v]) => Number(v) > 0).slice(0, 3).map(([k, v]) => `${k.replace('kelas', 'K')}: ${v}`).join(' ')}
                                          {Object.entries(loc.breakdownKelas).filter(([_, v]) => Number(v) > 0).length > 3 ? '...' : ''}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center font-semibold text-slate-700">
                                  {is3BGrp ? (bdKader > 0 ? bdKader : '-') : (g > 0 ? g : 0)}
                                </td>
                                <td className="px-3 py-2.5 text-center font-semibold text-slate-700">
                                  {is3BGrp ? (bdBalita1259 > 0 ? bdBalita1259 : '-') : b}
                                </td>
                                <td className="px-3 py-2.5 text-center font-semibold text-slate-700">
                                  <div className="font-extrabold text-slate-900">{bb}</div>
                                  {(bdBumil > 0 || bdBusui > 0) && (
                                    <div className="text-[10px] text-rose-700 font-bold whitespace-nowrap">
                                      {bdBumil > 0 && `${bdBumil} Bumil`}
                                      {bdBumil > 0 && bdBusui > 0 && ' • '}
                                      {bdBusui > 0 && `${bdBusui} Busui`}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center font-extrabold text-emerald-600">{tot} Porsi</td>
                                <td className="px-3 py-2.5 text-slate-600">
                                  {(loc.picNama || loc.kontakPerson || loc.nomorKontak || loc.picKontak) ? (
                                    <div className="space-y-0.5">
                                      {(loc.picNama || loc.kontakPerson) && (
                                        <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate max-w-[120px]">{loc.picNama || loc.kontakPerson}</span>
                                        </div>
                                      )}
                                      {(loc.nomorKontak || loc.picKontak) && (
                                        <a
                                          href={`https://wa.me/${(loc.nomorKontak || loc.picKontak || '').replace(/[^0-9]/g, '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 hover:underline"
                                        >
                                          <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                                          <span>{loc.nomorKontak || loc.picKontak}</span>
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 text-[11px]">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span
                                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border flex items-center gap-1 w-fit shadow-2xs ${locAuto.badgePill.color}`}
                                    title={locAuto.summaryLabel}
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span>{locAuto.badgePill.text}</span>
                                    <span className="opacity-80">({locAuto.badgePill.subtext})</span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      )}

      {/* MODAL: RECORD PENERIMA HARIAN (TAMBAH / EDIT) */}
      {isRecordModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingRecord.id ? 'Edit Record Penerima' : 'Tambah Record Penerima Baru'}
              </h3>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Instansi / Lokasi *</label>
                <select
                  value={editingRecord.namaInstansi || ''}
                  onChange={(e) => {
                    const selLoc = locations.find(l => l.namaInstansi === e.target.value);
                    const defaultAwal = selLoc?.defaultJumlah !== undefined ? selLoc.defaultJumlah : 0;
                    setEditingRecord({
                      ...editingRecord,
                      namaInstansi: e.target.value,
                      locationId: selLoc?.id || '',
                      groupId: selLoc?.groupId || groups[0]?.id,
                      groupNama: selLoc?.groupNama || groups[0]?.nama,
                      jumlahAwal: editingRecord.jumlahAwal !== undefined ? editingRecord.jumlahAwal : defaultAwal
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  required
                >
                  <option value="">-- Pilih Instansi Target --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.namaInstansi}>{loc.namaInstansi} ({loc.groupNama})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Kelompok</label>
                  <select
                    value={editingRecord.groupId || ''}
                    onChange={(e) => {
                      const selGrp = groups.find(g => g.id === e.target.value);
                      setEditingRecord({
                        ...editingRecord,
                        groupId: e.target.value,
                        groupNama: selGrp?.nama || ''
                      });
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200/80 rounded-2xl text-xs font-semibold"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Kategori Target</label>
                  <select
                    value={editingRecord.kategori || 'Siswa'}
                    onChange={(e) => setEditingRecord({ ...editingRecord, kategori: e.target.value as any })}
                    className="w-full px-3.5 py-2 border border-slate-200/80 rounded-2xl text-xs font-semibold"
                  >
                    {['Siswa','Guru / Staf','Balita','Ibu Hamil','Ibu Menyusui','Lainnya'].map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Calculator Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
                <span className="text-xs font-bold uppercase text-slate-400">Kalkulator Jumlah Penerima</span>
                
                {(() => {
                  const awal = Number(editingRecord.jumlahAwal) || 0;
                  const tambah = Number(editingRecord.penambahan) || 0;
                  const kurang = Number(editingRecord.pengurangan) || 0;
                  const finalPorsi = Math.max(0, awal + tambah - kurang);
                  const formula = `${awal} (Awal) + ${tambah} (Tambah) - ${kurang} (Kurang) = ${finalPorsi} Porsi`;

                  return (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        <ValidatedPortionInput
                          label="Porsi Awal"
                          value={awal}
                          onChange={(val) => setEditingRecord({ ...editingRecord, jumlahAwal: val })}
                        />

                        <ValidatedPortionInput
                          label="Penambahan (+)"
                          value={tambah}
                          onChange={(val) => setEditingRecord({ ...editingRecord, penambahan: val })}
                          className="text-emerald-700 font-bold border-emerald-200"
                        />

                        <ValidatedPortionInput
                          label="Pengurangan (-)"
                          value={kurang}
                          onChange={(val) => setEditingRecord({ ...editingRecord, pengurangan: val })}
                          className="text-rose-700 font-bold border-rose-200"
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <PortionValidationBadge
                          subtotal={finalPorsi}
                          formula={formula}
                          showFormula={true}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Keterangan / Alasan Perubahan</label>
                <textarea
                  value={editingRecord.keterangan || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, keterangan: e.target.value })}
                  placeholder="Catatan penambahan/pengurangan siswa..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-2xl text-xs font-semibold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-semibold transition-all shadow-xs"
                >
                  Simpan Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOCATION (TAMBAH / EDIT INSTANSI) */}
      {isLocationModalOpen && editingLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingLocation.id ? 'Edit Instansi / Lokasi' : 'Tambah Instansi Baru'}
              </h3>
              <button onClick={() => setIsLocationModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Instansi *</label>
                <input
                  type="text"
                  value={editingLocation.namaInstansi || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, namaInstansi: e.target.value })}
                  placeholder="e.g. SD Zainul Hasan Genggong"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Kelompok Target</label>
                <select
                  value={editingLocation.groupId || ''}
                  onChange={(e) => {
                    const grp = groups.find(g => g.id === e.target.value);
                    setEditingLocation({
                      ...editingLocation,
                      groupId: e.target.value,
                      groupNama: grp?.nama || ''
                    });
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.nama}</option>
                  ))}
                </select>
              </div>

              {/* Real-time Category Breakdown & Dynamic Subtotal Calculation */}
              <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Rincian Sasaran & Subtotal Porsi Real-Time
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-lg">
                    ✓ Validasi Otomatis
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <ValidatedPortionInput
                    label="Sasaran Siswa"
                    value={editingLocation.kategoriBreakdown?.siswa ?? 0}
                    onChange={(val) => {
                      const kb = { ...(editingLocation.kategoriBreakdown || {}), siswa: val };
                      const sum = val + (kb.guru || 0) + (kb.balita || 0) + (kb.ibuHamil || 0) + (kb.ibuMenyusui || 0);
                      setEditingLocation({
                        ...editingLocation,
                        kategoriBreakdown: kb,
                        defaultJumlah: sum
                      });
                    }}
                  />

                  <ValidatedPortionInput
                    label="Guru / Staf"
                    value={editingLocation.kategoriBreakdown?.guru ?? 0}
                    onChange={(val) => {
                      const kb = { ...(editingLocation.kategoriBreakdown || {}), guru: val };
                      const sum = (kb.siswa || 0) + val + (kb.balita || 0) + (kb.ibuHamil || 0) + (kb.ibuMenyusui || 0);
                      setEditingLocation({
                        ...editingLocation,
                        kategoriBreakdown: kb,
                        defaultJumlah: sum
                      });
                    }}
                  />

                  <ValidatedPortionInput
                    label="Sasaran Balita"
                    value={editingLocation.kategoriBreakdown?.balita ?? 0}
                    onChange={(val) => {
                      const kb = { ...(editingLocation.kategoriBreakdown || {}), balita: val };
                      const sum = (kb.siswa || 0) + (kb.guru || 0) + val + (kb.ibuHamil || 0) + (kb.ibuMenyusui || 0);
                      setEditingLocation({
                        ...editingLocation,
                        kategoriBreakdown: kb,
                        defaultJumlah: sum
                      });
                    }}
                  />

                  <ValidatedPortionInput
                    label="Ibu Hamil / Menyusui"
                    value={(editingLocation.kategoriBreakdown?.ibuHamil || 0) + (editingLocation.kategoriBreakdown?.ibuMenyusui || 0)}
                    onChange={(val) => {
                      const kb = { ...(editingLocation.kategoriBreakdown || {}), ibuHamil: val, ibuMenyusui: 0 };
                      const sum = (kb.siswa || 0) + (kb.guru || 0) + (kb.balita || 0) + val;
                      setEditingLocation({
                        ...editingLocation,
                        kategoriBreakdown: kb,
                        defaultJumlah: sum
                      });
                    }}
                  />
                </div>

                <div className="pt-1">
                  <PortionValidationBadge
                    subtotal={editingLocation.defaultJumlah ?? 0}
                    formula={`Subtotal Akumulasi: ${editingLocation.defaultJumlah ?? 0} Porsi`}
                    showFormula={true}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Alamat Instansi</label>
                <input
                  type="text"
                  value={editingLocation.alamat || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, alamat: e.target.value })}
                  placeholder="Alamat lengkap..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingLocation.id ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteLocation(editingLocation.id!, editingLocation.namaInstansi || '')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-semibold border border-rose-200 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                ) : <div />}
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-2xl text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 text-white rounded-2xl text-xs font-semibold"
                  >
                    Simpan Instansi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GROUP (TAMBAH / EDIT KELOMPOK DENGAN BREAKDOWN DEMOGRAFI PENERIMA BERBASIS KATEGORI LEMBAGA) */}
      {isGroupModalOpen && editingGroup && (
        <GroupFormModal
          isOpen={isGroupModalOpen}
          editingGroup={editingGroup}
          setEditingGroup={setEditingGroup}
          onClose={() => {
            setIsGroupModalOpen(false);
            setEditingGroup(null);
          }}
          onSave={handleSaveGroup}
          onDelete={handleDeleteGroup}
        />
      )}

      {/* MODAL: AUDIT LOG HISTORY */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-bold text-slate-900">Audit Trail Log Perubahan Data</h3>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 font-bold uppercase text-slate-500">
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Instansi</th>
                    <th className="py-2.5 px-3 text-right">Sebelum</th>
                    <th className="py-2.5 px-3 text-right">Sesudah</th>
                    <th className="py-2.5 px-3 text-right">Selisih</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada riwayat audit perubahan data.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-500">{log.tanggal} {log.jam}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{log.user}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{log.namaInstansi}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{log.dataSebelum}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{log.dataSesudah}</td>
                        <td className={`py-2.5 px-3 text-right font-extrabold ${log.selisih >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {log.selisih >= 0 ? `+${log.selisih}` : log.selisih}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{log.keterangan}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-2xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL REKAP HARIAN (LIHAT) */}
      {detailModalRekap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-50 rounded-2xl border border-sky-100 text-sky-600">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Rincian Rekapitulasi Harian</h3>
                  <p className="text-xs text-slate-500 font-medium">{detailModalRekap.hariTanggal}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalRekap(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Hari & Tanggal</span>
                <span className="text-xs font-bold text-slate-900">{detailModalRekap.hariTanggal}</span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Total Sasaran Porsi</span>
                <span className="text-xs font-extrabold text-emerald-700 font-mono">
                  {detailModalRekap.totalSasaran.toLocaleString('id-ID')} Porsi
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Status Dokumen</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  detailModalRekap.status === 'Final' || detailModalRekap.status === 'FINAL'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {detailModalRekap.status}
                </span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Spesifikasi Kelompok & Porsi Sasaran</h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                      <th className="py-2.5 px-4">Lembaga / Sasaran</th>
                      <th className="py-2.5 px-4">Klasifikasi</th>
                      <th className="py-2.5 px-4 text-right">Rincian Porsi</th>
                      <th className="py-2.5 px-4 text-right">Total Porsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {(() => {
                      const detailRecs = historyRecords.filter(r => r.tanggal === detailModalRekap.tanggal);
                      const activeDetailRecs = detailRecs.length > 0 ? detailRecs : dailyRecords.filter(r => r.tanggal === detailModalRekap.tanggal);

                      if (activeDetailRecs.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} className="py-6 px-4 text-center text-slate-400">
                              Tidak ada rincian lembaga untuk tanggal ini.
                            </td>
                          </tr>
                        );
                      }

                      return activeDetailRecs.map((rec, idx) => {
                        const klas = rec.klasifikasiPorsi || rec.groupNama || rec.kategori;
                        const cleanInst = (rec.namaInstansi || '').toLowerCase();
                        const is3B = cleanInst.includes('posyandu') || cleanInst.includes('temenggungan') || cleanInst.includes('3b') || (rec.kategoriLembaga && rec.kategoriLembaga.includes('3B')) || rec.groupNama?.includes('3B');

                        const rs = rec.rincianSasaran;
                        const bd = rec.breakdownKelas || rs?.breakdownKelas || {};
                        let bumilVal = Number(rs?.ibuHamil) || Number(bd.bumil_w ?? bd.bumil) || 0;
                        let busuiVal = Number(rs?.ibuMenyusui) || Number(bd.busui_w ?? bd.busui) || 0;
                        let balitaVal = Number(rs?.balita) || (Number(bd.balita511_l) || 0) + (Number(bd.balita511_p) || 0) + (Number(bd.balita1259_l) || 0) + (Number(bd.balita1259_p) || 0) || (Number(bd.baduta) || 0) + (Number(bd.balita) || 0);
                        let guruVal = is3B
                          ? ((Number(bd.kader_l) || 0) + (Number(bd.kader_p) || 0) || Number(bd.kader) || 0)
                          : (Number(rs?.guru) || 0);
                        let siswaVal = is3B ? 0 : (Number(rs?.siswa) || 0);

                        const totalBumilBusui = bumilVal + busuiVal;

                        let rincianText = `${rec.totalPenerima} Porsi`;
                        if (rec.statusKbm === 'Libur Full') {
                          rincianText = 'Libur Full (0 Porsi)';
                        } else if (is3B) {
                          const parts: string[] = [];
                          if (balitaVal > 0) parts.push(`${balitaVal} Balita`);
                          if (bumilVal > 0 && busuiVal > 0) {
                            parts.push(`${bumilVal} Bumil, ${busuiVal} Busui (Total Bumil & Busui: ${totalBumilBusui})`);
                          } else if (totalBumilBusui > 0) {
                            parts.push(`${totalBumilBusui} Bumil & Busui`);
                          }
                          if (guruVal > 0) parts.push(`${guruVal} Kader`);
                          rincianText = parts.length > 0 ? parts.join(' • ') : `${rec.totalPenerima} Porsi`;
                        } else if (rs) {
                          const parts: string[] = [];
                          if (siswaVal > 0) parts.push(`${siswaVal} Siswa`);
                          if (guruVal > 0) parts.push(`${guruVal} Guru`);
                          if (balitaVal > 0) parts.push(`${balitaVal} Balita`);
                          if (bumilVal > 0) parts.push(`${bumilVal} Ibu Hamil`);
                          if (busuiVal > 0) parts.push(`${busuiVal} Ibu Menyusui`);
                          if (parts.length > 0) rincianText = parts.join(', ');
                        }

                        return (
                          <tr key={rec.id || idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-bold text-slate-900">
                              <div>{rec.namaInstansi}</div>
                              {is3B && (
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap font-normal">
                                  {balitaVal > 0 && (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                                      👶 Balita: {balitaVal}
                                    </span>
                                  )}
                                  {bumilVal > 0 && (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                                      🤰 Bumil: {bumilVal}
                                    </span>
                                  )}
                                  {busuiVal > 0 && (
                                    <span className="px-1.5 py-0.5 rounded bg-pink-50 text-pink-800 border border-pink-200 text-[10px] font-bold">
                                      🤱 Busui: {busuiVal}
                                    </span>
                                  )}
                                  {totalBumilBusui > 0 && (
                                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-black">
                                      🤰🤱 Gabungan Bumil & Busui: {totalBumilBusui}
                                    </span>
                                  )}
                                  {guruVal > 0 && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                      👩‍🏫 Kader: {guruVal}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px]">
                                {klas}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right text-slate-600 font-medium">{rincianText}</td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                              {rec.totalPenerima.toLocaleString('id-ID')} Porsi
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const targetRec = { ...detailModalRekap };
                  setDetailModalRekap(null);
                  handleOpenEditPenerimaModal(targetRec);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl text-xs font-semibold border border-amber-200 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Data Tanggal Ini
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Rincian
                </button>
                <button
                  onClick={() => setDetailModalRekap(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FORM BUAT PENERIMA MANFAAT */}
      {isBuatPenerimaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">
                    FORM PENERIMA MANFAAT
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Atur pembagian sasaran siswa, guru, balita, dan ibu hamil/menyusui per lembaga dalam 1 form ini.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const existingNames = new Set(buatPenerimaLembagaList.map((l) => (l.namaInstansi || '').trim().toLowerCase()));
                    let targetGroup = groups[0];
                    let targetInstName = '';
                    let targetCat: KategoriLembaga = 'SD / MI';
                    let targetBd: Record<string, number> = {};
                    let targetSiswa = 0;
                    let targetGuru = 0;
                    let targetBalita = 0;
                    let targetBumilBusui = 0;
                    let targetKlas: KlasifikasiPorsi = 'Porsi Besar';

                    if (groups && groups.length > 0) {
                      for (const g of groups) {
                        if (g.lembagaList && g.lembagaList.length > 0) {
                          const unadded = g.lembagaList.find((l) => !existingNames.has(l.namaInstansi.trim().toLowerCase()));
                          if (unadded) {
                            targetGroup = g;
                            targetInstName = unadded.namaInstansi;
                            targetCat = unadded.kategoriLembaga || g.kategoriLembaga || 'SD / MI';
                            targetBd = unadded.breakdownKelas ? { ...unadded.breakdownKelas } : {};
                            const isUnadded3B = targetCat.includes('3B');
                            targetSiswa = isUnadded3B ? 0 : (unadded.targetSiswa || 0);
                            targetGuru = isUnadded3B ? ((targetBd.kader_l || 0) + (targetBd.kader_p || 0) || targetBd.kader || 0) : (unadded.targetGuru || 0);
                            targetBalita = unadded.targetBalita || 0;
                            targetBumilBusui = unadded.targetBumilBusui || 0;
                            targetKlas = unadded.klasifikasiPorsi || g.klasifikasiPorsi || 'Porsi Besar';
                            break;
                          }
                        }
                      }
                    }

                    if (!targetInstName) {
                      const g = groups[groups.length - 1] || groups[0];
                      if (g) {
                        targetGroup = g;
                        targetCat = g.kategoriLembaga || 'SD / MI';
                        targetInstName = `${g.nama} - Satuan Pendidikan ${buatPenerimaLembagaList.length + 1}`;
                        targetKlas = g.klasifikasiPorsi || 'Porsi Besar';
                        const firstL = g.lembagaList?.[0];
                        if (firstL?.breakdownKelas) targetBd = { ...firstL.breakdownKelas };
                      } else {
                        targetInstName = `Lembaga Penerima #${buatPenerimaLembagaList.length + 1}`;
                      }
                    }

                    setBuatPenerimaLembagaList([
                      ...buatPenerimaLembagaList,
                      {
                        id: `lbg-${Date.now()}`,
                        groupId: targetGroup?.id,
                        groupNama: targetGroup?.nama,
                        namaInstansi: targetInstName,
                        kategoriLembaga: targetCat,
                        breakdownKelas: targetBd,
                        statusKbm: 'Aktif',
                        keteranganLibur: '',
                        keterangan: '',
                        targetSiswa,
                        targetGuru,
                        targetBalita,
                        targetBumilBusui,
                        klasifikasiPorsi: targetKlas
                      }
                    ]);
                  }}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-300 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  + Tambah Lembaga / Instansi
                </button>
                <button
                  type="button"
                  onClick={handleCloseBuatPenerimaModal}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveBuatPenerima} className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Global Datalist of Known Institutions */}
              <datalist id="daftar-lembaga-saran">
                <option value="Posyandu Desa Temenggungan" />
                <option value="SMP ZAINUL HASAN 1 GENGGONG" />
                <option value="SD Zainul Hasan Genggong" />
                <option value="MA Model Hafshawaty" />
                <option value="TK ZAINUL HASAN" />
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.namaInstansi} />
                ))}
                {groups.flatMap((g) => g.lembagaList || []).map((l, lIdx) => (
                  <option key={`gl-${lIdx}`} value={l.namaInstansi} />
                ))}
              </datalist>

              {/* Date & Document Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal Rekapitulasi Penerimaan</label>
                  <input
                    type="date"
                    value={buatPenerimaTanggal}
                    onChange={(e) => setBuatPenerimaTanggal(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Status Dokumen Rekap</label>
                  <select
                    value={buatPenerimaStatusDoc}
                    onChange={(e) => setBuatPenerimaStatusDoc(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="FINAL">🟢 FINAL (Verifikasi & Kunci Data)</option>
                    <option value="DRAFT">🟡 DRAFT (Dalam Proses Edit)</option>
                  </select>
                </div>
              </div>

              {/* Live Real-time Validation Audit Bar across All Institutions */}
              {buatPenerimaLembagaList.length > 0 && (() => {
                const totalAkumulasi = buatPenerimaLembagaList.reduce((acc, it) => {
                  if (it.statusKbm === 'Libur Full') return acc;
                  const itCat = it.kategoriLembaga || inferKategoriFromText(it.namaInstansi, 'SD / MI');
                  const itConf = getKategoriConfig(itCat);
                  const itBd = it.breakdownKelas || {};
                  const is3B = itCat.includes('3B') || itConf.id.includes('3B') || itConf.targetCategory === '3B';
                  if (is3B) {
                    const tBalita = (Number(itBd.balita511_l) || 0) + (Number(itBd.balita511_p) || 0) + (Number(itBd.balita1259_l) || 0) + (Number(itBd.balita1259_p) || 0) || Number(it.targetBalita) || 0;
                    const tBumilBusui = (Number(itBd.busui_w) || 0) + (Number(itBd.bumil_w) || 0) || Number(it.targetBumilBusui) || 0;
                    const tKader = (Number(itBd.kader_l) || 0) + (Number(itBd.kader_p) || 0) || Number(itBd.kader) || 0;
                    return acc + tBalita + tBumilBusui + tKader;
                  }
                  const sumClasses = itConf.classes.reduce((sum, c) => sum + (Number(itBd[c.key]) || 0), 0);
                  const s = sumClasses > 0 ? sumClasses : Number(it.targetSiswa) || 0;
                  const g = Number(it.targetGuru) || 0;
                  return acc + s + g;
                }, 0);

                const listWithSync = buatPenerimaLembagaList.map((it) => {
                  if (it.statusKbm === 'Libur Full') return { isLibur: true, isSynced: true };
                  const itCat = it.kategoriLembaga || inferKategoriFromText(it.namaInstansi, 'SD / MI');
                  const itConf = getKategoriConfig(itCat);
                  const itBd = it.breakdownKelas || {};
                  const is3B = itCat.includes('3B') || itConf.id.includes('3B');
                  let subtotal = 0;
                  if (is3B) {
                    const b = (Number(itBd.balita511_l) || 0) + (Number(itBd.balita511_p) || 0) + (Number(itBd.balita1259_l) || 0) + (Number(itBd.balita1259_p) || 0) || Number(it.targetBalita) || 0;
                    const bb = (Number(itBd.busui_w) || 0) + (Number(itBd.bumil_w) || 0) || Number(it.targetBumilBusui) || 0;
                    const k = (Number(itBd.kader_l) || 0) + (Number(itBd.kader_p) || 0) || Number(itBd.kader) || 0;
                    subtotal = b + bb + k;
                  } else {
                    const s = itConf.classes.reduce((sum, c) => sum + (Number(itBd[c.key]) || 0), 0) || Number(it.targetSiswa) || 0;
                    subtotal = s + (Number(it.targetGuru) || 0);
                  }
                  const sInfo = getSelisihDataPorsi(it.namaInstansi, subtotal, it.statusKbm);
                  return { isLibur: false, isSynced: sInfo ? sInfo.isSynced : true };
                });

                const outOfSyncCount = listWithSync.filter((x) => !x.isSynced).length;
                const totalActive = listWithSync.filter((x) => !x.isLibur).length;

                return (
                  <div className="space-y-2">
                    <RealtimeValidationAuditBar
                      totalItems={buatPenerimaLembagaList.length}
                      totalSubtotal={totalAkumulasi}
                      isValid={true}
                      unitLabel="Lembaga Sasaran"
                    />

                    {/* Overall Group Master Synchronization Status Alert */}
                    {outOfSyncCount > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-extrabold text-amber-900">
                              Indikator Sinkronisasi: {outOfSyncCount} dari {totalActive} lembaga memiliki jumlah penerima yang berbeda dari data kelompok master.
                            </span>
                            <span className="block text-[11px] text-amber-700">
                              Periksa kartu lembaga bergaris kuning di bawah untuk melihat rincian selisih atau klik tombol Sinkronkan Semua.
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const updatedList = buatPenerimaLembagaList.map((item) => {
                              const master = getMasterLembagaData(item.namaInstansi);
                              if (!master) return item;
                              return {
                                ...item,
                                kategoriLembaga: master.kategoriLembaga || item.kategoriLembaga,
                                breakdownKelas: master.breakdownKelas ? { ...master.breakdownKelas } : {},
                                targetSiswa: master.targetSiswa,
                                targetGuru: master.targetGuru,
                                targetBalita: master.targetBalita,
                                targetBumilBusui: master.targetBumilBusui,
                                klasifikasiPorsi: master.klasifikasiPorsi || item.klasifikasiPorsi
                              };
                            });
                            setBuatPenerimaLembagaList(updatedList);
                            showToast(`Seluruh lembaga (${buatPenerimaLembagaList.length}) berhasil disinkronkan ke data kelompok master`);
                          }}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Sinkronkan Semua ke Master
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Institution Rows List with Dynamic Category & Class Breakdown */}
              <div className="space-y-4">
                {buatPenerimaLembagaList.map((item, idx) => {
                  const itemCat: KategoriLembaga = item.kategoriLembaga || inferKategoriFromText(item.namaInstansi, 'SD / MI');
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

                  const kaderL = itemBd.kader_l !== undefined ? (Number(itemBd.kader_l) || 0) : 0;
                  const kaderP = itemBd.kader_p !== undefined ? (Number(itemBd.kader_p) || 0) : 0;
                  const totKader = (Number(kaderL) || 0) + (Number(kaderP) || 0);

                  const totBalitaAll = totBalita511 + totBalita1259;
                  const totBumilBusuiAll = totBusui + totBumil;

                  const totalPorsiCalculated = is3BItem
                    ? (totBalitaAll + totBumilBusuiAll + totKader)
                    : (sumClassesThisItem + numGuruThisItem);

                  const subtotalPorsi = item.statusKbm === 'Libur Full' ? 0 : totalPorsiCalculated;

                  const autoPortionItem = calculateAutoPortion({
                    kategoriLembaga: itemCat,
                    namaInstansi: item.namaInstansi,
                    breakdownKelas: itemBd,
                    targetSiswa: is3BItem ? 0 : sumClassesThisItem,
                    targetGuru: is3BItem ? totKader : numGuruThisItem,
                    targetBalita: is3BItem ? totBalitaAll : (itemConf.targetCategory === 'Balita' ? sumClassesThisItem : 0),
                    targetBumilBusui: is3BItem ? totBumilBusuiAll : (itemConf.targetCategory === 'Ibu Hamil' ? sumClassesThisItem : 0),
                    total: subtotalPorsi
                  });

                  const selisihInfo = getSelisihDataPorsi(item.namaInstansi, subtotalPorsi, item.statusKbm);
                  const isOutOfSync = Boolean(selisihInfo && !selisihInfo.isSynced && item.statusKbm !== 'Libur Full');
                  const isSynced = Boolean(selisihInfo && selisihInfo.isSynced && item.statusKbm !== 'Libur Full');

                  const validation = calculatePortionValidation({
                    namaInstansi: item.namaInstansi,
                    klasifikasiPorsi: autoPortionItem.klasifikasi,
                    targetMain: is3BItem ? (totBalitaAll + totBumilBusuiAll) : sumClassesThisItem,
                    targetGuru: is3BItem ? totKader : numGuruThisItem,
                    targetBalita: is3BItem ? totBalitaAll : (itemConf.targetCategory === 'Balita' ? sumClassesThisItem : undefined),
                    targetBumilBusui: is3BItem ? totBumilBusuiAll : (itemConf.targetCategory === 'Ibu Hamil' ? sumClassesThisItem : undefined),
                    statusKbm: item.statusKbm,
                    targetMaster: selisihInfo?.targetMaster
                  });

                  const matchedGroup = groups.find(
                    (g) => g.id === item.groupId || (g.nama && g.nama.trim().toLowerCase() === (item.groupNama || '').trim().toLowerCase()) || (g.lembagaList && g.lembagaList.some((l) => l.namaInstansi.trim().toLowerCase() === (item.namaInstansi || '').trim().toLowerCase()))
                  );
                  const resolvedGroupNama = item.groupNama || matchedGroup?.nama || selisihInfo?.masterData?.namaKelompok || itemConf.label || 'Kelompok Sasaran';

                  return (
                    <div
                      key={item.id || idx}
                      className={`rounded-3xl p-4 sm:p-5 space-y-4 transition-all shadow-xs border ${
                        item.statusKbm === 'Libur Full'
                          ? 'bg-slate-50/70 border-slate-200'
                          : isOutOfSync
                          ? 'bg-amber-50/30 border-2 border-amber-400 ring-2 ring-amber-100/70'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* 1. TOP PROMINENT HEADER: NAMA KELOMPOK (BOLD, CLEAR, NEVER OBSCURED) */}
                      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xs border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            #{idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
                                KELOMPOK SASARAN
                              </span>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-bold">
                                {itemConf.shortName}
                              </span>
                            </div>
                            <span className="text-base sm:text-lg font-black text-white tracking-wide">
                              {resolvedGroupNama}
                            </span>
                          </div>
                        </div>

                        {/* Hubungkan dengan Data Kelompok Dropdown */}
                        {groups.length > 0 && (
                          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Kelompok:
                            </span>
                            <select
                              value={item.groupId || matchedGroup?.id || ''}
                              onChange={(e) => {
                                const selectedG = groups.find((g) => g.id === e.target.value);
                                if (selectedG) {
                                  const list = [...buatPenerimaLembagaList];
                                  list[idx].groupId = selectedG.id;
                                  list[idx].groupNama = selectedG.nama;
                                  const firstL = selectedG.lembagaList?.[0];
                                  const isSelected3B = (firstL?.kategoriLembaga || selectedG.kategoriLembaga || '').includes('3B');
                                  if (firstL) {
                                    list[idx].namaInstansi = firstL.namaInstansi;
                                    list[idx].kategoriLembaga = firstL.kategoriLembaga || selectedG.kategoriLembaga;
                                    if (firstL.breakdownKelas) list[idx].breakdownKelas = { ...firstL.breakdownKelas };
                                    list[idx].targetSiswa = isSelected3B ? 0 : (firstL.targetSiswa || 0);
                                    list[idx].targetGuru = isSelected3B ? ((firstL.breakdownKelas?.kader_l || 0) + (firstL.breakdownKelas?.kader_p || 0) || firstL.breakdownKelas?.kader || 0) : (firstL.targetGuru || 0);
                                    list[idx].targetBalita = firstL.targetBalita || 0;
                                    list[idx].targetBumilBusui = firstL.targetBumilBusui || 0;
                                    list[idx].klasifikasiPorsi = firstL.klasifikasiPorsi || selectedG.klasifikasiPorsi;
                                  } else {
                                    list[idx].namaInstansi = selectedG.nama;
                                    list[idx].kategoriLembaga = selectedG.kategoriLembaga;
                                    list[idx].targetSiswa = 0;
                                    list[idx].targetGuru = 0;
                                  }
                                  setBuatPenerimaLembagaList(list);
                                }
                              }}
                              className="bg-slate-900 text-emerald-400 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer"
                            >
                              {groups.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.nama}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* 2. INSTITUTION NAME & CONTROLS ROW (CLEAN, SPACIOUS, NO QUICK PILLS) */}
                      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3.5">
                        {/* Nama Lembaga / Satuan Pendidikan */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>NAMA LEMBAGA / SATUAN PENDIDIKAN:</span>
                            </label>
                            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Otomatis Sesuai Data Kelompok
                            </span>
                          </div>
                          <input
                            type="text"
                            value={item.namaInstansi || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const list = [...buatPenerimaLembagaList];
                              list[idx].namaInstansi = val;
                              const master = getMasterLembagaData(val);
                              if (master) {
                                if (master.kategoriLembaga) list[idx].kategoriLembaga = master.kategoriLembaga;
                                if (master.breakdownKelas && Object.keys(master.breakdownKelas).length > 0) {
                                  list[idx].breakdownKelas = { ...master.breakdownKelas };
                                }
                                if (master.targetSiswa !== undefined) list[idx].targetSiswa = master.targetSiswa;
                                if (master.targetGuru !== undefined) list[idx].targetGuru = master.targetGuru;
                                if (master.targetBalita !== undefined) list[idx].targetBalita = master.targetBalita;
                                if (master.targetBumilBusui !== undefined) list[idx].targetBumilBusui = master.targetBumilBusui;
                                if (master.klasifikasiPorsi) list[idx].klasifikasiPorsi = master.klasifikasiPorsi;
                                if (master.namaKelompok && !list[idx].groupNama) list[idx].groupNama = master.namaKelompok;
                              }
                              setBuatPenerimaLembagaList(list);
                            }}
                            placeholder="Nama lembaga otomatis terisi dari data kelompok"
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
                            required
                          />
                        </div>

                        {/* Controls Row: Jenis, Status KBM, Porsi, Selisih, Hapus */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/70">
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Jenis Lembaga */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-500">Jenis:</span>
                              <select
                                value={itemCat}
                                onChange={(e) => handleBuatPenerimaCategoryChange(idx, e.target.value as KategoriLembaga)}
                                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                              >
                                {KATEGORI_LEMBAGA_CONFIGS.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.shortName}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Status KBM */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-500">Status KBM:</span>
                              <select
                                value={item.statusKbm}
                                onChange={(e) => {
                                  const list = [...buatPenerimaLembagaList];
                                  list[idx].statusKbm = e.target.value as any;
                                  setBuatPenerimaLembagaList(list);
                                }}
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl border shadow-2xs transition-all cursor-pointer ${
                                  item.statusKbm === 'Aktif'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : item.statusKbm === 'Libur Full'
                                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                <option value="Aktif">🟢 Aktif</option>
                                <option value="Libur Full">🔴 Libur Full</option>
                                <option value="Libur Sebagian">🟡 Libur Sebagian</option>
                              </select>
                            </div>

                            {/* Porsi Otomatis Badge */}
                            <div
                              className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 shadow-2xs ${autoPortionItem.badgePill.color}`}
                              title={`Pembagian porsi otomatis: ${autoPortionItem.summaryLabel}`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{autoPortionItem.badgePill.text}</span>
                            </div>

                            {/* Indikator Selisih HANYA jika out of sync & > 0 */}
                            {item.statusKbm !== 'Libur Full' && isOutOfSync && selisihInfo && selisihInfo.selisihAbs > 0 && (
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-400 text-amber-900 text-xs font-black flex items-center gap-1 shadow-2xs animate-pulse"
                                  title={`Selisih ${selisihInfo.selisih > 0 ? `+${selisihInfo.selisih}` : selisihInfo.selisih} porsi dari master kelompok (${selisihInfo.targetMaster} porsi)`}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Selisih {selisihInfo.selisih > 0 ? `+${selisihInfo.selisih}` : selisihInfo.selisih} (Master: {selisihInfo.targetMaster})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleResetToMaster(idx)}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                                  title="Sinkronkan kembali ke data master kelompok"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Sinkronkan</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Delete Institution Row Button */}
                          {buatPenerimaLembagaList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...buatPenerimaLembagaList];
                                list.splice(idx, 1);
                                setBuatPenerimaLembagaList(list);
                              }}
                              className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-rose-200 text-xs font-bold flex items-center gap-1 shadow-2xs"
                              title="Hapus Lembaga Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Hapus Lembaga</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content: If Libur Full, show status banner */}
                      {item.statusKbm === 'Libur Full' ? (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-1">
                          <div className="text-xs font-bold text-rose-800 flex items-center justify-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            Status Lembaga: Libur Full (0 Porsi Penyaluran)
                          </div>
                          <p className="text-[11px] text-rose-600">
                            Lembaga ini libur penuh pada tanggal ini. Porsi otomatis bernilai 0.
                          </p>
                        </div>
                      ) : is3BItem ? (
                        /* 3B CUSTOM BREAKDOWN DEMOGRAFI PENERIMA - PERSIS SESUAI FORM PENAMBAHAN KELOMPOK */
                        <div className="space-y-3">
                          <div className="rounded-xl overflow-hidden border border-[#182353]/30 shadow-xs bg-white">
                            {/* Dark Navy Header Bar */}
                            <div className="bg-[#182353] text-white px-4 py-2.5 flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5">
                                <Users className="w-5 h-5 text-white shrink-0" />
                                <span className="font-black tracking-wide text-xs sm:text-sm uppercase">
                                  BREAKDOWN DEMOGRAFI PENERIMA (3B)
                                </span>
                              </div>
                              {isOutOfSync && selisihInfo && (
                                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Selisih {selisihInfo.selisih > 0 ? `+${selisihInfo.selisih}` : selisihInfo.selisih} Porsi
                                </span>
                              )}
                            </div>

                            {/* In-table validation banner for 3B */}
                            {isOutOfSync && (
                              <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 text-amber-900 font-bold">
                                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>
                                    Total demografi 3B saat ini ({totalPorsiCalculated} porsi) berbeda dengan master kelompok ({selisihInfo?.targetMaster} porsi).
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleResetToMaster(idx)}
                                  className="self-start sm:self-auto px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  Sinkronkan ke Master ({selisihInfo?.targetMaster} Porsi)
                                </button>
                              </div>
                            )}

                            {/* Table */}
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
                                        onChange={(e) => handleBuatPenerima3BChange(idx, 'busui_w', e.target.value)}
                                        placeholder="0"
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
                                        onChange={(e) => handleBuatPenerima3BChange(idx, 'bumil_w', e.target.value)}
                                        placeholder="0"
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
                                        onChange={(e) => handleBuatPenerima3BChange(idx, 'balita511_l', e.target.value)}
                                        placeholder="0"
                                        className="w-full text-center py-1.5 px-1 bg-white border border-slate-300 rounded-[4px] text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                                      />
                                    </td>
                                    <td className="p-2 border-r border-[#bfd6f2]">
                                      <input
                                        type="number"
                                        min="0"
                                        value={itemBd.balita511_p === 0 ? '' : (itemBd.balita511_p || '')}
                                        onChange={(e) => handleBuatPenerima3BChange(idx, 'balita511_p', e.target.value)}
                                        placeholder="0"
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
                                        onChange={(e) => handleBuatPenerima3BChange(idx, 'balita1259_l', e.target.value)}
                                        placeholder="0"
                                        className="w-full text-center py-1.5 px-1 bg-white border border-slate-300 rounded-[4px] text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                                      />
                                    </td>
                                    <td className="p-2 border-r border-[#bfd6f2]">
                                      <input
                                        type="number"
                                        min="0"
                                        value={itemBd.balita1259_p === 0 ? '' : (itemBd.balita1259_p || '')}
                                        onChange={(e) => handleBuatPenerima3BChange(idx, 'balita1259_p', e.target.value)}
                                        placeholder="0"
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
                                        onChange={(e) => handleBuatPenerima3BChange(idx, 'kader_l', e.target.value)}
                                        placeholder="0"
                                        className="w-full text-center py-1.5 px-1 bg-white border border-slate-300 rounded-[4px] text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
                                      />
                                    </td>
                                    <td className="p-2 border-r border-[#bfd6f2]">
                                      <input
                                        type="number"
                                        min="0"
                                        value={itemBd.kader_p === 0 ? '' : (itemBd.kader_p || '')}
                                        onChange={(e) => handleBuatPenerima3BChange(idx, 'kader_p', e.target.value)}
                                        placeholder="0"
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

                          {/* Dynamic Formula Badges for 3B */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
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
                                Total: <strong className="text-blue-900 font-black">{subtotalPorsi} Porsi</strong>
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
                        /* STANDARD BREAKDOWN DEMOGRAFI PENERIMA FOR SCHOOLS (SD / MI, SMP / MTs, SMA, PAUD, DLL) */
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                                BREAKDOWN KELAS ({itemConf.shortName})
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

                          {/* In-container validation banner for School classes */}
                          {isOutOfSync && (
                            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 text-amber-900 font-bold">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>
                                  Peringatan: Total siswa + {itemConf.teacherLabel.toLowerCase()} ({totalPorsiCalculated} porsi) tidak selaras dengan target master kelompok ({selisihInfo?.targetMaster} porsi).
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleResetToMaster(idx)}
                                className="self-start sm:self-auto px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Sinkronkan ke Master ({selisihInfo?.targetMaster} Porsi)
                              </button>
                            </div>
                          )}

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
                                      <span
                                        className={`text-[8px] font-extrabold px-1 rounded ${
                                          cls.portionTier === 'Porsi Kecil'
                                            ? 'bg-amber-100 text-amber-800'
                                            : cls.portionTier === 'Porsi Besar'
                                            ? 'bg-blue-100 text-blue-800'
                                            : cls.portionTier === 'Porsi Balita'
                                            ? 'bg-rose-100 text-rose-800'
                                            : 'bg-fuchsia-100 text-fuchsia-800'
                                        }`}
                                      >
                                        {cls.portionTier.replace('Porsi ', '')}
                                      </span>
                                    )}
                                  </div>

                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      value={val === 0 ? '' : val}
                                      onChange={(e) => handleBuatPenerimaClassChange(idx, cls.key, e.target.value)}
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

                          {/* ROW: GURU / STAF & FORMULA SUMMARY */}
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
                                    onChange={(e) => handleBuatPenerimaGuruChange(idx, e.target.value)}
                                    placeholder="0"
                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Auto Portions badges & Total */}
                            <div className="md:col-span-7 flex flex-wrap items-center justify-between md:justify-end gap-2.5">
                              <div className="flex items-center gap-1.5">
                                {autoPortionItem.porsiKecil > 0 && (
                                  <span className="font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[11px]">
                                    🥣 {autoPortionItem.porsiKecil} Porsi Kecil
                                  </span>
                                )}
                                {autoPortionItem.porsiBesar > 0 && (
                                  <span className="font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-[11px]">
                                    🍱 {autoPortionItem.porsiBesar} Porsi Besar
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700">
                                  Total: <strong className="text-emerald-700 font-black">{subtotalPorsi} Porsi</strong>
                                </span>
                                <PortionValidationBadge
                                  subtotal={validation.subtotal}
                                  formula={validation.formula}
                                  compact={false}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Kolom Keterangan Setiap Lembaga */}
                      <div className="pt-1">
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Keterangan Lembaga / Catatan Khusus
                        </label>
                        <input
                          type="text"
                          value={item.keterangan || ''}
                          onChange={(e) => {
                            const list = [...buatPenerimaLembagaList];
                            list[idx].keterangan = e.target.value;
                            setBuatPenerimaLembagaList(list);
                          }}
                          placeholder="Masukkan keterangan atau catatan lembaga jika ada..."
                          className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 font-medium"
                        />
                      </div>

                      {/* Warning Alert Badge HANYA MUNCUL JIKA ADA SELISIH (TERSEMBUNYI JIKA SUDAH SESUAI) */}
                      {isOutOfSync && selisihInfo && selisihInfo.selisihAbs > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="font-bold text-amber-900">
                              Peringatan Selisih: {selisihInfo.selisihAbs} Porsi
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-amber-800 flex items-center gap-2">
                            <span>(Pengaturan Kelompok: <strong className="font-bold">{selisihInfo.targetMaster} Porsi</strong> | Input: <strong className="font-bold">{subtotalPorsi} Porsi</strong>)</span>
                            <button
                              type="button"
                              onClick={() => handleResetToMaster(idx)}
                              className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                            >
                              Sesuaikan ke Master
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Explanation box for Libur Sebagian */}
                      {item.statusKbm === 'Libur Sebagian' && (
                        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                          <label className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Keterangan Selisih Data / Alasan Libur Sebagian:
                          </label>
                          <input
                            type="text"
                            value={item.keteranganLibur || ''}
                            onChange={(e) => {
                              const list = [...buatPenerimaLembagaList];
                              list[idx].keteranganLibur = e.target.value;
                              setBuatPenerimaLembagaList(list);
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 font-medium"
                            placeholder="Contoh: Libur kelas 3 ujian akhir (selisih 45 porsi), kelas 1-2 & 4-6 tetap masuk KBM"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary Navy Box */}
              {buatPenerimaLembagaList.length > 0 && (() => {
                let totalSiswa = 0;
                let totalGuru = 0;
                let totalBalita = 0;
                let totalBumilBusui = 0;
                let totalPorsiAll = 0;

                buatPenerimaLembagaList.forEach((it) => {
                  if (it.statusKbm === 'Libur Full') return;
                  const itCat = it.kategoriLembaga || inferKategoriFromText(it.namaInstansi, 'SD / MI');
                  const itConf = getKategoriConfig(itCat);
                  const itBd = it.breakdownKelas || {};
                  const is3B = itCat.includes('3B') || itConf.id.includes('3B') || itConf.targetCategory === '3B';

                  if (is3B) {
                    const b = (Number(itBd.balita511_l) || 0) + (Number(itBd.balita511_p) || 0) + (Number(itBd.balita1259_l) || 0) + (Number(itBd.balita1259_p) || 0) || Number(it.targetBalita) || 0;
                    const bb = (Number(itBd.busui_w) || 0) + (Number(itBd.bumil_w) || 0) || Number(it.targetBumilBusui) || 0;
                    const k = (Number(itBd.kader_l) || 0) + (Number(itBd.kader_p) || 0) || Number(itBd.kader) || 0;
                    totalBalita += b;
                    totalBumilBusui += bb;
                    totalGuru += k;
                    totalPorsiAll += b + bb + k;
                  } else {
                    const sumClasses = itConf.classes.reduce((sum, c) => sum + (Number(itBd[c.key]) || 0), 0);
                    const s = sumClasses > 0 ? sumClasses : Number(it.targetSiswa) || 0;
                    const g = Number(it.targetGuru) || 0;
                    totalSiswa += s;
                    totalGuru += g;
                    totalPorsiAll += s + g;
                  }
                });

                return (
                  <div className="bg-[#0B132B] text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md border border-slate-800">
                    <div className="font-bold text-slate-300">
                      Rangkuman Sasaran ({buatPenerimaLembagaList.length} Lembaga):
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      {totalSiswa > 0 && (
                        <span>
                          🏫 Siswa: <strong className="text-emerald-400 font-extrabold">{totalSiswa.toLocaleString('id-ID')}</strong>
                        </span>
                      )}
                      {totalBalita > 0 && (
                        <span>
                          👶 Balita: <strong className="text-blue-400 font-extrabold">{totalBalita.toLocaleString('id-ID')}</strong>
                        </span>
                      )}
                      {totalBumilBusui > 0 && (
                        <span>
                          🤰 Bumil/Busui: <strong className="text-rose-400 font-extrabold">{totalBumilBusui.toLocaleString('id-ID')}</strong>
                        </span>
                      )}
                      {totalGuru > 0 && (
                        <span>
                          👨‍🏫 Guru/Kader: <strong className="text-amber-400 font-extrabold">{totalGuru.toLocaleString('id-ID')}</strong>
                        </span>
                      )}
                      <span className="bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/40">
                        🍱 Total Porsi:{' '}
                        <strong className="text-emerald-300 font-extrabold font-mono text-sm">
                          {totalPorsiAll.toLocaleString('id-ID')} Porsi
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseBuatPenerimaModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Simpan Rekapitulasi Penerima Manfaat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Custom alert/confirm for iframe compatibility) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        danger={confirmModal.danger}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          if (confirmModal.onConfirm) {
            await confirmModal.onConfirm();
          }
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
      />

    </div>
  );
};

export default PenerimaManfaatView;
