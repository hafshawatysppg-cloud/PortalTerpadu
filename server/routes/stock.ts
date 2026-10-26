import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { MasterBarang, StockMovement, StockOpnameSession } from '../../src/types';
import { syncSaveDoc, syncDeleteDoc, runStockTransaction, generateUniqueId } from '../db/firestore';

const router = Router();

// --- SUMMARY METRICS ---
router.get('/summary', (req: Request, res: Response): void => {
  const barang = dbStore.barang || [];
  const movements = dbStore.stockMovements || [];
  const sessions = dbStore.opnameSessions || [];

  const todayStr = new Date().toISOString().split('T')[0];

  const totalBarang = barang.length;
  const totalStokPcs = barang.reduce((acc, b) => acc + (Number(b.stokSekarang) || 0), 0);
  const totalNilaiPersediaan = barang.reduce((acc, b) => acc + ((Number(b.stokSekarang) || 0) * (Number(b.hargaSatuan) || 0)), 0);

  const masukHariIni = movements
    .filter(m => m.jenis === 'Masuk' && m.tanggal.startsWith(todayStr))
    .reduce((acc, m) => acc + (Number(m.jumlah) || 0), 0);

  const keluarHariIni = movements
    .filter(m => m.jenis === 'Keluar' && m.tanggal.startsWith(todayStr))
    .reduce((acc, m) => acc + (Number(m.jumlah) || 0), 0);

  const stokRendahCount = 0;
  const opnameTerakhir = sessions.length > 0 ? sessions[0].tanggal : '-';

  res.json({
    success: true,
    data: {
      totalBarang,
      totalStokPcs,
      totalNilaiPersediaan,
      masukHariIni,
      keluarHariIni,
      stokRendahCount,
      opnameTerakhir
    }
  });
});

// --- MASTER BARANG ---
router.get('/barang', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.barang });
});

