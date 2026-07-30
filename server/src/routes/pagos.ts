import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

export const pagosRouter = Router();

pagosRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { venta_id, fecha, monto, notas } = req.body;

  if (!venta_id || !monto) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const venta = await prisma.venta.findUnique({ where: { id: parseInt(venta_id) } });
  if (!venta) {
    return res.status(404).json({ error: 'Venta no encontrada' });
  }

  if (venta.tipo_pago !== 'fiado') {
    return res.status(400).json({ error: 'Solo ventas al fiado pueden recibir abonos' });
  }

  const montoNum = Number(monto);
  if (montoNum <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  }

  const saldoActual = Number(venta.saldo_pendiente);
  if (montoNum > saldoActual) {
    return res.status(400).json({ error: `El monto excede el saldo pendiente (${saldoActual.toFixed(2)})` });
  }

  const nuevoSaldo = saldoActual - montoNum;
  const nuevoEstado = nuevoSaldo === 0 ? 'pagado' : 'parcial';

  const [pago] = await prisma.$transaction([
    prisma.pago.create({
      data: {
        venta_id: parseInt(venta_id),
        fecha: fecha ? new Date(fecha) : new Date(),
        monto: montoNum,
        notas,
      },
    }),
    prisma.venta.update({
      where: { id: parseInt(venta_id) },
      data: {
        saldo_pendiente: nuevoSaldo,
        estado_pago: nuevoEstado,
      },
    }),
  ]);

  res.status(201).json({ pago, saldo_restante: nuevoSaldo, estado_pago: nuevoEstado });
});
