import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { GlobalSearchResult } from '../../src/types';

const router = Router();

// Global Cross-Module Search Engine API
router.get('/', (req: Request, res: Response): void => {
  const q = (req.query.q as string || '').trim().toLowerCase();

  if (!q) {
    res.json({ success: true, data: [] });
    return;
  }

  const results: GlobalSearchResult[] = [];

  // Search Surat Masuk
  dbStore.suratMasuk.forEach(sm => {
    if (
      sm.nomorSurat.toLowerCase().includes(q) ||
      sm.nomorAgenda.toLowerCase().includes(q) ||
      sm.pengirim.toLowerCase().includes(q) ||
      sm.perihal.toLowerCase().includes(q)
    ) {
      results.push({
        id: sm.id,
        type: 'Surat Masuk',
        modul: 'e-Surat',
        title: `Surat Masuk: ${sm.nomorSurat}`,
        subtitle: `${sm.pengirim} - ${sm.perihal}`,
        badge: sm.sifat,
        targetView: '/esurat'
      });
    }
  });

  // Search Surat Keluar
  dbStore.suratKeluar.forEach(sk => {
    if (
      sk.nomorSurat.toLowerCase().includes(q) ||
      sk.tujuan.toLowerCase().includes(q) ||
      sk.perihal.toLowerCase().includes(q)
    ) {
      results.push({
        id: sk.id,
        type: 'Surat Keluar',
        modul: 'e-Surat',
        title: `Surat Keluar: ${sk.nomorSurat}`,
        subtitle: `Tujuan: ${sk.tujuan} - ${sk.perihal}`,
        badge: sk.statusApproval,
        targetView: '/esurat'
      });
    }
  });

  // Search Master Barang
  dbStore.barang.forEach(b => {
    if (
      b.kodeBarang.toLowerCase().includes(q) ||
      b.namaBarang.toLowerCase().includes(q) ||
      b.barcode.includes(q) ||
      b.kategoriNama.toLowerCase().includes(q)
    ) {
      results.push({
        id: b.id,
        type: 'Barang',
        modul: 'Stock Opname',
        title: `[${b.kodeBarang}] ${b.namaBarang}`,
        subtitle: `Stok Saat Ini: ${b.stokSekarang} ${b.satuan} (${b.gudangNama})`,
        badge: `${b.stokSekarang} ${b.satuan}`,
        targetView: '/stock'
      });
    }
  });

  // Search Master Pegawai
  dbStore.pegawai.forEach(p => {
    if (
      p.nama.toLowerCase().includes(q) ||
      p.nip.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.divisiNama.toLowerCase().includes(q)
    ) {
      results.push({
        id: p.id,
        type: 'Pegawai',
        modul: 'Master Data',
        title: `Pegawai: ${p.nama} (NIP: ${p.nip})`,
        subtitle: `${p.jabatanNama} - ${p.divisiNama}`,
        badge: p.status,
        targetView: '/master-data'
      });
    }
  });

  res.json({ success: true, query: q, total: results.length, data: results });
});

export default router;
