import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { User } from '../../src/types';
import { syncSaveDoc, syncDeleteDoc } from '../db/firestore';

const router = Router();

// Master Pegawai - Unified with Users (Manajemen Pengguna)
router.get('/pegawai', (req: Request, res: Response): void => {
  // Return users mapped as pegawai data format so both menus access identical dataset
  const data = dbStore.users.map(u => ({
    id: u.id,
    nip: (u as any).nip || `1990${u.id.replace(/\D/g, '').padStart(10, '0')}`,
    nama: u.nama,
    username: u.username,
    email: u.email,
    telepon: (u as any).telepon || '081234567890',
    divisiId: 'DIV-001',
    divisiNama: u.divisi || 'Sekretariat / Tata Usaha',
    jabatanId: 'JAB-001',
    jabatanNama: u.jabatan || 'Staf Operasional',
    role: u.role,
    status: u.status
  }));
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

  const newUser: User = {
    id: `USR-${String(dbStore.users.length + 1).padStart(3, '0')}`,
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
  const { nama, kode, keterangan, kepalaDivisi } = req.body;
  if (!nama) {
    res.status(400).json({ success: false, message: 'Nama divisi wajib diisi.' });
    return;
  }
  const newDiv = {
    id: `DIV-${String(dbStore.divisi.length + 1).padStart(3, '0')}`,
    nama,
    kode: kode || nama.substring(0, 3).toUpperCase(),
    keterangan: keterangan || '',
    kepalaDivisi: kepalaDivisi || '-',
    jumlahPegawai: 0,
    createdAt: new Date().toISOString()
  };
  dbStore.divisi.unshift(newDiv);
  await syncSaveDoc('divisi', newDiv.id, newDiv);
  res.status(201).json({ success: true, message: 'Divisi berhasil ditambahkan', data: newDiv });
});

router.put('/divisi/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.divisi.findIndex(d => d.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Divisi tidak ditemukan.' });
    return;
  }
  dbStore.divisi[idx] = { ...dbStore.divisi[idx], ...req.body };
  await syncSaveDoc('divisi', id, dbStore.divisi[idx]);
  res.json({ success: true, message: 'Divisi berhasil diperbarui', data: dbStore.divisi[idx] });
});

router.delete('/divisi/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.divisi.findIndex(d => d.id === id);
  if (idx !== -1) {
    const deleted = dbStore.divisi.splice(idx, 1)[0];
    await syncDeleteDoc('divisi', id);
    res.json({ success: true, message: 'Divisi berhasil dihapus', data: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Divisi tidak ditemukan.' });
  }
});

// Master Jabatan
router.get('/jabatan', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.jabatan });
});

router.post('/jabatan', async (req: Request, res: Response): Promise<void> => {
  const { nama, divisiNama, level, deskripsi } = req.body;
  if (!nama) {
    res.status(400).json({ success: false, message: 'Nama jabatan wajib diisi.' });
    return;
  }
  const newJabatan = {
    id: `JAB-${String(dbStore.jabatan.length + 1).padStart(3, '0')}`,
    nama,
    divisiNama: divisiNama || 'Umum',
    level: level || 'Staff',
    deskripsi: deskripsi || '',
    createdAt: new Date().toISOString()
  };
  dbStore.jabatan.unshift(newJabatan);
  await syncSaveDoc('jabatan', newJabatan.id, newJabatan);
  res.status(201).json({ success: true, message: 'Jabatan berhasil ditambahkan', data: newJabatan });
});

router.put('/jabatan/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.jabatan.findIndex(j => j.id === id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Jabatan tidak ditemukan.' });
    return;
  }
  dbStore.jabatan[idx] = { ...dbStore.jabatan[idx], ...req.body };
  await syncSaveDoc('jabatan', id, dbStore.jabatan[idx]);
  res.json({ success: true, message: 'Jabatan berhasil diperbarui', data: dbStore.jabatan[idx] });
});

router.delete('/jabatan/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.jabatan.findIndex(j => j.id === id);
  if (idx !== -1) {
    const deleted = dbStore.jabatan.splice(idx, 1)[0];
    await syncDeleteDoc('jabatan', id);
    res.json({ success: true, message: 'Jabatan berhasil dihapus', data: deleted });
  } else {
    res.status(404).json({ success: false, message: 'Jabatan tidak ditemukan.' });
  }
});

// Master Gudang
router.get('/gudang', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.gudang });
});

router.post('/gudang', async (req: Request, res: Response): Promise<void> => {
  const { nama, kode, lokasi, penanggungJawab, kapasitasM3 } = req.body;
  if (!nama) {
    res.status(400).json({ success: false, message: 'Nama gudang wajib diisi.' });
    return;
  }
  const newGdg = {
    id: `GDG-${String(dbStore.gudang.length + 1).padStart(3, '0')}`,
    nama,
    kode: kode || `GDG-${nama.slice(0, 3).toUpperCase()}`,
    lokasi: lokasi || 'Area SPPG Kraksaan',
    penanggungJawab: penanggungJawab || 'Petugas Gudang',
    kapasitasM3: Number(kapasitasM3) || 100,
    status: 'Aktif',
    createdAt: new Date().toISOString()
  };
  dbStore.gudang.unshift(newGdg);
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
  const newKat = {
    id: `KAT-${String(dbStore.kategori.length + 1).padStart(3, '0')}`,
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
  const newInstansi = {
    id: `INS-${String(dbStore.instansi.length + 1).padStart(3, '0')}`,
    nama,
    jenis: jenis || 'Sekolah / Madrasah',
    alamat: alamat || 'Kabupaten Probolinggo',
    kontak: kontak || '-',
    telepon: telepon || '-',
    email: email || '-',
    status: status || 'Aktif',
    createdAt: new Date().toISOString()
  };
  dbStore.instansi.unshift(newInstansi);
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

