import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { LaporanBbm, MasterKendaraan, JenisBbm } from '../../src/types';
import { syncSaveDoc, syncDeleteDoc } from '../db/firestore';

const router = Router();


/**
 * GET /api/v1/bbm/kendaraan
 * Get list of all master vehicles
 */
router.get('/kendaraan', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: dbStore.kendaraan
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/bbm/kendaraan
 * Create or update master vehicle
 */
router.post('/kendaraan', (req: Request, res: Response) => {
  try {
    const { namaKendaraan, platNomor, jenisKendaraan, standarKmLiter, status } = req.body;

    if (!namaKendaraan || !platNomor || !standarKmLiter) {
      return res.status(400).json({
        success: false,
        message: 'Nama kendaraan, plat nomor, dan standar KM/Liter wajib diisi.'
      });
    }

    const newKendaraan: MasterKendaraan = {
      id: `KND-${Date.now()}`,
      namaKendaraan,
      platNomor: platNomor.toUpperCase(),
      jenisKendaraan: jenisKendaraan || 'Mobil Operasional',
      standarKmLiter: Number(standarKmLiter),
      status: status || 'Aktif'
    };

    dbStore.kendaraan.unshift(newKendaraan);
    dbStore.addLog('SYSTEM', 'Admin', 'Laporan BBM', 'Tambah Master Kendaraan', `Menambahkan kendaraan ${namaKendaraan} (${platNomor})`);
    syncSaveDoc('kendaraan', newKendaraan.id, newKendaraan);

    res.status(201).json({
      success: true,
      data: newKendaraan,
      message: 'Master kendaraan berhasil ditambahkan.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/v1/bbm/kendaraan/:id
 * Update master vehicle standard KM/Liter or details
 */
router.put('/kendaraan/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = dbStore.kendaraan.findIndex(k => k.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Kendaraan tidak ditemukan.' });
    }

    const { namaKendaraan, platNomor, jenisKendaraan, standarKmLiter, status } = req.body;
    dbStore.kendaraan[index] = {
      ...dbStore.kendaraan[index],
      namaKendaraan: namaKendaraan || dbStore.kendaraan[index].namaKendaraan,
      platNomor: platNomor ? platNomor.toUpperCase() : dbStore.kendaraan[index].platNomor,
      jenisKendaraan: jenisKendaraan || dbStore.kendaraan[index].jenisKendaraan,
      standarKmLiter: standarKmLiter !== undefined ? Number(standarKmLiter) : dbStore.kendaraan[index].standarKmLiter,
      status: status || dbStore.kendaraan[index].status
    };

    dbStore.addLog('SYSTEM', 'Admin', 'Laporan BBM', 'Update Master Kendaraan', `Memperbarui data kendaraan ${dbStore.kendaraan[index].namaKendaraan}`);
    syncSaveDoc('kendaraan', id, dbStore.kendaraan[index]);

    res.json({
      success: true,
      data: dbStore.kendaraan[index],
      message: 'Data kendaraan berhasil diperbarui.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/v1/bbm/kendaraan/:id
 * Delete master vehicle
 */
router.delete('/kendaraan/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = dbStore.kendaraan.findIndex(k => k.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Kendaraan tidak ditemukan.' });
    }

    const removed = dbStore.kendaraan.splice(index, 1)[0];
    dbStore.addLog('SYSTEM', 'Admin', 'Laporan BBM', 'Hapus Master Kendaraan', `Menghapus kendaraan ${removed.namaKendaraan} (${removed.platNomor})`);
    syncDeleteDoc('kendaraan', id);

    res.json({
      success: true,
      message: 'Kendaraan berhasil dihapus.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/bbm/latest-km/:kendaraanId
 * Auto-get KM Awal from the latest KM Akhir for the specified vehicle
 */
router.get('/latest-km/:kendaraanId', (req: Request, res: Response) => {
  try {
    const { kendaraanId } = req.params;
    const vehicle = dbStore.kendaraan.find(k => k.id === kendaraanId);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Kendaraan tidak ditemukan.' });
    }

    // Find all previous fuel records for this vehicle
    const vehicleLogs = dbStore.laporanBbm.filter(log => log.kendaraanId === kendaraanId);
    
    let latestKmAwal = 0;
    if (vehicleLogs.length > 0) {
      // Find max kmAkhir recorded
      latestKmAwal = Math.max(...vehicleLogs.map(l => l.kmAkhir));
    }

    res.json({
      success: true,
      data: {
        kendaraanId,
        namaKendaraan: vehicle.namaKendaraan,
        platNomor: vehicle.platNomor,
        standarKmLiter: vehicle.standarKmLiter,
        latestKmAwal
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/bbm/dashboard
 * Dashboard BBM Summary & Analytics
 */
router.get('/dashboard', (req: Request, res: Response) => {
  try {
    const now = new Date();
    const currentYearStr = req.query.tahun ? String(req.query.tahun) : String(now.getFullYear());
    const currentMonthStr = req.query.bulan ? String(req.query.bulan).padStart(2, '0') : String(now.getMonth() + 1).padStart(2, '0');

    // Filter fuel logs for this month
    const thisMonthLogs = dbStore.laporanBbm.filter(l => {
      const [year, month] = l.tanggalPembelian.split('-');
      return year === currentYearStr && month === currentMonthStr;
    });

    const totalPengeluaranBulanIni = thisMonthLogs.reduce((acc, curr) => acc + curr.hargaBbm, 0);
    const totalLiterBulanIni = thisMonthLogs.reduce((acc, curr) => acc + curr.jumlahLiter, 0);
    const totalJarakTempuhBulanIni = thisMonthLogs.reduce((acc, curr) => acc + curr.jarakTempuh, 0);
    const rataRataKmLiter = totalLiterBulanIni > 0 
      ? parseFloat((totalJarakTempuhBulanIni / totalLiterBulanIni).toFixed(2)) 
      : 0;

    // Monthly Expense Graph (last 6 months or current year)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const pengeluaranPerBulan = monthNames.map((mName, idx) => {
      const mStr = String(idx + 1).padStart(2, '0');
      const monthLogs = dbStore.laporanBbm.filter(l => l.tanggalPembelian.startsWith(`${currentYearStr}-${mStr}`));
      const totalRupiah = monthLogs.reduce((a, b) => a + b.hargaBbm, 0);
      const totalLiter = monthLogs.reduce((a, b) => a + Number(b.jumlahLiter), 0);
      return {
        bulan: mName,
        totalRupiah,
        totalLiter: parseFloat(totalLiter.toFixed(1))
      };
    });

    // Efficiency per vehicle
    const efisiensiPerKendaraan = dbStore.kendaraan.map(v => {
      const logs = dbStore.laporanBbm.filter(l => l.kendaraanId === v.id);
      const totalDist = logs.reduce((a, b) => a + b.jarakTempuh, 0);
      const totalLit = logs.reduce((a, b) => a + b.jumlahLiter, 0);
      const avgKmLiter = totalLit > 0 ? parseFloat((totalDist / totalLit).toFixed(2)) : 0;
      const status = avgKmLiter >= v.standarKmLiter || logs.length === 0 ? 'Normal' : 'Tidak Normal';
      return {
        kendaraan: v.namaKendaraan,
        platNomor: v.platNomor,
        kmLiterAktual: avgKmLiter,
        standarKmLiter: v.standarKmLiter,
        status
      };
    });

    // Kendaraan Paling Boros (Ranked by number of 'Tidak Normal' / highest expenditure / lowest efficiency)
    const kendaraanTerboros = dbStore.kendaraan.map(v => {
      const logs = dbStore.laporanBbm.filter(l => l.kendaraanId === v.id);
      const borosLogs = logs.filter(l => l.statusPemakaian === 'Tidak Normal');
      const totalRupiah = logs.reduce((a, b) => a + b.hargaBbm, 0);
      const totalDist = logs.reduce((a, b) => a + b.jarakTempuh, 0);
      const totalLit = logs.reduce((a, b) => a + b.jumlahLiter, 0);
      const avgKmLiter = totalLit > 0 ? parseFloat((totalDist / totalLit).toFixed(2)) : 0;
      return {
        kendaraan: v.namaKendaraan,
        platNomor: v.platNomor,
        totalBorosCount: borosLogs.length,
        avgKmLiter,
        totalRupiah
      };
    }).sort((a, b) => b.totalBorosCount - a.totalBorosCount || b.totalRupiah - a.totalRupiah);

    res.json({
      success: true,
      data: {
        totalPengeluaranBulanIni,
        totalLiterBulanIni: parseFloat(totalLiterBulanIni.toFixed(2)),
        totalJarakTempuhBulanIni,
        rataRataKmLiter,
        totalTransaksi: thisMonthLogs.length,
        pengeluaranPerBulan,
        efisiensiPerKendaraan,
        kendaraanTerboros
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/v1/bbm
 * Get list of Laporan BBM with filters
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { tanggal, bulan, tahun, kendaraanId, jenisBbm, statusPemakaian, search } = req.query;

    let filtered = [...dbStore.laporanBbm];

    if (tanggal) {
      filtered = filtered.filter(item => item.tanggalPembelian === String(tanggal));
    }

    if (bulan) {
      const bStr = String(bulan).padStart(2, '0');
      filtered = filtered.filter(item => item.tanggalPembelian.split('-')[1] === bStr);
    }

    if (tahun) {
      filtered = filtered.filter(item => item.tanggalPembelian.split('-')[0] === String(tahun));
    }

    if (kendaraanId) {
      filtered = filtered.filter(item => item.kendaraanId === String(kendaraanId));
    }

    if (jenisBbm) {
      filtered = filtered.filter(item => item.jenisBbm === String(jenisBbm));
    }

    if (statusPemakaian) {
      filtered = filtered.filter(item => item.statusPemakaian === String(statusPemakaian));
    }

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(item => 
        item.kendaraanNama.toLowerCase().includes(q) ||
        item.platNomor.toLowerCase().includes(q) ||
        item.userInput.toLowerCase().includes(q) ||
        item.jenisBbm.toLowerCase().includes(q)
      );
    }

    // Sort descending by date
    filtered.sort((a, b) => new Date(b.tanggalPembelian).getTime() - new Date(a.tanggalPembelian).getTime());

    res.json({
      success: true,
      totalCount: filtered.length,
      data: filtered
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/bbm
 * Create new Laporan BBM entry with strict validations & automations
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { 
      tanggalPembelian, 
      kendaraanId, 
      jenisBbm, 
      kmAkhir, 
      hargaBbm, 
      jumlahLiter, 
      uploadStruk, 
      userInput 
    } = req.body;

    // --- VALIDATIONS ---
    if (!tanggalPembelian) {
      return res.status(400).json({ success: false, message: 'Tanggal Pembelian wajib diisi.' });
    }

    if (!kendaraanId) {
      return res.status(400).json({ success: false, message: 'Kendaraan wajib dipilih.' });
    }

    const vehicle = dbStore.kendaraan.find(k => k.id === kendaraanId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Kendaraan tidak valid.' });
    }

    // 1. KM Awal Automation: Auto get latest kmAkhir for this vehicle
    const vehicleLogs = dbStore.laporanBbm.filter(log => log.kendaraanId === kendaraanId);
    let kmAwal = 0;
    if (vehicleLogs.length > 0) {
      kmAwal = Math.max(...vehicleLogs.map(l => l.kmAkhir));
    }

    const numKmAkhir = Number(kmAkhir);
    const numHarga = Number(hargaBbm);
    const numLiter = Number(jumlahLiter);

    // 2. KM Validation
    if (isNaN(numKmAkhir) || numKmAkhir <= kmAwal) {
      return res.status(400).json({ 
        success: false, 
        message: `KM Akhir tidak boleh lebih kecil dari KM Awal (${kmAwal.toLocaleString('id-ID')} KM).` 
      });
    }

    if (isNaN(numHarga) || numHarga <= 0) {
      return res.status(400).json({ success: false, message: 'Harga BBM wajib lebih dari nol.' });
    }

    if (isNaN(numLiter) || numLiter <= 0) {
      return res.status(400).json({ success: false, message: 'Jumlah Liter wajib lebih dari nol.' });
    }

    // Foto Struk validation
    if (!uploadStruk || typeof uploadStruk !== 'string' || uploadStruk.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Foto Struk bersifat wajib di-upload sebelum data dapat disimpan.' 
      });
    }

    // --- AUTOMATIONS ---
    // 1. Jarak Tempuh = KM Akhir - KM Awal
    const jarakTempuh = numKmAkhir - kmAwal;

    // 2. KM/Liter Aktual = Jarak Tempuh / Jumlah Liter
    const kmLiterAktual = parseFloat((jarakTempuh / numLiter).toFixed(2));

    // 3. Status Pemakaian = Normal jika Aktual >= Standar, else Tidak Normal
    const statusPemakaian: 'Normal' | 'Tidak Normal' = 
      kmLiterAktual >= vehicle.standarKmLiter ? 'Normal' : 'Tidak Normal';

    // 4. Status Struk
    const statusStruk: 'Ter-upload' | 'Belum Upload' = uploadStruk ? 'Ter-upload' : 'Belum Upload';

    // 5. Keterangan
    const keterangan: 'Pemakaian Wajar' | 'Boros' = 
      statusPemakaian === 'Normal' ? 'Pemakaian Wajar' : 'Boros';

    const now = new Date();
    const newLog: LaporanBbm = {
      id: `BBM-${now.getFullYear()}${String(now.getMonth()+1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
      tanggalPembelian,
      kendaraanId,
      kendaraanNama: vehicle.namaKendaraan,
      platNomor: vehicle.platNomor,
      jenisBbm: (jenisBbm as JenisBbm) || 'Pertamax',
      kmAwal,
      kmAkhir: numKmAkhir,
      jarakTempuh,
      hargaBbm: numHarga,
      jumlahLiter: numLiter,
      kmLiterAktual,
      standarKmLiter: vehicle.standarKmLiter,
      statusPemakaian,
      uploadStruk,
      statusStruk,
      keterangan,
      userInput: userInput || 'Operator Terpadu',
      timestamp: now.toISOString()
    };

    dbStore.laporanBbm.unshift(newLog);
    syncSaveDoc('laporanBbm', newLog.id, newLog);

    // Logging & Notification
    dbStore.addLog(
      'SYSTEM', 
      newLog.userInput, 
      'Laporan BBM', 
      'Input Transaksi BBM', 
      `Input BBM ${vehicle.namaKendaraan} (${vehicle.platNomor}): ${numLiter}L, Rp${numHarga.toLocaleString('id-ID')}`
    );

    if (statusPemakaian === 'Tidak Normal') {
      dbStore.addNotification(
        'System',
        '⚠️ Konsumsi BBM Tidak Normal!',
        `Kendaraan ${vehicle.namaKendaraan} (${vehicle.platNomor}) tercatat BOROS (${kmLiterAktual} KM/L vs Standar ${vehicle.standarKmLiter} KM/L).`,
        'warning',
        '/bbm/laporan'
      );
    }

    res.status(201).json({
      success: true,
      message: 'Data Laporan BBM berhasil disimpan!',
      data: newLog
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/v1/bbm/:id
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const index = dbStore.laporanBbm.findIndex(l => l.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Data laporan BBM tidak ditemukan.' });
    }

    const deleted = dbStore.laporanBbm.splice(index, 1)[0];
    dbStore.addLog('SYSTEM', 'Admin', 'Laporan BBM', 'Hapus Transaksi BBM', `Menghapus transaksi ${deleted.id} untuk ${deleted.kendaraanNama}`);
    syncDeleteDoc('laporanBbm', id);

    res.json({
      success: true,
      message: 'Transaksi BBM berhasil dihapus.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
