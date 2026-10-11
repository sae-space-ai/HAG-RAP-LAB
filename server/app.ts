/**
 * HAG-RAP Phase 1 — Express Application
 * 
 * Configures middleware, CORS, routes, error handling.
 * Does NOT start the server — that's done in index.ts.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { createRouter, createDRERouter } from './routes';
import { EGMEngine } from './engine';
import { DREEngine } from './dre-engine';
import { SQLiteStorageAdapter } from './storage';
import type { StorageAdapter } from './storage';

export interface AppDependencies {
  storage: StorageAdapter;
  engine: EGMEngine;
  dreEngine: DREEngine;
}

export function createApp(deps: AppDependencies) {
  const app = express();

  // === SECURITY MIDDLEWARE ===
  
  // CORS — restrict origins in production
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];
  
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'x-dev-token'],
  }));

  // Body parsing with size limit
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // === REQUEST LOGGING (basic) ===
  app.use((req, _res, next) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
  });

  // === API ROUTES ===
  const router = createRouter(deps.engine, deps.storage);
  app.use('/api/v1', router);
  
  // Phase 2.2: DRE routes
  const dreRouter = createDRERouter(deps.dreEngine, deps.storage);
  app.use('/api/v1/dre', dreRouter);

  // === STATIC FILES (serve Vite build in production) ===
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));

  // SPA fallback — serve index.html for non-API routes
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        res.status(404).json({
          error: 'Not found',
          code: 'NOT_FOUND',
          message: 'Recurso no encontrado.',
        });
      }
    });
  });

  // === ERROR HANDLER ===
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err.message);
    
    // Don't expose stack traces or internal details
    const statusCode = err.message.includes('CORS') ? 403 : 500;
    res.status(statusCode).json({
      error: statusCode === 403 ? 'Forbidden' : 'Internal server error',
      code: statusCode === 403 ? 'CORS_BLOCKED' : 'INTERNAL_ERROR',
      message: 'Ha ocurrido un error interno. No se exponen detalles por seguridad.',
    });
  });

  return app;
}

export function createDependencies(dbPath?: string): AppDependencies {
  const storage = new SQLiteStorageAdapter(dbPath);
  const engine = new EGMEngine(storage);
  const dreEngine = new DREEngine(storage);
  return { storage, engine, dreEngine };
}
