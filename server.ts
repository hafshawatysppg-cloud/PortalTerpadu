import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import './db.js';

// Prevent unhandled background stream rejections from crashing the process
process.on('unhandledRejection', (reason) => {
  console.warn('[Process Warning] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.warn('[Process Warning] Uncaught Exception:', err?.message || err);
});

// Default fallbacks for critical runtime env vars
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'portal_bgn_terpadu_jwt_secret_token_secure_key_2026_prod';
}
const DEFAULT_PROD_APP_URL = 'https://sppg-hafshawaty1.com';

import authRoutes from './server/routes/auth';
import userRoutes from './server/routes/users';
import roleRoutes from './server/routes/roles';
import menuRoutes from './server/routes/menus';
import masterRoutes from './server/routes/master';
import esuratRoutes from './server/routes/esurat';
import stockRoutes from './server/routes/stock';
import notificationRoutes from './server/routes/notifications';
import logRoutes from './server/routes/logs';
import searchRoutes from './server/routes/search';
import settingRoutes from './server/routes/settings';
import bbmRoutes from './server/routes/bbm';
import tugasDivisiRoutes from './server/routes/tugasDivisi';
import penerimaManfaatRoutes from './server/routes/penerimaManfaat';
import nutritionPlansRoutes from './server/routes/nutritionPlans';
import barangDatangRoutes from './server/routes/barangDatang';
import menuHarianRoutes from './server/routes/menuHarian';
import documentTemplateRoutes from './server/routes/documentTemplate';
import distribusiRoutes from './server/routes/distribusi';
import foodWasteRoutes from './server/routes/foodWaste';
import petugasRoutes from './server/routes/petugas';
import { swaggerSpec } from './server/docs/swagger';
import {
  initFirestoreSync,
  getCloudInfo,
  testFirestoreConnection,
  hydrateFromLocalSnapshot,
  getAppStateEntries,
  saveAppStateEntries,
  getCollectionSnapshot,
  saveCollectionSnapshot,
  getOperationalSnapshot,
  saveOperationalSnapshotSlices,
  flushWriteQueue,
  saveSnapshotToDiskNow
} from './server/db/firestore';

