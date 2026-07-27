import prisma from './prisma';

async function seed() {
  console.log('Seeding database...');

  const calidades = [
    { nombre: 'Primera calidad', requiere_limpieza: false, precio_venta_jaba: 120 },
    { nombre: 'Cuarta calidad', requiere_limpieza: true, precio_venta_jaba: 70 },
  ];

  for (const c of calidades) {
    await prisma.calidad.upsert({
      where: { nombre: c.nombre },
      update: c,
      create: c,
    });
  }

  await prisma.configuracion.upsert({
    where: { id: 1 },
    update: { huevos_por_jaba: 30 },
    create: { huevos_por_jaba: 30 },
  });

  console.log('Seed completed');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
