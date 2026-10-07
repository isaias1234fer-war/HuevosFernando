import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import { getInventario } from '../services/inventario';
import { notifyAdminNewOrder } from '../services/notifications';

export const pedidosRouter = Router();

function convertirAJabas(cantidad: number, unidad: string): number {
  switch (unidad) {
    case 'jabas':
      return cantidad;
    case 'paquetes':
      return cantidad / 2;
    case 'celdas':
      return cantidad / 12;
    default:
      return cantidad;
  }
}

function calcularPrecioUnitario(precioVentaJaba: number, unidad: string): number {
  switch (unidad) {
    case 'jabas':
      return precioVentaJaba;
    case 'paquetes':
      return Number((precioVentaJaba / 2).toFixed(2));
    case 'celdas':
      return Number((precioVentaJaba / 12).toFixed(2));
    default:
      return precioVentaJaba;
  }
}

// POST /api/pedidos - Crear un nuevo pedido con validación de stock y horario estricto
pedidosRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Debe iniciar sesión para realizar un pedido' });
    }

    const { hora_entrega, direccion_entrega, telefono_contacto, notas, items } = req.body;

    if (!direccion_entrega || !direccion_entrega.trim()) {
      return res.status(400).json({ error: 'La dirección de entrega es obligatoria' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos un producto' });
    }

    // --- REGLA ESTRICTA DE HORARIO: Entre 30 y 90 minutos desde la hora actual ---
    if (!hora_entrega) {
      return res.status(400).json({ error: 'Debe programar la hora de entrega' });
    }

    const now = new Date();
    const horaEntrega = new Date(hora_entrega);

    if (isNaN(horaEntrega.getTime())) {
      return res.status(400).json({ error: 'Formato de hora de entrega inválido' });
    }

    const diffMinutes = (horaEntrega.getTime() - now.getTime()) / (1000 * 60);

    // Margen de 0.5 minutos para tolerancia de reloj de red
    if (diffMinutes < 29.5 || diffMinutes > 90.5) {
      return res.status(400).json({
        error: `Horario no permitido: La entrega debe programarse entre 30 y 90 minutos a partir de este momento. (Tiempo seleccionado: ${Math.round(diffMinutes)} minutos)`,
      });
    }

    // --- VALIDACIÓN DE STOCK REAL EN INVENTARIO ---
    const inventario = await getInventario();
    const inventarioMap = new Map<number, { disponible_jabas: number; calidad_nombre: string; precio_venta_jaba: number }>();

    for (const inv of inventario) {
      inventarioMap.set(inv.calidad_id, {
        disponible_jabas: inv.disponible_jabas,
        calidad_nombre: inv.calidad_nombre,
        precio_venta_jaba: inv.precio_venta_jaba,
      });
    }

    // Obtener detalles de calidades desde BD
    const calidades = await prisma.calidad.findMany();
    const calidadesMap = new Map<number, any>(calidades.map((c) => [c.id, c]));

    let totalPedido = 0;
    let totalJabasAcumulado = 0;
    const itemsProcesados: {
      calidad_id: number;
      calidad_nombre: string;
      unidad_medida: string;
      cantidad_unidades: number;
      cantidad_jabas: number;
      precio_unitario: number;
      subtotal: number;
    }[] = [];

    // Agrupar demandas por calidad para verificar stock conjunto
    const demandaPorCalidad = new Map<number, number>();

    for (const item of items) {
      const calidadId = parseInt(item.calidad_id);
      const cantidad = Number(item.cantidad_unidades);
      const unidad = item.unidad_medida || 'jabas';

      if (!calidadId || isNaN(cantidad) || cantidad <= 0) {
        return res.status(400).json({ error: 'Datos de producto inválidos en el pedido' });
      }

      const infoCalidad = calidadesMap.get(calidadId);
      if (!infoCalidad) {
        return res.status(404).json({ error: `Calidad con ID ${calidadId} no encontrada` });
      }

      const jabasRequeridas = convertirAJabas(cantidad, unidad);
      const acum = (demandaPorCalidad.get(calidadId) || 0) + jabasRequeridas;
      demandaPorCalidad.set(calidadId, acum);

      const invItem = inventarioMap.get(calidadId);
      const stockDisponible = invItem ? invItem.disponible_jabas : 0;

      if (acum > stockDisponible) {
        return res.status(400).json({
          error: `Stock insuficiente para "${infoCalidad.nombre}". Disponible: ${stockDisponible} jabas, solicitado: ${acum.toFixed(2)} jabas.`,
        });
      }

      const precioUnit = calcularPrecioUnitario(Number(infoCalidad.precio_venta_jaba), unidad);
      const subtotal = Number((precioUnit * cantidad).toFixed(2));

      totalPedido += subtotal;
      totalJabasAcumulado += jabasRequeridas;

      itemsProcesados.push({
        calidad_id: calidadId,
        calidad_nombre: infoCalidad.nombre,
        unidad_medida: unidad,
        cantidad_unidades: cantidad,
        cantidad_jabas: Number(jabasRequeridas.toFixed(4)),
        precio_unitario: precioUnit,
        subtotal,
      });
    }

    // Datos del usuario
    let clienteNombre = req.userName || 'Cliente';
    let clienteTel = telefono_contacto;

    if (req.userRole !== 'admin') {
      const user = await prisma.usuario.findUnique({ where: { id: userId } });
      if (user) {
        clienteNombre = user.nombre;
        clienteTel = telefono_contacto || user.telefono;
      }
    }

    // Transacción para guardar el Pedido y sus DetallePedido
    const nuevoPedido = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.create({
        data: {
          usuario_id: userId,
          fecha_pedido: now,
          hora_entrega: horaEntrega,
          direccion_entrega: direccion_entrega.trim(),
          telefono_contacto: clienteTel ? clienteTel.trim() : null,
          notas: notas ? notas.trim() : null,
          estado: 'pendiente',
          total: Number(totalPedido.toFixed(2)),
          items: {
            create: itemsProcesados.map((item) => ({
              calidad_id: item.calidad_id,
              unidad_medida: item.unidad_medida,
              cantidad_unidades: item.cantidad_unidades,
              cantidad_jabas: item.cantidad_jabas,
              precio_unitario: item.precio_unitario,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: { include: { calidad: true } },
          usuario: { select: { id: true, nombre: true, email: true, telefono: true } },
        },
      });

      return pedido;
    });

    // Formatear hora exacta en texto legible
    const horaTexto = horaEntrega.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const fechaTexto = horaEntrega.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const horaEntregaCompleta = `${horaTexto} (del ${fechaTexto})`;

    // Despachar notificación automática al Administrador
    const notificacion = await notifyAdminNewOrder({
      pedidoId: nuevoPedido.id,
      clienteNombre,
      clienteTelefono: clienteTel,
      direccionEntrega: direccion_entrega.trim(),
      horaEntregaExacta: horaEntregaCompleta,
      fechaPedido: now.toISOString(),
      items: itemsProcesados.map((i) => ({
        calidadNombre: i.calidad_nombre,
        unidadMedida: i.unidad_medida,
        cantidadUnidades: i.cantidad_unidades,
        subtotal: i.subtotal,
      })),
      totalCantidadJabas: totalJabasAcumulado,
      totalPrecio: totalPedido,
      notas: notas ? notas.trim() : null,
    });

    res.status(201).json({
      message: 'Pedido realizado con éxito',
      pedido: nuevoPedido,
      notificacion,
    });
  } catch (error: any) {
    console.error('Error al registrar pedido:', error);
    res.status(500).json({ error: error.message || 'Error al procesar el pedido' });
  }
});

// GET /api/pedidos - Listar pedidos según el rol
pedidosRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const where: any = {};
    if (userRole !== 'admin') {
      where.usuario_id = userId;
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        items: {
          include: { calidad: true },
        },
        usuario: {
          select: { id: true, nombre: true, email: true, telefono: true },
        },
      },
      orderBy: { fecha_pedido: 'desc' },
    });

    res.json(pedidos);
  } catch (error: any) {
    console.error('Error al listar pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// PATCH /api/pedidos/:id/estado - Actualizar estado de pedido (Admin)
pedidosRouter.patch('/:id/estado', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'confirmado', 'en_camino', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado de pedido no válido' });
    }

    const pedidoActualizado = await prisma.pedido.update({
      where: { id },
      data: { estado },
      include: {
        items: { include: { calidad: true } },
        usuario: { select: { id: true, nombre: true, email: true, telefono: true } },
      },
    });

    res.json(pedidoActualizado);
  } catch (error: any) {
    console.error('Error al actualizar estado de pedido:', error);
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
});
