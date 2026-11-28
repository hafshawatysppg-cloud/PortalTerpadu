import { Router, Request, Response } from 'express';
import { dbStore } from '../services/store';
import { DriverStaff, DistributionReport } from '../../src/types';
import { syncSaveDoc, syncDeleteDoc } from '../services/syncService';
import { isMysqlConfigured, mysqlLaporanDistribusi } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

// --- DRIVERS ENDPOINTS ---

// GET /api/v1/distribusi/drivers
router.get('/drivers', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.drivers });
});

// POST /api/v1/distribusi/drivers
router.post('/drivers', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { nama, telepon, noSim, kendaraan, platNomor, foto, status, catatan } = req.body;

  if (!nama) {
    res.status(400).json({ success: false, message: 'Nama driver wajib diisi.' });
    return;
  }

  const newDriver: DriverStaff = {
    id: `DRV-${Date.now().toString().slice(-6)}`,
    nama,
    telepon: telepon || '-',
    noSim: noSim || '-',
    kendaraan: kendaraan || 'Armada Box',
    platNomor: platNomor || '-',
    foto: foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    status: status || 'Aktif',
    catatan: catatan || '',
    createdAt: new Date().toISOString()
  };

  dbStore.drivers.unshift(newDriver);
  await syncSaveDoc('drivers', newDriver.id, newDriver);

  dbStore.addLog('ADMIN', 'Operator Distribusi', 'Laporan Distribusi', 'Tambah Driver', `Menambahkan driver baru ${nama}`, req.ip);

  res.status(201).json({ success: true, message: 'Driver berhasil ditambahkan', data: newDriver });
});

// PUT /api/v1/distribusi/drivers/:id
router.put('/drivers/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = dbStore.drivers.findIndex(d => d.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Driver tidak ditemukan.' });
    return;
  }

  dbStore.drivers[index] = {
    ...dbStore.drivers[index],
    ...req.body
  };

  await syncSaveDoc('drivers', id, dbStore.drivers[index]);
  dbStore.addLog('ADMIN', 'Operator Distribusi', 'Laporan Distribusi', 'Edit Driver', `Memperbarui data driver ${dbStore.drivers[index].nama}`, req.ip);

  res.json({ success: true, message: 'Driver berhasil diperbarui', data: dbStore.drivers[index] });
});

// DELETE /api/v1/distribusi/drivers/:id
router.delete('/drivers/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = dbStore.drivers.findIndex(d => d.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Driver tidak ditemukan.' });
    return;
  }

  const deletedDriver = dbStore.drivers.splice(index, 1)[0];
  await syncDeleteDoc('drivers', id);
  dbStore.addLog('ADMIN', 'Operator Distribusi', 'Laporan Distribusi', 'Hapus Driver', `Menghapus driver ${deletedDriver.nama}`, req.ip);

  res.json({ success: true, message: 'Driver berhasil dihapus', data: deletedDriver });
});

// --- DISTRIBUTION REPORTS ENDPOINTS ---

// GET /api/v1/distribusi/reports
router.get('/reports', async (req: Request, res: Response): Promise<void> => {
  const { tanggal, startDate, endDate, search } = req.query;

  let results = [...dbStore.distributionReports];
  if (isMysqlConfigured()) {
    try {
      const mysqlRows = await mysqlLaporanDistribusi.list();
      if (Array.isArray(mysqlRows) && mysqlRows.length > 0) {
        const merged = new Map<string, DistributionReport>();
        for (const r of results) merged.set(r.id, r);
        for (const r of mysqlRows as unknown as DistributionReport[]) {
          merged.set(r.id, r);
        }
        results = Array.from(merged.values());
      }
    } catch (err: any) {
      console.warn('[MySQL] Fallback to memory store on GET /distribusi/reports:', err?.message || err);
    }
  }

  if (tanggal && typeof tanggal === 'string') {
    results = results.filter(r => r.tanggal === tanggal);
  }

  if (startDate && typeof startDate === 'string') {
    results = results.filter(r => r.tanggal >= startDate);
  }

  if (endDate && typeof endDate === 'string') {
    results = results.filter(r => r.tanggal <= endDate);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(r => 
      r.namaInstansi.toLowerCase().includes(q) ||
      r.driverNama.toLowerCase().includes(q) ||
      (r.catatan && r.catatan.toLowerCase().includes(q))
    );
  }

  results.sort((a, b) => new Date(b.createdAt || b.tanggal).getTime() - new Date(a.createdAt || a.tanggal).getTime());

  res.json({ success: true, data: results });
});

