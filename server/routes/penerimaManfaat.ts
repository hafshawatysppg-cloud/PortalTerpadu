import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { DailyBeneficiaryRecord, BeneficiaryGroup, BeneficiaryLocation, BeneficiaryAuditLog } from '../../src/types';
import { syncSaveDoc, syncDeleteDoc, syncSaveBatch } from '../db/firestore';

const router = Router();

// Helper to clean and deduplicate groups and locations in memory and Firestore
function cleanDuplicateGroupsAndLocations() {
  // 1. Deduplicate beneficiaryGroups by normalized ID or normalized name
  const uniqueGroups: BeneficiaryGroup[] = [];
  const groupNameMap = new Map<string, BeneficiaryGroup>();

  dbStore.beneficiaryGroups.forEach((g) => {
    const normName = (g.nama || '').trim().toLowerCase();
    if (!normName) return;

    if (groupNameMap.has(normName)) {
      const existing = groupNameMap.get(normName)!;
      // Merge lembagaList if existing has none
      if (Array.isArray(g.lembagaList) && g.lembagaList.length > 0) {
        if (!Array.isArray(existing.lembagaList) || existing.lembagaList.length === 0) {
          existing.lembagaList = g.lembagaList;
        }
      }
      // Delete duplicate document from Firestore if ID differs
      if (g.id !== existing.id) {
        syncDeleteDoc('beneficiaryGroups', g.id);
      }
    } else {
      groupNameMap.set(normName, g);
      uniqueGroups.push(g);
    }
  });

  dbStore.beneficiaryGroups = uniqueGroups;

  // 2. Deduplicate beneficiaryLocations by normalized (groupId + namaInstansi)
  const uniqueLocations: BeneficiaryLocation[] = [];
  const locMap = new Map<string, BeneficiaryLocation>();

  dbStore.beneficiaryLocations.forEach((l) => {
    const key = `${(l.groupId || '').trim().toLowerCase()}::${(l.namaInstansi || '').trim().toLowerCase()}`;
    if (!l.namaInstansi) return;

    if (locMap.has(key)) {
      const existing = locMap.get(key)!;
      if (l.id !== existing.id) {
        syncDeleteDoc('beneficiaryLocations', l.id);
      }
    } else {
      locMap.set(key, l);
      uniqueLocations.push(l);
    }
  });

  dbStore.beneficiaryLocations = uniqueLocations;
}

// 1. GET GROUPS
router.get('/groups', (req: Request, res: Response): void => {
  cleanDuplicateGroupsAndLocations();
  res.json({
    success: true,
    data: dbStore.beneficiaryGroups
  });
});

