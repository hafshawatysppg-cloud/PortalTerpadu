import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { MenuHarianRecord } from '../../src/types';
import { syncSaveDoc, syncDeleteDoc } from '../db/firestore';

const router = Router();

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatIndonesianDate(dateStr: string): { hari: string; formatted: string } {
  try {
    const parts = dateStr.split('-');
    const d = parts.length === 3
      ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      : new Date(dateStr);
    const hari = NAMA_HARI[d.getDay()] || 'Senin';
    const dateNum = String(d.getDate()).padStart(2, '0');
    const monthName = NAMA_BULAN[d.getMonth()] || 'Januari';
    const year = d.getFullYear();
    return {
      hari,
      formatted: `${hari}, ${dateNum} ${monthName} ${year}`
    };
  } catch {
    return { hari: 'Senin', formatted: dateStr };
  }
}

// GET all menu harian with optional filters
router.get('/', (req: Request, res: Response): void => {
  const { tanggal, startDate, endDate, search } = req.query;

  let results = [...dbStore.menuHarian];

  if (tanggal && typeof tanggal === 'string' && tanggal.trim() !== '') {
    results = results.filter(m => m.tanggalOperasional === tanggal.trim());
  }

  if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
    results = results.filter(m => m.tanggalOperasional >= startDate.trim());
  }

  if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
    results = results.filter(m => m.tanggalOperasional <= endDate.trim());
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    results = results.filter(m =>
      m.namaMenu?.toLowerCase().includes(q) ||
      m.kategoriPorsi?.toLowerCase().includes(q) ||
      m.catatanGizi?.toLowerCase().includes(q) ||
      m.hariTanggalFormatted?.toLowerCase().includes(q) ||
      m.petugas?.toLowerCase().includes(q)
    );
  }

  results.sort((a, b) => {
    if (a.tanggalOperasional !== b.tanggalOperasional) {
      return b.tanggalOperasional.localeCompare(a.tanggalOperasional);
    }
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  res.json({
    success: true,
    count: results.length,
    data: results
  });
});

// GET single menu harian by ID
router.get('/:id', (req: Request, res: Response): void => {
  const item = dbStore.menuHarian.find(m => m.id === req.params.id);
  if (!item) {
    res.status(404).json({ success: false, message: 'Data menu harian tidak ditemukan' });
    return;
  }
  res.json({ success: true, data: item });
});

