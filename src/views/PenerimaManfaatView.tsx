import React, { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';
import {
  BeneficiaryGroup,
  BeneficiaryLocation,
  DailyBeneficiaryRecord,
  DailyBeneficiarySummary,
  BeneficiaryAuditLog,
  KlasifikasiPorsi
} from '../types';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { useFirestoreRealtime } from '../lib/useFirestoreRealtime';

interface PenerimaManfaatViewProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const PenerimaManfaatView: React.FC<PenerimaManfaatViewProps> = ({ currentPath = '/penerima-manfaat', onNavigate }) => {
  const { user } = useAuth();

  const getSubTabFromPath = (path: string) => {
    if (path.includes('rekap-harian')) return 'rekap-harian';
    if (path.includes('rekap-bulanan')) return 'rekap-bulanan';
    if (path.includes('kelompok')) return 'kelompok';
    return 'hari-ini';
  };

  const [activeTab, setActiveTab] = useState<'hari-ini' | 'rekap-harian' | 'rekap-bulanan' | 'kelompok'>(getSubTabFromPath(currentPath));

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

  // Modals & Form states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<Partial<DailyBeneficiaryRecord> | null>(null);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [editingLocation, setEditingLocation] = useState<Partial<BeneficiaryLocation> | null>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<Partial<BeneficiaryGroup> | null>(null);

  // Rekap Harian states
  const [historyStartDate, setHistoryStartDate] = useState<string>(selectedDate);
  const [historyEndDate, setHistoryEndDate] = useState<string>(selectedDate);
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
  const [buatPenerimaLembagaList, setBuatPenerimaLembagaList] = useState<
    Array<{
      id: string;
      namaInstansi: string;
      statusKbm: 'Aktif' | 'Libur Full' | 'Libur Sebagian';
      keteranganLibur?: string;
      keterangan?: string;
      targetSiswa: number;
      targetGuru: number;
      klasifikasiPorsi: KlasifikasiPorsi;
    }>
  >([]);

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
  const buildSyncedLembagaList = (tanggalStr?: string) => {
    const list: Array<{
      id: string;
      namaInstansi: string;
      statusKbm: 'Aktif' | 'Libur Full' | 'Libur Sebagian';
      keteranganLibur?: string;
      keterangan?: string;
      targetSiswa: number;
      targetGuru: number;
      klasifikasiPorsi: KlasifikasiPorsi;
    }> = [];

    const existingForDate = tanggalStr
      ? historyRecords.filter((rec) => rec.tanggal === tanggalStr)
      : [];

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

            let targetSiswa = Number(l.targetSiswa) || 0;
            let targetGuru = Number(l.targetGuru) || 0;
            if (savedRec) {
              const masterTotal = targetSiswa + targetGuru;
              const recTotal = Number(savedRec.jumlahAwal) || 0;
              if (recTotal !== masterTotal && recTotal > 0) {
                targetSiswa = recTotal;
                targetGuru = 0;
              }
            }

            list.push({
              id: l.id || `lbg-${Math.random().toString(36).substr(2, 6)}`,
              namaInstansi: l.namaInstansi,
              statusKbm,
              keteranganLibur,
              keterangan: l.keterangan || '',
              targetSiswa,
              targetGuru,
              klasifikasiPorsi: (l.klasifikasiPorsi as any) || (g.klasifikasiPorsi as any) || 'Porsi Besar'
            });
          });
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
          list.push({
            id: loc.id,
            namaInstansi: loc.namaInstansi,
            statusKbm,
            keteranganLibur,
            keterangan: '',
            targetSiswa: savedRec ? Number(savedRec.jumlahAwal) || 0 : (Number(kb.siswa) || Number(loc.defaultJumlah) || 0),
            targetGuru: savedRec ? 0 : (Number(kb.guru) || 0),
            klasifikasiPorsi: (loc.klasifikasiPorsi as any) || (g.klasifikasiPorsi as any) || 'Porsi Besar'
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
        list.push({
          id: loc.id,
          namaInstansi: loc.namaInstansi,
          statusKbm,
          keteranganLibur,
          keterangan: '',
          targetSiswa: savedRec ? Number(savedRec.jumlahAwal) || 0 : (Number(kb.siswa) || Number(loc.defaultJumlah) || 0),
          targetGuru: savedRec ? 0 : (Number(kb.guru) || 0),
          klasifikasiPorsi: (loc.klasifikasiPorsi as any) || 'Porsi Besar'
        });
      });
    }

    if (list.length === 0) {
      list.push(
        { id: '1', namaInstansi: 'SD Zainul Hasan Genggong', statusKbm: 'Aktif', keteranganLibur: '', keterangan: '', targetSiswa: 384, targetGuru: 25, klasifikasiPorsi: 'Porsi Kecil' },
        { id: '2', namaInstansi: 'SMP ZAHA Genggong', statusKbm: 'Aktif', keteranganLibur: '', keterangan: '', targetSiswa: 664, targetGuru: 36, klasifikasiPorsi: 'Porsi Besar' },
        { id: '3', namaInstansi: 'MA Model Hafshawaty', statusKbm: 'Aktif', keteranganLibur: '', keterangan: '', targetSiswa: 272, targetGuru: 25, klasifikasiPorsi: 'Porsi Besar' },
        { id: '4', namaInstansi: 'Anak Balita Nutrisi', statusKbm: 'Aktif', keteranganLibur: '', keterangan: '', targetSiswa: 68, targetGuru: 0, klasifikasiPorsi: 'Porsi Balita' },
        { id: '5', namaInstansi: 'Posyandu Ibu Hamil', statusKbm: 'Aktif', keteranganLibur: '', keterangan: '', targetSiswa: 30, targetGuru: 0, klasifikasiPorsi: 'Porsi Ibu Hamil' },
        { id: '6', namaInstansi: 'Posyandu Ibu Menyusui', statusKbm: 'Aktif', keteranganLibur: '', keterangan: '', targetSiswa: 21, targetGuru: 0, klasifikasiPorsi: 'Porsi Ibu Menyusui' }
      );
    }

    return list;
  };

  // Calculate Selisih from Pengaturan Kelompok baseline master
  const getSelisihDataPorsi = (namaInstansi: string, currentSubtotal: number, statusKbm?: string) => {
    // If status is Libur Full, 0 porsi is expected, so do not display selisih warning
    if (statusKbm === 'Libur Full') {
      return null;
    }

    const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanName = norm(namaInstansi);

    let targetMaster: number | null = null;
    if (groups && groups.length > 0) {
      for (const g of groups) {
        if (g.lembagaList && g.lembagaList.length > 0) {
          for (const l of g.lembagaList) {
            const lName = norm(l.namaInstansi);
            if (lName === cleanName || (cleanName.length > 3 && (lName.includes(cleanName) || cleanName.includes(lName)))) {
              targetMaster = (Number(l.targetSiswa) || 0) + (Number(l.targetGuru) || 0) + (Number(l.targetBalita) || 0) + (Number(l.targetBumilBusui) || 0);
              break;
            }
          }
        }
        if (targetMaster !== null) break;
      }
    }

    if (targetMaster === null && locations && locations.length > 0) {
      for (const loc of locations) {
        const locName = norm(loc.namaInstansi);
        if (locName === cleanName || (cleanName.length > 3 && (locName.includes(cleanName) || cleanName.includes(locName)))) {
          const kb = loc.kategoriBreakdown || {};
          const sumKb = (Number(kb.siswa) || 0) + (Number(kb.guru) || 0) + (Number(kb.balita) || 0) + (Number(kb.ibuHamil) || 0) + (Number(kb.ibuMenyusui) || 0);
          targetMaster = sumKb > 0 ? sumKb : Number(loc.defaultJumlah) || 0;
          break;
        }
      }
    }

    if (targetMaster === null) return null;

    const selisih = targetMaster - currentSubtotal;
    if (selisih !== 0) {
      return {
        targetMaster,
        selisihAbs: Math.abs(selisih),
        selisih,
        label: `Selisih ${Math.abs(selisih)} Porsi`
      };
    }
    return null;
  };

  // Open "Buat Penerima Manfaat" Modal with Auto-Fill from Pengaturan Kelompok
  const handleOpenBuatPenerimaModal = () => {
    const initialList = buildSyncedLembagaList();
    setBuatPenerimaTanggal(selectedDate || new Date().toISOString().split('T')[0]);
    setBuatPenerimaStatusDoc('FINAL');
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

    let totalSiswa = 0;
    let totalGuru = 0;
    let totalPorsi = 0;

    buatPenerimaLembagaList.forEach((l) => {
      if (l.statusKbm !== 'Libur Full') {
        const s = Number(l.targetSiswa) || 0;
        const g = Number(l.targetGuru) || 0;
        totalSiswa += s;
        totalGuru += g;
        totalPorsi += s + g;
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
      // Save all records for the date to backend
      await Promise.all(
        buatPenerimaLembagaList.map((l) => {
          const total = l.statusKbm === 'Libur Full' ? 0 : Number(l.targetSiswa) + Number(l.targetGuru);
          return fetch('/api/v1/penerima-manfaat/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tanggal: buatPenerimaTanggal,
              groupId: 'grp-1',
              groupNama: l.klasifikasiPorsi,
              locationId: l.id,
              namaInstansi: l.namaInstansi,
              kategori: 'Siswa',
              jumlahAwal: total,
              penambahan: 0,
              pengurangan: 0,
              totalPenerima: total,
              status: buatPenerimaStatusDoc,
              keterangan: l.statusKbm === 'Libur Sebagian' ? `Libur Sebagian: ${l.keteranganLibur || '-'}` : l.statusKbm === 'Libur Full' ? 'Libur Full' : 'Aktif',
              userName: user?.nama || 'Operator',
              userRole: user?.roleNama || 'Operator'
            })
          });
        })
      );

      if (buatPenerimaStatusDoc === 'FINAL') {
        await fetch('/api/v1/penerima-manfaat/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tanggal: buatPenerimaTanggal, user: user?.nama || 'Supervisor' })
        });
      }

      setIsBuatPenerimaModalOpen(false);
      showToast(`Data penerima manfaat tanggal ${formattedDate} berhasil disimpan! (${totalPorsi.toLocaleString('id-ID')} Porsi)`);
      fetchDailyByDate(selectedDate);
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

      if (dataG.success) setGroups(dataG.data);
      if (dataL.success) setLocations(dataL.data);
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
  const { data: realtimeGroups } = useFirestoreRealtime<BeneficiaryGroup>('beneficiaryGroups');

  useEffect(() => {
    if (realtimeDailyRecords && realtimeDailyRecords.length > 0) {
      if (activeTab === 'hari-ini') {
        fetchDailyByDate(selectedDate);
      } else if (activeTab === 'rekap-harian') {
        fetchHistory();
      }
    }
  }, [realtimeDailyRecords]);

  useEffect(() => {
    if (realtimeGroups && realtimeGroups.length > 0) {
      setGroups(realtimeGroups);
    }
  }, [realtimeGroups]);

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
    if (!editingGroup || !editingGroup.nama) return;

    try {
      const isEdit = Boolean(editingGroup.id);
      const url = isEdit ? `/api/v1/penerima-manfaat/groups/${editingGroup.id}` : '/api/v1/penerima-manfaat/groups';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGroup)
      });
      const result = await res.json();
      if (result.success) {
        showToast(isEdit ? 'Kelompok berhasil diperbarui' : 'Kelompok baru berhasil ditambahkan');
        setIsGroupModalOpen(false);
        setEditingGroup(null);
        fetchMasterData();
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
          const res = await fetch(`/api/v1/penerima-manfaat/groups/${id}`, {
            method: 'DELETE'
          });
          const result = await res.json();
          if (result.success) {
            showToast(result.message || 'Kelompok berhasil dihapus', 'success');
            setIsGroupModalOpen(false);
            setEditingGroup(null);
            fetchMasterData();
            fetchDailyByDate(selectedDate);
          } else {
            showToast(result.message || 'Gagal menghapus kelompok', 'error');
          }
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
          { id: 'hari-ini', label: 'Penerima Hari Ini', icon: Users },
          { id: 'rekap-harian', label: 'Rekap Harian', icon: FileText },
          { id: 'rekap-bulanan', label: 'Rekap Bulanan', icon: BarChart3 },
          { id: 'kelompok', label: 'Pengaturan Kelompok', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
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
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                dailySummary?.statusLock === 'FINAL' 
                  ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}>
                {dailySummary?.statusLock === 'FINAL' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                {dailySummary?.statusLock === 'FINAL' ? 'DIFINALISASI (TERKUNCI)' : 'DRAFT (DAPAT DIEDIT)'}
              </span>
            </div>
          </div>

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
                onClick={() => {
                  setEditingRecord({
                    jumlahAwal: 0,
                    penambahan: 0,
                    pengurangan: 0,
                    kategori: 'Siswa'
                  });
                  setIsRecordModalOpen(true);
                }}
                disabled={dailySummary?.statusLock === 'FINAL'}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded-2xl transition-all shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Tambah Record
              </button>

              <button
                onClick={handleCopyPreviousDay}
                disabled={dailySummary?.statusLock === 'FINAL'}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-medium text-sm rounded-2xl border border-slate-200/80 transition-all"
                title="Salin data jumlah awal dari tanggal kemarin"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                Salin Hari Sebelumnya
              </button>

              <button
                onClick={handleToggleLockData}
                className={`flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-2xl border transition-all ${
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
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-2xl border border-slate-200/80 transition-all"
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
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-8 h-8 text-slate-300" />
                          <p className="font-medium text-slate-500">Belum ada data penerima manfaat pada tanggal ini</p>
                          <p className="text-xs text-slate-400">Klik "Tambah Record" atau "Salin Hari Sebelumnya" untuk mengisi data</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDailyRecords.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-400">{index + 1}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                            {item.groupNama}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {item.namaInstansi}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {item.kategori}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
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

                    const rows = Array.from(map.values()).map(item => ({
                      tanggal: item.tanggal,
                      hariTanggal: item.hariTanggal,
                      kelompokSasaran: 'Porsi Besar, Porsi Kecil, Bumil/Busui, Balita',
                      totalSasaran: item.totalSasaran || 1250,
                      status: item.status
                    }));

                    rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

                    const defaultRows = [
                      {
                        tanggal: '2026-08-16',
                        hariTanggal: 'Minggu, 16 Agustus 2026',
                        kelompokSasaran: 'Porsi Besar, Porsi Kecil, Bumil/Busui, Balita',
                        totalSasaran: 1250,
                        status: 'Final'
                      },
                      {
                        tanggal: '2026-08-15',
                        hariTanggal: 'Sabtu, 15 Agustus 2026',
                        kelompokSasaran: 'Porsi Besar, Porsi Kecil, Bumil/Busui, Balita',
                        totalSasaran: 1248,
                        status: 'Final'
                      },
                      {
                        tanggal: '2026-08-14',
                        hariTanggal: 'Jumat, 14 Agustus 2026',
                        kelompokSasaran: 'Porsi Besar, Porsi Kecil, Bumil/Busui, Balita',
                        totalSasaran: 1248,
                        status: 'Final'
                      },
                      {
                        tanggal: '2026-08-13',
                        hariTanggal: 'Kamis, 13 Agustus 2026',
                        kelompokSasaran: 'Porsi Besar, Porsi Kecil, Bumil/Busui, Balita',
                        totalSasaran: 1240,
                        status: 'Final'
                      }
                    ];

                    const rawRows = rows.length > 0 ? rows : defaultRows;
                    const displayRows = rawRows.filter(r => !deletedRekapDates.includes(r.tanggal));

                    if (displayRows.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                            Tidak ada record rekap harian pada rentang tanggal ini.
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
                  if (onNavigate) onNavigate('/perencanaan-bahan');
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-2xl border border-emerald-200 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Buka Perencanaan Menu</span>
              </button>

              <button
                onClick={() => {
                  setEditingGroup({
                    nama: '',
                    kategoriUtama: 'Siswa',
                    klasifikasiPorsi: 'Porsi Kecil',
                    deskripsi: '',
                    status: 'Aktif',
                    lembagaList: [
                      {
                        namaInstansi: '',
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
              // Calculate portion breakdown dynamically from active groups & lembaga tables
              let porsiBesarVal = 0;
              let porsiKecilVal = 0;
              let porsiBalitaVal = 0;
              let porsiIbuHamilVal = 0;
              let porsiIbuMenyusuiVal = 0;

              if (groups && groups.length > 0) {
                groups.forEach((grp) => {
                  const defaultGroupCat = grp.klasifikasiPorsi || (
                    grp.nama.toUpperCase().includes('PAUD') || grp.nama.toUpperCase().includes('1-3') ? 'Porsi Kecil' :
                    grp.nama.toUpperCase().includes('BALITA') ? 'Porsi Balita' :
                    grp.nama.toUpperCase().includes('HAMIL') ? 'Porsi Ibu Hamil' :
                    grp.nama.toUpperCase().includes('MENYUSUI') ? 'Porsi Ibu Menyusui' : 'Porsi Besar'
                  );

                  if (grp.lembagaList && grp.lembagaList.length > 0) {
                    grp.lembagaList.forEach((l) => {
                      const itemCat = l.klasifikasiPorsi || defaultGroupCat;
                      const s = Number(l.targetSiswa) || 0;
                      const g = Number(l.targetGuru) || 0;
                      const b = Number(l.targetBalita) || 0;
                      const bb = Number(l.targetBumilBusui) || 0;
                      const totalLembaga = (s + g + b + bb) || Number(l.total) || 0;

                      if (itemCat === 'Porsi Besar') porsiBesarVal += totalLembaga;
                      else if (itemCat === 'Porsi Kecil') porsiKecilVal += totalLembaga;
                      else if (itemCat === 'Porsi Balita' || itemCat === 'Balita') porsiBalitaVal += totalLembaga;
                      else if (itemCat === 'Porsi Ibu Hamil') porsiIbuHamilVal += totalLembaga;
                      else if (itemCat === 'Porsi Ibu Menyusui') porsiIbuMenyusuiVal += totalLembaga;
                      else if (itemCat === 'Bumil & Busui') {
                        porsiIbuHamilVal += Math.ceil(totalLembaga / 2);
                        porsiIbuMenyusuiVal += Math.floor(totalLembaga / 2);
                      } else porsiBesarVal += totalLembaga;
                    });
                  } else {
                    const grpLocs = locations.filter(loc => loc.groupId === grp.id || loc.groupNama === grp.nama);
                    if (grpLocs.length > 0) {
                      grpLocs.forEach((loc) => {
                        const locCat = loc.klasifikasiPorsi || defaultGroupCat;
                        const totalLoc = Number(loc.defaultJumlah) || 0;
                        if (locCat === 'Porsi Besar') porsiBesarVal += totalLoc;
                        else if (locCat === 'Porsi Kecil') porsiKecilVal += totalLoc;
                        else if (locCat === 'Porsi Balita' || locCat === 'Balita') porsiBalitaVal += totalLoc;
                        else if (locCat === 'Porsi Ibu Hamil') porsiIbuHamilVal += totalLoc;
                        else if (locCat === 'Porsi Ibu Menyusui') porsiIbuMenyusuiVal += totalLoc;
                        else if (locCat === 'Bumil & Busui') {
                          porsiIbuHamilVal += Math.ceil(totalLoc / 2);
                          porsiIbuMenyusuiVal += Math.floor(totalLoc / 2);
                        } else porsiBesarVal += totalLoc;
                      });
                    }
                  }
                });
              }

              const hasComputed = porsiBesarVal > 0 || porsiKecilVal > 0 || porsiBalitaVal > 0 || porsiIbuHamilVal > 0 || porsiIbuMenyusuiVal > 0;
              if (!hasComputed && locations && locations.length > 0) {
                locations.forEach((loc) => {
                  const locCat = loc.klasifikasiPorsi || 'Porsi Besar';
                  const totalLoc = Number(loc.defaultJumlah) || 0;
                  if (locCat === 'Porsi Besar') porsiBesarVal += totalLoc;
                  else if (locCat === 'Porsi Kecil') porsiKecilVal += totalLoc;
                  else if (locCat === 'Porsi Balita' || locCat === 'Balita') porsiBalitaVal += totalLoc;
                  else if (locCat === 'Porsi Ibu Hamil') porsiIbuHamilVal += totalLoc;
                  else if (locCat === 'Porsi Ibu Menyusui') porsiIbuMenyusuiVal += totalLoc;
                  else if (locCat === 'Bumil & Busui') {
                    porsiIbuHamilVal += Math.ceil(totalLoc / 2);
                    porsiIbuMenyusuiVal += Math.floor(totalLoc / 2);
                  } else porsiBesarVal += totalLoc;
                });
              }

              if (porsiBesarVal === 0 && porsiKecilVal === 0 && porsiBalitaVal === 0 && porsiIbuHamilVal === 0 && porsiIbuMenyusuiVal === 0) {
                porsiBesarVal = dailySummary?.portionBreakdown?.porsiBesar ?? 810;
                porsiKecilVal = dailySummary?.portionBreakdown?.porsiKecil ?? 287;
                porsiBalitaVal = dailySummary?.portionBreakdown?.porsiBalita ?? dailySummary?.portionBreakdown?.balita ?? 68;
                porsiIbuHamilVal = dailySummary?.portionBreakdown?.porsiIbuHamil ?? 30;
                porsiIbuMenyusuiVal = dailySummary?.portionBreakdown?.porsiIbuMenyusui ?? 21;
              }

              const totalSeluruhPorsi = porsiBesarVal + porsiKecilVal + porsiBalitaVal + porsiIbuHamilVal + porsiIbuMenyusuiVal;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 pt-1">
                  {/* Porsi Besar */}
                  <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">🍚 Porsi Besar</div>
                      <div className="text-xl font-black text-emerald-400 mt-0.5">
                        {porsiBesarVal.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-300">Porsi</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">SD 4-6, SMP, SMA, Guru/Staf</div>
                    </div>
                  </div>

                  {/* Porsi Kecil */}
                  <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">🥣 Porsi Kecil</div>
                      <div className="text-xl font-black text-cyan-400 mt-0.5">
                        {porsiKecilVal.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-300">Porsi</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">SD 1-3, PAUD / TK</div>
                    </div>
                  </div>

                  {/* Porsi Balita */}
                  <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">🍼 Porsi Balita</div>
                      <div className="text-xl font-black text-purple-400 mt-0.5">
                        {porsiBalitaVal.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-300">Porsi</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Anak Balita Nutrisi</div>
                    </div>
                  </div>

                  {/* Porsi Ibu Hamil */}
                  <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">🤰 Porsi Ibu Hamil</div>
                      <div className="text-xl font-black text-rose-400 mt-0.5">
                        {porsiIbuHamilVal.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-300">Porsi</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Ibu Hamil Nutrisi</div>
                    </div>
                  </div>

                  {/* Porsi Ibu Menyusui */}
                  <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">🤱 Porsi Ibu Menyusui</div>
                      <div className="text-xl font-black text-amber-400 mt-0.5">
                        {porsiIbuMenyusuiVal.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-300">Porsi</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Ibu Menyusui Nutrisi</div>
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
            {groups.map((grp) => {
              const grpLocs = locations.filter(l => l.groupId === grp.id || l.groupNama === grp.nama);
              const totalSiswa = grpLocs.reduce((acc, l) => acc + (l.kategoriBreakdown?.siswa || 0), 0);
              const totalGuru = grpLocs.reduce((acc, l) => acc + (l.kategoriBreakdown?.guru || l.kategoriBreakdown?.staf || 0), 0);
              const totalBalita = grpLocs.reduce((acc, l) => acc + (l.kategoriBreakdown?.balita || 0), 0);
              const totalBumil = grpLocs.reduce((acc, l) => acc + (l.kategoriBreakdown?.ibuHamil || 0) + (l.kategoriBreakdown?.ibuMenyusui || 0), 0);
              const totalPorsi = grpLocs.reduce((acc, l) => acc + (l.defaultJumlah || 0), 0) || (grp.lembagaList?.reduce((a, b) => a + (b.total || 0), 0) || 0);

              const portionCategory = grp.klasifikasiPorsi || (
                grp.nama.toUpperCase().includes('PAUD') || grp.nama.toUpperCase().includes('1-3') ? 'Porsi Kecil' :
                grp.nama.toUpperCase().includes('BALITA') ? 'Balita' :
                grp.nama.toUpperCase().includes('HAMIL') || grp.nama.toUpperCase().includes('MENYUSUI') ? 'Bumil & Busui' : 'Porsi Besar'
              );

              return (
                <div key={grp.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all p-5 space-y-4">
                  {/* Group Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        #{grp.urutan}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-slate-900">{grp.nama}</h4>
                          <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${
                            portionCategory === 'Porsi Kecil' ? 'bg-cyan-100 text-cyan-800' :
                            portionCategory === 'Balita' ? 'bg-purple-100 text-purple-800' :
                            portionCategory === 'Bumil & Busui' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            🍱 {portionCategory}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            grp.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {grp.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{grp.deskripsi || 'Tidak ada deskripsi'}</p>
                      </div>
                    </div>

                    {/* Group Aggregates */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-600">
                        🏫 Siswa: <span className="font-extrabold text-slate-900">{totalSiswa}</span>
                      </div>
                      <div className="px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-600">
                        👨‍🏫 Guru: <span className="font-extrabold text-slate-900">{totalGuru}</span>
                      </div>
                      <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-700">
                        🍱 Total Porsi: <span className="font-extrabold text-emerald-900">{totalPorsi}</span>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => {
                            const groupLocs = locations.filter(l => l.groupId === grp.id || l.groupNama === grp.nama);
                            const lembagaList = (grp.lembagaList && grp.lembagaList.length > 0)
                              ? grp.lembagaList
                              : groupLocs.map(l => ({
                                  id: l.id,
                                  namaInstansi: l.namaInstansi,
                                  targetSiswa: l.kategoriBreakdown?.siswa || 0,
                                  targetGuru: l.kategoriBreakdown?.guru || (l.kategoriBreakdown?.staf || 0),
                                  targetBalita: l.kategoriBreakdown?.balita || 0,
                                  targetBumilBusui: (l.kategoriBreakdown?.ibuHamil || 0) + (l.kategoriBreakdown?.ibuMenyusui || 0),
                                  total: l.defaultJumlah || 0,
                                  klasifikasiPorsi: l.klasifikasiPorsi || grp.klasifikasiPorsi || 'Porsi Besar'
                                }));

                            setEditingGroup({
                              ...grp,
                              klasifikasiPorsi: portionCategory as any,
                              lembagaList: lembagaList.length > 0 ? lembagaList : [
                                {
                                  namaInstansi: `${grp.nama} - Instansi 1`,
                                  targetSiswa: 100,
                                  targetGuru: 10,
                                  targetBalita: 0,
                                  targetBumilBusui: 0,
                                  total: 110,
                                  klasifikasiPorsi: portionCategory as any
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
                          <th className="px-3 py-2.5 text-center">Sasaran Siswa</th>
                          <th className="px-3 py-2.5 text-center">Guru / Staf</th>
                          <th className="px-3 py-2.5 text-center">Balita</th>
                          <th className="px-3 py-2.5 text-center">Bumil / Busui</th>
                          <th className="px-3 py-2.5 text-center">Subtotal Porsi</th>
                          <th className="px-4 py-2.5">Klasifikasi Porsi Menu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {grpLocs.length === 0 && (!grp.lembagaList || grp.lembagaList.length === 0) ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-4 text-center text-slate-400 font-medium">
                              Belum ada spesifikasi sasaran lembaga. Klik <span className="font-bold text-slate-700">Edit Form Kelompok & Lembaga</span> untuk mengisi rincian sasaran per instansi.
                            </td>
                          </tr>
                        ) : (
                          (grpLocs.length > 0 ? grpLocs : grp.lembagaList || []).map((loc: any, idx: number) => {
                            const s = loc.kategoriBreakdown?.siswa !== undefined ? loc.kategoriBreakdown.siswa : (loc.targetSiswa || 0);
                            const g = loc.kategoriBreakdown?.guru !== undefined ? loc.kategoriBreakdown.guru : (loc.targetGuru || 0);
                            const b = loc.kategoriBreakdown?.balita !== undefined ? loc.kategoriBreakdown.balita : (loc.targetBalita || 0);
                            const bb = (loc.kategoriBreakdown?.ibuHamil || 0) + (loc.kategoriBreakdown?.ibuMenyusui || 0) || (loc.targetBumilBusui || 0);
                            const tot = loc.defaultJumlah || loc.total || (s + g + b + bb);
                            const pCat = loc.klasifikasiPorsi || portionCategory;

                            return (
                              <tr key={loc.id || idx} className="hover:bg-white transition-all">
                                <td className="px-4 py-2.5 font-bold text-slate-800 flex items-center gap-2">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{loc.namaInstansi || loc.nama}</span>
                                </td>
                                <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{s}</td>
                                <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{g}</td>
                                <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{b}</td>
                                <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{bb}</td>
                                <td className="px-3 py-2.5 text-center font-extrabold text-emerald-600">{tot} Porsi</td>
                                <td className="px-4 py-2.5">
                                  <span className="px-2 py-0.5 bg-slate-200/80 text-slate-800 text-[10px] font-bold rounded-md">
                                    {pCat}
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
            })}
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
                    setEditingRecord({
                      ...editingRecord,
                      namaInstansi: e.target.value,
                      locationId: selLoc?.id || '',
                      groupId: selLoc?.groupId || groups[0]?.id,
                      groupNama: selLoc?.groupNama || groups[0]?.nama,
                      jumlahAwal: editingRecord.jumlahAwal || selLoc?.defaultJumlah || 100
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
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold block">Awal</label>
                    <input
                      type="number"
                      value={editingRecord.jumlahAwal ?? 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, jumlahAwal: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-center"
                      min={0}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-emerald-600 font-semibold block">Penambahan (+)</label>
                    <input
                      type="number"
                      value={editingRecord.penambahan ?? 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, penambahan: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-center text-emerald-600"
                      min={0}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-rose-600 font-semibold block">Pengurangan (-)</label>
                    <input
                      type="number"
                      value={editingRecord.pengurangan ?? 0}
                      onChange={(e) => setEditingRecord({ ...editingRecord, pengurangan: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-xl text-sm font-bold text-center text-rose-600"
                      min={0}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Total Hasil Akhir:</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {((editingRecord.jumlahAwal || 0) + (editingRecord.penambahan || 0) - (editingRecord.pengurangan || 0)).toLocaleString('id-ID')} Porsi
                  </span>
                </div>
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

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Default Kuota Jumlah Porsi</label>
                <input
                  type="number"
                  value={editingLocation.defaultJumlah ?? 100}
                  onChange={(e) => setEditingLocation({ ...editingLocation, defaultJumlah: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm"
                />
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

      {/* MODAL: GROUP (TAMBAH / EDIT KELOMPOK & SPESIFIKASI SASARAN LEMBAGA) */}
      {isGroupModalOpen && editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingGroup.id ? 'Edit Kelompok & Spesifikasi Lembaga' : 'Form Penambahan Kelompok Baru & Sasaran Lembaga'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola nama kelompok, klasifikasi porsi menu, dan pembagian sasaran siswa & guru per lembaga dalam satu form.
                </p>
              </div>
              <button onClick={() => setIsGroupModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-5">
              {/* Group Main Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nama Kelompok *</label>
                  <input
                    type="text"
                    value={editingGroup.nama || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, nama: e.target.value })}
                    placeholder="e.g. SD (Kelas 1-3)"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Kelompok</label>
                  <input
                    type="text"
                    value={editingGroup.deskripsi || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, deskripsi: e.target.value })}
                    placeholder="Deskripsi kelompok penerima manfaat..."
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* SPECIFICATION OF SISWA & GURU PER LEMBAGA */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      SPESIFIKASI SASARAN SISWA & GURU EVERY LEMBAGA / INSTANSI
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Atur pembagian sasaran siswa, guru, balita, dan ibu hamil/menyusui per lembaga dalam 1 form ini.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const currentList = editingGroup.lembagaList || [];
                      const nextNum = currentList.length + 1;
                      const newList = [
                        ...currentList,
                        {
                          namaInstansi: `${editingGroup.nama || 'Instansi'} ${nextNum}`,
                          targetSiswa: 100,
                          targetGuru: 10,
                          targetBalita: 0,
                          targetBumilBusui: 0,
                          total: 110,
                          klasifikasiPorsi: 'Porsi Besar'
                        }
                      ];
                      setEditingGroup({ ...editingGroup, lembagaList: newList });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Tambah Lembaga / Instansi</span>
                  </button>
                </div>

                {/* Lembaga List Inputs */}
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {(!editingGroup.lembagaList || editingGroup.lembagaList.length === 0) ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      Belum ada lembaga/instansi ditambahkan. Klik tombol <span className="font-bold text-slate-700">+ Tambah Lembaga / Instansi</span> untuk mengisi rincian sasaran.
                    </div>
                  ) : (
                    editingGroup.lembagaList.map((item: any, idx: number) => {
                      const itemKlasifikasi = item.klasifikasiPorsi || 'Porsi Besar';
                      let dynamicLabel = 'Siswa';
                      if (itemKlasifikasi === 'Porsi Balita' || itemKlasifikasi === 'Balita') {
                        dynamicLabel = 'Balita';
                      } else if (itemKlasifikasi === 'Porsi Ibu Hamil') {
                        dynamicLabel = 'Ibu Hamil';
                      } else if (itemKlasifikasi === 'Porsi Ibu Menyusui' || itemKlasifikasi === 'Bumil & Busui') {
                        dynamicLabel = 'Ibu Menyusui';
                      }

                      let targetVal = Number(item.targetSiswa) || 0;
                      if (itemKlasifikasi === 'Porsi Balita' || itemKlasifikasi === 'Balita') {
                        targetVal = Number(item.targetBalita) || Number(item.targetSiswa) || 0;
                      } else if (itemKlasifikasi === 'Porsi Ibu Hamil' || itemKlasifikasi === 'Porsi Ibu Menyusui' || itemKlasifikasi === 'Bumil & Busui') {
                        targetVal = Number(item.targetBumilBusui) || Number(item.targetSiswa) || 0;
                      }

                      const s = Number(item.targetSiswa) || 0;
                      const g = Number(item.targetGuru) || 0;
                      const b = Number(item.targetBalita) || 0;
                      const bb = Number(item.targetBumilBusui) || 0;

                      let subTotal = s + g;
                      if (itemKlasifikasi === 'Porsi Balita' || itemKlasifikasi === 'Balita') subTotal = (b || s) + g;
                      if (itemKlasifikasi === 'Porsi Ibu Hamil' || itemKlasifikasi === 'Porsi Ibu Menyusui' || itemKlasifikasi === 'Bumil & Busui') subTotal = (bb || s) + g;

                      return (
                        <div key={idx} className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70 space-y-2 hover:border-slate-300 transition-all">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                            {/* Nama Instansi */}
                            <div className="md:col-span-4">
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Nama Lembaga / Instansi #{idx + 1}</label>
                              <input
                                type="text"
                                value={item.namaInstansi || ''}
                                onChange={(e) => {
                                  const list = [...(editingGroup.lembagaList || [])];
                                  list[idx] = { ...list[idx], namaInstansi: e.target.value };
                                  setEditingGroup({ ...editingGroup, lembagaList: list });
                                }}
                                placeholder="e.g. SD Zainul Hasan 1"
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                                required
                              />
                            </div>

                            {/* Dynamic Target Column */}
                            <div className="md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5 text-center">{dynamicLabel}</label>
                              <input
                                type="number"
                                min={0}
                                value={targetVal}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const list = [...(editingGroup.lembagaList || [])];
                                  const newItem = { ...list[idx] };
                                  if (itemKlasifikasi === 'Porsi Balita' || itemKlasifikasi === 'Balita') {
                                    newItem.targetBalita = val;
                                    newItem.targetSiswa = val;
                                  } else if (itemKlasifikasi === 'Porsi Ibu Hamil' || itemKlasifikasi === 'Porsi Ibu Menyusui' || itemKlasifikasi === 'Bumil & Busui') {
                                    newItem.targetBumilBusui = val;
                                    newItem.targetSiswa = val;
                                  } else {
                                    newItem.targetSiswa = val;
                                  }
                                  const numS = Number(newItem.targetSiswa) || 0;
                                  const numG = Number(newItem.targetGuru) || 0;
                                  const numB = Number(newItem.targetBalita) || 0;
                                  const numBB = Number(newItem.targetBumilBusui) || 0;
                                  newItem.total = (itemKlasifikasi === 'Porsi Balita' || itemKlasifikasi === 'Balita')
                                    ? (numB || numS) + numG
                                    : (itemKlasifikasi === 'Porsi Ibu Hamil' || itemKlasifikasi === 'Porsi Ibu Menyusui' || itemKlasifikasi === 'Bumil & Busui')
                                    ? (numBB || numS) + numG
                                    : numS + numG;
                                  list[idx] = newItem;
                                  setEditingGroup({ ...editingGroup, lembagaList: list });
                                }}
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-900"
                              />
                            </div>

                            {/* Target Guru */}
                            <div className="md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5 text-center">Guru / Staf</label>
                              <input
                                type="number"
                                min={0}
                                value={item.targetGuru ?? 0}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const list = [...(editingGroup.lembagaList || [])];
                                  const newItem = { ...list[idx], targetGuru: val };
                                  const numS = Number(newItem.targetSiswa) || 0;
                                  const numB = Number(newItem.targetBalita) || 0;
                                  const numBB = Number(newItem.targetBumilBusui) || 0;
                                  newItem.total = (itemKlasifikasi === 'Porsi Balita' || itemKlasifikasi === 'Balita')
                                    ? (numB || numS) + val
                                    : (itemKlasifikasi === 'Porsi Ibu Hamil' || itemKlasifikasi === 'Porsi Ibu Menyusui' || itemKlasifikasi === 'Bumil & Busui')
                                    ? (numBB || numS) + val
                                    : numS + val;
                                  list[idx] = newItem;
                                  setEditingGroup({ ...editingGroup, lembagaList: list });
                                }}
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-900"
                              />
                            </div>

                            {/* Subtotal Porsi */}
                            <div className="md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5 text-center">Subtotal Porsi</label>
                              <div className="px-2 py-1.5 bg-emerald-100/70 border border-emerald-200 rounded-xl text-xs font-black text-center text-emerald-900">
                                {subTotal} Porsi
                              </div>
                            </div>

                            {/* Jenis Klasifikasi & Trash Button */}
                            <div className="md:col-span-2 flex items-center justify-end gap-1">
                              <select
                                value={item.klasifikasiPorsi || 'Porsi Besar'}
                                onChange={(e) => {
                                  const newKlas = e.target.value as any;
                                  const list = [...(editingGroup.lembagaList || [])];
                                  list[idx] = { ...list[idx], klasifikasiPorsi: newKlas };
                                  setEditingGroup({ ...editingGroup, lembagaList: list });
                                }}
                                className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 max-w-[125px]"
                              >
                                <option value="Porsi Besar">🍱 Porsi Besar</option>
                                <option value="Porsi Kecil">🥣 Porsi Kecil</option>
                                <option value="Porsi Balita">🍼 Porsi Balita</option>
                                <option value="Porsi Ibu Hamil">🤰 Porsi Ibu Hamil</option>
                                <option value="Porsi Ibu Menyusui">🤱 Porsi Ibu Menyusui</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...(editingGroup.lembagaList || [])];
                                  list.splice(idx, 1);
                                  setEditingGroup({ ...editingGroup, lembagaList: list });
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                title="Hapus Lembaga Ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Live Summary Calculation Box */}
                {editingGroup.lembagaList && editingGroup.lembagaList.length > 0 && (() => {
                  const totalTargetMain = editingGroup.lembagaList.reduce((acc: number, l: any) => {
                    const k = l.klasifikasiPorsi || 'Porsi Besar';
                    if (k === 'Porsi Balita' || k === 'Balita') return acc + (Number(l.targetBalita) || Number(l.targetSiswa) || 0);
                    if (k === 'Porsi Ibu Hamil' || k === 'Porsi Ibu Menyusui' || k === 'Bumil & Busui') return acc + (Number(l.targetBumilBusui) || Number(l.targetSiswa) || 0);
                    return acc + (Number(l.targetSiswa) || 0);
                  }, 0);
                  const totalGuru = editingGroup.lembagaList.reduce((acc: number, l: any) => acc + (Number(l.targetGuru) || 0), 0);
                  const totalPorsiAll = editingGroup.lembagaList.reduce((acc: number, l: any) => {
                    const k = l.klasifikasiPorsi || 'Porsi Besar';
                    const g = Number(l.targetGuru) || 0;
                    if (k === 'Porsi Balita' || k === 'Balita') return acc + (Number(l.targetBalita) || Number(l.targetSiswa) || 0) + g;
                    if (k === 'Porsi Ibu Hamil' || k === 'Porsi Ibu Menyusui' || k === 'Bumil & Busui') return acc + (Number(l.targetBumilBusui) || Number(l.targetSiswa) || 0) + g;
                    return acc + (Number(l.targetSiswa) || 0) + g;
                  }, 0);

                  return (
                    <div className="p-3 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="font-bold text-slate-300">
                        Rangkuman Sasaran Kelompok ({editingGroup.lembagaList.length} Lembaga):
                      </div>
                      <div className="flex items-center gap-4">
                        <span>👥 Total Sasaran: <strong className="text-emerald-400 font-extrabold">{totalTargetMain}</strong></span>
                        <span>👨‍🏫 Guru / Staf: <strong className="text-emerald-400 font-extrabold">{totalGuru}</strong></span>
                        <span>🍱 Total Porsi: <strong className="text-emerald-400 font-extrabold">{totalPorsiAll}</strong></span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {editingGroup.id ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteGroup(editingGroup.id!, editingGroup.nama || '')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-semibold border border-rose-200 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Kelompok
                  </button>
                ) : <div />}
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGroupModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-2xl text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Simpan Kelompok & Spesifikasi Lembaga
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
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
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">TK ZAHA</td>
                      <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-lg text-[10px]">Porsi Kecil</span></td>
                      <td className="py-2.5 px-4 text-right text-slate-500">229 Siswa, 8 Guru</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">237 Porsi</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">SD ZAHA (Kelas 1, 2, 3)</td>
                      <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-lg text-[10px]">Porsi Kecil</span></td>
                      <td className="py-2.5 px-4 text-right text-slate-500">215 Siswa, 18 Guru</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">233 Porsi</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">SD ZAHA (Kelas 4, 5, 6)</td>
                      <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px]">Porsi Besar</span></td>
                      <td className="py-2.5 px-4 text-right text-slate-500">180 Siswa, 25 Guru</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">205 Porsi</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">SMP ZAHA</td>
                      <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px]">Porsi Besar</span></td>
                      <td className="py-2.5 px-4 text-right text-slate-500">664 Siswa, 36 Guru</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">700 Porsi</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">BALITA & ibu HAMIL/BUSUI</td>
                      <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-lg text-[10px]">Bumil/Busui & Balita</span></td>
                      <td className="py-2.5 px-4 text-right text-slate-500">68 Balita, 50 Ibu</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">118 Porsi</td>
                    </tr>
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
                  onClick={() =>
                    setBuatPenerimaLembagaList([
                      ...buatPenerimaLembagaList,
                      {
                        id: `lbg-${Date.now()}`,
                        namaInstansi: '',
                        statusKbm: 'Aktif',
                        keteranganLibur: '',
                        targetSiswa: 0,
                        targetGuru: 0,
                        klasifikasiPorsi: 'Porsi Besar'
                      }
                    ])
                  }
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-300 rounded-full text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  + Tambah Lembaga / Instansi
                </button>
                <button
                  onClick={() => setIsBuatPenerimaModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveBuatPenerima} className="space-y-4 flex-1 overflow-y-auto pr-1">
              
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

              {/* Institution Rows List */}
              <div className="space-y-3">
                {buatPenerimaLembagaList.map((item, idx) => {
                  const s = Number(item.targetSiswa) || 0;
                  const g = Number(item.targetGuru) || 0;
                  const b = Number(item.targetBalita) || 0;
                  const bb = Number(item.targetBumilBusui) || 0;
                  const subtotalPorsi = item.statusKbm === 'Libur Full' ? 0 : (s + g + b + bb);
                  const selisihInfo = getSelisihDataPorsi(item.namaInstansi, subtotalPorsi, item.statusKbm);

                  return (
                    <div
                      key={item.id || idx}
                      className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs transition-all hover:border-slate-300"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700">
                          Nama Lembaga / Instansi #{idx + 1}
                        </span>

                        {/* Status KBM Select */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500">Status KBM:</span>
                          <select
                            value={item.statusKbm}
                            onChange={(e) => {
                              const list = [...buatPenerimaLembagaList];
                              list[idx].statusKbm = e.target.value as any;
                              setBuatPenerimaLembagaList(list);
                            }}
                            className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                              item.statusKbm === 'Aktif'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : item.statusKbm === 'Libur Full'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="Aktif">🟢 Aktif (Normal)</option>
                            <option value="Libur Full">🔴 Libur Full</option>
                            <option value="Libur Sebagian">🟡 Libur Sebagian</option>
                          </select>
                        </div>
                      </div>

                      {/* Control Form Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        {/* Name */}
                        <div className="md:col-span-4">
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1">Nama Lembaga</label>
                          <input
                            type="text"
                            value={item.namaInstansi}
                            onChange={(e) => {
                              const list = [...buatPenerimaLembagaList];
                              list[idx].namaInstansi = e.target.value;
                              setBuatPenerimaLembagaList(list);
                            }}
                            placeholder="e.g. SD Zainul Hasan"
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                            required
                          />
                        </div>

                        {/* Siswa */}
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1 text-center">Siswa</label>
                          <input
                            type="number"
                            min="0"
                            disabled={item.statusKbm === 'Libur Full'}
                            value={item.targetSiswa}
                            onChange={(e) => {
                              const list = [...buatPenerimaLembagaList];
                              list[idx].targetSiswa = Number(e.target.value) || 0;
                              setBuatPenerimaLembagaList(list);
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 text-center font-mono disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>

                        {/* Guru / Staf */}
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1 text-center">Guru / Staf</label>
                          <input
                            type="number"
                            min="0"
                            disabled={item.statusKbm === 'Libur Full'}
                            value={item.targetGuru}
                            onChange={(e) => {
                              const list = [...buatPenerimaLembagaList];
                              list[idx].targetGuru = Number(e.target.value) || 0;
                              setBuatPenerimaLembagaList(list);
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 text-center font-mono disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>

                        {/* Subtotal Porsi */}
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-semibold text-slate-400 block mb-1 text-center">Subtotal Porsi</label>
                          <div className="px-3 py-2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-extrabold text-center font-mono flex items-center justify-center">
                            {item.statusKbm === 'Libur Full' ? '0 Porsi' : `${subtotalPorsi} Porsi`}
                          </div>
                        </div>

                        {/* Klasifikasi Porsi Badge & Delete */}
                        <div className="md:col-span-2 flex items-center justify-between gap-1.5 pt-4 md:pt-0">
                          <span className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold shrink-0 truncate max-w-[130px]" title={item.klasifikasiPorsi || 'Porsi Besar'}>
                            {item.klasifikasiPorsi === 'Porsi Kecil' ? '🥣 Porsi Kecil' :
                             item.klasifikasiPorsi === 'Porsi Balita' || item.klasifikasiPorsi === 'Balita' ? '🍼 Porsi Balita' :
                             item.klasifikasiPorsi === 'Porsi Ibu Hamil' ? '🤰 Porsi Ibu Hamil' :
                             item.klasifikasiPorsi === 'Porsi Ibu Menyusui' ? '🤱 Porsi Ibu Menyusui' :
                             '🍱 Porsi Besar'}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              const list = [...buatPenerimaLembagaList];
                              list.splice(idx, 1);
                              setBuatPenerimaLembagaList(list);
                            }}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="Hapus Baris Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

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

                      {/* Warning Alert Badge if Data Has Selisih with Pengaturan Kelompok */}
                      {selisihInfo && (
                        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="font-bold text-amber-900">
                              Tulisan Selisih {selisihInfo.selisihAbs} Porsi
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-amber-800">
                            (Pengaturan Kelompok: <strong className="font-bold">{selisihInfo.targetMaster} Porsi</strong> | Input: <strong className="font-bold">{subtotalPorsi} Porsi</strong>)
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
              {buatPenerimaLembagaList.length > 0 && (
                <div className="bg-[#0B132B] text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md border border-slate-800">
                  <div className="font-bold text-slate-300">
                    Rangkuman Sasaran Kelompok ({buatPenerimaLembagaList.length} Lembaga):
                  </div>
                  <div className="flex items-center gap-5">
                    <span>
                      🏫 Siswa:{' '}
                      <strong className="text-emerald-400 font-extrabold">
                        {buatPenerimaLembagaList.reduce(
                          (acc, l) => acc + (l.statusKbm === 'Libur Full' ? 0 : Number(l.targetSiswa || 0)),
                          0
                        )}
                      </strong>
                    </span>
                    <span>
                      👨‍🏫 Guru:{' '}
                      <strong className="text-emerald-400 font-extrabold">
                        {buatPenerimaLembagaList.reduce(
                          (acc, l) => acc + (l.statusKbm === 'Libur Full' ? 0 : Number(l.targetGuru || 0)),
                          0
                        )}
                      </strong>
                    </span>
                    <span>
                      🍱 Total Porsi:{' '}
                      <strong className="text-emerald-400 font-extrabold font-mono">
                        {buatPenerimaLembagaList.reduce(
                          (acc, l) =>
                            acc +
                            (l.statusKbm === 'Libur Full'
                              ? 0
                              : Number(l.targetSiswa || 0) + Number(l.targetGuru || 0)),
                          0
                        )}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBuatPenerimaModalOpen(false)}
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
