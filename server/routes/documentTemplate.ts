import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { syncSaveDoc } from '../db/firestore';
import { DEFAULT_MASTER_TEMPLATE_CONFIG, MasterDocumentTemplateConfig } from '../../src/types';

const router = Router();

// GET Master Document Template Configuration
router.get('/', (req: Request, res: Response): void => {
  if (!dbStore.documentTemplate) {
    dbStore.documentTemplate = JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE_CONFIG));
  }
  res.json({
    success: true,
    data: dbStore.documentTemplate
  });
});

// Helper for Roman numerals
function getRomanMonth(monthIndex: number): string {
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romanMonths[monthIndex] || String(monthIndex + 1);
}

// PUT Update Master Document Template Configuration
router.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as Partial<MasterDocumentTemplateConfig>;
    if (!payload) {
      res.status(400).json({ success: false, message: 'Payload konfigurasi tidak valid' });
      return;
    }

    const current = dbStore.documentTemplate || JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE_CONFIG));
    
    // Parse version bump
    let currentVersion = current.version || '1.0.0';
    const parts = currentVersion.split('.').map(p => parseInt(p, 10) || 0);
    if (parts.length === 3) {
      parts[2] = parts[2] + 1;
      currentVersion = parts.join('.');
    } else {
      currentVersion = '1.0.1';
    }

    const updated: MasterDocumentTemplateConfig = {
      ...current,
      ...payload,
      version: payload.version || currentVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: req.headers['x-user-name'] as string || 'Administrator SPPG',
      profile: { ...current.profile, ...(payload.profile || {}) },
      letterhead: { ...current.letterhead, ...(payload.letterhead || {}) },
      format: { ...current.format, ...(payload.format || {}) },
      footer: { ...current.footer, ...(payload.footer || {}) },
      numbering: { ...current.numbering, ...(payload.numbering || {}) },
      signatures: Array.isArray(payload.signatures) ? payload.signatures : current.signatures,
      documentTypes: Array.isArray(payload.documentTypes) ? payload.documentTypes : current.documentTypes
    };

    dbStore.documentTemplate = updated;

    // Log Activity
    dbStore.addLog(
      'ADMIN',
      (req.headers['x-user-name'] as string) || 'Administrator',
      'Master Template Dokumen',
      'Update Master Template',
      `Memperbarui konfigurasi Master Template Dokumen (v${updated.version})`,
      req.ip
    );

    // Sync to Cloud Firestore
    await syncSaveDoc('documentTemplate', 'main', updated, {
      name: (req.headers['x-user-name'] as string) || 'Admin Penuh'
    });

    res.json({
      success: true,
      message: `Master Template Dokumen berhasil disimpan (Versi ${updated.version})`,
      data: updated
    });
  } catch (err: any) {
    console.error('Error updating document template:', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan template: ' + (err?.message || err) });
  }
});

// POST Reset to Factory Default Configuration
router.post('/reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const factoryReset = JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE_CONFIG));
    factoryReset.updatedAt = new Date().toISOString();
    factoryReset.updatedBy = (req.headers['x-user-name'] as string) || 'System Admin (Factory Reset)';
    
    dbStore.documentTemplate = factoryReset;

    dbStore.addLog(
      'ADMIN',
      (req.headers['x-user-name'] as string) || 'Administrator',
      'Master Template Dokumen',
      'Reset Template Default',
      'Mengembalikan konfigurasi Master Template Dokumen ke format default pabrik BGN SPPG',
      req.ip
    );

    await syncSaveDoc('documentTemplate', 'main', factoryReset);

    res.json({
      success: true,
      message: 'Master Template Dokumen berhasil di-reset ke pengaturan standar resmi BGN.',
      data: factoryReset
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal mereset template: ' + (err?.message || err) });
  }
});

// POST Generate Auto Document Number (Centralized Counter)
router.post('/generate-number', async (req: Request, res: Response): Promise<void> => {
  try {
    const { docCode = 'STOK', category = 'Logistik & Stok' } = req.body;
    const config = dbStore.documentTemplate || JSON.parse(JSON.stringify(DEFAULT_MASTER_TEMPLATE_CONFIG));
    const numbering = config.numbering;

    const currentCounter = (numbering.currentCounters[docCode] || 0) + 1;
    numbering.currentCounters[docCode] = currentCounter;

    const padLen = numbering.counterLength || 3;
    const counterStr = String(currentCounter).padStart(padLen, '0');

    const now = new Date();
    const monthStr = numbering.monthFormat === 'roman' ? getRomanMonth(now.getMonth()) : String(now.getMonth() + 1).padStart(2, '0');
    const yearStr = numbering.yearFormat === 'YY' ? String(now.getFullYear()).slice(2) : String(now.getFullYear());
    const sep = numbering.separator || '/';
    const prefix = numbering.prefix || 'SPPG-TMG';

    // Format: {counter}/{prefix}/{code}/{month}/{year}
    const generatedNumber = numbering.formatPattern
      .replace('{counter}', counterStr)
      .replace('{prefix}', prefix)
      .replace('{code}', docCode)
      .replace('{month}', monthStr)
      .replace('{year}', yearStr);

    dbStore.documentTemplate.numbering = numbering;

    // Sync updated counter to firestore asynchronously
    syncSaveDoc('documentTemplate', 'main', dbStore.documentTemplate).catch(() => {});

    res.json({
      success: true,
      data: {
        number: generatedNumber,
        counter: currentCounter,
        code: docCode,
        generatedAt: now.toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Gagal membuat nomor dokumen: ' + (err?.message || err) });
  }
});

export default router;
