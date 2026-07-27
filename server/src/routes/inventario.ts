import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getInventario } from '../services/inventario';

export const inventarioRouter = Router();

inventarioRouter.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const inventario = await getInventario();
    res.json(inventario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});