// POST /api/v1/distribusi/reports
router.post('/reports', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const {
    tanggal,
    driverId,
    driverNama,
    driverFoto,
    driverKendaraan,
    instansiId,
    namaInstansi,
    jumlahPenerimaManfaat,
    jamPengiriman,
    jamPenjemputan,
    dokPengiriman,
    dokPenjemputan,
    catatan,
    status
  } = req.body;

  if (!tanggal || !driverNama || !namaInstansi) {
    res.status(400).json({ success: false, message: 'Tanggal, Distributor, dan Nama Sekolah/Instansi wajib diisi.' });
    return;
  }

  const newReport: DistributionReport = {
    id: `DST-${tanggal.replace(/-/g, '')}-${String(dbStore.distributionReports.length + 1).padStart(3, '0')}`,
    tanggal,
    driverId: driverId || 'DRV-GENERAL',
    driverNama,
    driverFoto: driverFoto || '',
    driverKendaraan: driverKendaraan || '',
    instansiId: instansiId || '',
    namaInstansi,
    jumlahPenerimaManfaat: Number(jumlahPenerimaManfaat) || 0,
    jamPengiriman: jamPengiriman || '08:00',
    jamPenjemputan: jamPenjemputan || '12:00',
    dokPengiriman: dokPengiriman || '',
    dokPenjemputan: dokPenjemputan || '',
    catatan: catatan || '',
    status: status || 'Selesai',
    createdBy: driverNama || 'Petugas Distribusi',
    createdAt: new Date().toISOString()
  };

  dbStore.distributionReports.unshift(newReport);
  if (isMysqlConfigured()) {
    await mysqlLaporanDistribusi.upsert(newReport);
  }
  await syncSaveDoc('distributionReports', newReport.id, newReport);
  await syncSaveDoc('distribution_reports', newReport.id, newReport);

  dbStore.addLog('DISTRIBUSI', driverNama || 'Petugas Distribusi', 'Laporan Distribusi', 'Tambah Laporan Distribusi', `Input laporan distribusi untuk ${namaInstansi}`, req.ip);

  res.status(201).json({ success: true, message: 'Laporan distribusi berhasil disimpan', data: newReport });
});

// PUT /api/v1/distribusi/reports/:id
router.put('/reports/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = dbStore.distributionReports.findIndex(r => r.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
    return;
  }

  dbStore.distributionReports[index] = {
    ...dbStore.distributionReports[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  if (isMysqlConfigured()) {
    await mysqlLaporanDistribusi.upsert(dbStore.distributionReports[index]);
  }
  await syncSaveDoc('distributionReports', id, dbStore.distributionReports[index]);
  await syncSaveDoc('distribution_reports', id, dbStore.distributionReports[index]);

  dbStore.addLog('DISTRIBUSI', 'Petugas Distribusi', 'Laporan Distribusi', 'Edit Laporan Distribusi', `Update laporan ID ${id}`, req.ip);

  res.json({ success: true, message: 'Laporan distribusi berhasil diperbarui', data: dbStore.distributionReports[index] });
});

// DELETE /api/v1/distribusi/reports/:id
router.delete('/reports/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const index = dbStore.distributionReports.findIndex(r => r.id === id);
  const deletedFromMysql = isMysqlConfigured() ? await mysqlLaporanDistribusi.delete(id) : false;

  if (index === -1 && !deletedFromMysql) {
    res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
    return;
  }

  const deletedReport = index >= 0 ? dbStore.distributionReports.splice(index, 1)[0] : ({ id } as DistributionReport);
  await syncDeleteDoc('distributionReports', id);
  await syncDeleteDoc('distribution_reports', id);

  dbStore.addLog('DISTRIBUSI', 'Petugas Distribusi', 'Laporan Distribusi', 'Hapus Laporan Distribusi', `Menghapus laporan ${deletedReport.id}`, req.ip);

  res.json({ success: true, message: 'Laporan distribusi berhasil dihapus', data: deletedReport });
});

export default router;
