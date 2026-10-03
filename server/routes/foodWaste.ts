import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { FoodWasteRecord } from '../../src/types';
import { syncSaveDoc, syncDeleteDoc } from '../db/firestore';

const router = Router();

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatIndonesianDateUpper(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    const d = parts.length === 3
      ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      : new Date(dateStr);
    const hari = NAMA_HARI[d.getDay()] || 'Senin';
    const dateNum = String(d.getDate()).padStart(2, '0');
    const monthName = NAMA_BULAN[d.getMonth()] || 'Januari';
    const year = d.getFullYear();
    return `${hari.toUpperCase()}, ${dateNum} ${monthName.toUpperCase()} ${year}`;
  } catch {
    return dateStr;
  }
}

// GET all food waste records
router.get('/', (req: Request, res: Response): void => {
  const { tanggal, startDate, endDate, search } = req.query;

  let results = [...dbStore.foodWasteRecords];

  if (tanggal && typeof tanggal === 'string' && tanggal.trim() !== '') {
    results = results.filter(r => r.tanggal === tanggal.trim());
  }

  if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
    results = results.filter(r => r.tanggal >= startDate.trim());
  }

  if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
    results = results.filter(r => r.tanggal <= endDate.trim());
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    results = results.filter(r =>
      r.sppgName?.toLowerCase().includes(q) ||
      r.hariTanggalFormatted?.toLowerCase().includes(q) ||
      r.petugas?.toLowerCase().includes(q) ||
      r.items?.some(it => it.menu?.toLowerCase().includes(q))
    );
  }

  // Sort by date descending
  results.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  res.json({
    success: true,
    data: results,
    total: results.length
  });
});

// GET context for date (beneficiary count, suggested menu items from menuHarian)
router.get('/context/:tanggal', (req: Request, res: Response): void => {
  const { tanggal } = req.params;
  const benSummary = dbStore.getBeneficiarySummaryForDate(tanggal);
  const totalBeneficiaries = benSummary.totalPorsi || 2808; // default to 2808 if not planned
  
  const menuHarian = dbStore.menuHarian.find(m => m.tanggalOperasional === tanggal);
  const existingRecord = dbStore.getFoodWasteByDate(tanggal);

  const suggestedItems = [];
  if (menuHarian && menuHarian.rincianKomponen) {
    const r = menuHarian.rincianKomponen;
    if (r.karbohidrat) {
      suggestedItems.push({ menu: r.karbohidrat, standarPorsi: 150 });
    }
    if (r.laukHewani) {
      suggestedItems.push({ menu: r.laukHewani, standarPorsi: 50 });
    }
    if (r.laukNabati) {
      suggestedItems.push({ menu: r.laukNabati, standarPorsi: 50 });
    }
    if (r.sayur) {
      suggestedItems.push({ menu: r.sayur, standarPorsi: 50 });
    }
    if (r.buahSusu) {
      suggestedItems.push({ menu: r.buahSusu, standarPorsi: 100 });
    }
  }

  res.json({
    success: true,
    data: {
      tanggal,
      hariTanggalFormatted: formatIndonesianDateUpper(tanggal),
      sppgName: 'SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN',
      totalBeneficiaries,
      menuHarian: menuHarian ? {
        id: menuHarian.id,
        namaMenu: menuHarian.namaMenu,
        rincianKomponen: menuHarian.rincianKomponen
      } : null,
      suggestedItems,
      existingRecord: existingRecord || null
    }
  });
});

// GET food waste record by date
router.get('/by-date/:tanggal', (req: Request, res: Response): void => {
  const { tanggal } = req.params;
  const record = dbStore.getFoodWasteByDate(tanggal);

  if (!record) {
    res.status(404).json({
      success: false,
      message: `Tidak ditemukan catatan Food Waste untuk tanggal ${tanggal}`
    });
    return;
  }

  res.json({
    success: true,
    data: record
  });
});

// GET single food waste record by ID
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const record = dbStore.foodWasteRecords.find(r => r.id === id);

  if (!record) {
    res.status(404).json({
      success: false,
      message: 'Catatan Food Waste tidak ditemukan'
    });
    return;
  }

  res.json({
    success: true,
    data: record
  });
});

// POST save / update food waste record
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as Partial<FoodWasteRecord>;

    if (!payload.tanggal) {
      res.status(400).json({
        success: false,
        message: 'Tanggal wajib diisi'
      });
      return;
    }

    if (!payload.hariTanggalFormatted) {
      payload.hariTanggalFormatted = formatIndonesianDateUpper(payload.tanggal);
    }

    if (!payload.sppgName) {
      payload.sppgName = 'SPPG PROBOLINGGO KREJENGAN TEMENGGUNGAN';
    }

    const saved = dbStore.saveFoodWaste(payload);

    // Sync to Firestore
    syncSaveDoc('foodWasteRecords', saved.id, saved).catch(err => {
      console.warn('⚠️ Gagal sinkronisasi Food Waste ke Firestore:', err?.message || err);
    });

    res.json({
      success: true,
      message: 'Catatan Food Waste berhasil disimpan',
      data: saved
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Gagal menyimpan catatan Food Waste'
    });
  }
});

// DELETE food waste record
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ok = dbStore.deleteFoodWaste(id);

    if (!ok) {
      res.status(404).json({
        success: false,
        message: 'Catatan Food Waste tidak ditemukan'
      });
      return;
    }

    syncDeleteDoc('foodWasteRecords', id).catch(err => {
      console.warn('⚠️ Gagal menghapus Food Waste dari Firestore:', err?.message || err);
    });

    res.json({
      success: true,
      message: 'Catatan Food Waste berhasil dihapus'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Gagal menghapus catatan Food Waste'
    });
  }
});

export default router;
