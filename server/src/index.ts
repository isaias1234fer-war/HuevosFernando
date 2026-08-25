import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth';
import { calidadesRouter } from './routes/calidades';
import { comprasRouter } from './routes/compras';
import { limpiezasRouter } from './routes/limpiezas';
import { ventasRouter } from './routes/ventas';
import { pagosRouter } from './routes/pagos';
import { inventarioRouter } from './routes/inventario';
import { reportesRouter } from './routes/reportes';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 4000;

// Allow multiple origins: comma-separated list in FRONTEND_URL or wildcard
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// Handle preflight for all routes
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/calidades', authMiddleware, calidadesRouter);
app.use('/api/compras', authMiddleware, comprasRouter);
app.use('/api/limpiezas', authMiddleware, limpiezasRouter);
app.use('/api/ventas', authMiddleware, ventasRouter);
app.use('/api/pagos', authMiddleware, pagosRouter);
app.use('/api/inventario', authMiddleware, inventarioRouter);
app.use('/api/reportes', authMiddleware, reportesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

