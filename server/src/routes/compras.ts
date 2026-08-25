import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

export const comprasRouter = Router();

comprasRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error: any) {
    console.error('Error al registrar compra:', error);
    res.status(500).json({ error: error.message || 'Error al registrar la compra' });
  }
});

comprasRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error: any) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ error: error.message || 'Error al listar compras' });
  }
});

comprasRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const compra = await prisma.compra.findUnique({ where: { id } });
    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    // Desvincular ventas que apuntan a este lote
    await prisma.venta.updateMany({
      where: { compra_id: id },
      data: { compra_id: null },
    });

    // Limpieza tiene onDelete: Cascade en Prisma
    await prisma.compra.delete({ where: { id } });
    res.json({ message: 'Compra eliminada' });
  } catch (error: any) {
    console.error('Error al eliminar compra:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar la compra' });
  }
});

