import { Router, Request, Response } from 'express';
import {
  getMysqlStatus,
  isMysqlConfigured,
  mysqlMenuHarian,
  mysqlSiklusMenu,
  mysqlLaporanDistribusi,
  mysqlSuhuOmpreng,
  mysqlBarangDatang,
  sanitizeMysqlImageUrl,
} from '../db';
import { dbStore } from '../services/store';
import { syncSaveDoc, syncDeleteDoc } from '../services/syncService';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/mysql/status
router.get('/status', async (_req: Request, res: Response) => {
  const status = await getMysqlStatus();
  res.json({ success: true, mysql: status });
});

// ============================================================================
// 1. MENU HARIAN (/api/mysql/menu-harian)
// ============================================================================
router.get('/menu-harian', async (req: Request, res: Response) => {
  try {
    const { tanggal, startDate, endDate, search } = req.query;
    const mysqlRows = await mysqlMenuHarian.list({
      tanggal: typeof tanggal === 'string' ? tanggal : undefined,
      startDate: typeof startDate === 'string' ? startDate : undefined,
      endDate: typeof endDate === 'string' ? endDate : undefined,
      search: typeof search === 'string' ? search : undefined,
    });

    if (mysqlRows !== null) {
      res.json({ success: true, source: 'mysql', count: mysqlRows.length, data: mysqlRows });
      return;
    }

    res.json({ success: true, source: 'memory', count: dbStore.menuHarian.length, data: dbStore.menuHarian });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal membaca menu harian MySQL' });
  }
});

router.post('/menu-harian', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const namaMenu = String(body.namaMenu || body.nama_menu || '').trim();
    if (!namaMenu) {
      res.status(400).json({ success: false, message: 'Nama Menu wajib diisi' });
      return;
    }

    const imageUrl = sanitizeMysqlImageUrl(body.image_url ?? body.fotoMenuUrl);
    const id = String(body.id || `MENU-${Date.now()}`);
    const record = {
      ...body,
      id,
      namaMenu,
      tanggalOperasional: String(body.tanggalOperasional || body.tanggal_operasional || new Date().toISOString().split('T')[0]),
      fotoMenuUrl: imageUrl,
      image_url: imageUrl,
    };

    if (isMysqlConfigured()) {
      await mysqlMenuHarian.upsert(record);
    }

    const existing = dbStore.menuHarian.find((m) => m.id === id);
    if (existing) {
      dbStore.updateMenuHarian(id, record);
    } else {
      dbStore.addMenuHarian(record);
    }
    await syncSaveDoc('menuHarian', id, record);

    res.status(201).json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal menyimpan menu harian ke MySQL' });
  }
});

router.put('/menu-harian/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const existing = dbStore.menuHarian.find((m) => m.id === id);
    const imageUrl = sanitizeMysqlImageUrl(body.image_url ?? body.fotoMenuUrl ?? existing?.fotoMenuUrl);
    const updatedRecord = {
      ...(existing || {}),
      ...body,
      id,
      fotoMenuUrl: imageUrl,
      image_url: imageUrl,
    };

    if (isMysqlConfigured()) {
      await mysqlMenuHarian.upsert(updatedRecord);
    }
    dbStore.updateMenuHarian(id, updatedRecord);
    await syncSaveDoc('menuHarian', id, updatedRecord);

    res.json({ success: true, data: updatedRecord });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal memperbarui menu harian MySQL' });
  }
});

router.delete('/menu-harian/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isMysqlConfigured()) {
      await mysqlMenuHarian.delete(id);
    }
    dbStore.deleteMenuHarian(id);
    await syncDeleteDoc('menuHarian', id);
    res.json({ success: true, message: 'Menu harian berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal menghapus menu harian MySQL' });
  }
});

// ============================================================================
// 2. SIKLUS MENU (/api/mysql/siklus-menu)
// ============================================================================
router.get('/siklus-menu', async (req: Request, res: Response) => {
  try {
    const tanggal = typeof req.query.tanggal === 'string' ? req.query.tanggal : undefined;
    const mysqlRows = await mysqlSiklusMenu.list({ tanggal });
    if (mysqlRows !== null) {
      res.json({ success: true, source: 'mysql', count: mysqlRows.length, data: mysqlRows });
      return;
    }
    res.json({ success: true, source: 'memory', count: 0, data: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal membaca siklus menu MySQL' });
  }
});

router.post('/siklus-menu', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const tanggal = String(body.tanggal || '').trim();
    if (!tanggal) {
      res.status(400).json({ success: false, message: 'Tanggal siklus menu wajib diisi' });
      return;
    }

    const imageUrl = sanitizeMysqlImageUrl(body.image_url ?? body.imageUrl ?? body.fotoUrl);
    const id = String(body.id || `SIKLUS-${tanggal.replace(/[^0-9]/g, '')}`);
    const record = {
      ...body,
      id,
      tanggal,
      imageUrl,
      image_url: imageUrl,
    };

    if (isMysqlConfigured()) {
      await mysqlSiklusMenu.upsert(record);
    }
    await syncSaveDoc('siklus_menu', id, record);

    res.status(201).json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal menyimpan siklus menu ke MySQL' });
  }
});

