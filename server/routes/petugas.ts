import { Router, Request, Response } from 'express';
import { dbStore, angkaKeTerbilang } from '../db/store';
import { Petugas, SlipGajiHarian } from '../../src/types';
import {
  syncSaveDoc,
  syncSaveBatch,
  syncDeleteDoc,
  syncSaveDocNow,
  syncSaveBatchNow,
  syncDeleteDocNow,
  saveSnapshotToDiskNow
} from '../db/firestore';

const router = Router();

// ==========================================
// 1. DAFTAR PETUGAS ENDPOINTS
// ==========================================

/**
 * GET /api/petugas
 * Mengambil seluruh daftar petugas dengan opsi filter pencarian, jabatan, dan status.
 */
router.get('/', (req: Request, res: Response) => {
  try {
    let list = dbStore.getPetugasList();
    const { q, jabatan, status } = req.query;

    if (q && typeof q === 'string') {
      const query = q.toLowerCase();
      list = list.filter(p =>
        p.nama.toLowerCase().includes(query) ||
        p.nomor.toLowerCase().includes(query) ||
        p.jabatan.toLowerCase().includes(query) ||
        p.alamat.toLowerCase().includes(query)
      );
    }

    if (jabatan && typeof jabatan === 'string' && jabatan !== 'Semua') {
      list = list.filter(p => p.jabatan.toLowerCase() === jabatan.toLowerCase());
    }

    if (status && typeof status === 'string' && status !== 'Semua') {
      list = list.filter(p => p.status.toLowerCase() === status.toLowerCase());
    }

    return res.json({
      success: true,
      total: list.length,
      data: list
    });
  } catch (error: any) {
    console.error('Error fetching petugas:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data petugas', error: error.message });
  }
});

// ==========================================
// 1.5. REKAP ABSENSI HARIAN ENDPOINTS
// ==========================================

/**
 * GET /api/petugas/absensi
 * Mengambil data rekap absensi pada tanggal tertentu (atau draft otomatis jika belum ada).
 */
router.get('/absensi', (req: Request, res: Response) => {
  try {
    const tanggal = (req.query.tanggal as string) || new Date().toISOString().split('T')[0];
    const data = dbStore.getRekapAbsensi(tanggal);
    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error fetching absensi:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil rekap absensi', error: error.message });
  }
});

/**
 * POST /api/petugas/absensi
 * Menyimpan rekap absensi dan otomatis memfilter karyawan yang tidak masuk serta menyinkronkan ke slip gaji harian.
 */
router.post('/absensi', async (req: Request, res: Response) => {
  try {
    const { tanggal, items } = req.body;
    if (!tanggal || !items) {
      return res.status(400).json({ success: false, message: 'Parameter tanggal dan items absensi wajib diisi' });
    }

    const autoSync = req.body.autoSync !== false;
    const result = dbStore.saveRekapAbsensi(req.body, autoSync);

    // Sync absensi and generated slips to Firestore in batch
    await syncSaveDocNow('rekapAbsensiList', result.absensi.id, result.absensi);
    if (result.generatedSlips.length > 0) {
      await syncSaveBatchNow('slipGajiList', result.generatedSlips);
    }

    return res.json({
      success: true,
      message: `Rekap absensi tanggal ${tanggal} berhasil disimpan. ${result.absensi.totalMasuk} petugas masuk otomatis masuk ke rekap slip gaji (${result.absensi.totalTidakMasuk} petugas tidak masuk difilter).`,
      data: result.absensi,
      slips: result.generatedSlips
    });
  } catch (error: any) {
    console.error('Error saving absensi:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan rekap absensi', error: error.message });
  }
});

// ==========================================
// 2. SLIP GAJI HARIAN ENDPOINTS
// (PENTING: Definisikan rute spesifik sebelum /:id agar tidak tertabrak)
// ==========================================

/**
 * GET /api/petugas/slip-gaji
 * Mengambil daftar slip gaji harian dengan opsi filter tanggal, petugasId, dan status bayar.
 */
router.get('/slip-gaji', (req: Request, res: Response) => {
  try {
    const { tanggal, petugasId, status, bulan, tahun } = req.query;
    let list = dbStore.getSlipGajiList({
      tanggal: typeof tanggal === 'string' ? tanggal : undefined,
      petugasId: typeof petugasId === 'string' ? petugasId : undefined,
      status: typeof status === 'string' && status !== 'Semua' ? status : undefined
    });

    if (bulan && typeof bulan === 'string' && bulan !== 'Semua') {
      list = list.filter(s => {
        const parts = s.tanggal.split('-');
        return parts.length >= 2 && parts[1] === bulan.padStart(2, '0');
      });
    }

    if (tahun && typeof tahun === 'string' && tahun !== 'Semua') {
      list = list.filter(s => s.tanggal.startsWith(tahun));
    }

    return res.json({
      success: true,
      total: list.length,
      data: list
    });
  } catch (error: any) {
    console.error('Error fetching slip gaji:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data slip gaji', error: error.message });
  }
});

