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

  const gananciaPorCalidad = [];
  for (const venta of ventas) {
    const existing = gananciaPorCalidad.find(g => g.calidad_id === venta.calidad_id);
    if (existing) {
      existing.ingresos += Number(venta.total);
    } else {
      gananciaPorCalidad.push({
        calidad_id: venta.calidad_id,
        calidad_nombre: venta.calidad.nombre,
        ingresos: Number(venta.total),
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

  return {
    inversion_total: Number(inversionTotal.toFixed(2)),
    ingresos_totales: Number(ingresosTotales.toFixed(2)),
    ganancia_neta: Number(gananciaNeta.toFixed(2)),
    valor_merma: Number(valorMerma.toFixed(2)),
    ganancia_por_calidad: gananciaPorCalidad,
  };
}