router.put('/siklus-menu/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const imageUrl = sanitizeMysqlImageUrl(body.image_url ?? body.imageUrl ?? body.fotoUrl);
    const record = {
      ...body,
      id,
      tanggal: String(body.tanggal || id.replace('SIKLUS-', '')),
      imageUrl,
      image_url: imageUrl,
    };
    if (isMysqlConfigured()) {
      await mysqlSiklusMenu.upsert(record);
    }
    await syncSaveDoc('siklus_menu', id, record);
    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal memperbarui siklus menu MySQL' });
  }
});

router.delete('/siklus-menu/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isMysqlConfigured()) {
      await mysqlSiklusMenu.delete(id);
    }
    await syncDeleteDoc('siklus_menu', id);
    res.json({ success: true, message: 'Siklus menu berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal menghapus siklus menu MySQL' });
  }
});

// ============================================================================
// 3. LAPORAN DISTRIBUSI (/api/mysql/laporan-distribusi)
// ============================================================================
router.get('/laporan-distribusi', async (req: Request, res: Response) => {
  try {
    const { tanggal, startDate, endDate, search } = req.query;
    const mysqlRows = await mysqlLaporanDistribusi.list({
      tanggal: typeof tanggal === 'string' ? tanggal : undefined,
      startDate: typeof startDate === 'string' ? startDate : undefined,
      endDate: typeof endDate === 'string' ? endDate : undefined,
      search: typeof search === 'string' ? search : undefined,
    });
    if (mysqlRows !== null) {
      res.json({ success: true, source: 'mysql', count: mysqlRows.length, data: mysqlRows });
      return;
    }
    res.json({ success: true, source: 'memory', count: dbStore.distributionReports.length, data: dbStore.distributionReports });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal membaca laporan distribusi MySQL' });
  }
});

router.post('/laporan-distribusi', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    if (!body.tanggal || !body.namaInstansi) {
      res.status(400).json({ success: false, message: 'Tanggal dan Nama Instansi wajib diisi' });
      return;
    }

    const imageUrl = sanitizeMysqlImageUrl(body.image_url ?? body.dokPengiriman);
    const imageUrlPenjemputan = sanitizeMysqlImageUrl(body.image_url_penjemputan ?? body.dokPenjemputan);
    const id = String(body.id || `DST-${String(body.tanggal).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`);
    const record = {
      ...body,
      id,
      dokPengiriman: imageUrl,
      dokPenjemputan: imageUrlPenjemputan,
      image_url: imageUrl,
      image_url_penjemputan: imageUrlPenjemputan,
    };

    if (isMysqlConfigured()) {
      await mysqlLaporanDistribusi.upsert(record);
    }

    const idx = dbStore.distributionReports.findIndex((r) => r.id === id);
    if (idx >= 0) {
      dbStore.distributionReports[idx] = { ...dbStore.distributionReports[idx], ...record };
    } else {
      dbStore.distributionReports.unshift(record);
    }
    await syncSaveDoc('distributionReports', id, record);
    await syncSaveDoc('distribution_reports', id, record);

    res.status(201).json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal menyimpan laporan distribusi ke MySQL' });
  }
});

router.put('/laporan-distribusi/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const idx = dbStore.distributionReports.findIndex((r) => r.id === id);
    const existing = idx >= 0 ? dbStore.distributionReports[idx] : undefined;

    const imageUrl = sanitizeMysqlImageUrl(body.image_url ?? body.dokPengiriman ?? existing?.dokPengiriman);
    const imageUrlPenjemputan = sanitizeMysqlImageUrl(
      body.image_url_penjemputan ?? body.dokPenjemputan ?? existing?.dokPenjemputan
    );
    const updated = {
      ...(existing || {}),
      ...body,
      id,
      dokPengiriman: imageUrl,
      dokPenjemputan: imageUrlPenjemputan,
      image_url: imageUrl,
      image_url_penjemputan: imageUrlPenjemputan,
      updatedAt: new Date().toISOString(),
    };

    if (isMysqlConfigured()) {
      await mysqlLaporanDistribusi.upsert(updated);
    }
    if (idx >= 0) {
      dbStore.distributionReports[idx] = updated;
    }
    await syncSaveDoc('distributionReports', id, updated);
    await syncSaveDoc('distribution_reports', id, updated);

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal memperbarui laporan distribusi MySQL' });
  }
});

router.delete('/laporan-distribusi/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isMysqlConfigured()) {
      await mysqlLaporanDistribusi.delete(id);
    }
    const idx = dbStore.distributionReports.findIndex((r) => r.id === id);
    if (idx >= 0) {
      dbStore.distributionReports.splice(idx, 1);
    }
    await syncDeleteDoc('distributionReports', id);
    await syncDeleteDoc('distribution_reports', id);
    res.json({ success: true, message: 'Laporan distribusi berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal menghapus laporan distribusi MySQL' });
  }
});

