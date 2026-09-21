import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';

const router = Router();

// Get all roles & permissions matrix
router.get('/', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.roles });
});

// Update role permissions
router.put('/:roleName', (req: Request, res: Response): void => {
  const { roleName } = req.params;
  const index = dbStore.roles.findIndex(r => r.role === roleName);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Role tidak ditemukan.' });
    return;
  }

  dbStore.roles[index] = {
    ...dbStore.roles[index],
    ...req.body
  };

  dbStore.addLog('ADMIN', 'System Administrator', 'Manajemen Hak Akses', 'Update Role Matrix', `Mengubah hak akses untuk role ${roleName}`, req.ip);

  res.json({ success: true, message: 'Matrix Hak Akses berhasil diperbarui', data: dbStore.roles[index] });
});

export default router;