// Helper for Updating Group & Lembaga List
function updateGroupHandler(id: string, body: any, res: Response) {
  const { nama, kategoriUtama, klasifikasiPorsi, deskripsi, status, lembagaList } = body;
  const idx = dbStore.beneficiaryGroups.findIndex(g => g.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Kelompok tidak ditemukan' });
    return;
  }

  const existingGroup = dbStore.beneficiaryGroups[idx];
  const updatedNama = nama || existingGroup.nama;

  const updatedGroup: BeneficiaryGroup = {
    ...existingGroup,
    nama: updatedNama,
    kategoriUtama: kategoriUtama || existingGroup.kategoriUtama,
    klasifikasiPorsi: klasifikasiPorsi || existingGroup.klasifikasiPorsi,
    deskripsi: deskripsi !== undefined ? deskripsi : existingGroup.deskripsi,
    status: status || existingGroup.status,
    lembagaList: Array.isArray(lembagaList) ? lembagaList : existingGroup.lembagaList
  };

  dbStore.beneficiaryGroups[idx] = updatedGroup;
  syncSaveDoc('beneficiaryGroups', id, updatedGroup);

  // If lembagaList provided, sync locations
  if (Array.isArray(lembagaList)) {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Get existing locations for this group
    const groupLocs = dbStore.beneficiaryLocations.filter(
      l => l.groupId === id || l.groupNama.trim().toLowerCase() === existingGroup.nama.trim().toLowerCase()
    );

    const updatedLocIds = new Set<string>();

    lembagaList.forEach((item: any, lIdx: number) => {
      const targetSiswa = Number(item.targetSiswa) || 0;
      const targetGuru = Number(item.targetGuru) || 0;
      const targetBalita = Number(item.targetBalita) || 0;
      const targetBumilBusui = Number(item.targetBumilBusui) || 0;
      const defaultJumlah = item.total !== undefined ? Number(item.total) : (targetSiswa + targetGuru + targetBalita + targetBumilBusui);

      // Match existing location by item.id, or by namaInstansi, or by position index
      const matchedLoc = groupLocs.find(l => 
        (item.id && l.id === item.id) ||
        (item.namaInstansi && l.namaInstansi.trim().toLowerCase() === item.namaInstansi.trim().toLowerCase())
      ) || groupLocs[lIdx];

      const locId = item.id || matchedLoc?.id || `LOC-${id}-${lIdx + 1}`;
      item.id = locId; // assign ID back into item

      const locData: BeneficiaryLocation = {
        id: locId,
        groupId: id,
        groupNama: updatedNama,
        namaInstansi: item.namaInstansi || `${updatedNama} - Instansi ${lIdx + 1}`,
        klasifikasiPorsi: item.klasifikasiPorsi || klasifikasiPorsi || updatedGroup.klasifikasiPorsi || 'Porsi Besar',
        kategoriBreakdown: {
          siswa: targetSiswa,
          guru: targetGuru,
          balita: targetBalita,
          ibuHamil: Math.floor(targetBumilBusui / 2),
          ibuMenyusui: Math.ceil(targetBumilBusui / 2)
        },
        defaultJumlah: defaultJumlah > 0 ? defaultJumlah : 100,
        status: 'Aktif'
      };

      updatedLocIds.add(locId);

      const existingLocIdx = dbStore.beneficiaryLocations.findIndex(l => l.id === locId);
      if (existingLocIdx !== -1) {
        dbStore.beneficiaryLocations[existingLocIdx] = locData;
      } else {
        dbStore.beneficiaryLocations.push(locData);
      }

      syncSaveDoc('beneficiaryLocations', locId, locData);

      // Sync daily record for today if exists
      const recIdx = dbStore.dailyBeneficiaryRecords.findIndex(
        r => r.tanggal === todayStr && (r.locationId === locId || r.namaInstansi.trim().toLowerCase() === locData.namaInstansi.trim().toLowerCase())
      );

      if (recIdx !== -1) {
        dbStore.dailyBeneficiaryRecords[recIdx].jumlahAwal = locData.defaultJumlah;
        dbStore.dailyBeneficiaryRecords[recIdx].totalPenerima = locData.defaultJumlah + dbStore.dailyBeneficiaryRecords[recIdx].penambahan - dbStore.dailyBeneficiaryRecords[recIdx].pengurangan;
        syncSaveDoc('dailyBeneficiaryRecords', dbStore.dailyBeneficiaryRecords[recIdx].id, dbStore.dailyBeneficiaryRecords[recIdx]);
      }
    });

    // Remove any orphaned locations belonging to this group that are no longer in lembagaList
    const orphanedLocs = groupLocs.filter(l => !updatedLocIds.has(l.id));
    orphanedLocs.forEach(o => {
      const oIdx = dbStore.beneficiaryLocations.findIndex(l => l.id === o.id);
      if (oIdx !== -1) {
        dbStore.beneficiaryLocations.splice(oIdx, 1);
      }
      syncDeleteDoc('beneficiaryLocations', o.id);
    });

    // Update group's stored lembagaList with IDs assigned
    dbStore.beneficiaryGroups[idx].lembagaList = lembagaList;
    syncSaveDoc('beneficiaryGroups', id, dbStore.beneficiaryGroups[idx]);
  }

  cleanDuplicateGroupsAndLocations();

  dbStore.addLog('USR-SYSTEM', 'Operator', 'Penerima Manfaat', 'Edit Kelompok', `Memperbarui kelompok: ${updatedNama}`);
  res.json({ success: true, data: dbStore.beneficiaryGroups[idx], message: 'Kelompok dan spesifikasi lembaga sasaran berhasil diperbarui' });
}