// ============================================================================
// 4. SUHU OMPRENG (/api/mysql/suhu-ompreng)
// ============================================================================
router.get('/suhu-ompreng', async (req: Request, res: Response) => {
  try {
    const { tanggal, jenisPengukuran } = req.query;
    const mysqlRows = await mysqlSuhuOmpreng.list({
      tanggal: typeof tanggal === 'string' ? tanggal : undefined,
      jenisPengukuran: typeof jenisPengukuran === 'string' ? jenisPengukuran : undefined,
    });
    if (mysqlRows !== null) {
      res.json({ success: true, source: 'mysql', count: mysqlRows.length, data: mysqlRows });
      return;
    }
    res.json({ success: true, source: 'memory', count: 0, data: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal membaca suhu ompreng MySQL' });
  }
});

router.post('/suhu-ompreng', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    if (!body.tanggal) {
      res.status(400).json({ success: false, message: 'Tanggal suhu ompreng wajib diisi' });
      return;
    }
    const id = String(body.id || `SUHU-${String(body.tanggal).replace(/[^0-9]/g, '')}-${Date.now().toString().slice(-4)}`);
    const record = { ...body, id };

    if (isMysqlConfigured()) {
      await mysqlSuhuOmpreng.upsert(record);
    }
    const collName =
      body.jenisPengukuran === 'Pengolahan' ? 'suhu_pengolahan_v2' : 'suhu_masuk_ompreng_v2';
    await syncSaveDoc(collName, id, record);

    res.status(201).json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal menyimpan suhu ompreng ke MySQL' });
  }
});

router.put('/suhu-ompreng/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const record = { ...body, id };

    if (isMysqlConfigured()) {
      await mysqlSuhuOmpreng.upsert(record);
    }
    const collName =
      body.jenisPengukuran === 'Pengolahan' ? 'suhu_pengolahan_v2' : 'suhu_masuk_ompreng_v2';
    await syncSaveDoc(collName, id, record);

    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal memperbarui suhu ompreng MySQL' });
  }
});

router.delete('/suhu-ompreng/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isMysqlConfigured()) {
      await mysqlSuhuOmpreng.delete(id);
    }
    await syncDeleteDoc('suhu_masuk_ompreng_v2', id);
    res.json({ success: true, message: 'Data suhu ompreng berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal menghapus suhu ompreng MySQL' });
  }
});

// ============================================================================
// 5. LOGISTIK / BARANG DATANG (/api/mysql/logistik)
// ============================================================================
router.get('/logistik', async (req: Request, res: Response) => {
  try {
    const { tanggal, startDate, endDate } = req.query;
    const mysqlRows = await mysqlBarangDatang.list({
      tanggal: typeof tanggal === 'string' ? tanggal : undefined,
      startDate: typeof startDate === 'string' ? startDate : undefined,
      endDate: typeof endDate === 'string' ? endDate : undefined,
    });
    if (mysqlRows !== null) {
      res.json({ success: true, source: 'mysql', count: mysqlRows.length, data: mysqlRows });
      return;
    }
    res.json({ success: true, source: 'memory', count: dbStore.barangDatang.length, data: dbStore.barangDatang });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal membaca data logistik MySQL' });
  }
});

router.post('/logistik', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    if (!body.namaBarang) {
      res.status(400).json({ success: false, message: 'Nama barang wajib diisi' });
      return;
    }
    const imageUrl = sanitizeMysqlImageUrl(body.image_url ?? body.dokumentasiUrl);
    const id = String(body.id || `BD-${Date.now()}`);
    const record = {
      ...body,
      id,
      dokumentasiUrl: imageUrl,
      image_url: imageUrl,
    };
    if (isMysqlConfigured()) {
      await mysqlBarangDatang.upsert(record);
    }
    await syncSaveDoc('barangDatang', id, record);
    res.status(201).json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal menyimpan data logistik MySQL' });
  }
});

router.put('/logistik/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const imageUrl = sanitizeMysqlImageUrl(body.image_url ?? body.dokumentasiUrl);
    const record = {
      ...body,
      id,
      dokumentasiUrl: imageUrl,
      image_url: imageUrl,
    };
    if (isMysqlConfigured()) {
      await mysqlBarangDatang.upsert(record);
    }
    await syncSaveDoc('barangDatang', id, record);
    res.json({ success: true, data: record });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal memperbarui data logistik MySQL' });
  }
});

router.delete('/logistik/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isMysqlConfigured()) {
      await mysqlBarangDatang.delete(id);
    }
    dbStore.deleteBarangDatang(id);
    await syncDeleteDoc('barangDatang', id);
    res.json({ success: true, message: 'Data logistik berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Gagal menghapus data logistik MySQL' });
  }
});

export default router;
