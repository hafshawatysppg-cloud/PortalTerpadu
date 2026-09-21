import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

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
import documentTemplateRoutes from './server/routes/documentTemplate';
import distribusiRoutes from './server/routes/distribusi';
import { swaggerSpec } from './server/docs/swagger';
import { initFirestoreSync, getCloudInfo } from './server/db/firestore';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Google Cloud Firestore Realtime Synchronization
  initFirestoreSync().catch(err => console.error('Firestore initialization warning:', err));

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
  app.use('/api/v1/document-template', documentTemplateRoutes);
  app.use('/api/v1/distribusi', distribusiRoutes);


  // Development vs Production Environment Setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Portal Enterprise Gateway] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