// 2. POST GROUP (Create Group with optional Lembaga Sasaran list)
router.post('/groups', (req: Request, res: Response): void => {
  const { id, nama, kategoriUtama, klasifikasiPorsi, deskripsi, status, lembagaList } = req.body;
  if (!nama) {
    res.status(400).json({ success: false, message: 'Nama kelompok wajib diisi' });
    return;
  }

  // Check if group already exists by ID or by matching name
  const existingIdx = dbStore.beneficiaryGroups.findIndex(
    g => (id && g.id === id) || g.nama.trim().toLowerCase() === nama.trim().toLowerCase()
  );

  if (existingIdx !== -1) {
    return updateGroupHandler(dbStore.beneficiaryGroups[existingIdx].id, req.body, res);
  }

  const groupId = id || `GRP-${Date.now()}`;
  const newGroup: BeneficiaryGroup = {
    id: groupId,
    nama,
    kategoriUtama: kategoriUtama || 'Siswa',
    klasifikasiPorsi: klasifikasiPorsi || 'Porsi Besar',
    deskripsi: deskripsi || '',
    urutan: dbStore.beneficiaryGroups.length + 1,
    status: status || 'Aktif',
    lembagaList: Array.isArray(lembagaList) ? lembagaList : []
  };

  dbStore.beneficiaryGroups.push(newGroup);
  syncSaveDoc('beneficiaryGroups', newGroup.id, newGroup);

  if (Array.isArray(lembagaList) && lembagaList.length > 0) {
    lembagaList.forEach((item: any, idx: number) => {
      const targetSiswa = Number(item.targetSiswa) || 0;
      const targetGuru = Number(item.targetGuru) || 0;
      const targetBalita = Number(item.targetBalita) || 0;
      const targetBumilBusui = Number(item.targetBumilBusui) || 0;
      const defaultJumlah = item.total !== undefined ? Number(item.total) : (targetSiswa + targetGuru + targetBalita + targetBumilBusui);

      const locId = item.id || `LOC-${groupId}-${idx + 1}`;
      item.id = locId;

      const locData: BeneficiaryLocation = {
        id: locId,
        groupId: groupId,
        groupNama: nama,
        namaInstansi: item.namaInstansi || `${nama} - Instansi ${idx + 1}`,
        klasifikasiPorsi: item.klasifikasiPorsi || klasifikasiPorsi || 'Porsi Besar',
        kategoriBreakdown: {
          siswa: targetSiswa,
          guru: targetGuru,
          balita: targetBalita,
          ibuHamil: Math.floor(targetBumilBusui / 2),
          ibuMenyusui: Math.ceil(targetBumilBusui / 2)
        },
        defaultJumlah: defaultJumlah > 0 ? defaultJumlah : 100,
        status: 'Aktif'
      };

      const existingLocIdx = dbStore.beneficiaryLocations.findIndex(l => l.id === locId);
      if (existingLocIdx !== -1) {
        dbStore.beneficiaryLocations[existingLocIdx] = locData;
      } else {
        dbStore.beneficiaryLocations.push(locData);
      }
      syncSaveDoc('beneficiaryLocations', locId, locData);
    });

    newGroup.lembagaList = lembagaList;
    syncSaveDoc('beneficiaryGroups', newGroup.id, newGroup);
  }

  cleanDuplicateGroupsAndLocations();
  dbStore.addLog('USR-SYSTEM', 'Operator', 'Penerima Manfaat', 'Tambah Kelompok', `Menambahkan kelompok: ${nama} (${lembagaList?.length || 0} lembaga)`);
  res.json({ success: true, data: newGroup, message: 'Kelompok dan spesifikasi lembaga sasaran berhasil disimpan' });
});