router.post('/barang', async (req: Request, res: Response): Promise<void> => {
  const { 
    namaBarang, 
    kategoriId, 
    gudangId, 
    satuan, 
    stokMinimal, 
    stokSekarang, 
    stokAwal,
    hargaSatuan,
    sumberSupplier,
    keterangan,
    fotoUrl,
    petugas 
  } = req.body;

  if (!namaBarang || !kategoriId || !gudangId) {
    res.status(400).json({ success: false, message: 'Nama Barang, Kategori, dan Gudang wajib diisi.' });
    return;
  }

  const kat = dbStore.kategori.find(k => k.id === kategoriId);
  const gdg = dbStore.gudang.find(g => g.id === gudangId);

  const newId = generateUniqueId('BRG');
  const initStok = typeof stokAwal === 'number' ? stokAwal : (Number(stokSekarang) || 0);

  const newBarang: MasterBarang = {
    id: newId,
    kodeBarang: `BRG-${kat?.kode || 'GEN'}-${Date.now().toString(36).toUpperCase().slice(-4)}`,
    namaBarang,
    kategoriId,
    kategoriNama: kat?.nama || 'Bahan Baku',
    gudangId,
    gudangNama: gdg?.nama || 'Gudang Utama Central',
    satuan: satuan || 'Pcs',
    stokSekarang: initStok,
    stokAwal: initStok,
    status: 'Aktif',
    hargaSatuan: Number(hargaSatuan) || 0,
    barcode: `8991001${Date.now().toString().slice(-6)}`,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BRG-${Date.now()}`,
    sumberSupplier: sumberSupplier || '',
    fotoUrl: fotoUrl || '',
    keterangan: keterangan || '',
    updatedAt: new Date().toISOString()
  };

  dbStore.barang.unshift(newBarang);
  await syncSaveDoc('barang', newBarang.id, newBarang, { name: petugas });

  // Record initial movement log if initial stock exists
  if (initStok > 0) {
    const initMovement: StockMovement = {
      id: generateUniqueId('MOV'),
      jenis: 'Stock Awal',
      barangId: newBarang.id,
      kodeBarang: newBarang.kodeBarang,
      namaBarang: newBarang.namaBarang,
      jumlah: initStok,
      gudangId: newBarang.gudangId,
      gudangNama: newBarang.gudangNama,
      referensiNota: `INIT-${newBarang.kodeBarang}`,
      keterangan: 'Pencatatan Saldo Stock Awal Baru',
      tanggal: new Date().toISOString().replace('T', ' ').slice(0, 16),
      petugas: petugas || 'Staf Opname',
      hargaSatuan: newBarang.hargaSatuan,
      totalHarga: initStok * newBarang.hargaSatuan
    };
    dbStore.stockMovements.unshift(initMovement);
    await syncSaveDoc('stockMovements', initMovement.id, initMovement, { name: petugas });
  }

  dbStore.addLog('USER', petugas || 'Staf Opname', 'Stock Opname', 'Tambah Master Barang', `Menambahkan barang baru: ${namaBarang} (${newBarang.kodeBarang})`, req.ip);

  res.status(201).json({ success: true, message: 'Master Barang berhasil disimpan', data: newBarang });
});

router.put('/barang/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const item = dbStore.barang.find(b => b.id === id);

  if (!item) {
    res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    return;
  }

  const {
    namaBarang,
    kategoriId,
    gudangId,
    satuan,
    stokSekarang,
    hargaSatuan,
    sumberSupplier,
    keterangan,
    fotoUrl,
    status,
    petugas
  } = req.body;

  if (kategoriId) {
    const kat = dbStore.kategori.find(k => k.id === kategoriId);
    if (kat) {
      item.kategoriId = kategoriId;
      item.kategoriNama = kat.nama;
    }
  }

  if (gudangId) {
    const gdg = dbStore.gudang.find(g => g.id === gudangId);
    if (gdg) {
      item.gudangId = gudangId;
      item.gudangNama = gdg.nama;
    }
  }

  if (namaBarang) item.namaBarang = namaBarang;
  if (satuan) item.satuan = satuan;
  if (typeof stokSekarang === 'number') {
    item.stokSekarang = Number(stokSekarang);
    if (item.stokSekarang <= 0 && !status) {
      item.status = 'Arsip';
    } else if (item.stokSekarang > 0 && item.status === 'Arsip') {
      item.status = 'Aktif';
    }
  }
  if (status) item.status = status;
  if (typeof hargaSatuan === 'number') item.hargaSatuan = Number(hargaSatuan);
  if (sumberSupplier !== undefined) item.sumberSupplier = sumberSupplier;
  if (keterangan !== undefined) item.keterangan = keterangan;
  if (fotoUrl !== undefined) item.fotoUrl = fotoUrl;
  item.updatedAt = new Date().toISOString();

  await syncSaveDoc('barang', item.id, item, { name: petugas });
  dbStore.addLog('USER', petugas || 'Staf Opname', 'Stock Opname', 'Edit Master Barang', `Mengubah data barang: ${item.namaBarang} (${item.kodeBarang})`, req.ip);

  res.json({ success: true, message: 'Data Barang Berhasil Diperbarui', data: item });
});

router.delete('/barang/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idx = dbStore.barang.findIndex(b => b.id === id);

  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
    return;
  }

  const removed = dbStore.barang.splice(idx, 1)[0];
  await syncDeleteDoc('barang', id);

  // If item had remaining stock or being removed, record outbound movement in history so it remains traceable
  const opPetugas = (req.body && req.body.petugas) || 'Admin Logistik';
  const nowIso = new Date().toISOString();
  const movId = generateUniqueId('MOV');
  const outQty = Number(removed.stokSekarang) || 0;

  const movementRecord: StockMovement = {
    id: movId,
    jenis: 'Keluar',
    barangId: removed.id,
    kodeBarang: removed.kodeBarang,
    namaBarang: removed.namaBarang,
    satuan: removed.satuan || 'Pcs',
    jumlah: outQty,
    gudangId: removed.gudangId,
    gudangNama: removed.gudangNama,
    referensiNota: `HAPUS-${Date.now().toString(36).toUpperCase()}`,
    keterangan: `Penghapusan Master Barang - Stok dikeluarkan (${outQty} ${removed.satuan})`,
    tanggal: `${nowIso.split('T')[0]} ${new Date().toTimeString().slice(0, 5)}`,
    petugas: opPetugas,
    hargaSatuan: removed.hargaSatuan || 0,
    totalHarga: outQty * (removed.hargaSatuan || 0),
    sisaStock: 0,
    createdAt: nowIso,
    createdBy: opPetugas,
    updatedAt: nowIso,
    updatedBy: opPetugas
  };

  dbStore.stockMovements.unshift(movementRecord);
  await syncSaveDoc('stockMovements', movementRecord.id, movementRecord, { name: opPetugas });

  dbStore.addLog('USER', opPetugas, 'Stock Opname', 'Hapus Master Barang', `Menghapus barang: ${removed.namaBarang} (${removed.kodeBarang}) & mencatat saldo akhir ke History Keluar`, req.ip);

  res.json({ success: true, message: `Master Barang "${removed.namaBarang}" Berhasil Dihapus & Dicatat ke History Keluar` });
});

// --- STOCK AWAL ADJUSTMENT (TRANSACTIONAL) ---
router.post('/stock-awal', async (req: Request, res: Response): Promise<void> => {
  const { barangId, stokAwal, keterangan, petugas } = req.body;
  try {
    const qty = Number(stokAwal) || 0;
    const result = await runStockTransaction({
      barangId,
      jenis: 'Stock Awal',
      jumlah: qty,
      keterangan: keterangan || `Penyesuaian Saldo Stock Awal`,
      petugas: petugas || 'Staf Stock Opname'
    });

    dbStore.addLog('USER', petugas || 'Staf Opname', 'Stock Opname', 'Set Stock Awal', `Pengaturan Stock Awal ${result.updatedBarang.namaBarang} diset ke ${qty}`, req.ip);

    res.status(200).json({ success: true, message: 'Stock Awal berhasil diperbarui', data: { barang: result.updatedBarang, movement: result.movement } });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Gagal memproses stock awal.' });
  }
});

// --- STOCK MOVEMENT (IN / OUT) (TRANSACTIONAL) ---
router.get('/movements', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.stockMovements });
});

router.post('/movements', async (req: Request, res: Response): Promise<void> => {
  const { 
    jenis, 
    barangId, 
    jumlah, 
    referensiNota, 
    keterangan, 
    petugas,
    sumberSupplier,
    penerimaTujuan,
    hargaSatuan 
  } = req.body;

  try {
    const result = await runStockTransaction({
      barangId,
      jenis: (jenis as any) || 'Masuk',
      jumlah: Number(jumlah),
      referensiNota,
      keterangan,
      petugas: petugas || 'Petugas Logistik',
      sumberSupplier,
      penerimaTujuan,
      hargaSatuan: typeof hargaSatuan === 'number' ? hargaSatuan : undefined
    });

    dbStore.addLog('USER', petugas || 'Staf Opname', 'Stock Opname', `Stok ${jenis}`, `Transaksi Stok ${jenis} ${jumlah} - ${result.updatedBarang.namaBarang}`, req.ip);

    res.status(201).json({ success: true, message: `Transaksi Stok ${jenis} Berhasil`, data: { movement: result.movement, barangUpdated: result.updatedBarang } });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err?.message || 'Gagal memproses transaksi stok.' });
  }
});

// --- BULK / BATCH STOCK MOVEMENTS ---
router.post('/movements/bulk', async (req: Request, res: Response): Promise<void> => {
  const { items, jenis, referensiNota, sumberSupplier, petugas, keterangan } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, message: 'Daftar barang tidak boleh kosong.' });
    return;
  }

  const results: any[] = [];
  const updatedBarang: any[] = [];
  const refNota = referensiNota || `BULK-${(jenis || 'IN').toUpperCase()}-${Date.now().toString().slice(-6)}`;
  const opPetugas = petugas || 'Petugas Logistik';
  const typeJenis = jenis || 'Masuk';

  for (const row of items) {
    const { barangId, namaBarang, kategori, satuan, jumlah, hargaSatuan, sisaStok, lokasi, vendor } = row;
    
    let item = dbStore.barang.find(b => b.id === barangId);
    if (!item && namaBarang) {
      item = dbStore.barang.find(b => b.namaBarang.toLowerCase() === namaBarang.toLowerCase().trim());
    }

    let qty = Number(jumlah);
    const rowPrice = typeof hargaSatuan === 'number' && !isNaN(hargaSatuan) && hargaSatuan > 0 ? Number(hargaSatuan) : undefined;

    // Create new item if it doesn't exist yet
    if (!item && namaBarang) {
      const newId = generateUniqueId('BRG');
      item = {
        id: newId,
        kodeBarang: `ING-${Date.now().toString(36).toUpperCase()}`,
        namaBarang: namaBarang.trim(),
        kategoriId: (kategori || '').toLowerCase().includes('operasional') ? 'KAT-002' : 'KAT-001',
        kategoriNama: (kategori || '').toLowerCase().includes('operasional') ? 'Operasional' : 'Bahan Baku',
        stokSekarang: 0,
        stokMinimal: 0,
        satuan: satuan || 'Pcs',
        hargaSatuan: rowPrice || 10000,
        barcode: `899${Date.now().toString().slice(-8)}`,
        gudangId: 'GDG-01',
        gudangNama: lokasi || 'Gudang Utama',
        updatedAt: new Date().toISOString()
      };
      dbStore.barang.unshift(item);
      await syncSaveDoc('barang', item.id, item, { name: opPetugas });
    } else if (item && rowPrice && rowPrice !== item.hargaSatuan) {
      item.hargaSatuan = rowPrice;
      await syncSaveDoc('barang', item.id, item, { name: opPetugas });
    }

    if (!item) continue;

    if (typeJenis === 'Keluar' && typeof sisaStok === 'number' && !isNaN(sisaStok)) {
      qty = item.stokSekarang - sisaStok;
    }

    if (isNaN(qty) || qty <= 0) continue;

    try {
      const txResult = await runStockTransaction({
        barangId: item.id,
        jenis: typeJenis,
        jumlah: qty,
        referensiNota: refNota,
        keterangan: keterangan || (typeJenis === 'Masuk' ? 'Penerimaan Massal Restock' : 'Pengeluaran Massal'),
        petugas: opPetugas,
        sumberSupplier: sumberSupplier || vendor || '',
        penerimaTujuan: row.penerimaTujuan || '',
        hargaSatuan: rowPrice || item.hargaSatuan
      });

      results.push(txResult.movement);
      updatedBarang.push(txResult.updatedBarang);
    } catch (err: any) {
      console.warn(`Bulk stock skip for ${item.namaBarang}:`, err?.message);
    }
  }

  dbStore.addLog('USER', opPetugas, 'Stock Opname', `Bulk Stok ${typeJenis}`, `Transaksi Massal ${typeJenis} sebanyak ${results.length} item barang`, req.ip);

  res.status(201).json({
    success: true,
    message: `Berhasil memproses ${results.length} transaksi barang ${typeJenis} secara massal!`,
    data: { movements: results, updatedBarang }
  });
});

// --- STOCK OPNAME SESSIONS & ADJUSTMENT (TRANSACTIONAL) ---
router.get('/opname-sessions', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.opnameSessions });
});

router.post('/opname-sessions', async (req: Request, res: Response): Promise<void> => {
  const { gudangId, petugas, items, catatanGeneral } = req.body;
  const gdg = dbStore.gudang.find(g => g.id === gudangId);
  const opPetugas = petugas || 'Tim Stock Opname';

  const session: StockOpnameSession = {
    id: generateUniqueId('SOP'),
    kodeOpname: `SOP-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-4)}`,
    tanggal: new Date().toISOString().split('T')[0],
    gudangId: gudangId || 'GDG-001',
    gudangNama: gdg?.nama || 'Gudang Utama Central Enterprise',
    petugas: opPetugas,
    status: 'Selesai',
    items: items || [],
    catatanGeneral: catatanGeneral || 'Sesi perhitungan fisik opname tercatat.'
  };

  // Process adjustments to master barang stocks & create adjustment movement records using transactions
  let autoDeletedCount = 0;
  const deletedItemsInfo: string[] = [];

  if (Array.isArray(items)) {
    for (const it of items) {
      const b = dbStore.barang.find(x => x.id === it.barangId);
      if (!b || typeof it.stokFisik !== 'number') continue;

      const stokLama = Number(b.stokSekarang) || 0;
      const selisih = it.stokFisik - stokLama;

      // RULE: Jika stock barang kosong atau 0, otomatis dipindahkan ke arsip/status tidak aktif
      // dan TETAP TEREKAM PADA HISTORY BARANG KELUAR!
      if (it.stokFisik <= 0) {
        const outQty = stokLama > 0 ? stokLama : 0;
        const nowIso = new Date().toISOString();
        const movId = generateUniqueId('MOV');

        const zeroOutMovement: StockMovement = {
          id: movId,
          jenis: 'Keluar',
          barangId: b.id,
          kodeBarang: b.kodeBarang,
          namaBarang: b.namaBarang,
          satuan: b.satuan || 'Pcs',
          jumlah: outQty,
          gudangId: b.gudangId || session.gudangId,
          gudangNama: b.gudangNama || session.gudangNama,
          referensiNota: session.kodeOpname,
          keterangan: `Stock Opname (Stok 0) - Otomatis dipindahkan ke Arsip / Status Tidak Aktif. ${it.catatan || ''}`.trim(),
          tanggal: `${nowIso.split('T')[0]} ${new Date().toTimeString().slice(0, 5)}`,
          petugas: opPetugas,
          hargaSatuan: b.hargaSatuan || 0,
          totalHarga: outQty * (b.hargaSatuan || 0),
          sisaStock: 0,
          createdAt: nowIso,
          createdBy: opPetugas,
          updatedAt: nowIso,
          updatedBy: opPetugas
        };

        dbStore.stockMovements.unshift(zeroOutMovement);
        await syncSaveDoc('stockMovements', zeroOutMovement.id, zeroOutMovement, { name: opPetugas });

        // Update item status to 'Arsip' and stokSekarang to 0
        b.stokSekarang = 0;
        b.status = 'Arsip';
        b.updatedAt = nowIso;
        await syncSaveDoc('barang', b.id, b, { name: opPetugas });

        autoDeletedCount++;
        deletedItemsInfo.push(`${b.namaBarang} (${b.kodeBarang})`);
      } else if (selisih !== 0) {
        // Normal variance adjustment
        try {
          await runStockTransaction({
            barangId: b.id,
            jenis: 'Penyesuaian Opname',
            jumlah: it.stokFisik,
            referensiNota: session.kodeOpname,
            keterangan: `Penyesuaian Fisik Opname (${selisih > 0 ? '+' : ''}${selisih} ${b.satuan}) - ${it.catatan || 'Koreksi Stok Fisik'}`,
            petugas: opPetugas
          });
        } catch (err: any) {
          console.error(`Opname adjustment error for ${b.namaBarang}:`, err?.message);
        }
      }
    }
  }

  dbStore.opnameSessions.unshift(session);
  await syncSaveDoc('opnameSessions', session.id, session, { name: opPetugas });

  const deleteMsg = autoDeletedCount > 0 
    ? ` (${autoDeletedCount} item stok kosong/0 otomatis dipindahkan ke Arsip Tidak Aktif & dicatat di History Keluar: ${deletedItemsInfo.join(', ')})`
    : '';

  dbStore.addLog('USER', opPetugas, 'Stock Opname', 'Finish Opname Physical', `Menyelesaikan Sesi Stock Opname Kode: ${session.kodeOpname}${deleteMsg}`, req.ip);
  dbStore.addNotification('Stock Opname', 'Stock Opname Physical Selesai', `Sesi opname ${session.kodeOpname} telah diproses.${deleteMsg}`, 'success', '/stock-opname/opname');

  res.status(201).json({ 
    success: true, 
    message: `Sesi Stock Opname berhasil disimpan.${deleteMsg}`, 
    data: session,
    autoDeletedCount,
    deletedItems: deletedItemsInfo
  });
});

// Purge or Archive any zero-stock items from active master barang and record them into History Keluar
router.post('/opname/purge-zero', async (req: Request, res: Response): Promise<void> => {
  const { petugas = 'Admin Logistik', permanentDelete = false } = req.body;
  const zeroItems = dbStore.barang.filter(b => (Number(b.stokSekarang) || 0) <= 0);

  if (zeroItems.length === 0) {
    res.json({ success: true, message: 'Tidak ada barang dengan stok 0 / kosong di Master Stok.', purgedCount: 0 });
    return;
  }

  const purgedNames: string[] = [];
  const nowIso = new Date().toISOString();
  const dateStr = `${nowIso.split('T')[0]} ${new Date().toTimeString().slice(0, 5)}`;

  for (const b of zeroItems) {
    const movId = generateUniqueId('MOV');
    const mov: StockMovement = {
      id: movId,
      jenis: 'Keluar',
      barangId: b.id,
      kodeBarang: b.kodeBarang,
      namaBarang: b.namaBarang,
      satuan: b.satuan || 'Pcs',
      jumlah: 0,
      gudangId: b.gudangId,
      gudangNama: b.gudangNama,
      referensiNota: `OPN-ZERO-${Date.now().toString(36).toUpperCase()}`,
      keterangan: 'Stock Opname: Stok Kosong (0) - Dipindahkan ke Arsip / Status Tidak Aktif',
      tanggal: dateStr,
      petugas,
      hargaSatuan: b.hargaSatuan || 0,
      totalHarga: 0,
      sisaStock: 0,
      createdAt: nowIso,
      createdBy: petugas,
      updatedAt: nowIso,
      updatedBy: petugas
    };

    dbStore.stockMovements.unshift(mov as any);
    await syncSaveDoc('stockMovements', mov.id, mov, { name: petugas });

    if (permanentDelete) {
      const idx = dbStore.barang.findIndex(x => x.id === b.id);
      if (idx !== -1) {
        dbStore.barang.splice(idx, 1);
      }
      await syncDeleteDoc('barang', b.id);
    } else {
      b.stokSekarang = 0;
      b.status = 'Arsip';
      b.updatedAt = nowIso;
      await syncSaveDoc('barang', b.id, b, { name: petugas });
    }
    purgedNames.push(`${b.namaBarang} (${b.kodeBarang})`);
  }

  dbStore.addLog('USER', petugas, 'Stock Opname', 'Arsip Barang Stok Kosong', `Memindahkan ${purgedNames.length} barang stok 0 ke Arsip Tidak Aktif: ${purgedNames.join(', ')}`, req.ip);

  res.json({
    success: true,
    message: `Berhasil memindahkan ${purgedNames.length} barang stok 0 ke Arsip / Status Tidak Aktif. Riwayat tetap tersimpan di History Barang Keluar.`,
    purgedCount: purgedNames.length,
    purgedItems: purgedNames
  });
});

export default router;