/**
 * GET /api/petugas/rekap-harian
 * Mengambil ringkasan rekapitulasi gaji harian pada tanggal tertentu.
 */
router.get('/rekap-harian', (req: Request, res: Response) => {
  try {
    const tanggal = (req.query.tanggal as string) || new Date().toISOString().split('T')[0];
    const summary = dbStore.getRekapGajiHarian(tanggal);
    return res.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    console.error('Error fetching rekap harian:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil rekapitulasi harian', error: error.message });
  }
});

/**
 * POST /api/petugas/slip-gaji/batch-generate
 * Generate massal slip gaji harian untuk seluruh petugas aktif pada tanggal yang ditentukan.
 */
router.post('/slip-gaji/batch-generate', async (req: Request, res: Response) => {
  try {
    const { tanggal } = req.body;
    if (!tanggal) {
      return res.status(400).json({ success: false, message: 'Parameter tanggal diperlukan (YYYY-MM-DD)' });
    }

    const generated = dbStore.generateDailySlipBatch(tanggal);

    // Sync generated slips to Firestore in batch
    if (generated.length > 0) {
      await syncSaveBatchNow('slipGajiList', generated);
    }

    return res.json({
      success: true,
      message: `Berhasil membuat ${generated.length} slip gaji harian untuk tanggal ${tanggal}`,
      generatedCount: generated.length,
      data: generated
    });
  } catch (error: any) {
    console.error('Error generating batch slip gaji:', error);
    return res.status(500).json({ success: false, message: 'Gagal generate slip gaji massal', error: error.message });
  }
});

/**
 * GET /api/petugas/slip-gaji/:slipId
 * Detail slip gaji harian berdasarkan ID.
 */
router.get('/slip-gaji/:slipId', (req: Request, res: Response) => {
  try {
    const slip = dbStore.getSlipGajiById(req.params.slipId);
    if (!slip) {
      return res.status(404).json({ success: false, message: 'Slip gaji tidak ditemukan' });
    }
    return res.json({ success: true, data: slip });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil slip gaji', error: error.message });
  }
});

/**
 * POST /api/petugas/slip-gaji
 * Membuat atau memperbarui slip gaji harian.
 */
router.post('/slip-gaji', async (req: Request, res: Response) => {
  try {
    const payload = req.body as Partial<SlipGajiHarian>;
    if (!payload.petugasId && !payload.namaPetugas) {
      return res.status(400).json({ success: false, message: 'Data petugas wajib diisi' });
    }

    const saved = dbStore.saveSlipGaji(payload);
    await syncSaveDoc('slipGajiList', saved.id, saved);

    return res.json({
      success: true,
      message: 'Slip gaji harian berhasil disimpan',
      data: saved
    });
  } catch (error: any) {
    console.error('Error saving slip gaji:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan slip gaji', error: error.message });
  }
});

/**
 * PATCH /api/petugas/slip-gaji/:slipId/status
 * Memperbarui status pembayaran slip gaji (Lunas / Belum Dibayar).
 */