// 3. PUT GROUP (Update Group & Lembaga List)
router.put('/groups/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  updateGroupHandler(id, req.body, res);
});

// DELETE GROUP
router.delete('/groups/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const idx = dbStore.beneficiaryGroups.findIndex(g => g.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Kelompok tidak ditemukan' });
    return;
  }

  const removed = dbStore.beneficiaryGroups.splice(idx, 1)[0];
  syncDeleteDoc('beneficiaryGroups', id);

  // Remove associated locations
  const locsToRemove = dbStore.beneficiaryLocations.filter(l => l.groupId === id);
  dbStore.beneficiaryLocations = dbStore.beneficiaryLocations.filter(l => l.groupId !== id);
  locsToRemove.forEach(l => syncDeleteDoc('beneficiaryLocations', l.id));

  dbStore.addLog('USR-SYSTEM', 'Operator', 'Penerima Manfaat', 'Hapus Kelompok', `Menghapus kelompok: ${removed.nama}`);
  res.json({ success: true, message: `Kelompok "${removed.nama}" berhasil dihapus` });
});

// 4. GET LOCATIONS
router.get('/locations', (req: Request, res: Response): void => {
  cleanDuplicateGroupsAndLocations();
  res.json({
    success: true,
    data: dbStore.beneficiaryLocations
  });
});

// 5. POST LOCATION (Create Location)
router.post('/locations', (req: Request, res: Response): void => {
  const { groupId, groupNama, namaInstansi, alamat, kontak, kategoriBreakdown, defaultJumlah } = req.body;
  if (!namaInstansi) {
    res.status(400).json({ success: false, message: 'Nama instansi/lokasi wajib diisi' });
    return;
  }

  // Check if location already exists
  const existingIdx = dbStore.beneficiaryLocations.findIndex(
    l => l.namaInstansi.trim().toLowerCase() === namaInstansi.trim().toLowerCase() && l.groupId === (groupId || 'GRP-001')
  );

  const locId = existingIdx !== -1 ? dbStore.beneficiaryLocations[existingIdx].id : `LOC-${Date.now()}`;

  const locData: BeneficiaryLocation = {
    id: locId,
    groupId: groupId || 'GRP-001',
    groupNama: groupNama || 'Umum',
    namaInstansi,
    alamat: alamat || '',
    kontak: kontak || '',
    kategoriBreakdown: kategoriBreakdown || {},
    defaultJumlah: Number(defaultJumlah) || 0,
    status: 'Aktif'
  };

  if (existingIdx !== -1) {
    dbStore.beneficiaryLocations[existingIdx] = locData;
  } else {
    dbStore.beneficiaryLocations.push(locData);
  }
  syncSaveDoc('beneficiaryLocations', locId, locData);

  cleanDuplicateGroupsAndLocations();
  dbStore.addLog('USR-SYSTEM', 'Operator', 'Penerima Manfaat', 'Simpan Lokasi', `Menyimpan lokasi: ${namaInstansi}`);
  res.json({ success: true, data: locData, message: 'Lokasi berhasil disimpan' });
});

// 6. PUT LOCATION (Update Location)
router.put('/locations/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const idx = dbStore.beneficiaryLocations.findIndex(l => l.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Lokasi tidak ditemukan' });
    return;
  }

  dbStore.beneficiaryLocations[idx] = {
    ...dbStore.beneficiaryLocations[idx],
    ...req.body
  };
  syncSaveDoc('beneficiaryLocations', id, dbStore.beneficiaryLocations[idx]);

  cleanDuplicateGroupsAndLocations();
  dbStore.addLog('USR-SYSTEM', 'Operator', 'Penerima Manfaat', 'Edit Lokasi', `Memperbarui lokasi: ${dbStore.beneficiaryLocations[idx].namaInstansi}`);
  res.json({ success: true, data: dbStore.beneficiaryLocations[idx], message: 'Lokasi berhasil diperbarui' });
});

