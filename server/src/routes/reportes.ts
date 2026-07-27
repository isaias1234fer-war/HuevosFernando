import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getResumen } from '../services/reportes';

export const reportesRouter = Router();

reportesRouter.get('/resumen', async (req: AuthRequest, res: Response) => {
  try {
    const { desde, hasta } = req.query;
    const resumen = await getResumen(desde as string | undefined, hasta as string | undefined);
    res.json(resumen);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});
