import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { User } from '../../src/types';
import {
  syncSaveDoc,
  syncSaveBatch,
  syncDeleteDoc,
  saveSnapshotToDiskNow,
  generateUniqueId
} from '../db/firestore';

const router = Router();

// Master Pegawai - Unified with Users (Manajemen Pengguna)
router.get('/pegawai', (req: Request, res: Response): void => {
  // Return users mapped as pegawai data format so both menus access identical dataset
  const data = dbStore.users.map(u => {
    const matchedDiv = dbStore.divisi.find(d => d.nama.toLowerCase() === (u.divisi || '').toLowerCase());
    const matchedJab = dbStore.jabatan.find(j => j.nama.toLowerCase() === (u.jabatan || '').toLowerCase());
    return {
      id: u.id,
      nip: (u as any).nip || `1990${u.id.replace(/\D/g, '').padStart(10, '0')}`,
      nama: u.nama,
      username: u.username,
      email: u.email,
      telepon: (u as any).telepon || '081234567890',
      divisiId: matchedDiv?.id || 'DIV-001',
      divisiNama: u.divisi || 'Sekretariat / Tata Usaha',
      jabatanId: matchedJab?.id || '',
      jabatanNama: u.jabatan || 'Staf Operasional',
      role: u.role,
      status: u.status
    };
  });
  res.json({ success: true, data });
});

router.post('/pegawai', (req: Request, res: Response): void => {
  const { nama, email, nip, telepon, divisiNama, jabatanNama, status, username, role, password } = req.body;

  if (!nama || !email) {
    res.status(400).json({ success: false, message: 'Nama dan Email pegawai wajib diisi.' });
    return;
  }

  const generatedUsername = username || email.split('@')[0].toLowerCase().replace(/[^a-z0-0_]/g, '_');
  const existing = dbStore.users.find(u => u.username === generatedUsername || u.email === email);
  if (existing) {
    res.status(400).json({ success: false, message: 'Username atau Email sudah terdaftar dalam sistem.' });
    return;
  }

  let newUserId = '';
  do {
    newUserId = generateUniqueId('USR');
  } while (dbStore.users.some(u => u.id === newUserId));

  const newUser: User = {
    id: newUserId,
    nama,
    username: generatedUsername,
    email,
    role: role || 'Staff',
    divisi: divisiNama || 'Sekretariat / Tata Usaha',
    jabatan: jabatanNama || 'Staf Operasional',
    status: status || 'Aktif',
    password: password || 'password123',
    foto: `https://images.unsplash.com/photo-${1534528741775 + dbStore.users.length}?w=150`,
    createdAt: new Date().toISOString()
  };

  if (nip) (newUser as any).nip = nip;
  if (telepon) (newUser as any).telepon = telepon;

  dbStore.users.unshift(newUser);
  dbStore.addLog('ADMIN', 'System Administrator', 'Master Data', 'Tambah Pegawai / User', `Menambahkan pegawai '${nama}' terintegrasi Manajemen Pengguna`, req.ip);

  // Sync to Firestore
  syncSaveDoc('users', newUser.id, newUser);

  res.status(201).json({ success: true, data: newUser });
});

router.put('/pegawai/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = dbStore.users.findIndex(u => u.id === id);

  if (index !== -1) {
    const { nama, email, nip, telepon, divisiNama, jabatanNama, status, role, username } = req.body;
    
    dbStore.users[index] = {
      ...dbStore.users[index],
      nama: nama || dbStore.users[index].nama,
      email: email || dbStore.users[index].email,
      username: username || dbStore.users[index].username,
      role: role || dbStore.users[index].role,
      divisi: divisiNama || dbStore.users[index].divisi,
      jabatan: jabatanNama || dbStore.users[index].jabatan,
      status: status || dbStore.users[index].status
    };

    if (nip) (dbStore.users[index] as any).nip = nip;
    if (telepon) (dbStore.users[index] as any).telepon = telepon;

    syncSaveDoc('users', id, dbStore.users[index]);

    res.json({ success: true, data: dbStore.users[index] });
  } else {
    res.status(404).json({ success: false, message: 'Pegawai tidak ditemukan.' });
  }
});

router.delete('/pegawai/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = dbStore.users.findIndex(u => u.id === id);
  if (index !== -1) {
    const deleted = dbStore.users.splice(index, 1)[0];
    syncDeleteDoc('users', id);
    res.json({ success: true, data: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Pegawai tidak ditemukan.' });
  }
});

// Master Divisi
router.get('/divisi', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.divisi });
});