// DELETE LOCATION
router.delete('/locations/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const idx = dbStore.beneficiaryLocations.findIndex(l => l.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Lokasi tidak ditemukan' });
    return;
  }

  const removed = dbStore.beneficiaryLocations.splice(idx, 1)[0];
  syncDeleteDoc('beneficiaryLocations', id);

  dbStore.addLog('USR-SYSTEM', 'Operator', 'Penerima Manfaat', 'Hapus Lokasi', `Menghapus lokasi: ${removed.namaInstansi}`);
  res.json({ success: true, message: `Lokasi "${removed.namaInstansi}" berhasil dihapus` });
});

// 7. GET DAILY RECORDS & SUMMARY BY DATE
router.get('/by-date', (req: Request, res: Response): void => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tanggal = (req.query.tanggal as string) || todayStr;

  let records = dbStore.getBeneficiaryRecordsForDate(tanggal);
  
  // If no records exist for the date yet, auto-populate from previous day or location defaults
  if (records.length === 0) {
    records = dbStore.copyBeneficiaryFromPreviousDay(tanggal);
  }

  const summary = dbStore.getBeneficiarySummaryForDate(tanggal);

  res.json({
    success: true,
    tanggal,
    records,
    summary
  });
});

// 8. POST RECORD (Create / Update Daily Beneficiary Entry)
router.post('/record', (req: Request, res: Response): void => {
  const data = req.body;
  if (!data.tanggal || !data.namaInstansi) {
    res.status(400).json({ success: false, message: 'Tanggal dan Nama Instansi wajib diisi' });
    return;
  }

  // Check lock status
  const summary = dbStore.getBeneficiarySummaryForDate(data.tanggal);
  if (summary.statusLock === 'FINAL' && data.userRole !== 'Admin' && data.userRole !== 'Admin Penuh' && data.userRole !== 'Super Admin') {
    res.status(403).json({ success: false, message: 'Data untuk tanggal ini sudah DIFINALISASI / DIKUNCI. Memerlukan hak akses Admin untuk mengubah.' });
    return;
  }

  const jumlahAwal = Number(data.jumlahAwal) || 0;
  const penambahan = Number(data.penambahan) || 0;
  const pengurangan = Number(data.pengurangan) || 0;
  const totalPenerima = jumlahAwal + penambahan - pengurangan;

  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

  let existingIdx = -1;
  if (data.id) {
    existingIdx = dbStore.dailyBeneficiaryRecords.findIndex(r => r.id === data.id);
  } else {
    existingIdx = dbStore.dailyBeneficiaryRecords.findIndex(r => r.tanggal === data.tanggal && r.namaInstansi === data.namaInstansi && r.kategori === data.kategori);
  }

  let savedRecord: DailyBeneficiaryRecord;

  if (existingIdx !== -1) {
    const prevRec = dbStore.dailyBeneficiaryRecords[existingIdx];
    const prevTotal = prevRec.totalPenerima;

    savedRecord = {
      ...prevRec,
      groupId: data.groupId || prevRec.groupId,
      groupNama: data.groupNama || prevRec.groupNama,
      locationId: data.locationId || prevRec.locationId,
      namaInstansi: data.namaInstansi || prevRec.namaInstansi,
      kategori: data.kategori || prevRec.kategori,
      jumlahAwal,
      penambahan,
      pengurangan,
      totalPenerima,
      keterangan: data.keterangan !== undefined ? data.keterangan : prevRec.keterangan,
      updatedBy: data.userName || 'Operator',
      updatedAt: nowStr
    };

    dbStore.dailyBeneficiaryRecords[existingIdx] = savedRecord;

    // Log Audit if amount changed
    if (prevTotal !== totalPenerima) {
      const auditLog: BeneficiaryAuditLog = {
        id: `AUD-${Date.now()}`,
        recordId: savedRecord.id,
        namaInstansi: savedRecord.namaInstansi,
        tanggal: savedRecord.tanggal,
        jam: new Date().toTimeString().slice(0, 8),
        user: data.userName || 'Operator',
        dataSebelum: prevTotal,
        dataSesudah: totalPenerima,
        selisih: totalPenerima - prevTotal,
        keterangan: data.keterangan || 'Perubahan jumlah penerima'
      };
      dbStore.beneficiaryAuditLogs.unshift(auditLog);
    }

    dbStore.addLog(data.userId || 'USR-001', data.userName || 'Operator', 'Penerima Manfaat', 'Update Penerima', `Update ${savedRecord.namaInstansi}: ${prevTotal} -> ${totalPenerima}`);
  } else {
    savedRecord = {
      id: `BEN-${data.tanggal}-${Date.now().toString().slice(-4)}`,
      tanggal: data.tanggal,
      groupId: data.groupId || 'GRP-001',
      groupNama: data.groupNama || 'Umum',
      locationId: data.locationId || 'LOC-001',
      namaInstansi: data.namaInstansi,
      kategori: data.kategori || 'Siswa',
      jumlahAwal,
      penambahan,
      pengurangan,
      totalPenerima,
      keterangan: data.keterangan || '',
      status: 'DRAFT',
      createdBy: data.userName || 'Operator',
      createdAt: nowStr
    };

    dbStore.dailyBeneficiaryRecords.push(savedRecord);
    dbStore.addLog(data.userId || 'USR-001', data.userName || 'Operator', 'Penerima Manfaat', 'Tambah Penerima', `Tambah ${savedRecord.namaInstansi}: Total ${totalPenerima}`);
  }

  syncSaveDoc('dailyBeneficiaryRecords', savedRecord.id, savedRecord);

  const updatedSummary = dbStore.getBeneficiarySummaryForDate(data.tanggal);

  res.json({
    success: true,
    data: savedRecord,
    summary: updatedSummary,
    message: 'Data penerima manfaat berhasil disimpan'
  });
});

