import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';

const router = Router();

// Get Portal Settings
router.get('/', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.settings });
});

// Update Settings
router.put('/', (req: Request, res: Response): void => {
  dbStore.settings = { ...dbStore.settings, ...req.body };
  dbStore.addLog('ADMIN', 'System Administrator', 'Pengaturan Portal', 'Update Configuration', 'Memperbarui konfigurasi utama portal', req.ip);
  res.json({ success: true, message: 'Pengaturan Portal berhasil disimpan', data: dbStore.settings });
});

// Backup System State (JSON Export)
router.get('/backup/export', (req: Request, res: Response): void => {
  const snapshot = {
    timestamp: new Date().toISOString(),
    version: '2026.1.0-Enterprise',
    settings: dbStore.settings,
    users: dbStore.users,
    roles: dbStore.roles,
    menus: dbStore.menus,
    pegawai: dbStore.pegawai,
    divisi: dbStore.divisi,
    jabatan: dbStore.jabatan,
    gudang: dbStore.gudang,
    kategori: dbStore.kategori,
    instansi: dbStore.instansi,
    suratMasuk: dbStore.suratMasuk,
    suratKeluar: dbStore.suratKeluar,
    disposisi: dbStore.disposisi,
    templates: dbStore.templates,
    barang: dbStore.barang,
    stockMovements: dbStore.stockMovements,
    opnameSessions: dbStore.opnameSessions,
    notifications: dbStore.notifications,
    activityLogs: dbStore.activityLogs
  };

  dbStore.addLog('ADMIN', 'System Administrator', 'Pengaturan Portal', 'Database Backup Export', 'Mengekspor cadangan sistem JSON', req.ip);

  res.json({ success: true, data: snapshot });
});

// Restore System State (JSON Import)
router.post('/backup/restore', (req: Request, res: Response): void => {
  const { data } = req.body;
  if (!data) {
    res.status(400).json({ success: false, message: 'Payload restore data tidak valid.' });
    return;
  }

  if (data.users) dbStore.users = data.users;
  if (data.menus) dbStore.menus = data.menus;
  if (data.pegawai) dbStore.pegawai = data.pegawai;
  if (data.barang) dbStore.barang = data.barang;
  if (data.suratMasuk) dbStore.suratMasuk = data.suratMasuk;
  if (data.settings) dbStore.settings = data.settings;

  dbStore.addLog('ADMIN', 'System Administrator', 'Pengaturan Portal', 'Database Restore', 'Memulihkan data sistem dari cadangan JSON', req.ip);

  res.json({ success: true, message: 'Restore data sistem berhasil diselesaikan.' });
});

export default router;
