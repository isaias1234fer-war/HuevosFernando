import prisma from '../prisma';

export async function getInventario() {
  const config = await prisma.configuracion.findFirst();
  const huevosPorJaba = config?.huevos_por_jaba || 360;

  const calidades = await prisma.calidad.findMany();

  const inventario = [];

  for (const calidad of calidades) {
    const compras = await prisma.compra.findMany({
      where: { calidad_id: calidad.id },
      include: { limpiezas: true },
    });

    let totalCompradas = 0;
    let totalRotas = 0;
    let costoTotalAcumulado = 0;

    for (const c of compras) {
      totalCompradas += c.cantidad_jabas;
      const fleteCompra = Number(c.flete_por_jaba || 0) * c.cantidad_jabas;
      costoTotalAcumulado += Number(c.costo_total) + fleteCompra;

      if (c.limpiezas && c.limpiezas.length > 0) {
        for (const l of c.limpiezas) {
          totalRotas += Number(l.jabas_rotas_equivalente);
        }
      }
    }

    const ventas = await prisma.venta.findMany({
      where: { calidad_id: calidad.id },
      select: { cantidad_jabas: true },
    });
    const totalVendidas = ventas.reduce((acc, v) => acc + Number(v.cantidad_jabas), 0);

    const disponible = totalCompradas - totalRotas - totalVendidas;

    // Costo promedio ponderado por jaba
    const costoPromedioJaba = totalCompradas > 0 ? Number((costoTotalAcumulado / totalCompradas).toFixed(2)) : 0;

    // Margen avícola objetivo: oscila entre 8 a 10 soles de ganancia por jaba (360 huevos)
    const isPrimera = calidad.nombre.toLowerCase().includes('primera');
    const gananciaSugeridaJaba = isPrimera ? 10 : 8; // S/ 8 a 10 por jaba

    // Si no hay compras registradas, se usa el costo base estándar avícola (S/ 110 para primera calidad, S/ 62 para cuarta)
    const costoBaseReferencial = costoPromedioJaba > 0 
      ? costoPromedioJaba 
      : (isPrimera ? 110 : 62);

    const precioVentaSugerido = Number((costoBaseReferencial + gananciaSugeridaJaba).toFixed(2));
    const precioVentaFinal = Number(calidad.precio_venta_jaba) > 0 
      ? Number(calidad.precio_venta_jaba) 
      : precioVentaSugerido;

    inventario.push({
      calidad_id: calidad.id,
      calidad_nombre: calidad.nombre,
      requiere_limpieza: calidad.requiere_limpieza,
      precio_venta_jaba: precioVentaFinal,
      costo_promedio_jaba: costoPromedioJaba > 0 ? costoPromedioJaba : costoBaseReferencial,
      ganancia_sugerida_jaba: gananciaSugeridaJaba,
      precio_venta_sugerido: precioVentaSugerido,
      total_compradas_jabas: totalCompradas,
      total_rotas_jabas: Number(totalRotas.toFixed(2)),
      total_vendidas_jabas: Number(totalVendidas.toFixed(2)),
      disponible_jabas: Number(disponible.toFixed(2)),
      huevos_por_jaba: huevosPorJaba,
    });
  }

  return inventario;
}

export async function getCostoRealPorJaba(compraId: number): Promise<number> {
  const compra = await prisma.compra.findUnique({
    where: { id: compraId },
    include: { limpiezas: true },
  });

  if (!compra) return 0;

  const costoTotal = Number(compra.costo_total);
  let jabasNetas = compra.cantidad_jabas;

  if (compra.limpiezas && compra.limpiezas.length > 0) {
    const totalRotas = compra.limpiezas.reduce((acc, l) => acc + Number(l.jabas_rotas_equivalente), 0);
    jabasNetas -= totalRotas;
  }

  if (jabasNetas <= 0) return 0;

  return costoTotal / jabasNetas;
}
