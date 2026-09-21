import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';

const router = Router();

// Get audit activity logs
router.get('/', (req: Request, res: Response): void => {
  const { search, modul, status } = req.query;
  let filtered = [...dbStore.activityLogs];

  if (modul && typeof modul === 'string' && modul !== 'All') {
    filtered = filtered.filter(l => l.modul.toLowerCase().includes(modul.toLowerCase()));
  }

  if (status && typeof status === 'string' && status !== 'All') {
    filtered = filtered.filter(l => l.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(l => 
      l.namaUser.toLowerCase().includes(q) ||
      l.aktivitas.toLowerCase().includes(q) ||
      l.detail?.toLowerCase().includes(q) ||
      l.ipAddress.includes(q)
    );
  }

  res.json({ success: true, data: filtered });
});

export default router;
