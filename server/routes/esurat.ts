import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { SuratMasuk, SuratKeluar, Disposisi } from '../../src/types';
import { syncSaveDoc } from '../db/firestore';

const router = Router();

// --- SURAT MASUK ---
router.get('/surat-masuk', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.suratMasuk });
});

router.post('/surat-masuk', (req: Request, res: Response): void => {
  const { nomorSurat, pengirim, perihal, tanggalSurat, tanggalTerima, sifat, ringkasan } = req.body;

  if (!nomorSurat || !pengirim || !perihal) {
    res.status(400).json({ success: false, message: 'Nomor Surat, Pengirim, dan Perihal wajib diisi.' });
    return;
  }

  const newSurat: SuratMasuk = {
    id: `SM-2026-${String(dbStore.suratMasuk.length + 1).padStart(3, '0')}`,
    nomorSurat,
    nomorAgenda: `AGD-2026-${String(100 + dbStore.suratMasuk.length)}`,
    pengirim,
    perihal,
    tanggalSurat: tanggalSurat || new Date().toISOString().split('T')[0],
    tanggalTerima: tanggalTerima || new Date().toISOString().split('T')[0],
    sifat: sifat || 'Biasa',
    status: 'Baru',
    ringkasan,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFIED-SM-${Date.now()}`
  };

  dbStore.suratMasuk.unshift(newSurat);
  syncSaveDoc('suratMasuk', newSurat.id, newSurat);
  dbStore.addLog('USER', 'Operator e-Surat', 'e-Surat Digital', 'Input Surat Masuk', `Mencatat Surat Masuk No: ${nomorSurat}`, req.ip);
  dbStore.addNotification('e-Surat', 'Surat Masuk Baru Received', `Surat Masuk No: ${nomorSurat} dari ${pengirim} telah dicatat.`, 'info', '/esurat');

  res.status(201).json({ success: true, message: 'Surat Masuk berhasil dicatat', data: newSurat });
});

// --- SURAT KELUAR & AUTO-NUMBERING ---
router.get('/surat-keluar', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.suratKeluar });
});

router.post('/surat-keluar/generate-number', (req: Request, res: Response): void => {
  const { divisiCode = 'TIK' } = req.body;
  const count = dbStore.suratKeluar.length + 1;
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const monthRoman = romanMonths[new Date().getMonth()];
  const generatedNum = `${String(count).padStart(3, '0')}/PORTAL-${divisiCode}/SK/${monthRoman}/2026`;

  res.json({ success: true, data: { nomorSurat: generatedNum } });
});

router.post('/surat-keluar', (req: Request, res: Response): void => {
  const { nomorSurat, tujuan, perihal, tanggalSurat, pembuat, templateId } = req.body;

  if (!tujuan || !perihal) {
    res.status(400).json({ success: false, message: 'Tujuan dan Perihal wajib diisi.' });
    return;
  }

  const generatedNum = nomorSurat || `${String(dbStore.suratKeluar.length + 1).padStart(3, '0')}/PORTAL-TIK/SK/VII/2026`;

  const newSurat: SuratKeluar = {
    id: `SK-2026-${String(dbStore.suratKeluar.length + 1).padStart(3, '0')}`,
    nomorSurat: generatedNum,
    tujuan,
    perihal,
    tanggalSurat: tanggalSurat || new Date().toISOString().split('T')[0],
    pembuat: pembuat || 'Staf Tata Usaha',
    statusApproval: 'Menunggu Approval',
    templateId,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFIED-SK-${Date.now()}`
  };

  dbStore.suratKeluar.unshift(newSurat);
  syncSaveDoc('suratKeluar', newSurat.id, newSurat);
  dbStore.addLog('USER', pembuat || 'Staf TU', 'e-Surat Digital', 'Buat Surat Keluar', `Draft Surat Keluar No: ${generatedNum}`, req.ip);
  dbStore.addNotification('e-Surat', 'Permohonan Approval Surat Keluar', `Surat Keluar No: ${generatedNum} menunggu persetujuan supervisor.`, 'info', '/esurat');

  res.status(201).json({ success: true, message: 'Surat Keluar diajukan untuk approval', data: newSurat });
});

router.put('/surat-keluar/:id/approve', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { statusApproval, approver } = req.body;
  const surat = dbStore.suratKeluar.find(s => s.id === id);

  if (!surat) {
    res.status(404).json({ success: false, message: 'Surat Keluar tidak ditemukan.' });
    return;
  }

  surat.statusApproval = statusApproval || 'Disetujui';
  surat.approver = approver || 'Dr. H. Ahmad Pratama, M.Kom';

  syncSaveDoc('suratKeluar', surat.id, surat);
  dbStore.addLog('ADMIN', approver || 'Pimpinan', 'e-Surat Digital', 'Approval Surat Keluar', `Surat Keluar No: ${surat.nomorSurat} status: ${surat.statusApproval}`, req.ip);
  dbStore.addNotification('e-Surat', `Surat Keluar ${surat.statusApproval}`, `Surat Keluar ${surat.nomorSurat} telah ${surat.statusApproval}.`, 'success', '/esurat');

  res.json({ success: true, message: `Surat Keluar berhasil ${surat.statusApproval}`, data: surat });
});

// --- DISPOSISI WORKFLOW ---
router.get('/disposisi', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.disposisi });
});

router.post('/disposisi', (req: Request, res: Response): void => {
  const { suratMasukId, pengirimDisposisi, penerimaDisposisi, instruksi, sifat, batasWaktu } = req.body;
  const surat = dbStore.suratMasuk.find(s => s.id === suratMasukId);

  if (!surat) {
    res.status(400).json({ success: false, message: 'Surat Masuk sasaran tidak valid.' });
    return;
  }

  const newDisposisi: Disposisi = {
    id: `DSP-${String(dbStore.disposisi.length + 1).padStart(3, '0')}`,
    suratMasukId,
    nomorSurat: surat.nomorSurat,
    pengirimDisposisi: pengirimDisposisi || 'Kepala Pusat Data',
    penerimaDisposisi: penerimaDisposisi || 'Divisi TIK & Logistik',
    instruksi: instruksi || 'Harap ditindaklanjuti segera.',
    sifat: sifat || 'Segera',
    batasWaktu: batasWaktu || '2026-08-05',
    status: 'Pending',
    tanggalDisposisi: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };

  surat.status = 'Proses Disposisi';
  dbStore.disposisi.unshift(newDisposisi);
  syncSaveDoc('disposisi', newDisposisi.id, newDisposisi);
  syncSaveDoc('suratMasuk', surat.id, surat);
  dbStore.addLog('ADMIN', pengirimDisposisi || 'Pimpinan', 'e-Surat Digital', 'Disposisi Surat', `Meneruskan disposisi Surat No: ${surat.nomorSurat}`, req.ip);
  dbStore.addNotification('e-Surat', 'Disposisi Surat Baru', `Disposisi baru dari ${pengirimDisposisi} untuk ${penerimaDisposisi}.`, 'warning', '/esurat');

  res.status(201).json({ success: true, message: 'Disposisi berhasil diterbitkan', data: newDisposisi });
});

// --- TEMPLATES ---
router.get('/templates', (req: Request, res: Response): void => {
  res.json({ success: true, data: dbStore.templates });
});

export default router;
