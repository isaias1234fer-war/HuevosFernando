import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

export const limpiezasRouter = Router();

limpiezasRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { compra_id, fecha, huevos_rotos, observaciones } = req.body;

    if (!compra_id || huevos_rotos === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const compra = await prisma.compra.findUnique({
      where: { id: parseInt(compra_id) },
      include: { calidad: true },
    });

    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    if (!compra.calidad.requiere_limpieza) {
      return res.status(400).json({ error: 'Esta calidad no requiere limpieza' });
    }

    const config = await prisma.configuracion.findFirst();
    const huevosPorJaba = config?.huevos_por_jaba || 360;

    const jabas_rotas_equivalente = Number(huevos_rotos) / huevosPorJaba;

    const limpieza = await prisma.limpieza.create({
      data: {
        compra_id: parseInt(compra_id),
        fecha: fecha ? new Date(fecha) : new Date(),
        huevos_rotos: parseInt(huevos_rotos),
        jabas_rotas_equivalente,
        observaciones,
      },
      include: { compra: { include: { calidad: true } } },
    });

    res.status(201).json(limpieza);
  } catch (error: any) {
    console.error('Error al registrar merma de limpieza:', error);
    res.status(500).json({ error: error.message || 'Error al registrar limpieza' });
  }
});

limpiezasRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { desde, hasta, compra_id } = req.query;

    const where: any = {};
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde as string);
      if (hasta) where.fecha.lte = new Date((hasta as string) + 'T23:59:59.999Z');
    }
    if (compra_id) {
      where.compra_id = parseInt(compra_id as string);
    }

    const limpiezas = await prisma.limpieza.findMany({
      where,
      include: { compra: { include: { calidad: true } } },
      orderBy: { fecha: 'desc' },
    });

    res.json(limpiezas);
  } catch (error: any) {
    console.error('Error al listar limpiezas:', error);
    res.status(500).json({ error: error.message || 'Error al listar limpiezas' });
  }
});

limpiezasRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.limpieza.delete({ where: { id } });
    res.json({ message: 'Registro de merma eliminado' });
  } catch (error: any) {
    console.error('Error al eliminar limpieza:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar limpieza' });
  }
});