// 9. DELETE RECORD
router.delete('/record/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const idx = dbStore.dailyBeneficiaryRecords.findIndex(r => r.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Record penerima tidak ditemukan' });
    return;
  }

  const targetRec = dbStore.dailyBeneficiaryRecords[idx];
  const summary = dbStore.getBeneficiarySummaryForDate(targetRec.tanggal);

  if (summary.statusLock === 'FINAL') {
    res.status(403).json({ success: false, message: 'Data sudah DIFINALISASI. Hanya Admin yang dapat menghapus.' });
    return;
  }

  dbStore.dailyBeneficiaryRecords.splice(idx, 1);
  syncDeleteDoc('dailyBeneficiaryRecords', id);
  dbStore.addLog('USR-SYSTEM', 'Operator', 'Penerima Manfaat', 'Hapus Penerima', `Menghapus record: ${targetRec.namaInstansi}`);

  res.json({
    success: true,
    message: 'Data penerima berhasil dihapus'
  });
});

// 9b. DELETE ALL RECORDS FOR A DATE
router.delete('/records/date/:tanggal', (req: Request, res: Response): void => {
  const { tanggal } = req.params;
  const toDelete = dbStore.dailyBeneficiaryRecords.filter(r => r.tanggal === tanggal);
  
  if (toDelete.length > 0) {
    dbStore.dailyBeneficiaryRecords = dbStore.dailyBeneficiaryRecords.filter(r => r.tanggal !== tanggal);
    toDelete.forEach(r => syncDeleteDoc('dailyBeneficiaryRecords', r.id));
  }

  delete dbStore.beneficiaryLockStatus[tanggal];
  syncDeleteDoc('beneficiaryLocks', tanggal);

  dbStore.addLog('USR-SYSTEM', 'Operator', 'Penerima Manfaat', 'Hapus Rekap Harian', `Menghapus rekap harian tanggal ${tanggal}`);

  res.json({
    success: true,
    message: `Data rekap harian tanggal ${tanggal} berhasil dihapus`
  });
});