// POST create new menu harian
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      tanggalOperasional,
      namaMenu,
      kategoriPorsi,
      energiKkal,
      proteinGram,
      lemakGram,
      karbohidratGram,
      seratGram,
      giziPorsiBesar,
      giziPorsiKecil,
      rincianKomponen,
      catatanGizi,
      fotoMenuUrl,
      fotoFileName,
      fotoFileSizeKb,
      petugas
    } = req.body;

    if (!namaMenu || String(namaMenu).trim() === '') {
      res.status(400).json({ success: false, message: 'Nama Menu wajib diisi' });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const finalTanggal = tanggalOperasional && String(tanggalOperasional).trim() !== ''
      ? String(tanggalOperasional).trim()
      : todayStr;
    const { hari, formatted } = formatIndonesianDate(finalTanggal);

    const parsedBesar = {
      energiKkal: Number(giziPorsiBesar?.energiKkal ?? energiKkal) || 0,
      proteinGram: Number(giziPorsiBesar?.proteinGram ?? proteinGram) || 0,
      lemakGram: Number(giziPorsiBesar?.lemakGram ?? lemakGram) || 0,
      karbohidratGram: Number(giziPorsiBesar?.karbohidratGram ?? karbohidratGram) || 0,
      seratGram: Number(giziPorsiBesar?.seratGram ?? seratGram) || 0,
      keterangan: giziPorsiBesar?.keterangan ? String(giziPorsiBesar.keterangan).trim() : ''
    };

    const parsedKecil = {
      energiKecil: Number(giziPorsiKecil?.energiKkal) || 0,
      energiKkal: Number(giziPorsiKecil?.energiKkal) || 0,
      proteinGram: Number(giziPorsiKecil?.proteinGram) || 0,
      lemakGram: Number(giziPorsiKecil?.lemakGram) || 0,
      karbohidratGram: Number(giziPorsiKecil?.karbohidratGram) || 0,
      seratGram: Number(giziPorsiKecil?.seratGram) || 0,
      keterangan: giziPorsiKecil?.keterangan ? String(giziPorsiKecil.keterangan).trim() : ''
    };

    const newItem = dbStore.addMenuHarian({
      tanggalOperasional: finalTanggal,
      hari,
      hariTanggalFormatted: formatted,
      namaMenu: String(namaMenu).trim(),
      kategoriPorsi: kategoriPorsi ? String(kategoriPorsi).trim() : 'Porsi Besar & Porsi Kecil',
      energiKkal: parsedBesar.energiKkal,
      proteinGram: parsedBesar.proteinGram,
      lemakGram: parsedBesar.lemakGram,
      karbohidratGram: parsedBesar.karbohidratGram,
      seratGram: parsedBesar.seratGram,
      giziPorsiBesar: parsedBesar,
      giziPorsiKecil: {
        energiKkal: parsedKecil.energiKkal,
        proteinGram: parsedKecil.proteinGram,
        lemakGram: parsedKecil.lemakGram,
        karbohidratGram: parsedKecil.karbohidratGram,
        seratGram: parsedKecil.seratGram,
        keterangan: parsedKecil.keterangan
      },
      rincianKomponen: rincianKomponen || {},
      catatanGizi: catatanGizi ? String(catatanGizi).trim() : '',
      fotoMenuUrl: fotoMenuUrl || '',
      fotoFileName: fotoFileName || '',
      fotoFileSizeKb: Number(fotoFileSizeKb) || 0,
      petugas: petugas?.trim() || 'Ahli Gizi SPPG',
      createdBy: petugas?.trim() || 'Ahli Gizi SPPG'
    });

    await syncSaveDoc('menuHarian', newItem.id, newItem, {
      name: newItem.petugas,
      userId: 'API-USER'
    });

    dbStore.addLog(
      'SYSTEM',
      newItem.petugas || 'Ahli Gizi SPPG',
      'Menu Harian',
      'Input Form Menu Harian',
      `Menyimpan Menu Harian (${newItem.hariTanggalFormatted}): ${newItem.namaMenu} — Porsi Besar: ${parsedBesar.energiKkal} kkal | Porsi Kecil: ${parsedKecil.energiKkal} kkal`
    );

    dbStore.addNotification(
      'Menu Harian',
      `Menu Harian: ${newItem.hariTanggalFormatted}`,
      `${newItem.namaMenu} (Porsi Besar: ${parsedBesar.energiKkal} kkal | Porsi Kecil: ${parsedKecil.energiKkal} kkal) berhasil disimpan.`,
      'success',
      '/menu-harian/form'
    );

    res.status(201).json({
      success: true,
      message: 'Data Menu Harian berhasil disimpan',
      data: newItem
    });
  } catch (err: any) {
    console.error('Error in POST /api/v1/menu-harian:', err);
    res.status(500).json({ success: false, message: err?.message || 'Gagal menyimpan data menu harian' });
  }
});

// PUT update menu harian
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = { ...req.body } as Partial<MenuHarianRecord>;

    if (updates.tanggalOperasional) {
      const { hari, formatted } = formatIndonesianDate(updates.tanggalOperasional);
      updates.hari = hari;
      updates.hariTanggalFormatted = formatted;
    }

    const updated = dbStore.updateMenuHarian(id, updates);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Data menu harian tidak ditemukan' });
      return;
    }

    await syncSaveDoc('menuHarian', id, updated, {
      name: updated.petugas || 'Ahli Gizi SPPG',
      userId: 'API-USER'
    });

    res.json({
      success: true,
      message: 'Data Menu Harian berhasil diperbarui',
      data: updated
    });
  } catch (err: any) {
    console.error('Error in PUT /api/v1/menu-harian/:id:', err);
    res.status(500).json({ success: false, message: err?.message || 'Gagal memperbarui data menu harian' });
  }
});

// DELETE menu harian
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = dbStore.deleteMenuHarian(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Data menu harian tidak ditemukan' });
      return;
    }

    await syncDeleteDoc('menuHarian', id);

    res.json({
      success: true,
      message: 'Data Menu Harian berhasil dihapus'
    });
  } catch (err: any) {
    console.error('Error in DELETE /api/v1/menu-harian/:id:', err);
    res.status(500).json({ success: false, message: err?.message || 'Gagal menghapus data menu harian' });
  }
});

export default router;
