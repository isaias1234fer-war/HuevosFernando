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
  const { nombre, requiere_limpieza, precio_venta_jaba, dias_conservacion_min, dias_conservacion_max } = req.body;

  const updated = await prisma.calidad.update({
    where: { id },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(requiere_limpieza !== undefined && { requiere_limpieza }),
      ...(precio_venta_jaba !== undefined && { precio_venta_jaba }),
      ...(dias_conservacion_min !== undefined && { dias_conservacion_min }),
      ...(dias_conservacion_max !== undefined && { dias_conservacion_max }),
    },
  });

  res.json(updated);
});