router.patch('/slip-gaji/:slipId/status', async (req: Request, res: Response) => {
  try {
    const { statusPembayaran, metodePembayaran } = req.body;
    const slip = dbStore.getSlipGajiById(req.params.slipId);
    if (!slip) {
      return res.status(404).json({ success: false, message: 'Slip gaji tidak ditemukan' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const updated = dbStore.saveSlipGaji({
      ...slip,
      statusPembayaran: statusPembayaran || slip.statusPembayaran,
      metodePembayaran: metodePembayaran || slip.metodePembayaran,
      tanggalBayar: statusPembayaran === 'Lunas' ? todayStr : undefined,
      jamBayar: statusPembayaran === 'Lunas' ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : undefined
    });

    await syncSaveDoc('slipGajiList', updated.id, updated);

    return res.json({
      success: true,
      message: `Status pembayaran slip gaji berhasil diubah menjadi ${updated.statusPembayaran}`,
      data: updated
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui status bayar', error: error.message });
  }
});

/**
 * DELETE /api/petugas/slip-gaji/:slipId
 * Menghapus slip gaji harian.
 */
router.delete('/slip-gaji/:slipId', async (req: Request, res: Response) => {
  try {
    const ok = dbStore.deleteSlipGaji(req.params.slipId);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Slip gaji tidak ditemukan' });
    }
    await syncDeleteDoc('slipGajiList', req.params.slipId);
    return res.json({ success: true, message: 'Slip gaji harian berhasil dihapus' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus slip gaji', error: error.message });
  }
});

/**
 * POST /api/petugas/resequence
 * Mengurutkan seluruh nomer urut daftar petugas mulai dari 01 dari atas ke bawah.
 */
router.post('/resequence', async (_req: Request, res: Response) => {
  try {
    const updated = dbStore.resequencePetugasNomor();
    if (updated.length > 0) {
      await syncSaveBatchNow('petugasList', updated);
    }
    saveSnapshotToDiskNow();
    return res.json({
      success: true,
      message: `Semua ${updated.length} nomer urut petugas berhasil diurutkan mulai dari 01 dari atas`,
      total: updated.length,
      data: updated
    });
  } catch (error: any) {
    console.error('Error resequencing petugas:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengurutkan nomer urut petugas', error: error.message });
  }
});

/**
 * POST /api/petugas/batch
 * Menambah banyak data petugas sekaligus (tanpa batasan jumlah, mendukung 50+ data sekaligus).
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const validItems = rawItems
      .map((item: any) => ({
        ...item,
        nama: String(item?.nama || '').trim(),
        jabatan: String(item?.jabatan || '').trim() || 'Staf Operasional',
        alamat: String(item?.alamat ?? '').trim() || '-',
        besaranGaji: Math.max(0, Number(item?.besaranGaji ?? 120000) || 0)
      }))
      .filter((item: any) => item.nama.length > 0);

    if (validItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimal 1 data petugas dengan nama yang valid wajib diisi.'
      });
    }

    const created = dbStore.savePetugasBatch(validItems);
    if (created.length > 0) {
      await syncSaveBatchNow('petugasList', created);
    }
    saveSnapshotToDiskNow();

    const allList = dbStore.getPetugasList();
    return res.json({
      success: true,
      message: `Berhasil menambahkan ${created.length} petugas baru (Total saat ini: ${allList.length} petugas)`,
      count: created.length,
      total: allList.length,
      data: created,
      allData: allList
    });
  } catch (error: any) {
    console.error('Error batch creating petugas:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan data petugas massal',
      error: error.message
    });
  }
});

// ==========================================
// 3. DETAIL & CRUD PETUGAS
// ==========================================

/**
 * GET /api/petugas/:id
 * Detail petugas berdasarkan ID atau Nomer.
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const petugas = dbStore.getPetugasById(req.params.id);
    if (!petugas) {
      return res.status(404).json({ success: false, message: 'Petugas tidak ditemukan' });
    }
    return res.json({ success: true, data: petugas });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail petugas', error: error.message });
  }
});

/**
 * POST /api/petugas
 * Menambah data petugas baru (tanpa batas jumlah) atau memperbarui data petugas yang sudah ada.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const rawBody = (req.body || {}) as Partial<Petugas> & { _mode?: string };
    const isCreateMode = rawBody._mode === 'create' || !rawBody.id;
    const { _mode, ...payload } = rawBody;

    const cleanNama = String(payload.nama || '').trim();
    const cleanJabatan = String(payload.jabatan || '').trim();
    if (!cleanNama || !cleanJabatan) {
      return res.status(400).json({ success: false, message: 'Nama dan jabatan wajib diisi' });
    }

    const normalizedPayload: Partial<Petugas> = {
      ...payload,
      nama: cleanNama,
      jabatan: cleanJabatan,
      alamat: String(payload.alamat ?? '').trim() || '-'
    };

    const saved = dbStore.savePetugas(normalizedPayload, { forceCreate: isCreateMode });
    await syncSaveDocNow('petugasList', saved.id, saved);
    saveSnapshotToDiskNow();

    const allList = dbStore.getPetugasList();
    return res.json({
      success: true,
      message: isCreateMode ? 'Petugas baru berhasil ditambahkan' : 'Data petugas berhasil diperbarui',
      data: saved,
      allData: allList,
      total: allList.length
    });
  } catch (error: any) {
    console.error('Error saving petugas:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan data petugas', error: error.message });
  }
});

/**
 * PUT /api/petugas/:id
 * Memperbarui data petugas berdasarkan ID.
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = (req.body || {}) as Partial<Petugas>;
    const cleanNama = String(payload.nama || '').trim();
    const cleanJabatan = String(payload.jabatan || '').trim();
    if (!cleanNama || !cleanJabatan) {
      return res.status(400).json({ success: false, message: 'Nama dan jabatan wajib diisi' });
    }

    const saved = dbStore.savePetugas(
      {
        ...payload,
        id,
        nama: cleanNama,
        jabatan: cleanJabatan,
        alamat: String(payload.alamat ?? '').trim() || '-'
      },
      { forceCreate: false }
    );
    await syncSaveDocNow('petugasList', saved.id, saved);
    saveSnapshotToDiskNow();

    const allList = dbStore.getPetugasList();
    return res.json({
      success: true,
      message: 'Data petugas berhasil diperbarui',
      data: saved,
      allData: allList,
      total: allList.length
    });
  } catch (error: any) {
    console.error('Error updating petugas:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data petugas', error: error.message });
  }
});

/**
 * DELETE /api/petugas/:id
 * Menghapus data petugas.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const ok = dbStore.deletePetugas(req.params.id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Petugas tidak ditemukan' });
    }
    await syncDeleteDocNow('petugasList', req.params.id);
    saveSnapshotToDiskNow();
    const allList = dbStore.getPetugasList();
    return res.json({
      success: true,
      message: 'Data petugas berhasil dihapus',
      allData: allList,
      total: allList.length
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus data petugas', error: error.message });
  }
});

export default router;
