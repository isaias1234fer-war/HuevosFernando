import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

export const comprasRouter = Router();

comprasRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { fecha, calidad_id, cantidad_jabas, peso_total_kg, precio_por_kg, notas } = req.body;

  if (!calidad_id || !cantidad_jabas || !peso_total_kg || !precio_por_kg) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const costo_total = Number(peso_total_kg) * Number(precio_por_kg);

  const compra = await prisma.compra.create({
    data: {
      fecha: fecha ? new Date(fecha) : new Date(),
      calidad_id,
      cantidad_jabas: parseInt(cantidad_jabas),
      peso_total_kg,
      precio_por_kg,
      costo_total,
      notas,
    },
    include: { calidad: true },
  });

  res.status(201).json(compra);
});

comprasRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { desde, hasta, calidad_id } = req.query;

  const where: any = {};
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde as string);
    if (hasta) where.fecha.lte = new Date((hasta as string) + 'T23:59:59.999Z');
  }
  if (calidad_id) where.calidad_id = parseInt(calidad_id as string);

  const compras = await prisma.compra.findMany({
    where,
    include: { calidad: true, limpieza: true },
    orderBy: { fecha: 'desc' },
  });

  res.json(compras);
});
