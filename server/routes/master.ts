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

router.post('/divisi', (req: Request, res: Response): void => {
  const newDiv = { id: `DIV-${String(dbStore.divisi.length + 1).padStart(3, '0')}`, ...req.body };
  dbStore.divisi.unshift(newDiv);
  syncSaveDoc('divisi', newDiv.id, newDiv);
  res.status(201).json({ success: true, data: newDiv });
});

// Master Jabatan
router.get('/jabatan', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.jabatan });
});

// Master Gudang
router.get('/gudang', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.gudang });
});

router.post('/gudang', (req: Request, res: Response): void => {
  const newGdg = { id: `GDG-${String(dbStore.gudang.length + 1).padStart(3, '0')}`, ...req.body };
  dbStore.gudang.unshift(newGdg);
  syncSaveDoc('gudang', newGdg.id, newGdg);
  res.status(201).json({ success: true, data: newGdg });
});

// Master Kategori
router.get('/kategori', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.kategori });
});

// Master Instansi
router.get('/instansi', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.instansi });
});

export default router;

