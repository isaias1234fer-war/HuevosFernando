import prisma from '../prisma';

export async function getLotes() {
  const config = await prisma.configuracion.findFirst();
  const huevosPorJaba = config?.huevos_por_jaba || 360;

  const compras = await prisma.compra.findMany({
    include: {
      calidad: true,
      limpiezas: true,
      ventas: { select: { cantidad_jabas: true } },
    },
    orderBy: { fecha: 'asc' },
  });

  const umbralPorVencer = 5; // Alert when 5 or fewer days remaining
  const lotes = [];
  const ahora = new Date();

  for (const c of compras) {
    // Definir días según estándares avícolas solicitados:
    // Primera calidad: 30 días desde la postura
    // Cuarta calidad / Huevo manchado: 21–30 días desde la postura
    const isPrimera = c.calidad.nombre.toLowerCase().includes('primera');
    const isCuarta = c.calidad.nombre.toLowerCase().includes('cuarta') || c.calidad.nombre.toLowerCase().includes('manchado');

    const diasMin = c.calidad.dias_conservacion_min || (isPrimera ? 30 : isCuarta ? 21 : 30);
    const diasMax = c.calidad.dias_conservacion_max || (isPrimera ? 30 : isCuarta ? 30 : 30);

    const jabasRotas = c.limpiezas.reduce((sum, l) => sum + Number(l.jabas_rotas_equivalente), 0);
    const jabasVendidas = c.ventas.reduce((sum, v) => sum + Number(v.cantidad_jabas), 0);
    const jabasRestantes = c.cantidad_jabas - jabasRotas - jabasVendidas;

    if (jabasRestantes <= 0) continue;

    // Tomar fecha de postura si existe, de lo contrario la fecha de compra
    const fechaBase = c.fecha_postura ? new Date(c.fecha_postura) : new Date(c.fecha);

    const fechaVenMin = new Date(fechaBase);
    fechaVenMin.setDate(fechaVenMin.getDate() + diasMin);

    const fechaVenMax = new Date(fechaBase);
    fechaVenMax.setDate(fechaVenMax.getDate() + diasMax);

    const msPorDia = 1000 * 60 * 60 * 24;
    const diasTranscurridos = Math.max(0, Math.floor((ahora.getTime() - fechaBase.getTime()) / msPorDia));
    const diasRestantesMin = Math.ceil((fechaVenMin.getTime() - ahora.getTime()) / msPorDia);
    const diasRestantesMax = Math.ceil((fechaVenMax.getTime() - ahora.getTime()) / msPorDia);
    const diasRestantesPromedio = Math.round((diasRestantesMin + diasRestantesMax) / 2);

    // Porcentaje de vida útil consumido
    const porcentajeVida = Math.min(100, Math.max(0, Math.round((diasTranscurridos / diasMax) * 100)));

    let estado: 'vencido' | 'por_vencer' | 'vigente';
    if (diasRestantesMax <= 0 || ahora > fechaVenMax) {
      estado = 'vencido';
    } else if (diasRestantesMin <= umbralPorVencer) {
      estado = 'por_vencer';
    } else {
      estado = 'vigente';
    }

    const huevosRestantes = Math.round(jabasRestantes * huevosPorJaba);

    lotes.push({
      compra_id: c.id,
      calidad_id: c.calidad_id,
      calidad_nombre: c.calidad.nombre,
      tipo_calidad: isPrimera ? 'primera' : isCuarta ? 'cuarta' : 'otra',
      fecha_compra: c.fecha,
      fecha_postura: fechaBase,
      jabas_compradas: c.cantidad_jabas,
      jabas_rotas: Number(jabasRotas.toFixed(4)),
      jabas_vendidas: Number(jabasVendidas.toFixed(4)),
      jabas_restantes: Number(jabasRestantes.toFixed(4)),
      huevos_restantes: huevosRestantes,
      huevos_por_jaba: huevosPorJaba,
      fecha_vencimiento_min: fechaVenMin,
      fecha_vencimiento_max: fechaVenMax,
      dias_conservacion_min: diasMin,
      dias_conservacion_max: diasMax,
      dias_transcurridos: diasTranscurridos,
      dias_restantes_min: diasRestantesMin,
      dias_restantes_max: diasRestantesMax,
      dias_restantes_promedio: diasRestantesPromedio,
      porcentaje_vida: porcentajeVida,
      estado,
    });
  }

  return lotes;
}

