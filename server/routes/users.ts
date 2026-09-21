import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { User } from '../../src/types';
import { syncSaveDoc, syncDeleteDoc } from '../db/firestore';

const router = Router();

// Get all users
router.get('/', (req: Request, res: Response): void => {
  const usersWithPassword = dbStore.users.map(u => ({
    ...u,
    password: u.password || 'password123'
  }));
  res.json({ success: true, data: usersWithPassword });
});

// Create user
router.post('/', (req: Request, res: Response): void => {
  const { nama, username, email, role, divisi, jabatan, status, foto, password, nip, telepon } = req.body;

  if (!nama || !username || !email || !role) {
    res.status(400).json({ success: false, message: 'Nama, Username, Email, dan Role wajib diisi.' });
    return;
  }

  const existing = dbStore.users.find(u => u.username === username || u.email === email);
  if (existing) {
    res.status(400).json({ success: false, message: 'Username atau Email sudah terdaftar.' });
    return;
  }

  const newUser: User = {
    id: `USR-${String(dbStore.users.length + 1).padStart(3, '0')}`,
    nama,
    username,
    email,
    role,
    divisi: divisi || 'Sekretariat / Tata Usaha',
    jabatan: jabatan || 'Staf Operasional',
    status: status || 'Aktif',
    password: password || 'password123',
    foto: foto || `https://images.unsplash.com/photo-${1534528741775 + dbStore.users.length}?w=150`,
    createdAt: new Date().toISOString()
  };

  if (nip) (newUser as any).nip = nip;
  if (telepon) (newUser as any).telepon = telepon;

  dbStore.users.unshift(newUser);
  dbStore.addLog('ADMIN', 'System Administrator', 'Master User', 'Tambah User Baru', `Menambahkan user '${nama}' dengan role '${role}' dan password kustom`, req.ip);

  // Sync to Firestore
  syncSaveDoc('users', newUser.id, newUser);

  res.status(201).json({ success: true, message: 'User berhasil ditambahkan dengan password SSO', data: newUser });
});

// Update user
router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = dbStore.users.findIndex(u => u.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    return;
  }

  const updateData = { ...req.body };
  // If password is blank in updateData, do not overwrite existing password
  if (!updateData.password || updateData.password.trim() === '') {
    delete updateData.password;
  }

  dbStore.users[index] = {
    ...dbStore.users[index],
    ...updateData
  };

  dbStore.addLog('ADMIN', 'System Administrator', 'Master User', 'Update User Data', `Memperbarui data/password user ID ${id}`, req.ip);

  // Sync to Firestore
  syncSaveDoc('users', id, dbStore.users[index]);

  res.json({ success: true, message: 'Data user berhasil diperbarui', data: dbStore.users[index] });
});

// Reset Password endpoint
router.post('/:id/reset-password', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim().length < 6) {
    res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });
    return;
  }

  const user = dbStore.users.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    return;
  }

  user.password = newPassword.trim();
  dbStore.addLog('ADMIN', 'System Administrator', 'Master User', 'Reset Password User', `Mereset password SSO untuk user '${user.nama}' (@${user.username})`, req.ip);

  // Sync to Firestore
  syncSaveDoc('users', id, user);

  res.json({ success: true, message: `Password SSO user ${user.nama} berhasil direset.` });
});

// Delete user
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const index = dbStore.users.findIndex(u => u.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    return;
  }

  const deletedUser = dbStore.users.splice(index, 1)[0];
  dbStore.addLog('ADMIN', 'System Administrator', 'Master User', 'Hapus User', `Menghapus user '${deletedUser.nama}'`, req.ip);

  // Sync to Firestore
  syncDeleteDoc('users', id);

  res.json({ success: true, message: 'User berhasil dihapus', data: deletedUser });
});

export default router;

