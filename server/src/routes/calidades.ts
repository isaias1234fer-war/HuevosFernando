import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

export const calidadesRouter = Router();

calidadesRouter.get('/', async (_req: AuthRequest, res: Response) => {
  const calidades = await prisma.calidad.findMany({ orderBy: { id: 'asc' } });
  res.json(calidades);
});

calidadesRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { nombre, requiere_limpieza, precio_venta_jaba } = req.body;

  const updated = await prisma.calidad.update({
    where: { id },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(requiere_limpieza !== undefined && { requiere_limpieza }),
      ...(precio_venta_jaba !== undefined && { precio_venta_jaba }),
    },
  });

  res.json(updated);
});
