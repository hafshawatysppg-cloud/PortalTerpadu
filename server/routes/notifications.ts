import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';

const router = Router();

// Get all notifications
router.get('/', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.notifications });
});

// Mark all as read or single as read
router.put('/read-all', (req: Request, res: Response): void => {
  dbStore.notifications.forEach(n => n.isRead = true);
  res.json({ success: true, message: 'Semua notifikasi telah ditandai dibaca.' });
});

router.put('/:id/read', (req: Request, res: Response): void => {
  const ntf = dbStore.notifications.find(n => n.id === req.params.id);
  if (ntf) {
    ntf.isRead = true;
    res.json({ success: true, data: ntf });
  } else {
    res.status(404).json({ success: false, message: 'Notifikasi tidak ditemukan.' });
  }
});

// Post new notification
router.post('/', (req: Request, res: Response): void => {
  const { modul, judul, pesan, tipe, linkUrl } = req.body;
  dbStore.addNotification(modul || 'System', judul, pesan, tipe || 'info', linkUrl);
  res.status(201).json({ success: true, message: 'Notifikasi berhasil dikirim.' });
});

export default router;
