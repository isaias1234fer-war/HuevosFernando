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

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

