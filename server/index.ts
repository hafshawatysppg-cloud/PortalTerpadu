import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import '../db.js';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import roleRoutes from './routes/roles';
import menuRoutes from './routes/menus';
import masterRoutes from './routes/master';
import esuratRoutes from './routes/esurat';
import stockRoutes from './routes/stock';
import notificationRoutes from './routes/notifications';
import logRoutes from './routes/logs';
import searchRoutes from './routes/search';
import settingRoutes from './routes/settings';
import bbmRoutes from './routes/bbm';
import tugasDivisiRoutes from './routes/tugasDivisi';
import penerimaManfaatRoutes from './routes/penerimaManfaat';
import nutritionPlansRoutes from './routes/nutritionPlans';
import barangDatangRoutes from './routes/barangDatang';
import menuHarianRoutes from './routes/menuHarian';
import documentTemplateRoutes from './routes/documentTemplate';
import distribusiRoutes from './routes/distribusi';
import foodWasteRoutes from './routes/foodWaste';
import petugasRoutes from './routes/petugas';
import { swaggerSpec } from './docs/swagger';
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
} from './services/syncService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prevent unhandled background stream rejections from crashing the process
process.on('unhandledRejection', (reason) => {
  console.warn('[Process Warning] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.warn('[Process Warning] Uncaught Exception:', err?.message || err);
});

// Safe fallbacks for runtime environment variables
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
if (!process.env.JWT_SECRET) {
  console.warn('[Startup Warning] JWT_SECRET belum dikonfigurasi, menggunakan kunci fallback sementara.');
  process.env.JWT_SECRET = 'portal_bgn_terpadu_jwt_secret_token_secure_key_2026_prod';
}
const DEFAULT_PROD_APP_URL = 'https://sppg-hafshawaty1.com';

async function startServer() {
  try {
    hydrateFromLocalSnapshot();
  } catch (hydrateErr: any) {
    console.warn('[Startup Warning] Gagal memuat local snapshot:', hydrateErr?.message || hydrateErr);
  }

  const app = express();
  const rootDir = __filename.endsWith(path.join('dist', 'server.js'))
    ? path.resolve(__dirname, '..')
    : path.resolve(__dirname, '..');
  const distClientPath = path.resolve(rootDir, 'dist', 'client');
  const distClientIndexHtml = path.join(distClientPath, 'index.html');
  const launchedViaRootServerJs = Boolean(
    process.argv[1] && path.basename(process.argv[1]) === 'server.js'
  );
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    __filename.endsWith(path.join('dist', 'server.js')) ||
    (launchedViaRootServerJs && fs.existsSync(distClientIndexHtml));

  const PORT = Number(process.env.PORT) || 3000;
  const APP_URL = process.env.APP_URL || (isProduction ? DEFAULT_PROD_APP_URL : `http://localhost:${PORT}`);

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.text({ type: 'text/plain', limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // API Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
    });
  });

  // Cloud Database Status Endpoint
  app.get('/api/v1/cloud/status', (_req: Request, res: Response) => {
    res.json({
      success: true,
      cloud: getCloudInfo(),
    });
  });

  // Cloud Database Live Connection Test Probe
  app.post('/api/v1/cloud/test-connection', async (_req: Request, res: Response) => {
    const result = await testFirestoreConnection();
    res.json(result);
  });

  // Unified App-State Sync
  app.get('/api/v1/cloud/app-state', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: getAppStateEntries(),
      cloud: getCloudInfo(),
    });
  });

  app.post('/api/v1/cloud/app-state', async (req: Request, res: Response) => {
    try {
      let bodyPayload = req.body;
      if (typeof bodyPayload === 'string') {
        try {
          bodyPayload = JSON.parse(bodyPayload);
        } catch {
          bodyPayload = {};
        }
      }
      const entries = bodyPayload?.entries;
      if (!entries || typeof entries !== 'object') {
        res.status(400).json({ success: false, message: 'Payload entries tidak valid' });
        return;
      }
      const userName = (req.headers['x-user-name'] as string) || bodyPayload?.userName || 'Web Client';
      const updatedCount = await saveAppStateEntries(entries, { name: userName });
      res.json({
        success: true,
        updatedCount,
        cloud: getCloudInfo(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Gagal menyimpan sinkronisasi app-state',
      });
    }
  });

  // Server Cached Collection Snapshot Fallback
  app.get('/api/v1/cloud/collection/:name', (req: Request, res: Response) => {
    const rawName = req.params.name;
    const aliasMap: Record<string, string> = {
      distribution_reports: 'distributionReports',
      divisiTaskRecords: 'tugasDivisi',
    };
    const resolvedName = aliasMap[rawName] || rawName;
    const data = getCollectionSnapshot(resolvedName);
    res.json({
      success: true,
      collection: rawName,
      data: Array.isArray(data) ? data : [],
    });
  });

  app.post('/api/v1/cloud/collection/:name', (req: Request, res: Response) => {
    const rawName = req.params.name;
    const aliasMap: Record<string, string> = {
      distribution_reports: 'distributionReports',
      divisiTaskRecords: 'tugasDivisi',
    };
    const resolvedName = aliasMap[rawName] || rawName;
    const items = Array.isArray(req.body?.data) ? req.body.data : [];
    saveCollectionSnapshot(resolvedName, items);
    res.json({ success: true, collection: rawName, count: items.length });
  });

  // Operational Snapshot Cache
  app.get('/api/v1/cloud/operational-snapshot', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: getOperationalSnapshot(),
    });
  });

  app.post('/api/v1/cloud/operational-snapshot', (req: Request, res: Response) => {
    const slices = req.body?.slices;
    if (slices && typeof slices === 'object') {
      saveOperationalSnapshotSlices(slices);
    }
    res.json({ success: true });
  });

  // Flush queued writes, persist disk snapshot, and sync with Supabase
  app.post('/api/v1/cloud/sync-all', async (req: Request, res: Response) => {
    try {
      let bodyPayload = req.body;
      if (typeof bodyPayload === 'string') {
        try {
          bodyPayload = JSON.parse(bodyPayload);
        } catch {
          bodyPayload = {};
        }
      }
      if (bodyPayload?.entries && typeof bodyPayload.entries === 'object') {
        await saveAppStateEntries(bodyPayload.entries, {
          name: (req.headers['x-user-name'] as string) || 'Manual Cloud Sync',
        });
      }
      await flushWriteQueue();
      saveSnapshotToDiskNow();
      await initFirestoreSync(Boolean(bodyPayload?.forcePull));
      res.json({
        success: true,
        message: 'Seluruh data aplikasi berhasil disinkronisasi ke Supabase & cadangan server.',
        cloud: getCloudInfo(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Gagal melakukan sinkronisasi penuh ke Supabase',
      });
    }
  });

  // Re-seed clean slate master collections to Supabase
  app.post('/api/v1/cloud/reseed-clean-slate', async (_req: Request, res: Response) => {
    try {
      await initFirestoreSync(true);
      res.json({
        success: true,
        message: 'Koleksi database berhasil diinisialisasi dan disinkronisasi ke Supabase!',
        cloud: getCloudInfo(),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Gagal sinkronisasi data ke Supabase',
      });
    }
  });

  // Swagger Specs Endpoint
  app.get('/api/docs/swagger.json', (_req: Request, res: Response) => {
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

  // Prevent any unmatched /api/* endpoint from falling through to SPA HTML
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Endpoint API tidak ditemukan: ${req.method} ${req.originalUrl}`,
    });
  });

  // Global JSON error handler for /api/* routes
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      res.status(err?.status || 500).json({
        success: false,
        message: err?.message || 'Terjadi kesalahan internal pada server API',
      });
      return;
    }
    next(err);
  });

  // Development vs Production Frontend Serving
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    if (fs.existsSync(distClientPath)) {
      app.use(express.static(distClientPath, { index: 'index.html' }));
    }
    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(distClientIndexHtml)) {
        res.sendFile(distClientIndexHtml);
      } else {
        res
          .status(503)
          .send('Aplikasi sedang disiapkan. Silakan jalankan build atau muat ulang beberapa saat lagi.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Portal Enterprise Gateway] Running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'}, APP_URL=${APP_URL})`
    );
    setTimeout(() => {
      try {
        initFirestoreSync().catch((err) =>
          console.warn('Supabase sync initialization warning:', err?.message || err)
        );
      } catch (err: any) {
        console.warn('Supabase sync startup warning:', err?.message || err);
      }
    }, 200);
  });
}

startServer().catch((err) => {
  console.error('[Startup Warning] Server initialization issue:', err);
});
