import prisma from '../prisma';

export async function getInventario() {
  const config = await prisma.configuracion.findFirst();
  const huevosPorJaba = config?.huevos_por_jaba || 30;

  const calidades = await prisma.calidad.findMany();

  const inventario = [];

  for (const calidad of calidades) {
    const compras = await prisma.compra.findMany({
      where: { calidad_id: calidad.id },
      include: { limpieza: true },
    });

    let totalCompradas = 0;
    let totalRotas = 0;

    for (const c of compras) {
      totalCompradas += c.cantidad_jabas;
      if (c.limpieza) {
        totalRotas += Number(c.limpieza.jabas_rotas_equivalente);
      }
    }

    const ventasAgg = await prisma.venta.aggregate({
      where: { calidad_id: calidad.id },
      _sum: { cantidad_jabas: true },
    });
    const totalVendidas = ventasAgg._sum.cantidad_jabas || 0;

    const disponible = totalCompradas - totalRotas - totalVendidas;

    inventario.push({
      calidad_id: calidad.id,
      calidad_nombre: calidad.nombre,
      requiere_limpieza: calidad.requiere_limpieza,
      precio_venta_jaba: Number(calidad.precio_venta_jaba),
      total_compradas_jabas: totalCompradas,
      total_rotas_jabas: Number(totalRotas.toFixed(2)),
      total_vendidas_jabas: totalVendidas,
      disponible_jabas: disponible,
      huevos_por_jaba: huevosPorJaba,
    });
  }

  return inventario;
}

export async function getCostoRealPorJaba(compraId: number): Promise<number> {
  const compra = await prisma.compra.findUnique({
    where: { id: compraId },
    include: { limpieza: true },
  });

  if (!compra) return 0;

  const costoTotal = Number(compra.costo_total);
  let jabasNetas = compra.cantidad_jabas;

  if (compra.limpieza) {
    jabasNetas -= Number(compra.limpieza.jabas_rotas_equivalente);
  }

  if (jabasNetas <= 0) return 0;

  return costoTotal / jabasNetas;
}
