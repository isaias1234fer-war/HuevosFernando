import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import { sugerirLoteFIFO } from '../services/lotes';

export const ventasRouter = Router();

// Equivalencias de unidades en términos de jabas
// 1 jaba = 360 huevos = 12 celdas = 2 paquetes
function convertirAJabas(cantidad: number, unidad: string): number {
  switch (unidad) {
    case 'jabas':   return cantidad;
    case 'paquetes': return cantidad / 2;       // 1 paquete = 0.5 jabas (180 huevos)
    case 'celdas':   return cantidad / 12;      // 1 celda   = 1/12 jaba (30 huevos)
    case 'unidades': return cantidad / 360;     // 1 unidad  = 1/360 jaba
    default:         return cantidad;
  }
}

ventasRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      fecha,
      calidad_id,
      unidad_medida = 'jabas',
      cantidad_unidades,
      precio_por_jaba,
      notas,
      tipo_pago,
      cliente,
      compra_id,
    } = req.body;

    if (!calidad_id || !cantidad_unidades || !precio_por_jaba) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Convertir la cantidad de la unidad indicada a jabas para stock
    const cantidad_jabas = convertirAJabas(Number(cantidad_unidades), unidad_medida);
    const total = cantidad_jabas * Number(precio_por_jaba);
    const isFiado = tipo_pago === 'fiado';

    let loteId = compra_id ? parseInt(compra_id) : null;
    if (!loteId) {
      loteId = await sugerirLoteFIFO(parseInt(calidad_id));
    }

    const venta = await prisma.venta.create({
      data: {
        fecha: fecha ? new Date(fecha) : new Date(),
        calidad_id: parseInt(calidad_id),
        unidad_medida,
        cantidad_unidades: Number(cantidad_unidades),
        cantidad_jabas,
        precio_por_jaba,
        total,
        notas,
        cliente: isFiado ? (cliente || null) : cliente || null,
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

// POST /api/ventas/lote — Venta con múltiples productos/calidades en una sola transacción
// Body: { fecha?, cliente?, tipo_pago, notas?, items: [{calidad_id, unidad_medida, cantidad_unidades, precio_por_jaba, compra_id?}] }
ventasRouter.post('/lote', async (req: AuthRequest, res: Response) => {
  try {
    const { fecha, cliente, tipo_pago, notas, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos un producto' });
    }

    const isFiado = tipo_pago === 'fiado';
    const fechaVenta = fecha ? new Date(fecha) : new Date();
    const ventasCreadas: any[] = [];

    // Usar transacción de BD para atomicidad
    await prisma.$transaction(async (tx) => {
      let totalGlobal = 0;

      // Primero calcular todos los items
      const itemsProcesados = await Promise.all(items.map(async (item: any) => {
        const { calidad_id, unidad_medida = 'jabas', cantidad_unidades, precio_por_jaba, compra_id } = item;
        if (!calidad_id || !cantidad_unidades || !precio_por_jaba) {
          throw new Error(`Item inválido: faltan campos`);
        }
        const cantidad_jabas = convertirAJabas(Number(cantidad_unidades), unidad_medida);
        const subtotal = cantidad_jabas * Number(precio_por_jaba);
        totalGlobal += subtotal;

        let loteId = compra_id ? parseInt(compra_id) : null;
        if (!loteId) {
          loteId = await sugerirLoteFIFO(parseInt(calidad_id));
        }
        return { calidad_id, unidad_medida, cantidad_unidades, cantidad_jabas, precio_por_jaba, subtotal, loteId };
      }));

      // Crear una venta por cada línea de producto bajo la misma transacción
      for (const item of itemsProcesados) {
        const venta = await tx.venta.create({
          data: {
            fecha: fechaVenta,
            calidad_id: parseInt(item.calidad_id),
            unidad_medida: item.unidad_medida,
            cantidad_unidades: Number(item.cantidad_unidades),
            cantidad_jabas: item.cantidad_jabas,
            precio_por_jaba: item.precio_por_jaba,
            total: item.subtotal,
            notas,
            cliente: cliente || null,
            tipo_pago: isFiado ? 'fiado' : 'contado',
            estado_pago: isFiado ? 'pendiente' : 'pagado',
            saldo_pendiente: isFiado ? item.subtotal : 0,
            compra_id: item.loteId || undefined,
            pagos: isFiado ? undefined : {
              create: { monto: item.subtotal, fecha: fechaVenta, notas: 'Pago al contado' },
            },
          },
          include: { calidad: true, compra: true, pagos: true },
        });
        ventasCreadas.push(venta);
      }
    });

    res.status(201).json(ventasCreadas);
  } catch (error: any) {
    console.error('Error al crear venta múltiple:', error);
    res.status(500).json({ error: error.message || 'Error al registrar la venta' });
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

    await prisma.pago.deleteMany({ where: { venta_id: id } });
    await prisma.venta.delete({ where: { id } });

    res.json({ message: 'Venta eliminada con éxito' });
  } catch (error: any) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ error: error.message || 'Error al eliminar venta' });
  }
});
