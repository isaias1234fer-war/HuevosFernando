import prisma from '../prisma';

export async function getLotes() {
  const config = await prisma.configuracion.findFirst();
  const huevosPorJaba = config?.huevos_por_jaba || 30;

  const compras = await prisma.compra.findMany({
    include: {
      calidad: true,
      limpieza: true,
      ventas: { select: { cantidad_jabas: true } },
    },
    orderBy: { fecha: 'asc' },
  });

  const umbralPorVencer = 3;

  const lotes = [];

  for (const c of compras) {
    if (!c.calidad.dias_conservacion_min || !c.calidad.dias_conservacion_max) continue;

    const jabasRotas = c.limpieza ? Number(c.limpieza.jabas_rotas_equivalente) : 0;
    const jabasVendidas = c.ventas.reduce((sum, v) => sum + v.cantidad_jabas, 0);
    const jabasRestantes = c.cantidad_jabas - jabasRotas - jabasVendidas;

    if (jabasRestantes <= 0) continue;

    const fechaCompra = new Date(c.fecha);
    const fechaVenMin = new Date(fechaCompra);
    fechaVenMin.setDate(fechaVenMin.getDate() + c.calidad.dias_conservacion_min);
    const fechaVenMax = new Date(fechaCompra);
    fechaVenMax.setDate(fechaVenMax.getDate() + c.calidad.dias_conservacion_max);

    const ahora = new Date();
    let estado: string;
    if (ahora > fechaVenMax) {
      estado = 'vencido';
    } else if (ahora >= new Date(fechaVenMin.getTime() - umbralPorVencer * 24 * 60 * 60 * 1000)) {
      estado = 'por_vencer';
    } else {
      estado = 'vigente';
    }

    lotes.push({
      compra_id: c.id,
      calidad_id: c.calidad_id,
      calidad_nombre: c.calidad.nombre,
      fecha_compra: c.fecha,
      jabas_compradas: c.cantidad_jabas,
      jabas_rotas: Number(jabasRotas.toFixed(2)),
      jabas_vendidas: jabasVendidas,
      jabas_restantes: jabasRestantes,
      fecha_vencimiento_min: fechaVenMin,
      fecha_vencimiento_max: fechaVenMax,
      estado,
      dias_conservacion_min: c.calidad.dias_conservacion_min,
      dias_conservacion_max: c.calidad.dias_conservacion_max,
      huevos_por_jaba: huevosPorJaba,
    });
  }

  return lotes;
}

export async function sugerirLoteFIFO(calidadId: number): Promise<number | null> {
  const lotes = await getLotes();
  const disponibles = lotes.filter(
    (l) => l.calidad_id === calidadId && l.estado !== 'vencido' && l.jabas_restantes > 0
  );
  disponibles.sort((a, b) => new Date(a.fecha_compra).getTime() - new Date(b.fecha_compra).getTime());
  return disponibles.length > 0 ? disponibles[0].compra_id : null;
}