export async function getResumenVencimientos() {
  const lotes = await getLotes();

  const totalJabas = lotes.reduce((sum, l) => sum + l.jabas_restantes, 0);
  const totalHuevos = lotes.reduce((sum, l) => sum + l.huevos_restantes, 0);
  const jabasPorVencer = lotes.filter((l) => l.estado === 'por_vencer').reduce((sum, l) => sum + l.jabas_restantes, 0);
  const jabasVencidas = lotes.filter((l) => l.estado === 'vencido').reduce((sum, l) => sum + l.jabas_restantes, 0);
  const jabasFrescas = lotes.filter((l) => l.estado === 'vigente').reduce((sum, l) => sum + l.jabas_restantes, 0);

  // Agrupado por calidad
  const porCalidad = [
    {
      calidad_nombre: 'Primera Calidad',
      tipo: 'primera',
      norma_vencimiento: '30 días desde la postura',
      dias_estandar: 30,
      lotes: lotes.filter((l) => l.tipo_calidad === 'primera'),
    },
    {
      calidad_nombre: 'Cuarta Calidad (Huevo Manchado)',
      tipo: 'cuarta',
      norma_vencimiento: '21–30 días desde la postura',
      dias_estandar_min: 21,
      dias_estandar_max: 30,
      lotes: lotes.filter((l) => l.tipo_calidad === 'cuarta'),
    },
  ].map((cat) => {
    const lotesCat = cat.lotes;
    const jabasTotal = lotesCat.reduce((s, l) => s + l.jabas_restantes, 0);
    const huevosTotal = lotesCat.reduce((s, l) => s + l.huevos_restantes, 0);
    const jabasVencer = lotesCat.filter((l) => l.estado === 'por_vencer').reduce((s, l) => s + l.jabas_restantes, 0);
    const jabasVencidasCat = lotesCat.filter((l) => l.estado === 'vencido').reduce((s, l) => s + l.jabas_restantes, 0);
    const jabasFrescasCat = lotesCat.filter((l) => l.estado === 'vigente').reduce((s, l) => s + l.jabas_restantes, 0);

    const diasRestantesProm = lotesCat.length > 0
      ? Math.round(lotesCat.reduce((s, l) => s + l.dias_restantes_promedio, 0) / lotesCat.length)
      : 0;

    const minDias = lotesCat.length > 0 ? Math.min(...lotesCat.map((l) => l.dias_restantes_min)) : 0;
    const maxDias = lotesCat.length > 0 ? Math.max(...lotesCat.map((l) => l.dias_restantes_max)) : 0;

    let estadoSalud: 'optimo' | 'alerta' | 'critico' = 'optimo';
    if (jabasVencidasCat > 0) estadoSalud = 'critico';
    else if (jabasVencer > 0 || minDias <= 5) estadoSalud = 'alerta';

    return {
      calidad_nombre: cat.calidad_nombre,
      tipo: cat.tipo,
      norma_vencimiento: cat.norma_vencimiento,
      jabas_restantes: Number(jabasTotal.toFixed(2)),
      huevos_restantes: huevosTotal,
      jabas_por_vencer: Number(jabasVencer.toFixed(2)),
      jabas_vencidas: Number(jabasVencidasCat.toFixed(2)),
      jabas_frescas: Number(jabasFrescasCat.toFixed(2)),
      dias_restantes_promedio: diasRestantesProm,
      dias_restantes_min: minDias,
      dias_restantes_max: maxDias,
      estado_salud: estadoSalud,
      cantidad_lotes: lotesCat.length,
    };
  });

  return {
    total_jabas: Number(totalJabas.toFixed(2)),
    total_huevos: totalHuevos,
    jabas_por_vencer: Number(jabasPorVencer.toFixed(2)),
    jabas_vencidas: Number(jabasVencidas.toFixed(2)),
    jabas_frescas: Number(jabasFrescas.toFixed(2)),
    por_calidad: porCalidad,
    lotes,
  };
}

export async function sugerirLoteFIFO(calidadId: number): Promise<number | null> {
  const lotes = await getLotes();
  const disponibles = lotes.filter(
    (l) => l.calidad_id === calidadId && l.estado !== 'vencido' && l.jabas_restantes > 0
  );
  disponibles.sort((a, b) => new Date(a.fecha_postura).getTime() - new Date(b.fecha_postura).getTime());
  return disponibles.length > 0 ? disponibles[0].compra_id : null;
}
