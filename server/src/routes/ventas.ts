import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import { sugerirLoteFIFO } from '../services/lotes';

export const ventasRouter = Router();

ventasRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { fecha, calidad_id, cantidad_jabas, precio_por_jaba, notas, tipo_pago, cliente, compra_id } = req.body;

    if (!calidad_id || !cantidad_jabas || !precio_por_jaba) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const total = Number(cantidad_jabas) * Number(precio_por_jaba);
    const isFiado = tipo_pago === 'fiado';

    let loteId = compra_id ? parseInt(compra_id) : null;
    if (!loteId) {
      loteId = await sugerirLoteFIFO(parseInt(calidad_id));
    }

    const venta = await prisma.venta.create({
      data: {
        fecha: fecha ? new Date(fecha) : new Date(),
        calidad_id: parseInt(calidad_id),
        cantidad_jabas: parseInt(cantidad_jabas),
        precio_por_jaba,
        total,
        notas,
        cliente: isFiado ? (cliente || null) : null,
        tipo_pago: isFiado ? 'fiado' : 'contado',
        estado_pago: isFiado ? 'pendiente' : 'pagado',
        saldo_pendiente: isFiado ? total : 0,
        compra_id: loteId || undefined,
        pagos: isFiado ? undefined : {
          create: { monto: total, fecha: fecha ? new Date(fecha) : new Date(), notas: 'Pago al contado' },
        },
      },
      include: { calidad: true, compra: true, pagos: true },
    });

    res.status(201).json(venta);
  } catch (error: any) {
    console.error('Error al crear venta:', error);
    res.status(500).json({ error: error.message || 'Error al crear la venta' });
  }
});

ventasRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { desde, hasta, calidad_id, estado_pago } = req.query;

    const where: any = {};
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde as string);
      if (hasta) where.fecha.lte = new Date((hasta as string) + 'T23:59:59.999Z');
    }
    if (calidad_id) where.calidad_id = parseInt(calidad_id as string);
    if (estado_pago) where.estado_pago = estado_pago as string;

    const ventas = await prisma.venta.findMany({
      where,
      include: { calidad: true, compra: true, pagos: { orderBy: { fecha: 'desc' } } },
      orderBy: { fecha: 'desc' },
    });

    res.json(ventas);
  } catch (error: any) {
    console.error('Error al listar ventas:', error);
    res.status(500).json({ error: error.message || 'Error al obtener ventas' });
  }
});

ventasRouter.get('/:id/pagos', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const venta = await prisma.venta.findUnique({ where: { id } });
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const pagos = await prisma.pago.findMany({
      where: { venta_id: id },
      orderBy: { fecha: 'desc' },
    });

    res.json(pagos);
  } catch (error: any) {
    console.error('Error al obtener pagos de venta:', error);
    res.status(500).json({ error: error.message || 'Error al obtener pagos' });
  }
});

ventasRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const venta = await prisma.venta.findUnique({ where: { id } });
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // Eliminar pagos asociados primero para evitar error de clave foránea
    await prisma.pago.deleteMany({ where: { venta_id: id } });
    await prisma.venta.delete({ where: { id } });

    res.json({ message: 'Venta eliminada con éxito' });
  } catch (error: any) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar venta' });
  }
});