router.post('/divisi', async (req: Request, res: Response): Promise<void> => {
  const cleanNama = String(req.body?.nama || '').trim();
  const rawKode = String(req.body?.kode || '').trim().toUpperCase();
  const cleanKeterangan = String(req.body?.keterangan || '').trim();
  const cleanKepala = String(req.body?.kepalaDivisi || '').trim();

  if (!cleanNama) {
    res.status(400).json({ success: false, message: 'Nama divisi wajib diisi.' });
    return;
  }

  dbStore.normalizeJabatanList();
  const cleanKode = rawKode || cleanNama.substring(0, 3).toUpperCase();
  const matchedJabatan = dbStore.jabatan.find(
    j => (j.kode || '').trim().toUpperCase() === cleanKode
  );

  const uniqueSuffix = `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const newDiv = {
    id: `DIV-${uniqueSuffix}`,
    nama: cleanNama,
    kode: cleanKode,
    keterangan: cleanKeterangan,
    kepalaDivisi: cleanKepala || '-',
    jabatanId: matchedJabatan?.id || req.body?.jabatanId || undefined,
    jabatanNama: matchedJabatan?.nama || req.body?.jabatanNama || undefined,
    jumlahPegawai: 0,
    createdAt: new Date().toISOString()
  };

  dbStore.divisi.unshift(newDiv);
  dbStore.addLog('ADMIN', 'System Administrator', 'Master Data', 'Tambah Divisi', `Menambahkan divisi '${cleanNama}' (${cleanKode})`, req.ip);
  await syncSaveDoc('divisi', newDiv.id, newDiv);
  const updatedBastsOnAdd = dbStore.syncBastDistribusiSignerFromDivisi();
  if (updatedBastsOnAdd.length > 0) {
    await syncSaveBatch('bastDocuments', updatedBastsOnAdd);
  }
  const syncOnAdd = dbStore.syncJabatanFromMasterDivisi();
  if (syncOnAdd.updatedPetugas.length > 0) await syncSaveBatch('petugasList', syncOnAdd.updatedPetugas);
  if (syncOnAdd.updatedSlips.length > 0) await syncSaveBatch('slipGajiList', syncOnAdd.updatedSlips);
  if (syncOnAdd.updatedAbsensi.length > 0) await syncSaveBatch('rekapAbsensiList', syncOnAdd.updatedAbsensi);
  saveSnapshotToDiskNow();
  res.status(201).json({ success: true, message: 'Divisi berhasil ditambahkan', data: newDiv });
});

router.put('/divisi/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.divisi.findIndex(d => d.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Divisi tidak ditemukan.' });
    return;
  }

  const current = dbStore.divisi[idx];
  const cleanNama = req.body?.nama !== undefined ? String(req.body.nama).trim() : current.nama;
  const cleanKode = req.body?.kode !== undefined
    ? (String(req.body.kode).trim().toUpperCase() || current.kode || cleanNama.substring(0, 3).toUpperCase())
    : (current.kode || '');

  if (!cleanNama) {
    res.status(400).json({ success: false, message: 'Nama divisi wajib diisi.' });
    return;
  }

  dbStore.normalizeJabatanList();
  const matchedJabatan = dbStore.jabatan.find(
    j => (j.kode || '').trim().toUpperCase() === cleanKode
  );

  dbStore.divisi[idx] = {
    ...current,
    ...req.body,
    id,
    nama: cleanNama,
    kode: cleanKode,
    jabatanId: matchedJabatan ? matchedJabatan.id : (req.body?.jabatanId ?? undefined),
    jabatanNama: matchedJabatan ? matchedJabatan.nama : (req.body?.jabatanNama ?? undefined),
    updatedAt: new Date().toISOString()
  };
  dbStore.addLog('ADMIN', 'System Administrator', 'Master Data', 'Edit Divisi', `Memperbarui divisi '${cleanNama}' (${cleanKode})`, req.ip);
  await syncSaveDoc('divisi', id, dbStore.divisi[idx]);
  const updatedBastsOnEdit = dbStore.syncBastDistribusiSignerFromDivisi();
  if (updatedBastsOnEdit.length > 0) {
    await syncSaveBatch('bastDocuments', updatedBastsOnEdit);
  }
  const syncOnEdit = dbStore.syncJabatanFromMasterDivisi();
  if (syncOnEdit.updatedPetugas.length > 0) await syncSaveBatch('petugasList', syncOnEdit.updatedPetugas);
  if (syncOnEdit.updatedSlips.length > 0) await syncSaveBatch('slipGajiList', syncOnEdit.updatedSlips);
  if (syncOnEdit.updatedAbsensi.length > 0) await syncSaveBatch('rekapAbsensiList', syncOnEdit.updatedAbsensi);
  saveSnapshotToDiskNow();
  res.json({ success: true, message: 'Divisi berhasil diperbarui', data: dbStore.divisi[idx] });
});

router.delete('/divisi/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.divisi.findIndex(d => d.id === id);
  if (idx !== -1) {
    const deleted = dbStore.divisi.splice(idx, 1)[0];
    dbStore.addLog('ADMIN', 'System Administrator', 'Master Data', 'Hapus Divisi', `Menghapus divisi '${deleted.nama}' (${deleted.kode})`, req.ip);
    await syncDeleteDoc('divisi', id);
    const updatedBastsOnDel = dbStore.syncBastDistribusiSignerFromDivisi();
    if (updatedBastsOnDel.length > 0) {
      await syncSaveBatch('bastDocuments', updatedBastsOnDel);
    }
    const syncOnDel = dbStore.syncJabatanFromMasterDivisi();
    if (syncOnDel.updatedPetugas.length > 0) await syncSaveBatch('petugasList', syncOnDel.updatedPetugas);
    if (syncOnDel.updatedSlips.length > 0) await syncSaveBatch('slipGajiList', syncOnDel.updatedSlips);
    if (syncOnDel.updatedAbsensi.length > 0) await syncSaveBatch('rekapAbsensiList', syncOnDel.updatedAbsensi);
    saveSnapshotToDiskNow();
    res.json({ success: true, message: 'Divisi berhasil dihapus', data: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Divisi tidak ditemukan.' });
  }
});

// Master Jabatan
router.get('/jabatan', (req: Request, res: Response): void => {
  dbStore.normalizeJabatanList();
  res.json({ success: true, data: dbStore.jabatan });
});

router.post('/jabatan', async (req: Request, res: Response): Promise<void> => {
  const cleanNama = String(req.body?.nama || '').trim();
  const rawKode = String(req.body?.kode || '').trim().toUpperCase();
  const cleanDeskripsi = String(req.body?.deskripsi || '').trim();

  if (!cleanNama) {
    res.status(400).json({ success: false, message: 'Nama jenis jabatan wajib diisi.' });
    return;
  }

  dbStore.normalizeJabatanList();

  const duplicateName = dbStore.jabatan.find(
    j => j.nama.trim().toLowerCase() === cleanNama.toLowerCase()
  );
  if (duplicateName) {
    res.status(400).json({ success: false, message: `Jenis jabatan "${cleanNama}" sudah terdaftar di database.` });
    return;
  }

  const maxNum = dbStore.jabatan.reduce((max, item) => {
    const match = item.id?.match(/(\d+)$/);
    const num = match ? parseInt(match[1], 10) : 0;
    return num > max ? num : max;
  }, 0);
  const nextNum = String(maxNum + 1).padStart(3, '0');
  const cleanKode = rawKode || `JAB-${nextNum}`;

  const duplicateKode = dbStore.jabatan.find(
    j => (j.kode || '').trim().toUpperCase() === cleanKode
  );
  if (duplicateKode) {
    res.status(400).json({ success: false, message: `Kode jabatan "${cleanKode}" sudah digunakan oleh "${duplicateKode.nama}".` });
    return;
  }

  const nowIso = new Date().toISOString();
  const newJabatan = {
    id: `JAB-${nextNum}`,
    kode: cleanKode,
    nama: cleanNama,
    deskripsi: cleanDeskripsi,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  dbStore.jabatan.unshift(newJabatan as any);
  dbStore.addLog('ADMIN', 'System Administrator', 'Master Data', 'Tambah Jenis Jabatan', `Menambahkan jenis jabatan '${cleanNama}' (${cleanKode})`, req.ip);
  await syncSaveDoc('jabatan', newJabatan.id, newJabatan);
  saveSnapshotToDiskNow();
  res.status(201).json({ success: true, message: 'Jenis jabatan berhasil ditambahkan dan disimpan ke database.', data: newJabatan });
});

router.put('/jabatan/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.jabatan.findIndex(j => j.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Jenis jabatan tidak ditemukan.' });
    return;
  }

  const current = dbStore.jabatan[idx];
  const cleanNama = req.body?.nama !== undefined ? String(req.body.nama).trim() : current.nama;
  const cleanKode = req.body?.kode !== undefined
    ? (String(req.body.kode).trim().toUpperCase() || current.kode || id)
    : (current.kode || id);
  const cleanDeskripsi = req.body?.deskripsi !== undefined ? String(req.body.deskripsi).trim() : (current.deskripsi || '');

  if (!cleanNama) {
    res.status(400).json({ success: false, message: 'Nama jenis jabatan wajib diisi.' });
    return;
  }

  const duplicateName = dbStore.jabatan.find(
    j => j.id !== id && j.nama.trim().toLowerCase() === cleanNama.toLowerCase()
  );
  if (duplicateName) {
    res.status(400).json({ success: false, message: `Jenis jabatan "${cleanNama}" sudah terdaftar.` });
    return;
  }

  const duplicateKode = dbStore.jabatan.find(
    j => j.id !== id && (j.kode || '').trim().toUpperCase() === cleanKode
  );
  if (duplicateKode) {
    res.status(400).json({ success: false, message: `Kode jabatan "${cleanKode}" sudah digunakan.` });
    return;
  }

  const nowIso = new Date().toISOString();
  const updatedJabatan = {
    id,
    kode: cleanKode,
    nama: cleanNama,
    deskripsi: cleanDeskripsi,
    createdAt: current.createdAt || nowIso,
    updatedAt: nowIso
  };

  dbStore.jabatan[idx] = updatedJabatan as any;
  // Re-link MasterDivisi yang memakai jabatanId / kode ini
  dbStore.divisi = dbStore.divisi.map(d => {
    const matchesJab =
      d.jabatanId === id ||
      (d.kode || '').trim().toUpperCase() === cleanKode ||
      (current.kode && (d.kode || '').trim().toUpperCase() === (current.kode || '').trim().toUpperCase());
    if (matchesJab) {
      return {
        ...d,
        kode: cleanKode,
        jabatanId: id,
        jabatanNama: cleanNama,
        updatedAt: nowIso
      };
    }
    return d;
  });
  dbStore.addLog('ADMIN', 'System Administrator', 'Master Data', 'Edit Jenis Jabatan', `Memperbarui jenis jabatan '${cleanNama}' (${cleanKode})`, req.ip);
  await syncSaveDoc('jabatan', id, updatedJabatan);
  const syncOnJabEdit = dbStore.syncJabatanFromMasterDivisi();
  if (syncOnJabEdit.updatedPetugas.length > 0) await syncSaveBatch('petugasList', syncOnJabEdit.updatedPetugas);
  if (syncOnJabEdit.updatedSlips.length > 0) await syncSaveBatch('slipGajiList', syncOnJabEdit.updatedSlips);
  if (syncOnJabEdit.updatedAbsensi.length > 0) await syncSaveBatch('rekapAbsensiList', syncOnJabEdit.updatedAbsensi);
  saveSnapshotToDiskNow();
  res.json({ success: true, message: 'Jenis jabatan berhasil diperbarui.', data: updatedJabatan });
});

router.delete('/jabatan/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.jabatan.findIndex(j => j.id === id);
  if (idx !== -1) {
    const deleted = dbStore.jabatan.splice(idx, 1)[0];
    dbStore.addLog('ADMIN', 'System Administrator', 'Master Data', 'Hapus Jenis Jabatan', `Menghapus jenis jabatan '${deleted.nama}' (${deleted.kode})`, req.ip);
    await syncDeleteDoc('jabatan', id);
    saveSnapshotToDiskNow();
    res.json({ success: true, message: 'Jenis jabatan berhasil dihapus dari database.', data: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Jenis jabatan tidak ditemukan.' });
  }
});

// Master Gudang
router.get('/gudang', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.gudang });
});

router.post('/gudang', async (req: Request, res: Response): Promise<void> => {
  const { nama, kode, lokasi, penanggungJawab, kapasitasM3, status } = req.body;
  if (!nama) {
    res.status(400).json({ success: false, message: 'Nama gudang wajib diisi.' });
    return;
  }
  let newGdgId = '';
  do {
    newGdgId = generateUniqueId('GDG');
  } while (dbStore.gudang.some(g => g.id === newGdgId));
  const newGdg = {
    id: newGdgId,
    nama,
    kode: kode || `GDG-${nama.slice(0, 3).toUpperCase()}`,
    lokasi: lokasi || 'Area SPPG Kraksaan',
    penanggungJawab: penanggungJawab || 'Petugas Gudang',
    kapasitasM3: Number(kapasitasM3) || 100,
    status: (status === 'Nonaktif' ? 'Nonaktif' : 'Aktif') as 'Aktif' | 'Nonaktif',
    createdAt: new Date().toISOString()
  };
  dbStore.gudang.unshift(newGdg as any);
  await syncSaveDoc('gudang', newGdg.id, newGdg);
  res.status(201).json({ success: true, message: 'Gudang berhasil ditambahkan', data: newGdg });
});

router.put('/gudang/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.gudang.findIndex(g => g.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Gudang tidak ditemukan.' });
    return;
  }
  dbStore.gudang[idx] = { ...dbStore.gudang[idx], ...req.body };
  await syncSaveDoc('gudang', id, dbStore.gudang[idx]);
  res.json({ success: true, message: 'Gudang berhasil diperbarui', data: dbStore.gudang[idx] });
});

router.delete('/gudang/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.gudang.findIndex(g => g.id === id);
  if (idx !== -1) {
    const deleted = dbStore.gudang.splice(idx, 1)[0];
    await syncDeleteDoc('gudang', id);
    res.json({ success: true, message: 'Gudang berhasil dihapus', data: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Gudang tidak ditemukan.' });
  }
});

// Master Kategori
router.get('/kategori', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.kategori });
});

router.post('/kategori', async (req: Request, res: Response): Promise<void> => {
  const { nama, kode, deskripsi } = req.body;
  if (!nama) {
    res.status(400).json({ success: false, message: 'Nama kategori wajib diisi.' });
    return;
  }
  let newKatId = '';
  do {
    newKatId = generateUniqueId('KAT');
  } while (dbStore.kategori.some(k => k.id === newKatId));
  const newKat = {
    id: newKatId,
    nama,
    kode: kode || `KAT-${nama.slice(0, 3).toUpperCase()}`,
    deskripsi: deskripsi || '',
    jumlahBarang: 0,
    createdAt: new Date().toISOString()
  };
  dbStore.kategori.unshift(newKat);
  await syncSaveDoc('kategori', newKat.id, newKat);
  res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan', data: newKat });
});

router.put('/kategori/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.kategori.findIndex(k => k.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
    return;
  }
  dbStore.kategori[idx] = { ...dbStore.kategori[idx], ...req.body };
  await syncSaveDoc('kategori', id, dbStore.kategori[idx]);
  res.json({ success: true, message: 'Kategori berhasil diperbarui', data: dbStore.kategori[idx] });
});

router.delete('/kategori/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.kategori.findIndex(k => k.id === id);
  if (idx !== -1) {
    const deleted = dbStore.kategori.splice(idx, 1)[0];
    await syncDeleteDoc('kategori', id);
    res.json({ success: true, message: 'Kategori berhasil dihapus', data: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
  }
});

// Master Instansi
router.get('/instansi', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.instansi });
});

router.post('/instansi', async (req: Request, res: Response): Promise<void> => {
  const { nama, jenis, alamat, kontak, telepon, email, status } = req.body;
  if (!nama) {
    res.status(400).json({ success: false, message: 'Nama instansi mitra wajib diisi.' });
    return;
  }
  let newInsId = '';
  do {
    newInsId = generateUniqueId('INS');
  } while (dbStore.instansi.some(i => i.id === newInsId));
  const newInstansi = {
    id: newInsId,
    kode: (req.body.kode as string) || newInsId,
    nama,
    jenis: jenis || 'Sekolah / Madrasah',
    alamat: alamat || 'Kabupaten Probolinggo',
    kontak: kontak || '-',
    kontakPerson: (req.body.kontakPerson as string) || kontak || '-',
    telepon: telepon || '-',
    email: email || '-',
    status: status || 'Aktif',
    createdAt: new Date().toISOString()
  };
  dbStore.instansi.unshift(newInstansi as any);
  await syncSaveDoc('instansi', newInstansi.id, newInstansi);
  res.status(201).json({ success: true, message: 'Instansi mitra berhasil ditambahkan', data: newInstansi });
});

router.put('/instansi/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.instansi.findIndex(i => i.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Instansi tidak ditemukan.' });
    return;
  }
  dbStore.instansi[idx] = { ...dbStore.instansi[idx], ...req.body };
  await syncSaveDoc('instansi', id, dbStore.instansi[idx]);
  res.json({ success: true, message: 'Instansi berhasil diperbarui', data: dbStore.instansi[idx] });
});

router.delete('/instansi/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.instansi.findIndex(i => i.id === id);
  if (idx !== -1) {
    const deleted = dbStore.instansi.splice(idx, 1)[0];
    await syncDeleteDoc('instansi', id);
    res.json({ success: true, message: 'Instansi berhasil dihapus', data: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Instansi tidak ditemukan.' });
  }
});

export default router;

