import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

export const ventasRouter = Router();

ventasRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { fecha, calidad_id, cantidad_jabas, precio_por_jaba, notas } = req.body;

  if (!calidad_id || !cantidad_jabas || !precio_por_jaba) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const total = Number(cantidad_jabas) * Number(precio_por_jaba);

  const venta = await prisma.venta.create({
    data: {
      fecha: fecha ? new Date(fecha) : new Date(),
      calidad_id: parseInt(calidad_id),
      cantidad_jabas: parseInt(cantidad_jabas),
      precio_por_jaba,
      total,
      notas,
    },
    include: { calidad: true },
  });

  res.status(201).json(venta);
});

ventasRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { desde, hasta, calidad_id } = req.query;

  const where: any = {};
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde as string);
    if (hasta) where.fecha.lte = new Date((hasta as string) + 'T23:59:59.999Z');
  }
  if (calidad_id) where.calidad_id = parseInt(calidad_id as string);

  const ventas = await prisma.venta.findMany({
    where,
    include: { calidad: true },
    orderBy: { fecha: 'desc' },
  });

  res.json(ventas);
});