// 10. POST COPY PREVIOUS DAY DATA
router.post('/copy-previous', (req: Request, res: Response): void => {
  const { targetDate, sourceDate } = req.body;
  if (!targetDate) {
    res.status(400).json({ success: false, message: 'Tanggal target wajib diisi' });
    return;
  }

  const copiedRecords = dbStore.copyBeneficiaryFromPreviousDay(targetDate, sourceDate);
  syncSaveBatch('dailyBeneficiaryRecords', copiedRecords);
  const summary = dbStore.getBeneficiarySummaryForDate(targetDate);

  dbStore.addLog('USR-SYSTEM', 'Operator', 'Penerima Manfaat', 'Salin Data Hari Sebelumnya', `Menyalin data ke tanggal ${targetDate}`);

  res.json({
    success: true,
    message: `Berhasil menyalin ${copiedRecords.length} data penerima ke tanggal ${targetDate}`,
    records: copiedRecords,
    summary
  });
});

// 11. POST FINALIZE (LOCK DATA)
router.post('/finalize', (req: Request, res: Response): void => {
  const { tanggal, user } = req.body;
  if (!tanggal) {
    res.status(400).json({ success: false, message: 'Tanggal wajib diisi' });
    return;
  }

  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
  dbStore.beneficiaryLockStatus[tanggal] = {
    status: 'FINAL',
    finalizedBy: user || 'Supervisor / Admin',
    finalizedAt: nowStr
  };

  syncSaveDoc('beneficiaryLocks', tanggal, { id: tanggal, ...dbStore.beneficiaryLockStatus[tanggal] });

  // Mark all records for this date as FINAL
  const updatedForDate: DailyBeneficiaryRecord[] = [];
  dbStore.dailyBeneficiaryRecords.forEach(r => {
    if (r.tanggal === tanggal) {
      r.status = 'FINAL';
      r.finalizedBy = user || 'Supervisor / Admin';
      r.finalizedAt = nowStr;
      updatedForDate.push(r);
    }
  });

  if (updatedForDate.length > 0) {
    syncSaveBatch('dailyBeneficiaryRecords', updatedForDate);
  }

  dbStore.addLog('USR-SYSTEM', user || 'Supervisor', 'Penerima Manfaat', 'Finalisasi Data', `Data tanggal ${tanggal} difinalisasi / dikunci.`);

  res.json({
    success: true,
    message: `Data penerima manfaat tanggal ${tanggal} berhasil DIFINALISASI & DIKUNCI.`,
    summary: dbStore.getBeneficiarySummaryForDate(tanggal)
  });
});

// 12. POST UNLOCK (BUKA LOCK DATA)
router.post('/unlock', (req: Request, res: Response): void => {
  const { tanggal, user } = req.body;
  if (!tanggal) {
    res.status(400).json({ success: false, message: 'Tanggal wajib diisi' });
    return;
  }

  dbStore.beneficiaryLockStatus[tanggal] = {
    status: 'DRAFT'
  };

  syncSaveDoc('beneficiaryLocks', tanggal, { id: tanggal, ...dbStore.beneficiaryLockStatus[tanggal] });

  const updatedForDate: DailyBeneficiaryRecord[] = [];
  dbStore.dailyBeneficiaryRecords.forEach(r => {
    if (r.tanggal === tanggal) {
      r.status = 'DRAFT';
      updatedForDate.push(r);
    }
  });

  if (updatedForDate.length > 0) {
    syncSaveBatch('dailyBeneficiaryRecords', updatedForDate);
  }

  dbStore.addLog('USR-SYSTEM', user || 'Admin', 'Penerima Manfaat', 'Buka Finalisasi', `Kunci data tanggal ${tanggal} dibuka kembali.`);

  res.json({
    success: true,
    message: `Kunci data penerima tanggal ${tanggal} berhasil DIBUKA.`,
    summary: dbStore.getBeneficiarySummaryForDate(tanggal)
  });
});

