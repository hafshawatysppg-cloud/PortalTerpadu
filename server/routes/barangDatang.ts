import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { BarangDatang, JenisBarangDatang } from '../../src/types';
import { syncSaveDoc, syncDeleteDoc } from '../db/firestore';

const router = Router();

// Helper to get Indonesian day name
function getIndonesianDay(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[d.getDay()] || 'Senin';
  } catch {
    return 'Senin';
  }
}

// Helper to format date in Indonesian
function formatIndonesianDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const dayName = getIndonesianDay(dateStr);
    const dateNum = String(d.getDate()).padStart(2, '0');
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    return `${dayName}, ${dateNum} ${monthName} ${year}`;
  } catch {
    return dateStr;
  }
}

// GET all barang datang with optional filters
router.get('/', (req: Request, res: Response): void => {
  const { tanggal, startDate, endDate, jenisBarang, search } = req.query;

  let results = [...dbStore.barangDatang];

  // Specific date filter
  if (tanggal && typeof tanggal === 'string' && tanggal.trim() !== '') {
    results = results.filter(b => b.tanggal === tanggal.trim());
  }

  // Date range filter
  if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
    results = results.filter(b => b.tanggal >= startDate.trim());
  }
  if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
    results = results.filter(b => b.tanggal <= endDate.trim());
  }

  // Jenis barang filter: 'Bahan Baku' | 'Operasional'
  if (jenisBarang && typeof jenisBarang === 'string' && jenisBarang !== 'Semua' && jenisBarang.trim() !== '') {
    results = results.filter(b => b.jenisBarang === jenisBarang.trim());
  }

  // Search filter
  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    results = results.filter(b =>
      b.namaBarang?.toLowerCase().includes(q) ||
      b.satuan?.toLowerCase().includes(q) ||
      b.petugas?.toLowerCase().includes(q) ||
      b.keterangan?.toLowerCase().includes(q)
    );
  }

  // Sort by date descending, then creation time descending
  results.sort((a, b) => {
    if (a.tanggal !== b.tanggal) {
      return b.tanggal.localeCompare(a.tanggal);
    }
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  res.json({
    success: true,
    count: results.length,
    totalBahanBaku: results.filter(b => b.jenisBarang === 'Bahan Baku').length,
    totalOperasional: results.filter(b => b.jenisBarang === 'Operasional').length,
    data: results
  });
});

// GET single barang datang by ID
router.get('/:id', (req: Request, res: Response): void => {
  const item = dbStore.barangDatang.find(b => b.id === req.params.id);
  if (!item) {
    res.status(404).json({ success: false, message: 'Data kedatangan barang tidak ditemukan' });
    return;
  }
  res.json({ success: true, data: item });
});

// POST create new barang datang
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      hari,
      tanggal,
      hariTanggalFormatted,
      namaBarang,
      jumlahMasuk,
      satuan,
      jenisBarang,
      dokumentasiUrl,
      keterangan,
      petugas
    } = req.body;

    if (!namaBarang || namaBarang.trim() === '') {
      res.status(400).json({ success: false, message: 'Nama Barang wajib diisi' });
      return;
    }

    if (jumlahMasuk === undefined || jumlahMasuk === null || isNaN(Number(jumlahMasuk)) || Number(jumlahMasuk) <= 0) {
      res.status(400).json({ success: false, message: 'Jumlah Masuk harus berupa angka lebih dari 0' });
      return;
    }

    if (!satuan || satuan.trim() === '') {
      res.status(400).json({ success: false, message: 'Satuan barang wajib diisi' });
      return;
    }

    if (!jenisBarang || (jenisBarang !== 'Bahan Baku' && jenisBarang !== 'Operasional')) {
      res.status(400).json({ success: false, message: 'Jenis Barang harus "Bahan Baku" atau "Operasional"' });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const finalTanggal = tanggal && tanggal.trim() !== '' ? tanggal.trim() : todayStr;
    const finalHari = hari && hari.trim() !== '' ? hari.trim() : getIndonesianDay(finalTanggal);
    const finalHariTanggalFormatted = hariTanggalFormatted || formatIndonesianDate(finalTanggal);

    const newItem = dbStore.addBarangDatang({
      hari: finalHari,
      tanggal: finalTanggal,
      hariTanggalFormatted: finalHariTanggalFormatted,
      namaBarang: namaBarang.trim(),
      jumlahMasuk: Number(jumlahMasuk),
      satuan: satuan.trim(),
      jenisBarang: jenisBarang as JenisBarangDatang,
      dokumentasiUrl: dokumentasiUrl || '',
      keterangan: keterangan?.trim() || '',
      petugas: petugas?.trim() || 'Petugas Logistik',
      createdBy: petugas?.trim() || 'Petugas Logistik'
    });

    // Realtime Cloud Firestore Synchronization
    await syncSaveDoc('barangDatang', newItem.id, newItem, {
      name: newItem.petugas,
      userId: 'API-USER'
    });

    // Log Activity & Notification
    dbStore.addLog(
      'SYSTEM',
      newItem.petugas || 'Petugas Logistik',
      'Kedatangan Barang',
      'Input Barang Datang',
      `Mencatat kedatangan ${newItem.jenisBarang}: ${newItem.namaBarang} (${newItem.jumlahMasuk} ${newItem.satuan}) pada ${newItem.hariTanggalFormatted}`
    );

    dbStore.addNotification(
      'Stock Opname',
      `Barang Datang: ${newItem.namaBarang}`,
      `Penerimaan ${newItem.jumlahMasuk} ${newItem.satuan} (${newItem.jenisBarang}) berhasil dicatat.`,
      'success',
      '/barang-datang/data'
    );

    res.status(201).json({
      success: true,
      message: 'Data kedatangan barang berhasil disimpan',
      data: newItem
    });
  } catch (err: any) {
    console.error('Error in POST /api/v1/barang-datang:', err);
    res.status(500).json({ success: false, message: err?.message || 'Gagal menyimpan data kedatangan barang' });
  }
});

// PUT update barang datang
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body as Partial<BarangDatang>;

    if (updates.tanggal && !updates.hari) {
      updates.hari = getIndonesianDay(updates.tanggal);
      updates.hariTanggalFormatted = formatIndonesianDate(updates.tanggal);
    }

    const updated = dbStore.updateBarangDatang(id, updates);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Data kedatangan barang tidak ditemukan' });
      return;
    }

    // Realtime Cloud Firestore Synchronization
    await syncSaveDoc('barangDatang', id, updated, {
      name: updated.petugas || 'Petugas Logistik',
      userId: 'API-USER'
    });

    res.json({
      success: true,
      message: 'Data kedatangan barang berhasil diperbarui',
      data: updated
    });
  } catch (err: any) {
    console.error('Error in PUT /api/v1/barang-datang/:id:', err);
    res.status(500).json({ success: false, message: err?.message || 'Gagal memperbarui data' });
  }
});

// DELETE barang datang
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = dbStore.deleteBarangDatang(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Data kedatangan barang tidak ditemukan' });
      return;
    }

    // Realtime Cloud Firestore Deletion
    await syncDeleteDoc('barangDatang', id);

    res.json({
      success: true,
      message: 'Data kedatangan barang berhasil dihapus'
    });
  } catch (err: any) {
    console.error('Error in DELETE /api/v1/barang-datang/:id:', err);
    res.status(500).json({ success: false, message: err?.message || 'Gagal menghapus data' });
  }
});

export default router;