async function startServer() {
  // Hydrate persistent server cache immediately before accepting requests (0 Firestore reads)
  try {
    hydrateFromLocalSnapshot();
  } catch (hydrateErr: any) {
    console.warn('[Startup Warning] Gagal memuat local snapshot:', hydrateErr?.message || hydrateErr);
  }

  const app = express();
  const distPath = path.join(process.cwd(), 'dist');
  const distIndexHtml = path.join(distPath, 'index.html');
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.argv[1]?.includes('server.cjs'));
  const PORT = Number(process.env.PORT) || 3000;
  const APP_URL = process.env.APP_URL || (isProduction ? DEFAULT_PROD_APP_URL : `http://localhost:${PORT}`);

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.text({ type: 'text/plain', limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // API Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'online',
      appName: 'Portal Administrasi Terpadu',
      version: '2026.1.0-Enterprise',
      timestamp: new Date().toISOString()
    });
  });

  // Google Cloud Database Realtime Status Endpoint
  app.get('/api/v1/cloud/status', (req: Request, res: Response) => {
    res.json({
      success: true,
      cloud: getCloudInfo()
    });
  });

  // Google Cloud Database Live Connection Test Probe
  app.post('/api/v1/cloud/test-connection', async (req: Request, res: Response) => {
    const result = await testFirestoreConnection();
    res.json(result);
  });

  // Unified App-State Sync (All sppg_* client localStorage data <-> Google Cloud + Server Disk Snapshot)
  app.get('/api/v1/cloud/app-state', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: getAppStateEntries(),
      cloud: getCloudInfo()
    });
  });

  app.post('/api/v1/cloud/app-state', async (req: Request, res: Response) => {
    try {
      let bodyPayload = req.body;
      if (typeof bodyPayload === 'string') {
        try {
          bodyPayload = JSON.parse(bodyPayload);
        } catch (_) {
          bodyPayload = {};
        }
      }
      const entries = bodyPayload?.entries;
      if (!entries || typeof entries !== 'object') {
        return res.status(400).json({ success: false, message: 'Payload entries tidak valid' });
      }
      const userName = (req.headers['x-user-name'] as string) || bodyPayload?.userName || 'Web Client';
      const updatedCount = await saveAppStateEntries(entries, { name: userName });
      res.json({
        success: true,
        updatedCount,
        cloud: getCloudInfo()
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Gagal menyimpan sinkronisasi app-state'
      });
    }
  });

  // Server Cached Collection Snapshot Fallback (avoids burning Firestore quota on read)
  app.get('/api/v1/cloud/collection/:name', (req: Request, res: Response) => {
    const rawName = req.params.name;
    const aliasMap: Record<string, string> = {
      distribution_reports: 'distributionReports',
      divisiTaskRecords: 'tugasDivisi'
    };
    const resolvedName = aliasMap[rawName] || rawName;
    const data = getCollectionSnapshot(resolvedName);
    res.json({
      success: true,
      collection: rawName,
      data: Array.isArray(data) ? data : []
    });
  });

  app.post('/api/v1/cloud/collection/:name', (req: Request, res: Response) => {
    const rawName = req.params.name;
    const aliasMap: Record<string, string> = {
      distribution_reports: 'distributionReports',
      divisiTaskRecords: 'tugasDivisi'
    };
    const resolvedName = aliasMap[rawName] || rawName;
    const items = Array.isArray(req.body?.data) ? req.body.data : [];
    saveCollectionSnapshot(resolvedName, items);
    res.json({ success: true, collection: rawName, count: items.length });
  });

  // Operational Snapshot Cache (Akuntan, Master Menu, Siklus Menu, dll.)
  app.get('/api/v1/cloud/operational-snapshot', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: getOperationalSnapshot()
    });
  });

  app.post('/api/v1/cloud/operational-snapshot', (req: Request, res: Response) => {
    const slices = req.body?.slices;
    if (slices && typeof slices === 'object') {
      saveOperationalSnapshotSlices(slices);
    }
    res.json({ success: true });
  });

  // Flush queued writes, persist disk snapshot, and optionally force-pull from Firestore
  app.post('/api/v1/cloud/sync-all', async (req: Request, res: Response) => {
    try {
      let bodyPayload = req.body;
      if (typeof bodyPayload === 'string') {
        try {
          bodyPayload = JSON.parse(bodyPayload);
        } catch (_) {
          bodyPayload = {};
        }
      }
      if (bodyPayload?.entries && typeof bodyPayload.entries === 'object') {
        await saveAppStateEntries(bodyPayload.entries, {
          name: (req.headers['x-user-name'] as string) || 'Manual Cloud Sync'
        });
      }
      await flushWriteQueue();
      saveSnapshotToDiskNow();
      await initFirestoreSync(Boolean(bodyPayload?.forcePull));
      res.json({
        success: true,
        message: 'Seluruh data aplikasi berhasil disinkronisasi ke Supabase & cadangan server.',
        cloud: getCloudInfo()
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Gagal melakukan sinkronisasi penuh ke Supabase'
      });
    }
  });

  // Re-seed clean slate master collections to Supabase
  app.post('/api/v1/cloud/reseed-clean-slate', async (req: Request, res: Response) => {
    try {
      await initFirestoreSync(true);
      res.json({
        success: true,
        message: 'Koleksi database berhasil diinisialisasi dan disinkronisasi ke Supabase!',
        cloud: getCloudInfo()
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Gagal sinkronisasi data ke Supabase'
      });
    }
  });

  // Swagger Specs Endpoint
  app.get('/api/docs/swagger.json', (req: Request, res: Response) => {
    res.json(swaggerSpec);
  });

  // REST API Gateway Routes (/api/v1)
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/roles', roleRoutes);
  app.use('/api/v1/menus', menuRoutes);
  app.use('/api/v1/master', masterRoutes);
  app.use('/api/v1/esurat', esuratRoutes);
  app.use('/api/v1/stock', stockRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/activity-logs', logRoutes);
  app.use('/api/v1/search', searchRoutes);
  app.use('/api/v1/settings', settingRoutes);
  app.use('/api/v1/bbm', bbmRoutes);
  app.use('/api/v1/tugas-divisi', tugasDivisiRoutes);
  app.use('/api/v1/penerima-manfaat', penerimaManfaatRoutes);
  app.use('/api/v1/nutrition-plans', nutritionPlansRoutes);
  app.use('/api/nutrition', nutritionPlansRoutes);
  app.use('/api/v1/barang-datang', barangDatangRoutes);
  app.use('/api/v1/menu-harian', menuHarianRoutes);
  app.use('/api/v1/document-template', documentTemplateRoutes);
  app.use('/api/v1/distribusi', distribusiRoutes);
  app.use('/api/v1/food-waste', foodWasteRoutes);
  app.use('/api/food-waste', foodWasteRoutes);
  app.use('/api/v1/petugas', petugasRoutes);
  app.use('/api/petugas', petugasRoutes);

  // Prevent any unmatched /api/* endpoint from falling through to Vite/SPA HTML (index.html)
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Endpoint API tidak ditemukan: ${req.method} ${req.originalUrl}`
    });
  });

  // Global JSON error handler for /api/* routes
  app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api')) {
      res.status(err?.status || 500).json({
        success: false,
        message: err?.message || 'Terjadi kesalahan internal pada server API'
      });
      return;
    }
    next(err);
  });

  // Development vs Production Environment Setup
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, { index: 'index.html' }));
    }
    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(distIndexHtml)) {
        res.sendFile(distIndexHtml);
      } else {
        res.status(503).send('Aplikasi sedang disiapkan. Silakan jalankan build atau muat ulang beberapa saat lagi.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Portal Enterprise Gateway] Running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'}, APP_URL=${APP_URL})`);
    // Initialize Google Cloud Firestore synchronization in background after port is bound
    setTimeout(() => {
      try {
        initFirestoreSync().catch(err => console.warn('Firestore initialization warning:', err?.message || err));
      } catch (err: any) {
        console.warn('Firestore startup warning:', err?.message || err);
      }
    }, 200);
  });
}

startServer().catch((err) => {
  console.error('[Startup Warning] Server initialization issue:', err);
});
