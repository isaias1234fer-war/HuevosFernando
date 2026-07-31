import prisma from '../prisma';
import { getCostoRealPorJaba } from './inventario';

export async function getResumen(desde?: string, hasta?: string) {
  const dateFilter: any = {};
  if (desde) dateFilter.gte = new Date(desde);
  if (hasta) dateFilter.lte = new Date(hasta + 'T23:59:59.999Z');

  const where = Object.keys(dateFilter).length ? { fecha: dateFilter } : {};

  const compras = await prisma.compra.findMany({ where, include: { calidad: true, limpieza: true } });
  const ventas = await prisma.venta.findMany({ where, include: { calidad: true } });

  const inversionTotal = compras.reduce((sum, c) => sum + Number(c.costo_total), 0);
  const ingresosTotales = ventas.reduce((sum, v) => sum + Number(v.total), 0);
  const gananciaNeta = ingresosTotales - inversionTotal;

  let valorMerma = 0;
  for (const c of compras) {
    if (c.limpieza && Number(c.limpieza.jabas_rotas_equivalente) > 0) {
      const costoReal = await getCostoRealPorJaba(c.id);
      valorMerma += Number(c.limpieza.jabas_rotas_equivalente) * costoReal;
    }
  }

  const gananciaPorCalidad: { calidad_id: number; calidad_nombre: string; ingresos: number; inversion: number; ganancia: number }[] = [];
  for (const venta of ventas) {
    const existing = gananciaPorCalidad.find(g => g.calidad_id === venta.calidad_id);
    if (existing) {
      existing.ingresos += Number(venta.total);
    } else {
      gananciaPorCalidad.push({
        calidad_id: venta.calidad_id,
        calidad_nombre: venta.calidad.nombre,
        ingresos: Number(venta.total),
        inversion: 0,
        ganancia: 0,
      });
    }
  }

  const gastosPorCalidad: Record<number, number> = {};
  for (const c of compras) {
    gastosPorCalidad[c.calidad_id] = (gastosPorCalidad[c.calidad_id] || 0) + Number(c.costo_total);
  }

  for (const g of gananciaPorCalidad) {
    const gasto = gastosPorCalidad[g.calidad_id] || 0;
    const ventasCalidad = ventas.filter(v => v.calidad_id === g.calidad_id);
    const proporcion = ventasCalidad.length > 0 ? ventasCalidad.reduce((s, v) => s + Number(v.total), 0) / ingresosTotales : 0;
    g.inversion = Number((gasto * proporcion).toFixed(2));
    g.ganancia = Number((g.ingresos - g.inversion).toFixed(2));
  }

  const pagosAgg = await prisma.pago.aggregate({
    where: { venta: where },
    _sum: { monto: true },
  });
  const ingresosCobrados = Number(pagosAgg._sum.monto || 0);

  const ventasFiadoNoPagadas = await prisma.venta.aggregate({
    where: { ...where, tipo_pago: 'fiado', estado_pago: { not: 'pagado' } },
    _sum: { saldo_pendiente: true },
  });
  const cuentasPorCobrar = Number(ventasFiadoNoPagadas._sum.saldo_pendiente || 0);

  return {
    inversion_total: Number(inversionTotal.toFixed(2)),
    ingresos_totales: Number(ingresosTotales.toFixed(2)),
    ingresos_cobrados: Number(ingresosCobrados.toFixed(2)),
    cuentas_por_cobrar: Number(cuentasPorCobrar.toFixed(2)),
    ganancia_neta: Number(gananciaNeta.toFixed(2)),
    valor_merma: Number(valorMerma.toFixed(2)),
    ganancia_por_calidad: gananciaPorCalidad,
  };
}