// 13. GET HISTORY / REKAP HARIAN
router.get('/history', (req: Request, res: Response): void => {
  const { startDate, endDate, groupId, locationId, search } = req.query as Record<string, string>;

  let results = [...dbStore.dailyBeneficiaryRecords];

  if (startDate) {
    results = results.filter(r => r.tanggal >= startDate);
  }
  if (endDate) {
    results = results.filter(r => r.tanggal <= endDate);
  }
  if (groupId && groupId !== 'all') {
    results = results.filter(r => r.groupId === groupId);
  }
  if (locationId && locationId !== 'all') {
    results = results.filter(r => r.locationId === locationId);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(r => 
      r.namaInstansi.toLowerCase().includes(q) || 
      r.groupNama.toLowerCase().includes(q) ||
      r.kategori.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    totalRecords: results.length,
    data: results
  });
});

// 14. GET REKAP BULANAN
router.get('/rekap-bulanan', (req: Request, res: Response): void => {
  const { bulan, tahun } = req.query as Record<string, string>;
  const currentYear = tahun || new Date().getFullYear().toString();
  const currentMonth = bulan ? String(bulan).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');

  const prefix = `${currentYear}-${currentMonth}`;
  const recs = dbStore.dailyBeneficiaryRecords.filter(r => r.tanggal.startsWith(prefix));

  // Group by date
  const dateMap: Record<string, {
    tanggal: string;
    totalBalita: number;
    totalIbuHamil: number;
    totalIbuMenyusui: number;
    totalSiswa: number;
    totalGuru: number;
    totalPenerima: number;
  }> = {};

  recs.forEach(r => {
    if (!dateMap[r.tanggal]) {
      dateMap[r.tanggal] = {
        tanggal: r.tanggal,
        totalBalita: 0,
        totalIbuHamil: 0,
        totalIbuMenyusui: 0,
        totalSiswa: 0,
        totalGuru: 0,
        totalPenerima: 0
      };
    }

    const item = dateMap[r.tanggal];
    item.totalPenerima += r.totalPenerima;

    if (r.kategori === 'Balita' || r.groupNama.toUpperCase().includes('BALITA')) {
      item.totalBalita += r.totalPenerima;
    } else if (r.kategori === 'Ibu Hamil' || r.groupNama.toUpperCase().includes('HAMIL')) {
      item.totalIbuHamil += r.totalPenerima;
    } else if (r.kategori === 'Ibu Menyusui' || r.groupNama.toUpperCase().includes('MENYUSUI')) {
      item.totalIbuMenyusui += r.totalPenerima;
    } else if (r.kategori === 'Guru / Staf' || r.groupNama.toUpperCase().includes('GURU')) {
      item.totalGuru += r.totalPenerima;
    } else {
      item.totalSiswa += r.totalPenerima;
    }
  });

  const dailyList = Object.values(dateMap).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const totalHariProduksi = dailyList.length;
  let totalPorsi = 0;
  let maxPenerima = 0;
  let minPenerima = dailyList.length > 0 ? dailyList[0].totalPenerima : 0;

  dailyList.forEach(d => {
    totalPorsi += d.totalPenerima;
    if (d.totalPenerima > maxPenerima) maxPenerima = d.totalPenerima;
    if (d.totalPenerima < minPenerima) minPenerima = d.totalPenerima;
  });

  const rataRataPerHari = totalHariProduksi > 0 ? Math.round(totalPorsi / totalHariProduksi) : 0;

  res.json({
    success: true,
    bulan: currentMonth,
    tahun: currentYear,
    dailyList,
    summary: {
      totalHariProduksi,
      totalPorsi,
      rataRataPerHari,
      maxPenerima,
      minPenerima
    }
  });
});

// 15. GET AUDIT LOGS
router.get('/audit-logs', (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: dbStore.beneficiaryAuditLogs
  });
});

// 16. GET QUICK SUMMARY TARGET FOR OTHER MODULES (Produksi, Tugas Divisi, Dashboard)
router.get('/summary', (req: Request, res: Response): void => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tanggal = (req.query.tanggal as string) || todayStr;

  const summary = dbStore.getBeneficiarySummaryForDate(tanggal);

  res.json({
    success: true,
    tanggal,
    summary
  });
});

export default router;
